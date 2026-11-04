# SEO/GEO project brief — Math Worksheet Studio

**Source**: owner-supplied V2 plan dated 2026-11-04, based on 600 Math-Drills and 500 MathWorksheets4Kids sampled ranking rows. 488 deduplicated non-brand keywords with Semrush KD <=29; 305 IMAGE results, 150 ORGANIC and 33 SITELINK representative rows. Export field headings were inferred from headerless source and require primary-source verification. These are not new site's forecast visits. See `src/data/keyword-evidence.csv` (source evidence) and `src/data/routes.json` (55 agreed route-level intents).

## Canonical/intent assignment

- One canonical route per intent, keyed by `slug`. Singular/plural, `worksheet`, `worksheets`, `pdf`, and `printable` query variants share an intent route unless a concrete functional difference is demonstrated.
- 43 conditional tools, 8 conditional hubs, 4 HOLD. HOLD: word-problems, worksheets-by-grade, algebra-general, geometry-general. HOLD URLs are not built.
- Parents and children can both appear only if their independently generated tasks, controls and example images are meaningfully distinct; review 24 groups in owner handoff before opening indexation.
- The homepage presents one fully usable sample generator plus thematic navigation. Tool pages contain SSG HTML of real sample questions, browser-interactive controls, topic-specific explanations, a static preview image and related topics.

## Pre-launch index policy

- No custom domain or validated release: **noindex,nofollow** in initial HTML; no canonical output, sitemap contains no URLs. `PUBLIC_INDEXABLE=true` alone is insufficient: `PUBLIC_SITE_URL` must be a verified, owned custom domain (not `.pages.dev`/`example.com`).
- Before production publication: independently verify all intended routes, mathematical results, distinct outputs, truthful structured data, image previews and sitemap coverage, then set Cloudflare environment variables for a reviewed production build.
- Query seeds/difficulty never create new static pages; no query-specific canonical. Every work object is generated client-side.

## GEO and user evidence

- Expose the actual worksheet problem, answer validation method and how-to teaching steps in static HTML; no invented AI ranking signals or FAQ spam.
- `WebApplication` Schema.org markup only enabled with the custom production domain; no manufactured AggregateRating or author qualifications.
- No paid SEO APIs, login, ad scripts, student grade storage or tracking.
- Canonical and index state subject to domain and real release checks; not verified live.
