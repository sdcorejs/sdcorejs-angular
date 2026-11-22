# `<sd-operator>`

**Type**: Component
**Selector**: `sd-operator`
**Import path**: `@sdcorejs/angular/components/operator`
**Class**: `SdOperator`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Compact operator picker for filter UIs. The trigger is a small chip (or a bare glyph at `xs`) showing the current operator icon; clicking it opens a Material menu with the allowed operators and their translated labels.

## When to use

- Inside filter builders where the user chooses a condition such as `EQUAL`, `CONTAIN`, `BETWEEN`, `NULL`.
- Custom `<sd-table>` column-filter templates that need the same operator vocabulary as Core UI.
- Advanced search / query-bar / query-builder surfaces that already emit `Operator` from `@sdcorejs/utils/models`.
- Dense filter rows where a full `<sd-select>` would take too much horizontal space.
- Read-only filter chips that show which operator a condition uses (`readonly`).

## When NOT to use

- For choosing business values such as status, category, user, or department → use `<sd-select>` / `<sd-autocomplete>`.
- Next to a form control that supports `[operators]` (`sd-input`, `sd-input-number`, `sd-select`, `sd-date`, `sd-date-range`) → use the control's `[operators]` / `[(operator)]`, which draws the same chip inside the field.
- For simple screens where the operator is fixed and should not be visible.
- For non-filter actions or menu commands → use `<sd-button>` / `<sd-quick-action>` / `mat-menu`.
- For custom operator vocabularies not present in the canonical `OPERATORS` table.

## Inputs

| Name        | Type                                      | Default     | Notes                                                                                                                                                                             |
| ----------- | ----------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`     | `Operator \| undefined` (model)           | `undefined` | Two-way bound current operator via `[(model)]`.                                                                                                                                   |
| `operators` | `Operator[]`                              | `[]`        | Allowed operators, in display order — the menu keeps this order. Unknown operators are skipped because labels/icons come from `OPERATORS`.                                        |
| `size`      | `SdOperatorSize` (`'xs' \| 'sm' \| 'md'`) | `'md'`      | `md`: 28px chip, 18px icon. `sm`: 24px chip, 16px icon (table filters, popover headers). `xs`: bare 14px glyph with a 24px hit area that does not grow the layout (inside chips). |
| `active`    | `boolean`                                 | `false`     | The condition has a value: the chip is tinted primary (`--sd-primary-light` / `--sd-primary-dark`). Grey otherwise.                                                               |
| `readonly`  | `boolean`                                 | `false`     | Shows only the glyph with the operator name (`role="img"`, `aria-label`, tooltip): no menu, no tab stop. For chips that display a finished condition.                             |
| `showCode`  | `boolean`                                 | `false`     | Shows the operator code (`EQUAL`, `CONTAIN`, …) after the label in the menu — for technical or admin screens where users need the value sent to the API.                          |
| `disabled`  | `boolean`                                 | `false`     | Bare attribute = true. Disables the trigger and prevents the menu opening. Wins over `readonly`.                                                                                  |
| `autoId`    | `string \| undefined`                     | `undefined` | Rendered on the trigger as `data-autoid`.                                                                                                                                         |

> **Coerce**: `active`, `readonly`, `showCode`, `disabled` use `booleanAttribute` — bare attribute = `true`.

## Outputs

| Name          | Type                    | Notes                                                             |
| ------------- | ----------------------- | ----------------------------------------------------------------- |
| `modelChange` | `Operator \| undefined` | Emitted by Angular model binding when the user picks an operator. |

## Public API

| Method   | Signature    | Notes                                                                   |
| -------- | ------------ | ----------------------------------------------------------------------- |
| `open()` | `() => void` | Opens the operator menu programmatically. Used by query-bar build flow. |

## Visual cues

- `sm` / `md`: a rounded chip with the operator icon and an `expand_more` arrow (`expand_less` while the menu is open). Grey (`--sd-surface-muted` mix, `--sd-text-secondary`) by default, primary tint with `active`, solid `--sd-primary` while the menu is open. It is the same chip that the form controls draw for `[operators]`.
- `xs`: the bare 14px glyph in the surrounding text colour, no arrow; hover and focus draw on its 24px hit area.
- `readonly`: the glyph alone in the surrounding colour, with the operator name as tooltip.
- Empty model shows a funnel icon and the trigger is named "Chọn điều kiện".
- Icon stroke grows as the icon shrinks (18px 2.1, 16px 2.25, 14px 2.5) so the glyphs stay legible.
- Menu rows are one 36px line: a 20px icon cell, the translated label (14px, no wrap) and, with `showCode`, the code in 11px muted monospace on the same line. A thin separator splits operator families (comparison, text, list, range, empty) when the list has more than four items; the order of `operators` is never changed.
- The current row has the `--sd-primary-light` background, label and icon in `--sd-primary-dark`, weight 500; there is no tick.
- The menu is a control panel like the `sd-select` one: 10px corner (`--sd-panel-radius`), thin border, `--sd-shadow-md`, the select panel surface, up to `min(360px, 100vw - 32px)` wide. It opens 6px away from the trigger.

## Accessibility

- The trigger is named "Điều kiện: {label}" (or "Chọn điều kiện" without a model) through `core.component.operator.current` / `.choose`; its tooltip is the operator label.
- Rows are `role="menuitemradio"` with `aria-checked` on the current one; separators are `role="separator"`.
- Every operator SVG is `aria-hidden="true" focusable="false"`.
- `readonly` renders `<span role="img" aria-label="{label}">` without `tabindex`.
- Keyboard: Tab to the trigger; Enter, Space or Alt+↓ open the menu; arrows move; Enter picks and closes; Escape closes. Focus returns to the trigger.

## Behavior notes

- Icons and labels resolve from `OPERATORS` in `@sdcorejs/utils/constants` (redrawn glyphs since `@sdcorejs/utils` 1.3.1).
- `OPERATORS[].display` is an i18n key and is translated through `I18nService`; do not pass already-translated labels here.
- Operator icons are canonical internal SVG fragments. The component wraps and sanitizes them itself.
- The trigger, the menu and the resolution of `OPERATORS` are shared with the operator chip that `sd-input`, `sd-input-number`, `sd-select`, `sd-date` and `sd-date-range` render for their `operators` input. The chip is internal (`ɵSdOperatorChip`); use `<sd-operator>` or the controls' `[operators]` / `[(operator)]` instead of the chip directly.

## Examples

### 1. Column filter operator

```html
<sd-operator size="sm" [active]="hasValue" [(model)]="operator" [operators]="['EQUAL', 'CONTAIN', 'NULL', 'NOT_NULL']"> </sd-operator>
```

### 2. Read-only operator inside a filter chip

```html
<span class="filter-chip">
  Email <sd-operator size="xs" readonly [operators]="[filter.operator]" [model]="filter.operator" /> {{ filter.value }}
