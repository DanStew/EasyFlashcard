import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { EasyFlashcardApiClient } from './client/apiClient.js';
import { registerFolderTools } from './tools/folders.js';
import { registerSetTools } from './tools/sets.js';
import { registerCardTools } from './tools/cards.js';
import { registerSearchTools } from './tools/search.js';
import { registerPromptTemplates } from './prompts/templates.js';

import { resolveConfig } from './config.js';
import { ensureBackendRunning } from './launcher/backendLauncher.js';

export async function runServer(): Promise<void> {
  const config = resolveConfig();

  // Ensure local backend is available before accepting agent requests
  await ensureBackendRunning(config.apiUrl);

  const server = new McpServer({
    name: 'easyflashcard-mcp-server',
    version: '0.1.0',
  });

  const client = new EasyFlashcardApiClient();

  // Register MCP Tools
  registerFolderTools(server, client);
  registerSetTools(server, client);
  registerCardTools(server, client);
  registerSearchTools(server, client);

  // Register MCP Prompt Templates
  registerPromptTemplates(server);

  // Connect stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Stderr is safe for diagnostic logs while stdout handles JSON-RPC
  console.error('EasyFlashcard MCP Server running successfully on stdio.');
}

runServer().catch((error) => {
  console.error('Fatal error in EasyFlashcard MCP Server:', error);
  process.exit(1);
});
