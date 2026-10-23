Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`. Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist. Dùng đúng Node `22.22.3`.

Gói thiết kế này cần nằm ở `.sdcorejs/handoff/design-icon-chip-table/`. Nếu tôi upload dạng zip thì giải nén vào đó. Gói gồm:
- `README.md`: tổng quan, quy tắc, quyết định đã chốt.
- `icon-picker.md`, `chip.md`, `table.md`: thông số đầy đủ của từng nhóm, là nguồn chính. Khi HTML và các file này khác nhau, theo file md.
- `Icon Chip Table Review.dc.html`: trang tổng hợp và 5 bản bấm thử (1.02, 2.03, 3.02, 3.03, 3.05).
- `support.js`: phải nằm cùng thư mục với file HTML. Mở bằng trình duyệt.

HTML chỉ là bản tham chiếu. Dựng lại bằng template Angular và SCSS cùng token `--sd-*`. Không copy markup, inline style hay logic demo. Không thêm hex (`check:scss-hex` phải xanh). Không thêm dependency.

## Ba nhóm việc

| Nhóm | File | PR | Ghi chú |
|---|---|---|---|
| CH · sd-chip | `chip.md` | CH1 → CH2 → CH3 | CH1 là sửa lỗi, không đổi API |
| TB · sd-table | `table.md` | TB1, TB4 độc lập; TB2 → TB3 | TB3 cần đường lưu im lặng của TB2 |
| IC · sd-icon | `icon-picker.md` | IC1 → IC2 → IC3 | IC2 là component mới |

Tôi sẽ nói nhóm nào cần làm. Nếu tôi không nói, làm theo thứ tự CH, TB, IC. Mỗi lần chỉ làm một nhóm, mỗi PR một branch.

## Trước khi code

Đọc hết phần của nhóm đang làm, cộng `README.md` và mục Tổng quan của file HTML (bấm thử bản demo tương ứng).

CH · sd-chip:
- `forms/chip/**`: component, template, SCSS, spec, `sd-chip.md`.
- `forms/chip-calendar/**` và `.sdcorejs/handoff/design-chip-calendar/`: các bản sửa có sẵn (`isErrorShown`, `errorId`, view-trigger, `clearable`, `maxVisible`, `minCount`/`maxCount`, chip riêng), `pipes/removable-chip.pipe.ts`.
- `forms/date/**` (`.sd-clear-btn`), `forms/select/**`, `assets/scss/core/form.scss`, `modules/icon/**` (cách sd-icon đặt `aria-hidden`).
- `i18n/src/vi.ts` (`core.form.chip.*`, `core.form.chip-calendar.*`).

TB · sd-table:
- `components/table/**`: `table.component.html/.scss/.ts`, `table-header-layout.spec.ts`, directive `sdColumnResize`, `config.component.*`, `config.service.ts` (`persistColumnWidth`, `setSilent`, luật gộp cột storage ở dòng 162–181), `models/table-option*.ts`, `SD_TABLE_CONFIGURATION`, `sd-table.md`.
- `components/data-state/**`, cách bảng đang dùng `cdkDropList` cho kéo dòng.
- `assets/THEME.md`, `assets/scss/themes/_component-tokens.scss`, `_semantic.scss`, `default.scss`.
- `i18n/src/vi.ts` (`core.component.table.*`).

IC · sd-icon:
- `modules/icon/**`: `icon.component.ts`, `icon.model.ts`, `icon.provider.ts`, `index.ts`, `sd-icon.md`; `assets/fonts/**` (`fonts.scss`, hai file woff2).
- `components/badge/**`: sd-badge-picker (`ɵ…ControlDirective`, `ɵsdFormControlConnector`, overlay, `SD_BADGE_ICON_PRESET`, ba model, form value dạng object).
- `forms/select/**` (size, floatLabel, labelPlacement, autoId), `forms/date/**` (`.sd-clear-btn`).
- `ng-package.json` của các entry point phụ để thêm `modules/icon/catalog` và `components/icon-picker`.
- Trang icon trong `showcase/`, `documentation.registry.ts`.

Sau đó trình kế hoạch ngắn gồm:
1. Danh sách file sẽ tạo, sửa, xoá và commit dự kiến cho từng PR của nhóm.
2. Bảng API consistency sau khi đọc code thật: tên, kiểu, mặc định của mọi input/output mới so với component tham chiếu (README mục Quy tắc). Dòng nào khác file md thì đề xuất cách sửa.
3. Danh sách thay đổi hành vi có thể ảnh hưởng consumer và cách ghi CHANGELOG (Added, Changed, Fixed, Deprecated, Removed).
4. Kết quả kiểm các điểm ở “Cần kiểm khi đọc code” của README thuộc nhóm đang làm.
5. Riêng CH: hàm và pipe nào lấy lại từ chip-calendar, chỗ đặt helper dùng chung; danh sách key i18n trùng nghĩa với chip-calendar và đề xuất có gom vào `core.form.chips.*` không.
6. Riêng TB: cách `sdColumnReorder` đo ô và vẽ vạch thả với rowspan/colspan và cột sticky, phân biệt bấm (sort) và kéo (ngưỡng 4px), không đụng resize handle, ô filter và `cdkDropList` của dòng; cách chuyển đổi storage cũ sang `ConfiguredColumn.children`; máy trạng thái loading (showDelay, minDuration) bằng signal.
7. Riêng IC: nơi đặt bản chụp metadata, script sinh danh mục và cách đọc bảng ligature của woff2 không thêm dependency; dung lượng thật của `catalog.material.json`; cách nối `aria-activedescendant` với cuộn ảo.
8. Token mới với giá trị light/dark; token có sẵn dùng lại.
9. Key i18n mới, key dùng lại.

Dừng chờ tôi duyệt.

## Phạm vi, làm theo thứ tự, mỗi PR một branch, mỗi bước một commit (spec trước)

CH · sd-chip (`chip.md` mục 6)
1. **CH1**: A1–A8 và spec D4. Không đổi API.
2. **CH2**: B1–B7, D3. Input mới, alias `min`/`max`, i18n, aria-live. Hai thay đổi hành vi vào `## [Unreleased]`.
3. **CH3**: C1–C4, D1, D2. Mixin `sd-chip-row()`, chip-calendar chuyển sang mixin, xoá `onSelect` (breaking), viết lại `sd-chip.md`.

TB · sd-table (`table.md` mục 7)
1. **TB1**: H1–H5, H8, `style.groupDivider`, token, sửa `table-header-layout.spec.ts`.
2. **TB4**: L1–L8, `option.loading`.
3. **TB2**: H6, H7, `persistColumnOrder`, `orderChange$`, `ConfiguredColumn.children`.
4. **TB3**: `sdColumnReorder`, `config.reorderable`, `onReorder`, `column.reorderable`, i18n, docs, showcase.

IC · sd-icon (`icon-picker.md` mục 10)
1. **IC1**: I1–I4, I7, I8, entry point catalog, `scripts/build-icon-catalog.mjs`, `check:icon-catalog`, `check:icons`.
2. **IC2**: sd-icon-picker, spec, `sd-icon-picker.md`, showcase.
3. **IC3**: badge-picker dùng chung bộ tìm.

## Ràng buộc
- `ChangeDetectionStrategy.OnPush`, standalone, signal API, `@if/@for` với `track`.
- Không sửa object hay mảng consumer truyền vào; mỗi lần đổi tạo mảng mới.
- Không `innerHTML`, không `bypassSecurityTrust*`, không `!important`, không `::ng-deep`.
- Hover chỉ là lớp bổ sung: mọi nút hiện khi hover (bỏ chọn, bỏ hết) phải tới được bằng bàn phím và dùng được với `pointer: coarse`.
- Mọi hiệu ứng tắt khi `prefers-reduced-motion`.
- Hiệu năng: tìm trên 2.122 icon không debounce vẫn mượt; bảng 1.000 dòng kéo cột không giật (đo một lần khi bắt đầu kéo, đổi thứ tự một lần khi thả).
- Không đổi API component khác ngoài phạm vi; nếu cần thì nêu trong kế hoạch.
- Comment `why:` cho quyết định không hiển nhiên.

## Kiểm tra sau mỗi bước và trước khi xong
```
cd versions/v19
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage
npm run lint
npx ng build sdcorejs-angular
cd ../..
npm run test:theme
npm run check:scss-hex
npm run sync
npm run check:sync
```
Nhóm IC thêm: `npm run check:icon-catalog`, `npm run check:icons`.

Cuối cùng:
- `npm --prefix showcase run link:library`, chạy showcase.
- Kiểm tra trên showcase theo mục “Thử lần lượt” của bản demo tương ứng trong HTML (1.02, 2.03, 3.03, 3.05), cộng:
  - CH: chip trong ô sd-table `size="sm"` với `maxVisible` 2; form reset về null; submit khi chưa chạm; screen reader đọc tên nút ✕ và lỗi ẩn.
  - TB: bảng server và local; có và không có paginator; header nhóm với filter bật/tắt; bảng có cột fixed; mạng chậm 3G cho loading; tree mở rộng dòng.
  - IC: sd-icon với tên chỉ có ở một bộ (`copy`, `home_filled`) ở dev mode; picker ở size sm/md/lg trong form; `recentKey`; chỉ bàn phím.
  - Light, dark, forced-colors; màn 1280px và 768px.

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi PR, báo lại:
- file đã tạo, sửa, xoá
- spec đã thêm
- kết quả các lệnh kiểm tra
- ảnh chụp showcase
- điểm nào lệch khỏi file md và lý do
- kết quả rà API consistency, để đưa vào PR description
