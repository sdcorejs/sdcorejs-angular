# sd-splitter — Resizable Splitter Component

**Date:** 2026-05-16
**Status:** Spec — pending implementation
**Owner:** anh.hoang10@onemount.com

## 1. Mục tiêu

Tạo một component cho phép chia container thành nhiều vùng (panel) cố định, ngăn cách bởi divider có thể kéo (mouse / touch / keyboard) để thay đổi tỷ lệ. Hỗ trợ orientation ngang/dọc, nested splitter, mix panel pixel cố định với panel co dãn (flex), collapse/expand panel, và tùy chọn auto-persist layout vào `localStorage` qua `SdStorageService`.

Đây là component thuộc **Core UI** (`projects/sdcorejs-angular/components/`) — yêu cầu test coverage đầy đủ ở cả tầng unit và integration.

## 2. Phạm vi

**In scope**
- Splitter container `<sd-splitter>` với orientation `horizontal` / `vertical`
- Panel `<sd-splitter-panel>` với 2 đơn vị kích thước: `px` (cố định) và `flex` (weight, co dãn)
- Nested splitter (lồng splitter vào panel của splitter khác)
- Drag để resize (pointer events — bao trùm mouse, touch, pen)
- Snap-to-collapse khi kéo dưới ngưỡng
- Collapse/expand qua imperative API và double-click handle
- Keyboard accessibility (arrow keys, Home/End, Enter/Space)
- Disabled toàn splitter (`disabled`) và disable từng panel (`resizable=false`)
- Auto persist/restore layout vào `localStorage` qua `storageKey`
- Imperative API: `getLayout`, `setLayout`, `resetLayout`, `collapse`, `expand`, `toggle`, `resizePanel`
- CSS variables để theme

**Out of scope**
- Drag-and-drop panel rearrange (giống Golden Layout)
- Floating / detachable panel
- Panel tabbing bên trong splitter (đã có `sd-tab-router`)
- Storage type khác `localStorage` (không có `storageType` input)
- Save layout có debounce config (auto-save chỉ trigger ở `resizeEnd` + `collapsedChange`, không spam)

## 3. Public API

### `<sd-splitter>` (container)

**Inputs**

| Input | Type | Default | Mô tả |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Chiều chia |
| `disabled` | `boolean` | `false` | Khóa toàn bộ resize, handle không nhận pointer / keyboard |
| `storageKey` | `string \| undefined` | `undefined` | Có giá trị → auto save/restore layout vào `localStorage` qua `SdStorageService` |
| `snapThreshold` | `number` | `0.5` | Tỷ lệ với `minSize` để snap collapse. Kéo dưới `minSize × snapThreshold` → snap về collapsed (chỉ áp với panel `collapsible`) |
| `keyboardStep` | `number` | `10` | Px mỗi lần nhấn arrow key |

**Outputs**

| Output | Payload |
|---|---|
| `(resizeEnd)` | `SplitterLayoutState` — sizes sau khi user thả chuột |
| `(collapsedChange)` | `{ panelId: string \| number; collapsed: boolean }` |
| `(layoutChange)` | `SplitterLayoutState` — emit ở cả `resizeEnd` và mọi thay đổi collapse |

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

Mọi method nhận `target` đều support `number` (index) lẫn `string` (panelId). String → match qua `panelId` input của panel; không tìm thấy → throw.

### `<sd-splitter-panel>`

**Inputs**

| Input | Type | Default | Mô tả |
|---|---|---|---|
| `panelId` | `string \| undefined` | `undefined` | Id ổn định để target qua API và key trong storage. Không có thì fallback theo index trong template |
| `size` | `number` | `1` | Kích thước ban đầu. Với `unit="px"` = pixel, `unit="flex"` = weight |
| `unit` | `'px' \| 'flex'` | `'flex'` | Px = cố định bất kể container, flex = chia phần còn lại theo weight |
| `minSize` | `number` | `0` | Giới hạn min, cùng đơn vị với `size` |
| `maxSize` | `number \| undefined` | `undefined` | Giới hạn max, cùng đơn vị với `size` |
| `collapsible` | `boolean` | `false` | Cho phép panel collapse (qua snap, double-click, hoặc API) |
| `collapsed` | `boolean` | `false` | Trạng thái collapsed ban đầu, hỗ trợ two-way `[(collapsed)]` |
| `resizable` | `boolean` | `true` | False → divider kề panel này (cả trước lẫn sau) bị disable. Panel ở rìa chỉ có 1 divider kề |

**Outputs**

