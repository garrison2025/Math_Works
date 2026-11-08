# Cloudflare Pages setup

## R108 — SEO quality rollout and index expansion (2026-11-08)

Owner approved implementing the full SEO audit. The exact main-branch indexable set is now **64 URLs**: 51 original working topic tools/hubs, 5 subject directories with original subject-specific math instruction, 2 original working extra generators/grade pages, homepage, worksheet library, and 4 informational pages. Only `/algebra-general-worksheets/` and `/geometry-general-worksheets/` remain navigation-only `noindex,follow` with no canonical; 404 and branch previews remain `noindex,nofollow`.

Every core topic has an individually authored concise page title, meta description and heading based on its true implemented math tasks and source-backed primary intent. 24 easily-confused topics now contain true worked contrasts and links to the appropriate specialist instead of SEO boilerplate. All indexable pages emit site-specific canonical metadata, large OpenGraph/Twitter sample images sourced from existing assets, and semantic WebSite, WebPage, BreadcrumbList and applicable WebApplication/LearningResource JSON-LD. Home H1 includes 'Free printable math worksheets'; About documents actual software QA and how to report mistakes. None of the original 488 keyword evidence rows, 51 generators or PDF algorithms changed.

**External tasks remaining:** Cloudflare DNS/Bulk Redirect settings from `math-works.pages.dev` and `www.mathworksheetstudio.com` to the apex (301 preserving path/query), GSC domain verification + sitemap submission, external email forwarding tests, and measured field CWV. The domain alone does not confirm Google indexing or ranking; performance scores must be measured, never inferred. See official Cloudflare [Pages production-domain redirect instructions](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/) and [www redirect instructions](https://developers.cloudflare.com/pages/how-to/www-redirect/). The site does not have Cloudflare account-write credentials in the GitHub connector, so do not claim redirect rules were applied.


## R107 — Public indexing approved (2026-11-08)

Owner explicitly directed replacing noindex and publishing the purchased .com website. On Cloudflare production `CF_PAGES_BRANCH=main`, the build will index the homepage, 51 approved working generator/topic URLs, the `/worksheets/` directory, and About, Contact, Privacy and Terms: **57 canonical URLs**. All have `index,follow`, self-canonical to `https://mathworksheetstudio.com` and valid schema, and appear in `sitemap.xml`. The four historical HOLD preview pages remain `noindex,nofollow` and outside the sitemap; 404 stays noindex. Feature-branch previews remain noindex because the branch must equal `main`.

Cloudflare Pages' old `PUBLIC_INDEXABLE=false` and `PUBLIC_INDEXABLE_ROUTES` env values are no longer read. That is intentional: the owner approved release without a further Cloudflare env edit. `PUBLIC_SITE_URL` is no longer a source of canonical authority. Use Cloudflare account **Bulk Redirect** from `math-works.pages.dev` to the custom `.com` (301, preserve path/query), and from `www.mathworksheetstudio.com` to the apex with proper DNS; code alone cannot add those account-level redirects. Until then both production hosts can serve identical HTML with the **custom-domain canonical**. Preview branch URLs must not be redirected to production. Verify/submit `https://mathworksheetstudio.com/sitemap.xml` in GSC; Google indexing and ranking remain Google's decisions.


## R106 owned domain / official email (2026-11-08)

Official primary hostname: **https://mathworksheetstudio.com**. Public homepage/contact/robots/sitemap HTTPS checks succeeded and matched the last deployed Git SHA. Existing HTML is still `noindex,nofollow`, and sitemap is deliberately empty. Owner supplied `contact@mathworksheetstudio.com`.

In **Cloudflare Workers & Pages → math-works → Settings → Environment variables → Production**, configure or check:
```text
PUBLIC_SITE_URL=https://mathworksheetstudio.com
PUBLIC_INDEXABLE=false
PUBLIC_INDEXABLE_ROUTES=
PUBLIC_INDEXABLE_HUB_ROUTES=
```
These are instructions, **not changes already applied to the Cloudflare dashboard**. Indexation requires separate explicit owner approval of particular specialized pages, verified main-branch deployment and canonical/sitemap tests. Four historically HOLD preview pages must never be silently promoted. The `*.pages.dev` build must not become a second indexable public copy.

**WWW gap:** Public DNS returned NXDOMAIN for `www.mathworksheetstudio.com`. Use Cloudflare's [www-to-apex Bulk Redirect guide](https://developers.cloudflare.com/pages/how-to/www-redirect/) to add a proxied `www` record and a **301 redirect** to the apex, preserving URL path and query. Cloudflare Pages `_redirects` does not implement host-based redirects. Before any public indexing, also consider [redirecting the `math-works.pages.dev` production alias](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/) to the canonical domain using Cloudflare Bulk Redirects.

**Email:** Public MX records show `route1/2/3.mx.cloudflare.net`, which indicates Cloudflare Email Routing infrastructure, but cannot establish that the `contact@` alias forwards to a verified inbox. Check the Email Routing rule and send an actual inbound test. Standard routing forwards mail only; branded-domain outbound replies need a separate sending solution.

**GSC:** No Google Search Console property verification, unique DNS TXT record or sitemap submission has been completed in this workflow. Do not invent a verification token or claim indexing.


- Repository: https://github.com/garrison2025/Math_Works
- Framework: Astro / Static
- Production branch: `main`
- Build command: `npm run build`
- Output directory: `dist`
- Runtime: Node.js `22.23.4` (pinned via `.node-version`)
- Paid dependencies: none
- ENV: `PUBLIC_INDEXABLE=false` (default), `PUBLIC_SITE_URL` unset until a custom domain is purchased.
- Build installs open-source packages from npm; no paid data API or DB.

**Current deployment rule**: A `*.pages.dev` preview must remain nonindexable. Do not assign an unpurchased canonical URL or submit a sitemap to Search Console. After math/PDF/SEO gates pass and the owned custom domain is configured, set `PUBLIC_SITE_URL=https://owned-domain.com` and `PUBLIC_INDEXABLE=true` on the production build, validate HTML/canonical/sitemap, and then request indexing.


## R81 deployment revision and unknown-path verification

On a Cloudflare Pages production build, inspect **View source** on `https://math-works.pages.dev/` for `<meta name="math-works-build-sha" content="...">`. This is set from Cloudflare's `CF_PAGES_COMMIT_SHA` when it is a valid Git SHA, never a hardcoded guessed revision. Match it against the **production** deployment commit in the Cloudflare Pages dashboard and GitHub main. Pull-request previews show their own branch revisions, not the production revision. The build may have no revision meta on a local laptop without CI/Cloudflare environment variables.

After merging R81 and confirming production deployment, test a real unknown path and a HOLD path such as `/word-problems-worksheets/` with a real HTTP status viewer (or `curl -I`). They must return **404**, render the custom worksheet-not-available page, and emit `noindex,nofollow`. A `200` homepage response is a soft-404 defect. The local Chromium/Firefox static preview uses the same `404.html` with a simulated 404 status; this is not independent Cloudflare live verification.

Keep `PUBLIC_INDEXABLE=false` on the unpurchased preview domain. New build-revision metadata does **not** authorize indexing or substitute for the physical-print/teacher review.
