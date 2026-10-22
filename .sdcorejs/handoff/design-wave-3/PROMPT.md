Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`. Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist.

Gói thiết kế này cần nằm ở `.sdcorejs/handoff/design-wave-3/`. Nếu tôi upload dạng zip thì giải nén vào đó; không đặt ở `design/` root vì CLAUDE.md cấm. Gói gồm:
- `README.md`: tổng quan, thứ tự, quy tắc chung.
- `badge.md`, `avatar.md`, `tab-router.md`, `upload-file.md`: thông số đầy đủ, là nguồn chính.
- `Badge Review.dc.html`, `Avatar Review.dc.html`, `Tab Router Review.dc.html`, `Upload File Spec.dc.html`: hình minh hoạ, một số phần bấm được. Mở bằng trình duyệt; `support.js` phải nằm cùng thư mục.

HTML chỉ là bản tham chiếu. Dựng lại bằng template Angular và SCSS hiện có cùng token `--sd-*`. Không copy markup hay inline style. Không thêm hex (`check:scss-hex` phải xanh).

Đợt này cần đợt 1 và đợt 2 đã merge (`--sd-control-height-*`, token control/panel, vòng focus chuẩn). Nếu chưa có thì dừng và báo.

## Trước khi code
Đọc hết README, bốn file spec, md hiện có của từng component và toàn bộ source liên quan. Sau đó trình kế hoạch ngắn gồm:
- Danh sách file sẽ đổi và commit dự kiến cho từng phần.
- Bảng map hex trong spec sang token có sẵn hoặc component token mới (kèm giá trị light/dark).
- **Badge:**
  - Contrast của `solid` warning, và phương án nếu dưới 4.5:1.
  - Cách phát hiện chữ bị cắt để bật tooltip.
  - Cách sd-badge-picker dựng trên sd-select, hay nếu không được thì trên CDK overlay.
- **Avatar:**
  - Ảnh hưởng của việc đổi host sang `inline-flex`.
  - Cách sd-avatar-group render avatar, và cách mở popover.
- **Tab router:**
  - Cách cuộn tới tab đang mở.
  - Cách roving tabindex phối hợp với cdkDrag.
- **Upload file:** các điểm "cần duyệt" trong `upload-file.md`:
  - Cách xử lý PDF không nhúng được.
  - Cách lưu trạng thái lỗi của từng file và giữ `File` để thử lại.
  - Thứ tự giá trị form khi type=file.
  - Cách đặt bộ đếm khi dùng `sdLabelDef`.
  - Dùng sd-modal hay CDK cho popup.
  - `thumbnailPosition` có public không.
- Danh sách i18n key mới và key dùng lại.

Dừng chờ tôi duyệt.

## Phạm vi, làm theo thứ tự, mỗi bước một commit (spec trước)
1. **sd-badge** (`badge.md`)
   - 1a. Thang 20/24/28, một dòng + ellipsis, số đếm 99+, description 12px, viền tag, focus giữ bo góc, hover/active khi bấm được, chấm CSS, tooltip có điều kiện, component token.
   - 1b. Type `solid`, `dot`, `pair`; input `label`, `pulse`.
   - 1c. `sd-badge-picker`, `SD_BADGE_TYPE_OPTIONS`, `SD_BADGE_ICON_PRESET`. Spec cho: bản nháp, ghi khi đóng, Esc huỷ, `sdChange` chỉ phát khi có thay đổi, ẩn/giữ icon theo type.
2. **sd-avatar** (`avatar.md`)
   - 2a. `status`, `statusLabel`, `statusPulse`, `name`, hình học chấm, `--sd-avatar-status-ring`, a11y.
   - 2b. `sd-avatar-group`: lấn `round(size × 0.15)`, z-index giảm dần, "+N", popover, `moreClick`, quy tắc "dư 1 thì hiện luôn".
3. **sd-tab-router** (`tab-router.md`)
   - 3a. Giao diện thanh tab mới, bỏ sd-badge trong tab, sửa điều kiện ẩn khi ≤ 1 tab (kèm chuyển động), dọn code.
   - 3b. Cuộn khi tràn, lớp mờ, nút và menu danh sách tab; bỏ compact/`checkUI`.
   - 3c. Bàn phím tablist + roving tabindex, kéo thả, menu chuột phải, `closeOthers`.
   - 3d. `SdTabInfo.dirty` + chấm, `syncBrowserTitle`.
4. **sd-upload-file** (`upload-file.md`, làm theo các bước H1–H4 trong file đó)
   - 4a. H1: helper icon theo đuôi file, formatter dung lượng.
   - 4b. H2: popup preview phương án A.
   - 4c. H3: field variant default (ba cách trình bày theo type, badge xoá, vùng thả, trạng thái theo từng file, bộ đếm, chỉ xem).
   - 4d. H4: variant inline.

## Ràng buộc
- Không đổi hay rename public API, input/output, keyboard contract, trừ những gì các file spec liệt kê.
- `sd-badge`: giữ 6 input boolean màu.
- `ISdUploadFileConfiguration`, `SD_UPLOAD_FILE_CONFIGURATION` và các hàm upload/details/download giữ nguyên.
- Giữ các cải thiện a11y đang có trong template của từng component.
- Rà API consistency theo mục "Review bắt buộc" của CLAUDE.md. Ghi kết quả vào PR description.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh.
- Hover chỉ là lớp hiển thị bổ sung; mọi thứ vẫn dùng được bằng bàn phím và `pointer: coarse`. Transition và animation tắt khi `prefers-reduced-motion`.

## Kiểm tra sau mỗi bước và trước khi xong
```
cd versions/v19
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage
npm run lint
cd ../..
npm run test:theme
npm run check:scss-hex
npm run sync
npm run check:sync
```

Cuối cùng:
- Build lại lib v19, chạy `npm --prefix showcase run link:library`.
- Kiểm tra trên showcase:
  - Badge: đủ 6 type × 6 màu × 3 cỡ, số đếm, tên dài, có description, bấm được, sd-badge-picker.
  - Avatar: các cỡ 24–96 có chấm, pulse, sd-avatar-group với `max` 3/4/5 và trường hợp dư 1 người.
  - Tab router: 1 tab, vài tab, 15+ tab (tràn), kéo thả, menu chuột phải, dirty, `syncBrowserTitle`, chỉ dùng bàn phím.
  - Upload file: theo danh sách trong `upload-file.md`.
  - Chế độ: light, dark (`data-sd-theme="dark"`), preset default và graphite, forced-colors.
  - Màn rộng, ≤ 600px, `pointer: coarse`.
- Cập nhật md của từng component, `THEME.md` (token mới), và mục `## [Unreleased]` trong `CHANGELOG.md`.

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi bước, báo lại:
- file đã đổi
- spec đã thêm hoặc sửa
- kết quả các lệnh kiểm tra
- ảnh chụp showcase trước/sau
- điểm nào lệch khỏi thông số và lý do
