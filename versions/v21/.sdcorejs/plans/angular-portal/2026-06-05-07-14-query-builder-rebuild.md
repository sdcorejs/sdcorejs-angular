---
name: query-builder-rebuild
description: TDD-on-pure-logic plan to rebuild <sd-query-builder> — model + serializer (tree↔Filter, SQL-ish tokens) red→green, then signal-first OnPush component rebuild, view mode, primary theming, demo + showcase. form-generic untouched.
approvedAt: 2026-06-05T07:14+07:00
approvedBy: anh.hoang10@onemount.com
track: angular-portal
module: components
entity: query-builder
sourceSpecPath: .sdcorejs/specs/angular-portal/2026-06-05-07-14-query-builder-rebuild.md
taskCount: 14
phaseCount: 8
---

# Xây dựng lại `<sd-query-builder>` — Approved Plan

> Snapshot of the plan the user approved at the `06-review-plan` gate. The body below is the exact contract `07-write-code` executed. Do not edit by hand — re-author via `05-plan` + `06-review-plan` if the contract changes.

## Scope (recap from spec)

Rebuild `<sd-query-builder>` (signal-first, OnPush): operator theo field-type, output `Filter` cây lồng (root `FilterAndOr`) + `filters` mirror, `mode="view"` render chuỗi SQL-ish (field=label) highlight operator+value, primary color thay tím. Pure logic (model helpers + serializer + tree↔Filter map) đi TDD; template/scss post-hoc. Không đụng form-generic.

## Phases
- Phase 1 (model + types): task 1
- Phase 2 (serializer TDD red — stub + spec): tasks 2-3
- Phase 3 (serializer green): task 4
- Phase 4 (component rebuild .ts/.html/.scss): tasks 5-7
- Phase 5 (component spec): task 8
- Phase 6 (public API + doc + CHANGELOG): tasks 9-11
- Phase 7 (demo + showcase): tasks 12-13
- Phase 8 (final verify): task 14

## Tasks
1. CREATE projects/sdcorejs-angular/components/query-builder/src/query-builder.model.ts — SdQueryBuilderField, SdQueryBuilderFieldType, internal QbNode/QbGroup/QbRule, QbToken, QB_OPERATORS_BY_TYPE + QB_DEFAULT_OPERATOR_BY_TYPE, helper qbAllowedOperators/qbDefaultOperator, factory qbNewRule()/qbNewGroup()
2. CREATE projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.ts — stub signatures treeToFilter(group, fields)→Filter|null, filterToTree(filter)→QbGroup, filterToTokens(filter, fields)→QbToken[]
3. CREATE projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.spec.ts — TDD red: tree→Filter (nested FilterAndOr, BETWEEN→FilterBetween, NULL→FilterNoData, rule thiếu bị loại, rỗng→null); roundtrip filter→tree→filter; filterToTokens chuỗi đúng + token kinds (op/value/field/logic/paren), escape `'`, like '%v%', between a and b, field=label
4. EDIT projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.ts — impl đến khi spec Phase 2 xanh (green)
5. EDIT (rebuild) projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts — SdQueryBuilder OnPush + signal-first; inputs fields/mode/disabled/autoId, models value/filters/rootLogic; internal tree signal; add/remove rule+group, toggle logic, pick field→reset operator/value, pick operator, set value; effect sync value↔filters (guard re-entry); tokens = computed(filterToTokens(value, fields))
6. EDIT (rebuild) projects/sdcorejs-angular/components/query-builder/src/query-builder.component.html — edit: cây group/rule với <sd-select> field picker + <sd-operator> + value editor @switch(field.type) (string/number→<sd-input>, boolean→select 2 option, date/datetime→<sd-date>/<sd-datetime>, values→<sd-select>, BETWEEN→cặp + —, NULL/NOT_NULL→ẩn); view: <div class="qb-view">@for(t of tokens()) span theo t.kind
7. EDIT (rebuild) projects/sdcorejs-angular/components/query-builder/src/query-builder.component.scss — primary token (var(--sd-primary*)) thay #6246a8/#f3f0fa; .qb-view look input disabled; .qb-tok-op/.qb-tok-value/.qb-tok-field/.qb-tok-logic highlight
8. CREATE projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts — type→operator + selector ẩn khi 1 op (AC1), value editor theo type (AC2), [(value)] emit Filter hợp lệ (AC3), [(filters)] sync không lặp (AC4), mode=view read-only + chuỗi + highlight span (AC5/AC6), không class tím (AC7)
9. EDIT projects/sdcorejs-angular/components/query-builder/index.ts — export * from './src/query-builder.model' (+ serializer nếu public)
10. EDIT projects/sdcorejs-angular/components/query-builder/sd-query-builder.md — rewrite doc theo API mới
11. EDIT CHANGELOG.md — Unreleased: rebuild sd-query-builder (operator-by-type, Filter output, view mode, primary theming)
12. EDIT projects/demo/src/app/pages/sd-query-builder/sd-query-builder.component.ts + .html — fields mẫu đủ type, [(value)], toggle edit/view, in Filter JSON + chuỗi raw
13. EDIT projects/showcase/src/app/pages/components/query-builder/query-builder-demo.component.ts — đồng bộ API mới (route + sidebar đã tồn tại)
14. (final verify) — no new files

## Verification
- npm run build (lib gate thật)
- npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/components/query-builder/**/*.spec.ts' (Phase 3 green + Phase 5 full)
- npx ng build showcase --configuration=development
- Manual: demo/showcase trang query-builder → đổi field type thấy operator đổi; build query nhóm lồng; bật view thấy (Mã = 'ABC' and Tên like '%abc%') or Giá > 100 highlight

## Acceptance ↔ task map
AC1 type→operator → P1/P5 · AC2 value editor → P4/P5 · AC3 Filter output → P2/P3/P5 · AC4 filters sync → P4/P5 · AC5 view chuỗi → P2/P3/P5 · AC6 highlight → P4/P5 · AC7 hết tím → P4/P5 · AC8 build/test/showcase → P3/P5/P7/P8

## Decisions captured during review

(approved as drafted — attempt 1, no edits)

Planning-style signals locked this round:
- **TDD red→green chỉ cho pure logic** (serializer + tree↔Filter map) — match repo rule "TDD cho components/" + prior inline-text/sd-tab plans; template/scss + component behavior đi post-hoc qua component spec ở Phase 5.
- **Per-phase verification** (serializer test sau Phase 3, full suite sau Phase 5, build gate Phase 8) — mirror inline-text plan cadence.
- **Rebuild component gộp .ts/.html/.scss thành 1 phase** (Phase 4) — 3 file cùng component, review chung 1 batch.
- **Demo + showcase 1 phase** (Phase 7); route + sidebar đã tồn tại nên chỉ edit demo component, không thêm route/nav.
- Plan + spec viết tiếng Việt theo ngôn ngữ user; technical terms tiếng Anh.

## Skill provenance
05-plan → 06-review-plan (approved on attempt 1 / 3)
