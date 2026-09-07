# Frontend Component Architecture & Planning

This document outlines the frontend architecture, component hierarchy, shared design elements, layouts, and coding conventions for the EasyFlashcard web and mobile (Capacitor) application.

---

## 1. Architectural Principles & Coding Standards

To ensure maintainability, testability, and strict adherence to project standards:

1. **Component File Structure**: Every component lives in its own dedicated directory named after the component:
   ```text
   ComponentName/
   ├── index.tsx          # Component presentation and JSX markup
   ├── style.scss         # All component-specific styles and CSS tokens
   ├── types.ts           # Strict TypeScript interfaces for Props & internal state
   ├── utils.ts           # Pure business logic, formatting, and calculation helpers
   └── useComponentName.ts # Custom hooks for state management and side effects
   ```
2. **Strict Separation of Styling**:
   * **Zero inline styles** or style objects within `.tsx` files.
   * All styles are authored in dedicated `.scss` files utilizing SCSS variables, mixins, and BEM/semantic class naming.
3. **Decoupled Logic & Presentation**:
   * `.tsx` files must focus purely on rendering and binding.
   * Raw functionality (e.g., flip calculations, gesture math, keyboard listeners, API transformations, validation) must reside in companion `utils.ts` or custom hook files.
4. **Strict Type Safety**:
   * All props and state must have explicit, strict TypeScript interfaces.
   * Avoid `any` completely; use generics or union types where flexibility is needed.

---

## 2. Layouts

Layouts wrap page-level views to provide consistent structural framing across the application.

```
                  ┌─────────────────────────────────────┐
                  │              AppLayout              │
                  │  ┌──────────────┬────────────────┐  │
                  │  │  SidebarNav  │   TopNavBar    │  │
                  │  │              ├────────────────┤  │
                  │  │              │  Main Content  │  │
                  │  └──────────────┴────────────────┘  │
                  └─────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│           StudyLayout           │             │           ModalLayout           │
│  ┌───────────────────────────┐  │             │  ┌───────────────────────────┐  │
│  │   StudyProgressHeader     │  │             │  │      ModalHeader          │  │
│  ├───────────────────────────┤  │             │  ├───────────────────────────┤  │
│  │   Distraction-Free Stage  │  │             │  │      ModalBody (Scroll)   │  │
│  │   (FlashcardCarousel)     │  │             │  ├───────────────────────────┤  │
│  ├───────────────────────────┤  │             │  │      ModalFooter (Actions)│  │
│  │   StudyControlsFooter     │  │             │  └───────────────────────────┘  │
│  └───────────────────────────┘  │             └─────────────────────────────────┘
└─────────────────────────────────┘
```

### 2.1 `AppLayout`
* **Purpose**: Primary application shell for browsing sets, managing folders, viewing documents, and dashboard interactions.
* **Contains**:
  * `SidebarNav`: Collapsible tree showing folders, starred sets, recent sets, and document library.
  * `TopNavBar`: Global search (sets, cards, docs), quick "Create" action button, and user profile avatar.
  * `BreadcrumbTrail`: Dynamic hierarchical navigation for nested folders and sets.

### 2.2 `StudyLayout`
* **Purpose**: Fullscreen, distraction-free "Zen" environment optimized for learning and revision.
* **Contains**:
  * `StudyProgressHeader`: Progress bar, mastered vs. learning counter, and quick exit/settings actions.
  * `StudyStage`: Centered viewport containing interactive study modes.
  * `KeyboardShortcutOverlay`: Help overlay indicating shortcuts (`Space` to flip, `←`/`→` to navigate, `1`/`2` to rate).

### 2.3 `ModalLayout` / `DrawerLayout`
* **Purpose**: Standardized overlay container for complex workflows (e.g., AI document upload wizard, set settings).

---

## 3. Shared Design Components

These reusable components form the design system of EasyFlashcard and are shared across multiple views.

