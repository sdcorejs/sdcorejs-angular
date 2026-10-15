---
artifact_id: architecture-draft-generic-crud-module-v1-r1
artifact_kind: execution-doc
change_ref: generic-crud-module-v1
source_spec: .sdcorejs/specs/angular/2026-10-13-09-59-generic-crud-module.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-architecture
---
# Architecture — Module generic CRUD theo schema (SdGenericSchema) - 2026-10-13 10:42

Approved spec: `.sdcorejs/specs/angular/2026-10-13-09-59-generic-crud-module.md` (`sha256:v1:6107bece2aded5c0256881ec0c82a0c7963313b49b3a3905b53f9f03b139f2cf`, revision `48de6f13e`).

Gate: **required**. Các signal:
- `conflicting-independent-unit-decisions`
- `persisted-data-model-contract`
- `public-api-contract`
- `state-data-ownership`

## Trigger và owner

- **Owner:** `sdcorejs-angular` (library), module `modules/generic`. Execution host và integration owner cũng là `sdcorejs-angular`. Không có repo nào khác tham gia.
- **Vì sao gate bắt buộc:**
  - Thêm một entry point public mới.
  - Thêm schema mà consumer lưu trữ.
  - Phải chốt nơi giữ cấu hình và schema hiệu lực.
  - List, form, import và màn cấu hình là các đơn vị có thể làm song song, nhưng phải dùng chung bộ tra adapter, cách dựng schema, mã quyền và cổng gọi adapter.

## Phân tầng của modules/generic (D-019)

```
models      type: SdGenericSchema, SdGenericProperty, SdGenericAdapter, action, hook, issue, search request
  ↑
core        hàm thuần: merge, validate, dựng mặc định, tiêu đề, mã quyền, dựng form theo action,
            map cột sd-table, kế hoạch import, dựng request search fallback
  ↑
registry    provideSdGeneric, provideSdGenericEntity, scope node theo injector, resolver
  ↑
services    SdGenericSchemaService (schema hiệu lực + cache + lưu), SdGenericDataService (cổng adapter),
            quyền (bọc SdPermissionService), import
  ↑
routes / pages / components
            sdGenericRoutes, guard, resolver, trang list, host form (page | drawer), trang configuration, banner
```

Tầng dưới không import tầng trên. `models` và `core` là TypeScript thuần, nên toàn bộ logic dùng chung được viết theo TDD (D-017).

## Invariants

| ID | Nội dung | Bảo vệ |
|---|---|---|
| INV-001 | Một resolver duy nhất. Scope gần nhất thắng; trùng khai báo trong cùng injector thì ném lỗi | R-005, AC-002/003 |
| INV-002 | Schema hiệu lực chỉ dựng ở `SdGenericSchemaService` (3 lớp). Chỉ service này gọi `adapter.schema` và `configuration.get/set` (hoặc localStorage) | R-006/007, AC-001/004/005/006 |
| INV-003 | `validateSdGenericSchema` thuần và là validator duy nhất, dùng cho cả lúc load lẫn lúc lưu | R-008, AC-007/008/020 |
| INV-004 | Schema v1 chỉ chứa JSON. Function nằm ở provider. Cấu trúc field lấy từ BE | R-002/003, AC-006/024 |
| INV-005 | Một hàm sinh mã quyền, dùng chung cho guard, action và banner. `permission: false` bỏ qua cả ba. Route generic khai `data.permission = SD_PERMISSION_PUBLIC` để guard của portal không chặn; guard generic kiểm mã thật | R-011, AC-007/010/018 |
| INV-006 | Tiêu đề do một hàm thuần xử lý, render dạng text, không dùng innerHTML | R-009, AC-009 |
| INV-007 | Một hàm thuần dựng form theo action, áp luật system/insertable/updatable và lọc payload update | R-013, AC-015 |
| INV-008 | Chỉ `SdGenericDataService` gọi các hàm dữ liệu của adapter (query/detail/create/update/delete/search). Service này áp hooks, thứ tự search, và lưu giá trị relation đúng kiểu gốc | R-004/013/014, AC-001/016/017 |
| INV-009 | Chọn page/drawer sau khi schema đã resolve. Drawer nằm trong outlet của list, list không bị huỷ | R-010, AC-011/012 |
| INV-010 | Đúng 4 export runtime; không HttpClient; không import package riêng của backend; chỉ dùng entry point public | R-001, AC-024 |
| INV-011 | `form-generic` chỉ thêm `time`/`json` và không phụ thuộc `modules/generic` | R-018, AC-021 |
| INV-012 | Chỉ sửa ở v19 + Showcase; các line khác qua sync; CHANGELOG; guard Showcase | R-019/020, AC-022/023 |
| INV-013 | List: chuyển `PagingReq` sang adapter; xoá tuần tự; reload; action mở rộng đi cùng một bước lọc với action có sẵn | R-012/015, AC-013/014/018 |
| INV-014 | Import: kế hoạch upsert là hàm thuần, chạy tối đa 5 request song song qua data service | R-016, AC-019 |
| INV-015 | Màn cấu hình chỉ ghi qua `SdGenericSchemaService.save` (validate → set → xoá cache) | R-017, AC-005/020 |

Mọi requirement và AC của spec đều được ít nhất một invariant bảo vệ.

## Hợp đồng public

- **PC-001 (api), entry point mới:** `provideSdGeneric`, `provideSdGenericEntity`, `sdGenericRoutes`, `validateSdGenericSchema` cùng các type đi kèm. Chỉ thêm mới.
- **PC-002 (api), adapter contract do consumer implement:**
  - Về sau chỉ được thêm member tuỳ chọn.
  - Adapter cũ của lib-core-commerce viết lại ở repo của dự án.
- **PC-003 (persisted-data-model), `SdGenericSchema` version 1:**
  - `version` khác 1 bị coi là lỗi shape, và lib dùng cấu hình mặc định.
  - Muốn tăng version thì phải thêm bước chuyển đổi trong validate/merge trước.
- **PC-004 (api), mã quyền và route:**
  - Định dạng `<MODULE>_<ENTITY>_C_GENERIC_*` và `generic/:module/:entity/...`.
  - Đổi định dạng về sau là breaking với hệ thống phân quyền của portal.
- **PC-005 (api), form-generic thêm `SdFormGenericTime` và `SdFormGenericJson`:**
  - Chỉ thêm mới.
  - Code consumer `switch` đủ mọi `type` sẽ cần thêm nhánh. CHANGELOG ghi rõ điểm này.

## Quyết định kiến trúc mới

- **D-020: registry.**
  - Mỗi lần gọi `provideSdGeneric` hoặc `provideSdGenericEntity` thêm entry vào multi token, và cung cấp một scope node.
  - Scope node đọc entry cùng tầng (`self`) và scope cha (`skipSelf`).
  - Thứ tự tra: `module`, rồi `module + entity`, đi từ scope gần nhất lên root.
  - Trùng khai báo trong cùng một injector là lỗi. Luật này bao trùm trường hợp trùng trong một lần gọi; trùng giữa các tầng thì tầng gần thắng.
  - Kiểm trùng ngay khi injector được tạo (`provideEnvironmentInitializer`), nên AC-003 ném lỗi lúc khởi tạo chứ không đợi lần điều hướng đầu.
  - Option `permission` lấy từ scope gần nhất có khai.
- **D-021: schema hiệu lực.**
  - `SdGenericSchemaService` sống ở injector môi trường của route generic, cache Promise theo `module.entity`.
  - Resolver của route nạp schema trước khi trang kích hoạt.
  - `save` xoá cache của entity vừa lưu.
- **D-022: catalog relation.**
  - `sdGenericRoutes()` đăng ký `provideSdFormGeneric({ catalogs: [sd-generic-relation] })` ở route generic.
  - Field relation dùng catalog đó với params hằng `{ module, entity, valueField, displayField, searchFields }` (`searchFields` nối bằng dấu phẩy). Có đủ các params này thì cache của form-generic tách riêng từng relation.
  - Callback của catalog tới được `SdGenericDataService` qua injector môi trường, bắt bằng `provideEnvironmentInitializer`. Chỉ dùng API public của form-generic.
  - Option `value` của form-generic là chuỗi, nên trước khi lưu `SdGenericDataService` đổi giá trị relation về kiểu gốc (id số vẫn là số).
  - **Hệ quả:** form trong module generic không thấy cấu hình `provideSdFormGeneric` mà portal khai ở root (validator, htmlDefinitions, breakpoints). Form generic không cần các phần này.
- **D-023: tab Form của màn cấu hình.**
  - Dùng `sd-form-builder` với `[(schema)]`.
  - Kèm một panel liệt kê các property chưa có trong layout; bấm vào thì thêm field đã điền sẵn vào schema.
  - Mỗi lần thêm, builder nạp lại schema nên mất undo và vùng chọn hiện tại.
  - Không dùng `templates` của form-generic.
- **D-024: route.**
  - Trang list có `router-outlet` cho `create`, `:id/detail`, `:id/update`.
  - Mọi route của `sdGenericRoutes()` khai `data.permission = SD_PERMISSION_PUBLIC`, vì `SdPermissionGuard.canActivateChild` của portal từ chối route không có `data.permission`. Guard của module generic kiểm mã thật bằng `hasPermission(code)` với key mặc định.
  - Host form chọn page hoặc drawer sau khi schema đã resolve. Ở chế độ page, list ẩn nội dung khi outlet đang hoạt động.
  - Drawer: host gọi `open()` sau khi render; `(sdClosed)` điều hướng về route list.
  - Trang list phản ứng khi `:module`/`:entity` đổi, vì Angular dùng lại component.
  - `configuration` là route anh em với list.
- **D-025: cổng adapter.**
  - `SdGenericDataService` là nơi duy nhất gọi `query/detail/create/update/delete/search`. Service này áp hooks, thứ tự search (entity → adapter → query) và giới hạn 5 request song song cho import.
  - `SdGenericSchemaService` là nơi duy nhất gọi `schema` và `configuration.get/set`.
- **D-026: i18n.**
  - Khoá `core.module.generic.*` theo quy ước `core.<area>.*`.
  - Phải thêm vào đủ mọi file ngôn ngữ (en, vi, ja, ko, zh), vì các file có kiểu `Record<keyof EN_MESSAGES>`.
- **D-027: validator.** `validateSdGenericSchema(stored: unknown, base: SdGenericSchema)` trả `SdGenericSchemaIssue[] { code, severity, path, message }`, cùng cách với `validateSdApiContract`.
- **D-028: barrel.** `modules/generic` vào barrel `modules/index.ts` như các module khác. Build v19 kiểm không có vòng phụ thuộc và không trùng tên export.
- **D-029 (hoãn): nguồn quyền theo key cho từng module.** Hiện dùng key mặc định. Xem lại khi một portal cần nguồn quyền khác nhau cho từng module generic.

## Điều chỉnh so với phần Architecture của spec (cần bạn duyệt)

Requirement và AC của spec giữ nguyên. Chỉ phần mô tả kỹ thuật trong mục Architecture của spec đổi như sau, vì code thực tế của `form-generic` không cho phép làm đúng như mô tả cũ:

1. **Catalog relation:** spec ghi "mỗi entity một catalog id `<module>.<entity>`". Đổi thành một catalog `sd-generic-relation` có params riêng cho từng relation (D-022). Lý do: catalog cố định tại thời điểm `provideSdFormGeneric` chạy.
2. **"Palette là properties" trong builder:** spec ghi "sinh `templates` từ properties". Đổi thành panel property bên cạnh builder (D-023). Lý do: `templates` cũng cố định tại thời điểm đó và chỉ hiện trong inspector.
3. **i18n:** spec chỉ nêu en/ja. Thực tế phải sửa thêm vi/ko/zh và dùng khoá `core.module.generic.*` (D-026).
4. **Lỗi trùng adapter:** spec ghi "trùng trong một lần gọi". Đổi thành "trùng trong cùng injector", là luật chặt hơn và bao trùm luật cũ (D-020).
5. **Issue của validator** có thêm trường `message` (D-027).

## Ranh giới, hướng phụ thuộc và nơi giữ state

