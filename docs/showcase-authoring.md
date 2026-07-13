# Showcase documentation authoring

Tài liệu này mô tả cách duy trì documentation site của `@sdcorejs/angular`. Showcase dùng `versions/v19` làm source of truth; không sửa độc lập bản sao showcase trong `versions/v20` hoặc `versions/v21`.

## Kiến trúc

| Phần | Source of truth | Vai trò |
| --- | --- | --- |
| Catalog | `versions/v19/projects/showcase/src/app/docs/core/documentation.registry.ts` | Metadata duy nhất cho routes, sidebar, landing page, search, breadcrumbs và previous/next |
| Published versions | `published-docs/versions.json` | Danh sách version và giá trị `latest` |
| Published API docs | `published-docs/<version>/index.json` + Markdown | Nội dung version-aware cho Overview, Styling và API |
| Live examples | `versions/v19/projects/showcase/src/app/pages/**` | Implementation hiện tại, lazy-loaded từ registry |
| Example source | `scripts/generate-showcase-example-sources.mjs` | Trích source thật thành typed generated map để code hiển thị không drift |
| Changelog | Root `CHANGELOG.md` | Nguồn release notes duy nhất; generator lọc từ suffix `1.2` |
| Author | `author-profile.config.ts` | Cấu hình author strongly typed; placeholder/field trống được ẩn |

Runtime URLs được tạo từ `document.baseURI` qua `DOCS_BASE_URL`. Không dùng URL bắt đầu bằng `/docs` và không hard-code hostname GitHub Pages.

## Route map

```text
/
/v/:version
/v/:version/components/:slug/{overview|styling|api|examples}
/v/:version/forms/:slug/{overview|styling|api|examples}
/v/:version/services/:slug/{overview|styling|api|examples}
/v/:version/changelog
/about
```

Legacy URLs như `/components/button` được chuyển đến version ưu tiên và tab `overview`. Invalid slug/tab hiển thị documentation 404. Invalid version được normalize về `latest` và có non-blocking notice.

## Thêm component, form hoặc service page

1. Tạo standalone, `OnPush` demo dưới một trong các folder:

   ```text
   projects/showcase/src/app/pages/components/<slug>/
   projects/showcase/src/app/pages/forms/<slug>/
   projects/showcase/src/app/pages/services/<slug>/
   ```

2. Thêm đúng một `DocPageDefinition` qua `defineDocPage(...)` trong `documentation.registry.ts`.
3. Khai báo stable `slug`, title, description, selector (nếu có), import path, keywords, status, số scenario hiện có và lazy `loadComponent`.
4. Chạy registry tests để kiểm tra unique id, unique category/slug, tab order, source key và counts.
5. Chạy source generator; không sửa `example-sources.generated.ts` bằng tay.

Sidebar, landing catalog, search và previous/next tự cập nhật từ registry. Không tạo array navigation hoặc route metadata thứ hai.

## Map published-doc id

`publishedDocId` phải khớp `docs[].id` trong `published-docs/<version>/index.json`, không suy ra chỉ từ slug.

Ví dụ:

```ts
publishedDocId: 'components/button/sd-button';
```

Các mapping khác category phải khai báo rõ, ví dụ:

```ts
// Showcase category là components, published API nằm trong modules.
publishedDocId: 'modules/generic/sd-generic';
```

`PublishedDocsService` chỉ tin `version` và `docs[].path`. Trường absolute `index`/`url` trong archive không được dùng để fetch, vì chúng không base-href-safe.

## Tạo live example

Mỗi `demo-section` có `heading` tĩnh được generator chuyển thành một `DocExample` riêng với stable id, source key và deep-link anchor. Tổng 253 scenario cũ vì vậy xuất hiện thành 253 example card; preview chỉ được tạo khi card đi vào viewport.

Với example mới hoặc khi refactor một case phức tạp, ưu tiên tách thành standalone component có source thật riêng. Button là reference implementation:

```text
pages/components/button/
  button-demo.component.ts
  examples/
    button-variants.example.ts
    button-variants.example.html
    ...
```

Wrapper `demo-page` phải expose `#demoPage`; từng section dùng structural guard khớp stable id. Guard này ngăn Angular khởi tạo các sibling scenario bị ẩn trong một focused card. Generator sẽ fail nếu guard thiếu hoặc id bị stale. Thứ tự guard trong source cũng là thứ tự card trên trang.

```html
<demo-page #demoPage title="Button">
  @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bien-the') {
    <demo-section
      heading="Biến thể"
      data-example-typescript="./examples/button-variants.example.ts"
      data-example-template="./examples/button-variants.example.html"
      data-example-style="./examples/button-variants.example.scss">
      <app-button-variants-example></app-button-variants-example>
    </demo-section>
  }
</demo-page>
```

`data-example-style` là optional. TypeScript và template phải cùng xuất hiện; file thiếu, heading trùng hoặc source key trùng sẽ làm generator fail. Với legacy section chưa tách, generator vẫn trích đúng section HTML và source page component để không làm mất behavior.

Quy ước cho mỗi focused example:

- mỗi example là standalone component có stable id;
- giữ `ChangeDetectionStrategy.OnPush`;
- dùng signals/computed cho state hiển thị;
- có reset contract hoặc đảm bảo component có thể remount sạch;
- giữ nguyên hành vi đã có trước khi xóa legacy wrapper;
- không tạo variant mà public API không hỗ trợ.

