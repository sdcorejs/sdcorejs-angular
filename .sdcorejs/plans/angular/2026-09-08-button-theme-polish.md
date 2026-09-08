---
artifact_id: plan:sdcorejs-angular:button-theme-polish
artifact_kind: plan
change_ref: button-theme-polish-20260908
source_spec: none
source_plan: .sdcorejs/plans/angular/2026-09-08-button-theme-polish.md
commit_policy: with-change
owner: sdcorejs-angular
track: angular
status: execution-scope
authorization: user-requested-plan-and-implementation
---

# SdButton theme and density polish

User requested planning and execution of the previously discussed improvements on both repositories. This is a bounded existing-component refinement with no new API, dependencies, radius or size defaults. It is an implementation work plan, not a claim of separately approved immutable spec/plan artifacts.

## Scope and ownership

Owner: sdcorejs-angular. Git root: C:/Users/Admin/Documents/sdcorejs/sdcorejs-angular. Component: versions/v19/projects/sdcorejs-angular/components/button. Counterpart: C:/Users/Admin/Documents/lib-core-angular. Existing unrelated edits are preserved. Old Modal/Drawer and Table row-command density remain excluded.

## File tasks

1. EDIT versions/v19/projects/sdcorejs-angular/components/button/src/button.component.scss: theme-aware outlined/disabled colors; scoped old-library typography; native Material shape and state layer; keyboard focus; local icon/text gap. Keep 32/40/48px sizes, semantic action colors, default type/color and loading/click contracts.
2. EDIT versions/v19/projects/sdcorejs-angular/components/button/src/button.component.html: move spacing from global margin utilities to flex gap. While verifying icon alignment, remove duplicate suffix-only rendering; do not change public inputs or outputs.
3. EDIT versions/v19/projects/sdcorejs-angular/components/button/src/button.component.spec.ts: regression coverage for one suffix-only icon and live theme/disabled color changes. Run existing button behavior/consumer coverage.
4. EDIT versions/v19/projects/sdcorejs-angular/components/button/sd-button.md and existing Button showcase examples: explain neutral secondary action vs primary CTA, native radius, real sizes and focus; show icon/suffix/disabled variants.
5. GENERATE versions/v20,v21,v22 via npm run sync after v19 changes; verify npm run check:sync. Build v19 and link showcase library using existing script.
6. Browser verification: real Button page desktop/320/375px, hover and keyboard focus, long title and suffix-only, theme token overrides for dark surfaces. Recheck a Table/Import Excel consumer. Capture review screenshots.

## Acceptance evidence

- Outline resolves host theme variables and retains 1px border on hover/focus. Disabled text/background resolve theme variables without a second opacity fade.
- Modern M3 shape and typography remain inherited; old typography becomes medium weight without wide tracking. No xs size introduced.
- Icon-only suffix renders once, centered; icon/text has local gap; loading still suppresses actions; reduced motion is respected.
- Existing button unit tests and relevant consumer tests pass; library builds succeed; modern generated source matches v19.
- Scoped diff, UTF-8 and protected-file hashes remain clean. No commits/pushes or package changes.

## Generated outputs discovered during verification

- Existing script `node scripts/generate-showcase-example-sources.mjs` regenerates `showcase/src/app/docs/generated/example-sources.generated.ts` and `example-manifest.generated.ts` after Button example edits. Required by the existing freshness test.
- `npm run sync` updates the generated `versions/v19` through `v22/SYNC-STATUS.md` timestamps.
