# `<sd-badge>`

**Type**: Component
**Selector**: `sd-badge`
**Import path**: `@sdcorejs/angular/components/badge` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdBadge`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Status / label indicator — shows a state (success / warning / error / info / …) as a colored dot, icon-with-text, or pill tag. Not a primary action; render-only by default but can opt into clicks.

## When to use
- Display row status in a list (Đang hoạt động, Chờ duyệt, Đã hủy)
- Indicate severity / priority next to a title
- Tag-style chips (light pill with icon + label) for categories
- Quick visual cue in toolbars and headers
- Counter-style number badge (use `type="round"` with a numeric `title`)

## When NOT to use
- For clickable actions → use `<sd-button>` (badge clicks are supported but not its primary purpose)
- For form inputs / chip-input → use `<sd-tag>` / form components
- For user identity → use `<sd-avatar>`
- For long descriptive text → badges are short by design

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `type` | `'tag' \| 'round' \| 'icon'` | `'icon'` | Visual variant. `icon`=icon-with-text inline; `round`=solid pill with text only (good for status/counters); `tag`=light-tinted card with icon + title + optional description. Falsy values coerce back to `'icon'`. |
| `color` | `Color` (`'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| …`) | `'secondary'` | Color token. Falsy values coerce back to `'secondary'`. Overridden by the boolean shortcuts below. |
| `primary` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="primary"`. |
| `secondary` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="secondary"`. |
| `success` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="success"`. |
| `info` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="info"`. |
| `warning` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="warning"`. |
| `error` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="error"`. |
| `icon` | `string \| null \| undefined` | `undefined` | Icon name rendered through `<sd-icon>`. If unset, uses default `fiber_manual_record` for icon mode. |
| `fontSet` | `'material-icons' \| 'material-icons-outlined' \| 'material-icons-round' \| 'material-icons-sharp' \| 'lucide' \| null \| undefined` | `undefined` | Passed to `<sd-icon>`. Leave unset to use `provideSdIcon({ defaultFontSet })` / `SdIcon` default configuration. Falsy values become `undefined`. |
| `title` | `string \| number \| null \| undefined` | `undefined` | Visible label or count. |
| `description` | `string \| null \| undefined` | `undefined` | Optional secondary line shown under `title` (only `tag` and `icon` types). |
| `tooltip` | `string \| null \| undefined` | `undefined` | Material tooltip text (position above; multiline supported). |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Size token. Áp dụng cho cả container (`round` + `tag`: padding + font-size title/description) và icon element (`icon`/`tag`/`round`-có-icon: width/height/font-size). `sm` giữ giá trị visual trước đây để không vỡ UI cũ. Falsy coerces back to `'sm'`. |

> Boolean color shortcuts take priority over `color` (precedence: primary → secondary → success → info → warning → error → `color` input).

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `click` | `EventEmitter<Event>` | Fired on click; the host calls `event.stopPropagation()` before emitting. The cursor switches to pointer ONLY when this output is observed (`click.observed`). |

## Content projection (slots)
None — content is driven by `title`, `description`, and `icon`.

## Visual cues
- **`type="icon"` (default)**: a horizontal row — icon on the left (colored per `color`), title (and optional description) on the right; no background/border. Compact, used inline in tables and lists.
- **`type="round"`**: a solid colored pill containing `title` text. Hỗ trợ thêm `icon` (kể từ version có size md/lg) — khi truyền `icon`, render icon-left + title-right giống `tag` nhưng giữ pill border-radius. Không hỗ trợ `description`.
- **`type="tag"`**: a light-tinted rounded card with icon + title + optional description; the background is a soft tint of `color` and the text is `color`.
- **`size`**: `sm` (mặc định, padding/font hiện hữu) / `md` / `lg` — áp dụng cho cả `round` và `tag`, scale padding container + font-size title/description; icon element scale theo `$badgeIconSize` (16/18/24px).
- Default icon (when none specified) is a small filled dot (`fiber_manual_record`).
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

### 6. Size variants — md / lg
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
- `onClick` only calls `stopPropagation()` when the `click` output actually has a subscriber. A badge with no listener lets the event bubble to the enclosing control — this is how `<sd-tab-router>` can place a badge inside its `<a>` without nesting two interactive elements.

## Anti-patterns
- Using `<sd-badge>` as a primary action — it's a status indicator; for actions use `<sd-button>` or `<sd-quick-action>`
- Long sentences in `title` — keep it short (1-3 words); use `description` for secondary detail (only with `icon`/`tag` types — `round` không hỗ trợ description)
- Mixing multiple boolean color shortcuts (`<sd-badge primary error>`) — only one wins by precedence; pass `color` explicitly when dynamic
- Truyền `description` cho `type="round"` — sẽ bị bỏ qua (round chỉ render title; dùng `tag` hoặc `icon` nếu cần 2 dòng)
- Using a badge to convey error STATE that the user must act on — pair with a tooltip or follow-up `<sd-button>` so the user has a path forward

## Related
- `<sd-button type="text">` — for clickable text-style actions
- `<sd-tag>` — for tag/chip inputs in forms
- `<sd-avatar>` — for user identity (often paired beside a status badge)
- `<sd-quick-action>` — icon-only action with popover (when you need actual interaction)
