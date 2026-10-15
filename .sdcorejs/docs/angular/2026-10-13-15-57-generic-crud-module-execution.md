---
artifact_id: execution-generic-crud-module-20261014
artifact_kind: execution-doc
change_ref: generic-crud-module
source_spec: .sdcorejs/specs/angular/2026-10-13-09-59-generic-crud-module.md
source_architecture: .sdcorejs/architecture/angular/2026-10-13-10-42-generic-crud-module.md
source_plan: .sdcorejs/plans/angular/2026-10-13-15-57-generic-crud-module.md
commit_policy: with-change
owner: sdcorejs-angular
track: angular
created_at: 2026-10-14T03:30:00.000Z
redaction_applied: false
---

# Change Execution Record - Module generic CRUD theo schema (`@sdcorejs/angular/modules/generic`)

## Requested Outcome

Dựng module Generic trong `@sdcorejs/angular`, lấy cảm hứng từ module Generic của `lib-core-commerce` (nhánh `development`). Module tự sinh màn list / detail / create / update / import / configuration từ một `SdGenericSchema` cho mỗi entity. Backend cắm vào qua adapter DI theo `module` (tms, wms…), không phụ thuộc HttpClient. Form dùng lại `form-generic`, và `form-generic` có thêm field `time` và `json`. Toàn bộ phạm vi làm trong một lượt (lựa chọn 3 của người dùng). Không commit, push, tag hay publish.

## Material Changes

Path lib dưới `versions/v19/projects/sdcorejs-angular/` trừ khi ghi khác.

- i18n `i18n/src/{en,vi,ja,ko,zh}.ts`: thêm 66 khoá (`core.module.generic.*`, `core.component.form-builder.preset.time|json`, `core.component.form-generic.json.invalid`).
- form-generic (`components/form-generic/`):
  - Model `SdFormGenericTime` (`'time'`, giá trị `HH:mm`) và `SdFormGenericJson` (`'json'`, giá trị đã parse), thêm vào `SD_FORM_GENERIC_FIELD_TYPES`.
  - Rule hiển thị và validate (`sdIsTimeValue`, `sdParseJsonText`).
  - Item renderer mới `time/` (`sd-time`) và `json/` (`sd-code-editor` language json, FormControl text riêng, lỗi `json`/`required`).
  - `item.component.{ts,html}` và `components/index.ts` đăng ký hai item mới.
  - Builder: palette (time thuộc nhóm datetime, json thuộc nhóm advanced), preview, inspector (min/max cho time).
  - Spec mới `form-render.time-json.spec.ts`, `builder-palette.spec.ts`; thêm case vào spec display/validation; cập nhật `sd-form-generic.md`.
- Entry point mới `modules/generic/` (72 file, 22 spec):
  - `index.ts`, `ng-package.json`, `sd-generic.md`, `src/public-api.spec.ts`.
  - `src/models`: schema, property, adapter, entity config, issue.
  - `src/core`: hàm thuần (quyền, tiêu đề, mặc định, merge, validate, form, cột, search, import), mỗi file có spec.
  - `src/registry`: token đa provider, `SdGenericScope` theo injector gần nhất, `provideSdGeneric`, `provideSdGenericEntity`.
  - `src/services`: kho configuration localStorage, `SdGenericSchemaService` (3 lớp, cache, fallback khi configuration lỗi), `SdGenericDataService` (caller duy nhất của adapter), `SdGenericPermissionService`, catalog relation, `SdGenericImportService`.
  - `src/routes`: `sdGenericRoutes()`, guard quyền, resolver schema.
  - `src/pages`: list (`sd-table`), host form (page hoặc `sd-side-drawer`), configuration (4 tab).
  - `src/components`: hộp thoại import, tab configuration chung / danh sách / form / import.
- `modules/index.ts`: barrel export `@sdcorejs/angular/modules/generic`.
- Showcase:
  - `showcase/src/app/pages/modules/generic/`: adapter mock (`product` 12 property hiển thị dạng page, `supplier` 3 property hiển thị dạng side drawer), component demo 2 section, spec.
  - `showcase/src/app/app.routes.ts` (+spec): route `demo` dùng `provideSdGeneric({ adapters: [GenericDemoMockAdapter], permission: false })` và `sdGenericRoutes()`.
  - `documentation.registry.ts` (+spec): trang `generic-crud` thuộc nhóm modules-integrations, `demoSectionCount` 2.
  - Sinh lại `example-{sources,manifest}.generated.ts` (407 entry).
