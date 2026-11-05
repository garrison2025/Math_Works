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

## R15 (2026-11-05): proportional systems and function classification

- [LOCAL PASS] Independent exact integer determinant/rank checks of 24,000 proportional 2-variable systems, with no-solution and infinitely-many-solutions classes.
- [LOCAL PASS] Independent relation-to-function checks of 12,000 ordered pair sets, and link/answer-map reproduction for v7.
- [CI PENDING] Real Firefox downloads/viewport checks are moved into a separate required timed job; CI must report success to count as browser acceptance. New PDF golden fixtures include classification modes.
- [NOT RUN] Physical protractor ruler measurement, exhaustive manual PDF visual acceptance, educator review. Preview indexing remains disabled.


## R16: modified box plot construction (2026-11-05)

- [LOCAL DEVELOPMENT] Drawing-mode box-plot problems now expose only raw data/blank axes on practice sheets, and complete five-number-summary graphics only in answer mode, with outlier-aware whiskers.
- [CI VERIFICATION REQUIRED] Independent 10k-seed quartile/whisker/outlier oracle, PDF Letter/A4 answer diagrams, and Chromium download regressions were added. Do not mark completed until the associated commit CI finishes successfully.
- [NOT RUN] Physical protractor ruler calibration, exhaustive manual PDF proofing, classroom teacher approval. Cloudflare preview remains `noindex`.


## R17: graph the line on an answer-blind coordinate grid (2026-11-05)

- [LOCAL PASS] 12,000 graph-mode slope/intercept independent oracles checked algebraic line endpoints, source coordinates and separation between blank-practice SVG and completed-answer SVG.
- [LOCAL PASS] Generator bounded quantity for limited signed/zero slopes; tests verify deterministic problem uniqueness and share-link preservation, plus 3,000 unchanged default evaluation examples.
- [LOCAL PASS] Node math/content tests **69/69** and TypeScript static check; screenshot rendering of one negative-slope example confirmed blank versus completed graph.
- [CI REQUIRED] PDF/Letter/A4 structural checks, built site, Chrome download + blank/answer screenshot, Firefox switch-mode behavior, and retained golden samples. Do not mark these passed based on local tests.
- [NOT RUN] Physical print scale, every PDF page visual review and educator sign-off. Preview `noindex,nofollow` required.


### R18 scatter-plot task and plotted-answer safety

- [IMPLEMENTED] Six-point scatter plots use numerically labeled fixed axes (x 0-7, y 0-10); point positions are identical in SVG and vector PDF.
- [IMPLEMENTED] Identify trend covers positive, negative, and no clear linear trend. Plot-points mode shows the six coordinate pairs with a blank graph on practice pages and points on answer pages.
- [LOCAL TEST] Independent covariance checks, seed determinism, and answer-leak regressions are in tests/r18-scatter.test.mjs.
- [CI REQUIRED] Letter/A4 generated PDF pairs and Chrome/Firefox interactions. Full visual PDF review and physical protractor calibration remain NOT RUN.
- [VERSION] v8 intentionally invalidates v7 links for reproducible old generators; the UI warns rather than silently recreating a changed worksheet.


### R19 - Missing-leg Pythagorean worksheets

- [IMPLEMENTED; CI VERIFICATION REQUIRED] Added leg/hypotenuse/mixed task modes, answer-blind triangle diagrams in SVG and vector PDF, answer key diagrams, updated teaching guidance and `v9` share identity.
- [LOCAL TEST] Independent theorem oracles over 18,000 problem seeds, all difficulty levels and variants, plus deterministic worksheet/link replay checks. Re-run full test suite and GitHub CI after final commit.
- [NOT RUN] Physical protractor calibration or exhaustive manual visual review of all 51 topic families.

### R20 function-table source QA

- [IMPLEMENTED, CI PENDING] New input/output/mixed missing-cell tasks, shared validated vector SVG/PDF table model and matching PDF answer table; generator v10.
- [LOCAL TEST REQUIRED] 18,000 independent inverse/forward algebra checks, question-only blank cell, answer-only full table, share links and wrong-data rejection.
- [CI REQUIRED] Full PDF smoke, Chrome/Firefox QA, Letter/A4 golden fixtures and Astro/noindex audit.
- [NOT RUN] Physical printer checks and exhaustive manual inspection of all topic PDF variations.

### R21 statistics mode and exactness

- [IMPLEMENTED, VERIFY IN CI] Unimodal, bimodal and no-mode datasets, varied even/odd sample sizes, exact rational means, and task-specific teaching steps.
- [LOCAL PASS] Independent mode/mean/median/range oracle stress tests, per-mode share-link reproducibility and question uniqueness.
- [CI REQUIRED] Updated PDF golden fixtures and Chrome/Firefox mode selections and downloads.
- [NOT RUN] Full 51-route print inspection and actual-size protractor physical calibration. Noindex stays enabled.


