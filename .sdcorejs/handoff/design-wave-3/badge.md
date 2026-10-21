# sd-badge

Tham chiếu: `Badge Review.dc.html` (mục 02–07). Phạm vi: `components/badge/**`.

## Hiện trạng cần sửa
- Cỡ chữ sm/md/lg là 14/16/18px, to hơn chữ nội dung. Round không đặt line-height nên cao 25/32/39px tuỳ ngữ cảnh. Tag cao 24/26/34px.
- Viền tag là 1px `*-dark` nên tag trông như nút outlined.
- Round có `overflow-wrap: break-word` + `text-align: center`, nên tên dài thành khối nhiều dòng.
- Số đếm dùng padding 10px nên "3" không tròn. Không có quy tắc rút gọn.
- Description của type icon là T10R (10px); tag dùng T12R.
- Rule `:host [role='button']:focus-visible` đặt `border-radius: 4px` lên chính `.c-badge`, nên pill mất bo khi focus. Badge bấm được không có hover.
- sd-badge.md mô tả round là "solid colored pill", sai với thực tế.
- Bo 20px cứng; không có component token; `matTooltip` gắn trên mọi badge; chấm mặc định là glyph `fiber_manual_record`.

## Thang kích thước
| Thuộc tính | sm | md | lg |
|---|---|---|---|
| Chiều cao (cố định) | 20px | 24px | 28px |
| Chữ | 12px / 16px | 13px / 18px | 14px / 20px |
| Weight (round, tag, solid, pair-value) | 500 | 500 | 500 |
| Icon | 14px | 16px | 18px |
| Padding round / solid | 0 8px (có icon: 0 8px 0 6px) | 0 10px | 0 12px |
| Padding tag / pair | 0 6px | 0 8px | 0 10px |
| Bo góc | round/solid 999px · tag/pair 4px | 999px · 6px | 999px · 6px |
| Gap icon–chữ | 4px (type icon: 6px) | 4px (type icon: 6px) | 6px |
| Số đếm | min-width 20px · padding 0 6px | min-width 24px · padding 0 7px | min-width 28px · padding 0 8px |
| Chấm (type icon không icon, type dot) | 8px | 8px | 10px |

`sm` vẫn là mặc định. Đây là **Changed**: các màn dùng sm sẽ nhỏ lại.

## Type
`SdBadgeType` = `'icon' | 'round' | 'tag' | 'solid' | 'dot' | 'pair'`.

| Type | Hình thức | Dùng khi | Input liên quan |
|---|---|---|---|
| `icon` (mặc định) | Icon màu `*-dark` + chữ màu `--sd-text`, không nền. Không có icon thì hiện chấm CSS màu `--sd-*`. | Trạng thái trong dòng chữ. | `icon`, `title`, `description` |
| `round` | Nền `*-light`, chữ `*-dark`, không viền, bo 999px. | Trạng thái trong bảng, danh sách; số đếm. | `title`, `icon` |
| `tag` | Nền `*-light`, chữ `*-dark`, viền 1px `color-mix(in srgb, var(--sd-*-dark) 22%, var(--sd-*-light))`, bo 4/6px. | Phân loại, nhãn danh mục. | `title`, `icon`, `description` |
| `solid` (mới) | Nền `--sd-*`, chữ `--sd-*-contrast`, bo 999px. | Trạng thái cần chú ý ngay. Tối đa một badge solid mỗi dòng. | như round |
| `dot` (mới) | Chỉ có chấm màu `--sd-*`. `title` không hiển thị mà dùng làm tooltip và `aria-label`, bắt buộc. | Avatar, cột hẹp, danh sách dày. | `title`, `pulse` |
| `pair` (mới) | Hai phần ghép liền: `label` (nền `--sd-secondary-light`, chữ `--sd-secondary-dark`, weight 400) + `title` (nền `*-light`, chữ `*-dark`, weight 500). Bo 4/6px. | Cặp thuộc tính–giá trị: SLA, ưu tiên, phiên bản. | `label` (mới), `title` |

- Kiểm tra contrast của `solid` warning với chữ trắng (khoảng 4.3:1). Nếu dưới 4.5:1 thì trình phương án (ví dụ dùng `*-dark` làm nền cho warning).
- `pulse` (input mới, boolean): vòng sáng `0 0 0 3px color-mix(--sd-* 28%, transparent)` nhấp nháy chu kỳ 1.6s. Áp dụng cho chấm của `dot` và của `icon` không có icon. Tắt khi reduced-motion và để vòng sáng đứng yên.
- `pair` khi quá dài thì cắt phần `title` trước, giữ nguyên `label`.