- `scripts/generate-showcase-route-shells.test.mjs`: số doc page 105 lên 106, nhóm modules-integrations 10 lên 11, thêm assert trang `generic-crud`.
- `CHANGELOG.md` `[Unreleased]`: Added (module Generic, field time/json) và Changed (khoá i18n cho catalog tự định nghĩa, switch đủ type).
- Rollout `npm run sync` sang v20/v21/v22: cùng 21 file sửa và 5 path mới mỗi line, cộng `SYNC-STATUS.md` (chỉ đổi `Updated At`). File v22 chuyển về LF theo `versions/v22/.gitattributes`.

## Deviations From The Approved Plan

- TASK-013 (file trang configuration) được tạo trước TASK-012. `sdGenericRoutes()` import trang configuration, nên spec route của TASK-010/011 cần file đó để compile.
- Phạm vi bổ sung, người dùng duyệt ngày 2026-10-14:
  - `components/form-generic/src/components/form-render/components/item/item.component.ts`: plan chỉ liệt kê file `.html`, nhưng component standalone phải thêm hai item mới vào `imports` thì template mới compile.
  - `scripts/generate-showcase-route-shells.test.mjs`: `test:scripts` đỏ vì đếm được 106 doc page; chỉ cập nhật hằng số và thêm một assert.
  - `interceptors/unauthorized/unauthorized.interceptor{,.spec}.ts` (A6): người dùng duyệt ngày 2026-10-14, chỉ đổi đường dẫn import.
- Sửa lỗi phát hiện khi kiểm Showcase: `SdGenericPermissionService` inject `SdPermissionService` ngay khi khởi tạo. Khi consumer tắt kiểm quyền (`permission: false`) và không cấu hình `sd-permission.configuration`, app lỗi `NullInjectorError`. Đã đổi sang lấy `SdPermissionService` lười qua `Injector`, kèm spec hồi quy "does not need a permission configuration when checks are off".
- Comment trong code được viết lại để không nhắc chữ `HttpClient`, vì lệnh quét AC-024 tìm chuỗi đó trong file không phải spec.
- `eslint --fix` định dạng lại file mới theo prettier. Spec trang list thay kiểu `Function` bằng alias `Callable`. Ba file demo Showcase được prettier định dạng, sau đó sinh lại example.

## Review And Repair

Finish gate (người dùng chọn 2026-10-14): test Standard, bỏ qua user-guide và technical-doc mới, simplify chỉ phân tích, review kèm repair.

Bốn reviewer read-only chạy song song: code, kiến trúc + API consistency, security/performance/a11y, simplify. Sau khi gộp các finding trùng: 2 BLOCKER, 13 REQUIRED, khoảng 30 ADVISORY.

Đã sửa:

- C1 (BLOCKER, AC-019): `sd-import-excel` bỏ qua giá trị trả về của `accept`. Hộp thoại import giờ gọi `setValidation`, bắt lỗi `run()` và báo bằng `notify.error`.
- C2 (BLOCKER, AC-020): thêm issue `upsert-key-not-imported`. Lựa chọn upsert key ở tab Import chỉ còn các cột import đơn trị. Spec AC-020 viết lại đúng kịch bản: bỏ cột upsert thì bị chặn, sửa label thì lưu được.
- C5/S1: validator báo `shape` cho list không phải mảng, kiểu sai của member property (`enums`, `relation`, `validation`, cờ boolean, `format`) và `list.pageSize` không nguyên dương; validator không còn ném lỗi. `SdGenericSchemaService` bọc merge trong try/catch và fallback về cấu hình mặc định.
- C3/P1: lookup khi import chạy theo lô 100 giá trị, tối đa 5 lô cùng lúc, đọc tiếp trang tới khi đủ `total`. Một ô hoặc upsert key khớp nhiều bản ghi thì báo `match-ambiguous`.
- C4/S8: Save của update bị khoá khi record chưa tải được (`canSave`). `defaultValue` chỉ áp dụng cho form create.
- S2: guard từ chối `:module`/`:entity` ngoài `[A-Za-z0-9_-]` (cho phép dấu chấm đơn giữa các phần), kể cả khi `permission: false`.
- S3/A2: nội dung lỗi gửi vào `sd-import-excel` (vốn render bằng `[innerHTML]`) được escape HTML. Thông điệp được tách theo mã lỗi (C13), thêm 3 khoá i18n.
- X1: nút di chuyển cột có tooltip/tên đọc được ("Move {label} up/down", 2 khoá i18n).
- X2: field JSON có `role="group"` với `aria-labelledby`, `aria-describedby`, `aria-required`, `aria-invalid`.
- X3: bộ chuyển detail/create/update đổi sang `sd-segmented` (radiogroup có trạng thái chọn).
- A1: hai mục breaking trong CHANGELOG chuyển sang `### Changed (BREAKING for consumers)`, kèm migration diff.
- A3: `SdGenericImportService` chuyển từ provider của route sang provider của `GenericImportDialog`, đúng plan.

