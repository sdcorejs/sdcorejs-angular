# Spec — Xây dựng lại `<sd-query-builder>` (operator/type đầy đủ + view mode + output Filter) — 2026-06-05 07:14

## Problem & Goals

`<sd-query-builder>` hiện chỉ là khung sườn prototype: dùng type ad-hoc (`QueryRule`/`QueryGroup`), operator hardcode `Equal`/`Not Equal`, field/value là plain `<input>`, màu tím `#6246a8` hardcode, và **không** xuất ra `Filter` của `@sdcorejs/utils`. Luồng UI cây AND/OR đã chạy nhưng chưa có giá trị thực dùng.

Mục tiêu round này:

1. **Operator theo type đầy đủ**: mỗi rule chọn field → suy ra tập operator hợp lý theo `type` của field (string/number/boolean/date/datetime/values), hiển thị qua `<sd-operator>` có sẵn; value editor đổi control theo type.
2. **Output = `Filter` của core utils**: builder emit **cây lồng nhau** — root là `FilterAndOr {operator:'AND'|'OR', data: Filter[]}` — đúng bản chất nhóm AND/OR lồng. Đồng thời expose `filters: Filter[]` (= `root.data`) cho tương thích với `<sd-query-bar>`.
3. **View mode**: thêm chế độ `view` — một `<div>` nhìn như input disabled nhưng render **chuỗi query raw** kiểu SQL-ish, ví dụ `(Mã = 'ABC' and Tên like '%abc%') or Giá > 100`, có **highlight** riêng cho operator và value. Token field hiển thị bằng **label** của field.
4. **Primary color**: thay toàn bộ tím hardcode bằng token theme `var(--sd-primary)` / `var(--sd-primary-light)` / `var(--sd-primary-dark)`.
5. Mục tiêu xa: thay thế query-builder trong `form-generic` (`expression-builder`/`BuildQueries`). Round này build component đủ năng lực thay thế, **chưa** đụng form-generic.

Thành công = component dùng được thật (chọn field theo metadata, operator đúng type, value đúng kiểu), `[(value)]` ra `Filter` hợp lệ, có `mode="view"` render chuỗi raw highlight, build/test/showcase xanh.

## Non-goals

- **Không** swap `expression-builder`/`BuildQueries` trong `form-generic` round này (model runtime khác: `SdFormGenericExpression`, `${field}` template, `dayInfo` ngày tương đối, output JS `===` để eval) — tách follow-up.
- Không làm saved-filters / persist localStorage (đã có ở query-bar, không nhân bản).
- Không drag-and-drop sắp xếp lại rule/group.
- Không free-text search box (đó là phạm vi query-bar).
- Không hỗ trợ `lazy-values` (server-backed search) round này — chỉ `values` đồng bộ; lazy là follow-up.

## Architecture

Rebuild trọn `<sd-query-builder>` theo chuẩn lib: **standalone, `ChangeDetectionStrategy.OnPush`, signal-first** (`input()`/`model()`/`computed()`), thay cho prototype default-CD + `@Input/@Output` cũ. Component **self-contained**: định nghĩa model field riêng trong package query-builder (không import nội bộ query-bar), nhưng mượn vocabulary `Operator`/`Filter` từ `@sdcorejs/utils/models` và component `<sd-operator>` từ `@sdcorejs/angular/components/operator` để không phát minh lại operator picker.

**Hai tầng dữ liệu, tách bạch:**

- **Internal tree** (chỉ sống trong component, mang state UI): `QbNode = QbGroup | QbRule`. `QbGroup { id; logic:'AND'|'OR'; children: QbNode[] }`, `QbRule { id; field?; operator?; value? }`. `id` để `@for` track + đóng/mở menu; không lọt ra ngoài.
- **Public output** `Filter` (core utils): map internal ↔ `Filter`. `QbGroup` → `FilterAndOr` (`logic` → `operator`); `QbRule` → `FilterHasData` (single value), `FilterBetween` (BETWEEN), hoặc `FilterNoData` (NULL/NOT_NULL). Map bỏ qua rule chưa đủ (thiếu field/operator/value) khi build output để `Filter` luôn hợp lệ.

**Field metadata**: `SdQueryBuilderField { key; label; type; operators?; defaultOperator?; values?; trueLabel?; falseLabel?; min?; max? }`. Bảng `QB_OPERATORS_BY_TYPE` (mirror `SD_QUERY_OPERATORS_BY_TYPE` của query-bar) + `QB_DEFAULT_OPERATOR_BY_TYPE` quyết định operator khả dụng theo type; `field.operators`/`defaultOperator` override. Helper `qbAllowedOperators(field)`, `qbDefaultOperator(field)`.

