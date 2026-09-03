# AGENTS.md — `sdcorejs-angular`

Hướng dẫn cho coding agent (Codex, Claude Code, …) làm việc trong repo này.
Bản đầy đủ: [`CLAUDE.md`](CLAUDE.md). File này giữ phần **bắt buộc phải biết trước khi sửa gì**.

Môi trường: Windows, shell mặc định là PowerShell. Script build/deploy là `.ps1`.

## Repo này là gì

Pipeline multi-version publish cho npm package `@sdcorejs/angular` — **một** package name, bốn dòng version khoá theo Angular major.

```
versions/v19/  ← source of truth (Angular 19)
      │  npm run sync
      ├──────────────┬──────────────┐
      ▼              ▼              ▼
versions/v20/   versions/v21/   versions/v22/
      └──────────────┴──────────────┘
                     │
                     ▼
 @sdcorejs/angular@{19,20,21,22}.x.y  (npm, cùng public API)
```

`v20`/`v21`/`v22` là **dẫn xuất** của `v19`, chỉ khác dependency/peer Angular-major và shim đã duyệt. Dòng v22 bắt đầu tại `22.2.5`; không dựng lịch sử v22 trước release suffix `2.5`.

## Layout

```
versions/v{19,20,21,22}/ library only — khong con showcase/docs/refs/.sdcorejs
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

1. **Không sửa trực tiếp `versions/v20/**`, `versions/v21/**` hay `versions/v22/**`** cho logic chung. Sửa `versions/v19/**` rồi `npm run sync`. Sửa trực tiếp workspace dẫn xuất chỉ dành cho dependency/shim Angular-major-specific đã được duyệt.
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

`README.npm.md` phải **byte-identical** với cả 4 package README trong workspace — guard `npm run check:sync` fail closed nếu lệch.

## Verify trước khi báo xong

```bash
npm run check:sync      # v20/v21/v22 khớp v19 + npm README parity — release guard
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

**Retention** — `published-pages/`: 5 suffix mới nhất **theo chữ số đầu** (`1.x` và `0.x` prune độc lập). `published-docs/`: 5 version mới nhất **mỗi Angular major** (tối đa 20 archive với bốn line). Hai luật khác nhau, đừng lẫn.

**Route shell chỉ pre-render 1 npm version.** Từ suffix `2.5`, canonical shell là `22.<suffix>`; các suffix cũ vẫn giữ line cao nhất thực sự tồn tại khi đó. Page đã gắn với release nên phát shell cho mọi release là dư. Deep link tới line khác vẫn chạy client-side, chỉ không được index.

## Release

Tag `v<release-suffix>` (vd `v2.5`) → CI chuẩn bị `19.2.5` / `20.2.5` / `21.2.5` / `22.2.5`, rồi sinh `published-docs` và commit về `main` sau khi toàn bộ transaction thành công.

Thứ tự bắt buộc:

```
1. Sửa versions/v19 → npm run sync → npm run check:sync
2. CHANGELOG.md: ## [Unreleased] → ## [<suffix>] - YYYY-MM-DD, thêm [Unreleased] rỗng mới
3. Chạy full test/lint/build/package-contract trên cả bốn line và Showcase
4. Merge release commit vào main, rồi git tag v<suffix> && git push origin v<suffix>
5. CI build/verify/publish; chỉ postpublish GREEN mới commit docs/page về main
```

**Bước 2 không được bỏ.** Bỏ thì archive của release đó ra rỗng nội dung (per-version changelog trích theo section này).

**Transaction release fail-closed.** Trước publish phải qua `check:sync`, script/release-contract tests và full Karma coverage của canonical v19. Bốn artifact được build/pack trước (`npm ci --legacy-peer-deps` cho v19/v20/v21; clean `npm ci` cho v22), upload, tải lại và verify hash/manifest/declaration/consumer. Một job publisher không matrix mới publish tuần tự v19 → v20 → v21 dưới `angular19`/`angular20`/`angular21`, rồi v22 cuối cùng dưới `latest`; không rebuild và không gọi `npm dist-tag add`.

**Auth npm = trusted publishing (OIDC), không còn `NPM_TOKEN`.** Release jobs dùng exact Node `22.22.3`; publisher cài exact `npm@11.5.1`, có `permissions: contents: read` + `id-token: write`, dùng `registry-url: https://registry.npmjs.org`, và **không set `NODE_AUTH_TOKEN`**. Trusted publisher bên npmjs.com pin theo repo + **tên file workflow**, nên đổi tên `publish-npm.yml` là phải khai lại bên npm.

⚠️ **Major digit khoá theo Angular line, không phải semver.** Breaking change KHÔNG tăng được major. Breaking phải ghi rõ mục `### Changed (BREAKING for consumers)` + migration diff trong changelog. Version number một mình không signal được breaking.

## Ghi chú môi trường

- Dùng đúng lockfile: v19/v20/v21 chạy `npm ci --legacy-peer-deps`; v22 bắt buộc clean `npm ci`, không `--legacy-peer-deps`, `--force`, override, local tarball hay Git dependency.
- Mọi install/build Angular workspace cho release chạy trên exact Node `22.22.3`.
- File `.md` có BOM UTF-8. Đọc bằng latin1 sẽ ra mojibake — cẩn thận khi viết tool xử lý docs.
- Branch chính `main`. Hỏi user trước khi push lên branch khác.

## Chi tiết đầy đủ

[`CLAUDE.md`](CLAUDE.md) — sơ đồ workflow, bảng scripts, chi tiết cả 2 workflow CI, semver, known issues.
`versions/v19/CLAUDE.md` — convention viết code Angular (signals, `@let` caching, cấu trúc entry point, luật docs per-component, TDD).
