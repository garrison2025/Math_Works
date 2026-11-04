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

## Math and print correctness follow-up (2026-11-04)

- `adding-unlike-fractions-worksheets`: denominator generation now guarantees unequal denominators; 5,000-seed independent fraction oracle regression PASS locally.
- SVG/PDF number lines use dynamic scales so markers remain visible for large signed/inequality endpoints; 4,000-seed SVG regression PASS locally.
- Box plots render whiskers from non-outlier observations, and mark outliers separately in HTML/SVG and PDF. A dedicated vector regression is PASS locally.
- Native print sets Letter/A4 from the user's current selector, preventing a stale Letter-only page rule. Browser print verification remains NOT RUN.
- Invalid worksheet input clears stale state rather than silently printing the previous worksheet. Browser interaction verification remains NOT RUN.
- Local Node test suite now includes 12 cases, all PASS. The GitHub CI result reported earlier applies to the previous commit; the follow-up commit needs a new CI check.

## Blocking next checks

1. GitHub Action `Quality checks`: install Node dependencies; typecheck/test/SSG build and inspect artifacts.
2. Browser test: Chrome/Firefox desktop and mobile, PDF download flows, keyboard/tab/invalid inputs, print CSS and inaccessible states.
3. 6 golden PDFs x 2 paper sizes, image-by-image compare; physically print 50mm calibration bar.
4. Author-specific topic controls, separate diagrams/working steps and 24 overlapping route intents need manual QA; only enable `PUBLIC_INDEXABLE` when these checks pass.

## Follow-up development: graph semantics, independent math oracles, controlled publishing (2026-11-04)

- True Cartesian graph coordinates use one shared math geometry contract for SVG and PDF: slope endpoints, actual linear function `y=mx+b`, and plotted question/answer point are derived together. This corrects the previous case where `linear-equations-worksheets` mistakenly used slope/intercept as a single point.
- Triangle angle-sum questions now use degree-angle diagrams instead of incorrectly labeling the angles as side lengths. Lines/rays/segments display the appropriate endpoint and arrow counts.
- Percentages practice now covers different denominators, not only `/100`.
- Added `independent-oracles.test.mjs`: independent formula re-evaluation of **42 specific topic families × 300 seeds each** (math code tests, not final user/print QA).
- Added `indexation.test.mjs`: indexability requires a verified custom HTTPS host, explicit `PUBLIC_INDEXABLE=true`, main branch and a comma-separated list of specifically approved tool routes. Eight conditional hubs and four HOLDs remain noindex even if mistakenly included in allowlist.
- Added `capabilities.test.mjs`: only 13 audited topic generators expose 'worked steps PDF'; all other topics still offer worksheet/answer PDF, but their step export cannot be represented as verified.
- Local `tsc -p tsconfig.math.json` and **20 tests PASS** after changes, including 51,000 random seed object checks. Static previews regenerated (51 WebP) using Sharp.
- Added PDF roundtrip tests to GitHub Actions for Letter/A4 page size, representative modes, nonempty file, multipage and steps capability restrictions. **These PDF tests are NOT RUN locally** because `pdf-lib` is unavailable in the working container; check the new CI run before claiming PASS.
- Browser screenshots, live deployment, PDF visual inspection and physical protractor ruler testing remain **NOT RUN**. Do not enable custom domain indexation until approved routes and the physical-print gate pass.
