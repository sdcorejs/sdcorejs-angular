---
name: 2026-05-29-tab-stepper-input-color-ckeditor-styles-showcase
description: Session summary for the 2026-05-29 work that shipped sd-tab-group/sd-tab, sd-stepper/sd-step, sd-input-color, sd-ckeditor-styles wrapper (editor-only wire), and a brand-new showcase project with 47 demo pages.
metadata:
  type: project
  track: angular-portal
  branch: release/0.0.1
  date: 2026-05-29
---

# Session 2026-05-29 — tab + stepper + input-color + ckeditor-styles wrapper + showcase

## Goal
Add visual primitives missing from `@sdcorejs/angular` (tabs, stepper, color input), refactor CKEditor CSS loading into a small wrapper so consumers don't need a global SCSS import, and stand up a new showcase site that demos every component visually.

## Shipped

### Library (`@sdcorejs/angular`)

- **`components/tab`** — `<sd-tab-group>` + `<sd-tab>`. Variants `line`/`pills`/`segmented`. Color from SdColor palette via host CSS vars. `stretchTabs` toggle. Lazy content via `matTabContent` + viewChild template ref. 58 specs.
- **`components/stepper`** — `<sd-stepper>` + `<sd-step>` wrapping mat-stepper. linear + stepControl gating, optional, editable, state override (error / done / custom). 26 specs.
- **`components/ckeditor-styles`** — `<sd-ckeditor-styles>` empty-render wrapper that owns the global CKEditor CSS via ViewEncapsulation.None. Embedded inside `<sd-editor>` only (mini-editor + document-builder still pending).
- **`forms/input-color`** — `<sd-input-color>` composing `<sd-input>` + suffix swatch + hidden native picker. Hex pattern validator, clear button when non-required, swatch checkerboard for empty/invalid state. 30 specs.

### Showcase

- New project `projects/showcase/` (Angular 19, standalone). `npm run showcase` to serve.
- Shell with collapsible 3-group sidebar (Components / Forms / Services), landing page with card grid, 47 lazy-loaded demo pages.
- Demo pages focus visual UI capability, no property tables (intentionally different from `portal-template`).
- All 4 newly-shipped components have their own demo with full scenario coverage.

### Spec + plan snapshots
- `.sdcorejs/specs/angular-portal/2026-05-29-14-00-sd-tab.md`
- `.sdcorejs/plans/angular-portal/2026-05-29-14-30-sd-tab.md`

## Test state

- 58/58 tab specs
- 26/26 stepper specs
- 30/30 input-color specs
- Lib build clean (`npm run build`)
- Showcase dev build clean (`npx ng build showcase --configuration=development`)

## Open follow-ups

1. **mini-editor + document-builder** should embed `<sd-ckeditor-styles>` the same way `<sd-editor>` does. Once done, delete the temporary showcase shim at `projects/showcase/src/app/shared/ckeditor-styles.scss` and drop `stylePreprocessorOptions.includePaths` from the showcase angular.json target.
2. Write `sd-stepper.md` doc (parallel structure to `sd-tab.md`).
3. CHANGELOG breaking-change entry when consumers can drop `@sdcorejs/angular/assets/scss/ckeditor5.scss` from `angular.json` `styles[]` globally.
4. Visual QA pass on showcase heavy demos: chart, document-builder, query-bar, query-builder.

## Notes for next session

- The branch `release/0.0.1` carries unrelated coverage-batch WIP from earlier sessions. The 2026-05-29 work is additive (new files + edits to `editor.component.{ts,html}` + `angular.json` + `package.json` + the old demo route table for sd-tab).
- Sidebar item "Stepper" intentionally sits between Splitter and Tab to preserve A-Z order in Components group.
- `<sd-stepper>` exposes the StepperSelectionEvent type directly from `@angular/cdk/stepper` — no re-export to avoid duplication.
- Showcase initial bundle 2.27 MB (mostly sd-core CSS + base shell). All component-specific deps go into lazy chunks; CKEditor CSS lives in editor-demo chunk (357 kB), mini-editor (359 kB), document-builder (490 kB).