### R22: Exact MAD variance examples and sample size

- [IMPLEMENTED] Replaced three-observation MAD exercises with datasets of 5, 6 and 8 observations (user-selected or mixed); supports symmetric and right-skewed distributions.
- [LOCAL PASS] 18,000 independent BigInt rational oracles validate exact mean and MAD; 40-question distinct/reproducible sheets tested for each selection; legacy math suite run.
- [CI REQUIRED] TypeScript, full PDF generation for A4/Letter, static Astro build, Chrome/Firefox controls and PDF downloads, and noindex audit must succeed on the new commit before claiming R22 deployed.
- [NOT VERIFIED] Exhaustive manual check of all PDF pages, physical 50 mm protractor print calibration and production domain SEO release.

### R23: Percentage of an amount and percentage change

- [IMPLEMENTED] Explicit percent-of-number and percent-change selector choices, original-value change denominator, precise hundredths arithmetic, and matching explanatory steps. Generator/share identity v13.
- [LOCAL TEST REQUIRED] Independent arithmetic oracles, no duplicate 40-question sheets, shared question/answer PDF metadata, browser interaction in Chrome/Firefox. CI outcomes need independent verification before marking release-ready.
- [NOT VERIFIED] Exhaustive physical print review, 50 mm calibration on real printer, and production-domain indexing.

### R24 comprehensive fraction arithmetic

- [IMPLEMENTED; CI PENDING] Addition/subtraction (same or unlike denominators), multiplication and division of nonzero fractions, exact rational answers, topic-specific teaching guidance, reviewed steps PDF and versioned v14 configuration identity.
- [LOCAL TEST REQUIRED] 18,000 independent exact-arithmetic oracles, 40-question uniqueness and deterministic seeded links for all selectors. Full math suite, TypeScript, PDF and browser QA must pass before release claims.
- [NOT VERIFIED] Physical printer calibration or exhaustive visual audit of all 51 topics; the pages.dev preview remains noindex.

### R25: exact scientific notation

- [IMPLEMENTED; CI VERIFICATION REQUIRED] Scientific notation now supports positive/negative exponent selection, 2–4 significant-digit coefficients, and exact decimal conversion without JavaScript float rounding, using generator/share v15.
- [LOCAL TEST REQUIRED] 27,000 independent mathematical question-text oracles; 40-question uniqueness per selector combination; link roundtrips and TypeScript tests.
- [CI REQUIRED] Recheck PDF A4/Letter, Chrome/Firefox mode controls, build and robots noindex audit for the new commit.
- [NOT DONE] Full PDF human visual review and physical 50 mm protractor calibration.


### R27 long-division extension (pending GitHub CI)

- [IMPLEMENTED] One- and two-digit divisors, three-/four-digit dividends, optional remainder; exact quotient-generation bounds keep every problem within the selected digit count.
- [LOCAL TEST TARGET] An independent digit-by-digit oracle checks division algorithm traces, including internal zero quotient digits; narrow presets are tested in 40-question worksheets.
- [CI REQUIRED] v17 build and share identity, Chrome/Firefox A4 browser downloads, paired Letter/A4 PDFs including worked steps, golden PDF artifacts and `noindex` gate.
- [NOT VERIFIED] Physical printer calibration, whole-library visual inspection and full teacher acceptance.

### R28 whole-number and decimal place value (CI pending)

- [IMPLEMENTED] Whole-number digit/value questions span ones through billions. For decimal positions, digit/value/round tasks support tenths through thousandths on four-place decimals, using integer half-up rounding with retained trailing zeros.
- [LOCAL PASS] 106 math/content/indexation/link tests including 18,000 independent whole-place and 13,500 decimal-place mathematical oracles; TypeScript check and browser-script syntax check passed.
- [CI REQUIRED] A4/Letter 40-question PDF exports, browser-selected billion/rounding options with downloads, 51-page Astro static build and `noindex,nofollow` audit. Verify before claiming deployment.
- [NOT VERIFIED] Physical 50 mm protractor print calibration, exhaustive PDF manual review and production-domain release; previews remain `noindex,nofollow`.

### R29: comprehensive print quality gate (CI pending)

