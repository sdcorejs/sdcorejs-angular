# `<sd-quick-action>`

**Type**: Component
**Selector**: `sd-quick-action`
**Import path**: `@sdcorejs/angular/components/quick-action` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdQuickAction`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Message/action toolbar, floating by default, that slides up to reveal a message (left) and optional action buttons (right). Designed for "selection action" patterns — e.g. when the user selects rows in `<sd-table>`, this bar appears at the bottom showing "N selected" + bulk action buttons.

## When to use
- Bulk-action toolbar for table row selection (current canonical use: `<sd-table>`'s selector slot)
- "Floating" CTA that should appear above content without affecting page layout (no reflow when toggled)
- Sticky undo / clipboard / multi-select toolbars

## When NOT to use
- For an inline message/action row, use `contained` to reserve space inside the owning component.
- ❌ For a popover menu / dropdown → the component has no anchor logic; use `<sd-button>` + `mat-menu` or your own overlay.
- ❌ For a top banner / system notification → use `<sd-notify>` (toast service) or build a banner component.
- ❌ For modals → use `<sd-modal>`.

## Visual / behavior
- **Positioning**: `position: fixed; bottom: 90px; left: 0; right: 0; margin: auto;` — horizontally centered, floating 90px from the viewport bottom.
- **Width**: `max-content` (sizes to natural content), capped at `min(90vw, 720px)`. No fixed `min-width`.
- **Reveal animation**: slides up from below with `transform: translate3d(0, 100%, 0)` → `translate3d(0, 0, 0)`, opacity 0 → 1, 200ms ease-in-out. `visibility` toggled too so it's removed from the a11y tree when hidden.
- **Empty action slot**: when `[sdAction]` projects nothing, the action wrapper is `display: none` and the gap collapses — so a message-only toolbar isn't stretched / lopsided.
- **Corner radius**: the bar is `border-radius: 8px`. Projected content that sits flush against an edge — a coloured count badge at the left, for instance — paints over that corner, so it must repeat the same 8px on the edge it touches (`border-radius: 8px 0 0 8px`). A smaller radius there makes one end of the bar read as squarer than the other.

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `contained` | `boolean` (booleanAttribute) | `false` | Opt into relative positioning, full container width and wrapping. The owner supplies sticky positioning and bottom offset; used by table mobile cards. |
| `opened` | `boolean` (signal input with `booleanAttribute` transform) | `false` | Bare attribute (`<sd-quick-action opened>`) = true. When true, the host gets the `.active` class which triggers the slide-up animation. |

## Outputs
None.

## Public API
None. The component is driven entirely by the `opened` and `contained` inputs — no imperative methods. (Previously had `open()` / `close()`; those were removed in the signal refactor since no consumer used them.)

## Content projection (slots)
| Slot selector | Purpose |
| --- | --- |
| `[sdMessage]` | Left side — the descriptive text. Renders inside a `flex: 1 1 auto` wrapper with `T14R` typography (14px regular). Can be plain text, a count badge + label, or any inline content. |
| `[sdAction]` | Right side — the action element(s), typically one or more `<sd-button>`s. If this slot has NO projected content, it's hidden and the inner gap collapses (no trailing whitespace). |

## Examples

### 1. Contained selection actions
```html
@if (hasSelection()) {
  <sd-quick-action opened contained>
    <span sdMessage>Đã chọn {{ selected().length }}</span>
    <div sdAction>
      <sd-button size="sm" title="Xử lý" (click)="process()"></sd-button>
      <sd-button size="sm" title="Bỏ chọn" (click)="onClear()"></sd-button>
    </div>
  </sd-quick-action>
}
```

Table places this toolbar above its own pagination footer and groups extra actions under More. Default floating notices and undo toasts retain their existing positioning.

### 2. Message-only floating notice
```html
<sd-quick-action [opened]="isSyncing()">
  <span sdMessage>Đang đồng bộ dữ liệu…</span>
</sd-quick-action>
```

The empty `[sdAction]` slot is handled by `:has()` + `:empty` CSS rules — the toolbar fits the message naturally.

### 3. Undo toast
```html
<sd-quick-action [opened]="lastDeleted() !== null">
  <span sdMessage>Đã xoá {{ lastDeleted()?.name }}.</span>
  <sd-button sdAction type="text" color="primary" title="Hoàn tác" (click)="undo()"></sd-button>
</sd-quick-action>
```

## Anti-patterns
- ❌ **Stacking multiple `<sd-quick-action>`s** — default floating instances use `position: fixed` at the same bottom slot, so they'll overlap. Only ONE should be open at a time per page.
- ❌ **Using the default floating mode for an inline card toolbar** — enable `contained` so it stays within its owner.
- ❌ **Triggering `.open()` imperatively** — those methods were removed. Bind `[opened]` to a signal / variable instead.
- ❌ **Putting very wide content in `[sdMessage]`** — the toolbar caps at `min(90vw, 720px)`. Long text will wrap (or be cut by your own `text-overflow: ellipsis`). Keep messages concise.
- ❌ **Forgetting `sdMessage` / `sdAction` attributes** — content without those selectors falls into the default slot, but neither slot has a default rendering. Content is dropped silently.

## Related
- `<sd-table>` — the main consumer (selector-action component embeds this for bulk-action UX)
- `<sd-button>` — typical content of `[sdAction]`
- `<sd-notify>` — for transient toast notifications (different pattern: top-right, auto-dismiss, no message+action structure)
- `<sd-modal>` — for blocking dialogs

### Contained action bar

```html
<div style="position: sticky; bottom: 0">
  <sd-quick-action opened contained>
    <span sdMessage>Selected rows</span>
    <sd-button sdAction title="Process" (click)="process()"></sd-button>
  </sd-quick-action>
</div>
```

`contained` reserves layout space, wraps content, uses the Core surface token, and avoids viewport-wide fixed positioning. Existing callers retain the default floating behavior. The owning component handles scroll bounds, safe area and overlay lifecycle.

Mobile table cards use a compact contained row: the message slot holds only a highlighted count, followed by fitting selection actions, More and the labelled clear icon. Table selector messages and page-selection checkboxes are omitted. Count and clear remain available without bulk actions; row commands and table tools use SdModal bottom sheets.
