# Tree table-style action alignment

## Scope

Updated `sd-tree` action styling to align with `sd-table`:

- Quick action selection bar now uses the same count block/message structure as table selector action.
- Row command trigger uses the same compact command icon sizing as table desktop command.
- Command menu icons default to `fontSet="material-icons-outlined"` and `color="secondary"`.
- Default command icon color uses the table command gray token (`black400`), while explicit command `color` still works.

## Verification

- Focused tree specs passed: `TOTAL: 11 SUCCESS`.
- `npm run build` passed.
- Showcase development build passed after rerunning sequentially. The first parallel showcase build raced with `dist/sdcorejs-angular` while the package build was writing output.
