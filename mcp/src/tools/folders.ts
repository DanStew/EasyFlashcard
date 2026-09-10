import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { EasyFlashcardApiClient } from '../client/apiClient.js';

export function registerFolderTools(server: McpServer, client: EasyFlashcardApiClient): void {
  // 1. List Folders
  server.tool(
    'list_folders',
    'List folders in the user workspace. Supports filtering by parent folder or retrieving a full hierarchical tree.',
    {
      parent_id: z
        .string()
        .optional()
        .describe('Filter by immediate parent folder ID (leave empty for all or root folders).'),
      root_only: z
        .boolean()
        .optional()
        .describe('If true, returns only folders at the root level.'),
      as_tree: z
        .boolean()
        .optional()
        .describe('If true, returns the complete nested hierarchical tree structure of folders.'),
      search: z
        .string()
        .optional()
        .describe('Search folders by name or path keywords.'),
    },
    async (params) => {
      const folders = await client.listFolders({
        parentId: params.parent_id,
        rootOnly: params.root_only,
        asTree: params.as_tree,
        search: params.search,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(folders, null, 2),
          },
        ],
      };
    }
  );

  // 2. Get Folder
  server.tool(
    'get_folder',
    'Get full details of a specific folder by its ID.',
    {
      folder_id: z.string().describe('Unique ID of the folder to retrieve.'),
    },
    async ({ folder_id }) => {
      const folder = await client.getFolder(folder_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(folder, null, 2),
          },
        ],
      };
    }
  );

  // 3. Create Folder
  server.tool(
    'create_folder',
    'Create a new folder or subfolder for organizing flashcard sets.',
    {
      name: z.string().min(1).describe('Name of the new folder (e.g. "Biology 101" or "Cardiology").'),
      parent_id: z
        .string()
        .optional()
        .describe('Optional parent folder ID to nest this folder inside. Leave empty to create at root level.'),
    },
    async ({ name, parent_id }) => {
      const newFolder = await client.createFolder({
        name,
        parentId: parent_id ?? null,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully created folder "${newFolder.name}" (ID: ${newFolder.id}, Path: ${newFolder.path}).\n\n${JSON.stringify(
              newFolder,
              null,
              2
            )}`,
          },
        ],
      };
    }
  );

  // 4. Update Folder
  server.tool(
    'update_folder',
    'Rename a folder or move it to a different parent folder.',
    {
      folder_id: z.string().describe('ID of the folder to update.'),
      name: z.string().optional().describe('New name for the folder.'),
      parent_id: z
        .string()
        .optional()
        .describe('New parent folder ID (or null/empty to move to root level).'),
    },
    async ({ folder_id, name, parent_id }) => {
      const updatedFolder = await client.updateFolder(folder_id, {
        name,
        parentId: parent_id,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully updated folder "${updatedFolder.name}" (ID: ${updatedFolder.id}, Path: ${updatedFolder.path}).\n\n${JSON.stringify(
              updatedFolder,
              null,
              2
            )}`,
          },
        ],
      };
    }
  );

  // 5. Delete Folder
  server.tool(
    'delete_folder',
    'Delete a folder. By default, child subfolders and sets are moved up to parent. Set cascade=true to delete everything inside.',
    {
      folder_id: z.string().describe('ID of the folder to delete.'),
      cascade: z
        .boolean()
        .optional()
        .describe('If true, recursively deletes all subfolders, sets, and cards inside.'),
    },
    async ({ folder_id, cascade }) => {
      await client.deleteFolder(folder_id, cascade ?? false);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted folder ${folder_id} (cascade=${cascade ?? false}).`,
          },
        ],
      };
    }
  );
}
