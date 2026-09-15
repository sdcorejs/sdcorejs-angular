# `<sd-button>`

**Type**: Component
**Selector**: `sd-button`
**Import path**: `@sdcorejs/angular/components/button` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdButton` (implements `OnInit`, `OnDestroy`)
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Standard action button — used everywhere a user triggers an action (save, cancel, approve, navigate, ...). Wraps Angular Material with SDCoreJS variants, sizing, and built-in icon/loading/permission support.

## When to use
- Submit forms, trigger CRUD actions, confirm dialogs, toolbar actions
- Navigate within app (combine with `[routerLink]` on the host)
- Open a modal, drawer, or panel
- Bulk action on selected list rows
- Header `headerLeft` / `headerRight` slot of `<sd-page>`

## When NOT to use
- For pure text links → use `<sd-anchor>` instead
- For icon-only "menu launchers" inside complex toolbars → use `<sd-quick-action>` instead (it adds a popover)
- For tab switchers → use `<sd-tab>` instead
- For status badges → use `<sd-badge>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Optional. Generates `data-autoId="components-button-<value>"` for E2E selectors. |
| `type` | `'fill' \| 'light' \| 'outline' \| 'text'` | `'light'` | Visual variant. `fill`=primary action, `light`=default, `outline`=secondary, `text`=Material text button style. |
| `color` | `SdButtonColor` = `Color \| 'black'` | `'secondary'` | `Color` (from `@sdcorejs/utils/models`) is exactly `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'`. `'black'` is a button-only extra. There is no `accent` or `warn` — those are Angular Material's palette names, not SDCoreJS tokens. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Height: sm = 32px, md = 40px, lg = 48px. Typography follows the underlying Angular Material button. |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'` | Sets the underlying `<button type="...">`. Use `'submit'` only when the button is INSIDE a `<form>`. |
| `title` | `string` | `undefined` | Visible label. Required unless icon-only. |
| `width` | `string` | `undefined` | Optional CSS width override (e.g. `'160px'`, `'100%'`). |
| `tooltip` | `string` | `undefined` | Hover tooltip (Material tooltip, position above). |
| `prefixIcon` | `string` | `undefined` | Icon name (Material font set). Renders left of title. |
| `suffixIcon` | `string` | `undefined` | Icon name. Renders right of title. |
| `fontSet` | `SdIconSet` | `undefined` | Optional icon set override passed to `<sd-icon>`. Leave unset to inherit `provideSdIcon({ defaultFontSet })`. |
| `disabled` | `boolean` | `false` | Disables clicks AND adds `.sd-disabled` host class. |
| `loading` | `boolean` | `false` | Shows spinner instead of prefix icon; clicks suppressed. |
| `block` | `boolean` | `false` | Stretches to 100% width of parent (`.sd-block` host class). |

> **Coerce note**: `disabled`, `loading`, `block` use `booleanAttribute` transform — bare attribute presence (e.g. `<sd-button disabled>`) is treated as `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `click` | `Event` | Throttled to 300ms (leading edge) and suppressed when `disabled` or `loading` is true. Click events are also intercepted in capture phase to prevent re-emission to parents. |

## Content projection (slots)
`title` has priority; otherwise projected non-interactive content supplies the trigger label. `sd-button-item` and `sd-button-item-divider` define actions rendered in the Action Popover, outside the native trigger.

## Visual cues (helps agent map screenshots → component)
- A rectangular pill button with rounded corners; height varies by `size`
- `fill` variant: solid background in `color`, white text
- `light` variant: tinted background (10% alpha of `color`), `color` text — DEFAULT, what most buttons look like
- `outline` variant: transparent background, 1px neutral border from the theme, `color` text. Hover uses the Material state layer; border width stays 1px.
- `text` variant: no background, no border, just text in `color`
- A single `prefixIcon` or `suffixIcon` without `title` renders one centered icon in a square footprint (`.c-square`); the corner shape still follows the Material theme.
- Spinner mode (loading): replaces prefix icon with a small Material spinner

## Theme and compact layout

