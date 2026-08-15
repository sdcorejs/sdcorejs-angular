# AGENTS.md — `sdcorejs-angular`

Hướng dẫn cho coding agent (Codex, Claude Code, …) làm việc trong repo này.
Bản đầy đủ: [`CLAUDE.md`](CLAUDE.md). File này giữ phần **bắt buộc phải biết trước khi sửa gì**.

Môi trường: Windows, shell mặc định là PowerShell. Script build/deploy là `.ps1`.

## Repo này là gì

Pipeline multi-version publish cho npm package `@sdcorejs/angular` — **một** package name, ba dòng version khoá theo Angular major.

```
versions/v19/  ← source of truth (Angular 19)
      │  npm run sync
      ├──────────────┐
      ▼              ▼
versions/v20/   versions/v21/
      │              │
      ▼              ▼
 @sdcorejs/angular@{19,20,21}.x.y  (npm, cùng nội dung feature)
```

`v20`/`v21` là **dẫn xuất** của `v19`, chỉ khác peerDeps Angular major + shim.

## Layout

```
versions/v{19,20,21}/   library only — khong con showcase/docs/refs/.sdcorejs
showcase/               Angular workspace DOC LAP: dev/test local, khong publish,
                        khong mirror theo version. package.json + node_modules rieng.
published-pages/<x.y>/  site da build, COMMITTED, 1 thu muc / release suffix
published-docs/<ver>/   raw API docs theo version, COMMITTED
.sdcorejs/              summary.md + persona.md + memories/
README.npm.md           canonical npm README
```

`showcase/` resolve lib qua tsconfig path `@sdcorejs/angular → ../versions/v19/dist/sdcorejs-angular`
tức **an lib da build** — phai `ng build sdcorejs-angular` trong `versions/v19` truoc.

## Luật cứng

1. **Không sửa trực tiếp `versions/v20/**` hay `versions/v21/**`** cho logic chung. Sửa `versions/v19/**` rồi `npm run sync`. Sửa trực tiếp v20/v21 chỉ dành cho việc Angular-major-specific (dependency, shim).
2. **Không tạo `product/`, `design/`, `docs/`, `migrations/` ở root repo.** Đã xoá có chủ đích. Artifact do agent sinh ra thuộc về `.sdcorejs/`.
3. **`.sdcorejs/` chỉ chứa `summary.md`, `persona.md`, `memories/`.** Skill pack tự dựng `specs/`, `plans/`, `docs/` dưới đó khi cần — đúng, không phải rác. Đừng dựng ở nơi khác.
4. **Không hand-edit `published-docs/<version>/**`.** Đó là archive release bất biến. Sửa source workspace rồi chạy generator.
5. **Không chạy legacy sync** (`scripts/sync-from-vn-angular.ps1`). Đã archived, cần cờ `-AllowLegacySync`, có thể ghi đè thay đổi độc lập.
6. **Không đổi package name theo version** (`@sdcorejs/angular-v19`, …). Một name, version phân biệt theo Angular major.
7. **Không thêm bước build vào `deploy-pages.yml`.** Deploy chỉ assemble artifact đã commit. Muốn đổi showcase lên Pages thì build page mới: `npm run build:page -- --suffix <x.y>`.

## Canonical file — sửa đúng chỗ

| Muốn đổi | Sửa file |
|---|---|
| README hiển thị trên npm | `README.npm.md` (root) — rồi copy sang `versions/*/projects/sdcorejs-angular/README.md` |
| Changelog | `CHANGELOG.md` (root), keyed theo release suffix `1.4`, `1.5`, … |
| GitHub landing page | `README.md` (root) |
| Docs từng component | `versions/v19/projects/sdcorejs-angular/**/sd-*.md` |

`README.npm.md` phải **byte-identical** với cả 3 workspace README — guard `npm run check:sync` fail closed nếu lệch.

## Verify trước khi báo xong

```bash
npm run check:sync      # v20/v21 khớp v19 + npm README parity — release guard
npm run test:scripts    # test cho scripts/ (showcase generators + collect-docs)

cd versions/v19
npm test -- --watch=false          # unit test lib
npx ng build sdcorejs-angular      # typecheck thật, ~60-140s
```

Chạy test/build thật rồi mới nói "pass"/"xong". Không suy đoán.

## published-docs — 2 hợp đồng dễ phá

**Link pinning.** `collect-docs` rewrite mọi link `github.com/sdcorejs/sdcorejs-angular/blob/main/...` thành `blob/v<suffix>/...` trước khi ghi vào archive, và fail-closed nếu còn sót `blob/main/`. Lý do: archive phải đọc được vĩnh viễn, không phụ thuộc layout repo hiện tại. Hệ quả: **mỗi archive version phải có tag `v<suffix>`** (`19.1.5` → `v1.5`).