## Hành vi chung
- **Một dòng:** `white-space: nowrap`, `max-width: 100%`, ellipsis. Bỏ `overflow-wrap: break-word` và `text-align: center`.
- **Tooltip:** chỉ gắn `matTooltip` khi có `tooltip`, hoặc khi chữ bị cắt (kiểm tra lúc hover/focus). `dot` luôn có tooltip từ `title`.
- **Số đếm:** khi `title` là số (kể cả 0), round và solid đặt `min-width` bằng chiều cao, padding như bảng, `tabular-nums`, căn giữa. Lớn hơn 99 thì hiện "99+"; `aria-label` vẫn đọc số thật.
- **Description:** 12px/16px cho cả `icon` và `tag`, màu `--sd-text-secondary`. Tag có description chuyển thành khối hai dòng: padding 4px 8px, bo 6px, title 13px/18px weight 500. Icon căn theo dòng đầu. Các type khác bỏ qua description.
- **Bấm được** (khi `click` được lắng nghe):
  - Hover: nền trộn thêm 10% `*-dark`. Active: trộn 16%.
  - Focus: vòng focus 2px, offset 2px, giữ nguyên bo góc. Xoá rule đổi `border-radius` lúc focus.
- **Chấm mặc định:** vẽ bằng CSS thay cho glyph `fiber_manual_record`.

## Màu và token
- Giữ `*-light` cho nền, `*-dark` cho chữ/icon. Dark mode tự đúng vì palette dark đã có -light/-dark.
- Component token mới: `--sd-badge-height-sm/md/lg`, `--sd-badge-radius-tag`, `--sd-badge-font-weight`.
- Giữ 6 input boolean màu (`primary`, `secondary`, `info`, `success`, `warning`, `error`). Ghi rõ thứ tự ưu tiên trong md.

## sd-badge-picker (component mới)
Một dropdown chọn cùng lúc type, màu và icon. Tham chiếu: `Badge Review.dc.html` mục 07 (bấm được).

### API
| Input / output | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `[(type)]` | `SdBadgeType \| undefined` | `undefined` | model, ghi khi đóng panel. Trống thì trigger hiện label/placeholder; lần mở đầu tiên bản nháp bắt đầu từ round · secondary. |
| `[(color)]` | `Color \| undefined` | `undefined` | model, ghi khi đóng panel |
| `[(icon)]` | `string \| null` | `null` | model, ghi khi đóng panel. Bị bỏ qua với dot/pair nhưng giá trị vẫn giữ. |
| `previewTitle` | `string` | i18n "Trạng thái" | chữ trong mọi bản xem trước |
| `previewDescription` | `string \| null` | `null` | chỉ hiện ở bản xem trước lớn, với type icon và tag |
| `types` | `SdBadgeType[]` | cả 6 | giới hạn danh sách |
| `colors` | `Color[]` | cả 6 | giới hạn danh sách |
| `icons` | `string[]` | `SD_BADGE_ICON_PRESET` | lưới icon |
| `[form]`, `name` | `FormGroup`, `string` | —, uuid | đăng ký một FormControl theo `name`; value là `{ type, color, icon } \| null` |
| `size` | `Size` | `'md'` | sm 32 / md 40 / lg 48px, chung token với sd-select |
| `floatLabel` | `'auto' \| 'always'` | `'auto'` | như sd-select |
| `labelPlacement` | `'float' \| 'top'` | `'float'` | như sd-select |
| `appearance` | `MatFormFieldAppearance` | theo `SD_FORM_CONFIGURATION` | như sd-select |
| `label`, `placeholder`, `helperText` | `string` | placeholder: i18n "Chọn kiểu hiển thị" | |
| `required`, `validator`, `inlineError`, `hideInlineError` | | | required lỗi khi chưa có `type` |
| `disabled`, `viewed`, `autoId` | | | `viewed` chỉ hiện label và badge, không có ô |
| `(sdChange)` | `{ type, color, icon }` | | phát một lần khi panel đóng và có thay đổi |