`ExampleViewerComponent` cung cấp deep link, preview, source tabs, copy, collapse/expand và reset-by-remount. Preview thông thường load khi card vào viewport; Editor, Form Generic và Upload File chỉ load sau interaction để tránh tự động tải bundle lớn. Historical version luôn phải nói rõ rằng API Markdown theo version đã chọn, còn live example dùng implementation showcase đồng bộ hiện tại.

## Example source extraction

Chạy từ repository root:

```powershell
npm run test:showcase-examples
npm run generate:showcase-examples
```

Generator scan `*-demo.component.ts`, hỗ trợ inline/external template và styles, rồi sinh:

```text
versions/v19/projects/showcase/src/app/docs/generated/example-manifest.generated.ts
versions/v19/projects/showcase/src/app/docs/generated/example-sources.generated.ts
```

Manifest nhỏ được registry import sớm để dựng 253 card. Source map giữ TypeScript/SCSS dùng chung theo page và chỉ lazy import khi người dùng mở source. Thiếu external/focused file, duplicate id/key, registry count lệch hoặc output không deterministic phải làm generator fail.

## Keywords và global search

Thêm keyword có ý nghĩa với intent sử dụng, trạng thái và tên phổ biến. Search index kết hợp:

- title, category và slug;
- selector và import path;
- registry keywords;
- example titles;
- published document title của version đang chọn.

Không thêm external search service. Giữ shortcut `/` và `Ctrl/Cmd+K`, arrow navigation, Enter, Escape và focus restoration.

## Version switching

`DocsVersionService` tải `docs/versions.json`, sort semantic, group theo Angular major, đọc `latest` và lưu lựa chọn trong `localStorage` key `sdcorejs.docs.version`.

Khi đổi version, service giữ category/slug/tab/query/fragment nếu route hiện tại có cùng shape. `PublishedDocsService` cache index và Markdown thành công theo version. Khi entry thiếu ở version đã chọn, UI hiển thị `Not available in this version` thay vì lấy nhầm nội dung version khác.

Local `ng serve showcase` không tự phục vụ root `published-docs`; runtime error/retry state vẫn hoạt động. Để kiểm tra published content đầy đủ, dùng Pages artifact layout (`dist/showcase/browser/docs`) hoặc một local static copy/proxy tương đương.

## Cập nhật author

Sửa duy nhất:

```text
versions/v19/projects/showcase/src/app/docs/core/author-profile.config.ts
```

Chỉ thay placeholder bằng thông tin đã xác minh. Không thêm employment history, awards, client names hoặc social links chưa được cung cấp. Optional field trống hoặc còn dạng `[PLACEHOLDER]` sẽ không render.

## Changelog generation

Root `CHANGELOG.md` là source of truth. Chạy:

```powershell
npm run test:showcase-changelog
npm run generate:showcase-changelog
```

Generator state-machine giữ `Unreleased`, lọc release từ suffix `1.2`, derive chips `19.<suffix>`, `20.<suffix>`, `21.<suffix>` và sinh `changelog.generated.ts`. Workflow Pages chạy test/generator trước build. Không copy release notes thủ công vào Angular component.

## Test và build local

Từ `versions/v19`:

```powershell
npm ci --legacy-peer-deps
node --max_old_space_size=8000 ./node_modules/@angular/cli/bin/ng test showcase --watch=false --browsers=ChromeHeadless --source-map=false
node --max_old_space_size=8000 ./node_modules/@angular/cli/bin/ng build sdcorejs-angular
node --max_old_space_size=8000 ./node_modules/@angular/cli/bin/ng build showcase --configuration production --base-href=/sdcorejs-angular/
```

Karma phải dùng heap 8 GB vì registry giữ 53 page loaders, 253 example records và test compile toàn bộ dependency graph. Không gộp coverage thresholds của showcase vào library coverage gate hiện tại.

## Sync v19 sang v20/v21

Chỉ sau khi v19 tests/build pass, chạy từ root:

```powershell
npm run sync
npm run check:sync
```

Sau sync, không hand-edit generated showcase files trong v20/v21. Nếu có khác biệt chỉ dành riêng cho Angular major, ghi rõ shim và cập nhật sync checker theo convention sẵn có.

## GitHub Pages và base href

Pages build dùng:

```text
--base-href=/sdcorejs-angular/
```

Workflow copy `published-docs` vào `dist/showcase/browser/docs`, tạo alias `docs/latest` và copy `index.html` thành `404.html` để giữ SPA deep links. Khi thêm asset/runtime fetch:

- resolve bằng `new URL(relativePath, document.baseURI)` hoặc `DOCS_BASE_URL`;
- không hard-code `sdcorejs.github.io` trong Angular runtime;
- không thay `404.html` fallback bằng manual URL handling;
- thêm path trigger workflow nếu source/generator mới ảnh hưởng Pages artifact.

## Verification checklist

- [ ] Registry và generator tests pass.
- [ ] Tất cả 53 registry entries vẫn lazy-load.
- [ ] Registry có đúng 253 stable example ids/source keys và mọi key tồn tại trong generated source map.
- [ ] Tổng 253 legacy scenarios không giảm; focused refactor giữ nguyên behavior trước khi xóa logic cũ.
- [ ] Overview, Styling, API và Examples deep-link được.
- [ ] Published URLs vẫn nằm dưới base href.
- [ ] Changelog artifact được regenerate từ root source.
- [ ] v19 library/showcase production builds pass.
- [ ] `npm run sync` và `npm run check:sync` pass.
- [ ] `git diff` không có public library API change ngoài phạm vi.
