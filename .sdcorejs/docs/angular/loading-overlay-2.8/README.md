# Core UI loading overlay — bản vá 2.8

Tiếp nối ngày 2026-09-11: tích hợp Sidebar V3 và main mới nhất, chốt phát hành 2.8 theo [release integration record](../../releases/2.8.md). Các trạng thái chưa publish và hash bên dưới là lịch sử preflight ngày 2026-09-10; trạng thái phát hành thực tế theo workflow của tag `v2.8`.

Ngày kiểm chứng: 2026-09-10. Repository sở hữu source và artifact: `sdcorejs-angular`.
Phạm vi: lỗi CSS giữa `SdLoadingService` và `SdButton`; chuẩn bị bản vá cho bốn Angular major.

## Nguyên nhân và sửa tại nguồn

Core UI 20.2.7 dùng `.sd-loading` cho cả trạng thái button lẫn overlay service. Rule global của service áp `position: absolute`, `inset: 0`, kích thước 100% và `z-index: 99999` lên button. Stylesheet còn sống sau `ref.close()` cho đến khi service owner cuối cùng bị destroy, nên chỉ đóng overlay không giải quyết xung đột.

Sửa canonical `versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.ts`, rồi chạy `npm run sync`:

- Gắn `data-sd-loading-overlay` khi service tạo overlay.
- Scope rule overlay thành `.sd-loading[data-sd-loading-overlay]`.
- Scope spinner thành `.sd-loading[data-sd-loading-overlay] > .sd-loading-spinner`.
- Đồng bộ kiểm tra rule trong cơ chế nhận diện/augment stylesheet.

Không đổi code `SdButton`, API, class hiện hữu, keyframes, contribution/ref counting, ownership giữa các injector, phục hồi `aria-busy`, SSR hay cleanup đồng bộ. Preflight riêng loading fix giữ nguyên declarations, exports và danh sách file. Khi tích hợp `main` (`f53358d7`), candidate 2.8 còn bao gồm các sửa table, data-state và upload-file có sẵn trên main: upload-file bỏ input `appearance`/type liên quan theo mục Breaking của CHANGELOG. Việc bỏ API này không thuộc loading fix; Console cần bỏ binding upload appearance nếu đang dùng.

Overlay ở vùng nội dung được định vị riêng vẫn để header và nút đóng drawer tương tác. `start()` mặc định phủ document body vẫn giữ hành vi overlay toàn trang hiện có; bản vá không đổi mô hình định vị/scroll của overlay.

## Kiểm chứng

### Sau khi tích hợp main

- Full canonical Chrome: 5.336/5.336 pass.
- Build/pack bốn dòng và `check:sync`, 158 script tests: pass.
- Package-contract và strict consumer compile của cả bốn tarball tích hợp: pass. Patch layout/tab-router Console còn lại apply-check thành công trên build mới.
- Snapshot 2.8 được tái sinh từ build ở `48629b1b`; exports và inventory giữ nguyên, khác biệt declaration chỉ thuộc upload-file đã được main ghi Breaking.

### Preflight loading độc lập trước tích hợp

- Red trước sửa: 4/8 test rendering mới fail. Header button dịch x từ khoảng 611px về 32px, rộng từ khoảng 75px thành 670px và nhận z-index 99999.
- Focused Chrome suite: 129/129 pass (loading lifecycle, rendering, button, side drawer).
- Full canonical v19: 5.333/5.333 pass, có coverage. Statements 81,61%; branches 71,54%; functions 79,93%; lines 82,73%; vượt toàn bộ threshold.
- Full Chrome suite trên từng dòng v20, v21, v22: mỗi dòng 5.333/5.333 pass. Tổng bốn dòng: 21.332 test pass.
- Test rendering lưu/khôi phục scroll của document dùng chung trong Karma. Trong lần chạy full đầu, test trước để scrollY=897 khiến overlay absolute ngoài viewport; fixture đã được sửa để đo tại viewport xác định. Không đổi production CSS để xử lý trạng thái test.
- `npm run test:scripts`: 158 test pass.
- `npm run lint:release`: cả v19/v20/v21/v22 pass. Spec rendering cuối cùng cũng lint riêng trên cả bốn dòng.
- `npm run check:sync`: pass.
- `scripts/deploy.ps1 -PatchVersion 2.8 -SkipInstall -DryRun`: build/pack đủ bốn dòng, kiểm tra integrity/shasum/SHA-256 và xác nhận registry chưa có collision.
- Showcase production build: pass; có warning CommonJS từ dependencies hiện hữu.
- Showcase Chrome suite: 206/206 pass.
- Release package-contract: pass cho cả bốn tarball, gồm hash/manifest/declarations/sourcemap và strict Angular consumer compile (`consumersCompiled: true`). Local build tái sử dụng dependencies hiện có với Node 22.22.3; clean workspace install theo lockfile vẫn thuộc CI release. Consumer checks tạo môi trường cài đặt riêng.
- Patch Console đính kèm đã qua `git apply --check` trên các file từ build v20.2.8.

