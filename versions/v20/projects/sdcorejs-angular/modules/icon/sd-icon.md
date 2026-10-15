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

## Icon tile shape

The decorative icon tile of `<sd-section>` (header), `<sd-inform>`, `<sd-data-state>`, `SdNotifyService` toasts and `SdConfirmService` dialogs takes one of three shapes:

| `SdIconShape` | Result |
| --- | --- |
| `'square'` (default) | Soft background, corner radius `var(--sd-icon-shape-radius, var(--sd-radius-8, 8px))`. |
| `'circle'` | Soft background, fully round (the look before this option existed). |
| `'none'` | No background; the icon keeps its color and the tile keeps its size, so neighbouring text does not move. |

Precedence: the instance `iconShape` input/option, then `provideSdIcon({ defaultShape })`, then `'square'`.

```ts
import { provideSdIcon, type SdIconShape } from '@sdcorejs/angular/modules/icon';

export const appConfig = {
  providers: [provideSdIcon({ defaultShape: 'circle' })], // keep round tiles app-wide
};
```

```html
<sd-section title="Hồ sơ" icon="person" iconShape="none"></sd-section>
<sd-inform info title="Đã lưu" iconShape="circle"></sd-inform>
```

- `provideSdIcon` returns `EnvironmentProviders` (app or route level). To change the default for one component subtree, provide the token directly: `{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultShape: 'none' }) }`. Toasts and confirm dialogs are created from the root injector, so they only see the app-level value.
- Build hand-made `SD_ICON_CONFIGURATION` values with `resolveSdIconConfig(...)`; `ISdIconResolvedConfiguration` requires `defaultShape`.
- Override the square radius with the CSS custom property `--sd-icon-shape-radius` (for example `:root { --sd-icon-shape-radius: 4px; }`).
- Each tile carries `data-icon-shape="square|circle|none"` for styling and tests.

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

## Data-type icons

One shared icon per data type, used by the generic module (configuration rows) and the form builder palette, so the same type looks the same everywhere.

| Export | Purpose |
| --- | --- |
| `SdDataTypeIconKey` | The 22 keys: `string`, `string-list`, `email`, `phone`, `url`, `password`, `text`, `number`, `integer`, `decimal`, `currency`, `percent`, `boolean`, `date`, `date-list`, `datetime`, `time`, `enum`, `enum-multiple`, `relation`, `json`, `file`. |
| `SD_DATA_TYPE_ICON` | Material icon name of each key. |
| `SD_DATA_TYPE_LABEL` | i18n key of each type name, `core.data-type.<key>`; translate it with `SdTranslatePipe` or `I18nService.t`. |
| `sdDataTypeIcon(key)` | Icon of a key; an empty or unknown key returns `'tune'`, the fallback used by query-bar and query-builder. |
| `SD_DATA_TYPE_LUCIDE_ICONS` | Lucide registrations of every data-type icon. |

```html
<sd-icon [name]="sdDataTypeIcon('currency')" [ariaLabel]="'core.data-type.currency' | sdTranslate"></sd-icon>
```

The keys follow data semantics, not form widgets: each consumer maps its own model to a key. For example, the generic module maps `dataType` + `format` + `multiple`.

`SD_DEFAULT_LUCIDE_ALIASES` maps every data-type Material name to its Lucide icon. The Lucide target follows the Material glyph, so `schedule` and `access_time` both render `clock`.

These aliases also apply to existing uses of the same names under the Lucide renderer. For example, `schedule` in `sd-time` and `sd-datetime` now renders `clock`.

`@lucide/angular` renders registered icons only, so apps that use the Lucide renderer opt in:

```ts
import { provideSdIcon, SD_DATA_TYPE_LUCIDE_ICONS } from '@sdcorejs/angular/modules/icon';

provideSdIcon({ defaultFontSet: 'lucide', lucideIcons: [...SD_DATA_TYPE_LUCIDE_ICONS /*, app icons */] });
```

Material apps need nothing. `number` uses the Material name `numbers`, not `tag`, because the default Material alias turns `tag` into `local_offer`.

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

`warning_amber` and `report_gmailerrorred` preserve explicit outline glyphs in Material and map to `triangle-alert` and `circle-alert` in Lucide. These names are used by the default warning/error status icons in `SdInform`.
