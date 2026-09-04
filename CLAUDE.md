# sdcorejs-angular — Claude Code Instructions

Multi-version source + publish pipeline cho npm package `@sdcorejs/angular`.

> **Đây là bản đầy đủ.** [`AGENTS.md`](AGENTS.md) ở root là bản rút gọn cùng nội dung cho agent khác (Codex…), committed chứ không phải file local. **Đổi luật cứng / canonical path / release ritual ở đây thì cập nhật `AGENTS.md` trong cùng commit** — nó là summary, không phải nguồn độc lập.

**Final legacy sync đã chốt:** `vn-angular@d12478a1` vào 2026-06-24. Từ mốc này, `@sdcorejs/angular` phát triển độc lập trong repo này; không quay về `vn-angular` cho thay đổi mới.

## Khái niệm cốt lõi

```
                  versions/v19/  ← canonical repo-owned Angular 19 workspace
                              │
                              │  scripts/sync-multi-version-workspaces.ps1
                              ├──────────────────────┬──────────────────────┐
                              ▼                      ▼                      ▼
                       versions/v20/         versions/v21/         versions/v22/
                       (Angular 20)          (Angular 21)          (Angular 22)
                              └──────────────────────┴──────────────────────┘
                                                     │
                                                     ▼
                     @sdcorejs/angular@{19,20,21,22}.x.y (npm, cùng public API)
```

- **Source of truth**: `versions/v19` trong repo này. Shared library code, test và package documentation bắt đầu ở đây; `showcase/` là workspace độc lập ở root.
- **Rollout layer**: `versions/v20` + `versions/v21` + `versions/v22` dẫn xuất từ v19 — chỉ khác dependency/peer Angular-major và shim đã duyệt. Dòng v22 bắt đầu tại `22.2.5`, không có lịch sử v22 trước suffix `2.5`.
- **Publish artifact**: 4 phiên bản npm cùng tên `@sdcorejs/angular`, version theo Angular major (19.x.y / 20.x.y / 21.x.y / 22.x.y).

## Anti-patterns — TUYỆT ĐỐI KHÔNG

- ❌ Sửa trực tiếp `versions/v20/**`, `versions/v21/**` hoặc `versions/v22/**` cho logic chung — sửa `versions/v19/**` trước rồi rollout bằng `scripts/sync-multi-version-workspaces.ps1`.
- ❌ Chạy sync legacy từ `vn-angular` cho phát triển bình thường — script đã bị guard vì có thể ghi đè thay đổi độc lập.
- ❌ Đổi tên package trong từng version để có `@sdcorejs/angular-v19`/`-v20` — strategy hiện tại là 1 package name, version Angular major.
- ❌ Gán artifact từ workspace nào sang package major khác (vd build v20 → stamp/publish 21.x.y) — release contract ràng buộc mapping này, đừng workaround.
- ❌ Tạo `product/`, `design/`, hoặc `docs/` ở root repo — xem "Layout thư mục" dưới.

## Layout thư mục

Ranh giới: **agent sinh ra → `.sdcorejs/`; repo-owned public → root.**

```
.sdcorejs/          # MỌI artifact do skill pack sdcorejs sinh ra — user tham chiếu từ đây
  summary.md        #   project context snapshot
  persona.md        #   persona
  memories/         #   memory bền, có MEMORY.md làm index

versions/v{19,20,21,22}/ # CHỈ còn library. Không còn showcase, docs, refs, .sdcorejs
showcase/           # Angular workspace ĐỘC LẬP: dev/test component local. KHÔNG publish,
                    #   KHÔNG mirror theo version. Có package.json + node_modules riêng.
published-pages/    # site đã build, COMMITTED, mỗi release suffix 1 thư mục (xem dưới)
published-docs/     # raw API docs theo version, COMMITTED

README.md           # GitHub landing, repo-owned
README.npm.md       # canonical npm README (guard check:sync + sync rollout đọc file này)
CHANGELOG.md        # canonical changelog, keyed theo release suffix
```

**Showcase đã ra khỏi `versions/`** (2026-08-06). Trước đó nó bị mirror sang cả v20/v21 (3 bản × 186 file) mà **chỉ v19 build**, và `check:sync` có `projects/showcase` trong `syncedRoots` nên mỗi lần sửa showcase đều phải rollout sang v20/v21 nếu không release guard đỏ — cho một app không bao giờ ship. Giờ `syncedRoots` chỉ còn `projects/sdcorejs-angular`.

