�# sd-splitter � Resizable Splitter Component

**Date:** 2026-05-16
**Status:** Spec � pending implementation
**Owner:** anh.hoang10@onemount.com

## 1. Mục tiêu

Tạo m�"t component cho phép chia container thành nhiều vùng (panel) c� ��9nh, ngĒn cách b�xi divider có thỒ kéo (mouse / touch / keyboard) �Ồ thay ��"i tỷ l�!. H� trợ orientation ngang/dọc, nested splitter, mix panel pixel c� ��9nh v�:i panel co dãn (flex), collapse/expand panel, và tùy chọn auto-persist layout vào `localStorage` qua `SdStorageService`.

Đây là component thu�"c **Core UI** (`projects/sdcorejs-angular/components/`) � yêu cầu test coverage �ầy �ủ �x cả tầng unit và integration.

## 2. Phạm vi

**In scope**
- Splitter container `<sd-splitter>` v�:i orientation `horizontal` / `vertical`
- Panel `<sd-splitter-panel>` v�:i 2 �ơn v�9 kích thư�:c: `px` (c� ��9nh) và `flex` (weight, co dãn)
- Nested splitter (l�ng splitter vào panel của splitter khác)
- Drag �Ồ resize (pointer events � bao trùm mouse, touch, pen)
- Snap-to-collapse khi kéo dư�:i ngưỡng
- Collapse/expand qua imperative API và double-click handle
- Keyboard accessibility (arrow keys, Home/End, Enter/Space)
- Disabled toàn splitter (`disabled`) và disable từng panel (`resizable=false`)
- Auto persist/restore layout vào `localStorage` qua `storageKey`
- Imperative API: `getLayout`, `setLayout`, `resetLayout`, `collapse`, `expand`, `toggle`, `resizePanel`
- CSS variables �Ồ theme

**Out of scope**
- Drag-and-drop panel rearrange (gi�ng Golden Layout)
- Floating / detachable panel
- Panel tabbing bên trong splitter (�ã có `sd-tab-router`)
- Storage type khác `localStorage` (không có `storageType` input)
- Save layout có debounce config (auto-save ch�0 trigger �x `resizeEnd` + `collapsedChange`, không spam)

## 3. Public API

### `<sd-splitter>` (container)

**Inputs**

| Input | Type | Default | Mô tả |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Chiều chia |
| `disabled` | `boolean` | `false` | Khóa toàn b�" resize, handle không nhận pointer / keyboard |
| `storageKey` | `string \| undefined` | `undefined` | Có giá tr�9 �  auto save/restore layout vào `localStorage` qua `SdStorageService` |
| `snapThreshold` | `number` | `0.5` | Tỷ l�! v�:i `minSize` �Ồ snap collapse. Kéo dư�:i `minSize � snapThreshold` �  snap về collapsed (ch�0 áp v�:i panel `collapsible`) |
| `keyboardStep` | `number` | `10` | Px m�i lần nhấn arrow key |

**Outputs**

| Output | Payload |
|---|---|
| `(resizeEnd)` | `SplitterLayoutState` � sizes sau khi user thả chu�"t |
| `(collapsedChange)` | `{ panelId: string \| number; collapsed: boolean }` |
| `(layoutChange)` | `SplitterLayoutState` � emit �x cả `resizeEnd` và mọi thay ��"i collapse |

**Public methods**

```ts
getLayout(): SplitterLayoutState;
setLayout(state: SplitterLayoutState): void;
resetLayout(): void;                            // Reset về sizes khai báo trong template
collapse(target: number | string): void;        // index hoặc panelId
expand(target: number | string): void;
toggle(target: number | string): void;
resizePanel(target: number | string, size: number): void;
```

Mọi method nhận `target` �ều support `number` (index) lẫn `string` (panelId). String �  match qua `panelId` input của panel; không tìm thấy �  throw.

### `<sd-splitter-panel>`

**Inputs**

