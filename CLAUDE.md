# sdcorejs-angular — Claude Code Instructions

Multi-version mirror + publish pipeline cho npm package `@sdcorejs/angular`. **Đây KHÔNG phải source repo** — code thực ở `vn-angular`. Repo này tồn tại chỉ để build + publish package cho 3 major Angular (19/20/21).

## Khái niệm cốt lõi

```
                       vn-angular (PRIVATE source, vendor monorepo)
                              │
                              │  scripts/sync-from-vn-angular.ps1
                              ▼
                  versions/v19/  ← canonical Angular 19 workspace
                              │
                              │  scripts/sync-multi-version-workspaces.ps1
                              ├──────────────────────┐
                              ▼                      ▼
                       versions/v20/         versions/v21/
                       (Angular 20)          (Angular 21)
                              │                      │
                              │  scripts/deploy.ps1  │
                              ▼                      ▼
                @sdcorejs/angular@20.x.y     @sdcorejs/angular@21.x.y
                          (npm)                    (npm)
                              ▲
                              │
                       @sdcorejs/angular@19.x.y (npm, from v19)
```

- **Source of truth**: `lib-core-angular/vn-angular` (private). Sống code, test, demo, showcase ở đó.
- **Mirror layer**: `versions/v19` (sync 1:1 từ vn-angular). v20 + v21 dẫn xuất từ v19 — chỉ khác peerDeps Angular major + lockfile.
- **Publish artifact**: 3 phiên bản npm cùng tên `@sdcorejs/angular`, version theo Angular major (19.x.y / 20.x.y / 21.x.y).

## Anti-patterns — TUYỆT ĐỐI KHÔNG

- ❌ Sửa trực tiếp file trong `versions/v19/**`, `v20/**`, `v21/**` — sync script sẽ ghi đè.
- ❌ Commit code logic mới vào repo này — về vn-angular sửa rồi sync lại.
- ❌ Đổi tên package trong từng version để có `@sdcorejs/angular-v19`/`-v20` — strategy hiện tại là 1 package name, version Angular major.
- ❌ Publish từ workspace nào KHÔNG khớp Angular major (vd build v20 → publish 21.x.y) — deploy.ps1 đã ràng buộc nhưng đừng workaround.

## Scripts

| Script | Mục đích | Khi chạy |
| --- | --- | --- |
| `scripts/sync-from-vn-angular.ps1` | Copy code từ `vn-angular` → `versions/v19` | Sau mỗi commit ở vn-angular cần sync ra |
| `scripts/sync-multi-version-workspaces.ps1` | Dẫn xuất `v19` → `v20` + `v21` (đổi peerDeps Angular major, regen lockfile) | Sau khi `sync-from-vn-angular` chạy xong |
| `scripts/deploy.ps1` | Build + publish 3 phiên bản npm | Khi release stable hoặc beta |

`npm run sync` (root package.json) gọi `sync-from-vn-angular.ps1` shorthand.

### Quy trình sync chuẩn

```powershell
# 1. Sync code từ vn-angular vào v19 (canonical)
npm run sync

# 2. Lan toả v19 → v20 + v21
powershell -ExecutionPolicy Bypass -File ./scripts/sync-multi-version-workspaces.ps1

# 3. Commit
git add -A
git commit -m "Sync with vn-angular@<commit-hash>"
git push
```

### Quy trình deploy npm — qua GitHub Actions (khuyến nghị)

Workflow: `.github/workflows/publish-npm.yml`. Auth qua secret `NPM_TOKEN` (repo Settings > Secrets and variables > Actions). KHÔNG cần `npm login` local.

**Trigger**:
- Push tag `v<patch>` → publish 19.<patch> / 20.<patch> / 21.<patch>.
  - `v0.5` → 19.0.5 / 20.0.5 / 21.0.5 (npm tag=latest).
  - `v0.5-beta.1` → 19.0.5-beta.1 / 20.0.5-beta.1 / 21.0.5-beta.1 (npm tag=beta).
- Manual dispatch trên Actions tab → nhập patch + tag (beta/latest).

Workflow matrix [v19/v20/v21] chạy song song, mỗi job:
1. Resolve patch + dist-tag từ tag/dispatch input.
2. Ghi `${major}.${patch}` vào `versions/v<N>/projects/sdcorejs-angular/package.json`.
3. `npm ci --legacy-peer-deps` trong workspace.
4. `ng build sdcorejs-angular`.
5. `npm publish --tag <beta|latest>` từ `dist/sdcorejs-angular`.

