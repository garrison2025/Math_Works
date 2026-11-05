# Math Worksheet Studio

An original, browser-first US-English printable math worksheet generator built with Astro, TypeScript and pdf-lib. Source: `garrison2025/Math_Works`.

**Project state:** functional implementation draft; **not yet production accepted**. All preview routes intentionally emit `noindex` until a verified custom domain and manual QA are complete. Review `RELEASE-EVIDENCE.md` before enabling indexing.

## Scope

- 55 owner-approved topic intents; 51 rendered pages (43 specialized tools, 8 conditional hubs), 4 HOLD excluded from builds.
- Reproducible xorshift32 seed; generator/version IDs and matched answer maps.
- Worksheet preview, independent browser-side practice and answer-key PDF exports (and worked steps for 14 reviewed topics), direct printing, Letter/A4 paper.
- 51 topic-specific static WebP previews generated from deterministic problem objects; corrected SVG/PDF Cartesian charts and geometric endpoint symbols.
- 488 owner-researched KD<=29 keyword evidence entries in `src/data/keyword-evidence.csv` (not expected traffic forecasts).
- Local/private operation; no accounts, DB, paid APIs, ads or analytics in this version.
- Thirteen high-demand topic routes now have meaningful topic-specific selectors, including integer operation, one-/two-step equation form, inequality coefficient sign, grouping, equivalent-fraction blanks, fraction operation, times table, division remainder, statistics skill, scatter trend, number-line sign and coordinate quadrant.
- The topic, seed, difficulty, number of questions and selected topic settings deterministically define a short configuration fingerprint. Worksheet/answer PDFs include the same fingerprint in their filename and document header; a "Copy reproducible link" control restores settings from the URL without storing student content.
- Focused times-table and sign-restricted number-line modes limit the quantity selector to the number of available unique questions for the selected setting.


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

The 30 topic-specific setting groups are implemented and tested; the remaining routes still prioritize core deterministic examples rather than every advanced control listed in the V2 contract. PDF export and physical printer accuracy are implemented in code but **not yet independently browser-verified**. New `test:pdf` runs structural PDF output checks on GitHub CI; physical print inspection is still required. Default Helvetica export transliterates math symbols to plain ASCII in PDF (the HTML/SVG view retains Unicode), pending a properly licensed and tested embedded-font solution. Do not describe every generator or SEO route as fully accepted until the remaining gold/visual tests run.

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

### Deployed preview and R6 editorial/mobile checks (2026-11-04)

- Current preview: https://math-works.pages.dev/ (not a purchased custom domain). Live HTTP extraction confirmed the homepage, two-step equations route and robots.txt returned content; both sampled HTML pages emit `noindex,nofollow`. This is **not** a real-browser interaction test.
- On narrow mobile screens, the worksheet preview now comes first, with a visible "Customize & download" link down to the parameter controls. Visual screenshots and touch workflow still require verification.
- Teaching guidance now separates equations from inequalities, so ordinary equation help no longer tells pupils to flip inequality symbols.
- Arithmetic-topic classification includes order of operations, number recognition, and number lines; topic pages include context-specific common-mistake warnings.
- `npm run audit:static` checks that each built route has HTML, title, description, H1, `noindex`, no canonical or rich-result markup, and a real static sample WebP; HOLD routes must not appear. The check runs after `npm run build` in GitHub Actions.
- Keep `PUBLIC_INDEXABLE=false` until a domain is owned and each route passes release QA.

## R7: topic-specific classroom controls and reproducibility links

- `src/lib/topic-options.ts`: validated per-topic option contracts for 13 topics, with genuine generator behavior rather than labels only.
- `src/lib/worksheet-link.ts`: encoded, validated, reversible worksheet settings for sharing; links never include student data. Parameter links remain within the same nonindexable preview route.
- PDF practice and answer documents include the same seed and configuration fingerprint. The two files also carry their own mode and paper size.
- Automated regression cases cover option-specific meaning across 100 seeds per selectable value, invalid input rejection, fingerprint changes and share-link roundtrips.
- Deployment remains `noindex` on `pages.dev` until a real domain and release gates are approved.

