---
artifact_id: spec-acb-source-row-simplify-r1
artifact_kind: spec
schema_version: 1
change_ref: acb-source-row-simplify
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-spec
name: acb-source-row-simplify
description: Value-source row simplified to one dropdown, typed static controls, advanced expression mode, JSON copy/paste.
contract_id: acb-source-row-simplify
requirement_id: acb-source-row-simplify
owner_repository_id: github.com/sdcorejs/sdcorejs-angular
owner_repository_role: library
owner_module_id: api-contract-builder
repository_relative_path: .sdcorejs/specs/angular/2026-08-17-14-59-acb-source-row-simplify.md
source_revision: a73ac65b0731d794a613326ddd4924497424b3d6
parent_repository_id: null
parent_references: []
approved_at: 2026-08-17T08:08:18.738Z
approved_by: nghiatt15_onemount
approval_source: explicit-user-choice
track: angular
target_root_kind: target-project
stack_profile: core-ui-angular
profile_confidence: high
sourceDraftPath: .sdcorejs/docs/angular/2026-08-17-14-59-acb-source-row-simplify-spec.md
approval_hash: "sha256:v1:decedf65e42b700239784544b52159fd2dcd8b3be42156f27d422d7d02e2a462"
approved_spec_hash: "sha256:v1:decedf65e42b700239784544b52159fd2dcd8b3be42156f27d422d7d02e2a462"
acceptance_criteria_count: 12
manual_criteria_count: 2
redaction_applied: false
supersedes: null
change_control: 
  change_reason: null
  revision: 1
  supersedes: null
---

# Đơn giản hoá hàng Nguồn giá trị + copy/paste JSON cho `<sd-api-contract-builder>` - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Đơn giản hoá hàng Nguồn giá trị + copy/paste JSON cho `<sd-api-contract-builder>` - 2026-08-17 14:59

