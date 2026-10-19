# Architecture r2 — Sidebar V4, Context Switcher và preset graphite - 2026-10-19

Revision 2 của architecture `architecture-sidebar-v4-context-switcher-graphite-v1-r1` (hash `sha256:v1:f3a285ca…96d5`). Không đổi requirement, acceptance criterion hay quyết định kiến trúc nào của r1.

## Lý do sửa

Khi lập plan, kiểm tra theo luật convergence của gate ship thấy 5 dòng validation (R, AC) chưa có invariant nào bảo vệ: (R-002, AC-009), (R-002, AC-010), (R-004, AC-012), (R-006, AC-014), (R-012, AC-022). Gate cần ít nhất một `INV-*` trên mỗi dòng. Revision này chỉ thêm:

- 4 invariant mới (bảng dưới), mỗi cái có một validation obligation;
- trường `validation_boundary` (`kind: none`, nguồn là mọi R, AC và INV) trên D-013 (cách viết test). Mọi dòng validation của plan sẽ trỏ boundary về quyết định này; không có ranh giới phân quyền nào.

Decision coverage lên revision 3. Không có record nào bị xoá.

## Invariants thêm ở revision 2

| ID | Invariant | Bảo vệ | Kiểm bằng |
| --- | --- | --- | --- |
| INV-011 | Mobile V4 chỉ render qua cây V4 nội bộ ở mode mobile và config V4 đã normalize. Mọi cách đóng drawer đều xoá query và trả focus về trigger. Bottom bar có tối đa 4 đích lấy từ `mobile.bottomBar`, cộng More. | R-002, AC-009, AC-010 | VAL-011 |
| INV-012 | Default của V4 chỉ được resolve ở `normalizeSidebarConfiguration` (pill, compact, flyout, `bottomBar` tối đa 4 id không trùng, không rỗng). Component V4 chỉ đọc giá trị đã normalize; `sd-layout` chỉ chọn V4 khi `version: 4`. | R-004, AC-012 | VAL-012 |
| INV-013 | Switcher render row từ `items` của configuration, row active lấy theo id `current` của `SdLayoutContextService`. Không có `items` thì không render gì; 1 mục thì không mở được; search chỉ hiện khi hơn 7 mục, trừ khi `searchable` ép khác. | R-006, AC-014 | VAL-013 |
| INV-014 | Docs theme và layout chỉ mô tả hành vi đã ship: chín preset có tên kèm giá trị `graphite` và giới hạn link/text-button; config V4, field menu mới, API context và luật bootstrap. Một assertion script kiểm các nội dung này. | R-012, AC-022 | VAL-014 |

## Nội dung r1 (giữ nguyên)

Kiến trúc gọn cho spec `spec-sidebar-v4-context-switcher-graphite-v1-r1` (hash `sha256:v1:fb1ff4a6…a131`, revision `5f692cd3`). Chỉ ghi những quyết định mà các phần việc độc lập có thể hiểu khác nhau. Thứ tự file và task thuộc về plan.

### Trigger và owner

- Gate bắt buộc. Signal: `public-api-contract`, `state-data-ownership`, `persisted-data-model-contract`.
- Owner và integration owner: `sdcorejs-angular` (repo library, không có portal). Module chính: `modules/layout`. Phần theme thuộc `assets/scss/themes`, có một bổ sung nhỏ ở `services/storage`.
- Mọi thay đổi vào v19 trước rồi `npm run sync`.

### Ranh giới và hướng phụ thuộc

- **B-001:** `SdLayoutContextService` là owner duy nhất của context hiện tại và snapshot đã lưu. Sidebar, switcher và consumer chỉ đi qua method và signal public của nó.
- **B-002:** cây menu V4 là phần riêng của V4 desktop và mobile. Cây dùng chung `shared/menu-tree` vẫn phục vụ V2, V3 và mobile V1–V3 như cũ.
- **B-003:** preset chỉ chạm tới component token qua map `components` đã được kiểm. Style của component chỉ đọc token, không rẽ nhánh theo preset.
- **B-004:** các tác động lên trình duyệt (reload, sự kiện `storage`, marker trong sessionStorage) chỉ đi qua token `SD_LAYOUT_CONTEXT_RUNTIME`.

| Từ | Đến | Trạng thái |
| --- | --- | --- |
| `sd-sidebar-v1..v4`, `sd-sidebar-mobile-v1..v4` | `sd-layout-context-switcher` | **mới**: chỉ gắn khi có `context` |
| `sd-layout-context-switcher` | `SdLayoutContextService` | **mới**: chuyển `items` vào `syncItems`; đọc `current`, `switching`, `error`, `changedElsewhere`; gọi `setCurrentContext` |
| `SdLayoutContextService` ↔ `SdLayoutService` | — | **cấm** cả hai chiều; `SdLayoutService` giữ nguyên |
| `SdLayoutContextService` | `SdLayoutStorageService` | **mới**: handle `currentContext`, `refreshCurrentContext()`, namespace đã resolve |
| `SdLayoutStorageService` | `SdStorage.refresh()` (`@sdcorejs/angular/services`) | **mới**: API bổ sung |
| `SdLayoutContextService` | `SD_LAYOUT_CONTEXT_RUNTIME` | **mới**: reload, sự kiện `storage`, marker phiên |
| `sd-sidebar-v4`, `sd-sidebar-mobile-v4` | `components/sidebar-v4/menu-tree` | **mới**, nội bộ; không import `shared/menu-tree` |
| `assets/scss/themes/default.scss` | `components` của `_presets.scss` → hàm kiểm và `emit` của `_component-tokens.scss` | **mới** |

### Quyết định kiến trúc

- **D-019 — đọc lại snapshot từ storage.**
  - Các handle cùng key dùng chung một entry trong bộ nhớ. `set()` cập nhật bộ nhớ trước, và bỏ qua việc ghi xuống storage có thành công hay không.
  - `destroy()` rồi tạo lại handle không đọc lại storage, nếu còn handle khác đang sống. Showcase đã có `SdLayoutStorageService` cấp ở mức component.
  - Giải pháp: thêm `refresh()` vào `SdStorage` và `SdStorageWithDefault`. Hàm này hydrate lại entry dùng chung từ storage, chỉ broadcast khi giá trị đổi, rồi trả giá trị.
  - `SdLayoutStorageService` thêm `refreshCurrentContext()` dựa trên `refresh()`.
- **D-020 — sự kiện `storage` nào sinh thông báo.** Mỗi sự kiện `storage` của localStorage → `refreshCurrentContext()`:
  - namespace giống lần chụp trước: chỉ báo khi có snapshot và id khác `current().id`;
  - namespace đã đổi (đăng nhập/đăng xuất trong SPA): chụp lại, không báo;
  - snapshot bị xoá: không báo.
- **D-021 — ai kích hoạt việc đối chiếu.**
  - `sd-layout-context-switcher` chuyển `configuration.items` vào `syncItems` trong một effect untracked.
  - `SdLayoutService` không đổi, và không phụ thuộc service context.
  - Listener `storage` được đăng ký ở lần `syncItems` đầu tiên. Nhờ vậy app không cấu hình `context` không tạo service lẫn listener, và sidebar dùng ngoài `sd-layout` vẫn chạy được.
- **D-022 — reload, sự kiện window và marker phiên.**
  - Đi qua token public `SD_LAYOUT_CONTEXT_RUNTIME` (interface `SdLayoutContextRuntime`): `reload()`, đăng ký sự kiện `storage`, đọc/ghi marker phiên.
  - Factory mặc định dùng `DOCUMENT.defaultView`; không có window thì mọi thao tác là no-op.
  - Spec và Showcase cấp bản giả. Tiền lệ: `SD_VIEWPORT`.
- **D-023 — chỗ đặt cây V4.** `components/sidebar-v4/menu-tree`. Chỉ `sd-sidebar-v4` và `sd-sidebar-mobile-v4` được import; không export public.
- **D-024 — định danh storage của snapshot.**
  - Handle mới `currentContext` trong `SdLayoutStorageService`, key là một UUID cố định, cùng option `namespace` với các handle khác, nằm trong `clear()`.
  - Service còn cho biết namespace đã resolve, để service context nhận ra khi đổi partition.
- **D-025 — thuật toán đối chiếu (`syncItems`).**
  1. `refreshCurrentContext()` trong namespace tại lúc gọi.
  2. Đích = snapshot đó nếu id có trong `items`; ngược lại là `items[0]`. `items` rỗng thì dừng, switcher ẩn.
  3. Chỉ ghi khi id, title, subtitle hoặc avatar khác nhau; ghi xong thì `refresh()` để xác nhận.
  4. Chỉ cần reload khi id đích khác id của snapshot lúc load.
  5. Chỉ được reload khi marker phiên chưa giữ id đích. Đặt marker ngay trước khi reload; xoá marker khi không cần reload.
  6. Ghi không xác nhận được, hoặc reload bị marker chặn: giữ đích trong bộ nhớ và ghi `console.warn` ở chế độ dev.

  Lý do: namespace theo user mà resolve sau `getCurrentContext()` sẽ làm mọi lần load đều reload. Marker giới hạn tình huống này còn một reload mỗi phiên tab; cảnh báo giúp phát hiện cấu hình sai.
- **D-026 — chuyển không xác nhận được.** `setCurrentContext` tắt `switching`, switcher hiện lỗi inline (thêm một khoá i18n), không reload.
- **D-027 — mobile.**
  - Mobile V1, V3, V4: trigger ở header drawer.
  - Mobile V2 không có drawer: trigger là dòng đầu của sheet menu.
  - Sheet chọn context mở bằng CDK overlay phía trên drawer/sheet, có focus trap riêng. Esc chỉ đóng sheet context, rồi trả focus về trigger.
- **D-028 — màu của switcher ở V1–V4.** Chỉ dùng token theme: `--sd-primary`, `--sd-primary-light`, `--sd-text`, `--sd-text-secondary`, `--sd-border`, surface, và hover bằng `color-mix`. Bỏ qua `brandColor` của V1.
- **D-029 — dạng override của preset.**
  - Giá trị trong `components` là giá trị đơn (preset chỉ có light), được merge vào map token trước khi emit. Nếu để dạng cặp `(light, dark)`, `list.nth` sẽ cắt mất box-shadow có dấu phẩy.
  - Một hàm kiểm trong `_component-tokens.scss` từ chối key lạ, và mixin dùng chính hàm này.
  - `$presets` không cấu hình được từ ngoài, nên AC-021 (key lạ) được chứng minh bằng cách compile `component-tokens.emit` với cùng hàm kiểm.
- **D-030 — demo Showcase.** Trang layout cấp `SdLayoutContextService` và runtime giả ở mức component. Mọi version dùng chung một `context.items`. Reload giả chỉ hiện thông báo.

### Điều chỉnh so với spec (cần bạn duyệt)

Không đổi requirement hay acceptance criterion nào. Các điểm sau thay hoặc làm rõ phần Architecture/File structure của spec:

1. **API mới ở `services/storage`:** `SdStorage.refresh()` (D-019). Spec chưa liệt kê `services/storage/src/storage.model.ts`, `storage.service.ts`, spec và `sd-storage.md`; plan sẽ thêm các file này. API chỉ thêm mới; ai tự implement interface `SdStorage` thì phải thêm method.
2. **Token public mới:** `SD_LAYOUT_CONTEXT_RUNTIME` (D-022). Thay cho "gọi `location.reload()` qua `DOCUMENT.defaultView`" trong spec.
3. **Nơi kích hoạt đối chiếu:** switcher, không phải `SdLayoutService` (D-021). `layout.service.ts` không còn trong danh sách sửa.
4. **Thuật toán đối chiếu** dùng namespace tại lúc gọi và thêm marker trong sessionStorage (D-025). Đây là bản ghi lưu thứ hai: chỉ theo phiên tab, nằm trong PC-004.
5. **Nhiều tab:** nghe mọi sự kiện `storage` rồi so id trong cùng namespace (D-020), thay cho "đúng key của handle". Key thật là digest nên không so trực tiếp được.
6. **Mobile V2:** trigger nằm trong sheet menu; sheet context xếp chồng theo D-027.
7. **AC-021 (key lạ)** được chứng minh qua `component-tokens.emit` dùng chung hàm kiểm với mixin (D-029).

### Invariants

