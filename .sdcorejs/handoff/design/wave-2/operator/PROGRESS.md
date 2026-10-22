# Tiến độ sd-operator

Kế hoạch đã duyệt: [`PLAN.md`](PLAN.md) (2026-10-22). Nhánh `feat/sd-operator-handoff` từ `main` `769f9ca73`.

| Bước | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | Gói handoff + kế hoạch | xong |
| 1 | Nâng `@sdcorejs/utils` 1.3.1 (C1–C6) | xong |
| 2 | sd-operator (A1, A3, B1, B2, B4, B5 hình, C7, D1) | chưa |
| 3 | column-filter (B3, B5) | chưa |
| 4 | query-bar (A2, A4, D1) | chưa |
| 5 | Nhãn vi, tài liệu, showcase, CHANGELOG (B6, D2) | chưa |

## Bước 1

- `@sdcorejs/utils` 1.3.0 → 1.3.1 ở `versions/v19/package.json`, `versions/v19/projects/sdcorejs-angular/package.json`,
  `showcase/package.json`; v20–v22 package.json qua `npm run sync`. Lockfile cập nhật trong từng workspace (v19 và showcase
  `npm install --legacy-peer-deps`; v20 / v21 `npm install --package-lock-only --legacy-peer-deps`; v22 không cờ), mỗi lock
  chỉ đổi 4 dòng của `@sdcorejs/utils`.
- `OPERATORS` của 1.3.1 khớp 17 dòng `operator.md` mục 5. Không có spec/snapshot so chuỗi icon cũ; thêm spec
  “draws the @sdcorejs/utils 1.3.1 glyphs” (∈ của IN, vòng + chấm của NOT_NULL).
- Kiểm tra: full Karma 7827/7827, `test:scripts` (gồm release contract, theme), `npm run sync`, `check:sync`.
  Ảnh: [`progress/step1-before-after.png`](progress/step1-before-after.png).
