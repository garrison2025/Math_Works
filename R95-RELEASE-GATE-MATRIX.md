# R95 final release gate matrix — Math Worksheet Studio

> **SUPERSEDED FOR RELEASE POLICY on 2026-11-08:** See [ONLINE-RELEASE-ACCEPTANCE.md](ONLINE-RELEASE-ACCEPTANCE.md). By express owner direction, the mandatory physical-printer measurements, signed teacher 408-case review and hands-on real-device/screen-reader gate below are **waived, not PASS**. Keep their historical NOT RUN records for truthful disclosure. Digital mathematical/browser/PDF QA and deployment confirmation still apply; actual owned domain, GSC and public indexing remain separate. The table below is a **historical R95 snapshot**, not the active release checklist.

> Technical work and real-world acceptance are separate. This document MUST NOT be interpreted as sign-off. R95 expands the independently checked **base worksheet steps**; specialized R66–R86 PDF packs still have separate audits and remain independently scoped.

## Evidence inventory and acceptance criteria

| Gate | Automated evidence | Still required for owner sign-off | Release status |
|---|---|---|---|
| 51 actual working generators | R95 independent step oracle, math answer oracle, seeded variants and 612-PDF max-count stress; CI artifacts bound to exact SHA | Qualified teacher must still review pedagogy | PENDING R95 COMPLETE CI / HUMAN |
| 488 approved source terms / 55 intents | R89/R90 keyword-routing QA, 51 working paths, four intentionally held paths | No fresh keyword research; verify target copy in live launch | V2 SOURCE ACCEPTED, NO LIVE SEO SIGN-OFF |
| Teacher review | 408 original fixed-seed sample rows (8 per 51 routes), student/key/step packet | Teacher opens actual matching PDFs and marks ALL rows math/clarity/diagram/curriculum PASS with name/date, and resolves every FAIL | NOT RUN |
| Physical Letter and A4 | Digital PDF dimensions/line vectors, 100mm X/Y, 50mm and 25mm scale kit | Print BOTH papers Actual Size 100%, measure physical ruler line 49–51mm, compare real protractor orientation, answer isolation, clear margins and writing room; record printer+driver+date+signed evidence | NOT RUN |
| Accessibility | Chromium 360/390/768/1280/1440 responsive snapshots; Firefox/Chrome auto-QA | Real Windows NVDA with keyboard-only, real iPhone VoiceOver and Android TalkBack, inspect spoken mathematical wording, errors, labels, downloads, printer workflow; retain device/browser versions | NOT RUN |
| Third-party software license | Live npm audit; lockfile license inventory (296 entries, 14 Sharp/libvips optional build-platform flags in the R94 baseline); R95 real dist/ SHA256 and native binary check | Human reviews actual license texts, the exact release distribution channels, NOTICE, source/relinking duties if applicable, signs decision for legal entity and SHA | PENDING HUMAN LEGAL REVIEW |
| Custom .com domain | Pages can build on main, domain configuration documented | Owner purchases a real domain, attaches it to Cloudflare Pages, configures NS/DNS and checks HTTPS + deployed Git SHA | NOT DONE |
| Google Search Console | Indexation code fails closed; preview pages.dev stays noindex,nofollow | Owner verifies actual custom domain in GSC with Google-issued DNS TXT, checks every approved canonical, sitemap, 404 HOLD, manually approves individual URL list | NOT DONE |
| Public search indexing | Separate PUBLIC_INDEXABLE + PUBLIC_INDEXABLE_ROUTES allowlist, main-only | **2026-11-08 override:** see R97 online-only gate; no mandatory teacher/physical/real-device signature, but still requires owned domain, relevant online compliance assessment and explicit URL indexing approval | NOT AUTHORIZED |

## Teacher signature record

- Source SHA: __________  Artifact run URL: __________
- Teacher name/qualifications: __________  Review date: __________
- 408 CSV rows: PASS ____ / FAIL ____ / UNREVIEWED ____ (required total 408)
- All diagrams mathematically aligned? _____  Reading level and pedagogy appropriate? _____
- List linked bugs and evidence: __________
- Final decision: PASS / FAIL / HOLD  Signature: __________

## Printer + assistive-technology record

- Printer make/model, driver and firmware: __________
- Letter: 100mm horizontal ____mm; vertical ____mm; 50mm ____mm; 25mm square ____mm
- A4: 100mm horizontal ____mm; vertical ____mm; 50mm ____mm; 25mm square ____mm
- Paper/driver Actual Size 100% screenshot/photo: __________
- Physical protractor 0° right, 90° up, 180° arc and 50mm ±1mm: PASS / FAIL
- Student/answers sample PDFs checked (topic names & pages): __________
- Windows/NVDA version and signed issues: __________
- iOS/VoiceOver version and signed issues: __________
- Android/TalkBack version and signed issues: __________

## Domain, legal and indexing sign-off record

- Actual owned domain + purchase verification: __________
- Cloudflare custom-domain zone + actual deployed main SHA: __________
- Real HTTPS/canonical/robots/sitemap/404 evidence URLs: __________
- Human license reviewer + approved compliance actions: __________
- Actual Google Search Console DNS TXT verification status (do NOT put raw account token into this file): __________
- First authorized specialized path allowlist: __________
- Owner explicit approval to switch PUBLIC_INDEXABLE: YES / NO (default NO)

**Do not commit personal names, real signed documents, private printer metadata or Google account verification tokens to the public GitHub repository.** Keep completed forms in private storage; record only non-sensitive pass/fail and document hashes in release evidence. Human acceptance is independent of this machine-generated template.

## Workflows and artifacts

- Engineering PR: https://github.com/garrison2025/Math_Works/pull/24
- Historical verified merged-main R93: https://github.com/garrison2025/Math_Works/actions/runs/42359110156
- R93 teacher/printer CI artifact: r93-teacher-and-physical-print-human-signoff-kit (regenerated with R95 scope when CI runs)
- R93 package license evidence: r93-live-npm-audit-and-complete-package-license-inventory
- New R95 public static asset hashes: r95-cloudflare-static-distribution-and-license-scope
- Current preview: https://math-works.pages.dev/  (must remain noindex,nofollow)
