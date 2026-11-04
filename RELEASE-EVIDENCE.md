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

## Answer-blind worksheet and chart regression (R4, 2026-11-04)

- Source change: mask Pythagorean hypotenuse, triangle unknown third angle, and rectangular-prism missing height from question diagrams.
- Use true right-triangle leg geometry for the Pythagorean SVG and vector PDF rather than an isosceles/incorrect schematic.
- Remove solved number-line endpoints and inequality rays from question SVG/PDF; keep readable tick labels in PDF.
- Prevent the target y-coordinate from being printed on the linear function practice graph.
- Normalize SVG/PDF scatter coordinates to a shared plotting range; negative values stay within the page.
- R4 local checks: TypeScript PASS and 22/22 math tests PASS, including 1,000 seed answer-visibility regression and 2,000 seed scatter bounds tests.
- 51 static WebP previews regenerated locally (Sharp).
- Local PDF/BROWSER/physical printer checks: NOT RUN. PDF test suite was expanded for R4 and must be confirmed by the current commit's GitHub CI.

## R5: Protractor PDF physical geometry and function-table fidelity (2026-11-04)

- [PASS local] A physical protractor metric contract now defines a 72 mm radius and 50 mm calibration line, shared across SVG and PDF implementations; the local math test suite reports 23 PASS.
- [IMPLEMENTED, CI pending] Added single-page blank protractor PDF and a dedicated route-only download button. The general exercise PDF reserves physical-size space and paginates rather than shrinking the protractor.
- [IMPLEMENTED, CI pending] Export text maps Unicode function-table arrows to ASCII `->`; `test:pdf` includes a regression case.
- [NOT RUN] Physical 50 ±1 mm printer measurement on an actual printed protractor and visual page-by-page PDF review. The updated CI run must PASS before treating PDF roundtrip tests as passing.

## R6: pages.dev live content and publishing safety review (2026-11-04)

- [PASS — remote HTML fetch] https://math-works.pages.dev/ and `/two-step-equations-worksheets/` returned English content with the expected titles, descriptions, links and `noindex,nofollow` meta directive; `/robots.txt` was accessible. This is a sampled content audit, **not** Chrome/Firefox visual or interactivity evidence.
- [PASS — local] Reassigned order of operations, number recognition and number line to arithmetic grouping; equation guidance no longer mentions inequality sign reversal, while inequality guidance does. Added 3 focused tests to the previously passing local suite (26 in total).
- [IMPLEMENTED, visual NOT RUN] Mobile preview precedes the settings panel on narrow devices, with a keyboard-focusable jump link to configuration and download controls.
- [IMPLEMENTED, CI pending] Topic-specific common mistakes added to topic HTML. `scripts/audit-static.mjs` verifies 51 built topic routes, static real sample images and strict preview `noindex` and no canonical leakage.
- [NOT RUN] Browser PDF clicks, visual breakpoints, actual physical printing, font rendering and accessibility tab-order interaction.
- Domain: **NOT PURCHASED**. Do not set indexability flags, create a paid API account, install analytics/ads, or submit the preview to GSC.


## R7: validated topic-specific selectors and matching export identity (2026-11-04)

- [PASS local] 13 topic option contracts implemented with real generation behavior and strict allowlisted input values. No change to the planned 55 routes, 4 HOLD routes, 51 built preview pages or approved keywords.
- [PASS local] Per-choice tests across 100 seeds, same-seed/same-configuration reproduction, different-options fingerprints, invalid-selection rejection and selected worksheet-link roundtrips.
- [PASS local] `tsc --noEmit -p tsconfig.math.json`; 31 Node math/metadata/content/URL tests passed.
- [IMPLEMENTED, CI PENDING] Browser workspace controls, URL restoration and fingerprint-identical practice/answer PDF naming and metadata. CI must run Astro build and PDF-lib tests before marking these parts PASS.
- [NOT RUN] Actual Chrome/Firefox controls, download clicks, visual PDF review, physical 50 mm print calibration and manual teaching/grade-level accuracy review.
- [HOLD] Preview remains `noindex`; no paid API, analytics, ads, GSC submission or custom canonical domain was added.

## R8: stronger topic controls and finite-problem safety (2026-11-04)

