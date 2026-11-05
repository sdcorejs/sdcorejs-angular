# `<sd-badge-picker>`

**Type**: Component (form control)
**Selector**: `sd-badge-picker`
**Import path**: `@sdcorejs/angular/components/badge` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdBadgePicker`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
A dropdown that picks the type, colour and icon of an `<sd-badge>` in one panel — for screens where users configure how
a status is displayed (status catalogues, workflow settings, table column setup).

## When to use
- Letting users choose how a status, category or label is drawn: type + colour + icon at once
- Storing that choice in a form as one value `{ type, color, icon }`

## When NOT to use
- Choosing only a colour → `<sd-select>` with colour options
- Choosing an icon for something other than a badge → a dedicated icon field
- Displaying a badge → `<sd-badge>`

## Inputs and models
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `[(type)]` | `SdBadgeType \| undefined` | `undefined` | Written when the panel closes. Empty: the trigger shows the label / placeholder, and the first draft starts from `round` · `secondary`. |
| `[(color)]` | `Color \| undefined` | `undefined` | Written when the panel closes. |
| `[(icon)]` | `string \| null` | `null` | Written when the panel closes. Ignored by `dot` and `pair`, but the value is kept when the type changes. |
| `previewTitle` | `string \| null \| undefined` | i18n `core.component.badge.picker.preview-title` ("Trạng thái") | Text of every badge preview: trigger, panel preview and type tiles. |
| `previewDescription` | `string \| null \| undefined` | `undefined` | Shown only in the large preview, for `icon` and `tag`; for other types a note says so. |
| `types` | `SdBadgeType[]` | all six | Limits the type tiles. Empty or `null` means all. |
| `colors` | `Color[]` | the six badge colours | Limits the swatches. Empty or `null` means all. |
| `icons` | `readonly string[]` | `SD_BADGE_ICON_PRESET` | Icon grid; the search box filters it by name. |
| `form`, `name` | `FormGroup` (or `NgForm`), `string` | —, a uuid | Registers one `FormControl` under `name`; its value is `{ type, color, icon } \| null`. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Same field scale as `sd-select`. The trigger badge is `sm` at `sm` / `md` and `md` at `lg`; the summary is hidden at `sm`. The panel does not change. |
| `floatLabel` | `'auto' \| 'always'` | `'auto'` | `auto`: the label sits in the field while it is empty and floats with a value or while the panel is open. `always`: the label always floats and an empty field shows the placeholder. |
| `labelPlacement` | `'float' \| 'top'` | `'float'` | `top`: static `sd-label` above the field and `helperText` as a hint below, as in the other controls. |
| `appearance` | `MatFormFieldAppearance` | `SD_FORM_CONFIGURATION.appearance`, else `outline` | As `sd-select`. |
| `label`, `placeholder`, `helperText` | `string` | placeholder: i18n `core.component.badge.picker.placeholder` ("Chọn kiểu hiển thị") | As `sd-select`; with a floating label `helperText` is an info icon with a tooltip. |
| `required` | `boolean` | `false` | Error when there is no `type` (i18n `core.component.badge.picker.required`). |
| `validator` | `SdCustomValidator` | — | Async message validator, as `sd-select`. |
| `inlineError` | `string` | — | Forces the control invalid with this message. |
| `hideInlineError` | `boolean` | `false` | Error as an icon with a tooltip instead of a message below. |
| `disabled` | `boolean` | `false` | The trigger cannot open; `form.get(name).disable()` does the same. |
| `viewed` | `boolean` | `false` | Shows the label and the badge only, no field. |
| `autoId` | `string` | — | `data-autoid`: trigger `components-badge-picker-<autoId>`, panel `…-panel`, search `…-search`; Done button `components-button-<autoId>-done`. |

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdChange` | `SdBadgePickerValue` (`{ type, color, icon }`) | Once, when the panel closes with a changed value. Esc never emits. |

The three models also emit their own `typeChange` / `colorChange` / `iconChange` at the same moment.

