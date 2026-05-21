# sd-splitter â€” Resizable Splitter Component

**Date:** 2026-05-16
**Status:** Spec â€” pending implementation
**Owner:** anh.hoang10@onemount.com

## 1. Má»¥c tiÃªu

Táº¡o má»™t component cho phÃ©p chia container thÃ nh nhiá»u vÃ¹ng (panel) cá»‘ Ä‘á»‹nh, ngÄƒn cÃ¡ch bá»Ÿi divider cÃ³ thá»ƒ kÃ©o (mouse / touch / keyboard) Ä‘á»ƒ thay Ä‘á»•i tá»· lá»‡. Há»— trá»£ orientation ngang/dá»c, nested splitter, mix panel pixel cá»‘ Ä‘á»‹nh vá»›i panel co dÃ£n (flex), collapse/expand panel, vÃ  tÃ¹y chá»n auto-persist layout vÃ o `localStorage` qua `SdStorageService`.

ÄÃ¢y lÃ  component thuá»™c **Core UI** (`projects/sdcorejs-angular/components/`) â€” yÃªu cáº§u test coverage Ä‘áº§y Ä‘á»§ á»Ÿ cáº£ táº§ng unit vÃ  integration.

## 2. Pháº¡m vi

**In scope**
- Splitter container `<sd-splitter>` vá»›i orientation `horizontal` / `vertical`
- Panel `<sd-splitter-panel>` vá»›i 2 Ä‘Æ¡n vá»‹ kÃ­ch thÆ°á»›c: `px` (cá»‘ Ä‘á»‹nh) vÃ  `flex` (weight, co dÃ£n)
- Nested splitter (lá»“ng splitter vÃ o panel cá»§a splitter khÃ¡c)
- Drag Ä‘á»ƒ resize (pointer events â€” bao trÃ¹m mouse, touch, pen)
- Snap-to-collapse khi kÃ©o dÆ°á»›i ngÆ°á»¡ng
- Collapse/expand qua imperative API vÃ  double-click handle
- Keyboard accessibility (arrow keys, Home/End, Enter/Space)
- Disabled toÃ n splitter (`disabled`) vÃ  disable tá»«ng panel (`resizable=false`)
- Auto persist/restore layout vÃ o `localStorage` qua `storageKey`
- Imperative API: `getLayout`, `setLayout`, `resetLayout`, `collapse`, `expand`, `toggle`, `resizePanel`
- CSS variables Ä‘á»ƒ theme

**Out of scope**
- Drag-and-drop panel rearrange (giá»‘ng Golden Layout)
- Floating / detachable panel
- Panel tabbing bÃªn trong splitter (Ä‘Ã£ cÃ³ `sd-tab-router`)
- Storage type khÃ¡c `localStorage` (khÃ´ng cÃ³ `storageType` input)
- Save layout cÃ³ debounce config (auto-save chá»‰ trigger á»Ÿ `resizeEnd` + `collapsedChange`, khÃ´ng spam)

## 3. Public API

### `<sd-splitter>` (container)

**Inputs**

| Input | Type | Default | MÃ´ táº£ |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Chiá»u chia |
| `disabled` | `boolean` | `false` | KhÃ³a toÃ n bá»™ resize, handle khÃ´ng nháº­n pointer / keyboard |
| `storageKey` | `string \| undefined` | `undefined` | CÃ³ giÃ¡ trá»‹ â†’ auto save/restore layout vÃ o `localStorage` qua `SdStorageService` |
| `snapThreshold` | `number` | `0.5` | Tá»· lá»‡ vá»›i `minSize` Ä‘á»ƒ snap collapse. KÃ©o dÆ°á»›i `minSize Ã— snapThreshold` â†’ snap vá» collapsed (chá»‰ Ã¡p vá»›i panel `collapsible`) |
| `keyboardStep` | `number` | `10` | Px má»—i láº§n nháº¥n arrow key |

**Outputs**

| Output | Payload |
|---|---|
| `(resizeEnd)` | `SplitterLayoutState` â€” sizes sau khi user tháº£ chuá»™t |
| `(collapsedChange)` | `{ panelId: string \| number; collapsed: boolean }` |
| `(layoutChange)` | `SplitterLayoutState` â€” emit á»Ÿ cáº£ `resizeEnd` vÃ  má»i thay Ä‘á»•i collapse |

**Public methods**