- [LOCAL PASS] New PDF layout v2 maintains mathematical generator v18, records PDF layout identity and uses readable 10 pt / 14 pt worked-step text with 3 pt separation. All oversized individual problems are rejected explicitly rather than allowing a printable page to overflow.
- [LOCAL PASS] `npm run typecheck` and 108 math/route/content tests passed, including all 51 live generators at their maximum supported question count in two difficulty modes. The CI-only stress task will produce paired Letter/A4 practice and answer PDFs for 102 scenarios; reviewed-step PDFs are added only for eligible topics.
- [IMPLEMENTED; CI REQUIRED] Full-catalog stress task asserts PDF page size, page count, worksheet seed/version/config identifiers, distinct question-answer IDs and output SHA-256, preserving a machine-readable QA manifest. Its actual PDF and browser checks must complete on GitHub Actions before marking them PASS.
- [NOT VERIFIED] Exhaustive human page-by-page evaluation, classroom/teacher acceptance, physical printer 50 mm protractor calibration, and a custom production domain. Keep pages.dev preview `noindex,nofollow`.


### R30: vector figures are a separate print-release gate

- Root cause: R29's 36pt Poppler text boundary scan passed but did not inspect
  PDF line and curve paths. Re-analysis of the unchanged 468 PDF R29 artifact
  with PyMuPDF found **84 vector-bound violations** across angle and
  complementary/supplementary angle practice sheets. Some obtuse rays reached
  left-of-page coordinates. This is a newly found defect, not a regression in
  the text scanner.
- R30 fix: share faithful 1:1 angle-ray geometry between SVG and PDF, with a
  centered vertex and bounded ray + arc. Avoid separate x/y stretching that
  would misrepresent printed degree sizes.
- Added `tests/r30-angle-geometry.test.mjs`, verifying 179 distinct angles,
  physical aspect preservation and generated problem examples.
- CI now installs pinned PyMuPDF into a throwaway Python venv and verifies
  **all 468 stress PDF vector paths** against 36pt margins, reporting
  `vector-bounds-audit.json`. The existing text check remains mandatory.
- Limits: automated geometry checking cannot detect every visual collision or
  replace the real 50 mm print-scale calibration and full visual review.


### R31: harden physical protractor dimensions (CI pending)

- [LOCAL PASS] Direct PyMuPDF inspection of a previously exported R30 printable-protractor A4 practice PDF found the exact horizontal 50 mm calibration line (141.732 pt) and 144 mm semicircle baseline (408.189 pt), confirming the existing layout is not trivially scaled on that sampled page. This is digital vector evidence, not a physical printer measurement.
- [LOCAL PASS] Added an **independent exported-PDF** dimension verifier; adversarial unit tests reject incorrectly scaled rulers, incorrect radii and missing end ticks/apex, while accepting a correct synthetic instrument.
- [CI REQUIRED] Generate two actual-size blank protractors (Letter/A4) and verify all 160 maximal practice PDF instrument pages plus the two blanks with PyMuPDF; preserve SHA-256 checked manifests and audit reports.
- [NOT RUN] A printed 50 mm ruler measurement and full human visual QA of all pages. Do not enable Google indexing or purchase a custom domain on the basis of vector QA alone.

R31 visual spot-check follow-up: 0° and 180° captions were previously on the horizontal baseline. The vector SVG/PDF labels are now shifted above it, and the independent PDF inspector asserts two correctly positioned text boxes on **every instrument page**. Actual physical printer measurement remains NOT RUN.

### R32: exported PDF text/answer/steps integrity gate (CI evidence required)

- [IMPLEMENTED] Added an independent PyMuPDF text-stream check for the full R29 stress set. It reads each real PDF instead of trusting the source worksheet object, matches numbered problems in order, and verifies the exact printed question plus every expected answer and every verified worked step within its own problem block.
- [IMPLEMENTED] Every exported PDF must retain its manifest SHA-256, page count, generator version, layout version, and configuration identity. The audit still requires 51 topics, 102 standard/challenge cases and at least 408 paired A4/Letter documents (468 with the current reviewed-step coverage).
- [TESTED LOCALLY; CI REQUIRED] Six fault-injection checks cover questions/answers/steps export, broken enumeration, dropped answer, omitted step, and tampered bytes. GitHub CI runs both this unit suite and the full-content check using the pinned PyMuPDF environment; it archives `content-integrity-audit.json` alongside the R29 stress manifest.
- [NOT VERIFIED] Physical printer scaling, all-pages human visual review, classroom acceptance, and custom-domain rollout. Keep Cloudflare preview `noindex,nofollow`; a PDF text extraction PASS does not establish visual quality.


### R33: accurate math glyphs and unified print pathway (CI verification required)

- [IMPLEMENTED] PDF text retains Helvetica WinAnsi multiplication ×, division ÷, degree °, superscript ²/³, and ½ glyphs; unsupported Unicode operators still use documented readable fallbacks. A regression test checks actual bundled PDF font encoding, not only string replacement.
- [IMPLEMENTED] Print action now opens the same vector PDF as downloads, selected by current preview mode and Letter/A4 paper, instead of browser HTML print that had an unverified independent page-break implementation. Blocked popups fall back to a PDF download.
- [CI REQUIRED] Run full typecheck, math/PDF tests, 468 PDF stress outputs, independent content/text/vector/geometry audits, and Chromium/Firefox browser QA on the new commit. Font/glyph visual assessment and real-printer scaling remain separate human gates.
- [NOT VERIFIED] Physical printed 50mm bar, complete 51-topic manual visual proofing, domain/indexation and user classroom acceptance. Keep pages.dev noindex.


