# Kế hoạch đợt 3 (badge, avatar, tab-router, upload-file)

Trình theo mục "Trước khi code" của `PROMPT.md`. Đã duyệt (2026-10-21): mục 1–6 và làm trên nhánh hiện tại
`feat/design-handoff-wave-1-2` (đợt 1+2 chưa merge, user chấp nhận lên cùng). Mục 7 (i18n) và 8 (quyết định 2–15)
duyệt nguyên văn cùng ngày.
`LIB` = `versions/v19/projects/sdcorejs-angular`.

## 1. File và commit
Mỗi bước một commit, spec RED trước, `npm run sync`, CHANGELOG + md cùng commit.

| Bước | File chính |
|---|---|
| 1a badge: thang, ellipsis, số đếm, focus, hover, chấm CSS, tooltip | `components/badge/src/badge.component.{ts,html,scss}`, `badge.component.spec.ts`, `badge-layout.component.spec.ts`, `sd-badge.md`; `components/table/src/components/desktop-cell/view/view.component.html` (QĐ 3, 4); spec `tab-router-item`; showcase badge |
| 1b `solid`/`dot`/`pair`, `label`, `pulse` | badge ts/html/scss/spec/md, showcase |
| 1c `sd-badge-picker` | MỚI `components/badge/src/badge-picker.component.*`, `badge-picker.constants.ts`, `sd-badge-picker.md`; export; i18n 5 locale; showcase + registry |
| 2a avatar status | `components/avatar/src/avatar.component.*`, spec, `sd-avatar.md`; token `avatar-status-ring` + `core-theme.test.mjs`; sửa `sd-form-directives.md:142`; showcase |
| 2b `sd-avatar-group` | MỚI `components/avatar/src/avatar-group.component.*`, `sd-avatar-group.md`; export; i18n; showcase |
| 3a thanh tab, bỏ badge, điều kiện ẩn, dọn code | `tab-router-item.*`, `tab-router-nav.*`, outlet scss; token tab-router; spec; md; showcase có route con thật |
| 3b cuộn, lớp mờ, nút + menu danh sách | nav; gỡ `mode`/`checkUI`; i18n; spec |
| 3c tablist, roving, kéo thả, menu chuột phải | item, nav, outlet; `closeOthers` + spec; i18n |
| 3d `dirty`, `syncBrowserTitle` | model, item, outlet (`Title`), spec, md |
| 4a H1 icon + dung lượng | MỚI `components/upload-file/src/helpers/file-type.ts` + partial SCSS, pipe dung lượng; spec |
| 4b H2 popup | viết lại `components/upload-file/src/components/preview/*` bằng CDK Dialog; i18n; spec |
| 4c H3 default | `upload-file.component.*` (+ service), spec, md, i18n |
| 4d H4 inline | input `variant`, template/scss, spec, md; showcase trong bảng |

