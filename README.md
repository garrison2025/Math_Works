# Math Worksheet Studio

An original, browser-first US-English printable math worksheet generator built with Astro, TypeScript and pdf-lib. Source: `garrison2025/Math_Works`.

**Project state:** functional implementation draft; **not yet production accepted**. All preview routes intentionally emit `noindex` until a verified custom domain and manual QA are complete. Review `RELEASE-EVIDENCE.md` before enabling indexing.

## Scope

- 55 owner-approved topic intents; 51 rendered pages (43 specialized tools, 8 conditional hubs), 4 HOLD excluded from builds.
- Reproducible xorshift32 seed; generator/version IDs and matched answer maps.
- Worksheet preview, independent browser-side practice and answer-key PDF exports (and worked steps for 13 reviewed topics), direct printing, Letter/A4 paper.
- 51 topic-specific static WebP previews generated from deterministic problem objects; corrected SVG/PDF Cartesian charts and geometric endpoint symbols.
- 488 owner-researched KD<=29 keyword evidence entries in `src/data/keyword-evidence.csv` (not expected traffic forecasts).
- Local/private operation; no accounts, DB, paid APIs, ads or analytics in this version.

## Getting started

```bash
npm install
npm run dev
npm run test
npm run build
```

Cloudflare Pages: Framework preset Astro, build `npm run build`, output `dist`; use Node 22. Automatic GitHub Actions checks on push. No environment variables required for a private preview.

## Source structure

- `src/lib/math.ts`: deterministic topic generators and exact BigInt rational helpers.
- `src/lib/diagram.ts`: math-driven SVG diagrams.
- `src/lib/pdf.ts`: vector PDF generation locally in the user's browser.
- `src/client/workspace.ts`: browser controls, live preview, exports, printing.
- `src/data/routes.json`: 55 route/SEO intent contracts from owner-provided plan.
- `src/data/keyword-evidence.csv`: 488 deduplicated candidate terms and attached competitor evidence; **do not confuse competitor traffic estimates with this site's traffic**.
- `src/pages/`: Astro static topic pages and legal/about support.
- `scripts/prepare.mjs`: build static WebP examples from fixed seed using Sharp.
- `tests/math.test.mjs` and `tests/independent-oracles.test.mjs`: repeatability, 51k smoke seeds, 5k unlike-denominator cases, diagram regressions, independent math oracles across 42 topic families, and diverse seeds.
- `tests/indexation.test.mjs`: fails closed on preview URLs, custom domains without explicit approved route lists, HOLDs and hubs.
- `tests/pdf.test.mjs`: CI PDF-lib roundtrip tests on six representative topics with Letter/A4, three export modes where allowed, and multiple page lengths.

## Publishing rules

All preview pages emit `noindex,nofollow`, with no canonical. **Setting a domain and `PUBLIC_INDEXABLE=true` alone never enables indexing**. An independent release gate also requires `PUBLIC_INDEXABLE_ROUTES` (comma-separated *individually approved* specialized tool slugs) and Cloudflare's `main` branch. Only the allowlisted specialized tools, the homepage and basic support pages enter the canonical/sitemap. All 8 unapproved hubs and 4 HOLD intents stay out of the sitemap. No custom domain is configured at present; all pages remain noindex. For quality gates and known limitations, read `RELEASE-EVIDENCE.md` and `SEO-GEO-PROJECT-BRIEF.md`.

## Limitations

The broad topic matrix currently prioritizes core deterministic examples, not the full configurable parameter set listed in the V2 contract. PDF export and physical printer accuracy are implemented in code but **not yet independently browser-verified**. New `test:pdf` runs structural PDF output checks on GitHub CI; physical print inspection is still required. Default Helvetica export transliterates math symbols to plain ASCII in PDF (the HTML/SVG view retains Unicode), pending a properly licensed and tested embedded-font solution. Do not describe every generator or SEO route as fully accepted until the remaining gold/visual tests run.

### Question-only diagram safety (2026-11-04 follow-up)

- Unknown lengths/angles are masked on question sheets (Pythagorean hypotenuse, triangle third angle, rectangular prism missing height).
- Number line/inequality practice grids are blank rather than pre-solved; the answer key contains the exact solution.
- Linear graphs show the mathematical line but do not label the requested output point on practice sheets.
- Scatter-plot coordinates use a shared normalized plotting transform in both SVG and PDF, preventing off-page data points.
- The 51 static preview WebP files are regenerated from the current generator and SVG renderer at build time.

These are source/automated-test checks; the release still needs browser and printed-page visual inspections.

### Calibrated protractor export (R5)

The **Printable Protractor** topic now has a dedicated button that downloads a standalone, single-page 180° protractor rather than eight separate randomized exercises. Its SVG and PDF dimensions share a 72 mm protractor radius and a 50 mm calibration ruler. Exercise PDFs also reserve a full-size instrument, with automatic pagination instead of scaling the instrument to a generic diagram slot. PDF function-table arrows are transliterated as `->`, not silently deleted.

**Printing must use Actual size / 100%.** Physical printer measurement of 50 ±1 mm is still NOT RUN; PDF page dimensions and the pure geometry contract are automatically tested.

## R7 topic-specific controls
Thirteen key topics now offer real operation, fraction, coefficient, times-table, statistics, number-line, scatter and quadrant selectors. Worksheet and answer PDFs include matching configuration identifiers; a share link restores the selected settings. All pages.dev previews remain noindex.
