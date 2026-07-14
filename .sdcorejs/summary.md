---
generated_at: 2026-07-15T00:52:00+07:00
git_head: 9b5f3f7ec6d8da66d06f614ea6cd4ecadb511bef
branch: feat/showcase-release-branding
tracks: [angular, documentation, node]
generator: sdcorejs-explore
target_root: C:/Users/Admin/Documents/sdcorejs/sdcorejs-angular
target_root_kind: target-project
dirty: true
relevant_dirty_paths:
  - versions/v19/projects/sdcorejs-angular/forms/datetime
  - versions/v20/projects/sdcorejs-angular/forms/datetime
  - versions/v21/projects/sdcorejs-angular/forms/datetime
  - versions/v19/package.json
  - versions/v20/package.json
  - versions/v21/package.json
  - .sdcorejs/docs/angular
  - .sdcorejs/documentation
  - .sdcorejs/tasks
  - .sdcorejs/memories
stack_profiles: [core-ui-angular, node-general]
profile_confidence: high
package_manager: npm
summary_scope: sd-datetime shared picker migration and multi-version rollout
---

# Project Summary - sdcorejs-angular

## What this project is

- Repository nguồn của package npm `@sdcorejs/angular`, duy trì đồng thời các line Angular 19, 20 và 21.
- `versions/v19` là source of truth; root `npm run sync` rollout thay đổi tương thích sang v20/v21 và `npm run check:sync` kiểm tra parity.
- Showcase v19 cũng là documentation site dùng để smoke-test các secondary entrypoint của library.

## Stack & track

- Track chính: Angular library/component; track phụ: documentation và Node/PowerShell tooling.
- Angular Material/CDK, standalone components, signals và ng-packagr.
- Mỗi workspace có `package.json`, `package-lock.json`, Angular config và build/test scripts riêng.

## Architecture map

- Library source: `versions/v19/projects/sdcorejs-angular`.
- Datetime wrapper: `versions/v19/projects/sdcorejs-angular/forms/datetime`.
- Showcase route kiểm tra datetime: `/forms/datetime` từ `versions/v19/projects/showcase`.
- Rollout scripts: root `scripts/sync-multi-version-workspaces.ps1` và `scripts/check-version-sync.mjs`.
- v20/v21 là derived workspaces; không hand-edit shared logic trước khi v19 đã đúng.

## Reusable building blocks

- `SdDatetime` tiếp tục sở hữu SDCoreJS form integration, model format, validation, i18n và viewed/inline behavior.
- `@sdcorejs/angular-material-datetime` cung cấp picker overlay, time spinner, adapter, DI tokens và action directives.
- Focused Karma suite nằm cạnh `datetime.component.ts`; production build qua ng-packagr kiểm tra package metadata và external dependency resolution.

## Conventions detected

- Thay đổi shared logic ở v19 trước, sau đó chạy sync và review diff v20/v21.
- Runtime dependency không phải peer phải xuất hiện trong workspace manifest, published-library manifest, lockfile và `allowedNonPeerDependencies`.
- Không trộn class/token từ source vendored với public package entrypoint vì Angular DI dựa trên identity.
- Không hand-edit `published-docs/**`; release docs do workflow tạo sau publish.

## Reuse cheatsheet

- Test focused: `npm --prefix versions/v19 run test:ci -- --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts`.
- Build library: `npm --prefix versions/v19 run build`.
- Rollout/check: `npm run sync`, rồi `npm run check:sync`.
- Dependency proof: `npm --prefix versions/v19 ls @sdcorejs/angular-material-datetime --depth=0`.

## Open context

- Migration `@sdcorejs/angular-material-datetime@1.0.3` đã được triển khai ở v19 và rollout bằng root sync sang v20/v21; source vendored đã được loại bỏ ở cả ba workspace.
- `SdDatetime.open()` dùng `setValue()` trước `open()` để package 1.0.3 khởi tạo draft từ model hiện tại; regression tests bao phủ initial model và external model update.
- Focused datetime suites đạt `66/66` và production builds đạt trên v19/v20/v21; exact manifests/locks/dist metadata, sync và diff checks đều đạt.
- Full library suites hiện cùng có `3156 pass, 18 fail, 9 skip`; 18 failure thuộc các component ngoài datetime diff và coverage threshold toàn cục chưa đạt.
- Deep dependency tree v20 exit 1 do Angular peer-minor mismatch có sẵn ở HEAD; v19/v21 đạt và cả ba resolve exact datetime package `1.0.3`.
- Visual/click showcase smoke chưa chạy vì browser runtime trả `No browser is available`; HTTP route đã trả 200 ở lần serve trước.
- Independent review/repair không còn finding mở. Technical doc, user guide, screenshot script, task tracker và durable memory đã được tạo/cập nhật.
- Verify-before-done chưa xanh. Sau khi nhận đầy đủ báo cáo gap, người dùng đã yêu cầu commit/push `release/1.3`; đây là ship-with-known-gaps, không phải reclassify các criterion thành pass.

## Freshness

- Summary phản ánh branch `feat/showcase-release-branding` tại HEAD `9b5f3f7ec6d8da66d06f614ea6cd4ecadb511bef`.
- Summary phản ánh working tree sau implementation, repair, documentation và fresh final verification ngày 2026-07-15.
