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
- [ ] (future) Wire query-builder value editor to `<sd-inline-text>` when it's rebuilt off the field/operator model
