# EasyFlashcard Backend

FastAPI backend service for the EasyFlashcard application, managing folders, flashcard sets, manual flashcards, document references, and local study synchronization.

## Architecture

* **Framework**: FastAPI (Python 3.11+)
* **Package Manager**: `uv`
* **Data Access**: Repository Pattern supporting both thread-safe In-Memory storage (for instant zero-config testing & local development) and Google Cloud Firestore.
* **Typing & Validation**: Strict Pydantic v2 domain schemas and data transfer objects (DTOs).

## Directory Structure

```text
backend/
├── app/
│   ├── config.py              # Settings via pydantic-settings
│   ├── dependencies.py        # Dependency injection for repositories & services
│   ├── main.py                # FastAPI application initialization & middleware
│   ├── models/
│   │   ├── common.py          # Shared schemas, ID generators, timestamp mixins
│   │   ├── folder.py          # Folder domain model, tree structures, DTOs
│   │   ├── set.py             # Flashcard set domain model & DTOs
│   │   └── flashcard.py       # CardFace, DocumentReference & Flashcard DTOs
│   ├── repositories/
│   │   ├── base.py            # Abstract repository protocols
│   │   ├── memory_repo.py     # Thread-safe in-memory store
│   │   └── firestore_repo.py  # Google Firestore repository
│   ├── services/
│   │   ├── folder_service.py  # Folder hierarchy, materialized paths, cycle detection
│   │   ├── set_service.py     # Set management and filtering
│   │   └── flashcard_service.py # Card CRUD, order sequencing, set counter sync
│   └── routers/
│       ├── health.py          # Health check endpoint
│       ├── folders.py         # Folder REST endpoints (/api/v1/folders)
│       ├── sets.py            # Set REST endpoints (/api/v1/sets)
│       └── flashcards.py      # Flashcard REST endpoints (/api/v1/sets/{id}/cards, /api/v1/cards)
└── tests/                     # Pytest automated test suite
```

## Quick Start with `uv`

### 1. Install dependencies
```bash
cd backend
uv sync --extra dev
```

### 2. Run the Development Server
```bash
uv run uvicorn app.main:app --reload --port 8000
```
Interactive Swagger docs will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Run Tests
```bash
uv run pytest -v
```
