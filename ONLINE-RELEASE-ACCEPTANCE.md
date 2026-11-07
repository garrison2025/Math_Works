# R97 — Online-only acceptance policy (owner decision, 2026-11-08)

**Current and controlling release acceptance policy.** The owner explicitly accepts **online/digital verification** and no longer requires in-person or physical/offline testing before proceeding with this website. This supersedes the mandatory offline wording in R93 and R95 release matrices. Historical test results and descriptions of unperformed physical work remain accurate; the *requirement* is waived, **not the physical test result certified**.

## What is required for online technical acceptance

| Area | Required online evidence | Decision rule |
|---|---|---|
| Mathematics and teaching content | Independently reconstructed answers and worked steps across **51 live generator families**; seeded/adversarial cases; question/answer/diagram agreement | CI passes on the exact proposed SHA; failures must be fixed. This is *digital mathematics QA*, not a qualified teacher certification |
| PDF and print geometry | **612 genuine PDFs** over 102 generator/difficulty cases, including student/answer/steps; A4 + Letter page dimensions, text/vector margins, graph positions, 50mm/100mm *PDF-coordinate* rulers, isolated answers and digital visual checks | Validate actual PDF geometry and downloadable files; do not claim measured paper millimeters |
| Browser and UX | Real site output and downloads in automated Chromium and Firefox test suites, 360/390/mobile and desktop responsive checks, keyboard labels and contrast/a11y heuristics, practice-answer checks | Verify test reports, actual browser renders and errors; document known gaps |
| Release assets and dependencies | Build/static content scans, advisory/dependency inventories, distribution-scope audit and any relevant online license/NOTICE review | Escalate unresolved *material* license/compliance issues; absence of shipped Sharp binaries alone is not a blanket legal ruling |
| Deployment | Inspect real public preview HTTP behavior, actual Cloudflare build SHA embedded in HTML, relevant working routes, HOLD 404s, and meta robots | Report deployed SHA separately from GitHub merge SHA; pages.dev stays `noindex,nofollow` |

The existing R96 verified PR-head `ccf46e1a46de91a32a792c0b190b78f5b08b4084` passed both GitHub Actions jobs in [run 42425824237](https://github.com/garrison2025/Math_Works/actions/runs/42425824237), then merged as `dc99e4b0f5a29e4d81ea524f2c2f730f7e7f09e3`. After that merge, the preview HTML on the home page, angles, percentages and number-lines routes was separately checked to expose the same deployed build SHA and `noindex,nofollow`. Subsequent commits require their own checks; this is **not** proof of future deploys.

## No longer release-blocking (owner-waived optional offline checks)

- **Physical printing:** actual A4/Letter printouts, printer-driver configuration, physical 50mm/100mm ruler or protractor measurements, and material cut/sew tests. Digital PDF dimensions and vector paths are still mandatory. No claim of real-paper scale correctness.
- **408-case qualified-teacher signatures:** retain the 408-row sample pack for **optional online review** or spot checks. It is not a mandatory signed offline acceptance gate. No claim of teacher or curriculum certification.
- **Real hardware and assisted-technology lab:** physical iOS/Android devices, NVDA/VoiceOver/TalkBack hands-on checks, or offline keyboard/printing sessions. Automated Chrome/Firefox interaction and accessible markup tests remain mandatory. Do not claim real-device or screen-reader validation.

The waiver does **not** mean unresolved digital defects are accepted. Re-run the corresponding online tests after actual code changes; distinguish verified, observed, unknown and owner-waived.

## Still separate: custom domain, search and compliance

1. **Domain:** no purchased custom `.com` is recorded. Buying/attaching a domain and verifying real HTTPS/DNS is still a factual dependency, not a physical QA task.
2. **Indexing:** `PUBLIC_INDEXABLE` remains false and `PUBLIC_INDEXABLE_ROUTES` empty/unapproved by default; keep all `*.pages.dev` preview pages `noindex,nofollow`. Public indexing requires the owner's later explicit decision, a real owned domain, canonical/sitemap/robots checks and an approved route allowlist. Do **not** infer authorization to turn on indexing from the offline-check waiver.
3. **GSC:** actual domain-property verification, Google-issued DNS TXT and submission cannot be claimed before owner setup.
4. **Ads, school users and privacy:** optional future advertising and child-directed privacy-policy questions still need review. Technical CI is not legal advice or approval.
5. **Release evidence:** preserve exact source/deployed SHA, workflow run URLs and browser/PDF results. Status is not automatically `PASS` just because a physical gate was waived.

## How to report release status

- `ONLINE VERIFIED`: a specifically named test, live page or build has actually been checked against a recorded SHA.
- `OWNER-WAIVED — NOT PHYSICALLY TESTED`: an optional real-world procedure will not block release; never relabel it PASS.
- `PENDING EXTERNAL ACTION`: domain ownership, GSC login/TXT, owner indexing decision or a material unresolved compliance issue.
- `NOT CHECKED`: no reliable evidence available. Do not infer a pass.

This policy supersedes mandatory physical/teacher/real-device steps in [R95-RELEASE-GATE-MATRIX.md](R95-RELEASE-GATE-MATRIX.md) and [RELEASE-R93-OWNER-ACCEPTANCE.md](RELEASE-R93-OWNER-ACCEPTANCE.md). Older release snapshots are retained for history, not current release blockers.