### 3.1 `Flashcard3D`
* **Location**: `src/components/shared/Flashcard3D/`
* **Purpose**: Interactive dual-sided card supporting 3D flip animation, rich text formatting, math expressions, image previews, and document citation badges.
* **Key Props (`types.ts`)**:
  ```typescript
  export interface Flashcard3DProps {
    card: Flashcard;
    isFlipped: boolean;
    onFlip: () => void;
    onToggleStar?: (cardId: string) => void;
    onOpenReference?: (reference: DocumentReference) => void;
    showReferenceBadge?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  }
  ```
* **Helper Modules**:
  * `style.scss`: 3D transform (`perspective`, `transform-style: preserve-3d`, `backface-visibility: hidden`), smooth cubic-bezier transitions, dark/light theme elevation.
  * `utils.ts`: Text-to-speech triggers, markdown/LaTeX sanitization helpers.

### 3.2 `FlashcardCarousel`
* **Location**: `src/components/shared/FlashcardCarousel/`
* **Purpose**: Manages navigation across a deck of cards with smooth transitions, touch swipes (for mobile/Capacitor), and keyboard navigation.
* **Key Props (`types.ts`)**:
  ```typescript
  export interface FlashcardCarouselProps {
    cards: Flashcard[];
    initialIndex?: number;
    onCardReview?: (cardId: string, rating: 'learning' | 'mastered') => void;
    onFinishSession?: () => void;
  }
  ```
* **Helper Modules**:
  * `useCarouselControls.ts`: Handles keyboard event listeners (`ArrowLeft`, `ArrowRight`, `Space`, `S` for star) and mobile swipe gesture physics.

### 3.3 `StudyProgressBar`
* **Location**: `src/components/shared/StudyProgressBar/`
* **Purpose**: Segmented visual progress bar reflecting Quizlet-style mastery distribution (`Mastered`, `Still Learning`, `Remaining`).
* **Key Props (`types.ts`)**:
  ```typescript
  export interface StudyProgressBarProps {
    totalCards: number;
    masteredCount: number;
    learningCount: number;
    unseenCount: number;
  }
  ```
* **Helper Modules**:
  * `utils.ts`: Percentage calculations and accessible ARIA label generation.

### 3.4 `CardEditorRow`
* **Location**: `src/components/shared/CardEditorRow/`
* **Purpose**: A single row in the Quizlet-like Set Editor for authoring or editing a flashcard (Term, Definition, Image drop, AI refine).
* **Key Props (`types.ts`)**:
  ```typescript
  export interface CardEditorRowProps {
    index: number;
    card: Partial<Flashcard>;
    onChange: (index: number, updated: Partial<Flashcard>) => void;
    onDelete: (index: number) => void;
    onOpenAiRefine: (index: number) => void;
    onAttachReference?: (index: number) => void;
  }
  ```
* **Helper Modules**:
  * `style.scss`: Responsive 2-column flex/grid layout with floating action buttons and drag-and-drop reorder handles.

### 3.5 `DocumentReferenceBadge`
* **Location**: `src/components/shared/DocumentReferenceBadge/`
* **Purpose**: Clickable pill on a flashcard displaying document name and page number (e.g., `📄 Biology_L01.pdf • Page 14`), triggering the in-app document viewer when clicked.
* **Key Props (`types.ts`)**:
  ```typescript
  export interface DocumentReferenceBadgeProps {
    reference: DocumentReference;
    onClick: (reference: DocumentReference) => void;
  }
  ```

### 3.6 `DocumentViewerModal`
* **Location**: `src/components/shared/DocumentViewerModal/`
* **Purpose**: Embedded PDF/document viewer using `pdfjs-dist` / `react-pdf` supporting direct page jumping, zoom controls, and text snippet highlighting when linked from a flashcard.
* **Key Props (`types.ts`)**:
  ```typescript
  export interface DocumentViewerModalProps {
    isOpen: boolean;
    documentId: string;
    initialPage?: number;
    highlightSnippet?: string;
    onClose: () => void;
  }
  ```