- Keeps Material 3 corner shape and label typography. No pill-radius override is applied.
- Icon/text spacing is local to the button: 6px for `sm`, 8px for `md`/`lg`. Prefix, suffix and loading layouts do not depend on global margin utilities.
- Outline uses `--sd-border-strong` (falling back to Material `--mat-sys-outline`). Disabled text/background use `--sd-disabled-text` / `--sd-disabled-bg` with existing-theme fallbacks. Outlined and text-style disabled actions stay transparent. The button itself is not faded with opacity. For secondary icon-only text buttons, disabled icons render at 50% opacity on top of the disabled color so their neutral gray is visibly distinct from enabled icons; the background stays transparent. This applies to prefix/suffix icons and Material/Lucide sets, without changing loading spinners or buttons with titles.
- Keyboard focus shows a 2px primary outline with a 2px offset. Hover preserves the native Material state layer and does not change button dimensions.
- Loading keeps the existing click suppression and semantic color. Spinner animation respects `prefers-reduced-motion`.
- Use `fill` + `primary` for the principal action, `outline` + `secondary` for secondary toolbar actions, and `text` for less prominent actions. Existing defaults stay unchanged.
- Desktop `sm` stays 32px; mobile hosts should keep enough space between controls and allow toolbar wrapping. There is no new `xs` size.

## Permission gating
The button itself does NOT enforce permission — wrap with the `*sdPermission` directive:

```html
<sd-button
  *sdPermission="'<MODULE>_C_<ENTITY>_CREATE'; sdPermissionKey: '<module>'"
  title="Tạo mới" type="fill" color="primary" prefixIcon="add"
  (click)="onCreate()">
</sd-button>
```

## Accessibility
- Always set `title` OR `tooltip` for icon-only buttons (screen reader fallback)
- `disabled` correctly sets `aria-disabled` via Material under the hood
- Throttling avoids accidental double-submit on rapid clicks
- **Focus ring**: the component clears the default outline (`&:focus { outline: none }`) so mouse users see no border, but restores a visible ring on `:focus-visible` (`2px solid var(--sd-primary)`, `outline-offset: 2px`). Keyboard users always see where focus is. Do not add a blanket `outline: none` in consumer styles without a `:focus-visible` replacement.

## Examples

### 1. Primary submit button in a form
```html
<sd-button
  htmlType="submit"
  type="fill" color="primary" size="sm"
  title="Lưu"
  prefixIcon="save"
  [disabled]="!form.valid || saving()"
  (click)="onSave()">
</sd-button>
```

### 2. Icon-only quick action in a list row
```html
<sd-button
  type="text" color="primary" size="sm"
  prefixIcon="edit"
  tooltip="Chỉnh sửa"
  (click)="onEdit(row)">
</sd-button>
```

### 3. Block-level cancel button at the bottom of a side-drawer
```html
<sd-button
  type="text" color="secondary"
  title="Hủy" [block]="true"
  (click)="onCancel()">
</sd-button>
```

### 4. Loading state during async submit
```html
<sd-button
  type="fill" color="primary"
  title="Gửi duyệt" prefixIcon="send"
  [loading]="submitting()"
  (click)="onSubmitForApproval()">
</sd-button>
```

## E2E test attributes