| Output | Payload |
|---|---|
| `(collapsedChange)` | `boolean` — cho two-way binding `[(collapsed)]` |

## 4. Cấu trúc file

```
projects/sdcorejs-angular/components/splitter/
├── index.ts                                          # re-export public API
└── src/
    ├── splitter.component.ts                         # <sd-splitter>
    ├── splitter.component.html
    ├── splitter.component.scss
    ├── splitter-panel/
    │   ├── splitter-panel.component.ts               # <sd-splitter-panel>
    │   ├── splitter-panel.component.html
    │   └── splitter-panel.component.scss
    ├── splitter-handle/
    │   ├── splitter-handle.component.ts              # internal — divider draggable + a11y
    │   ├── splitter-handle.component.html
    │   └── splitter-handle.component.scss
    ├── splitter.models.ts                            # interfaces + types
    └── splitter-state.service.ts                     # internal — state + storage I/O
```

**Trách nhiệm từng đơn vị:**

- **`SdSplitterComponent`** — container. Đọc `contentChildren(SdSplitterPanelComponent)` qua signal, render handles xen kẽ giữa các panel, emit events, expose imperative API. Provide `SplitterStateService` ở component-level (1 instance / splitter).
- **`SdSplitterPanelComponent`** — wrapper khai báo qua `<ng-content>`. Không tự render handle — handle do parent splitter render xen kẽ. Chứa metadata về `size`, `unit`, `minSize`, `maxSize`, `collapsible`, `panelId`, `resizable`, và signal `collapsed`. Áp style `flex-basis` / `flex-grow` lên host element dựa trên live state.
- **`SdSplitterHandleComponent`** — internal, không export ngoài index. Xử lý `pointerdown`/`pointermove`/`pointerup` (có `setPointerCapture`), keyboard arrow/Home/End/Enter/Space, double-click. Gọi callback lên `SplitterStateService` để update.
- **`SplitterStateService`** — internal, single source of truth. Quản 2 signal: `liveSizes` (update 60fps khi đang kéo, không persist) và `committedLayout` (update ở `resizeEnd` + `collapsedChange`, trigger persist). Logic thuần TypeScript, dễ test riêng.

**`index.ts` export:**
```ts
export * from './src/splitter.component';
export * from './src/splitter-panel/splitter-panel.component';
export * from './src/splitter.models';
```

Handle component và state service không export — internal.

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
- Thứ tự panel quan trọng — array preserve order tự nhiên
- Cho phép panel không có `panelId` (fallback index)
- `setLayout()` payload phẳng, dev không cần biết internals

## 6. Architecture — rendering engine

**Approach: CSS Flexbox.**

Container có `display: flex; flex-direction: row | column` tùy `orientation`. Mỗi panel là flex child:

- Panel `unit="flex"`: `flex: <weight> 1 0` — weight = `size`, chia phần còn lại sau khi trừ các panel px
- Panel `unit="px"`: `flex: 0 0 <size>px` — cố định
- Panel `collapsed=true`: `flex: 0 0 0; min-width: 0; min-height: 0` — co về 0 hoàn toàn

**Khi user kéo divider:**
1. Pointerdown → snapshot start position + sizes của 2 panel kề (prev + next)
2. Pointermove → tính delta px:
   - 2 panel `flex`: chia delta theo tỷ lệ container px size, update weight
   - 2 panel `px`: cộng/trừ delta trực tiếp lên cả 2
   - Mix px + flex: panel `px` cố định, delta dồn hết vào panel `flex`
3. Clamp theo `minSize` / `maxSize` của cả 2
4. Apply qua `style.flexBasis` trực tiếp lên panel host element (batched qua `requestAnimationFrame`) — không trigger Angular CD mỗi frame
5. Pointerup → release capture, commit state vào `committedLayout` signal → trigger `(resizeEnd)` + `(layoutChange)` + save storage

**Nested:** Splitter con đặt trong `<ng-content>` của 1 panel. Không cần special-case — flexbox tự lo, mỗi splitter có service instance riêng (provided ở component level).

