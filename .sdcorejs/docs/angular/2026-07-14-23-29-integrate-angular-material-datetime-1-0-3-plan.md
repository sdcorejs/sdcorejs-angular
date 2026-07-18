# Plan - Tích hợp angular-material-datetime 1.0.3 vào sd-datetime - 2026-07-14 23:29

## Scope

Hoàn tất migration đã bắt đầu ở commit `9b5f3f7`: thay exact runtime dependency
`@sdcorejs/angular-material-datetime@1.0.2` bằng `1.0.3`, chứng minh seam
wrapper/package ở v19, rollout source of truth sang v20/v21, cập nhật lockfile
riêng và giữ nguyên public API cùng hành vi của `SdDatetime`.

## Execution context

- Track: `angular`
- Target root: `C:/Users/Admin/Documents/sdcorejs/sdcorejs-angular`
- Source of truth: `versions/v19`
- Stack profile: `core-ui-angular`
- Coverage approach: `TDD` tại integration seam; test v19 hiện có phải được quan sát RED trước khi pin/install `1.0.3`, rồi GREEN trước rollout.
- Parallel candidates: focused test và production build của v19/v20/v21 có thể chạy độc lập sau khi task 6 hoàn tất; mọi edit, sync và lockfile update vẫn tuần tự.
- Approved spec: `.sdcorejs/specs/angular/2026-07-14-23-27-integrate-angular-material-datetime-1-0-3.md`
- Approved spec SHA-256: `e01dff859b1f1b2f706cc06ef0d6d9e65d04a6d99e06f82492eb5c465a0c50c7`
- Change control: revision 2; supersedes plan `.sdcorejs/plans/angular/2026-07-14-15-32-integrate-angular-material-datetime.md`.

### Allowed paths

- `versions/v19/package.json`
- `versions/v19/package-lock.json`
- `versions/v19/projects/sdcorejs-angular/package.json`
- `versions/v19/projects/sdcorejs-angular/ng-package.json`
- `versions/v19/projects/sdcorejs-angular/forms/datetime/**`
- `versions/v20/package.json`, `versions/v20/package-lock.json`
- `versions/v20/projects/sdcorejs-angular/package.json`
- `versions/v20/projects/sdcorejs-angular/ng-package.json`
- `versions/v20/projects/sdcorejs-angular/forms/datetime/**`
- `versions/v21/package.json`, `versions/v21/package-lock.json`
- `versions/v21/projects/sdcorejs-angular/package.json`
- `versions/v21/projects/sdcorejs-angular/ng-package.json`
- `versions/v21/projects/sdcorejs-angular/forms/datetime/**`
- `versions/v19/SYNC-STATUS.md`, `versions/v20/SYNC-STATUS.md`, `versions/v21/SYNC-STATUS.md`
- `.sdcorejs/docs/angular/*datetime*.md`
- `.sdcorejs/documentation/technical-docs/*datetime*.md`
- `.sdcorejs/documentation/user-guides/*datetime*.md`
- `.sdcorejs/summary.md`, `.sdcorejs/tasks/current-session.md`, `.sdcorejs/tasks/angular.md`
- `.sdcorejs/memories/angular/**` khi finish tail xác định có durable fact cần lưu

### Protected paths

- `.github/**`, root `package.json`, root `package-lock.json`, `scripts/**`
- `versions/v19/projects/showcase/**`, `versions/v20/projects/showcase/**`, `versions/v21/projects/showcase/**`
- `published-docs/**`, `images/**`, `**/.env*`
- Repository/package source bên ngoài target root
- Approved snapshots trong `.sdcorejs/specs/**` và `.sdcorejs/plans/**` sau khi plan này được snapshot

### Generated artifacts

- `versions/v19|v20|v21/{node_modules,dist,coverage,.angular}/**`
- Ba file `versions/v19|v20|v21/SYNC-STATUS.md`
- Process/runtime output tạm dùng cho browser smoke, không commit

## Tasks

### Phase 1 - Baseline protection và RED

1. **VERIFY** repo root, branch, HEAD, `git status --short`, approved-spec hash, registry metadata của `1.0.3`, và baseline hash/status của toàn bộ protected paths - chấp nhận các artifact planning `.sdcorejs` hiện tại, nhưng dừng nếu manifest/datetime source hoặc protected source có edit ngoài dự kiến.

