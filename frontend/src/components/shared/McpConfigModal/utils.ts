// ==============================================================================
// EasyFlashcard - MCP Config Modal Logic & Helpers
// ==============================================================================

import type { User } from 'firebase/auth';

/**
 * Returns the resolved active user identifier.
 */
export function getActiveUserId(currentUser: User | null): string {
  if (currentUser?.uid) {
    return currentUser.uid;
  }
  try {
    const stored = localStorage.getItem('easyflashcard_user_id');
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch {
    // Ignore localStorage access restrictions
  }
  return 'dev_user_123';
}

/**
 * Generates the Antigravity .agents/mcp_config.json configuration snippet.
 */
export function generateAntigravityConfigSnippet(userId: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        easyflashcard: {
          command: 'cmd.exe',
          args: [
            '/c',
            'npx',
            '-y',
            'tsx',
            'c:\\Users\\<YourUsername>\\Local\\GitHub\\EasyFlashcard\\mcp\\src\\index.ts',
          ],
          env: {
            EASYFLASHCARD_USER_ID: userId,
          },
        },
      },
    },
    null,
    2
  );
}

/**
 * Generates the Claude Desktop / Cursor configuration JSON snippet.
 */
export function generateClaudeDesktopConfigSnippet(userId: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        easyflashcard: {
          command: 'npx',
          args: [
            '-y',
            'tsx',
            '/path/to/EasyFlashcard/mcp/src/index.ts',
          ],
          env: {
            EASYFLASHCARD_USER_ID: userId,
          },
        },
      },
    },
    null,
    2
  );
}

/**
 * Generates an environment variable block.
 */
export function generateEnvSnippet(userId: string): string {
  return `# EasyFlashcard MCP Credentials\nEASYFLASHCARD_USER_ID=${userId}\nEASYFLASHCARD_API_URL=http://127.0.0.1:8000`;
}

/**
 * Downloads a local .easyflashcard-auth.json credentials file.
 */
export function downloadAuthJsonFile(userId: string): void {
  const data = JSON.stringify(
    {
      userId,
      apiUrl: 'http://127.0.0.1:8000',
    },
    null,
    2
  );

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '.easyflashcard-auth.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