**Ranh giới**
- **B-001:** `models` và `core` thuần: không DI, không DOM, không HttpClient.
- **B-002:** trang và component chỉ lấy dữ liệu qua hai service, không gọi adapter.
- **B-003:** chỉ import phần khác của thư viện qua entry point public.
- **B-004:** form-generic không phụ thuộc modules/generic.
- **B-005:** chỉ sửa v19 + Showcase.
- **B-006:** transport tới backend chỉ nằm trong adapter của consumer.

**Hướng phụ thuộc**
- `pages/components` → `services` → `registry` → `core` → `models`.
- `pages` dùng `sd-table`, `sd-form-render`/`sd-form-builder`, `sd-import-excel`, `sd-side-drawer`.
- `services` dùng `SdPermissionService`.
- `form-generic` (field json) dùng `code-editor`.
- `showcase` dùng `modules/generic`.

**Nơi giữ state**

| State | Nơi giữ |
|---|---|
| Đăng ký adapter/entity | Scope node của từng injector |
| Schema hiệu lực | `SdGenericSchemaService` (route generic) |
| Cấu hình đã lưu | `adapter.configuration` của consumer, hoặc localStorage `sd-generic:configuration:<module>.<entity>` |
| Filter/sort/trang của list | `sd-table`; list không bị huỷ khi mở drawer |
| Giá trị form | `sd-form-render`; chỉ ghi xuống qua data service |
| Bản nháp cấu hình | Signal cục bộ của trang configuration, giữ đến khi Lưu |
| Quyền người dùng | `SdPermissionService` có sẵn |

**Ranh giới tin cậy**
- **ST-001:** kiểm quyền ở client chỉ để ẩn UI; backend phải kiểm lại.
- **ST-002:** dữ liệu từ backend chỉ render dạng text.

## Validation obligations

| VAL | Bằng chứng | INV | AC |
|---|---|---|---|
| VAL-001 | Spec registry với EnvironmentInjector root + con | 001 | 002, 003 |
| VAL-002 | Spec schema service + merge | 002, 004 | 001, 004, 005, 006 |
| VAL-003 | Spec validate từng mã lỗi; fallback lúc load + banner; chặn lưu | 003, 005 | 007, 008, 020 |
| VAL-004 | Spec mã quyền, guard, lọc action | 005, 013 | 010, 018 |
| VAL-005 | Spec template tiêu đề + DOM text | 006 | 009 |
| VAL-006 | Spec dựng form theo action + lọc payload | 007 | 015 |
| VAL-007 | Spec data service: hooks, search, PagingReq | 008 | 001, 016, 017 |
| VAL-008 | Spec route với RouterTestingHarness (drawer/page/back) | 009 | 011, 012 |
| VAL-009 | Spec trang list | 013 | 013, 014, 018 |
| VAL-010 | Spec kế hoạch import + giới hạn song song | 014 | 019 |
| VAL-011 | Spec trang configuration | 015, 002 | 005, 020 |
| VAL-012 | Spec time/json + toàn bộ suite form-generic | 011 | 021 |
| VAL-013 | Spec public-api + lệnh quét HttpClient/import backend | 010, 004 | 024 |
| VAL-014 | Guard Showcase, build, sync, check:sync, build v19–v22, CHANGELOG | 012 | 022, 023 |

Mọi bằng chứng đều tự động. Không có bước kiểm thủ công.

## Profile frontend, giả định, quyết định hoãn

- **Profile frontend:** cây component, phạm vi provider và danh sách file thuộc `plan_context.frontend_architecture`, do `sdcorejs-plan` dựng. Plan phải chứng minh tuân thủ INV-001, INV-002, INV-007, INV-008, INV-009 và INV-013.
- **Giả định:** dùng nguyên A-001…A-005 của spec. Kiến trúc này không thêm giả định mới.
- **Quyết định hoãn:** D-029 (nguồn quyền theo key cho từng module). Các mục ngoài phạm vi của spec giữ nguyên.

## Review kiến trúc

**Tự review**
- **Tính nhất quán:** mọi decision đã duyệt (D-001…D-028) đều có trong `adopted_decision_refs`; D-029 nằm ở `deferred_decision_refs`. Mỗi decision gắn với ít nhất một invariant.
- **API consistency:**
  - Tên provider theo mẫu `provideSd*` đang dùng (`provideSdFormGeneric`, `provideSdApiConfiguration`, `provideSdIcon`).
  - Validator theo mẫu `validateSdApiContract`.
  - Contract adapter dùng `PagingReq`/`PagingRes`/`Filter`/`Order` của `@sdcorejs/utils`. `sd-table` server trả `{ items, total }`, trùng shape với `PagingRes`.
  - Field mới của form-generic theo mẫu `SdFormGeneric<Type>`, `type` dạng chữ thường.

**Review độc lập (chỉ đọc, agent riêng, 2026-10-13)**
- Kết quả: không có BLOCKER, có 4 MAJOR và 6 MINOR. Tất cả đã xử lý trong bản này.
- Các mục đã kiểm là khả thi trên code thật:
  - `provideSdFormGeneric` khai ở route `providers` được `sd-form-render` đọc (`form-generic.provider.ts`, `form-render-catalog.ts`).
  - Param hằng `{ value }` tới được `load`/`search`/`labels`.
  - `provideEnvironmentInitializer` đã được dùng ở `api-handler-registry.ts`.
  - Đọc multi token với `self`/`skipSelf` đã có tiền lệ (`api-route-configurations.ts`, `item.component.ts`).
  - `sd-table` có `reload(force, scrollTop)`.
  - `sd-side-drawer` có `open()`/`close()`/`(sdClosed)` và vẫn thấy injector của route.
- Các MAJOR đã sửa:
  - Params của catalog relation quá ít, và kiểu giá trị relation bị đổi thành chuỗi (D-022, INV-008).
  - Phần Architecture của spec cần điều chỉnh, xem mục trên.
  - Guard quyền của portal chặn route generic (D-024, INV-005).
  - INV-008 mâu thuẫn với D-021 về việc ai gọi adapter (D-025, INV-002, INV-008).
- Các MINOR đã sửa: D-020, D-023, D-024, D-026, D-027, D-028.
- Review độc lập lần hai sẽ do `sdcorejs-review` chạy sau khi thực thi.

## Appendix — architecture_context (machine-readable)

