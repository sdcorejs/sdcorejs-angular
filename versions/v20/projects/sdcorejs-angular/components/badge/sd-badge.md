# `<sd-badge>`

**Type**: Component
**Selector**: `sd-badge`
**Import path**: `@sdcorejs/angular/components/badge` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdBadge`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Status / label indicator — shows a state (success / warning / error / info / …) as a colored dot or icon with text, a tinted or solid pill, a tag, a bare dot, or a label–value pair. One line, fixed height. Not a primary action; render-only by default but can opt into clicks.

## When to use
- Display row status in a list (Đang hoạt động, Chờ duyệt, Đã hủy)
- Indicate severity / priority next to a title
- Tag-style chips (light pill with icon + label) for categories
- Quick visual cue in toolbars and headers
- Counter-style number badge (use `type="round"` or `"solid"` with a numeric `title`)
- A status that needs attention at once (`type="solid"`, at most one per row)
- A status in a narrow column or on an avatar (`type="dot"`)
- An attribute and its value, such as SLA, priority or version (`type="pair"`)

## When NOT to use
- For clickable actions → use `<sd-button>` (badge clicks are supported but not its primary purpose)
- For form inputs / chip-input → use `<sd-tag>` / form components
- For user identity → use `<sd-avatar>`
- For long descriptive text → badges are short by design

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `type` | `SdBadgeType` = `'icon' \| 'round' \| 'tag' \| 'solid' \| 'dot' \| 'pair'` | `'icon'` | Visual variant, see *Types*. Falsy values coerce back to `'icon'`. |
| `color` | `Color` (`'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| …`) | `'secondary'` | Color token. Falsy values coerce back to `'secondary'`. Overridden by the boolean shortcuts below. |
| `primary` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="primary"`. |
| `secondary` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="secondary"`. |
| `success` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="success"`. |
| `info` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="info"`. |
| `warning` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="warning"`. |
| `error` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="error"`. |
| `icon` | `string \| null \| undefined` | `undefined` | Icon name rendered through `<sd-icon>`. Unset: `type="icon"` draws a CSS dot in the base colour (`--sd-*`); `round` and `tag` show no icon. |
| `fontSet` | `'material-icons' \| 'material-icons-outlined' \| 'material-icons-round' \| 'material-icons-sharp' \| 'lucide' \| null \| undefined` | `undefined` | Passed to `<sd-icon>`. Leave unset to use `provideSdIcon({ defaultFontSet })` / `SdIcon` default configuration. Falsy values become `undefined`. |
| `title` | `string \| number \| null \| undefined` | `undefined` | Visible label or count (the value of `pair`). One line, cut with an ellipsis. A **number** (including `0`) on `round` or `solid` is a counter: see *Behaviour*. A numeric string such as `'12'` stays text. **Required for `dot`**: not shown, it is the tooltip and the accessible name. |
| `label` | `string \| null \| undefined` | `undefined` | Left part of `type="pair"` (secondary tint). Other types ignore it. |
| `description` | `string \| null \| undefined` | `undefined` | Optional second line under `title`: 12px/16px `--sd-text-secondary`, one line with an ellipsis. Only `tag` and `icon`; the other types ignore it. |
| `tooltip` | `string \| null \| undefined` | `undefined` | Tooltip text, shown above the badge through `[sdTooltip]`; `\n` starts a new line. Without it the badge shows a tooltip only when its title is cut (the full title); `dot` always shows its `title`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Height 20 / 24 / 28px and the scale in *Size scale*. Falsy coerces back to `'sm'`. |
| `pulse` | `boolean` | `false` | `transform: booleanAttribute`. A 3px ring of 28% of the base colour around the dot of `dot` and of `icon` without an icon, pulsing every 1.6s; still ring under `prefers-reduced-motion`. Other types ignore it. |

> Boolean color shortcuts take priority over `color` (precedence: primary → secondary → success → info → warning → error → `color` input).

## Types
| Type | Looks | Use for | Related inputs |
| --- | --- | --- | --- |
| `icon` (default) | Icon in `*-dark` (or a CSS dot in `--sd-*`) + text in `--sd-text`, no background | Status inside running text | `icon`, `title`, `description`, `pulse` (dot only) |
| `round` | `*-light` pill, `*-dark` text, no border, 999px corner | Status in tables and lists; counters | `title`, `icon` |
| `tag` | `*-light`, `*-dark` text, 1px `color-mix(in srgb, *-dark 22%, *-light)` border, 4/6px corner | Categories | `title`, `icon`, `description` |
| `solid` | `--sd-*` pill with `--sd-*-contrast` text, 999px corner | A status that needs attention at once — at most one solid badge per row | as `round` |
| `dot` | Only a dot in `--sd-*`; `title` is the tooltip and the accessible name (required) | Avatars, narrow columns, dense lists | `title`, `pulse` |
| `pair` | `label` (`--sd-secondary-light`, `--sd-secondary-dark`, weight 400) joined to `title` (`*-light`, `*-dark`, weight 500), 4/6px corner | Attribute and value: SLA, priority, channel, version | `label`, `title` |

