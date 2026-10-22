# Handoff: sd-upload-file (ô tải lên + popup preview)

## Overview
Redesign `components/upload-file` gồm bốn phần, làm theo thứ tự:
- **H1. Helper dùng chung.** Resolver icon theo đuôi file và formatter dung lượng, dùng chung cho field và popup.
- **H2. Popup preview (phương án A).** Viewer nền tối, header theo file, toolbar theo loại file, filmstrip ở đáy, xem PDF inline, có trạng thái tải/lỗi.
- **H3. Field, variant `default`.** Ba cách trình bày theo `type` (image / document / file), badge xoá hiện khi hover, vùng thả có trạng thái, trạng thái theo từng file.
- **H4. Field, variant `inline`.** Một dòng cao 32px để dùng trong sd-table và danh sách dày.

Ngoài phạm vi:
- Phương án B của popup (danh sách bên phải). Chỉ để tham khảo.
- Tiến độ tải lên theo %. `SdUploadFileFuncUpload` chỉ trả `Promise<string[]>` nên thanh tiến độ chạy không xác định.
- Mọi thay đổi với `ISdUploadFileConfiguration` và `SD_UPLOAD_FILE_CONFIGURATION`.

## About the Design Files
`Upload File Spec.dc.html` là **bản tham chiếu thiết kế viết bằng HTML**, không phải mã production để copy. Mở bằng trình duyệt; `support.js` phải nằm cùng thư mục. Prop `showCurrent` ẩn/hiện phần "Hiện trạng", `showAnnotations` ẩn/hiện badge đánh số. Rê chuột vào hàng tài liệu và ảnh trong mục type=file để xem badge xoá.

Dựng lại bằng template Angular và SCSS hiện có: standalone component, signal input, token `--sd-*`, theo đúng `CLAUDE.md`. Không copy markup hay inline style.

## Fidelity
**High-fidelity** về bố cục, kích thước, khoảng cách và hành vi. Hex trong HTML là giá trị tham chiếu của palette mặc định. Map sang token có sẵn hoặc biểu thức `color-mix()` từ token đó; không đưa hex vào SCSS (`check:scss-hex` phải xanh). Bảng "Vai trò màu" ở cuối liệt kê từng giá trị kèm vai trò.

Ảnh trong mockup là ô kẻ sọc giữ chỗ.

## Quy tắc repo bắt buộc
- Chỉ sửa `versions/v19/**`, rồi chạy `npm run sync` và `npm run check:sync`.
- Component token chỉ khai báo trong `_component-tokens.scss`, có fallback khi tham chiếu. Cập nhật THEME.md.
- Viết spec RED trước khi sửa hành vi. Chạy full Karma tuần tự.
- Rà API consistency theo "Review bắt buộc" trong CLAUDE.md.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh. Dùng lại key đang có nếu đúng nghĩa.
- Hover chỉ là lớp hiển thị bổ sung. Mọi hành động phải dùng được bằng bàn phím và `pointer: coarse`. Transition tắt khi `prefers-reduced-motion`.

## Hiện trạng cần sửa (tóm tắt)
Popup (`components/preview/*`):
- Header luôn là "Xem trước"; tên file chỉ hiện ở nhánh tài liệu; không có vị trí "3 / 7" hay dung lượng.
- Không có toolbar. Ảnh không tải xuống được, không zoom/xoay/mở tab mới.
- Nút tải xuống ở nhánh tài liệu dùng key `core.component.upload-file.upload`.
- PDF chỉ hiện icon 64px dù có URL.
- Rail dọc 120px và nút trước/sau vẫn hiện khi chỉ có 1 file. Nút điều hướng dùng `z-index: var(--sd-z-overlay, 9999)` và rgba cứng. Không có phím ←/→.
- `#scrollView` tìm id `thumbnailImage{i}` nhưng thumbnail không gán id nên rail không cuộn theo.
- Khung cố định 60vh trên nền surface-muted; không có trạng thái đang tải; lỗi không có hành động.
- `thumbnailPosition` khai báo nhưng không dùng. Thuộc tính `fill`/`priority` trên `<img>` nhưng không import NgOptimizedImage.

