---
artifact_id: table-column-aggregate-2026-09-22
artifact_kind: memory
change_ref: table-column-aggregate
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-angular
---

# Column aggregate handoff — 2026-09-22

User requested complete implementation, verification, commit and push to main,
then a compact handoff before choosing the next task. This records the completed
change, not a live session checkpoint. The detailed consumer contract is
`versions/v19/projects/sdcorejs-angular/components/table/sd-table.md`.

## Delivered behavior

- `column.aggregate`: built-in, synchronous raw-item callback, or nonempty
  `{ calculate?, templateRef? }`. Number supports SUM/AVERAGE/COUNT/MIN/MAX;
  date/datetime supports COUNT/MIN/MAX; other data columns, including time,
  support COUNT. Header parents and functional columns do not aggregate.
- COUNT excludes null/undefined, blank strings, empty arrays, nonfinite numbers
  and invalid Dates. It includes 0, false, {}, and [null], once per row.
  AVERAGE divides by valid numeric values, not COUNT. Empty successful SUM/COUNT
  is 0; other empty built-ins are null; missing results render `--`.
- `option.aggregate`: scope defaults to page; group subtotal defaults false;
  tree items defaults to leaves; branch subtotal defaults false. Filtered scope
  uses local rows before pagination. Server filtered scope is explicitly
  incomplete; it never falls back to page or fetches extra data.
- Raw tree traversal deduplicates shared nodes, excludes each parent from its
  own subtotal, and respects filtering. Unknown lazy descendants make built-ins
  incomplete until loaded. Pure collapse/expand does not change cached totals.
- Aggregate renders above the existing footer, with unchanged footer context.
  Subtotals stay outside business items, selection, commands and drag data.
  Mobile consumes the same snapshot. Sticky footer offsets follow real height.
- In-place edits/config changes refresh through `table.detectChanges()`;
  reload/filter/page/lazy-load lifecycle also refreshes the snapshot.

```ts
columns: [{ field: 'amount', title: 'Amount', type: 'number', aggregate: 'SUM' }],
aggregate: { scope: 'filtered', group: true },
```

## Entry points

- Public API and full TemplateRef JSDoc: table `src/models/table-aggregate.model.ts`.
- Pure calculation/scope/tree logic: table `src/services/table-aggregate.util.ts`.
- Lifecycle/render integration: table component, `sd-aggregate-rows.pipe.ts`,
  and `sd-aggregate-layout.directive.ts` (public Material footer registration).
- Demo: `showcase/src/app/pages/components/table/table-aggregate-example.component.*`.
- Published declaration/hover guard: `scripts/check-table-aggregate-consumer.mjs`.
- Shared source remains v19; v20/v21/v22 were generated through `npm run sync`.

## Verified evidence

Node 22.22.3; all following commands exited 0:

| Check | Working directory / result |
| --- | --- |
| `npm test -- --watch=false --browsers=ChromeHeadlessCI --code-coverage` | v19: 5,510 tests passed; statements 82.52%, branches 72.59%, functions 80.97%, lines 83.69% |
| `npm run build` | v19 library and separate showcase workspace |
| `npx --no-install tsc --noEmit --sourceMap -p projects/sdcorejs-angular/tsconfig.lib.json` | v19 |
| `npx --no-install eslint projects/sdcorejs-angular/components/table --quiet` | v19 |
| `npm run check:sync` | root: all three derived versions match v19 |
| `npm run test:scripts` | root: generators, archive, sync and release-contract script suites |
| `npm run check:table-aggregate-consumer` | root: strict Angular compilation of built-declaration example, docs example and components barrel; hover metadata for built-in+template, callback+template and template-only |

Browser checks covered desktop/mobile rendering, page total 40 versus filtered
total 100, tree all total 200, lazy incomplete becoming 100 after expansion,
and aggregate above the unchanged footer. Final demo footer measured 52px and
aggregate sticky bottom was 52px. Hover was verified through TypeScript language
service metadata and built declarations, not an editor UI automation claim.

The integration suite covers filters/pagination, group averages and collapse,
selection exclusion, hidden/reordered grouped-header leaves, trees/lazy loading,
loading/error distinction, safe callback text, in-place refresh and mobile cache.
Unit/type checks cover invalid values, cycles, operation restrictions, empty
configuration rejection and synchronous callbacks.

## Boundaries for the next task

- Existing table supports one level of column children, combined-field row
  groups and no virtual scroll; this change does not add those capabilities.
- No backend aggregate contract, async aggregate callbacks or automatic lazy
  fetching. These limits are documented.
- No version bump, npm publication, release tag or published archive edits.
  Derived versions were sync-checked, not independently built/tested in this run.
- Theme work already exists on main: `9edb9e90` (Core-owned colors) and
  `f682f732` (eight theme presets and docs).
- `.sdcorejs/tmp/` is pre-existing local-only material and stays outside commits.
  Windows Git may report CRLF-only working-copy differences in derived v22 files;
  inspect content diffs before treating those as another feature change.
- The next product task has not yet been specified. Do not start a release
  merely because this implementation and its verification are complete.
