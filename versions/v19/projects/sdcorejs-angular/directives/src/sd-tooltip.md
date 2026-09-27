# `[sdTooltip]` Directive

**Type**: Attribute Directive
**Selector**: `[sdTooltip]`
**Class**: `SdTooltipDirective` (uses internal `SdTooltipComponent` rendered via CDK Overlay)
**Standalone**: yes
**Import path**: `@sdcorejs/angular/directives` (or direct: `@sdcorejs/angular/directives/sd-tooltip`)

## One-line purpose
CDK-Overlay-based tooltip with template support, configurable position/color/delay, keyboard access (focus + Escape) and "stays open while cursor is over the tooltip itself" behavior (single global active tooltip at a time). Meets WCAG 2.1 SC 1.4.13 (dismissible, hoverable, persistent).

## When to use
- Hover and keyboard-focus hints for icons, badges, table cells
- Rich tooltips that contain templates/markup (not just text)
- When the user needs to interact with tooltip content (hover the tooltip itself) — built-in mouse-tracking keeps it open

## When NOT to use
- For Material's standard text-only tooltip semantics — `matTooltip` may be lighter.
- For click-based popovers with multi-element content — use a popover/menu component.
- On click-driven UI affordances — the tooltip opens on hover and focus, not on click.

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `sdTooltip` (alias `content`) | `string \| TemplateRef<any>` | **required** | Tooltip body. String renders inside a `<span>`; `TemplateRef` renders via `ngTemplateOutlet`. |
| `sdTooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Preferred edge. CDK falls back to alternative positions if the preferred doesn't fit. |
| `sdTooltipDelay` | `number` (ms) | `100` | Delay after `mouseenter` before showing. |
| `sdTooltipColor` | `string` (CSS color) | `'var(--sd-tooltip-bg, #616161)'` | Background color of the tooltip surface. The default follows the theme token `--sd-tooltip-bg`; the fallback is the previous grey, so pages without the theme look the same. |

## Outputs
None.

## Behavior
- `mouseenter` on host:
  - If a different `SdTooltipDirective` instance is currently active, force-hides it.
  - Sets self as the singleton `activeTooltip`.
  - After `sdTooltipDelay` ms, opens an overlay (creates one lazily) and attaches a `SdTooltipComponent` portal with the supplied `content` and `color`.
- `mouseleave` on host: schedules hide after 300 ms — but if the cursor enters the tooltip itself, the timer is cleared so the tooltip stays open. Leaving the tooltip schedules a 200 ms hide.
- `focusin` on host (the host or any element inside it): shows the tooltip **immediately** (no delay) through the same singleton, so `aria-describedby` is already set when the screen reader announces the focused element.
- `focusout` to an element outside the host: hides the tooltip — unless the pointer is still over the host. Hover and focus are tracked separately: the tooltip stays while either one still holds it.
- `Escape` while the tooltip is visible: hides it without moving the pointer or focus. The listener runs on `document` in the capture phase, only while a tooltip is visible, and stops the key only when it actually hid a tooltip — so the same `Escape` does not also close a dialog or drawer underneath, and the next `Escape` reaches it normally. The tooltip does not come back until the pointer re-enters or focus returns.
- Position strategy: `flexibleConnectedTo(host)` with prioritized fallbacks (preferred edge first, then opposites).
- Scroll strategy: `close` — tooltip closes when the page scrolls.
- `DestroyRef.onDestroy`: clears timeouts, removes the `Escape` listener and its `aria-describedby` id, disposes the overlay, releases the singleton slot if held.

## Examples

### 1. Simple text tooltip
```html
<sd-button
  type="text" prefixIcon="info"
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

- **Keyboard:** focusing the host (or an element inside it) shows the tooltip; `Escape` dismisses it. Put `sdTooltip` on a focusable element (button, link, input) or give the host `tabindex="0"` — a tooltip on a plain `<span>` still cannot be reached by keyboard.
- **Screen readers:** the bubble has `role="tooltip"` and a unique id (`sd-tooltip-<n>`). While it is visible the directive appends that id to the host's `aria-describedby`, and removes only that id when it hides — ids set by the app or by other components stay untouched.
- The overlay panel has `pointer-events: auto` — the cursor can move into the tooltip and interact with its content without dismissing it.
- Color contrast: the default `--sd-tooltip-bg` (`#616161` in the light theme) with white text is ~6.2:1. When supplying a custom `sdTooltipColor`, verify WCAG AA contrast.

## Theming / CSS surface

The internal `SdTooltipComponent` emits two stable CSS classes:

| Class | Element | Purpose |
| --- | --- | --- |
| `.c-sd-tooltip-container` | Wrapper `<div role="tooltip">` | Background, padding, border-radius, box-shadow. `background-color` driven by `sdTooltipColor` (default `var(--sd-tooltip-bg, #616161)`). |
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
- Putting the only copy of essential information in a tooltip on a non-focusable element — keyboard users cannot open it.

## Related
- `[sdHoverCopy]` — hover-driven copy-to-clipboard helper.
- Angular Material `matTooltip` — simpler text-only alternative.
