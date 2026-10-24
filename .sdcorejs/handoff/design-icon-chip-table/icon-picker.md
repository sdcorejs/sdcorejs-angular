# sd-icon · sd-icon-picker · thông số

Nguồn chính cho nhóm việc IC (sd-icon và component mới sd-icon-picker). Khi file HTML và file này khác nhau, theo file này. Mã mục (I1…) khớp với phần 1 của `Icon Chip Table Review.dc.html` (bảng 1.01–1.03).

Review dựa trên `icon.component.ts`, `icon.model.ts`, `icon.provider.ts`, `sd-icon.md`, `assets/fonts` tại `main @ 769f9ca`. Tên icon đã kiểm bằng chính file woff2 v145/v110 và metadata icon của Google Fonts.

## 0. Phạm vi

Trong đợt này:
- Sửa sd-icon: I1–I4, I7, I8.
- Danh mục icon sinh lúc build, entry point `@sdcorejs/angular/modules/icon/catalog`, `check:icon-catalog`, `check:icons`.
- Component mới `sd-icon-picker` ở `@sdcorejs/angular/components/icon-picker`, chỉ Material (Outlined, Filled).
- sd-badge-picker dùng chung bộ tìm icon.

Ngoài phạm vi:
- Lucide trong picker (chờ kiểm I5). Gặp `fontSet="lucide"` thì cảnh báo ở dev mode.
- Chuyển sang Material Symbols. Đợt này giữ bộ cổ điển.
- Từ khoá tiếng Việt, dịch nghĩa icon.
- I6 (xoá file Symbols v29): chỉ kiểm và báo lại, chưa xoá.

## 1. Bộ icon trong assets

| File | Bản | Số tên | Ghi chú |
|---|---|---|---|
| `material-icons-v145` (Filled, 128.352 byte) | v145, mới nhất | 2.234 tên · 2.189 glyph | upstream đã ngừng phát triển |
| `material-icons-outlined-v110` (Outlined, mặc định của sd-icon, 155.276 byte) | v110, mới nhất | 2.195 tên · 2.144 glyph | upstream đã ngừng phát triển |
| `material-symbols-v29` (Symbols Outlined, tĩnh) | upstream v380 | 4.301 tên ở v380 | cũ, không nối vào `SdIconSet` |

Số tên lớn hơn số glyph vì tên cũ trỏ cùng glyph (ví dụ `info_outline`). Picker dùng 2.122 tên chuẩn trong metadata (có ở cả hai bộ), ẩn 21 tên biến thể `_outline`/`_border`, còn 2.101.

Tên chỉ có ở một bộ: 43 tên chỉ filled (`home_filled`, `edit_square`, `label_outline`…), 4 tên chỉ outlined (`copy`, `cut`, `paste`, `face_unlock`). `match_case` không có ở cả hai bộ, chỉ có trong Symbols; `abc` và `text_format` có ở cả hai.

## 2. sd-icon: điểm cần sửa

