# `[sdTooltip]` Directive

**Type**: Attribute Directive
**Selector**: `[sdTooltip]`
**Class**: `SdTooltipDirective` (uses internal `SdTooltipComponent` rendered via CDK Overlay)
**Standalone**: yes
**Import path**: `@sdcorejs/angular/directives` (or direct: `@sdcorejs/angular/directives/sd-tooltip`)

## One-line purpose
CDK-Overlay-based tooltip with template support, configurable position/color/delay, and "stays open while cursor is over the tooltip itself" behavior (single global active tooltip at a time).

## When to use
- Hover hints for icons, badges, table cells
- Rich tooltips that contain templates/markup (not just text)
- When the user needs to interact with tooltip content (hover the tooltip itself) — built-in mouse-tracking keeps it open

## When NOT to use
- For Material's standard text-only tooltip semantics — `matTooltip` may be lighter.
- For click-based popovers with multi-element content — use a popover/menu component.
- On click-driven UI affordances — this is hover-only.

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `sdTooltip` (alias `content`) | `string \| TemplateRef<any>` | **required** | Tooltip body. String renders inside a `<span>`; `TemplateRef` renders via `ngTemplateOutlet`. |
| `sdTooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Preferred edge. CDK falls back to alternative positions if the preferred doesn't fit. |
| `sdTooltipDelay` | `number` (ms) | `100` | Delay after `mouseenter` before showing. |
| `sdTooltipColor` | `string` (CSS color) | `'#616161'` | Background color of the tooltip surface. |

## Outputs
None.

## Behavior
- `mouseenter` on host:
  - If a different `SdTooltipDirective` instance is currently active, force-hides it.
  - Sets self as the singleton `activeTooltip`.
  - After `sdTooltipDelay` ms, opens an overlay (creates one lazily) and attaches a `SdTooltipComponent` portal with the supplied `content` and `color`.
- `mouseleave` on host: schedules hide after 300 ms — but if the cursor enters the tooltip itself, the timer is cleared so the tooltip stays open. Leaving the tooltip schedules a 200 ms hide.
- Position strategy: `flexibleConnectedTo(host)` with prioritized fallbacks (preferred edge first, then opposites).
- Scroll strategy: `close` — tooltip closes when the page scrolls.
- `DestroyRef.onDestroy`: clears timeouts, disposes the overlay, releases the singleton slot if held.

## Examples

### 1. Simple text tooltip
```html
<sd-button
  type="link" prefixIcon="info"
  [sdTooltip]="'Mã định danh nội bộ'">
</sd-button>
```

### 2. Templated tooltip with rich content
```html
<ng-template #userTip>
  <div class="user-tip">
    <strong>{{ user.name }}</strong>
    <small>{{ user.email }}</small>
  </div>
</ng-template>

<span
  [sdTooltip]="userTip"
  sdTooltipPosition="right"
  sdTooltipColor="#1f2937">
  {{ user.name }}
</span>
```

### 3. Top tooltip with longer delay
```html
<i class="material-icons"
   [sdTooltip]="'Click để mở chi tiết'"
   sdTooltipPosition="top"
   [sdTooltipDelay]="300">
  help_outline
</i>
```

### 4. TemplateRef with custom position and color (full combination)
```html
<!-- Template declaration -->
<ng-template #statusTip>
  <div class="status-tip">
    <span class="dot"></span>
    <strong>Đang xử lý</strong> — còn 3 bước
  </div>
</ng-template>

<!-- Trigger: tooltip above, dark teal background, 200 ms delay -->
<span
  [sdTooltip]="statusTip"
  sdTooltipPosition="top"
  sdTooltipColor="#00695c"
  [sdTooltipDelay]="200">
  Xem trạng thái
</span>
```

## Singleton activeTooltip — single global instance

`SdTooltipDirective` maintains a **static** `activeTooltip` property shared across all instances:

```
private static activeTooltip: SdTooltipDirective | null = null;
```

**Behavior when multiple triggers exist on the same page:**
1. User hovers trigger **A** → `A` becomes `activeTooltip`, tooltip shown after delay.
2. User moves to trigger **B** → `B.onMouseEnter()` detects `activeTooltip !== B`, calls `A.forceHide()` synchronously (clears A's timeouts and detaches A's overlay immediately, no 300 ms wait), then sets `activeTooltip = B`.
3. Only **one** tooltip is ever visible at a time — no z-index stacking or visual overlap.

**`forceHide()` is public** so external code (e.g. a parent component that programmatically resets state) can close the active tooltip:

```typescript
@ViewChild(SdTooltipDirective) tooltip!: SdTooltipDirective;

closeTooltip() {
  this.tooltip.forceHide();
}
```

**Cleanup on destroy:** `DestroyRef.onDestroy` releases the static slot (`activeTooltip = null` if self is active) and calls `overlayRef.dispose()` — the CDK overlay panel is fully removed from the DOM. No manual teardown required.

## Accessibility

- The directive is **hover-only** — keyboard users cannot trigger the tooltip. Add `title` or `aria-label` as a fallback for screen reader / keyboard access.
- The overlay panel has `pointer-events: auto` — the cursor can move into the tooltip and interact with its content without dismissing it.
- Color contrast: the default `#616161` on white text provides ~4.5:1 ratio. When supplying a custom `sdTooltipColor`, verify WCAG AA contrast.

## Theming / CSS surface

The internal `SdTooltipComponent` emits two stable CSS classes:

| Class | Element | Purpose |
| --- | --- | --- |
| `.c-sd-tooltip-container` | Wrapper `<div>` | Background, padding, border-radius, box-shadow. `background-color` driven by `sdTooltipColor`. |
| `.c-sd-tooltip-text` | `<span>` (text mode only) | Text content when `content` is a plain string. |

The overlay panel itself carries the class `c-sd-tooltip-panel` (CDK `panelClass`), which can be used for global positioning overrides in `styles.scss`.

## Testing notes

- Use `OverlayContainer` from `@angular/cdk/overlay` to get the overlay DOM root. Clear `overlayContainerEl.innerHTML` in `afterEach`.
- Use `fakeAsync` + `tick(sdTooltipDelay)` to advance past the show delay, and `tick(300)` to advance past the hide delay. Use `flush()` to drain any remaining timers before the test ends.
- To get the directive instance for `forceHide()` calls: `fixture.debugElement.children[0].injector.get(SdTooltipDirective)`.
- `NoopAnimationsModule` prevents CDK animation timings from interfering with fake-async assertions.

## Anti-patterns
- Passing huge templates — overlay has `max-width: 250px` and `word-wrap: break-word`; long-form content will look cramped.
- Using on transient elements that come/go — make sure `DestroyRef` cleanup runs (Angular handles this automatically when the host is removed).
- Stacking many tooltips on adjacent siblings expecting all to be visible — only ONE tooltip is shown globally; entering a new one force-hides the previous.
- Relying on tooltip for important info on touch devices — hover does not trigger reliably.

## Related
- `[sdHoverCopy]` — hover-driven copy-to-clipboard helper.
- Angular Material `matTooltip` — simpler text-only alternative.
