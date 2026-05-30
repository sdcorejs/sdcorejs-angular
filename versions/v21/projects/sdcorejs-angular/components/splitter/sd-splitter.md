# `<sd-splitter>` & `<sd-splitter-panel>`

**Type**: Component (two related components, documented together â€” used as a pair)
**Selectors**: `sd-splitter`, `sd-splitter-panel`
**Import path**: `@sdcorejs/angular/components/splitter`
**Classes**: `SdSplitterComponent`, `SdSplitterPanelComponent`
**Standalone**: yes
**Change detection**: Default (Angular default) on both â€” state is signal-driven via the internal `SplitterStateService`

---

## `<sd-splitter>`

### One-line purpose
Resizable split-pane container â€” divides its area horizontally or vertically into N draggable `<sd-splitter-panel>` regions with optional collapse, min/max size, keyboard accessibility, and persistent layout via `SdStorageService`.

### When to use
- Two-pane "list + detail" layouts where the user wants to widen one side
- IDE / editor surfaces (sidebar + main + inspector) that benefit from a drag-resizable rail
- Dashboard cards where the user picks how much room each region occupies
- Vertical stacks (header / body / footer) where the body should be flex and the chrome fixed-px
- Any layout that previously hard-coded `width: 280px` for a sidebar and the user keeps asking to make it adjustable

### When NOT to use
- For switching between mutually exclusive views â€” use `<sd-tab-group>` or `<sd-tab-router>`
- For a static fixed-width sidebar that never resizes â€” plain CSS flex/grid is lighter
- For modal-style overlays â€” use a dialog / drawer
- For collapsible "sections of a form" without a draggable handle â€” use `<sd-section>` or `<sd-collapse>`
- For tree/explorer rows that expand inline â€” splitter is about layout regions, not row hierarchy

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `SplitterOrientation` (`'horizontal' \| 'vertical'`) | `'horizontal'` | `'horizontal'` = panels arranged left-to-right with vertical drag handles; `'vertical'` = panels stacked top-to-bottom with horizontal drag handles. Drives host class `sd-splitter--horizontal` / `sd-splitter--vertical` and the handle's `aria-orientation`. |
| `disabled` | `boolean` | `false` | `booleanAttribute` transform. Disables ALL handles (drag + keyboard + dbl-click toggle). Adds host class `sd-splitter--disabled`. Per-panel `[resizable]="false"` disables only the surrounding handles. |
| `storageKey` | `string \| undefined` | `undefined` | When set, layout is persisted via `SdStorageService.create<SplitterLayoutState>(key)`. Auto-restore on init, auto-save on commit (drag-end / keyboard / API call). Use stable keys per layout (e.g. `'orders-list.splitter'`). |
| `snapThreshold` | `number` | `0.5` | `numberAttribute` transform. Fraction of a collapsible panel's `minSize` below which a drag snaps it to collapsed. `0` disables snap; `1` snaps as soon as the user crosses min. |
| `keyboardStep` | `number` | `10` | `numberAttribute` transform. Pixels moved per Arrow key press when a handle is focused. Each key press is one commit (start â†’ move â†’ end), so it also triggers `(resizeEnd)`. |

### Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `resizeEnd` | `SplitterLayoutState` | Fires once at the end of a drag / keyboard step â€” the FINAL committed layout (after clamp + snap). Prefer this over `layoutChange` for "save to backend" side-effects. |
| `layoutChange` | `SplitterLayoutState` | Fires on every commit (drag-end, keyboard step, programmatic API call). Suppressed during live drag â€” only emits on commit. Use for in-memory layout mirroring. |
| `collapsedChange` | `{ panelId: string \| number; collapsed: boolean }` | Emitted only when a panel's collapsed flag actually flips (diff against previous map). Fires for snap-collapse, double-click toggle, Enter/Space on focused handle, and imperative `collapse()` / `expand()` / `toggle()`. |

### Public API (imperative â€” call via `viewChild`)
| Method | Signature | Notes |
| --- | --- | --- |
| `getLayout()` | `() => SplitterLayoutState` | Read current layout snapshot (live sizes + collapsed flags). |
| `setLayout(state)` | `(SplitterLayoutState) => void` | Restore a previously saved layout. Per-panel unit must match the current declaration â€” mismatches are silently skipped (one panel at a time). |
| `resetLayout()` | `() => void` | Reset every panel to its declared `[size]` and `collapsed=false`. |
| `collapse(target)` | `(number \| string) => void` | Collapse the panel by `panelId` (string) or index (number). Throws if target not found. No-op if the panel is not `[collapsible]`. |
| `expand(target)` | `(number \| string) => void` | Expand a collapsed panel; restores its previous `lastSize` (fallback chain: `lastSize` â†’ `minSize` â†’ `declaredSize`). |
| `toggle(target)` | `(number \| string) => void` | Flip collapsed state. Convenience over `collapse` / `expand`. |
| `resizePanel(target, size)` | `(number \| string, number) => void` | Programmatically resize a panel; clamps to `[minSize, maxSize]`. `size` is in the panel's declared unit (px for `'px'`, weight for `'flex'`). |

