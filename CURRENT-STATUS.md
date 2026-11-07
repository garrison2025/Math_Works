# Math Worksheet Studio — current release status (single source of truth)

**2026-11-07 software feature-closure: MERGED to main; latest merged-main quality checks PASSED. Teacher and physical-print release sign-off remain NOT YET COMPLETED.**

**Last independently verified main deployment:** R93 PR #21 merged as `682ef89d5e39b9a4e0005544b59936eae06188bd`. [Merged-main CI](https://github.com/garrison2025/Math_Works/actions/runs/42359110156) **PASS** (175 primary steps, 15 Firefox steps) with Cloudflare Pages reporting success for this exact SHA. Real npm production and complete dependency audits reported zero known advisories at scan time; 296 package license declarations were recorded with 14 LGPL/mixed-license entries flagged for owner legal review. R93 shipped eight more independently reconstructed base arithmetic step families (23 total), 408 real teacher review examples, 56 A4/Letter print/check PDFs and a real Chromium 35-state/5-width responsive and accessibility check. All owner V2.0 488 source keywords, 51 working tools, 4 intentional HOLDs and preview `noindex,nofollow` are unchanged. **Qualified teacher sign-off, physical ruler/printer measurements, real-device screen-reader review, custom-domain ownership and GSC verification are NOT RUN.**

## R94 merged engineering increment (not a human release certificate)

R94 [PR #23](https://github.com/garrison2025/Math_Works/pull/23) merged to main at
commit `9f0bf13d1b7559843138c07af58edbb2d1b28ab6`.
The exact final PR-head SHA `ca460e57954003c76b631f8eea9507806bd36faa` passed
[GitHub Actions run 42361569197](https://github.com/garrison2025/Math_Works/actions/runs/42361569197):
`test-and-build` **success** and `firefox-qa` **success**.
R94 independently reconstructed the worked steps for four additional original-topic families:
complementary/supplementary angles, triangle angle sum, vertical/adjacent angles,
and rectangular prism volume/missing-height problems. Authorized base steps are
**27 topics** (R93 23 + R94 4). The exact full PDF stress gate now requires
**516 PDFs = 204 question + 204 answer + 108 step editions** from 102 cases.
This did not change the 51 built generators, 488 approved keyword evidence rows,
or intentional four HOLDs and noindex rules.

The 14 flagged LGPL/mixed license entries are all optional development platform
packages in the Sharp/libvips family, not 14 separate directly declared production
dependencies; see [R94 license-scope triage](R94-LICENSE-SCOPE-REVIEW.md).
This technical classification does **not** replace human legal review.
R94 merged-main CI and exact-SHA Cloudflare deployment were **not independently
re-verified in this update**; the R93 merged-main verified deployment below
remains the last specifically documented deployment baseline.
Teacher review (408), physical print/ruler, NVDA/VoiceOver, owned domain, GSC
and public indexing all remain **NOT RUN / NOT APPROVED**.

## Actual scope
55 user-source route intents: 51 real built math pages / deterministic v18 worksheet generators, 4 deliberate HOLD 404s. 27 core worked-step families have independent base-generator certification after R94; other steps must not be claimed as audited. R66–R86 implemented additional genuine specialist PDF packs. The merged closure adds five specifically scoped real worksheet types and records one previously implemented R71 fact-family capability, without changing the v18 baseline.

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

R93 completed digitally: live registry advisory and per-package license evidence, 408-row teacher review packet, physical print sample kit and five-viewport automated browser QA. These tools and samples do **not** by themselves sign off a human teacher, physical printer or owned domain. See [RELEASE-R93-OWNER-ACCEPTANCE.md](RELEASE-R93-OWNER-ACCEPTANCE.md).

- Automated engineering: independent seeded math and exact PDF geometry; all 51 original generators, Chrome and Firefox downloads; static metadata, 404 and `noindex,nofollow` gate. The latest merged main passed these automated checks at the SHA stated above. Subsequent releases require fresh evidence.
- Human: teacher mathematical proofreading, accessibility and print-layout visual review, real printer and ruler calibration at Actual Size / 100% **NOT RUN**. These are independent of digital CI.
- Launch: no formal custom domain yet; the owner-approved V2.0 keywords and 24 parent/child functional divisions are the build contract. Verify code, page/task mapping, internal links and rendering against that contract—**do not add a new SERP-research gate**. 0 pages have received a formal indexing sign-off. GSC submission **NOT RUN**; keep pages.dev `noindex,nofollow`.
- Reader privacy: no user account or student answer persistence; future advertising requires audience/child-directed privacy analysis.

**Do not equate code generation, CI-green, and human curriculum/print certification.**

## R92 dependency reproducibility (candidate until green CI and merge)

- A genuine Node 22/npm 10 lockfile pins the entire npm dependency tree; both CI jobs switch from `npm install` to fail-closed `npm ci`.
- `scripts/qa-r92-package-lock.mjs` checks 385 registry entries for HTTPS origins and integrity hashes, and cross-checks direct runtime and development dependencies against package.json.
- Dependency vulnerability/third-party license review is **not** part of this check and remains a separate release quality item. Teacher correctness and physical 100%-scale printing are still human gates.
