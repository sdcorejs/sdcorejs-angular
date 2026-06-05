---
name: query-builder-rebuild
description: Rebuild <sd-query-builder> — operator-by-field-type, nested Filter output (FilterAndOr root) + flat filters mirror, SQL-ish view mode with field=label + highlight, primary-color theming. Does NOT swap form-generic this round.
approvedAt: 2026-06-05T07:14+07:00
approvedBy: anh.hoang10@onemount.com
track: angular-portal
module: components
entity: query-builder
sourceSpecPath: .sdcorejs/docs/angular-portal/2026-06-05-07-14-query-builder-rebuild-spec.md
---

# Xây dựng lại `<sd-query-builder>` — Approved Spec

> Snapshot of the spec the user approved at the `04-review-spec` gate. The body below is the exact contract `05-plan` consumed. Do not edit by hand — re-author via `03-write-spec` + `04-review-spec` if the contract changes.

## Goals

1. **Operator theo type đầy đủ**: mỗi rule chọn field → suy ra tập operator hợp lý theo `type` của field (string/number/boolean/date/datetime/values), hiển thị qua `<sd-operator>` có sẵn; value editor đổi control theo type.
2. **Output = `Filter` của core utils**: builder emit **cây lồng nhau** — root là `FilterAndOr {operator:'AND'|'OR', data: Filter[]}`. Đồng thời expose `filters: Filter[]` (= `root.data`) cho tương thích `<sd-query-bar>`.
3. **View mode**: thêm chế độ `view` — `<div>` nhìn như input disabled nhưng render chuỗi query raw kiểu SQL-ish, vd `(Mã = 'ABC' and Tên like '%abc%') or Giá > 100`, highlight riêng operator + value. Token field hiển thị bằng **label**.
4. **Primary color**: thay tím hardcode bằng `var(--sd-primary)` / `var(--sd-primary-light)` / `var(--sd-primary-dark)`.
5. Mục tiêu xa: thay thế query-builder trong `form-generic`. Round này build component đủ năng lực thay thế, **chưa** đụng form-generic.

## Non-goals

- Không swap `expression-builder`/`BuildQueries` trong `form-generic` round này (model runtime khác: `SdFormGenericExpression`, `${field}` template, `dayInfo`, JS `===` eval) — tách follow-up.
- Không saved-filters / persist localStorage (đã có ở query-bar).
- Không drag-and-drop sắp xếp lại rule/group.
- Không free-text search box (phạm vi query-bar).
- Không hỗ trợ `lazy-values` round này — chỉ `values` đồng bộ.

## Architecture

Rebuild trọn `<sd-query-builder>`: standalone, `ChangeDetectionStrategy.OnPush`, signal-first (`input()`/`model()`/`computed()`), thay prototype default-CD + `@Input/@Output` cũ. Self-contained: model field riêng trong package query-builder (không import nội bộ query-bar), nhưng mượn `Operator`/`Filter` từ `@sdcorejs/utils/models` và `<sd-operator>` từ `@sdcorejs/angular/components/operator`.

**Hai tầng dữ liệu:**
- Internal tree (state UI): `QbNode = QbGroup | QbRule`. `QbGroup { id; logic:'AND'|'OR'; children: QbNode[] }`, `QbRule { id; field?; operator?; value? }`. `id` để `@for` track + đóng/mở menu; không lọt ra ngoài.
- Public output `Filter`: `QbGroup`→`FilterAndOr` (`logic`→`operator`); `QbRule`→`FilterHasData`/`FilterBetween`/`FilterNoData`. Bỏ qua rule chưa đủ field/operator/value khi build output → `Filter` luôn hợp lệ.

**Field metadata**: `SdQueryBuilderField { key; label; type; operators?; defaultOperator?; values?; trueLabel?; falseLabel?; min?; max? }`. Bảng `QB_OPERATORS_BY_TYPE` (mirror `SD_QUERY_OPERATORS_BY_TYPE`) + `QB_DEFAULT_OPERATOR_BY_TYPE`; `field.operators`/`defaultOperator` override. Helper `qbAllowedOperators(field)`, `qbDefaultOperator(field)`.

