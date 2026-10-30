---
artifact_id: core-ui-table-excel-date-cells-port-20261029
artifact_kind: execution-doc
change_ref: core-ui-table-excel-date-cells-port
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-angular
---

# Typed XLSX date/time cells: Core UI port

The user requested porting the completed Core Legacy change to Core UI on 2026-10-29. This carries over the previously approved default behavior, transform priority and timezone contract; it does not introduce a new export mode or UI.

## Provenance and scope

- Source: Core Legacy commit `255074064f4130077d327ab1718c3edba09a11ab`, merged in [MR !220](https://gitlab.id.vin/b2b/omd-libraries/lib-core-angular/-/merge_requests/220) and included in source version 19.0.48.
- Original immutable artifacts remain in the Legacy repository: `.sdcorejs/specs/angular/2026-10-28-11-37-table-excel-date-cells.md`, `.sdcorejs/architecture/angular/2026-10-28-12-03-table-excel-date-cells.md`, and `.sdcorejs/plans/angular/2026-10-28-13-34-table-excel-date-cells.md`. Their approvals are not relabeled as a new Core UI plan.
- Target baseline: `sdcorejs/sdcorejs-angular` at `69e2d244168ff531ba4d15475575f3e5ca4e17ca`; branch `feat/table-excel-date-cells`. The checkout was clean before this work.
- Canonical implementation, tests and API docs live in `versions/v19/projects/sdcorejs-angular`. The repository sync script derives v20, v21 and v22; no legacy bulk-sync script was used.
- Only typed XLSX behavior and its regression tests are ported. Existing Core UI workbook I/O tests are retained. Form Builder and unrelated Legacy coverage/fixture changes are outside this port.
- No dependencies, package versions, release contracts, published archives or showcase files changed. The root changelog records the XLSX reader compatibility change under Unreleased.

## Adaptation to Core UI

`TableExportService` keeps its export row limits, unknown-total pagination, field resolution, mapping, loading cleanup, selected columns and custom-export behavior. `SdDateTimeService` still owns parsing and configured timezone interpretation. Its wall-clock fields are converted to Excel 1900 serials only for default, untransformed XLSX date/time columns.

| Column | Stored value | Number format |
| --- | --- | --- |
| date | Whole calendar serial | `dd/mm/yyyy` |
| datetime | Calendar serial plus seconds / 86400 | `dd/mm/yyyy hh:mm:ss` |
| time | Seconds since midnight / 86400 | `hh:mm:ss` |

`SdExcelColumn.numFmt` is optional and uses the existing public Excel model and barrels. The writer applies it after styling only for number/Date data cells. Core UI's existing integer format `0` and decimal General defaults remain intact when the override is absent or empty. CSV, templates, additional sheets and formula neutralization keep their existing behavior. Strings returned by transforms remain strings.

No new parser or dependency was introduced. The installed `@sdcorejs/utils` formatter remains behind `SdDateTimeService`; the private Excel calendar conversion is specific to this table export contract.

## Verification

All Angular builds and tests used exact Node **24.22.1**. Raw logs and temporary probes are local diagnostics under the OS temp directory `core-ui-excel-port-20261029`, not repository artifacts.

| Check | Result |
| --- | --- |
| RED against the previous implementation | 26 failed, 99 passed; failures demonstrated missing typed values/number formats |
| Focused table export, Excel writer and date-time suites | **128/128 passed** |
| Full canonical v19 suite with coverage | **8,420/8,420 passed**, Jasmine seed `508086` |
| Full spec TypeScript check | Passed |
| ESLint on all six changed/new canonical TypeScript files | Passed |
| Root `npm run test:scripts` | **280/280 passed** |
| `npm run check:sync` | v20/v21/v22 match v19 |
| Library builds | Passed for v19/v20/v21/v22 |
| `npm pack --dry-run --json` | Passed for all four lines; 1263 entries for v19, 566 each for v20/v21/v22 |
| Public root/subpath consumer compilation | Passed against each freshly built package, using its installed TypeScript version |
| Declaration/JSDoc inspection | `numFmt`, export documentation and examples retained in all four packages; emitted layout resolved per package export map |

The package probe confirms the unchanged source versions match their corresponding built versions. This port does not prepare or publish a new release.

Global coverage: **87.16% statements** (36105/41421), **77.94% branches** (16610/21311), **86.09% functions** (7215/8380), **89.62% lines** (31255/34874). Thresholds and coverage inclusion were not changed.

Changed executable coverage from the final LCOV report:

- Table export: **25/25 changed executable lines**, **29/29 changed branch outcomes** exercised.
- Excel writer: **2/2 changed executable lines**, **4/4 changed branch outcomes** exercised.
- The full files are not claimed to have 100% coverage: table export has 189/196 lines and 151/164 branch outcomes; Excel service has 183/188 lines and 78/88 branch outcomes. Remaining gaps are unchanged custom-export failure handling, defensive child/selection/batch paths, and existing width/import/empty-workbook paths outside this port.

The tests inspect downloaded XLSX bytes, raw worksheet XML, styles and ExcelJS round trips. Cases cover the 1900 leap-day compatibility rule, epoch zero, 1960 historical zones, leap years, year 9999, out-of-range text fallback, invalid/nullish values, DST transitions, local time, second precision, midnight, transform priority, immutable input, CSV, formula strings, unknown-total pagination and error cleanup. Existing export-limit tests remain green.

## Review and limits

- API consistency self-review: compared `SdExcelColumn`, inherited `SdExcelTemplateColumn`, `SdExcelExportOption`, table export callbacks and existing ExcelJS formatting. The only public addition is optional `numFmt`; no input/output, provider, event or entry-point names changed. All four lines expose the same addition.
- Compatibility: XLSX consumers now receive numeric/date cells instead of default date strings. This is documented in the existing table/Excel API docs and the Unreleased changelog. Existing numeric display fixes in Core UI are preserved.
- Runtime verification used ChromeHeadlessCI and real XLSX serialization. Microsoft Excel desktop and a manual showcase interaction were not run; no template/layout changed.
- Independent review was not performed; the review above is the implementing agent's self-review.
- Commit, push, PR creation, version bump and publication are not part of this port request.