```yaml
spec_context:
  source: sdcorejs-spec
  contract_id: acb-source-row-simplify
  requirement_id: acb-source-row-simplify
  approved_spec_path: ''
  approved_spec_hash: ''
  supersedes: null
  target_root: C:\Users\nghiatt15_onemount\Documents\sdcorejs\sdcorejs-angular
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  owner_repository_role: library
  owner_module_id: null
  execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: acb-source-row-simplify (sdcorejs-brainstorming, 2026-08-17)
  acceptance_criteria_count: 12
  manual_criteria_count: 2
  non_goals:
    - Thực thi contract (gửi HTTP request)
    - OpenAPI / GraphQL / SOAP import-export
    - Transform theo từng phần tử của array
    - Sửa lỗi mất dữ liệu khi rename key thành `__proto__` (theo dõi riêng)
    - Sub-editor JSON tự viết cho static object/array (dùng `<sd-code-editor>` sẵn có)
  risks:
    - Paste JSON thô làm lộ lỗi `deepClone` nuốt own-key `__proto__`
    - Guard `_lastEmittedValue` của `<sd-code-editor>` bỏ qua re-format giá trị nó vừa bắn ra
    - `<sd-code-editor>` dùng `ViewEncapsulation.None`
  assumptions:
    - Contract đang mở luôn có đúng một `<sd-code-editor>` ở step 6, không có editor thứ hai ghi cùng model
    - Danh sách suggestion hiện tại (`requestSuggestions` / `outputSuggestions`) đủ làm nguồn cho dropdown, không cần nguồn mới
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

Hàng `Nguồn giá trị` của một node đang bày ba control cùng lúc: select mode, ô text `Biểu thức nguồn`, và select `Chèn tham chiếu`. Người khai báo contract phải biết cú pháp `${input.field}` mới điền được, còn `Chèn tham chiếu` chỉ **nối thêm** text vào cuối ô — nó không phải cách chọn nguồn, chỉ là phím tắt gõ. Kết quả: việc thường gặp nhất (trỏ một trường vào một nguồn đã khai báo) lại là việc khó nhất trên giao diện.

Ô `Giá trị tĩnh` cũng không phản ánh type đã khai: `date` / `datetime` / `object` / `array` đều nhận cùng một ô text.

Hàng mapping còn là hàng **duy nhất** chạy hết chiều rộng: `<sd-api-contract-source-editor>` là component sibling đứng ngoài grid của node (`:host { width: 100% }` + flex), trong khi mọi `.sd-acb-node__row` đều chừa 36px cho slot xoá. Vì vậy hàng `Nhãn` / `Mô tả` trông ngắn hơn hàng mapping bên dưới.

Cuối cùng, step 6 chỉ đọc được: `<sd-code-editor [viewed]="true">`. Không có đường dán một contract có sẵn vào để sửa tiếp.

**Mục tiêu**

1. Chọn nguồn bằng **một** dropdown; không cần biết cú pháp `${…}`.
2. Nhập giá trị tĩnh bằng control khớp type đã khai.
3. Giữ được template ghép literal + reference (`Bearer ${env.token}`) qua một mode riêng.
4. Mọi hàng trong một node thẳng cột với nhau.
5. Copy và paste toàn bộ contract JSON, tự format.

**Thành công** = một integrator dựng xong contract `GET` tìm kiếm mà không gõ ký tự `$` nào, và dán được contract của đồng nghiệp vào để sửa.

## Non-goals

- Thực thi contract — component vẫn không bao giờ gửi request.
- OpenAPI / GraphQL / SOAP import-export.
- Transform theo từng phần tử của array.
- **Không** sửa lỗi rename key thành `__proto__` làm mất entry (`api-contract.schema.ts`). Ghi nhận là rủi ro, xử lý ở change riêng.
- **Không** viết sub-editor JSON riêng cho static object/array — dùng `<sd-code-editor>`.
- Không đổi model contract, không đổi serializer, không đổi luật validation.

## Architecture

### Mode thứ ba: `advanced`

`SdApiContractValueMode` nới từ `'source' | 'static' | 'nested' | 'none'` thành thêm `'advanced'`. Mode **không** lưu trong contract — nó được suy ra từ `node.source`, đúng như hiện tại, nên file JSON không đổi hình dạng và contract cũ không cần migrate.

Suy mode dùng `parseSdApiContractTemplate` đã có (`api-contract.expression.ts`), vì nó đã phân loại sẵn `SdApiContractTemplateKind`:

| `node.source` | `kind` | Mode |
| --- | --- | --- |
| `undefined` | — | `static` / `nested` / `none` như hiện tại |
| `${input.keyword}` | `exact` | `source` → **một dropdown** |
| `Bearer ${env.token}` | `interpolated` | `advanced` → ô text thô |
| `plain text` | `literal` | `advanced` → ô text thô |

> Điều chỉnh so với brainstorming: dùng `kind === 'exact'` chứ **không** đối chiếu với danh sách suggestion. Một reference sạch nhưng trỏ vào trường không tồn tại vẫn ở lại mode `source` thân thiện, và validation vẫn báo `mapping.reference.missing` như cũ — thay vì bị đẩy sang `advanced` chỉ vì trỏ sai.

### Hàng `source`: một dropdown

Ở mode `source`, template bỏ `<sd-input>` biểu thức và bỏ select `Chèn tham chiếu`. Thay bằng một `<sd-select>` lấy `items` từ `suggestionOptions()` (đã có), `valueField="expression"`, `displayField="display"`, `[model]="node.source"`. Chọn một mục ghi thẳng `source` = expression đó — không nối chuỗi.

Khi `source` là `exact` nhưng path không có trong `items` (trường đã bị xoá/đổi tên), dropdown vẫn phải hiển thị path đang lưu chứ không được tự xoá về rỗng. Bổ sung một option "phantom" dựng từ chính `source` để giữ giá trị hiển thị; validation lo phần báo lỗi.

### Hàng `static`: control theo type

| `node.type` | Control |
| --- | --- |
| `string` | `<sd-input>` |
| `number` | `<sd-input-number>` |
| `boolean` | `<sd-select>` Đúng/Sai (giữ nguyên) |
| `date` | `<sd-date>` |
| `datetime` | `<sd-datetime>` |
| `object`, `array` | `<sd-code-editor language="json">` |

`object` / `array` chỉ vào được mode `static` khi người dùng chủ động chọn — `modeOptions` hiện tại không cho `static` với hai type đó. Spec này **mở** `static` cho `array` và `object`; `nested` vẫn là mặc định của `object`. Giá trị ghi vào `node.value` là object/array thật do `<sd-code-editor>` `JSON.parse` ra; khi JSON đang gõ dở, editor bắn ra `string` — lúc đó **giữ nguyên `node.value` cũ** và không ghi chuỗi rác vào contract.

Ba control mới (`sd-input-number`, `sd-date`, `sd-datetime`, `sd-code-editor`) thêm vào `imports` của `SdApiContractSourceEditor`. Tất cả đều `size="sm" hideInlineError` cho khớp hàng hiện tại.

### Căn hàng

`<sd-api-contract-source-editor>` nhận thêm một ô giữ chỗ 36px ở cuối `.sd-acb-source` (cùng idiom `.sd-acb-node__remove` đang dùng cho hàng meta), để nó dừng đúng chỗ như mọi hàng grid. Không đổi `grid-template-columns` của `.sd-acb-node__row` — hàng meta đã span `1/3` + `3/5` là đúng.

### Copy/paste JSON ở step 6

`<sd-code-editor>` bỏ `[viewed]="true"` → editable. Nút Copy đã có sẵn trong component. Chiều paste đi qua `[(model)]`:

- Editor bắn ra **object** khi JSON hợp lệ → builder chạy đúng luồng nạp contract ngoài đang có: clone, validate, phát `diagnosticsChange` / `validChange`, **không sửa chữa gì**.
- Editor bắn ra **string** khi JSON sai cú pháp → builder giữ nguyên draft và phát một diagnostic `contract.invalid` (code đã tồn tại) thay vì thay contract bằng chuỗi.
- Auto-format: builder set lại model bằng **object reference mới** (contract đã clone) nên guard `_lastEmittedValue` không khớp → effect của editor chạy `JSON.stringify(…, null, 2)`. Đây là hành vi cần có test khoá lại, vì nó phụ thuộc chi tiết bên trong `<sd-code-editor>`.

`json()` hiện là **string** từ `serializeSdApiContract` (giữ thứ tự key canonical). Đổi binding step 6 sang two-way object sẽ mất thứ tự đó khi hiển thị. Vì vậy: **giữ `[model]="json()"` là string** cho chiều hiển thị, và bắt `(modelChange)` để xử lý chiều vào. String đi vào editor không bị `JSON.stringify` lại nên thứ tự key của serializer vẫn nguyên.

### i18n

Thêm key mới vào cả 5 catalog (`vi`, `en`, `ja`, `ko`, `zh`):

- `core.component.api-contract-builder.mapping.mode.advanced` — vi: `Nâng cao`
- `core.component.api-contract-builder.review.paste-invalid` — vi: `JSON không hợp lệ, contract giữ nguyên`

`core.component.api-contract-builder.mapping.insert` không còn dùng → xoá khỏi cả 5 catalog.

## Stack profile and technology assumptions

- Track: `angular`
- Stack profile: `core-ui-angular`
- Profile evidence: repo này **là** `@sdcorejs/angular`; `versions/v19/projects/sdcorejs-angular/components/api-contract-builder` tồn tại; `SdCodeEditor` / `SdInputNumber` / `SdDate` / `SdDatetime` đều là entry point sẵn có trong cùng lib.
- Technology assumptions (explicit): Angular 19, standalone, signals, OnPush, `@let` caching cho signal đọc từ 2 lần, i18n qua `I18nService`, `autoId` cho mọi control mới.
- Chỉ sửa `versions/v19`; `v20` / `v21` sinh ra bằng `npm run sync`, verify bằng `npm run check:sync`.
- Không thêm dependency mới.

## File structure

**Sửa — thư viện (`versions/v19/projects/sdcorejs-angular/`)**

- `components/api-contract-builder/src/components/api-contract-source-editor.component.ts` — thêm mode `advanced`, dropdown nguồn, control static theo type, ô giữ chỗ 36px.
- `components/api-contract-builder/src/api-contract-builder.component.html` — step 6 editor thành editable + xử lý paste.
- `components/api-contract-builder/src/api-contract-builder.component.ts` — handler nhận JSON dán vào, phát diagnostic khi sai.
- `components/api-contract-builder/sd-api-contract-builder.md` — cập nhật bảng mode, bảng control static, mục copy/paste JSON.
- `i18n/src/{vi,en,ja,ko,zh}.ts` — thêm 2 key, xoá `mapping.insert`.

**Sửa — test (TDD, viết trước)**

- `components/api-contract-builder/src/components/api-contract-source-editor.component.spec.ts` — **tạo mới** (hiện chưa có spec riêng cho source editor).
- `components/api-contract-builder/src/api-contract-builder.component.spec.ts` — thêm case paste JSON + case round-trip `Bearer ${env.token}`.

**Sửa — showcase + changelog (root repo)**

- `showcase/src/app/pages/components/api-contract-builder/api-contract-builder-demo.component.ts` — thêm section cho 3 mode + static theo type + paste JSON.
- `CHANGELOG.md` — entry dưới `## [Unreleased]`.

