# `<sd-autoid-inspector>`

**Type**: Component (DevTool / QA helper)
**Selector**: `sd-autoid-inspector`
**Import path**: `@sdcorejs/angular/components/autoid-inspector` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdAutoidInspector`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Floating dev/QA inspector â€” quÃ©t toÃ n bá»™ `[data-autoid]` trÃªn page, audit element thiáº¿u/trÃ¹ng autoid, export danh sÃ¡ch ra CSV / JSON / Markdown POM skeleton cho AI viáº¿t auto-test.

## When to use
- Báº­t á»Ÿ mÃ´i trÆ°á»ng **dev / staging** Ä‘á»ƒ Ä‘á»™i QC + Automation tra cá»©u autoid cá»§a UI.
- Audit nhanh khi review PR / refactor form Ä‘á»ƒ cháº¯c cháº¯n má»i `sd-input`, `sd-select`, `sd-button` v.v. Ä‘Ã£ Ä‘áº·t `data-autoid` Ä‘Ãºng convention.
- Sinh POM skeleton (`.md`) lÃ m prompt context cho AI generate Playwright / Cypress test.
- Highlight DOM ngay táº¡i trang Ä‘á»ƒ dev mapping autoid â†” vá»‹ trÃ­ element trá»±c quan.

## When NOT to use
- Production build cho user cuá»‘i â€” luÃ´n opt-out qua `[enabled]="!environment.production"`.
- Audit autoid theo lÃ´ / CI â€” dÃ¹ng script riÃªng, khÃ´ng cáº§n component.
- KhÃ´ng pháº£i Ä‘á»ƒ show user data hay Ä‘iá»u hÆ°á»›ng â€” Ä‘Ã¢y lÃ  devtool ná»™i bá»™.

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | `transform: booleanAttribute` â€” bare attribute = true. Khi `false` FAB khÃ´ng render, má»i public method `openPanel()` no-op. |
| `config` | `SdAutoidInspectorConfig \| undefined` | `undefined` | Tuá»³ biáº¿n scope scan. `{ root?: HTMLElement; extraRequireSelectors?: string[] }`. Máº·c Ä‘á»‹nh scan `document.body` + `SD_AUTOID_DEFAULT_REQUIRE_SELECTORS`. |

### `SdAutoidInspectorConfig`
| Field | Type | Notes |
| --- | --- | --- |
| `root` | `HTMLElement` | Root scan, máº·c Ä‘á»‹nh `document.body`. Pass element cá»¥ thá»ƒ khi muá»‘n audit 1 region. |
| `extraRequireSelectors` | `string[]` | Selector phá»¥ ngoÃ i táº­p máº·c Ä‘á»‹nh (vd component custom team khÃ´ng thuá»™c sd-*). |

### Selector máº·c Ä‘á»‹nh coi lÃ  "pháº£i cÃ³ data-autoid"
Export háº±ng `SD_AUTOID_DEFAULT_REQUIRE_SELECTORS`:

```
sd-input, sd-input-number, sd-textarea, sd-select, sd-autocomplete,
sd-checkbox, sd-radio, sd-switch, sd-date, sd-datetime, sd-date-range,
sd-chip, sd-chip-calendar, sd-button
```

## Outputs
KhÃ´ng cÃ³ `@Output()` event. State internal qua public signals (`open`, `segment`, `elements`, `audit`, `highlightOn`) â€” consumer cÃ³ thá»ƒ dÃ¹ng `ViewChild(SdAutoidInspector)` Ä‘á»ƒ gá»i method trá»±c tiáº¿p.

## Public API
| Method | Tráº£ vá» | Notes |
| --- | --- | --- |
| `openPanel()` | `void` | Má»Ÿ panel + `refresh()`. No-op náº¿u `enabled=false`. |
| `closePanel()` | `void` | ÄÃ³ng panel. **KHÃ”NG** clear DOM highlight â€” dÃ¹ng `toggleHighlight()` Ä‘á»ƒ clear. |
| `togglePanel()` | `void` | Toggle open / close. |
| `refresh()` | `void` | Scan láº¡i DOM + re-audit + apply highlight (náº¿u `highlightOn=true`). |
| `toggleHighlight()` | `void` | Báº­t / táº¯t outline xanh-Ä‘á» trÃªn DOM (signal `highlightOn`). |
| `setSegment(seg)` | `void` | `seg âˆˆ 'audit' \| 'elements' \| 'export'`. |
| `copyJson()` | `Promise<void>` | Copy danh sÃ¡ch elements (JSON) vÃ o clipboard. |
| `copyXpath(autoid)` | `Promise<void>` | Copy `//*[@data-autoid="<autoid>"]`. |
| `exportCsv()` | `void` | Táº£i `.csv` (cá»™t: STT, name, autoid, tag, value, xpath). |
| `exportJson()` | `void` | Táº£i `.json`. |
| `exportMdPom()` | `void` | Táº£i `.pom.md` â€” TypeScript POM skeleton, AI copy thÃ nh Playwright/Cypress test. |
| `exportMdTable()` | `void` | Táº£i `.reference.md` â€” báº£ng group theo tag sd-*. |