| ID | Invariant | Kiểm bằng |
| --- | --- | --- |
| INV-001 | Không có `context` thì V1–V3 và mobile V1–V3 render DOM như cũ, và không ghi gì vào handle context. | VAL-001 |
| INV-002 | Chỉ `SdLayoutContextService` đọc/ghi snapshot, luôn qua `SdLayoutStorageService`. Nó và `SdLayoutService` không inject nhau. Component và consumer chỉ dùng method và signal public của nó. | VAL-002 |
| INV-003 | Chỉ reload khi đủ cả ba điều kiện: `refresh()` xác nhận id đích đã lưu, id đích khác id lúc load, và marker phiên chưa giữ id đó. Không bao giờ reload khi `items` rỗng hoặc ghi không xác nhận được. | VAL-003 |
| INV-004 | Trong một lần load, id của `getCurrentContext` giữ nguyên id lúc load. Ngoại lệ: đối chiếu không lưu được đích, hoặc reload bị marker chặn. title/subtitle/avatar có thể làm mới từ `items`. Đổi ở tab khác chỉ sinh thông báo; đổi namespace thì chụp lại, không báo. | VAL-004 |
| INV-005 | V4 chỉ lưu trạng thái thu gọn ở entry version 3 của `versionStates`. Bản ghi lưu mới chỉ có handle `currentContext` và marker phiên. | VAL-005 |
| INV-006 | `shared/menu-tree`, `searchMenuLeaves` và layout 304px của V1/V3 không đổi. Cây V4 chỉ được V4 desktop/mobile import và không export public. | VAL-006 |
| INV-007 | SCSS của V4 chỉ dùng màu qua `var(--sd-*)`: không hex, không input màu. Mọi token màu `--sd-sidebar-v4-*` được emit ở light, dark và trong mọi preset. | VAL-007 |
| INV-008 | Preset chỉ đổi component token qua map `components` gồm giá trị đơn. Mọi key phải có trong `$component-tokens`; override thay giá trị mặc định trước khi emit. Preset có tên vẫn light-only. | VAL-008 |
| INV-009 | `SdStorage.refresh()` chỉ thêm mới: `get`, `set`, `setSilent`, `has`, `remove`, `destroy` và observer giữ nguyên hành vi; `refresh()` chỉ broadcast khi giá trị đổi. | VAL-009 |
| INV-010 | Code context chỉ chạm reload, sự kiện `storage` và sessionStorage qua `SD_LAYOUT_CONTEXT_RUNTIME`. Không spec hay trang Showcase nào reload thật. | VAL-010 |

### Hợp đồng public

| ID | Loại | Nội dung | Tương thích | Migration |
| --- | --- | --- | --- | --- |
| PC-001 | api | `modules/layout` export: `SdSidebarV4`, `SdSidebarMobileV4`, `SdLayoutContextSwitcher`, `SdLayoutContextService`, `SdLayoutContext`, `SdLayoutContextConfiguration`, `SidebarConfigurationV4`, `SD_LAYOUT_CONTEXT_RUNTIME`, `SdLayoutContextRuntime`. Union nhận `version: 4`; `SidebarConfigurationBase` thêm `context`; `SdLayoutStorageService` thêm `refreshCurrentContext()` và namespace đã resolve | Chỉ thêm mới | Opt-in bằng `version: 4` và/hoặc `context`; gọi `getCurrentContext()` trong `provideAppInitializer` sau khi namespace resolve được |
| PC-002 | api | `SdLayoutMenu` thêm `section`, `badge`, `status`, `comingSoon`; bỏ comment `notify` | Chỉ thêm mới; chỉ V4 render | Không cần |
| PC-003 | api | `sd.theme` nhận `'graphite'`; preset có tên được mang map `components` (giá trị đơn) | Chỉ thêm mới; `graphite` + dark/auto fail như preset khác | Console dùng `@include sd.theme($preset: 'graphite')` |
| PC-004 | persisted-data-model | Handle `currentContext` lưu `{ id, title, subtitle?, avatar? }`, theo namespace, bị `clear()` xoá. Marker sessionStorage giữ id đích của lần reload đối chiếu gần nhất | Bản ghi mới; id cũ/lạ quay về `items[0]`, tối đa một reload mỗi phiên tab | Namespace theo user phải resolve trước khi gọi `getCurrentContext()` |
| PC-005 | api | 5 catalog i18n thêm khoá `core.module.layout.*` cho search V4, Soon, nhãn badge, More, switcher (kể cả lỗi chuyển) | Chỉ thêm mới với catalog dựng sẵn | Catalog typed tự viết thì chép khoá |
| PC-006 | api | `SdStorage<T>` và `SdStorageWithDefault<T>` thêm `refresh()` | Chỉ thêm mới với nơi gọi; ai tự implement interface thì phải thêm method | Không cần với nơi gọi |

### Nơi giữ dữ liệu và state

- Context hiện tại (id lúc load, metadata đã làm mới, các cờ `switching`, `error`, `changedElsewhere`): `SdLayoutContextService` (INV-002, INV-004).
- Snapshot trong handle `currentContext`: `SdLayoutContextService` qua `SdLayoutStorageService` (INV-002, INV-003).
- Marker đối chiếu theo phiên tab: `SdLayoutContextService` qua runtime (INV-003, INV-005).
- `items`: config sidebar của consumer, switcher chuyển vào service (INV-003).
- Trạng thái thu gọn của V4: entry 3 của `versionStates` (INV-005).
- Token `--sd-sidebar-v4-*` và override của preset: `assets/scss/themes` (INV-007, INV-008).

### Validation obligations

- **VAL-001 → AC-011, AC-018:** spec hiện có của V1–V3 và mobile V1–V3 pass mà không sửa, với menu có field mới và không có `context`. Có spec kiểm không có switcher và không ghi vào handle context.
- **VAL-002 → AC-016:**
  - spec service chạy get/set qua `SdLayoutStorageService` trên storage adapter;
  - grep chứng minh `SdLayoutContextService` và `SdLayoutService` không import nhau, và không component nào chạm handle context;
  - `getCurrentContext` chạy được khi không có `SD_LAYOUT_CONFIGURATION`.
- **VAL-003 → AC-015, AC-017:** spec service với runtime giả chứng minh:
  - một reload sau khi ghi được xác nhận;
  - không reload với id đang active, id lạ, `items` rỗng, ghi không xác nhận, hoặc khi marker đã giữ id đích;
  - namespace resolve sau `getCurrentContext` gây tối đa một reload mỗi phiên, kèm cảnh báo;
  - lần load thứ hai với id hợp lệ không reload.
- **VAL-004 → AC-016, AC-019:** spec phát sự kiện `storage` qua runtime giả:
  - id khác, cùng namespace → bật `changedElsewhere`, trong khi `getCurrentContext` giữ id lúc load;
  - snapshot bị xoá, thay đổi không liên quan, hoặc đổi namespace → không có gì;
  - Tải lại chỉ gọi runtime khi được click.
- **VAL-005 → AC-003:** spec V4 kiểm `patchVersionState(3, …)` và khôi phục từ `versionState(3)`. Danh sách key storage giống V3.
- **VAL-006 → AC-011, AC-013:** `git diff` không có thay đổi dưới `shared/menu-tree` và ở `searchMenuLeaves`; spec V3 vẫn đo 304px; index public không export cây V4.
- **VAL-007 → AC-013, AC-021:** script test compile light, dark và mọi preset có tên, kiểm có đủ token màu `--sd-sidebar-v4-*`. Quét SCSS V4 không thấy hex và `304px`.
- **VAL-008 → AC-020, AC-021:** `core-theme` và `theme-contrast` phủ `graphite`:
  - palette chính xác;
  - override (đủ box-shadow) chỉ có ở `graphite`;
  - tập key `--sd-*` giống nhau giữa các preset;
  - `@error` từ `component-tokens.emit` khi có key lạ;
  - lỗi light-only với dark/auto.
- **VAL-009 → AC-017, AC-019:** spec `SdStorageService`:
  - `refresh()` trả giá trị do nơi khác ghi vào storage;
  - trả `undefined` sau khi ghi lỗi;
  - chỉ broadcast khi đổi;
  - spec storage hiện có pass mà không sửa.
- **VAL-010 → AC-016, AC-023:**
  - grep không thấy `location.reload`, `window.addEventListener` hay `sessionStorage` trong `services/context`, ngoài factory runtime mặc định;
  - mọi spec context và demo layout của Showcase cấp runtime giả; Karma và Showcase chạy xong mà không reload trang.

### Review kiến trúc

Một reviewer read-only độc lập đối chiếu bản nháp đầu với code hiện tại. Kết quả: 3 lỗi chặn, 9 rủi ro, 4 câu hỏi. Tất cả đã được xử lý trong bản này.

Lỗi chặn:

- Đọc lại bằng `destroy()`/tạo lại không mới nếu còn handle khác sống (`services/storage/src/storage.service.ts:97-99`, `:171-180`; Showcase cấp `SdLayoutStorageService` ở mức component). Hệ quả: ghi lỗi trông như đã xác nhận, gây reload lặp. → D-019 (`SdStorage.refresh()`), INV-009, VAL-009.
- Snapshot chụp một lần cộng namespace resolve lười (`modules/layout/services/storage/storage.service.ts:20-35`, `:110-126`) có thể làm mọi lần load đều reload, và sinh thông báo "đổi ở tab khác" giả. → D-020, D-025 (namespace tại lúc gọi, marker phiên, cảnh báo dev), INV-003, INV-004.
- Không chặn hay giả được reload, nên Karma và demo Showcase sẽ reload thật. → D-022 (`SD_LAYOUT_CONTEXT_RUNTIME`), D-030, INV-010, VAL-010.

Rủi ro:

- Giá trị `components` dạng cặp sẽ cắt box-shadow → D-029 (giá trị đơn, merge trước khi emit).
- Không test được preset lạ vì `$presets` không phải `!default` → D-029 (test qua `emit`, chung hàm kiểm).
- Mobile V2 không có drawer, và sheet chồng lên `aria-modal` → D-027.
- Chuyển không xác nhận được làm row bận bị kẹt → D-026.
- Sidebar dùng ngoài `sd-layout` không có ai cấp `items` → D-021 (switcher kích hoạt).
- Emission lặp hoặc thiếu ghi liên tục → D-025 bước 3 (chỉ ghi khi khác).
- Service và listener bị tạo cho mọi app → D-021 (lazy).
- INV-004 chưa nói về làm mới title và về `clear()` trong SPA → INV-004 viết lại, D-020 chụp lại khi đổi namespace.
- Adapter lưu trong bộ nhớ xác nhận việc ghi nhưng không sống qua reload → marker phiên của D-025 vẫn chặn được vòng lặp.

Câu hỏi:

- API `refresh()` bổ sung hay giữ một owner duy nhất cho handle → chọn `refresh()` (D-019).
- Vị trí switcher trên mobile V2 → D-027.
- Màu của switcher theo `brandColor` hay theo token → token (D-028).
- Có chấp nhận marker sessionStorage không → có (D-025).

Đã được reviewer xác nhận đúng:

- `set()` ghi bộ nhớ trước và bỏ qua lỗi khi ghi xuống storage.
- Chưa có listener `storage` nào trong code hiện tại.
- Namespace đổi thì dựng lại toàn bộ handle.
- `SdLayoutService` throw khi thiếu config, và resolve sidebar một lần qua promise.
- V3 chỉ lưu `collapsed` ở entry 3.
- Token theme đã dùng `var()`/`color-mix()` trong các cặp; test parity giữ được.
- `graphite` đạt contrast (text-secondary/surface-muted ≈ 5.8:1, border-strong ≈ 4.0:1).
- V1, V2, V3 không có trở ngại cấu trúc ở chỗ gắn switcher.

### Profile frontend, giả định, quyết định hoãn

- Frontend: component standalone OnPush dùng signals. CDK overlay cho popover, flyout và sheet context; `cdkTrapFocus` cho drawer và sheet; tooltip native qua `title`. Token qua `var(--sd-*)`. Tuân INV-001, INV-006, INV-007 và INV-010.
- Giả định: A-001…A-004 của spec. A-002 (glyph Material Symbols) được kiểm khi lập plan.
- Không có quyết định nào bị hoãn trong phạm vi này.

## Appendix — architecture_context (machine-readable)

