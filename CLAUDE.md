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
- Push lên `main` khi đổi file trong `versions/v19/projects/{showcase,sdcorejs-angular}/**`, `angular.json`, `package*.json`, hoặc workflow.
- Manual dispatch.

**Yêu cầu setup repo** (1 lần): Settings > Pages > Source = **"GitHub Actions"** (KHÔNG dùng branch source).

URL Pages sau deploy: `https://sdcorejs.github.io/sdcorejs-angular/` (theo repo name → `base-href=/sdcorejs-angular/`).

Workflow:
1. Build `sdcorejs-angular` lib (showcase phụ thuộc qua tsconfig path).
2. Build showcase `--configuration production --base-href=/sdcorejs-angular/`.
3. Copy `index.html → 404.html` (SPA fallback cho deep links).
4. Upload `dist/showcase/browser` → deploy-pages action.

## Changelog & semver

**CHANGELOG độc lập.** `@sdcorejs/angular` deploy theo nhịp riêng → có **CHANGELOG.md riêng ở root repo này**, KHÔNG dùng changelog của `vn-angular` (`@sd-angular/core`). Hai package versioning khác nhau, release cadence khác nhau.

- **Canonical**: `sdcorejs-angular/CHANGELOG.md` (root). Keyed theo **patch tag** (`0.0`, `0.1`, …) — đơn vị release thực. Mỗi entry ghi `Synced from vn-angular@<commit>` để truy vết. Một release có thể gộp nhiều commit vn-angular.
- **Một entry cho cả 3 major.** Tag `v<patch>` publish 19.x.y / 20.x.y / 21.x.y **cùng nội dung feature** — chỉ khác Angular shim. Không tách entry theo major.
- **Sync KHÔNG đụng changelog.** Cả 2 sync script đã `/XF CHANGELOG.md` → vn-angular changelog không mirror vào `versions/**`. Không còn `versions/v<N>/CHANGELOG.md` (đã xoá). Per-version chỉ tra `SYNC-STATUS.md`.
- **Đừng đưa shim per-major vào changelog** (vd `DomPortalOutlet` 4-arg vs 3-arg) — plumbing của sync, không phải API consumer.

### Release ritual (đúng thứ tự)

Changelog viết TRỰC TIẾP ở repo này (không cắt ở vn-angular):

```
1. sdcorejs-angular: npm run sync                  (sync CODE từ vn-angular; changelog KHÔNG bị đụng)
                     → ghi nhớ commit hash từ output / SYNC-STATUS.md
2. sdcorejs-angular: sửa root CHANGELOG.md
                     ## [Unreleased]  →  ## [<patch>] - YYYY-MM-DD
                     thêm: Published 19.<patch>/20.<patch>/21.<patch> + Synced from vn-angular@<commit>
                     thêm ## [Unreleased] rỗng mới ở trên
3. sdcorejs-angular: git add -A && commit && push
                     git tag v<patch> && git push origin v<patch>   → CI publish
```

(Tuỳ chọn: tag vn-angular cùng `v<patch>` nếu muốn đánh dấu source commit — không bắt buộc vì changelog đã ghi commit hash.)

### Semver với scheme này

Tag format `^\d+\.\d+$` (vd `0.0`) — major digit **bị khoá theo Angular line**, không phải theo semver. Hệ quả: breaking change KHÔNG thể tăng major. Quy ước:

| Loại thay đổi | Bump patch suffix |
| --- | --- |
| Thêm component / input (backward-compat) | `0.0 → 0.1` |
| Bugfix | `0.0 → 0.1` (chỉ có 2 segment) |
| **Breaking consumer API** | bump + **bắt buộc** mục `### Changed (BREAKING for consumers)` + migration diff trong changelog |

⚠️ Version number một mình KHÔNG signal được breaking (major khoá theo Angular). Consumer phải **đọc changelog**, không chỉ tin semver. Consumer luôn pin major: `npm i @sdcorejs/angular@^19.0.0`.

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

- **package-lock.json v20/v21 stale (pin Angular 19)**: sync rollout bump Angular major trong `package.json` nhưng KHÔNG regen lockfile → lock vẫn Angular 19. Vì vậy CI publish dùng `npm install --legacy-peer-deps` (KHÔNG `npm ci`) để resolve lại tree theo manifest. Nếu muốn quay lại `npm ci`: phải regen lock mỗi version sau bump (`npm install --package-lock-only --legacy-peer-deps` trong từng `versions/v<N>`) và commit — thêm bước network/slow vào sync.

- **Sync script ghi mojibake**: `sync-multi-version-workspaces.ps1` viết arrow `→` thành `â†'` trong `SYNC-STATUS.md`, và để `Source Commit | unknown` thay vì hash thực. Fix manual sau mỗi sync bằng `sed` (xem commit `03f5a9d`).
- **BOM UTF-8 trong md files**: file md có BOM (`﻿`) ở đầu — không ảnh hưởng render, nhưng nếu có script đọc file bằng latin1 thì lại sinh mojibake. Cẩn thận với encoding khi viết tool xử lý docs.
- **package.json double-space**: sync-multi-version có lúc ghi double-space `"key":  "value"`. Sync sau dọn về single-space — diff noise.

## Trees + git

Branch chính: `main`. Branch feature `001` dùng tạm để chuẩn bị PR vào main. Sau khi `main` ổn định, deploy-pages auto-trigger trên `main`. Hỏi user trước khi push vào branch khác.

## See also

- Vn-angular workspace: `c:\Users\Admin\Documents\lib-core-angular\vn-angular`
- Vn-angular CLAUDE.md: chứa hướng dẫn dev/test/architecture chi tiết của library.
- SYNC-STATUS.md mỗi `versions/v<N>/`: bản ghi commit + thời điểm sync gần nhất.
