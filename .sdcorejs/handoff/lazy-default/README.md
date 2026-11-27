# Lazy-load ngôn ngữ mặc định

[Issue #169](https://github.com/sdcorejs/sdcorejs-angular/issues/169) · [PR #170](https://github.com/sdcorejs/sdcorejs-angular/pull/170)

| Consumer Angular 22.1.5 | JavaScript thực tải ở lần mở đầu (gzip) |
| --- | ---: |
| npm 22.3.7, EN | 156.637 byte |
| Candidate, không có provider hay build flag, EN trong storage | 59.555 byte |
| Candidate, không có provider hay build flag, storage trống | 61.498 byte |
| Candidate, `provideSdCore()`, EN trong storage | 59.597 byte |

Cấu hình mặc định giảm 97.082 byte khi mở EN (62,0%). Cả hai ứng dụng dùng cùng source, Angular application builder, cache lạnh và gzip mức 9. Số đo lấy từ response JavaScript qua Resource Timing, bao gồm chunk ngôn ngữ đã dùng để render. [Từng chunk, byte và request cho 61 lượt mở](consumer-results.json)

- [x] Tarball candidate tự tách VI, EN, JA, KO, ZH. Mở từng ngôn ngữ chỉ tải một catalog. Storage trống hoặc không hợp lệ chọn VI. Khi chặn EN, browser mới tải VI. Kiểm tra riêng allowlist không define và allowlist có define để loại các catalog thừa khỏi output.
- [x] Khi giữ request EN trên mạng, app không provider đã dựng khung và để trống bản dịch. `sdTranslate` cập nhật trên cùng view khi thả request. Với `provideSdCore()`, khung chưa được tạo cho đến khi có EN. Hai trường hợp đều hiển thị bản dịch EN ngay lần đầu có nội dung. Các bản có initializer cũng kiểm cả hai chunk lỗi và phục hồi sau khi bỏ chặn và reload. [Ảnh app không provider ở 390 px](bare-en-390.png) · [Lỗi tải ở 900 px](core-failure-en-vi-900.png)
- [x] 18 tổ hợp Home/403/404, VI/EN và các viewport 390/900/1280 px dùng component thật và không có i18n provider. Kiểm tên tab, browser title, nội dung và request locale. [Kết quả và ảnh](layout-results.json)
- [x] 2 request VI và EN render đồng thời bằng Angular platform-server với cấu hình `provideSdCore({ language })` riêng. Trình duyệt đặt storage cố ý ngược, cả hai hydrate đúng bản dịch và giữ lại DOM node của server. [Kết quả SSR/hydration](ssr-results.json)
- [x] Có đường chuyển đổi cho ứng dụng cần đồng bộ bằng token `SD_I18N_PRELOADED`. Các unit test component đồng bộ dùng provider này. Ngược lại, bộ test mặc định và các consumer production chạy loader thực. [Hướng dẫn migration](../../../versions/v19/projects/sdcorejs-angular/i18n/i18n.md#load-only-the-portal-languages)

Chạy local trên Windows với Node 24.22.1, npm 11.5.1 và Chrome 158.0.8127.38. Candidate được pack từ workspace v22 (số nội bộ 22.2.15). Đây là các ứng dụng thử nghiệm cài tarball qua npm. Lỗi tải được mô phỏng bằng Playwright chặn chunk cụ thể. Kiểm thử SSR dùng Angular JIT trên HTTP local. Portal/CDN khách hàng và thiết bị vật lý chưa được kiểm thử. [Fixture và mã kiểm tra](../../../scripts/fixtures/i18n-consumer)