## R8: targeted classroom settings, finite-domain caps and release identity

- Added 17 **functional** topic-specific control groups, bringing the total from 13 to 30. Added regrouping/borrowing practice, decimal precision, proper/improper fraction products, place-value position, percent/scientific conversion directions, function input finding, vertical slopes, missing prism height, box-plot skill focus, division facts, angle relationships, line types and GCF relation. Each selection changes generated questions, not only labels.
- `maxQuantityForTopic` limits narrow finite problem spaces (fixed divisor/table, signed number line, number recognition, no-carry products and easy Pythagorean triples). The UI disables impossible question quantities; direct engine requests reject them clearly. No paid API.
- Replaced rejection-based no-carry multiplication with a precomputed pool of mathematically valid pairs; added more exact Pythagorean triples so 40-question worksheets in standard/challenge have sufficient variety.
- Share URLs now include `gv=2`, and the worksheet and PDF metadata expose the generator version. **Old unversioned share links may not reproduce the exact old questions** because the underlying algorithms have evolved; the interface explicitly warns when opening such links. Preserving legacy R7 problem sets remains a future compatibility task; do not claim cross-release replay.
- CI tests cover every specialized choice and the largest selectable question count, verify share-link and answer mapping round trips, and check that selected-option PDF metadata matches between the worksheet and answer key.
- No changes to 55 intended routes, original keyword evidence or `noindex` safety. Chrome/Firefox interactions, visual PDF pagination and physical ruler/protractor calibration remain unverified.


## R9: every active worksheet topic has a functional classroom selector (2026-11-04)

- Added **21 additional subject-specific configuration groups** (51/51 active routes now have a real selector; this does **not** mean all advanced requirements from the V2 research contract are complete). HOLD routes remain absent and 8 conditional hubs remain nonindexable.
- New modes include narrower two-/three-digit multiplication ranges, proper/improper unlike-fraction sums, solving triangle/parallelogram/trapezoid **missing heights**, square/cube areas, triangle missing-angle type, Pythagorean scale, domain vs range, acute/obtuse classification, vertical vs adjacent angles, symmetric/skewed MAD, chosen arithmetic operations, protractor angle ranges, signed system solutions, function-table missing cell, word-to-numeral matching, and positive/negative/zero linear slopes.
- Missing-height diagrams omit the unknown value from their `diagramSpec` and label the unknown with `?`; question-mode SVG and PDF therefore never receive an undisclosed height as a graphic parameter.
- Tight quantity bounds on narrow domains (square mode, cube mode, scaled Pythagorean triples, fixed word/dot number recognition), while the UI disables values beyond each mode's actual possible problem count.
- R11: reproducible/share and PDF metadata now declare **generator v4** (`gv=4`), including revised column/long-division diagrams and unique dot counting. Previously created `gv=3`, `gv=2` or unversioned links may produce changed exercises; the browser warns instead of falsely promising historical replay.
- New independent seed-oracle tests evaluate actual displayed questions in missing-height geometry, fraction sums, surface areas, functions, statistics and angles. Locally **40/40** Node/math/content tests pass, TypeScript typecheck passes, and all 181 choice values × three difficulties × 50 seeded full worksheets (=27,150 complete sets) generate without collisions or errors. Static WebP preview preparation outputs 51 files. GitHub CI PDF/Astro steps require their own passing record for this commit.
- The original V2 release gates still apply: no Chrome/Firefox download/click evidence, no golden page-by-page PDF visual signoff, no physical protractor 50 mm measurement, and no completed feature-by-feature V2 parity audit. Keep `PUBLIC_INDEXABLE=false`; do not buy a domain or submit preview URLs to search engines.

### R10: answer-safe box plots and reproducible PDF QA

