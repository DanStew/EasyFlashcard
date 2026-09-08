import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { useCapacitorMobile } from '@/hooks/useCapacitorMobile';
import { FolderExplorerView } from '@/views/FolderExplorerView';
import { NotFoundView } from '@/views/NotFoundView';
import { SetDetailView } from '@/views/SetDetailView';
import { SetEditorView } from '@/views/SetEditorView';
import { StudyFlashcardsView } from '@/views/StudyFlashcardsView';

function AppContent() {
  // Mobile hardware back-button, status-bar theme sync, and keyboard management
  useCapacitorMobile();

  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <WorkspaceProvider>
      <AppLayout
        searchValue={globalSearch}
        onSearchChange={setGlobalSearch}
      >
        <Routes>
          {/* Unified Workspace & Library */}
          <Route path="/" element={<FolderExplorerView />} />
          <Route path="/folder/:folderId" element={<FolderExplorerView />} />

          {/* Redirect legacy separated endpoints to unified workspace */}
          <Route path="/folders" element={<Navigate to="/" replace />} />
          <Route path="/sets" element={<Navigate to="/" replace />} />

          {/* Sets & Flashcards */}
          <Route path="/set/:setId" element={<SetDetailView />} />
          <Route path="/set/:setId/study" element={<StudyFlashcardsView />} />
          <Route path="/study" element={<StudyFlashcardsView />} />
          <Route path="/set/:setId/edit" element={<SetEditorView />} />
          <Route path="/create-set" element={<SetEditorView />} />

          {/* Fallback */}
          <Route path="*" element={<NotFoundView entityType="page" />} />
        </Routes>
      </AppLayout>
    </WorkspaceProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
