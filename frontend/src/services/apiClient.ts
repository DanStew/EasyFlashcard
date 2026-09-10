// ==========================================
// EasyFlashcard - Central API Client
// ==========================================

import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl, EVENT_API_BASE_URL_CHANGED } from '@/utils/capacitorUtils';

import { auth } from './firebase';

// Storage key for user ID in local storage
const USER_ID_KEY = 'easyflashcard_user_id';

/**
 * Returns the currently active user identifier for request headers.
 * Returns Firebase Auth UID when authenticated.
 */
export function getCurrentUserId(): string {
  if (auth?.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  try {
    return localStorage.getItem(USER_ID_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Updates the user identifier in local storage.
 */
export function setCurrentUserId(userId: string): void {
  try {
    localStorage.setItem(USER_ID_KEY, userId.trim());
  } catch {
    // Local storage unavailable
  }
}

// Instantiate Axios client with defaults
export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update client default baseURL when changed dynamically
if (typeof window !== 'undefined') {
  window.addEventListener(EVENT_API_BASE_URL_CHANGED, () => {
    apiClient.defaults.baseURL = getApiBaseUrl();
  });
}

// Request interceptor to attach user ID header and ensure latest base URL
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();
    const userId = getCurrentUserId();
    if (userId) {
      config.headers.set('X-User-ID', userId);
    }

    if (auth?.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // ID token refresh failure
      }
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

export class ApiError extends Error {
  status?: number;
  isNotFound: boolean;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNotFound = status === 404;
  }
}

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | { msg?: string }[] }>) => {
    let message = 'An unexpected network error occurred';
    const status = error.response?.status;

    if (error.response?.data?.detail) {
      if (typeof error.response.data.detail === 'string') {
        message = error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail) && error.response.data.detail.length > 0) {
        message = error.response.data.detail[0].msg || 'Validation error';
      }
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new ApiError(message, status));
  }
);

