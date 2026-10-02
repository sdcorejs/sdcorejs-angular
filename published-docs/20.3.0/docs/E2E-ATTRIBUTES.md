# Core UI — E2E test attributes reference

Source of truth for the `data-*` attributes rendered by `@sdcorejs/angular` components for QA automation. Both human QA engineers and downstream AI agents (e.g. SDCoreJS skill packs that generate e2e tests) should be able to read this file alone and know what each component exposes.

## Convention

- Attribute names are **lowercase**. The browser normalizes data-attribute names regardless of casing in the source — so `[attr.data-autoId]` becomes `data-autoid` in the DOM. All selectors in this doc use lowercase.
- Boolean attributes are **always present** with the string literals `"true"` or `"false"` (not boolean-attribute style). This lets QA write simple selectors like `[data-loading="false"]`.
- `data-value` is **omitted** (bound to `null`, which Angular removes from the DOM) for sensitive or non-serializable inputs:
  - `sd-input` with `type="password"`
  - `sd-upload-file` (File objects don't serialize)
  - `sd-editor` (content may be megabytes)

## Serialization rules (for `data-value`)

| Source type | `data-value` |
|---|---|
| `null` / `undefined` / `""` | `""` (paired with `data-empty="true"`) |
| `Date` | `value.toISOString()` |
| Array / object | `JSON.stringify(value)` |
| `boolean` / `number` | `String(value)` |

The shared helpers live in `@sdcorejs/angular/utilities/data-state`: `sdSerializeDataValue()` and `sdIsEmpty()`.

## Attribute catalog

| Attribute | Value | Applies to | Source |
|---|---|---|---|
| `data-autoid` | namespaced ID | all `autoId`-enabled components | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | all forms, button, editor, upload-file | `formControl.disabled` or `disabled` input |
| `data-loading` | `"true"` / `"false"` | select, autocomplete, button, side-drawer, table | `loading` signal or input |
| `data-value` | stringified primitive | all forms (skipped for password / upload-file / editor) | `formControl.value` via `sdSerializeDataValue()` |
| `data-empty` | `"true"` / `"false"` | all forms, upload-file, editor | `sdIsEmpty(value)` |
| `data-invalid` | `"true"` / `"false"` | scalar / collection form controls that validate | `formControl.invalid && (touched \|\| dirty)` |
| `data-opened` | `"true"` / `"false"` | modal (while open), side-drawer | `isOpened` signal |
| `data-count` | numeric string | chip, chip-calendar, upload-file | `value.length` / `files.length` |
| `data-segment` | enum string | sd-autoid-inspector | `segment` signal |
| `data-highlight-on` | `"true"` / `"false"` | sd-autoid-inspector | `highlightOn` signal |
| `data-element-count` | numeric string | sd-autoid-inspector | `elements().length` |
| `data-missing-count` | numeric string | sd-autoid-inspector | `audit().missingCount` |
| `data-duplicate-count` | numeric string | sd-autoid-inspector | `audit().duplicateCount` |
| `data-required` | `"true"` / `"false"` | all form components with a `required` input | input `required` |
| `data-maxlength` | numeric string | input, textarea | input `maxlength` |
| `data-minlength` | numeric string | input | input `minlength` |
| `data-pattern` | string | input, textarea | input `pattern` (raw or `ValidationPatternType` enum value) |
| `data-error-message` | string | all forms with `errorMessage` getter | derived from `formControl.errors` + i18n |

## Component matrix

| Component | autoId prefix | Anchor element | Attributes |
|---|---|---|---|
| `sd-input` | `forms-input` | `input[matInput]` | disabled, invalid, empty, value (skipped for password), required, maxlength, minlength, pattern, error-message |
| `sd-textarea` | `forms-textarea` | `textarea[matInput]` | disabled, invalid, empty, value, required, maxlength, pattern, error-message |
| `sd-input-number` | `forms-input-number` | `input` | disabled, invalid, empty, value, required, error-message |
| `sd-switch` | `forms-switch` | `mat-slide-toggle` | disabled, empty, value, required |
| `sd-checkbox` | `forms-checkbox` | `mat-checkbox` | disabled, empty, value |
| `sd-radio` | `forms-radio` | `mat-radio-group` | disabled, empty, value, required |
| `sd-date` | `forms-date` | `input` | disabled, invalid, empty, value (ISO), required, error-message |
| `sd-datetime` | `forms-datetime` | `input` | disabled, invalid, empty, value (ISO), required, error-message |
| `sd-select` | `forms-select` | `mat-select` | disabled, invalid, empty, value, loading, required, error-message |
| `sd-autocomplete` | `forms-autocomplete` | `input` | disabled, invalid, empty, value, loading, required, error-message |
| `sd-chip` | `forms-chip` | `input.sd-chip-input` | disabled, empty, value (JSON arr), count, required, error-message |
| `sd-chip-calendar` | `forms-chip-calendar` | `input.sd-chip-input` | disabled, empty, value (JSON ISO arr), count, required, error-message |
| `sd-date-range` | `forms-date-range` | `mat-date-range-input` | disabled, invalid, empty, value (JSON `{from,to}`), required, error-message |
| `sd-button` | `components-button` | `button.c-button` | disabled, loading |
| `sd-modal` | `components-modal` | `.sd-modal-root` (inside dialog overlay) | opened |
| `sd-side-drawer` | `components-side-drawer` | `.sd-side-drawer` (in `document.body` via CdkPortal) | opened, loading |
| `sd-table` | `components-table` | `<sd-table>` host | loading |
| `sd-upload-file` | `components-upload-file` | drop zone (`.c-area-upload`) | disabled, empty, count |
| `sd-editor` | `components-editor` | host | disabled, empty |
| `sd-autoid-inspector` | `sd-autoid-inspector-fab` / `sd-autoid-inspector-panel` (static) | FAB + panel (devtool) | opened (on FAB); segment, highlight-on, element-count, missing-count, duplicate-count (on panel) |

## Selector cookbook

### Playwright

```ts
// Wait for a specific input to be both filled and valid
const input = page.locator('[data-autoid="forms-input-username"]');
await expect(input).toHaveAttribute('data-empty', 'false');
await expect(input).toHaveAttribute('data-invalid', 'false');

// Wait for an async select to finish loading its options
const select = page.locator('[data-autoid="forms-select-country"]');
await expect(select).toHaveAttribute('data-loading', 'false');

// Wait for a modal to open (modal lives at document.body via overlay)
await page.locator('.sd-modal-root[data-autoid="components-modal-confirm"][data-opened="true"]').waitFor();
```

### Cypress

```ts
cy.get('[data-autoid="forms-input-username"]').should('have.attr', 'data-empty', 'false');
cy.get('.sd-modal-root[data-autoid="components-modal-confirm"]').should('have.attr', 'data-opened', 'true');
```

## YAML schema for AI agents

Downstream agents (SDCoreJS `angular-portal` e2e skill, custom tooling) can parse this section to know what each component exposes without scraping the markdown tables.

```yaml
sd-input:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-required, data-maxlength, data-minlength, data-pattern, data-error-message]
  anchor: input[matInput]
  prefix: forms-input
  loading: false
  notes:
    - "data-value omitted when type=password"
    - "maxlength/minlength/pattern/error-message render only when defined / active"

sd-textarea:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-required, data-maxlength, data-pattern, data-error-message]
  anchor: textarea[matInput]
  prefix: forms-textarea
  loading: false
  notes:
    - "maxlength/pattern/error-message render only when defined / active"

sd-input-number:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-required, data-error-message]
  anchor: input
  prefix: forms-input-number
  loading: false
  notes:
    - "uses min/max inputs (numeric bounds), not maxlength/minlength/pattern"
    - "error-message renders only when error is active"

sd-switch:
  attrs: [data-autoid, data-disabled, data-empty, data-value, data-required]
  anchor: mat-slide-toggle
  prefix: forms-switch
  loading: false

sd-checkbox:
  attrs: [data-autoid, data-disabled, data-empty, data-value]
  anchor: mat-checkbox
  prefix: forms-checkbox
  loading: false
  notes:
    - "no required input on sd-checkbox — data-required not applicable"

sd-radio:
  attrs: [data-autoid, data-disabled, data-empty, data-value, data-required]
  anchor: mat-radio-group
  prefix: forms-radio
  loading: false

sd-date:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-required, data-error-message]
  anchor: input
  prefix: forms-date
  loading: false
  value_format: ISO string
  notes:
    - "error-message renders only when error is active"

sd-datetime:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-required, data-error-message]
  anchor: input
  prefix: forms-datetime
  loading: false
  value_format: ISO string
  notes:
    - "error-message renders only when error is active"

sd-select:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-loading, data-required, data-error-message]
  anchor: mat-select
  prefix: forms-select
  loading: true
  notes:
    - "error-message renders only when error is active"

sd-autocomplete:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-loading, data-required, data-error-message]
  anchor: input
  prefix: forms-autocomplete
  loading: true
  notes:
    - "error-message renders only when error is active"

sd-chip:
  attrs: [data-autoid, data-disabled, data-empty, data-value, data-count, data-required, data-error-message]
  anchor: input.sd-chip-input
  prefix: forms-chip
  loading: false
  value_format: JSON-stringified array
  notes:
    - "error-message renders only when error is active"

sd-chip-calendar:
  attrs: [data-autoid, data-disabled, data-empty, data-value, data-count, data-required, data-error-message]
  anchor: input.sd-chip-input
  prefix: forms-chip-calendar
  loading: false
  value_format: JSON-stringified array of ISO strings
  notes:
    - "error-message renders only when error is active"

sd-date-range:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-required, data-error-message]
  anchor: mat-date-range-input
  prefix: forms-date-range
  loading: false
  value_format: JSON-stringified {from, to}
  notes:
    - "error-message renders only when error is active"

sd-button:
  attrs: [data-autoid, data-disabled, data-loading]
  anchor: button.c-button
  prefix: components-button
  loading: true

sd-modal:
  attrs: [data-autoid, data-opened]
  anchor: .sd-modal-root
  prefix: components-modal
  rendered_into: document.body  # via MatDialog overlay
  loading: false

sd-side-drawer:
  attrs: [data-autoid, data-opened, data-loading]
  anchor: .sd-side-drawer
  prefix: components-side-drawer
  rendered_into: document.body  # via CdkPortal
  loading: true

sd-table:
  attrs: [data-autoid, data-loading]
  anchor: <sd-table> host
  prefix: components-table
  loading: true

sd-upload-file:
  attrs: [data-autoid, data-disabled, data-empty, data-count]
  anchor: .c-area-upload  # drop zone div
  prefix: components-upload-file
  loading: false  # no loading signal currently exposed
  notes:
    - "data-value omitted — File objects don't serialize safely"

sd-editor:
  attrs: [data-autoid, data-disabled, data-empty]
  anchor: host element
  prefix: components-editor
  loading: false  # no loading signal currently exposed
  notes:
    - "data-value omitted — content may be MB-sized"

sd-autoid-inspector:
  attrs:
    - data-autoid (static "sd-autoid-inspector-fab" on FAB; "sd-autoid-inspector-panel" on panel)
    - data-opened (FAB)
    - data-segment (panel)
    - data-highlight-on (panel)
    - data-element-count (panel)
    - data-missing-count (panel)
    - data-duplicate-count (panel)
  anchors:
    fab: "[data-autoid=\"sd-autoid-inspector-fab\"]"
    panel: "[data-autoid=\"sd-autoid-inspector-panel\"]"
  prefix: sd-autoid-inspector (static, no autoId input)
  loading: false
  notes:
    - "Devtool — does not expose data-value/empty/invalid (no FormControl)."
    - "FAB absent when enabled=false or dismissed=true."
    - "Panel only rendered when open()=true."
```