## 7. Lifecycle với signal + effect (no `ngOnInit` / `ngAfterContentInit`)

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

  // Storage handle re-tạo khi storageKey đổi
  #storageHandle = computed(() => {
    const key = this.storageKey();
    return key ? this.#storage.create<SplitterLayoutState>(key) : null;
  });

  constructor() {
    // 1. Reconcile khi panels thay đổi (init, hoặc *ngIf trên panel)
    effect(() => {
      const panels = this.panels();
      const stored = this.#storageHandle()?.get();
      this.#state.reconcile(panels, stored);
    });

    // 2. Auto-save khi committedLayout đổi
    effect(() => {
      const layout = this.#state.committedLayout();
      this.#storageHandle()?.setSilent(layout);  // setSilent: không emit qua storage observer
    });
  }
}
```

**Key points:**
- `contentChildren()` là signal (Angular 17.2+). Effect tự re-run khi panel add/remove → reconcile tự động.
- 2 signal state tách biệt trong service:
  - `liveSizes` — update liên tục khi đang kéo, panel binding `flex-basis` đọc từ đây
  - `committedLayout` — set ở `resizeEnd` + `collapsedChange` → trigger effect save storage. **Không save khi đang drag** để tránh ghi storage 60fps.
- `storageHandle` là `computed` → đổi `storageKey` runtime tự nhiên (rare nhưng đúng).
- Không có `ngOnInit` / `ngAfterContentInit`.

## 8. Reconcile rule (template ↔ storage)

Khi load state cũ từ storage mà template đã thay đổi, policy theo thứ tự:

1. **Match theo `panelId`** — cả 2 bên đều có `panelId` → restore `size` + `collapsed`
2. **Match theo index** — cả 2 bên không có `panelId`, cùng vị trí → restore
3. **Không match** (panel mới hoặc storage stale) — dùng default từ template, bỏ qua storage entry
4. **`unit` lệch** — template đổi từ `flex` → `px` (hoặc ngược lại) → ưu tiên template, bỏ qua storage entry này (size không tương thích)

Mục đích: không crash vì storage stale, dev đổi template thoải mái.

## 9. Behavior details

### 9a. Drag mechanics
- Handle dùng `pointerdown` (bao trùm mouse + touch + pen), gọi `setPointerCapture` để giữ events khi pointer ra ngoài element
- Apply `flexBasis` trực tiếp lên host element, batched qua `requestAnimationFrame`, **không** trigger Angular CD trong khi kéo
- Trong khi kéo, container có class `sd-splitter--dragging` → disable transition + set `user-select: none`
- Pointerup / pointercancel → release capture, commit state, restore transition, remove class

### 9b. Snap-to-collapse
- Trong pointermove, nếu size của panel kề ≤ `minSize × snapThreshold` **và** panel có `collapsible="true"` → set `collapsed=true`, size về 0
- Kéo handle ra khỏi mép (delta dương vượt ngưỡng `minSize`) → set `collapsed=false`, restore về `minSize`
- Panel không `collapsible` chỉ hard-stop tại `minSize`, không snap

### 9c. Collapse / expand qua API + double-click
- Double-click handle → toggle panel kề. Quy tắc: ưu tiên panel `collapsible` ở phía prev, fallback next
- `collapse(id)` / `expand(id)` / `toggle(id)` → set state với animation transition `flex-basis 200ms ease`
- Expand restore về `lastSize` (lưu trong state lúc collapse); không có → `minSize`; không có nữa → 1 flex

### 9d. Keyboard a11y
- Handle: `tabindex="0"`, `role="separator"`, `aria-orientation`, `aria-valuenow` / `aria-valuemin` / `aria-valuemax`
- **Arrow keys** (← → cho horizontal, ↑ ↓ cho vertical): resize ±`keyboardStep` px (default 10)
- **Home** / **End**: collapse panel prev / next (nếu collapsible), else clamp về min/max
- **Enter** / **Space**: toggle collapse panel kề (như double-click)

### 9e. Disabled
- `[disabled]="true"` trên `<sd-splitter>` → tất cả handle `aria-disabled="true"`, `tabindex="-1"`, không attach pointer listeners
- `[resizable]="false"` trên `<sd-splitter-panel>` → 2 handle kề panel này (trước + sau) bị disabled riêng. Panel ở rìa thì chỉ 1 handle

### 9f. Nested splitter
- Splitter con là component riêng đặt trong `<ng-content>` của panel — không xử lý đặc biệt
- Storage: nested splitter cần `storageKey` riêng nếu muốn persist (không inherit từ parent)
- Event nested không bubble lên parent — parent chỉ biết panel của nó resize, không biết bên trong

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
  <div class="sd-splitter__panel" style="flex: 0 0 250px">…</div>
  <div class="sd-splitter__handle" role="separator"
       aria-orientation="vertical" tabindex="0">
    <div class="sd-splitter__handle-bar"></div>
  </div>
  <div class="sd-splitter__panel sd-splitter__panel--flex" style="flex: 2 1 0">…</div>
  <div class="sd-splitter__handle">…</div>
  <div class="sd-splitter__panel sd-splitter__panel--collapsed" style="flex: 0 0 0">…</div>
</div>
```

