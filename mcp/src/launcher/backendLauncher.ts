import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let managedChildProcess: ChildProcess | null = null;

/**
 * Checks if the configured API URL points to localhost or 127.0.0.1.
 */
function isLocalhost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0' ||
      parsed.hostname === '::1'
    );
  } catch {
    return false;
  }
}

async function isBackendHealthy(apiUrl: string): Promise<boolean> {
  try {
    const healthUrl = `${apiUrl.replace(/\/+$/, '')}/api/v1/health`;
    const response = await axios.get(healthUrl, { timeout: 1000 });
    return (
      response.status === 200 &&
      (response.data?.status === 'healthy' ||
        response.data?.status === 'ok' ||
        Boolean(response.data?.app_name))
    );
  } catch {
    return false;
  }
}

/**
 * Resolves the absolute path to the backend directory.
 */
function findBackendDirectory(): string | null {
  const candidates = [
    path.resolve(__dirname, '../../../backend'),
    path.resolve(__dirname, '../../backend'),
    path.resolve(process.cwd(), 'backend'),
    path.resolve(process.cwd(), '../backend'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'pyproject.toml'))) {
      return dir;
    }
  }
  return null;
}

/**
 * Finds a suitable python or uvicorn executable inside the virtualenv or system.
 */
function resolvePythonExecutable(backendDir: string): { command: string; argsPrefix: string[] } {
  const isWindows = process.platform === 'win32';

  const venvPython = isWindows
    ? path.join(backendDir, '.venv', 'Scripts', 'python.exe')
    : path.join(backendDir, '.venv', 'bin', 'python');

  if (fs.existsSync(venvPython)) {
    return { command: venvPython, argsPrefix: ['-m', 'uvicorn', 'app.main:app'] };
  }

  const venvUvicorn = isWindows
    ? path.join(backendDir, '.venv', 'Scripts', 'uvicorn.exe')
    : path.join(backendDir, '.venv', 'bin', 'uvicorn');

  if (fs.existsSync(venvUvicorn)) {
    return { command: venvUvicorn, argsPrefix: ['app.main:app'] };
  }

  // Fallback to system python
  return { command: isWindows ? 'python' : 'python3', argsPrefix: ['-m', 'uvicorn', 'app.main:app'] };
}

/**
 * Cleanly terminates the managed child process.
 */
function stopManagedBackend(): void {
  if (managedChildProcess && !managedChildProcess.killed) {
    console.error('[MCP] Stopping managed local backend process...');
    try {
      if (process.platform === 'win32' && managedChildProcess.pid) {
        spawn('taskkill', ['/pid', managedChildProcess.pid.toString(), '/T', '/F'], {
          stdio: 'ignore',
        });
      } else {
        managedChildProcess.kill('SIGTERM');
      }
    } catch {
      // Ignore termination errors
    }
    managedChildProcess = null;
  }
}

/**
 * Ensures the backend is up and running before the MCP server accepts agent requests.
 * If running against localhost and not currently running, automatically spawns it.
 */
export async function ensureBackendRunning(apiUrl: string): Promise<void> {
  // If pointed to a remote/cloud URL (e.g. Cloud Run), do not attempt local spawning
  if (!isLocalhost(apiUrl)) {
    console.error(`[MCP] Configured for remote backend at ${apiUrl}. Skipping local process spawning.`);
    return;
  }

  // Check if backend is already running (e.g. via docker compose or separate terminal)
  if (await isBackendHealthy(apiUrl)) {
    console.error(`[MCP] Backend is already running and healthy at ${apiUrl}.`);
    return;
  }

  // Find backend directory
  const backendDir = findBackendDirectory();
  if (!backendDir) {
    console.error('[MCP Warning] Backend directory not found. Assuming backend will be started manually.');
    return;
  }

  const portMatch = apiUrl.match(/:(\d+)/);
  const port = portMatch ? portMatch[1] : '8000';

  const { command, argsPrefix } = resolvePythonExecutable(backendDir);
  const spawnArgs = [...argsPrefix, '--host', '127.0.0.1', '--port', port ?? '8000'];

  console.error(`[MCP] Auto-starting local FastAPI backend in ${backendDir}...`);
  console.error(`[MCP] Command: ${command} ${spawnArgs.join(' ')}`);

  const child = spawn(command, spawnArgs, {
    cwd: backendDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env },
  });

  managedChildProcess = child;

  // Pipe child output to stderr so stdout remains clean for MCP JSON-RPC protocol
  child.stdout?.on('data', (data: Buffer) => {
    const text = data.toString().trim();
    if (text) {
      console.error(`[Backend] ${text}`);
    }
  });

  child.stderr?.on('data', (data: Buffer) => {
    const text = data.toString().trim();
    if (text) {
      console.error(`[Backend] ${text}`);
    }
  });

  child.on('error', (err: Error) => {
    console.error('[MCP Error] Failed to launch backend process:', err);
  });

  child.on('exit', (code: number | null, signal: string | null) => {
    console.error(`[MCP] Backend process exited (code: ${code}, signal: ${signal}).`);
    managedChildProcess = null;
  });

  // Register shutdown handlers
  process.on('exit', stopManagedBackend);
  process.on('SIGINT', () => {
    stopManagedBackend();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    stopManagedBackend();
    process.exit(0);
  });

  // Poll until backend healthcheck passes (up to 15 seconds)
  const maxAttempts = 30;
  const intervalMs = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    if (await isBackendHealthy(apiUrl)) {
      console.error(`[MCP] Local FastAPI backend started successfully and is healthy (PID: ${child.pid}).`);
      return;
    }
  }

  console.error('[MCP Warning] Local backend did not report healthy within timeout. Continuing startup.');
}
