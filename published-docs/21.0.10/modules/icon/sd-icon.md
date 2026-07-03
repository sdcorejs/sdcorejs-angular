# SdIcon

`SdIcon` is the Core UI icon facade for `@sdcorejs/angular`.

It defaults to Angular Material outlined icons, so existing icon names continue to work. Apps can switch the default icon set to Material filled or Lucide through `provideSdIcon`.

## Provider

```ts
import { provideSdIcon } from '@sdcorejs/angular/modules/icon';
import { LucidePlus, LucideSave, LucideTrash2 } from '@lucide/angular';

export const appConfig = {
  providers: [
    provideSdIcon({
      defaultSet: 'lucide',
      lucideIcons: [LucidePlus, LucideSave, LucideTrash2],
    }),
  ],
};
```

## Usage

```html
<sd-icon name="save"></sd-icon>
<sd-icon name="save" set="material-icons-outlined"></sd-icon>
<sd-icon name="save" set="material-icons"></sd-icon>
<sd-icon name="add" set="lucide"></sd-icon>
<sd-icon name="search" size="sm"></sd-icon>
<sd-icon name="search" size="28px"></sd-icon>
```

`SdIcon` ships default aliases in both directions:

- Material names map to Lucide when the active set is `lucide`, for example `add -> plus`, `delete -> trash-2`, and `more_vert -> ellipsis-vertical`.
- Lucide names map back to Material when the active set is `material-icons` or `material-icons-outlined`, for example `plus -> add`, `trash-2 -> delete`, and `ellipsis-vertical -> more_vert`.

Material legacy outline names such as `info_outline`, `error_outline`, and `lock_outline` are also canonicalized to `info`, `error`, and `lock` for the default outlined font set.

Available sets:

- `material-icons`: Material filled icon font.
- `material-icons-outlined`: Material outlined icon font, the default.
- `lucide`: Lucide SVG icons from `@lucide/angular`.

`fontSet` still exists as an escape hatch when an app explicitly needs another Material font set such as round or sharp.

`size` uses `Size` from `@sdcorejs/utils/models`: `sm`, `md`, or `lg`. It also accepts a CSS size string such as `18px` or `1.25rem` for one-off cases.

`SdButton` uses `SdIcon` for `prefixIcon` and `suffixIcon`. Use `iconSet="material-icons"`, `iconSet="material-icons-outlined"`, or `iconSet="lucide"` on a button for per-component migration, or set `defaultSet: 'lucide'` in `provideSdIcon` for app-level migration.