## Services (injectable, providedIn: 'root')
| Service | Purpose |
| --- | --- |
| `SdAutoidScannerService` | `scan(root)` â†’ `SdAutoidElement[]`, `groupByAutoid(els)` map autoid â†’ element[]. |
| `SdAutoidAuditService` | `audit(elements, { root, requireSelectors })` â†’ `SdAutoidAuditResult` (duplicates + missing). |
| `SdAutoidHighlightService` | `apply(root)` outline xanh / Ä‘á»; `applyMissing(nodes)` dashed cam; `clear(root)` restore inline style gá»‘c. |
| `SdAutoidExportService` | `toJson / toCsv / toMarkdownPom / toMarkdownTable` + `download(content, filename, mime)` + `copyToClipboard(text)`. |

Reuse Ä‘Æ°á»£c riÃªng â€” vd batch audit / CI script chá»‰ cáº§n `SdAutoidScannerService` + `SdAutoidAuditService` khÃ´ng cáº§n UI.

## Quy Æ°á»›c Ä‘áº·t `data-autoid`
| Component | Format | VÃ­ dá»¥ |
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

**Quan trá»ng**: autoid báº¯t buá»™c duy nháº¥t trÃªn má»—i page.

## UI structure
- **FAB** (icon `tag`, primary color) â€” gÃ³c dÆ°á»›i-pháº£i, position `fixed`, z-index 100000. Hover scale + shadow tÄƒng.
- **Panel** floating pháº£i-dÆ°á»›i `min(860px, 100vw - 40px)`, max-height `100vh - 110px`, border-radius 12, shadow lá»›n, cÃ³ backdrop blur(2px). Esc / click backdrop / nÃºt Ã— Ä‘Ã³ng.
- **3 tab segment**:
  - **Audit** â€” toolbar pill toggle "Highlight DOM" (visibility ON/OFF), 3 stat card (Tá»•ng / TrÃ¹ng / Thiáº¿u) vá»›i mÃ u semantic (info / error / warning / success), báº£ng duplicate + missing.
  - **Elements** â€” filter input + **"Top-level elements"** section (elements khÃ´ng náº±m trong `sd-table`), sau Ä‘Ã³ má»™t section riÃªng cho má»—i `<sd-table>` (`Inside <code>components-table-...</code>`). Báº£ng cÃ³ 6 cá»™t: `STT | Name | Autoid (kÃ¨m copy xpath inline) | Tag (chip info) | State (chip per data-* key) | Text (Æ°u tiÃªn data-value, fallback input.value/textContent, ellipsis + tooltip full)`. Sticky header vá»›i box-shadow inset.
  - **Export** â€” 5 nÃºt trÃªn 1 hÃ ng: `Copy JSON / JSON / CSV / MD POM / MD Table`. Hover lift + bg primary-light.
- **Toast** copy thÃ nh cÃ´ng (success color).

## Highlight behavior
- **Default** `highlightOn = signal(true)` â€” má»Ÿ panel láº§n Ä‘áº§u â†’ apply outline ngay.
- **`closePanel()` KHÃ”NG clear highlight** â€” Ä‘Ã³ng panel váº«n tháº¥y outline Ä‘á»ƒ inspect DOM bá»‹ panel che.
- **`toggleHighlight()`** trong tab Audit lÃ  cÃ¡ch duy nháº¥t Ä‘á»ƒ clear / re-apply.
- **`ngOnDestroy`** clear toÃ n bá»™ marker Ä‘á»ƒ khÃ´ng leak.
- Outline:
  - Xanh `--sd-success` cho autoid unique.
  - Äá» `--sd-error` cho autoid duplicate.
  - Dashed cam `--sd-warning` cho element missing autoid (sd-* yÃªu cáº§u).