Quyết định chính sách. Người dùng từ chối form hỏi rồi nhắn "tiếp tục", nên áp dụng lựa chọn khuyến nghị:

- C6: issue do backend thay đổi (`title-placeholder-unknown`, `layout-type-mismatch`, `create-not-insertable`, `update-not-updatable`) được bỏ qua khi load nhưng vẫn chặn khi Save.
- C15: guard đóng route create/detail/update khi action nằm trong `hiddenDefaults`.
- S4: cấu hình đã lưu chỉ được thu hẹp `insertable`/`updatable`, không mở lại được.
- API naming (người dùng chốt 2026-10-14):
  - Quy ước: `Configuration` là thứ consumer cấu hình cho module/service/component.
  - `SdGenericOptions` đổi thành `SdGenericConfiguration`, `SdGenericEntityConfig` đổi thành `SdGenericEntityConfiguration`. Tham số của `provideSdGeneric` và `provideSdGenericEntity` đặt tên `configuration`, cùng mẫu với `provideSdApiConfiguration(configuration)` và `provideSdApiContract(configuration: SdApiContractConfiguration)`.
  - Token nội bộ `SD_GENERIC_PERMISSION_OPTIONS` đổi thành `SD_GENERIC_PERMISSION_OPTION`, vì `Option` luôn để số ít.
  - Người dùng yêu cầu đổi property `configuration` của adapter. Spec gốc ghi `configuration: { get, set }`; đây là sai khác có duyệt so với spec.
    - Property thành `schemaStore`, type `SdGenericConfigurationStore` thành `SdGenericSchemaStore`. Lý do: nó lưu `SdGenericSchema` đã tuỳ biến, và "Configuration" dành cho thứ consumer cấu hình.
    - Giữ nguyên route `/configuration`, mã quyền `..._C_GENERIC_CONFIGURATION`, màn "Cấu hình" và storage key `sd-generic:configuration:<module>.<entity>`.

ADVISORY rẻ đã làm:

- C7: tra relation giữ kiểu id gốc.
- C8: không thêm trùng cột mới.
- C10: `close()` điều hướng tương đối và mở lại nếu điều hướng bị huỷ.
- C11: field JSON bắt buộc báo lỗi khi submit dù chưa sửa.
- C12/S6: chỉ dùng chung lượt tải quyền đang chạy, để `reset()` khi sign-out có hiệu lực.
- C16: lỗi `localStorage` được coi là chưa có cấu hình.
- C4-arch: resolver dùng khoá `error.adapter-missing`.
- C5-arch: `sd-generic.md` thêm mục Anti-patterns.
- Q3/Q5: xoá code chết.
- Q18: đếm cột hiển thị một lần.

## Decisions And Invariants

- Theo spec và architecture đã duyệt: adapter theo `module`, `configuration: { get(entity), set(entity, schema) }`, `null` nghĩa là dùng mặc định, configuration khác `null` phải qua `validateSdGenericSchema`, route `generic/:module/:entity[/create|/:id/detail|/:id/update|/configuration]`, mã quyền `<MODULE>_<ENTITY>_C_GENERIC_<ACTION>`, `display` quyết định page hay side drawer, nhiều lần provide (root và module lazy), tuỳ biến entity qua `provideSdGenericEntity`, hook `beforeSave`/`afterSave`, `adapter.search` tuỳ chọn, tiêu đề nằm trong từng section và được validate.
- INV: module không gọi HTTP trực tiếp. Lệnh quét AC-024 pass.
- INV: chỉ `SdGenericDataService` gọi method dữ liệu của adapter.
- INV: tiêu đề render bằng interpolation text, không render HTML.
- INV: trùng module hoặc entity trong cùng một injector thì báo lỗi ngay khi injector được tạo.

## Verification Evidence

Node `22.22.3` qua `fnm exec` cho mọi install, build và test.