`showcase/` resolve lib qua tsconfig path `@sdcorejs/angular → ../versions/v19/dist/sdcorejs-angular`, tức **ăn lib đã build**. Phải `ng build sdcorejs-angular` trong `versions/v19` trước khi build showcase.

**Không có `migrations/`.** Migration guide riêng theo release đã bỏ hẳn (2026-08-06). Thay bằng: mỗi archive `published-docs/<version>/` tự mang `CHANGELOG.md` của chính nó + link diff sang release trước — xem "Per-version changelog" dưới.

**Dọn sạch 2026-08-06.** `.sdcorejs/` giờ chỉ giữ **summary + persona + memories**. Đã xoá toàn bộ `docs/` (ledger), `specs/`, `plans/`, `tasks/`, `documentation/`, `product/`, `design/`, `user-guide/` — artifact lịch sử, không script/workflow nào đọc, tra được qua git history. Cũng xoá `docs/` ở root (`npm-README.md` → `README.npm.md`), `migrations/`, `versions/*/docs/` (superpowers legacy), `versions/*/.sdcorejs/` (đã gộp về root rồi mới xoá) và `versions/*/refs/`.

Skill pack chạy lại sẽ tự dựng `specs/`, `plans/`, `docs/` dưới `.sdcorejs/` khi cần — đó là hành vi đúng, không phải rác.

⚠️ Skill pack `sdcorejs-product` / `sdcorejs-design` vẫn hardcode `<target-project>/product/` + `<target-project>/design/` (root, KHÔNG phải dưới `.sdcorejs/`) — chạy skill mà pack chưa update thì nó tạo 2 thư mục đó ở root repo. Move về `.sdcorejs/` khi gặp.

## Scripts

| Script | Mục đích | Khi chạy |
| --- | --- | --- |
| `scripts/sync-from-vn-angular.ps1` | Legacy recovery only: copy code từ `vn-angular` → `versions/v19` | Không chạy mặc định; cần `-AllowLegacySync` trên clean branch |
| `scripts/sync-multi-version-workspaces.ps1` | Dẫn xuất `v19` → `v20` + `v21` + `v22` (đổi dependency/peer Angular-major, áp dụng shim đã duyệt, ghi workspace status) | Sau khi thay đổi repo-owned trong `v19` cần rollout |
| `scripts/check-version-sync.mjs` | Verify `v20` + `v21` + `v22` vẫn khớp source `v19` ngoài các transform được duyệt | Trước release; CI publish chạy guard này trước npm publish |
| `scripts/deploy.ps1` | Build/pack dry-run bốn line vào `-OutputPath`, ghi checksum/metadata và luôn khôi phục version tạm | Release preflight local; script không publish npm |
| `scripts/build-published-page.mjs` | Build `showcase/` → `published-pages/<suffix>/` + prune retention (`npm run build:page -- --suffix 1.6`) | Mỗi release, sau khi lib đã build |
| `scripts/collect-docs.mjs` | Sinh 1 archive `published-docs/<version>/` (pin link theo tag + per-version CHANGELOG) | Qua `collect-release-docs`, hoặc debug đơn lẻ |

`npm run sync` là entry point rollout bình thường: lấy `versions/v19` làm nguồn rồi đồng bộ sang `versions/v20`, `versions/v21` và `versions/v22`. `npm run check:sync` là release guard read-only; nếu fail thì chạy lại `npm run sync`, review diff, rồi commit đầy đủ trước khi tag. Nếu cần tái hiện mirror cũ để điều tra lịch sử, dùng `npm run legacy:sync-from-vn-angular` trên một branch sạch.

### Quy trình phát triển độc lập

Các install/build Angular workspace dùng exact Node `22.22.3`; không tiếp tục nếu shell đang chạy runtime khác.

```powershell
# 1. Sửa shared code/docs/test trong versions/v19 (showcase sống ở root)
cd versions/v19
npm ci --legacy-peer-deps
npm test -- --watch=false

# 2. Lan toả v19 → v20 + v21 + v22
cd ../..
npm run sync
npm run check:sync

# 3. Verify install policy bằng exact Node 22.22.3
npm --prefix versions/v20 ci --legacy-peer-deps
npm --prefix versions/v21 ci --legacy-peer-deps
npm --prefix versions/v22 ci

# 4. Verify/build rồi commit
git add -A
git commit -m "<type>: <summary>"
git push
```

