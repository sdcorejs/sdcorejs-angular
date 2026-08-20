---
artifact_id: spec-acb-node-drawer-editing-r1
artifact_kind: spec
schema_version: 1
change_ref: acb-node-drawer-editing
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-spec
name: acb-node-drawer-editing
description: Node editing moves into a side-drawer that commits once; the layer list collapses to click-to-edit viewed rows.
contract_id: acb-node-drawer-editing
requirement_id: acb-node-drawer-editing
owner_repository_id: github.com/sdcorejs/sdcorejs-angular
owner_repository_role: library
owner_module_id: api-contract-builder
repository_relative_path: .sdcorejs/specs/angular/2026-08-19-14-06-acb-node-drawer-editing.md
source_revision: a73ac65b0731d794a613326ddd4924497424b3d6
parent_repository_id: null
parent_references: []
approved_at: 2026-08-19T07:11:53.201Z
approved_by: nghiatt15_onemount
approval_source: explicit-user-choice
track: angular
target_root_kind: target-project
stack_profile: core-ui-angular
profile_confidence: high
sourceDraftPath: .sdcorejs/docs/angular/2026-08-19-14-06-acb-node-drawer-editing-spec.md
approval_hash: "sha256:v1:cc11deec8ea91560753dafa01021b3ece43c7fb2d4be19c35fe70494d87a850c"
approved_spec_hash: "sha256:v1:cc11deec8ea91560753dafa01021b3ece43c7fb2d4be19c35fe70494d87a850c"
acceptance_criteria_count: 16
manual_criteria_count: 2
redaction_applied: false
supersedes: null
change_control: 
  change_reason: null
  revision: 1
  supersedes: null
---

# Biên tập node bằng side-drawer, danh sách thu gọn dạng viewed - Approved Spec

> Snapshot of what the user approved at the `sdcorejs-spec` gate. Do not edit by hand; re-author through `sdcorejs-spec` if the contract changes.

## Approved contract

# Spec - Biên tập node bằng side-drawer, danh sách thu gọn dạng viewed - 2026-08-19 14:06

