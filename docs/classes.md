# Data Models & Domain Classes

This document describes the core backend data models (FastAPI & Firestore) and client-side local storage models used throughout the EasyFlashcard application.

---

## 1. Document Management Models

### `Document`

Represents an uploaded source file (e.g., PDF, PPTX, Image) used for AI flashcard generation and in-app reference viewing.

| Attribute    | Type            | Description                                                       |
| :----------- | :-------------- | :---------------------------------------------------------------- |
| `id`         | `str`           | Unique document identifier (UUID / Firestore Document ID).        |
| `userId`     | `str`           | ID of the user who owns the document.                             |
| `fileName`   | `str`           | Original file name (e.g., `lecture_04_biology.pdf`).              |
| `fileType`   | `str`           | MIME type of the document (e.g., `application/pdf`, `image/png`). |
| `storageUrl` | `str`           | Google Cloud Storage URI where the raw document is stored.        |
| `pageCount`  | `Optional[int]` | Total number of pages/slides in the document.                     |
| `createdAt`  | `datetime`      | Timestamp when the document was uploaded.                         |

### `DocumentReference`

Provides citation metadata linking a specific flashcard back to its source document and page.

| Attribute      | Type  | Description                                         |
| :------------- | :---- | :-------------------------------------------------- |
| `documentId`   | `str` | Reference ID to the parent `Document`.              |
| `documentName` | `str` | Cached file name of the document for quick display. |
| `pageNumber`   | `int` | Exact 1-indexed page or slide number.               |

---

## 2. Flashcard Models

### `CardFace`

Represents one side of a flashcard (Term on the front, or Definition on the back).

| Attribute  | Type            | Description                                                                       |
| :--------- | :-------------- | :-------------------------------------------------------------------------------- |
| `text`     | `str`           | Text content of the card face (supports markdown and LaTeX formatting).           |
| `imageUrl` | `Optional[str]` | Google Cloud Storage URL for an optional accompanying image or extracted diagram. |
| `imageAlt` | `Optional[str]` | Alt description for accessibility and search indexing.                            |

### `Flashcard`

Represents a complete study card containing a front and back face, along with metadata and document references.

| Attribute         | Type                          | Description                                                |
| :---------------- | :---------------------------- | :--------------------------------------------------------- |
| `id`              | `str`                         | Unique flashcard identifier.                               |
| `setId`           | `str`                         | ID of the parent `Set` this card belongs to.               |
| `front`           | `CardFace`                    | Term side of the flashcard.                                |
| `back`            | `CardFace`                    | Definition side of the flashcard.                          |
| `orderIndex`      | `int`                         | Position/order of the card within its set.                 |
| `sourceReference` | `Optional[DocumentReference]` | Citation metadata linking to the source document and page. |
| `createdAt`       | `datetime`                    | Timestamp when the card was created.                       |
| `updatedAt`       | `datetime`                    | Timestamp when the card was last edited.                   |

---

## 3. Organization Models

### `Set`

Represents a collection of flashcards designed to be studied together.

| Attribute           | Type            | Description                                                        |
| :------------------ | :-------------- | :----------------------------------------------------------------- |
| `id`                | `str`           | Unique flashcard set identifier.                                   |
| `userId`            | `str`           | ID of the user who owns the set.                                   |
| `folderId`          | `Optional[str]` | ID of the parent `Folder` (null if in root workspace).             |
| `name`              | `str`           | Name/title of the set.                                             |
| `description`       | `Optional[str]` | Optional summary or description of the set contents.               |
| `cardCount`         | `int`           | Total count of flashcards in this set.                             |
| `tags`              | `List[str]`     | Categorization tags for filtering and search.                      |
| `sourceDocumentIds` | `List[str]`     | List of `Document` IDs used to generate or referenced by this set. |
| `createdAt`         | `datetime`      | Timestamp when the set was created.                                |
| `updatedAt`         | `datetime`      | Timestamp when the set was last modified.                          |

### `Folder`

A hierarchical organizational entity that can contain sets and nested subfolders.

| Attribute   | Type            | Description                                                                     |
| :---------- | :-------------- | :------------------------------------------------------------------------------ |
| `id`        | `str`           | Unique folder identifier.                                                       |
| `userId`    | `str`           | ID of the user who owns the folder.                                             |
| `parentId`  | `Optional[str]` | ID of the parent folder (`None` if at root level).                              |
| `name`      | `str`           | Name of the folder.                                                             |
| `path`      | `str`           | Materialized path (e.g., `/semester_1/biology/`) for fast hierarchical queries. |
| `createdAt` | `datetime`      | Timestamp when the folder was created.                                          |
| `updatedAt` | `datetime`      | Timestamp when the folder was last modified.                                    |

---

## 4. Client-Side (Local) Study Models

These models are stored purely in local device storage (`localStorage` on web and `@capacitor/preferences` on mobile) to track active study progress without triggering database writes.

### `LocalSetStudyProgress`

Tracks a user's study session progress, swiped card statuses, and current position within a specific set on their local device.

| Attribute         | Type        | Description                                                          |
| :---------------- | :---------- | :------------------------------------------------------------------- |
| `setId`           | `str`       | ID of the `Set` being studied.                                       |
| `masteredCardIds` | `List[str]` | IDs of cards the user marked as mastered (e.g., swiped right).       |
| `learningCardIds` | `List[str]` | IDs of cards the user marked as still learning (e.g., swiped left).  |
| `currentIndex`    | `int`       | Index of the card currently in view (to resume sessions).            |
| `lastStudiedAt`   | `str`       | ISO 8601 timestamp string of the last study activity on this device. |

> [!NOTE]
> **Resetting Progress**: Resetting a set's study progress simply clears or deletes the local key `study_progress_{setId}` on the client device.
