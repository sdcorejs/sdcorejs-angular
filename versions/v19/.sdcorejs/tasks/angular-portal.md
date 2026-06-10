# Angular Portal — Living Tasks

## inline-text primitive (2026-06-03)
- [x] Create `forms/inline-text` secondary entry + `<sd-inline-text>` primitive (content-hug, dual-binding, event passthrough)
- [x] TDD spec for primitive (25 specs)
- [x] Migrate `sd-input` + `sd-input-number` `viewed='inline'` to render the primitive
- [x] Refactor query-bar `inline-value-chip` to consume the primitive (single + BETWEEN)
- [x] Remove dead `sd-inline-input` mixin from `_inline-edit.scss`
- [x] Doc `sd-inline-text.md` + CHANGELOG entry
- [x] Showcase demo + route + nav
- [x] Build clean + suites green (inline-text 25 / input+input-number / query-bar 145)
- [ ] **Sync primitive + inline migration + tests to `sdcorejs-angular` (`@sdcorejs/angular`)** — user request 2026-06-03
- [ ] Manual visual smoke: `/forms/inline-text`, query-bar inline UX, sd-input/input-number inline (user)
- [ ] (optional) Forward `data-invalid/empty/value` in inline mode if E2E inspector needs them
- [ ] (future) Wire query-builder value editor to `<sd-inline-text>` when it's rebuilt off the field/operator model — *query-builder rebuilt 2026-06-05 using sd-input/sd-select; sd-inline-text wiring still optional*

## query-builder rebuild (2026-06-05)
- [x] `query-builder.model.ts` — `SdQueryBuilderField`, internal tree types, `QB_OPERATORS_BY_TYPE`, helpers, factories
- [x] `query-builder.serializer.ts` — `treeToFilter`/`filterToTree`/`filterToTokens` + 25 TDD specs
- [x] Rebuild component (signal-first OnPush): operator-by-type, per-type value editors, echo-guarded `[(value)]`/`[(filters)]`/`[(rootLogic)]`, `mode="view"` highlighted raw string
- [x] Primary-color theming (purple removed) + view-mode disabled-input look + highlight token classes
- [x] Component spec (18 specs, AC1–AC6) — total 43 green
- [x] index export + doc rewrite + CHANGELOG (Added + BREAKING migration) + demo + showcase
- [x] review-code (2 medium) → repair-loop (a11y labels + dropdown re-render guard) → re-verified green
- [x] comment-code full + WHY companion doc
- [x] Build lib ✅ · showcase build ✅
- [ ] **Swap `form-generic` `expression-builder`/`BuildQueries` → `<sd-query-builder>`** — needs `dayInfo` relative-date + JS-eval + `${field}` template mapping (deferred follow-up)
- [ ] Support `lazy-values` (server-backed value search) in the value editor
- [ ] Manual visual smoke: `/components/query-builder` (edit + view, change field type) — user
- [ ] Fix pre-existing unrelated `ng build demo` error at `sd-table-demo.component.ts:401` (TS2353/TS7006) — separate task

## org-chart component (2026-06-10)

- [x] Create `components/org-chart` secondary entry + `<sd-org-chart>` selector
- [x] Add `SdOrgChartItem` data model (`id`, `image`, `title`, `description`, `color`, `children`, `expanded`)
- [x] Add default recursive org-chart renderer with connector lines, compact leaf cards, item colors, collapse/expand toggle
- [x] Add custom node APIs: projected `sdOrgChartItemDef` and `[itemTemplate]`
- [x] Add component specs for default render, collapse/expand, directive template, TemplateRef input, autoId child selectors
- [x] Export through `@sdcorejs/angular/components/org-chart` and components barrel
- [x] Add `sd-org-chart.md`, user guide, changelog entry, showcase page, route, and sidebar nav
- [x] Build lib: pass; targeted org-chart specs: pass; showcase build attempted (currently blocked by unrelated query-builder/form-generic/date-range errors)
- [ ] Manual visual smoke: `/components/org-chart` card spacing, connector alignment, and colored-node look

## query-builder field compare (2026-06-10)

- [x] Add `comparisonMode: 'value-only' | 'value-or-field'` with literal-only default
- [x] Add per-rule literal/field value-source UI and same-type compare-field picker
- [x] Emit/seed/render canonical `Filter` field operands with `dataType: 'field'`
- [x] Document `comparisonMode`, `compareGroup`, `allowFieldCompare`, and field-operand payload
- [x] Query-builder focused specs green: 83 specs
- [ ] Full `npm run build` currently blocked by unrelated query-bar Angular metadata errors (`Unknown reference` in standalone imports)

## tree component (2026-06-10)

- [x] Create `components/tree` secondary entry + `<sd-tree>` selector
- [x] Add static/lazy `SdTreeOption`, mode-specific tree items, lazy loading, cached children, selection, commands, events, and `sdTreeItemDef`
- [x] Add Vietnamese accent-insensitive `filter(searchText)` over loaded items
- [x] Add focused specs for static, lazy, selection, commands, custom template, icons, filter, and row clamping
- [x] Export through `@sdcorejs/angular/components/tree` and components barrel
- [x] Add `sd-tree.md`, user guide, and auto-docs summary
- [x] Targeted tree specs: pass; library build: pass
- [x] Add showcase/demo route for visual QA
- [x] Refine selection API to `selector.visible/actions`, add quick action, align checkbox/chevron/icon, and let custom item templates grow row height
- [x] Align new components with `sd-table` option-first API: org-chart, query-bar, query-builder, tree, splitter
- [x] Align `sd-tree` quick action and command styling with `sd-table`
- [x] Refactor `sd-tree` root data to `SdTreeItem<T>` wrappers and remove key/icon resolver options from tree config
- [x] Split tree item contracts by mode: `SdTreeItemStatic<T>` owns `children`, `SdTreeItemLazy<T>` owns `hasChildren`
- [x] Rename static/lazy tree config from `SdTreeLoadOption` to `SdTreeOption`, and use `SdTreeComponentOption` for the full `[option]` object
- [x] Support `items` as array, signal, sync loader, or async loader, with public `reload()`
- [x] Precompute tree row view models with signals so template no longer calls per-row resolver helpers
- [x] Remove selected-row border radius and tighten command menu icon/text alignment
- [x] Restore Vietnamese accents in `sd-tree` default selection text, showcase labels/messages, docs, and related specs
- [x] Fix `sd-tree` command menu icon/label alignment in the real overlay and cover it with focused specs
- [ ] Manual visual smoke: long labels, hover command, lazy loading spinner, selected color
