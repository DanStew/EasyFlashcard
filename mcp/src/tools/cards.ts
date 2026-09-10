import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { EasyFlashcardApiClient } from '../client/apiClient.js';

const CardFaceSchema = z.object({
  text: z.string().min(1).describe('Text content of the card face (supports Markdown and LaTeX math like $E=mc^2$).'),
  imageUrl: z.string().optional().describe('Optional URL for accompanying diagram or image.'),
  imageAlt: z.string().optional().describe('Optional alt description for accessibility and indexing.'),
});

const DocumentReferenceSchema = z.object({
  documentId: z.string().describe('ID of the source document in Google Drive / EasyFlashcard.'),
  documentName: z.string().describe('Filename of the source document (e.g. "Lecture_03_Genetics.pdf").'),
  pageNumber: z.number().int().min(1).describe('1-indexed page or slide number where this fact appears.'),
  groundingEvidence: z.string().optional().describe('Verbatim quote or excerpt proving this card is grounded in the document.'),
});

export function registerCardTools(server: McpServer, client: EasyFlashcardApiClient): void {
  // 1. List Flashcards in Set
  server.tool(
    'list_flashcards',
    'List all flashcards in a specific set in sequential order.',
    {
      set_id: z.string().describe('Unique ID of the parent flashcard set.'),
    },
    async ({ set_id }) => {
      const cards = await client.listCards(set_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(cards, null, 2),
          },
        ],
      };
    }
  );

  // 2. Get Flashcard by ID
  server.tool(
    'get_flashcard',
    'Retrieve full details of a single flashcard by its ID.',
    {
      card_id: z.string().describe('Unique ID of the flashcard.'),
    },
    async ({ card_id }) => {
      const card = await client.getCard(card_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(card, null, 2),
          },
        ],
      };
    }
  );

  // 3. Batch Add Flashcards
  server.tool(
    'batch_add_flashcards',
    'Batch add multiple flashcards to a set in a single operation. Supports Markdown, LaTeX math ($...$ / $$...$$), and optional source document citations.',
    {
      set_id: z.string().describe('ID of the parent set to add flashcards to.'),
      cards: z
        .array(
          z.object({
            front: CardFaceSchema.describe('Front / Term / Question face of the flashcard.'),
            back: CardFaceSchema.describe('Back / Definition / Answer face of the flashcard.'),
            orderIndex: z.number().int().optional().describe('Optional custom order index.'),
            sourceReference: DocumentReferenceSchema.optional().describe('Optional citation linking to source file and page.'),
          })
        )
        .min(1)
        .describe('Array of flashcards to add to the set.'),
    },
    async ({ set_id, cards }) => {
      const createdCards = await client.createCardsBulk(set_id, {
        cards: cards.map((c) => ({
          front: c.front,
          back: c.back,
          orderIndex: c.orderIndex,
          sourceReference: c.sourceReference,
        })),
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully added ${createdCards.length} flashcard(s) to set ${set_id}.\n\n${JSON.stringify(
              createdCards,
              null,
              2
            )}`,
          },
        ],
      };
    }
  );

  // 4. Update Flashcard
  server.tool(
    'update_flashcard',
    'Update the front or back face, order index, or source citation of an existing flashcard.',
    {
      card_id: z.string().describe('ID of the flashcard to update.'),
      front: CardFaceSchema.optional().describe('Updated front face content.'),
      back: CardFaceSchema.optional().describe('Updated back face content.'),
      orderIndex: z.number().int().optional().describe('Updated sequential position.'),
      sourceReference: DocumentReferenceSchema.optional().describe('Updated source citation.'),
    },
    async ({ card_id, front, back, orderIndex, sourceReference }) => {
      const updatedCard = await client.updateCard(card_id, {
        front,
        back,
        orderIndex,
        sourceReference,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Successfully updated flashcard ${updatedCard.id}.\n\n${JSON.stringify(
              updatedCard,
              null,
              2
            )}`,
          },
        ],
      };
    }
  );

  // 5. Delete Flashcard
  server.tool(
    'delete_flashcard',
    'Delete a single flashcard from its set.',
    {
      card_id: z.string().describe('ID of the flashcard to delete.'),
    },
    async ({ card_id }) => {
      await client.deleteCard(card_id);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted flashcard ${card_id}.`,
          },
        ],
      };
    }
  );
}
