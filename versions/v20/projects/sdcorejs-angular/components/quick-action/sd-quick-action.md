# `<sd-quick-action>`

**Type**: Component
**Selector**: `sd-quick-action`
**Import path**: `@sdcorejs/angular/components/quick-action` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdQuickAction`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Floating bottom toolbar that slides up to reveal a message (left) and optional action buttons (right). Designed for "selection action" patterns â€” e.g. when the user selects rows in `<sd-table>`, this bar appears at the bottom showing "N selected" + bulk action buttons.

## When to use
- Bulk-action toolbar for table row selection (current canonical use: `<sd-table>`'s selector slot)
- "Floating" CTA that should appear above content without affecting page layout (no reflow when toggled)
- Sticky undo / clipboard / multi-select toolbars

## When NOT to use
- âŒ For an inline message+action row inside a card body â†’ use a plain `<div class="d-flex align-items-center gap-16">` with `<sd-button>`.
- âŒ For a popover menu / dropdown â†’ the component has no anchor logic; use `<sd-button>` + `mat-menu` or your own overlay.
- âŒ For a top banner / system notification â†’ use `<sd-notify>` (toast service) or build a banner component.
- âŒ For modals â†’ use `<sd-modal>`.

## Visual / behavior
- **Positioning**: `position: fixed; bottom: 90px; left: 0; right: 0; margin: auto;` â€” horizontally centered, floating 90px from the viewport bottom.
- **Width**: `max-content` (sizes to natural content), capped at `min(90vw, 720px)`. No fixed `min-width`.
- **Reveal animation**: slides up from below with `transform: translate3d(0, 100%, 0)` â†’ `translate3d(0, 0, 0)`, opacity 0 â†’ 1, 200ms ease-in-out. `visibility` toggled too so it's removed from the a11y tree when hidden.
- **Empty action slot**: when `[sdAction]` projects nothing, the action wrapper is `display: none` and the gap collapses â€” so a message-only toolbar isn't stretched / lopsided.

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `opened` | `boolean` (signal input with `booleanAttribute` transform) | `false` | Bare attribute (`<sd-quick-action opened>`) = true. When true, the host gets the `.active` class which triggers the slide-up animation. |

## Outputs
None.

## Public API
None. The component is driven entirely by the `opened` input â€” no imperative methods. (Previously had `open()` / `close()`; those were removed in the signal refactor since no consumer used them.)

## Content projection (slots)
| Slot selector | Purpose |
| --- | --- |
| `[sdMessage]` | Left side â€” the descriptive text. Renders inside a `flex: 1 1 auto` wrapper with `T14R` typography (14px regular). Can be plain text, a count badge + label, or any inline content. |
| `[sdAction]` | Right side â€” the action element(s), typically one or more `<sd-button>`s. If this slot has NO projected content, it's hidden and the inner gap collapses (no trailing whitespace). |

## Examples

### 1. Canonical use â€” bulk actions in a table
```html
<!-- Inside sd-table's selector-action component -->
<sd-quick-action [opened]="hasSelection()">
  <div class="d-flex align-items-center" sdMessage>
    <div class="c-bg-length"><span class="c-length">{{ selected().length }}</span></div>
    <div class="c-message">{{ message() }}</div>
  </div>
  @if (actions().length > 0) {
    <div class="d-flex align-items-center" sdAction>
      @for (action of actions(); track action.title) {
        <sd-button class="ml-4" [title]="action.title" (click)="onAction(action)"></sd-button>
      }
      <sd-button class="ml-4" prefixIcon="close" type="outline" (click)="onClear()"></sd-button>
    </div>
  }
</sd-quick-action>
```

When `actions()` is empty, only the count message renders â€” and the toolbar shrinks to fit (no awkward 320px stretch).

### 2. Message-only floating notice
```html
<sd-quick-action [opened]="isSyncing()">
  <span sdMessage>Äang Ä‘á»“ng bá»™ dá»¯ liá»‡uâ€¦</span>
</sd-quick-action>
```

The empty `[sdAction]` slot is handled by `:has()` + `:empty` CSS rules â€” the toolbar fits the message naturally.

### 3. Undo toast
```html
<sd-quick-action [opened]="lastDeleted() !== null">
  <span sdMessage>ÄÃ£ xoÃ¡ {{ lastDeleted()?.name }}.</span>
  <sd-button sdAction type="link" color="primary" title="HoÃ n tÃ¡c" (click)="undo()"></sd-button>
</sd-quick-action>
```

## Anti-patterns
- âŒ **Stacking multiple `<sd-quick-action>`s** â€” they all use `position: fixed` at the same bottom slot, so they'll overlap. Only ONE should be open at a time per page.
- âŒ **Using it inline inside a card** â€” the `position: fixed` will pull it out of normal flow to the bottom of the viewport. Use a plain flex row instead for inline cases.
- âŒ **Triggering `.open()` imperatively** â€” those methods were removed. Bind `[opened]` to a signal / variable instead.
- âŒ **Putting very wide content in `[sdMessage]`** â€” the toolbar caps at `min(90vw, 720px)`. Long text will wrap (or be cut by your own `text-overflow: ellipsis`). Keep messages concise.
- âŒ **Forgetting `sdMessage` / `sdAction` attributes** â€” content without those selectors falls into the default slot, but neither slot has a default rendering. Content is dropped silently.

## Related
- `<sd-table>` â€” the main consumer (selector-action component embeds this for bulk-action UX)
- `<sd-button>` â€” typical content of `[sdAction]`
- `<sd-notify>` â€” for transient toast notifications (different pattern: top-right, auto-dismiss, no message+action structure)
- `<sd-modal>` â€” for blocking dialogs