| Mã | Vị trí | Vấn đề | Sửa | PR |
|---|---|---|---|---|
| I1 | `icon.model.ts:149`, `:235` | Alias `case-sensitive → match_case` với renderer Material: hiện chữ “match_case” bị cắt. | Đổi alias và chỗ gọi sang `abc` hoặc `text_format`. Tìm hết chỗ gọi `match_case` trong repo. | IC1 |
| I2 | `icon.component.ts:186–194` | Tên sai (gõ nhầm, dùng nhầm bộ) hỏng trong im lặng: khung cố định + `overflow: hidden` trông như icon mờ. | Dev mode: tra danh mục, `console.warn` một lần mỗi tên lạ, viền chấm đỏ. Script `check:icons` quét tên tĩnh trong template. | IC1 |
| I3 | `icon.component.ts:21–35`, `:91–92` | `ariaLabel` gắn lên cả host lẫn `mat-icon`; SVG Lucide nhận thêm `title`. Host không có role nên tên có thể bị bỏ qua hoặc đọc lặp. | Có nhãn: host `role="img"` + `aria-label`. Phần tử con luôn `aria-hidden="true"`. Bỏ `[title]` trên SVG. | IC1 |
| I4 | `modules/icon/src/index.ts` | Không có danh mục icon; badge-picker tự giữ 23 tên (`SD_BADGE_ICON_PRESET`). | Entry point `modules/icon/catalog`, sinh lúc build, tải lười (mục 3). | IC1 |
| I5 | `icon.provider.ts:41–45` | Lucide chỉ vẽ icon đã đăng ký qua `lucideIcons`. | Ở Lucide, danh mục là icon đã đăng ký + tên Material có alias trỏ tới. **Cần kiểm** `@lucide/angular` có cho đọc danh sách đã đăng ký không. | sau |
| I6 | `assets/fonts/fonts.scss:64–70`, `:111–116` | `.material-symbols-outlined` có `@font-face` nhưng `SdIconSet` không có lựa chọn Symbols; bản v29 cũ. | Kiểm app nào còn dùng class này, báo lại. Không xoá trong đợt này. | báo lại |
| I7 | `icon.component.ts:109–111` | `fontIcon` chỉ là tên dự phòng của `name`, trùng tên với `fontIcon` của mat-icon (icon bằng class CSS). Không có trong docs. | `@deprecated`, khuyên dùng `name`. | IC1 |
| I8 | `showcase/…/icon-demo.component.ts:22–55` | Showcase dùng `set` đã deprecated. | Đổi sang `fontSet`; thêm demo sd-icon-picker ở IC2. | IC1 |

Giữ nguyên: facade đổi renderer bằng provider, alias hai chiều Material ↔ Lucide, chuẩn hoá tên outline cũ (`info_outline → info`), token cỡ sm/md/lg, bản sửa kích thước trong mat-menu, bảng icon theo kiểu dữ liệu.

## 3. Danh mục icon

Sinh lúc build, không gọi mạng khi chạy:
1. Commit một bản chụp metadata của Google Fonts (`fonts.google.com/metadata/icons`, bộ cổ điển: 2.122 icon, 18 nhóm).
2. `scripts/build-icon-catalog.mjs` đọc bản chụp, kiểm từng tên bằng bảng ligature của hai file woff2 trong `assets/fonts`, ghi `catalog.material.json`.
3. CI chạy `check:icon-catalog`: lỗi nếu một tên trong danh mục không có glyph ở cả hai font. Cùng dữ liệu dùng cho `check:icons` (I2).

Dạng dữ liệu:
```
{ v, categories: [18 khoá],
  icons: [[name, categoryIndex, fontFlags, "tag tag …"], …] }
```
- Xếp sẵn theo mức phổ biến. Tối đa 8 từ khoá mỗi icon: khoảng 155 KB, gzip khoảng 40 KB; chỉ tên khoảng 13 KB.
- `SdIconCatalogService` (providedIn root) tải bằng `import()` lần đầu mở panel, giữ trong bộ nhớ.
- Picker ẩn 21 tên biến thể (`delete_outline`, `star_border`…): trong font filled chúng vẽ viền cạnh bản đặc; trong font outlined có cặp trùng hình (`delete`/`delete_outline`). Kiểu viền giờ là `[(fontSet)]`, nên mỗi bộ còn 2.101 icon. Gõ tên biến thể ra icon gốc. Model từ ngoài là tên biến thể vẫn hợp lệ.
- 124 icon (khoảng 6%) giống hệt nhau ở hai bộ vì là nét đơn (`menu`, `add`). Đúng như vậy.
- Tìm theo tên gốc và từ khoá tiếng Anh trong metadata. Tên nhóm trên hàng chip đi qua i18n.

## 4. sd-icon-picker: API

