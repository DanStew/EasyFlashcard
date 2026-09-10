import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPromptTemplates(server: McpServer): void {
  // 1. quiz_me: Socratic dynamic quiz master
  server.prompt(
    'quiz_me',
    'Interactive Socratic quiz master prompt. Loads flashcards for a specific set and conducts an adaptive, conversational revision quiz.',
    {
      set_id: z.string().describe('ID of the flashcard set to be quizzed on.'),
      question_count: z
        .string()
        .optional()
        .describe('Number of questions to ask (e.g. "5" or "10", default: "5").'),
      difficulty: z
        .string()
        .optional()
        .describe('Quiz style: "conceptual", "recall", or "application" (default: "conceptual").'),
    },
    (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please act as my interactive study tutor and quiz master for EasyFlashcard set "${args.set_id}".

Follow these steps:
1. Use the "get_set" tool with set_id="${args.set_id}" and include_cards=true to load the full deck.
2. Formulate ${args.question_count || '5'} ${args.difficulty || 'conceptual'} quiz questions based on the terms and definitions in the set.
3. Present Question 1 to me now. DO NOT reveal the answer yet.
4. Wait for my response.
5. When I answer, evaluate my conceptual understanding flexibly (giving positive feedback, correcting misconceptions, and explaining the reasoning without requiring rigid word-for-word memorization).
6. Then proceed to the next question one by one until all questions are completed, concluding with a helpful summary of strong areas and topics to review.`,
          },
        },
      ],
    })
  );

  // 2. generate_deck_from_document: Document to flashcards workflow
  server.prompt(
    'generate_deck_from_document',
    'Generates an exhaustive, high-detail flashcard deck from a Google Drive document or notes and saves it to EasyFlashcard.',
    {
      document_name: z.string().describe('Name of the document or topic to extract flashcards from.'),
      target_set_name: z.string().describe('Name for the new flashcard set to create.'),
      folder_id: z.string().optional().describe('Optional target folder ID in EasyFlashcard.'),
    },
    (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I want to create an exhaustive, high-detail flashcard set named "${args.target_set_name}" from the study material "${args.document_name}".

Please follow this process:
1. If the document is stored in Google Drive, use the Google Drive MCP tools (such as search or read) to find and thoroughly inspect the document content.
2. Extract all core concepts, definitions, formulas (in LaTeX math $...$ / $$...$$), theorems, mechanisms, and key nuances without leaving out important technical details.
3. Use the EasyFlashcard MCP "create_set" tool to create the set named "${args.target_set_name}"${args.folder_id ? ` inside folder "${args.folder_id}"` : ''}.
4. Use the "batch_add_flashcards" tool to add the extracted cards in sequential order, attaching source file and page references wherever possible.
5. Report the final set ID and a summary of the cards created.`,
          },
        },
      ],
    })
  );

  // 3. review_deck: Quality and coverage assessment
  server.prompt(
    'review_deck',
    'Reviews an existing flashcard deck for clarity, gaps, technical accuracy, and formatting.',
    {
      set_id: z.string().describe('ID of the flashcard set to review and improve.'),
    },
    (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please review my flashcard set "${args.set_id}".

1. Use "get_set" (with include_cards=true) to retrieve all cards.
2. Analyze the deck for:
   - Ambiguity or overly complex card faces that should be split into atomic concepts.
   - Missing core concepts or logical gaps.
   - LaTeX mathematical expression formatting or syntax improvements.
3. Present your findings and suggest specific improvements or new flashcards that can be added.`,
          },
        },
      ],
    })
  );
}
