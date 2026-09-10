// ==========================================
// EasyFlashcard - AI Flashcard Generation API Service
// ==========================================

import { getApiBaseUrl } from '@/utils/capacitorUtils';
import type { SetModel } from '@/types/set';
import type { AIGenerationEvent, AIGenerationRequest } from '@/types/aiGeneration';
import { apiClient, getCurrentUserId } from './apiClient';
import { auth } from './firebase';

export const aiGenerationApi = {
  /**
   * Generates a flashcard set synchronously with LangGraph fallback.
   */
  async generateSync(payload: AIGenerationRequest): Promise<SetModel> {
    const res = await apiClient.post<SetModel>('/ai/generate', payload, {
      timeout: 120000,
    });
    return res.data;
  },

  /**
   * Streams real-time Server-Sent Events (SSE) detailing multi-agent LangGraph generation stages.
   */
  async generateStream(
    payload: AIGenerationRequest,
    onEvent: (event: AIGenerationEvent) => void,
    signal?: AbortSignal
  ): Promise<AIGenerationEvent> {
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
    const url = `${baseUrl}/ai/generate/stream`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    const userId = getCurrentUserId();
    if (userId) {
      headers['X-User-ID'] = userId;
    }

    if (auth?.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Token retrieval failure fallback
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: payload.prompt || null,
        document_ids: payload.documentIds || [],
        raw_text: payload.rawText || null,
        folder_id: payload.folderId || null,
        set_name: payload.setName || null,
        set_description: payload.setDescription || null,
        focus_mode: payload.focusMode || null,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let message = 'AI Flashcard generation request failed';
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.detail || parsed.message || message;
      } catch {
        // Raw text
      }
      throw new Error(message);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming response body is unavailable.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let lastEvent: AIGenerationEvent = {
      stage: 'init',
      progress: 0,
      message: 'Starting generation...',
      cardCount: 0,
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (jsonStr) {
            try {
              const event: AIGenerationEvent = JSON.parse(jsonStr);
              lastEvent = event;
              onEvent(event);
            } catch (err) {
              console.warn('Failed to parse SSE line:', jsonStr, err);
            }
          }
        }
      }
    }

    return lastEvent;
  },
};