Field (`upload-file.component.*`):
- Ô tải lên 50×50 chỉ có icon, opacity .6, hover giảm còn .3. Không có trạng thái khi đang kéo tệp vào.
- Badge xoá đặt ở `top/right: -8px` trong khi `:host` có `overflow-y: hidden` và ô chỉ có margin 3px, nên badge bị cắt.
- Ô ảnh opacity .9; hover phủ đen 40% và giảm ảnh còn .2.
- Ảnh một hàng ngang cuộn ngang; tài liệu ở bên dưới với viền đứt nét.
- Bấm tên tài liệu là tải file về. Dung lượng luôn tính KB (`fileSize / 1024`).
- Lỗi chỉ báo bằng toast.
- Màu cứng (`rgba(242,243,244)`, `rgba(0,0,0,.4)`, `#e6e6e6`, `grey`), `display: table`, class thừa `.c-img-eror`, `.c-icon`, `.mat-icon-button`. Bảng map icon lặp ở 3 chỗ, ppt/pptx map nhầm sang icon xls/xlsx.

---

## H1. Helper dùng chung

### Icon theo đuôi file
- Một hàm (hoặc pipe pure) `ext → đường dẫn assets/file-types/{ext}.svg`, dựa trên danh sách đuôi thực có trong `src/assets/file-types/` (khoảng 50 file). Đuôi không có icon thì fallback `file.svg`.
- Thay cả ba bảng `[class]` + `content: url(...)` đang lặp trong `upload-file.component.html/.scss` và `preview.component.html/.scss`.
- Sửa ppt/pptx sang đúng icon.

### Dung lượng
- Dưới 1 MB: `{n} KB`, số nguyên làm tròn lên (tối thiểu 1 KB). Từ 1 MB trở lên: `{n} MB`, 1 chữ số thập phân. Dùng format số theo locale hiện tại (vi: `2,4 MB`).
- Dòng phụ của file: `{EXT} · {size}`, EXT viết hoa. Không có size thì chỉ hiện EXT.
- Nguồn: `fileSize` của PreviewFile. Nếu luồng `details` chỉ có `SdUploadFileDetail.size` (MB) thì map sang cùng đơn vị trước khi format. Kiểm tra đơn vị thực tế trong code.

---

## H2. Popup preview · phương án A

API giữ nguyên: `open(previewFiles, index)`, output `download`, `close`. Bỏ `thumbnailPosition` nếu không được export ra public API (kiểm tra `index.ts`); nếu đang public thì deprecate.

### Khung
| Phần | Giá trị |
|---|---|
| Kích thước | `width: min(1200px, 100vw - 48px)`, `height: calc(100vh - 48px)` |
| ≤ 600px | full-screen, bo góc 0 |
| Bo góc | 12px (dùng token radius gần nhất) |
| Nền | `viewer-bg` (xem bảng màu) |
| Bố cục | cột: top bar 56px · stage `flex: 1` · filmstrip 88px |

Nếu `sd-modal` không cho tuỳ biến chrome đến mức này, dùng CDK overlay/dialog trực tiếp và trình phương án trong kế hoạch.

### Top bar (56px, padding `0 8px 0 16px`, viền dưới 1px `viewer-divider`)
Trái sang phải:
1. **Thông tin file** (`flex: 1; min-width: 0`), gap 12:
   - Icon loại file 22px, màu `viewer-accent`.
   - Tên file 15px/20px weight 500, một dòng, ellipsis.
   - Dòng phụ 12px/16px `viewer-fg-muted`: `JPG · 1,8 MB`.
2. **Vị trí** `3 / 7`: 13px weight 500, `font-variant-numeric: tabular-nums`, `viewer-fg-muted`, padding `0 12px`. Có `aria-live="polite"`. Ẩn khi chỉ có 1 file.
3. **Nhóm zoom** (chỉ với ảnh): `zoom_out` · nút `%` · `zoom_in` · `rotate_right`.
   - Nút `%` cao 32, padding `0 8px`, radius 6, 13px weight 500, tabular-nums. Bấm vào để về vừa khung.
4. Divider 1×24px, margin `0 6px`.
5. `download` · `open_in_new`.
6. Divider.
7. `close` (icon 22).

Icon button: 40×40, radius 8, icon 20, màu `viewer-fg`. Hover nền `viewer-control-bg`. Focus-visible dùng vòng focus chuẩn của repo.

**Toolbar theo loại file:**
| Loại | Zoom/xoay | Tải xuống | Mở tab mới |
|---|---|---|---|
| Ảnh (`isPreviewImage`) | có | có | có |
| PDF | không (viewer trình duyệt có sẵn) | có | có |
| Không xem trước / lỗi / đang tải | không | có | có, nếu có URL |

