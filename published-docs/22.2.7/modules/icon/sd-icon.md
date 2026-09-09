# SdIcon

`SdIcon` is the Core UI icon facade for `@sdcorejs/angular`.

It defaults to Angular Material outlined icons, so existing icon names continue to work. Apps can switch the default font set to Material filled, Material outlined, or Lucide through `provideSdIcon`.

## Provider

```ts
import { provideSdIcon } from '@sdcorejs/angular/modules/icon';
import { LucidePlus, LucideSave, LucideTrash2 } from '@lucide/angular';

export const appConfig = {
  providers: [
    provideSdIcon({
      defaultFontSet: 'lucide',
      lucideIcons: [LucidePlus, LucideSave, LucideTrash2],
    }),
  ],
};
```

## Usage

```html
<sd-icon name="save"></sd-icon>
<sd-icon name="save" fontSet="material-icons-outlined"></sd-icon>
<sd-icon name="save" fontSet="material-icons"></sd-icon>
<sd-icon name="add" fontSet="lucide"></sd-icon>
<sd-icon name="search" size="sm"></sd-icon>
<sd-icon name="search" size="28px"></sd-icon>
```

`SdIcon` ships default aliases in both directions:

- Material names map to Lucide when the active set is `lucide`, for example `add -> plus`, `delete -> trash-2`, and `more_vert -> ellipsis-vertical`.
- Lucide names map back to Material when the active set is `material-icons` or `material-icons-outlined`, for example `plus -> add`, `trash-2 -> delete`, and `ellipsis-vertical -> more_vert`.

Material legacy outline names such as `info_outline`, `error_outline`, and `lock_outline` are also canonicalized to `info`, `error`, and `lock` for the default outlined font set.

Available font sets:

- `material-icons`: Material filled icon font.
- `material-icons-outlined`: Material outlined icon font, the default.
- `lucide`: Lucide SVG icons from `@lucide/angular`.

`set` is kept as a deprecated compatibility alias. Prefer `fontSet` for new code.

`size` uses `Size` from `@sdcorejs/utils/models`: `sm`, `md`, or `lg`. It also accepts a CSS size string such as `18px` or `1.25rem` for one-off cases.

`SdButton` uses `SdIcon` for `prefixIcon` and `suffixIcon`. Use `fontSet="material-icons"`, `fontSet="material-icons-outlined"`, or `fontSet="lucide"` on a button for per-component migration, or set `defaultFontSet: 'lucide'` in `provideSdIcon` for app-level migration.

## Inside Material containers (menu, list, button)

Material's base CSS targets the `.mat-icon` element directly — inside a menu item it forces `width`/`height` to `--mat-menu-item-icon-size` (24px) and adds `margin-right: var(--mat-menu-item-spacing, 12px)`. In an `<sd-icon>` that element is the *inner* glyph, so those rules used to blow the glyph past the host box (which clips it) and shift it left: the icon rendered cropped and crowding the label. Lucide never hit this at all, because its SVG is not a `.mat-icon` — the two sets drifted apart.

`SdIcon` now pins the glyph to the host box and zeroes that margin, so the rendered size is always `size` / `--sd-icon-size` regardless of the Material container, and both font sets behave identically. Host components no longer need `margin: 0 !important` or `overflow: hidden` guards around a menu icon.

Spacing between a leading icon and its label belongs to the menu item, not the glyph. `sd-core.scss` gives a leading `<sd-icon>` in a `mat-menu-item` the Material spacing by default:

```scss
:where(.mat-mdc-menu-item > sd-icon:first-child),
:where(.mat-mdc-menu-item > .mat-mdc-menu-item-text > sd-icon:first-child) {
  margin-right: var(--mat-menu-item-spacing, 12px);
}
```

It sits in `:where()`, so its specificity is zero: a menu that lays its own row out — a flex wrapper with `gap`, or its own `margin-right` on the icon — wins with any ordinary selector, no `!important` needed. A menu that supplies spacing through `gap` should set `margin-right: 0` on the icon so the two do not stack.