- Service backup `outline` + `backgroundColor` inline trÆ°á»›c khi apply â†’ restore chÃ­nh xÃ¡c khi clear.

## Examples

### 1. Báº­t á»Ÿ mÃ´i trÆ°á»ng dev (Angular module bootstrap)
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

### 3. Audit 1 region cá»¥ thá»ƒ + thÃªm selector custom
```html
<sd-autoid-inspector
  [enabled]="true"
  [config]="{ root: detailPanel.nativeElement, extraRequireSelectors: ['custom-input', 'app-rich-editor'] }">
</sd-autoid-inspector>
```

### 4. Headless audit (CI script â€” khÃ´ng dÃ¹ng component)
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

### 5. Sinh POM markdown tá»« ngoÃ i component
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
  /** sd-input Email â€” */
  readonly formsInputEmail = '//*[@data-autoid="forms-input-email"]';
  /** sd-button Submit â€” */
  readonly buttonSubmit = '//*[@data-autoid="button-submit"]';
}
```

### Markdown Reference table (group theo tableScope rá»“i tag)
```markdown
## Top-level

### sd-input
| name | autoid | xpath | state | duplicate |
|------|--------|-------|-------|-----------|
| Email | `forms-input-email` | `//*[@data-autoid="forms-input-email"]` | disabled=false; empty=true |  |

### sd-button
| name | autoid | xpath | state | duplicate |
|------|--------|-------|-------|-----------|
| Submit | `button-submit` | `//*[@data-autoid="button-submit"]` |  | âš ï¸ |

## Inside table `components-table-employees`

### sd-input
| name | autoid | xpath | state | duplicate |
|------|--------|-------|-------|-----------|
| Search | `table-input-search` | `//*[@data-autoid="table-input-search"]` | invalid=false |  |
```

## Styling
- DÃ¹ng **CSS custom properties** tá»« `@sdcorejs/angular` theme (`--sd-primary`, `--sd-primary-light/dark`, `--sd-info`, `--sd-success`, `--sd-warning`, `--sd-error` + `--sd-black100..500`).
- Override mÃ u sáº¯c báº±ng cÃ¡ch override CSS variable á»Ÿ `:root` hoáº·c theme parent â€” khÃ´ng cáº§n Ä‘á»¥ng SCSS.
- Fallback hex chá»‰ Ã¡p dá»¥ng khi consumer chÆ°a import `sd-core.scss`.

## Keyboard shortcuts
| Key | HÃ nh Ä‘á»™ng |
| --- | --- |
| `Esc` | ÄÃ³ng panel khi Ä‘ang má»Ÿ. |

## State display (Elements tab)

Má»—i row trong tab Elements cÃ³ cá»™t **State** hiá»ƒn thá»‹ cÃ¡c `data-*` runtime mÃ  component nguá»“n render (xem [`docs/E2E-ATTRIBUTES.md`](../../docs/E2E-ATTRIBUTES.md)). Chip chá»‰ render khi attribute thá»±c sá»± tá»“n táº¡i trÃªn DOM:

- `disabled=true|false` (Ä‘á» khi `true`)
- `loading=true|false` (cam khi `true`)
- `empty=true|false` (xanh info khi `true`)
- `invalid=true|false` (Ä‘á» khi `true`)
- `opened=true|false` (xanh info khi `true`)
- `count=<N>` (xanh info)
- Cá»™t **Text** Æ°u tiÃªn hiá»ƒn thá»‹ `data-value` Ä‘Ã£ serialize; fallback vá» `input.value` / `textContent` (field `text` trong model).

Element náº±m trong `<sd-table>` Ä‘Æ°á»£c tÃ¡ch thÃ nh section riÃªng `Inside <code>components-table-...</code>` Ä‘á»ƒ dá»… tra cá»©u trong báº£ng cÃ³ vÃ i chá»¥c autoid lá»“ng nhau.

## E2E test attributes

CÃ¹ng convention vá»›i cÃ¡c component khÃ¡c trong `@sdcorejs/angular` (xem [`projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md`](../../docs/E2E-ATTRIBUTES.md)). Inspector hiá»ƒn thá»‹ runtime state cá»§a cÃ¡c component KHÃC trÃªn trang â€” xem má»¥c **State display** á»Ÿ trÃªn. VÃ¬ Ä‘Ã¢y lÃ  devtool, cÃ¡c attribute trÃªn chÃ­nh inspector táº­p trung vÃ o **tráº¡ng thÃ¡i runtime cá»§a inspector** thay vÃ¬ `value/empty/invalid`.

### FAB button â€” `data-autoid="sd-autoid-inspector-fab"`

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `sd-autoid-inspector-fab` (static) | constant |
| `data-opened` | `"true"` / `"false"` | `open` signal |

> `dismissed`/`enabled=false` khÃ´ng cÃ³ attr riÃªng â€” toÃ n bá»™ FAB wrapper áº©n (`@if (enabled() && !dismissed())`), nÃªn QA nháº­n diá»‡n báº±ng viá»‡c element **váº¯ng máº·t** trong DOM.

### Panel section â€” `data-autoid="sd-autoid-inspector-panel"`

Element Ä‘Æ°á»£c render chá»‰ khi panel Ä‘ang má»Ÿ (`@if (enabled() && open())`).

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
// Má»Ÿ inspector vÃ  Ä‘á»£i panel xuáº¥t hiá»‡n
await page.locator('[data-autoid="sd-autoid-inspector-fab"]').click();
const panel = page.locator('[data-autoid="sd-autoid-inspector-panel"]');
await expect(panel).toBeVisible();

// Assert audit pass â€” 0 missing + 0 duplicate
await expect(panel).toHaveAttribute('data-missing-count', '0');
await expect(panel).toHaveAttribute('data-duplicate-count', '0');

// Switch tab via UI rá»“i kiá»ƒm tra
await panel.locator('button:has-text("Elements")').click();
await expect(panel).toHaveAttribute('data-segment', 'elements');
```