</span>
```

### 3. Showing the operator codes

```html
<sd-operator showCode [(model)]="rule.operator" [operators]="allowedOperators"></sd-operator>
```

### 4. Programmatically open during a build flow

```ts
@ViewChild(SdOperator) operator!: SdOperator;

startChoosingOperator(): void {
  this.operator.open();
}
```

## Anti-patterns

- ❌ Passing operators that do not exist in `OPERATORS` — they render no row.
- ❌ Using `<sd-operator>` as a general dropdown; it is only for filter operators.
- ❌ Using `disabled` to show a finished condition — use `readonly`, which keeps the tooltip and the accessible name.
- ❌ Overriding `.c-op-trigger` / `.c-op-icon` with `::ng-deep` to resize the icon — use `size`.
- ❌ Rendering a separate text label next to the trigger in dense filter chips — the tooltip/menu already names the operator; use `showOperatorOnChip` in `<sd-query-bar>` when chip-face text is required.
- ❌ Recreating the `operators` array in the template on every change detection pass — keep it as a class property.

## E2E test attributes

| Element                          | Attribute      | Value                            |
| -------------------------------- | -------------- | -------------------------------- |
| Trigger button (`.c-op-trigger`) | `data-autoid`  | The exact `autoId` input value   |
| `readonly` glyph (`role="img"`)  | `data-autoid`  | The exact `autoId` input value   |
| Menu rows                        | `aria-checked` | `"true"` on the current operator |

## Related

- `<sd-query-bar>` — uses this picker for filter chips (`readonly` `xs` on chips, interactive `xs` in the build flow, `sm` in the popover header).
- `<sd-query-builder>` — uses this picker for rule operators.
- `<sd-table>` — column/external filters share the same `Operator` vocabulary, in the order of `filter.operator.list`. Default column-filter controls with two or more operators show the operator as a chip inside the field; `filterDef` templates, split filters and single-operator lists keep this standalone picker at `size="sm"`.
- `<sd-input>`, `<sd-input-number>`, `<sd-select>`, `<sd-date>`, `<sd-date-range>` — `[operators]` / `[(operator)]` render the same chip and menu inside the field.
- `OPERATORS` / `Operator` from `@sdcorejs/utils` — source of truth for allowed operator codes, icons, and i18n keys.
