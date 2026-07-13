---
created_at: 2026-07-13T17:48:00+07:00
track: angular
branch: refactor/showcase-documentation-site
type: implementation-note
---

# Refactor Showcase Documentation Site

## What was requested

Refactor the showcase into a polished documentation site, then repair the reported routing, header, spacing, right-hand anchor overlap, responsive, and accessibility issues across the complete catalog.

## What changed

- EDIT `versions/v19/projects/showcase/src/app/docs/**` and `src/app/layout/**` — expanded the typed catalog to 85 pages, added category/Getting Started surfaces, and centralized routes, versions, aliases, availability, search, pagination, responsive navigation, and accessibility behavior.
- EDIT `versions/v19/projects/showcase/src/app/pages/**` and `src/styles.scss` — standardized example spacing and constrained wide demos away from the right-hand anchor navigation.
- EDIT `scripts/generate-showcase-example-sources.test.mjs` and `published-docs/versions.json` — strengthened dynamic archive/registry integrity checks and corrected three historical counts.
- DELETE `versions/v19/projects/showcase/src/app/docs/core/author-profile.config.ts` — removed unused author configuration.
- SYNC the compatible showcase surface into `versions/v20` and `versions/v21` from the v19 source of truth.
- CREATE `.sdcorejs/documentation/technical-docs/showcase-documentation-site.md` — documented architecture, authoring, accessibility, generation, preview, and validation.

## Decisions made

- Keep v19 as the only authored showcase source and mirror it with the repository sync workflow.
- Keep released Markdown immutable and distinct from current compiled examples; historical pages may expose an explicitly labeled current live demo when no historical document exists.
- Derive routes, navigation, search, pagination, and integrity checks from registry/archive metadata instead of parallel menus and magic counts.
- Finish gate selected by the user: Standard tests, user guide skipped, technical document created, and independent review plus repair loop.

## Review and repair

Independent code/architecture, functional/versioning, and accessibility reviews were run. The repair loop resolved all findings, including copy-feedback races, pagination around unavailable historical pages, bidirectional registry/index integrity, modal background isolation, persistent disclosure IDREF targets, drawer focus timing, and focus-trap filtering of visually hidden controls. The final source and browser re-reviews reported no open findings.

## Verification

- PASS `npm run test:showcase-generators`: 19/19.
- PASS showcase Karma suites: 167/167 on v19, 167/167 on v20, and 167/167 on v21.
- PASS production showcase builds for v19, v20, and v21.
- PASS `npm run check:sync` after the final source synchronization and builds.
- PASS focused ESLint on all 62 changed, existing, non-generated v19 TS/HTML files.
- PASS `git diff --check`; only expected Windows LF/CRLF notices were emitted.
- PASS production browser matrix: 21/21 route/viewport cases across 1440, 1100, and 390 px; one `h1`, no page overflow, no demo/TOC overlap, no broken `aria-controls`, and no console/page errors.
- PASS targeted drawer and full-width dialog probes: focus capture/restoration and Tab/Shift+Tab wrapping on desktop/mobile.
- Production preview remains available at `http://127.0.0.1:4200/`.

## Open questions / follow-ups

- No implementation blocker remains. Assistive-technology sessions such as NVDA or VoiceOver and external Lighthouse/axe runs remain optional environment-specific follow-ups rather than locally claimed checks.

## Product traceability

No product ledger was changed because this work refactors the developer showcase rather than introducing a product requirement. The durable implementation contract is recorded in `.sdcorejs/documentation/technical-docs/showcase-documentation-site.md`.

## Documentation

- Added `.sdcorejs/documentation/technical-docs/showcase-documentation-site.md` with architecture, routing, authoring, accessibility, generation, preview, and validation guidance.
- User guide intentionally skipped according to the selected finish-gate option.

## Next suggested action

Review the running production preview. Commit or push the branch only when explicitly requested.

## Skill provenance

Skills used in this delivery: `sdcorejs-design`, `sdcorejs-angular`, `sdcorejs-test`, `sdcorejs-review`, `sdcorejs-repair-loop`, `sdcorejs-documentation`, and `sdcorejs-ship`.