**Per-version changelog.** Mỗi archive tự mang `CHANGELOG.md` (trích section `## [<suffix>]` từ root CHANGELOG + link diff sang release trước). ⚠️ Nó **không** nằm trong `index.json.docs[]` — list đó phải khớp 1:1 với `documentation.registry.ts` của showcase, có guard trong `scripts/generate-showcase-example-sources.test.mjs`. Thêm entry vào `docs[]` mà không có trang showcase tương ứng sẽ làm đỏ test đó.

## GitHub Pages — mỗi release 1 folder, deploy KHÔNG build

```
/1.6/       site tu chua cua release 1.6   <- published-pages/1.6/  (COMMITTED)
/1.5/ /1.4/ ...                            <- cac release con giu
/           redirect sang suffix moi nhat
/latest/    redirect (KHONG copy — moi ban ~19MB)
/docs/**    raw API docs theo version      <- published-docs/**
```

Sinh page mới:

```bash
cd versions/v19 && npx ng build sdcorejs-angular   # showcase an dist
cd ../.. && npm run build:page -- --suffix 1.6
```

`build:page` = generate data → `ng build --base-href=/sdcorejs-angular/<suffix>/` → route shells → copy → `404.html` → prune → `pages.json`.

**Retention** — `published-pages/`: 5 suffix mới nhất **theo chữ số đầu** (`1.x` và `0.x` prune độc lập). `published-docs/`: 5 version mới nhất **mỗi Angular major** (15 archive). Hai luật khác nhau, đừng lẫn.

**Route shell chỉ pre-render 1 npm version** (`21.<suffix>`). Page đã gắn với release nên phát shell cho mọi release là dư — nó nhân HTML ~12× (87 MB vs 7 MB/page) và 10 page sẽ đụng hard limit 1 GB của Pages. Deep link tới `v/19.x`/`v/20.x` vẫn chạy client-side, chỉ không được index.

## Release

Tag `v<release-suffix>` (vd `v1.6`) → CI publish `19.1.6` / `20.1.6` / `21.1.6`, rồi sinh `published-docs` và commit về `main`.

Thứ tự bắt buộc:

```
1. Sửa versions/v19 → npm run sync → npm run check:sync
2. CHANGELOG.md: ## [Unreleased] → ## [<suffix>] - YYYY-MM-DD, thêm [Unreleased] rỗng mới
3. cd versions/v19 && npx ng build sdcorejs-angular
   cd ../.. && npm run build:page -- --suffix <suffix>
4. commit + push, rồi git tag v<suffix> && git push origin v<suffix>
```

**Bước 2 không được bỏ.** Bỏ thì archive của release đó ra rỗng nội dung (per-version changelog trích theo section này).

**2 gate trước publish matrix** (matrix `needs:` cả hai — đỏ một cái là không publish gì hết): `verify-version-sync` (`npm run check:sync`) và `test` (full suite của `versions/v19`). Job `test` chạy `--code-coverage` vì threshold trong `karma.conf.js` chỉ được đánh giá khi có coverage, và dùng browser `ChromeHeadlessCI`. ⚠️ Hai gate chỉ chạy trên tag/dispatch — **chưa có test trên PR/push `main`**.

**Auth npm = trusted publishing (OIDC), không còn `NPM_TOKEN`.** Job publish chạy `permissions: id-token: write`, Node 22 + `npm@latest` (OIDC cần npm >= 11.5.1, Node >= 22.14.0) và **cố tình không set `NODE_AUTH_TOKEN`** — có token thì npm dùng token thay OIDC, và 2FA policy của package trả 403 `an automation token was specified`. Trusted publisher bên npmjs.com pin theo repo + **tên file workflow**, nên đổi tên `publish-npm.yml` là phải khai lại bên npm.

⚠️ **Major digit khoá theo Angular line, không phải semver.** Breaking change KHÔNG tăng được major. Breaking phải ghi rõ mục `### Changed (BREAKING for consumers)` + migration diff trong changelog. Version number một mình không signal được breaking.

## Ghi chú môi trường

- `package-lock.json` của v20/v21 stale (còn pin Angular 19) → CI dùng `npm install --legacy-peer-deps`, **không** `npm ci`.
- File `.md` có BOM UTF-8. Đọc bằng latin1 sẽ ra mojibake — cẩn thận khi viết tool xử lý docs.
- Branch chính `main`. Hỏi user trước khi push lên branch khác.

## Chi tiết đầy đủ

[`CLAUDE.md`](CLAUDE.md) — sơ đồ workflow, bảng scripts, chi tiết cả 2 workflow CI, semver, known issues.
`versions/v19/CLAUDE.md` — convention viết code Angular (signals, `@let` caching, cấu trúc entry point, luật docs per-component, TDD).