**Public API (signals):**
- `fields = input<SdQueryBuilderField[]>([])` — metadata field; bắt buộc để chọn field + suy operator.
- `value = model<Filter | null>(null)` — **canonical**: cây root `FilterAndOr` (null khi rỗng). Two-way `[(value)]`.
- `filters = model<Filter[]>([])` — tiện ích = `value.data` (con trực tiếp của root group). Sync: ghi `value` → cập nhật `filters`; ghi `filters` → rebuild `value` = `{operator: rootLogic, data: filters}`. `value` thắng khi cả hai cùng seed. (Mirror `[(filters)]` của query-bar.)
- `mode = input<'edit' | 'view'>('edit')` — `view` render chuỗi raw, không cho sửa.
- `rootLogic = model<'AND'|'OR'>('AND')` — logic của root group (đồng bộ với `value.operator`).
- `disabled`, `autoId` — chuẩn lib.
- `valueChange`/`filtersChange` (do `model` tự sinh).

**View-mode serializer** (`query-builder.serializer.ts`): `Filter → QbToken[]`, mỗi token `{ text; kind: 'field'|'op'|'value'|'logic'|'paren'|'plain' }` để template bọc `<span>` highlight (không serialize thẳng ra string vì cần highlight). Quy tắc:
- field token = **label** (tra `fields` theo key; fallback key nếu không thấy).
- operator → token SQL-ish: `EQUAL =`, `NOT_EQUAL !=`, `GREATER_THAN >`, `LESS_THAN <`, `GREATER_OR_EQUAL >=`, `LESS_OR_EQUAL <=`, `CONTAIN like '%v%'`, `NOT_CONTAIN not like '%v%'`, `START_WITH like 'v%'`, `NOT_START_WITH not like 'v%'`, `END_WITH like '%v'`, `NOT_END_WITH not like '%v'`, `IN in (…)`, `NOT_IN not in (…)`, `BETWEEN between a and b`, `NULL is null`, `NOT_NULL is not null`.
- value format: string → `'v'` (nháy đơn), number/boolean → raw, mảng (IN) → `'a', 'b'`, date/datetime → `'yyyy/MM/dd'` (qua `DateUtilities`). boolean hiển thị `trueLabel`/`falseLabel` nếu có.
- combinator: `and`/`or` **viết thường**; group bọc `( … )` khi có >1 con hoặc là nhóm lồng.

**Edit-mode controls**: field picker đổi từ plain input → `<sd-select>`/`<sd-autocomplete>` từ `fields`; operator → `<sd-operator [operators]=qbAllowedOperators(field)>`; value editor theo type — string→`<sd-input>`, number→`<sd-input>` number, boolean→toggle/`<sd-select>` 2 option, date/datetime→`<sd-date>`/`<sd-datetime>`, values→`<sd-select>` từ `field.values`, BETWEEN→cặp control + `—`, NULL/NOT_NULL→ẩn value. Operator selector ẩn khi chỉ 1 operator khả dụng.

Tham chiếu memory `inline-text-primitive` (forms/inline-text seamless primitive) — value editor có thể tái dùng `<sd-inline-text>` cho cảm giác liền mạch, nhưng không bắt buộc round này.

## File structure

Tất cả dưới `projects/sdcorejs-angular/components/query-builder/` trừ demo/showcase:

| File | Loại | Ý định |
| --- | --- | --- |
| `src/query-builder.model.ts` | **new** | `SdQueryBuilderField`, `SdQueryBuilderFieldType`, internal `QbNode`/`QbGroup`/`QbRule`, `QbToken`, bảng `QB_OPERATORS_BY_TYPE` + `QB_DEFAULT_OPERATOR_BY_TYPE`, helper `qbAllowedOperators`/`qbDefaultOperator`. |
| `src/query-builder.serializer.ts` | **new** | map internal tree ↔ `Filter` (FilterAndOr root); `filterToTokens(filter, fields)` → `QbToken[]` (SQL-ish, field=label, highlight). |
| `src/query-builder.component.ts` | **rebuild** | signal-first + OnPush; `fields`/`value`/`filters`/`mode`/`rootLogic`/`disabled`/`autoId`; mutate internal tree, emit `Filter`; add/remove rule+group, toggle logic, pick field/operator/value. |
| `src/query-builder.component.html` | **rebuild** | edit: cây group/rule với field picker + `<sd-operator>` + value editor theo type; view: `<div class="qb-view">` render `@for(token …)` với span highlight. |
| `src/query-builder.component.scss` | **rebuild** | primary token (`var(--sd-primary*)`) thay tím; view-mode trông như input disabled; class highlight `.qb-tok-op`/`.qb-tok-value`/`.qb-tok-field`/`.qb-tok-logic`. |
| `src/query-builder.component.spec.ts` | **new** | unit: type→operator, map tree→Filter (nested + BETWEEN + NULL), serializer ra chuỗi đúng + token kinds, view mode read-only, primary class. |
| `index.ts` | **modify** | export thêm `./src/query-builder.model` (+ serializer nếu public). |
| `sd-query-builder.md` | **rewrite** | doc component theo API mới (inputs/outputs/types/examples/anti-patterns). |
| `projects/demo/src/app/pages/sd-query-builder/sd-query-builder.component.ts` + `.html` | **modify** | demo: khai báo `fields` mẫu (đủ type), `[(value)]`, nút toggle edit/view, hiển thị `Filter` JSON + chuỗi raw. |
| `projects/showcase/src/app/pages/components/query-builder/query-builder-demo.component.ts` | **modify** | showcase đồng bộ API mới (giữ trang sống). |

