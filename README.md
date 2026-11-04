# Math Worksheet Studio

An original, browser-first US-English printable math worksheet generator built with Astro, TypeScript and pdf-lib. Source: `garrison2025/Math_Works`.

**Project state:** functional implementation draft; **not yet production accepted**. All preview routes intentionally emit `noindex` until a verified custom domain and manual QA are complete. Review `RELEASE-EVIDENCE.md` before enabling indexing.

## Scope

- 55 owner-approved topic intents; 51 rendered pages (43 specialized tools, 8 conditional hubs), 4 HOLD excluded from builds.
- Reproducible xorshift32 seed; generator/version IDs and matched answer maps.
- Worksheet preview, three independent browser-side PDF exports (practice, answers, worked steps), direct printing, Letter/A4 paper.
- 51 topic-specific static WebP previews generated from deterministic problem objects.
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
- `tests/math.test.mjs`: repeatability, 51k smoke seeds, oracle samples, diverse seeds.

## Publishing rules

All preview pages emit `noindex,nofollow`, with no canonical. Only after acquiring an owned custom domain and passing release acceptance should `PUBLIC_SITE_URL=https://your-domain.example` and `PUBLIC_INDEXABLE=true` be configured. Preview websites must remain noindex. The 4 HOLD pages are not built; do not index thin or unimplemented topic pages. For quality gates and known limitations, read `RELEASE-EVIDENCE.md` and `SEO-GEO-PROJECT-BRIEF.md`.

## Limitations

The broad topic matrix currently prioritizes core deterministic examples, not the full configurable parameter set listed in the V2 contract. PDF export and physical printer accuracy are implemented in code but **not yet independently browser-verified**. Default Helvetica export transliterates symbols to plain ASCII in PDF (the HTML/SVG view retains Unicode). Do not describe every generator or SEO route as fully accepted until the remaining gold/visual tests run.
