import { defineConfig } from 'astro/config';
// Cloudflare Pages: npm run build; output: dist. No paid API or runtime secrets.
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  site: process.env.PUBLIC_SITE_URL || 'https://math-works.pages.dev',
  build: { inlineStylesheets: 'auto' },
  vite: { build: { target: 'es2022' } }
});