- RED trước GREEN cho TASK-002, 006, 008 và 010: compile lỗi vì symbol hoặc module chưa tồn tại (`sdIsTimeValue`/`sdParseJsonText`, 9 module core, registry/service, route).
- Trước review: generic + form-generic 465/465 (seed 773826), showcase 16/16, `test:scripts` 236/236, build cả bốn line exit 0.
- Sau repair: lượt đầu 486/487. Test mới của hộp thoại import giả định tiếng Anh, trong khi ngôn ngữ mặc định là `vi`; assertion đã sửa để không phụ thuộc ngôn ngữ. Lượt sau 487/487 (seed 500212).

Lần chạy cuối, trên diff cuối (sau khi đổi tên và xử lý advisory):

- EVIDENCE-001: `check:i18n` OK; `check:i18n-parity` OK (1169 khoá × 5 ngôn ngữ).
- EVIDENCE-002/003 + 005..015: `ng test sdcorejs-angular` với include form-generic và modules/generic: 495/495 (seed 539859).
- `npm --prefix versions/v19 run lint` (toàn bộ dự án, gate của CI): "All files pass linting."
- EVIDENCE-016: quét import backend trong `modules/generic`: OK.
- EVIDENCE-017: `npm --prefix versions/v19 run build`: exit 0.
- EVIDENCE-019: Showcase 16/16, hai lần liên tiếp với cache lạnh (xoá `showcase/.angular/cache` trước mỗi lần), trên lib đã build lại.
  - Trước đó, lượt chạy đầu tiên với cache lạnh hay timeout 5 s ở "opens create and detail forms". Bước chậm nhất đo được 5,35 s, nên test chậm chứ không treo. Test loader Layout, không liên quan code mới, cũng từng bị như vậy.
  - Hai test live-screen trong `generic-demo.component.spec.ts` đã được đặt timeout 20 s (`LAZY_SCREEN_TIMEOUT`), không bỏ bớt assertion nào. CI (`ci.yml`) không chạy showcase spec.
- EVIDENCE-020: `generate:showcase-examples` (407 entry); `test:showcase-examples` 17/17.
- EVIDENCE-004/018/021: `test:collect-docs` 22/22.
- EVIDENCE-022: `npm run sync`, chuyển 1181 file v22 về LF, rồi `npm run check:sync`: "v20, v21, v22 match v19".
- `npm ci` cho v20/v21 (`--legacy-peer-deps`) và v22 (clean): exit 0.
- EVIDENCE-023: build v20, v21, v22 đều exit 0, `modules/generic` build trên cả ba line. v22 có 5 cảnh báo NG8113 ở các component có sẵn (import-excel, query-bar, table, upload-file, select), không liên quan code mới.
- `npm run test:scripts` (root): 236/236.
- ESLint trên mọi file ts/html đã đổi trong v19: 0 lỗi. Các file demo Showcase sạch theo prettier.
- Phạm vi: ngoài `allowed_paths` chỉ còn hai path đã được duyệt bổ sung, tính cả bản sync sang v20–v22.

## UI Check

Kiểm trên trình duyệt trong app: Showcase `ng serve` ở cổng 4300, chạy trên lib v19 đã build lại. Kết quả đọc từ DOM.

- `/demo/generic/showcase/product`: list hiện bản ghi `PRD-001`.
- Configuration, tab Danh sách: nút di chuyển có tên đọc được ("Chuyển Id lên", "Chuyển Id xuống"…).
- Tab Form: bộ chuyển là `radiogroup` tên "Form", ba `radio` có `aria-checked` đúng; chọn "Tạo mới" thì trạng thái đổi theo.
- Tab Nhập Excel: bỏ cột `code` (đang là upsert key) rồi Lưu thì bị chặn, hiện "import.upsertKey: The upsert key "code" is not one of the import columns.", không có gì được ghi vào localStorage (AC-020).
- `/product/999/update` (record không tồn tại): nút Lưu bị khoá. `/product/1/update`: nút Lưu mở, tiêu đề "Cập nhật Product", field JSON `Specs` có `role="group"` gắn nhãn.
- `/supplier/create` mở side drawer trên list. Bấm Hủy thì quay về `/demo/generic/showcase/supplier`, drawer đóng, list vẫn giữ.
- `/demo/generic/showcase/..%2Fadmin`: guard chặn, không mở màn generic nào.
- Console: chỉ có lỗi 404 `docs/versions.json`, có từ trước (dev server không có published docs).

## Advisory Follow-up

Người dùng yêu cầu xử lý các advisory ngày 2026-10-14, trước khi commit. Mọi thay đổi nằm trong `allowed_paths`; không tạo file mới.

