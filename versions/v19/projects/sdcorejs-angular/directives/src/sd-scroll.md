# `[sdScroll]` Directive

**Type**: Attribute Directive
**Selector**: `[sdScroll]`
**Class**: `SdScrollDirective`
**Standalone**: yes
**Import path**: `@sdcorejs/angular/directives` (or direct: `@sdcorejs/angular/directives/sd-scroll`)

## One-line purpose
Pointer-aware horizontal scroll container — on mouse devices `overflow-x` is `hidden` at rest and `auto` while the cursor is over the host; on touch devices `overflow-x` is always `auto` so the first swipe scrolls (vertical overflow is permanently `auto`).

## When to use
- Wide tables / lists where you don't want a horizontal scrollbar visible at rest
- Card carousels that scroll horizontally only when interacted with
- Content panels where you want to keep clean visuals until the user engages

## When NOT to use
- When you need always-visible horizontal scrollbars (use plain CSS `overflow-x: auto`).
- When the host has constrained width without overflow (the directive does nothing useful).
- When you want the horizontal scrollbar hidden at rest on touch devices too — touch devices always get `overflow-x: auto`.

## Inputs
None.

## Outputs
None.

## Public methods
| Name | Signature | Notes |
| --- | --- | --- |
| `scrollTop` | `() => void` | Resets `scrollTop = 0` on the host (delayed via `setTimeout(_, 1)`). Useful from a `@ViewChild` reference when refreshing list contents. A new call replaces a pending one; destroying the directive cancels it. |
| `onMouseOver` | `() => void` | Mouse mode: sets `overflow-x: auto`. Called on `mouseenter`; no-op on touch devices. |
| `onMouseOut` | `() => void` | Mouse mode: sets `overflow-x: hidden`. Called on `mouseleave`; no-op on touch devices. |

## Behavior
- **Mode detection**: a touch device is one that matches `(hover: none), (any-pointer: coarse)`. One root service owns a single `MediaQueryList` and a single `change` listener for the whole application, however many `sdScroll` hosts exist, and removes it when the root injector is destroyed. Without `window.matchMedia` (SSR, some tests) the directive uses mouse mode.
- `ngOnInit`: applies `-webkit-transform: translate3d(0,0,0)` (GPU layer hint) and `overflow-y: auto`, then sets `overflow-x` for the current mode on the first render.
- **Touch mode**: `overflow-x: auto` permanently and no mouse listeners, so a horizontal swipe scrolls without a prior tap. Laptops with a touch screen match `any-pointer: coarse` and therefore always show the horizontal scrollbar.
- **Mouse mode**: `overflow-x: hidden` at rest; `mouseenter` sets `auto` and `mouseleave` sets `hidden` (horizontal scroll position is preserved by the browser). The two listeners run outside `NgZone` and do not bubble from child cells, so moving the cursor across a table triggers no change detection; `overflow-x` is only written when its value changes.
- **Mode change at runtime** (pointer plugged in or removed, DevTools emulation): every live host switches mode; mouse listeners are attached at most once and removed when switching to touch mode.
- **Destroy**: removes the mouse listeners and cancels a pending `scrollTop()`.

## Examples

### 1. Horizontal scrolling row of cards
```html
<div sdScroll class="card-row">
  @for (card of cards(); track card.id) {
    <sd-card [data]="card"></sd-card>
  }
</div>
```

### 2. Reset to top after refresh via `@ViewChild`
```ts
@ViewChild(SdScrollDirective) scroller!: SdScrollDirective;

onRefresh() {
  this.dataSvc.reload();
  this.scroller.scrollTop();
}
```

### 3. Wide table wrapper
```html
<div sdScroll>
  <table class="wide-data-table">
    <!-- ... -->
  </table>
</div>
```

## Accessibility
- Touch devices always get `overflow-x: auto`. On mouse devices the toggle relies on `mouseenter`/`mouseleave`; keyboard focus does not toggle `overflow-x`, so keyboard-only flows on mouse devices need another way to reach off-screen columns.
- No ARIA attributes are applied or required.

## Change history
| Version | Change |
| --- | --- |
| `19.0.0-beta.86` | Initial release — hover-controlled `overflow-x`, GPU-layer hint, `scrollTop()` helper. |
| Unreleased | Touch devices get `overflow-x: auto` from the first render (a horizontal swipe no longer needs a prior tap). Mouse mode uses `mouseenter`/`mouseleave` outside `NgZone` instead of `mouseover`/`mouseout`; one shared media query listener; listeners and the pending `scrollTop()` are cleaned up on destroy. |

## Anti-patterns
- Expecting vertical-overflow toggling — directive hard-codes `overflow-y: auto`; only X axis is hover-controlled.
- Dispatching synthetic `mouseover`/`mouseout` on the host to toggle the scrollbar — the directive listens to `mouseenter`/`mouseleave`; call `onMouseOver()`/`onMouseOut()` instead.
- Combining with components that set their own `overflow` styles — the directive's runtime style writes will fight inline styles.

## Related
- Plain CSS `overflow-x: auto` — when you don't need hover-hide behavior.
- Angular CDK `ScrollingModule` — for virtual scrolling in tall lists.
