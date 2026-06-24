# sdcorejs-angular — Claude Code Instructions

Multi-version source + publish pipeline cho npm package `@sdcorejs/angular`.

**Final legacy sync đã chốt:** `vn-angular@d12478a1` vào 2026-06-24. Từ mốc này, `@sdcorejs/angular` phát triển độc lập trong repo này; không quay về `vn-angular` cho thay đổi mới.

## Khái niệm cốt lõi

```
                  versions/v19/  ← primary repo-owned Angular 19 workspace
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

- **Source of truth**: `versions/v19` trong repo này. Sống code, test, docs npm-facing và showcase ở đây sau final sync.
- **Rollout layer**: `versions/v20` + `versions/v21` dẫn xuất từ v19 — chỉ khác peerDeps Angular major + shim cần thiết.
- **Publish artifact**: 3 phiên bản npm cùng tên `@sdcorejs/angular`, version theo Angular major (19.x.y / 20.x.y / 21.x.y).

## Anti-patterns — TUYỆT ĐỐI KHÔNG

- ❌ Sửa trực tiếp `versions/v20/**` hoặc `versions/v21/**` cho logic chung — sửa `versions/v19/**` trước rồi rollout bằng `scripts/sync-multi-version-workspaces.ps1`.
- ❌ Chạy sync legacy từ `vn-angular` cho phát triển bình thường — script đã bị guard vì có thể ghi đè thay đổi độc lập.
- ❌ Đổi tên package trong từng version để có `@sdcorejs/angular-v19`/`-v20` — strategy hiện tại là 1 package name, version Angular major.
- ❌ Publish từ workspace nào KHÔNG khớp Angular major (vd build v20 → publish 21.x.y) — deploy.ps1 đã ràng buộc nhưng đừng workaround.

## Scripts

| Script | Mục đích | Khi chạy |
| --- | --- | --- |
| `scripts/sync-from-vn-angular.ps1` | Legacy recovery only: copy code từ `vn-angular` → `versions/v19` | Không chạy mặc định; cần `-AllowLegacySync` trên clean branch |
| `scripts/sync-multi-version-workspaces.ps1` | Dẫn xuất `v19` → `v20` + `v21` (đổi peerDeps Angular major, ghi workspace status) | Sau khi thay đổi repo-owned trong `v19` cần rollout |
| `scripts/deploy.ps1` | Build + publish 3 phiên bản npm | Khi release stable hoặc beta |

`npm run sync` là entry point rollout bình thường: lấy `versions/v19` làm nguồn rồi đồng bộ sang `versions/v20` và `versions/v21`. Nếu cần tái hiện mirror cũ để điều tra lịch sử, dùng `npm run legacy:sync-from-vn-angular` trên một branch sạch.

### Quy trình phát triển độc lập

```powershell
# 1. Sửa code/docs/test/showcase trong versions/v19
cd versions/v19
npm test -- --watch=false

# 2. Lan toả v19 → v20 + v21
cd ../..
npm run sync

# 3. Verify/build rồi commit
git add -A
git commit -m "<type>: <summary>"
git push
```

### Quy trình deploy npm — qua GitHub Actions (khuyến nghị)

Workflow: `.github/workflows/publish-npm.yml`. Auth qua secret `NPM_TOKEN` (repo Settings > Secrets and variables > Actions). KHÔNG cần `npm login` local.

**Trigger**:
- Push tag `v<patch>` → publish 19.<patch> / 20.<patch> / 21.<patch>.
  - `v0.5` → 19.0.5 / 20.0.5 / 21.0.5 (npm tag=latest).
  - `v0.5-beta.1` → 19.0.5-beta.1 / 20.0.5-beta.1 / 21.0.5-beta.1 (npm tag=beta).
- Manual dispatch trên Actions tab → nhập patch + tag (beta/latest). Nhánh này chỉ dùng cho publish/debug thủ công; `published-docs` public được buộc vào tag flow.

Workflow matrix [v19/v20/v21] chạy song song, mỗi job:
1. Resolve patch + dist-tag từ tag/dispatch input.
2. Ghi `${major}.${patch}` vào `versions/v<N>/projects/sdcorejs-angular/package.json`.
3. `npm install --legacy-peer-deps` trong workspace.
4. `ng build sdcorejs-angular`.
5. `npm publish --tag <beta|latest>` từ `dist/sdcorejs-angular`.

Sau khi cả 3 matrix job publish thành công, job `publish-docs` chạy một lần trên tag:
1. Verify tag đang trỏ đúng `origin/main` để docs snapshot khớp source release.
2. Chạy `npm run collect-release-docs -- --patch <patch> --date <UTC-date> --skip-existing`.
3. Sinh đủ `published-docs/19.<patch>/`, `published-docs/20.<patch>/`, `published-docs/21.<patch>/`.
4. Commit archive về `main`; push này kích hoạt `deploy-pages.yml` copy docs lên Pages.

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
- Push lên `main` khi đổi file trong `versions/v19/projects/{showcase,sdcorejs-angular}/**`, `angular.json`, `package*.json`, `published-docs/**`, `scripts/collect-*.mjs`, hoặc workflow.
- Manual dispatch.

**Yêu cầu setup repo** (1 lần): Settings > Pages > Source = **"GitHub Actions"** (KHÔNG dùng branch source).

URL Pages sau deploy: `https://sdcorejs.github.io/sdcorejs-angular/` (theo repo name → `base-href=/sdcorejs-angular/`).

Workflow:
1. Build `sdcorejs-angular` lib (showcase phụ thuộc qua tsconfig path).
2. Build showcase `--configuration production --base-href=/sdcorejs-angular/`.
3. Copy `published-docs/**` → `dist/showcase/browser/docs/` + dựng alias `docs/latest/` (xem "API docs cho AI agent" dưới).
4. Copy `index.html → 404.html` (SPA fallback cho deep links).
5. Upload `dist/showcase/browser` → deploy-pages action.

### API docs cho AI agent (versioned, public trên Pages)

Toàn bộ API docs (`*.md`) của lib được publish dạng raw Markdown trên Pages, namespaced theo version, để AI agent fetch qua URL mà KHÔNG cần clone local.

- **Nguồn**: `versions/v19|v20|v21/projects/sdcorejs-angular/**/*.md`. Loại `HANDOFF.md` (nội bộ).
- **Generator release**: `scripts/collect-release-docs.mjs` (`npm run collect-release-docs -- --patch 0.5`) → gọi collector cho đủ 3 workspace và ghi **`published-docs/19.0.5/`**, **`published-docs/20.0.5/`**, **`published-docs/21.0.5/`** + refresh **`published-docs/versions.json`** registry.
- **Generator đơn lẻ/debug**: `scripts/collect-docs.mjs --workspace v19 --version 19.0.5`. Mặc định KHÔNG overwrite archive đã tồn tại; dùng `--force` chỉ khi cố ý rebuild, `--skip-existing` cho CI idempotent.
- **URL** (sau deploy):
  - `…/docs/versions.json` — registry mọi version + `latest`
  - `…/docs/<version>/index.json` — manifest (`{ id, title, category, path, url }` × ~79 doc)
  - `…/docs/<version>/forms/select/sd-select.md` — raw doc
  - `…/docs/latest/index.json` — alias bản mới nhất (dựng ở deploy, không commit)
- **Archive vĩnh viễn**: Pages thay artifact mỗi deploy → muốn nhiều version cùng sống thì docs phải **committed** trong `published-docs/`; deploy chỉ copy vào dist. ĐỪNG hand-edit `published-docs/<version>/**`; sửa source workspace rồi chạy generator. Docs public cho release mới chỉ sinh sau tag publish thành công, không sinh thủ công trước tag.

## README & CHANGELOG

`@sdcorejs/angular` là pack public MIT, wording công khai, và hiện là pack độc lập. README/CHANGELOG do repo này tự sở hữu.

- **CHANGELOG**: canonical = `CHANGELOG.md` ở root repo. Các entry cũ giữ `Synced from vn-angular@...`; entry mới ghi thay đổi repo-owned.
- **README npm-facing**: canonical là **`docs/npm-README.md`**. Khi rollout, copy nội dung này vào `versions/v19/projects/sdcorejs-angular/README.md`, rồi lan sang v20/v21. **Muốn đổi README npm → sửa `docs/npm-README.md`**.
- **README root** `README.md`: GitHub landing, repo tự sở hữu.
- Component docs (`sd-*.md`) sống trong source workspace và được publish qua `collect-docs`.

## Changelog & semver

**CHANGELOG độc lập.** `@sdcorejs/angular` deploy theo nhịp riêng → có **CHANGELOG.md riêng ở root repo này**. Sau final sync, không dùng changelog của `vn-angular`.

- **Canonical**: `sdcorejs-angular/CHANGELOG.md` (root). Keyed theo **patch tag** (`0.0`, `0.1`, …) — đơn vị release thực. Entry trước 2026-06-24 ghi `Synced from vn-angular@<commit>` để truy vết; entry mới ghi source là repo-owned.
- **Một entry cho cả 3 major.** Tag `v<patch>` publish 19.x.y / 20.x.y / 21.x.y **cùng nội dung feature** — chỉ khác Angular shim. Không tách entry theo major.
- **Legacy sync KHÔNG đụng changelog.** Không còn `versions/v<N>/CHANGELOG.md`. Per-version tra `SYNC-STATUS.md` / workspace status.
- **Đừng đưa shim per-major vào changelog** (vd `DomPortalOutlet` 4-arg vs 3-arg) — plumbing của sync, không phải API consumer.

### Release ritual (đúng thứ tự)

Changelog viết TRỰC TIẾP ở repo này:

```
1. sdcorejs-angular: sửa code/docs/test trong versions/v19
                     → rollout v19 sang v20/v21 bằng sync-multi-version-workspaces.ps1
2. sdcorejs-angular: sửa root CHANGELOG.md
                     ## [Unreleased]  →  ## [<patch>] - YYYY-MM-DD
                     thêm: Published 19.<patch>/20.<patch>/21.<patch> + repo-owned summary
                     thêm ## [Unreleased] rỗng mới ở trên
3. sdcorejs-angular: git add -A && commit && push
                     git tag v<patch> && git push origin v<patch>
                     → CI publish npm 19/20/21
                     → nếu publish thành công: CI sinh published-docs 19/20/21 và commit về main
```

Không tag hoặc sync `vn-angular` cho release mới.

### Semver với scheme này

Tag format `^\d+\.\d+$` (vd `0.0`) — major digit **bị khoá theo Angular line**, không phải theo semver. Hệ quả: breaking change KHÔNG thể tăng major. Quy ước:

| Loại thay đổi | Bump patch suffix |
| --- | --- |
| Thêm component / input (backward-compat) | `0.0 → 0.1` |
| Bugfix | `0.0 → 0.1` (chỉ có 2 segment) |
| **Breaking consumer API** | bump + **bắt buộc** mục `### Changed (BREAKING for consumers)` + migration diff trong changelog |

⚠️ Version number một mình KHÔNG signal được breaking (major khoá theo Angular). Consumer phải **đọc changelog**, không chỉ tin semver. Consumer luôn pin major: `npm i @sdcorejs/angular@^19.0.0`.

## Trạng thái publish (snapshot 2026-06-24)

- npm registry đã có các line `19.x`, `20.x`, `21.x`; latest stable hiện tại là `19.0.9` / `20.0.9` / `21.0.9`.
- Final legacy sync đã chốt ở `vn-angular@d12478a1`; release kế tiếp phát triển trực tiếp từ repo này.
- Trước khi publish stable cần verify:
  - Test/build liên quan trong `versions/v19` xanh trước khi rollout.
  - Mỗi `versions/v<N>` chạy được `ng build sdcorejs-angular` không error, hoặc dùng `deploy.ps1 -DryRun` local nếu muốn kiểm thử nhanh không publish.
  - Verify peerDeps Angular major khớp với từng workspace (v19 → Angular 19, etc.) — sync-multi-version-workspaces đã handle.

## Known issues

- **package-lock.json v20/v21 stale (pin Angular 19)**: sync rollout bump Angular major trong `package.json` nhưng KHÔNG regen lockfile → lock vẫn Angular 19. Vì vậy CI publish dùng `npm install --legacy-peer-deps` (KHÔNG `npm ci`) để resolve lại tree theo manifest. Nếu muốn quay lại `npm ci`: phải regen lock mỗi version sau bump (`npm install --package-lock-only --legacy-peer-deps` trong từng `versions/v<N>`) và commit — thêm bước network/slow vào sync.

- **Legacy sync archived**: `scripts/sync-from-vn-angular.ps1` chỉ chạy khi truyền `-AllowLegacySync`; không dùng cho phát triển thường ngày.
- **BOM UTF-8 trong md files**: file md có BOM (`﻿`) ở đầu — không ảnh hưởng render, nhưng nếu có script đọc file bằng latin1 thì lại sinh mojibake. Cẩn thận với encoding khi viết tool xử lý docs.

## Trees + git

Branch chính: `main`. Branch feature `001` dùng tạm để chuẩn bị PR vào main. Sau khi `main` ổn định, deploy-pages auto-trigger trên `main`. Hỏi user trước khi push vào branch khác.

## See also

- Legacy final sync source: `c:\Users\Admin\Documents\lib-core-angular\vn-angular` at `d12478a1` (`release/0.0.1`).
- `SYNC-STATUS.md` mỗi `versions/v<N>/`: bản ghi final sync + workspace rollout status.
