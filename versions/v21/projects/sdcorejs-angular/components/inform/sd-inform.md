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
| `[sdInformAction]` | Custom action area, marked by `SdInformActionDirective` (exported from the same entry point). When a projected element carries this attribute, it **replaces** the default `actionLabel` link. |

## Auto icon map
Applied when `icon` is falsy and `hideIcon` is `false`:

| Effective color | Icon |
| --- | --- |
| `error` | `error` |
| `warning` | `warning` |
| `success` | `check_circle` |
| `info` | `info` |
| `primary` | `info` |
| `secondary` | `info` |

## Behavior
- **Uncontrolled close**: clicking `×` sets an internal `dismissed` signal and the banner removes itself from the DOM, in addition to emitting `sdClosed`. There is no `[open]` input to re-show it — recreate / re-render the component to bring it back.
- **Line-clamp toggle**: when `lineClamp` is set, the body is clamped to N lines. Overflow is measured from the body element after render (and re-measured when `description` / `lineClamp` / expanded state change). The toggle appears once the body has overflowed and stays visible while expanded so the user can collapse again.
- **ARIA role**: `error` / `warning` render with `role="alert"` (assertive); other colors use `role="status"` (polite). Decorative icons (status icon + close `×`) are `aria-hidden`.
- **Presentational only**: the component does not position itself. The consumer places it (e.g. sticky top of a page or form).

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
