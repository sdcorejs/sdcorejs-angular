# HANDOFF — branch `fix/full-scan-review`

> File này bàn giao **branch `fix/full-scan-review`**. Nó khác với `versions/v19/HANDOFF.md`
> (artifact cũ từ đợt `1.4`, không liên quan, chưa đụng tới).
>
> Cập nhật: 2026-08-11 (lần 4 — sau khi đảo nhóm output rename, xoá docx/document-builder, và bỏ toàn bộ re-export `@sdcorejs/utils`) · Base: `main` @ `25480b6`.

---

## 1. Trạng thái ngay lúc này

| | |
|---|---|
| Branch | `fix/full-scan-review` |
| Số commit trên branch | 21 (16–17: đảo nhóm ~73 output rename + sync; 18–19: xoá docx/document-builder + sync; 20–21: bỏ toàn bộ re-export @sdcorejs/utils + sync — commit code/sync luôn tách đôi vì hook git-secrets vỡ E2BIG khi staged ~400 file) |
| Working tree | sạch |
| Merge vào `main` | **chưa** |
| Tag release | **chưa** |
| PR | chưa mở — https://github.com/sdcorejs/sdcorejs-angular/pull/new/fix/full-scan-review |

### Cổng kiểm tra (đo lần cuối trên chính commit HEAD)

| Cổng | Kết quả |
|---|---|
| `npm run check:sync` | PASS — v20/v21 khớp v19 |
| `ng build sdcorejs-angular` (v19) | PASS |
| `ng build sdcorejs-angular` (v20) | PASS |
| `ng build sdcorejs-angular` (v21) | PASS |
| `ng lint` (v19) | PASS — 0 error, 0 warning, **4 rule a11y đã bật ở mức `error`** |
| Full suite (v19) | **4438 SUCCESS**, 0 fail (baseline đầu branch: 3950; 44 spec docx/document-builder + 169 spec của các file re-export utils đi theo phần bị xoá) |
| Coverage threshold | Có thực thi thật — 72/62/71/72 |
| `npm run test:scripts` | 61/61 |
| `npm run check:i18n-parity` | PASS — 580 key × 5 ngôn ngữ (−9 key docx/document-builder) |
| Mojibake scan | 0 hit |

---

## 2. Dựng lại trên máy khác

```bash
git clone git@github.com:sdcorejs/sdcorejs-angular.git
cd sdcorejs-angular
git checkout fix/full-scan-review

# Orchestrator ở root (scripts sync/collect-docs/build-page)
npm install

# Workspace thư viện — v19 là NGUỒN SỰ THẬT, làm việc ở đây
cd versions/v19
npm install --legacy-peer-deps
```

**Bắt buộc `--legacy-peer-deps`**: lockfile của v20/v21 vẫn pin Angular 19 (sync bump
`package.json` nhưng không regen lockfile). Đây là known issue có sẵn, ghi trong `CLAUDE.md`.

Môi trường đã dùng: **Node v22.22.2, npm 10.9.7**, Windows + PowerShell.

### Chạy lại toàn bộ cổng kiểm tra

```bash
# từ versions/v19
npx ng lint
npm run build
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless

# từ root repo
npm run check:sync
npm run test:scripts
cd versions/v19 && npm run check:i18n-parity
```

---

## 3. 21 commit — mỗi commit làm gì

Đọc theo thứ tự này; commit message của từng cái giải thích đầy đủ **tại sao**, không chỉ *cái gì*.

