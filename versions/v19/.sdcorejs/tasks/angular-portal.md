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