Rendered on the inner `<button mat-*-button class="c-button">` element (same anchor as `data-autoid`, one per the 4 button-type branches):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `components-button-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | input `disabled` |
| `data-loading` | `"true"` / `"false"` | input `loading` |

Selector example:

```ts
const btn = page.locator('[data-autoid="components-button-save"]');
await expect(btn).toHaveAttribute('data-loading', 'false');
```

## Anti-patterns
- ❌ `<sd-button (click)="navigate()">` for navigation — use `<sd-anchor>` so right-click "open in new tab" works
- ❌ Adding `[routerLink]` directly on `<sd-button>` host — better is wrapping the button in an `<a [routerLink]>` OR using `<sd-anchor>`
- ❌ Manually toggling visibility based on permission inside the parent component — use `*sdPermission` directive instead
- ❌ Using `disabled` to hide a button — use `*sdPermission` for permission gating, `*ngIf` for conditional rendering, `disabled` ONLY for transient states (form invalid, loading)
- ❌ Stacking multiple `<sd-button type="fill">` next to each other — only ONE primary action per region; the rest should be `text`, `light`, or `outline`
- ❌ `htmlType="submit"` outside of a `<form>` — clicks won't behave specially, but it confuses readers

## Related
- `<sd-anchor>` — text/link variant (use for navigation)
- `<sd-quick-action>` — icon-only button with popover menu
- `<sd-badge>` — status indicator (not clickable)
- `<sd-tab>` — tab-bar selector
- `*sdPermission` directive — for permission gating


## Action Popover

Import `SdButton`, `SdButtonItem`, `SdButtonItemDivider` từ `@sdcorejs/angular/components/button` vào standalone imports.

Có ít nhất một `sd-button-item` thì button tự mở Action Popover bằng CDK Overlay, không cần menu/trigger/template ref riêng. Chỉ divider không kích hoạt menu. `title` ưu tiên; khi không có title, projected content là label trigger. Label chỉ chứa nội dung trình bày, không chứa button/link/input tương tác.

```html
<sd-button color="primary" prefixIcon="edit">
  Chỉnh sửa
  <sd-button-item prefixIcon="check" color="success" (click)="approve()">Duyệt</sd-button-item>
  <sd-button-item prefixIcon="close" color="error" (click)="reject()">Từ chối</sd-button-item>
  <sd-button-item-divider />
  <sd-button-item prefixIcon="open_in_new" suffixIcon="chevron_right" (click)="openDetails()">Chi tiết</sd-button-item>
  @if (canDelete()) {
    <sd-button-item prefixIcon="delete" color="error" [disabled]="busy()" (click)="remove()">Xóa</sd-button-item>
  }
</sd-button>
```

| Item API | Type / mặc định | Ý nghĩa |
|---|---|---|
| color | SdButtonColor, không truyền = neutral | Cùng type/vocabulary với SdButton; destructive dùng error |
| prefixIcon / suffixIcon | string nullable | SdIcon renderer hiện có, icon trái/phải |
| fontSet | SdIconSet, default provider | Hỗ trợ provider/registry hiện có, gồm Material và Lucide |
| disabled | boolean, false | Không chạy và bỏ qua khi điều hướng bàn phím |
| tooltip | string nullable | Tooltip Material hiện có |
| autoId | string nullable | Giá trị data-autoid trên native menuitem, giữ nguyên chuỗi |
| click | Event output | Phát một lần sau khi popover đóng |
| projected content | nội dung trình bày | Label menuitem |

Divider có `title` tùy chọn để đặt heading cho nhóm; không focus/click. Item và divider là definitions, các native menuitem chỉ xuất hiện trong overlay. Các khối @if/@for cập nhật tự động; khi không còn item thì đóng popover và trở về button thường. Không thêm API visible/permission/loading; dùng điều kiện Angular và disabled.

Action trigger chỉ có chevron mặc định khi có label và không có suffixIcon. Icon-only trigger giữ footprint vuông và không thêm chevron. Trigger vẫn có ARIA menu/expanded/controls và mở/đóng qua click. Icon-only trigger nên có tooltip làm accessible name. ArrowDown/ArrowUp mở và focus item đầu/cuối; menu hỗ trợ Up/Down/Home/End, Enter/Space, Escape và Tab. Escape phục hồi focus; outside click giữ focus đích; menu không trap focus. Menu reposition khi scroll/resize, flip/fallback theo viewport, và dispose khi trigger bị destroy.

Với item children, trigger luôn dùng native type button và không phát normal click/submit. Không có item, `htmlType="submit"`/reset và click throttle hiện có giữ nguyên. `type` vẫn là fill/light/outline/text, không phải HTML type. Callback mở dialog được gọi sau khi đóng menu để không tranh focus.

### Mở Action Popover bằng hover

`openOnHover` là boolean input với `booleanAttribute`, mặc định `false`, chỉ áp dụng khi có `sd-button-item`. Dùng `<sd-button openOnHover>` hoặc `[openOnHover]="true"`; `openOnHover="false"` tắt tính năng.

Hover chuột mở ngay, không chuyển focus; rời nút và panel sẽ đóng sau 150 ms. Di chuyển sang panel hủy đóng. Click vẫn bật/tắt; phím mũi tên chuyển focus vào menu, Escape đóng và Tab tiếp tục điều hướng. Touch vẫn dùng click. Disabled/loading hoặc bỏ toàn bộ item sẽ đóng menu.
