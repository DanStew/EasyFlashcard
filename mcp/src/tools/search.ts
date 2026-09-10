import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { EasyFlashcardApiClient } from '../client/apiClient.js';

export function registerSearchTools(server: McpServer, client: EasyFlashcardApiClient): void {
  server.tool(
    'search_workspace',
    'Perform a global search across all folders and flashcard sets in the user workspace by keywords, subject, or topics.',
    {
      query: z.string().min(1).describe('Search term or topic (e.g. "Biology", "Mitosis", "Pharmacology").'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(20)
        .describe('Maximum number of matching items to return per category.'),
    },
    async ({ query, limit }) => {
      const result = await client.searchWorkspace(query, limit);
      return {
        content: [
          {
            type: 'text',
            text: `Found ${result.totalCount} matching item(s) across library for "${query}":\n\n${JSON.stringify(
              result,
              null,
              2
            )}`,
          },
        ],
      };
    }
  );
}