| # | Hash | Nội dung |
|---|---|---|
| 1 | `e615055a` | `fix(lint)` — `npm run lint` đang **đỏ trên `main` sạch** (6 error). Fix + đưa file generated 1.4 MB ra khỏi phạm vi lint (`--fix` từng phá header của nó). |
| 2 | `8b53eb4e` | `fix(packaging)` — package trên npm **không dùng được**: primary entry point export 0 symbol; thiếu 6 peer dep; `sideEffects: false` khai sai; 1 dependency thừa hoàn toàn. |
| 3 | `51b75742` | `fix(security)` — rò bearer token sang host bên thứ ba; `sdSafeHtml` bypass sanitizer vô điều kiện; `javascript:` URL lọt qua kiểm tra link; mọi config thiếu đều degrade thành cho-qua; root singleton cache identity không reset được. |
| 4 | `b85c9d02` | `fix(forms)` — quét 3 bug class về validation trên **toàn bộ** tầng forms (trước đây mỗi cái chỉ được sửa tại 1 chỗ được báo). |
| 5 | `0bfa66fe` | `perf(components)` — cấp phát mảng/object mới mỗi chu kỳ CD; gồm 1 ca OOM **đang sống**, và 1 ca **mất dữ liệu hiển thị** trong table. |
| 6 | `4924f1a1` | `fix(components)` — 4 blocking do review đối kháng của #5 bắt được. |
| 7 | `68e452da` | `fix(services)` — promise không bao giờ settle khi user bấm huỷ (confirm ×6, docx, upload). |
| 8 | `de9ef6fc` | `fix(lifecycle)` — resource sống lâu hơn chủ của nó: overlay, listener, timer, DOM node, cache không giới hạn. |
| 9 | `cb0e0a15` | `fix(components)` — 5 blocking do review đối kháng của #8 bắt được. |
| 10 | `df8cb803` | `fix(a11y)` — bật lại 4 rule accessibility đang **tắt hẳn** + sửa toàn bộ hệ quả. |
| 11 | `f2236bd6` | `ci` — CI **chưa từng chạy test**; thêm gate + workflow PR/push; 18 assertion đang test chính code của test. |
| 12 | `b2548685` | `feat(i18n)` — chuỗi hardcode cuối cùng vào `I18nService`; +64 key × 5 locale. |
| 13 | `68ab2ad7` | `refactor!` — **BREAKING**: đổi tên public API mà semver không thể phát tín hiệu. |
| 14 | `2f586553` | `docs` — làm `.md` đúng trở lại + ghi nhận code GPL được vendor vào. |
| 15 | `5eeda62a` | `chore(release)` — `npm run sync` sang v20/v21 + viết CHANGELOG. |
| 16 | *(revert)* | `revert!` — đảo nhóm ~73 output rename của #13 theo quyết định user (giữ tên đã publish, khớp thông lệ Material). Gộp `sdLoadError` → `loadError` (breaking duy nhất còn lại của nhóm output). Chi tiết ở mục 4. |
| 17 | *(sync)* | `chore(sync)` — rollout #16 sang v20/v21. Tách riêng chỉ vì hook git-secrets E2BIG. |
| 18 | *(removal)* | `feat!` — xoá hẳn `services/docx` (code GPL) + `components/document-builder` (legacy) theo yêu cầu user. Gỡ dep `@bjorn3/browser_wasi_shim`, 9 i18n key, NOTICE, 2 demo showcase, 3 lockfile mồ côi cấp lib. |
| 19 | *(sync)* | `chore(sync)` — rollout #18 sang v20/v21. |
| 20 | *(removal)* | `refactor!` — bỏ TOÀN BỘ re-export từ `@sdcorejs/utils` (extensions 8 namespace, utilities/models 10 file, xoá entry point `@sdcorejs/angular/models`, i18n thôi re-export `Language`/`SUPPORTED_LANGUAGES`). Nguyên tắc user chốt: utils sở hữu thì utils cover. |
| 21 | *(sync)* | `chore(sync)` — rollout #20 sang v20/v21. |

---

## 4. Quyết định đã chốt — đừng bàn lại

Người dùng đã chọn ba việc này khi bắt đầu. Ghi lại để không phải quyết lần nữa:

