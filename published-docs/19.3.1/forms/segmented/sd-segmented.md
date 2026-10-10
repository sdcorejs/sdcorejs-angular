# sd-segmented

Segmented control. `SdSegmentedComponent` is a compact choice control. The consumer owns the content changed by a choice: it does not create tabs or content panels. Use `SdTabGroup` for tabbed content.

```ts
import { SdSegmentedComponent, SdSegmentedItem } from '@sdcorejs/angular/forms/segmented';

readonly views: readonly SdSegmentedItem<'list' | 'grid'>[] = [
  { value: 'list', label: 'List', prefixIcon: 'view_list' },
  { value: 'grid', label: 'Grid', prefixIcon: 'grid_view' },
];
```

```html
<sd-segmented label="View" [items]="views" [(model)]="view" (sdChange)="onViewChange($event)" />
```

Import the standalone control directly, or use `SdFormsModule`. The root and forms barrels also export its public types and template directive.

| Input         | Type                                     | Default            | Purpose                                                                                                     |
| ------------- | ---------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `items`       | `readonly SdSegmentedItem<T>[]`          | `[]`               | Unique primitive `value`, label, optional `prefixIcon`/`suffixIcon`, `fontSet`, `iconOnly`, and `disabled`. |
| `model`       | `T \| readonly T[] \| null \| undefined` | `null`             | Single value; an array in multiple mode.                                                                    |
| `option`      | `SdSegmentedOption`                      | `{}`               | `multiple`, `allowEmpty`, `orientation`, and `stretch`.                                                     |
| `label`       | `string`                                 | —                  | Visible and accessible group label.                                                                         |
| `ariaLabel`   | `string`                                 | localized fallback | Accessible name when no visible label is supplied.                                                          |
| `size`        | `sm \| md \| lg`                         | `md`               | Compact, normal, or large appearance.                                                                       |
| `color`       | `Color`                                  | `primary`          | Existing Core UI semantic palette.                                                                          |
| `type`        | `light \| fill \| outline`               | `light`            | Appearance of the track and selected choice (`SdSegmentedType`). Behavior is identical for every type.      |
| `disabled`    | `boolean`                                | `false`            | Disables interaction and the registered control.                                                            |
| `readonly`    | `boolean`                                | `false`            | Blocks choice changes while retaining form value and keyboard focus.                                        |
| `loading`     | `boolean`                                | `false`            | Announces loading and blocks choice changes without disabling the form control.                             |
| `required`    | `boolean`                                | `false`            | Adds the existing Angular required validator.                                                               |
| `validator`   | `ValidatorFn \| readonly ValidatorFn[]`  | —                  | Consumer validators.                                                                                        |
| `inlineError` | `string`                                 | —                  | Consumer validation error, visible after interaction or form touch.                                         |
| `form`        | existing Core UI form parent             | —                  | Register with `FormGroup`, `NgForm`, or a form wrapper.                                                     |
| `name`        | `string`                                 | generated          | Name of the registered control.                                                                             |
| `autoId`      | `string`                                 | —                  | Stable automation prefix.                                                                                   |

`T` is a string, finite number, or boolean. Values use exact equality; `1` and `'1'` differ. Replace item arrays and `option` objects immutably and keep values unique; mutating the same object does not notify signal inputs. Every item needs a non-empty accessible `label`, including icon-only items. Invalid items show a configuration error and cannot change the value. Removing an option or disabling a selected option preserves the consumer's value. When changing `multiple`, update the model to the appropriate shape.

`modelChange` is the signal-model output. `sdChange` carries the same value on a user change or a registered form-control change. Programmatic model writes are quiet. Re-selecting the active single choice is a no-op unless `allowEmpty` is enabled, when it clears to `null`. Multiple selection emits a fresh array in the order of `items`; hidden or removed values already in the model are preserved after known choices.

The model and event types are always `SdSegmentedModel<T>` (`T | readonly T[] | null | undefined`), because mode is a runtime option. An `sdChange` handler must accept or narrow that union even when its consumer uses only single mode.

```html
<sd-segmented label="Channels" [items]="channels" [option]="{ multiple: true }" [(model)]="selectedChannels" />
<sd-segmented [form]="form" name="view" label="View" [items]="views" required [(model)]="view" />
```

`type` changes appearance only, using the selected `color`:

- `light` (default): neutral track; the selected choice is raised on the surface with strong accent text.
- `fill`: neutral track; the selected choice is solid `color` with its contrast text.
- `outline`: outlined transparent track; the selected choice has an accent border and a light tint.

```html
<sd-segmented label="View" type="fill" color="info" [items]="views" [(model)]="view" />
<sd-segmented label="View" type="outline" color="success" size="sm" [items]="views" [(model)]="view" />
```

Every type supports all sizes, orientations, `stretch`, single/multiple selection, item templates, loading, disabled, readonly, validation errors, and light/dark themes. Selection is also exposed through `aria-checked` and a heavier label, not by colour alone.

The control exposes `formControl` for inspection and `reValidate()` for existing Core UI form flows. `required` and `inlineError` stay reactive when the parent calls `markAllAsTouched()`.

To customize choice content, import `SdSegmentedItemTemplateDirective`. Keep interactive controls outside this template because it is rendered inside a choice button.

```html
<sd-segmented label="View" [items]="views" [(model)]="view">
  <ng-template [sdSegmentedItemTemplate]="views" let-item let-selected="selected">
    {{ item.label }} @if (selected) { <span aria-hidden="true">✓</span> }
  </ng-template>
</sd-segmented>
```

Single mode exposes a radio group. Arrow keys move and select, Home/End select the first/last enabled choice, and Tab enters at the active enabled choice. Focus navigation inside the group retains the current tab stop; after focus leaves, the next entry follows the current selection, including external model/form writes. Multiple mode exposes checkbox choices: arrows move focus, Space/Enter toggles. Disabled choices are skipped; left/right respects RTL. Icon-only items retain their label as the accessible name. Empty/loading states are announced. The group can scroll inside narrow containers and never requires the consumer to attach content panels. When a key moves focus, the control scrolls only its own track, instantly and on the active axis, just enough to show the whole focused choice and its final focus ring. It reserves the ring defined by `--sd-focus-ring-width` and `--sd-focus-ring-offset`, so a consumer transition (for example reduced-motion CSS) that is still settling does not clip it. It does not scroll the page or ancestors, and it never takes focus back once the user has moved it elsewhere.
