# `<sd-inform>`

**Type**: Component
**Selector**: `sd-inform`
**Import path**: `@sdcorejs/angular/components/inform` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdInform`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Page-level banner / alert (báo lỗi / cảnh báo / thông tin) neo trên page — a presentational notice with color, icon, title, description, optional action link and dismiss button. Presentational only: the consumer positions it.

## When to use
- Compact guidance next to a form, table or filter (`type="tip"`)
- A persistent page-level notice the user should read before continuing (lỗi tải dữ liệu, chế độ chỉ đọc, thông báo bảo trì)
- Surfacing a recoverable error with a retry / action affordance (`actionLabel` or `[sdInformAction]`)
- A sticky info/warning banner at the top of a form or detail page
- A long informational message that can be clamped and expanded (`[lineClamp]`)

## When NOT to use
- For a transient, auto-dismissing notification → use `NotifyService` (toast)
- For a short inline status label → use `<sd-badge>`
- For a blocking confirmation the user must answer → use `<sd-modal>` / `ConfirmService`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `type` | `SdInformType` (`'default' \| 'tip'`) | `'default'` | Standard banner or compact non-live guidance. Null/undefined normalize to `default`. |
| `color` | `Color` (`'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'`) | `'primary'` | Color token. Falsy values coerce back to `'primary'`. Overridden by the boolean shortcuts below. |
| `primary` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="primary"`. |
| `secondary` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="secondary"`. |
| `info` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="info"`. |
| `success` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="success"`. |
| `warning` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="warning"`. |
| `error` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Shortcut for `color="error"`. |
| `title` | `string \| undefined` | `undefined` | Heading line. Not number, not null. |
| `description` | `string \| undefined` | `undefined` | Body text. Not number, not null. Subject to `lineClamp`. |
| `icon` | `string \| undefined` | `undefined` | Material icon name override. When falsy (and not hidden), the icon is auto-mapped per color (see table below). |
| `hideIcon` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Suppress the icon entirely (no auto-map). |
| `fontSet` | `SdIconSet` | `undefined` | Optional icon set override passed to `<sd-icon>`. Leave unset to inherit `provideSdIcon({ defaultFontSet })`. |
| `closable` | `boolean` | `false` | `transform: booleanAttribute` — bare attribute = true. Show the `×` dismiss button. |
| `actionLabel` | `string \| undefined` | `undefined` | Text-link action rendered at the end of the content. Overridden by the `[sdInformAction]` projected slot when present. |
| `lineClamp` | `number \| undefined` | `undefined` | Clamp the body to N lines and show a show-more / show-less toggle when it overflows. Values `<= 0` are treated as no clamp. |
| `autoId` | `string \| undefined` | `undefined` | Emitted as `data-autoId` / `data-autoid` on the host banner for e2e selectors. |

> Boolean color shortcuts take priority over `color` (precedence: primary → secondary → info → success → warning → error → `color` input).

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdClosed` | `output<Event>` | Fired when the `×` button is clicked. The component self-hides (uncontrolled — flips an internal `dismissed` signal) AND emits. The host calls `event.stopPropagation()` before emitting. |
| `sdAction` | `output<Event>` | Fired when the `actionLabel` text-link is clicked. The host calls `event.stopPropagation()` before emitting. (Not fired by the `[sdInformAction]` slot — wire your own handler there.) |

## Content projection (slots)
| Selector | Notes |
| --- | --- |
| Default (unselected content) | Replaces the entire title, description, clamp toggle and action area. Status icon and optional close button remain. The consumer owns custom content layout and action handlers. |
| `[sdInformAction]` | Custom action area, marked by `SdInformActionDirective` (exported from the same entry point). When a projected element carries this attribute, it **replaces** the default `actionLabel` link. Used only when no default content is projected. |

## Auto icon map
Applied when `icon` is falsy and `hideIcon` is `false`:

| Effective color | Icon |
| --- | --- |
| `error` | `report_gmailerrorred` (outlined octagon alert) |
| `warning` | `warning_amber` (outlined triangle alert) |
| `success` | `check_circle` |
| `info` | `info` |
| `primary` | `info` |
| `secondary` | `info` |

The warning/error defaults use explicit outline glyphs even in the legacy Material font. Lucide maps these names to `triangle-alert` / `circle-alert`; custom `icon` and `fontSet` overrides remain supported.

## Behavior
- **Content priority**: default projected content replaces the built-in title/description/action area. With no default content, inputs render normally and `[sdInformAction]` can replace just the action. `lineClamp` applies only to the built-in description.
- **Title without description**: in the default variant, the title occupies at least the 32px icon height and is vertically centered, including when an action is present. Tip titles keep the compact 20px line height.
- **Uncontrolled close**: clicking `×` sets an internal `dismissed` signal and the banner removes itself from the DOM, in addition to emitting `sdClosed`. There is no `[open]` input to re-show it — recreate / re-render the component to bring it back.
- **Line-clamp toggle**: when `lineClamp` is set, the body is clamped to N lines. Overflow is measured from the body element after render (and re-measured when `description` / `lineClamp` / expanded state change). The toggle appears once the body has overflowed and stays visible while expanded so the user can collapse again.
- **ARIA role**: `type="tip"` uses `role="note"` for every color, without an implicit live region. For the default variant, `error` / `warning` render with `role="alert"` (assertive); other colors use `role="status"` (polite). Decorative icons (status icon + close `×`) are `aria-hidden`.
- **Presentational only**: the component does not position itself. The consumer places it (e.g. sticky top of a page or form).

## Tip variant

Import `SdInform` and the optional `SdInformType` type from the existing inform entry point. No additional directive or component is required.

- 8px vertical / 12px horizontal padding, 3px colored inline-start border, 4px radius, 13px text with 20px line height.
- Contextual outline icon is 16px, without the circular tile, aligned with the first line when content wraps. Existing `icon`, `hideIcon` and `fontSet`/provider overrides still apply.
- Reuses all six Core color tokens, `--sd-surface` and `--sd-text`; theme changes propagate through CSS custom properties. Inline code and links wrap on narrow screens.
- Title is optional and bold. Without projected content, `title` and `description` render normally. With projected content, the existing whole-content precedence applies: put a custom title inside the projected content if needed.
- Rich text uses Angular content projection, preserving bindings and event handlers. No `innerHTML`, HTML strings or sanitization bypass is used. `lineClamp` remains limited to the built-in description.
- Actions and closing retain their existing behavior. Tips are ordinary notes, including warning/error colors; use the default banner for assertive alerts.
- Omitting `type` preserves the existing banner layout, size, spacing, status/alert semantics and content priority. No consumer migration is needed.

### Tip code samples

```html
<!-- One line, no title -->
<sd-inform type="tip" color="info">Bấm Thêm bộ lọc để chọn trường.</sd-inform>

