# Math Worksheet Studio — Design contract

Audience: US K–8 teachers and parents; primary task: generate printable practice problems and answer keys without login. Surface modes: **Operate** for worksheet editor, **Read** for teaching notes/privacy, **Navigate** for topic library. No marketing funnel.

## Product truth and references

- Content direction only: Math-Drills and MathWorksheets4Kids illustrate the depth of math-topic browsing; visual assets, brand, layout and worksheets are original. Standard math-printing conventions inform paper sizing.
- First-screen success: select topic, inspect real pre-generated problems, choose difficulty/quantity/paper, regenerate and download.
- Maintain 55 candidate routes; 4 HOLD excluded; remaining 51 tool/hub routes are preview-only until quality gates pass.
- `DESIGN_VARIANCE` 4/10, `MOTION_INTENSITY` 2/10, `VISUAL_DENSITY` 6/10. Tools over decoration.

## Tokens

| Token | Value | Purpose |
|---|---|---|
| ink | #172337 | text |
| primary | #1B64A5 | primary action |
| secondary | #187B68 | confirmation |
| paper | #FFFFFF | preview/document |
| canvas | #F5F7FA | workspace |
| border | #D7E0E9 | grouping |
| muted | #62738A | secondary text |

- System sans-serif UI; Arial on print pages, Georgia only for Sigma mark. Large title clamp 32–54px; body 16px; helpers 12–14px.
- Spacing scale 4/8/12/16/24/32/48px; max main width 1320px. Paper previews preserve legibility over extensive decorations.
- Header 74px, controls 320–340px sticky on desktop; one-column at <=960px. At <=630px controls first, contained preview scrolls.
- Controls at least 44px except preview toggles 36px. Visible focus outlines. Feedback/errors in polite live region.
- Animation: 160ms hover/preview polish; no continual or entrance animation. `prefers-reduced-motion` disables transitions.
- Do not add anonymous testimonials, performance figures, fake educator credentials, unapproved API calls or distracting hero video.

## Constraints and known gaps

- Diagram SVGs share the problems' typed `diagramSpec` but do not substitute for a physical printer calibration test.
- PDF uses built-in Helvetica and ASCII mathematical equivalents in its initial iteration; print SVG/HTML uses full Unicode notation. Rich mathematical glyph embedding and equivalence across browser/PDF still require visual acceptance.
- Domain not purchased; page default is noindex and contains no canonical URL.
