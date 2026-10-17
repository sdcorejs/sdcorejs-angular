# Execution — E2E Playwright cho múi giờ cố định trên Showcase — 2026-10-17

Nhật ký thực thi plan `.sdcorejs/plans/test/2026-10-17-15-55-core-ui-fixed-timezone-e2e.md` (`sha256:v1:7d96806f…`), spec `.sdcorejs/specs/test/2026-10-17-15-38-core-ui-fixed-timezone-e2e.md` (`sha256:v1:89b50fdb…`). Gate kiến trúc: not-applicable (`test-only`). `prepareExecution`: valid (track test, strict-v2).

## 1. Trạng thái

- 6/6 task xong trên nhánh `claude/core-ui-fixed-timezone` (PR #84), **chưa commit**.
- Thay đổi đúng 22 path của plan, cộng với artifact `.sdcorejs`. Không file thư viện nào đổi ngoài `sd-date-time.md` và `SYNC-STATUS.md` (INV-003).

## 2. TDD ledger

| Case | RED | GREEN |
| --- | --- | --- |
| e2e AC-001…AC-007, hai project | `npm --prefix showcase run e2e`: 14 failed, mọi test chờ `[data-e2e="zone"]` không có (demo chưa tồn tại) — RED hợp lệ | 14 passed (lần chạy cuối, server do Playwright tự khởi động) |
| unit `showcase-time-zone.spec.ts` | lỗi compile TS2307 (module chưa có) — **RED bị chặn**, không phải RED hợp lệ | 13/13 (3 case parser + 10 registry) |

## 3. Kiểm chứng cuối (Asia/Bangkok host, Node 22.22.3)

| Lệnh | Kết quả |
| --- | --- |
| `npm --prefix showcase run e2e` | 14 passed (7 test × project `asia-bangkok`, `utc`) |
| `npm --prefix showcase run e2e -- --grep "AC-00[12]" --repeat-each 3` | 12 passed (kiểm độ ổn định sau khi sửa timing) |
| `NODE_OPTIONS=--max-old-space-size=8192 npm --prefix showcase run test -- --include=…showcase-time-zone.spec.ts --include=…documentation.registry.spec.ts` | 13 SUCCESS |
| `npm run test:showcase-examples` | 17 pass |
| `npm run check:sync` | pass |
| dòng `?timeZone=` trong `sd-date-time.md` | có |
| quét INV-003 (`git diff --name-only 1ff112849 -- versions`) | OK |
| kiểm cấu trúc `jobs.e2e` trong `ci.yml` + `npm run test:ci-selection` | OK, 18 pass |
| `npm --prefix showcase run build` | exit 0 |
| `npm run test:scripts` | 17 nhóm, fail 0 |
| job `e2e` thật trên GitHub (AC-010) | chưa chạy — cần push lên PR #84 |

## 4. Điểm lệch và phát hiện

1. **Dev server Showcase nạp `@sdcorejs/angular` hai lần khi bật prebundle của Vite** (cảnh báo NG0912 cho `SdIcon`, `SdDate`, … có sẵn ở mọi trang, kể cả `forms/date`). Hệ quả: `SD_CORE_CONFIGURATION` của `app.config.ts` và token mà `SdDateTimeService` inject là hai object khác nhau, nên `timeZone` không tới service. `webServer` của Playwright dùng `npm run start -- --port 4321 --prebundle=false` (đã ghi lý do trong `playwright.config.ts`). Lỗi gốc của dev server chưa sửa; build production không bị ảnh hưởng theo cách này nhưng chưa kiểm bằng e2e.
2. **Khi bật `timeZone`, form cha không phát `valueChanges` khi người dùng commit `sd-date` / `sd-datetime` / `sd-date-range`.** Control model-facing nhận model bằng `setValue(…, { emitEvent: false })` (`forms/models/src/sd-model-facing-control.ts`). Trước đây chỉ xảy ra khi có `transform`; PR #84 mở rộng model-facing cho mọi control khi có zone, nên app đang nghe `form.valueChanges` để phản ứng với ngày sẽ không nhận sự kiện nữa khi bật `timeZone`. CHANGELOG của PR #84 chưa nhắc. Demo cập nhật JSON qua `(sdChange)` + `(focusout)` và đọc `form.value` ở macrotask kế tiếp. Không sửa thư viện trong contract này (INV-003) — cần quyết định riêng.
3. **`data-value` trên input của `sd-date` phản ánh vật mang (Date local), không phải model**: với zone VN trên trình duyệt Bangkok, chọn 20/05/1960 cho `data-value="1960-05-19T17:00:00.000Z"` trong khi `form.value` là `'1960/05/20'`. Công cụ QA đọc `data-value` sẽ thấy instant theo múi giờ trình duyệt. Chưa sửa.
4. **Đồng hồ cố định (`page.clock.setFixedTime`) làm animation đóng picker không kết thúc**, backdrop chặn click tiếp theo. AC-005 tải lại trang (cùng đồng hồ) trước khi mở picker thứ hai.
5. **Demo dùng OnPush.** Thử Default change detection làm lịch render lại liên tục, ô năm bị detach và không click được.
6. **autoId của external filter `sd-table`** là `forms-date-range-components-table-<tableAutoId>-external-<field>` (bản nháp test đoán sai lúc đầu).

## 5. Việc còn mở

- Commit + push lên PR #84 khi người dùng yêu cầu; lần chạy thật của job `e2e` trên GitHub.
- Quyết định về phát hiện 2 (`valueChanges` khi bật zone) và 3 (`data-value`) — thuộc thư viện, nằm ngoài contract test-only này.
- Phát hiện 1 (dev server nạp thư viện hai lần) — ảnh hưởng mọi demo phụ thuộc cấu hình root khi chạy `npm start`.
- Port sang Core Legacy (bước kế tiếp người dùng đã yêu cầu).
