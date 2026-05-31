�# `<sd-autoid-inspector>`

**Type**: Component (DevTool / QA helper)
**Selector**: `sd-autoid-inspector`
**Import path**: `@sdcorejs/angular/components/autoid-inspector` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdAutoidInspector`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Floating dev/QA inspector � quét toàn b�" `[data-autoid]` trên page, audit element thiếu/trùng autoid, export danh sách ra CSV / JSON / Markdown POM skeleton cho AI viết auto-test.

## When to use
- Bật �x môi trường **dev / staging** �Ồ ��"i QC + Automation tra cứu autoid của UI.
- Audit nhanh khi review PR / refactor form �Ồ chắc chắn mọi `sd-input`, `sd-select`, `sd-button` v.v. �ã �ặt `data-autoid` �úng convention.
- Sinh POM skeleton (`.md`) làm prompt context cho AI generate Playwright / Cypress test.
- Highlight DOM ngay tại trang �Ồ dev mapping autoid �  v�9 trí element trực quan.

## When NOT to use
- Production build cho user cu�i � luôn opt-out qua `[enabled]="!environment.production"`.
- Audit autoid theo lô / CI � dùng script riêng, không cần component.
- Không phải �Ồ show user data hay �iều hư�:ng � �ây là devtool n�"i b�".

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | `transform: booleanAttribute` � bare attribute = true. Khi `false` FAB không render, mọi public method `openPanel()` no-op. |
| `config` | `SdAutoidInspectorConfig \| undefined` | `undefined` | Tuỳ biến scope scan. `{ root?: HTMLElement; extraRequireSelectors?: string[] }`. Mặc ��9nh scan `document.body` + `SD_AUTOID_DEFAULT_REQUIRE_SELECTORS`. |

### `SdAutoidInspectorConfig`
| Field | Type | Notes |
| --- | --- | --- |
| `root` | `HTMLElement` | Root scan, mặc ��9nh `document.body`. Pass element cụ thỒ khi mu�n audit 1 region. |
| `extraRequireSelectors` | `string[]` | Selector phụ ngoài tập mặc ��9nh (vd component custom team không thu�"c sd-*). |

### Selector mặc ��9nh coi là "phải có data-autoid"
Export hằng `SD_AUTOID_DEFAULT_REQUIRE_SELECTORS`:

```
sd-input, sd-input-number, sd-textarea, sd-select, sd-autocomplete,
sd-checkbox, sd-radio, sd-switch, sd-date, sd-datetime, sd-date-range,
sd-chip, sd-chip-calendar, sd-button
```

## Outputs
Không có `@Output()` event. State internal qua public signals (`open`, `segment`, `elements`, `audit`, `highlightOn`) � consumer có thỒ dùng `ViewChild(SdAutoidInspector)` �Ồ gọi method trực tiếp.

## Public API
| Method | Trả về | Notes |
| --- | --- | --- |
| `openPanel()` | `void` | M�x panel + `refresh()`. No-op nếu `enabled=false`. |
| `closePanel()` | `void` | Đóng panel. **KH�NG** clear DOM highlight � dùng `toggleHighlight()` �Ồ clear. |
| `togglePanel()` | `void` | Toggle open / close. |
| `refresh()` | `void` | Scan lại DOM + re-audit + apply highlight (nếu `highlightOn=true`). |
| `toggleHighlight()` | `void` | Bật / tắt outline xanh-�ỏ trên DOM (signal `highlightOn`). |
| `setSegment(seg)` | `void` | `seg ��� 'audit' \| 'elements' \| 'export'`. |
| `copyJson()` | `Promise<void>` | Copy danh sách elements (JSON) vào clipboard. |
| `copyXpath(autoid)` | `Promise<void>` | Copy `//*[@data-autoid="<autoid>"]`. |
| `exportCsv()` | `void` | Tải `.csv` (c�"t: STT, name, autoid, tag, value, xpath). |
| `exportJson()` | `void` | Tải `.json`. |
| `exportMdPom()` | `void` | Tải `.pom.md` � TypeScript POM skeleton, AI copy thành Playwright/Cypress test. |
| `exportMdTable()` | `void` | Tải `.reference.md` � bảng group theo tag sd-*. |

## Services (injectable, providedIn: 'root')
| Service | Purpose |
| --- | --- |
| `SdAutoidScannerService` | `scan(root)` �  `SdAutoidElement[]`, `groupByAutoid(els)` map autoid �  element[]. |
| `SdAutoidAuditService` | `audit(elements, { root, requireSelectors })` �  `SdAutoidAuditResult` (duplicates + missing). |
| `SdAutoidHighlightService` | `apply(root)` outline xanh / �ỏ; `applyMissing(nodes)` dashed cam; `clear(root)` restore inline style g�c. |
| `SdAutoidExportService` | `toJson / toCsv / toMarkdownPom / toMarkdownTable` + `download(content, filename, mime)` + `copyToClipboard(text)`. |

Reuse �ược riêng � vd batch audit / CI script ch�0 cần `SdAutoidScannerService` + `SdAutoidAuditService` không cần UI.

## Quy ư�:c �ặt `data-autoid`
| Component | Format | Ví dụ |
| --- | --- | --- |
| Input | `forms-input-<name>` | `forms-input-email` |
| Number | `forms-number-<name>` | `forms-number-age` |
| Textarea | `forms-textarea-<name>` | `forms-textarea-desc` |
| Date | `forms-date-<name>` | `forms-date-start` |
| DateTime | `forms-datetime-<name>` | `forms-datetime-created` |
| Date Range | `forms-date-range-<name>` | `forms-date-range-period` |
| Autocomplete | `forms-autocomplete-<name>` | `forms-autocomplete-user` |
| Select | `forms-select-<name>` | `forms-select-country` |
| Checkbox | `forms-checkbox-<name>` | `forms-checkbox-agree` |
| Radio | `forms-radio-<name>` | `forms-radio-gender` |
| Switch | `forms-switch-<name>` | `forms-switch-status` |
| Chip | `forms-chip-<name>` | `forms-chip-tags` |
| Button | `button-<name>` | `button-submit` |

**Quan trọng**: autoid bắt bu�"c duy nhất trên m�i page.

## UI structure
- **FAB** (icon `tag`, primary color) � góc dư�:i-phải, position `fixed`, z-index 100000. Hover scale + shadow tĒng.
- **Panel** floating phải-dư�:i `min(860px, 100vw - 40px)`, max-height `100vh - 110px`, border-radius 12, shadow l�:n, có backdrop blur(2px). Esc / click backdrop / nút � �óng.
- **3 tab segment**:
  - **Audit** � toolbar pill toggle "Highlight DOM" (visibility ON/OFF), 3 stat card (T�"ng / Trùng / Thiếu) v�:i màu semantic (info / error / warning / success), bảng duplicate + missing.
  - **Elements** � filter input + **"Top-level elements"** section (elements không nằm trong `sd-table`), sau �ó m�"t section riêng cho m�i `<sd-table>` (`Inside <code>components-table-...</code>`). Bảng có 6 c�"t: `STT | Name | Autoid (kèm copy xpath inline) | Tag (chip info) | State (chip per data-* key) | Text (ưu tiên data-value, fallback input.value/textContent, ellipsis + tooltip full)`. Sticky header v�:i box-shadow inset.
  - **Export** � 5 nút trên 1 hàng: `Copy JSON / JSON / CSV / MD POM / MD Table`. Hover lift + bg primary-light.
- **Toast** copy thành công (success color).

## Highlight behavior
- **Default** `highlightOn = signal(true)` � m�x panel lần �ầu �  apply outline ngay.
- **`closePanel()` KH�NG clear highlight** � �óng panel vẫn thấy outline �Ồ inspect DOM b�9 panel che.
- **`toggleHighlight()`** trong tab Audit là cách duy nhất �Ồ clear / re-apply.
- **`ngOnDestroy`** clear toàn b�" marker �Ồ không leak.
- Outline:
  - Xanh `--sd-success` cho autoid unique.
  - Đỏ `--sd-error` cho autoid duplicate.
  - Dashed cam `--sd-warning` cho element missing autoid (sd-* yêu cầu).
- Service backup `outline` + `backgroundColor` inline trư�:c khi apply �  restore chính xác khi clear.

## Examples

### 1. Bật �x môi trường dev (Angular module bootstrap)
```ts
// app.module.ts
import { SdAutoidInspector } from '@sdcorejs/angular/components/autoid-inspector';
import { environment } from '../environments/environment';

@NgModule({
  imports: [..., SdAutoidInspector],
})
export class AppModule {
  isDev = !environment.production;
}
```

```html
<!-- app.component.html -->
<router-outlet></router-outlet>
<sd-autoid-inspector [enabled]="isDev"></sd-autoid-inspector>
```

### 2. Standalone bootstrap (Angular 19)
```ts
import { SdAutoidInspector } from '@sdcorejs/angular/components/autoid-inspector';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SdAutoidInspector],
  template: `
    <router-outlet/>
    <sd-autoid-inspector [enabled]="!environment.production"/>
  `,
})
export class AppComponent {}
```

### 3. Audit 1 region cụ thỒ + thêm selector custom
```html
<sd-autoid-inspector
  [enabled]="true"
  [config]="{ root: detailPanel.nativeElement, extraRequireSelectors: ['custom-input', 'app-rich-editor'] }">
</sd-autoid-inspector>
```

### 4. Headless audit (CI script � không dùng component)
```ts
import {
  SdAutoidScannerService,
  SdAutoidAuditService,
} from '@sdcorejs/angular/components/autoid-inspector';

const scanner = new SdAutoidScannerService();
const auditor = new SdAutoidAuditService();
const elements = scanner.scan(document.body);
const result = auditor.audit(elements);

if (result.duplicateCount > 0 || result.missingCount > 0) {
  console.error('AutoId audit failed:', result);
  process.exit(1);
}
```

### 5. Sinh POM markdown từ ngoài component
```ts
const exporter = new SdAutoidExportService();
const md = exporter.toMarkdownPom(elements, {
  pageUrl: location.pathname,
  pageTitle: document.title,
  timestamp: new Date().toISOString(),
});
exporter.download(md, 'page.pom.md', 'text/markdown');
```

## Export formats

### CSV
```
STT,name,autoid,tag,table-scope,disabled,loading,empty,invalid,opened,count,data-value,value,xpath
1,"Email","forms-input-email","sd-input","","false","","true","","","","","","//*[@data-autoid=\"forms-input-email\"]"
```

### Markdown POM skeleton
```ts
// Page: /customers/create
// Generated: 2026-05-25T10:00:00.000Z
export class CustomerCreatePage {
  /** sd-input Email � */
  readonly formsInputEmail = '//*[@data-autoid="forms-input-email"]';
  /** sd-button Submit � */
  readonly buttonSubmit = '//*[@data-autoid="button-submit"]';
}
```

### Markdown Reference table (group theo tableScope r�i tag)
```markdown
## Top-level

### sd-input
| name | autoid | xpath | state | duplicate |
|------|--------|-------|-------|-----------|
| Email | `forms-input-email` | `//*[@data-autoid="forms-input-email"]` | disabled=false; empty=true |  |

### sd-button
| name | autoid | xpath | state | duplicate |
|------|--------|-------|-------|-----------|
| Submit | `button-submit` | `//*[@data-autoid="button-submit"]` |  | �a�️ |

## Inside table `components-table-employees`

### sd-input
| name | autoid | xpath | state | duplicate |
|------|--------|-------|-------|-----------|
| Search | `table-input-search` | `//*[@data-autoid="table-input-search"]` | invalid=false |  |
```

## Styling
- Dùng **CSS custom properties** từ `@sdcorejs/angular` theme (`--sd-primary`, `--sd-primary-light/dark`, `--sd-info`, `--sd-success`, `--sd-warning`, `--sd-error` + `--sd-black100..500`).
- Override màu sắc bằng cách override CSS variable �x `:root` hoặc theme parent � không cần �ụng SCSS.
- Fallback hex ch�0 áp dụng khi consumer chưa import `sd-core.scss`.

## Keyboard shortcuts
| Key | Hành ��"ng |
| --- | --- |
| `Esc` | Đóng panel khi �ang m�x. |

## State display (Elements tab)

M�i row trong tab Elements có c�"t **State** hiỒn th�9 các `data-*` runtime mà component ngu�n render (xem [`docs/E2E-ATTRIBUTES.md`](../../docs/E2E-ATTRIBUTES.md)). Chip ch�0 render khi attribute thực sự t�n tại trên DOM:

- `disabled=true|false` (�ỏ khi `true`)
- `loading=true|false` (cam khi `true`)
- `empty=true|false` (xanh info khi `true`)
- `invalid=true|false` (�ỏ khi `true`)
- `opened=true|false` (xanh info khi `true`)
- `count=<N>` (xanh info)
- C�"t **Text** ưu tiên hiỒn th�9 `data-value` �ã serialize; fallback về `input.value` / `textContent` (field `text` trong model).

Element nằm trong `<sd-table>` �ược tách thành section riêng `Inside <code>components-table-...</code>` �Ồ d�& tra cứu trong bảng có vài chục autoid l�ng nhau.

## E2E test attributes

Cùng convention v�:i các component khác trong `@sdcorejs/angular` (xem [`projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md`](../../docs/E2E-ATTRIBUTES.md)). Inspector hiỒn th�9 runtime state của các component KHÁC trên trang � xem mục **State display** �x trên. Vì �ây là devtool, các attribute trên chính inspector tập trung vào **trạng thái runtime của inspector** thay vì `value/empty/invalid`.

### FAB button � `data-autoid="sd-autoid-inspector-fab"`

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `sd-autoid-inspector-fab` (static) | constant |
| `data-opened` | `"true"` / `"false"` | `open` signal |

> `dismissed`/`enabled=false` không có attr riêng � toàn b�" FAB wrapper ẩn (`@if (enabled() && !dismissed())`), nên QA nhận di�!n bằng vi�!c element **vắng mặt** trong DOM.

### Panel section � `data-autoid="sd-autoid-inspector-panel"`

Element �ược render ch�0 khi panel �ang m�x (`@if (enabled() && open())`).

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `sd-autoid-inspector-panel` (static) | constant |
| `data-segment` | `"audit"` / `"elements"` / `"export"` | `segment` signal |
| `data-highlight-on` | `"true"` / `"false"` | `highlightOn` signal |
| `data-element-count` | numeric string | `elements().length` |
| `data-missing-count` | numeric string | `audit()?.missingCount ?? 0` |
| `data-duplicate-count` | numeric string | `audit()?.duplicateCount ?? 0` |

### Selector examples (Playwright)

```ts
// M�x inspector và �ợi panel xuất hi�!n
await page.locator('[data-autoid="sd-autoid-inspector-fab"]').click();
const panel = page.locator('[data-autoid="sd-autoid-inspector-panel"]');
await expect(panel).toBeVisible();

// Assert audit pass � 0 missing + 0 duplicate
await expect(panel).toHaveAttribute('data-missing-count', '0');
await expect(panel).toHaveAttribute('data-duplicate-count', '0');

// Switch tab via UI r�i kiỒm tra
await panel.locator('button:has-text("Elements")').click();
await expect(panel).toHaveAttribute('data-segment', 'elements');
```

## Edge cases & guarantees
- Scan dùng `document.querySelectorAll('[data-autoid]')` � �ọc-only, không mutate DOM (trừ highlight có backup/restore).
- `name` resolve theo thứ tự: `label[for=id]` �  `aria-label` �  `placeholder` �  `title` �  `''`.
- `tag` lấy parent gần nhất có prefix `sd-*` (vd `sd-input` cho `<input>` con); fallback `tagName.toLowerCase()`.
- `text` lấy `input.value` hoặc `textContent` cắt �x 80 ký tự.
- `missing` ch�0 flag khi cả element CHÍNH và mọi descendant �ều thiếu `data-autoid` � tránh false-positive v�:i `sd-button` render `<button data-autoid>` bên trong.
- Highlight service idempotent � gọi `apply()` lần 2 vẫn restore �úng style g�c khi `clear()`.
- `CSS.escape` �ược dùng cho id có ký tự �ặc bi�!t khi resolve label.

## Tests
- `autoid-scanner.service.spec.ts` � 14 case (resolveName / tag / value, duplicate, CSS.escape, groupByAutoid, + 4 new: readState, tableScope resolve, no-tableScope, self-is-table).
- `autoid-audit.service.spec.ts` � 7 case (duplicate, missing, descendant guard, custom requireSelectors, selector path, outerHtml preview).
- `autoid-highlight.service.spec.ts` � 6 case (apply unique / duplicate / missing, idempotent, clear restore, skip element �ã marker).
- `autoid-export.service.spec.ts` � 11 case (JSON / CSV escape, POM skeleton, Reference table sort + duplicate flag, MD escape, clipboard fallback, + 3 new: toCsv state+tableScope, toMarkdownPom state summary, toMarkdownTable groupByScope).
- `autoid-inspector.component.spec.ts` � 19 case (FAB visibility, togglePanel, audit duplicate / missing, highlight ON/OFF, Esc, filter, copyJson, ngOnDestroy cleanup, E2E data-* attributes �2, + 3 new: topLevelElements, tableGroups, state chip rendering).

T�"ng: 57 case xanh.

