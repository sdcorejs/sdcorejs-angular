---
name: test-dist-can-shadow-source
description: Angular workspace tests can mix public dist imports with relative source imports, creating stale exports or duplicate runtime identities.
type: project
track: angular
---

# Stale dist có thể che source khi chạy test

Trong các workspace `versions/v19`, `versions/v20` và `versions/v21`, thứ tự path resolution của test có thể chọn output dưới `dist/sdcorejs-angular` trước source hiện tại. Vì vậy một dist cũ có thể tạo compile failure ở icon/public exports dù file source và diff của feature đang đúng.

Nếu production subject import một service/token qua public entrypoint nhưng spec
import cùng symbol bằng relative source path, test graph có thể tạo hai
`InjectionToken` hoặc class identity khác nhau. Spec phải dùng cùng public
entrypoint với subject khi identity là một phần của contract.

**Why:** Trong lần tích hợp datetime `1.0.3`, v20/v21 focused tests ban đầu lỗi ở
icon exports không liên quan và build lại workspace đã làm mới dist. Trong
quality gate `SdTable` empty-result reload, `responsive.service.spec.ts` dùng
relative viewport import trong khi subject dùng public package import, làm hai
assertion identity/breakpoint fail dù runtime đúng.

**How to apply:** Khi focused test báo missing/stale export ngoài scope, so sánh
source với `dist` và HEAD trước. Nếu dist cũ, chạy
`npm --prefix versions/<major> run build`, rồi chạy lại test. Nếu lỗi là
token/class identity, đối chiếu import graph và để spec dùng cùng entrypoint với
subject. Chạy full `test:ci` của v19/v20/v21 tuần tự; nhiều Karma workspace chạy
song song có thể tranh chấp port/browser resources và tạo failure không tái hiện
khi chạy riêng.
