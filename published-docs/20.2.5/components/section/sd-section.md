# `<sd-section>` and `<sd-section-item>`

`sd-section` is the standard card-style wrapper for related fields, tables, and detail blocks. `sd-section-item` is the compact label/value row intended to live inside a section body.

## Import

```ts
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
```

## `<sd-section>` Inputs

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string \| null \| undefined` | `undefined` | Header title. |
| `subTitle` | `string \| null \| undefined` | `undefined` | Optional secondary line below the title. |
| `icon` | `string \| null \| undefined` | `undefined` | Material icon name shown before the title. |
| `iconColor` | `Color` | `'primary'` | Icon color token. |
| `collapsed` | `boolean` model | `false` | Two-way bindable through `[(collapsed)]`. |
| `collapsible` | `boolean` | `false` | Enables header click collapse. Bare attribute = true. |
| `hideHeader` | `boolean` | `false` | Hides the header row. Bare attribute = true. |

## `<sd-section>` Slots

| Selector | Where it renders |
| --- | --- |
| `[sdHeaderLeft]` | Header left. Replaces the default icon/title/subtitle block. |
| `[sdHeaderRight]` | Header right, before the collapse chevron. |
| (default) | Body/content. Padding is `0` by default. |
| `[sdFooterLeft]` | Footer left action group. |
| `[sdFooterRight]` | Footer right action group. |

Section header/footer padding is `8px 16px`. Section body padding is `0`. Use `sd-section-item` rows or add your own wrapper for free-form content. The footer is hidden when both footer slots are empty.

## `<sd-section-item>` Inputs

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | `string` | required | Left label text. |
| `labelWidth` | `string` | `'150px'` | Width of the label column. |

Each item row uses `8px 16px` padding and projects the value in the default slot.

## Examples

```html
<sd-section icon="info" title="General info" subTitle="Basic employee profile">
  <sd-section-item label="Name">Nguyen Van An</sd-section-item>
  <sd-section-item label="Email">an.nv@onemount.com</sd-section-item>

  <sd-button sdFooterLeft type="text" title="History"></sd-button>
  <sd-button sdFooterRight type="fill" color="primary" title="Save"></sd-button>
</sd-section>
```

```html
<sd-section [hideHeader]="true">
  <div class="section-body">
    Free-form content adds its own padding.
  </div>
</sd-section>
```

## Accessibility

- The header is **never** `aria-hidden`. It holds the title/subtitle and everything projected into `[sdHeaderLeft]` / `[sdHeaderRight]` (usually real buttons) — hiding it erased all of that from the accessibility tree while the region still took clicks.
- When `collapsible` is set, a localized native `<button>` exposes the collapse action through `aria-label`, `aria-expanded`, `aria-controls`, and a visible focus ring. Native Enter/Space behavior works without turning the projected header container into a nested interactive control.
- When `collapsible` is **not** set, the header stays non-interactive and no collapse trigger is rendered.
- Header whitespace remains clickable for compatibility. Clicks from projected links, buttons, form controls, editable content, roles, or explicit tab stops do not bubble into a second collapse action.
- Collapsed body content is removed from the DOM, so focusable descendants are never left inside an `aria-hidden` container.