- [IMPLEMENTED] 17 additional genuinely parameterized topics, total 30 specialized control groups out of 51 preview routes. All 4 HOLD routes remain unpublished.
- [PASS locally] TypeScript typecheck, all 34 Node math/SEO/content tests, including independent math oracles, 51x1000 seed invariants, 30 topic option families, reproducible-link round trips, and full UI-selectable worksheet quantities over representative seeds.
- [PASS locally] Multiplication-without-regrouping uses an enumerated mathematically valid pool; tested 2,000 seeds x 20 questions without exhausting or violating the no-carry constraint.
- [PASS locally] Finite-domain caps address number recognition, signed number line, fixed multiplication/division tables and easier Pythagorean tasks.
- [IMPLEMENTED; CI PDF verification pending] PDFs and share URLs identify generator release v2. Prior unversioned links may produce different sets; a visible warning avoids promising legacy reproduction.
- [NOT RUN] Chrome/Firefox hands-on download and mobile interaction, PDF page-image reviews on Letter/A4, physical printer 50 mm calibration. Continue `PUBLIC_INDEXABLE=false`; no custom domain purchased.


## R9: 51 live topic selectors + independent mode-oracle tests (2026-11-04)

- [PASS local] All 51 implemented (non-HOLD) topic generators now expose one genuinely active, validated specialization selector; 21 added in R9. This is **not** an assertion that all 55 V2 feature-contracts or per-topic gold fixtures are fully implemented/accepted.
- [PASS local] `npm run test`: 40/40 tests including TypeScript. `npm run prepare:assets`: 51 topic preview WebP assets. A separate choice/difficulty/seed pressure test produced 27,150 complete worksheets with zero exceptions.
- [PASS local] Missing-height problem SVG derives only known sides/bases from `diagramSpec`; the unknown length is rendered as `?`. Independent question-text formula tests cover new R9 geometry, domain/range, exact fraction sums, MAD, functions and angles.
- [IMPLEMENTED] Generator version 3 in share URLs, worksheet identity and PDF metadata. Prior version-2 or unversioned links are not guaranteed to replay their old question sets; a visible warning is displayed.
- [CI PENDING] PDF/Letter/A4 tests, full Astro SSG build and preview static SEO audit for the R9 commit must be verified from the R9 GitHub Actions run; local npm registry is unavailable.
- [NOT RUN] Cross-browser real PDF clicks, physical printer calibration, visual PDF review of the six golden fixtures × Letter/A4, mobile accessibility keyboard journey and final teacher correctness signoff.
- [SAFE] No purchases, paid API, accounts, analytics, advertising, custom canonical domain or indexation enabled. `*.pages.dev` remains `noindex,nofollow`.

### R10 CI and PDF visual-audit evidence

- [PASS GitHub CI] Commit `d1e33f3e90e43889a01f2360fa62240ad3e4b56c`: all workflow steps passed, including `npm run test`, all-topic PDF tests, Astro build, static SEO audit and `noindex` verification.
- [PASS artifact generation] The GitHub run `41800761538` produced artifact `r10-math-worksheet-golden-pdfs` (artifact ID `13306908011`; 30 PDFs; 7-day retention). The optional Poppler render step did not add PNGs, so rasterization was done separately in a local review environment.
- [PASS structural review] 30 PDF files, 71 pages parsed in PyMuPDF; all Letter/A4 MediaBoxes matched intended paper dimensions and zero extracted text spans were detected outside page bounds.
- [PASS sampled visual review] Rendered and inspected 11 pages across box-plot question sheets, scaled protractors and long multiplication worked-step sheets, plus an unlike-fractions answer sample. No visible clipping was observed in those sampled pages; this is **not** proof that all 71 pages were visually reviewed or that physical print size was verified.
- [FOLLOW-UP] The first PDF artifact used route slugs as QA sample titles, unlike the end-user UI which already sends human-readable topic titles; subsequent sample exporter was corrected to pass `titleFor(slug)`.
- [NOT RUN] Physical printed-protractor calibration, real Chrome/Firefox end-to-end browser downloads and educator sign-off. Preview release remains `noindex`.