```yaml
architecture_context:
  schema_version: 1
  source: sdcorejs-architecture
  contract_id: generic-crud-module-v1
  requirement_id: R-001
  approved_spec_reference:
    repository_id: sdcorejs-angular
    artifact_id: spec-generic-crud-module-v1-r1
    artifact_kind: spec
    revision: 48de6f13e24a9e4bed9be3dd44f9ffaf16c0dd4a
    approval_hash: sha256:v1:6107bece2aded5c0256881ec0c82a0c7963313b49b3a3905b53f9f03b139f2cf
  approved_architecture_path: <điền sau khi duyệt>
  approved_architecture_hash: <điền sau khi duyệt>
  owner_repository_id: sdcorejs-angular
  owner_module_id: modules/generic
  execution_host_repository_id: sdcorejs-angular
  integration_owner_repository_id: sdcorejs-angular
  trigger:
    required: true
    signals:
      - conflicting-independent-unit-decisions
      - persisted-data-model-contract
      - public-api-contract
      - state-data-ownership
    rationale: >-
      Thêm public entry point mới (adapter contract, provider, route, validate) và schema JSON SdGenericSchema mà consumer lưu trữ qua
      configuration.set; xác định chủ sở hữu cấu hình (adapter/localStorage) và luật merge với schema backend; list, form, import và màn
      chỉnh cấu hình là các đơn vị độc lập phải dùng chung một bộ tra adapter, dựng schema và mã quyền, nếu không sẽ tự quyết theo cách xung
      đột.
  invariants:
    - id: INV-001
      statement: >-
        Mọi màn (list, form, import, màn cấu hình, catalog relation) chỉ lấy adapter và cấu hình entity qua một resolver: scope gần nhất
        thắng, trùng cùng injector thì ném lỗi.
      scope: modules/generic registry và mọi nơi tra adapter/entity
      owner: sdcorejs-angular/modules/generic
      rationale: Root và lazy route cùng khai; một luật tra duy nhất tránh các màn chọn adapter khác nhau.
      verification_method: 'VAL-001: spec với EnvironmentInjector root + con.'
      requirement_refs:
        - R-005
      decision_refs:
        - D-007
        - D-020
    - id: INV-002
      statement: >-
        Schema hiệu lực chỉ được dựng ở SdGenericSchemaService bằng hàm thuần: adapter.schema → entity.schema(base) → cấu hình đã lưu
        (validate rồi merge); chỉ SdGenericSchemaService gọi adapter.schema và configuration.get/set (hoặc localStorage khoá
        sd-generic:configuration:<module>.<entity>).
      scope: SdGenericSchemaService, core merge, kho cấu hình
      owner: sdcorejs-angular/modules/generic
      rationale: Schema là đầu vào của mọi màn; dựng ở một chỗ để list/form/import/màn cấu hình nhìn cùng một schema.
      verification_method: VAL-002 và VAL-011.
      requirement_refs:
        - R-006
        - R-007
      decision_refs:
        - D-011
        - D-012
        - D-021
        - D-025
    - id: INV-003
      statement: >-
        validateSdGenericSchema là hàm thuần duy nhất kiểm cấu hình; bước load và nút Lưu đều dùng nó; lỗi shape/version thì dùng mặc định,
        tham chiếu treo bị merge bỏ, có lỗi thì không gọi configuration.set.
      scope: core validate, bước load cấu hình, nút Lưu
      owner: sdcorejs-angular/modules/generic
      rationale: Bước validate là chốt chặn cấu hình hỏng (người dùng nhấn mạnh).
      verification_method: VAL-003.
      requirement_refs:
        - R-008
      decision_refs:
        - D-013
        - D-017
        - D-027
    - id: INV-004
      statement: >-
        SdGenericSchema v1 chỉ chứa dữ liệu JSON (không function); function (schema, search, display, hooks, action) chỉ nằm ở provider;
        key, dataType, enums[].value, relation.entity luôn lấy từ schema hiện tại.
      scope: Model SdGenericSchema / SdGenericProperty
      owner: sdcorejs-angular/modules/generic
      rationale: Cấu hình phải lưu được dạng JSON ở server hoặc localStorage; BE là nguồn cấu trúc.
      verification_method: VAL-002 và VAL-013.
      requirement_refs:
        - R-002
        - R-003
      decision_refs:
        - D-002
        - D-003
        - D-009
        - D-011
    - id: INV-005
      statement: >-
        Mã quyền chỉ sinh từ một hàm thuần <MODULE>_<ENTITY>_C_GENERIC_<ACTION> viết hoa; guard route, hiển thị action và banner cấu hình
        lỗi đều dùng hàm đó; permission: false bỏ qua cả ba; mọi route của sdGenericRoutes() có data.permission = SD_PERMISSION_PUBLIC để
        guard của portal không chặn, còn guard của module generic kiểm mã thật.
      scope: core mã quyền, guard route, lọc action, banner
      owner: sdcorejs-angular/modules/generic
      rationale: Một định dạng mã cho portal khai quyền; ẩn nút và chặn route không được lệch nhau.
      verification_method: VAL-003 và VAL-004.
      requirement_refs:
        - R-011
      decision_refs:
        - D-015
        - D-024
        - D-029
    - id: INV-006
      statement: >-
        Tiêu đề chỉ được parse/render bằng một hàm thuần; kết quả gắn vào DOM bằng nội suy text, không innerHTML; list.title và create.title
        không có placeholder.
      scope: core tiêu đề và template của các trang
      owner: sdcorejs-angular/modules/generic
      rationale: Tránh lỗi XSS kiểu htmlTemplate cũ; template phải được validate.
      verification_method: VAL-005.
      requirement_refs:
        - R-009
      decision_refs:
        - D-014
    - id: INV-007
      statement: >-
        Layout form của mỗi action do một hàm thuần dựng: field lấy type/label/options/validation từ general.properties; create bỏ system và
        không insertable; update bỏ system và không updatable; payload update chỉ gồm property updatable.
      scope: core dựng form và host form
      owner: sdcorejs-angular/modules/generic
      rationale: Một nguồn cho dữ liệu field; luật insertable/updatable/system áp giống nhau ở form tự sinh và form đã lưu.
      verification_method: VAL-006.
      requirement_refs:
        - R-013
      decision_refs:
        - D-002
        - D-009
        - D-017
    - id: INV-008
      statement: >-
        Chỉ SdGenericDataService gọi các hàm dữ liệu của adapter (query, detail, create, update, delete, search); mọi lần lưu đi qua
        beforeSave/afterSave; search theo thứ tự entity → adapter → query (CONTAIN để tìm, IN để lấy nhãn); giá trị relation được lưu đúng
        kiểu gốc; trang và component không gọi adapter trực tiếp.
      scope: SdGenericDataService và catalog relation
      owner: sdcorejs-angular/modules/generic
      rationale: Hooks và thứ tự search phải đúng ở mọi màn, kể cả import và select relation.
      verification_method: VAL-007.
      requirement_refs:
        - R-004
        - R-013
        - R-014
      decision_refs:
        - D-010
        - D-022
        - D-025
    - id: INV-009
      statement: >-
        Kiểu hiển thị chỉ quyết định sau khi schema đã resolve, theo entity.display → adapter.display → 'page'; drawer render trong outlet
        của list, list không bị huỷ, back/đóng đưa về route list.
      scope: Cây route, trang list, host form
      owner: sdcorejs-angular/modules/generic
      rationale: Deep link và back hoạt động; list giữ trạng thái khi mở drawer.
      verification_method: VAL-008.
      requirement_refs:
        - R-010
      decision_refs:
        - D-004
        - D-005
        - D-024
    - id: INV-010
      statement: >-
        Entry point modules/generic export đúng 4 symbol runtime; không dùng HttpClient và không import package riêng của backend; chỉ
        import phần khác của thư viện qua entry point public.
      scope: Entry point modules/generic
      owner: sdcorejs-angular/modules/generic
      rationale: Thư viện public, không phụ thuộc backend; bề mặt export phải tường minh.
      verification_method: VAL-013.
      requirement_refs:
        - R-001
      decision_refs:
        - D-001
        - D-019
        - D-026
        - D-028
    - id: INV-011
      statement: >-
        form-generic chỉ thêm member time và json vào union field; type và hành vi hiện có không đổi; form-generic không import
        modules/generic.
      scope: components/form-generic
      owner: sdcorejs-angular/modules/generic
      rationale: Mở rộng public API phải chỉ thêm, không làm vỡ schema form-generic đã lưu.
      verification_method: VAL-012.
      requirement_refs:
        - R-018
      decision_refs:
        - D-008
    - id: INV-012
      statement: >-
        Chỉ sửa ở versions/v19 và showcase; v20/v21/v22 chỉ đổi qua npm run sync; check:sync xanh; CHANGELOG có mục Unreleased; guard
        example/registry của Showcase xanh.
      scope: Các workspace v19–v22, Showcase, CHANGELOG
      owner: sdcorejs-angular/modules/generic
      rationale: 'Luật cứng của repo: v19 là nguồn, các line khác dẫn xuất.'
      verification_method: VAL-014.
      requirement_refs:
        - R-019
        - R-020
      decision_refs:
        - D-018
    - id: INV-013
      statement: >-
        List dùng sd-table server và chuyển PagingReq sang adapter.query; xoá có xác nhận, xoá nhiều gọi delete tuần tự, sau thay đổi thì
        reload; action mở rộng và action có sẵn đi chung một bước lọc quyền/visible/hiddenDefaults.
      scope: Trang list
      owner: sdcorejs-angular/modules/generic
      rationale: Hành vi list và action mở rộng phải nhất quán cho mọi entity.
      verification_method: VAL-004 và VAL-009.
      requirement_refs:
        - R-012
        - R-015
      decision_refs:
        - D-006
        - D-011
    - id: INV-014
      statement: >-
        Import lập kế hoạch create/update bằng hàm thuần theo upsertKey, tra bản ghi đã có theo lô, chạy qua SdGenericDataService với tối đa
        5 request song song.
      scope: core kế hoạch import và import service
      owner: sdcorejs-angular/modules/generic
      rationale: Upsert đúng và không làm quá tải backend.
      verification_method: VAL-010.
      requirement_refs:
        - R-016
      decision_refs:
        - D-016
        - D-025
    - id: INV-015
      statement: Màn cấu hình chỉ ghi qua SdGenericSchemaService.save (validate rồi configuration.set rồi xoá cache); key và dataType không sửa được.
      scope: Trang configuration
      owner: sdcorejs-angular/modules/generic
      rationale: Chỉ một đường ghi cấu hình để validate và cache luôn đúng.
      verification_method: VAL-011.
      requirement_refs:
        - R-017
      decision_refs:
        - D-012
        - D-023
  boundaries:
    - id: B-001
      statement: 'models và core là TypeScript thuần: không DI, không DOM, không HttpClient, không import registry/services/pages.'
      invariant_refs:
        - INV-002
        - INV-003
        - INV-006
        - INV-007
        - INV-014
    - id: B-002
      statement: pages và components chỉ lấy dữ liệu qua SdGenericSchemaService và SdGenericDataService; không gọi adapter.
      invariant_refs:
        - INV-002
        - INV-008
    - id: B-003
      statement: >-
        modules/generic chỉ import phần khác của thư viện qua entry point public (components/table, components/form-generic,
        components/import-excel, components/side-drawer, modules/permission, i18n) và @sdcorejs/utils/models.
      invariant_refs:
        - INV-010
    - id: B-004
      statement: form-generic không phụ thuộc modules/generic; phần thêm của form-generic chỉ là field time và json.
      invariant_refs:
        - INV-011
    - id: B-005
      statement: Chỉ sửa versions/v19 và showcase; v20/v21/v22 qua npm run sync.
      invariant_refs:
        - INV-012
    - id: B-006
      statement: Transport tới backend chỉ nằm trong adapter do consumer viết; thư viện không chứa URL, header hay logic của backend nào.
      invariant_refs:
        - INV-008
        - INV-010
  dependency_directions:
    - from: modules/generic pages/components
      to: modules/generic services, core, models; sd-table, sd-form-render, sd-form-builder, sd-import-excel, sd-side-drawer
      rationale: Trang chỉ ghép component sẵn có với service của module.
      invariant_refs:
        - INV-002
        - INV-008
        - INV-009
        - INV-013
    - from: modules/generic services
      to: modules/generic registry, core, models; SdPermissionService
      rationale: Service là cổng duy nhất tới adapter và cấu hình.
      invariant_refs:
        - INV-001
        - INV-002
        - INV-005
        - INV-008
    - from: modules/generic core
      to: modules/generic models; type của form-generic và @sdcorejs/utils/models
      rationale: Lõi thuần chỉ biết type.
      invariant_refs:
        - INV-003
        - INV-004
        - INV-006
        - INV-007
    - from: components/form-generic (field json)
      to: components/code-editor
      rationale: Field json dùng editor có sẵn.
      invariant_refs:
        - INV-011
    - from: showcase
      to: '@sdcorejs/angular/modules/generic (adapter mock in-memory)'
      rationale: Demo dùng đúng API public.
      invariant_refs:
        - INV-010
        - INV-012
  data_state_owners:
    - subject: Đăng ký adapter và cấu hình entity
      owner_repository_id: sdcorejs-angular
      owner: Scope node của từng injector (registry modules/generic)
      invariant_refs:
        - INV-001
    - subject: Schema hiệu lực theo module.entity
      owner_repository_id: sdcorejs-angular
      owner: SdGenericSchemaService ở injector môi trường của route generic (cache, xoá khi lưu)
      invariant_refs:
        - INV-002
        - INV-015
    - subject: Cấu hình đã lưu
      owner_repository_id: sdcorejs-angular
      owner: >-
        adapter.configuration của consumer (server hoặc theo người dùng); không khai thì localStorage
        sd-generic:configuration:<module>.<entity>
      invariant_refs:
        - INV-002
        - INV-003
        - INV-015
    - subject: Trạng thái list (filter, sort, trang)
      owner_repository_id: sdcorejs-angular
      owner: sd-table trong trang list; trang list không bị huỷ khi mở drawer
      invariant_refs:
        - INV-009
        - INV-013
    - subject: Giá trị form đang nhập
      owner_repository_id: sdcorejs-angular
      owner: sd-form-render trong host form; chỉ ghi xuống qua SdGenericDataService
      invariant_refs:
        - INV-007
        - INV-008
    - subject: Bản nháp cấu hình đang sửa
      owner_repository_id: sdcorejs-angular
      owner: Trang configuration (signal cục bộ) đến khi Lưu
      invariant_refs:
        - INV-015
    - subject: Danh sách quyền của người dùng
      owner_repository_id: sdcorejs-angular
      owner: SdPermissionService có sẵn (modules/permission)
      invariant_refs:
        - INV-005
  public_contracts:
    - id: PC-001
      kind: api
      statement: >-
        provideSdGeneric({ adapters, permission? }), provideSdGenericEntity({ module, entity, schema?, search?, display?, hooks?,
        listActions?, rowCommands?, bulkActions?, detailActions?, hiddenDefaults? }), sdGenericRoutes(), validateSdGenericSchema(stored,
        base) cùng các type của chúng.
      owner: sdcorejs-angular/modules/generic
      compatibility: Entry point mới, chỉ thêm.
      migration: Không cần; consumer bật bằng cách khai provider và route.
      invariant_refs:
        - INV-001
        - INV-003
        - INV-010
    - id: PC-002
      kind: api
      statement: >-
        SdGenericAdapter: module, schema, query(PagingReq→PagingRes), detail, create, update, delete, search?, configuration?: {
        get(entity), set(entity, schema) }, display?.
      owner: sdcorejs-angular/modules/generic
      compatibility: Mới; thêm member tuỳ chọn về sau không phá adapter đã viết.
      migration: Adapter của lib-core-commerce viết lại theo contract này ở repo của dự án.
      invariant_refs:
        - INV-008
        - INV-010
    - id: PC-003
      kind: persisted-data-model
      statement: SdGenericSchema version 1 (general, list, detail, create, update, import) lưu qua configuration.set hoặc localStorage.
      owner: sdcorejs-angular/modules/generic
      compatibility: Phiên bản đầu; version khác 1 bị coi là lỗi shape và dùng cấu hình mặc định.
      migration: Phiên bản sau phải thêm bước chuyển đổi trong validate/merge trước khi tăng version.
      invariant_refs:
        - INV-002
        - INV-003
        - INV-004
    - id: PC-004
      kind: api
      statement: >-
        Mã quyền <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} và route
        generic/:module/:entity[/create|/:id/detail|/:id/update|/configuration].
      owner: sdcorejs-angular/modules/generic
      compatibility: Mới; đổi định dạng về sau là breaking với hệ thống phân quyền của portal.
      migration: Portal khai các mã này trong hệ thống quyền.
      invariant_refs:
        - INV-005
        - INV-009
    - id: PC-005
      kind: api
      statement: form-generic thêm SdFormGenericTime (type time, giá trị HH:mm) và SdFormGenericJson (type json) vào union SdFormGenericField.
      owner: sdcorejs-angular/components/form-generic
      compatibility: Chỉ thêm; code consumer switch đủ mọi type (exhaustive) cần thêm nhánh.
      migration: Ghi trong CHANGELOG; không đổi schema đã lưu.
      invariant_refs:
        - INV-011
  security_trust_boundaries:
    - id: ST-001
      statement: Kiểm tra quyền ở client chỉ để ẩn UI và chặn route; backend của adapter phải kiểm lại quyền.
      invariant_refs:
        - INV-005
    - id: ST-002
      statement: Tiêu đề và giá trị hiển thị từ dữ liệu backend chỉ render dạng text, không HTML.
      invariant_refs:
        - INV-006
  cross_repository_integration: []
  adopted_decision_refs:
    - D-001
    - D-002
    - D-003
    - D-004
    - D-005
    - D-006
    - D-007
    - D-008
    - D-009
    - D-010
    - D-011
    - D-012
    - D-013
    - D-014
    - D-015
    - D-016
    - D-017
    - D-018
    - D-019
    - D-020
    - D-021
    - D-022
    - D-023
    - D-024
    - D-025
    - D-026
    - D-027
    - D-028
  deferred_decision_refs:
    - D-029
  assumption_refs:
    - A-001
    - A-002
    - A-003
    - A-004
    - A-005
  validation_obligations:
    - id: VAL-001
      expected_proof: >-
        Spec registry/resolver với injector root và EnvironmentInjector con: scope gần nhất thắng, trùng cùng injector ném lỗi ngay khi
        injector được tạo.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-001
      acceptance_criterion_refs:
        - AC-002
        - AC-003
    - id: VAL-002
      expected_proof: >-
        Spec SdGenericSchemaService và hàm merge: 3 lớp, null dùng mặc định, localStorage khi không có configuration, tham chiếu treo bị bỏ,
        property mới visible false, cấu trúc lấy từ base.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-002
        - INV-004
      acceptance_criterion_refs:
        - AC-001
        - AC-004
        - AC-005
        - AC-006
    - id: VAL-003
      expected_proof: Spec validateSdGenericSchema cho từng mã lỗi; spec load fallback + console.warn + banner theo quyền; spec màn cấu hình chặn lưu.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-003
        - INV-005
      acceptance_criterion_refs:
        - AC-007
        - AC-008
        - AC-020
    - id: VAL-004
      expected_proof: >-
        Spec hàm mã quyền, guard route (route có data.permission public, guard generic kiểm mã thật) và lọc action (permission, visible,
        hiddenDefaults, permission: false).
      owner: sdcorejs-angular
      invariant_refs:
        - INV-005
        - INV-013
      acceptance_criterion_refs:
        - AC-010
        - AC-018
    - id: VAL-005
      expected_proof: 'Spec template tiêu đề và DOM: placeholder sai bị báo, <b> hiện dạng text.'
      owner: sdcorejs-angular
      invariant_refs:
        - INV-006
      acceptance_criterion_refs:
        - AC-009
    - id: VAL-006
      expected_proof: Spec hàm dựng form theo action và lọc payload update.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-007
      acceptance_criterion_refs:
        - AC-015
    - id: VAL-007
      expected_proof: >-
        Spec SdGenericDataService: hooks, thứ tự search và filter CONTAIN/IN, PagingReq của list, catalog relation có params riêng từng
        relation và giá trị relation số được lưu lại là số.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-008
      acceptance_criterion_refs:
        - AC-001
        - AC-016
        - AC-017
    - id: VAL-008
      expected_proof: 'Spec route với RouterTestingHarness: drawer đè list và back đóng drawer giữ trạng thái list; page mặc định và reload sau khi lưu.'
      owner: sdcorejs-angular
      invariant_refs:
        - INV-009
      acceptance_criterion_refs:
        - AC-011
        - AC-012
    - id: VAL-009
      expected_proof: 'Spec trang list: cột ẩn, orders/filters trong request, xác nhận xoá, xoá nhiều tuần tự, reload, action mở rộng.'
      owner: sdcorejs-angular
      invariant_refs:
        - INV-013
      acceptance_criterion_refs:
        - AC-013
        - AC-014
        - AC-018
    - id: VAL-010
      expected_proof: Spec kế hoạch import và giới hạn 5 request song song qua data service.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-014
      acceptance_criterion_refs:
        - AC-019
    - id: VAL-011
      expected_proof: 'Spec trang cấu hình: lưu gọi configuration.set hoặc localStorage, key/dataType chỉ đọc, xoá cache.'
      owner: sdcorejs-angular
      invariant_refs:
        - INV-015
        - INV-002
      acceptance_criterion_refs:
        - AC-005
        - AC-020
    - id: VAL-012
      expected_proof: Spec field time/json của form-generic và toàn bộ suite form-generic hiện có xanh.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-011
      acceptance_criterion_refs:
        - AC-021
    - id: VAL-013
      expected_proof: Spec public-api của modules/generic (đúng 4 symbol runtime) và lệnh quét không có HttpClient/import backend trong modules/generic.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-010
        - INV-004
      acceptance_criterion_refs:
        - AC-024
    - id: VAL-014
      expected_proof: >-
        npm run test:showcase-examples, build Showcase, npm run sync, npm run check:sync, build sdcorejs-angular v19–v22 (không vòng phụ
        thuộc qua barrel modules), CHANGELOG có mục Unreleased.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-012
      acceptance_criterion_refs:
        - AC-022
        - AC-023
  profile_sections:
    frontend_architecture_ref:
      reference: plan_context.frontend_architecture
      conformance_invariant_refs:
        - INV-001
        - INV-002
        - INV-007
        - INV-008
        - INV-009
        - INV-013
    agent_architecture_ref: null
  change_control:
    revision: 1
    supersedes: null
```

