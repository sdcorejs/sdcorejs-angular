# Review độc lập

Mỗi PR (calendar, kanban, scheduler) phải qua review độc lập trước khi mở PR. Cuối cùng có một lượt review chéo cả ba.

## 1. Thế nào là độc lập
- Reviewer là **một phiên Claude Code mới** (hoặc một người), không có lịch sử hội thoại của phiên đã viết code. Chỉ đọc repo, nhánh, gói handoff và báo cáo test.
- Reviewer **không sửa code**. Chỉ ghi kết quả. Phiên tác giả sửa, reviewer kiểm lại.
- Reviewer tự chạy lại lệnh test, không tin kết quả trong báo cáo của tác giả.
- Reviewer không đọc mô tả PR do tác giả viết trước khi xong mục 3.1 (để không bị dẫn dắt).

## 2. Khi nào
| Cổng | Khi | Ai | Đầu ra |
| --- | --- | --- | --- |
| R0 | Sau Bước 0 của mỗi PR | Mình (PD) | Duyệt hoặc trả lời câu hỏi. |
| R1 | Sau checkpoint có API và render (calendar 2, kanban 2, scheduler 2) | Reviewer độc lập | `reviews/<name>-R1.md`. Chỉ xét API, model, cấu trúc state, test RED. Bắt sai hướng sớm. |
| R2 | Sau checkpoint cuối, đã chạy đủ lệnh ở `TESTING.md` mục 1 | Reviewer độc lập | `reviews/<name>-R2.md`. Toàn bộ checklist mục 3. |
| R2' | Sau khi tác giả sửa | Cùng reviewer R2 hoặc phiên mới | `reviews/<name>-R2-recheck.md`. Chỉ các mục đã ghi, cộng test hồi quy. |
| RX | Sau khi cả ba đã qua R2' | Reviewer độc lập mới | `reviews/cross-RX.md`. Mục 4. |

Thư mục `reviews/` nằm trong `.sdcorejs/handoff/schedule-kanban/`, không commit vào thư viện.

## 3. Checklist R2

Mỗi dòng ghi một trong: ✓, ✗ (kèm mục ở báo cáo), N/A (kèm lý do). Mọi ✗ có `file:dòng` và mục spec.

### 3.1 Theo spec
- [ ] Đọc spec riêng từng mục (calendar: `calendar.md` §0–19 và phụ lục; scheduler: `scheduler.md` §0–19; kanban: `kanban.md` §0–16). Mỗi mục có ✓/✗/N/A.
- [ ] Không có input, output, method, layout, key i18n ngoài spec. Liệt kê public API thực tế từ `index.ts` và so từng tên.
- [ ] Phạm vi “không làm” không bị làm.
- [ ] Kanban: không còn `getId`, `getColumnId`, `getTitle`, `getSearchText`, `withColumn`, `SdKanbanId`, `canMove`, `option.searchable`, `option.collapsible`, `option.filter`, input `model`/`loading`/`error`, output `sdChange`/`sdRetry` (grep, trừ CHANGELOG và bảng chuyển đổi).
- [ ] Scheduler: không có bản sao hàm thuần hay pipeline của calendar (so diff, tìm hàm cùng thân).

### 3.2 Hợp đồng chung
- [ ] Đi từng dòng SC-01 → SC-45 của `SHARED-CONTRACT.md`: ✓ hoặc ✗.
- [ ] Bảng `onMove` (SC-09 → SC-13): reviewer tự viết một harness tạm trong showcase (không commit) hoặc dùng ví dụ async của showcase, thử đủ 5 kết quả, xác nhận DOM, output, live region.

### 3.3 Test
- [ ] Chạy lại lệnh đầy đủ ở `TESTING.md` mục 1. Ghi kết quả thật.
- [ ] Mọi mã trong `TESTING.md` mục 4 và mục của component có test, tên test có mã. Dùng grep `\[CAL-` / `\[SCH-` / `\[KAN-` đối chiếu với danh sách mã.
- [ ] Không có `fit`, `xit`, `fdescribe`, `xdescribe`, `pending()`.
- [ ] Coverage đạt ngưỡng mục 2, đọc từ báo cáo coverage thật.
- [ ] **Thử phá**: với mỗi component, tạm sửa code ở 5 chỗ dưới đây (không commit), chạy lại spec, xác nhận có test đỏ. Chỗ nào không có test đỏ là ✗ Chặn.
  1. Bỏ kiểm tra `signal.aborted` / `#current()` trước khi ghi kết quả.
  2. Coi `'cancel'` như `false`.
  3. Bỏ đánh giá lại `movable`/`droppable` ngay trước `onMove`.
  4. Đổi `<` thành `<=` trong phép kiểm tra giao nhau (calendar, scheduler) hoặc trong so sánh vị trí no-op (kanban).
  5. Cho phép hai thao tác chờ cùng lúc.
- [ ] Test không phụ thuộc thời gian thật, thứ tự chạy hay zone của máy (chạy lại với `TZ=America/New_York` và `TZ=Asia/Kolkata`).
- [ ] Mỗi bug đã sửa sau R1 có test `-B-xx`.