### R34 — browser-local exact numeric grading (CI verification required)

- [IMPLEMENTED] Opt-in online answer entry for pure scalar numeric worksheets, with per-question feedback and clear/regenerate behavior.
- [IMPLEMENTED] Exact BigInt rational checker accepts signed whole numbers, finite decimal strings, grouped digits and slash fractions, and rejects invalid expressions, zero denominators and overlong input.
- [CI REQUIRED] Unit tests and real Chromium interaction for answer correctness, clearing and regeneration; full Astro/PDF/Firefox gates must pass.
- [NOT IMPLEMENTED] Algebraic-expression equivalence, graph drawing automatic grading and percentage-format grading. These are deliberately not shown as supported.
- [NOT VERIFIED] Physical printer and complete human UI/accessibility review. Preview must remain noindex.


### R35 — topic-specific static content guard (CI verification required)

- [IMPLEMENTED] Added task-specific introductions to 31 previously generic live routes; 20 existing specialized introductions remain unchanged. All 51 live routes should now present distinct descriptions sourced from documented generator capabilities.
- [IMPLEMENTED] Node regression rejects a missing/generic description, duplicate copy or pathological length before release.
- [CI REQUIRED] Re-run Astro static build and content tests. The 24 parent/child route approval decisions, full manual content review and live indexing are NOT VERIFIED.


### R36 — accessibility and print-action browser QA (CI verification required)

- [IMPLEMENTED] Visible-on-focus skip link to main content; online practice and clear actions move focus to the first answer input for keyboard usability.
- [CI REQUIRED] Chromium test checks first Tab focus target, computed reduced-motion duration, and intercepts the print-ready blob to verify that PDF mode='answers', correct generator identity and A4 MediaBox survive the UI action.
- [NOT VERIFIED] Screen-reader audit, physical 50mm measurement, complete 51-topic human visual proofing and production custom-domain release.


### R37: PDF text-collision preflight (CI verification pending)

- [IMPLEMENTED] Detect significant overlapping independent text spans, replacement glyph artifacts and blank pages on all maximum-count exported stress PDFs (51 topics, 102 cases, 468 documents across Letter/A4 and question/answer/approved steps modes).
- [IMPLEMENTED] Generate a vector contact sheet of first/last A4 challenge pages, covering every topic, and store the exact selected source files/page numbers in `visual-preflight-audit.json` for manual review.
- [LOCAL PASS] Five PyMuPDF synthetic tests for collisions, legitimate adjacent rows/columns, missing glyphs and blank page behavior; CI must rerun and report the full-catalog outcome.
- [NOT RUN] Full human inspection of the contact sheet and real 50mm printed ruler. Automated text collision testing is not a complete visual acceptance test.


### R38 — optional pencil working lines (CI verification required)

- [IMPLEMENTED] One or two 21pt-spaced handwriting rules for explicit calculation topics on printable question pages only. No ruled lines in answer/steps PDFs or alongside full diagrams; number-fact drills remain compact.
- [IMPLEMENTED] Physical pagination reserves rule height before page break and rejects oversized exercises; both Letter/A4 use exactly the same writing-line geometry with the existing 36pt safe margins.
- [CI REQUIRED] Run full 51-topic maximum-count stress, R32 semantic, R30 vector/text margins, R37 text-collision preflight and Chromium/Firefox checks on the final R38 commit. Avoid treating changed page counts as errors if all manifest identity checks still pass.
- [NOT VERIFIED] Manual review of all 51 topics and physical printer calibration.


### R39 — supplemental stacked-fraction typography (verify CI per commit)

- [IMPLEMENTED] Conservative safe parser supports binary +, −, × and ÷ of fractions; missing numerator/denominator equivalence; and fraction-to-percent questions only. No invented expression parsing or unsafe HTML injection.
- [IMPLEMENTED] Matching stacked math in browser questions preview and PDF practice, with original text retained and verified semantic text identity. Vector PDF bars are measured and page-height reserved explicitly.
- [CI REQUIRED] Test source/parser, A4 and Letter exports, Firefox/Chromium previews, all 468 PDF stress outputs, 36pt margins, visual text collisions and content extraction.
- [NOT DONE] Physical printer ruler calibration, comprehensive human visual review, 24 SEO intent collisions decisions or public-domain indexing.