```yaml
architecture_context: {
  "schema_version": 1,
  "source": "sdcorejs-architecture",
  "contract_id": "sidebar-v4-context-switcher-graphite-v1",
  "requirement_id": "R-007",
  "approved_spec_reference": {
    "repository_id": "sdcorejs-angular",
    "artifact_id": "spec-sidebar-v4-context-switcher-graphite-v1-r1",
    "artifact_kind": "spec",
    "revision": "5f692cd3497a2a1ffa2e2c11d8a358b42476f799",
    "approval_hash": "sha256:v1:fb1ff4a6da2a5e03d4675ef5fb9451f356298bb96efaa1cc387b280ad035a131"
  },
  "approved_architecture_path": ".sdcorejs/architecture/angular/2026-10-18-11-40-sidebar-v4-context-switcher-graphite-r2.md",
  "approved_architecture_hash": "<filled after approval>",
  "owner_repository_id": "sdcorejs-angular",
  "owner_module_id": "modules/layout",
  "execution_host_repository_id": "sdcorejs-angular",
  "integration_owner_repository_id": "sdcorejs-angular",
  "trigger": {
    "required": true,
    "signals": [
      "persisted-data-model-contract",
      "public-api-contract",
      "state-data-ownership"
    ],
    "rationale": "Adds public layout API (sd-sidebar-v4, sd-sidebar-mobile-v4, sd-layout-context-switcher, SdLayoutContextService, SidebarConfigurationV4, new SdLayoutMenu fields) and a public preset components key; makes Core the owner of the current-context state (bootstrap read, reconcile, reload); and introduces a persisted client-side context snapshot in localStorage that survives reloads and is shared across tabs."
  },
  "invariants": [
    {
      "id": "INV-001",
      "statement": "Without context in the sidebar configuration, sidebar V1-V3 and mobile V1-V3 render the same DOM as before and nothing is written to the context handle.",
      "scope": "sidebar V1-V3 and mobile V1-V3 templates and the context handle",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "Apps that do not configure context must see no change.",
      "verification_method": "VAL-001",
      "requirement_refs": [
        "R-008"
      ],
      "decision_refs": [
        "D-005",
        "D-010"
      ]
    },
    {
      "id": "INV-002",
      "statement": "Only SdLayoutContextService reads or writes the context snapshot, always through SdLayoutStorageService; it and SdLayoutService never inject each other, and components and consumers use only its public methods and signals.",
      "scope": "modules/layout/services/context and its callers",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "One owner for the current-context state; SdLayoutService throws without configuration and must not be pulled in at bootstrap.",
      "verification_method": "VAL-002",
      "requirement_refs": [
        "R-007"
      ],
      "decision_refs": [
        "D-008",
        "D-009",
        "D-021",
        "D-024"
      ]
    },
    {
      "id": "INV-003",
      "statement": "A reload happens only after refresh() confirms the target id is stored, only when the target id differs from the load-time snapshot id, and only when the session marker does not already hold that target; never when items are empty or the write is unconfirmed.",
      "scope": "SdLayoutContextService.setCurrentContext and syncItems",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "Prevents reload loops from failed writes, late namespaces, custom adapters or changing items.",
      "verification_method": "VAL-003",
      "requirement_refs": [
        "R-007"
      ],
      "decision_refs": [
        "D-008",
        "D-018",
        "D-019",
        "D-025"
      ]
    },
    {
      "id": "INV-004",
      "statement": "Within a page load the id returned by getCurrentContext stays the load-time id unless reconciliation cannot persist its target or its reload is suppressed by the marker; title, subtitle and avatar may refresh from items; a change in another tab only raises the notice and a namespace change re-captures silently.",
      "scope": "SdLayoutContextService state and the storage listener",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "Consumers load permissions once per page; a tab must not silently switch context.",
      "verification_method": "VAL-004",
      "requirement_refs": [
        "R-007",
        "R-009"
      ],
      "decision_refs": [
        "D-008",
        "D-011",
        "D-020",
        "D-025"
      ]
    },
    {
      "id": "INV-005",
      "statement": "V4 stores its collapsed state only in the version 3 entry of versionStates; the only new storage records are the currentContext handle and the session reconcile marker.",
      "scope": "sd-sidebar-v4 collapse persistence and new storage records",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "Keeps the V3 storage key as required and preserves the user's preference when an app moves from V3 to V4.",
      "verification_method": "VAL-005",
      "requirement_refs": [
        "R-001"
      ],
      "decision_refs": [
        "D-004",
        "D-024",
        "D-025"
      ]
    },
    {
      "id": "INV-006",
      "statement": "components/shared/menu-tree, searchMenuLeaves and the V1/V3 304px layout are unchanged; the V4 tree is imported only by V4 desktop and mobile and is not exported publicly.",
      "scope": "modules/layout shared tree, menu utils, V1/V3 styles and the V4 tree",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "V2, V3 and mobile sidebars depend on the shared tree; isolating V4 removes regression risk.",
      "verification_method": "VAL-006",
      "requirement_refs": [
        "R-001",
        "R-003"
      ],
      "decision_refs": [
        "D-005",
        "D-014",
        "D-023"
      ]
    },
    {
      "id": "INV-007",
      "statement": "V4 stylesheets reference colours only through var(--sd-*) tokens with no hex literal and no colour input; every --sd-sidebar-v4-* colour token is emitted in light and dark and in every preset.",
      "scope": "sidebar-v4 and sidebar-mobile-v4 stylesheets, _component-tokens.scss",
      "owner": "sdcorejs-angular/assets/scss/themes",
      "rationale": "Dark mode and presets must apply without component code; the sidebar has no colour input.",
      "verification_method": "VAL-007",
      "requirement_refs": [
        "R-005"
      ],
      "decision_refs": [
        "D-006"
      ]
    },
    {
      "id": "INV-008",
      "statement": "A preset changes component tokens only through its components map of single values; every key must exist in $component-tokens, overrides replace the defaults before emission, and named presets remain light-only.",
      "scope": "assets/scss/themes default.scss, _presets.scss, _component-tokens.scss",
      "owner": "sdcorejs-angular/assets/scss/themes",
      "rationale": "A generic, validated override path instead of a graphite special case; keeps light-only presets.",
      "verification_method": "VAL-008",
      "requirement_refs": [
        "R-010",
        "R-011"
      ],
      "decision_refs": [
        "D-007",
        "D-029"
      ]
    },
    {
      "id": "INV-009",
      "statement": "SdStorage.refresh() is additive: get, set, setSilent, has, remove, destroy and the observers keep their current behaviour, and refresh() broadcasts only when the stored value differs from memory.",
      "scope": "services/storage SdStorage handles",
      "owner": "sdcorejs-angular/services/storage",
      "rationale": "refresh() is a new public method; existing consumers of SdStorage must see no behaviour change.",
      "verification_method": "VAL-009",
      "requirement_refs": [
        "R-007"
      ],
      "decision_refs": [
        "D-019"
      ]
    },
    {
      "id": "INV-010",
      "statement": "Context code reaches reload, window storage events and sessionStorage only through SD_LAYOUT_CONTEXT_RUNTIME; no spec or Showcase page performs a real reload.",
      "scope": "modules/layout/services/context, its specs and the Showcase layout demo",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "A real reload aborts Karma and reloads the docs site; the seam keeps every path testable.",
      "verification_method": "VAL-010",
      "requirement_refs": [
        "R-007",
        "R-009",
        "R-013"
      ],
      "decision_refs": [
        "D-022",
        "D-030"
      ]
    },
    {
      "id": "INV-011",
      "statement": "Mobile V4 renders only through the private V4 tree in mobile mode and the normalized V4 configuration; every close path of its drawer clears the query and returns focus to the trigger, and its bottom bar shows at most four destinations resolved from mobile.bottomBar plus More.",
      "scope": "sd-sidebar-mobile-v4 drawer and bottom bar",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "Mobile V4 must share V4 rendering and keep the V3 drawer accessibility contract.",
      "verification_method": "VAL-011",
      "requirement_refs": [
        "R-002"
      ],
      "decision_refs": [
        "D-002",
        "D-023"
      ]
    },
    {
      "id": "INV-012",
      "statement": "V4 defaults are resolved only by normalizeSidebarConfiguration (itemShape pill, density compact, collapsedGroup flyout, bottomBar of at most four unique non-empty ids); V4 components read normalized values only and sd-layout selects V4 only for version 4.",
      "scope": "normalizeSidebarConfiguration and sd-layout version selection",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "One place for defaults keeps desktop, mobile and docs consistent.",
      "verification_method": "VAL-012",
      "requirement_refs": [
        "R-004"
      ],
      "decision_refs": [
        "D-002"
      ]
    },
    {
      "id": "INV-013",
      "statement": "The context switcher renders rows from its configuration items with the active row derived from the SdLayoutContextService current id; it renders nothing without items, never opens with a single item, and shows search only above seven items unless searchable overrides it.",
      "scope": "sd-layout-context-switcher rendering",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "The switcher is shared by four sidebars and must behave the same everywhere.",
      "verification_method": "VAL-013",
      "requirement_refs": [
        "R-006"
      ],
      "decision_refs": [
        "D-017",
        "D-028"
      ]
    },
    {
      "id": "INV-014",
      "statement": "Theme and layout documentation describe only shipped behaviour: nine named presets with the graphite values and the link/text-button limitation, and the V4 configuration, new menu fields and context API with the bootstrap rule; a script assertion checks these statements.",
      "scope": "sd-layout.md, THEME.md, STYLE-GUIDE.md and CHANGELOG.md",
      "owner": "sdcorejs-angular/modules/layout",
      "rationale": "Docs are published per version to consumers and AI agents; they must match the shipped API.",
      "verification_method": "VAL-014",
      "requirement_refs": [
        "R-012",
        "R-013"
      ],
      "decision_refs": [
        "D-016"
      ]
    }
  ],
  "boundaries": [
    {
      "id": "B-001",
      "statement": "SdLayoutContextService is the only owner of the current context and its snapshot; sidebars, the switcher and consumers go through its public methods and signals.",
      "invariant_refs": [
        "INV-002",
        "INV-003",
        "INV-004"
      ]
    },
    {
      "id": "B-002",
      "statement": "The V4 tree is private to the V4 desktop and mobile components; the shared menu tree keeps serving V2, V3 and mobile V1-V3 unchanged.",
      "invariant_refs": [
        "INV-006"
      ]
    },
    {
      "id": "B-003",
      "statement": "Presets reach component tokens only through the validated components map; component styles read tokens and never branch on a preset.",
      "invariant_refs": [
        "INV-007",
        "INV-008"
      ]
    },
    {
      "id": "B-004",
      "statement": "Browser effects of the context feature (reload, storage events, session marker) cross into the app only through SD_LAYOUT_CONTEXT_RUNTIME.",
      "invariant_refs": [
        "INV-010"
      ]
    }
  ],
  "dependency_directions": [
    {
      "from": "sd-sidebar-v1..v4 and sd-sidebar-mobile-v1..v4",
      "to": "sd-layout-context-switcher",
      "rationale": "Each sidebar mounts the shared switcher only when context is configured.",
      "invariant_refs": [
        "INV-001"
      ]
    },
    {
      "from": "sd-layout-context-switcher",
      "to": "SdLayoutContextService",
      "rationale": "Forwards items to syncItems; reads current, switching, error and changedElsewhere; calls setCurrentContext.",
      "invariant_refs": [
        "INV-002"
      ]
    },
    {
      "from": "SdLayoutContextService",
      "to": "SdLayoutStorageService",
      "rationale": "New: snapshot persistence, refreshCurrentContext() and the resolved namespace.",
      "invariant_refs": [
        "INV-002",
        "INV-003"
      ]
    },
    {
      "from": "SdLayoutStorageService",
      "to": "SdStorage.refresh() in @sdcorejs/angular/services",
      "rationale": "New additive storage API used for confirmed writes and cross-tab reads.",
      "invariant_refs": [
        "INV-003",
        "INV-009"
      ]
    },
    {
      "from": "SdLayoutContextService",
      "to": "SD_LAYOUT_CONTEXT_RUNTIME",
      "rationale": "New: reload, storage-event subscription and the session marker.",
      "invariant_refs": [
        "INV-010"
      ]
    },
    {
      "from": "sd-sidebar-v4 and sd-sidebar-mobile-v4",
      "to": "components/sidebar-v4/menu-tree",
      "rationale": "Private V4 tree; neither imports components/shared/menu-tree.",
      "invariant_refs": [
        "INV-006"
      ]
    },
    {
      "from": "assets/scss/themes/default.scss",
      "to": "_presets.scss components map and _component-tokens.scss validation and emit",
      "rationale": "The theme mixin extracts preset component overrides, validates them and passes them to the emitter.",
      "invariant_refs": [
        "INV-008"
      ]
    }
  ],
  "data_state_owners": [
    {
      "subject": "Current context (load-time id, refreshed metadata, switching, error and changed-elsewhere flags)",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-002",
        "INV-004"
      ]
    },
    {
      "subject": "Persisted context snapshot { id, title, subtitle?, avatar? } in the currentContext handle",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-002",
        "INV-003"
      ]
    },
    {
      "subject": "Session reconcile marker (last reload target id, sessionStorage via the runtime)",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-003",
        "INV-005"
      ]
    },
    {
      "subject": "Context items list (consumer sidebar configuration, forwarded by the switcher)",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-003"
      ]
    },
    {
      "subject": "V4 collapsed state (versionStates entry 3)",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-005"
      ]
    },
    {
      "subject": "--sd-sidebar-v4-* colour tokens and preset overrides",
      "owner_repository_id": "sdcorejs-angular",
      "invariant_refs": [
        "INV-007",
        "INV-008"
      ]
    }
  ],
  "public_contracts": [
    {
      "id": "PC-001",
      "kind": "api",
      "owner": "sdcorejs-angular/modules/layout",
      "statement": "@sdcorejs/angular/modules/layout exports SdSidebarV4, SdSidebarMobileV4, SdLayoutContextSwitcher, SdLayoutContextService, SdLayoutContext, SdLayoutContextConfiguration, SidebarConfigurationV4, SD_LAYOUT_CONTEXT_RUNTIME and SdLayoutContextRuntime; ISdSidebarConfiguration accepts version 4; SidebarConfigurationBase gains context; SdLayoutStorageService gains refreshCurrentContext() and the resolved namespace.",
      "compatibility": "Additive. Existing V1-V3 configurations compile and behave unchanged.",
      "migration": "Opt in with version: 4 and/or context; call getCurrentContext() in provideAppInitializer after the storage namespace can resolve.",
      "invariant_refs": [
        "INV-001",
        "INV-002",
        "INV-010"
      ]
    },
    {
      "id": "PC-002",
      "kind": "api",
      "owner": "sdcorejs-angular/modules/layout",
      "statement": "SdLayoutMenu gains optional section, badge, status and comingSoon; the commented notify field is removed.",
      "compatibility": "Additive; only V4 renders the fields, V1-V3 ignore them.",
      "migration": "None.",
      "invariant_refs": [
        "INV-006"
      ]
    },
    {
      "id": "PC-003",
      "kind": "api",
      "owner": "sdcorejs-angular/assets/scss/themes",
      "statement": "sd.theme accepts $preset: 'graphite'; a named preset map may carry a components map of single-value component-token overrides validated against $component-tokens.",
      "compatibility": "Additive; existing presets and $theme overrides are unchanged; graphite with dark/auto fails like other named presets.",
      "migration": "Backoffice consoles use @include sd.theme($preset: 'graphite').",
      "invariant_refs": [
        "INV-007",
        "INV-008"
      ]
    },
    {
      "id": "PC-004",
      "kind": "persisted-data-model",
      "owner": "sdcorejs-angular/modules/layout",
      "statement": "A new SdLayoutStorageService handle currentContext stores { id, title, subtitle?, avatar? }, namespaced by SD_LAYOUT_STORAGE_NAMESPACE and removed by clear(); a per-tab sessionStorage marker stores the last reconcile reload target id.",
      "compatibility": "New records; no existing key changes. A stale or unknown id falls back to items[0] with at most one reload per tab session.",
      "migration": "None. Apps that namespace layout storage per user must let the namespace resolve before calling getCurrentContext().",
      "invariant_refs": [
        "INV-002",
        "INV-003",
        "INV-005"
      ]
    },
    {
      "id": "PC-005",
      "kind": "api",
      "owner": "sdcorejs-angular/i18n",
      "statement": "The five built-in catalogs gain core.module.layout keys for V4 search, the Soon chip, badge labels, the More destination and the context switcher (including the switch error).",
      "compatibility": "Additive for apps using built-in catalogs; a hand-written typed catalog must add the keys.",
      "migration": "Copy the new keys from the built-in catalog.",
      "invariant_refs": [
        "INV-001"
      ]
    },
    {
      "id": "PC-006",
      "kind": "api",
      "owner": "sdcorejs-angular/services/storage",
      "statement": "SdStorage<T> and SdStorageWithDefault<T> gain refresh(), which re-reads the entry from storage, broadcasts to live handles when it changed and returns the current value.",
      "compatibility": "Additive for callers; code that implements the SdStorage interface by hand must add the method.",
      "migration": "None for callers.",
      "invariant_refs": [
        "INV-009"
      ]
    }
  ],
  "security_trust_boundaries": [],
  "cross_repository_integration": [],
  "adopted_decision_refs": [
    "D-001",
    "D-002",
    "D-003",
    "D-004",
    "D-005",
    "D-006",
    "D-007",
    "D-008",
    "D-009",
    "D-010",
    "D-011",
    "D-012",
    "D-013",
    "D-014",
    "D-015",
    "D-016",
    "D-017",
    "D-018",
    "D-019",
    "D-020",
    "D-021",
    "D-022",
    "D-023",
    "D-024",
    "D-025",
    "D-026",
    "D-027",
    "D-028",
    "D-029",
    "D-030"
  ],
  "deferred_decision_refs": [],
  "assumption_refs": [
    "A-001",
    "A-002",
    "A-003",
    "A-004"
  ],
  "validation_obligations": [
    {
      "id": "VAL-001",
      "expected_proof": "Existing V1, V2, V3 and mobile V1-V3 specs pass unchanged with menus carrying the new fields and no context; a spec asserts no switcher element and no write to the context handle.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-001"
      ],
      "acceptance_criterion_refs": [
        "AC-011",
        "AC-018"
      ]
    },
    {
      "id": "VAL-002",
      "expected_proof": "Service specs drive get/set through SdLayoutStorageService over a storage adapter; a grep proves SdLayoutContextService and SdLayoutService do not import each other and no component touches the context handle; getCurrentContext works without SD_LAYOUT_CONFIGURATION.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-002"
      ],
      "acceptance_criterion_refs": [
        "AC-016"
      ]
    },
    {
      "id": "VAL-003",
      "expected_proof": "Service specs with a fake runtime prove: one reload after a confirmed write; no reload for the active id, an unknown id, empty items, an unconfirmed write, or when the marker already holds the target; a namespace that resolves after getCurrentContext produces at most one reload per session plus a warning; a second load with a valid id does not reload.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-003"
      ],
      "acceptance_criterion_refs": [
        "AC-015",
        "AC-017"
      ]
    },
    {
      "id": "VAL-004",
      "expected_proof": "Specs emit storage events through the fake runtime: a different stored id in the same namespace raises changedElsewhere while getCurrentContext keeps the load-time id; a removed snapshot, an unrelated change or a namespace change raises nothing; Reload calls the runtime only on click.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-004"
      ],
      "acceptance_criterion_refs": [
        "AC-016",
        "AC-019"
      ]
    },
    {
      "id": "VAL-005",
      "expected_proof": "V4 spec toggles collapse and asserts patchVersionState(3, ...) and restoration from versionState(3); a storage-key listing equals the V3 listing.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-005"
      ],
      "acceptance_criterion_refs": [
        "AC-003"
      ]
    },
    {
      "id": "VAL-006",
      "expected_proof": "git diff shows no change under components/shared/menu-tree and to searchMenuLeaves; V3 spec still measures 304px; the public components index does not export the V4 tree.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-006"
      ],
      "acceptance_criterion_refs": [
        "AC-011",
        "AC-013"
      ]
    },
    {
      "id": "VAL-007",
      "expected_proof": "A script test compiles light and dark themes and every named preset and asserts each --sd-sidebar-v4-* colour token is present; a scan of V4 SCSS finds no hex literal and no 304px.",
      "owner": "sdcorejs-angular/assets/scss/themes",
      "invariant_refs": [
        "INV-007"
      ],
      "acceptance_criterion_refs": [
        "AC-013",
        "AC-021"
      ]
    },
    {
      "id": "VAL-008",
      "expected_proof": "core-theme and theme-contrast tests cover graphite: exact palette, override values only under graphite with the full box-shadow, identical --sd-* key sets across presets, @error from component-tokens.emit for an unknown key, and the light-only error for dark/auto.",
      "owner": "sdcorejs-angular/assets/scss/themes",
      "invariant_refs": [
        "INV-008"
      ],
      "acceptance_criterion_refs": [
        "AC-020",
        "AC-021"
      ]
    },
    {
      "id": "VAL-009",
      "expected_proof": "SdStorageService specs: refresh() returns what another writer put in storage, returns undefined after a failed write, broadcasts only on change, and the existing storage specs pass unchanged.",
      "owner": "sdcorejs-angular/services/storage",
      "invariant_refs": [
        "INV-009"
      ],
      "acceptance_criterion_refs": [
        "AC-017",
        "AC-019"
      ]
    },
    {
      "id": "VAL-010",
      "expected_proof": "A grep finds no location.reload, window.addEventListener or sessionStorage use in modules/layout/services/context outside the default runtime factory; every context spec and the Showcase layout demo provide a fake runtime and the Karma and Showcase runs finish without a page reload.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-010"
      ],
      "acceptance_criterion_refs": [
        "AC-016",
        "AC-023"
      ]
    },
    {
      "id": "VAL-011",
      "expected_proof": "Mobile V4 spec: drawer renders the V4 tree with 44px rows, each close path (backdrop, Esc, menu selection) clears the query and returns focus; bottom bar keeps at most four valid ids plus More and is absent without the setting.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-011"
      ],
      "acceptance_criterion_refs": [
        "AC-009",
        "AC-010"
      ]
    },
    {
      "id": "VAL-012",
      "expected_proof": "Configuration spec covers V4 normalization defaults and bottomBar sanitising; layout-main spec renders V4 only for version 4 and switches desktop/mobile live.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-012"
      ],
      "acceptance_criterion_refs": [
        "AC-012"
      ]
    },
    {
      "id": "VAL-013",
      "expected_proof": "Switcher spec covers 0, 1, 7 and 8 items, searchable true/false, accent-insensitive filtering, image and initial avatars, and the active row from the service current id.",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-013"
      ],
      "acceptance_criterion_refs": [
        "AC-014"
      ]
    },
    {
      "id": "VAL-014",
      "expected_proof": "A node -e assertion checks sd-layout.md, THEME.md, STYLE-GUIDE.md and CHANGELOG.md for the planned statements (nine presets, graphite values, link limitation, SidebarConfigurationV4, menu fields, getCurrentContext bootstrap rule, Unreleased entry).",
      "owner": "sdcorejs-angular/modules/layout",
      "invariant_refs": [
        "INV-014"
      ],
      "acceptance_criterion_refs": [
        "AC-022"
      ]
    }
  ],
  "profile_sections": {
    "frontend_architecture_ref": {
      "reference": "plan_context.frontend_architecture",
      "conformance_invariant_refs": [
        "INV-001",
        "INV-006",
        "INV-007",
        "INV-010"
      ]
    },
    "agent_architecture_ref": null
  },
  "change_control": {
    "revision": 2,
    "supersedes": "architecture-sidebar-v4-context-switcher-graphite-v1-r1"
  }
}
```