- C9: route có thể được dùng lại cho record hoặc entity khác. Form host và trang configuration giờ đọc lại route sau mỗi `NavigationEnd`; khi id hoặc dữ liệu entity đổi thì reset state và tải lại. Kết quả load trễ của record cũ bị bỏ qua.
- C14: xoá display template hoặc search fields giờ lưu giá trị rỗng (`''` / `[]`), nên merge giữ được thao tác xoá; giá trị rỗng nghĩa là dùng mặc định.
- S4 (UI): tab General khoá checkbox insertable/updatable của property mà schema mặc định đặt `false`. Trang configuration truyền `base` xuống tab.
- P3: layout tự sinh ở tab Form dùng so sánh theo nội dung, nên sửa ở tab khác không làm sd-form-builder nạp lại.
- P4: bộ đệm `option string -> giá trị gốc` của relation giữ tối đa 500 mục, mục cũ nhất bị bỏ trước.
- P5:
  - Form dạng page chỉ ẩn list (`display: none`), không huỷ. sd-table giữ filter, sort và trang.
  - Field JSON chỉ parse một lần cho mỗi nội dung text.
- X4: mỗi dòng property/cột là `role="group"` có `aria-label`. Di chuyển cột thì `LiveAnnouncer` báo vị trí mới, với khoá i18n mới `core.module.generic.configuration.moved` × 5 ngôn ngữ.
- X5:
  - Đóng form thì focus về tiêu đề list.
  - Form dạng page focus vào tiêu đề của nó; các tiêu đề có `tabindex="-1"`, vòng focus chỉ hiện khi dùng bàn phím.
  - Vùng form có `aria-busy` khi đang tải.
- A4: `SdGenericListHost` và `SD_GENERIC_LIST_HOST` chuyển vào `registry/generic-registry.ts`. Form báo display mode qua `setFormDisplay` thay vì list đoán kiểu (duck typing).
- C1-arch: `provideSdGeneric`, `provideSdGenericEntity`, `sdGenericRoutes` và `validateSdGenericSchema` khai báo bằng `export function`.
- A6: lỗi có từ trước, nằm ngoài plan; người dùng duyệt ngày 2026-10-14. `interceptors/unauthorized` (cả `.ts` lẫn `.spec.ts`) giờ import `SdAuthService` từ `@sdcorejs/angular/modules/auth` thay vì barrel `@sdcorejs/angular/modules`.
  - Đo bằng esbuild 0.28 (minify, ESM) trên dist v19: import `SdAuthService` qua barrel ra 545.513 bytes, import thẳng `modules/auth` ra 541.674 bytes. Phần chênh chỉ là stub re-export của rxjs; không có code generic/table/form-generic. Lý do: `package.json` khai `sideEffects` chỉ cho CSS, code-editor và ckeditor-styles.
  - Vậy tree shaking ở production vẫn đúng. Sửa này giảm phụ thuộc giữa các entry point (thứ tự build của ng-packagr, nguy cơ vòng phụ thuộc) và giảm lượng code mà dev server và Karma phải nạp.
  - Verify sau khi sửa: ESLint sạch; spec `interceptors/**` 40/40; build v19–v22 exit 0; `check:sync` pass; `npm --prefix versions/v19 run lint` pass.

Test mới:
- form host được dùng lại cho record khác;
- trang configuration được dùng lại cho entity khác;
- checkbox bị khoá;
- `role="group"` và thông báo khi di chuyển cột;
- radiogroup của tab Form;
- giữ nguyên object layout;
- merge giữ giá trị rỗng;
- giới hạn 500 của bộ đệm;
- AC-012 kiểm list bị ẩn chứ không bị huỷ, và focus quay về tiêu đề.

Do list luôn được giữ, hai test lấy `h1` được đổi locator sang `sd-generic-form-host h1`: form host spec và showcase demo spec.

## UI Check (advisory)

Kiểm lại trên Showcase `ng serve` sau khi xử lý advisory:
- `/product/1/detail` (dạng page): list ẩn (`display: none`) nhưng sd-table vẫn mounted; focus ở tiêu đề "Product PRD-001"; form không còn `aria-busy` sau khi tải xong.
- Bấm Quay lại: list hiện lại với 40 dòng, focus về tiêu đề "Product".
- `/product/configuration`: property `code` (adapter đặt `updatable: false`) có checkbox updatable bị khoá. Dòng có `role="group"` và `aria-label="Code"`.

