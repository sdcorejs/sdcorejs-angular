# `<sd-button>`

**Type**: Component
**Selector**: `sd-button`
**Import path**: `@sdcorejs/angular/components/button` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdButton extends SdBaseSecureComponent`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Standard action button â€” used everywhere a user triggers an action (save, cancel, approve, navigate, ...). Wraps Angular Material with SDCoreJS variants, sizing, and built-in icon/loading/permission support.

## When to use
- Submit forms, trigger CRUD actions, confirm dialogs, toolbar actions
- Navigate within app (combine with `[routerLink]` on the host)
- Open a modal, drawer, or panel
- Bulk action on selected list rows
- Header `headerLeft` / `headerRight` slot of `<sd-page>`

## When NOT to use
- For pure text links â†’ use `<sd-anchor>` instead
- For icon-only "menu launchers" inside complex toolbars â†’ use `<sd-quick-action>` instead (it adds a popover)
- For tab switchers â†’ use `<sd-tab>` instead
- For status badges â†’ use `<sd-badge>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Optional. Generates `data-autoId="components-button-<value>"` for E2E selectors. |
| `type` | `'fill' \| 'light' \| 'outline' \| 'link'` | `'light'` | Visual variant. `fill`=primary action, `light`=default, `outline`=secondary, `link`=text-style. |
| `color` | `Color` | `'secondary'` | Material color tokens (`primary`, `accent`, `warn`, `success`, `info`, `secondary`, â€¦). |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Height: sm â‰ˆ 28px, md â‰ˆ 36px, lg â‰ˆ 44px. |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'` | Sets the underlying `<button type="...">`. Use `'submit'` only when the button is INSIDE a `<form>`. |
| `title` | `string` | `undefined` | Visible label. Required unless icon-only. |
| `width` | `string` | `undefined` | Optional CSS width override (e.g. `'160px'`, `'100%'`). |
| `tooltip` | `string` | `undefined` | Hover tooltip (Material tooltip, position above). |
| `prefixIcon` | `string` | `undefined` | Icon name (Material font set). Renders left of title. |
| `suffixIcon` | `string` | `undefined` | Icon name. Renders right of title. |
| `fontSet` | `MaterialIconFontSet` | `DefaultMaterialIconFontSet` | Override Material icon font set (rarely needed). |
| `disabled` | `boolean` | `false` | Disables clicks AND adds `.sd-disabled` host class. |
| `loading` | `boolean` | `false` | Shows spinner instead of prefix icon; clicks suppressed. |
| `block` | `boolean` | `false` | Stretches to 100% width of parent (`.sd-block` host class). |

> **Coerce note**: `disabled`, `loading`, `block` use `booleanAttribute` transform â€” bare attribute presence (e.g. `<sd-button disabled>`) is treated as `true`.

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `click` | `Event` | Throttled to 300ms (leading edge) and suppressed when `disabled` or `loading` is true. Click events are also intercepted in capture phase to prevent re-emission to parents. |

## Content projection (slots)
None â€” text comes from `title` input. The button is intentionally not slot-based to enforce consistent typography.

## Visual cues (helps agent map screenshots â†’ component)
- A rectangular pill button with rounded corners; height varies by `size`
- `fill` variant: solid background in `color`, white text
- `light` variant: tinted background (10% alpha of `color`), `color` text â€” DEFAULT, what most buttons look like
- `outline` variant: transparent background, 1px border in `color`, `color` text
- `link` variant: no background, no border, just text in `color`
- When `prefixIcon` only and no `title` â†’ square icon-only button (`.c-square` class)
- Spinner mode (loading): replaces prefix icon with a small Material spinner

## Permission gating
The button itself does NOT enforce permission â€” wrap with the `*sdPermission` directive:

```html
<sd-button
  *sdPermission="'<MODULE>_C_<ENTITY>_CREATE'; sdPermissionKey: '<module>'"
  title="Táº¡o má»›i" type="fill" color="primary" prefixIcon="add"
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
  title="LÆ°u"
  prefixIcon="save"
  [disabled]="!form.valid || saving()"
  (click)="onSave()">
</sd-button>
```

### 2. Icon-only quick action in a list row
```html
<sd-button
  type="link" color="primary" size="sm"
  prefixIcon="edit"
  tooltip="Chá»‰nh sá»­a"
  (click)="onEdit(row)">
</sd-button>
```

### 3. Block-level cancel button at the bottom of a side-drawer
```html
<sd-button
  type="outline" color="secondary"
  title="Há»§y" [block]="true"
  (click)="onCancel()">
</sd-button>
```

### 4. Loading state during async submit
```html
<sd-button
  type="fill" color="primary"
  title="Gá»­i duyá»‡t" prefixIcon="send"
  [loading]="submitting()"
  (click)="onSubmitForApproval()">
</sd-button>
```

## Anti-patterns
- âŒ `<sd-button (click)="navigate()">` for navigation â€” use `<sd-anchor>` so right-click "open in new tab" works
- âŒ Adding `[routerLink]` directly on `<sd-button>` host â€” better is wrapping the button in an `<a [routerLink]>` OR using `<sd-anchor>`
- âŒ Manually toggling visibility based on permission inside the parent component â€” use `*sdPermission` directive instead
- âŒ Using `disabled` to hide a button â€” use `*sdPermission` for permission gating, `*ngIf` for conditional rendering, `disabled` ONLY for transient states (form invalid, loading)
- âŒ Stacking multiple `<sd-button type="fill">` next to each other â€” only ONE primary action per region; the rest should be `light` or `outline`
- âŒ `htmlType="submit"` outside of a `<form>` â€” clicks won't behave specially, but it confuses readers

## Related
- `<sd-anchor>` â€” text/link variant (use for navigation)
- `<sd-quick-action>` â€” icon-only button with popover menu
- `<sd-badge>` â€” status indicator (not clickable)
- `<sd-tab>` â€” tab-bar selector
- `*sdPermission` directive â€” for permission gating