| Input | Type | Default | Mô tả |
|---|---|---|---|
| `panelId` | `string \| undefined` | `undefined` | Id �"n ��9nh �Ồ target qua API và key trong storage. Không có thì fallback theo index trong template |
| `size` | `number` | `1` | Kích thư�:c ban �ầu. V�:i `unit="px"` = pixel, `unit="flex"` = weight |
| `unit` | `'px' \| 'flex'` | `'flex'` | Px = c� ��9nh bất kỒ container, flex = chia phần còn lại theo weight |
| `minSize` | `number` | `0` | Gi�:i hạn min, cùng �ơn v�9 v�:i `size` |
| `maxSize` | `number \| undefined` | `undefined` | Gi�:i hạn max, cùng �ơn v�9 v�:i `size` |
| `collapsible` | `boolean` | `false` | Cho phép panel collapse (qua snap, double-click, hoặc API) |
| `collapsed` | `boolean` | `false` | Trạng thái collapsed ban �ầu, h� trợ two-way `[(collapsed)]` |
| `resizable` | `boolean` | `true` | False �  divider kề panel này (cả trư�:c lẫn sau) b�9 disable. Panel �x rìa ch�0 có 1 divider kề |

**Outputs**

| Output | Payload |
|---|---|
| `(collapsedChange)` | `boolean` � cho two-way binding `[(collapsed)]` |

## 4. Cấu trúc file

```
projects/sdcorejs-angular/components/splitter/
�S���� index.ts                                          # re-export public API
����� src/
    �S���� splitter.component.ts                         # <sd-splitter>
    �S���� splitter.component.html
    �S���� splitter.component.scss
    �S���� splitter-panel/
    �   �S���� splitter-panel.component.ts               # <sd-splitter-panel>
    �   �S���� splitter-panel.component.html
    �   ����� splitter-panel.component.scss
    �S���� splitter-handle/
    �   �S���� splitter-handle.component.ts              # internal � divider draggable + a11y
    �   �S���� splitter-handle.component.html
    �   ����� splitter-handle.component.scss
    �S���� splitter.models.ts                            # interfaces + types
    ����� splitter-state.service.ts                     # internal � state + storage I/O
```

**Trách nhi�!m từng �ơn v�9:**

- **`SdSplitterComponent`** � container. Đọc `contentChildren(SdSplitterPanelComponent)` qua signal, render handles xen kẽ giữa các panel, emit events, expose imperative API. Provide `SplitterStateService` �x component-level (1 instance / splitter).
- **`SdSplitterPanelComponent`** � wrapper khai báo qua `<ng-content>`. Không tự render handle � handle do parent splitter render xen kẽ. Chứa metadata về `size`, `unit`, `minSize`, `maxSize`, `collapsible`, `panelId`, `resizable`, và signal `collapsed`. Áp style `flex-basis` / `flex-grow` lên host element dựa trên live state.
- **`SdSplitterHandleComponent`** � internal, không export ngoài index. Xử lý `pointerdown`/`pointermove`/`pointerup` (có `setPointerCapture`), keyboard arrow/Home/End/Enter/Space, double-click. Gọi callback lên `SplitterStateService` �Ồ update.
- **`SplitterStateService`** � internal, single source of truth. Quản 2 signal: `liveSizes` (update 60fps khi �ang kéo, không persist) và `committedLayout` (update �x `resizeEnd` + `collapsedChange`, trigger persist). Logic thuần TypeScript, d�& test riêng.

**`index.ts` export:**
```ts
export * from './src/splitter.component';
export * from './src/splitter-panel/splitter-panel.component';
export * from './src/splitter.models';
```

Handle component và state service không export � internal.

## 5. Data shape

```ts
// splitter.models.ts

export type SplitterOrientation = 'horizontal' | 'vertical';
export type SplitterPanelUnit = 'px' | 'flex';

export interface SplitterPanelState {
  id: string | number;       // panelId nếu có, else index
  size: number;              // pixel hoặc flex weight, theo unit
  unit: SplitterPanelUnit;
  collapsed: boolean;
}

export interface SplitterLayoutState {
  v: 1;                      // schema version cho future migration
  panels: SplitterPanelState[];
}
```