## Acceptance criteria

1. Chọn field type khác nhau → tập operator đổi đúng theo `QB_OPERATORS_BY_TYPE` (vd string: CONTAIN/EQUAL/…/NULL; number: EQUAL/…/BETWEEN; values: IN/NOT_IN/NULL/NOT_NULL). Field 1 operator → selector ẩn.
2. Value editor đổi control theo type: number→numeric, boolean→2 lựa chọn, date/datetime→picker, values→select từ `field.values`, BETWEEN→2 control + `—`, NULL/NOT_NULL→không có value.
3. `[(value)]` emit `Filter` hợp lệ: nhóm lồng → root `FilterAndOr` với `data` chứa rule + sub-`FilterAndOr`; BETWEEN→`FilterBetween {from,to}`; NULL/NOT_NULL→`FilterNoData`. Rule chưa đủ field/operator/value bị loại khỏi output. Rỗng → `value = null`.
4. `[(filters)]` = `value.data` (con trực tiếp root); seed `filters` rebuild root đúng; không vòng lặp emit.
5. `mode="view"`: render `<div>` như input disabled (không sửa được), chuỗi đúng `(Mã = 'ABC' and Tên like '%abc%') or Giá > 100` — field=label, `and`/`or` thường, group bọc `()`, string có nháy đơn, CONTAIN→`like '%…%'`, BETWEEN→`between a and b`, NULL→`is null`.
6. View mode **highlight**: operator và value nằm trong `<span>` class riêng (màu khác text thường); field token cũng có class riêng.
7. **Không còn** màu tím hardcode (`#6246a8`/`#f3f0fa`/`#f0f0fa`) trong scss; active pill/hover/focus dùng `var(--sd-primary*)`.
8. `npm run build` sạch; `npm run test -- --watch=false --include=projects/sdcorejs-angular/components/query-builder/**/*.spec.ts` xanh; demo + showcase build và mở được trang query-builder.

## Risks & mitigations

- **Risk:** two-way `value` ↔ `filters` lặp emit vô hạn. → **Mitigation:** `value` là single source; `filters` chỉ mirror, guard so sánh tham chiếu/`equal` trước khi set; effect 1 chiều có cờ chặn re-entry.
- **Risk:** `Filter.field` là `NestedKeyOf<T>` (typed) còn config `key` là string. → **Mitigation:** cast `as any` ở biên giống query-bar (`field: field.key as any`).
- **Risk:** nhúng `<sd-select>`/`<sd-date>` vào rule row làm vỡ layout/chiều cao. → **Mitigation:** density compact, fix `height`, test layout ở demo.
- **Risk:** serializer + escape value (nháy đơn trong string) sai cú pháp. → **Mitigation:** escape `'`→`''`; unit test các operator + kiểu value.
- **Risk:** rebuild đập vỡ trang showcase/demo đang dùng API cũ. → **Mitigation:** cập nhật cả demo + showcase trong cùng round (đã liệt kê file).

## Out of scope (deferred)

- Swap `expression-builder`/`BuildQueries` trong `form-generic` — defer cho follow-up sau khi component ổn định, cần map `dayInfo`/relative-date + JS-eval + `${field}` template.
- `lazy-values` (server search trong value editor) — defer đến khi có nhu cầu field async trong builder.
- Saved-filters / drag-reorder / free-text search — defer (đã có hoặc thuộc query-bar).
- i18n cho token operator chuỗi raw (hiện symbol SQL cố định) — defer nếu cần đa ngôn ngữ chuỗi raw.

## Skill provenance

02-clarify (4 design Qs: output=cây lồng nhau / field config riêng / view SQL-ish field=label / scope chưa swap form-generic) → 03-write-spec → kế tiếp 04-review-spec (gate duyệt).