## Appendix — decision_coverage revision 3 (thêm INV-011…INV-014, validation_boundary trên D-013)

```yaml
decision_coverage: {
  "schema_version": 1,
  "revision": 3,
  "records": [
    {
      "id": "R-001",
      "type": "requirement",
      "statement": "A desktop sd-sidebar-v4 component, forked from sd-sidebar-v3, renders the README D1-D4 frames: header (logo, app name, context slot, collapse button), pill search with Ctrl+K/Cmd+K focus and Up/Down/Enter/Esc result navigation, flat accent-insensitive search results with match highlight, Pinned and Recent shortcut sections, menu sections from menu.section, root/group/child rows with pill active state and child marker, a dot on a closed group that contains the active route, the trailing slot, the account footer, the 72px collapsed rail with separators and mini badges, and the collapsed-group flyout. It keeps V3 routing, navigation side effects, the collapse storage entry and the V3 accessibility rules.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "R-002",
      "type": "requirement",
      "statement": "A mobile sd-sidebar-mobile-v4 component, forked from sd-sidebar-mobile-v3, renders the README M1-M3 frames: a 56px app bar, a drawer of min(88vw, 360px) with the V4 tree in mobile mode (44px rows, 44px search, close button), closing on backdrop, menu selection or Esc with a focus trap and focus return, clearing the query on close, and an opt-in bottom bar built from mobile.bottomBar (at most 4 menu ids plus More).",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "R-003",
      "type": "requirement",
      "statement": "SdLayoutMenu gains optional fields section, badge { value, tone }, status { label, tone, live } and comingSoon, replacing the commented notify field. Existing menus compile and behave unchanged. Only V4 desktop and mobile render the new fields; a comingSoon item is aria-disabled, never navigates and is excluded from V4 search. searchMenuLeaves keeps its current behavior.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "R-004",
      "type": "requirement",
      "statement": "SidebarConfigurationV4 (version: 4) extends SidebarConfigurationV3 with itemShape, density, collapsedGroup and mobile.bottomBar. It joins ISdSidebarConfiguration, normalizeSidebarConfiguration fills its defaults, and the sd-layout component renders V4 desktop or mobile by breakpoint. V4 ignores brandColor and brandLightColor.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "R-005",
      "type": "requirement",
      "statement": "Every V4 colour goes through --sd-* tokens: the --sd-sidebar-v4-* colour tokens of the README table live in the theme component-token map with light and dark values, and the size tokens (width 280px, rail width 72px, item and child height, item radius) are declared on the .sd-sidebar-v4 host. V4 has no colour input and no hard-coded hex or 304px; its offsets use var(--sd-sidebar-v4-width) and var(--sd-sidebar-v4-rail-width). V1 and V3 keep their 304px layout.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "R-006",
      "type": "requirement",
      "statement": "A shared sd-layout-context-switcher component in components/shared/context-switcher renders the README CS1-CS3 states: header trigger, desktop popover with optional accent-insensitive search (auto above 7 items, forced by searchable), label and count, rows with image or initial avatar and an active check, the switching state that locks the list, and the mobile bottom sheet. One item shows the name only and cannot open; no configuration renders nothing. On a collapsed rail it shows the context avatar and opens to the right.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "R-007",
      "type": "requirement",
      "statement": "SdLayoutContextService (providedIn root) exposes getCurrentContext(): SdLayoutContext | null and setCurrentContext(id): void. Core persists a context snapshot through SdLayoutStorageService, reloads the page after a switch, emits no change event, ignores a re-selection of the active context, and reconciles the stored snapshot with the configured items so that a missing or stale id falls back to items[0] with at most one reload.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "R-008",
      "type": "requirement",
      "statement": "SidebarConfigurationBase gains context?: SdLayoutContextConfiguration shared by V1-V4. The switcher is mounted in the headers of sidebar V1, V2, V3 and V4 and in the drawer header of mobile V1-V4 at the agreed positions. Without context every sidebar renders exactly as before.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "R-009",
      "type": "requirement",
      "statement": "When another tab changes the stored context, an open tab shows a notice that the context changed elsewhere with a Reload action, and never reloads by itself.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "R-010",
      "type": "requirement",
      "statement": "A ninth named preset 'graphite' is added to the theme presets with the README palette values. It is light-only like the other named presets, inherits the semantic state colours and keeps primary-contrast white.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "assets/scss/themes"
    },
    {
      "id": "R-011",
      "type": "requirement",
      "statement": "A named preset can override component tokens through an optional components sub-map that the theme mixin forwards to the component-token emitter; unknown keys fail compilation. 'graphite' overrides --sd-sidebar-v4-active-bg and --sd-sidebar-v4-active-shadow so the active V4 item is a raised surface.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "assets/scss/themes"
    },
    {
      "id": "R-012",
      "type": "requirement",
      "statement": "The audit of components that colour links or text buttons with --sd-primary is recorded, no new token is created, and the theme docs state that under graphite those elements share the text colour.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "assets/scss/themes"
    },
    {
      "id": "R-013",
      "type": "requirement",
      "statement": "Documentation, Showcase, i18n, tests and release notes follow the change: STYLE-GUIDE.md and THEME.md list nine presets, sd-layout.md documents V4, the new menu fields and the context API, the Showcase layout page gains V4 and context demos with matching counts, the five i18n catalogs get the new keys, theme scripts cover graphite, CHANGELOG.md gets an Unreleased entry, and v20/v21/v22 are produced by npm run sync.",
      "source": "explicit-user",
      "status": "active",
      "owner_repository_id": "sdcorejs-angular",
      "owner_module_id": "modules/layout"
    },
    {
      "id": "AC-001",
      "type": "acceptance-criterion",
      "statement": "Render sd-sidebar-v4 with a nested menu on an active child route -> root rows carry icons and child rows do not; the active row has aria-current=\"page\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot",
      "behavior": "Render sd-sidebar-v4 with a nested menu on an active child route",
      "expected_result": "root rows carry icons and child rows do not; the active row has aria-current=\"page\" and the active class; the active child shows the marker; a closed group that contains the active route shows the dot",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001"
      ]
    },
    {
      "id": "AC-002",
      "type": "acceptance-criterion",
      "statement": "Click root, child and external-URL items in V4, then change the route -> internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes",
      "behavior": "Click root, child and external-URL items in V4, then change the route",
      "expected_result": "internal items call router.navigate with the V3 queryParams and switchTab state and record a recent entry; an http(s) item opens through sdOpenExternal; after navigation only the branch containing the active route opens and a branch the user closed stays closed until the route changes",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001"
      ]
    },
    {
      "id": "AC-003",
      "type": "acceptance-criterion",
      "statement": "Toggle collapse in V4, recreate the component, and list the storage keys written -> the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3",
      "behavior": "Toggle collapse in V4, recreate the component, and list the storage keys written",
      "expected_result": "the collapsed state is written to and restored from versionState(3); defaultCollapsed applies when nothing is stored; the set of storage keys is the same as with V3",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001",
        "R-005"
      ]
    },
    {
      "id": "AC-004",
      "type": "acceptance-criterion",
      "statement": "Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc -> the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render",
      "behavior": "Press Ctrl+K or Cmd+K, type an unaccented query, then use Up/Down, Enter and Esc",
      "expected_result": "the search input gains focus (expanding a collapsed V4); accented titles match; comingSoon items are absent; the first result is selected and Up/Down move the selection; Enter navigates to it; Esc clears the query; the result count label and the empty-state message render",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001",
        "R-003"
      ]
    },
    {
      "id": "AC-005",
      "type": "acceptance-criterion",
      "statement": "Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand' -> 'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items",
      "behavior": "Collapse V4 and click a group with collapsedGroup 'flyout' (default) and with 'expand'",
      "expected_result": "'flyout' opens a panel listing the group children, which closes on navigation, outside click or Esc with focus returned to the group button; 'expand' expands the drawer and opens that group; separators render between sections and mini badges render on rail items",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001"
      ]
    },
    {
      "id": "AC-006",
      "type": "acceptance-criterion",
      "statement": "Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon -> a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\"true\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status",
      "behavior": "Render V4 items with badge (neutral, warning, error), status (with and without live) and comingSoon",
      "expected_result": "a neutral badge renders as count text and warning/error as a pill with an accessible label; status renders a dot and label, with the live ring when live is true; comingSoon renders the Soon chip with aria-disabled=\"true\" and does not navigate on click; an item with several fields renders only one, in the order comingSoon, badge, status",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001",
        "R-003"
      ]
    },
    {
      "id": "AC-007",
      "type": "acceptance-criterion",
      "statement": "Render V4 with sectioned items, unsectioned items, pinned items and recent items -> items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration",
      "behavior": "Render V4 with sectioned items, unsectioned items, pinned items and recent items",
      "expected_result": "items are grouped under one heading per section in order of first appearance; unsectioned items render without a heading; Pinned and Recent sections render when they have entries and Recent follows the inherited recent configuration",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001",
        "R-003"
      ]
    },
    {
      "id": "AC-008",
      "type": "acceptance-criterion",
      "statement": "Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer -> the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px",
      "behavior": "Render V4 with itemShape 'soft', density 'comfortable', and under a coarse pointer",
      "expected_result": "the host resolves --sd-sidebar-v4-item-radius to 8px for 'soft', item and child heights to 40px and 34px for 'comfortable', and rows to at least 44px for a coarse pointer; the defaults are pill, 36px and 32px",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-001",
        "R-005"
      ]
    },
    {
      "id": "AC-009",
      "type": "acceptance-criterion",
      "statement": "Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection -> the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger",
      "behavior": "Open the mobile V4 drawer from the app bar, search, then close it by backdrop, Esc and menu selection",
      "expected_result": "the drawer traps focus and renders 44px rows; each close path hides it, clears the query and returns focus to the trigger",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-002"
      ]
    },
    {
      "id": "AC-010",
      "type": "acceptance-criterion",
      "statement": "Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar -> the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders",
      "behavior": "Render mobile V4 with mobile.bottomBar holding five ids including an unknown one, and without mobile.bottomBar",
      "expected_result": "the bottom bar shows at most four valid destinations plus More, More opens the drawer, the active destination is marked; without the setting no bottom bar renders",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-002"
      ]
    },
    {
      "id": "AC-011",
      "type": "acceptance-criterion",
      "statement": "Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context -> all existing specs pass unchanged and V3 renders no badge, status or section markup",
      "behavior": "Run the existing V1, V2, V3 and mobile V1-V3 specs with menus that use the new optional fields and no context",
      "expected_result": "all existing specs pass unchanged and V3 renders no badge, status or section markup",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-003",
        "R-008"
      ]
    },
    {
      "id": "AC-012",
      "type": "acceptance-criterion",
      "statement": "Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration -> sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids",
      "behavior": "Provide a version 4 sidebar to sd-layout and cross the mobile breakpoint; normalize a V4 configuration",
      "expected_result": "sd-sidebar-v4 renders on desktop and sd-sidebar-mobile-v4 on mobile with a live switch; normalization yields itemShape pill, density compact, collapsedGroup flyout and a bottomBar of at most four unique non-empty ids",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-004"
      ]
    },
    {
      "id": "AC-013",
      "type": "acceptance-criterion",
      "statement": "Compile the default theme in light and dark, and scan the V4 stylesheets -> every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px",
      "behavior": "Compile the default theme in light and dark, and scan the V4 stylesheets",
      "expected_result": "every --sd-sidebar-v4-* colour token is emitted in both modes; V4 SCSS contains no hex colour literal and no 304px; the V3 drawer still measures 304px",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-005"
      ]
    },
    {
      "id": "AC-014",
      "type": "acceptance-criterion",
      "statement": "Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images -> search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders",
      "behavior": "Open the context switcher with 1, 7 and 8 items, with searchable true and false, and with and without avatar images",
      "expected_result": "search appears above 7 items unless searchable overrides it and filters accent-insensitively; the label shows the count; the active row shows the check; rows show the image or the initial; one item renders the name without a chevron and cannot open; without context nothing renders",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-006"
      ]
    },
    {
      "id": "AC-015",
      "type": "acceptance-criterion",
      "statement": "Select a different context, then reopen and select the active context -> the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload",
      "behavior": "Select a different context, then reopen and select the active context",
      "expected_result": "the selected row gets aria-busy and a spinner, the other rows are disabled and setCurrentContext is called once; selecting the active context only closes the popover and does not reload",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-006",
        "R-007"
      ]
    },
    {
      "id": "AC-016",
      "type": "acceptance-criterion",
      "statement": "Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id -> getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload",
      "behavior": "Call getCurrentContext and setCurrentContext with a stored snapshot, without one, with a storage namespace, after clear(), and with an unknown id",
      "expected_result": "getCurrentContext returns the stored snapshot or null; setCurrentContext writes the snapshot through SdLayoutStorageService under the namespace and reloads once; clear() removes it; an unknown id changes nothing and does not reload",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-007"
      ]
    },
    {
      "id": "AC-017",
      "type": "acceptance-criterion",
      "statement": "Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail -> a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads",
      "behavior": "Provide context items when the stored id is valid, missing, stale, when items are empty, and when storage writes fail",
      "expected_result": "a valid id refreshes the snapshot without reload; a missing or stale id stores items[0] and reloads exactly once, and the next load does not reload again; empty items hide the switcher and store nothing; a failed write never reloads",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-007",
        "R-008"
      ]
    },
    {
      "id": "AC-018",
      "type": "acceptance-criterion",
      "statement": "Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4 -> each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet",
      "behavior": "Configure context on V1, V2, V3, V4 and mobile V1-V4, including collapsed V1, V3 and V4",
      "expected_result": "each sidebar renders the switcher at its agreed position; collapsed rails show the context avatar and open the popover to the right; mobile drawers open the bottom sheet",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-006",
        "R-008"
      ]
    },
    {
      "id": "AC-019",
      "type": "acceptance-criterion",
      "statement": "Dispatch a storage event for the context key with another id, then one for an unrelated key -> the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing",
      "behavior": "Dispatch a storage event for the context key with another id, then one for an unrelated key",
      "expected_result": "the context key event shows the notice with a Reload action that reloads only when clicked; the unrelated event shows nothing",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-009"
      ]
    },
    {
      "id": "AC-020",
      "type": "acceptance-criterion",
      "statement": "Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto -> the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'",
      "behavior": "Compile sd.theme($preset: 'graphite') and run the theme contrast checks; compile it with $mode dark and auto",
      "expected_result": "the nine palette keys equal the README values, primary-contrast is #ffffff and the semantic families equal the default; all contrast pairs pass; dark and auto fail with 'only has a light palette'",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-010"
      ]
    },
    {
      "id": "AC-021",
      "type": "acceptance-criterion",
      "statement": "Compile graphite, another named preset, and a preset whose components map has an unknown key -> graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error",
      "behavior": "Compile graphite, another named preset, and a preset whose components map has an unknown key",
      "expected_result": "graphite emits --sd-sidebar-v4-active-bg: var(--sd-surface) and the README active shadow, other presets emit the defaults, the --sd-* key set is identical across presets, and the unknown key fails with @error",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-011"
      ]
    },
    {
      "id": "AC-022",
      "type": "acceptance-criterion",
      "statement": "Search the theme and layout documentation and CHANGELOG.md -> STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry",
      "behavior": "Search the theme and layout documentation and CHANGELOG.md",
      "expected_result": "STYLE-GUIDE.md and THEME.md list nine presets with the graphite values and the link/text-button note; sd-layout.md documents SidebarConfigurationV4, the new menu fields and the context API with the bootstrap example; CHANGELOG.md has the Unreleased entry",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-012",
        "R-013"
      ]
    },
    {
      "id": "AC-023",
      "type": "acceptance-criterion",
      "statement": "Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts -> the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass",
      "behavior": "Run the Showcase tests, the i18n checks, npm run sync, npm run check:sync and npm run test:scripts",
      "expected_result": "the layout page has the V4 and context demos with matching registry counts and generated manifest; i18n parity passes in five catalogs; the mirrors match v19 and the root script tests pass",
      "verification_kind": "automated",
      "blocking": true,
      "requirement_refs": [
        "R-013"
      ]
    },
    {
      "id": "A-001",
      "type": "assumption",
      "statement": "Reloading the page after a context switch, with no change event, is acceptable to consuming apps.",
      "blocking": false,
      "evidence_refs": [],
      "owner": "sdcorejs-angular maintainers",
      "source": "explicit",
      "confidence": "high",
      "status": "confirmed",
      "consequence_if_wrong": "Apps needing an in-place switch would need a different API.",
      "validation_method": "README states the behaviour was agreed with the product owner.",
      "rationale": "Agreed with the product owner per the design handoff README.",
      "impacted_refs": [
        "R-007"
      ]
    },
    {
      "id": "A-002",
      "type": "assumption",
      "statement": "The bundled Material Symbols font is the static v29 regular cut, so the FILL axis is unavailable and some chrome glyphs may be missing.",
      "blocking": false,
      "evidence_refs": [],
      "owner": "sdcorejs-angular maintainers",
      "source": "inferred",
      "confidence": "medium",
      "status": "proposed",
      "consequence_if_wrong": "Active icons could use the Symbols FILL axis directly instead of the Material Icons filled set.",
      "validation_method": "Check the font file and render each chrome glyph in the Showcase during planning.",
      "rationale": "fonts.scss loads material-symbols-v29-latin-regular.woff2.",
      "impacted_refs": [
        "R-001",
        "R-006"
      ]
    },
    {
      "id": "A-003",
      "type": "assumption",
      "statement": "No layout outside sidebar V1 and V3 hard-codes the 304px sidebar width or a sidebar-dependent fixed offset.",
      "blocking": false,
      "evidence_refs": [],
      "owner": "sdcorejs-angular maintainers",
      "source": "inferred",
      "confidence": "high",
      "status": "validated",
      "consequence_if_wrong": "Pages next to V4 would keep a 304px offset.",
      "validation_method": "Repository grep for 304px, rail widths and calc(100vw - ...) in the library and Showcase.",
      "rationale": "The grep found only V1, V3 and its spec.",
      "impacted_refs": [
        "R-005"
      ]
    },
    {
      "id": "A-004",
      "type": "assumption",
      "statement": "Consumers read the context through getCurrentContext(), which serves one snapshot per page load, so a tab stays internally consistent after another tab switches.",
      "blocking": false,
      "evidence_refs": [],
      "owner": "sdcorejs-angular maintainers",
      "source": "inferred",
      "confidence": "medium",
      "status": "proposed",
      "consequence_if_wrong": "A consumer reading localStorage directly could mix contexts across tabs.",
      "validation_method": "Document the rule in sd-layout.md and cover the snapshot behaviour in service specs.",
      "rationale": "README forbids consumers from reading the key directly.",
      "impacted_refs": [
        "R-007",
        "R-009"
      ]
    },
    {
      "id": "D-001",
      "type": "decision",
      "statement": "Which repositories this round covers: Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request",
      "question": "Which repositories this round covers",
      "selected_value": "Core UI (@sdcorejs/angular) only; a Legacy port is a later, separate request",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The user asked to build the feature on Core UI.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "R-006",
        "R-010"
      ]
    },
    {
      "id": "D-002",
      "type": "decision",
      "statement": "V4 scope: The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI",
      "question": "V4 scope",
      "selected_value": "The full README scope: flyout, mobile.bottomBar, density, itemShape, Ctrl+K and keyboard result navigation, search result UI",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The handoff is high fidelity and the brief points to the README.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "R-002",
        "R-004"
      ]
    },
    {
      "id": "D-003",
      "type": "decision",
      "statement": "V4 section layout: Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings",
      "question": "V4 section layout",
      "selected_value": "Keep the Recent section from V3 and style it like Pinned; drop the 'All menu' heading and use menu.section headings",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Keeps V3 recent behaviour while adopting README sections.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "AC-007"
      ]
    },
    {
      "id": "D-004",
      "type": "decision",
      "statement": "Where V4 stores its collapsed state: Share the version 3 entry of versionStates; no new storage key",
      "question": "Where V4 stores its collapsed state",
      "selected_value": "Share the version 3 entry of versionStates; no new storage key",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Matches 'keep the V3 storage key' and keeps the preference when an app moves from V3 to V4.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "AC-003"
      ]
    },
    {
      "id": "D-005",
      "type": "decision",
      "statement": "Which sidebars render the new menu fields: Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged",
      "question": "Which sidebars render the new menu fields",
      "selected_value": "Only V4 desktop and mobile; V1-V3 ignore them and searchMenuLeaves is unchanged",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Backward compatible with no V1-V3 behaviour change.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-003",
        "AC-011"
      ]
    },
    {
      "id": "D-006",
      "type": "decision",
      "statement": "Where V4 tokens are declared: Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host",
      "question": "Where V4 tokens are declared",
      "selected_value": "Colour tokens in the theme component-token map (light and dark); size tokens on the .sd-sidebar-v4 host",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Colours follow the theme tiers and dark mode; sizes vary with density, itemShape and pointer.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-005",
        "AC-008",
        "AC-013"
      ]
    },
    {
      "id": "D-007",
      "type": "decision",
      "statement": "How a preset overrides component tokens: An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error",
      "question": "How a preset overrides component tokens",
      "selected_value": "An optional components sub-map in the preset, forwarded by the theme mixin to the component-token emitter; unknown keys raise @error",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Generic and validated instead of a graphite special case in the mixin.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-011",
        "AC-021"
      ]
    },
    {
      "id": "D-008",
      "type": "decision",
      "statement": "How the current context is resolved at bootstrap: context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once",
      "question": "How the current context is resolved at bootstrap",
      "selected_value": "context lives on SidebarConfigurationBase; storage keeps a { id, title, subtitle?, avatar? } snapshot; getCurrentContext returns the snapshot (null on first run); when items arrive a valid id refreshes the snapshot, a missing or stale id stores items[0] and reloads once",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The sidebar configuration may resolve after APP_INITIALIZER, so items are not known when consumers first read the context.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "R-008",
        "AC-016",
        "AC-017"
      ]
    },
    {
      "id": "D-009",
      "type": "decision",
      "statement": "Where the context snapshot is stored: Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout",
      "question": "Where the context snapshot is stored",
      "selected_value": "Through SdLayoutStorageService, so it follows SD_LAYOUT_STORAGE_NAMESPACE and is removed by clear() at signout",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Same privacy model as pinned and recent menus.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "AC-016"
      ]
    },
    {
      "id": "D-010",
      "type": "decision",
      "statement": "Where the switcher is mounted: V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header",
      "question": "Where the switcher is mounted",
      "selected_value": "V1 and V3 below the app name, as a context avatar at the top of the collapsed rail with the popover opening right; V2 as a context avatar below the rail logo; mobile V1-V4 as a bottom sheet from the drawer header",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "V2 has no app-name header; collapsed rails have no room for text.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-008",
        "AC-018"
      ]
    },
    {
      "id": "D-011",
      "type": "decision",
      "statement": "Multi-tab synchronisation: Listen to the storage event and show a notice with a Reload action; never auto-reload",
      "question": "Multi-tab synchronisation",
      "selected_value": "Listen to the storage event and show a notice with a Reload action; never auto-reload",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Prevents silent work in a stale context without surprising the user.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-009",
        "AC-019"
      ]
    },
    {
      "id": "D-012",
      "type": "decision",
      "statement": "Icon strategy: Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph",
      "question": "Icon strategy",
      "selected_value": "Menu icons use material-icons-outlined like V3 and the active root switches to material-icons (filled) with the same name; chrome icons use Material Symbols when the bundled font has the glyph, otherwise the closest available glyph",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The bundled Symbols font has no FILL axis.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "R-006"
      ]
    },
    {
      "id": "D-013",
      "type": "decision",
      "statement": "Coverage approach: TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts",
      "question": "Coverage approach",
      "selected_value": "TDD for SdLayoutContextService, configuration normalization, menu helpers and theme presets; V3-style component specs for sidebar-v4, sidebar-mobile-v4, the context switcher and the V1-V3 mounts",
      "source": "explicit-user",
      "status": "approved",
      "blocking": true,
      "scope": "repository",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Repository rules require tests; logic is test-first and UI specs follow the V3 pattern.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-013",
        "AC-023",
        "R-001",
        "R-002",
        "R-003",
        "R-004",
        "R-005",
        "R-006",
        "R-007",
        "R-008",
        "R-009",
        "R-010",
        "R-011",
        "R-012",
        "AC-001",
        "AC-002",
        "AC-003",
        "AC-004",
        "AC-005",
        "AC-006",
        "AC-007",
        "AC-008",
        "AC-009",
        "AC-010",
        "AC-011",
        "AC-012",
        "AC-013",
        "AC-014",
        "AC-015",
        "AC-016",
        "AC-017",
        "AC-018",
        "AC-019",
        "AC-020",
        "AC-021",
        "AC-022",
        "INV-001",
        "INV-002",
        "INV-003",
        "INV-004",
        "INV-005",
        "INV-006",
        "INV-007",
        "INV-008",
        "INV-009",
        "INV-010",
        "INV-011",
        "INV-012",
        "INV-013",
        "INV-014"
      ],
      "validation_boundary": {
        "kind": "none",
        "source_refs": [
          "R-001",
          "R-002",
          "R-003",
          "R-004",
          "R-005",
          "R-006",
          "R-007",
          "R-008",
          "R-009",
          "R-010",
          "R-011",
          "R-012",
          "R-013",
          "AC-001",
          "AC-002",
          "AC-003",
          "AC-004",
          "AC-005",
          "AC-006",
          "AC-007",
          "AC-008",
          "AC-009",
          "AC-010",
          "AC-011",
          "AC-012",
          "AC-013",
          "AC-014",
          "AC-015",
          "AC-016",
          "AC-017",
          "AC-018",
          "AC-019",
          "AC-020",
          "AC-021",
          "AC-022",
          "AC-023",
          "INV-001",
          "INV-002",
          "INV-003",
          "INV-004",
          "INV-005",
          "INV-006",
          "INV-007",
          "INV-008",
          "INV-009",
          "INV-010",
          "INV-011",
          "INV-012",
          "INV-013",
          "INV-014"
        ]
      }
    },
    {
      "id": "D-014",
      "type": "decision",
      "statement": "Which menu tree V4 uses: A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified",
      "question": "Which menu tree V4 uses",
      "selected_value": "A V4-owned tree inside sidebar-v4; components/shared/menu-tree is not modified",
      "source": "approved-spec",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "V2, V3 and the mobile sidebars depend on the shared tree; a separate tree removes regression risk.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "AC-011"
      ]
    },
    {
      "id": "D-015",
      "type": "decision",
      "statement": "Trailing slot precedence and badge tones: One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills",
      "question": "Trailing slot precedence and badge tones",
      "selected_value": "One trailing element per item in the order comingSoon, badge, status; a neutral badge is count text, warning and error badges are pills",
      "source": "approved-spec",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "README allows one trailing type and defines neutral badges as plain counts.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "AC-006"
      ]
    },
    {
      "id": "D-016",
      "type": "decision",
      "statement": "How the link/text-button audit is handled: Report it and document the graphite limitation; create no token and change no component in this round",
      "question": "How the link/text-button audit is handled",
      "selected_value": "Report it and document the graphite limitation; create no token and change no component in this round",
      "source": "approved-spec",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The brief asks to report and not to create tokens.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-012",
        "AC-022"
      ]
    },
    {
      "id": "D-017",
      "type": "decision",
      "statement": "Public names of the context API: SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace",
      "question": "Public names of the context API",
      "selected_value": "SdLayoutContext, SdLayoutContextConfiguration (README wrote SdLayoutContextConfig), SdLayoutContextService with getCurrentContext/setCurrentContext, selector sd-layout-context-switcher; the feature is called Context, never branch or workspace",
      "source": "approved-spec",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Repository convention names consumer-configured shapes '*Configuration' (SdLayoutNotificationConfiguration, SidebarConfigurationV3); 'branch' already names the tree rail.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-006",
        "R-007",
        "R-008"
      ]
    },
    {
      "id": "D-018",
      "type": "decision",
      "statement": "setCurrentContext with an id that is not in the configured items: Ignore it: no write and no reload",
      "question": "setCurrentContext with an id that is not in the configured items",
      "selected_value": "Ignore it: no write and no reload",
      "source": "approved-spec",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Prevents storing an id that would immediately fall back on the next load.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "AC-016"
      ]
    },
    {
      "id": "D-019",
      "type": "decision",
      "statement": "How the context snapshot is read back from storage: An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it",
      "question": "How the context snapshot is read back from storage",
      "selected_value": "An additive refresh() on SdStorage and SdStorageWithDefault (@sdcorejs/angular/services) re-hydrates the shared entry from storage, broadcasts to live handles only when the value changed, and returns it; SdLayoutStorageService exposes refreshCurrentContext() on top of it",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Handles share one in-memory entry per key and set() updates memory even when persistence fails; destroy/recreate is not fresh while another handle (for example a component-level SdLayoutStorageService) is alive.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "R-009",
        "AC-017",
        "AC-019"
      ]
    },
    {
      "id": "D-020",
      "type": "decision",
      "statement": "Which storage events raise the changed-elsewhere notice: On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing",
      "question": "Which storage events raise the changed-elsewhere notice",
      "selected_value": "On each localStorage storage event the service refreshes the context: when the resolved namespace equals the one of the last capture, the notice appears only if a snapshot exists and its id differs from current().id; when the namespace changed, the snapshot is re-captured silently; a removed snapshot raises nothing",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "SdStorage keys are digests, so event keys cannot be matched; comparing ids within one namespace filters unrelated events and login/logout partition switches.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-009",
        "AC-019"
      ]
    },
    {
      "id": "D-021",
      "type": "decision",
      "statement": "Who triggers reconciliation with the configured items: sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call",
      "question": "Who triggers reconciliation with the configured items",
      "selected_value": "sd-layout-context-switcher forwards its configuration.items to SdLayoutContextService.syncItems in an untracked effect; SdLayoutService is unchanged and has no dependency on the context service; the storage listener is registered on the first syncItems call",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Covers sidebars used outside sd-layout, keeps the service and its listener lazy for apps without context, and keeps the service usable from provideAppInitializer.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "R-008",
        "AC-017",
        "AC-018"
      ]
    },
    {
      "id": "D-022",
      "type": "decision",
      "statement": "How reload, window events and the session marker are reached: Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake",
      "question": "How reload, window events and the session marker are reached",
      "selected_value": "Through a public injection token SD_LAYOUT_CONTEXT_RUNTIME (interface SdLayoutContextRuntime: reload, storage-event subscription, session marker read/write) whose default factory uses DOCUMENT.defaultView and degrades to no-ops without a window; specs and the Showcase provide a fake",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "location.reload cannot be spied in Chrome and a real reload aborts Karma and the docs site; SD_VIEWPORT is the precedent for an injectable browser seam.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "R-009",
        "AC-016",
        "AC-023"
      ]
    },
    {
      "id": "D-023",
      "type": "decision",
      "statement": "Where the V4 tree lives and who may import it: components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index",
      "question": "Where the V4 tree lives and who may import it",
      "selected_value": "components/sidebar-v4/menu-tree, imported by sd-sidebar-v4 and sd-sidebar-mobile-v4 only and not exported from the public index",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Mobile V4 renders the same tree in mobile mode; keeping it private leaves room to change it without a public contract.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-001",
        "R-002",
        "AC-009"
      ]
    },
    {
      "id": "D-024",
      "type": "decision",
      "statement": "Storage identity of the context snapshot: A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes",
      "question": "Storage identity of the context snapshot",
      "selected_value": "A new fixed-UUID handle currentContext in SdLayoutStorageService, created with the same namespace option as the other handles and removed by clear(); SdLayoutStorageService also exposes the resolved namespace so the context service can detect partition changes",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Follows the existing handle pattern so namespace and signout behaviour come for free.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "AC-016"
      ]
    },
    {
      "id": "D-025",
      "type": "decision",
      "statement": "Reconciliation algorithm: syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning",
      "question": "Reconciliation algorithm",
      "selected_value": "syncItems refreshes the snapshot in the namespace current at call time; the target is that snapshot when its id is in items, otherwise items[0]; the target is written only when id, title, subtitle or avatar differ and is then confirmed by refresh(); a reload is requested only when the target id differs from the load-time snapshot id, and only if the session marker does not already hold that target id (the marker is set just before reloading and cleared when no reload is needed); an unconfirmed write or a suppressed reload keeps the target in memory and logs a development warning",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "public-contract",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "A user namespace that resolves after getCurrentContext() would otherwise reload on every load; the marker bounds that case to one reload per tab session while the warning surfaces the misconfiguration.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-007",
        "AC-017"
      ]
    },
    {
      "id": "D-026",
      "type": "decision",
      "statement": "Outcome when a switch cannot be confirmed: setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads",
      "question": "Outcome when a switch cannot be confirmed",
      "selected_value": "setCurrentContext clears switching, the switcher shows an inline error message (new i18n key) and nothing reloads",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Otherwise the busy row and the locked list would stay stuck.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-006",
        "R-007",
        "AC-015"
      ]
    },
    {
      "id": "D-027",
      "type": "decision",
      "statement": "Mobile placement and stacking of the context sheet: Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger",
      "question": "Mobile placement and stacking of the context sheet",
      "selected_value": "Mobile V1, V3 and V4 put the trigger in the drawer header; mobile V2, which has no drawer, puts it as the first row of its menu sheet; the context sheet opens as a CDK overlay above the drawer or sheet with its own focus trap, Escape closes only the context sheet and focus returns to the trigger",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "Mobile V2 is a bottom bar plus sheets; stacked aria-modal surfaces must not both react to Escape.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-006",
        "R-008",
        "AC-018"
      ]
    },
    {
      "id": "D-028",
      "type": "decision",
      "statement": "Colours of the shared switcher in V1-V4: Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor",
      "question": "Colours of the shared switcher in V1-V4",
      "selected_value": "Theme tokens only (--sd-primary, --sd-primary-light, --sd-text, --sd-text-secondary, --sd-border, surface and color-mix hover); it ignores the V1 brandColor",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The switcher is shared and has no colour input, like the V4 sidebar.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-006",
        "AC-014"
      ]
    },
    {
      "id": "D-029",
      "type": "decision",
      "statement": "Shape and validation of preset component overrides: Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation",
      "question": "Shape and validation of preset component overrides",
      "selected_value": "Values in a preset components map are single values (presets are light-only) merged into the token map before emission; one validation function in _component-tokens.scss rejects unknown keys and is used by the theme mixin; because $presets is not configurable, the unknown-key case of AC-021 is proven by compiling component-tokens.emit with the same validation",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "A (light, dark) pair would emit only the first part of a comma-separated box-shadow; tests cannot inject a preset into the non-default $presets map.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-011",
        "AC-021"
      ]
    },
    {
      "id": "D-030",
      "type": "decision",
      "statement": "How the Showcase demo hosts the context switcher: The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading",
      "question": "How the Showcase demo hosts the context switcher",
      "selected_value": "The layout demo provides SdLayoutContextService and a fake SD_LAYOUT_CONTEXT_RUNTIME at component level, all demo versions share one context.items, and the fake reload shows a message instead of reloading",
      "source": "approved-architecture",
      "status": "approved",
      "blocking": true,
      "scope": "module",
      "owner_repository_id": "sdcorejs-angular",
      "rationale": "The demo already provides SdLayoutService and SdLayoutStorageService at component level; a real reload would reload the docs site.",
      "supersedes": null,
      "revisit_condition": null,
      "convention_impact": {
        "candidate": false,
        "category": null
      },
      "downstream_refs": [
        "R-013",
        "AC-023"
      ]
    },
    {
      "id": "INV-001",
      "type": "invariant",
      "statement": "Without context in the sidebar configuration, sidebar V1-V3 and mobile V1-V3 render the same DOM as before and nothing is written to the context handle.",
      "protected_refs": [
        "R-008",
        "AC-011",
        "AC-018"
      ]
    },
    {
      "id": "INV-002",
      "type": "invariant",
      "statement": "Only SdLayoutContextService reads or writes the context snapshot, always through SdLayoutStorageService; it and SdLayoutService never inject each other, and components and consumers use only its public methods and signals.",
      "protected_refs": [
        "R-007",
        "AC-016"
      ]
    },
    {
      "id": "INV-003",
      "type": "invariant",
      "statement": "A reload happens only after refresh() confirms the target id is stored, only when the target id differs from the load-time snapshot id, and only when the session marker does not already hold that target; never when items are empty or the write is unconfirmed.",
      "protected_refs": [
        "R-007",
        "AC-015",
        "AC-017"
      ]
    },
    {
      "id": "INV-004",
      "type": "invariant",
      "statement": "Within a page load the id returned by getCurrentContext stays the load-time id unless reconciliation cannot persist its target or its reload is suppressed by the marker; title, subtitle and avatar may refresh from items; a change in another tab only raises the notice and a namespace change re-captures silently.",
      "protected_refs": [
        "R-007",
        "R-009",
        "AC-016",
        "AC-019"
      ]
    },
    {
      "id": "INV-005",
      "type": "invariant",
      "statement": "V4 stores its collapsed state only in the version 3 entry of versionStates; the only new storage records are the currentContext handle and the session reconcile marker.",
      "protected_refs": [
        "R-001",
        "AC-003"
      ]
    },
    {
      "id": "INV-006",
      "type": "invariant",
      "statement": "components/shared/menu-tree, searchMenuLeaves and the V1/V3 304px layout are unchanged; the V4 tree is imported only by V4 desktop and mobile and is not exported publicly.",
      "protected_refs": [
        "R-001",
        "R-003",
        "AC-011",
        "AC-013"
      ]
    },
    {
      "id": "INV-007",
      "type": "invariant",
      "statement": "V4 stylesheets reference colours only through var(--sd-*) tokens with no hex literal and no colour input; every --sd-sidebar-v4-* colour token is emitted in light and dark and in every preset.",
      "protected_refs": [
        "R-005",
        "AC-013",
        "AC-021"
      ]
    },
    {
      "id": "INV-008",
      "type": "invariant",
      "statement": "A preset changes component tokens only through its components map of single values; every key must exist in $component-tokens, overrides replace the defaults before emission, and named presets remain light-only.",
      "protected_refs": [
        "R-010",
        "R-011",
        "AC-020",
        "AC-021"
      ]
    },
    {
      "id": "INV-009",
      "type": "invariant",
      "statement": "SdStorage.refresh() is additive: get, set, setSilent, has, remove, destroy and the observers keep their current behaviour, and refresh() broadcasts only when the stored value differs from memory.",
      "protected_refs": [
        "R-007",
        "AC-017"
      ]
    },
    {
      "id": "INV-010",
      "type": "invariant",
      "statement": "Context code reaches reload, window storage events and sessionStorage only through SD_LAYOUT_CONTEXT_RUNTIME; no spec or Showcase page performs a real reload.",
      "protected_refs": [
        "R-007",
        "R-009",
        "R-013",
        "AC-016",
        "AC-023"
      ]
    },
    {
      "id": "INV-011",
      "type": "invariant",
      "statement": "Mobile V4 renders only through the private V4 tree in mobile mode and the normalized V4 configuration; every close path of its drawer clears the query and returns focus to the trigger, and its bottom bar shows at most four destinations resolved from mobile.bottomBar plus More.",
      "protected_refs": [
        "R-002",
        "AC-009",
        "AC-010"
      ]
    },
    {
      "id": "INV-012",
      "type": "invariant",
      "statement": "V4 defaults are resolved only by normalizeSidebarConfiguration (itemShape pill, density compact, collapsedGroup flyout, bottomBar of at most four unique non-empty ids); V4 components read normalized values only and sd-layout selects V4 only for version 4.",
      "protected_refs": [
        "R-004",
        "AC-012"
      ]
    },
    {
      "id": "INV-013",
      "type": "invariant",
      "statement": "The context switcher renders rows from its configuration items with the active row derived from the SdLayoutContextService current id; it renders nothing without items, never opens with a single item, and shows search only above seven items unless searchable overrides it.",
      "protected_refs": [
        "R-006",
        "AC-014"
      ]
    },
    {
      "id": "INV-014",
      "type": "invariant",
      "statement": "Theme and layout documentation describe only shipped behaviour: nine named presets with the graphite values and the link/text-button limitation, and the V4 configuration, new menu fields and context API with the bootstrap rule; a script assertion checks these statements.",
      "protected_refs": [
        "R-012",
        "AC-022"
      ]
    }
  ],
  "history": [
    {
      "revision": 1,
      "active": [
        {
          "id": "R-001",
          "type": "requirement"
        },
        {
          "id": "R-002",
          "type": "requirement"
        },
        {
          "id": "R-003",
          "type": "requirement"
        },
        {
          "id": "R-004",
          "type": "requirement"
        },
        {
          "id": "R-005",
          "type": "requirement"
        },
        {
          "id": "R-006",
          "type": "requirement"
        },
        {
          "id": "R-007",
          "type": "requirement"
        },
        {
          "id": "R-008",
          "type": "requirement"
        },
        {
          "id": "R-009",
          "type": "requirement"
        },
        {
          "id": "R-010",
          "type": "requirement"
        },
        {
          "id": "R-011",
          "type": "requirement"
        },
        {
          "id": "R-012",
          "type": "requirement"
        },
        {
          "id": "R-013",
          "type": "requirement"
        },
        {
          "id": "AC-001",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-002",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-003",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-004",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-005",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-006",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-007",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-008",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-009",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-010",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-011",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-012",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-013",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-014",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-015",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-016",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-017",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-018",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-019",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-020",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-021",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-022",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-023",
          "type": "acceptance-criterion"
        },
        {
          "id": "A-001",
          "type": "assumption"
        },
        {
          "id": "A-002",
          "type": "assumption"
        },
        {
          "id": "A-003",
          "type": "assumption"
        },
        {
          "id": "A-004",
          "type": "assumption"
        },
        {
          "id": "D-001",
          "type": "decision"
        },
        {
          "id": "D-002",
          "type": "decision"
        },
        {
          "id": "D-003",
          "type": "decision"
        },
        {
          "id": "D-004",
          "type": "decision"
        },
        {
          "id": "D-005",
          "type": "decision"
        },
        {
          "id": "D-006",
          "type": "decision"
        },
        {
          "id": "D-007",
          "type": "decision"
        },
        {
          "id": "D-008",
          "type": "decision"
        },
        {
          "id": "D-009",
          "type": "decision"
        },
        {
          "id": "D-010",
          "type": "decision"
        },
        {
          "id": "D-011",
          "type": "decision"
        },
        {
          "id": "D-012",
          "type": "decision"
        },
        {
          "id": "D-013",
          "type": "decision"
        },
        {
          "id": "D-014",
          "type": "decision"
        },
        {
          "id": "D-015",
          "type": "decision"
        },
        {
          "id": "D-016",
          "type": "decision"
        },
        {
          "id": "D-017",
          "type": "decision"
        },
        {
          "id": "D-018",
          "type": "decision"
        }
      ],
      "tombstones": []
    },
    {
      "revision": 2,
      "active": [
        {
          "id": "R-001",
          "type": "requirement"
        },
        {
          "id": "R-002",
          "type": "requirement"
        },
        {
          "id": "R-003",
          "type": "requirement"
        },
        {
          "id": "R-004",
          "type": "requirement"
        },
        {
          "id": "R-005",
          "type": "requirement"
        },
        {
          "id": "R-006",
          "type": "requirement"
        },
        {
          "id": "R-007",
          "type": "requirement"
        },
        {
          "id": "R-008",
          "type": "requirement"
        },
        {
          "id": "R-009",
          "type": "requirement"
        },
        {
          "id": "R-010",
          "type": "requirement"
        },
        {
          "id": "R-011",
          "type": "requirement"
        },
        {
          "id": "R-012",
          "type": "requirement"
        },
        {
          "id": "R-013",
          "type": "requirement"
        },
        {
          "id": "AC-001",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-002",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-003",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-004",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-005",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-006",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-007",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-008",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-009",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-010",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-011",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-012",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-013",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-014",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-015",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-016",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-017",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-018",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-019",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-020",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-021",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-022",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-023",
          "type": "acceptance-criterion"
        },
        {
          "id": "A-001",
          "type": "assumption"
        },
        {
          "id": "A-002",
          "type": "assumption"
        },
        {
          "id": "A-003",
          "type": "assumption"
        },
        {
          "id": "A-004",
          "type": "assumption"
        },
        {
          "id": "D-001",
          "type": "decision"
        },
        {
          "id": "D-002",
          "type": "decision"
        },
        {
          "id": "D-003",
          "type": "decision"
        },
        {
          "id": "D-004",
          "type": "decision"
        },
        {
          "id": "D-005",
          "type": "decision"
        },
        {
          "id": "D-006",
          "type": "decision"
        },
        {
          "id": "D-007",
          "type": "decision"
        },
        {
          "id": "D-008",
          "type": "decision"
        },
        {
          "id": "D-009",
          "type": "decision"
        },
        {
          "id": "D-010",
          "type": "decision"
        },
        {
          "id": "D-011",
          "type": "decision"
        },
        {
          "id": "D-012",
          "type": "decision"
        },
        {
          "id": "D-013",
          "type": "decision"
        },
        {
          "id": "D-014",
          "type": "decision"
        },
        {
          "id": "D-015",
          "type": "decision"
        },
        {
          "id": "D-016",
          "type": "decision"
        },
        {
          "id": "D-017",
          "type": "decision"
        },
        {
          "id": "D-018",
          "type": "decision"
        },
        {
          "id": "D-019",
          "type": "decision"
        },
        {
          "id": "D-020",
          "type": "decision"
        },
        {
          "id": "D-021",
          "type": "decision"
        },
        {
          "id": "D-022",
          "type": "decision"
        },
        {
          "id": "D-023",
          "type": "decision"
        },
        {
          "id": "D-024",
          "type": "decision"
        },
        {
          "id": "D-025",
          "type": "decision"
        },
        {
          "id": "D-026",
          "type": "decision"
        },
        {
          "id": "D-027",
          "type": "decision"
        },
        {
          "id": "D-028",
          "type": "decision"
        },
        {
          "id": "D-029",
          "type": "decision"
        },
        {
          "id": "D-030",
          "type": "decision"
        },
        {
          "id": "INV-001",
          "type": "invariant"
        },
        {
          "id": "INV-002",
          "type": "invariant"
        },
        {
          "id": "INV-003",
          "type": "invariant"
        },
        {
          "id": "INV-004",
          "type": "invariant"
        },
        {
          "id": "INV-005",
          "type": "invariant"
        },
        {
          "id": "INV-006",
          "type": "invariant"
        },
        {
          "id": "INV-007",
          "type": "invariant"
        },
        {
          "id": "INV-008",
          "type": "invariant"
        },
        {
          "id": "INV-009",
          "type": "invariant"
        },
        {
          "id": "INV-010",
          "type": "invariant"
        }
      ],
      "tombstones": []
    },
    {
      "revision": 3,
      "active": [
        {
          "id": "R-001",
          "type": "requirement"
        },
        {
          "id": "R-002",
          "type": "requirement"
        },
        {
          "id": "R-003",
          "type": "requirement"
        },
        {
          "id": "R-004",
          "type": "requirement"
        },
        {
          "id": "R-005",
          "type": "requirement"
        },
        {
          "id": "R-006",
          "type": "requirement"
        },
        {
          "id": "R-007",
          "type": "requirement"
        },
        {
          "id": "R-008",
          "type": "requirement"
        },
        {
          "id": "R-009",
          "type": "requirement"
        },
        {
          "id": "R-010",
          "type": "requirement"
        },
        {
          "id": "R-011",
          "type": "requirement"
        },
        {
          "id": "R-012",
          "type": "requirement"
        },
        {
          "id": "R-013",
          "type": "requirement"
        },
        {
          "id": "AC-001",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-002",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-003",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-004",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-005",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-006",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-007",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-008",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-009",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-010",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-011",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-012",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-013",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-014",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-015",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-016",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-017",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-018",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-019",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-020",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-021",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-022",
          "type": "acceptance-criterion"
        },
        {
          "id": "AC-023",
          "type": "acceptance-criterion"
        },
        {
          "id": "A-001",
          "type": "assumption"
        },
        {
          "id": "A-002",
          "type": "assumption"
        },
        {
          "id": "A-003",
          "type": "assumption"
        },
        {
          "id": "A-004",
          "type": "assumption"
        },
        {
          "id": "D-001",
          "type": "decision"
        },
        {
          "id": "D-002",
          "type": "decision"
        },
        {
          "id": "D-003",
          "type": "decision"
        },
        {
          "id": "D-004",
          "type": "decision"
        },
        {
          "id": "D-005",
          "type": "decision"
        },
        {
          "id": "D-006",
          "type": "decision"
        },
        {
          "id": "D-007",
          "type": "decision"
        },
        {
          "id": "D-008",
          "type": "decision"
        },
        {
          "id": "D-009",
          "type": "decision"
        },
        {
          "id": "D-010",
          "type": "decision"
        },
        {
          "id": "D-011",
          "type": "decision"
        },
        {
          "id": "D-012",
          "type": "decision"
        },
        {
          "id": "D-013",
          "type": "decision"
        },
        {
          "id": "D-014",
          "type": "decision"
        },
        {
          "id": "D-015",
          "type": "decision"
        },
        {
          "id": "D-016",
          "type": "decision"
        },
        {
          "id": "D-017",
          "type": "decision"
        },
        {
          "id": "D-018",
          "type": "decision"
        },
        {
          "id": "D-019",
          "type": "decision"
        },
        {
          "id": "D-020",
          "type": "decision"
        },
        {
          "id": "D-021",
          "type": "decision"
        },
        {
          "id": "D-022",
          "type": "decision"
        },
        {
          "id": "D-023",
          "type": "decision"
        },
        {
          "id": "D-024",
          "type": "decision"
        },
        {
          "id": "D-025",
          "type": "decision"
        },
        {
          "id": "D-026",
          "type": "decision"
        },
        {
          "id": "D-027",
          "type": "decision"
        },
        {
          "id": "D-028",
          "type": "decision"
        },
        {
          "id": "D-029",
          "type": "decision"
        },
        {
          "id": "D-030",
          "type": "decision"
        },
        {
          "id": "INV-001",
          "type": "invariant"
        },
        {
          "id": "INV-002",
          "type": "invariant"
        },
        {
          "id": "INV-003",
          "type": "invariant"
        },
        {
          "id": "INV-004",
          "type": "invariant"
        },
        {
          "id": "INV-005",
          "type": "invariant"
        },
        {
          "id": "INV-006",
          "type": "invariant"
        },
        {
          "id": "INV-007",
          "type": "invariant"
        },
        {
          "id": "INV-008",
          "type": "invariant"
        },
        {
          "id": "INV-009",
          "type": "invariant"
        },
        {
          "id": "INV-010",
          "type": "invariant"
        },
        {
          "id": "INV-011",
          "type": "invariant"
        },
        {
          "id": "INV-012",
          "type": "invariant"
        },
        {
          "id": "INV-013",
          "type": "invariant"
        },
        {
          "id": "INV-014",
          "type": "invariant"
        }
      ],
      "tombstones": []
    }
  ]
}
```
