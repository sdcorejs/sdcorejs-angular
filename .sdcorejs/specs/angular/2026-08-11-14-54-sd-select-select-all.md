---
artifact_id: spec-sd-select-select-all-2026-08-11-r1
artifact_kind: spec
schema_version: 1
change_ref: sd-select-select-all-2026-08-11
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-spec
name: sd-select-select-all
description: sd-select multiple thêm option "Chọn tất cả" opt-in qua showSelectAll cho items mảng tĩnh
contract_id: sd-select-select-all-2026-08-11
requirement_id: req-sd-select-select-all
owner_repository_id: sdcorejs-angular
owner_repository_role: library
owner_module_id: forms/select
repository_relative_path: .sdcorejs/specs/angular/2026-08-11-14-54-sd-select-select-all.md
source_revision: 65d5fa258c909b9b505bfc27198a4685490da93b
parent_repository_id: null
parent_references: []
approved_at: 2026-08-11T07:58:32.748Z
approved_by: null
approval_source: explicit-user-choice
track: angular
target_root_kind: target-project
stack_profile: core-ui-angular
profile_confidence: high
sourceDraftPath: .sdcorejs/docs/angular/2026-08-11-14-54-sd-select-select-all-spec.md
approval_hash: sha256:v1:818fd41079f33803472dc4962bfe39c0fe081238ab01d72ae992783fa9996a17
approved_spec_hash: sha256:v1:818fd41079f33803472dc4962bfe39c0fe081238ab01d72ae992783fa9996a17
acceptance_criteria_count: 9
manual_criteria_count: 1
redaction_applied: false
supersedes: null
change_control:
  revision: 1
  supersedes: null
  change_reason: null
---

# sd-select multiple "Chọn tất cả" (showSelectAll) - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - sd-select multiple "Chọn tất cả" (showSelectAll) - 2026-08-11 14:54

