# Cloudflare Pages setup

- Repository: https://github.com/garrison2025/Math_Works
- Framework: Astro / Static
- Production branch: `main`
- Build command: `npm run build`
- Output directory: `dist`
- Runtime: Node.js `22`
- Paid dependencies: none
- ENV: `PUBLIC_INDEXABLE=false` (default), `PUBLIC_SITE_URL` unset until a custom domain is purchased.
- Build installs open-source packages from npm; no paid data API or DB.

**Current deployment rule**: A `*.pages.dev` preview must remain nonindexable. Do not assign an unpurchased canonical URL or submit a sitemap to Search Console. After math/PDF/SEO gates pass and the owned custom domain is configured, set `PUBLIC_SITE_URL=https://owned-domain.com` and `PUBLIC_INDEXABLE=true` on the production build, validate HTML/canonical/sitemap, and then request indexing.