`*-contrast` on the base colour (solid) and `*-dark` on `*-light` reach 4.5:1 in every preset and in dark
(`npm run test:theme`); `solid` warning is 4.77:1 on the default palette.

## Size scale
| | sm | md | lg |
| --- | --- | --- | --- |
| Height (fixed for `round` / `tag` / `solid` / `pair`, minimum for `icon`) | 20px | 24px | 28px |
| `round` / `tag` / `solid` / `pair` text | 12px / 16px | 13px / 18px | 14px / 20px |
| `round` / `tag` / `solid` icon | 14px | 16px | 18px |
| `icon` text (weight 400, `--sd-text`) | 13px / 18px | 14px / 20px | 14px / 20px |
| `icon` icon | 16px | 18px | 18px |
| Weight (`round`, `tag`, `solid`, value of `pair`) | 500 | 500 | 500 |
| `round` / `solid` padding | 0 8px (with icon 0 8px 0 6px) | 0 10px | 0 12px |
| `tag` padding, each part of `pair` | 0 6px | 0 8px | 0 10px |
| Corner | `round` / `solid` 999px · `tag` / `pair` 4px | 999px · 6px | 999px · 6px |
| Icon–text gap | 4px (`icon` 6px) | 4px (`icon` 6px) | 6px |
| Counter | min-width 20px · padding 0 6px | min-width 24px · 0 7px | min-width 28px · 0 8px |
| Dot (`dot`, `icon` without icon) | 8px | 8px | 10px |

`type="icon"` sits in running text, so its text is one step larger than `round` / `tag` (as drawn in the wave 3
design; the handoff table listed the `round` scale for every type).

### Size tokens
Read with a fallback, so set them on any ancestor (`:root`, a page, a table):

| Token | Default |
| --- | --- |
| `--sd-badge-height-sm` / `-md` / `-lg` | `20px` / `24px` / `28px` (also the counter min-width) |
| `--sd-badge-radius-tag` | `4px` (`tag` and `pair`); `md`, `lg` and a tag with a description add 2px |
| `--sd-badge-font-weight` | `500` (titles of `round`, `tag` and `solid`, value of `pair`) |

## Behaviour
- **One line**: title and description never wrap; the badge is at most as wide as its container (`max-width: 100%`) and cuts the text with an ellipsis.
- **Tooltip**: only when `tooltip` is set, or when the title is cut — measured when the pointer enters or focus arrives; the tooltip then shows the full title. The host's own `title` attribute is removed (`<sd-badge title="…">` still sets the input), so the browser adds no tooltip of its own.
- **Pair**: the label never shrinks; when the badge is too narrow the value is cut first. Without `label` only the value shows.
- **Counter**: a number `title` on `round` or `solid` is centred in tabular figures with `min-width` equal to the height, so one digit is a circle. Above 99 it shows `99+`: the visible `99+` is `aria-hidden` and a visually hidden span carries the real number (the `aria-label` of an interactive badge is the real number too).
- **Description**: 12px/16px `--sd-text-secondary`. A tag with a description becomes a two-line block: padding 4px 8px, 6px corner, 13px/18px title. The icon (or dot) lines up with the first line.
- **Clickable** (a `(click)` listener exists): hover mixes 6% `*-dark` into the background, pressed 10% (`type="icon"` mixes into transparent, `solid` into its base colour, `pair` tints each part with its own dark colour). A clickable `dot` has a 20px hit area around the dot. The handoff asked for 10% / 16%; 16% brings warning text to 4.20:1 and success to 4.44:1, below AA. Focus is the 2px focus ring, offset 2px, and keeps the badge's corner. Transitions are off under `prefers-reduced-motion`.
- **Pulse**: `pulse` adds a 3px ring of `color-mix(in srgb, --sd-* 28%, transparent)` that fades in and out every 1.6s; under `prefers-reduced-motion` the ring stays still.
- **Forced colours**: the pill keeps a frame (a transparent outline the browser paints) and the dot keeps a `CanvasText` fill.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `click` | `EventEmitter<Event>` | Fired on click; the host calls `event.stopPropagation()` before emitting. The cursor switches to pointer ONLY when this output is observed (`click.observed`). |

## Content projection (slots)
None — content is driven by `title`, `description`, and `icon`.

## Visual cues
- **`type="icon"` (default)**: icon in `*-dark` (or an 8/10px CSS dot in the base colour) followed by the title in `--sd-text`, no background. For status inside running text.
- **`type="round"`**: a `*-light` pill (999px corner) with `*-dark` text and no border; optional `icon` on the left. No `description`. For status in tables and lists, and counters.
- **`type="tag"`**: a `*-light` label with `*-dark` text and a 1px border of `color-mix(in srgb, *-dark 22%, *-light)`, 4px corner (6px at md/lg); optional icon and description. For categories.
- **`type="solid"`**: a `--sd-*` pill with `--sd-*-contrast` text; otherwise as `round`.
- **`type="dot"`**: an 8px (10px at lg) dot in `--sd-*`, nothing else.
- **`type="pair"`**: two parts in one box — the secondary `label`, then the coloured value.
- **`size`**: see *Size scale*.
- Cursor is `pointer` only when `(click)` is bound; otherwise non-interactive.

