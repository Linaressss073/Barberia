/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Base URL del backend Nest (sin `/api/v1`). */
  readonly PUBLIC_API_URL?: string;
  /** URL canónica del sitio (sitemap / SEO). Opcional en desarrollo. */
  readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