2. **RUN** exact-version proof và focused suite trước mọi dependency edit - `npm --prefix versions/v19 ls @sdcorejs/angular-material-datetime@1.0.3 --depth=0` phải RED vì exact version chưa được cài, sau đó `npm --prefix versions/v19 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts` phải RED tại external package seam; xác nhận failure không đến từ Angular/toolchain thiếu hoặc test typo. Nếu behavioral suite pass ngoài dự kiến, giữ exact-version proof làm RED và bổ sung test integration nhỏ nhất chỉ khi acceptance behavior chưa được bao phủ.

### Phase 2 - v19 GREEN với package 1.0.3

3. **EDIT** `versions/v19/package.json`, `versions/v19/package-lock.json`, `versions/v19/projects/sdcorejs-angular/package.json` và `versions/v19/projects/sdcorejs-angular/forms/datetime/sd-datetime.md` - pin exact `1.0.3`, chạy install với `--save-exact --legacy-peer-deps`, giữ `allowedNonPeerDependencies` hiện có và cập nhật tài liệu version; không thay public entrypoint.

4. **RUN/EDIT** focused v19 suite đến GREEN - chạy lại command task 2; chỉ sửa tối thiểu `datetime.component.ts` hoặc `datetime.component.spec.ts` nếu test đã-RED chứng minh incompatibility thực tế của `1.0.3`. Giữ component-scoped adapter/token providers và các regression cho DI, open/disabled, Apply/Cancel/Now, seconds, min/max và overlay cleanup.

### Phase 3 - Multi-version rollout

5. **RUN** root `npm run sync` - mirror v19 library source, manifest, tests, docs và deletion của `forms/datetime/src/material-datetime` sang v20/v21; review ngay diff để xác nhận protected showcase/branding/scripts không đổi content.

6. **RUN/EDIT** workspace installs cho v20 và v21 - chạy exact install `@sdcorejs/angular-material-datetime@1.0.3 --save-exact --legacy-peer-deps` trong từng workspace để hydrate dependency và cập nhật lockfile riêng; xác nhận published-library manifest/ng-packagr/source đều đến từ rollout, không hand-edit shared logic ở derived workspaces.

### Phase 4 - Cross-version verification và UI smoke

7. **RUN** focused `datetime.component.spec.ts` suites ở v19, v20 và v21 - có thể fan-out theo workspace sau task 6; yêu cầu zero failure và output không có compile/DI/overlay cleanup error.

8. **RUN** production `sdcorejs-angular` builds ở v19, v20 và v21 - có thể fan-out theo workspace sau task 7; yêu cầu ng-packagr exit 0 và published metadata resolve runtime dependency `1.0.3`.

9. **VERIFY/RUN** repository invariants và browser smoke - kiểm tra `npm ls --all` cho exact dependency/Angular/CDK/Material tree ở ba workspace, assert built `dist/sdcorejs-angular/package.json` khai báo runtime dependency `1.0.3`, search không còn vendored import/path/folder, inspect public datetime entrypoint, chạy `npm run check:sync`, `git diff --check` và protected-path status assertion; serve showcase v19 với lifecycle generator bị tắt rồi mở `/forms/datetime` để kiểm tra popup, calendar, time spinner, action tiếng Việt, inline mode và console errors.

### Phase 5 - Mandatory finish tail

10. **RUN** finish tail theo thứ tự: `sdcorejs-test` evidence review; `sdcorejs-review`; `sdcorejs-repair-loop` cho finding đã xác minh; automatic code-documentation; Angular UI-impact check; documentation gate cho technical/user docs; auto-docs và auto-task-tracker; relevant-memory review; `sdcorejs-ship` verify-before-done; cuối cùng `sdcorejs-ship` branch-ready và không write thêm sau gate này.

## Acceptance mapping