```yaml
spec_context:
  source: sdcorejs-spec
  contract_id: acb-node-drawer-editing
  requirement_id: acb-node-drawer-editing
  approved_spec_path: ''
  approved_spec_hash: ''
  supersedes: null
  target_root: C:\Users\nghiatt15_onemount\Documents\sdcorejs\sdcorejs-angular
  target_root_kind: target-project
  owner_repository_id: github.com/sdcorejs/sdcorejs-angular
  owner_repository_role: library
  owner_module_id: api-contract-builder
  execution_host_repository_id: github.com/sdcorejs/sdcorejs-angular
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: acb-node-drawer-editing (sdcorejs-brainstorming, 2026-08-19)
  acceptance_criteria_count: 16
  manual_criteria_count: 2
  non_goals:
    - Thực thi contract, OpenAPI import/export, transform theo từng phần tử array
    - Sửa lỗi mất dữ liệu khi rename key thành __proto__ (vẫn theo dõi riêng)
    - Đổi copy/paste JSON ở step 6 — giữ đúng như đang có
    - Drawer lồng trong drawer
    - Cây node mở rộng lồng nhau ở NGOÀI drawer
  risks:
    - Thay thế phần lớn layout grid + container query của hàng node vừa làm trong ngày
    - Validate node dồn về lúc Save — đổi THỜI ĐIỂM, không đổi số lần emit
    - Rename commit lúc Save nhưng vẫn qua sdApiContractRecordRename, nên lỗi __proto__ vẫn còn
    - Draft trong drawer và contract của cha là hai nguồn sự thật khi drawer đang mở
  assumptions:
    - Danh sách ngoài drawer PHẲNG theo từng layer — object hiện số trường, không mở rộng cây
    - Một lần Save commit toàn bộ subtree đã sửa, kể cả phần sửa khi drill-down
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

Mỗi node hiện là một hàng grid mang bảy ô — tên, kiểu dữ liệu, bắt buộc, nhãn, mô tả, định dạng thời gian, xoá — cộng một hàng mapping bên dưới với mode picker và control giá trị. Một layer mười trường là bảy mươi ô control cùng hiện trên màn hình, trong khi người khai báo chỉ đang sửa một trường. Cây lồng nhau làm nó tệ thêm: node càng sâu thì ô càng hẹp, tới mức phải gấp dòng.

Đó là lý do người dùng nói "hơi phức tạp". Vấn đề không phải từng control sai, mà là **mọi control của mọi trường đều mở cùng lúc**.

**Mục tiêu**

1. Thêm một trường là một hành động có điểm bắt đầu và điểm kết thúc: mở drawer, khai báo, `Lưu` — chốt sổ một lần.
2. Danh sách chỉ để đọc và để quét: một hàng một trường, thấy ngay tên, kiểu, có bắt buộc không, lấy giá trị từ đâu.
3. Sửa một trường là click vào hàng của nó, không phải tìm ô giữa bảy mươi ô.
4. Node lồng sâu được sửa trong không gian rộng bằng cả drawer, không phải trong một ô 100px.

**Thành công** = khai báo xong một contract `GET` tìm kiếm mà trên màn hình chưa bao giờ có quá một trường đang ở trạng thái sửa.

## Non-goals

- Thực thi contract. Component vẫn không gửi request.
- OpenAPI / GraphQL / SOAP import-export.
- Transform theo từng phần tử array.
- **Không** sửa lỗi rename key thành `__proto__` làm mất entry — ghi nhận là rủi ro.
- **Không** đổi copy/paste JSON ở step 6.
- **Không** drawer lồng drawer.
- **Không** giữ cây node mở rộng lồng nhau ở ngoài drawer.
- Không đổi model contract, serializer, hay luật validation.

## Architecture

### Bề mặt tách làm hai

| Vai trò | Ở đâu | Sửa được gì |
| --- | --- | --- |
| Danh sách | trong step, ngoài drawer | không sửa gì — chỉ đọc, click để mở drawer, cộng nút thêm và nút xoá |
| Biên tập | trong `<sd-side-drawer>` | toàn bộ thuộc tính của một node và mapping của nó |

Đây là điểm đổi bản chất: **cây ở ngoài drawer trở thành read-only**. Nó không còn giữ control nào, nên cũng không còn cần grid bảy cột hay container query — phần đó bị bỏ.

### Danh sách phẳng theo layer

Mỗi layer render một danh sách **phẳng** các con trực tiếp. Object không mở rộng cây ở ngoài; nó hiện số trường con, và người dùng drill-down bên trong drawer.

Nội dung một hàng:

| Node | Hàng thu gọn hiện |
| --- | --- |
| `keyword: { type: 'string', source: '${input.keyword}' }` | `keyword` · `string` · `← input.keyword` |
| `version: { type: 'string', value: 'v2' }` | `version` · `string` · `= "v2"` |
| `Authorization: { source: 'Bearer ${env.token}' }` | `Authorization` · `string` · `← Bearer ${env.token}` |
| `boLoc: { type: 'object', properties: {…4} }` | `boLoc` · `object` · `4 trường` |
| `page: { type: 'number', required: true }` | `page` · `number` · badge `Bắt buộc` · `chưa gán` |

`chưa gán` là một trạng thái hiển thị thật, không phải ô rỗng: nó khớp cảnh báo `mapping.node.unmapped` mà validation đã báo cho node đó.

### Draft và chốt sổ

Drawer sở hữu **một draft duy nhất**: bản clone sâu của node đang sửa, hoặc một node trắng khi thêm mới. Mọi thao tác trong drawer chỉ chạm draft đó.

- `Lưu` → drawer phát **đúng một** `nodeCommit`, builder áp vào contract bằng đúng các helper bất biến đang có → **đúng một** `modelChange`.
- `Huỷ` / backdrop / nút đóng → `beforeClose` so draft với bản seed; nếu đã bẩn thì hỏi xác nhận bỏ. `forceClose()` chỉ dùng cho nhánh Save thành công.
- Trong lúc drawer mở, contract của cha **không đổi**, nên diagnostics vẫn mô tả contract đã commit. Chúng tính lại sau `Lưu`.

Guarantee công khai "phát một contract bất biến mới **đúng một lần mỗi hành động người dùng**" **vẫn đúng** — `Lưu` là một hành động. Chỉ đổi thời điểm, và doc phải nói rõ điều đó.

### Drill-down trong cùng một drawer

Node `object` liệt kê các con của nó **bên trong** drawer. Click một con **đẩy** vào ngăn xếp đường dẫn của cùng drawer đó, kèm breadcrumb `boLoc › mau` để quay lại. Không tạo drawer thứ hai.

Hệ quả quan trọng: drill-down sửa con **trong cùng cây draft**, nên một lần `Lưu` ở ngoài cùng commit toàn bộ subtree đã sửa. Không có commit từng cấp.

### Cổng chặn Save

Chặn **chỉ** hai lỗi khiến node không thể tồn tại:

- tên rỗng
- trùng tên với một node cùng cấp

Cả hai báo tại chỗ trong drawer và làm nút `Lưu` disabled. Mọi lỗi khác — `${input.x}` không tồn tại, type không khớp, thiếu `req.path` — **vẫn Lưu được** và đi qua diagnostics như cũ. Đó là nhất quán với chủ trương "chỉ chẩn đoán, không tự sửa" của component.

### Hai component mới

- `SdApiContractNodeDrawer` — bọc `<sd-side-drawer>`, sở hữu draft, ngăn xếp drill-down + breadcrumb, footer `Lưu`/`Huỷ`, guard `beforeClose`, cổng chặn Save. Nhận `node`, `siblingNames`, `allowTransform`, `suggestions`; phát `nodeCommit`.
- `SdApiContractNodeSummary` — một hàng thu gọn: tên, type, badge bắt buộc, tóm tắt mapping. Không sửa gì; phát `edit` và `remove`.

Cả hai **feature-private**, không export ra `index.ts`.

### Component được dùng lại, không viết lại

- `SdApiContractSourceEditor` — chuyển nguyên vào trong drawer. Mode picker, dropdown nguồn, mode `Nâng cao`, control tĩnh theo type kể cả `sd-code-editor` cho object/array: giữ hết. Trong drawer nó rộng rãi nên bỏ được ô giữ chỗ 36px và ràng buộc chật của hàng.
- `SdApiContractNodeEditor` — đổi vai: từ "hàng sửa được + đệ quy" thành "danh sách summary + nút thêm", uỷ quyền biên tập cho drawer.
- `SdApiContractRecordEditor` — giữ vai layer cho `req.path` / `req.query` / `req.headers` / `res.headers`, nhưng render summary thay vì node editor.

### i18n

Key mới, thêm vào cả 5 catalog:

| Key | vi |
| --- | --- |
| `…drawer.add-title` | `Thêm trường` |
| `…drawer.edit-title` | `Sửa trường` |
| `…drawer.save` | `Lưu` |
| `…drawer.cancel` | `Huỷ` |
| `…drawer.discard-confirm` | `Bỏ các thay đổi chưa lưu?` |
| `…summary.unmapped` | `chưa gán` |
| `…summary.field-count` | `{count} trường` |
| `…node.name-required` | `Tên trường không được để trống` |

`…node.duplicate-key` đã có, dùng lại cho lỗi trùng tên.

## Stack profile and technology assumptions

- Track: `angular`
- Stack profile: `core-ui-angular`
- Profile evidence: repo này **là** `@sdcorejs/angular`; `components/api-contract-builder` và `components/side-drawer` đều tồn tại; pattern `viewed` / `sd-view` đã rollout toàn lib.
- Technology assumptions (explicit): Angular 19 standalone, signals, OnPush, `@let` caching, i18n qua `I18nService`, `autoId` cho mọi control và mọi hàng summary.
- `<sd-side-drawer>` dùng đúng surface đã có: `title`, `width`, `disableBackdropClose`, `beforeClose`, slot `[sdFooterRight]`, `open()`, `forceClose()`, `sdClosed`.
- Chỉ sửa `versions/v19`; `v20` / `v21` sinh bằng `npm run sync`.
- Không thêm dependency mới.

## File structure

**Tạo — thư viện (`versions/v19/projects/sdcorejs-angular/components/api-contract-builder/`)**

- `src/components/api-contract-node-drawer.component.ts` — drawer, draft, drill-down, cổng Save.
- `src/components/api-contract-node-drawer.component.spec.ts`
- `src/components/api-contract-node-summary.component.ts` — hàng thu gọn.
- `src/components/api-contract-node-summary.component.spec.ts`

**Sửa — thư viện**

- `src/components/api-contract-node-editor.component.{ts,html,scss}` — thành danh sách summary + nút thêm; bỏ grid bảy cột và container query.
- `src/components/api-contract-record-editor.component.ts` — render summary, mở drawer.
- `src/components/api-contract-source-editor.component.ts` — bỏ ô giữ chỗ gutter và ràng buộc chật của hàng; hành vi không đổi.
- `src/api-contract-builder.component.{ts,html}` — sở hữu một instance drawer, áp `nodeCommit` vào contract.
- `src/api-contract-builder.component.spec.ts` — cập nhật spec bám hàng-sửa-được; thêm ca commit-một-lần.
- `src/components/api-contract-source-editor.component.spec.ts` — bỏ assertion về gutter và về hàng.
- `sd-api-contract-builder.md` — mô hình biên tập mới, bảng hàng thu gọn, thời điểm validate.
- `i18n/src/{vi,en,ja,ko,zh}.ts` — 8 key mới.

**Sửa — showcase + changelog (root)**

- `showcase/src/app/pages/components/api-contract-builder/api-contract-builder-demo.component.ts` — section cho luồng drawer.
- `showcase/src/app/docs/core/documentation.registry.ts` — `demoSectionCount`.
- `showcase/src/app/docs/core/documentation.registry.spec.ts` — tổng.
- `CHANGELOG.md` — entry dưới `## [Unreleased]`.