## 2. Hex → token
Xem tin nhắn kế hoạch (bảng đầy đủ). Tóm tắt token mới:
- `tab-router-nav-bg: color-mix(in srgb, var(--sd-surface-muted) 60%, var(--sd-surface))` (#f0f0f4 / #232429); MỚI
  `tab-router-item-hover-bg: color-mix(--sd-text 6%, nav-bg)`; `item-active-bg: --sd-surface`; `item-text: --sd-text-secondary`;
  `item-divider: color-mix(--sd-border 70%, nav-bg)`; `item-muted-bg` alias nav-bg (Deprecated).
- MỚI `avatar-status-ring: (var(--sd-surface), var(--sd-surface))`.
- MỚI `upload-file-empty-text` (text 70% trên surface), `upload-file-scrim` (black 24%), `upload-file-viewer-*`
  (bg/fg cặp cố định #141518/#e3e3e8; fg-muted/divider/control-bg/thumb-bg trộn từ fg; accent/on-accent/error là cặp
  dẫn từ `--sd-primary`, `--sd-primary-900`, `--sd-error-200`; màu đuôi file từ `error/primary/success-300`).
- Không dùng `--mat-sys-*` (không theo preset; test theme cấm).

## 3–5. Badge, avatar, tab router
Như tin nhắn kế hoạch: `solid` warning 4.77:1 đạt; đo chữ bị cắt khi `mouseenter`/`focusin`; picker dựng trên CDK
overlay + trigger theo `tree-select` + `ɵsdFormControlConnector` + `ɵSdSearchField` sm; avatar host `inline-flex` không
lệch baseline; group dùng `cdkConnectedOverlay` + `cdkTrapFocus` (mẫu context-switcher); tab cuộn bằng `scrollLeft`
sau `afterNextRender`, roving tabindex trên phần tử `role="tab"` cùng cdkDrag, `onDrop` phát mảng mới.

## 6. Upload file: điểm cần duyệt
1. **PDF không nhúng được:** `<iframe>`; X-Frame-Options/CSP không phát hiện tin cậy được (sự kiện `load` vẫn chạy),
   nên luôn có "Mở tab mới" trên toolbar làm lối thoát. Không dùng lại `sd-preview-pdf` (cần CORS, kéo pdf.js, header riêng).
2. **Lỗi theo từng file:** signal nội bộ `#failed: { key, file: File, reason, kind: 'format' | 'size' | 'upload' }[]`, không
   nằm trong `model` / giá trị form. Thử lại dùng `File` đã giữ. Kiểm định dạng / dung lượng bằng `#validate` của lib cho cả
   chọn tệp và thả tệp (lý do qua i18n); toast chỉ còn cho "quá số lượng". Upload thật vẫn chạy theo lô khi consumer gọi
   `upload()`: "đang tải lên" theo file chỉ trong lần gọi đó; lô lỗi thì cả lô thành hàng lỗi, `upload()` vẫn reject như cũ.
   Sửa thêm: xoá file thì xoá khỏi cache của service; lỗi ở giữa lô không còn làm mất file hợp lệ phía trước.
3. **Thứ tự giá trị form (type=file):** giữ một mảng chung theo thứ tự thêm. Kéo trong nhóm ảnh (hoặc tài liệu) chỉ hoán vị
   các vị trí thuộc nhóm đó, vị trí của nhóm kia giữ nguyên. Sửa luôn bug hiện tại: `onDrop` lấy index của nhóm ảnh áp vào
   mảng trộn.
4. **Bộ đếm khi dùng `sdLabelDef`:** một hàng flex (baseline, gap 8, wrap) gồm [label hoặc template custom] + bộ đếm;
   description render ngay dưới hàng đó bởi upload-file (sd-label không có slot để chèn bộ đếm).
5. **Popup:** CDK `Dialog` chứ không sd-modal. sd-modal tự đổi sang bottom-sheet trên mobile, ép `max-width`, có padding
   body 80vh, Esc không đóng (vì `disableBackdropClose`), autoFocus first-tabbable thay cho focus vào stage.
6. **`thumbnailPosition`:** không export ở `index.ts`, không có trong md, không đọc ở đâu → xoá.

## 7. i18n
Dùng lại: `core.common.close`, `core.common.cancel`, `core.form.select.search`, `core.form.search-field.clear`,
`core.form.select.required`, `core.component.upload-file.{please-upload, upload-failed, size-exceeded, invalid-format,
not-image, too-many-files, desc-*, loading, view-all}`.
Mới (đủ 5 locale vi/en/ja/ko/zh):
- badge: `core.component.badge.type.{icon,round,tag,solid,dot,pair}` + `.description`, `core.component.badge.color.{primary,
  secondary,info,success,warning,error}`, `core.component.badge.picker.{placeholder, preview, preview-title, type, color,
  icon, dot, no-icon, no-icon-match, esc-hint, done, description-hint, required}`.
- avatar: `core.component.avatar.{group-label, more-label, more-title}` ({count}).
- tab-router: `core.component.tab-router.{close-tab, close-others, open-tabs, tab-list}`.
- upload-file: `core.component.upload-file.{add-image, upload-tile, drop-hint, choose-file, drop-to-upload, no-files,
  remove-named, position, uploading, retry}` và `core.component.upload-file.viewer.{download, open-new-tab, zoom-in, zoom-out,
  fit, rotate, prev, next, load-error, load-error-hint, no-preview}`. Sửa nút tải xuống ở popup đang dùng nhầm key `upload`.

## 8. Quyết định cần duyệt
1. ~~Nhánh~~ — đã duyệt: nhánh hiện tại.
2. Badge bấm được: hover trộn 6%, active 10% (spec 10% / 16%). 16% cho 4.20:1 (warning) và 4.44:1 (success); warning
   fail từ 12%.
3. Badge trong ô bảng (`view.component.html`) chỉ bind `(click)` khi cột có `click`. Hiện `(click)` luôn được bind nên mọi
   badge trong bảng thành `role="button"`, `tabindex=0` và sẽ nhận hover mới.
4. Tooltip của badge trong bảng: chuyển `view.tooltip` vào input `tooltip` của badge thay vì `[sdTooltip]` trên host,
   để không có hai tooltip khi chữ bị cắt.
5. Tooltip của badge dùng `[sdTooltip]` (overlay chỉ tạo khi hiện) thay `matTooltip` gắn trên mọi badge; host bỏ
   attribute `title` để `dot` không có tooltip của trình duyệt chồng lên.
6. Token kích thước badge (`--sd-badge-height-*`, `-radius-tag`, `-font-weight`) khai trên `:host` của badge, không
   trong `_component-tokens.scss` (THEME.md: file đó chỉ cho màu).
7. `SD_BADGE_ICON_PRESET` theo `badge.md`: 23 icon (HTML ghi 24).
8. Avatar: có `name` mà ảnh lỗi thì chữ viết tắt lấy từ `name`, không lấy từ URL.
9. `sd-avatar-group` `(moreClick)`: `@Output` EventEmitter đọc `.observed`, cùng tiền lệ `click` của badge.
10. upload-file: text-tertiary dùng token mới `--sd-upload-file-empty-text` (text 70%; `--sd-text-muted` fail 4.5 ở 7
    preset); "+N" của inline nền `--sd-surface-muted` (nền `--sd-border` fail ở 4 preset); viền nút "Thử lại" trong viewer
    44% thay 30% (30% chỉ 2.37:1).
11. Tab: đổi `<a href>` thành phần tử `role="tab"` không href. Với `<a href>` CDK chặn mousedown nên bấm chuột không focus
    được tab; menu chuột phải mới thay menu "mở tab mới" của trình duyệt.
12. Showcase tab-router: dựng route con thật để thử 1 / nhiều / 15+ tab, dirty, `syncBrowserTitle`.
13. Upload icon: helper trả class CSS sinh từ một map SCSS (SVG vẫn inline qua `url()`), không trả đường dẫn asset — thư
    mục `file-types` không được ship ra app consumer.
14. Upload: `size` là bytes (đúng code và showcase); sửa JSDoc ghi "MB".
15. Upload: `IMAGE_EXTENSIONS` thiếu gif/webp/svg — ghi lại, không đổi trong đợt này.

## 9. Tiến độ
| Bước | Trạng thái | Ghi chú |
|---|---|---|
| 1a badge: thang, một dòng, số đếm, description, viền tag, chấm CSS, focus, hover, tooltip | xong | Lệch spec: xem dưới. Ảnh: `.sdcorejs/handoff/screenshots/wave3-1a-badge-*.png` |
| 1b badge: `solid`, `dot`, `pair`, input `label`, `pulse` | xong | Ảnh: `wave3-1b-badge-solid-dot-pair.png` (chỉ bản sau — type mới). `test:theme` thêm cặp badge |
| 1c `sd-badge-picker`, `SD_BADGE_TYPE_OPTIONS`, `SD_BADGE_ICON_PRESET` | xong | Ảnh: `wave3-1c-badge-picker.png` (chỉ bản sau — component mới). Trang showcase mới `components/badge-picker` |

Lệch khỏi thông số ở bước 1a (đã báo user):
- **Type icon to hơn một bậc** (user chọn 2026-10-21, theo HTML thay vì bảng `badge.md`): chữ sm 13/18, md 14/20,
  lg 14/20, weight 400, `--sd-text`; icon 16/18/18px. Round/tag theo bảng md.
- **Token kích thước đọc bằng fallback, không khai trên `:host`** (QĐ 6): khai trên `:host` thành rule
  `[_nghost-…]` thắng mọi override của consumer ở `:root` hay `sd-badge {}`. Vẫn không nằm trong
  `_component-tokens.scss`. Bo tag md/lg = `--sd-badge-radius-tag` + 2px (một token cho cả hai bậc).
- `sdTooltip` mở khi nội dung tới trong lúc tooltip "đang được muốn" (hết delay hover hoặc đang focus): cần cho badge
  vì nó chỉ biết chữ bị cắt sau khi focus tới (focusin của host chạy sau directive trên phần tử con).
- Showcase: spec `docs-page.component.spec.ts` đang chờ 8 ví dụ trang button, trang có 9 từ `365168c2` (đợt 1+2) —
  sửa trong commit riêng.

Ghi chú bước 1b:
- Chrome trên máy dev báo `prefers-reduced-motion: reduce` (theo cài đặt Windows), nên spec của pulse đọc rule CSS
  thay vì animation đã tính.
- Dot bấm được có vùng chạm 20px (`::before`) quanh chấm 8px; hover của pair tô từng phần bằng màu đậm của phần đó.

Ghi chú bước 1c:
- Trigger là `mat-form-field` + `ɵSdBadgePickerControlDirective` (MatFormFieldControl, không `implements` để chạy được
  trên Material 19–22); panel là `cdkConnectedOverlay` neo vào `getConnectedOverlayOrigin()` của field.
- Thêm một key i18n ngoài danh sách §7: `core.component.badge.picker.pair-label` ("Nhãn") cho bản xem trước của `pair`.
- Nháp lần đầu (round · secondary) mà không đổi gì thì đóng panel không ghi và không phát `sdChange`.
- Placeholder của ô tìm icon dùng lại `core.form.select.search` ("Tìm kiếm") theo §7, thay cho "Tìm icon" của HTML.
- Lệch có sẵn của bộ field (không sửa ở bước này): trong theme, sd-select md cao 43.5px (rule `min-height: 43.5px` cũ của
  `.sd-md`), lg là 56px mặc định của Material (sd-select lg còn cộng `margin-top: 10px` → 66px trong Karma). Picker khớp
  sd-select ở sm/md; thiết kế ghi 32/40/48.