## Examples

### 1. Status pill in a list cell
```html
<sd-badge type="round" success title="Đang hoạt động"></sd-badge>
<sd-badge type="round" warning title="Chờ duyệt"></sd-badge>
<sd-badge type="round" error title="Đã hủy"></sd-badge>
```

### 2. Inline status with icon (default)
```html
<sd-badge
  success
  icon="check_circle"
  title="Đã duyệt"
  description="Bởi Nguyễn Văn A"
  tooltip="Phê duyệt lúc 14:30 09/05/2026">
</sd-badge>
```

### 3. Tag-style category chip
```html
<sd-badge
  type="tag"
  info
  icon="label"
  title="Hợp đồng dài hạn"
  size="sm">
</sd-badge>
```

### 4. Counter badge (numeric)
```html
<sd-badge type="round" primary [title]="unreadCount()"></sd-badge>
```

### 5. Round pill có icon (size md)
```html
<sd-badge
  type="round"
  success
  icon="check_circle"
  title="Đã duyệt"
  size="md">
</sd-badge>
```

### 6. Solid, dot and pair
```html
<sd-badge type="solid" error title="Quá hạn"></sd-badge>
<sd-badge type="dot" success title="Đang hoạt động" pulse></sd-badge>
<sd-badge type="pair" warning label="SLA" title="4 giờ"></sd-badge>
```

### 7. Size variants — md / lg
```html
<sd-badge type="round" primary title="sm" size="sm"></sd-badge>
<sd-badge type="round" primary title="md" size="md"></sd-badge>
<sd-badge type="round" primary title="lg" size="lg"></sd-badge>

<sd-badge type="tag" info icon="label" title="md" size="md"></sd-badge>
<sd-badge type="tag" info icon="label" title="lg" size="lg"></sd-badge>
```

## Accessibility
- The badge root is **never** `aria-hidden`. It carries the visible `title`/`description` text, so hiding it would erase real content from the accessibility tree.
- When — and only when — a consumer binds `(click)`, the root becomes a real control: `role="button"`, `tabindex="0"`, a `:focus-visible` ring, and Enter/Space that emit the same `click` output as a mouse click (Space also calls `preventDefault()` so the page does not scroll). Without a `(click)` listener the badge stays a plain, non-focusable status indicator.
- Interactive badges receive an `aria-label` from non-empty `title` + `description`, then `tooltip`, then a readable icon-name fallback (underscores and hyphens become spaces). Numeric `0` remains a valid title.
- Default round/tag foregrounds use `*-dark` over the existing `*-light` backgrounds; standalone badge icons use the same dark foreground tokens. Consumers can keep overriding the public CSS variables.
- The CSS dot of `type="icon"` is decorative (`aria-hidden`); the title carries the meaning.
- `type="dot"` shows no text, so its root carries the name: `role="img"` + `aria-label` from `title` (`role="button"` when clickable). Always pass `title`; where there is room, show the status in text next to the dot as well.
- An interactive `pair` is named from `label` + `title` ("SLA 4 giờ").
- `onClick` only calls `stopPropagation()` when the `click` output actually has a subscriber. A badge with no listener lets the event bubble to the enclosing control — this is how `<sd-tab-router>` can place a badge inside its `<a>` without nesting two interactive elements.

## Anti-patterns
- Using `<sd-badge>` as a primary action — it's a status indicator; for actions use `<sd-button>` or `<sd-quick-action>`
- Long sentences in `title` — keep it short (1-3 words); it is cut to one line. Use `description` for secondary detail (only with `icon`/`tag` types — `round` ignores it)
- Mixing multiple boolean color shortcuts (`<sd-badge primary error>`) — only one wins by precedence; pass `color` explicitly when dynamic
- Passing `description` to `round`, `solid`, `dot` or `pair` — it is ignored (use `tag` or `icon` for two lines)
- More than one `solid` badge in a row — it is the emphasis level; use `round` for the others
- A `dot` without `title` — it has no visible text, so it would have no name
- Using a badge to convey error STATE that the user must act on — pair with a tooltip or follow-up `<sd-button>` so the user has a path forward

## Related
- `<sd-badge-picker>` — lets users choose a badge's type, colour and icon (`sd-badge-picker.md`); `SD_BADGE_TYPE_OPTIONS` lists the six types with i18n keys
- `<sd-button type="text">` — for clickable text-style actions
- `<sd-tag>` — for tag/chip inputs in forms
- `<sd-avatar>` — for user identity (often paired beside a status badge)
- `<sd-quick-action>` — icon-only action with popover (when you need actual interaction)

### Icon alignment

For `type="icon"`, the glyph keeps its 16/18/18px size (sm/md/lg) and does not shrink. It sits in a box as tall as the title line, so it is centred on the **first line**, also when a description follows. Long text is cut with an ellipsis instead of wrapping. The icon-to-text gap is 6px.