### Quy trình deploy npm — qua GitHub Actions (khuyến nghị)

Workflow: `.github/workflows/publish-npm.yml`. Auth qua **npm trusted publishing (OIDC)** — không dùng `NPM_TOKEN`, `NODE_AUTH_TOKEN` hay `npm login` local. Mọi release build/verify/publish job pin exact Node `22.22.3`; publisher cài exact `npm@11.5.1`, dùng `registry-url: https://registry.npmjs.org` và là job duy nhất có `permissions: id-token: write`. Trusted publisher trên npmjs.com pin theo repo + tên file workflow, nên đổi tên `publish-npm.yml` là phải khai báo lại bên npm.

**Trigger**:
- Push tag `v<release-suffix>` → tạo đúng bốn version `19.<suffix>` / `20.<suffix>` / `21.<suffix>` / `22.<suffix>`.
  - `v2.5` → `19.2.5`, `20.2.5`, `21.2.5`, `22.2.5`.
- Angular 22 bắt đầu tại `22.2.5`; generator/release plan không được dựng version 22 trước suffix `2.5`.
- `@sdcorejs/angular-material-datetime@1.0.4` phải được publish và verify trước transaction Core UI `2.5`.

Các gate trước artifact gồm `npm run check:sync`, root script/release-contract tests và full suite canonical v19 cục bộ (`npm run test:ci`; wrapper tự tắt disk cache). **`--code-coverage` là bắt buộc**: threshold trong `projects/sdcorejs-angular/karma.conf.js` chỉ được đánh giá khi coverage được thu thập. GitHub Actions chạy cùng target bằng launcher `ChromeHeadlessCI` khai trong `karma.conf.js`.

Karma in seed random của Jasmine ở đầu mỗi run (`[karma] Jasmine random seed = <n>`); ép seed bằng env `JASMINE_SEED`. **Pin seed KHÔNG đủ để replay**: `spec.id` gán theo thứ tự module trong bundle, mà bundle không ổn định giữa các build — chi tiết trong comment đầu `karma.conf.js`.

Transaction không interleave build và publish:

1. Resolve một release plan gồm bốn target và source SHA.
2. Build/pack cả bốn line trước khi publish: `npm ci --legacy-peer-deps` cho v19/v20/v21, clean `npm ci` cho v22. Mỗi artifact giữ `.tgz`, npm integrity/shasum, SHA-256, file inventory và source SHA.
3. Một verification job tải cả bốn artifact và kiểm tra checksum, manifest/peer/engine, APF/declaration, baseline public surface và strict consumer compile.
4. Một publisher **không matrix** tải lại đúng artifact đã verify, preflight đủ bốn registry version, rồi publish tuần tự v19 → v20 → v21 bằng recovery tag `angular19` / `angular20` / `angular21`. Sau mỗi bước, `latest` phải chưa đổi.
5. Publish v22 cuối cùng với `latest`, rồi verify exact registry integrity/shasum/SHA-256 và provenance. Không rebuild, không `npm dist-tag add`.
6. Chỉ sau postpublish GREEN mới sinh đủ bốn `published-docs`, build `published-pages/<suffix>`, áp retention và commit docs/page về `main`.

**Tag stable 19.2.5/20.2.5/21.2.5/22.2.5**:
```bash
git tag v2.5
git push origin v2.5
```

### Release preflight local — `deploy.ps1`

Local script chỉ dùng để tái hiện build/pack/checksum; publication vẫn thuộc GitHub trusted-publishing workflow:
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/deploy.ps1 `
  -PatchVersion "2.5" `
  -OutputPath "$env:TEMP\sdcorejs-angular-2.5" `
  -DryRun
```

`PatchVersion` là tên tham số legacy; giá trị là release suffix chung cho cả bốn Angular line. `-DryRun` phải non-interactive, build/pack đủ bốn artifact và khôi phục mọi version tạm trong `finally`; script không gọi `npm publish` và không cần npm auth.

### GitHub Pages — mỗi release 1 page, deploy KHÔNG build

Workflow: `.github/workflows/deploy-pages.yml`. **Không có Angular build trong workflow.** Nó chỉ assemble từ artifact đã commit rồi upload.