### Content projection (slots)
| Slot | Purpose |
| --- | --- |
| `<sd-splitter-panel>` (default) | 2+ `<sd-splitter-panel>` children. Discovered via `contentChildren(SdSplitterPanelComponent)`. The splitter inserts `<sd-splitter-handle>` between each pair imperatively after render â€” do NOT place handles in the template yourself. |

The handle component (`<sd-splitter-handle>`) is internal and NOT exported from `@sdcorejs/angular/components/splitter`. It is created via `createComponent()` and re-arranged into the DOM as `panel0 â†’ handle0 â†’ panel1 â†’ handle1 â†’ â€¦ â†’ panelN`.

### Visual cues (helps agent map screenshots â†’ component)
- A container `display: flex` (row when `horizontal`, column when `vertical`) with `overflow: hidden`
- A thin draggable bar (handle) between each pair of panels â€” cursor switches to `col-resize` / `row-resize` on hover (unless disabled)
- During drag: host gets `.sd-splitter--dragging` â†’ disables `user-select` + panel transitions (jitter-free drag)
- A collapsed panel renders at `flex: 0 0 0` (zero size); its content is still in the DOM but visually hidden
- Each handle is focusable (`tabindex="0"`, `role="separator"`, `aria-orientation`, `aria-valuemin/max/now`) â€” keyboard users can resize via Arrow keys and collapse via Enter/Space

### Behaviors / quirks
- **Flex normalization**: when multiple panels declare `unit="flex"`, their `[size]` values are treated as weights and normalized so `Î£ grow = 1`. Declaring `[size]="0.7"` on a single flex panel still fills the remaining space (not 70% of container).
- **Snap-to-collapse**: dragging a `[collapsible]` panel below `minSize Ã— snapThreshold` snaps it to `collapsed=true` (size=0). Drag back out past `minSize` to expand.
- **Double-click handle**: toggles the nearest collapsible panel (`prev` first, then `next`). No-op if neither neighbor is collapsible.
- **Keyboard Enter/Space on focused handle**: same as double-click (toggle nearest collapsible).
- **Persistence requires `panelId`**: `storageKey` restore matches by `[panelId]` first, falling back to index ONLY when the panel has no `panelId` set. Without `panelId`, reordering panels in the template will mis-restore sizes.
- **Unit mismatch during restore**: if a stored panel's `unit` doesn't match the current declaration, that panel is skipped (the rest still restore). Useful when migrating a layout â€” bump the unit and the old saved state is ignored.
- **`<sd-splitter-handle>` is auto-managed**: do not place it in your template; the container creates / destroys / re-orders handles via `createComponent()` + `appendChild()` after each render.

### Examples

#### 1. Horizontal 2-pane sidebar + content (flex weights)
```html
<div style="height: 480px;">
  <sd-splitter orientation="horizontal">
    <sd-splitter-panel [size]="1" unit="flex">
      <div class="sidebar">Sidebar (weight 1)</div>
    </sd-splitter-panel>
    <sd-splitter-panel [size]="3" unit="flex">
      <div class="main">Ná»™i dung chÃ­nh (weight 3)</div>
    </sd-splitter-panel>
  </sd-splitter>
</div>
```

#### 2. Vertical 3-pane with fixed-px header & footer, flex body
```html
<div style="height: 100vh;">
  <sd-splitter orientation="vertical">
    <sd-splitter-panel [size]="64" unit="px">
      <header>Header â€” 64px cá»‘ Ä‘á»‹nh</header>
    </sd-splitter-panel>
    <sd-splitter-panel [size]="1" unit="flex">
      <main>Ná»™i dung â€” flex 1 (chiáº¿m toÃ n bá»™ khÃ´ng gian cÃ²n láº¡i)</main>
    </sd-splitter-panel>
    <sd-splitter-panel [size]="100" unit="px">
      <footer>Footer â€” 100px</footer>
    </sd-splitter-panel>
  </sd-splitter>
</div>
```