```ts
getLayout(): SplitterLayoutState;
setLayout(state: SplitterLayoutState): void;
resetLayout(): void;                            // Reset vá» sizes khai bÃ¡o trong template
collapse(target: number | string): void;        // index hoáº·c panelId
expand(target: number | string): void;
toggle(target: number | string): void;
resizePanel(target: number | string, size: number): void;
```

Má»i method nháº­n `target` Ä‘á»u support `number` (index) láº«n `string` (panelId). String â†’ match qua `panelId` input cá»§a panel; khÃ´ng tÃ¬m tháº¥y â†’ throw.

### `<sd-splitter-panel>`

**Inputs**

| Input | Type | Default | MÃ´ táº£ |
|---|---|---|---|
| `panelId` | `string \| undefined` | `undefined` | Id á»•n Ä‘á»‹nh Ä‘á»ƒ target qua API vÃ  key trong storage. KhÃ´ng cÃ³ thÃ¬ fallback theo index trong template |
| `size` | `number` | `1` | KÃ­ch thÆ°á»›c ban Ä‘áº§u. Vá»›i `unit="px"` = pixel, `unit="flex"` = weight |
| `unit` | `'px' \| 'flex'` | `'flex'` | Px = cá»‘ Ä‘á»‹nh báº¥t ká»ƒ container, flex = chia pháº§n cÃ²n láº¡i theo weight |
| `minSize` | `number` | `0` | Giá»›i háº¡n min, cÃ¹ng Ä‘Æ¡n vá»‹ vá»›i `size` |
| `maxSize` | `number \| undefined` | `undefined` | Giá»›i háº¡n max, cÃ¹ng Ä‘Æ¡n vá»‹ vá»›i `size` |
| `collapsible` | `boolean` | `false` | Cho phÃ©p panel collapse (qua snap, double-click, hoáº·c API) |
| `collapsed` | `boolean` | `false` | Tráº¡ng thÃ¡i collapsed ban Ä‘áº§u, há»— trá»£ two-way `[(collapsed)]` |
| `resizable` | `boolean` | `true` | False â†’ divider ká» panel nÃ y (cáº£ trÆ°á»›c láº«n sau) bá»‹ disable. Panel á»Ÿ rÃ¬a chá»‰ cÃ³ 1 divider ká» |

**Outputs**

| Output | Payload |
|---|---|
| `(collapsedChange)` | `boolean` â€” cho two-way binding `[(collapsed)]` |

## 4. Cáº¥u trÃºc file

```
projects/sdcorejs-angular/components/splitter/
â”œâ”€â”€ index.ts                                          # re-export public API
â””â”€â”€ src/
    â”œâ”€â”€ splitter.component.ts                         # <sd-splitter>
    â”œâ”€â”€ splitter.component.html
    â”œâ”€â”€ splitter.component.scss
    â”œâ”€â”€ splitter-panel/
    â”‚   â”œâ”€â”€ splitter-panel.component.ts               # <sd-splitter-panel>
    â”‚   â”œâ”€â”€ splitter-panel.component.html
    â”‚   â””â”€â”€ splitter-panel.component.scss
    â”œâ”€â”€ splitter-handle/
    â”‚   â”œâ”€â”€ splitter-handle.component.ts              # internal â€” divider draggable + a11y
    â”‚   â”œâ”€â”€ splitter-handle.component.html
    â”‚   â””â”€â”€ splitter-handle.component.scss
    â”œâ”€â”€ splitter.models.ts                            # interfaces + types
    â””â”€â”€ splitter-state.service.ts                     # internal â€” state + storage I/O
```

**TrÃ¡ch nhiá»‡m tá»«ng Ä‘Æ¡n vá»‹:**

- **`SdSplitterComponent`** â€” container. Äá»c `contentChildren(SdSplitterPanelComponent)` qua signal, render handles xen káº½ giá»¯a cÃ¡c panel, emit events, expose imperative API. Provide `SplitterStateService` á»Ÿ component-level (1 instance / splitter).
- **`SdSplitterPanelComponent`** â€” wrapper khai bÃ¡o qua `<ng-content>`. KhÃ´ng tá»± render handle â€” handle do parent splitter render xen káº½. Chá»©a metadata vá» `size`, `unit`, `minSize`, `maxSize`, `collapsible`, `panelId`, `resizable`, vÃ  signal `collapsed`. Ãp style `flex-basis` / `flex-grow` lÃªn host element dá»±a trÃªn live state.
- **`SdSplitterHandleComponent`** â€” internal, khÃ´ng export ngoÃ i index. Xá»­ lÃ½ `pointerdown`/`pointermove`/`pointerup` (cÃ³ `setPointerCapture`), keyboard arrow/Home/End/Enter/Space, double-click. Gá»i callback lÃªn `SplitterStateService` Ä‘á»ƒ update.
- **`SplitterStateService`** â€” internal, single source of truth. Quáº£n 2 signal: `liveSizes` (update 60fps khi Ä‘ang kÃ©o, khÃ´ng persist) vÃ  `committedLayout` (update á»Ÿ `resizeEnd` + `collapsedChange`, trigger persist). Logic thuáº§n TypeScript, dá»… test riÃªng.

