# sd-tab â€” Tab Group Component

**Date:** 2026-05-29
**Status:** Spec â€” pending implementation
**Owner:** anh.hoang10@onemount.com

## 1. Má»¥c tiÃªu

Cung cáº¥p cáº·p component `<sd-tab-group>` + `<sd-tab>` cho `@sdcorejs/angular` â€” wrapper khai bÃ¡o (declarative content projection) trÃªn `MatTabsModule` cá»§a Angular Material. Má»¥c tiÃªu lÃ  cho á»©ng dá»¥ng táº¡o tab UI thuáº§n (khÃ´ng gáº¯n route) vá»›i API gáº§n `mat-tab-group` nhÆ°ng Ä‘á»“ng nháº¥t convention `sd-*`: signals-first, OnPush, slot projection, `autoId`, i18n-báº±ng-string-thuáº§n.

ÄÃ¢y lÃ  component thuá»™c **Core UI** (`projects/sdcorejs-angular/components/tab/`) â€” yÃªu cáº§u test coverage Ä‘áº§y Ä‘á»§ (TDD: red â†’ green â†’ refactor).

`<sd-tab-router>` Ä‘Ã£ tá»“n táº¡i nhÆ°ng phá»¥c vá»¥ tab gáº¯n vá»›i Angular Router (má»—i tab = má»™t route). `<sd-tab-group>` phá»¥c vá»¥ trÆ°á»ng há»£p tab ná»™i bá»™ má»™t trang: chuyá»ƒn ná»™i dung trong cÃ¹ng route, khÃ´ng thao tÃ¡c URL.

## 2. Pháº¡m vi

**In scope**
- `<sd-tab-group>` container + `<sd-tab>` child khai bÃ¡o qua content projection
- Tab label string thuáº§n + icon prefix (Material icon name) + badge / count
- Disabled state per tab
- Two-way `[(selectedIndex)]` (index-based selection model)
- Lazy load: ná»™i dung tab chá»‰ render khi tab active láº§n Ä‘áº§u (matTabContent pattern)
- Closable tab: hiá»ƒn thá»‹ X icon, emit `(closed)` event per tab
- Forward cÃ¡c knob layout cá»§a `mat-tab-group` (giá»¯ default Material): `alignTabs`, `animationDuration`, `headerPosition`, `disableRipple`, `dynamicHeight`
- `autoId` input emit `data-autoId` cho e2e
- CSS variables Ä‘á»ƒ theme

**Out of scope (vÃ²ng 1)**
- Drag-and-drop reorder tabs (giá»‘ng editor tab)
- Add tab "+" button bÃªn cáº¡nh tab cuá»‘i (dynamic add)
- Scrollable tabs override (giá»¯ logic máº·c Ä‘á»‹nh cá»§a mat-tab-group khi tabs trÃ n)
- i18n key input â€” caller tá»± dá»‹ch trÆ°á»›c khi truyá»n vÃ o `[label]`
- Routing tÃ­ch há»£p â€” Ä‘Ã£ thuá»™c `<sd-tab-router>`
- Two-way báº±ng `selectedKey` / `selectedTab` reference (vÃ²ng 1 chá»‰ `selectedIndex`)
- Vertical tabs (mat-tab-nav-bar / mat-tab-nav-panel pattern); chá»‰ horizontal + `headerPosition`

## 3. Public API

### `<sd-tab-group>` (container)

**Selector:** `sd-tab-group`
**Class:** `SdTabGroup extends SdBaseSecureComponent`
**Standalone:** yes
**Change detection:** default (signals-driven)
**Import path:** `@sdcorejs/angular/components/tab`

**Inputs**

| Input | Type | Default | MÃ´ táº£ |
|---|---|---|---|
| `selectedIndex` | `number` (model â€” two-way) | `0` | Index tab Ä‘ang active. Two-way `[(selectedIndex)]`. Khi giÃ¡ trá»‹ vÆ°á»£t pháº¡m vi â†’ clamp vá» `0` |
| `headerPosition` | `'above' \| 'below'` | `'above'` | Forward `mat-tab-group.headerPosition` |
| `alignTabs` | `'start' \| 'center' \| 'end'` | `'start'` | Forward `mat-tab-group.alignTabs` |
| `animationDuration` | `string` | `'500ms'` | Forward `mat-tab-group.animationDuration` (Ä‘á»‹nh dáº¡ng CSS time) |
| `disableRipple` | `boolean` | `false` | Forward `mat-tab-group.disableRipple` |
| `dynamicHeight` | `boolean` | `false` | Forward `mat-tab-group.dynamicHeight` |
| `autoId` | `string \| undefined` | `undefined` | Emit `data-autoId` / `data-autoid` cho e2e |

