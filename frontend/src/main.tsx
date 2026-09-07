import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { ToastContainer } from '@/components/shared/Toast';
import App from './App';
import '@/styles/global.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
