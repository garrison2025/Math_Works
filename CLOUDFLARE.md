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


## R81 deployment revision and unknown-path verification

On a Cloudflare Pages production build, inspect **View source** on `https://math-works.pages.dev/` for `<meta name="math-works-build-sha" content="...">`. This is set from Cloudflare's `CF_PAGES_COMMIT_SHA` when it is a valid Git SHA, never a hardcoded guessed revision. Match it against the **production** deployment commit in the Cloudflare Pages dashboard and GitHub main. Pull-request previews show their own branch revisions, not the production revision. The build may have no revision meta on a local laptop without CI/Cloudflare environment variables.

After merging R81 and confirming production deployment, test a real unknown path and a HOLD path such as `/word-problems-worksheets/` with a real HTTP status viewer (or `curl -I`). They must return **404**, render the custom worksheet-not-available page, and emit `noindex,nofollow`. A `200` homepage response is a soft-404 defect. The local Chromium/Firefox static preview uses the same `404.html` with a simulated 404 status; this is not independent Cloudflare live verification.

Keep `PUBLIC_INDEXABLE=false` on the unpurchased preview domain. New build-revision metadata does **not** authorize indexing or substitute for the physical-print/teacher review.
