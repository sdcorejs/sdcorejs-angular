# `<sd-operator>`

**Type**: Component
**Selector**: `sd-operator`
**Import path**: `@sdcorejs/angular/components/operator`
**Class**: `SdOperator`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Compact operator picker for filter UIs. The trigger shows only the current operator icon; clicking it opens a Material menu with allowed operators, translated labels, and raw operator codes.

## When to use
- Inside filter builders where the user chooses a condition such as `EQUAL`, `CONTAIN`, `BETWEEN`, `NULL`.
- Custom `<sd-table>` column-filter templates that need the same operator vocabulary as Core UI.
- Advanced search / query-bar / query-builder surfaces that already emit `Operator` from `@sdcorejs/utils/models`.
- Dense filter rows where a full `<sd-select>` would take too much horizontal space.

## When NOT to use
- For choosing business values such as status, category, user, or department → use `<sd-select>` / `<sd-autocomplete>`.
- For simple screens where the operator is fixed and should not be visible.
- For non-filter actions or menu commands → use `<sd-button>` / `<sd-quick-action>` / `mat-menu`.
- For custom operator vocabularies not present in the canonical `OPERATORS` table.

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `model` | `Operator \| undefined` (model) | `undefined` | Two-way bound current operator via `[(model)]`. |
| `operators` | `Operator[]` | `[]` | Allowed operators, in display order. Unknown operators are skipped because labels/icons come from `OPERATORS`. |
| `disabled` | `boolean` | `false` | Bare attribute = true. Disables the trigger and prevents the menu opening. |
| `autoId` | `string \| undefined` | `undefined` | Rendered on the trigger as `data-autoid`. |

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `modelChange` | `Operator \| undefined` | Emitted by Angular model binding when the user picks an operator. |

## Public API
| Method | Signature | Notes |
| --- | --- | --- |
| `open()` | `() => void` | Opens the operator menu programmatically. Used by query-bar build flow. |

## Visual cues
- Trigger is an icon-only button; tooltip is the translated label of the current operator.
- Empty model shows a funnel fallback icon.
- Menu rows show icon, translated label, and the raw operator code at the end.
- Active operator row gets the active class; disabled trigger cannot open the menu.

## Behavior notes
- Icons and labels resolve from `OPERATORS` in `@sdcorejs/utils/constants`.
- `OPERATORS[].display` is an i18n key and is translated through `I18nService`; do not pass already-translated labels here.
- Operator icons are canonical internal SVG fragments. The component wraps and sanitizes them itself.

## Examples

### 1. Column filter operator
```html
<sd-operator
  [(model)]="operator"
  [operators]="['EQUAL', 'CONTAIN', 'NULL', 'NOT_NULL']">
</sd-operator>
```

### 2. Programmatically open during a build flow
```ts
@ViewChild(SdOperator) operator!: SdOperator;

startChoosingOperator(): void {
  this.operator.open();
}
```

## Anti-patterns
- ❌ Passing operators that do not exist in `OPERATORS` — they render no row.
- ❌ Using `<sd-operator>` as a general dropdown; it is only for filter operators.
- ❌ Rendering a separate text label next to the trigger in dense filter chips — the tooltip/menu already names the operator; use `showOperatorOnChip` in `<sd-query-bar>` when chip-face text is required.
- ❌ Recreating the `operators` array in the template on every change detection pass — keep it as a class property.

## E2E test attributes
| Element | Attribute | Value |
| --- | --- | --- |
| Trigger button | `data-autoid` | The exact `autoId` input value |

## Related
- `<sd-query-bar>` — uses this picker for filter chips.
- `<sd-query-builder>` — uses this picker for rule operators.
- `<sd-table>` — column/external filters share the same `Operator` vocabulary.
- `OPERATORS` / `Operator` from `@sdcorejs/utils` — source of truth for allowed operator codes, icons, and i18n keys.