**`index.ts` export:**
```ts
export * from './src/splitter.component';
export * from './src/splitter-panel/splitter-panel.component';
export * from './src/splitter.models';
```

Handle component vÃ  state service khÃ´ng export â€” internal.

## 5. Data shape

```ts
// splitter.models.ts

export type SplitterOrientation = 'horizontal' | 'vertical';
export type SplitterPanelUnit = 'px' | 'flex';

export interface SplitterPanelState {
  id: string | number;       // panelId náº¿u cÃ³, else index
  size: number;              // pixel hoáº·c flex weight, theo unit
  unit: SplitterPanelUnit;
  collapsed: boolean;
}

export interface SplitterLayoutState {
  v: 1;                      // schema version cho future migration
  panels: SplitterPanelState[];
}
```

LÃ½ do dÃ¹ng `panels: array` thay vÃ¬ `Record<id, state>`:
- Thá»© tá»± panel quan trá»ng â€” array preserve order tá»± nhiÃªn
- Cho phÃ©p panel khÃ´ng cÃ³ `panelId` (fallback index)
- `setLayout()` payload pháº³ng, dev khÃ´ng cáº§n biáº¿t internals

## 6. Architecture â€” rendering engine

**Approach: CSS Flexbox.**

Container cÃ³ `display: flex; flex-direction: row | column` tÃ¹y `orientation`. Má»—i panel lÃ  flex child:

- Panel `unit="flex"`: `flex: <weight> 1 0` â€” weight = `size`, chia pháº§n cÃ²n láº¡i sau khi trá»« cÃ¡c panel px
- Panel `unit="px"`: `flex: 0 0 <size>px` â€” cá»‘ Ä‘á»‹nh
- Panel `collapsed=true`: `flex: 0 0 0; min-width: 0; min-height: 0` â€” co vá» 0 hoÃ n toÃ n

**Khi user kÃ©o divider:**
1. Pointerdown â†’ snapshot start position + sizes cá»§a 2 panel ká» (prev + next)
2. Pointermove â†’ tÃ­nh delta px:
   - 2 panel `flex`: chia delta theo tá»· lá»‡ container px size, update weight
   - 2 panel `px`: cá»™ng/trá»« delta trá»±c tiáº¿p lÃªn cáº£ 2
   - Mix px + flex: panel `px` cá»‘ Ä‘á»‹nh, delta dá»“n háº¿t vÃ o panel `flex`
3. Clamp theo `minSize` / `maxSize` cá»§a cáº£ 2
4. Apply qua `style.flexBasis` trá»±c tiáº¿p lÃªn panel host element (batched qua `requestAnimationFrame`) â€” khÃ´ng trigger Angular CD má»—i frame
5. Pointerup â†’ release capture, commit state vÃ o `committedLayout` signal â†’ trigger `(resizeEnd)` + `(layoutChange)` + save storage

**Nested:** Splitter con Ä‘áº·t trong `<ng-content>` cá»§a 1 panel. KhÃ´ng cáº§n special-case â€” flexbox tá»± lo, má»—i splitter cÃ³ service instance riÃªng (provided á»Ÿ component level).

## 7. Lifecycle vá»›i signal + effect (no `ngOnInit` / `ngAfterContentInit`)