```yaml
spec_context:
  source: sdcorejs-spec
  contract_id: sd-select-select-all-2026-08-11
  requirement_id: req-sd-select-select-all
  approved_spec_path: ''
  approved_spec_hash: ''
  supersedes: null
  target_root: c:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: forms/select
  execution_host_repository_id: sdcorejs-angular
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: >-
    Brainstorming 2026-08-11 — user chốt: input showSelectAll (opt-in);
    search đang lọc thì tick all chọn thêm items khớp filter (additive);
    items disabled bỏ qua hoàn toàn; chỉ áp dụng khi items là mảng
    tĩnh/Signal, ẩn với SdSearch lazy.
  acceptance_criteria_count: 9
  manual_criteria_count: 1
  non_goals:
    - Select-all cho items dạng SdSearch (lazy/server search)
    - Select-all cho sd-autocomplete, sd-entity-picker hay control khác
    - Thay đổi semantics emit sdChange/sdSelection (vẫn bắn khi đóng panel)
    - Nút "Chọn tất cả" dạng footer action (đã có cơ chế sdSelectFooterAction riêng)
  risks:
    - Scope tick-all phải tính trên mảng nguồn đầy đủ, không phải filteredItems đã paging theo limit
    - Hàng select-all không được là mat-option thật — tránh lọt vào value/keyboard-selection của mat-select
  assumptions:
    - Signal<T[]> tính là mảng tĩnh (actualItems đã unwrap)
    - Thứ tự value sau tick all = giá trị đang chọn + items mới theo thứ tự mảng items
  redaction_applied: false
  approval:
    approved: false
    approved_at: null
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

`sd-select` multiple hiện chưa có cách chọn nhanh toàn bộ items — user phải tick từng option. Với danh sách cố định (mảng tĩnh) đây là thao tác lặp vô nghĩa, nhất là danh sách dài.

**Goal:** thêm option "Chọn tất cả" ở đầu panel khi `multiple` + items là mảng cố định, opt-in qua input mới `showSelectAll`. Tick = chọn toàn bộ items hợp lệ trong scope hiện tại; untick = bỏ chọn scope đó. Backward-compatible 100% — consumer không bật thì không đổi gì.

**Success:** consumer bật `showSelectAll`, mở panel, một click chọn/bỏ toàn bộ; trạng thái checkbox phản ánh đúng selection kể cả khi đang search hoặc có items disabled.

## Non-goals

- KHÔNG hỗ trợ items dạng hàm `SdSearch` (lazy/server search) — dataset không xác định, "tất cả" vô nghĩa; input bị bỏ qua (không render hàng select-all).
- KHÔNG thay đổi semantics emit: `sdChange`/`sdSelection` vẫn chỉ bắn khi đóng panel và giá trị đổi (hash so sánh hiện có).
- KHÔNG đụng single mode, `sd-autocomplete`, `sd-entity-picker`, `sd-tree-select`.
- KHÔNG thay thế / xung đột với `sdSelectFooterAction` (footer action là cơ chế khác, giữ nguyên).

## Architecture

Component: `forms/select` (`SdSelect`), Angular 19 standalone, signals-first, OnPush — theo convention repo.

### API mới

- `showSelectAll = input(false, { transform: booleanAttribute })` — opt-in, default `false`.

### Điều kiện render

Hàng "Chọn tất cả" render khi và chỉ khi cả 3 điều kiện đúng (computed `selectAllVisible`):

1. `showSelectAll()` = true
2. `multiple()` = true
3. `actualItems()` là mảng (`Array.isArray`) — bao phủ cả `T[]` lẫn `Signal<T[]>` (đã unwrap); hàm `SdSearch` bị loại.

Ẩn thêm khi danh sách scope rỗng (search không khớp item nào) — hàng select-all không có gì để thao tác.

### UI

- Hàng đầu panel, NGAY DƯỚI ô search (nếu có), TRÊN danh sách options. KHÔNG dùng `<mat-option>` thật — mat-select sẽ tính nó vào value/keyboard navigation. Dùng row div + `<mat-checkbox>` (MatCheckboxModule đã import sẵn trong component), pattern tương tự `.c-filter-input-container` / `.sd-select-footer-actions` hiện có.
- Label qua i18n: key mới `core.form.select.selectAll` thêm vào cả 5 locale (`vi`: "Chọn tất cả", `en`: "Select all", `zh`/`ja`/`ko` tương ứng).
- Checkbox 3 trạng thái: `checked` (toàn bộ items enabled trong scope đã chọn), `indeterminate` (một phần), unchecked (không item nào trong scope được chọn).
- E2E: row mang `data-autoid` = `<autoId>-select-all` khi component có `autoId` (theo scheme autoId hiện hành).

### Scope & hành vi toggle

**Scope** = các item trong `actualItems()` thỏa: khớp search text hiện tại (cùng luật `StringUtilities.aliasIncludes` trên value + display như filter hiện có) VÀ không disabled (`itemDisabled(item)` = false). Scope tính trên **mảng nguồn đầy đủ**, KHÔNG bị cắt bởi `limit` paging của `filteredItems`.

- **Tick** (từ unchecked/indeterminate): value mới = union(value hiện tại, values của scope) — **additive**: items đã chọn nằm ngoài filter hiện tại KHÔNG bị bỏ. Items mới thêm theo thứ tự mảng items.
- **Untick** (từ checked): value mới = value hiện tại TRỪ values của scope. Items disabled đang được chọn sẵn GIỮ NGUYÊN (không tick, không untick — bỏ qua hoàn toàn theo quyết định đã chốt).
- Sau toggle: mirror vào `formControl` + `valueModel` đúng đường `onSelectionChange` hiện tại (giữ guard `!==`, không emit trùng); KHÔNG bắn `sdChange`/`sdSelection` ngay — chờ đóng panel như hiện hành.

### Primitive vs object items

Hoạt động cả 2 nhánh template hiện có:
- `valueField`/`displayField` có: so khớp qua `itemValue(item)`.
- Primitive (không field): item chính là value.

## Stack profile and technology assumptions

- Track: angular
- Stack profile: core-ui-angular (chính là repo nguồn `@sdcorejs/angular`, sửa tại `versions/v19` rồi rollout)
- Profile evidence: `versions/v19/projects/sdcorejs-angular`, component `forms/select` standalone + signals, karma/jasmine test hiện có
- Technology assumptions: Angular 19, Material `MatSelect`/`MatCheckbox` (đã có trong imports), i18n qua `I18nService`, TDD bắt buộc cho `forms/` (CLAUDE.md v19)

## File structure

Tất cả sửa trong `versions/v19`, sau đó `npm run sync` rollout v20/v21:

- `versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.ts` — edit: input `showSelectAll`, computed `selectAllVisible`/`selectAllScope`/`selectAllState`, method `toggleSelectAll()`
- `versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.html` — edit: row select-all trong nhánh multiple
- `versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.scss` — edit: style `.sd-select-all-row` (đồng bộ look mat-option)
- `versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.spec.ts` — edit: specs TDD cho toàn bộ AC
- `versions/v19/projects/sdcorejs-angular/i18n/src/{vi,en,zh,ja,ko}.ts` — edit: key `core.form.select.selectAll`
- `versions/v19/projects/sdcorejs-angular/forms/select/sd-select.md` — edit: doc input mới + hành vi (cùng commit, luật docs)
- `showcase/src/app/pages/forms/select/select-demo.component.ts` — edit: demo section `showSelectAll` (heading + props badge theo convention)
- `versions/v20`, `versions/v21` — generated qua `npm run sync` (không sửa tay)

## Acceptance criteria

- AC-001 — `showSelectAll` + `multiple` + items mảng tĩnh (hoặc `Signal<T[]>`): panel render hàng "Chọn tất cả" đầu danh sách, label từ i18n `core.form.select.selectAll`.
- AC-002 — Không render hàng select-all khi bất kỳ: `showSelectAll` = false (default), `multiple` = false, items là hàm `SdSearch`.
- AC-003 — Tick khi chưa search: value = toàn bộ items enabled (bỏ qua items disabled); vượt `limit` paging — mảng 120 items, limit 50 → chọn đủ 120 items enabled.
- AC-004 — Untick từ trạng thái checked: bỏ chọn toàn bộ items enabled trong scope; item disabled đang được chọn sẵn vẫn giữ trong value.
- AC-005 — Đang search: tick all chọn THÊM items enabled khớp filter, union với selection hiện có (items đã chọn ngoài filter không mất); untick chỉ bỏ items khớp filter.
- AC-006 — Trạng thái checkbox: checked khi mọi item enabled trong scope đã chọn; indeterminate khi một phần; unchecked khi không có — tính đúng cả khi có items disabled xen kẽ.
- AC-007 — Toggle select-all cập nhật `formControl` + `valueModel`; `sdChange`/`sdSelection` KHÔNG bắn lúc toggle, chỉ bắn khi đóng panel với giá trị đã đổi (semantics hiện hành).
- AC-008 — Hoạt động cả nhánh primitive items (không `valueField`/`displayField`) lẫn object items.
- AC-009 — Row select-all mang `data-autoid="<autoId>-select-all"` khi có `autoId`.
- AC-M01 (manual) — Kiểm tra visual trong showcase `/forms/select`: alignment checkbox + label khớp look mat-option, hover state, không lệch khi panel hẹp/inline.

## Risks & mitigations

- **Risk:** Scope tính trên `filteredItems` (đã paging theo `limit`) → tick all thiếu items. → **Mitigation:** computed scope đọc thẳng `actualItems()` + search text, độc lập paging; AC-003 khóa bằng test 120 items/limit 50.
- **Risk:** Dùng `<mat-option>` thật cho hàng select-all → giá trị "select all" lọt vào `formControl.value`, keyboard arrow chọn nhầm. → **Mitigation:** row div + `mat-checkbox` ngoài danh sách options, như search row hiện có.
- **Risk:** Toggle làm mat-select CVA và `formControl` lệch nhau (bug class #24/#26 — setValue im lặng nuốt async validator event). → **Mitigation:** đi cùng đường `onSelectionChange` guard `!==`, KHÔNG dùng `{ emitEvent: false }`; spec test với `[validator]` async.
- **Risk:** Search text đổi trong khi panel mở → trạng thái checkbox stale. → **Mitigation:** state là computed từ `searchText` + value + items, tự recompute.
- **Risk:** Quên rollout v20/v21 → `check:sync` đỏ lúc release. → **Mitigation:** bước `npm run sync` nằm trong plan, guard CI đã có.

## Out of scope (deferred)

- Select-all cho items lazy (`SdSearch`) — defer đến khi có yêu cầu thật + thiết kế "chọn tất cả theo query server".
- Tùy biến label select-all per-instance (input `selectAllLabel`) — defer đến khi có consumer cần; i18n key đủ cho hiện tại.
- Nút "Bỏ chọn tất cả" riêng / hành vi 2 nút — checkbox 3 trạng thái đã bao phủ.

## Decisions captured during review

- (approved as drafted)

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)