<!-- Optional title with wrapping description -->
<sd-inform type="tip" color="info" title="Tìm kiếm chính xác hơn"
  description="Chọn trường, nhập giá trị và kết hợp các điều kiện phù hợp trước khi tìm kiếm."></sd-inform>

<!-- Rich text and Angular bindings remain inline -->
<sd-inform type="tip" color="info">
  Bấm <strong>{{ filterAction }}</strong> để chọn trường.
  Bật <code>showSavedFilters</code> để lưu bộ lọc.
  <a href="/help/filters">Xem hướng dẫn</a>.
</sd-inform>

<!-- Core colors; each remains role=note -->
<sd-inform type="tip" primary>Primary guidance.</sd-inform>
<sd-inform type="tip" secondary>Secondary guidance.</sd-inform>
<sd-inform type="tip" info>Information.</sd-inform>
<sd-inform type="tip" success>Successful input guidance.</sd-inform>
<sd-inform type="tip" warning>Formatting guidance.</sd-inform>
<sd-inform type="tip" error>Recovery guidance.</sd-inform>

<!-- In a form and above a table; use the existing Core input/table APIs -->
<form (submit)="$event.preventDefault()">
  <sd-input label="Tên bộ lọc" [(model)]="filterName"></sd-input>
  <sd-inform type="tip" info>Đặt tên dễ nhớ cho <strong>{{ filterName }}</strong>.</sd-inform>
</form>
<sd-inform type="tip" info>Bấm tiêu đề cột để <strong>sắp xếp</strong>.</sd-inform>
<sd-table [option]="tableOption"></sd-table>
```

The form/table sample also imports `SdInput` from `@sdcorejs/angular/forms/input` and `SdTable` from `@sdcorejs/angular/components/table`. The showcase supplies working component state and a typed local `SdTableOption` alongside the full example source.

## Examples

```html
<sd-inform
  error
  title="Không tải được dữ liệu"
  description="Máy chủ không phản hồi. Vui lòng thử lại."
  actionLabel="Thử lại"
  closable
  (sdAction)="reload()"
  (sdClosed)="onDismiss()">
</sd-inform>

<sd-inform warning title="Chế độ chỉ đọc" description="Bạn không có quyền chỉnh sửa.">
  <button sdInformAction>Yêu cầu quyền</button>
</sd-inform>

<sd-inform warning closable title="Phiên làm việc sắp hết hạn"></sd-inform>

<sd-inform error closable title="Fallback title" description="Fallback body" actionLabel="Fallback action">
  <strong>Không thể lưu bản nháp</strong>
  <span>Kiểm tra kết nối rồi thử lại.</span>
  <button type="button" (click)="retry()">Thử lại</button>
</sd-inform>

<sd-inform info title="Điều khoản" [description]="longText" [lineClamp]="3"></sd-inform>
```

## Anti-patterns
- Using `<sd-inform>` as a transient toast — it is persistent and page-anchored; for fire-and-forget notifications use `NotifyService`
- Hardcoding user-facing strings into `title` / `description` / `actionLabel` — route them through `I18nService`
- Cramming a long sentence into `title` — keep the title short and put the detail in `description`
- Using it where a short inline status fits — use `<sd-badge>` instead

## Related
- `<sd-badge>` — short inline status / label indicator
- `NotifyService` — transient toast notifications
- `<sd-modal>` / `ConfirmService` — blocking confirmation dialogs

## Presentation refresh

- Status icons sit in a decorative 32px circular background. Borders/backgrounds use quiet theme tints; title and body use text tokens. SdIcon respects the configured Material/Lucide renderer.
- A blank custom icon uses the contextual default; hideIcon still removes the tile.
- actionLabel renders SdButton size sm, type light, with native type button; sdAction, sdClosed, projected actions and line-clamp behavior are preserved.
- Below 600px, close/action targets are at least 44px and long text wraps.