```ts
@Component({
  selector: 'sd-splitter',
  standalone: true,
  providers: [SplitterStateService],         // instance per splitter
  ...
})
export class SdSplitterComponent {
  panels = contentChildren(SdSplitterPanelComponent);
  storageKey = input<string | undefined>();
  orientation = input<SplitterOrientation>('horizontal');
  disabled = input(false);

  #storage = inject(SdStorageService);
  #state = inject(SplitterStateService);

  // Storage handle re-táº¡o khi storageKey Ä‘á»•i
  #storageHandle = computed(() => {
    const key = this.storageKey();
    return key ? this.#storage.create<SplitterLayoutState>(key) : null;
  });

  constructor() {
    // 1. Reconcile khi panels thay Ä‘á»•i (init, hoáº·c *ngIf trÃªn panel)
    effect(() => {
      const panels = this.panels();
      const stored = this.#storageHandle()?.get();
      this.#state.reconcile(panels, stored);
    });

    // 2. Auto-save khi committedLayout Ä‘á»•i
    effect(() => {
      const layout = this.#state.committedLayout();
      this.#storageHandle()?.setSilent(layout);  // setSilent: khÃ´ng emit qua storage observer
    });
  }
}
```

**Key points:**
- `contentChildren()` lÃ  signal (Angular 17.2+). Effect tá»± re-run khi panel add/remove â†’ reconcile tá»± Ä‘á»™ng.
- 2 signal state tÃ¡ch biá»‡t trong service:
  - `liveSizes` â€” update liÃªn tá»¥c khi Ä‘ang kÃ©o, panel binding `flex-basis` Ä‘á»c tá»« Ä‘Ã¢y
  - `committedLayout` â€” set á»Ÿ `resizeEnd` + `collapsedChange` â†’ trigger effect save storage. **KhÃ´ng save khi Ä‘ang drag** Ä‘á»ƒ trÃ¡nh ghi storage 60fps.
- `storageHandle` lÃ  `computed` â†’ Ä‘á»•i `storageKey` runtime tá»± nhiÃªn (rare nhÆ°ng Ä‘Ãºng).
- KhÃ´ng cÃ³ `ngOnInit` / `ngAfterContentInit`.

## 8. Reconcile rule (template â†” storage)

Khi load state cÅ© tá»« storage mÃ  template Ä‘Ã£ thay Ä‘á»•i, policy theo thá»© tá»±:

1. **Match theo `panelId`** â€” cáº£ 2 bÃªn Ä‘á»u cÃ³ `panelId` â†’ restore `size` + `collapsed`
2. **Match theo index** â€” cáº£ 2 bÃªn khÃ´ng cÃ³ `panelId`, cÃ¹ng vá»‹ trÃ­ â†’ restore
3. **KhÃ´ng match** (panel má»›i hoáº·c storage stale) â€” dÃ¹ng default tá»« template, bá» qua storage entry
4. **`unit` lá»‡ch** â€” template Ä‘á»•i tá»« `flex` â†’ `px` (hoáº·c ngÆ°á»£c láº¡i) â†’ Æ°u tiÃªn template, bá» qua storage entry nÃ y (size khÃ´ng tÆ°Æ¡ng thÃ­ch)

Má»¥c Ä‘Ã­ch: khÃ´ng crash vÃ¬ storage stale, dev Ä‘á»•i template thoáº£i mÃ¡i.

## 9. Behavior details

### 9a. Drag mechanics
- Handle dÃ¹ng `pointerdown` (bao trÃ¹m mouse + touch + pen), gá»i `setPointerCapture` Ä‘á»ƒ giá»¯ events khi pointer ra ngoÃ i element
- Apply `flexBasis` trá»±c tiáº¿p lÃªn host element, batched qua `requestAnimationFrame`, **khÃ´ng** trigger Angular CD trong khi kÃ©o
- Trong khi kÃ©o, container cÃ³ class `sd-splitter--dragging` â†’ disable transition + set `user-select: none`
- Pointerup / pointercancel â†’ release capture, commit state, restore transition, remove class

### 9b. Snap-to-collapse
- Trong pointermove, náº¿u size cá»§a panel ká» â‰¤ `minSize Ã— snapThreshold` **vÃ ** panel cÃ³ `collapsible="true"` â†’ set `collapsed=true`, size vá» 0
- KÃ©o handle ra khá»i mÃ©p (delta dÆ°Æ¡ng vÆ°á»£t ngÆ°á»¡ng `minSize`) â†’ set `collapsed=false`, restore vá» `minSize`
- Panel khÃ´ng `collapsible` chá»‰ hard-stop táº¡i `minSize`, khÃ´ng snap

### 9c. Collapse / expand qua API + double-click
- Double-click handle â†’ toggle panel ká». Quy táº¯c: Æ°u tiÃªn panel `collapsible` á»Ÿ phÃ­a prev, fallback next
- `collapse(id)` / `expand(id)` / `toggle(id)` â†’ set state vá»›i animation transition `flex-basis 200ms ease`
- Expand restore vá» `lastSize` (lÆ°u trong state lÃºc collapse); khÃ´ng cÃ³ â†’ `minSize`; khÃ´ng cÃ³ ná»¯a â†’ 1 flex

