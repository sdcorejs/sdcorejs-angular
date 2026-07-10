# `<sd-button>`

**Type**: Component
**Selector**: `sd-button`
**Import path**: `@sdcorejs/angular/components/button` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdButton extends SdBaseSecureComponent`
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
| `color` | `Color \| 'black'` | `'secondary'` | Material color tokens (`primary`, `accent`, `warn`, `success`, `info`, `secondary`, ...). `black` is a button-only option. |
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
None — text comes from `title` input. The button is intentionally not slot-based to enforce consistent typography.

## Visual cues (helps agent map screenshots → component)
- A rectangular pill button with rounded corners; height varies by `size`
- `fill` variant: solid background in `color`, white text
- `light` variant: tinted background (10% alpha of `color`), `color` text — DEFAULT, what most buttons look like
- `outline` variant: transparent background, 1px border in `color`, `color` text
- `text` variant: no background, no border, just text in `color`
- When `prefixIcon` only and no `title` → square icon-only button (`.c-square` class)
- Spinner mode (loading): replaces prefix icon with a small Material spinner

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
