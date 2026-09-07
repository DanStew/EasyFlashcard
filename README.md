# EasyFlashcard

EasyFlashcard is a mobile and web flashcard application for revision purposes. Its core goal is to utilise AI in the generation of flashcards and learning materials, allowing you to focus more on revision and less on making revision aids.

## Quick Start with Docker Compose

To run both the frontend and backend services together in Docker containers:

### 1. Prerequisites
- Install and launch **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** on your machine.

### 2. Build & Start the Containers
In the root directory of the repository, run:

```bash
docker compose up --build
```

To run in detached (background) mode:
```bash
docker compose up -d --build
```

### 3. Access the Application
| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | React web application UI |
| **Backend API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive FastAPI documentation |
| **Backend Healthcheck** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | API health check endpoint |

### 4. Stop the Containers
```bash
docker compose down
```

---

## Core Goals

- Mobile / Web app that enables you to have flashcards
- Manual or AI Creation of Flashcards, to speed up the creation of flashcards
- Can upload documents (pdfs, images, pptx, etc) and convert documents into flashcards
- Flashcards must be made with high technical detail and exact to the documents described, without missing out details
- Flashcards made must be exhaustive to the document made, not only representing a subset of a document
- Flashcards include images, including AI generated / extracted images from documents to go alongside flashcards
- Should be able to test individual sets, or test yourself on multiple sets at the same time
- Should be able to group together sets in some organised manner
- Flashcards contain optional references (i.e. doc+page references to where they were found)
- Can upload documents, and then view the documents inside of the app (to enable direct doc referral)
- Documents can be reused between different flashcard sets
- MCP to expose core functionality, enabling AI agents to create, read, and interact with flashcards

## Extension Ideas

- Create quizzes / questions about your flashcards
  - Have AI create the quizzes and evaluate your answers (more flexible than Quizlet without requiring exact string matches)

