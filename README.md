# Math Worksheet Studio

An original, browser-first US-English printable math worksheet generator built with Astro, TypeScript and pdf-lib. Source: `garrison2025/Math_Works`.

**Project state:** working preview with automated CI/PDF and cross-browser coverage, **not approved for public search indexing or teacher/physical print release**. Site remains `noindex,nofollow` without a purchased domain or final owner acceptance.

**Current verified baseline (2026-11-07):** R82 on main, [Actions #416](https://github.com/garrison2025/Math_Works/actions/runs/42319014926) **PASS**. Read [CURRENT-STATUS.md](CURRENT-STATUS.md) for current functional scope, all 488 keyword statuses, launch gates and R83 changes. The detailed R1–R73 notes below are historical snapshots, not the final/current QA state.


## Scope

- 55 owner-approved topic intents; 51 rendered pages (43 specialized tools, 8 conditional hubs), 4 HOLD excluded from builds.
- Reproducible xorshift32 seed; generator/version IDs and matched answer maps.
- Worksheet preview, independent browser-side practice and answer-key PDF exports (and worked steps for 15 reviewed topics), direct printing, Letter/A4 paper.
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

The 30 topic-specific setting groups are implemented and tested; the remaining routes still prioritize core deterministic examples rather than every advanced control listed in the V2 contract. PDF export is browser-tested in Chromium and Firefox and separately vector-audited in CI; **physical print accuracy and teacher sign-off have not been verified**. New `test:pdf` runs structural PDF output checks on GitHub CI; physical print inspection is still required. Default Helvetica export transliterates math symbols to plain ASCII in PDF (the HTML/SVG view retains Unicode), pending a properly licensed and tested embedded-font solution. Do not describe every generator or SEO route as fully accepted until the remaining gold/visual tests run.

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

### R21 statistics data-distribution exercises

`Mean Median Mode Range` supports one mode, two modes and no-mode datasets, with 5–9 observations including even-sized samples. Mean uses a reduced exact fraction for nonterminating values. The `modePattern` and `statistic` settings are preserved in v11 share URLs and matched Letter/A4 question/answer PDFs. The 51-route preview still stays noindex until independent production QA gates pass.


### R22: Exact mean absolute deviation worksheets

- MAD exercises now support symmetric and right-skewed integer datasets with 5, 6 or 8 observations. The sample-size choice is part of the deterministic worksheet identity and v12 share links.
- Exact rational arithmetic computes the mean and MAD from the raw integer totals (`Σ|n·xᵢ − Σx| / n²`). The generator never rounds the mean while computing deviations.
- Practice PDFs keep the answer separate. Worked explanatory steps show the exact mean, every deviation and the final simplest fraction. GitHub CI tests both paper sizes and independent 18,000-sample mathematical oracles.
- Previous generator v11 links are intentionally not guaranteed to recreate v12 exercises. Do not enable preview indexing.

### R23 percentage teaching modes

`Percentages Worksheets` now generates four distinct mathematical tasks: fraction to percent, percent to simplest fraction, exact percent of an amount (no premature rounding), and percentage increase/decrease measured against the ORIGINAL value. Each task preserves the same matching answer key and PDF export in Letter/A4; share links are marked generator v13. Preview pages remain noindex until domain and manual release QA.

### R24 fraction arithmetic and division

The general **Fractions Worksheets** generator now supports exact addition, subtraction, multiplication and division (including unlike denominators). Denominator relation is a separate selector (mixed/same/unlike). A fraction division problem never has a zero divisor; answers reduce to exact lowest terms and subtraction may yield negative results. A reviewed worked-steps PDF is available for this topic, with independent BigInt math oracle coverage. Generator and share links now use v14; historical generator links only warn and cannot guarantee exact old worksheet restoration.

### R25: exact scientific notation

Scientific notation worksheets now offer positive/negative exponent focus and 2–4 significant-digit coefficients, with both standard-to-scientific and scientific-to-standard conversions. Standard decimal strings are shifted exactly (no floating-point rounding), even for exponents down to -8. Generator/share identity is v15; older seeds do not claim backwards compatibility. Tests independently parse the question and recalculate the answer.


### R27: long division at classroom scale

Long Division Worksheets now offer one- or two-digit divisors and three- or four-digit dividends, in addition to exact-division and remainder choices. All values are generated as exact integers. Worked steps explicitly carry down each digit and retain zero quotient digits once division has begun. The problem SVG/PDF shows the answer-blind division bracket; practice and answer PDFs use matching v17 configuration hashes. Firefox/Chrome/browser and Letter/A4 golden fixture checks run on GitHub CI; they are not a substitute for physical print verification.

### R28: large whole-number and exact decimal place-value practice

- **Place Value Worksheets** now supports ones, tens, hundreds, thousands, millions and billions. Teachers can ask for the *digit* or its *numerical value*. The generator creates up to ten-digit safe integers by drawing individual digits; it does not reduce the accessible billions interval through a 32-bit PRNG modulo operation.
- **Decimal Place Value Worksheets** now supports identifying digits, calculating exact fractional digit values, and rounding to tenths/hundredths/thousandths. Each problem displays four fractional digits so thousandth rounding genuinely inspects the ten-thousandth. Rounding is based on integer ten-thousandths and preserves precision zeros (e.g., `9.9995 -> 10.000`).
- Both new controls are carried in URL fingerprints and matching question/answer PDFs under generator/share **v18**. R27 and earlier generator links intentionally cannot guarantee identical old questions.
- `tests/r28-place-value.test.mjs` runs 31,500 independently parsed mathematical checks plus full 40-question reproducibility, selected-step and link checks. CI must still verify Letter/A4 PDF pagination, Chrome/Firefox downloads, static build and preview noindex. Neither test execution nor a CI pass substitutes for physical protractor calibration or entire-PDF human review.

### R29: PDF legibility and all-route maximum-length release audit

- The worksheet generator is still **v18**: existing seeds, selected options and shared URLs retain the same questions and answers. The PDF layout contract is now **v2**, identified separately in the PDF metadata and readable two-line page header.
- Verified step PDFs use 10 pt text, 14 pt line spacing and extra separation between reasoning steps rather than compact 9/11 pt lines. PDF pagination reserves the actual measured text height and refuses to emit a problem that cannot fit a fresh Letter/A4 page; it never silently clips a too-tall problem.
- `npm run qa:pdf-stress` generates every live worksheet generator in two difficulty levels, at the maximum supported quantity, on both US Letter and A4. It creates distinct questions, answers and (where approved) reviewed-steps PDFs plus `qa-artifacts/pdf-stress/manifest.json`, which includes each worksheet's exact reproducible problem/answer sequence, page count, and SHA-256 of the produced PDF.
- GitHub Actions archives this private CI-only evidence under `r29-all-51-topic-pdf-stress` with seven-day retention. It is **not** shipped to `dist/` or exposed to crawlers.
- Physical printing, the 50 mm protractor ruler check and full human review of all generated pages remain incomplete. Do **not** enable `PUBLIC_INDEXABLE` or buy a custom domain until those gates are complete.


### R30 vector geometry and printing QA

R29 checked 468 generated PDFs for *text* bounds, but vector figures were not
part of that audit. R30 found 84 actual vector-path margins violations in
`angle-worksheets` and `complementary-supplementary-angles-worksheets`: the
older PDF renderer drew obtuse-angle rays off the left edge of Letter/A4 pages.
The angle diagram now uses one shared, uniformly scaled coordinate system in
SVG and PDF, preserving the actual angle in degrees and centering the vertex.
`npm run test:math` independently checks 179 angle sizes and 3,000+ generated
angle problems. GitHub CI now also runs
`scripts/check-pdf-vector-margins.py` on **all** generated stress PDFs with an
isolated, pinned PyMuPDF version, failing deployment QA if any vector drawing
exits the 36pt safe margin. This supplements the existing text-bounds audit.
Neither audit can prove physical printer calibration or fully replace visual
review of individual diagrams.


## R31 — exported-PDF protractor physical-size audit

The protractor's physical dimensions now have a **separate, independent PDF-vector release gate**. `npm run qa:protractor-instruments` generates actual Letter and A4 blank protractor PDF files as private CI evidence; `scripts/check-protractor-geometry.py` uses PyMuPDF to inspect **each of the 160 maximum-count printable-protractor worksheet pages plus both standalone files**. For every page, it checks a 144 mm diameter (72 mm radius) baseline, a 50 mm horizontal calibration bar, endpoint ticks, the semicircle apex, visible calibration instructions and safe page margins. Missing pages, wrong page sizes and unexpected file SHA-256 values fail the release. `tests/test_protractor_geometry_audit.py` verifies that incorrect 49/50.5/51 mm calibration bars, wrong radii and missing geometry are rejected.

This confirms **PDF vector geometry only**. It cannot verify printer fit-to-page settings or that the line measures 50 mm on a specific physical printer. Printing at Actual size (100%) and measuring with a physical ruler remains a mandatory, unperformed human release gate. Keep the preview `noindex,nofollow` until then.

R31 visual spot-check follow-up: 0° and 180° captions were previously on the horizontal baseline. The vector SVG/PDF labels are now shifted above it, and the independent PDF inspector asserts two correctly positioned text boxes on **every instrument page**. Actual physical printer measurement remains NOT RUN.


### R33 — print-ready PDF parity and mathematical symbols

PDF export retains native Helvetica-compatible ×, ÷, °, ², ³ and ½ instead of turning multiplication into an ambiguous variable `x` or spelling division out in running prose. Unsupported glyphs retain explicit ASCII fallbacks. The **Open print-ready PDF** action opens the exact same deterministic, paginated, 36pt-margin-audited PDF as the matching worksheet/answer/verified-steps download; it no longer uses a separate unverified HTML print layout. The current Questions/Answers/Steps preview mode and Letter/A4 selection determine which PDF opens. If the browser blocks the tab, the same PDF downloads instead. Use the PDF viewer's Print action with Actual size / 100% for instruments. PDF glyph-level visual QA and physical printer calibration remain required before a public indexable launch.


### R34 — exact online arithmetic practice

When all answers are scalar integers, decimals or fractions, **Practice online** enables local answer inputs with checked feedback and a clear-responses control. Equivalent forms (such as `2/4`, `0.5`, `1/2`) are compared using exact BigInt rational arithmetic, not floating-point approximations, external APIs or `eval()`. Uncheckable graphs, diagrams, expressions, percentage formats and decimal-rounding precision exercises remain PDF/answer-key tasks. Scores and responses are not stored or sent to a server, and regenerating a worksheet clears previous responses. PDF/print exports never include practice input fields.


### R35 — specific static teaching copy across every live route

All 51 live worksheet routes now have a distinct, generator-grounded English introduction instead of generic template filler. The introductory paragraph also supplies each page's static meta description. Specialists and broader generator hubs are described as different tasks, not keyword-only clones. The build test fails whenever an active topic falls back to the generic introduction. This improves content specificity but does not itself approve the 24 parent/child conflicts for indexing. Preview continues `noindex,nofollow`; measured ranking and traffic are unverified.


### R36 — keyboard access, reduced motion and print/preview parity

Every page now has a keyboard-visible **Skip to main content** link. The local practice toggle and reset action place keyboard focus on the first available answer field. Chromium QA checks this keyboard route, confirms reduced-motion preferences disable decorative transitions, and intercepts the PDF print action to load and inspect the actual exported A4 answer-key PDF. This is digital browser QA; it cannot certify screen-reader usability, physical printer scaling or classroom acceptance.


### R37 — full-catalog page-legibility preflight and review board

A new PyMuPDF CI release gate inspects **every page** of all 468 maximum-count stress PDFs for substantial overlaps among independently drawn text spans, replacement/missing glyphs and blank text pages. It separately builds `qa-artifacts/pdf-stress/visual-review-contact-sheet.pdf`: scalable vector thumbnails of first/last pages for A4 challenge practice/answers and approved steps across all **51 live topics**, with a machine-readable sample index. Five adversarial geometry tests must pass. The board is retained in the private CI PDF-stress artifact, not deployed as crawlable content. This automates a text-collision gate but does **not** certify text-vector collisions, printable diagrams, a real physical printer or a teacher's final visual sign-off. Do not enable indexation on this evidence alone.


### R38 — ruled handwriting space in printable question PDFs

Practice questions requiring calculations now reserve one or two thin pencil rules underneath each prompt for showing working (e.g. multi-step equations, fractions, PEMDAS, percentage change and statistics). Fact drills stay compact; diagrams retain their native answer-blind drawing space. Rule spacing is included in the PDF layout's measured problem height **before** deciding page breaks, on both A4 and Letter. Answer keys and worked-step PDFs are unchanged. All output remains browser-local and vector-based. Stress PDFs, semantic checks, text/vector margins and the R37 text-collision gate must pass; actual classroom/physical printer approval remains outstanding.


### R39 — true stacked fractions for printable practice

Four active fraction families plus fraction-to-percentage conversion now show an additional *display-style* numerator / fraction bar / denominator equation on practice worksheets. The HTML preview uses safe deterministic token rendering; the physical PDF draws real vector bars and exact numeral text. Every original question remains visible and extractable for accessibility, search, answer integrity and all existing mathematical checks. Visual duplication is marked `aria-hidden` in browser previews. Unknown formats do not render extra math. The PDF reserves 49pt per stacked equation **before pagination**, preserving writing rules and both Letter/A4 margins. All answers, steps, generator seeds and URL fingerprints are unchanged; full CI and physical/visual review remain independent release gates.


R39 also has an independent PyMuPDF *exported PDF* release gate, checking exact expected fraction-bar counts against the 102-case stress manifest and detecting bars that cross printed glyphs. It inspects fraction practice plus answers/steps to catch missing or answer-leaking vector art. Audit output is retained as `fraction-vector-audit.json` in the private CI PDF artifact; no public SEO URLs are added.


### R40 — 24 verified parent/specialist skill comparisons

The owner V2 SEO plan defines 24 overlapping parent/child search-intent pairs. `src/lib/intent-relations.ts` now preserves each exact pair and its concrete classroom task distinction; relevant built topic pages display reciprocal, task-labeled links in a dedicated “Compare related practice skills” section. Automated tests reject missing/HOLD routes, duplicate pairs, duplicate descriptions and indistinguishable representative generated tasks. This is a usable navigation improvement—not an assertion of SEO ranking, revenue, ownership of a custom domain, manual educator approval or indexation permission. Unapproved `CONDITIONAL_HUB`/HOLD routes remain noindex, and production release still uses the fail-closed allowlist.


### R41 — source keyword and built reciprocal-link release gate

The existing `npm run audit:static` now reads the original supplied 488-row keyword evidence CSV with proper handling of quoted commas, verifies unique terms, positive source search volume, Semrush KD ≤29, valid competitor source fields, and a real mapping to every one of the 55 route intents. It explicitly identifies **437 rows mapped to the 51 active generators** and **51 rows mapped to four held, unpublished routes**. The actual built Astro HTML is independently checked for all 48 reciprocal links across the 24 documented parent/specialist pairs. Preview `noindex,nofollow` stays required, and this audit makes no claim about current live SERPs or future organic traffic. Counts are a deliberate source-baseline contract: changes require documented review rather than silent keyword loss.


### R42 — privacy and no-JavaScript release preflight

The Chromium browser gate now disables JavaScript for **all 51 generated topic pages**, verifying static H1, eight real fixed-seed questions, one valid WebP image, readable teaching notes and absence of pre-revealed answers. Five subject-specific screenshots are retained for manual review. The same test records all outgoing HTTP(S) traffic from first navigation, verifies zero external/third-party requests and zero failed responses, and checks that seed regeneration, local exact-answer grading and worksheet PDF export issue **zero new HTTP calls after initial page load**. Firefox independently checks four subject categories at 390px with JS disabled. Chromium saves `r42-release-browser-preflight.json` with counts and scope, and both test jobs fail if their evidence is missing. **These tests inspect the locally built static bundle, not Cloudflare production traffic**; content, hosting and real physical printing remain separately subject to approval.


### R43 — reviewed real PDF samples and fixed mathematical diagram glyphs

An actual R42 GitHub Action golden-PDF ZIP was inspected as rasterized A4 contact sheets (50 PNG source samples covering typical fractions, arithmetic, geometry and statistics; selected full-size pages inspected). The review found legitimate math-print defects omitted by prior vector/content audits: triangle-angle drawings labeled angles as `33 deg` instead of `33°`; angle-ray and intersecting-line drawings repeated the same abbreviation, while column multiplication used a lowercase `x` rather than the mathematical `×`. The PDF renderer now uses native Helvetica WinAnsi degree/multiply glyphs consistently with question text. R43 adds an **independent extracted PDF glyph audit** for all affected question PDFs in the 468-document stress collection, with tests that reject the exact legacy formatting. The full photo/physical-print acceptance remains an explicit manual gate. The generator, answer keys, seed/config identity, page-safety margins and preview noindex status remain unchanged.


### R44 — geometry reading and actual long-division pencil workspace

Manual inspection of real A4 PDF samples exposed a trapezoid sketch whose **top base looked shorter even when the printed top base was numerically larger**. SVG preview and vector PDF now use the same bounded trapezoid layout, with parallel-base width ordering reflecting the actual problem values. Because this is an educational schematic, both formats explicitly say `Schematic - not to scale`. The perpendicular height is drawn between the parallel bases; the missing-height label remains a question mark on practice sheets. The PDF/SVG long-division brackets now reserve two pale subtraction work guides below the dividend and move the remainder blank to the bottom, while leaving the quotient and remainder unknown. The generated question and exact answer, deterministic seed, generator v18 and layout v2 are **unchanged**. Unit tests cover numeric base ordering (including equal bases), invalid geometry, SVG masking and real PDF export. Full 468-document PDF stress, vector safe margins and browser QA still gate approval. **Equal parallel bases remain an inclusive-trapezoid convention**; do not market this site as adhering to a particular exclusive trapezoid definition without curriculum review.


#### R44 true-PDF orientation regression

A full-size PDF rendered after the first R44 commit exposed a **real y-axis inversion**: SVG's top-down geometry had been reused in PDF's bottom-up plotting coordinate system, making the visual top/bottom base labels physically reversed. This is corrected with an explicit `fy = 1 - y` conversion **only in PDF plotting**. New independent PyMuPDF audit `scripts/check-pdf-trapezoid.py` reads actual exported stroke order, compares lower/upper horizontal base lengths and positions against original worksheet question values, checks altitude reach, and checks one schematic disclaimer per problem. Adversarial tests reject the exact orientation regression. Do not infer CI pass from the source-only geometry tests.


### R45 — curriculum-aware trapezoid base selector, with original v18 sheet identity

Real R44 golden A4 sample sheets confirmed that the existing generator can produce equal top/bottom trapezoid bases, which are parallelograms under the inclusive definition, and are excluded by other curricula's exclusive definition. Rather than silently change existing deterministic worksheets or invalidate v18 share links, the route now exposes a **Parallel-base definition** control: default **Inclusive · equal bases allowed** (same questions, RNG draws and original default fingerprint) or opt-in **Unequal parallel bases only**. The exclusive option deterministically nudges just an equal second base by one unit without consuming new RNG values; this recalculates both the exact area and optional missing-height steps and sets a distinct options hash. Route copy explains both definitions without prescribing a curriculum. R45 tests test 1,500+ seeds across difficulties, real 40-question A4/Letter PDFs, the original v18 default hash, and both Chromium and Firefox controls, plus copied share-link round trip. **This does not alter generator version 18, any other topic, or live noindex policy.**


### R46 — independent mathematics oracle at browser PDF export

The original PDF boundary verified only matching question/answer IDs and structural integrity; a corrupted `expectedAnswer` **and** `answerMap` with the same wrong answer could still be exported. The browser now runs `assertWorksheetMath` before *any* vector PDF is created. This is an independent, non-eval, offline verification that parses the **visible question** and recomputes exact answers (integer / BigInt rational arithmetic), plus checks diagram identity or inequality graph direction when applicable. Ten explicitly named high-risk topic families are covered: two-step equations, inequalities, long division, mixed fractions, adding unlike fractions, multiplying fractions, trapezoid area/height, Pythagorean sides, statistics mean/median/mode/range, percentages. For all other topics, previous CI math oracles still exist but this runtime check does **not** claim to cover them. New adversarial tests demonstrate that wrong-but-consistent answer map pairs and altered diagrams cause the real PDF exporter to reject them. It does not verify every solution-step sentence; teachers still review final pages. No generator version, seed, worksheet text or answer content changed, and no network API is required.


### R47 — 23 of 51 generators independently recalculated before local PDF export

The original R46 PDF-boundary protection covered 10 generators. R47 extends its **independent, browser-only math oracle** to 13 more: decimal multiplication, scientific notation, triangle and parallelogram area/height, rectangle/square area, rectangular-prism volume/height, prism/cube surface area, evaluating/inverting functions, linear graph/evaluation tasks, one-step equations, exact division facts, quadrant identification and input/output tables. The oracle parses the visible question, uses exact BigInt decimal/rational math rather than trusting generated answers, cross-checks graph/geometry/tabular values against printed diagrams, and refuses PDF export on mismatch. R47 adversarial tests mutate BOTH expectedAnswer and answerMap consistently, as well as geometric data. The prior R29 pagination torture test now targets an uncovered expression topic so it can still test page-height rejection independently. Generator v18 math values, deterministic seeds, old share links, PDF layout v2 and noindex rules are unchanged. Runtime independent coverage is now **23/51 topics**; remaining 28 topics still rely on pre-existing CI test oracles. Teacher/physical-printer signoff remains open.


### R48 — 36/51 topics independently checked before PDF export

R48 extends the previously verified 23-topic export oracle to 13 further educational skill families: number lines, number recognition (dots or number words), GCF, triangle interior angle sums, complementary/supplementary and intersecting vertical angles, angle classification, mean absolute deviation (exact rational arithmetic), median-of-halves modified box plots including 1.5×IQR whiskers/outliers, scatter plot identification and student plotting, Cartesian slope, domain/range/function identification, and 2×2 systems of equations including unique, parallel and coincident line cases. The oracle reads the **student-facing question**, derives the result independently using exact integer/BigInt arithmetic and checks diagram data where relevant. A wrong answer mirrored in both answer fields or a corrupted visual spec makes PDF export fail closed. R48 adds reproducible option/difficulty tests, malicious input/diagram tests and real A4/Letter PDF checks. Generator version, seeds, printed mathematics and established SEO/indexation gates are not modified. A further 15 topics have existing CI correctness checks but do not yet have full runtime independent PDF recalculation. Teacher review and physical printer checks remain separate.


### R49 — all 51 generator topics have an independent PDF mathematics gate

The final 15 unprotected topics now have independent answer recomputation at PDF export: column multiplication (2-digit × 2-digit, 3-digit × 2-digit, 2-digit × 1-digit), signed integer operations, order of operations (six grouped/ungrouped forms), equivalent fractions, column addition, column subtraction, mixed addition/subtraction, multiplication facts, 1–12 times tables, whole-number and decimal place value/rounding, line/ray/segment recognition and printable-protractor mark prompts. The oracle reads the actual visible problem and independently derives an answer from exact integers or rational decimal place values; diagram-aware cases also check actual diagram data. **Every one of the 51 generator switch cases now has a corresponding PDF runtime validator**. The PDF export gate refuses unknown or future unsupported topics instead of quietly skipping maths verification. The real source generator case list is compared against the validator list during tests; answer+answerMap collusion and altered diagram data are adversarially rejected. Mathematical verification does not establish physical calibration of the 50mm protractor line or teacher approval. Existing reproducible v18 outputs, links, layout v2 and preview robots directives remain unchanged.


### R50 — independent validation of actual worked-solution arithmetic

The former 51/51 math oracle checks the final numeric answer but **does not validate the intermediate steps** of the worked-solution PDF. R50 adds an independent `step-release-oracle.ts` at the `steps`-mode PDF boundary. All 15 step-enabled families reject missing, unsafe, malformed or unreasonable step text. The eight most arithmetically intricate families (2-digit column multiplication, 3×2 multiplication, two-step equations, mixed fractions, unlike-fraction addition, fraction multiplication, long division and mean absolute deviation) now have **full intermediate-step traces independently recomputed from the student's question**, not from the generator's `solutionSteps`. Changed but valid final answers cannot hide an incorrect partial product, arithmetic operation, reciprocal, borrow/quotient digit or MAD mean. Other seven step-enabled topics currently have structural checks and prior CI math tests but not full step-trace recomputation; do not claim 15/15 full independently verified traces. Existing seed identity and problem/answer text remain unchanged. Question-only and answer-key PDFs are not blocked by tampered teaching prose, while the unsafe worked-solution PDF is rejected. This is an additional machine check; real teacher lesson review remains outstanding.


### R51 — all 15 authorized worked-steps topics independently reconstructed

R50's eight full mathematical teaching traces are retained. R51 adds **all seven remaining** step-PDF topics: one-step equations (addition and signed multiplication), order of operations (six grouping/operation templates), equivalent fraction numerator/denominator, Pythagorean missing leg/hypotenuse, triangle area/missing height, parallelogram area/missing height and trapezoid area/missing height (inclusive and unequal-base curriculum modes). Every intermediate step is independently reconstructed **from the student-facing question** using exact BigInt integer and half-unit geometry arithmetic; a mathematically incorrect step is rejected even when the final answer and answer key are correct. The authorized 15-topic list must match the 15 independently audited topics; future unimplemented worked-step topics fail closed. Normal question and answer-key PDFs are unaffected by damaged teaching text. R51 corrects a historical pagination torture fixture: it now expects the mathematically invalid oversized artificial steps to be rejected at the new safety gate, whereas a separate valid numerical question overheight test continues to check actual PDF no-clipping enforcement. Classroom teacher review and true physical printer measurements remain independent release gates. All v18 seeds, mathematical answers, share links and preview noindex status remain unchanged.


### R52 — physical printer scale preflight built into every worksheet

Every worksheet now offers an **opt-in, collapsed** "Printer scale check" immediately beneath the download controls. Select Letter or A4, download a **one-page, vector-only calibration PDF**, print it on the matching paper at **Actual size / 100%** (turn off Fit and Shrink), and measure the horizontal and vertical 100 mm bars using a real ruler. The PDF also has a 50 mm bar to cross-check printable protractor calibration and a 25 × 25 mm square. Enter the *real measured* X/Y lengths; a client-only checker reports whether both are within **±1 mm** of the target. This threshold is an operational screening guide, **not a printer certification**. No measurement is uploaded or stored, and the checker **does not automatically know whether a user printed anything**. CI separately exports the exact Letter/A4 PDFs and uses independent PyMuPDF vector inspection to assert 100 mm X/Y, 50 mm and a 25 mm square (with adversarial false-length tests); this establishes only **digital PDF coordinates**, not real-world printer scaling or paper handling. The old protractor-specific 50 mm PDF and 51-topic generator remain unchanged. Actual printed sheets and teacher sign-off remain open release gates.


### R53 — adaptive long division practice-space (verified)

Long-division practice PDFs and SVG previews now reserve **4 blank subtraction/bring-down rows for 3-digit dividends** and **5 rows for 4-digit dividends**, instead of the previous 2. The printable division column is wider and the extra height participates in PDF pagination. The quotient/remainder remain blank on student copies; seed reproducibility, question/answer mathematics, generator v18 and layout identifier v2 remain unchanged. This is a student-writing ergonomics change, intentionally adding 12 pages to the 468-document stress test compared with R52. R53 independent PyMuPDF analysis verified **160 questions and 708 real pencil-line vectors across 80 pages**, covering both paper sizes and both 3/4-digit dividend lengths. Chromium, Firefox, math/answer/step oracles, margins, and text-collision tests all pass: [CI run 42127798473](https://github.com/garrison2025/Math_Works/actions/runs/42127798473). Real student use, classroom suitability, and physical printer measurements remain unverified. The preview website stays noindex until an explicit launch decision.


### R54 — optional extra pencil-writing room in practice PDFs

Teachers can now select **Practice PDF writing space → Extra room** on any of the 51 topic pages. When selected, the browser generates the same seeded questions and mathematical answers, but the **questions-only vector PDF** has two additional blank ruled lines beneath text-only practice items, or one additional full-width line below a diagram. The calibrated protractor and enlarged long-division scratchwork are deliberately exempt because those diagrams already contain their task-specific writing areas. Answer-key and worked-solution PDFs are unchanged. The default remains `standard`, preserving all previous PDF layouts and URLs.

Share links record the optional `room=extra` preference; old links omit it and keep their exact behavior, and unknown values are ignored. The on-screen preview intentionally shows the unchanged mathematical questions, with a clear **PDF-only** label for the extra ruled lines; extra-room practice downloads have distinct filenames and PDF titles. PDF page-height accounting reserves every added line, so the added whitespace may intentionally increase the number of practice pages. The CI exports 24 real A4/Letter PDFs, independently counts their actual vector pencil lines (standard versus extra, including answer isolation) using PyMuPDF, checks print-safe margins and browser downloads in Chromium and Firefox. This is a print ergonomics aid, not an independently observed teacher approval or printer validation.


### R55 — perpendicular-height markers in all three area-geometry diagrams

Every triangle, parallelogram and trapezoid practice diagram now shows a **small right-angle square at the foot of the perpendicular altitude**, both in the live SVG preview and the actual printed vector-PDF worksheet. This explicitly distinguishes perpendicular height from a sloping edge, including questions where height is masked as **?**. Triangle and parallelogram diagrams also say **Schematic - not to scale**, matching the existing trapezoid disclaimer: printed screen geometry is illustrative and must not be measured to obtain dimensions. The same geometric foot and orientation are checked in independent SVG tests and a PyMuPDF audit of the exported 51-topic stress PDFs (exactly two joined perpendicular vector strokes per question). The original R44 five-stroke trapezoid base-order audit remains unchanged because the new square uses a different stroke width. Generator v18, questions, answers, worked solution arithmetic and existing share links are untouched. Printed student/teacher readability and physical printer scaling still require human review.


### R56 — semantically labeled length, width and height for 3D shapes

Rectangular prism diagrams now place **Length: n**, **Width: n** and **Height: n** beside the corresponding front-bottom, receding-depth and vertical edges, in both the SVG preview and vector PDF. The missing-height task deliberately shows **Height: ?**, never the answer. Cube diagrams show one **Side: n** caption rather than three ambiguous, identical numbers. Each figure says **Schematic - not to scale** and has an accessible screen-reader description. A shared `prismDimensions` helper prevents SVG/PDF label disagreement, while preserving generator v18 seeds, mathematical answers and original worksheets.

R56 runs 6,000 seeded source-to-diagram validations and exports eight A4/Letter test PDFs covering known volume, missing-height volume, rectangular-prism surface area and cube surface area. An independent PyMuPDF audit reads the exact printed label strings and their page positions, checking the hidden height and printable margins; Chromium/Firefox exercise the live controls. Neither passing digital geometry tests nor a drawing's proportions constitutes educator approval or physical printer calibration.


### R57 — zero-centered Cartesian grid scales in SVG and PDF

Previously, the integer tick sequence was generated by walking from the *edge bound* in steps of 2/5/10. A non-divisible bound such as ±5 with 2-unit intervals produced −5, −3, −1, 1, 3, 5 and omitted the actual origin from the tick series. R57 introduces one shared, zero-anchored and mirror-symmetric Cartesian scale used in both webpage SVG graphs and printed PDF grids. For ±5 the marks become −4, −2, 0, 2, 4; both axes now label **0 once** near their crossing. A graph-drawing task still keeps one-unit gridlines while keeping the answer line and intercept points hidden on student sheets. No coordinate, line equation, seed, output answer, share URL or PDF layout version changes.

A new 9,600-seeded-case SVG audit verifies tick marks and positions in four quadrants, slope and line tasks. R57 additionally prints 8 real A4/Letter PDFs (64 graphs) and uses an independent PyMuPDF audit to read physical PDF vector axis crossings, each actual tick length/spacing, symmetry and origin labels. It includes deliberate shifted/unequal/missing-zero adversarial tests. Passing these tests does not claim educator signoff or physical printer calibration.

### R58 — statistical chart ticks, plotted positions and real-PDF box scales

This round continues R57's vector-scale verification into three **existing**
chart representations without inventing extra SEO routes or altering the
v18 generator, worksheet seed contract, mathematical answers or PDF layout
identifier. In the scatter plot, SVG tick nodes now expose exact numerical
values for deterministic geometry testing; 2,700 cases separately recompute
six data-point positions, trend signs and hidden student plotting answers.
In modified box plots, 1,200 independent eight-observation cases check
median-of-halves Q1/median/Q3, whisker endpoints, outliers and their actual
SVG X positions. In the number-recognition counting-dot illustrations, a
further 1,200 cases verify the rendered circle count, unique positions and
integer answer. Counting-dot illustrations are **not** a separate statistical
frequency dot-plot feature or a new keyword/route.

The PDF box-axis numeric labels were moved **below** the horizontal baseline,
away from the plotted box/whisker geometry, to match the SVG reading order.
R58 exports 16 real vector PDFs (A4 and US Letter, both questions and
independent answer sheets) from two cases with genuine 1.5×IQR outliers and
two without. An independent PyMuPDF auditor reads the **exported files** and
checks the actual numeric caption centering, equal tick intervals, quartile
box-edge positions, median and whisker vectors and each outlier circle.
The auditor handles pdf-lib rectangles as the four real PDF path edges
reported by PyMuPDF rather than assuming a PDF `re` command. These checks
are required steps in `.github/workflows/ci.yml` and retain
`r58-printed-box-scales` artifacts.

Digital CI cannot certify physical-size printing, classroom usability or
teacher instructional approval. Before production launch, have a teacher
inspect representative easy/challenge charts and the independent answer
PDFs; physically print A4 and Letter at Actual size (100%), confirm that
numbers and points are legible and clipped nowhere, and measure the
site's provided 50 mm / 100 mm calibration references with a ruler.
Record that independent sign-off separately as **NOT RUN** until performed.
Cloudflare's deployment commit must also be confirmed from Pages itself;
a GitHub Actions PASS does not prove that the same commit was deployed.
Until a real domain and explicit launch decision, `math-works.pages.dev`
remains `noindex,nofollow` (no formal-indexation or GSC claims).

### R59 — independently audited scatter and count-the-dots PDF vector geometry

The R58 SVG/box-scale checks are extended to the **actual downloaded PDFs**
of two existing worksheet generators; neither the 51 live SEO routes nor
generator v18, answer keys, or layout version v2 changes.

**Scatter:** 18 real A4/Letter PDFs cover all three correlations
(positive/negative/none), identifying a plotted trend, plotting six
coordinates on a blank student grid, and the separately completed answer
plot. A PyMuPDF auditor recovers the axes, 8 x tick positions and 6 y tick
positions from the actual vector drawing operators and verifies all 14
numeric glyphs against the tick locations. Six point positions are checked
against the independent source coordinate pairs, while the plot-mode student
PDF must contain **zero** leaked answer circles. An independent covariance
calculation checks trend answers. Adversarial tests must reject shifted
ticks, missing/extra circles, wrong coordinate answers and a leaked solution.

**Number-recognition counting dots:** 24 A4/Letter question PDFs exercise
every integer answer from 1 to 12, sourced using the **real full worksheet
seed path** rather than the internal per-problem RNG seed. The auditor
counts genuine separate circular PDF paths and verifies their alignment,
row and column spacing and print-safe margins against the integer answer.
Adversarial cases reject missing, duplicate, misplaced and clipped dots.
Counting objects is distinct from a statistical frequency Dot Plot and
**does not** claim that a new statistical Dot Plot generator or new SEO
landing page has been implemented. The original V2 site plan does not
include a validated standalone dot-plot keyword/route.

CI runs the two PDF fixture exporters and both independent PyMuPDF checks;
reports and reproducible PDFs are archived as `r59-scatter-pdf-vectors` and
`r59-counting-dots-pdf-vectors`. Automated results verify digital PDF
geometry only: teacher sign-off, physical prints at 100%, and the actual
Cloudflare Pages deployment SHA require **separate** evidence. The public
preview remains `noindex,nofollow`; a real production domain is not yet
purchased or approved for indexation.

### R60 — shorter print-ready teacher answer keys, with full-width diagrams preserved

For non-diagram exercises only, the **answers** PDF now uses the same
measured two-column print framework as the student questions. Answer text
is wrapped to each actual column's font-measured width, and row heights
are recalculated before deciding where page breaks fall. The printed
page header identifies the teacher answer key; worked **steps** and
every diagram topic remain full-width. Numbering, generated arithmetic,
deterministic seeds, answer mappings, link fingerprints and the engine's
generator v18 / layout v2 identity do **not** change.

Teacher print checks include eight 40-question text-only topics on
Letter and A4, their matching practice sheets, and three full-width
diagram control topics. The R59 retained 40-question stress PDFs used
**5 Letter and 4 A4 pages** for each of the eight teacher answer topics.
R60's Node tests reject any compact answer key that still needs more
than four pages, or expands unexpectedly relative to student sheets.
A separate PyMuPDF auditor examines **38 actual exported PDFs**,
including each question-number location, every answer marker, column
gutter margins, full-width chart preservation, empty/orphan pages,
paper MediaBoxes and question sequence. CI retains these as the
\`r60-teacher-key-print-layout\` artifact with a machine-readable report.
The all-51-topic maximum-count PDF content, collision, glyph, vector and
print-margin audits also remain mandatory; a dense teacher key is not
accepted if it drops content or creates visual overlaps.

Scope: **digital vector-PDF and browser QA**, not a schoolteacher's
formal visual approval. Physical scale, printer margins, contrast,
handwriting comfort and duplex classroom printing still require actual
paper and a human. The Cloudflare preview remains \`noindex,nofollow\`
with no purchased production domain, and the deployed Cloudflare commit
SHA must be verified separately from GitHub CI.

### R61 — diagram-based calculation handwriting space and printed-row acceptance

The existing PDF offered topic-specific pencil rules for fractions and
equations, digit-aware long-division scratch rows, and an optional extra-room
setting. A printability audit found that **calculation-based geometry
illustrations had no default calculation lines below the picture**.
Students using the standard setting were forced to write around or over the
printed diagram. The question/answer/steps math and the 51 indexed-candidate
route definitions were not changed.

The standard **student questions** PDF now includes one full-width line
under simpler shape area and angle calculations, or two for multi-step
triangle/parallelogram/trapezoid area, volume, surface area, and Pythagorean
problems, on ten verified geometry topics. Opt-in *Extra writing room* adds
one further line to those drawings. These lines are included in
font-measured question heights **before pagination**; their 21pt spacing
and the full-width 40pt-margin geometry layout remain unchanged.
Statistics reading/plotting, basic angle recognition, long division, the
calibrated protractor and other specialized figures receive no new default
rules. The last two retain their original integrated work/scale layouts.
Teacher answer keys and worked steps NEVER gain question-writing guides.

Regression evidence is emitted by
\`npm run qa:geometry-writing-room\`, which generates **90 real PDFs**
for 15 topics (10 calculation families and 5 unchanged controls),
both Letter and A4, across standard questions, extra-room questions
and corresponding teacher answers. An independent PyMuPDF check reads
actual stroked PDF lines, matches them to the correct numbered problem,
checks that all are beneath each diagram and clear of the next prompt,
checks accurate 21pt rule spacing, paper-safe margins, PDF page sequence,
answer isolation and 8/8 exercises without loss. Deliberately corrupted
line layouts are covered by Python adversarial tests. Existing
51-generator maximum-count exports, fraction bar vector inspection,
long-division guide checks, line collision/margin audits, browser smoke
and Firefox QA remain in the blocking CI pipeline.

The evidence is **digital-print only**, not proof that a real teacher
prefers the writing dimensions or that the user's physical printer
reproduces PDF vectors at 100% scale. Schoolteacher approval, measured
A4/Letter test prints and Cloudflare deployed commit confirmation are
separate pending gates. Preview remains \`noindex,nofollow\`, and no
production domain has been purchased or approved for indexation.

### R62 — source-grounded SEO coverage, honest intent fit and conditional GEO markup

The 488 owner-supplied keyword rows are **research evidence**, not permission to
claim every query is supported or a promise of search traffic. The entire
original CSV remains unchanged. The first detailed intent audit identified
**21 specific potential mismatches**: 10 unsupported capabilities, 5 queries
better routed to a separate specialist page, and 6 requiring human search
intent review. Examples include circle area on a rectangle/square area
generator, cylinder and composite-figure surface area on a cube/prism
generator, decimal division on an integer-division tool, and polynomial
addition/subtraction on a numeric arithmetic generator. **This is only an
initial audit of particular outliers**: the remaining 467 unflagged keywords
are NOT individually certified for exact search-intent fit.

- \`src/data/seo-targets.json\` selects **exactly one original, source-backed
  primary keyword for each of the 51 implemented pages** (43 independent
  specialized tools, eight general hubs). Original monthly volume/KD values
  remain in the data for source traceability and are **not** represented as
  current validated Google metrics.
- \`src/data/seo-intent-review.json\` records the 21 exact source phrases,
  source route, mismatch classification and evidence-based reason.
  No issue phrase may be silently promoted to a selected primary keyword.
- All **43 specialist pages** now have a specific, visible focus section
  with an exact evidence-backed worksheet title and the generator's **real
  configuration choices** sourced from \`topicOptionsFor()\`, plus its actual
  PDF formats and honest step-solution availability. General claims of
  school-grade certification are intentionally excluded.
- The **8 broad hubs** explain their actual limited practice scope and link
  to available specialist generators when an existing reviewed skill
  relationship exists. They continue to be excluded from public indexation.
- Approved real-domain specialist routes may later emit truthful
  \`WebApplication\`, \`LearningResource\` and \`BreadcrumbList\` JSON-LD in
  one graph. The conditional schema is **never emitted on the unapproved
  pages.dev preview**, where \`noindex,nofollow\`, no canonical and an
  empty public sitemap remain the intended configuration. JSON-LD does not
  guarantee Google rich results or any ranking.
- \`npm run audit:static\` now validates **51 route-to-primary exact-source
  matches**, unchanged source volume/KD, the 43 visible specialist focus
  sections, eight hub scope notes and exclusion of flagged search phrases
  from the focused page copy. \`tests/r62-seo-intent.test.mjs\` tests source
  mapping and the fail-closed indexation policy.
- \`npm run qa:seo-readiness\` generates a downloadable, machine-readable
  **488-row** source keyword audit with each original query, mapped route,
  historic source metrics, exact target and explicit review status. CI
  archives this under \`r62-source-keyword-intent-audit\`.

**Release remains blocked** until a real custom domain is purchased,
actual Cloudflare production SHA is verified, each tool page is judged
against its live SERP intent, the eight hubs are separately reviewed, and
appropriate physical print/teacher QA plus Google Search Console checks
are done. Do not activate indexation or submit the preview domain. Any
future reclassification or remapping must preserve the owner's source
data and report what actually changed.

### R63 — expanded source-keyword search-intent audit and actual tool-choice pathways

This revision continues the R62 source-vs-implemented-feature review; it
does not invent keyword data or fabricate search performance. The original
\`src/data/keyword-evidence.csv\` with all 488 original phrases and
historical Semrush fields is unchanged.

The new \`src/data/seo-intent-r63.json\` records **124 further exact-phrase**
triage issues after checking the real \`math.ts\` generator behavior. Together
with the initial 21 R62 flags, **145 original keyword mappings** have
specific reasons requiring action: **67 unsupported by current features,
19 pointing at an incorrect tool, 59 requiring search-intent/feature
review**. The other **343** are not thereby individually Google-SERP
verified, and none gains automatic index approval. The flags carry their
original source keyword and route rather than mutating the input table.
“Wrong page” is a proposal to review the real alternative generator
rather than an automatic redirect or canonical change.

Concrete distinctions include decimal vs integer division, static
multiplication charts vs generated fact drills, composite/circle/cylinder
shape requests vs the supported flat area/cube/rectangular-prism models,
mixed-number multipliers vs current fraction×fraction generators,
word-problem multiplication vs numeric-only drills, and function graphing
vs linear-rule evaluation. These are practical capability differences,
not just arbitrary SEO keyword clustering.

Six additional **bidirectional internal task comparisons** now help users
choose an actually supported generator: prism volume vs surface area,
two-digit-by-two-digit vs two-digit-by-one-digit multiplication,
function evaluation vs domain/range and relation classification,
slope calculation vs plotting linear equations, 2D area vs 3D exterior
area, and angle classification vs physical protractor printing. The
existing 24 approved V2 intent relations remain intact; they are not
silently overwritten or counted as new traffic targets.

\`npm run qa:seo-triage\` exports a full **488-row** review report, a
**145-row** issue file, a **19-row** wrong-page recommendation file and a
55-route priority matrix. Every issue has an exact-match source assertion,
a classification/reason, and whether a real specialist page exists.
\`npm run audit:static\` blocks on mispromoted unsupported phrases and
missing reciprocal internal links. The R63 JS tests cover issue
uniqueness, 51 primary focus terms, actual math topic contrasts, and
noindex release safety. CI archives the report under
\`r63-full-keyword-intent-matrix\` on each run.

**The formal launch gate is not lifted:** every real Google SERP still
requires external verification; there is no independently audited new
GSC traffic, teacher review, physical-size print measurement or verified
Cloudflare production SHA. Until a purchased domain and explicit owner
indexation decision, the preview remains \`noindex,nofollow\`, without
production canonical/schema publication.

### R64 — real public competitor page checks and a genuine multiplication table PDF

The first eight highest-value **existing source-backed** math topics
were compared against named external competitor pages on **2026-11-06**,
recorded in \`src/data/serp-observations-r64.json\`. These are
**observed competitor landing-page contents**, not a Google US
location-locked ranking export, current Semrush KD or GSC traffic
report. Source URLs and explicit functional gaps are preserved, and
\`npm run qa:serp-r64\` exports their exact comparisons in CI. Do NOT
write misleading competitive rankings or say that all 43 specialist
topics have completed Google SERP validation: only **eight public
competitor pages** were reviewed this iteration.

A clear gap surfaced on the existing
\`/multiplication-tables-worksheets/\` page: a “multiplication table
worksheet” can mean a **blank 1–12 grid** rather than a shuffled
times-tables fact-drill worksheet. The previous engine produced only
fact questions, while several public competitors offered full
1–12 reference/blank tables. R64 therefore adds a **separate vector
PDF feature**, with two topic-specific buttons:

- **Blank multiplication table (A4 / Letter):** a single real
  13×13 grid (top/left 1–12 headers plus one × corner) with all
  **144 product cells completely empty** for student handwriting.
- **Completed answer reference (A4 / Letter):** the corresponding
  12×12 grid containing **all 144 independently correct products**.
  This chart is not a separate random seed-based 8-question worksheet.
- The original 51 math generators, their deterministic seed, options,
  question-answer correspondence and generator version **v18** remain
  unchanged. Other topics do not gain the new chart controls.

The printable grids are created locally in the browser by
\`src/lib/multiplication-grid.ts\` using pdf-lib rectangles and
text. The topic page distinguishes blank charts from the normal
randomized fact-drill export, includes direct use instructions, and
does not claim an unsupported 0–12 chart, timed test or 1–100 matrix.

\`tests/r64-multiplication-grid.test.mjs\` checks all 144 arithmetic
cells against a separate simple multiplication oracle and loads all
A4/Letter PDF variants. The R64 independent \`PyMuPDF\` auditor checks
the **actual PDF output**: 169 vector squares in each of four PDFs,
144 blank student cells per paper (288 total), and 144 correctly
positioned printed product answers per paper (288 total). Chrome
checks all four downloads and the unchanged random fact-drill
export; Firefox checks the A4 blank and complete answer downloads.
CI retains all four print-ready PDFs, a content report, and
two independently generated page screenshots where available.

Seven previously flagged R63 “printable times-table chart” source
keywords now have a **narrowly implemented feature**, tracked by the
additive overlay \`src/data/seo-r64-resolutions.json\`. Historic
R63 classification data is unchanged; **feature implemented does
not mean Google US SERP verified, approved for indexing or ranked**.
The other 488 keyword source rows and 55 topic contracts remain
unaltered, and \`noindex,nofollow\` stays active on pages.dev.

**Pending:** physical Letter/A4 printer and teacher review; exact
Cloudflare deployment SHA; independently verified real Google US
SERP intent/ranks across all 43 specialized routes; custom domain;
GSC indexing/ranking tests. No broad SEO release is authorized.

### R65 — optional exact decimal and fraction equations without changing 51 original generators

R64 public competitor comparisons identified a legitimate problem type gap:
the existing one- and two-step equation tools generated **integer**
examples, while comparable sites offered decimal and fraction exercises.
Both existing equation pages now have a **separate, opt-in** panel to
print decimal or fraction equation practice. This is implemented math,
not extra SEO-only text.

- **One-step:** equation forms **x + b = c** (including negative b,
  displayed as subtraction) and **ax = c**, both with exact decimal
  or reduced rational values and a noninteger solution.
- **Two-step:** **ax + b = c** with a nonzero signed coefficient;
  the page's positive/negative coefficient selector affects the
  extension as well as the original generator.
- **Configuration:** uses the visible 32-bit seed, difficulty, 4–40
  questions, equation-form selector, A4/Letter paper and the extra
  writing-room setting. For identical extra packs, reproduce the
  same seed, number type, difficulty, question count and options.
- **Exports:** three real vector PDFs for each extra pack: student
  questions with handwriting rules (no answer leak), a matching
  answer key, and worked algebra/check steps. All questions and
  answers use exact BigInt rational arithmetic, not rounded
  JavaScript floating-point values.
- **Identity safety:** this is a separate **R65.1** extension,
  not a change to the original seeded **generator v18** math,
  question signatures, 51 other generators or their old shared
  URLs. The original Copy reproducible link applies to the original
  integer worksheet only; it does not include the separate
  extension number-type selector. Do not claim otherwise.
- **Validation:** \`tests/r65-equation-packs.test.mjs\` runs
  independent rational arithmetic oracles over multiple seeds,
  number types, problem forms and paper sizes, and rejects altered
  answers at the PDF boundary.
  \`scripts/export-equation-packs-r65.mjs\` writes **24 actual PDFs**:
  2 topics × 2 number types × A4/Letter × 3 output modes,
  accompanied by a full question manifest.
  \`scripts/check-equation-packs-r65.py\` uses an independent Python
  \`fractions.Fraction\` solver to re-solve all printed PDF questions
  and compare the printed answers, verify student answer isolation,
  pencil rules, printed step-check lines, and safe page dimensions.
  Chromium and Firefox also click the actual download controls.
- **SEO honesty:** the original source evidence includes
  \`one step equations worksheet\` (reported 2,900 monthly
  queries, KD 6) and \`two step equations worksheet\` (4,400,
  KD 10), but these are **older supplied Semrush snapshots**,
  not verified current Google US Volume/KD/rank or real GSC
  traffic. The additive page capability status is in
  \`src/data/seo-r65-equation-capability.json\`.
  The extension does **not** provide word problems, new grades,
  general inequalities or curriculum alignment.

This iteration does not authorize publication: the Cloudflare
pages.dev preview stays \`noindex,nofollow\`. A custom domain,
owner page-by-page index authorization, confirmed deployed SHA,
real teacher/physical printer QA and independently verifiable
Google US SERP/GSC observations are separate launch conditions.

### R66 — source-backed fraction number lines, real vectors and separate student/answer PDFs

The R63 exact-intent audit identified three **actual owner-provided
keywords** incorrectly tied to the arithmetic-only fractions generator:

| Supplied keyword | Old supplied monthly volume | Old supplied Semrush KD |
| --- | ---: | ---: |
| fractions on a number line worksheet | 1,300 | 9 |
| number line fractions worksheet | 590 | 15 |
| fraction number lines worksheet | 480 | 11 |

These values are historical **source snapshots**, not a fresh 2026-11-06
Google US ranking check. They are **not additive traffic estimates**.
Independent public competitor-page inspection at
\`mathworksheets4kids.com/fraction-number-line.php\`,
\`k5print.com/fraction-number-line/\` and
\`mathpicnic.com/worksheets/fractions/on-a-number-line/\`
corroborated two concrete teacher tasks: **identify the fraction at a
marked dot** and **plot a provided fraction on an equally divided
number line**. Competitors also offer features R66 does not copy,
including fraction addition hops, mixed-number story problems and
equivalent-fraction chart families. Their existence is not evidence
of current Google ranks or our likely traffic.

R66 adds actual **opt-in vector PDF generation** to the existing
\`/number-line-worksheets/\` and \`/fractions-worksheets/\` pages:

- Two separate tasks: **Name the point** with one preprinted correct
  dot, or **Plot the fraction** where students receive only the
  correctly partitioned blank number line.
- Two explicit ranges: **0–1** with proper fractions, or **0–2**
  including improper fractions. Denominators: 2,3,4,5,6,8,10,12.
  Each unit is divided exactly, with distinct visible whole-number
  ticks; reducible values show the original fraction and its
  simplified equivalent in the teacher key.
- Reuses the visible 32-bit seed, difficulty, question count
  (1–40 in the extension), and Letter/A4 paper setting.
  Larger worksheets continue to use larger denominators once
  easy sets are exhausted. Eight questions fit a single page;
  forty questions paginate to five.
- **Student and answer PDFs are separate**, and a plot-task student
  sheet has no target dot. The accompanying teacher sheet provides
  the exact target dot and fraction label. No answers are leaked
  into student identification exercises.
- Completely additive **R66.1** capability: the stable original
  v18 integer number-line and fractions arithmetic questions,
  topic option values, existing old share URLs and 51 generator
  regression contracts are unchanged. The original Copy link
  does not currently encode the extension task/range selectors.
- \`tests/r66-fraction-number-lines.test.mjs\` checks exact
  rational tick positions, adversarial field corruption, 40
  distinct problems per configuration, seed determinism, old
  v18 compatibility, and all 32 test PDF structures.
  \`scripts/export-fraction-number-lines-r66.mjs\` exports
  **32 real A4/Letter question/answer PDFs**, with an exact
  question and fraction manifest. The independent
  \`scripts/check-fraction-number-lines-r66.py\` uses PyMuPDF
  to check true vector axis lines, each division tick, the
  numerically correct printed dot center and correct separation
  of student/teacher answers. Chromium downloads 16 combinations,
  Firefox exercises both subject pages.
- \`src/data/seo-r66-fraction-line-capability.json\` overlays
  the three historical R63 "unsupported" entries with the
  narrow, **actually implemented** feature. The original 488
  keyword rows and R63 historical issue records remain intact.
  Function implementation is **not** live SERP validation or an
  indexing decision.

**Launch gates unchanged:** \`math-works.pages.dev\` remains
\`noindex,nofollow\`; no production canonical/index release until
owner-provided custom domain, verified deployment SHA, selective
live SERP review, real Google Search Console evidence and
physical A4/Letter printer/teacher acceptance tests are completed.

### R67 — exact decimal division practice and PDF proof, not misleading keyword stuffing

R62/R63 exact source keyword audits documented **two original** search
queries that could not honestly be served by the previous integer
division-facts generator:

| Original supplied keyword | Historic reported monthly volume | Historic Semrush KD |
| --- | ---: | ---: |
| decimal division worksheet | 1,300 | 21 |
| decimal division worksheets | 720 | 20 |

These figures remain the owner's old source CSV values. They have not
been refreshed or confirmed using current US Google ranking data; the
query volumes overlap and must **not** be added into a site traffic forecast.

R67 ships a **real, opt-in** \`R67.1\` decimal-division worksheet pack
within the current \`/division-worksheets/\` page. It can print:

- **Whole-number divisors**, genuinely fractional **decimal divisors**,
  or a mixed set. Students work with exact **noninteger** quotients in
  tenths, hundredths, or a selected mixture.
- The existing visible seed (0–2^32−1), difficulty, number of problems
  (1–40), US Letter/A4 format, and optional extra student writing
  room. The same settings + new divisor/precision selectors reproduce
  the exact same pack.
- Three **separate vector PDFs**: student practice with pencil guide
  lines and no printed answers; an individually matching answer key;
  and a worked solution PDF showing equivalent division after
  multiplying both terms by a power of ten and the explicit original
  multiplication check.
- No rounding, repeated decimals or remainder questions. Decimal
  arithmetic and printing use exact rational BigInt values rather
  than JavaScript floating-point approximations.

The \`R67.1\` extension does **not** alter the existing \`v18\`
integer division facts, any of the 51 original generators, or their
shared-link format. The existing Copy reproducible link applies
to the original integer worksheet; it does not serialize the
new decimal division selectors. A specialist long-division algorithm
layout is **not** being claimed for this new decimal pack.

Quality gates: \`tests/r67-decimal-division.test.mjs\` subjects
**5,400** different arithmetic questions to independent exact
cross-product checks over seed/difficulty/divisor/precision
combinations, plus seeded determinism, corrupt-answer detection,
and A4/Letter PDF modes. \`scripts/export-decimal-division-r67.mjs\`
outputs **24 real print PDFs** with the matching original question
manifest. A separate Python \`fractions.Fraction\` audit
(\`scripts/check-decimal-division-r67.py\`) parses visible questions,
recomputes printed quotients, verifies teacher answers, worked
equations, student writing lines and safe printable margins.
Chromium/Firefox independently click the browser download buttons.

The original \`src/data/keyword-evidence.csv\` and R62/R63
historical flags are unchanged; the additive
\`src/data/seo-r67-decimal-division-capability.json\` states only
that a **narrow real capability** now exists. The broad
\`division-worksheets\` hub is still **not on the approved indexable
route whitelist**. Functional implementation is not an approved
new SEO landing page, live Google SERP win, GSC traffic, or
physical printer/teacher sign-off.

Do not submit \`math-works.pages.dev\` for indexing.
Custom HTTPS domain, owner-approved specialized pages, confirmed
Cloudflare deployed SHA, physical A4/Letter printing, independent
teacher review, Google US SERP and GSC checks remain launch gates.

### R68 — exact vertical decimal addition and subtraction, source-backed real features

The original user-provided Semrush CSV contains **four actual** historically
flagged missing-capability phrases, now narrow-matched by real functionality:

| Original keyword | Historic monthly Volume | Historic KD | Supplied route |
| --- | ---: | ---: | --- |
| adding subtracting decimals worksheet | 1,600 | 21 | subtraction-worksheets |
| adding and subtracting decimals worksheets | 1,600 | 28 | subtraction-worksheets |
| adding and subtracting with decimals worksheet | 720 | 26 | subtraction-worksheets |
| addition problems with decimals | 720 | 22 | addition-worksheets |

These are **older keyword snapshots, not 2026-11-06 live Google US ranks**.
Overlapping search volumes cannot be summed into an estimated site
traffic figure. The historical CSV's **488 rows and original mappings**
remain unmodified, and the R63 unsupported history is preserved.

The three existing \`/addition-worksheets/\`,
\`/subtraction-worksheets/\` and
\`/mixed-addition-subtraction-worksheets/\` pages now include a
separate **R68.1 vertical decimal-column practice pack**:

- Operation: mixed addition and subtraction, only addition, or only
  subtraction. The addition page defaults to addition; subtraction
  and mixed pages default to mixed practice in the extension.
- Exact tenths, exact hundredths, or both (different precisions
  between questions). Both operands within one problem always have
  the same number of printed fractional places, so decimal points
  visibly align in the vertical equation and teacher answer.
- Real **carry/borrow** screening: require at least one carry or
  borrow, forbid all carrying and borrowing, or mix both kinds.
  Distinct values are generated deterministically with no negative
  subtraction result. All answers are integer-unit fixed-point
  arithmetic: no binary floating-point rounding.
- **Separate** vector PDF download buttons for the student's
  vertical columns with blank answer areas, teacher solution columns,
  and a three-step teacher explanation with inverse-operation checks.
  US Letter and A4, the user's normal difficulty, question count
  (1–40), 32-bit random seed and extra student writing room apply.
- The existing whole-number **v18** practice, all original 51
  worksheet types, answer checker, standard PDF buttons and
  original share URL format remain untouched. The original
  Copy reproducible link **does not encode the R68 decimal
  selectors**; use the same seed and choices to reproduce each
  extra pack.

Quality evidence:
\`tests/r68-decimal-add-sub.test.mjs\` uses an independent BigInt
integer-unit oracle to verify **16,200 generated problems** across
mixed/+/- operations, decimal places, regrouping modes, difficulty
settings and diverse seeds; it also checks 54 independent A4/Letter
PDF combinations, tampering, reproducibility and v18 invariants.
\`scripts/export-decimal-add-sub-r68.mjs\` exports **36 actual PDFs**
covering three operation forms, tenths/hundredths, A4/Letter, and
student/answer/steps modes.
\`scripts/check-decimal-add-sub-r68.py\` uses Python's independent
\`Decimal\` to recompute **visible printed equations** and PyMuPDF
glyph positions to verify the actual decimal-point columns align
within printer coordinates, that the student file contains only
blank result lines, and that teacher answers and worked checks
appear on the matching sheets. CI also runs Chromium and Firefox
button-initiated downloads and preserves printable PDFs for
independent human inspection.

**Not implemented/claimed:** negative differences, thousandths,
money or measurement story problems, uneven precision within a
single problem, Google classroom integration, digital stylus
marking or per-student assignment workflows.
Public competitor references:
\`commoncoresheets.com/adding-subtraction-decimals-vertical/225/download\`
and \`mathpicnic.com/worksheets/decimals/adding-and-subtracting/\`
confirm vertical decimal alignment and separately keyed practice
as real teacher-facing tasks; no current US Google ranking was
measured.

**SEO and launch gates:** The Cloudflare \`pages.dev\` preview
remains \`noindex,nofollow\`. The broad historic subtraction route
is not automatically approved for search indexing because of this
addition. A purchased custom domain, verified Cloudflare deployed
commit, real Google US SERP/GSC information, topic-specific
index-approval and physical printer/teacher acceptance still require
separate checks.

### R69 — source-backed exact fraction/decimal two-way printable conversion

The original user-provided 488-row keyword source and R63 semantic audit
identify **four** previously unsupported fraction conversion intents:

| Original owner keyword | Historical monthly Volume | Historical KD |
| --- | ---: | ---: |
| fractions to decimals worksheet | 1,300 | 24 |
| decimal to fraction and fraction to decimal worksheet | 1,300 | 24 |
| converting from fractions to decimals worksheet | 1,000 | 24 |
| fractions into decimals worksheet | 720 | 21 |

These numbers were **supplied historical Semrush snapshots**, not
live 2026-11-06 Google US search/ranking checks. Overlapping queries
must not be added into a predicted traffic number. Do not rewrite the
original keyword CSV or historical R63 flags.

R69 adds a genuine separate **R69.1** conversion pack to the existing
\`/fractions-worksheets/\` page, preserving the v18 original 51-topic
generator:

- **Fraction → decimal:** reduced (sometimes improper) fractions to
  exact terminating decimals, without rounding or approximations.
- **Decimal → fraction in lowest terms:** exact tenths,
  hundredths or thousandths converted to reduced positive fractions.
- **Mixed two-way conversion:** alternating both directions and,
  when selected, all three decimal precisions.
- The original controls' seed (0–2³²−1), difficulty, question count
  (1–40), US Letter/A4 paper and extra writing room apply.
- Three separate PDF downloads: a **student sheet with a real
  numerator / vector fraction bar / denominator** and blank
  response line, a matching **answer key** and a **worked steps**
  PDF including the equivalent denominator and independent check.
- Decimal arithmetic uses integers in **one-thousandth units**,
  and all reduced fractions follow the exact greatest-common-
  divisor. Fractions with repeating decimal expansions and
  rounded/approximate exercises are excluded.
- The original v18 fractions arithmetic generator, current
  preview, standard answer PDF/answer checker and Copy
  reproducible link stay untouched. The existing share link does
  **not yet encode** the separate R69 direction/precision selectors.

Tests in \`tests/r69-fraction-decimal-conversion.test.mjs\`
independently check **7,200 exact conversions** using BigInt
cross-products, simplified fraction invariants, deterministic
reproduction, corrupted-answer rejection, **54 A4/Letter PDF modes**,
and all four original exact-source keyword assertions.
\`scripts/export-fraction-decimal-r69.mjs\` produces **54 real PDFs**
with a complete row-level manifest. A separate Python audit
(\`scripts/check-fraction-decimal-r69.py\`) reads the **actual
visible PDF text**, recomputes conversions with independent
\`Decimal\` and \`Fraction\`, verifies true vector fraction bars,
blank student answer lines, real teacher answers, margin safety
and printed check steps. Chromium and Firefox test buttons.

Competitor examples at
\`mathworksheets4kids.com/convert-fractions-decimals.php\`
show printable separate one-way and mixed conversions; public
example \`mathworksheets4kids.com/convert/fractions-decimals/fractions-and-decimals-level2-3.pdf\`
shows real question types. These observations demonstrate task
semantics, **not** competitor rank, KD freshness or likely revenue.

**Limits and release gates:** no negative input, fraction strips,
percent conversions, repeating decimals or claimed grade alignment.
Cloudflare \`math-works.pages.dev\` remains
\`noindex,nofollow\`. A production domain, physical A4/Letter printer
check, teacher signoff, current Google US SERP/GSC evidence, verified
Cloudflare deployment SHA and explicit approved route-index list are
independent future launch requirements. CI pass alone does not
authorize indexing or imply organic traffic.

### R70–R72 — correct semantic keyword routing and ship real math visuals

After R69, 51 generators and the 488 **unchanged** owner-supplied
Semrush rows had 145 historical semantic-intent flags. R70 reviews
the **19 wrong-page** records individually. A separate correction
overlay in \`src/data/seo-routing-r70.json\` safely points **15**
to genuine implemented specialist routes. **Four** ambiguous
two- or three-digit multiplication searches are deliberately held
for actual Google US SERP inspection, rather than advertising a
2×2 or 3×2 algorithm for a query that may mean something else.

The original CSV, source candidate route column, R62/R63 triage
history and KD/Volume values are **not overwritten**.
\`src/lib/seo-routing-r70.ts\` and \`src/pages/[slug]/index.astro\`
add contextual **links to working specialist tools** from formerly
misrouted parent pages. Their existence does not authorize public
indexation, assert ranking position or imply that Google redirects
can be configured on the owner-less preview.

\`npm run qa:seo-remap\` exports the **488 original terms** with
source and reviewed-effective routes, dispositions, 19 review
records, unresolved issue queue and clear launch gates. In the R72
state, **15** source-to-specialist corrections and **22** new
capability resolutions from R66–R72 leave **108 historically flagged
issues**: 45 still unsupported, 59 awaiting semantic/SERP review
and 4 ambiguous misroutes. The other 343 terms have not
individually passed live US SERP inspection; no claims of fully
verified 488-term SEO readiness are made.

#### R71 — actual multiplication/division facts, inverse families and area models

An **opt-in R71.1 pack** on both
\`/multiplication-worksheets/\` and \`/division-worksheets/\`
prints one of three distinct math tasks:

- **Mixed multiplication and division:** alternate exact products
  and quotients with no remainders. Deduplicate by the actual
  **visible problem**, not hidden factor ordering, to prevent
  repeated questions in 40-question batches.
- **Fact families:** give two distinct factors and their product.
  Students complete four genuinely linked multiplication/division
  equations. The teacher key prints all four identities.
- **Area-model multiplication** (multiplication page only):
  choose 2-digit × 1-digit, 2-digit × 2-digit or mixed problems.
  A true rectangle is partitioned into tens and units across
  both dimensions; student partial-product cells are blank, and
  teacher cells plus worked solutions use exact integer partial
  products. Diagrams are expressly *schematic / not to scale*.

All three modes download genuine A4/Letter **student, answer and
worked-step vector PDFs**, using visible seed, difficulty and 1–40
question settings. Original generator v18, existing share links and
standard PDF buttons are unchanged. The old Copy link does **not**
encode these independent R71 selections.

\`tests/r71-multiplication-division-practice.test.mjs\` checks
thousands of seeded problems, independent products, division and
every cell's area arithmetic. \`scripts/export-multiplication-division-r71.mjs\`
provides 30 actual PDFs with original rows. The Python/PyMuPDF
oracle \`scripts/check-multiplication-division-r71.py\` compares
visible math and vector rectangle geometry with each problem and
rejects student answer leakage. Chromium/Firefox click PDF buttons.

Exactly **eight** former unsupported source phrases now match the
implemented narrower tasks; see
\`src/data/seo-r71-mult-div-capability.json\`. “Multiplication
arrays” (dot grid), story problems, and lattice multiplication
**remain unimplemented** and are not SEO claims.

#### R72 — genuine equal-whole printable fraction strips

The \`/fractions-worksheets/\` page adds two more **real PDF**
buttons: a blank, colorable fraction strip chart and a
unit-fraction labelled teacher chart. Every bar is **420 PDF
points wide**, with equal 1/n cell sizes. Choose basic rows
1, 2, 3, 4, 6, 8 or extended rows that also include 5, 10, 12.
US Letter and A4 are single-page, printer-friendly vector
charts. Since this is a **fixed reference chart**, the original
random seed and question quantity do *not* affect it.

The source-backed \`fraction strips printable\` query (historically
1,000 monthly searches, KD 22) now has an actual matching diagram;
other generic “fraction pictures” queries **do not** automatically
count as resolved. \`tests/r72-fraction-strips.test.mjs\` checks
partition math, answer isolation, all 8 paper/mode variants and
tampering. \`scripts/check-fraction-strips-r72.py\` measures real
PDF vector paths and exact printed fractions independently.
Human/physical printing signoff is a separate future step.

**Indexation:** all preview routes remain \`noindex,nofollow\`
without canonical/schema emission. Do not approve the 8 hubs,
4 HOLD routes or any other URLs for real search indexing before
the domain and owner-approved SEO release process.

### R73 — exact, interpreted division word problems and 488-keyword current status

The source-preserving R73 improvement targets two **actual owner-supplied**
historical Semrush phrases, rather than invented topics:

| Owner source keyword | Historic Volume | Historic Semrush KD | Existing route |
| --- | ---: | ---: | --- |
| division word problems | 1,300 | 28 | division-worksheets |
| division word problems for 4th graders | 320 | 17 | division-worksheets |

These values are older source rows, **not** freshly measured US Google
traffic, SERP positions or KD. Do not add overlapping phrase volumes
into a traffic forecast.

The existing \`/division-worksheets/\` page now offers a separate
opt-in **R73.1** contextual division problem panel. The printable
generator covers **four genuinely different mathematical decisions**:

- **Equal sharing:** divide a total equally into classrooms or clubs;
  the required quotient is the amount **per group**, no remainder.
- **Full groups and leftovers:** calculate the number of complete
  boxes or seed packets **and** report the nonzero remainder.
- **Round up transport:** if a few students are left over, **one more
  minibus or shuttle** is needed; the contextual answer is
  \`floor(total / seats) + 1\`, not merely the quotient.
- **Leftover only:** for completed cards/cakes, the answer is
  **just the number of unused materials**.

A \`mixed\` option cycles these four skills; the original seed,
difficulty, question count (1–40), A4/Letter paper and optional
extra student writing room govern the authentic PDF packs. Each
individual question has exact integer quotient and remainder
checks, explicit story units and a worked explanation of **what
the remainder means in that context**.

Three separate genuine vector downloads are provided:
**student problems with blank equation/answer rules**, **teacher
answer key with units**, and **worked-step PDF** showing
\`divisor × whole quotient + remainder = total\`.
The source v18 division-facts generator, live main preview, existing
answer checker and Copy reproducible link remain unchanged.
Existing share URLs do **not** record the extra R73 mode selector.

Testing: \`tests/r73-division-word-problems.test.mjs\` independently
checks 3,000 deterministic problem instances over five modes,
three difficulties and varied seeds; it rejects tampered stories,
quotients, remainders, units, answers and worked checks and
verifies all 30 true A4/Letter PDF combinations.
\`scripts/export-division-word-problems-r73.mjs\` emits
30 genuine printable student/answer/steps PDFs with original
problem manifests. \`scripts/check-division-word-problems-r73.py\`
then reads **actual PDF text and drawing operators**, recomputes
whole division using Python's \`divmod\`, validates the story-specific
answer units, visible calculations, blank student writing lines,
teacher answer isolation and safe printer margins.
Chromium and Firefox download actual files from the browser.

**Keyword coverage freshness:** the prior R70 evidence snapshot was
correct *as of its own scope* but did not reflect added R71/R72/R73
functional capabilities. \`npm run qa:seo-progress\` now produces a
new **source-preserving 488-keyword report** covering all completed
R66–R73 functional changes. Current breakdown, as coded and checked
against the owner CSV, is: **24** historically unsupported phrases
with actual new functions, **15** historically misrouted phrases
mapped to implemented specialists, **4** ambiguous misroutes
held for independent SERP checks, **43** still unsupported functions,
**59** requiring additional intent assessment, and **343** not
individually SERP reviewed. **106 previously flagged issues remain**
(43 + 59 + 4); neither the 488 historical source rows nor R62/R63
historical review decisions are overwritten.

Competitor task context from
\`commoncoresheets.com/interpreting-remainders-in-division-word-problems/556\`
and
\`k5learning.com/free-math-worksheets/fourth-grade-4/word-problems/multiplication-division\`
indicates interpretation of remainders is a real learner need,
but **does not verify any Google US ranking**.
R73 supports one-step whole-number division with divisors 2–9,
not multistep algebra, signed fractions or an official grade
certificate.

**Launch gates remain unchanged:** \`math-works.pages.dev\` is
\`noindex,nofollow\`, with no automatic canonical/schema/index
release. Purchasing a custom domain, real printer and teacher
acceptance testing, verified Cloudflare deployed commit,
current independent US SERP/GSC evidence and explicit
page-by-page index approval remain separate prerequisites.
