---
name: test-dist-can-shadow-source
description: Angular workspace tests may resolve a stale generated dist before current source and report unrelated compile failures.
type: project
track: angular
---

# Stale dist có thể che source khi chạy test

Trong các workspace `versions/v19`, `versions/v20` và `versions/v21`, thứ tự path resolution của test có thể chọn output dưới `dist/sdcorejs-angular` trước source hiện tại. Vì vậy một dist cũ có thể tạo compile failure ở icon/public exports dù file source và diff của feature đang đúng.

**Why:** Trong lần tích hợp datetime `1.0.3`, v20/v21 focused tests ban đầu lỗi ở icon exports không liên quan; build lại workspace làm mới dist và cùng test pass.

**How to apply:** Khi focused test báo missing/stale export ngoài scope, so sánh source với `dist` và HEAD trước. Nếu dist cũ, chạy `npm --prefix versions/<major> run build`, rồi chạy lại test; không sửa source ngoài scope chỉ để khớp artifact stale.
