import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { AuthProvider } from '@/context/AuthContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { useCapacitorMobile } from '@/hooks/useCapacitorMobile';
import { AIStudioView } from '@/views/AIStudioView';
import { DocumentDetailView } from '@/views/DocumentDetailView';
import { FolderExplorerView } from '@/views/FolderExplorerView';
import { LoginView } from '@/views/LoginView';
import { NotFoundView } from '@/views/NotFoundView';
import { SetDetailView } from '@/views/SetDetailView';
import { SetEditorView } from '@/views/SetEditorView';
import { StudyFlashcardsView } from '@/views/StudyFlashcardsView';

interface AuthenticatedAppProps {
  globalSearch: string;
  onSearchChange: (query: string) => void;
}

function AuthenticatedApp({ globalSearch, onSearchChange }: AuthenticatedAppProps) {
  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <AppLayout
          searchValue={globalSearch}
          onSearchChange={onSearchChange}
        >
          <Routes>
            {/* Unified Workspace & Library */}
            <Route path="/" element={<FolderExplorerView />} />
            <Route path="/folder/:folderId" element={<FolderExplorerView />} />

            {/* AI Flashcard Studio & Google Drive Document Hub */}
            <Route path="/studio" element={<AIStudioView />} />
            <Route path="/studio/folder/:folderId" element={<AIStudioView />} />
            <Route path="/studio/document/:documentId" element={<DocumentDetailView />} />
            <Route path="/documents" element={<Navigate to="/studio" replace />} />
            <Route path="/documents/:documentId" element={<DocumentDetailView />} />

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
    </ProtectedRoute>
  );
}

function AppContent() {
  // Mobile hardware back-button, status-bar theme sync, and keyboard management
  useCapacitorMobile();

  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <AuthProvider>
      <Routes>
        {/* Public Authentication Route */}
        <Route path="/login" element={<LoginView />} />

        {/* Protected App Workspace Routes */}
        <Route
          path="/*"
          element={
            <AuthenticatedApp
              globalSearch={globalSearch}
              onSearchChange={setGlobalSearch}
            />
          }
        />
      </Routes>
    </AuthProvider>
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