#### 3. Multi-panel layout with collapsible sidebars + imperative API
```ts
import { Component, viewChild } from '@angular/core';
import { SdSplitterComponent, SdSplitterPanelComponent } from '@sdcorejs/angular/components/splitter';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'orders-workspace',
  standalone: true,
  imports: [SdSplitterComponent, SdSplitterPanelComponent, SdButton],
  template: `
    <sd-button type="light" color="primary"
               prefixIcon="menu_open" title="Gáº­p / má»Ÿ sidebar"
               (click)="splitter()?.toggle('sidebar')">
    </sd-button>
    <sd-button type="light" color="secondary"
               prefixIcon="restart_alt" title="Reset layout"
               (click)="splitter()?.resetLayout()">
    </sd-button>

    <div style="height: 600px;">
      <sd-splitter #splitter
                   orientation="horizontal"
                   storageKey="orders-workspace.layout"
                   (resizeEnd)="onResizeEnd($event)">
        <sd-splitter-panel panelId="sidebar" [size]="240" unit="px"
                           [minSize]="160" [collapsible]="true">
          <nav>Sidebar (collapsible)</nav>
        </sd-splitter-panel>

        <sd-splitter-panel panelId="main" [size]="1" unit="flex" [minSize]="0.5">
          <main>Danh sÃ¡ch Ä‘Æ¡n hÃ ng</main>
        </sd-splitter-panel>

        <sd-splitter-panel panelId="detail" [size]="320" unit="px"
                           [minSize]="240" [maxSize]="600" [collapsible]="true">
          <aside>Chi tiáº¿t (collapsible, max 600px)</aside>
        </sd-splitter-panel>
      </sd-splitter>
    </div>
  `,
})
export class OrdersWorkspace {
  readonly splitter = viewChild<SdSplitterComponent>('splitter');

  onResizeEnd(layout: import('@sdcorejs/angular/components/splitter').SplitterLayoutState) {
    // E.g. persist to backend or analytics
    console.log('user committed layout', layout);
  }
}
```

#### 4. Disabled / read-only splitter (display the split but lock the drag)
```html
<sd-splitter orientation="horizontal" [disabled]="true">
  <sd-splitter-panel [size]="1" unit="flex">â€¦</sd-splitter-panel>
  <sd-splitter-panel [size]="2" unit="flex">â€¦</sd-splitter-panel>
</sd-splitter>
```

#### 5. Per-panel lock (specific seam non-resizable)
```html
<sd-splitter orientation="horizontal">
  <sd-splitter-panel [size]="200" unit="px" [resizable]="false">
    <nav>Sidebar â€” fixed 200px, khÃ´ng kÃ©o Ä‘Æ°á»£c</nav>
  </sd-splitter-panel>
  <sd-splitter-panel [size]="1" unit="flex">
    <main>Content â€” flex</main>
  </sd-splitter-panel>
  <sd-splitter-panel [size]="300" unit="px" [minSize]="200" [collapsible]="true">
    <aside>Inspector â€” kÃ©o Ä‘Æ°á»£c, gáº­p Ä‘Æ°á»£c</aside>
  </sd-splitter-panel>
</sd-splitter>
```

### Anti-patterns
- âŒ Placing `<sd-splitter-handle>` manually in the template â€” the container creates them via `createComponent()`; manual handles will be appended but never wired
- âŒ Using `storageKey` without `panelId` on every panel â€” restore falls back to index matching, so reordering panels silently corrupts the saved layout
- âŒ Declaring `unit="flex"` with very large `[size]` (e.g. `1000`) thinking it's percent â€” flex sizes are normalized weights; `1000` vs `3000` behaves identically to `1` vs `3`
- âŒ Putting only one `<sd-splitter-panel>` child â€” no handle is rendered, no resize possible; collapse to a regular `<div>` instead
- âŒ Reading `getLayout()` mid-drag expecting "live" intermediate sizes â€” `getLayout()` reads `liveSizes` which DOES update during drag, but `committedLayout` and `(layoutChange)` only fire on commit. If you need true live sizes, hook a custom effect on `liveSizes()`.
- âŒ Toggling `[disabled]` to "freeze" sizes while still letting the user see the cursor change â€” disabled sets `pointer-events: none` on handles; the cursor stays default. Use `[resizable]="false"` per-panel if you want some seams locked and others not.
- âŒ Animating panel widths externally (e.g. via CSS `transition: flex 300ms`) â€” the splitter writes `style.flex` imperatively on each frame; transitions cause visual lag and the `.sd-splitter--dragging` class already suppresses them mid-drag

---

## `<sd-splitter-panel>`

### One-line purpose
A single resizable region inside `<sd-splitter>`. Declares its size, unit (`px` or `flex`), min/max bounds, and collapsible / resizable behavior. The host element receives `style.flex` imperatively from the parent splitter â€” do not set `flex` / `width` / `height` on it yourself.

### When to use
- Always as a direct child of `<sd-splitter>`. Has no standalone visual purpose.
- One per region you want the user to resize (sidebar, main, inspector, â€¦).

### When NOT to use
- Outside `<sd-splitter>` â€” the panel becomes an inert `<div>` with no flex behavior
- For non-resizable layout regions â€” use plain `<div>` or `<sd-section>`

### Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `panelId` | `string \| undefined` | `undefined` | Stable identifier used by `storageKey` restore, `collapse(id)` / `expand(id)` / `resizePanel(id, â€¦)`, and `(collapsedChange)`. When omitted, the panel's array index is used (fragile if panels reorder). |
| `size` | `number` | `1` | `numberAttribute` transform. Initial size â€” pixels when `unit="px"`, weight when `unit="flex"`. Stored as `declaredSize` and used by `resetLayout()`. |
| `unit` | `SplitterPanelUnit` (`'px' \| 'flex'`) | `'flex'` | `'px'` = fixed pixel width/height (`flex: 0 0 <size>px`); `'flex'` = weighted share of remaining space (`flex: <normalized-grow> 1 0`). Mix freely in one splitter â€” pixels are reserved first, then flex panels share what's left. |
| `minSize` | `number` | `0` | `numberAttribute` transform. Minimum size before the drag clamps (or snaps to collapsed if `[collapsible]`). Same unit as `size`. |
| `maxSize` | `number \| undefined` | `undefined` | Maximum size â€” drag clamps at this value. Same unit as `size`. Falsy / empty-string coerces back to `undefined` (no cap). |
| `collapsible` | `boolean` | `false` | `booleanAttribute` transform. Enables snap-to-collapse on drag, dbl-click toggle, and the keyboard Enter/Space toggle on the adjacent handle. |
| `collapsed` | `boolean` (model â€” two-way) | `false` | Two-way bindable via `[(collapsed)]`. Reflects collapsed state; setting from parent collapses (only if `[collapsible]="true"`). |
| `resizable` | `boolean` | `true` | `booleanAttribute` transform. When `false`, BOTH handles adjacent to this panel are disabled â€” neighboring panels also can't be resized through this seam. |

### Outputs
None â€” emit through the parent splitter's `(collapsedChange)` / `(layoutChange)` / `(resizeEnd)`. Two-way `[(collapsed)]` covers the collapsed flag.

### Content projection
| Slot | Purpose |
| --- | --- |
| (default) | Arbitrary content rendered inside the panel host. Use `width: 100%; height: 100%` on the child if you want it to fill the panel. |

### Behaviors / quirks
- **Host has `display: block`** (from inherited Material reset) plus `style.flex` written by the parent â€” do not override `flex`, `width`, `height` on `<sd-splitter-panel>` directly
- **`collapsed` is a `model()`** â€” when the splitter snap-collapses or `(collapsedChange)` fires, the parent's `[(collapsed)]` binding updates automatically
- **`collapsed=true` requires `collapsible=true`** to fire from drag/dbl-click; you can still set `[collapsed]="true"` programmatically on a non-collapsible panel but it won't be re-expandable by the user
- **`minSize=0`** (default) means a flex panel can shrink to 0 â€” set a sane minimum (e.g. `200` px or `0.2` flex weight) when collapsible to avoid the snap firing on tiny accidental drags

### Anti-patterns
- âŒ Setting `style="flex: 1"` or `style="width: 300px"` directly on `<sd-splitter-panel>` â€” the parent overwrites `style.flex` every frame; your style is lost
- âŒ Omitting `[panelId]` while using `storageKey` â€” index-based restore breaks on reorder
- âŒ Declaring `[minSize]="100"` with `unit="flex"` thinking 100 means pixels â€” `minSize` shares the panel's unit; a flex panel's `minSize=100` is a flex weight of 100, which clamps essentially never
- âŒ Putting heavy content in a collapsed panel without `@if` â€” the DOM is still mounted (flex: 0 0 0), so heavy children (charts, tables) still consume memory. Wrap with `@if (!panelCollapsed())` if needed.
- âŒ Trying to set `[collapsed]="true"` initially without `[collapsible]="true"` â€” the model accepts it, but the user has no way to expand later

---

## Types

```ts
import type {
  SplitterOrientation,        // 'horizontal' | 'vertical'
  SplitterPanelUnit,          // 'px' | 'flex'
  SplitterPanelState,         // { id, size, unit, collapsed }
  SplitterLayoutState,        // { v: 1, panels: SplitterPanelState[] }
} from '@sdcorejs/angular/components/splitter';

// Color / Size tokens used across `@sdcorejs/angular` come from @sdcorejs/utils:
import type { Color, Size } from '@sdcorejs/utils';
```

`SplitterLayoutState.v` is a schema version (`1`) â€” future migrations of the persisted shape will bump it and reject older `v`.

## Related
- `<sd-tab-group>` â€” switch between views (mutually exclusive); use when only one region should be visible at a time
- `<sd-section>` â€” single bordered card; use when you don't need a draggable seam
- `<sd-page>` â€” top-level page chrome (header / content / footer); the splitter goes INSIDE the content area
- `SdStorageService` (`@sdcorejs/angular/services/storage`) â€” the persistence layer used by `[storageKey]`

