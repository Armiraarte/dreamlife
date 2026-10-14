/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del backend Laravel (sin /api). Vacio = mismo origen. */
  readonly VITE_API_BASE?: string;
}