## Edge cases & guarantees
- Scan dÃ¹ng `document.querySelectorAll('[data-autoid]')` â€” Ä‘á»c-only, khÃ´ng mutate DOM (trá»« highlight cÃ³ backup/restore).
- `name` resolve theo thá»© tá»±: `label[for=id]` â†’ `aria-label` â†’ `placeholder` â†’ `title` â†’ `''`.
- `tag` láº¥y parent gáº§n nháº¥t cÃ³ prefix `sd-*` (vd `sd-input` cho `<input>` con); fallback `tagName.toLowerCase()`.
- `text` láº¥y `input.value` hoáº·c `textContent` cáº¯t á»Ÿ 80 kÃ½ tá»±.
- `missing` chá»‰ flag khi cáº£ element CHÃNH vÃ  má»i descendant Ä‘á»u thiáº¿u `data-autoid` â€” trÃ¡nh false-positive vá»›i `sd-button` render `<button data-autoid>` bÃªn trong.
- Highlight service idempotent â€” gá»i `apply()` láº§n 2 váº«n restore Ä‘Ãºng style gá»‘c khi `clear()`.
- `CSS.escape` Ä‘Æ°á»£c dÃ¹ng cho id cÃ³ kÃ½ tá»± Ä‘áº·c biá»‡t khi resolve label.

## Tests
- `autoid-scanner.service.spec.ts` â€” 14 case (resolveName / tag / value, duplicate, CSS.escape, groupByAutoid, + 4 new: readState, tableScope resolve, no-tableScope, self-is-table).
- `autoid-audit.service.spec.ts` â€” 7 case (duplicate, missing, descendant guard, custom requireSelectors, selector path, outerHtml preview).
- `autoid-highlight.service.spec.ts` â€” 6 case (apply unique / duplicate / missing, idempotent, clear restore, skip element Ä‘Ã£ marker).
- `autoid-export.service.spec.ts` â€” 11 case (JSON / CSV escape, POM skeleton, Reference table sort + duplicate flag, MD escape, clipboard fallback, + 3 new: toCsv state+tableScope, toMarkdownPom state summary, toMarkdownTable groupByScope).
- `autoid-inspector.component.spec.ts` â€” 19 case (FAB visibility, togglePanel, audit duplicate / missing, highlight ON/OFF, Esc, filter, copyJson, ngOnDestroy cleanup, E2E data-* attributes Ã—2, + 3 new: topLevelElements, tableGroups, state chip rendering).

Tá»•ng: 57 case xanh.