Layout site tại `https://sdcorejs.github.io/sdcorejs-angular/`:

```
/1.6/        site tự chứa của release 1.6   ← published-pages/1.6/
/1.5/  /1.4/ …                              ← các release còn được giữ
/            redirect sang suffix mới nhất
/latest/     redirect sang suffix mới nhất  (redirect, KHÔNG copy — mỗi copy ~26MB)
/docs/**     raw API docs theo version      ← published-docs/**
/pages.json  registry suffix + latest
```

**Trigger**: push `main` khi đổi `published-pages/**` hoặc `published-docs/**`; `workflow_run` sau publish npm (commit docs của CI dùng `GITHUB_TOKEN` nên **không** kích hoạt push trigger — đó là lý do cần `workflow_run`); manual dispatch.

**Yêu cầu setup repo** (1 lần): Settings > Pages > Source = **"GitHub Actions"**.

#### Sinh 1 page mới

```powershell
# 1. Lib phải build trước — showcase ăn dist
cd versions/v19
npx ng build sdcorejs-angular

# 2. Build + commit page cho release suffix
cd ..\..
npm run build:page -- --suffix 1.6
```

`build:page` làm tuần tự: generate showcase data (`changelog`, `example-sources`) → `ng build showcase --configuration production --base-href=/sdcorejs-angular/<suffix>/` → generate route shells → copy vào `published-pages/<suffix>/` → dựng `404.html` → prune → ghi `pages.json`.

Cờ khác: `--force` (rebuild suffix đã có), `--skip-build` (chỉ copy lại build sẵn), `--prune-only` (chỉ dọn, `npm run prune:pages`).

#### Route shell chỉ pre-render 1 release

Nội dung docs của app nằm dưới route `v/:version/`, nên page **vẫn** có segment version bên trong. Nhưng vì thư mục page đã gắn với một release, `build:page` truyền `--suffix <x.y>` xuống route-shell generator và nó chỉ phát shell cho **một** npm version. Từ inception suffix `2.5`, `canonicalReleaseForSuffix('2.5')` → `22.2.5`; suffix cũ vẫn chọn line cao nhất thực sự tồn tại khi release đó được phát hành.

Lý do — số đo thật với 97 doc page:

| Shell scope | Shell | HTML | Page |
| --- | --- | --- | --- |
| mọi release đã publish (mặc định cũ) | 5941 | 87 MB | 99 MB |
| 3 release của suffix (phép đo trước khi có v22) | 1486 | 22 MB | 34 MB |
| **1 release (đang dùng)** | **496** | **7 MB** | **~19 MB** |

Phát shell cho mọi release nhân HTML ~12× và 10 page sẽ là ~0.97 GB, đụng **hard limit 1 GB của Pages**.

**Đánh đổi đã chấp nhận**: deep link tới các line không canonical trong page vẫn chạy **client-side** qua version switcher, chỉ **không được pre-render** → không index. Với suffix từ `2.5`, URL được index là `v/22.<suffix>/…`; release cũ không bị gán ngược một version 22 chưa từng tồn tại.

Muốn URL sạch hẳn (`/1.6/components/button`, ~14 MB/page) thì phải bỏ segment `v/:version` trong `app.routes.ts` + `docs-route.guards.ts` + `docs-version.service.ts` — chưa làm.

#### Retention

`published-pages/` giữ **5 suffix mới nhất theo chữ số đầu**, mỗi nhóm prune độc lập — `1.x` và `0.x` không đá nhau. Prune tự chạy mỗi lần `build:page`. Test: `npm run test:published-page`.

`published-docs/` dùng luật KHÁC: **5 version mới nhất mỗi Angular major** (tối đa 20 archive với bốn line). Lần prune 2026-08-06 từng đưa ba line từ 40 → 15 archive (46 MB → 19 MB); đó là số đo lịch sử trước v22. URL của version bị bỏ (`docs/19.0.4/…`) sẽ 404.

⚠️ **Đừng để deploy build lại.** Cả điểm của model này là docs-only hay page-only change không kích hoạt Angular build. Muốn đổi showcase lên Pages thì build page mới, đừng thêm bước build vào workflow.

### API docs cho AI agent (versioned, public trên Pages)