### Style rules
- Container: `display: flex`, direction theo orientation, `overflow: hidden`, fill 100% width/height
- Panel: `overflow: hidden`, transition `flex-basis` (disabled qua class khi đang drag)
- Handle: hit area rộng (`--sd-splitter-handle-hit-area`), bar visual hẹp hơn (`--sd-splitter-handle-size`), cursor `col-resize` / `row-resize` theo orientation
- Collapsed panel: `flex: 0 0 0; min-width: 0; min-height: 0`
- Drag state class `sd-splitter--dragging`: disable transition, `user-select: none`
- Disabled handle: opacity giảm, cursor `default`, không hover effect
- Focus visible: handle có outline rõ ràng khi focus qua Tab

## 11. Testing strategy

Đây là Core UI — yêu cầu test đầy đủ ở mọi nhánh logic, không chỉ happy path.

### Unit tests cho `SplitterStateService`
- `reconcile(panels, stored)`:
  - Match theo `panelId` đúng
  - Fallback theo index khi không có `panelId`
  - Skip stale entry (panel cũ trong storage không còn trong template)
  - Skip khi `unit` lệch
- `applyDelta(handleIndex, deltaPx)`:
  - Clamp theo `minSize` / `maxSize` cả 2 panel kề
  - Phân chia delta đúng cho 3 combo: flex-flex, px-px, flex-px / px-flex
- Snap logic: dưới `minSize × snapThreshold` + `collapsible=true` → collapsed; vượt threshold ra → expand về `minSize`
- `collapse(id)` / `expand(id)`: lưu + restore đúng `lastSize`
- `committedLayout` signal chỉ emit ở commit point, không emit trong khi drag

### Unit tests cho `SdSplitterHandleComponent`
- Pointer events: pointerdown → setPointerCapture, pointermove → callback delta đúng, pointerup → release
- Keyboard: arrow ±`keyboardStep`, Home/End collapse/clamp, Enter/Space toggle
- A11y attrs: `role`, `aria-orientation`, `aria-valuemin` / `valuemax` / `valuenow`
- Disabled: pointerdown không attach listeners, `tabindex="-1"`, `aria-disabled`
- Double-click → emit toggle

### Component tests cho `SdSplitterComponent`
- `contentChildren` signal đổi → effect reconcile chạy
- `storageKey` có → restore từ `SdStorageService` đúng state lúc init
- `storageKey` đổi runtime → swap storage handle (computed re-run)
- `storageKey` không có → không gọi storage
- Imperative API:
  - `getLayout` trả về state đúng
  - `setLayout` apply đúng, trigger `layoutChange`
  - `resetLayout` quay về sizes khai báo trong template
  - `collapse` / `expand` / `toggle` theo cả `number` và `string`
  - `resizePanel` clamp đúng min/max
- `disabled=true` → handle không nhận pointer; `resizable=false` panel → handle kề bị disable

### Integration tests (DOM)
- 2 panel flex 1:1 → handle ở giữa, mỗi panel 50% sau khi render
- Panel `unit="px" size="250"` + flex panel → panel px luôn 250px khi container resize
- Nested splitter: kéo handle parent không ảnh hưởng state nested splitter con
- Storage round-trip: kéo → re-instantiate component cùng `storageKey` → restore đúng vị trí
- Snap: kéo collapsible panel dưới threshold → `(collapsedChange)` emit true; kéo ra → emit false
- Disabled splitter → drag không di chuyển handle
- Keyboard arrow → resize step đúng + emit `resizeEnd` khi blur

### Test infra
- Pattern theo các component hiện có trong `projects/sdcorejs-angular/components/` — Jasmine + Angular TestBed
- Mock `SdStorageService` để assert `set`/`get` được gọi đúng `key` + payload format
- Helper `dispatchPointer(element, type, { clientX, clientY })` cho pointer events (JSDOM không native PointerEvent)

## 12. Open questions / sau này

- Cần config debounce save storage không? (hiện auto-save trigger ở `resizeEnd` + `collapsedChange` — không có spam, nên debounce có vẻ thừa)
- Cần API `onLayoutLoad` (callback lúc restore từ storage) không? — chưa thêm, có thể bổ sung sau khi có use case
- Touch device: hit area 8px có đủ không, hay cần biến thể `--sd-splitter-handle-hit-area-touch`? — verify trên thực tế
