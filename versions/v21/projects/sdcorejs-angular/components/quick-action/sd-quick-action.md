# `<sd-quick-action>`

**Type**: Component
**Selector**: `sd-quick-action`
**Import path**: `@sdcorejs/angular/components/quick-action` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdQuickAction`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Floating bottom toolbar that slides up to reveal a message (left) and optional action buttons (right). Designed for "selection action" patterns — e.g. when the user selects rows in `<sd-table>`, this bar appears at the bottom showing "N selected" + bulk action buttons.

## When to use
- Bulk-action toolbar for table row selection (current canonical use: `<sd-table>`'s selector slot)
- "Floating" CTA that should appear above content without affecting page layout (no reflow when toggled)
- Sticky undo / clipboard / multi-select toolbars

## When NOT to use
- ❌ For an inline message+action row inside a card body → use a plain `<div class="d-flex align-items-center gap-16">` with `<sd-button>`.
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
| `opened` | `boolean` (signal input with `booleanAttribute` transform) | `false` | Bare attribute (`<sd-quick-action opened>`) = true. When true, the host gets the `.active` class which triggers the slide-up animation. |

## Outputs
None.

## Public API
None. The component is driven entirely by the `opened` input — no imperative methods. (Previously had `open()` / `close()`; those were removed in the signal refactor since no consumer used them.)

## Content projection (slots)
| Slot selector | Purpose |
| --- | --- |
| `[sdMessage]` | Left side — the descriptive text. Renders inside a `flex: 1 1 auto` wrapper with `T14R` typography (14px regular). Can be plain text, a count badge + label, or any inline content. |
| `[sdAction]` | Right side — the action element(s), typically one or more `<sd-button>`s. If this slot has NO projected content, it's hidden and the inner gap collapses (no trailing whitespace). |

## Examples

### 1. Canonical use — bulk actions in a table
```html
<!-- Inside sd-table's selector-action component -->
<sd-quick-action [opened]="hasSelection() && actions().length > 0">
  <div class="d-flex align-items-center" sdMessage>
    <div class="c-bg-length"><span class="c-length">{{ selected().length }}</span></div>
    <div class="c-message">{{ message() }}</div>
  </div>
  <div class="d-flex align-items-center" sdAction>
    @for (action of actions(); track action.title) {
      <sd-button class="ml-4" [title]="action.title" (click)="onAction(action)"></sd-button>
    }
    <sd-button class="ml-4" prefixIcon="close" type="outline" (click)="onClear()"></sd-button>
  </div>
</sd-quick-action>
```

**Gate `opened` on the actions, not just on the selection.** A bar carrying a count and a lone `×` restates what the row checkboxes already show while floating over the content the user is trying to read — `<sd-table>` and `<sd-tree>` both keep it closed when the selection resolves to zero runnable actions, and `<sd-tree-select>` relies on that to keep its picker modal clean.

A message-only bar is still legitimate when the message *is* the payload (example 2 below); the rule above is about selection bars specifically.

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
- ❌ **Stacking multiple `<sd-quick-action>`s** — they all use `position: fixed` at the same bottom slot, so they'll overlap. Only ONE should be open at a time per page.
- ❌ **Using it inline inside a card** — the `position: fixed` will pull it out of normal flow to the bottom of the viewport. Use a plain flex row instead for inline cases.
- ❌ **Triggering `.open()` imperatively** — those methods were removed. Bind `[opened]` to a signal / variable instead.
- ❌ **Putting very wide content in `[sdMessage]`** — the toolbar caps at `min(90vw, 720px)`. Long text will wrap (or be cut by your own `text-overflow: ellipsis`). Keep messages concise.
- ❌ **Forgetting `sdMessage` / `sdAction` attributes** — content without those selectors falls into the default slot, but neither slot has a default rendering. Content is dropped silently.

## Related
- `<sd-table>` — the main consumer (selector-action component embeds this for bulk-action UX)
- `<sd-button>` — typical content of `[sdAction]`
- `<sd-notify>` — for transient toast notifications (different pattern: top-right, auto-dismiss, no message+action structure)
- `<sd-modal>` — for blocking dialogs