| Vấn đề | Quyết định |
|---|---|
| Code GPL-2.0 vendor trong package MIT (`services/docx`) | ~~Giữ nguyên code + `NOTICE`~~ **Đảo quyết định (2026-08-11): XOÁ HẲN** `services/docx` + `components/document-builder` (legacy, user không dùng) theo yêu cầu user. Hết xung đột giấy phép cho release mới → **không còn chặn tag**. Lưu ý tồn dư: các bản 19.x–21.x ≤ 1.6 **đã publish** vẫn chứa code GPL trên npm — nếu cần xử lý (deprecate/unpublish) thì vẫn phải hỏi luật sư, nhưng không chặn release mới. |
| Nhóm breaking rename | **Làm luôn, xoá thẳng tên cũ**, không giữ alias `@deprecated`. |
| Nhóm giảm bundle (16.32 MB) | **Hoãn.** Chưa động vào. |
| **Re-export từ `@sdcorejs/utils` — BỎ TOÀN BỘ (2026-08-11)** | User chốt nguyên tắc: cái gì `@sdcorejs/utils` sở hữu thì import và đọc doc ở đó, lib này không làm mặt tiền trung gian. Đã bỏ: 8 namespace fns ở `utilities/extensions`, 10 file re-export type ở `utilities/models`, entry point `@sdcorejs/angular/models` (xoá hẳn), `Language`/`SUPPORTED_LANGUAGES` khỏi i18n. Spec của file re-export thuần xoá theo (test hành vi của utils, thuộc repo utils). Bảng migration trong `CHANGELOG.md` + `utilities/models/models.md`. |
| **Nhóm ~73 output rename — ĐÃ ĐẢO LẠI (2026-08-11)** | User không đồng ý scale + muốn tên quen thuộc (`close`, `search`, … khớp thông lệ Material, và là tên đã publish tới 1.6). Đã revert diff-driven theo đúng commit `68ab2ad7` (544 thay thế / 125 file), **16 tên `sd*` đã publish từ 1.4/1.6 giữ nguyên** (đổi chúng mới là breaking). Breaking duy nhất còn lại của nhóm output: `sdLoadError` → `loadError` trên `<sd-tree-select>` / `<sd-entity-picker>` (user chọn gộp; `<sd-tree>` / `<sd-preview-pdf>` vốn đã publish `loadError`). Signal nội bộ `loadError` của entity-picker đổi thành `loadErrorState` để nhường tên cho output. |

Một quyết định kỹ thuật quan trọng phát sinh trong lúc làm (nay là mặc định sau khi đảo
nhóm output): **`(click)` của `<sd-button>` giữ nguyên tên.** Đổi thành `sdClick` sẽ khiến
mọi `(click)` sẵn có của consumer **âm thầm rơi về DOM event gốc** — vẫn chạy, không lỗi
biên dịch, nhưng payload khác và **bỏ qua gate `disabled`**. Đây là kiểu breaking im lặng,
nguy hiểm nhất. Đã ghi trong `CHANGELOG.md` mục "Không đổi (có chủ đích)".

---

## 5. Việc còn lại — theo thứ tự ưu tiên

### 5.1. Cần làm trước khi merge

1. **Review PR.** 21 commit, ~1700 file. Đọc theo thứ tự commit; message của mỗi commit là
   phần giải thích chính.
2. ~~Hỏi luật sư về vụ GPL~~ — đã hết chặn: `services/docx` (code GPL) xoá hẳn khỏi source
   (2026-08-11, xem mục 4). Chỉ còn câu hỏi pháp lý KHÔNG chặn merge về các bản đã publish.
3. **Thông báo breaking cho team dùng thư viện.** Bảng migration đầy đủ nằm trong
   `CHANGELOG.md`, mục `### Changed (BREAKING for consumers)`.

### 5.2. Nợ kỹ thuật đã biết — có vị trí chính xác

Mỗi mục dưới đây đã được xác minh còn tồn tại tại thời điểm bàn giao.