**Tag stable 19.0.0/20.0.0/21.0.0**:
```bash
git tag v0.0
git push origin v0.0
```

### Quy trình deploy npm — local fallback (deploy.ps1)

Khi không thể đẩy qua Actions (vd debug):
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/deploy.ps1 -PatchVersion "0.5"

# -DryRun: chạy full flow (write version + install + build) nhưng SKIP `npm publish`.
# Để verify build pass + version đúng trước khi push thật. Log có dòng "[DRY RUN] No changes will be made."
powershell -ExecutionPolicy Bypass -File ./scripts/deploy.ps1 -PatchVersion "0.5" -DryRun
```
Yêu cầu auth local: `npm login --scope=@sdcorejs`.

### Showcase deploy lên GitHub Pages

Workflow: `.github/workflows/deploy-pages.yml`. Build showcase v19 → upload Pages artifact → deploy.

**Trigger**:
- Push lên branch `001` (mặc định hiện tại) khi đổi file trong `versions/v19/projects/{showcase,sdcorejs-angular}/**`, `angular.json`, `package*.json`, hoặc workflow.
- Manual dispatch.

**Yêu cầu setup repo** (1 lần): Settings > Pages > Source = **"GitHub Actions"** (KHÔNG dùng branch source).

URL Pages sau deploy: `https://sdcorejs.github.io/sdcorejs-angular/` (theo repo name → `base-href=/sdcorejs-angular/`).

Workflow:
1. Build `sdcorejs-angular` lib (showcase phụ thuộc qua tsconfig path).
2. Build showcase `--configuration production --base-href=/sdcorejs-angular/`.
3. Copy `index.html → 404.html` (SPA fallback cho deep links).
4. Upload `dist/showcase/browser` → deploy-pages action.

## Trạng thái publish (snapshot 2026-05-31)

- npm registry: `@sdcorejs/angular` **chưa publish lần nào** (`npm view` trả về 404).
- Package.json hiện tại: `"version": "19.0.0-beta.104"` (placeholder local).
- **Sẵn sàng publish 19.0.0 / 20.0.0 / 21.0.0?** ✅ Về mặt pipeline:
  - GitHub Actions `publish-npm.yml` auto-ghi version theo matrix major × tag patch.
  - Tag `v0.0` push lên repo → publish 19.0.0 / 20.0.0 / 21.0.0 song song qua matrix.
  - Auth qua secret `NPM_TOKEN` (đã có sẵn).
- ⚠️ Trước khi publish stable cần verify:
  - `npm run test:ci` ở vn-angular xanh (2717+ tests passed lần gần nhất).
  - Mỗi `versions/v<N>` chạy được `ng build sdcorejs-angular` không error — chạy workflow_dispatch trên `publish-npm.yml` với patch giả `0.0-dryrun.1` để test trước (publish sẽ về beta tag, an toàn).
  - Hoặc dùng `deploy.ps1 -DryRun` local nếu muốn kiểm thử nhanh không publish.
  - Verify peerDeps Angular major khớp với từng workspace (v19 → Angular 19, etc.) — sync-multi-version-workspaces đã handle.

## Known issues

- **Sync script ghi mojibake**: `sync-multi-version-workspaces.ps1` viết arrow `→` thành `â†'` trong `SYNC-STATUS.md`, và để `Source Commit | unknown` thay vì hash thực. Fix manual sau mỗi sync bằng `sed` (xem commit `03f5a9d`).
- **BOM UTF-8 trong md files**: file md có BOM (`﻿`) ở đầu — không ảnh hưởng render, nhưng nếu có script đọc file bằng latin1 thì lại sinh mojibake. Cẩn thận với encoding khi viết tool xử lý docs.
- **package.json double-space**: sync-multi-version có lúc ghi double-space `"key":  "value"`. Sync sau dọn về single-space — diff noise.

## Trees + git

Branch hiện tại: `001` (sync với `origin/001`). Branch chính ngược lên main flow chưa thiết lập rõ — hỏi user trước khi push vào branch khác.

## See also

- Vn-angular workspace: `c:\Users\Admin\Documents\lib-core-angular\vn-angular`
- Vn-angular CLAUDE.md: chứa hướng dẫn dev/test/architecture chi tiết của library.
- SYNC-STATUS.md mỗi `versions/v<N>/`: bản ghi commit + thời điểm sync gần nhất.