≤ 600px: ẩn nhóm zoom (người dùng pinch-zoom), giữ các nút còn lại.

### Zoom và xoay (ảnh)
- Mặc định "vừa khung": `object-fit: contain` trong stage.
- Các mức: vừa khung → 50 → 75 → 100 → 150 → 200 → 300 → 400%. Nút `%` hiện mức hiện tại; khi đang vừa khung thì hiện % thực tế.
- Khi lớn hơn vừa khung thì kéo để pan; con trỏ `grab`/`grabbing`.
- Xoay 90° mỗi lần bấm.
- Đổi file thì reset zoom và xoay.

### Stage
- `position: relative`, padding `24px 72px` (72px là chỗ cho nút điều hướng). Nội dung căn giữa.
- **Nút trước/sau:** tròn 40px, nền `viewer-control-bg`, icon `chevron_left`/`chevron_right` 24px, cách mép 16px, căn giữa theo chiều dọc. Không đè lên ảnh.
  - Ẩn khi chỉ có 1 file.
  - Ở file đầu/cuối thì disabled (opacity .38), không quay vòng. Đây là thay đổi hành vi so với `updateCurrentImage` hiện tại.
- Bỏ `z-index: var(--sd-z-overlay)` và rgba cứng.

### Filmstrip (88px, viền trên 1px `viewer-divider`)
- Căn giữa, gap 8, `overflow-x: auto`. Ẩn khi chỉ có 1 file.
- Mỗi mục là `<button>` 56×56, radius 6, `aria-label` = tên file, mục đang chọn có `aria-current="true"`.
  - Ảnh: `object-fit: cover`.
  - Tài liệu: nền `viewer-thumb-bg`, cột căn giữa gap 3: icon 22 (màu `viewer-fg-muted`) + đuôi file 9px weight 600, uppercase. Màu đuôi theo nhóm: PDF đỏ, Word xanh dương, Excel xanh lá, còn lại `viewer-fg-muted`.
  - Lỗi: icon `broken_image`.
- Mục không chọn: opacity .6, hover 1. Mục đang chọn: opacity 1, `outline: 2px solid viewer-accent; outline-offset: 2px`.
- Khi đổi file, cuộn filmstrip để mục đang chọn nằm giữa bằng `container.scrollTo({ left, behavior })` (behavior `auto` khi `prefers-reduced-motion`). Bỏ `#scrollView` và `scrollIntoView`.

### Trạng thái của stage
| Trạng thái | Nội dung |
|---|---|
| **Ảnh** | `<img>` contain. Đang tải → trạng thái Đang tải. `error` → Lỗi. |
| **PDF** | `<iframe>` trỏ tới URL, chiếm toàn bộ stage (bỏ padding ngang 72px, giữ nút điều hướng nổi trên lề). Có `title` = tên file. Không chắc nhúng được (server chặn frame) thì vẫn có nút "Mở tab mới" trên toolbar. Trình cách phát hiện lỗi nhúng trong kế hoạch; không phát hiện tin cậy được thì chấp nhận fallback qua toolbar. |
| **Không xem trước** (docx, xlsx, zip…) | Cột căn giữa gap 6, padding ngang 16: icon 40 · tên 14px weight 500 · dòng phụ 12px `viewer-fg-muted` `DOCX · 640 KB · Không xem trước được` · margin-top 8 · hàng nút gap 8: **Tải xuống** (filled, cao 36, radius 999, padding `0 16px 0 12px`, icon `download` 18 + chữ 14/500, nền `viewer-accent`, chữ `viewer-on-accent`) và **Mở tab mới** (text button, chữ `viewer-accent`). |
| **Đang tải** | Spinner 32px nét 3px (track `viewer-divider` đậm hơn, đầu `viewer-accent`) + "Đang tải…" 13px `viewer-fg-muted`, gap 12. Chỉ hiện sau 150ms để tránh nháy. |
| **Lỗi** | Icon `broken_image` 36 màu `viewer-error` · "Không tải được tệp" 14/500 · "Thử lại hoặc tải xuống để mở bằng ứng dụng khác." 12px muted · hàng nút: **Thử lại** (outlined, cao 36, radius 999, viền 1px `viewer-fg` 30%) + **Tải xuống** (text, `viewer-accent`). Thử lại = tải lại src. |

