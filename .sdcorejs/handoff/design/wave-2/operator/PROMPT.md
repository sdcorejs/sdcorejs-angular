Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`, trên nhánh đang làm đợt 2 mục G (operator trong control). Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist.

`@sdcorejs/utils` 1.3.1 đã phát hành, có sẵn hình icon operator mới (`operator.md` mục 5). Repo này không vẽ lại icon.

Gói này bổ sung cho đợt 2, đặt ở `.sdcorejs/handoff/design-wave-2/operator/`. Nếu tôi upload dạng zip thì giải nén vào đó; không đặt ở `design/` root. Gói gồm:
- `README.md`: tổng quan, điểm cần duyệt.
- `operator.md`: thông số đầy đủ, là nguồn chính. Mục 10 liệt kê dòng nào thay cho README đợt 2.
- `Operator Review.dc.html`: hiện trạng, bảng icon, vấn đề A1–D2, demo bấm được, API. Mở bằng trình duyệt; `support.js` phải nằm cùng thư mục.
- `screenshots/`: ảnh chụp trang minh hoạ.

HTML chỉ là bản tham chiếu. Dựng lại bằng template Angular và SCSS hiện có cùng token `--sd-*`. Không copy markup hay inline style. Không thêm hex (`check:scss-hex` phải xanh).

## Trước khi code
Đọc README, `operator.md`, README đợt 2 mục D và G, toàn bộ `components/operator/**` (kể cả spec), column-filter, các file query-bar trong `operator.md` mục 8, và phần `ɵ` của G đã làm tới đâu. Sau đó trình kế hoạch ngắn gồm:
- Trạng thái G hiện tại: `ɵ` đã tách chưa, chip trong control đã có những gì, phần nào của bổ sung này đè lên code đang dở.
- Danh sách file sẽ đổi và commit dự kiến.
- `MatMenuItem` có input `role` (`menuitemradio`) ở cả 4 major 19–22 không; nếu không thì cách đặt role và `aria-checked`.
- `I18nService` có tham số trong chuỗi không (`{label}`); nếu không thì cách ghép.
- Token ở `operator.md` mục 3.2 đã có trong v19 chưa (`--sd-surface-muted`, `--sd-primary-dark`, `--sd-primary-contrast`, `--sd-text-disabled`, nền disabled của control). Thiếu thì báo, không tự thêm.
- Kết quả grep nơi đọc `OPERATORS[].icon` hoặc bảng icon/symbol riêng (`SdOperators`).
- Phương án B5 cho column-filter, (a) hay (b), kèm ảnh hưởng tới `operatorChange` (`operator.md` mục 7).
- Các nơi khai báo `@sdcorejs/utils` 1.3.0 (package.json, lockfile). Cho biết v20–v22 nhận bản nâng qua `npm run sync` hay phải sửa riêng, theo CLAUDE.md.
- Spec hoặc snapshot nào đang so chuỗi `icon` / SVG của OPERATORS.

Dừng chờ tôi duyệt.

## Phạm vi, làm theo thứ tự, mỗi bước một commit (spec trước)
1. **Nâng `@sdcorejs/utils` 1.3.0 → 1.3.1 (C1–C6)**
   - Đổi version ở mọi package.json đang khai báo 1.3.0 (gồm `versions/v19/package.json`, `versions/v19/projects/sdcorejs-angular/package.json`, `showcase/package.json`), cập nhật lockfile. v20–v22 theo cách đã chốt trong kế hoạch.
   - Không sửa hình icon trong repo này. Nếu `OPERATORS[].icon` trong `node_modules` không khớp `operator.md` mục 5 thì dừng và báo.
   - Cập nhật spec/snapshot đang so chuỗi icon cũ.
2. **sd-operator (A1, A3, B1, B2, B4, B5 phần hình, C7, D1)**
   - Input `size`, `readonly`, `active`, `showCode` (mục 2).
   - Trigger sm/md render chip qua `ɵ` của G; `xs` là glyph trơn có vùng bấm 24px (mục 3.1, 3.2).
   - `#svg()` nhận cỡ và stroke; SVG `aria-hidden`; aria-label + 2 key i18n mới đủ 5 locale (mục 3.3).
   - Menu một dòng 36px, tick, `menuitemradio`, divider theo họ, `showCode` (mục 4).
   - Bỏ màu và giá trị khoá cứng trong `operator.component.scss`.
3. **column-filter (B3, B5)**
   - Thứ tự theo `filter.operator.list`.
   - Phương án B5 đã duyệt.
   - Template custom: sd-operator rời dùng `size="sm"` và `[active]`.
4. **query-bar (A2, A4, D1)**
   - Chuyển 4 component sang `size="xs"` / `readonly` theo `operator.md` mục 8.
   - Gỡ các đoạn `::ng-deep .c-op-*`.
5. **Nhãn vi và tài liệu (B6, D2)**
   - Đổi 9 key trong `vi.ts` (mục 6).
   - Cập nhật `sd-operator.md`, `sd-query-bar.md` (đoạn nói về sd-operator), `sd-table` nếu có nhắc thứ tự operator.

## Ràng buộc
- Không đổi hay rename input/output, keyboard contract hiện có. Chỉ thêm những gì `operator.md` mục 2 liệt kê.
- Không đổi `value`, `display` hay kiểu của `OPERATORS`; không thêm operator mới.
- Giữ nguyên `operatorChange`, `filterChange`, `filterCommit` và thời điểm emit, trừ khi phương án B5 đã duyệt nói khác.
- Giữ `open()` cho build flow của query-bar.
- Không làm vỡ phần G đang dở; nếu phải sửa lại code G thì ghi rõ trong báo cáo.
- Rà API consistency theo mục "Review bắt buộc" của CLAUDE.md. Ghi kết quả vào PR description.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh.
- Hover chỉ là lớp hiển thị bổ sung; mọi thứ vẫn dùng được bằng bàn phím và `pointer: coarse`. Transition tắt khi `prefers-reduced-motion`.
- Ngoài phạm vi: query-builder (chỉ hưởng thay đổi qua sd-operator), bố cục sd-table.

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
  - sd-operator: size xs/sm/md, có/không model, `active`, `disabled`, `readonly`, `showCode`, danh sách 2 mục, 9 mục, đủ 17 mục.
  - Table: column filter kiểu chuỗi, số, ngày, values; template custom; cột chưa có operator.
  - Query-bar: inline và popover mode, `showOperatorOnChip`, build flow (bước operator và bước value).
  - Query-builder: rule có 1 operator (ẩn) và nhiều operator.
  - Chỉ dùng bàn phím: Tab tới trigger, Enter/Space/Alt+↓ mở, mũi tên, chọn, Esc, focus trả về.
  - Screen reader (VoiceOver hoặc NVDA): tên trigger, hàng đang chọn, glyph readonly trong chip.
  - Chế độ: light, dark (`data-sd-theme="dark"`), preset default và graphite, forced-colors.
  - Locale vi và en (nhãn mới, aria-label).
- Cập nhật mục `## [Unreleased]` trong `CHANGELOG.md` (Added / Changed / Fixed theo trang minh hoạ mục 05), thêm dòng Changed: nâng `@sdcorejs/utils` 1.3.1 (icon operator mới).

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi bước, báo lại:
- file đã đổi
- spec đã thêm hoặc sửa
- kết quả các lệnh kiểm tra
- ảnh chụp showcase trước/sau
- điểm nào lệch khỏi thông số và lý do
