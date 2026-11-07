# R94 — License-scope triage of 14 machine-flagged records

**Status: technical inventory, human legal review NOT DONE.** Baseline: R93 package-lock.json, 296 third-party entries, 14 GPL/LGPL/mixed-license flags, and 0 known npm advisories in the recorded dated scan. Future releases require fresh scans.

## Exactly 14 flagged records: all optional development dependencies

The **10 libvips packages (version 1.3.4, LGPL-3.0-or-later)** are:

- @img/sharp-libvips-darwin-arm64
- @img/sharp-libvips-darwin-x64
- @img/sharp-libvips-linux-arm
- @img/sharp-libvips-linux-arm64
- @img/sharp-libvips-linux-ppc64
- @img/sharp-libvips-linux-riscv64
- @img/sharp-libvips-linux-s390x
- @img/sharp-libvips-linux-x64
- @img/sharp-libvips-linuxmusl-arm64
- @img/sharp-libvips-linuxmusl-x64

The **4 Sharp platform packages (version 0.35.5)** are:

| Package | SPDX license declared in lock |
|---|---|
| @img/sharp-wasm32 | Apache-2.0 AND LGPL-3.0-or-later AND MIT |
| @img/sharp-win32-arm64 | Apache-2.0 AND LGPL-3.0-or-later |
| @img/sharp-win32-ia32 | Apache-2.0 AND LGPL-3.0-or-later |
| @img/sharp-win32-x64 | Apache-2.0 AND LGPL-3.0-or-later |

**Interpretation:** 14 lockfile records belong to one Sharp/libvips-related build-tool family. They are not 14 different declared direct runtime dependencies. The declared direct runtime dependencies are Astro and pdf-lib; Sharp is a declared top-level devDependency. Optional platform packages may not be installed on each operating system. These facts do not by themselves resolve license obligations.

## Required steps for a qualified human reviewer

1. Preserve the exact lockfile, installed license/NOTICE texts, active CI platform and source release SHA. Review the actual distributed artifacts, not just npm SPDX fields.
2. Independently inspect the deployed Cloudflare dist directory for any Sharp/libvips binary, WASM payload, linked library, source archive, or bundled tool; keep actual path/hash evidence. Static generated images alone are not evidence of shipping a Sharp binary.
3. Separately establish whether build tools, npm dependencies, source archives, containers or installation bundles are redistributed to third parties in any other channel.
4. For each truly distributed licensed component, determine applicable notice, copyright, license text, modification, source and relinking requirements according to the relevant license and actual distribution facts.
5. Record reviewer identity, review date, release SHA, decision, outstanding obligations and signed approval. Until then: **PENDING LEGAL REVIEW**.

The 408-case teacher review, physical 50 ± 1 mm printer calibration, real NVDA/VoiceOver, domain and GSC remain independent gates; none is approved by this inventory.