### 9d. Keyboard a11y
- Handle: `tabindex="0"`, `role="separator"`, `aria-orientation`, `aria-valuenow` / `aria-valuemin` / `aria-valuemax`
- **Arrow keys** (â† â†’ cho horizontal, â†‘ â†“ cho vertical): resize Â±`keyboardStep` px (default 10)
- **Home** / **End**: collapse panel prev / next (náº¿u collapsible), else clamp vá» min/max
- **Enter** / **Space**: toggle collapse panel ká» (nhÆ° double-click)

### 9e. Disabled
- `[disabled]="true"` trÃªn `<sd-splitter>` â†’ táº¥t cáº£ handle `aria-disabled="true"`, `tabindex="-1"`, khÃ´ng attach pointer listeners
- `[resizable]="false"` trÃªn `<sd-splitter-panel>` â†’ 2 handle ká» panel nÃ y (trÆ°á»›c + sau) bá»‹ disabled riÃªng. Panel á»Ÿ rÃ¬a thÃ¬ chá»‰ 1 handle

### 9f. Nested splitter
- Splitter con lÃ  component riÃªng Ä‘áº·t trong `<ng-content>` cá»§a panel â€” khÃ´ng xá»­ lÃ½ Ä‘áº·c biá»‡t
- Storage: nested splitter cáº§n `storageKey` riÃªng náº¿u muá»‘n persist (khÃ´ng inherit tá»« parent)
- Event nested khÃ´ng bubble lÃªn parent â€” parent chá»‰ biáº¿t panel cá»§a nÃ³ resize, khÃ´ng biáº¿t bÃªn trong

## 10. Styling

### CSS variables
```scss
.sd-splitter {
  --sd-splitter-handle-size: 4px;
  --sd-splitter-handle-color: var(--sd-color-primary-light);
  --sd-splitter-handle-hover-color: var(--sd-color-primary);
  --sd-splitter-handle-active-color: var(--sd-color-primary);
  --sd-splitter-handle-hit-area: 8px;
  --sd-splitter-handle-radius: 0;
  --sd-splitter-transition-duration: 200ms;
  --sd-splitter-disabled-opacity: 0.5;
}
```

### DOM structure (tham kháº£o)
```html
<div class="sd-splitter sd-splitter--horizontal">
  <div class="sd-splitter__panel" style="flex: 0 0 250px">â€¦</div>
  <div class="sd-splitter__handle" role="separator"
       aria-orientation="vertical" tabindex="0">
    <div class="sd-splitter__handle-bar"></div>
  </div>
  <div class="sd-splitter__panel sd-splitter__panel--flex" style="flex: 2 1 0">â€¦</div>
  <div class="sd-splitter__handle">â€¦</div>
  <div class="sd-splitter__panel sd-splitter__panel--collapsed" style="flex: 0 0 0">â€¦</div>
</div>
```

### Style rules
- Container: `display: flex`, direction theo orientation, `overflow: hidden`, fill 100% width/height
- Panel: `overflow: hidden`, transition `flex-basis` (disabled qua class khi Ä‘ang drag)
- Handle: hit area rá»™ng (`--sd-splitter-handle-hit-area`), bar visual háº¹p hÆ¡n (`--sd-splitter-handle-size`), cursor `col-resize` / `row-resize` theo orientation
- Collapsed panel: `flex: 0 0 0; min-width: 0; min-height: 0`
- Drag state class `sd-splitter--dragging`: disable transition, `user-select: none`
- Disabled handle: opacity giáº£m, cursor `default`, khÃ´ng hover effect
- Focus visible: handle cÃ³ outline rÃµ rÃ ng khi focus qua Tab

## 11. Testing strategy

ÄÃ¢y lÃ  Core UI â€” yÃªu cáº§u test Ä‘áº§y Ä‘á»§ á»Ÿ má»i nhÃ¡nh logic, khÃ´ng chá»‰ happy path.

### Unit tests cho `SplitterStateService`
- `reconcile(panels, stored)`:
  - Match theo `panelId` Ä‘Ãºng
  - Fallback theo index khi khÃ´ng cÃ³ `panelId`
  - Skip stale entry (panel cÅ© trong storage khÃ´ng cÃ²n trong template)
  - Skip khi `unit` lá»‡ch
