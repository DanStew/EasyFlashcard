import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file if available
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface EasyFlashcardConfig {
  apiUrl: string;
  userId: string;
  authToken?: string;
}

/**
 * Attempts to load authentication details from local JSON config files
 * in the workspace root, .agents directory, or user home directory.
 */
export function loadLocalConfigFile(): Partial<EasyFlashcardConfig> {
  const possiblePaths = [
    'c:\\Users\\danie\\Local\\GitHub\\EasyFlashcard\\.easyflashcard-auth.json',
    'c:\\Users\\danie\\Local\\GitHub\\EasyFlashcard\\.agents\\mcp_config.json',
    path.resolve(__dirname, '../../.easyflashcard-auth.json'),
    path.resolve(__dirname, '../../../.easyflashcard-auth.json'),
    path.resolve(__dirname, '../../.agents/mcp_config.json'),
    path.resolve(__dirname, '../../../.agents/mcp_config.json'),
    path.join(process.cwd(), '.easyflashcard-auth.json'),
    path.join(process.cwd(), '../.easyflashcard-auth.json'),
    path.join(process.cwd(), '.agents/mcp_config.json'),
    path.join(process.cwd(), '../.agents/mcp_config.json'),
    path.join(os.homedir(), '.easyflashcard-auth.json'),
  ];

  for (const configPath of possiblePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(raw);

        // Handle direct auth file
        if (parsed.userId || parsed.user_id) {
          const uId = parsed.userId || parsed.user_id;
          if (uId && typeof uId === 'string' && uId.trim()) {
            return {
              apiUrl: parsed.apiUrl || parsed.api_url,
              userId: uId.trim(),
              authToken: parsed.authToken || parsed.auth_token || parsed.token,
            };
          }
        }

        // Handle mcp_config.json format
        if (parsed.mcpServers?.easyflashcard?.env?.EASYFLASHCARD_USER_ID) {
          const uId = parsed.mcpServers.easyflashcard.env.EASYFLASHCARD_USER_ID;
          if (uId && typeof uId === 'string' && uId.trim()) {
            return {
              apiUrl: parsed.mcpServers.easyflashcard.env.EASYFLASHCARD_API_URL,
              userId: uId.trim(),
              authToken: parsed.mcpServers.easyflashcard.env.EASYFLASHCARD_AUTH_TOKEN,
            };
          }
        }
      }
    } catch {
      // Ignore reading errors from optional fallback config files
    }
  }
  return {};
}

/**
 * Resolves the configuration dynamically.
 * Prioritizes local auth file / mcp_config.json so changes take effect immediately.
 */
export function resolveConfig(): EasyFlashcardConfig {
  const fileConfig = loadLocalConfigFile();

  const apiUrl =
    fileConfig.apiUrl ||
    process.env.EASYFLASHCARD_API_URL ||
    'http://127.0.0.1:8000';

  const userId =
    fileConfig.userId ||
    process.env.EASYFLASHCARD_USER_ID ||
    'dev_user_123';

  const authToken =
    fileConfig.authToken ||
    process.env.EASYFLASHCARD_AUTH_TOKEN;

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''), // strip trailing slashes
    userId: userId.trim(),
    authToken,
  };
}