**Sinh ra tự động, không sửa tay**

- `versions/v20/**`, `versions/v21/**` — qua `npm run sync`.

## Acceptance criteria

- **AC-001** — Mode `Lấy từ nguồn` được chọn: render đúng **một** `<sd-select>` nguồn; không có `<sd-input>` biểu thức và không có select `Chèn tham chiếu` trong DOM.
- **AC-002** — Chọn một mục trong dropdown nguồn: `node.source` bằng đúng expression của mục đó (ghi đè, không nối chuỗi), và phát đúng **một** `nodeChange`.
- **AC-003** — Nạp contract có `source: 'Bearer ${env.token}'`: hàng mở ở mode `Nâng cao`, ô text hiện đúng chuỗi gốc; serialize lại ra chuỗi y nguyên.
- **AC-004** — Nạp contract có `source: '${input.keyword}'`: hàng mở ở mode `Lấy từ nguồn` với dropdown đã chọn đúng mục.
- **AC-005** — Nạp contract có `source: '${input.khongTonTai}'`: hàng vẫn ở mode `Lấy từ nguồn`, dropdown vẫn hiện path đó, và diagnostics vẫn chứa `mapping.reference.missing`.
- **AC-006** — Mode `Giá trị tĩnh` trên node `datetime` render `<sd-datetime>`; trên `date` render `<sd-date>`; trên `number` render `<sd-input-number>`; trên `boolean` render `<sd-select>`; trên `object` và `array` render `<sd-code-editor language="json">`.
- **AC-007** — Static `object`: gõ JSON hợp lệ vào code editor ghi object đã parse vào `node.value`. Gõ JSON sai cú pháp **không** ghi gì — `node.value` giữ giá trị hợp lệ trước đó.
- **AC-008** — Dán một contract JSON hợp lệ vào editor step 6: model contract được thay, `diagnosticsChange` và `validChange` phát lại, và text trong editor hiển thị đã format 2 space.
- **AC-009** — Dán JSON sai cú pháp vào editor step 6: contract **không** đổi, và diagnostics chứa `contract.invalid`.
- **AC-010** — Dán một contract có `req.query` rỗng và thiếu `output`: contract nạp **verbatim** kèm diagnostics; không có trường nào bị component tự thêm hay tự sửa.
- **AC-011** *(manual)* — Trong showcase: hàng `Nguồn giá trị` kết thúc thẳng cột với hàng `Nhãn` / `Mô tả` và hàng `Tên trường`, ở cả breakpoint desktop và <900px.
- **AC-012** *(manual)* — Quét mojibake sạch trên toàn bộ prose tiếng Việt đã sửa (5 catalog i18n + `.md` + demo showcase).