| # | Vị trí | Vấn đề | Tại sao hoãn |
|---|---|---|---|
| 1 | `services/excel/src/lib/excel.service.ts:302` | Set `numFmt = '#'` cho ô số, rồi dòng 306 ghi đè cả `style` → format bị mất. Xác minh với exceljs 4.4. | Sửa sẽ **đổi diện mạo file Excel** người dùng xuất ra. Cần quyết định sản phẩm, không phải bug fix thuần. |
| 2 | Toàn bộ tầng output | Surface output **mixed có chủ đích** sau khi đảo nhóm rename: ~78 tên không prefix (convention chính, khớp Material) + 16 tên `sd*` đã publish từ 1.4/1.6 (`sdChanges`, `sdBlur`, `sdFocus`, `sdClosed`/`sdCloseError` trên modal/side-drawer/inform/import-excel, `sdCancel` job-progress, …). | Thống nhất về một phía nào cũng breaking. Nếu làm thì cần đợt riêng kèm codemod, xem mục 4. |
| 3 | `components/form-generic/src/models/index.ts` | Thiếu `export * from './form-generic-validation.model'` → `SdFormGenericValidation` và 3 type liên quan **không import được bằng tên**, dù `SdFormGeneric.validations` dùng chúng. | Cùng lớp lỗi với `ToastData` (đã sửa), nhưng nằm ngoài phạm vi đợt đó. Fix nhỏ. Đã ghi "Known gap" trong `sd-form-generic.md`. |
| 4 | `versions/v19/projects/sdcorejs-angular/karma.conf.js` | Coverage vẫn chỉ đo **405/639 file**. `includeAllSources: true` đã bật nhưng **đo được là no-op** dưới builder này (đã ghi lý do đầy đủ trong comment tại chỗ). | Fix thật cần một test entry dùng `require.context` khai trong `angular.json` — đổi cấu trúc test bundle, cần đợt riêng. |
| 5 | ~60 generic khắp `components/table/src/models/**`, `import-excel`, `services/excel`, `form-generic-component.model.ts` | Vẫn để `<T = any>`. | Đã thử chuyển `unknown`: sinh **161 lỗi type**, 55 trong đó là `TS18046` cần narrow thật ở runtime. Đó là dự án về tính đúng đắn, không phải đợt đổi tên. Danh sách file chính xác nằm trong `CHANGELOG.md`. |
| 6 | Bundle `dist/` = 16.32 MB | `components/preview` chiếm 29% vì `pdf-worker-inline.generated.ts` là **một string literal 1.398.249 byte**, nhân 3 lần (bundle + sourcemap + `.d.ts`). `upload-file` = 1.4 MB vì 86 ảnh PNG base64. | Người dùng đã chọn hoãn. |
| 7 | `versions/v19/HANDOFF.md` (và bản mirror ở v20/v21) | Artifact cũ từ đợt `1.4`, có vẻ đã lỗi thời. | Nằm ngoài `projects/` nên không bị `collect-docs` quét; chưa xác minh nội dung. Nếu xoá thì phải chạy lại `npm run sync`. |
| 8 | `modules/layout/services/layout.service.ts` | `npm run check:i18n` báo 7 file vượt ngưỡng. **Cả 7 đều có trước branch này.** File này là 5 dòng chẩn đoán cho dev (`@i18n-ignore`), dịch là sai. | Script `scripts/check-i18n.mjs` **không đọc marker `@i18n-ignore`**. Fix nằm ở script. |
| 9 | `components/query-bar` (chip-popover, saved-filters-menu, field-picker), `sidebar-v2`, `sidebar-mobile-v2` | Còn chuỗi tiếng Việt hardcode, nhưng **dưới ngưỡng** nên checker không báo. `saved-filters-menu` còn dùng `window.prompt()`. | Cần thêm key × 5 locale. Đợt riêng. |

### 5.3. Nợ về accessibility (đã sửa phần lớn, còn lại có chủ đích)

- `[hideInlineError]` chỉ hiện lỗi dạng tooltip → **không có text node** để `aria-describedby`
  trỏ tới, nên trình đọc màn hình không đọc gì ở chế độ đó.
- Vài `aria-label` đang **mượn key i18n gần nhất** thay vì có key riêng (đã liệt kê trong
  `.md` của từng component).
- Hai wrapper `role="button"` (canvas của form-builder, hàng menu sidebar-v1) vẫn **lồng
  phần tử tương tác bên trong**. Handler lọc theo `target` nên không kích hoạt hai lần,
  nhưng gỡ hẳn cấu trúc lồng cần restructure template.
- ~~`document-builder/.../variable.plugin.scss:106` outline note~~ — hết liên quan,
  `components/document-builder` đã xoá hẳn (2026-08-11, xem mục 4).

---

## 6. Bẫy đã gặp — đọc trước khi làm tiếp