## UI Feedback Round (2026-10-14, after the 7 commits)

Người dùng góp ý sau khi xem Showcase. Các thay đổi đã làm:

- Form builder, card "Thiết lập trang":
  - các field giãn hết chiều rộng card (`.ins-card--form`);
  - tiêu đề dùng cùng hàng tiêu đề với card Biến / Xác thực;
  - icon trang chọn từ preset giống group, bấm lại icon đang chọn thì bỏ chọn (`pickPageIcon`);
  - nhãn vi "Xác thực cấp form" đổi thành "Xác thực của biểu mẫu" (cả trên toolbar).
- List của generic:
  - external filter có `defaultShowing: true`, table đặt `hideExternalFilterToolbar: true`;
  - cột hiển thị đầu tiên không phải `system` thành hyperlink: mở detail, hoặc update nếu chỉ có quyền UPDATE;
  - bỏ command Xem / Sửa / Xoá trên từng dòng. Nút Sửa đã có trong màn chi tiết (theo quyền), Xoá dùng selector cho cả một dòng.
- Dùng `sd-page` (`@sdcorejs/angular/modules/layout`) cho list, form dạng page và màn configuration. Không có vòng phụ thuộc: `modules/layout` không import barrel `modules`.
- Màn configuration làm lại:
  - mỗi tab chia thành các `sd-section` (Thực thể / Thuộc tính, Hiển thị / Cột, Bố cục biểu mẫu, Cập nhật bản ghi đã có / Cột nhập);
  - mỗi property/cột là một dòng lưới với cột cố định, thay cho một card riêng;
  - style dùng chung nằm ở file mới `components/generic-configuration.scss`;
  - thêm 9 khoá i18n;
  - nhãn vi "Cho phép sắp xếp" / "Cho phép lọc" rút gọn thành "Sắp xếp" / "Lọc".
- Lỗi phát hiện khi kiểm UI: màn chi tiết hiện "--" cho Code / Name. Nguyên nhân là lỗi có sẵn của Core `sd-input`: `displayValue` là `computed` đọc `formControl.value` vốn không phải signal, nên ở chế độ xem không cập nhật khi giá trị đến sau. Trong module, form detail/update chỉ render khi record đã tải xong. Lỗi gốc của `sd-input` được tách thành task riêng, và đã sửa ngày 2026-10-14: `displayValue` giờ phụ thuộc `#state` và `valueModel`, có regression spec trong `input.component.spec.ts`. Vẫn giữ việc chỉ render khi record đã tải xong, để mọi field bắt đầu từ giá trị đã tải.
- Spec:
  - AC-014 giờ xoá một dòng qua selector;
  - thêm test hyperlink, fallback sang update, `defaultShowing`, preset icon trang;
  - test cũ gõ icon trang được thay bằng test preset.
- Sai khác so với spec gốc: AC-014 ("xoá 1 dòng" qua command) đổi sang xoá qua selector, theo yêu cầu của người dùng. Path ngoài plan, đều phát sinh từ góp ý của người dùng: file mới `modules/generic/src/components/generic-configuration.scss`, cùng `inspector.component.scss` và `form-builder-release-review.spec.ts` của form-generic.
- Verify:
  - suite lib 498/498;
  - lint toàn bộ v19 sạch;
  - `check:i18n` OK, parity 1178 key × 5 ngôn ngữ;
  - quét import backend sạch;
  - showcase 16/16, chạy hai lần;
  - `test:showcase-examples` 17/17;
  - `npm run sync` rồi `check:sync` OK;
  - build v19–v22 OK; năm warning NG8113 của v22 nằm ở file không bị sửa (select, table, query-bar, upload-file, import-excel);
  - `test:scripts` 236/236;
  - kiểm UI bằng Playwright 1440×900 (list, chi tiết, configuration bốn tab, inspector).

## Known Gaps

- Chưa chạy full suite v19 với `--code-coverage`; đây là gate release, workflow publish chạy. Chưa chạy spec trên v20–v22, mới build.
- S5 và S7 chỉ ghi vào tài liệu (Anti-patterns): backend phải kiểm quyền lại, adapter phải ném thông điệp an toàn cho người dùng.
- Simplify Q1–Q17 chỉ phân tích, theo lựa chọn ở finish gate. Đã làm Q3, Q5, Q18 khi repair.
- Test loader Layout (`documentation.registry.spec.ts`) vẫn dùng timeout mặc định 5 s. Test này có sẵn từ trước, và có thể timeout ở lượt đầu khi cache lạnh.
