/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CLOUD_RUN_BASE_URL?: string;
  readonly VITE_LAN_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