**Sinh tự động, không sửa tay**

- `showcase/src/app/docs/generated/example-*.generated.ts` — `npm run generate:showcase-examples`.
- `versions/v20/**`, `versions/v21/**` — `npm run sync`.

## Acceptance criteria

- **AC-001** — Bấm nút thêm ở bất kỳ layer: drawer mở với form trống; **chưa** có `modelChange` nào phát ra.
- **AC-002** — Điền form rồi `Lưu`: phát **đúng một** `modelChange` mang node mới; drawer đóng; hàng thu gọn xuất hiện trong danh sách.
- **AC-003** — Sửa trong drawer rồi đóng bằng backdrop hoặc nút đóng: `beforeClose` chặn lại và hỏi; chọn bỏ thì contract **không đổi** và không có `modelChange`.
- **AC-004** — Sửa trong drawer rồi `Lưu`: đi qua `forceClose()`, không hỏi xác nhận bỏ.
- **AC-005** — Click một hàng thu gọn: đúng drawer đó mở, seed bằng giá trị hiện tại của node.
- **AC-006** — Hàng thu gọn tóm tắt đúng: `← input.keyword` cho reference, `= "v2"` cho literal, `4 trường` cho object bốn con, `chưa gán` cho node không có `source` lẫn `value`.
- **AC-007** — Hàng thu gọn hiện badge bắt buộc khi và chỉ khi `required === true`.
- **AC-008** — Node `object` trong drawer: các con được liệt kê; click một con thì drill-down trong **cùng** drawer kèm breadcrumb về cha; **không** có drawer thứ hai trong DOM.
- **AC-009** — Sửa một con khi đang drill-down rồi `Lưu` ở ngoài cùng: phát **đúng một** `modelChange` mang toàn bộ subtree đã sửa.
- **AC-010** — `Lưu` với tên rỗng, và `Lưu` với tên trùng node cùng cấp: nút `Lưu` disabled, lý do hiện tại chỗ trong drawer, **không** có `modelChange`.
- **AC-011** — `Lưu` một node có `source` trỏ vào trường không tồn tại: `Lưu` thành công, và `mapping.reference.missing` vẫn được báo qua diagnostics.
- **AC-012** — Danh sách ngoài drawer không chứa control sửa được nào: không `sd-input`, không `sd-select`, không `sd-code-editor` — chỉ hàng summary, nút thêm, nút xoá.
- **AC-013** — `mode="view"` và `disabled`: click hàng thu gọn **không** mở drawer, và nút thêm / nút xoá không render.
- **AC-014** — Contract nạp từ ngoài vẫn round-trip nguyên văn qua `serializeSdApiContract` sau khi mở rồi huỷ drawer, không thêm bớt key nào.
- **AC-015** *(manual)* — Trong showcase và sandbox: danh sách một layer mười trường đọc được trong một màn hình, và drawer đủ rộng cho node lồng ba cấp mà không gấp dòng.
- **AC-016** *(manual)* — Quét mojibake sạch trên toàn bộ prose tiếng Việt đã sửa (5 catalog i18n, `.md`, demo showcase).