### 3.7 `AIGenerationWizard`
* **Location**: `src/components/shared/AIGenerationWizard/`
* **Purpose**: Multi-step modal guiding the user through uploading a document, configuring generation options (exhaustiveness level, cards per page, diagram extraction), tracking real-time extraction progress, and previewing generated cards before saving.
* **Sub-components**:
  * `StepUpload`: Drag-and-drop file ingestion with mime-type checking.
  * `StepOptions`: Configuration sliders and toggle switches.
  * `StepProgress`: Real-time SSE / WebSocket streaming progress bar with live extraction logs.
  * `StepReview`: Bulk selection/editing grid of generated cards.

### 3.8 `FolderTreeNav`
* **Location**: `src/components/shared/FolderTreeNav/`
* **Purpose**: Expandable recursive tree for exploring nested folders and sets with drag-and-drop organization support.

---

## 4. Feature Views (Pages)

| View | Route | Primary Layout | Description |
| :--- | :--- | :--- | :--- |
| `DashboardView` | `/` | `AppLayout` | Recent sets, study statistics, quick AI upload CTA, folder shortcuts. |
| `FolderExplorerView` | `/folder/:folderId` | `AppLayout` | View subfolders, contained flashcard sets, and bulk actions (study all sets in folder). |
| `SetDetailView` | `/set/:setId` | `AppLayout` | Overview of a set, study mode launcher (Flashcards, Learn, Quiz), preview list of all terms. |
| `SetEditorView` | `/set/:setId/edit`, `/create-set` | `AppLayout` | Quizlet-style card editor with drag-and-drop ordering, batch import, and AI suggest. |
| `StudySessionView` | `/study/:setId` | `StudyLayout` | Fullscreen interactive study session with flip animation, rating, and results summary. |
| `MultiSetStudyView` | `/study/multi` | `StudyLayout` | Combined study session aggregating multiple selected sets or entire folder trees. |
| `DocumentLibraryView`| `/documents` | `AppLayout` | Manage uploaded documents, view associated flashcard sets, and re-generate cards. |

---

## 5. Recommended Directory Structure

```text
src/
├── assets/                  # Static assets (icons, SVGs, brand assets)
├── styles/                  # Global styles, variables, SCSS mixins, themes
│   ├── _variables.scss      # Colors, typography, spacing, shadows
│   ├── _mixins.scss         # Responsive breakpoints, glassmorphism, 3D helpers
│   └── global.scss          # Reset, global typography, base styles
├── types/                   # Shared TypeScript models (matches backend models)
│   ├── document.ts
│   ├── flashcard.ts
│   ├── folder.ts
│   └── study.ts
├── services/                # API client & backend integration
│   ├── apiClient.ts         # Base axios / fetch client with auth interceptors
│   ├── documentService.ts   # Document upload and status polling
│   ├── flashcardService.ts  # Sets, cards, and folders CRUD
│   └── studyService.ts      # Mastery updates and session telemetry
├── hooks/                   # Global custom React hooks
│   ├── useAuth.ts           # Firebase authentication state
│   ├── useDebounce.ts       # Input debouncing for editor
│   └── useKeyboardShortcut.ts
├── components/
│   ├── layouts/             # AppLayout, StudyLayout, ModalLayout
│   └── shared/              # Reusable design system components
│       ├── Flashcard3D/
│       ├── FlashcardCarousel/
│       ├── StudyProgressBar/
│       ├── CardEditorRow/
│       ├── DocumentReferenceBadge/
│       ├── DocumentViewerModal/
│       ├── AIGenerationWizard/
│       └── FolderTreeNav/
└── views/                   # Route-level page components
    ├── DashboardView/
    ├── SetDetailView/
    ├── SetEditorView/
    ├── StudySessionView/
    ├── MultiSetStudyView/
    └── DocumentLibraryView/
```
