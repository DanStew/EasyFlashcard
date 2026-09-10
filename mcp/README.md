# EasyFlashcard MCP Server

Local Model Context Protocol (MCP) server for [EasyFlashcard](https://github.com/DanStew/EasyFlashcard).

Provides AI agents (Antigravity, Claude Desktop, Cursor, etc.) with direct tools and prompt templates to create, organize, search, and quiz against flashcards, sets, and nested folders.

---

## Features

- **Folder Management**: `list_folders`, `get_folder`, `create_folder`, `update_folder`, `delete_folder`
- **Set Management**: `list_sets`, `get_set` (with full cards in 1 call), `create_set`, `update_set`, `delete_set`
- **Flashcard Management**: `list_flashcards`, `get_flashcard`, `batch_add_flashcards` (Markdown + LaTeX + Document References), `update_flashcard`, `delete_flashcard`
- **Global Search**: `search_workspace` across sets and folders
- **Prompt Templates**:
  - `quiz_me`: Dynamic conversational Socratic tutor
  - `generate_deck_from_document`: High-detail document-to-flashcards workflow
  - `review_deck`: Flashcard quality and gap assessment
- **Automatic Backend Launcher**:
  - When pointed at `localhost`/`127.0.0.1`, the MCP server checks if the backend is already running.
  - If not running, it automatically spawns the FastAPI backend (`backend/.venv/Scripts/python.exe` or `uvicorn`) in the background and waits for healthy status.
  - When the MCP server or agent session exits, the spawned backend process is automatically and cleanly terminated.

---

## Configuration

### Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `EASYFLASHCARD_API_URL` | Base URL of the EasyFlashcard FastAPI backend | `http://127.0.0.1:8000` |
| `EASYFLASHCARD_USER_ID` | User ID for account isolation | `dev_user_123` |
| `EASYFLASHCARD_AUTH_TOKEN` | Optional Bearer token for production Firebase auth | `None` |

### Setting Up with Antigravity / Claude Desktop

Add the following to your `mcp_config.json` (or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "easyflashcard": {
      "command": "cmd.exe",
      "args": [
        "/c",
        "npx",
        "-y",
        "tsx",
        "c:\\Users\\<YourUsername>\\Local\\GitHub\\EasyFlashcard\\mcp\\src\\index.ts"
      ],
      "env": {
        "EASYFLASHCARD_API_URL": "http://127.0.0.1:8000",
        "EASYFLASHCARD_USER_ID": "your_user_id"
      }
    }
  }
}
```

---

## Building & Developing

```bash
cd mcp
npm install
npm run build
npm run dev
```