Lý do dùng `panels: array` thay vì `Record<id, state>`:
- Thứ tự panel quan trọng � array preserve order tự nhiên
- Cho phép panel không có `panelId` (fallback index)
- `setLayout()` payload phẳng, dev không cần biết internals

## 6. Architecture � rendering engine

**Approach: CSS Flexbox.**

Container có `display: flex; flex-direction: row | column` tùy `orientation`. M�i panel là flex child:

- Panel `unit="flex"`: `flex: <weight> 1 0` � weight = `size`, chia phần còn lại sau khi trừ các panel px
- Panel `unit="px"`: `flex: 0 0 <size>px` � c� ��9nh
- Panel `collapsed=true`: `flex: 0 0 0; min-width: 0; min-height: 0` � co về 0 hoàn toàn

**Khi user kéo divider:**
1. Pointerdown �  snapshot start position + sizes của 2 panel kề (prev + next)
2. Pointermove �  tính delta px:
   - 2 panel `flex`: chia delta theo tỷ l�! container px size, update weight
   - 2 panel `px`: c�"ng/trừ delta trực tiếp lên cả 2
   - Mix px + flex: panel `px` c� ��9nh, delta d�n hết vào panel `flex`
3. Clamp theo `minSize` / `maxSize` của cả 2
4. Apply qua `style.flexBasis` trực tiếp lên panel host element (batched qua `requestAnimationFrame`) � không trigger Angular CD m�i frame
5. Pointerup �  release capture, commit state vào `committedLayout` signal �  trigger `(resizeEnd)` + `(layoutChange)` + save storage

**Nested:** Splitter con �ặt trong `<ng-content>` của 1 panel. Không cần special-case � flexbox tự lo, m�i splitter có service instance riêng (provided �x component level).