### Bàn phím và a11y
- ←/→: file trước/sau. `+`/`=`/`-`: zoom. `0`: về vừa khung. Esc: đóng.
- Khi mở, focus vào stage (`tabindex="-1"`). Khi đóng, trả focus về phần tử đã mở popup.
- Mọi icon button có `aria-label` qua i18n.

---

## H3. Field · variant `default`

### Label và bộ đếm
- Bộ đếm `{n} / {max}` đặt **ngay sau label** trên cùng một dòng (baseline, gap 8px, cho phép wrap), không đẩy ra mép phải.
  - Kiểu chữ: 12px weight 500, tabular-nums, `text-secondary`.
  - Chỉ hiện khi `max > 1` và field không disabled.
- Mô tả (`generatedDescription`) giữ dưới label như hiện nay.
- Khi dùng `sdLabelDef` custom, trình cách đặt bộ đếm trong kế hoạch.

### Kích thước ô
- Đổi mặc định `previewWidth`/`previewHeight` từ `50px` → `72px`. Đây là **Changed** trong CHANGELOG.
- Container lưới: `display: flex; flex-wrap: wrap; gap: 8px; padding-top: 8px; padding-right: 8px`. Padding là chỗ cho badge xoá nhô ra ngoài. Bỏ `overflow-y: hidden` và cuộn ngang trên `:host`.

### type = image
Thứ tự: **ô tải lên đứng đầu**, sau đó là ảnh.

**Ô tải lên** (kích thước bằng ô ảnh):
- Viền 1px dashed `border-strong`, radius 8, không opacity.
- Cột căn giữa gap 4: icon `add_photo_alternate` 24 + "Thêm ảnh" 11px/14px weight 500, màu primary.
- Hover/focus và khi đang kéo tệp vào: nền primary 6%, viền primary.
- Ẩn khi đủ `max` hoặc khi disabled (giữ như hiện nay).

**Ô ảnh:**
- Radius 8, `box-shadow: inset 0 0 0 1px` text 8%, `object-fit: cover`, không opacity.
- Bấm ô → `preview()` mở popup tại đúng index của ảnh đó. Bỏ icon zoom và lớp phủ 40%.
- Hover/focus-within: phủ scrim 24% (radius 8), hiện badge xoá.
- Kéo đổi thứ tự (cdkDrag) giữ như hiện nay. Placeholder và preview khi kéo dùng radius 8 và token, không `display: table`.

**Ô đang tải lên:** hiện ảnh local ngay (object URL hoặc `previewSrc` từ FileReader), phủ surface 60%, spinner 22px nét 2.5px màu primary. `role="status"` giữ như hiện tại.

**Ô lỗi:** nền `error-container`, cột căn giữa gap 2: icon `error` 20 + "Thử lại" 11px weight 500, màu `on-error-container`. Bấm để thử lại. Badge xoá luôn hiện.

### Badge xoá (dùng chung cho ô ảnh và hàng tài liệu)
| Thuộc tính | Giá trị |
|---|---|
| Kích thước | 20×20, tròn |
| Vị trí | `position: absolute; top: -7px; right: -7px` so với ô/hàng |
| Nền / viền | `surface` / 1px `border` |
| Bóng | `0 1px 2px` (dùng scale shadow nhỏ nhất có sẵn) |
| Icon | `close` 14px, `text-secondary` |
| Hover / focus-visible | icon và viền màu `error` |
| Hiện | khi hover hoặc `:focus-within` của ô/hàng; ẩn bằng `opacity: 0` + `visibility: hidden` (không `display: none`) để giữ transition |
| `pointer: coarse` | luôn hiện; vùng chạm 44×44 bằng pseudo-element trong suốt, phần hình vẫn 20px |
| a11y | `<button type="button">`, `aria-label` = "Xoá {tên file}" |

Hàng đang tải lên và hàng lỗi dùng nút hành động trong hàng (xem dưới), không dùng badge.

### type = document
**Vùng thả** (rộng hết field):
- `min-height: 56px`, viền 1px dashed `border-strong`, radius 8, padding `12px 16px`.
- Hàng căn giữa gap 10: icon `upload_file` 24 primary + "Kéo thả tệp vào đây hoặc **chọn tệp**" 14px `text-secondary` ("chọn tệp" là primary, weight 500).
- Trạng thái:
  - Hover/focus: nền primary 6%.
  - Đang kéo tệp vào: viền solid primary, nền primary 6%, nội dung đổi thành icon + "Thả để tải lên" màu primary weight 500. Bật/tắt bằng class trong 4 listener dragenter/dragover/dragleave/drop đã có sẵn; đếm enter/leave để không nháy khi rê qua phần tử con.
  - Lỗi bắt buộc: viền dashed `error`.
  - Ẩn khi đủ `max` hoặc disabled.