Cổng verify: `npm run test:ci` xanh, `npm run build` sạch, `npm run check:i18n-parity` xanh, `npm run test:showcase-examples` xanh, `cd showcase && npm test` không thêm fail so với baseline, `npm run sync` rồi `npm run check:sync` xanh.

## Risks & mitigations

- **Risk:** thay thế phần lớn layout grid + container query của hàng node làm trong ngày. → **Mitigation:** người dùng đã xác nhận cái giá này khi chọn hướng. Phần sống sót nguyên vẹn và có giá trị nhất — dropdown nguồn, mode `Nâng cao`, control tĩnh theo type, `Có`/`Không`, copy/paste JSON — chuyển vào drawer chứ không mất.
- **Risk:** draft trong drawer và contract của cha là hai nguồn sự thật khi drawer mở. → **Mitigation:** drawer sở hữu draft, cây ngoài drawer read-only tuyệt đối (AC-012), và chỉ `Lưu` mới ghi. Không có đường nào sửa cùng một node từ hai phía.
- **Risk:** dồn validate về `Lưu` có thể bị đọc là "mất validate sống". → **Mitigation:** không mất — diagnostics mức contract vẫn chạy như cũ trên contract đã commit; chỉ hai lỗi node-local là chặn Save. Doc phải nói rõ thời điểm.
- **Risk:** rename giờ commit lúc `Lưu` nhưng vẫn qua `sdApiContractRecordRename`, nên lỗi `__proto__` nuốt entry vẫn còn, chỉ đổi thời điểm. → **Mitigation:** ngoài scope; ghi vào deferred để không rơi mất.
- **Risk:** danh sách phẳng có thể không phải điều người dùng hình dung — họ có thể vẫn muốn thấy cây lồng nhau ở ngoài. → **Mitigation:** nêu thẳng ở cổng duyệt spec này để bắt sớm, vì nó định hình cả hai component mới.
- **Risk:** một `Lưu` commit cả subtree nghĩa là drill-down sâu rồi huỷ sẽ bỏ luôn thay đổi ở cấp trên. → **Mitigation:** `beforeClose` hỏi rõ trước khi bỏ, và breadcrumb luôn cho thấy đang ở đâu trong draft.

