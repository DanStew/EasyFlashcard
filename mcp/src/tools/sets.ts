import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { EasyFlashcardApiClient } from '../client/apiClient.js';

export function registerSetTools(server: McpServer, client: EasyFlashcardApiClient): void {
  // 1. List Sets
  server.tool(
    'list_sets',
    'List flashcard sets in the user workspace with summary information (card count, tags, description).',
    {
      folder_id: z
        .string()
        .optional()
        .describe('Filter sets contained in a specific folder ID.'),
      root_only: z
        .boolean()
        .optional()
        .describe('If true, returns only sets at the root workspace level.'),
      tag: z
        .string()
        .optional()
        .describe('Filter sets matching a specific tag.'),
      search: z
        .string()
        .optional()
        .describe('Search sets by name or description.'),
    },
    async (params) => {
      const sets = await client.listSets({
        folderId: params.folder_id,
        rootOnly: params.root_only,
        tag: params.tag,
        search: params.search,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(sets, null, 2),
          },
        ],
      };
    }
  );

  // 2. Get Set (with optional cards)
  server.tool(
    'get_set',
    'Get full details of a specific flashcard set, including all cards contained within it for easy studying or quiz generation.',
    {
      set_id: z.string().describe('Unique ID of the flashcard set.'),
      include_cards: z
        .boolean()
        .optional()
        .default(true)
        .describe('If true (default), returns all flashcards in the set alongside the set metadata.'),
    },
    async ({ set_id, include_cards }) => {
      if (include_cards !== false) {
        const setWithCards = await client.getSetWithCards(set_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(setWithCards, null, 2),
            },
          ],
        };
      }

      const setInfo = await client.getSet(set_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(setInfo, null, 2),
          },
        ],
      };
    }
  );

  // 3. Create Set
  server.tool(
    'create_set',
    'Create a new flashcard set within an optional folder.',
    {
      name: z.string().min(1).describe('Title of the flashcard set (e.g. "Photosynthesis & Cellular Respiration").'),
      folder_id: z
        .string()
        .optional()
        .describe('Optional ID of the folder to place this set inside. Leave empty for root workspace.'),
      description: z
        .string()
        .optional()
        .describe('Optional description or overview of the topics covered in this set.'),
      tags: z
        .array(z.string())
        .optional()
        .describe('Optional categorization tags (e.g. ["Biology", "ExamPrep"]).'),
    },
    async (params) => {
      const newSet = await client.createSet({
        name: params.name,
        folderId: params.folder_id ?? null,
        description: params.description ?? null,
        tags: params.tags ?? [],
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully created flashcard set "${newSet.name}" (ID: ${newSet.id}).\n\n${JSON.stringify(
              newSet,
              null,
              2
            )}`,
          },
        ],
      };
    }
  );

  // 4. Update Set
  server.tool(
    'update_set',
    'Update a flashcard set title, description, tags, or move it to a different folder.',
    {
      set_id: z.string().describe('ID of the flashcard set to update.'),
      name: z.string().optional().describe('New title for the set.'),
      folder_id: z
        .string()
        .optional()
        .describe('New folder ID to move this set into (or null/empty for root).'),
      description: z.string().optional().describe('New description for the set.'),
      tags: z.array(z.string()).optional().describe('New list of tags for the set.'),
    },
    async ({ set_id, name, folder_id, description, tags }) => {
      const updatedSet = await client.updateSet(set_id, {
        name,
        folderId: folder_id,
        description,
        tags,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully updated flashcard set "${updatedSet.name}" (ID: ${updatedSet.id}).\n\n${JSON.stringify(
              updatedSet,
              null,
              2
            )}`,
          },
        ],
      };
    }
  );

  // 5. Delete Set
  server.tool(
    'delete_set',
    'Delete a flashcard set and all cards contained within it.',
    {
      set_id: z.string().describe('ID of the flashcard set to delete.'),
    },
    async ({ set_id }) => {
      await client.deleteSet(set_id);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted flashcard set ${set_id} and all its cards.`,
          },
        ],
      };
    }
  );
}