**Outputs**

| Output | Payload | MÃ´ táº£ |
|---|---|---|
| `selectedIndexChange` | `number` | Emit khi user click tab khÃ¡c hoáº·c API set `selectedIndex` |
| `tabClosed` | `{ index: number; tab: SdTab }` | Emit khi user click nÃºt close trÃªn 1 tab `[closable]` |

**Public API (methods)**

```ts
selectTab(index: number): void;       // set selectedIndex + emit change
realignInkBar(): void;                 // forward mat-tab-group.realignInkBar() cho khi container resize thá»§ cÃ´ng
```

### `<sd-tab>` (child)

**Selector:** `sd-tab`
**Class:** `SdTab`
**Standalone:** yes
**Change detection:** OnPush

**Inputs**

| Input | Type | Default | MÃ´ táº£ |
|---|---|---|---|
| `label` | `string` (REQUIRED) | â€” | NhÃ£n tab. Caller tá»± dá»‹ch i18n trÆ°á»›c khi truyá»n |
| `icon` | `string \| null \| undefined` | `undefined` | Material icon name hiá»ƒn thá»‹ bÃªn trÃ¡i label |
| `badge` | `string \| number \| null \| undefined` | `undefined` | Badge hiá»ƒn thá»‹ bÃªn pháº£i label. Number `0` hiá»‡n ra, `null`/`undefined` áº©n |
| `disabled` | `boolean` | `false` | `booleanAttribute` transform. Disable tab â€” khÃ´ng click Ä‘Æ°á»£c, opacity giáº£m |
| `closable` | `boolean` | `false` | `booleanAttribute` transform. Hiá»ƒn thá»‹ nÃºt X bÃªn pháº£i label; click X emit `(close)` |

**Outputs**

| Output | Payload | MÃ´ táº£ |
|---|---|---|
| `close` | `void` | Emit khi user click nÃºt X trÃªn tab nÃ y (chá»‰ khi `closable=true`). Parent tá»± xá»­ lÃ½ remove tab khá»i data source náº¿u muá»‘n |

**Content projection**

| Slot | Má»¥c Ä‘Ã­ch |
|---|---|
| (default) | Ná»™i dung cá»§a tab. Wrap trong `<ng-template matTabContent>` Ä‘á»ƒ lazy render â€” chá»‰ táº¡o DOM khi tab Ä‘Æ°á»£c active láº§n Ä‘áº§u |

## 4. Cáº¥u trÃºc file

```
projects/sdcorejs-angular/components/tab/
â”œâ”€â”€ index.ts                              # re-export public API
â”œâ”€â”€ ng-package.json                       # secondary entry point
â”œâ”€â”€ sd-tab.md                             # doc (má»¥c 16)
â””â”€â”€ src/
    â”œâ”€â”€ tab-group.component.ts            # <sd-tab-group>
    â”œâ”€â”€ tab-group.component.html
    â”œâ”€â”€ tab-group.component.scss
    â”œâ”€â”€ tab-group.component.spec.ts
    â”œâ”€â”€ tab.component.ts                  # <sd-tab>
    â”œâ”€â”€ tab.component.html                # template label (icon + label + badge + close)
    â”œâ”€â”€ tab.component.scss
    â””â”€â”€ tab.component.spec.ts
```

**TrÃ¡ch nhiá»‡m:**

- **`SdTabGroup`** â€” render `<mat-tab-group>` shell, Ä‘á»c `contentChildren(SdTab)` Ä‘á»ƒ biáº¿t list tab. Vá»›i má»—i `SdTab`, render 1 `<mat-tab>` truyá»n `[disabled]` + label template + lazy content template. Forward `selectedIndex` two-way + cÃ¡c knob layout xuá»‘ng `mat-tab-group`. Render close button trong label template khi `tab.closable()` = true. Emit `tabClosed` khi user click X.
- **`SdTab`** â€” khÃ´ng tá»± render gÃ¬ hiá»ƒn thá»‹. LÃ  1 "config holder" chá»©a cÃ¡c signal input (`label`, `icon`, `badge`, `disabled`, `closable`) + `output close` + `ng-content` lÆ°u vÃ o `viewChild`/`contentChild` template ref Ä‘á»ƒ `SdTabGroup` Ä‘á»c qua `contentChildren`. Pattern nÃ y tÆ°Æ¡ng tá»± cÃ¡ch `<mat-tab>` hoáº¡t Ä‘á»™ng (khÃ´ng render trá»±c tiáº¿p â€” `mat-tab-group` Ä‘á»c list).

