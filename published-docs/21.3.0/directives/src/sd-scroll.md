# `[sdScroll]` Directive

**Type**: Attribute Directive
**Selector**: `[sdScroll]`
**Class**: `SdScrollDirective`
**Standalone**: yes
**Import path**: `@sdcorejs/angular/directives` (or direct: `@sdcorejs/angular/directives/sd-scroll`)

## One-line purpose
Hover-aware horizontal scroll container — `overflow-x` is `hidden` by default and flips to `auto` only while the cursor is over the host (vertical overflow is permanently `auto`).

## When to use
- Wide tables / lists where you don't want a horizontal scrollbar visible at rest
- Card carousels that scroll horizontally only when interacted with
- Content panels where you want to keep clean visuals until the user engages

## When NOT to use
- When you need always-visible horizontal scrollbars (use plain CSS `overflow-x: auto`).
- When the host has constrained width without overflow (the directive does nothing useful).
- For touch-only mobile UIs — hover semantics are limited; rely on native scrolling instead.

## Inputs
None.

## Outputs
None.

## Public methods
| Name | Signature | Notes |
| --- | --- | --- |
| `scrollTop` | `() => void` | Resets `scrollTop = 0` on the host (delayed via `setTimeout(_, 1)`). Useful from a `@ViewChild` reference when refreshing list contents. |

## Behavior
- `ngOnInit`: applies `-webkit-transform: translate3d(0,0,0)` (GPU layer hint), `overflow-x: hidden`, `overflow-y: auto` to the host.
- `mouseover`: sets `overflow-x: auto` (scrollbar appears, content becomes horizontally scrollable).
- `mouseout`: sets `overflow-x: hidden` (scrollbar hides; horizontal scroll position is preserved by the browser).

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
- The directive relies solely on `mouseover`/`mouseout` mouse events; keyboard users and touch device users receive no `overflow-x` toggle. Ensure the host element is still reachable and usable without hover (e.g. always-visible scrollbars for keyboard-only flows, or a touch fallback via `touchstart`).
- No ARIA attributes are applied or required.

## Change history
| Version | Change |
| --- | --- |
| `19.0.0-beta.86` | Initial release — hover-controlled `overflow-x`, GPU-layer hint, `scrollTop()` helper. |

## Anti-patterns
- Expecting vertical-overflow toggling — directive hard-codes `overflow-y: auto`; only X axis is hover-controlled.
- Relying on touch devices to trigger `mouseover` — behavior on iOS/Android is inconsistent.
- Combining with components that set their own `overflow` styles — the directive's runtime style writes will fight inline styles.

## Related
- Plain CSS `overflow-x: auto` — when you don't need hover-hide behavior.
- Angular CDK `ScrollingModule` — for virtual scrolling in tall lists.