Toàn bộ API docs (`*.md`) của lib được publish dạng raw Markdown trên Pages, namespaced theo version, để AI agent fetch qua URL mà KHÔNG cần clone local.

- **Nguồn**: `versions/v19|v20|v21|v22/projects/sdcorejs-angular/**/*.md`. Loại `HANDOFF.md` (nội bộ).
- **Generator release**: `scripts/collect-release-docs.mjs` (`npm run collect-release-docs -- --patch 2.5`) → gọi collector cho đủ 4 workspace và ghi **`published-docs/19.2.5/`**, **`published-docs/20.2.5/`**, **`published-docs/21.2.5/`**, **`published-docs/22.2.5/`** + refresh **`published-docs/versions.json`** registry.
- **Generator đơn lẻ/debug**: `scripts/collect-docs.mjs --workspace v19 --version 19.1.0`. Mặc định KHÔNG overwrite archive đã tồn tại; dùng `--force` chỉ khi cố ý rebuild, `--skip-existing` cho CI idempotent.
- **URL** (sau deploy):
  - `…/docs/versions.json` — registry mọi version + `latest`
  - `…/docs/<version>/index.json` — manifest (`{ id, title, category, path, url }` × ~79 doc)
  - `…/docs/<version>/forms/select/sd-select.md` — raw doc
  - `…/docs/latest/index.json` — alias bản mới nhất (dựng ở deploy, không commit)
- **Archive vĩnh viễn**: Pages thay artifact mỗi deploy → muốn nhiều version cùng sống thì docs phải **committed** trong `published-docs/`; deploy chỉ copy vào dist. ĐỪNG hand-edit `published-docs/<version>/**`; sửa source workspace rồi chạy generator. Docs public cho release mới chỉ sinh sau tag publish thành công, không sinh thủ công trước tag.
- **Archive độc lập với layout repo (link pinning)**: `collect-docs` KHÔNG copy nguyên si — nó rewrite mọi link `github.com/sdcorejs/sdcorejs-angular/blob/main/...` thành `blob/v<release-suffix>/...` rồi mới ghi vào archive, và fail-closed nếu còn sót `blob/main/`. Lý do: archive phải đọc được vĩnh viễn, không được phụ thuộc layout repo **hiện tại** — một deep link `blob/main/` chết ngay khi file bị move (đã xảy ra khi `docs/migrations/` dời ra root). Source workspace vẫn trỏ `blob/main` (đúng, vì nó bám main); chỉ archive mới bị pin. Hệ quả: **mỗi archive version bắt buộc phải có tag `v<suffix>` tương ứng** — `19.1.5` → `v1.5`. Test: `npm run test:collect-docs`.
- **Per-version changelog (mỗi version độc lập)**: `collect-docs` sinh thêm `published-docs/<version>/CHANGELOG.md` cho mỗi archive — trích đúng section `## [<release-suffix>]` từ root `CHANGELOG.md`, cộng mục "Compare with the previous release" gồm link archive trước + link diff `compare/v<prev>...v<this>`. `index.json` mang thêm `changelog` (path + url), `previousVersion`, `compareUrl`. Nhờ vậy consumer/AI đọc một version là đủ, không phải mở changelog repo hay version khác. ⚠️ CHANGELOG **không** nằm trong `index.json.docs[]` — list đó phải khớp 1:1 với `documentation.registry.ts` của showcase (guard trong `generate-showcase-example-sources.test.mjs`), và changelog là release metadata chứ không phải API doc. Không có section thì vẫn sinh file nhưng ghi rõ là chỉ có diff (hiện `0.11` rơi vào diện này). **Ràng buộc**: release ritual bước 2 (cắt `## [Unreleased]` → `## [<suffix>] - date`) là bắt buộc — bỏ bước này thì archive của release đó ra rỗng nội dung.

## README & CHANGELOG

`@sdcorejs/angular` là pack public MIT, wording công khai, và hiện là pack độc lập. README/CHANGELOG do repo này tự sở hữu.

- **CHANGELOG**: canonical = `CHANGELOG.md` ở root repo. Các entry cũ giữ `Synced from vn-angular@...`; entry mới ghi thay đổi repo-owned.
- **README npm-facing**: canonical là **`README.npm.md`** ở root repo. Khi rollout, copy nội dung này vào `versions/v19/projects/sdcorejs-angular/README.md`, rồi lan sang v20/v21/v22. **Muốn đổi README npm → sửa `README.npm.md`**.
- **README root** `README.md`: GitHub landing, repo tự sở hữu.
- Component docs (`sd-*.md`) sống trong source workspace và được publish qua `collect-docs`.