## Out of scope (deferred)

- Sửa mất dữ liệu `__proto__` trong `sdApiContractRecordRename` / `renameSdApiContractProperty` / `deepClone` — defer tới khi user chốt hướng fix.
- Kéo thả sắp xếp lại thứ tự trường — defer tới khi có yêu cầu.
- Sửa nhiều trường một lúc trong một drawer — defer tới khi có ca dùng thật.
- Thực thi contract, OpenAPI import/export, transform theo phần tử array — như các spec trước.


## Decisions captured during review

- Hướng được chọn ở brainstorming: drawer là bề mặt sửa DUY NHẤT cho cả thêm mới và sửa; hai hướng còn lại (drawer chỉ cho thêm mới + inline click-to-edit; accordion không drawer) bị người dùng loại.
- Hàng thu gọn hiện tên + type + badge bắt buộc + tóm tắt nguồn. Hai phương án gọn hơn và đầy hơn đều bị loại.
- Nút Lưu chỉ chặn lỗi node-local (tên rỗng, trùng tên cùng cấp); lỗi mức contract vẫn Lưu được và đi qua diagnostics.
- Ba điểm suy luận được nêu thẳng ở cổng duyệt và người dùng duyệt nguyên trạng: danh sách ngoài drawer PHẲNG (object hiện số trường), một lần Lưu commit cả subtree kể cả phần drill-down, và cây ngoài drawer read-only tuyệt đối.
- Người dùng được trình phương án tách spec thành A (layer record, phẳng) và B (drill-down object lồng nhau) và chọn giữ chung.
- Quan hệ với contract trước: spec này KHÔNG supersede `spec-acb-source-row-simplify-r1` về mặt hợp đồng — đó là contract khác và đã execute xong. Nhưng nó thay thế phần lớn PHẦN LAYOUT của công việc đó (grid bảy cột + container query của hàng node). Phần dropdown nguồn, mode Nâng cao, control tĩnh theo type, copy/paste JSON được giữ và chuyển vào drawer.
- Sửa lỗi mất dữ liệu `__proto__` vẫn ngoài scope, chỉ ghi nhận là rủi ro ở thời điểm mới (Save thay vì blur).

## Skill provenance

sdcorejs-spec (approved on attempt 1 / 3)
