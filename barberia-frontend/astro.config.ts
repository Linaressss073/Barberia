import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * En Vercel, define PUBLIC_SITE_URL (canónico, sin barra final) para el sitemap y meta URLs.
 * PUBLIC_API_URL: base del backend Nest sin path (ej. https://api.tudominio.com).
 */
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://yoursite.com',
  output: 'static',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