- Giữ `role="button"`, `tabindex="0"`, Enter/Space như hiện tại.

**Danh sách tài liệu** (margin-top 8, gap 4). Mỗi hàng:
- `position: relative; min-height: 52px; padding: 6px 8px 6px 12px`, viền 1px solid `border`, radius 8, nền `surface`. Hover nền primary ~5%.
- Hàng flex gap 12:
  - Icon file 24 (H1).
  - Khối chữ (`flex: 1; min-width: 0`): tên 14px/20px ellipsis màu `text` (không phải màu link) và dòng phụ 12px/16px `text-secondary` (H1).
  - Nút tải xuống 32×32, radius 6, icon 20 `text-secondary`, luôn hiện.
- Badge xoá ở góc trên phải (không chiếm chỗ trong hàng).
- Bấm hàng hoặc tên → mở popup tại đúng file đó (không tải xuống nữa). Tên vẫn là `<button>` để có focus.

**Hàng đang tải lên:** dòng phụ "Đang tải lên…", nút huỷ (`close`, 32px) luôn hiện trong hàng, không có nút tải xuống. Thanh 2px ở đáy hàng: track primary 16%, thanh primary rộng 38% chạy không xác định. Tắt animation khi reduced-motion và để thanh đứng yên.

**Hàng lỗi:** viền `error` nhạt (≈ error-container), nền error 3%, icon `error` 24 màu error, dòng phụ là lý do lỗi màu error.
- Tải lên thất bại: nút `refresh` (Thử lại) + `close`.
- Sai định dạng / quá dung lượng: chỉ có `close`.

### Lỗi giữ trong danh sách (cần duyệt thiết kế)
Hiện tại lỗi định dạng, dung lượng và tải lên chỉ báo bằng toast. Đề xuất giữ file lỗi trong danh sách với lý do, cho đến khi người dùng xoá hoặc thử lại thành công. File lỗi **không** được nằm trong giá trị của form control. Toast chỉ còn cho lỗi chung (quá số lượng). Trình phương án lưu trạng thái lỗi (cần giữ `File` để thử lại) trước khi code.

### type = file (ảnh và tài liệu)
- Hàng trên: lưới như type=image. Ô tải lên đứng đầu, nhận mọi loại tệp, nhãn "Tải lên" với icon `upload_file`.
- Hàng dưới: danh sách tài liệu như type=document. Không có vùng thả rộng.
- Kéo đổi thứ tự trong từng nhóm. Kiểm tra thứ tự giá trị form hiện ánh xạ thế nào giữa hai nhóm và trình phương án trước khi đổi. Không làm được cho tài liệu thì giữ như cũ và ghi lại.

### Disabled / chỉ xem
- Không có ô tải lên, vùng thả hay badge xoá.
- Ảnh giới hạn `maxOfImage` như hiện nay. Ô cuối phủ kín scrim 60% với "+N" 16px weight 500 màu on-scrim. Bỏ hộp 65% ở giữa.
- Bấm ô nào (kể cả ô +N) thì mở popup tại ảnh đó.
- Hàng tài liệu chỉ có nút tải xuống.

### Lỗi bắt buộc
- Message dưới field dùng cùng kiểu lỗi của các field khác: icon `error` 16 + chữ 12px/16px màu error, gap 4. Bỏ `padding: 4px 8px` riêng.
- Giữ `role="alert"`.

---

## H4. Field · variant `inline`
Input mới: `variant: 'default' | 'inline'`, mặc định `'default'` (Added).

- Một dòng, `height: 32px`, flex gap 4, không wrap, `min-width: 0`.
- Thứ tự: ô tải lên → ảnh → chip tài liệu → "+N".
  - **Ô tải lên:** 32×32, viền 1px dashed `border-strong`, radius 6, icon `upload_file` 18 primary. Ẩn khi đủ `max` hoặc disabled.
  - **Ảnh:** 32×32, radius 6, cover, inset border như default. Bấm → popup.
  - **Chip tài liệu:** cao 32, padding `0 8px`, radius 6, nền surface-variant. Icon file 18 + tên 12px, `max-width: 140px`, ellipsis. Bấm → popup.
  - **"+N":** `min-width: 32px`, padding `0 6px`, radius 6, nền `border`, 12px weight 500 `text-secondary`. Bấm → popup tại mục ẩn đầu tiên.