Đây là phần dễ mất thời gian nhất nếu không biết trước.

### 6.1. `ng test` từng chạy trên bản BUILD, không phải source

`versions/v19/tsconfig.json` map `@sdcorejs/angular/*` sang `./dist/sdcorejs-angular/*`
**trước** `./projects/sdcorejs-angular/*`. Nghĩa là spec load thư viện đã build lần cuối
cho mọi import chéo entry point — 59 spec + 215 file source. Sửa một file dùng chung mà
không build lại thì spec của các file phụ thuộc **không phản ánh thay đổi**.

**Đã sửa** bằng cách override `paths` trong `tsconfig.spec.json` (trỏ về source).
`ng build` vẫn resolve qua `dist` vì nó cần thế. **Đừng revert.**

### 6.2. Pin jasmine seed KHÔNG đủ để replay

`spec.id` gán theo thứ tự khai báo module, mà bundle esbuild **không ổn định giữa các
build**. Cùng seed `'5'` cho hai thứ tự khác nhau. Seed giờ đọc từ env `JASMINE_SEED` và
**in ra đầu mỗi lần chạy** — dùng nó để báo cáo lần chạy đỏ, nhưng đừng tin là replay được.
Đã ghi comment 14 dòng trong `karma.conf.js`; **đừng "sửa" nó thành "pin seed là đủ"**.

### 6.3. Trạng thái toàn cục làm spec phụ thuộc thứ tự

Ngôn ngữ (`I18nService` + `localStorage`) là **state toàn cục**. Jasmine random hoá thứ tự,
nên một spec gọi `setLanguage()` mà không khôi phục sẽ làm spec khác **đỏ tuỳ lần chạy** —
xanh khi chạy riêng, đỏ trong full suite. Đã gặp 3 lần. Cách xử lý: **ghim ngôn ngữ trước
khi render** trong spec nào assert theo text, đừng tin giá trị mặc định.

Cùng lớp: `window.IntersectionObserver` bị stub mà không khôi phục cũng rò sang spec sau.

### 6.4. PowerShell 5.1 đọc file UTF-8 không BOM bằng ANSI

`Get-Content` sẽ hiển thị mojibake giả trên file tiếng Việt hoàn toàn sạch. Đã suýt "sửa"
nhầm 2 lần. Muốn kiểm tra thật thì dùng:

```powershell
[System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
```

Và quét mojibake theo **codepoint** (`U+FFFD`, `U+00E2 U+20AC`), không quét bằng mắt qua
terminal.

Tương tự: `.NET` API (`[System.IO.File]::...`) dùng CWD của **process**, không phải
`Set-Location` của PowerShell → luôn truyền đường dẫn tuyệt đối.

### 6.5. Đừng dùng `git stash` khi chạy nhiều agent song song

Hai agent cùng stash trong một worktree thì đè nhau. Đã xảy ra một lần (đã khôi phục,
không mất gì). Muốn verify một spec là RED thì:

```bash
cp file.ts file.ts.bak
git show HEAD:path/to/file.ts > path/to/file.ts
# chạy spec
cp file.ts.bak file.ts && rm file.ts.bak
```

### 6.6. Angular đánh giá biểu thức `track` trên CẢ collection cũ

Đã thử khử trùng track key bằng hậu tố `$index` trong `query-bar` và **hỏng**: filter vừa bị
xoá resolve ra key khác → **toàn bộ chip bị huỷ và dựng lại**. 3 spec bắt được. Ràng buộc
đúng đắn (mảng `filters` không được chứa cùng một object hai lần, và object phải ổn định)
giờ ghi trong `sd-query-bar.md`.

### 6.7. `sideEffects` trong `package.json` map theo tên file FESM

Không phải theo đường dẫn source. Đúng dạng là
`./fesm2022/sdcorejs-angular-components-chart.mjs`. ng-packagr copy nguyên field này sang
`dist/package.json`.

---

## 7. Quy trình bắt buộc khi làm tiếp

Ghi lại từ `CLAUDE.md` vì đây là chỗ dễ sai nhất:

1. **Chỉ sửa `versions/v19/**`.** v20 và v21 là bản sinh ra. Sửa tay vào đó sẽ bị
   `npm run sync` ghi đè.
2. Sau khi sửa xong: `npm run sync` rồi `npm run check:sync`.
3. **Doc đi cùng commit.** Đổi public API mà không cập nhật `sd-*.md` tương ứng sẽ bị
   reject ở review. `.md` được coi là hợp đồng API, không phải phụ lục.
4. **Mojibake là lỗi chặn.** Quét trước khi commit bất kỳ thay đổi nào chạm văn bản
   không phải ASCII.
5. Comment `// why:` bằng tiếng Việt cho logic khó — giải thích **tại sao**, không phải
   **cái gì**.

### Khi tag release

`CHANGELOG.md` hiện có mục `## [Unreleased]` đầy đủ. Bước 2 của release ritual là
**bắt buộc**:

```
## [Unreleased]          →   ## [<release-suffix>] - YYYY-MM-DD
                             (và mở lại ## [Unreleased] rỗng ở trên)
```

Bỏ bước này thì `published-docs/<version>/CHANGELOG.md` của release đó **sinh ra rỗng** —
`collect-docs` trích theo đúng heading `## [<suffix>]`.

---

## 8. Cách làm việc đã dùng (nếu muốn lặp lại)

Mỗi phase đi theo 3 bước:

1. **Sửa** — tự làm hoặc chia cho agent theo nhóm file **không chồng nhau**.
2. **Cổng** — `ng build` + `ng lint` + full suite. Không commit khi còn đỏ.
3. **Review đối kháng** — một agent độc lập đọc `git diff` với chỉ thị *"tìm chỗ SAI,
   không khen, không đề xuất cosmetic"*.

**Bước 3 là bước đáng giá nhất.** Nó bắt **23 lỗi blocking mà 4600 test xanh không bắt
được**, trong đó có lỗi nằm trong chính fix vừa viết ra. Vài ví dụ:

- Fix connector thay control khi trùng tên, nhưng quên **trả lại control cũ** khi destroy
  → mất control gốc của consumer. Tệ hơn bug ban đầu.
- Một "tối ưu" cache trạng thái checkbox group tính từ cờ mà tại thời điểm đó **chưa được
  đặt** (CDK dựng header trước body) → checkbox khoá cứng sai. Pure pipe nên không bao giờ
  tự sửa.
- Một namespace mặc định cho storage nghe vô hại nhưng sẽ **mồ côi toàn bộ dữ liệu đã lưu**
  của consumer đang cấu hình đúng.

Nếu làm tiếp các đợt lớn, **giữ bước 3**.

---

## 9. Tham chiếu nhanh

| Cần gì | Ở đâu |
|---|---|
| Báo cáo review gốc (đánh giá đầy đủ **trước** khi sửa) | `.sdcorejs/docs/2026-08-11-full-scan-review.md` |
| Bảng migration breaking | `CHANGELOG.md` → `### Changed (BREAKING for consumers)` |
| Nguồn gốc code GPL (đã xoá 2026-08-11) | git history: `NOTICE` + `services/docx/sd-docx.md` trước commit xoá |
| Luật cứng của repo | `CLAUDE.md` (đầy đủ) · `AGENTS.md` (bản rút gọn, phải sửa cùng lúc) |
| Ánh xạ alias `@deprecated` đã xoá | `versions/v19/projects/sdcorejs-angular/utilities/models/models.md` |
| Ràng buộc `filters` của query-bar | `components/query-bar/sd-query-bar.md` → "Chip identity" |
| Vì sao `modal-resizable` không có `.md` | Comment trong `modal-resizable.component.ts` |

---

**Câu tóm tắt:** phần lõi của thư viện tốt hơn hẳn phần release engineering của nó —
`check:sync`, build và 4600 test đều xanh, và đó chính là lý do không ai thấy primary
entry point export rỗng, 6 peer dep thiếu, cờ `sideEffects` khai sai, `aria-hidden` nằm
trên 10 `<input>` thật, và CI chưa từng chạy test. Branch này sửa những cổng đó, và sửa
luôn phần lớn thứ chúng lẽ ra phải bắt được.