Cách dùng:
```html
<!-- Icon và kiểu icon đều hai chiều -->
<sd-icon-picker label="Icon" [(model)]="category.icon" [(fontSet)]="category.iconSet" (sdChange)="save($event)"></sd-icon-picker>

<!-- Trong form: form.value.icon = { icon, fontSet } | null -->
<sd-icon-picker [form]="form" name="icon" label="Icon" required></sd-icon-picker>

<!-- Giới hạn lựa chọn -->
<sd-icon-picker label="Icon trạng thái" [icons]="statusIcons"></sd-icon-picker>
```

Tên input, cỡ, đăng ký form, lỗi và autoId theo sd-badge-picker và sd-select. Chọn icon hay đổi kiểu đều ghi luôn.

| Tên | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `[(model)]` | `string \| null` | `null` | Tên icon Material chuẩn. Ghi ngay khi chọn hoặc bỏ chọn. Gán từ ngoài không phát `modelChange`. |
| `[(fontSet)]` | `SdIconSet` | theo provider | Kiểu icon, hai chiều. Đổi trong panel là ghi ngay; gán từ ngoài không phát `fontSetChange`. Quyết định cả cách vẽ lẫn danh mục. Đợt đầu chỉ Material; `'lucide'` cảnh báo ở dev mode. |
| `fontSets` | `readonly SdIconSet[]` | Outlined, Filled | Các kiểu trên nút chuyển. Chỉ một kiểu thì ẩn nút chuyển. |
| `icons` | `readonly string[] \| null` | `null` | Giới hạn danh sách; `null` là toàn bộ. Tên không có trong danh mục bị bỏ, cảnh báo ở dev mode. |
| `categories` | `SdIconCategory[] \| null` | `null` | Giới hạn nhóm trên hàng chip. |
| `keywords` | `Record<string, string>` | `{}` | Từ khoá tìm thêm theo tên icon. Đặt được ở cấp app qua `provideSdIcon({ pickerKeywords })`. |
| `recentKey` | `string \| null` | `null` | Có giá trị thì nhớ 18 icon vừa chọn vào localStorage theo key. `null`: chỉ nhớ trong phiên. |
| `clearable` | `boolean` | `false` | Nút bỏ chọn kiểu `.sd-clear-btn` của sd-date: luôn giữ chỗ, hiện khi hover/focus, ẩn khi `required`. |
| `form`, `name` | `FormGroup \| NgForm`, `string` | —, uuid | FormControl có giá trị `{ icon, fontSet } \| null`, như badge-picker. `setValue` từ ngoài cập nhật cả hai model. |
| `size` · `appearance` · `floatLabel` · `labelPlacement` · `label` · `placeholder` · `helperText` | như sd-select | | Placeholder mặc định i18n “Chọn icon”. Field cao 32/40/48, icon trên trigger 16/20/24; ở sm ẩn tên nhóm. |
| `required` · `validator` · `inlineError` · `hideInlineError` · `disabled` · `viewed` · `autoId` | như badge-picker | | autoId: trigger `components-icon-picker-<id>`, panel `…-panel`, ô tìm `…-search`, mỗi ô `…-icon-<name>`. |
| `(sdChange)` | `SdIconPickerValue` | | `{ icon, fontSet }`. Một lần mỗi thao tác có thay đổi (chọn, bỏ chọn, đổi kiểu), cùng lúc với `modelChange` hoặc `fontSetChange`. Esc không phát. |

## 5. Quy tắc giá trị

- **Đọc rộng, ghi hẹp.** Nhận tên Lucide (`trash-2`) và tên outline cũ (`info_outline`), quy về tên chuẩn bằng bảng alias để hiện và tô ô đang chọn. Không ghi ngược giá trị của cha; lần chọn sau mới ghi tên chuẩn.
- **Tên lạ.** Giữ nguyên giá trị; trigger hiện icon cảnh báo và lỗi `unknownIcon`. Form invalid để không lưu tên hỏng.
- **Chưa tải xong danh mục.** Trigger vẫn vẽ icon bằng font. Panel hiện 3 hàng ô xương. `unknownIcon` chỉ tính sau khi có danh mục.

