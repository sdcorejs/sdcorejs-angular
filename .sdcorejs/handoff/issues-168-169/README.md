# Bàn giao #168 và #169

Môi trường local ngày 26/11/2026 dùng Windows, Node 24.22.1, npm 11.5.1 và Chrome 158.0.8127.38. Ứng dụng mẫu cài `@sdcorejs/angular@22.3.7` từ npm để đo trước thay đổi và tarball đóng từ workspace v22 để đo sau thay đổi. Số phiên bản nội bộ trên tarball là 22.2.15. Đây là artifact phát triển trước bước stamp phiên bản release. Cả hai ứng dụng dùng Angular 22.1.5 và production application builder.

## #168 · Excel và dependency

| Kiểm tra | Kết quả |
| --- | --- |
| Cây cài và bundle Excel trên browser | Bản cũ phân giải `uuid@8.3.2` và map chứa module v3/v5. Candidate pin npm alias `exceljs → exceljs-lts@4.5.6`, không có package UUID runtime trong consumer. `lib/utils/uuid.js` trong map khớp với source trong tarball. [Checksum và danh sách module](excel-results.json) |
| Nguồn gốc bản fork | npm xác minh 192 registry signature và 3 attestation trong cây Excel cài độc lập. Cả 180 file trong `lib/` của tarball khớp từng byte với commit ghi trong SLSA. URL repo riêng của fork trả 404 khi kiểm tra. Commit vẫn tải được qua fork network của GitHub. Bundle minified được kiểm bằng checksum, sourcemap và test workbook. Chưa thực hiện rebuild byte-for-byte từ commit. [Attestation npm](https://registry.npmjs.org/-/npm/v1/attestations/exceljs-lts@4.5.6) · [Commit nguồn có thể truy cập](https://github.com/exceljs/exceljs/tree/4aa5e9b061f214654e3f3be408afb4fa71a02e01) · [Kết quả đối chiếu](security-review.json) |
| Audit từng engine | npm audit ghi 2 mục Moderate cho cây ExcelJS 4.4.0, 6 cho DevExpress 4.4.11 và 0 cho cây ExcelJS LTS 4.5.6. Tổng đếm gồm cả package cha. [Kết quả](security-review.json) |
| Workbook | Spec trình duyệt dùng dữ liệu tổng hợp, kiểm import/export và ghi rồi đọc lại workbook có conditional formatting mở rộng. CI chạy trên Angular 19–22. [Spec](../../../versions/v19/projects/sdcorejs-angular/services/excel/src/lib/excel.service.spec.ts) |
| Tar, gói cũ | Candidate còn `exceljs → archiver@5.3.2 → tar-stream@2.2.0`. Map browser Excel không có `tar-stream/sandbox.js`. Nhánh unzipper vẫn mang buffers, chainsaw và các dependency cũ. Theo dõi upstream hoặc đánh giá tách adapter Excel trong issue #168. Tooling v22 còn đường `sockjs → uuid@8.3.2`. |
| PDF, native, font | Consumer cài `pdfjs-dist@4.10.38 → @napi-rs/canvas@0.1.100` theo optional dependency. Stats bản layout browser có pdf.mjs và không có input @napi-rs/canvas. Gói PDF có LICENSE_FOXIT và LICENSE_LIBERATION dưới standard_fonts. Giữ mở phần review server/native, tài sản font thực tế và notice của sản phẩm phân phối. |
| Cảnh báo heuristic | Consumer phân giải object-inspect 1.14.0 qua unzipper. Artifact stringWidthRanges.js tự mô tả là bảng độ rộng Unicode 17 nén base-36. @tiptap/markdown là tên scope trong [hướng dẫn Tiptap](https://tiptap.dev/docs/editor/markdown/getting-started/installation). Các tín hiệu eval, ít bảo trì, override và AI của Socket vẫn cần đối chiếu theo package và môi trường sử dụng. |
| Audit toàn consumer | Có 2 package được npm audit --omit=dev xếp High ngoài nhánh Excel. Angular Router 22.1.5 và Zod 4.4.3 qua Angular Forms 22.1.5. Nâng đồng bộ peer Angular của portal lên bản vá tương thích, đối chiếu Router ≥22.2.1 và Zod ≥4.6.6 trong lock rồi quét lại. [Danh sách advisory và range](security-review.json) |

Giữ [issue #168](https://github.com/sdcorejs/sdcorejs-angular/issues/168) mở để theo dõi các nhóm còn lại và quét lại Socket sau khi phát hành. Chưa có quyết định chấp nhận rủi ro thay cho chủ sản phẩm.

## #169 · Ngôn ngữ

Số đo sau đây thuộc commit f0e8450 với lazy opt-in. PR #170 sau đó chuyển sang lazy mặc định. Xem [kiểm tra hiện tại với consumer không cấu hình](../lazy-default/README.md).

| Consumer và trạng thái | JavaScript thực tải, byte gzip |
| --- | ---: |
| 22.3.7, mở bằng EN | 156.637 |
| Candidate, cấu hình cũ, mở bằng EN | 157.560 |
| Candidate, chỉ VI, storage chứa JA | 62.766 |
| Candidate, VI/EN, mở bằng VI | 62.786 |
| Candidate, VI/EN, mở bằng EN | 60.176 |

Chênh lệch khi mở EN là 96.461 byte (61,6%). Số đo dùng cùng route, nén gzip mức 9, cache lạnh và `PerformanceResourceTiming.encodedBodySize` cho response JavaScript. Bao gồm chunk ngôn ngữ cần để render. Đây là kết quả cho fixture. Với VI/EN, output chỉ có hai catalog. Khi EN tải thành công, browser không yêu cầu VI. [Raw/gzip từng file, request và lần đổi ngôn ngữ](consumer-results.json)

- Build app cần cả `provideSdI18n({ defaultLanguage, loaders })` và `build.options.define.SD_I18N_LAZY_ONLY = "true"`. Mỗi loader import một entry point. API cũ vẫn khả dụng. Đổi ngôn ngữ mặc định lưu lựa chọn rồi reload. [Hướng dẫn cấu hình](../../../versions/v19/projects/sdcorejs-angular/i18n/i18n.md#load-only-the-portal-languages)
- Trang lỗi được kiểm bằng cách chủ động chặn request catalog trong Playwright. Đã xác minh fallback, cả hai request thất bại và phục hồi sau reload. Xác minh title, tên tab và nội dung trên Home/403/404 dùng component thật với VI/EN. [18 ảnh layout theo trang và kích cỡ](layout-results.json) · [Home 390 px](layout-home-en-390.png) · [403 ở 900 px](layout-403-vi-900.png) · [404 ở 1280 px](layout-404-en-1280.png) · [Màn khi tải cả hai catalog lỗi](after-vi-en-failure-en-vi-390.png)
- Hai request HTTP VI/EN đồng thời chờ nhau tại loader rồi render bằng Angular platform-server. Chrome hydrate từng trang với storage cố ý đặt ngược. Cả hai giữ đúng locale, bản dịch và cùng DOM node từ server. Fixture SSR dùng Angular JIT. [Log đã lọc](ssr-results.json)
- TestBed bao phủ custom factory, cache/retry, yêu cầu cạnh tranh, storage bị chặn, locale tag và pipe. Kiểm tra parity đủ 1.619 key × 5 ngôn ngữ. Log CI và cách chạy fixture nằm trong [workflow](../../../.github/workflows/ci.yml) và [bộ kiểm tra](../../../scripts/fixtures/i18n-consumer).

Ảnh và request dùng fixture cục bộ với viewport 390, 900, 1280 px. Chưa chạy trên portal khách hàng, thiết bị vật lý hoặc hạ tầng SSR/CDN production. Trang Socket của 22.3.7 tiếp tục mô tả bản npm đã phát hành.
