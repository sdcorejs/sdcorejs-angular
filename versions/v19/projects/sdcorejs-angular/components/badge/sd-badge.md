# `<sd-badge>`

**Type**: Component
**Selector**: `sd-badge`
**Import path**: `@sdcorejs/angular/components/badge` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdBadge`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Status / label indicator â€” shows a state (success / warning / error / info / â€¦) as a colored dot, icon-with-text, or pill tag. Not a primary action; render-only by default but can opt into clicks.

## When to use
- Display row status in a list (Äang hoáº¡t Ä‘á»™ng, Chá» duyá»‡t, ÄÃ£ há»§y)
- Indicate severity / priority next to a title
- Tag-style chips (light pill with icon + label) for categories
- Quick visual cue in toolbars and headers
- Counter-style number badge (use `type="round"` with a numeric `title`)

## When NOT to use
- For clickable actions â†’ use `<sd-button>` (badge clicks are supported but not its primary purpose)
- For form inputs / chip-input â†’ use `<sd-tag>` / form components
- For user identity â†’ use `<sd-avatar>`
- For long descriptive text â†’ badges are short by design

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `type` | `'tag' \| 'round' \| 'icon'` | `'icon'` | Visual variant. `icon`=icon-with-text inline; `round`=solid pill with text only (good for status/counters); `tag`=light-tinted card with icon + title + optional description. Falsy values coerce back to `'icon'`. |
| `color` | `Color` (`'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| â€¦`) | `'secondary'` | Color token. Falsy values coerce back to `'secondary'`. Overridden by the boolean shortcuts below. |
| `primary` | `boolean` | `false` | `transform: booleanAttribute` â€” bare attribute = true. Shortcut for `color="primary"`. |
| `secondary` | `boolean` | `false` | `transform: booleanAttribute` â€” bare attribute = true. Shortcut for `color="secondary"`. |
| `success` | `boolean` | `false` | `transform: booleanAttribute` â€” bare attribute = true. Shortcut for `color="success"`. |
| `info` | `boolean` | `false` | `transform: booleanAttribute` â€” bare attribute = true. Shortcut for `color="info"`. |
| `warning` | `boolean` | `false` | `transform: booleanAttribute` â€” bare attribute = true. Shortcut for `color="warning"`. |
| `error` | `boolean` | `false` | `transform: booleanAttribute` â€” bare attribute = true. Shortcut for `color="error"`. |
| `icon` | `string \| null \| undefined` | `undefined` | Material icon name. If unset, uses default `fiber_manual_record` (filled dot) for icon mode. |
| `fontSet` | `'material-icons' \| 'material-icons-outlined' \| 'material-icons-round' \| 'material-icons-sharp'` | `'material-icons'` | Material icon variant. Falsy values coerce back to default. |
| `title` | `string \| number \| null \| undefined` | `undefined` | Visible label or count. |
| `description` | `string \| null \| undefined` | `undefined` | Optional secondary line shown under `title` (only `tag` and `icon` types). |
| `tooltip` | `string \| null \| undefined` | `undefined` | Material tooltip text (position above; multiline supported). |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | Icon size class. Falsy coerces back to `'sm'`. |

> Boolean color shortcuts take priority over `color` (precedence: primary â†’ secondary â†’ success â†’ info â†’ warning â†’ error â†’ `color` input).

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `click` | `EventEmitter<Event>` | Fired on click; the host calls `event.stopPropagation()` before emitting. The cursor switches to pointer ONLY when this output is observed (`click.observed`). |

## Content projection (slots)
None â€” content is driven by `title`, `description`, and `icon`.

## Visual cues
- **`type="icon"` (default)**: a horizontal row â€” icon on the left (colored per `color`), title (and optional description) on the right; no background/border. Compact, used inline in tables and lists.
- **`type="round"`**: a solid colored pill containing only the `title` text. Good for status chips ("Äang hoáº¡t Ä‘á»™ng") and numeric counters.
- **`type="tag"`**: a light-tinted rounded card with icon + title + optional description; the background is a soft tint of `color` and the text is `color`.
- Default icon (when none specified) is a small filled dot (`fiber_manual_record`).
- Cursor is `pointer` only when `(click)` is bound; otherwise non-interactive.

## Examples

### 1. Status pill in a list cell
```html
<sd-badge type="round" success title="Äang hoáº¡t Ä‘á»™ng"></sd-badge>
<sd-badge type="round" warning title="Chá» duyá»‡t"></sd-badge>
<sd-badge type="round" error title="ÄÃ£ há»§y"></sd-badge>
```

### 2. Inline status with icon (default)
```html
<sd-badge
  success
  icon="check_circle"
  title="ÄÃ£ duyá»‡t"
  description="Bá»Ÿi Nguyá»…n VÄƒn A"
  tooltip="PhÃª duyá»‡t lÃºc 14:30 09/05/2026">
</sd-badge>
```

### 3. Tag-style category chip
```html
<sd-badge
  type="tag"
  info
  icon="label"
  title="Há»£p Ä‘á»“ng dÃ i háº¡n"
  size="sm">
</sd-badge>
```

### 4. Counter badge (numeric)
```html
<sd-badge type="round" primary [title]="unreadCount()"></sd-badge>
```

## Anti-patterns
- Using `<sd-badge>` as a primary action â€” it's a status indicator; for actions use `<sd-button>` or `<sd-quick-action>`
- Long sentences in `title` â€” keep it short (1-3 words); use `description` for secondary detail (and only with `icon`/`tag` types)
- Mixing multiple boolean color shortcuts (`<sd-badge primary error>`) â€” only one wins by precedence; pass `color` explicitly when dynamic
- Setting `type="round"` and expecting an icon to render â€” round mode is text-only
- Using a badge to convey error STATE that the user must act on â€” pair with a tooltip or follow-up `<sd-button>` so the user has a path forward

## Related
- `<sd-button type="link">` â€” for clickable text-style actions
- `<sd-tag>` â€” for tag/chip inputs in forms
- `<sd-avatar>` â€” for user identity (often paired beside a status badge)
- `<sd-quick-action>` â€” icon-only action with popover (when you need actual interaction)