- On the box-plot topic, the **questions** PDF and SVG preview show the raw dataset and an empty numeric axis, not a completed box-and-whisker chart that reveals quartiles or outlier locations. Answers remain in the separate answer key.
- PDF export first validates complete question ↔ answer IDs, counts, question uniqueness and nonempty explanations, refusing mismatched data. This is integrity validation, not an independent proof of every result.
- Font-aware text wrapping and page-space estimates reduce PDF clipping and overlap risks; both Letter and A4 remain supported.
- GitHub CI runs tests across all 51 implemented topic families and generates reproducible PDF sample artifacts for six representative families (`npm run qa:pdf-samples`), retaining them for a seven-day visual inspection window. Visual comparison and real printer calibration still require reviewer sign-off.

## R11 browser and column-arithmetic QA

New exercise layouts include original, editable-by-hand long multiplication working lines (ones/tens partial products) and long-division quotient/remainder brackets, implemented in both SVG worksheet previews and vector PDF exports. Number recognition shows each dot once; uniqueness and answer-key integrity are checked using the mathematical diagram as well as question text. These changes use generator **v4**; sharing links include `gv=4` and previous versions may not replay exactly.

In GitHub Actions, `npm run qa:browser` now tests the *built* Astro site through free/open-source `playwright-core` and the runner's local Chrome, preserving screenshots and downloaded PDFs in the `math-works-browser-qa` artifact. It is a development verification step, not a promise that all browsers and physical printers work. Locally it requires a Chrome binary at `CHROME_BIN` or a standard system path. Continued `noindex` on `pages.dev` is intentional.

### R12 geometry fidelity

Triangle interior-angle pictures now use mathematically constructed vertex coordinates shared between HTML/SVG and vector PDFs. Previously fixed-angle pictures could contradict the numeric problems even with a "not to scale" disclaimer. Geometry PDFs now carry the visible base/height/side labels; missing heights are displayed as `?` instead of revealing the solution. The new `tests/r12-geometry.test.mjs` checks 3,000 random triangles independently and verifies unknown-height masking. CI browser checks and four more golden geometry PDF cases accompany these changes.

## R14 advanced algebra and cross-browser verification (2026-11-05)

- General two-variable linear systems can be selected under **System form → General**. Both coefficients on each equation vary, determinant is nonzero, and both equations share exactly one integer solution. A simple sum/difference option remains available.
- Domain/range now offers **Relation type → Not function**. A repeated x-value with a different y-value teaches why a relation is not always a function; domain/range answers deduplicate repeated set elements.
- Generator/share identifier is **v6**. Earlier `gv` links warn that exact question reproduction is not guaranteed; newly copied links use v6 and preserve both topic settings.
- CI has an independent **Firefox** smoke suite: A4 question-PDF download, new algebra selector behavior, answer visibility toggle and 390px mobile layout. Firefox smoke tests use a locally served static build. Physical protractor print accuracy remains unverified.

### R15: advanced system and relation classification

- Systems worksheets now practice **no solution** (parallel lines) and **infinitely many solutions** (coincident equations) alongside unique integer solutions. Generated coefficient determinants and augmented conditions are independently tested.
- Domain/range worksheets include **Is this relation a function?** with repeated-input counterexamples.
- New semantics use generator **v7**, with distinct reproducible links and matched answer keys.
- GitHub CI separates Firefox into a required job with bounded installation so stalled browser setup cannot block core mathematical, PDF, Chromium or static site results. Do not treat core CI success as Firefox success.

### R16: construct modified box plots with verified answer graphics (2026-11-05)

- The Box Plots topic now offers **Draw modified box plot**, alongside Q1, median, Q3, IQR and outlier calculations. The practice sheet carries only the original values and a graduated blank axis; the answer view and PDF display the computed quartile box, median line, non-outlier whiskers, and separate outlier markers on the same scale.
- New test coverage independently recalculates quartiles, 1.5×IQR fences, whisker endpoints and outliers for 10,000 seeds, and checks seeded URLs and PDFs on both US Letter and A4.
- The existing generator v7 identity is preserved: previously generated topics and option settings are not changed. `PUBLIC_INDEXABLE=false` remains required on the preview domain.