**`index.ts` export:**
```ts
export * from './src/tab-group.component';
export * from './src/tab.component';
```

**`ng-package.json`** giá»‘ng cÃ¡c component khÃ¡c â€” entry file `index.ts`.

## 5. Data shape

KhÃ´ng cÃ³ model interface phá»©c táº¡p â€” toÃ n bá»™ public surface lÃ  signal inputs/outputs. Type chia sáº»:

```ts
// trong tab-group.component.ts (export giÃ¡n tiáº¿p)
export interface SdTabClosedEvent {
  index: number;
  tab: SdTab;
}
```

## 6. Architecture â€” pattern tab-list discovery

Mat-tab-group native dÃ¹ng `@ContentChildren(MatTab)` Ä‘á»ƒ tá»± build list. Ta Ä‘i cÃ¹ng pattern nhÆ°ng vá»›i signal API:

```ts
@Component({
  selector: 'sd-tab-group',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, NgTemplateOutlet],
  templateUrl: './tab-group.component.html',
  // ...
})
export class SdTabGroup extends SdBaseSecureComponent {
  tabs = contentChildren(SdTab);             // signal â€” auto re-run khi @for thÃªm/bá»›t tab

  selectedIndex = model<number>(0);
  headerPosition = input<'above' | 'below'>('above');
  // ... cÃ¡c knob khÃ¡c

  tabClosed = output<SdTabClosedEvent>();

  protected onMatSelectedIndexChange(idx: number): void {
    this.selectedIndex.set(idx);
  }

  protected onClose(tab: SdTab, index: number): void {
    this.tabClosed.emit({ index, tab });
  }
}
```

Template:

```html
<mat-tab-group
  [(selectedIndex)]="selectedIndex"
  [headerPosition]="headerPosition()"
  [alignTabs]="alignTabs()"
  [animationDuration]="animationDuration()"
  [disableRipple]="disableRipple()"
  [dynamicHeight]="dynamicHeight()">
  @for (tab of tabs(); track tab; let i = $index) {
    <mat-tab [disabled]="tab.disabled()">
      <ng-template mat-tab-label>
        @if (tab.icon(); as ic) {
          <mat-icon class="mr-4">{{ ic }}</mat-icon>
        }
        <span>{{ tab.label() }}</span>
        @let _badge = tab.badge();
        @if (_badge !== null && _badge !== undefined) {
          <span class="sd-tab__badge">{{ _badge }}</span>
        }
        @if (tab.closable()) {
          <mat-icon
            class="sd-tab__close ml-4"
            (click)="$event.stopPropagation(); onClose(tab, i)">
            close
          </mat-icon>
        }
      </ng-template>

      <ng-template matTabContent>
        <ng-container [ngTemplateOutlet]="tab.bodyTpl()"></ng-container>
      </ng-template>
    </mat-tab>
  }
</mat-tab-group>
```

`SdTab` khai bÃ¡o body template:

