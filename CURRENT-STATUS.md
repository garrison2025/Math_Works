# Math Worksheet Studio — current release status (single source of truth)

**2026-11-07 software feature-closure: MERGED to main; latest merged-main quality checks PASSED. Teacher and physical-print release sign-off remain NOT YET COMPLETED.**

**Last independently verified main deployment:** R91 PR #19 merged as `fcad6781b14b42630da41527f3bdc02f433e9149`. [Merged-main CI](https://github.com/garrison2025/Math_Works/actions/runs/42351072259) **PASS** (167 primary steps, 14 Firefox steps), and Cloudflare Pages reported success on the same SHA. R91 compared 816 exact generated questions and answers across Chromium and Firefox in 102 scenarios (51 built V2 routes, two seeded configs each), with zero differences. R89/R90 preserved the owner's 488 original keywords and shipped six subject directories, 437 non-HOLD search aliases and Terms. R92 npm dependency locking is pending its own PR/CI and release; preview stays `noindex,nofollow`.

## Actual scope
55 user-source route intents: 51 real built math pages / deterministic v18 worksheet generators, 4 deliberate HOLD 404s. 15 core worked-step families have independent base-generator certification; other steps must not be claimed as audited. R66–R86 implemented additional genuine specialist PDF packs. The merged closure adds five specifically scoped real worksheet types and records one previously implemented R71 fact-family capability, without changing the v18 baseline.

## Source-frozen V2.0 keywords (owner-approved development dataset; no new SERP research required)

| Exact code audit status | Rows |
|---|---:|
| Implemented new historical missing feature | 66 |
| Existing R71 inverse fact-family capability | 1 |
| Corrected to an implemented existing route | 15 |
| Missing functional skill among prior unsupported flags | 0 |
| Historical flagged phrases once set aside for SERP review; no longer a development prerequisite | 59 |
| Ambiguous route held for review | 4 |
| Other original source rows retained as provided, without new SERP reviews | 343 |
| **Total** | **488** |

The **63** remaining historical flags and **343** other source rows are archival audit labels, **not a request to re-research the approved V2.0 dataset**. User explicitly directed development to deploy the supplied 488 terms without fresh US SERP or KD checks. Exactly **437** source keyword rows point to the **51 built working pages**; **51** rows belong to **four V2.0 HOLDs** and must not be misrepresented as deployed. Fifteen historically incorrect task links have option-level corrections. Old source Semrush Volume/KD remain snapshots, not ranking or traffic claims.

## Release gates — NOT YET COMPLETED

- Automated engineering: independent seeded math and exact PDF geometry; all 51 original generators, Chrome and Firefox downloads; static metadata, 404 and `noindex,nofollow` gate. The latest merged main passed these automated checks at the SHA stated above. Subsequent releases require fresh evidence.
- Human: teacher mathematical proofreading, accessibility and print-layout visual review, real printer and ruler calibration at Actual Size / 100% **NOT RUN**. These are independent of digital CI.
- Launch: no formal custom domain yet; the owner-approved V2.0 keywords and 24 parent/child functional divisions are the build contract. Verify code, page/task mapping, internal links and rendering against that contract—**do not add a new SERP-research gate**. 0 pages have received a formal indexing sign-off. GSC submission **NOT RUN**; keep pages.dev `noindex,nofollow`.
- Reader privacy: no user account or student answer persistence; future advertising requires audience/child-directed privacy analysis.

**Do not equate code generation, CI-green, and human curriculum/print certification.**

## R92 dependency reproducibility (candidate until green CI and merge)

- A genuine Node 22/npm 10 lockfile pins the entire npm dependency tree; both CI jobs switch from `npm install` to fail-closed `npm ci`.
- `scripts/qa-r92-package-lock.mjs` checks 385 registry entries for HTTPS origins and integrity hashes, and cross-checks direct runtime and development dependencies against package.json.
- Dependency vulnerability/third-party license review is **not** part of this check and remains a separate release quality item. Teacher correctness and physical 100%-scale printing are still human gates.