### R17: actual linear-function plotting exercises (2026-11-05)

- `Linear Equations Worksheets` now has a **Linear function task** selector: the existing **Evaluate y** mode remains the default, while **Graph** generates an actual blank coordinate grid to draw `y = mx + b`.
- In graph mode the **practice** SVG and questions PDF never draw the target solution line; the **answer key** plots the exact vector line and two algebraically verified points `(0,b)` and `(1,m+b)`. PDF coordinate axes include numbered tick marks.
- Limited choice pools are explicitly capped (10 horizontal, 30 strictly positive/negative, 40 mixed); the client disables impossible question counts, preventing timeout/duplicate attempts.
- Added 12,000 independent graph slope/intercept examples, long-worksheet uniqueness and reproducible link tests, Letter/A4 PDF roundtrips, Chrome and Firefox smoke tests, and three representative PDF-golden fixture families.
- Retains generator `v7` because existing **evaluate** seed/question semantics are unchanged; graph mode is opt-in and part of the reproducible URL's explicit `opt_task` value. Older versions remain not guaranteed reproducible.
- CI/manual browser evidence and physical printer verification remain separate gates; this feature must not trigger indexing or custom-domain rollout.


### R18 scatter plotting and trend interpretation

On `/scatter-plot-worksheets/`, teachers can choose **Identify the trend** (positive, negative, or no clear linear trend) or **Plot the data**. The latter shows labeled numerical axes but no points on practice sheets; matching answer PDFs plot the six exact ordered pairs. SVG and vector PDF share the same 0-7 by 0-10 scale. This changes the worksheet generator to **v8**, so previous v7 shares must be regenerated using the current engine; the site does not claim backwards reproducibility. Browser QA and physical printer signoff must still be checked separately.


### R19: Pythagorean missing-leg practice (2026-11-05)

- Pythagorean worksheets now support **Find hypotenuse**, **Find missing leg**, and **Mixed**. Missing-leg questions have integer sides from scaled triples, and the separate answer/steps PDFs derive the unknown from `c² − known²`.
- The question-only triangle labels the unknown leg as `?` while the hypotenuse and other leg stay visible; answer mode includes the reconstructed side. PDF question/answer diagrams use the same contract and respect paper dimensions.
- Independent mathematical oracles and deterministic URL/worksheet consistency tests cover all three tasks; the generator and share-link format are now v9, deliberately not claiming compatibility with earlier seeded worksheet IDs.
- Classroom print accuracy remains subject to human review; physical protractor calibration is not programmatically verified.

### R20: printable function-table cells

Function Tables now supports missing outputs, missing inputs, and mixed practice, with first/middle/last blank cell choices. Worksheet diagrams show a real 2 × 4 math table, not inline arrow text. Only the answer key fills the missing input or output; the table is drawn as vectors in both SVG and PDF. New generator version v10 protects reproducible share links; see `tests/r20-function-tables.test.mjs` and the R20 PDF fixtures. Browser and physical-print signoff remain separate from automated testing.


### R22: Exact mean absolute deviation worksheets

- MAD exercises now support symmetric and right-skewed integer datasets with 5, 6 or 8 observations. The sample-size choice is part of the deterministic worksheet identity and v12 share links.
- Exact rational arithmetic computes the mean and MAD from the raw integer totals (`Σ|n·xᵢ − Σx| / n²`). The generator never rounds the mean while computing deviations.
- Practice PDFs keep the answer separate. Worked explanatory steps show the exact mean, every deviation and the final simplest fraction. GitHub CI tests both paper sizes and independent 18,000-sample mathematical oracles.
- Previous generator v11 links are intentionally not guaranteed to recreate v12 exercises. Do not enable preview indexing.

R22 follow-up: MAD is now on the 14-topic verified worked-step PDF allowlist, after independent rational crosschecks.