## Changelog & semver

**CHANGELOG độc lập.** `@sdcorejs/angular` deploy theo nhịp riêng → có **CHANGELOG.md riêng ở root repo này**. Sau final sync, không dùng changelog của `vn-angular`.

- **Canonical**: `sdcorejs-angular/CHANGELOG.md` (root). Keyed theo **release suffix tag** (`0.11`, `1.0`, …) — đơn vị release thực. Entry trước 2026-06-24 ghi `Synced from vn-angular@<commit>` để truy vết; entry mới ghi source là repo-owned.
- **Một entry cho cả 4 major từ suffix `2.5`.** Tag `v<release-suffix>` publish 19.x.y / 20.x.y / 21.x.y / 22.x.y **cùng public API** — chỉ khác dependency/peer/shim Angular-major. Các entry lịch sử trước `2.5` vẫn chỉ thuộc ba line đã tồn tại khi đó.
- **Legacy sync KHÔNG đụng changelog.** Không còn `versions/v<N>/CHANGELOG.md`. Per-version tra `SYNC-STATUS.md` / workspace status.
- **Đừng đưa shim per-major vào changelog** (vd `DomPortalOutlet` 4-arg vs 3-arg) — plumbing của sync, không phải API consumer.

### Release ritual (đúng thứ tự)

Changelog viết TRỰC TIẾP ở repo này:

```
1. sdcorejs-angular: sửa code/docs/test trong versions/v19
                     → rollout v19 sang v20/v21/v22 bằng sync-multi-version-workspaces.ps1
2. sdcorejs-angular: sửa root CHANGELOG.md
                     ## [Unreleased]  →  ## [<release-suffix>] - YYYY-MM-DD
                     thêm: Published 19.<suffix>/20.<suffix>/21.<suffix>/22.<suffix> + repo-owned summary
                     thêm ## [Unreleased] rỗng mới ở trên
3. sdcorejs-angular: full test/lint/build/package-contract trên bốn line + Showcase
4. sdcorejs-angular: git add -A && commit, merge vào main
                     git tag v<release-suffix> && git push origin v<release-suffix>
                     → CI build/verify đủ bốn artifact rồi publish tuần tự 19/20/21/22
                     → chỉ khi postpublish thành công: CI sinh published-docs 19/20/21/22,
                       build published-pages/<suffix>, prune retention và commit docs/page về main
                     → commit đó kích hoạt deploy-pages (assemble, KHÔNG build)
```

Không tag hoặc sync `vn-angular` cho release mới.

### Semver với scheme này

Tag format `^\d+\.\d+$` (vd `1.0`) — major digit **bị khoá theo Angular line**, không phải theo semver. Hệ quả: breaking change KHÔNG thể tăng major. Quy ước:

| Loại thay đổi | Bump release suffix |
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

- **Install policy khác nhau có chủ đích**: v19/v20/v21 dùng exact `npm ci --legacy-peer-deps`; v22 dùng clean `npm ci` và cấm `--legacy-peer-deps`, `--force`, override, local tarball hay Git dependency. Mọi Angular workspace install/build của release chạy trên exact Node `22.22.3`.

- **Legacy sync archived**: `scripts/sync-from-vn-angular.ps1` chỉ chạy khi truyền `-AllowLegacySync`; không dùng cho phát triển thường ngày.
- **BOM UTF-8 trong md files**: file md có BOM (`﻿`) ở đầu — không ảnh hưởng render, nhưng nếu có script đọc file bằng latin1 thì lại sinh mojibake. Cẩn thận với encoding khi viết tool xử lý docs.

## Trees + git

Branch chính: `main`. Branch feature `001` dùng tạm để chuẩn bị PR vào main. Sau khi `main` ổn định, deploy-pages auto-trigger trên `main`. Hỏi user trước khi push vào branch khác.

## See also

- Legacy final sync source: `c:\Users\Admin\Documents\lib-core-angular\vn-angular` at `d12478a1` (`release/0.0.1`).
- `SYNC-STATUS.md` mỗi `versions/v<N>/`: bản ghi final sync + workspace rollout status.