- AC-1 -> tasks 3, 5, 6, 8, 9
- AC-2 -> tasks 3, 5, 9
- AC-3 -> tasks 2, 4, 7, 8, 9
- AC-4 -> tasks 2, 4, 7
- AC-5 -> tasks 2, 4, 7
- AC-6 -> tasks 5, 6, 9
- AC-7 -> tasks 7, 8, 9
- AC-8 -> tasks 9, 10
- AC-9 -> tasks 1, 5, 9, 10

## Verification

### RED/GREEN focused test

```powershell
npm --prefix versions/v19 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts
```

Chạy một lần trước dependency edit để xác nhận RED, rồi chạy lại sau v19 update để
xác nhận GREEN. Sau rollout, lặp lại với `versions/v20` và `versions/v21`.

### Dependency install và proof

```powershell
npm --prefix versions/v19 install @sdcorejs/angular-material-datetime@1.0.3 --save-exact --legacy-peer-deps
npm --prefix versions/v20 install @sdcorejs/angular-material-datetime@1.0.3 --save-exact --legacy-peer-deps
npm --prefix versions/v21 install @sdcorejs/angular-material-datetime@1.0.3 --save-exact --legacy-peer-deps

npm --prefix versions/v19 ls @sdcorejs/angular-material-datetime@1.0.3 @angular/core @angular/cdk @angular/material --all
npm --prefix versions/v20 ls @sdcorejs/angular-material-datetime@1.0.3 @angular/core @angular/cdk @angular/material --all
npm --prefix versions/v21 ls @sdcorejs/angular-material-datetime@1.0.3 @angular/core @angular/cdk @angular/material --all
```

### Production builds

```powershell
npm --prefix versions/v19 run build
npm --prefix versions/v20 run build
npm --prefix versions/v21 run build
```

Sau build, assert published metadata:

```powershell
'v19','v20','v21' | ForEach-Object {
  $manifest = Get-Content -Raw "versions/$_/dist/sdcorejs-angular/package.json" | ConvertFrom-Json
  if ($manifest.dependencies.'@sdcorejs/angular-material-datetime' -ne '1.0.3') {
    throw "versions/$_ dist metadata does not pin angular-material-datetime 1.0.3"
  }
}
```

### Repository integrity

```powershell
npm run check:sync
rg -n "from './material-datetime'|forms/datetime/src/material-datetime" versions/v19 versions/v20 versions/v21
git diff --check
git status --short

$protected = git status --short -- .github package.json package-lock.json scripts images published-docs versions/v19/projects/showcase versions/v20/projects/showcase versions/v21/projects/showcase
if ($protected) {
  $protected
  throw 'Protected paths changed during datetime migration'
}
```

Search command phải trả về không có reference buildable; absence của ba vendored
folders được kiểm tra riêng bằng `Test-Path`.

### Browser smoke

```powershell
npm --prefix versions/v19 --ignore-scripts run showcase -- --host 127.0.0.1 --port 4200
```

Mở `http://127.0.0.1:4200/forms/datetime` (legacy redirect được phép), thao tác
enabled picker và inline picker, kiểm tra Now/Cancel/Apply, seconds/min-max samples
nếu có, layout popup/action row và console/network errors. `--ignore-scripts`
ngăn `preshowcase` generator ghi source; nếu protected-path diff vẫn xuất hiện,
dừng và báo cáo thay vì tự động discard.

## Path conflicts and execution notes

- Tất cả EDIT paths đã tồn tại; v19 vendored folder đã bị xóa, còn v20/v21 folders tồn tại và sẽ bị sync xóa.
- Pre-plan `npm run check:sync` hiện RED chỉ ở expected datetime wrapper/tests/docs, library package/ng-package metadata và vendored files của v20/v21; không báo drift showcase hay feature khác.
- Working tree trước execution chỉ được phép có planning/context artifacts dưới `.sdcorejs`; production scope phải khớp HEAD `9b5f3f7`.
- `1.0.3` không source-equivalent hoàn toàn với picker vendored, nên browser smoke là bắt buộc và thay thế quyết định “không manual check” của plan revision 1.
- Full workspace lint không phải gate riêng vì task dùng focused Karma, TypeScript/ng-packagr production builds, showcase build và repository integrity checks; lint chỉ chạy nếu review tìm finding liên quan.
- Không commit, push, tag hoặc publish trong execution plan này nếu người dùng không yêu cầu riêng.