### 3.4 Mã nguồn
- [ ] SC-40 → SC-45.
- [ ] Không `any` mới trong public API; không `as unknown as`.
- [ ] Không rò rỉ: listener `focusin`, `ResizeObserver`, `IntersectionObserver`, timer, `AbortController` đều được dọn khi destroy (kiểm tra bằng đọc code và một test destroy).
- [ ] `effect` không ghi signal gây vòng lặp; không gọi API trong `computed`.
- [ ] Không `setTimeout` để “chờ render” (dùng `afterNextRender` như kanban hiện có).
- [ ] SCSS: mọi màu là token có fallback; literal trùng token thang đã đổi sang token; không `min-width` cố định trên host.

### 3.5 Trợ năng và hình ảnh
- [ ] Làm lại phần tay ở `TESTING.md` mục 8 cho luồng chính. Không cần lặp mọi trình duyệt.
- [ ] So ảnh chụp mục 9 với HTML trong gói. Ghi từng lệch: chủ đích (có lý do trong PR) hay không.
- [ ] Light, dark, RTL, forced-colors, reduced motion trên màn chính.

### 3.6 Tài liệu
- [ ] `sd-<name>.md` (tiếng Anh) đủ: API, ví dụ client và server, hợp đồng `onMove` có `'cancel'`, bàn phím, giới hạn. Kanban có bảng chuyển đổi.
- [ ] `CHANGELOG.md` `## [Unreleased]`: Added (calendar, scheduler), Changed với nhãn breaking (kanban).
- [ ] `THEME.md`: token mới (calendar), ghi chú dùng chung (scheduler), không đổi (kanban).
- [ ] `documentation.registry.ts` và guard showcase xanh.
- [ ] i18n đủ 5 locale.
- [ ] `npm run sync` đã chạy; `check:sync` xanh; không có thay đổi tay ở v20/v21/v22, `published-*`, `dist`.

## 4. Checklist RX (chéo)

- [ ] Bảng đối chiếu API thực tế của ba component, cột: tên, kiểu, mặc định. Hàng: `option` nhóm `move`, `onMove` (kiểu trả), `movable`, `droppable`, `selectedId`, `sdSelect`, `sdMove`, `sdMoveError`, `sdLoadError`, `reload`, `move()`, `disabled`, `readonly`, `ariaLabel`, `autoId`, `data-autoid`, live region, ngưỡng compact. Mọi khác biệt phải có trong spec; khác biệt không có trong spec là ✗.
- [ ] Cùng chuỗi i18n cho cùng nghĩa (đang lưu, đã huỷ, Thử lại, Bỏ qua).
- [ ] Cùng hành vi focus sau thao tác (SC-29 → SC-31) thử trên cả ba.
- [ ] Không có hai bản helper test giống nhau ở ba entry point mà lẽ ra dùng chung được.

## 5. Mẫu báo cáo

```
# <name> · R2
Nhánh: <branch> · Commit: <sha> · Ngày: <ISO>
Reviewer: phiên mới, không có lịch sử của phiên tác giả

## Kết luận
Chặn: n · Nên sửa: n · Ghi chú: n
<Được mở PR | Chưa được mở PR>

## Lệnh đã chạy
<lệnh> → <kết quả thật, số test, thời gian>

## Kết quả
| # | Mức | Mục spec / SC / mã test | File:dòng | Mô tả | Cách tái hiện | Đề xuất |
| 1 | Chặn | SC-12 | kanban.component.ts:214 | 'cancel' hiện viền lỗi | Ví dụ async, bấm Cancel | Tách nhánh 'cancel' trước #fail |

## Checklist
<mục 3, mỗi dòng ✓/✗/N/A>

## Thử phá
| # | Chỗ sửa | Test đỏ |
```

Mức:
- **Chặn**: sai spec hoặc hợp đồng chung, mất dữ liệu, lỗi trợ năng chặn thao tác, test thiếu cho mã bắt buộc, thử phá không có test đỏ, test chập chờn, lệnh kiểm tra đỏ.
- **Nên sửa**: lệch hình ảnh không giải thích, tên hoặc tài liệu chưa đúng, code khó bảo trì, thiếu test cho nhánh phụ.
- **Ghi chú**: gợi ý, không bắt buộc.

## 6. Prompt cho reviewer (dán vào phiên mới)

```
Bạn là reviewer độc lập cho repo sdcorejs/sdcorejs-angular, nhánh <branch>.
Bạn không có lịch sử của phiên đã viết code. Không sửa code, không commit.
Đọc CLAUDE.md của repo, rồi trong .sdcorejs/handoff/:
  schedule-kanban/REVIEW.md (làm đúng mục 3, hoặc mục 4 nếu là RX),
  schedule-kanban/SHARED-CONTRACT.md, schedule-kanban/TESTING.md,
  và thư mục design-<name>/ (spec .md, phụ lục, HTML).
Chạy lại toàn bộ lệnh ở TESTING.md mục 1 bằng Node 22.22.3. Làm phần "Thử phá" trên bản sao làm việc, hoàn tác sau khi xong.
Chỉ sau khi xong mục 3.1 mới đọc mô tả PR và báo cáo test của tác giả.
Ghi kết quả vào .sdcorejs/handoff/schedule-kanban/reviews/<name>-<cổng>.md theo mẫu ở REVIEW.md mục 5.
Nếu spec mơ hồ hoặc mâu thuẫn, ghi thành mục "Ghi chú: cần PD chốt", không tự diễn giải.
```