## 7. Lifecycle v�:i signal + effect (no `ngOnInit` / `ngAfterContentInit`)

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

  // Storage handle re-tạo khi storageKey ��"i
  #storageHandle = computed(() => {
    const key = this.storageKey();
    return key ? this.#storage.create<SplitterLayoutState>(key) : null;
  });

  constructor() {
    // 1. Reconcile khi panels thay ��"i (init, hoặc *ngIf trên panel)
    effect(() => {
      const panels = this.panels();
      const stored = this.#storageHandle()?.get();
      this.#state.reconcile(panels, stored);
    });

    // 2. Auto-save khi committedLayout ��"i
    effect(() => {
      const layout = this.#state.committedLayout();
      this.#storageHandle()?.setSilent(layout);  // setSilent: không emit qua storage observer
    });
  }
}
```

**Key points:**
- `contentChildren()` là signal (Angular 17.2+). Effect tự re-run khi panel add/remove �  reconcile tự ��"ng.
- 2 signal state tách bi�!t trong service:
  - `liveSizes` � update liên tục khi �ang kéo, panel binding `flex-basis` �ọc từ �ây
  - `committedLayout` � set �x `resizeEnd` + `collapsedChange` �  trigger effect save storage. **Không save khi �ang drag** �Ồ tránh ghi storage 60fps.
- `storageHandle` là `computed` �  ��"i `storageKey` runtime tự nhiên (rare nhưng �úng).
- Không có `ngOnInit` / `ngAfterContentInit`.

## 8. Reconcile rule (template �  storage)

Khi load state cũ từ storage mà template �ã thay ��"i, policy theo thứ tự:

1. **Match theo `panelId`** � cả 2 bên �ều có `panelId` �  restore `size` + `collapsed`
2. **Match theo index** � cả 2 bên không có `panelId`, cùng v�9 trí �  restore
3. **Không match** (panel m�:i hoặc storage stale) � dùng default từ template, bỏ qua storage entry
4. **`unit` l�!ch** � template ��"i từ `flex` �  `px` (hoặc ngược lại) �  ưu tiên template, bỏ qua storage entry này (size không tương thích)

Mục �ích: không crash vì storage stale, dev ��"i template thoải mái.

## 9. Behavior details

### 9a. Drag mechanics
- Handle dùng `pointerdown` (bao trùm mouse + touch + pen), gọi `setPointerCapture` �Ồ giữ events khi pointer ra ngoài element
- Apply `flexBasis` trực tiếp lên host element, batched qua `requestAnimationFrame`, **không** trigger Angular CD trong khi kéo
- Trong khi kéo, container có class `sd-splitter--dragging` �  disable transition + set `user-select: none`
- Pointerup / pointercancel �  release capture, commit state, restore transition, remove class

### 9b. Snap-to-collapse
- Trong pointermove, nếu size của panel kề �0� `minSize � snapThreshold` **và** panel có `collapsible="true"` �  set `collapsed=true`, size về 0
- Kéo handle ra khỏi mép (delta dương vượt ngưỡng `minSize`) �  set `collapsed=false`, restore về `minSize`
- Panel không `collapsible` ch�0 hard-stop tại `minSize`, không snap

### 9c. Collapse / expand qua API + double-click
- Double-click handle �  toggle panel kề. Quy tắc: ưu tiên panel `collapsible` �x phía prev, fallback next
- `collapse(id)` / `expand(id)` / `toggle(id)` �  set state v�:i animation transition `flex-basis 200ms ease`
- Expand restore về `lastSize` (lưu trong state lúc collapse); không có �  `minSize`; không có nữa �  1 flex

### 9d. Keyboard a11y
- Handle: `tabindex="0"`, `role="separator"`, `aria-orientation`, `aria-valuenow` / `aria-valuemin` / `aria-valuemax`
- **Arrow keys** (� � �  cho horizontal, �  �  cho vertical): resize ±`keyboardStep` px (default 10)
- **Home** / **End**: collapse panel prev / next (nếu collapsible), else clamp về min/max
- **Enter** / **Space**: toggle collapse panel kề (như double-click)

### 9e. Disabled
- `[disabled]="true"` trên `<sd-splitter>` �  tất cả handle `aria-disabled="true"`, `tabindex="-1"`, không attach pointer listeners
- `[resizable]="false"` trên `<sd-splitter-panel>` �  2 handle kề panel này (trư�:c + sau) b�9 disabled riêng. Panel �x rìa thì ch�0 1 handle

### 9f. Nested splitter
- Splitter con là component riêng �ặt trong `<ng-content>` của panel � không xử lý �ặc bi�!t
- Storage: nested splitter cần `storageKey` riêng nếu mu�n persist (không inherit từ parent)
- Event nested không bubble lên parent � parent ch�0 biết panel của nó resize, không biết bên trong

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

### DOM structure (tham khảo)
```html
<div class="sd-splitter sd-splitter--horizontal">
  <div class="sd-splitter__panel" style="flex: 0 0 250px">⬦</div>
  <div class="sd-splitter__handle" role="separator"
       aria-orientation="vertical" tabindex="0">
    <div class="sd-splitter__handle-bar"></div>
  </div>
  <div class="sd-splitter__panel sd-splitter__panel--flex" style="flex: 2 1 0">⬦</div>
  <div class="sd-splitter__handle">⬦</div>
  <div class="sd-splitter__panel sd-splitter__panel--collapsed" style="flex: 0 0 0">⬦</div>