- Số mục hiển thị (ảnh + tài liệu) = `maxOfImage`; phần còn lại gộp vào "+N".
- Rỗng: sau ô tải lên là "Chưa có tệp" 13px `text-tertiary` (cần i18n key).
- Badge xoá: 16×16, icon 11, `top/right: -4px`, hiện khi hover/focus mục (`pointer: coarse` luôn hiện, vùng chạm 44). Container cần `padding-top: 4px` hoặc cell không cắt overflow; kiểm tra trong sd-table.
- Không kéo đổi thứ tự.
- Kéo tệp vào: cả component đổi nền primary 6%, radius 6.
- Đang tải lên: thumbnail/chip hiện spinner 16px. Lỗi: chip/ô viền error + icon `error`; bấm để thử lại.
- Label, mô tả và bộ đếm không hiện ở inline (cell đã có header cột). `required` vẫn validate; lỗi hiện bằng viền error quanh ô tải lên.

---

## i18n
Dùng lại key đang có nếu đúng nghĩa (`loading`, `remove`, `please-upload`, `upload-failed`, `size-exceeded`, `too-many-files`…). Cần thêm (đặt tên theo quy ước hiện có):
- tải xuống (thay key `upload` đang dùng sai ở popup), mở tab mới, phóng to, thu nhỏ, về vừa khung, xoay, file trước, file sau
- thử lại, không tải được tệp, gợi ý khi lỗi, không xem trước được
- thêm ảnh, tải lên (nhãn ô), kéo thả tệp vào đây hoặc, chọn tệp, thả để tải lên, chưa có tệp
- aria: "Xoá {name}", vị trí "{index} / {total}"

Đủ 5 locale vi/en/ja/ko/zh.

## Vai trò màu
Hex là giá trị đã giải của palette mặc định trong mockup. Map sang token có sẵn; vai trò nào chưa có token thì thêm component token `--sd-upload-file-*` trong `_component-tokens.scss` (có bản dark). Không hex trong SCSS.

| Vai trò | Hex tham chiếu | Gợi ý |
|---|---|---|
| primary | #005cbb | `--sd-primary` |
| primary 6% (hover, dragover) | #eef3fb | `color-mix(in srgb, var(--sd-primary) 6%, var(--sd-surface))` |
| primary ~5% (hover hàng) | #f3f6fb | `color-mix(... 5% ...)` |
| text | #1a1b1f | `--sd-text` |
| text-secondary | #44474f | `--sd-text-secondary` |
| text-tertiary | #74777f | token tertiary/placeholder có sẵn |
| border | #e0e2ec / #c4c6d0 | `--sd-border` |
| border-strong (viền dashed) | #74777f | `--sd-border-strong` |
| surface | #fdfbff | `--sd-surface` |
| surface-variant (chip) | #eff0f7 | surface-variant / muted có sẵn |
| error | #ba1a1a | `--sd-error` |
| error-container | #ffdad6 | token error-container có sẵn |
| on-error-container | #93000a | token tương ứng |
| scrim 24% / 60% | rgba(0,0,0,.24) / rgba(20,21,24,.6) | `color-mix(in srgb, var(--sd-scrim, …) 24%, transparent)` |
| viewer-bg | #141518 | component token; gợi ý từ inverse-surface hoặc `color-mix` text + black |
| viewer-fg | #e3e3e8 | component token (inverse-on-surface) |
| viewer-fg-muted | #a3a4ab | viewer-fg 70% |
| viewer-divider | rgba(255,255,255,.08) | viewer-fg 8% |
| viewer-control-bg | rgba(255,255,255,.10) | viewer-fg 10% |
| viewer-thumb-bg | #2a2b31 | viewer-fg 10% trên viewer-bg |
| viewer-accent | #a8c7fa | inverse-primary |
| viewer-on-accent | #062e6f | on-primary-container hoặc tương đương |
| viewer-error | #ffb4ab | error tone sáng (dark error) |
| Màu đuôi file (filmstrip) | PDF #ff8a80, Word #8ab4f8, Excel #81c995 | component token; hoặc chỉ dùng viewer-fg-muted nếu không muốn thêm token |

Viewer luôn là nền tối ở cả light và dark theme. Kiểm tra contrast: chữ ≥ 4.5:1, icon/viền ≥ 3:1.