```ts
@Component({
  selector: 'sd-tab',
  standalone: true,
  template: `<ng-template #body><ng-content></ng-content></ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTab {
  label = input.required<string>();
  icon = input<string | null | undefined>(undefined);
  badge = input<string | number | null | undefined>(undefined);
  disabled = input(false, { transform: booleanAttribute });
  closable = input(false, { transform: booleanAttribute });

  close = output<void>();

  bodyTpl = viewChild.required<TemplateRef<unknown>>('body');
}
```

**LÃ½ do dÃ¹ng `viewChild` + template ref:** mat-tab cáº§n truy cáº­p template, nhÆ°ng náº¿u projecting raw `<ng-content>` vÃ o `mat-tab` content slot, mat-tab sáº½ render ngay (khÃ´ng lazy). Pattern template ref + `matTabContent` + `ngTemplateOutlet` Ä‘áº£m báº£o lazy â€” Angular chá»‰ instantiate template khi mat-tab active láº§n Ä‘áº§u.

## 7. Lifecycle vá»›i signal + effect

- `contentChildren(SdTab)` lÃ  signal â€” `@for` template sáº½ tá»± re-run khi user `@if` thÃªm/bá»›t `<sd-tab>` runtime
- `selectedIndex` lÃ  `model<number>` â€” two-way binding xuÃ´i xuá»‘ng `mat-tab-group [(selectedIndex)]`; Angular tá»± sync
- Effect clamp: náº¿u `selectedIndex()` vÆ°á»£t `tabs().length - 1` â†’ set vá» `0`. Ãp dá»¥ng khi user remove tab cuá»‘i Ä‘ang active

```ts
constructor() {
  super();
  effect(() => {
    const len = this.tabs().length;
    const cur = this.selectedIndex();
    if (len > 0 && cur >= len) {
      this.selectedIndex.set(Math.max(0, len - 1));
    }
  });
}
```

KhÃ´ng dÃ¹ng `ngOnInit` / `ngAfterContentInit`.

## 8. Behavior details

### 8a. Selection
- Click tab â†’ `mat-tab-group` emit `selectedIndexChange` â†’ forward ra `selectedIndex` model
- API `selectTab(i)` â†’ set `selectedIndex` (clamp 0..len-1)
- Click tab `disabled` â†’ mat-tab-group block, khÃ´ng emit change
- Click X close button â†’ `$event.stopPropagation()` Ä‘á»ƒ khÃ´ng trigger tab select rá»“i emit `tabClosed`

### 8b. Lazy content
- `<ng-template matTabContent>` + `ngTemplateOutlet`: tab content chá»‰ táº¡o DOM khi tab Ä‘Æ°á»£c active **láº§n Ä‘áº§u**. Sau Ä‘Ã³ giá»¯ trong DOM (default mat-tab behavior, trÃ¡nh re-mount má»—i láº§n switch)
- Side-effect: ngOnInit cá»§a child component trong tab chá»‰ cháº¡y láº§n Ä‘áº§u user má»Ÿ tab Ä‘Ã³

### 8c. Disabled
- `<sd-tab disabled>` â†’ mat-tab disabled, ripple/click bá»‹ cháº·n, opacity giáº£m (mat default styling)

### 8d. Closable
- `closable=true` â†’ render `<mat-icon>close</mat-icon>` bÃªn pháº£i label, cursor pointer
- Click X: stop propagation (khÃ´ng select tab), emit `(close)` trÃªn `SdTab` + emit `tabClosed` trÃªn `SdTabGroup`
- Component **khÃ´ng tá»± remove tab khá»i DOM** â€” parent tá»± xá»­ lÃ½ `*ngIf` / state Ä‘á»ƒ remove. LÃ½ do: parent quáº£n state tháº­t cá»§a tab list, Ä‘áº·c biá»‡t khi tabs render tá»« array dynamic

### 8e. Badge
- `badge=5` â†’ render span `sd-tab__badge` chá»©a text "5"
- `badge=null` / `undefined` â†’ khÃ´ng render
- `badge=0` â†’ váº«n render (sá»‘ 0 cÃ³ Ã½ nghÄ©a há»£p lá»‡). Náº¿u caller muá»‘n áº©n 0 â†’ tá»± convert sang `null`

### 8f. Icon
- `icon="info"` â†’ render `<mat-icon>info</mat-icon>` bÃªn trÃ¡i label
- DÃ¹ng Material icons font (Material Icons hoáº·c Material Symbols, theo cáº¥u hÃ¬nh project)

### 8g. Bounds clamp
- Effect á»Ÿ má»¥c 7 clamp `selectedIndex` khi `tabs().length` giáº£m
- KhÃ´ng emit `selectedIndexChange` thá»§ cÃ´ng â€” `model.set()` tá»± lo

## 9. Styling

### CSS variables (Ä‘áº·t trÃªn `.sd-tab-group`)
```scss
.sd-tab-group {
  --sd-tab-label-color: var(--sd-text-primary, #1a1a1a);
  --sd-tab-label-active-color: var(--sd-color-primary);
  --sd-tab-indicator-color: var(--sd-color-primary);
  --sd-tab-disabled-opacity: 0.5;
  --sd-tab-badge-bg: var(--sd-color-primary-light, #e8f0ff);
  --sd-tab-badge-color: var(--sd-color-primary);
  --sd-tab-badge-radius: 10px;
  --sd-tab-badge-padding: 0 6px;
  --sd-tab-badge-min-width: 18px;
  --sd-tab-close-color: var(--sd-text-secondary);
  --sd-tab-close-hover-color: var(--sd-color-error);
}
```

### DOM structure (tham kháº£o)
```html
<sd-tab-group class="sd-tab-group" data-autoId="userTabs">
  <mat-tab-group>
    <mat-tab>
      <ng-template mat-tab-label>
        <mat-icon class="mr-4">info</mat-icon>
        <span>ThÃ´ng tin</span>
        <span class="sd-tab__badge">3</span>
        <mat-icon class="sd-tab__close ml-4">close</mat-icon>
      </ng-template>
      â€¦
    </mat-tab>
  </mat-tab-group>
</sd-tab-group>
```

### Style rules
- Label container `display: inline-flex; align-items: center; gap: 4px` â€” icon + label + badge + close align hÃ ng ngang
- `.sd-tab__badge`: min-width `--sd-tab-badge-min-width`, height 18px, line-height 18px, font-size 11px, font-weight 500, bo trÃ²n `--sd-tab-badge-radius`, background/color theo CSS vars
- `.sd-tab__close`: font-size 16px, opacity 0.6, hover â†’ opacity 1 + `--sd-tab-close-hover-color`, cursor pointer
- Disabled tab: opacity `--sd-tab-disabled-opacity`, pointer-events: none (mat-tab-group Ä‘Ã£ set sáºµn)
- Active tab indicator: forward mat-tab native bar; override color qua `::ng-deep .mat-mdc-tab .mdc-tab-indicator__content--underline { border-color: var(--sd-tab-indicator-color); }` náº¿u mat default lá»‡ch theme

## 10. Testing strategy (TDD)

YÃªu cáº§u test á»Ÿ 3 cáº¥p:

### 10a. `SdTab` unit tests (`tab.component.spec.ts`)
- `label` required â†’ omit throw NG0950
- `icon`, `badge`, `disabled`, `closable` default Ä‘Ãºng
- `badge=0` khÃ´ng bá»‹ coi lÃ  falsy (test render path)
- `disabled` boolean attribute coerce: `disabled`, `disabled="true"`, `[disabled]="false"`
- `close` output emit khi gá»i tay (qua test host)
- `bodyTpl` viewChild lookup ra `TemplateRef`

### 10b. `SdTabGroup` unit tests (`tab-group.component.spec.ts` â€” pháº§n logic)
- `tabs` signal cáº­p nháº­t khi `@for` add/remove
- Default `selectedIndex = 0`
- Click tab N â†’ `selectedIndex` set thÃ nh N, emit `selectedIndexChange`
- API `selectTab(2)` set Ä‘Ãºng + clamp khi out of range
- `selectTab(-1)` â†’ clamp vá» 0
- `selectTab(99)` â†’ clamp vá» `tabs().length - 1`
- Effect clamp khi tab cuá»‘i active bá»‹ remove
- `onClose(tab, i)` emit `tabClosed` vá»›i payload `{ index: i, tab }`
- Forward inputs: `headerPosition`, `alignTabs`, `animationDuration`, `disableRipple`, `dynamicHeight` set Ä‘Ãºng trÃªn `mat-tab-group` instance

### 10c. `SdTabGroup` integration tests (`tab-group.component.spec.ts` â€” pháº§n DOM)
- Render 3 tab vá»›i label "A" / "B" / "C" â†’ 3 mat-tab-label Ä‘Ãºng text
- Tab cÃ³ `icon="info"` â†’ render `<mat-icon>info</mat-icon>` trong label
- Tab cÃ³ `badge=5` â†’ render span `.sd-tab__badge` chá»©a "5"
- Tab `badge=0` â†’ váº«n render "0"
- Tab `badge=null` â†’ khÃ´ng cÃ³ `.sd-tab__badge`
- Tab `disabled` â†’ mat-tab cÃ³ `mat-mdc-tab-disabled` class, click khÃ´ng Ä‘á»•i `selectedIndex`
- Tab `closable` â†’ render `.sd-tab__close`; click â†’ `tabClosed` emit + `selectedIndexChange` KHÃ”NG emit (stopPropagation)
- Lazy content: tab 2 chÆ°a Ä‘Æ°á»£c active â†’ DOM body tab 2 chÆ°a tá»“n táº¡i; click tab 2 â†’ DOM xuáº¥t hiá»‡n
- `selectedIndex` two-way: set tá»« parent â†’ mat-tab-group active Ä‘Ãºng tab; click tab â†’ parent variable cáº­p nháº­t
- Bounds clamp: 3 tabs, `selectedIndex=2`, parent remove tab cuá»‘i â†’ `selectedIndex` clamp vá» 1
- `autoId="userTabs"` â†’ host element cÃ³ `data-autoId="userTabs"`

### Test infra
- Pattern theo cÃ¡c spec hiá»‡n cÃ³ trong `projects/sdcorejs-angular/components/section/section.component.spec.ts` (Jasmine + Angular TestBed, ChromeHeadless)
- Test host component khai bÃ¡o `<sd-tab-group>` + `<sd-tab>` vá»›i input bindings + @ViewChild ref Ä‘á»ƒ gá»i imperative API
- Cháº¡y: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/tab/**/*.spec.ts'`

## 11. Demo page

ThÃªm `projects/demo/src/app/pages/sd-tab/sd-tab-demo.component.ts` + route, theo máº«u `sd-section.component.ts`. Demo bao phá»§:

1. Tab Ä‘Æ¡n giáº£n â€” 3 tab text-only
2. Tab cÃ³ icon + badge + disabled
3. Tab closable â€” parent xá»­ lÃ½ remove (array `signal<string[]>` + splice trong handler)
4. Lazy content â€” tab 2/3 chá»©a component "heavy" log `console.log('mounted')` Ä‘á»ƒ chá»©ng minh mount trá»…
5. Two-way `[(selectedIndex)]` vá»›i 2 control button "Prev" / "Next" + display index
6. Layout knobs â€” `headerPosition='below'`, `alignTabs='center'`, `animationDuration='0ms'`

## 12. Doc (`sd-tab.md`)

Theo template `sd-section.md`. Sections:
- Selector, import path, class, standalone, change detection
- One-line purpose
- When to use / NOT to use (link `<sd-tab-router>` cho route-driven case)
- Inputs / Outputs / Public API tables
- Content projection slot
- Visual cues
- Behaviors / quirks (lazy load, closable khÃ´ng tá»± remove, bounds clamp, badge=0)
- Examples (láº¥y tá»« demo page)
- Anti-patterns

## 13. Risks & mitigations

- **Risk:** lazy content + `ngTemplateOutlet` khÃ´ng tá»± destroy khi tab bá»‹ remove â†’ memory leak.
  **Mitigation:** mat-tab-group native Ä‘Ã£ handle (destroy view trong `mat-tab` destroy hook); ta chá»‰ forward template, khÃ´ng láº¥n quyá»n lifecycle.

- **Risk:** override mÃ u indicator qua `::ng-deep` cÃ³ thá»ƒ vá»¡ khi Angular Material 19 Ä‘á»•i class name.
  **Mitigation:** pin class hiá»‡n táº¡i trong `tab-group.component.scss`, kÃ¨m `// why:` comment chá»‰ rÃµ phiÃªn báº£n mat Ä‘ang dá»±a vÃ o; náº¿u break á»Ÿ major bump, sá»­a trong 1 chá»—.

- **Risk:** caller render `@for` over array dynamic; identity tab thay Ä‘á»•i giá»¯a cÃ¡c tick (no track key) â†’ `contentChildren` máº¥t á»•n Ä‘á»‹nh.
  **Mitigation:** doc báº¯t buá»™c dÃ¹ng `track tab.id` hoáº·c `track $index` á»Ÿ phÃ­a caller; demo gÆ°Æ¡ng máº«u.

- **Risk:** `closable=true` + parent quÃªn xá»­ lÃ½ â†’ click X khÃ´ng cÃ³ hiá»‡u á»©ng visible.
  **Mitigation:** doc nÃªu rÃµ "component khÃ´ng tá»± remove"; demo show pattern remove qua signal array.

- **Risk:** click vÃ¹ng X trÃªn tab disabled váº«n emit `(close)` máº·c dÃ¹ tab khÃ´ng tÆ°Æ¡ng tÃ¡c Ä‘Æ°á»£c.
  **Mitigation:** trong template, gate `(click)` báº±ng `!tab.disabled()`; test cover case nÃ y.

## 14. Out of scope (deferred)

- **Vertical tabs / tab-nav-bar** â€” defer Ä‘áº¿n khi cÃ³ yÃªu cáº§u cá»¥ thá»ƒ tá»« má»™t consumer
- **Add "+" button** â€” defer Ä‘áº¿n khi cÃ³ editor-like use case
- **Drag reorder** â€” defer Ä‘áº¿n khi tab list dÃ i + cáº§n reorder thÆ°á»ng xuyÃªn
- **i18n key input** â€” defer; náº¿u nhiá»u caller phÃ n nÃ n boilerplate `i18n.t()`, sáº½ thÃªm `[i18nKey]` optional á»Ÿ v2
- **`selectedKey` / `selectedTab` ref two-way** â€” defer Ä‘áº¿n khi cÃ³ use case index khÃ´ng á»•n Ä‘á»‹nh
- **Scrollable header tÃ¹y biáº¿n** (chevron tay) â€” defer; mat default Ä‘Ã£ cÃ³ pagination khi overflow

## 15. Acceptance criteria

Spec coi nhÆ° Ä‘áº¡t khi:

1. âœ… Build `npm run build` xanh (typecheck + ng-packagr) â€” entry má»›i á»Ÿ `@sdcorejs/angular/components/tab` xuáº¥t báº£n OK
2. âœ… Táº¥t cáº£ test trong `projects/sdcorejs-angular/components/tab/src/*.spec.ts` xanh á»Ÿ `ChromeHeadless`
3. âœ… Demo page `/sd-tab` má»Ÿ Ä‘Æ°á»£c, 6 scenario á»Ÿ má»¥c 11 hiá»ƒn thá»‹ Ä‘Ãºng visual
4. âœ… Two-way `[(selectedIndex)]` hoáº¡t Ä‘á»™ng cáº£ chiá»u xuÃ´i vÃ  ngÆ°á»£c
5. âœ… Lazy content xÃ¡c nháº­n qua `console.log('mounted')` chá»‰ in khi tab tÆ°Æ¡ng á»©ng Ä‘Æ°á»£c active láº§n Ä‘áº§u
6. âœ… Closable tab: click X â†’ `tabClosed` emit + `selectedIndexChange` khÃ´ng emit; parent splice array â†’ tab biáº¿n máº¥t, `selectedIndex` clamp tá»± Ä‘á»™ng
7. âœ… Disabled tab: click khÃ´ng Ä‘á»•i `selectedIndex`; náº¿u disabled tab cÅ©ng `closable`, click X khÃ´ng emit `(close)`
8. âœ… Bounds clamp: remove tab cuá»‘i Ä‘ang active â†’ `selectedIndex` lÃ¹i vá» index há»£p lá»‡, khÃ´ng lá»—i runtime
9. âœ… `autoId="x"` â†’ host cÃ³ `data-autoId="x"` (e2e selector)
10. âœ… `sd-tab.md` khá»›p hoÃ n toÃ n vá»›i public API hiá»‡n táº¡i (má»i input/output/method cÃ³ trong code Ä‘á»u cÃ³ trong doc, vÃ  ngÆ°á»£c láº¡i)

## 16. Open questions (giáº£i quyáº¿t trÆ°á»›c plan)

- CÃ³ cáº§n expose `(animationDone)` tá»« mat-tab-group ra ngoÃ i khÃ´ng? â€” hiá»‡n khÃ´ng, defer
- Tab cÃ³ cáº§n `[selected]` input riÃªng (true/false) thay vÃ¬ chá»‰ index? â€” hiá»‡n khÃ´ng, defer (sáº½ kÃ©o theo bÃ i toÃ¡n "2 tab cÃ¹ng selected"); chá»‘t API chá»‰ qua `selectedIndex`
- CÃ³ project `<sd-badge>` component thay vÃ¬ span thÃ´ cho badge khÃ´ng? â€” chá»‘t span thÃ´ vÃ¬ nháº¹ vÃ  badge á»Ÿ Ä‘Ã¢y chá»‰ lÃ  count/text 1 dÃ²ng, khÃ´ng cáº§n variant color cá»§a `<sd-badge>`. CÃ³ thá»ƒ Ä‘á»•i sau.