Final checks: `git diff --check` và scan mojibake trên các file thay đổi đều pass. Không còn test thất bại hoặc blocker kỹ thuật trong các gate local đã chạy.

Logs local nằm trong `tmp/` (git-ignored). Các lần red/diagnostic được giữ riêng với kết quả final.

## Nâng cấp Enterprise Console

Áp dụng sau khi transaction npm `v2.8` đã postpublish GREEN và xác minh được `@sdcorejs/angular@20.2.8`. Các lệnh dưới chạy trong checkout Console chứa hotfix `4a36177`; chưa thay đổi checkout Console trong nhiệm vụ này.

1. Cập nhật dependency và lockfile, tạm không chạy postinstall vì guard hiện pin 20.2.7:

   ```powershell
   npm install --save-exact @sdcorejs/angular@20.2.8 --ignore-scripts
   ```

2. Thay `patches/@sdcorejs+angular+20.2.7.patch` bằng file [`@sdcorejs+angular+20.2.8.patch`](@sdcorejs+angular+20.2.8.patch) đính kèm. File này lấy từ commit `4a36177`, bỏ riêng toàn bộ diff block của `fesm2022/sdcorejs-angular-services-loading.mjs`, giữ nguyên năm block còn lại:

   - `configurations/index.d.ts`
   - `fesm2022/sdcorejs-angular-configurations.mjs`
   - `fesm2022/sdcorejs-angular-modules-layout.mjs`
   - `modules/layout/index.d.ts`
   - `fesm2022/sdcorejs-angular-components-tab-router.mjs`

   Xóa file patch mang version 20.2.7 sau khi đã đặt file 20.2.8 vào đúng thư mục. Nếu Console đã bổ sung patch sau `4a36177`, rebase các hunk bổ sung thay vì ghi đè chúng bằng bản đính kèm.

3. Trong `scripts/apply-core-ui-patches.mjs`, đổi guard thành `core.version !== "20.2.8"`; sửa thông báo thành layout/tab-router patches target Core UI 20.2.8. Giữ `--error-on-fail` và postinstall hook. Cập nhật `patches/README.md` để ghi loading fix đã thuộc upstream, layout/tab-router vẫn cần giữ.

4. Kiểm tra cài sạch và regression trước khi deploy:

   ```powershell
   npm ci
   npm run test:unit -- --include=src/app/console/console-loading-layout.spec.ts --include=src/app/shell/main.component.spec.ts
   npm run build
   ```

   Giữ test loading-layout hiện có. Chạy thêm regression tenant/tab identity của Console và full checks theo quy trình Console. Không tăng budget production bundle để né lỗi layout token.

## Phiên bản và trạng thái phát hành

- Candidate: `19.2.8`, **`20.2.8` cho Console**, `21.2.8`, `22.2.8`.
- Đã chuẩn bị package manifests, CHANGELOG section 2.8, workflow pin `v2.8`, baseline 2.7 và snapshot `scripts/release-contracts/2.8.json`. Không sửa archive `published-docs`/`published-pages`.
- Local tarballs: `C:/Users/Admin/AppData/Local/Temp/sdcorejs-angular-loading-main-2.8/v{19,20,21,22}/`.
- SHA-256 tarball `sdcorejs-angular-20.2.8.tgz`: `6388c80a5d50bc19b3835a891854a7f3160b93eb777740b41a8710ec36656997`.
- Local staging được build từ commit tích hợp `48629b1b`, chứa loading fix `e2b324c8` và main `f53358d7`. CI phải build lại từ release commit được gắn tag.
- Source loading đã commit (`e2b324c8`), push và merge vào `main` tại PR #53 (`f65ba0fa`); toàn bộ sáu CI jobs của PR đã GREEN. **Chưa tạo tag hay publish npm.** Chưa nâng cấp/deploy Console; npm 20.2.8 chỉ được xem là phát hành sau postpublish GREEN.
- Bước phát hành tiếp theo: merge bản tích hợp vào `main`, tạo/push `v2.8`, để trusted-publishing CI verify/build/publish bốn dòng. Chỉ sau postpublish GREEN mới sinh docs/page và triển khai nâng cấp Console.

## Tiếp nối Sidebar V3

Nhánh `feat/sidebar-v3-hierarchy` được tạo từ main `f65ba0fa` sau khi merge loading. Candidate của nhánh này thêm hierarchy V3 và cập nhật snapshot 2.8; đây vẫn là preflight chưa publish. Kết quả và thiết kế ở `.sdcorejs/docs/design/sidebar-v3-hierarchy.md`.

Năm diff block Console còn lại đã được apply-check với build có Sidebar V3. File patch giữ nguyên các hunk; `.gitattributes` cục bộ giữ LF để checkout Windows không chuyển context của npm bundles sang CRLF.
