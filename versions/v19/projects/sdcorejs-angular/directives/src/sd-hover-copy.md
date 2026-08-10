# `[sdHoverCopy]` Directive

**Type**: Attribute Directive
**Selector**: `[sdHoverCopy]`
**Class**: `SdHoverCopyDirective`
**Standalone**: no (declared module-style — no `standalone: true` flag)
**Import path**: `@sdcorejs/angular/directives` (or direct: `@sdcorejs/angular/directives/sd-hover-copy`)

## One-line purpose
On hover, overlays a small copy-to-clipboard button on the host element; clicking copies the supplied text and shows a confirmation tooltip.

## When to use
- Table cells displaying IDs, codes, hashes, phone numbers, emails — anything users routinely copy
- Read-only inline values in detail panels
- Anywhere a user wants quick clipboard access without selecting text manually

## When NOT to use
- For rich copy UX with multiple actions — build a custom action menu instead.
- On host elements that already use `position: relative` for overlapping children — the directive forces `position: relative` and absolutely positions its button at `right: 4px`, which may collide.

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `sdHoverCopy` (alias `copyText`) | `string` | **required** | The text to copy when the button is clicked. |
| `sdHoverCopyDisabled` | `boolean` | `false` | When `true`, removes the copy button from the DOM (per SM-2287 — the previous opacity-only hide didn't fully prevent clicks). |

## Outputs
None.

## Behavior
- `ngOnChanges` (fires before `ngOnInit`): if `sdHoverCopyDisabled` changes to `false` and no button exists yet, creates one; if it changes to `true`, removes the existing button from the DOM.
- `ngOnInit`: if not disabled, creates a small `<button>` (with inline copy SVG) absolutely positioned at the right of the host (`top: 50%, right: 4px, translateY(-50%)`), initially `display: none`. Forces host to `position: relative`. Also appends a tooltip `<span>` seeded from `core.directive.hover-copy.tooltip`.
- `mouseenter` on host: shows the button (`display: block`); skipped when `sdHoverCopyDisabled` is `true` or the button was never created.
- `mouseleave` on host: hides the button (`display: none`) and resets the tooltip to `core.directive.hover-copy.tooltip` with `opacity: 0`.
- Clicking the copy button: calls `BrowserUtilities.copyToClipboard(String(copyText))`, swaps the tooltip to `core.directive.hover-copy.copied` with `opacity: 1`, then auto-hides after 1000 ms by resetting to `core.directive.hover-copy.tooltip` with `opacity: 0`.
- **Teardown**: the 1000 ms auto-hide timer is stored and cleared via `DestroyRef.onDestroy`, and also when the button is removed (`sdHoverCopyDisabled` → `true`). A host destroyed within that second no longer runs the reset against a detached node, and clicking twice restarts the timer instead of leaving the first one pending.

## i18n
Both tooltip strings resolve through `I18nService` at the moment they are shown, so they follow the
active language (VI `Sao chép` / `Đã sao chép`, EN `Copy` / `Copied`, …):

| What | Key |
| --- | --- |
| Idle tooltip | `core.directive.hover-copy.tooltip` |
| Confirmation after a copy | `core.directive.hover-copy.copied` |

## Known issues
- **Double-button creation on first render**: because `ngOnChanges` fires before `ngOnInit`, both hooks create a copy button when `sdHoverCopyDisabled` starts as `false`. The directive's internal reference points to the second button (created in `ngOnInit`), so behaviour is correct, but an orphaned first button element stays in the host's DOM. Tracked as a follow-up to SM-2287.
- **No `aria-label`**: the generated `<button>` has no accessible label. Screen-reader users cannot identify its purpose. A future fix should add `aria-label="Sao chép"` (or the localised equivalent) to the button element.

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
  <span class="key">Mã đơn:</span>
  <span class="val" [sdHoverCopy]="order.code">{{ order.code }}</span>
</div>
```

## Anti-patterns
- Setting `sdHoverCopy` to a non-string (object/array) — directive coerces with `String(...)`, but the result will likely be `[object Object]`.
- Toggling visibility purely via `sdHoverCopyDisabled = true` and expecting space to remain — the button is removed from DOM entirely.
- Stacking on a host whose layout depends on `position` other than `relative` — the directive overrides it.
- Using on inline-only elements (`<span>` without block context) — absolute positioning may not align as expected.

## Related
- `BrowserUtilities.copyToClipboard` — underlying clipboard helper.
- `[sdTooltip]` — for richer hover UX without copy.