## R11: practical long arithmetic, dot-count integrity, and browser QA gate (2026-11-04)

- [PASS local] Replaced plain horizontal-only exercises for 2×2, 2×1, 3×2 multiplication and long division with distinct answer-blind mathematical SVG diagrams. The same `diagramSpec` is consumed by the vector PDF renderer, including blank ones/tens partial-product rows and a quotient/remainder bracket.
- [PASS local] Fixed number-recognition exercises duplicating their visual objects: the sentence says "Count the dots shown below" and exactly N circles are drawn. Corrected worksheet/PDF integrity checks to use the entire mathematical question identity (`question + diagramSpec`), so questions with identical instructions but different dot counts remain distinct; exact repeats remain blocked.
- [PASS local] Generator and reproducible-link version increased to v4. Former `gv=3` / older links cannot be guaranteed to regenerate identical worksheet diagrams and a version warning is shown.
- [PASS local] `npm run test:math`: 49 tests passed and `tsc --noEmit -p tsconfig.math.json` passed. Vector diagrams also rendered with Sharp for visual inspection. These checks do not establish full browser behavior or printable PDF fidelity.
- [CI PENDING] `scripts/browser-smoke.mjs` now tests the built Astro bundle in Chromium, with real PDF downloads for worksheet/answers, separate calibrated protractor download, answer preview, active selectors, share-link clipboard, dot-count answer matching, and mobile 390px overflow. Browser PNGs and PDFs are uploaded as CI artifacts. The workflow requires preinstalled Chrome and an open-source `playwright-core` dev dependency (no paid API).
- [CI PENDING] PDF golden set extended to long division and 3×2 multiplication; existing PDF structure, exact Letter/A4 and strict noindex tests must pass for this commit.
- [NOT RUN] Firefox, physical 50±1mm ruler calibration, every PDF page manual visual review, accessibility screen reader and classroom teacher sign-off.
- [SAFE] Do not turn on `PUBLIC_INDEXABLE`, add a custom canonical domain, GSC or AdSense during preview QA.

## R12: true-angle triangle geometry and PDF diagram parity (2026-11-04)

- [PASS local] The triangle-angle-sum SVG and PDF now derive vertices from the exact given interior angles, rather than portraying arbitrary angles on a fixed triangle; angles calculated from plotted coordinates match 3,000 independently regenerated seed/choice cases to <1e-8°.
- [PASS local] The unknown third angle remains hidden with a question mark, including cases where its numeric value is equal to a known angle. Malformed or degenerate angle diagrams are rejected.
- [PASS local] PDF diagram labels for triangle base/height, rectangle, parallelogram, trapezoid and rectangular prism now match the numeric dimensions displayed in SVG; missing heights remain `?`. `npm run test:math` passed 52/52 and `tsc` passed.
- [IMPLEMENTED, CI confirmation pending] Added Chromium browser checks for the true-angle triangle and trapezoid unknown-height downloads, plus four geometric Letter/A4 golden PDF fixture families. Programmatic parsing, screenshots and raster QA must be checked after the R12 GitHub CI run.
- [NOT RUN] Physical protractor printer measurement, Firefox interactive/download test, every page manual visual inspection, classroom educator signoff. Previews stay `noindex`; custom domain is not purchased.

## R14 advanced mathematics / Firefox QA (2026-11-05)

- [IMPLEMENTED, requires GitHub CI] General 2×2 linear systems with signed nonzero coefficients and guaranteed determinant != 0; a verified integer intersection is built into both equation constants.
- [IMPLEMENTED, locally tested] Domain/range relations with repeated x-values and different y-values; unique set elements are preserved in output.
- [LOCAL PASS] 12,000 independent two-variable linear systems solved by Cramer's algebra and substituted back; 12,000 domain/range relation samples independently reconstructed; 58 local test cases currently pass. Separate 30-question PDF export tests added.
- [CI REQUIRED] Firefox browser installation, A4 PDF download, new selectors and 390px viewport. Do NOT claim Firefox PASS until Actions succeeds and the artifact is reviewed.
- [NOT RUN] Actual physical 50 mm protractor calibration and exhaustive human review of all possible PDFs. `PUBLIC_INDEXABLE=false` remains required on pages.dev.
