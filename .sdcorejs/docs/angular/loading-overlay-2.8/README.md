# Core UI loading overlay — bản vá 2.8

Ngày kiểm chứng: 2026-09-10. Repository sở hữu source và artifact: `sdcorejs-angular`.
Phạm vi: lỗi CSS giữa `SdLoadingService` và `SdButton`; chuẩn bị bản vá cho bốn Angular major.

## Nguyên nhân và sửa tại nguồn

Core UI 20.2.7 dùng `.sd-loading` cho cả trạng thái button lẫn overlay service. Rule global của service áp `position: absolute`, `inset: 0`, kích thước 100% và `z-index: 99999` lên button. Stylesheet còn sống sau `ref.close()` cho đến khi service owner cuối cùng bị destroy, nên chỉ đóng overlay không giải quyết xung đột.

Sửa canonical `versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.ts`, rồi chạy `npm run sync`:

- Gắn `data-sd-loading-overlay` khi service tạo overlay.
- Scope rule overlay thành `.sd-loading[data-sd-loading-overlay]`.
- Scope spinner thành `.sd-loading[data-sd-loading-overlay] > .sd-loading-spinner`.
- Đồng bộ kiểm tra rule trong cơ chế nhận diện/augment stylesheet.

Không đổi code `SdButton`, API, class hiện hữu, keyframes, contribution/ref counting, ownership giữa các injector, phục hồi `aria-busy`, SSR hay cleanup đồng bộ. So sánh package với npm `*.2.7` xác nhận cả bốn dòng giữ nguyên declarations, exports và danh sách file; authored runtime source chỉ đổi `loading.service.ts`.

Overlay ở vùng nội dung được định vị riêng vẫn để header và nút đóng drawer tương tác. `start()` mặc định phủ document body vẫn giữ hành vi overlay toàn trang hiện có; bản vá không đổi mô hình định vị/scroll của overlay.

## Kiểm chứng

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
- Local tarballs: `C:/Users/Admin/AppData/Local/Temp/sdcorejs-angular-loading-2.8/v{19,20,21,22}/`.
- SHA-256 tarball `sdcorejs-angular-20.2.8.tgz`: `ae6353f1a129b593e16492a2eb0ad663af67144df9d315a85c75dec8d4bb124b`.
- Đây là preflight từ working tree dựa trên `a2baadbc3182535ba7749a6c163851d4e97a5705`; metadata source SHA của local staging là base HEAD, chưa phải release commit chứa fix. CI phải build lại từ release commit đã merge.
- **Chưa commit, push, tạo tag hay publish npm.** Chưa nâng cấp/deploy Console. Không gọi bản npm đã phát hành là có fix.
- Bước phát hành tiếp theo: review/commit patch, merge vào `main`, tạo/push `v2.8`, để trusted-publishing CI verify/build/publish bốn dòng. Chỉ sau postpublish GREEN mới sinh docs/page và triển khai nâng cấp Console.
