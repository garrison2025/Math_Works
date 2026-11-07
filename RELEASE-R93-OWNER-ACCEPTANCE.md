# R93 — Release acceptance and deployment runbook

The owner's V2.0 original 488 keyword rows and the 55 route intents are **frozen and accepted for development**. No new US SERP/KD/Volume research is required. Four original HOLD routes intentionally remain HTTP 404. All `*.pages.dev` builds must stay `noindex,nofollow`.

## What can be certified by CI

- Actual 51 worksheet generators, independent answer/step arithmetic (only explicitly listed base-step topics) and genuine Letter/A4 PDF layout
- 488-row source keyword mapping, 437 aliases to built topics and 51 source rows allocated to four HOLD intents
- Chromium and Firefox 51 × 2 fixed-seed/option deterministic parity; not all seeds
- 36pt digital PDF boundary, vector geometry, 50mm **digital** calibration vector
- Package lock/integrity and date-stamped live `npm audit` severity report
- Responsive screenshots at 360/390/768/1280/1440px; keyboard skip, enter, show/hide, form label and image-alt sampling

These tests do not establish human teacher validation, physical printer scale, all possible mathematical input variants, real screen-reader acceptance, security of every dependency or Google indexing.

## Teacher sign-off — requires a human, NOT RUN until recorded

1. Download artifact `r93-teacher-print-acceptance` from the **merged-main** CI corresponding to the exact release commit. It contains `teacher-math-review-408-cases.csv` (eight fixed-seed problems from all 51 routes), questions/answers and representative real PDF student/teacher samples.
2. Ask a qualified math teacher to review all 408 rows, verifying the printed prompt vs answer, taught method, clarity, suitability and diagrams. Record `PASS`/`FAIL`, reviewer/date, defect/issue link. Inspect optional specialist PDFs separately when accepting those modes.
3. For unresolved problems mark `FAIL`, fix and re-generate a fresh, SHA-matched review packet. No blanket automated teacher approval.

## Physical printer — requires a physical printer and ruler, NOT RUN

1. Download the two exact calibration PDFs for `Letter` and `A4`; do not print from browser page scale.
2. Print in Chrome/Edge at `Actual Size`, `100%`; disable `Fit to page`, `Shrink oversized pages`, or driver enlargement.
3. Measure the **100 mm horizontal**, **100 mm vertical**, **50 mm horizontal** lines and the **25 mm square** using a physical ruler. Record printer model, driver, real scale and measured dimensions for each paper.
4. The V2.0 protractor 50mm check must be **49–51 mm**. Check the 0° ray points right, 90° points up, tick positions, printable stroke visibility and label legibility.
5. Print at least one example student PDF and matching answer PDF per representative topic and paper size. Inspect text clipping, real writing room, paper border, question/answer separation and any glyph tofu.
6. Sign the provided CSV only after measurements. Do not claim physical PASS based only on PDF metadata or vector QA.

## Manual accessibility and UX acceptance — NOT RUN

- On physical Android/iPhone and Windows with keyboard-only: generate, set options, reveal/hide answers, edit practice fields, download and print, restore share URL.
- Inspect 360/390/768/1280/1440px screenshot board (CI artifact) and the no-JS fallback.
- Conduct a real NVDA/VoiceOver task pass for names, order, errors, geometric illustrations, mathematical phrasing; record issues. Browser automation checks only mechanical accessibility heuristics.
- Compare real Cloudflare domain performance in PageSpeed Insights on 4G/mobile and desktop after enabling the custom domain, including LCP/CLS/INP; not equivalent to a local CI pass.

## Domain and Google Search Console — owner-dependent and NOT RUN

The user currently **has not purchased a custom domain**. Do not invent a domain or change `PUBLIC_SITE_URL`. Only after purchasing and owning a domain:

1. In Cloudflare dashboard [Workers & Pages](https://dash.cloudflare.com/) open `Math_Works` > **Custom domains** > **Set up a domain**, enter your real domain and configure the DNS/NS records advised by the dashboard. Cloudflare's current official guide: https://developers.cloudflare.com/pages/configuration/custom-domains/
2. Verify the actual domain returns HTTPS 200, no redirect loop, correct deployed Git SHA; verify unknown and V2 HOLD paths return 404, not the homepage.
3. Obtain real teacher, printer, dependency risk and manual UI release approval before changing indexation.
4. Choose only independently approved **specialized tool route slugs** for `PUBLIC_INDEXABLE_ROUTES` (comma-separated). Use actual purchased site URL in `PUBLIC_SITE_URL` without trailing subpaths and `PUBLIC_INDEXABLE=true` **only** after the acceptance record is complete. Rebuild **main**, never previews.
5. Check the deployed pages individually have a single absolute self-canonical, `index,follow`, meaningful Title/H1/Description and matching working generator. Verify 4 HOLD 404 routes and intentional hubs remain noindex. Confirm `sitemap.xml` lists precisely the authorized pages and correct domain; `robots.txt` must permit Google to see your page directives. Google: https://developers.google.com/search/docs/crawling-indexing/block-indexing
6. At [Google Search Console](https://search.google.com/search-console/welcome) add a **Domain property** for your actual domain. Verify ownership with the account-specific DNS record provided by Google. Do not invent the unique TXT token. Google: https://support.google.com/webmasters/answer/9008080
7. Submit the **real** `https://your-owned-domain/sitemap.xml`, use URL Inspection for an approved specialist page, monitor Coverage, Core Web Vitals and performance after indexing (indexing not guaranteed).
8. No ads before legal/privacy and audience-policy review. AdSense is **not** enabled or approved by the engineering CI.

## Release matrix (do not silently overwrite)

| Gate | Current evidence/status |
|---|---|
| Owner V2 keyword list | ACCEPTED, 488 preserved, no re-research |
| 51 live worksheet topics / 4 intentional HOLD | DIGITALLY VERIFIED by previous merged main |
| Exact browser math across 51×2 scenarios | DIGITALLY VERIFIED by R91/R92 |
| Additional R93 math steps, supply chain, responsive QA | PENDING R93 CI |
| 408-case teacher review | NOT RUN — human required |
| Actual 100% size printer / 50 ± 1 mm check | NOT RUN — equipment required |
| NVDA/VoiceOver and real-device usability | NOT RUN — human required |
| Purchased and bound custom domain | NOT DONE |
| Google Search Console ownership/sitemap/indexing | NOT DONE |
| Advertising policy and performance field data | NOT DONE |

Do not turn lack of user-supplied domain, signed teacher review or physical printer measurements into a fictional technical PASS.
