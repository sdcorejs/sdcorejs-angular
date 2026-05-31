# sd-operator

Compact operator picker. Collapsed it shows only the current operator's icon with a tooltip;
clicking opens a `matMenu` listing the allowed operators (icon + label + raw code).

## API

| Input        | Type                     | Default | Notes                                              |
| ------------ | ------------------------ | ------- | -------------------------------------------------- |
| `[(model)]`  | `Operator \| undefined`  | —       | Two-way bound current operator.                    |
| `operators`  | `Operator[]`             | `[]`    | Allowed operators, in display order.               |
| `disabled`   | `boolean`                | `false` | Disables the trigger (menu cannot open).           |
| `autoId`     | `string`                 | —       | Emitted as `data-autoId` for e2e selectors.        |

Icons and labels are resolved from the canonical `OPERATORS` table in `@sdcorejs/utils`
(icon = inline SVG, label = i18n key via `I18nService`). Operators not found in `OPERATORS`
are skipped.

## Usage

```html
<sd-operator [(model)]="operator" [operators]="['EQUAL', 'CONTAIN', 'NULL']" />
```
