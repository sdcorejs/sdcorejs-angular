# `[sdHoverCopy]` Directive

**Type**: Attribute Directive
**Selector**: `[sdHoverCopy]`
**Class**: `SdHoverCopyDirective`
**Standalone**: no (declared module-style â€” no `standalone: true` flag)
**Import path**: `@sdcorejs/angular/directives` (or direct: `@sdcorejs/angular/directives/sd-hover-copy`)

## One-line purpose
On hover, overlays a small copy-to-clipboard button on the host element; clicking copies the supplied text and shows a "Copied" tooltip.

## When to use
- Table cells displaying IDs, codes, hashes, phone numbers, emails â€” anything users routinely copy
- Read-only inline values in detail panels
- Anywhere a user wants quick clipboard access without selecting text manually

## When NOT to use
- For rich copy UX with multiple actions â€” build a custom action menu instead.
- On host elements that already use `position: relative` for overlapping children â€” the directive forces `position: relative` and absolutely positions its button at `right: 4px`, which may collide.

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `sdHoverCopy` (alias `copyText`) | `string` | **required** | The text to copy when the button is clicked. |
| `sdHoverCopyDisabled` | `boolean` | `false` | When `true`, removes the copy button from the DOM (per SM-2287 â€” the previous opacity-only hide didn't fully prevent clicks). |

## Outputs
None.

## Behavior
- `ngOnChanges` (fires before `ngOnInit`): if `sdHoverCopyDisabled` changes to `false` and no button exists yet, creates one; if it changes to `true`, removes the existing button from the DOM.
- `ngOnInit`: if not disabled, creates a small `<button>` (with inline copy SVG) absolutely positioned at the right of the host (`top: 50%, right: 4px, translateY(-50%)`), initially `display: none`. Forces host to `position: relative`. Also appends a tooltip `<span>` (initial text "Sao chÃ©p").
- `mouseenter` on host: shows the button (`display: block`); skipped when `sdHoverCopyDisabled` is `true` or the button was never created.
- `mouseleave` on host: hides the button (`display: none`) and resets tooltip text to "Sao chÃ©p" with `opacity: 0`.
- Clicking the copy button: calls `BrowserUtilities.copyToClipboard(String(copyText))`, swaps tooltip text to "Copied" with `opacity: 1`, then auto-hides after 1000 ms by resetting to "Sao chÃ©p" with `opacity: 0`.

## Known issues
- **Double-button creation on first render**: because `ngOnChanges` fires before `ngOnInit`, both hooks create a copy button when `sdHoverCopyDisabled` starts as `false`. The directive's internal reference points to the second button (created in `ngOnInit`), so behaviour is correct, but an orphaned first button element stays in the host's DOM. Tracked as a follow-up to SM-2287.
- **No `aria-label`**: the generated `<button>` has no accessible label. Screen-reader users cannot identify its purpose. A future fix should add `aria-label="Sao chÃ©p"` (or the localised equivalent) to the button element.

## Examples

### 1. Table cell with ID
```html
<td [sdHoverCopy]="row.id">{{ row.id }}</td>
```

### 2. Conditionally enabled per column config
```html
<td
  [sdHoverCopy]="row.email"
  [sdHoverCopyDisabled]="!column.hoverCopyEnabled">
  {{ row.email }}
</td>
```

### 3. Detail-panel value
```html
<div class="kv-row">
  <span class="key">MÃ£ Ä‘Æ¡n:</span>
  <span class="val" [sdHoverCopy]="order.code">{{ order.code }}</span>
</div>
```

## Anti-patterns
- Setting `sdHoverCopy` to a non-string (object/array) â€” directive coerces with `String(...)`, but the result will likely be `[object Object]`.
- Toggling visibility purely via `sdHoverCopyDisabled = true` and expecting space to remain â€” the button is removed from DOM entirely.
- Stacking on a host whose layout depends on `position` other than `relative` â€” the directive overrides it.
- Using on inline-only elements (`<span>` without block context) â€” absolute positioning may not align as expected.

## Related
- `BrowserUtilities.copyToClipboard` â€” underlying clipboard helper.
- `[sdTooltip]` â€” for richer hover UX without copy.