- `applyDelta(handleIndex, deltaPx)`:
  - Clamp theo `minSize` / `maxSize` cáº£ 2 panel ká»
  - PhÃ¢n chia delta Ä‘Ãºng cho 3 combo: flex-flex, px-px, flex-px / px-flex
- Snap logic: dÆ°á»›i `minSize Ã— snapThreshold` + `collapsible=true` â†’ collapsed; vÆ°á»£t threshold ra â†’ expand vá» `minSize`
- `collapse(id)` / `expand(id)`: lÆ°u + restore Ä‘Ãºng `lastSize`
- `committedLayout` signal chá»‰ emit á»Ÿ commit point, khÃ´ng emit trong khi drag

### Unit tests cho `SdSplitterHandleComponent`
- Pointer events: pointerdown â†’ setPointerCapture, pointermove â†’ callback delta Ä‘Ãºng, pointerup â†’ release
- Keyboard: arrow Â±`keyboardStep`, Home/End collapse/clamp, Enter/Space toggle
- A11y attrs: `role`, `aria-orientation`, `aria-valuemin` / `valuemax` / `valuenow`
- Disabled: pointerdown khÃ´ng attach listeners, `tabindex="-1"`, `aria-disabled`
- Double-click â†’ emit toggle

### Component tests cho `SdSplitterComponent`
- `contentChildren` signal Ä‘á»•i â†’ effect reconcile cháº¡y
- `storageKey` cÃ³ â†’ restore tá»« `SdStorageService` Ä‘Ãºng state lÃºc init
- `storageKey` Ä‘á»•i runtime â†’ swap storage handle (computed re-run)
- `storageKey` khÃ´ng cÃ³ â†’ khÃ´ng gá»i storage
- Imperative API:
  - `getLayout` tráº£ vá» state Ä‘Ãºng
  - `setLayout` apply Ä‘Ãºng, trigger `layoutChange`
  - `resetLayout` quay vá» sizes khai bÃ¡o trong template
  - `collapse` / `expand` / `toggle` theo cáº£ `number` vÃ  `string`
  - `resizePanel` clamp Ä‘Ãºng min/max
- `disabled=true` â†’ handle khÃ´ng nháº­n pointer; `resizable=false` panel â†’ handle ká» bá»‹ disable

### Integration tests (DOM)
- 2 panel flex 1:1 â†’ handle á»Ÿ giá»¯a, má»—i panel 50% sau khi render
- Panel `unit="px" size="250"` + flex panel â†’ panel px luÃ´n 250px khi container resize
- Nested splitter: kÃ©o handle parent khÃ´ng áº£nh hÆ°á»Ÿng state nested splitter con
- Storage round-trip: kÃ©o â†’ re-instantiate component cÃ¹ng `storageKey` â†’ restore Ä‘Ãºng vá»‹ trÃ­
- Snap: kÃ©o collapsible panel dÆ°á»›i threshold â†’ `(collapsedChange)` emit true; kÃ©o ra â†’ emit false
- Disabled splitter â†’ drag khÃ´ng di chuyá»ƒn handle
- Keyboard arrow â†’ resize step Ä‘Ãºng + emit `resizeEnd` khi blur

### Test infra
- Pattern theo cÃ¡c component hiá»‡n cÃ³ trong `projects/sdcorejs-angular/components/` â€” Jasmine + Angular TestBed
- Mock `SdStorageService` Ä‘á»ƒ assert `set`/`get` Ä‘Æ°á»£c gá»i Ä‘Ãºng `key` + payload format
- Helper `dispatchPointer(element, type, { clientX, clientY })` cho pointer events (JSDOM khÃ´ng native PointerEvent)

## 12. Open questions / sau nÃ y

- Cáº§n config debounce save storage khÃ´ng? (hiá»‡n auto-save trigger á»Ÿ `resizeEnd` + `collapsedChange` â€” khÃ´ng cÃ³ spam, nÃªn debounce cÃ³ váº» thá»«a)
- Cáº§n API `onLayoutLoad` (callback lÃºc restore tá»« storage) khÃ´ng? â€” chÆ°a thÃªm, cÃ³ thá»ƒ bá»• sung sau khi cÃ³ use case
- Touch device: hit area 8px cÃ³ Ä‘á»§ khÃ´ng, hay cáº§n biáº¿n thá»ƒ `--sd-splitter-handle-hit-area-touch`? â€” verify trÃªn thá»±c táº¿