**Public API (signals):**
- `fields = input<SdQueryBuilderField[]>([])` — metadata field.
- `value = model<Filter | null>(null)` — canonical: cây root `FilterAndOr` (null khi rỗng). `[(value)]`.
- `filters = model<Filter[]>([])` — tiện ích = `value.data`. Sync: ghi `value`→cập nhật `filters`; ghi `filters`→rebuild `value` = `{operator: rootLogic, data: filters}`. `value` thắng khi cùng seed.
- `mode = input<'edit'|'view'>('edit')` — `view` render chuỗi raw, không sửa.
- `rootLogic = model<'AND'|'OR'>('AND')` — logic root (đồng bộ `value.operator`).
- `disabled`, `autoId`.

**View-mode serializer** (`query-builder.serializer.ts`): `Filter → QbToken[]`, token `{ text; kind: 'field'|'op'|'value'|'logic'|'paren'|'plain' }` để bọc `<span>` highlight. field=label (fallback key); operator→SQL-ish (`= != > < >= <=`, `like '%v%'`, `not like`, `in (…)`, `not in (…)`, `between a and b`, `is null`, `is not null`); value string→`'v'` (escape `'`→`''`), number/boolean raw, mảng→`'a', 'b'`, date→`'yyyy/MM/dd'`, boolean→`trueLabel`/`falseLabel`; `and`/`or` thường; group bọc `( … )` khi >1 con hoặc nhóm lồng.

**Edit-mode controls**: field picker→`<sd-select>`/`<sd-autocomplete>` từ `fields`; operator→`<sd-operator [operators]=qbAllowedOperators(field)>`; value theo type — string/number→`<sd-input>`, boolean→toggle/select 2 option, date/datetime→`<sd-date>`/`<sd-datetime>`, values→`<sd-select>` từ `field.values`, BETWEEN→cặp control + `—`, NULL/NOT_NULL→ẩn value. Selector ẩn khi 1 operator.

## Acceptance criteria

1. Chọn field type khác → tập operator đổi đúng `QB_OPERATORS_BY_TYPE` (string: CONTAIN/EQUAL/…/NULL; number: EQUAL/…/BETWEEN; values: IN/NOT_IN/NULL/NOT_NULL). 1 operator → selector ẩn.
2. Value editor đổi control theo type: number→numeric, boolean→2 lựa chọn, date/datetime→picker, values→select từ `field.values`, BETWEEN→2 control + `—`, NULL/NOT_NULL→không value.
3. `[(value)]` emit `Filter` hợp lệ: nhóm lồng→root `FilterAndOr` với `data` chứa rule + sub-`FilterAndOr`; BETWEEN→`FilterBetween {from,to}`; NULL/NOT_NULL→`FilterNoData`. Rule thiếu→loại khỏi output. Rỗng→`value = null`.
4. `[(filters)]` = `value.data`; seed `filters` rebuild root đúng; không vòng lặp emit.
5. `mode="view"`: render `<div>` như input disabled (không sửa), chuỗi đúng `(Mã = 'ABC' and Tên like '%abc%') or Giá > 100` — field=label, `and`/`or` thường, group `()`, string nháy đơn, CONTAIN→`like '%…%'`, BETWEEN→`between a and b`, NULL→`is null`.
6. View mode highlight: operator + value trong `<span>` class riêng (màu khác text thường); field token có class riêng.
7. Không còn tím hardcode (`#6246a8`/`#f3f0fa`/`#f0f0fa`) trong scss; active pill/hover/focus dùng `var(--sd-primary*)`.
8. `npm run build` sạch; `npm run test -- --watch=false --include=projects/sdcorejs-angular/components/query-builder/**/*.spec.ts` xanh; demo + showcase build + mở được trang query-builder.

## Decisions captured during review

(approved as drafted — attempt 1, no edits)

Key design decisions locked during clarify (deltas shaping the contract):
- **Output = cây lồng nhau** (root `FilterAndOr`) thay vì phẳng `Filter[]` như query-bar — giữ đúng bản chất nhóm AND/OR lồng; vẫn expose `filters` mirror cho parity.
- **Field config riêng** trong package query-builder (không tái dùng `SdQueryField` của query-bar) — component self-contained, decoupled; chỉ mượn `Operator`/`Filter`/`<sd-operator>`.
- **View mode field = label** (không phải raw key) — dễ đọc cho end-user; chuỗi vẫn SQL-ish như ví dụ.
- **Scope: chưa swap form-generic** — model runtime khác, tách follow-up để giảm rủi ro.
- Spec viết tiếng Việt (theo ngôn ngữ user), technical terms tiếng Anh; code labels/messages VI.

## Skill provenance

02-clarify (4 design Qs) → 03-write-spec → 04-review-spec (approved on attempt 1 / 3)
