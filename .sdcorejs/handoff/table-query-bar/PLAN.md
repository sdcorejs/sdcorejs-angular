# Plan — sd-table query-bar filter mode (approved 2026-10-29)

Source of truth: `table-query-bar.md`. This file records the decisions taken in the plan review.

## Steps (one commit each, commit only when the user asks)
1. sd-query-bar Q1–Q12 (+ 5 `query-bar.*` i18n keys, `sd-query-bar.md`).
2. sd-table base: `SdTableOptionFilterQueryBar`, `filter.mode`, `filter.queryBar`, configuration, `table-query-bar.util.ts` + spec, `value.default()` on the register.
3. sd-table UI: render bar, apply/required/manualFilter/clear/cache/mobile/loading/a11y/dev warning.
4. Column header filter trigger.
5. Docs, CHANGELOG, showcase demo.

## Decisions (section 14)
1. Sync: `[(filters)]="barFilters"`, `[(search)]="barSearch"`. Apply-originated emission → full rebuild from raw with identity reuse. External emission → per-key merge: key whose raw-derived value did not change keeps the bar draft. Defer while `editingIndex() !== null` or `building()`. Skip set when nothing changed.
2. Gate: replace `externalFilter()?.form?.invalid` (onFilter context + server gate) with `#externalFilterValid(filterReq)`: query-bar → every required external has a value in `rawExternalFilter`; default → unchanged expression. `#loadCompleted` untouched. Local tables do not gate on external required (same as default).
3. Focus returns to the header icon: `openField(key, returnFocusTo?)` disables `restoreFocus` for that open and focuses the element on `menuClosed`.
4. External date/datetime without GE/LE `defaultOperator` → excluded + dev warning.
5. Displayed leaf columns; a config-hidden column that still holds an applied value keeps its chip until cleared. `column.hidden` stays excluded.
6. Added-chip order in memory only.

## Deviations agreed
- Header icon is a sibling of `.c-header-title` (sortable title is role=button + Enter sorts).
- Column date/datetime and external daterange map to query field type `date` (old controls are date-only).
- Operator callback: call `filter.operatorChange` directly, not `onOperatorChange()`.
- NULL/NOT_NULL offered on every default-control column when in `operator.list`.
- Boolean column raw stays `'1'`/`'0'`.
- `value.default()` added to the filter register for clear-enabled + empty-operator defaults; semantic empty comparison.
- External `onChange` called for every type.
- `.c-filter-header` stays in DOM hidden when `multipleHeader` (like `hideInlineFilter: true`).
- Required empty chip shows `placeholder.select-value`.
- Clear button stays icon-only, gains `aria-label`; count = active chips.
- `data-filter-mode` host attribute in both modes.
- Open question (ask at step 3): search box when quickSearch has no contain/equal fields — recommend show (default-mode parity).

## Step 1 status (2026-10-29)
Done, uncommitted. Extra i18n key `core.component.query-bar.clear` (clear label without count). `removeFilter` now nulls `editingIndex` before closing the menu (commit of a removed chip ignored). `addDisabled` compares the picker list with used keys.
API consistency: `onClearAll` follows `onApply`/`onQueryChange` (callback in option); `required`/`disabled` mirror `SdTableExternalFilter`; `views` mirrors `SdTableColumnLazyValues.option.views`; new knobs option-only per the "option is the main API" comment; `showOperatorOnChip` input widened (compatible).

## Step 2 status (2026-10-29)
Step 1 committed as eaa249cb0. Step 2: `SdTableOptionFilterQueryBar`, `filter.mode`/`queryBar` (option + `ISdTableConfiguration`), optional `TableFilterRegister.value.default()`, `table-query-bar.util.ts` (`sdTableQueryFields`, `tableFilterToQuery`, `queryToTableFilter`) + spec (68 parity cases in two zones). Option > configuration merge lands in step 3 with `effectiveMode`.
Adapter rules: chip ordering = pinned (declaration) → previous bar order → new chips (declaration); equivalent raw values keep the stored representation; column operator modes `none` / `chip` / `no-data` (IN/BETWEEN/EQUAL implied by shape only write NULL/NOT_NULL, leaving NULL resets to the default operator); search box shown whenever quickSearch exists (recommendation, user not answered yet).
Observation: `SdConvertToPagingReq` and the register only read top-level `option.columns`, so filters on `children` leaves are never sent in either mode (pre-existing).

## Step 3 status (2026-10-29)
Step 2 committed as 3fe970aa9. Step 3: `filterMode` / `effectiveFilterMode` / `queryBarMode`, host `data-filter-mode`, option > configuration merge in `#initConfiguration` (written only when the configuration sets it), bar rendered in `.sd-table-surface` (role=search, flush, `[sdQueryBarEnd]` = quick-search right slot), hint line, `#externalFilterValid` gate, `onQueryBarApply` (one `value.set`, operator-only on an empty column → notReload), callbacks after set, clear via `clearFilter()` + `onClearFilter`, `mergeQueryDraft` in util, sync deferred while a popover/build is open, dev warning once per instance, config-hidden columns with a value keep their chip. i18n `table.query-bar.filters/columns`. Spec `table.component.query-bar.spec.ts` (§15 · 5–12, 14–17).

## Step 4 status (2026-10-29)
Step 3 committed as 3256d0839. Step 4: `#queryBarTrigger` template beside `.c-header-title` (wrapper class `sd-table-header-cell--trigger`, `--end` = row-reverse for align right), `queryBarActiveKeys` from `sdTableActiveQueryKeys` (applied value), `openQueryBarField(key, trigger)` → `openField(key, returnFocusTo)`. i18n `table.filter-by/filtering-by`. Specs: 8 header-trigger tests + util test.

## Step 5 status (2026-10-29)
Step 4 committed as 3d9476da9. Step 5: `sd-table.md` "Query bar mode" + `data-filter-mode` + autoIds + configuration; root CHANGELOG [Unreleased] (Added Query bar / Table, Changed Query bar, Fixed Query bar); showcase example `table-query-bar.example.{ts,html}` (mode + manualFilter switches, pagingReq panel, cacheable, FilterUtilities backend), registry 35 → 36 / 494 → 495, generated example sources. Showcase check fixed `.sd-table-query-bar-end` (flex none, align-self flex-start). Screenshots in `.sdcorejs/handoff/screenshots/table-query-bar-*.png`.
Pre-existing issues found (not fixed, default mode must not change): (1) leaves of `children` columns are never sent by `SdConvertToPagingReq` (top-level columns only); (2) `clearFilter()` in default mode with a `split-number` column throws in column-filter's split template (`_columnFilter[field].from` of a key removed in place).

## Query-bar additions (option-only unless noted)
`SdQueryField.pinned/required/group`, lazy `option.views`; `SdQueryBarOption.applyOn/appearance/onClearAll/clearDisabled/searchPlaceholder/invalidHintId`, `showOperatorOnChip: boolean | 'auto'` (input + option); `openField()`, `invalidFields()`; slot `[sdQueryBarEnd]`. Fixes: BETWEEN with both ends empty is inactive; chip dates formatted; lazy/values-fn labels resolved once.