## Appendix — decision_coverage revision 2 (thêm D-019…D-029, INV-001…INV-015)

```yaml
decision_coverage:
  schema_version: 1
  revision: 2
  records:
    - id: R-001
      type: requirement
      statement: >-
        Thêm entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend: public API runtime gồm provideSdGeneric,
        provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; các model SdGenericSchema, SdGenericProperty, SdGenericAdapter…
        chỉ export dạng type. Không chứa adapter hay giá trị riêng của backend nào.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-002
      type: requirement
      statement: >-
        Model SdGenericSchema { version: 1, module, entity, general { label, primaryKey?, properties }, list?, detail?, create?, update?,
        import? }; detail/create/update có dạng { title?, form?: SdFormGenericSchema }; list có title?, columns?, externalFilters?, orders?,
        pageSize?, export?; import có columns?: { key, matchField? }[], upsertKey?.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-003
      type: requirement
      statement: >-
        Model SdGenericProperty { key, label, dataType: string|text|number|boolean|date|datetime|time|enum|relation|json|file, multiple?,
        format? (email|phone|url|password cho string; integer|decimal|currency|percent cho number), enums?: { value, label, color?, icon?
        }[], relation?: { module?, entity, valueField? = 'id', displayField?, display?, searchFields? }, validation?, defaultValue?,
        insertable? = true, updatable? = true, system? }; không có relation.type, multiple quyết định chọn một hay nhiều.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-004
      type: requirement
      statement: >-
        Contract SdGenericAdapter { module, schema(entity), query(entity, PagingReq) → PagingRes, detail(entity, id), create(entity, data),
        update(entity, id, data), delete(entity, id), search?(entity, req), configuration?: { get(entity), set(entity, schema) },
        display?(args) }; request/response dùng PagingReq/PagingRes/Filter/Order của @sdcorejs/utils.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-005
      type: requirement
      statement: >-
        provideSdGeneric({ adapters, permission? }) và provideSdGenericEntity({ module, entity, … }) gọi được nhiều lần ở root và trong lazy
        route; tra cứu theo module (và module+entity) đi từ injector gần nhất lên root, bản gần nhất thắng; trùng module/entity trong cùng
        một lần gọi là lỗi khi khởi tạo; adapters nhận class (DI tạo) hoặc instance.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-006
      type: requirement
      statement: >-
        Schema hiệu lực dựng qua 3 lớp: adapter.schema(entity) → provideSdGenericEntity.schema(base) (nếu có) = cấu hình mặc định →
        configuration.get(entity) khác null thì validate rồi merge lên trên; null thì dùng cấu hình mặc định. Adapter không khai
        configuration thì lib lưu ở localStorage. Mỗi entity một cấu hình; lưu theo server hay theo người dùng do adapter quyết định.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-007
      type: requirement
      statement: >-
        Merge cấu hình đã lưu với schema hiện tại: key, dataType, enums[].value, relation.entity lấy từ schema hiện tại; label, nhãn enum,
        display, validation, defaultValue… lấy từ bản đã lưu; property không còn ở schema hiện tại bị bỏ khỏi general, list, layout form và
        import; property mới được thêm vào general và vào list.columns với visible: false, không tự chèn vào layout form đã lưu.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-008
      type: requirement
      statement: >-
        validateSdGenericSchema(stored, base) trả danh sách issue { path, code, severity } kiểm tra: shape và version, key property không
        trùng, module/entity khớp, tham chiếu của list.columns/externalFilters/orders/import.columns/upsertKey/field trong layout tới
        property có thật, type field layout khớp dataType, ngữ pháp layout form-generic, upsertKey không multiple, field layout create phải
        insertable và update phải updatable, template tiêu đề. Khi load: tham chiếu treo tự bỏ; lỗi shape/version thì dùng cấu hình mặc
        định, console.warn và hiện banner cho người có quyền CONFIGURATION. Khi lưu: có lỗi thì chặn.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-009
      type: requirement
      statement: >-
        Tiêu đề nằm trong từng section (list.title, create.title, detail.title, update.title), hỗ trợ template ${key}; list.title và
        create.title không được có placeholder; detail.title và update.title chỉ tham chiếu property có thật; tiêu đề render dạng text
        (không HTML); thiếu thì sinh từ general.label.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-010
      type: requirement
      statement: >-
        sdGenericRoutes() cung cấp generic/:module/:entity, …/create, …/:id/detail, …/:id/update, …/configuration. Form detail/create/update
        hiển thị dạng page hoặc side-drawer theo provideSdGenericEntity.display → adapter.display → mặc định 'page'; side-drawer điều khiển
        bằng route: list vẫn hiển thị phía sau, giữ filter/trang, back đóng drawer, lưu xong list reload.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-011
      type: requirement
      statement: >-
        Quyền theo định dạng <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} (viết hoa), kiểm tra qua
        SdPermissionService.hasPermission; thiếu quyền thì ẩn action và chặn route tương ứng; provideSdGeneric({ permission: false }) tắt
        kiểm tra.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-012
      type: requirement
      statement: >-
        Màn list dùng sd-table type server: cột mặc định là mọi property trừ json/file; visible: false là ẩn mặc định nhưng bật lại được;
        sortable/filterable; externalFilters; orders mặc định; pageSize mặc định 20; export Excel phía client khi bật; action có sẵn
        create/import/export (header), detail/update/delete (dòng), delete (chọn nhiều, gọi delete lần lượt); xoá có xác nhận và reload sau
        khi xoá.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-013
      type: requirement
      statement: >-
        Detail/create/update render bằng sd-form-render: layout = section.form ?? detail.form ?? tự sinh từ general; mỗi field layout được
        điền type/label/options/validation từ general theo key; detail ở chế độ viewed và hiện cả property system; create bỏ system và
        property không insertable; update bỏ system và property không updatable, payload update chỉ gồm property updatable; relation dùng
        catalog do lib tự đăng ký, search theo thứ tự provideSdGenericEntity.search → adapter.search → adapter.query với CONTAIN (tìm) / IN
        (lấy nhãn).
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-014
      type: requirement
      statement: >-
        provideSdGenericEntity.hooks: beforeSave(ctx { action, data, schema }) trả payload (đồng bộ hoặc Promise) trước khi gọi
        adapter.create/update; afterSave(ctx) chạy sau khi lưu thành công.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-015
      type: requirement
      statement: >-
        provideSdGenericEntity khai action mở rộng: listActions, rowCommands, bulkActions, detailActions với { id, label, icon?,
        permission?, visible?(ctx), run(ctx) }, ctx gồm schema, row hoặc rows, reload(); hiddenDefaults ẩn action có sẵn (create, import,
        export, detail, update, delete).
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-016
      type: requirement
      statement: >-
        Import dùng sd-import-excel: template từ import.columns hoặc mọi property insertable trừ system/json/file; ô enum nhận value hoặc
        label; ô relation so khớp theo matchField (mặc định relation.displayField) qua search với values; có upsertKey thì tra theo lô bản
        ghi đã tồn tại → update, chưa có → create; không upsertKey thì luôn create; tối đa 5 request song song; kết quả từng dòng hiện trong
        sd-import-excel; chỉ cần quyền IMPORT.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-017
      type: requirement
      statement: >-
        Màn chỉnh cấu hình tại …/configuration với 4 tab: Thông tin chung (label, nhãn/màu enum, display/searchFields của relation,
        validation, defaultValue, insertable/updatable; không sửa key/dataType), Danh sách (thứ tự cột, width/visible/sortable/filterable,
        externalFilters, orders, pageSize, export), Form (sd-form-builder cho detail, create/update có lựa chọn "giống detail", palette là
        properties), Import (columns, upsertKey); hiện cảnh báo property bị bỏ/mới; nút Lưu validate rồi gọi configuration.set(entity,
        schema), có lỗi thì chặn.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: modules/generic
    - id: R-018
      type: requirement
      statement: >-
        form-generic thêm field type time (giá trị chuỗi HH:mm) và json (dùng code-editor, giá trị JSON hợp lệ) ở renderer, builder và
        validation; chỉ thêm mới, schema form-generic hiện có không đổi hành vi.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: components/form-generic
    - id: R-019
      type: requirement
      statement: >-
        Showcase có trang demo module generic chạy với adapter mock in-memory; có tài liệu sd-generic.md và cập nhật sd-form-generic.md cho
        time/json.
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: showcase
    - id: R-020
      type: requirement
      statement: >-
        Thay đổi viết ở versions/v19 rồi rollout sang v20/v21/v22 bằng npm run sync, check:sync xanh; CHANGELOG có mục Unreleased mô tả thay
        đổi, nhắm release suffix 3.2 (chỉ thêm mới).
      source: explicit-user
      status: active
      owner_repository_id: sdcorejs-angular
      owner_module_id: null
    - id: AC-001
      type: acceptance-criterion
      statement: >-
        Mở generic/tms/order khi configuration.get trả null → Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua
        adapter.query với PagingReq pageSize 20
      behavior: Mở generic/tms/order khi configuration.get trả null
      expected_result: Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với PagingReq pageSize 20
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-004
        - R-006
        - R-012
    - id: AC-002
      type: acceptance-criterion
      statement: >-
        Cùng module tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó → Lib dùng adapter khai ở
        lazy route; trang ngoài lazy route dùng adapter root
      behavior: Cùng module tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó
      expected_result: Lib dùng adapter khai ở lazy route; trang ngoài lazy route dùng adapter root
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-005
    - id: AC-003
      type: acceptance-criterion
      statement: Một lần gọi provideSdGeneric khai hai adapter cùng module → Khởi tạo injector ném lỗi nêu tên module bị trùng
      behavior: Một lần gọi provideSdGeneric khai hai adapter cùng module
      expected_result: Khởi tạo injector ném lỗi nêu tên module bị trùng
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-005
    - id: AC-004
      type: acceptance-criterion
      statement: >-
        provideSdGenericEntity.schema đổi label của một property và configuration.get trả bản đã lưu đổi label property khác → Schema hiệu
        lực có cả hai thay đổi; khi get trả null thì chỉ có thay đổi của provideSdGenericEntity.schema
      behavior: provideSdGenericEntity.schema đổi label của một property và configuration.get trả bản đã lưu đổi label property khác
      expected_result: Schema hiệu lực có cả hai thay đổi; khi get trả null thì chỉ có thay đổi của provideSdGenericEntity.schema
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-006
    - id: AC-005
      type: acceptance-criterion
      statement: >-
        Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang → Cấu hình được ghi và đọc lại từ localStorage theo
        module và entity
      behavior: Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang
      expected_result: Cấu hình được ghi và đọc lại từ localStorage theo module và entity
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-006
        - R-017
    - id: AC-006
      type: acceptance-criterion
      statement: >-
        Cấu hình đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới → Cột/field
        treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form đã lưu;
        dataType lấy từ schema hiện tại
      behavior: Cấu hình đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới
      expected_result: >-
        Cột/field treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form
        đã lưu; dataType lấy từ schema hiện tại
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-007
        - R-008
    - id: AC-007
      type: acceptance-criterion
      statement: >-
        configuration.get trả object sai shape hoặc version không hỗ trợ → Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình
        không hợp lệ" chỉ hiện với người có quyền CONFIGURATION
      behavior: configuration.get trả object sai shape hoặc version không hỗ trợ
      expected_result: Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình không hợp lệ" chỉ hiện với người có quyền CONFIGURATION
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-008
        - R-011
    - id: AC-008
      type: acceptance-criterion
      statement: >-
        validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field layout
        sai type → Trả issue với path và code tương ứng cho từng lỗi, severity error
      behavior: >-
        validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field layout
        sai type
      expected_result: Trả issue với path và code tương ứng cho từng lỗi, severity error
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-008
    - id: AC-009
      type: acceptance-criterion
      statement: >-
        Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>' → Cả hai title đầu bị
        báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
      behavior: Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>'
      expected_result: Cả hai title đầu bị báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-008
        - R-009
    - id: AC-010
      type: acceptance-criterion
      statement: >-
        Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create → Nút tạo mới bị ẩn
        và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được
      behavior: Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create
      expected_result: 'Nút tạo mới bị ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được'
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-010
        - R-011
    - id: AC-011
      type: acceptance-criterion
      statement: >-
        display trả 'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back → Drawer mở đè lên list, URL có
        /1/detail; back đóng drawer, list giữ filter và trang
      behavior: display trả 'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back
      expected_result: Drawer mở đè lên list, URL có /1/detail; back đóng drawer, list giữ filter và trang
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-010
    - id: AC-012
      type: acceptance-criterion
      statement: >-
        Không khai display và mở generic/tms/order/1/update → Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì
        quay về list và list reload
      behavior: Không khai display và mở generic/tms/order/1/update
      expected_result: Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list và list reload
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-010
    - id: AC-013
      type: acceptance-criterion
      statement: >-
        list có column visible: false, orders mặc định và externalFilters có default → Cột ẩn nhưng có trong cài đặt cột; request query mang
        orders và filters tương ứng
      behavior: 'list có column visible: false, orders mặc định và externalFilters có default'
      expected_result: Cột ẩn nhưng có trong cài đặt cột; request query mang orders và filters tương ứng
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-012
    - id: AC-014
      type: acceptance-criterion
      statement: >-
        Xoá một dòng và xoá 3 dòng đã chọn → Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi
        xoá
      behavior: Xoá một dòng và xoá 3 dòng đã chọn
      expected_result: Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi xoá
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-012
    - id: AC-015
      type: acceptance-criterion
      statement: >-
        Mở create, update, detail với schema không có layout form và có property system, property updatable: false → Create không có system;
        update không có system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed và có property system;
        field có label/type/options lấy từ general
      behavior: 'Mở create, update, detail với schema không có layout form và có property system, property updatable: false'
      expected_result: >-
        Create không có system; update không có system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed
        và có property system; field có label/type/options lấy từ general
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-013
    - id: AC-016
      type: acceptance-criterion
      statement: >-
        Mở select relation với entity có search riêng, với adapter có search, và với adapter chỉ có query → Lần lượt gọi search của entity,
        search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên valueField
      behavior: Mở select relation với entity có search riêng, với adapter có search, và với adapter chỉ có query
      expected_result: >-
        Lần lượt gọi search của entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn
        lấy qua IN trên valueField
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-013
        - R-004
    - id: AC-017
      type: acceptance-criterion
      statement: >-
        beforeSave thêm field vào payload và afterSave được khai → adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần
        sau khi lưu thành công và không chạy khi lưu lỗi
      behavior: beforeSave thêm field vào payload và afterSave được khai
      expected_result: adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần sau khi lưu thành công và không chạy khi lưu lỗi
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-014
    - id: AC-018
      type: acceptance-criterion
      statement: >-
        provideSdGenericEntity khai rowCommands có permission và visible, hiddenDefaults: [delete] → Command chỉ hiện khi có quyền và
        visible trả true, run nhận ctx có row và reload; command delete có sẵn bị ẩn
      behavior: 'provideSdGenericEntity khai rowCommands có permission và visible, hiddenDefaults: [delete]'
      expected_result: Command chỉ hiện khi có quyền và visible trả true, run nhận ctx có row và reload; command delete có sẵn bị ẩn
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-015
    - id: AC-019
      type: acceptance-criterion
      statement: >-
        Import file 3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField →
        Dòng đã tồn tại gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng
        thời; kết quả từng dòng hiện trong sd-import-excel
      behavior: Import file 3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField
      expected_result: >-
        Dòng đã tồn tại gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng
        thời; kết quả từng dòng hiện trong sd-import-excel
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-016
    - id: AC-020
      type: acceptance-criterion
      statement: >-
        Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu → Lần đầu bị
        chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
      behavior: Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu
      expected_result: Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-017
        - R-008
    - id: AC-021
      type: acceptance-criterion
      statement: >-
        Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai → Hai field báo lỗi validation; giá trị đúng được
        lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic hiện có vẫn xanh
      behavior: Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai
      expected_result: >-
        Hai field báo lỗi validation; giá trị đúng được lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette;
        spec form-generic hiện có vẫn xanh
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-018
    - id: AC-022
      type: acceptance-criterion
      statement: >-
        Mở trang demo module generic trên Showcase → Trang hiện list từ adapter mock và mở được create/detail; guard example/registry của
        Showcase xanh
      behavior: Mở trang demo module generic trên Showcase
      expected_result: Trang hiện list từ adapter mock và mở được create/detail; guard example/registry của Showcase xanh
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-019
    - id: AC-023
      type: acceptance-criterion
      statement: >-
        Chạy npm run sync rồi npm run check:sync và build sdcorejs-angular trên v19–v22 → check:sync xanh, bốn workspace build không lỗi;
        CHANGELOG có mục Unreleased cho module generic
      behavior: Chạy npm run sync rồi npm run check:sync và build sdcorejs-angular trên v19–v22
      expected_result: check:sync xanh, bốn workspace build không lỗi; CHANGELOG có mục Unreleased cho module generic
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-020
    - id: AC-024
      type: acceptance-criterion
      statement: >-
        Chạy spec public-api của entry point modules/generic → Entry point export đúng bốn symbol runtime provideSdGeneric,
        provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package riêng của backend nào
      behavior: Chạy spec public-api của entry point modules/generic
      expected_result: >-
        Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không
        import package riêng của backend nào
      verification_kind: automated
      blocking: true
      requirement_refs:
        - R-001
        - R-002
        - R-003
    - id: A-001
      type: assumption
      statement: >-
        Multi-provider khai trong injector con không gộp với injector cha; lib phải tự đi từ injector gần nhất lên root (skipSelf) để tìm
        adapter/entity.
      evidence_refs: []
      source: inferred
      confidence: high
      status: confirmed
      blocking: false
      consequence_if_wrong: Có thể đọc trực tiếp token multi thay vì đi theo chuỗi injector; thiết kế vẫn đúng nhưng thừa code.
      validation_method: Test TDD cho AC-002 với injector root + lazy.
      owner: sdcorejs-execute-plan
      rationale: Hành vi chuẩn của Angular DI; đã gặp ở SD_API_CONFIG (SdApiHandlerRegistry).
      impacted_refs:
        - R-005
    - id: A-002
      type: assumption
      statement: >-
        sd-table server truyền PagingReq (filters, orders, pageSize, pageNumber) đủ để chuyển thẳng sang adapter.query, gồm cả external
        filter.
      evidence_refs: []
      source: inferred
      confidence: medium
      status: proposed
      blocking: false
      consequence_if_wrong: Cần lớp chuyển SdTableFilterRequest sang Filter trong module generic.
      validation_method: Test TDD cho AC-013 đối chiếu request thực tế sd-table phát ra.
      owner: sdcorejs-execute-plan
      rationale: 'components/table/src/models/table-option.model.ts:198 khai items(filterRequest, pagingReq: PagingReq).'
      impacted_refs:
        - R-012
    - id: A-003
      type: assumption
      statement: sd-import-excel accept(items) trả SdImportExcelValidation[] đủ để báo kết quả từng dòng sau khi gọi create/update.
      evidence_refs: []
      source: inferred
      confidence: medium
      status: proposed
      blocking: false
      consequence_if_wrong: Cần thêm hiển thị kết quả riêng sau bước accept.
      validation_method: Test cho AC-019.
      owner: sdcorejs-execute-plan
      rationale: components/import-excel/src/import-excel.model.ts:17.
      impacted_refs:
        - R-016
    - id: A-004
      type: assumption
      statement: sd-code-editor dùng được làm control (model/ControlValueAccessor) bên trong renderer form-generic cho field json.
      evidence_refs: []
      source: inferred
      confidence: medium
      status: proposed
      blocking: false
      consequence_if_wrong: Field json cần bọc adapter control riêng quanh code-editor.
      validation_method: Test cho AC-021.
      owner: sdcorejs-execute-plan
      rationale: components/code-editor/src/code-editor.component.ts có model/CVA.
      impacted_refs:
        - R-018
    - id: A-005
      type: assumption
      statement: Khoá localStorage mặc định là sd-generic:configuration:<module>.<entity>; cấu hình chỉ có hiệu lực trên trình duyệt đó.
      evidence_refs: []
      source: defaulted
      confidence: high
      status: proposed
      blocking: false
      consequence_if_wrong: Đổi tên khoá trước release, chưa có dữ liệu cũ.
      validation_method: Người dùng duyệt spec; test cho AC-005.
      owner: user
      rationale: Người dùng chốt mặc định localStorage; tên khoá do spec đặt.
      impacted_refs:
        - R-006
    - id: D-001
      type: decision
      statement: >-
        Module generic đặt ở repo nào? → @sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend; adapter
        backend OMD nằm ngoài repo
      question: Module generic đặt ở repo nào?
      selected_value: '@sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend; adapter backend OMD nằm ngoài repo'
      source: explicit-user
      status: approved
      blocking: true
      scope: repository
      owner_repository_id: sdcorejs-angular
      rationale: form-generic 3.0 đã ở đây; nguyên tắc adapter không phụ thuộc backend.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-001
        - AC-024
    - id: D-002
      type: decision
      statement: >-
        Ghép SdGenericSchema với form-generic thế nào? → general.properties là nguồn duy nhất; detail/create/update chứa layout
        SdFormGenericSchema tham chiếu property theo key, lib điền type/label/options/validation lúc render; thiếu layout thì tự sinh
      question: Ghép SdGenericSchema với form-generic thế nào?
      selected_value: >-
        general.properties là nguồn duy nhất; detail/create/update chứa layout SdFormGenericSchema tham chiếu property theo key, lib điền
        type/label/options/validation lúc render; thiếu layout thì tự sinh
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Tránh cấu hình trùng lặp (pain point lib-core-commerce) mà vẫn dùng đủ form-generic và sd-form-builder.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-002
        - R-013
        - AC-015
    - id: D-003
      type: decision
      statement: >-
        Tên gọi trong model và adapter? → properties (không phải fields), adapter.detail (không phải get), configuration: { get, set },
        entity (không phải typeCode)
      question: Tên gọi trong model và adapter?
      selected_value: 'properties (không phải fields), adapter.detail (không phải get), configuration: { get, set }, entity (không phải typeCode)'
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Theo convention API của người dùng.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-002
        - R-004
        - AC-001
    - id: D-004
      type: decision
      statement: Định dạng route? → generic/:module/:entity, /create, /:id/detail, /:id/update, /configuration (id đứng trước action)
      question: Định dạng route?
      selected_value: generic/:module/:entity, /create, /:id/detail, /:id/update, /configuration (id đứng trước action)
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Mỗi entity một cấu hình nên route mang thẳng module/entity, không cần tách chuỗi.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-010
        - AC-011
        - AC-012
    - id: D-005
      type: decision
      statement: >-
        Page hay side-drawer quyết định ở đâu? → Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer
        điều khiển bằng route
      question: Page hay side-drawer quyết định ở đâu?
      selected_value: Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer điều khiển bằng route
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Consumer quyết theo schema, ví dụ số property; deep link và back hoạt động.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-010
        - AC-011
    - id: D-006
      type: decision
      statement: >-
        Phạm vi giao lần này? → Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase,
        docs
      question: Phạm vi giao lần này?
      selected_value: 'Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase, docs'
      source: explicit-user
      status: approved
      blocking: true
      scope: repository
      owner_repository_id: sdcorejs-angular
      rationale: Người dùng chọn phương án 3.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-012
        - R-016
        - R-017
        - R-018
        - R-019
    - id: D-007
      type: decision
      statement: >-
        provide một hay nhiều lần? → Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry đọc
        field private của router
      question: provide một hay nhiều lần?
      selected_value: Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry đọc field private của router
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Module tự provide adapter; registry root chỉ thấy module đã load và phụ thuộc field private.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-005
        - AC-002
        - AC-003
    - id: D-008
      type: decision
      statement: time và json? → Thêm field type time và json vào form-generic (json dùng code-editor), chỉ thêm mới
      question: time và json?
      selected_value: Thêm field type time và json vào form-generic (json dùng code-editor), chỉ thêm mới
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Phạm vi làm hết một lần; tránh map tạm kém chính xác.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-018
        - AC-021
    - id: D-009
      type: decision
      statement: Quan hệ OneToMany và relation.type? → Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định một/nhiều
      question: Quan hệ OneToMany và relation.type?
      selected_value: Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định một/nhiều
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Giữ đơn giản như lib-core-commerce; bảng con để sau.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-003
        - AC-016
    - id: D-010
      type: decision
      statement: search và history? → search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history không thuộc lib
      question: search và history?
      selected_value: search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history không thuộc lib
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Backend có API search riêng để bảo đảm hiệu năng; history mỗi dự án tự làm.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-004
        - R-013
        - AC-016
    - id: D-011
      type: decision
      statement: >-
        Tuỳ biến theo entity ở đâu? → Provider riêng provideSdGenericEntity { module, entity, schema(base), search?, display?, hooks?,
        listActions?, rowCommands?, bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object partial
      question: Tuỳ biến theo entity ở đâu?
      selected_value: >-
        Provider riêng provideSdGenericEntity { module, entity, schema(base), search?, display?, hooks?, listActions?, rowCommands?,
        bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object partial
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Adapter trả schema mặc định theo entity; deep-merge mảng không rõ nghĩa.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-006
        - R-014
        - R-015
        - AC-004
        - AC-017
        - AC-018
    - id: D-012
      type: decision
      statement: >-
        Lưu cấu hình thế nào? → configuration: { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa có;
        adapter không khai thì localStorage
      question: Lưu cấu hình thế nào?
      selected_value: >-
        configuration: { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa có; adapter không khai thì
        localStorage
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Không cần nhận diện configurationId; server hay theo người dùng do consumer quyết.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-006
        - AC-005
    - id: D-013
      type: decision
      statement: >-
        Cấu hình đã lưu không hợp lệ thì sao? → Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người có
        quyền CONFIGURATION; lưu có lỗi thì chặn
      question: Cấu hình đã lưu không hợp lệ thì sao?
      selected_value: Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người có quyền CONFIGURATION; lưu có lỗi thì chặn
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Bước validate quan trọng; trang không chết vì cấu hình hỏng.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-008
        - AC-007
        - AC-020
    - id: D-014
      type: decision
      statement: Tiêu đề đặt ở đâu? → Trong từng section list/create/update/detail, template ${key} có validate, render dạng text
      question: Tiêu đề đặt ở đâu?
      selected_value: Trong từng section list/create/update/detail, template ${key} có validate, render dạng text
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Người dùng yêu cầu; tránh XSS như htmlTemplate cũ.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-009
        - AC-009
    - id: D-015
      type: decision
      statement: >-
        Mã quyền và cơ chế kiểm tra? → <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua
        SdPermissionService, có permission: false
      question: Mã quyền và cơ chế kiểm tra?
      selected_value: '<MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua SdPermissionService, có permission: false'
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Định dạng người dùng đưa, thêm CONFIGURATION cho màn chỉnh cấu hình.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-011
        - AC-010
    - id: D-016
      type: decision
      statement: >-
        Luật import? → Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search;
        upsert theo upsertKey; tối đa 5 request song song; chỉ quyền IMPORT
      question: Luật import?
      selected_value: >-
        Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search; upsert theo
        upsertKey; tối đa 5 request song song; chỉ quyền IMPORT
      source: explicit-user
      status: approved
      blocking: true
      scope: public-contract
      owner_repository_id: sdcorejs-angular
      rationale: Dùng lại create/update của adapter và sd-import-excel có sẵn.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-016
        - AC-019
    - id: D-017
      type: decision
      statement: >-
        Cách viết test? → TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import
        upsert); viết test sau cho UI và Showcase
      question: Cách viết test?
      selected_value: >-
        TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import upsert); viết test sau
        cho UI và Showcase
      source: explicit-user
      status: approved
      blocking: true
      scope: repository
      owner_repository_id: sdcorejs-angular
      rationale: Logic thuần có giá trị TDD cao; UI chủ yếu là nối component.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-005
        - R-007
        - R-008
    - id: D-018
      type: decision
      statement: >-
        Release? → Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho phép
        riêng
      question: Release?
      selected_value: Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho phép riêng
      source: explicit-user
      status: approved
      blocking: true
      scope: repository
      owner_repository_id: sdcorejs-angular
      rationale: Không phá vỡ API consumer.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - R-020
        - AC-023
    - id: D-019
      type: decision
      statement: >-
        Phân tầng trong modules/generic? → models (type) → core (hàm thuần: merge, validate, dựng mặc định, tiêu đề, mã quyền, dựng form,
        map cột, kế hoạch import, request search) → registry (provider, scope) → services (schema, data, quyền, import) →
        routes/pages/components; tầng dưới không import tầng trên
      question: Phân tầng trong modules/generic?
      selected_value: >-
        models (type) → core (hàm thuần: merge, validate, dựng mặc định, tiêu đề, mã quyền, dựng form, map cột, kế hoạch import, request
        search) → registry (provider, scope) → services (schema, data, quyền, import) → routes/pages/components; tầng dưới không import tầng
        trên
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: Logic dùng chung nằm ở hàm thuần để TDD và để list/form/import/màn cấu hình không tự quyết khác nhau.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-002
        - INV-003
        - INV-007
        - R-001
    - id: D-020
      type: decision
      statement: >-
        Cơ chế registry cho provider gọi nhiều lần? → Mỗi injector có một scope node dựng từ multi token cùng tầng (self) và scope cha
        (skipSelf); tra module rồi module+entity từ scope gần nhất lên root; trùng module (hoặc module+entity) trong cùng một injector là
        lỗi, kiểm ngay khi injector được tạo bằng provideEnvironmentInitializer; option permission lấy từ scope gần nhất có khai
      question: Cơ chế registry cho provider gọi nhiều lần?
      selected_value: >-
        Mỗi injector có một scope node dựng từ multi token cùng tầng (self) và scope cha (skipSelf); tra module rồi module+entity từ scope
        gần nhất lên root; trùng module (hoặc module+entity) trong cùng một injector là lỗi, kiểm ngay khi injector được tạo bằng
        provideEnvironmentInitializer; option permission lấy từ scope gần nhất có khai
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: >-
        Multi token ở injector con không gộp với cha; trùng cùng tầng là mơ hồ nên báo lỗi (làm rõ R-005: bao trùm trường hợp trùng trong
        một lần gọi); kiểm sớm để AC-003 ném lỗi lúc khởi tạo, không đợi lần điều hướng đầu.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-001
        - R-005
        - AC-003
    - id: D-021
      type: decision
      statement: >-
        Ai giữ schema hiệu lực và cache? → SdGenericSchemaService ở injector môi trường của route generic giữ Promise schema theo
        module.entity; resolver của route nạp schema trước khi list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity đó
      question: Ai giữ schema hiệu lực và cache?
      selected_value: >-
        SdGenericSchemaService ở injector môi trường của route generic giữ Promise schema theo module.entity; resolver của route nạp schema
        trước khi list/form/màn cấu hình kích hoạt; lưu cấu hình thì xoá cache entity đó
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: Một nơi duy nhất dựng 3 lớp schema; tránh mỗi trang tự gọi adapter.schema.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-002
        - R-006
        - AC-004
    - id: D-022
      type: decision
      statement: >-
        Select relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh? → sdGenericRoutes() đăng ký provideSdFormGeneric({
        catalogs: [sd-generic-relation] }) ở injector môi trường của route generic; field relation dùng catalog này với params hằng {
        module, entity, valueField, displayField, searchFields (nối bằng dấu phẩy) } để cache của form-generic phân biệt từng relation;
        callback của catalog gọi SdGenericDataService qua injector môi trường bắt bằng provideEnvironmentInitializer; vì option value của
        form-generic là chuỗi, SdGenericDataService đổi giá trị relation về kiểu gốc (theo dữ liệu đã tải) trước khi lưu
      question: Select relation lấy dữ liệu từ đâu khi form-generic chỉ nhận catalog tĩnh?
      selected_value: >-
        sdGenericRoutes() đăng ký provideSdFormGeneric({ catalogs: [sd-generic-relation] }) ở injector môi trường của route generic; field
        relation dùng catalog này với params hằng { module, entity, valueField, displayField, searchFields (nối bằng dấu phẩy) } để cache
        của form-generic phân biệt từng relation; callback của catalog gọi SdGenericDataService qua injector môi trường bắt bằng
        provideEnvironmentInitializer; vì option value của form-generic là chuỗi, SdGenericDataService đổi giá trị relation về kiểu gốc
        (theo dữ liệu đã tải) trước khi lưu
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: >-
        Chỉ dùng API public của form-generic (catalog và templates cố định lúc provideSdFormGeneric chạy nên không thể một catalog theo id
        <module>.<entity> như phần Architecture của spec mô tả); một catalog phục vụ mọi relation. Hệ quả: cấu hình form-generic của portal
        ở root không áp lên form của module generic.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-008
        - R-013
        - AC-016
    - id: D-023
      type: decision
      statement: >-
        Tab Form của màn cấu hình đưa property vào layout thế nào? → sd-form-builder dùng [(schema)]; panel danh sách property chưa có trong
        layout, bấm để thêm field đã điền sẵn vào schema (builder nạp lại schema nên mất undo và vùng chọn hiện tại); không dùng templates
        của form-generic
      question: Tab Form của màn cấu hình đưa property vào layout thế nào?
      selected_value: >-
        sd-form-builder dùng [(schema)]; panel danh sách property chưa có trong layout, bấm để thêm field đã điền sẵn vào schema (builder
        nạp lại schema nên mất undo và vùng chọn hiện tại); không dùng templates của form-generic
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: >-
        templates cố định lúc provideSdFormGeneric chạy nên không sinh theo entity được; panel property đáp ứng "palette là properties" của
        R-017 mà không mở rộng public API form-generic ngoài time/json.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-015
        - R-017
        - AC-020
    - id: D-024
      type: decision
      statement: >-
        Cây route và cách hiện page/drawer? → generic/:module/:entity là trang list có router-outlet cho create, :id/detail, :id/update; mọi
        route của sdGenericRoutes() khai data.permission = SD_PERMISSION_PUBLIC để SdPermissionGuard của portal không chặn, guard của module
        generic kiểm mã thật bằng hasPermission(code) với key mặc định; host form tự chọn page hoặc drawer sau khi schema đã resolve; drawer
        gọi open() sau khi render và (sdClosed) điều hướng về route list; page thì list ẩn nội dung khi outlet kích hoạt; trang list phản
        ứng khi :module/:entity đổi vì component được dùng lại; configuration là route anh em
      question: Cây route và cách hiện page/drawer?
      selected_value: >-
        generic/:module/:entity là trang list có router-outlet cho create, :id/detail, :id/update; mọi route của sdGenericRoutes() khai
        data.permission = SD_PERMISSION_PUBLIC để SdPermissionGuard của portal không chặn, guard của module generic kiểm mã thật bằng
        hasPermission(code) với key mặc định; host form tự chọn page hoặc drawer sau khi schema đã resolve; drawer gọi open() sau khi render
        và (sdClosed) điều hướng về route list; page thì list ẩn nội dung khi outlet kích hoạt; trang list phản ứng khi :module/:entity đổi
        vì component được dùng lại; configuration là route anh em
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: >-
        List giữ nguyên trạng thái sd-table vì không bị huỷ khi mở drawer; SdPermissionGuard.canActivateChild từ chối route không có
        data.permission.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-005
        - INV-009
        - R-010
        - AC-011
        - AC-012
    - id: D-025
      type: decision
      statement: >-
        Ai gọi adapter? → SdGenericDataService là nơi duy nhất gọi query/detail/create/update/delete/search, áp hooks beforeSave/afterSave,
        thứ tự search entity → adapter → query và giới hạn 5 request song song cho import; SdGenericSchemaService là nơi duy nhất gọi schema
        và configuration.get/set
      question: Ai gọi adapter?
      selected_value: >-
        SdGenericDataService là nơi duy nhất gọi query/detail/create/update/delete/search, áp hooks beforeSave/afterSave, thứ tự search
        entity → adapter → query và giới hạn 5 request song song cho import; SdGenericSchemaService là nơi duy nhất gọi schema và
        configuration.get/set
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: Mỗi nhóm hàm của adapter có đúng một cổng để hooks, fallback, validate và cache luôn đúng ở mọi màn.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-002
        - INV-008
        - INV-014
        - R-014
        - AC-017
    - id: D-026
      type: decision
      statement: >-
        Nhãn giao diện của module? → Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja, ko, zh) vì chúng có
        kiểu Record<keyof EN_MESSAGES>; hiển thị qua sdTranslate
      question: Nhãn giao diện của module?
      selected_value: >-
        Thêm khoá core.module.generic.* vào i18n sẵn có, đủ mọi file ngôn ngữ (en, vi, ja, ko, zh) vì chúng có kiểu Record<keyof
        EN_MESSAGES>; hiển thị qua sdTranslate
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: Theo quy ước core.<area>.* (vd core.module.layout.*) của thư viện.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-010
        - R-001
    - id: D-027
      type: decision
      statement: >-
        Hình dạng của validateSdGenericSchema? → validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả SdGenericSchemaIssue[]
        { code, severity, path, message }, cùng cách với validateSdApiContract
      question: Hình dạng của validateSdGenericSchema?
      selected_value: >-
        validateSdGenericSchema(stored: unknown, base: SdGenericSchema) trả SdGenericSchemaIssue[] { code, severity, path, message }, cùng
        cách với validateSdApiContract
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: Thống nhất với validator public đã có; stored có thể là JSON bất kỳ đọc từ server/localStorage.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-003
        - R-008
        - AC-008
    - id: D-028
      type: decision
      statement: >-
        Có đưa modules/generic vào barrel modules không? → Có, như auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ
        thuộc và không trùng tên export
      question: Có đưa modules/generic vào barrel modules không?
      selected_value: Có, như auth/layout/permission/keycloak/icon; build v19 kiểm không có vòng phụ thuộc và không trùng tên export
      source: approved-architecture
      status: approved
      blocking: true
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: Giữ quy ước barrel của thư viện; entry gốc @sdcorejs/angular cũng export module.
      supersedes: null
      revisit_condition: null
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-010
        - R-001
        - AC-024
    - id: D-029
      type: decision
      statement: Nguồn quyền theo key riêng cho từng module generic? → Hoãn; module generic gọi hasPermission(code) với key mặc định của portal
      question: Nguồn quyền theo key riêng cho từng module generic?
      selected_value: Hoãn; module generic gọi hasPermission(code) với key mặc định của portal
      source: approved-architecture
      status: deferred
      blocking: false
      scope: module
      owner_repository_id: sdcorejs-angular
      rationale: 'Spec chỉ có permission: boolean; thêm option key là mở rộng public API ngoài phạm vi đã duyệt.'
      supersedes: null
      revisit_condition: Khi một portal cần nguồn quyền SdPermissionService khác nhau (key khác nhau) cho từng module generic.
      convention_impact:
        candidate: false
        category: null
      downstream_refs:
        - INV-005
        - R-011
    - id: INV-001
      type: invariant
      statement: >-
        Mọi màn (list, form, import, màn cấu hình, catalog relation) chỉ lấy adapter và cấu hình entity qua một resolver: scope gần nhất
        thắng, trùng cùng injector thì ném lỗi.
      protected_refs:
        - R-005
        - AC-002
        - AC-003
    - id: INV-002
      type: invariant
      statement: >-
        Schema hiệu lực chỉ được dựng ở SdGenericSchemaService bằng hàm thuần: adapter.schema → entity.schema(base) → cấu hình đã lưu
        (validate rồi merge); chỉ SdGenericSchemaService gọi adapter.schema và configuration.get/set (hoặc localStorage khoá
        sd-generic:configuration:<module>.<entity>).
      protected_refs:
        - R-006
        - R-007
        - AC-001
        - AC-004
        - AC-005
        - AC-006
    - id: INV-003
      type: invariant
      statement: >-
        validateSdGenericSchema là hàm thuần duy nhất kiểm cấu hình; bước load và nút Lưu đều dùng nó; lỗi shape/version thì dùng mặc định,
        tham chiếu treo bị merge bỏ, có lỗi thì không gọi configuration.set.
      protected_refs:
        - R-008
        - AC-007
        - AC-008
        - AC-020
    - id: INV-004
      type: invariant
      statement: >-
        SdGenericSchema v1 chỉ chứa dữ liệu JSON (không function); function (schema, search, display, hooks, action) chỉ nằm ở provider;
        key, dataType, enums[].value, relation.entity luôn lấy từ schema hiện tại.
      protected_refs:
        - R-002
        - R-003
        - AC-006
        - AC-024
    - id: INV-005
      type: invariant
      statement: >-
        Mã quyền chỉ sinh từ một hàm thuần <MODULE>_<ENTITY>_C_GENERIC_<ACTION> viết hoa; guard route, hiển thị action và banner cấu hình
        lỗi đều dùng hàm đó; permission: false bỏ qua cả ba; mọi route của sdGenericRoutes() có data.permission = SD_PERMISSION_PUBLIC để
        guard của portal không chặn, còn guard của module generic kiểm mã thật.
      protected_refs:
        - R-011
        - AC-007
        - AC-010
        - AC-018
    - id: INV-006
      type: invariant
      statement: >-
        Tiêu đề chỉ được parse/render bằng một hàm thuần; kết quả gắn vào DOM bằng nội suy text, không innerHTML; list.title và create.title
        không có placeholder.
      protected_refs:
        - R-009
        - AC-009
    - id: INV-007
      type: invariant
      statement: >-
        Layout form của mỗi action do một hàm thuần dựng: field lấy type/label/options/validation từ general.properties; create bỏ system và
        không insertable; update bỏ system và không updatable; payload update chỉ gồm property updatable.
      protected_refs:
        - R-013
        - AC-015
    - id: INV-008
      type: invariant
      statement: >-
        Chỉ SdGenericDataService gọi các hàm dữ liệu của adapter (query, detail, create, update, delete, search); mọi lần lưu đi qua
        beforeSave/afterSave; search theo thứ tự entity → adapter → query (CONTAIN để tìm, IN để lấy nhãn); giá trị relation được lưu đúng
        kiểu gốc; trang và component không gọi adapter trực tiếp.
      protected_refs:
        - R-004
        - R-013
        - R-014
        - AC-001
        - AC-016
        - AC-017
    - id: INV-009
      type: invariant
      statement: >-
        Kiểu hiển thị chỉ quyết định sau khi schema đã resolve, theo entity.display → adapter.display → 'page'; drawer render trong outlet
        của list, list không bị huỷ, back/đóng đưa về route list.
      protected_refs:
        - R-010
        - AC-011
        - AC-012
    - id: INV-010
      type: invariant
      statement: >-
        Entry point modules/generic export đúng 4 symbol runtime; không dùng HttpClient và không import package riêng của backend; chỉ
        import phần khác của thư viện qua entry point public.
      protected_refs:
        - R-001
        - AC-024
    - id: INV-011
      type: invariant
      statement: >-
        form-generic chỉ thêm member time và json vào union field; type và hành vi hiện có không đổi; form-generic không import
        modules/generic.
      protected_refs:
        - R-018
        - AC-021
    - id: INV-012
      type: invariant
      statement: >-
        Chỉ sửa ở versions/v19 và showcase; v20/v21/v22 chỉ đổi qua npm run sync; check:sync xanh; CHANGELOG có mục Unreleased; guard
        example/registry của Showcase xanh.
      protected_refs:
        - R-019
        - R-020
        - AC-022
        - AC-023
    - id: INV-013
      type: invariant
      statement: >-
        List dùng sd-table server và chuyển PagingReq sang adapter.query; xoá có xác nhận, xoá nhiều gọi delete tuần tự, sau thay đổi thì
        reload; action mở rộng và action có sẵn đi chung một bước lọc quyền/visible/hiddenDefaults.
      protected_refs:
        - R-012
        - R-015
        - AC-013
        - AC-014
        - AC-018
    - id: INV-014
      type: invariant
      statement: >-
        Import lập kế hoạch create/update bằng hàm thuần theo upsertKey, tra bản ghi đã có theo lô, chạy qua SdGenericDataService với tối đa
        5 request song song.
      protected_refs:
        - R-016
        - AC-019
    - id: INV-015
      type: invariant
      statement: Màn cấu hình chỉ ghi qua SdGenericSchemaService.save (validate rồi configuration.set rồi xoá cache); key và dataType không sửa được.
      protected_refs:
        - R-017
        - AC-005
        - AC-020
  history:
    - revision: 1
      active:
        - id: R-001
          type: requirement
        - id: R-002
          type: requirement
        - id: R-003
          type: requirement
        - id: R-004
          type: requirement
        - id: R-005
          type: requirement
        - id: R-006
          type: requirement
        - id: R-007
          type: requirement
        - id: R-008
          type: requirement
        - id: R-009
          type: requirement
        - id: R-010
          type: requirement
        - id: R-011
          type: requirement
        - id: R-012
          type: requirement
        - id: R-013
          type: requirement
        - id: R-014
          type: requirement
        - id: R-015
          type: requirement
        - id: R-016
          type: requirement
        - id: R-017
          type: requirement
        - id: R-018
          type: requirement
        - id: R-019
          type: requirement
        - id: R-020
          type: requirement
        - id: AC-001
          type: acceptance-criterion
        - id: AC-002
          type: acceptance-criterion
        - id: AC-003
          type: acceptance-criterion
        - id: AC-004
          type: acceptance-criterion
        - id: AC-005
          type: acceptance-criterion
        - id: AC-006
          type: acceptance-criterion
        - id: AC-007
          type: acceptance-criterion
        - id: AC-008
          type: acceptance-criterion
        - id: AC-009
          type: acceptance-criterion
        - id: AC-010
          type: acceptance-criterion
        - id: AC-011
          type: acceptance-criterion
        - id: AC-012
          type: acceptance-criterion
        - id: AC-013
          type: acceptance-criterion
        - id: AC-014
          type: acceptance-criterion
        - id: AC-015
          type: acceptance-criterion
        - id: AC-016
          type: acceptance-criterion
        - id: AC-017
          type: acceptance-criterion
        - id: AC-018
          type: acceptance-criterion
        - id: AC-019
          type: acceptance-criterion
        - id: AC-020
          type: acceptance-criterion
        - id: AC-021
          type: acceptance-criterion
        - id: AC-022
          type: acceptance-criterion
        - id: AC-023
          type: acceptance-criterion
        - id: AC-024
          type: acceptance-criterion
        - id: A-001
          type: assumption
        - id: A-002
          type: assumption
        - id: A-003
          type: assumption
        - id: A-004
          type: assumption
        - id: A-005
          type: assumption
        - id: D-001
          type: decision
        - id: D-002
          type: decision
        - id: D-003
          type: decision
        - id: D-004
          type: decision
        - id: D-005
          type: decision
        - id: D-006
          type: decision
        - id: D-007
          type: decision
        - id: D-008
          type: decision
        - id: D-009
          type: decision
        - id: D-010
          type: decision
        - id: D-011
          type: decision
        - id: D-012
          type: decision
        - id: D-013
          type: decision
        - id: D-014
          type: decision
        - id: D-015
          type: decision
        - id: D-016
          type: decision
        - id: D-017
          type: decision
        - id: D-018
          type: decision
      tombstones: []
    - revision: 2
      active:
        - id: R-001
          type: requirement
        - id: R-002
          type: requirement
        - id: R-003
          type: requirement
        - id: R-004
          type: requirement
        - id: R-005
          type: requirement
        - id: R-006
          type: requirement
        - id: R-007
          type: requirement
        - id: R-008
          type: requirement
        - id: R-009
          type: requirement
        - id: R-010
          type: requirement
        - id: R-011
          type: requirement
        - id: R-012
          type: requirement
        - id: R-013
          type: requirement
        - id: R-014
          type: requirement
        - id: R-015
          type: requirement
        - id: R-016
          type: requirement
        - id: R-017
          type: requirement
        - id: R-018
          type: requirement
        - id: R-019
          type: requirement
        - id: R-020
          type: requirement
        - id: AC-001
          type: acceptance-criterion
        - id: AC-002
          type: acceptance-criterion
        - id: AC-003
          type: acceptance-criterion
        - id: AC-004
          type: acceptance-criterion
        - id: AC-005
          type: acceptance-criterion
        - id: AC-006
          type: acceptance-criterion
        - id: AC-007
          type: acceptance-criterion
        - id: AC-008
          type: acceptance-criterion
        - id: AC-009
          type: acceptance-criterion
        - id: AC-010
          type: acceptance-criterion
        - id: AC-011
          type: acceptance-criterion
        - id: AC-012
          type: acceptance-criterion
        - id: AC-013
          type: acceptance-criterion
        - id: AC-014
          type: acceptance-criterion
        - id: AC-015
          type: acceptance-criterion
        - id: AC-016
          type: acceptance-criterion
        - id: AC-017
          type: acceptance-criterion
        - id: AC-018
          type: acceptance-criterion
        - id: AC-019
          type: acceptance-criterion
        - id: AC-020
          type: acceptance-criterion
        - id: AC-021
          type: acceptance-criterion
        - id: AC-022
          type: acceptance-criterion
        - id: AC-023
          type: acceptance-criterion
        - id: AC-024
          type: acceptance-criterion
        - id: A-001
          type: assumption
        - id: A-002
          type: assumption
        - id: A-003
          type: assumption
        - id: A-004
          type: assumption
        - id: A-005
          type: assumption
        - id: D-001
          type: decision
        - id: D-002
          type: decision
        - id: D-003
          type: decision
        - id: D-004
          type: decision
        - id: D-005
          type: decision
        - id: D-006
          type: decision
        - id: D-007
          type: decision
        - id: D-008
          type: decision
        - id: D-009
          type: decision
        - id: D-010
          type: decision
        - id: D-011
          type: decision
        - id: D-012
          type: decision
        - id: D-013
          type: decision
        - id: D-014
          type: decision
        - id: D-015
          type: decision
        - id: D-016
          type: decision
        - id: D-017
          type: decision
        - id: D-018
          type: decision
        - id: D-019
          type: decision
        - id: D-020
          type: decision
        - id: D-021
          type: decision
        - id: D-022
          type: decision
        - id: D-023
          type: decision
        - id: D-024
          type: decision
        - id: D-025
          type: decision
        - id: D-026
          type: decision
        - id: D-027
          type: decision
        - id: D-028
          type: decision
        - id: D-029
          type: decision
        - id: INV-001
          type: invariant
        - id: INV-002
          type: invariant
        - id: INV-003
          type: invariant
        - id: INV-004
          type: invariant
        - id: INV-005
          type: invariant
        - id: INV-006
          type: invariant
        - id: INV-007
          type: invariant
        - id: INV-008
          type: invariant
        - id: INV-009
          type: invariant
        - id: INV-010
          type: invariant
        - id: INV-011
          type: invariant
        - id: INV-012
          type: invariant
        - id: INV-013
          type: invariant
        - id: INV-014
          type: invariant
        - id: INV-015
          type: invariant
      tombstones: []
future_gaps:
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-001.task_refs
    record_id: AC-001
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-002.task_refs
    record_id: AC-002
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-003.task_refs
    record_id: AC-003
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-004.task_refs
    record_id: AC-004
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-005.task_refs
    record_id: AC-005
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-006.task_refs
    record_id: AC-006
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-007.task_refs
    record_id: AC-007
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-008.task_refs
    record_id: AC-008
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-009.task_refs
    record_id: AC-009
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-010.task_refs
    record_id: AC-010
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-011.task_refs
    record_id: AC-011
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-012.task_refs
    record_id: AC-012
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-013.task_refs
    record_id: AC-013
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-014.task_refs
    record_id: AC-014
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-015.task_refs
    record_id: AC-015
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-016.task_refs
    record_id: AC-016
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-017.task_refs
    record_id: AC-017
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-018.task_refs
    record_id: AC-018
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-019.task_refs
    record_id: AC-019
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-020.task_refs
    record_id: AC-020
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-021.task_refs
    record_id: AC-021
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-022.task_refs
    record_id: AC-022
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-023.task_refs
    record_id: AC-023
    message: an acceptance criterion must map to at least one planned task
  - code: AC_PLAN_COVERAGE_MISSING
    path: records.AC-024.task_refs
    record_id: AC-024
    message: an acceptance criterion must map to at least one planned task
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-001.evidence_refs
    record_id: INV-001
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-002.evidence_refs
    record_id: INV-002
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-003.evidence_refs
    record_id: INV-003
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-004.evidence_refs
    record_id: INV-004
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-005.evidence_refs
    record_id: INV-005
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-006.evidence_refs
    record_id: INV-006
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-007.evidence_refs
    record_id: INV-007
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-008.evidence_refs
    record_id: INV-008
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-009.evidence_refs
    record_id: INV-009
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-010.evidence_refs
    record_id: INV-010
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-011.evidence_refs
    record_id: INV-011
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-012.evidence_refs
    record_id: INV-012
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-013.evidence_refs
    record_id: INV-013
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-014.evidence_refs
    record_id: INV-014
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_EVIDENCE_TRACE_MISSING
    path: records.INV-015.evidence_refs
    record_id: INV-015
    message: an invariant must trace to at least one evidence reference
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-001.task_refs
    record_id: INV-001
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-002.task_refs
    record_id: INV-002
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-003.task_refs
    record_id: INV-003
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-004.task_refs
    record_id: INV-004
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-005.task_refs
    record_id: INV-005
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-006.task_refs
    record_id: INV-006
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-007.task_refs
    record_id: INV-007
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-008.task_refs
    record_id: INV-008
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-009.task_refs
    record_id: INV-009
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-010.task_refs
    record_id: INV-010
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-011.task_refs
    record_id: INV-011
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-012.task_refs
    record_id: INV-012
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-013.task_refs
    record_id: INV-013
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-014.task_refs
    record_id: INV-014
    message: an invariant must trace to at least one enforcing task
  - code: INVARIANT_TASK_TRACE_MISSING
    path: records.INV-015.task_refs
    record_id: INV-015
    message: an invariant must trace to at least one enforcing task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-001.task_refs
    record_id: R-001
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-002.task_refs
    record_id: R-002
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-003.task_refs
    record_id: R-003
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-004.task_refs
    record_id: R-004
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-005.task_refs
    record_id: R-005
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-006.task_refs
    record_id: R-006
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-007.task_refs
    record_id: R-007
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-008.task_refs
    record_id: R-008
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-009.task_refs
    record_id: R-009
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-010.task_refs
    record_id: R-010
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-011.task_refs
    record_id: R-011
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-012.task_refs
    record_id: R-012
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-013.task_refs
    record_id: R-013
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-014.task_refs
    record_id: R-014
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-015.task_refs
    record_id: R-015
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-016.task_refs
    record_id: R-016
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-017.task_refs
    record_id: R-017
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-018.task_refs
    record_id: R-018
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-019.task_refs
    record_id: R-019
    message: a requirement must map to at least one planned task
  - code: REQUIREMENT_PLAN_COVERAGE_MISSING
    path: records.R-020.task_refs
    record_id: R-020
    message: a requirement must map to at least one planned task
```