### Hành vi
- Khi mở, panel sao chép giá trị hiện tại thành bản nháp. Mọi thao tác trong panel chỉ đổi bản nháp và bản xem trước.
- **Ghi:** bấm ra ngoài, bấm "Xong" hoặc Tab ra khỏi panel thì ghi bản nháp vào ba model rồi phát `sdChange`. Nếu không có gì thay đổi thì không phát.
- **Huỷ:** Esc đóng panel và bỏ bản nháp, không phát.
- Phần icon chỉ hiện với type icon, round, tag và solid. Ô đầu lưới là "Chấm" (type icon) hoặc "Không icon" (type khác); chọn ô này thì `icon = null`.

### Form, size và floatLabel
- Trigger là control outline như sd-select: cùng thang chiều cao, padding, cỡ chữ, label nổi, vòng focus và cách hiện lỗi. Tham chiếu ma trận size × trạng thái ở mục 07 của `Badge Review.dc.html`.
- **Size:**
  - Control sm 32px và md 40px dùng badge cỡ sm (20px) trong trigger; control lg 48px dùng badge cỡ md (24px).
  - Ở control sm thì ẩn dòng tóm tắt.
  - Panel giữ nguyên kích thước ở mọi size.
- **floatLabel:**
  - `'auto'`: label nằm trong ô khi trống, và nổi lên viền trên khi có giá trị hoặc khi panel mở.
  - `'always'`: label luôn nổi; ô trống hiện placeholder.
  - Label nổi màu primary khi panel mở, màu error khi có lỗi.
- **[form]:**
  - Khi đóng panel mà có thay đổi thì gán value, `markAsDirty` và `markAsTouched`. Esc không đổi value.
  - `setValue`/`patchValue` từ ngoài thì cập nhật ba model. `disable()` tương đương `disabled`.
  - Dùng cơ chế đăng ký control giống sd-select (cùng `SD_FORM_CONFIGURATION`).
- **Validation:** lỗi hiện sau khi control đã touched, tức là sau lần đóng panel đầu tiên hoặc khi form submit.

### Bố cục
- **Trigger:** bản xem trước của giá trị đã ghi, tóm tắt `type · color · icon` (12px, text-secondary, ellipsis), mũi tên.
- **Panel** rộng 400px, bo theo panel token. Từ trên xuống:
  - Hàng xem trước: nền surface-muted nhạt, cao tối thiểu 56px, padding 12px 16px. Nhãn "Xem trước" bên trái (11px, uppercase), badge căn phải. Ghi chú "description chỉ hiện ở type icon và tag" nằm dưới badge khi cần.
  - Nhóm "Kiểu": lưới 3 cột, mỗi ô cao 60px, bo 8px, chứa bản xem trước (theo màu và icon nháp) và tên type 11px. Ô đang chọn có viền primary và nền primary 6%.
  - Nhóm "Màu": 6 ô tròn 24px, gap 12px; ô đang chọn có vòng 2px text, offset 2px. Tên màu hiện cạnh nhãn nhóm.
  - Nhóm "Icon": ô tìm kiếm cao 34px, lọc theo tên icon. Lưới 8 cột, mỗi ô 36px, bo 6px; ô đang chọn có nền primary-light và viền primary. Không có kết quả thì hiện "Không có icon khớp".
  - Footer cao 52px: bên trái gợi ý "Esc huỷ thay đổi", bên phải nút "Xong" (filled, cao 32px).
- Các nhóm cách nhau 16px.
- **Bàn phím:** Tab đi qua từng nhóm; mỗi nhóm là một radiogroup, di chuyển bằng phím mũi tên, Enter/Space để chọn.

### Export
- `SdBadgePicker`, cùng `SD_BADGE_TYPE_OPTIONS` (`{ value, labelKey, descriptionKey }`).
- `SD_BADGE_ICON_PRESET`: `check_circle, cancel, schedule, error, warning, info, sync, flag, star, bolt, lock, visibility, edit_note, label, sell, local_shipping, payments, inventory_2, person, group, task_alt, hourglass_empty, pause_circle`.
- Tên type, tên màu và nhãn panel dùng i18n đủ 5 locale.

## CHANGELOG
- **Added:** type solid/dot/pair, input `label` và `pulse`, `sd-badge-picker`, các hằng số.
- **Changed:** thang kích thước, viền tag, một dòng + ellipsis, số đếm, description 12px, focus giữ bo góc, chấm CSS.
- Sửa mô tả round trong sd-badge.md.