## 6. Tìm kiếm và xếp hạng

| Khớp | Điểm | Ví dụ |
|---|---|---|
| Đúng cả tên | 1000 | delete → delete |
| Tên bắt đầu bằng | 80 | del → delete, delete_sweep |
| Một chữ trong tên bắt đầu bằng | 70 | month → calendar_month |
| Từ khoá bắt đầu bằng | 50 | bin, garbage → delete |
| Tên chứa ở giữa | 40 | board → scoreboard, dashboard |
| Từ khoá chứa ở giữa | 30 | arbage → delete |

- Chuẩn hoá: chữ thường, tách theo khoảng trắng và `_` (`calendar month` = `calendar_month`).
- Mọi chữ trong câu tìm đều phải khớp, rồi cộng điểm. Bằng điểm thì theo mức phổ biến.
- Khớp giữa tên xếp dưới từ khoá đầu từ, để `bin` ra `delete` chứ không ra `cabin`.
- Gõ tên biến thể (`delete_outline`) ra icon gốc với lý do “bản viền”.
- 2.122 mục chạy dưới vài ms, không debounce.
- Chân panel ghi lý do khớp (“tên”, “từ khoá: bin”).

## 7. Bố cục, bàn phím, a11y

Panel 400px, `role="dialog"`, khung theo sd-badge-picker (viền mat-form-field, ô icon 36px):
- Nút chuyển Outlined / Filled cao 32px, `role="radiogroup"`, ghi ngay vào `[(fontSet)]`; ← → đổi kiểu.
- Ô tìm 36px, viền primary, focus khi mở.
- Hàng chip nhóm 32px, cuộn ngang, có số đếm theo câu tìm; “Tất cả”, “Gần đây” (khi có), rồi các nhóm có kết quả xếp theo số lượng.
- Dòng trạng thái `aria-live="polite"`.
- Lưới 9 cột × 36px, cách 4px, cao 6 hàng. Cuộn ảo `cdk-virtual-scroll-viewport` theo hàng (40px).
- Chân 64px: icon đang trỏ 28px, tên, nhóm, lý do khớp, gợi ý phím (↵ chọn, Esc đóng).

Bàn phím:
- Trigger: Enter, Space, ↑, ↓ mở; gõ một ký tự thì mở kèm chữ đó trong ô tìm.
- Ô tìm: ↓ vào lưới; sau đó ←→↑↓, Home, End, PageUp/PageDown (4 hàng). Gõ tiếp thì ←→ lại di con trỏ chữ.
- Enter chọn ô đang trỏ; chưa trỏ thì chọn kết quả đầu. Esc đóng, không đổi gì, focus về trigger. Tab ra khỏi panel thì đóng.

ARIA:
- Trigger `role="combobox"`, `aria-haspopup="dialog"`, như badge-picker.
- Ô tìm `role="combobox"`, `aria-autocomplete="list"`, `aria-activedescendant`.
- Lưới `role="listbox"`, ô `role="option"` + `aria-selected`; tên đọc là tên icon bỏ `_` (“calendar month”).
- Với cuộn ảo, cuộn tới hàng chứa ô trước khi trỏ `aria-activedescendant` vào.

## 8. i18n · đủ vi, en, ja, ko, zh

| Key | vi |
|---|---|
| `core.form.icon-picker.placeholder` | Chọn icon |
| `….search` | Tìm theo tên hoặc từ khoá |
| `….results` | {count} kết quả cho “{query}” |
| `….count` | {count} icon |
| `….empty` | Không có icon khớp “{query}” |
| `….all` · `….recent` | Tất cả · Gần đây |
| `….clear` | Bỏ chọn icon |
| `….unknown` | Icon “{name}” không có trong danh mục |
| `….required` | Vui lòng chọn icon |
| `….category.<18 khoá>` | Thao tác, Điều hướng… |

