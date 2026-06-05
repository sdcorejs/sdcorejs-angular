# Xây dựng lại `<sd-query-builder>` — 2026-06-05 08:12

## What was requested
"Xây dựng lại query-builder" trong vn-angular: ráp operator + type của field đầy đủ để hiển thị operator hợp lý, hoàn thiện để thay query-builder trong form-generic, dùng màu primary thay tím hardcode, thêm `mode="view"` (div nhìn như input disabled render câu query raw `(code = 'ABC' and name like '%abc%') or ...` highlight value/operator), và output là `Filter[]` của core utils giống query-bar.

## What was changed
- CREATE  projects/sdcorejs-angular/components/query-builder/src/query-builder.model.ts — `SdQueryBuilderField`, internal `QbNode`/`QbGroup`/`QbRule`, `QbToken`, `QB_OPERATORS_BY_TYPE`/`QB_DEFAULT_OPERATOR_BY_TYPE`, helpers, node factories
- CREATE  .../src/query-builder.serializer.ts — `treeToFilter` / `filterToTree` / `filterToTokens` (pure; tree↔Filter + SQL-ish token render)
- CREATE  .../src/query-builder.serializer.spec.ts — 25 specs (mapping + tokens)
- CREATE  .../src/query-builder.component.spec.ts — 18 specs (AC1–AC6)
- EDIT(rebuild) .../src/query-builder.component.ts — signal-first OnPush; `fields`/`mode`/`disabled`/`autoId` + models `value`/`filters`/`rootLogic`; echo-guarded sync effect; tree mutations
- EDIT(rebuild) .../src/query-builder.component.html — recursive group/rule template + per-type value editors + view-mode token render
- EDIT(rebuild) .../src/query-builder.component.scss — `var(--sd-primary*)` theming (purple removed), view-mode disabled-input look, highlight token classes
- EDIT    .../index.ts — export model + serializer
- EDIT    .../sd-query-builder.md — doc rewrite to new API
- EDIT    CHANGELOG.md — Added (rebuild) + BREAKING migration note (`[group]` → `[fields]`/`[(value)]`)
- EDIT    projects/demo/.../sd-query-builder.component.{ts,html} — fields + `[(value)]` + edit/view toggle + Filter JSON
- EDIT    projects/showcase/.../query-builder-demo.component.ts — new API, edit/view toggle, disabled demo
- CREATE  .sdcorejs/docs/angular-portal/2026-06-05-08-09-why-query-builder.md — WHY companion (full-comment level)

## Decisions made
- **Output = nested `FilterAndOr` tree** (`[(value)]` canonical) + flat `[(filters)]` mirror (= root.data) for query-bar parity — chosen over flat-only to preserve nested AND/OR groups.
- **Field config is local** (`SdQueryBuilderField`, not query-bar's `SdQueryField`) — component self-contained; only borrows `Operator`/`Filter` + `<sd-operator>`.
- **View-mode field token = label** (not raw key); SQL-ish syntax (`like '%v%'`, `between a and b`, `is null`, lowercase `and`/`or`, nested groups parenthesized).
- **Two-tier data + echo-guard**: internal tree (UI state) ↔ public `Filter` via serializer; `effect` + `#lastEmitted` JSON compare avoids two-way emit loop (Angular 19 allows signal writes in effects).
- **form-generic NOT swapped** this round (different runtime model — `SdFormGenericExpression`, `${field}` templates, `dayInfo`, JS-eval). Deferred follow-up.
- Comment level: **full** (per ASK gate) — JSDoc on all public API + `// why` + WHY-doc + selective `// asserts:` on non-redundant tests.

## Open questions / follow-ups
- **Swap form-generic** `expression-builder`/`BuildQueries` to `<sd-query-builder>` — needs mapping of `dayInfo` relative-dates + JS `===` eval + `${field}` templates. (Deferred per spec.)
- **`lazy-values`** (server-backed value search) not supported — only sync `values`. Add when needed.
- AC8 manual: open `/components/query-builder` in showcase to eyeball UI (deferred by user).
- Pre-existing unrelated build error in `projects/demo/.../sd-table-demo.component.ts:401` (TS2353/TS7006, commit `9f41cc60`) — blocks `ng build demo`; NOT from this work. Fix separately.

## Verification (this session)
- `npm run build` (lib): ✅ exit 0
- query-builder suite: ✅ 43/43 (`ng test sdcorejs-angular --include='**/components/query-builder/**/*.spec.ts'`)
- `ng build showcase --configuration=development`: ✅ exit 0
- Review-code: 2 medium findings (a11y icon-button labels, dropdown re-render guard) → fixed via repair-loop, re-verified green.

## Next suggested action
- `npm run showcase` → mở `/components/query-builder`, đổi field type + bật View để xác nhận UI.
- Khi sẵn sàng: lên kế hoạch swap form-generic sang `<sd-query-builder>` (follow-up riêng).

## Skill provenance
02-clarify → 03-write-spec → 04-review-spec (approved) → auto-specs → 05-plan → 06-review-plan (approved) → auto-plans → angular-portal-write-code (P1–P8) → review-code → repair-loop → comment-code (full) → verify-before-done → auto-docs