## Exports
- `SdBadgePicker`
- `SD_BADGE_TYPE_OPTIONS: readonly SdBadgeTypeOption[]` — `{ value, labelKey, descriptionKey }` for the six types, in panel order. Keys: `core.component.badge.type.<type>` and `…<type>.description`.
- `SD_BADGE_ICON_PRESET: readonly string[]` — the 23 default icons: `check_circle, cancel, schedule, error, warning, info, sync, flag, star, bolt, lock, visibility, edit_note, label, sell, local_shipping, payments, inventory_2, person, group, task_alt, hourglass_empty, pause_circle`.
- Types `SdBadgePickerValue`, `SdBadgeTypeOption`.
- `ɵSdBadgePickerControlDirective` — the internal `MatFormFieldControl` of the trigger; not covered by SemVer.

## Behaviour
- **Draft**: opening the panel copies the written value into a draft. Everything in the panel changes only the draft and the previews.
- **Write**: a click outside, **Done**, or Tab out of the last control (Shift+Tab out of the first) writes the draft to the three models and emits `sdChange`; nothing is emitted when nothing changed. Focus returns to the trigger, except after a click outside.
- **Cancel**: Esc closes the panel and drops the draft.
- **Icons**: the icon group shows for `icon`, `round`, `tag` and `solid`. Its first cell is "Chấm (không icon)" for `icon` and "Không icon" for the others; it sets `icon` to `null`. Switching to `dot` or `pair` hides the group but keeps the drafted icon.
- **Form** (`[form]` + `name`): closing with a change sets the value, `markAsDirty` and `markAsTouched`; any close marks it touched, so the required error shows after the first close (or on submit). `setValue` / `patchValue` from outside update the three models.

## Layout
- **Trigger**: the written badge, then the summary `type · colour · icon` (12px `--sd-text-secondary`, ellipsis), then the arrow.
- **Panel** (400px, panel radius, border and `--sd-shadow-md`, opens 6px below the field or above when there is no room):
  - Preview row (56px min, muted surface): "Xem trước" on the left, the badge on the right, the description note below it when needed.
  - **Kiểu**: 3-column grid of 60px tiles, each with a preview in the drafted colour and icon and the type name; the chosen tile has a primary border and a 6% primary background.
  - **Màu**: six 24px swatches; the chosen one has a 2px ring in the text colour, 2px away. The colour name follows the group label.
  - **Icon**: a 32px search box (`sd-search-field` `sm`) and an 8-column grid of 36px cells; the chosen cell is `--sd-primary-light` with a primary border. "Không có icon khớp" when the search finds nothing.
  - Footer (52px): "Esc huỷ thay đổi" on the left, with Esc drawn as a key cap (`kbd.sd-badge-picker-panel__kbd`; the i18n text carries a `{key}` placeholder), **Done** (`sd-button` fill, `sm`) on the right.

## Accessibility
- The trigger is `role="combobox"` with `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` (the panel id while open), `aria-invalid`, `aria-required` and `aria-disabled`; its name is the label (or placeholder) and `aria-describedby` points to the error or hint. Enter, Space, ↓ or ↑ open the panel.
- The panel is `role="dialog"`. Opening moves focus to the chosen type.
- Each group is a `radiogroup` named by its label, with one tab stop (the chosen radio; the "no icon" cell when the chosen icon is filtered out). Arrow keys move focus inside the group (types 3 columns, icons 8), Home / End jump to the ends, and Enter / Space choose.
- Under forced colours the swatches keep their colour with a `CanvasText` border, and chosen tiles and icons get a `Highlight` border.

## Examples

### Two-way models
```html
<sd-badge-picker
  label="Hiển thị trạng thái"
  [(type)]="badge.type" [(color)]="badge.color" [(icon)]="badge.icon"
  previewTitle="Đã duyệt"
  (sdChange)="save($event)"></sd-badge-picker>
```

### In a form
```html
<!-- form.value.statusBadge = { type, color, icon } | null -->
<sd-badge-picker [form]="form" name="statusBadge" label="Hiển thị trạng thái" size="md" required></sd-badge-picker>
```

### Limited choices
```html
<sd-badge-picker label="Mức ưu tiên" [types]="['round', 'solid']" [colors]="['info', 'warning', 'error']" [icons]="['flag', 'bolt']"></sd-badge-picker>
```

## Related
- `<sd-badge>` — the badge being configured
- `<sd-select>` — the field this control follows for size, label, errors and form registration