## 9. Spec cần viết

- chọn ô phát `modelChange` + `sdChange` đúng một lần
- gán model từ ngoài: trigger đổi, không phát
- “del”, “delete”, “bin”, “garbage” đều đưa `delete` lên đầu
- gõ ký tự trên trigger mở panel kèm chữ đó
- ↓ rồi →: `aria-activedescendant` trỏ đúng ô
- Enter khi chưa trỏ chọn kết quả đầu
- Esc không đổi model, focus về trigger
- model `'trash-2'` hiện `delete`, không ghi ngược
- tên lạ: lỗi `unknownIcon`, form invalid
- required: lỗi sau lần đóng panel đầu tiên
- nút bỏ chọn giữ chỗ, không làm field đổi kích thước
- `check:icon-catalog` lỗi khi thiếu glyph
- `fontSet 'lucide'`: cảnh báo một lần ở dev mode
- đổi kiểu trong panel: `fontSetChange` + `sdChange` một lần
- gán `fontSet` từ ngoài: lưới vẽ lại, không phát
- “delete_outline” ra `delete`; model `'star_border'` vẫn hợp lệ
- `form.value` là `{ icon, fontSet }`; `setValue` cập nhật cả hai model
- sd-icon: có `ariaLabel` thì host `role="img"`, con `aria-hidden`; tên lạ cảnh báo một lần (I2, I3)

## 10. Lộ trình

| PR | Nội dung | Mục | Công sức |
|---|---|---|---|
| IC1 | sd-icon và danh mục | I1–I4, I7, I8: sửa `match_case`, gom tên truy cập về host, cảnh báo tên lạ, entry point catalog, script sinh danh mục, `check:icon-catalog`, `check:icons`. | ~2 ngày |
| IC2 | sd-icon-picker | Component, spec, `sd-icon-picker.md`, showcase. Hai model và giá trị form dạng object. Dùng lại khung badge-picker: `ɵ…ControlDirective` làm MatFormFieldControl, `ɵsdFormControlConnector`, overlay CDK. | ~4 ngày |
| IC3 | Dùng chung | Ô tìm icon của sd-badge-picker dùng cùng bộ tìm, vẫn lấy 23 icon có sẵn làm mặc định. | ~1 ngày |

## 11. Đã chốt (22/10/2026)

1. **Ghi ngay khi chọn.** Như sd-select: bấm hoặc Enter là ghi vào `[(model)]` và đóng panel; Esc đóng không đổi gì. Không bản nháp, không nút Xong.
2. **`components/icon-picker`.** Import từ `@sdcorejs/angular/components/icon-picker`; autoId `components-icon-picker-<id>`.
3. **Chỉ Material ở đợt đầu.** IC2 chỉ làm Outlined và Filled. Lucide để sau khi kiểm I5.
4. **Giữ tên gốc tiếng Anh, không dịch.** Không có bộ từ khoá tiếng Việt trong danh mục và i18n; app cần thuật ngữ riêng thì dùng `[keywords]`.
5. **`fontSet` cũng hai chiều.** `[(model)]` và `[(fontSet)]`, form lưu `{ icon, fontSet }`. Panel có nút chuyển kiểu, ghi ngay. Picker ẩn 21 tên biến thể `_outline`/`_border`.

## 12. Ghi chú về bản bấm thử

Bảng 1.02 trong HTML chạy trên danh mục rút gọn 414 icon, cùng định dạng với `catalog.material.json`, vì file danh mục 2.101 icon của bản review gốc không đi kèm. Số liệu trong file này (2.122, 2.101, 21, 124) là của danh mục đầy đủ. Thanh “Input của sd-icon-picker” và nút “Gán từ ngoài” bên trái demo không thuộc thiết kế.