Cổng verify trước khi coi là xong: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless` xanh, `npm run build` trong `versions/v19` sạch, `npm run sync` rồi `npm run check:sync` xanh.

## Risks & mitigations

- **Risk:** paste JSON thô mở đúng đường đi tới lỗi đã xác nhận — `deepClone` (`api-contract.schema.ts:385`) nuốt own-key `__proto__` mà `JSON.parse` tạo ra, nên contract dán vào có key đó sẽ mất im lặng. → **Mitigation:** ngoài scope change này; AC-010 chỉ khoá hành vi verbatim cho contract bình thường. Ghi vào phần deferred để không rơi mất.
- **Risk:** auto-format phụ thuộc guard `_lastEmittedValue` bên trong `<sd-code-editor>` — một thay đổi ở component đó có thể lặng lẽ làm mất format. → **Mitigation:** AC-008 khoá hành vi bằng test ở phía builder, nên hồi quy sẽ đỏ.
- **Risk:** `<sd-code-editor>` dùng `ViewEncapsulation.None`; nhúng thêm nhiều instance (mỗi node static object/array một cái) làm tăng style toàn cục và bundle Prism. → **Mitigation:** chỉ render khi node thực sự ở mode `static` với type `object`/`array`; builder đã import `SdCodeEditor` từ trước nên không thêm dependency.
- **Risk:** mở `static` cho `object`/`array` làm tăng bề mặt mà validation phải phủ (literal lồng nhau). → **Mitigation:** validation không đổi — nó đã nhận `unknown` và đã có `mapping.type.mismatch`; AC-007 kiểm phần builder không ghi chuỗi rác.
- **Risk:** xoá key i18n `mapping.insert` là breaking cho consumer nào override catalog. → **Mitigation:** ghi vào CHANGELOG dưới mục breaking; version number không signal được (major khoá theo Angular line).

## Out of scope (deferred)

- Sửa mất dữ liệu `__proto__` trong `sdApiContractRecordRename` / `renameSdApiContractProperty` / `deepClone` — defer tới khi user chốt hướng fix (đã trình 3 lựa chọn, đang treo).
- Thực thi contract — defer tới khi có yêu cầu runtime executor.
- OpenAPI import/export — defer tới khi có yêu cầu interop.
- Transform theo từng phần tử array — defer tới khi có ca dùng thật.


## Decisions captured during review

- Suy mode dùng `parseSdApiContractTemplate(...).kind === 'exact'` thay vì đối chiếu danh sách suggestion, nên một reference sạch trỏ vào trường không tồn tại vẫn ở mode `source` và vẫn báo `mapping.reference.missing`.
- Mở mode `static` cho type `object` và `array` (hiện `modeOptions` chưa cho), để dùng `<sd-code-editor language="json">` theo lựa chọn của user.
- Step 6 giữ binding hiển thị là string từ `serializeSdApiContract` để không mất thứ tự key canonical; chỉ chiều dán vào đi qua `modelChange`.
- User được trình phương án tách spec thành hai (hàng Nguồn giá trị / copy-paste JSON) và chọn giữ chung.
- Sửa lỗi mất dữ liệu `__proto__` vẫn nằm ngoài scope, chỉ ghi nhận là rủi ro.

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)
