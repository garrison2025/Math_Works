# Release evidence | 2026-11-04

This file distinguishes implemented code, local checks and outstanding gates. **The site is not production-ready.**

| Gate | Evidence/status |
|---|---|
| 55-route planning | PASS: `routes.json` includes 55 unique candidates and 4 HOLD; 51 built routes |
| 51 generator branches | PASS for source presence and local smoke tests; mathematical completeness of every spec option NOT VERIFIED |
| Deterministic seeds | PASS local Node test `math.test.mjs`: same seed/options produces same JSON across repeated calls in the same runtime; cross-browser equality NOT RUN |
| 51x1000 generator seeds | PASS local Node invariants (no throws, nonempty answers/steps); independent mathematical oracle for every type NOT RUN |
| 100 seeded diversity sets/topic | PASS local uniqueness test (8 questions per set) |
| 416 independent gold tests | NOT RUN; initial independent checks currently cover two-step equations, triangles and unlike fractions |
| Web layout (360/390/768/1280/1440) | NOT RUN: Astro dependencies unavailable in this container; browser screenshot evidence needed |
| Astro build | NOT RUN locally: package registry unreachable; GitHub CI defined |
| PDF three-file exports | IMPLEMENTED, not executed in a browser; typography/wrapping/multipage testing NOT RUN |
| Physical Letter/A4 | Dimensions specified in code; 6x2 golden visual PDF pages NOT RUN |
| Printable protractor 50mm | Vector calibration length in source; physical printer measurement NOT RUN — do not mark as verified |
| Sample WebP assets | PASS: generated 51 static mathematical sample images locally with Sharp |
| Seed/parameters index safety | PASS in source: static route count and noindex preview; deployed crawl NOT RUN |
| 24 parent-child cannibalization cases | DOCUMENTED in V2 handoff; independent content-level review NOT RUN |
| Access/privacy | NO backend or student account; Cloudflare request metadata may exist; analytics/ads not installed |
| External service/live deployment | NOT RUN / NO custom domain |

## Correctness follow-up (2026-11-04)

- Unlike-fraction denominators are guaranteed to differ; 5,000-seed oracle test PASS locally.
- SVG/PDF number lines now scale across signed ranges; box-plots render outliers separately from whiskers; dedicated SVG regressions PASS locally.
- Native print respects selected Letter or A4 size. Invalid seed clears stale worksheet state. Browser print path remains NOT RUN.
- Local Node suite now reports 12 passed tests. GitHub CI for this follow-up commit still needs its own run.

## Blocking next checks

1. GitHub Action `Quality checks`: install Node dependencies; typecheck/test/SSG build and inspect artifacts.
2. Browser test: Chrome/Firefox desktop and mobile, PDF download flows, keyboard/tab/invalid inputs, print CSS and inaccessible states.
3. 6 golden PDFs x 2 paper sizes, image-by-image compare; physically print 50mm calibration bar.
4. Author-specific topic controls, separate diagrams/working steps and 24 overlapping route intents need manual QA; only enable `PUBLIC_INDEXABLE` when these checks pass.