</div>
```

### Style rules
- Container: `display: flex`, direction theo orientation, `overflow: hidden`, fill 100% width/height
- Panel: `overflow: hidden`, transition `flex-basis` (disabled qua class khi �ang drag)
- Handle: hit area r�"ng (`--sd-splitter-handle-hit-area`), bar visual hẹp hơn (`--sd-splitter-handle-size`), cursor `col-resize` / `row-resize` theo orientation
- Collapsed panel: `flex: 0 0 0; min-width: 0; min-height: 0`
- Drag state class `sd-splitter--dragging`: disable transition, `user-select: none`
- Disabled handle: opacity giảm, cursor `default`, không hover effect
- Focus visible: handle có outline rõ ràng khi focus qua Tab

## 11. Testing strategy

Đây là Core UI � yêu cầu test �ầy �ủ �x mọi nhánh logic, không ch�0 happy path.

### Unit tests cho `SplitterStateService`
- `reconcile(panels, stored)`:
  - Match theo `panelId` �úng
  - Fallback theo index khi không có `panelId`
  - Skip stale entry (panel cũ trong storage không còn trong template)
  - Skip khi `unit` l�!ch
- `applyDelta(handleIndex, deltaPx)`:
  - Clamp theo `minSize` / `maxSize` cả 2 panel kề
  - Phân chia delta �úng cho 3 combo: flex-flex, px-px, flex-px / px-flex
- Snap logic: dư�:i `minSize � snapThreshold` + `collapsible=true` �  collapsed; vượt threshold ra �  expand về `minSize`
- `collapse(id)` / `expand(id)`: lưu + restore �úng `lastSize`
- `committedLayout` signal ch�0 emit �x commit point, không emit trong khi drag

### Unit tests cho `SdSplitterHandleComponent`
- Pointer events: pointerdown �  setPointerCapture, pointermove �  callback delta �úng, pointerup �  release
- Keyboard: arrow ±`keyboardStep`, Home/End collapse/clamp, Enter/Space toggle
- A11y attrs: `role`, `aria-orientation`, `aria-valuemin` / `valuemax` / `valuenow`
- Disabled: pointerdown không attach listeners, `tabindex="-1"`, `aria-disabled`
- Double-click �  emit toggle

### Component tests cho `SdSplitterComponent`
- `contentChildren` signal ��"i �  effect reconcile chạy
- `storageKey` có �  restore từ `SdStorageService` �úng state lúc init
- `storageKey` ��"i runtime �  swap storage handle (computed re-run)
- `storageKey` không có �  không gọi storage
- Imperative API:
  - `getLayout` trả về state �úng
  - `setLayout` apply �úng, trigger `layoutChange`
  - `resetLayout` quay về sizes khai báo trong template
  - `collapse` / `expand` / `toggle` theo cả `number` và `string`
  - `resizePanel` clamp �úng min/max
- `disabled=true` �  handle không nhận pointer; `resizable=false` panel �  handle kề b�9 disable

### Integration tests (DOM)
- 2 panel flex 1:1 �  handle �x giữa, m�i panel 50% sau khi render
- Panel `unit="px" size="250"` + flex panel �  panel px luôn 250px khi container resize
- Nested splitter: kéo handle parent không ảnh hư�xng state nested splitter con
- Storage round-trip: kéo �  re-instantiate component cùng `storageKey` �  restore �úng v�9 trí
- Snap: kéo collapsible panel dư�:i threshold �  `(collapsedChange)` emit true; kéo ra �  emit false
- Disabled splitter �  drag không di chuyỒn handle
- Keyboard arrow �  resize step �úng + emit `resizeEnd` khi blur

### Test infra
- Pattern theo các component hi�!n có trong `projects/sdcorejs-angular/components/` � Jasmine + Angular TestBed
- Mock `SdStorageService` �Ồ assert `set`/`get` �ược gọi �úng `key` + payload format
- Helper `dispatchPointer(element, type, { clientX, clientY })` cho pointer events (JSDOM không native PointerEvent)

## 12. Open questions / sau này

- Cần config debounce save storage không? (hi�!n auto-save trigger �x `resizeEnd` + `collapsedChange` � không có spam, nên debounce có vẻ thừa)
- Cần API `onLayoutLoad` (callback lúc restore từ storage) không? � chưa thêm, có thỒ b�" sung sau khi có use case
- Touch device: hit area 8px có �ủ không, hay cần biến thỒ `--sd-splitter-handle-hit-area-touch`? � verify trên thực tế

