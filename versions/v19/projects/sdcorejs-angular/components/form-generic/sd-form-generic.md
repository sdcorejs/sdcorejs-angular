# `<sd-form-builder>`, `<sd-form-render>` & `<sd-feel-expression>`

**Type**: Components (three public components in one entry point)
**Selectors**: `sd-form-builder`, `sd-form-render`, `sd-feel-expression`
**Import path**: `@sdcorejs/angular/components/form-generic`
**Classes**: `SdFormBuilder`, `SdFormRender`, `SdFeelExpression`
**Standalone**: yes

## One-line purpose

A schema-driven form system: `<sd-form-builder>` is a drag-and-drop designer that produces an `SdFormGeneric` JSON schema, `<sd-form-render>` turns that schema into a live Angular reactive form, and `<sd-feel-expression>` is the condition editor both of them use for `*WhenExpression` rules.

## When to use

- The set of fields is data, not code — a portal where an admin composes the form and end users fill it in.
- The same schema must drive both an editable form and a read-only detail view (`[viewed]`).
- Fields need to show/hide/disable/require each other through configured conditions rather than hand-written template logic.

## When NOT to use

- A form whose fields are known at compile time. Compose `<sd-input>` / `<sd-select>` / … directly — you get real types and far less indirection.
- A single dynamic field. Use `@if` over the concrete control.
- A page that only needs conditional display. `@if` on a signal is lighter than an expression schema.

## Exported surface

`index.ts` re-exports four groups. Anything not listed here is internal, even if the file lives inside this folder:

| Group | Exported |
| --- | --- |
| Components | `SdFormBuilder`, `SdFormRender`, `SdFeelExpression` |
| Configuration | `ISdFormGenericConfiguration`, `SD_FORM_GENERIC_CONFIGURATION`, `IWorkflowConfigurationForm` (type-only) |
| Models | `SdFormGeneric`, `SdFormRenderConfiguration`, `SdFormGenericComponent` (+ every per-type interface), `SdFormGenericGroup`, `SdFormGenericVariable`, `SdFormGenericLayout`, `SdFormGenericExpression`, the selection / table / html definition types, and the helper functions/constants below |
| Services | `SdFormRenderService` only |

**Not exported** (internal): the 14 field sub-components (`TextFieldControl`, `SelectAttribute`, …), `BuilderService`, `FormGenericService`, and all seven pipes (`ComponentViewedPipe`, `WhenExpressionPipe`, `ExpressionQueryPipe`, `ExpressionViewPipe`, `ExpressionFeelPipe`, `HtmlPipe`, `HyperlinkPipe`). The builder and renderer compose them internally; there is no supported way to mount one on its own.

`SdFormGenericValidation`, `SdFormGenericValidationFunction`, `SdFormGenericValidationConfiguration` and `ValidationAlerts` are exported from the models barrel, so the types behind `SdFormGeneric.validations` and `IWorkflowConfigurationForm.validation` can be imported by name.

### Helper functions and constants

| Symbol | Signature | Notes |
| --- | --- | --- |
| `sdGenerateId()` | `() => string` | New component `id` (`Utilities.randomId('id')`). |
| `sdGenerateKey()` | `() => string` | New component `key` (`Utilities.randomId('key')`). |
| `sdFormatComponent(component)` | `(SdFormGenericComponent \| SdFormGenericGroup) => …` | Normalises a component in place before render. |
| `sdGetComponentAttributes(components)` | `=> { value, display }[]` | Flattens a schema into pickable attributes; recurses into groups, skips `html`. |
| `sdGetVariableAttributes(variables)` | `=> { value, display }[]` | Same, for `variables`. |
| `sdGetDatetimeValue(value)` | `(string) => …` | Resolves a relative date token used by expressions. |
| `sdEvaluateExpression(expression, entity)` | `=> boolean` | Evaluates a condition tree against an entity. Used by validations and `*WhenExpression`. |
| `sdExpressionToJavascriptExpression(condition)` | `=> string` | Renders a condition tree as a JS source string. |
| `sdTemplateToCondition(template, entity)` | `=> …` | Interpolates a `${key}` template against an entity. |
| `SD_FORM_BUILDER_COMPONENTS` | `FormBuilderComponent[]` | The palette. 13 entries across `basic` / `choice` / `advanced` / `layout`. |
| `SD_COMPONENT_ICONS` | `Record<string, { symbol, label }>` | Derived from the palette; keyed by component `type`. |
| `SD_TABLE_COLUMN_TYPES` | array | Column types offered by the `table` field. |
| `SD_ATTRIBUTE_OPERATORS` | record | Operators offered per attribute type in the expression editor. |
| `SD_DAY_INFO_TYPES`, `SD_DAY_INFO_PREVIOUSES` | arrays | Relative-date vocabulary for date conditions. |
| `SdFormGenericOperators` | object | Operator metadata for `SdFormGenericOperator`. |

## Schema — `SdFormGeneric`

```ts
interface SdFormGeneric {
  components: (SdFormGenericComponent | SdFormGenericGroup)[];
  variables?: SdFormGenericVariable[];
  validations?: SdFormGenericValidation[];
}
```

Every field extends `SdFormGenericComponentBase`:

```ts
interface SdFormGenericComponentBase {
  id: string;                 // unique, sdGenerateId()
  key: string;                // the entity property this field reads/writes, sdGenerateKey()
  label: string;
  template?: string;
  helperText?: string;
  layout?: SdFormGenericLayout;      // { row?, columns, mobileColumns? } — a 12-column grid
  validate?: { required?: boolean };
  disabled?: boolean;
  properties?: {
    viewed?: boolean;                // read-only presentation (NOT the same as disabled)
    hyperlink?: string;              // link target while viewed
    hidden?: boolean;
    hiddenWhenExpression?: SdFormGenericExpression;
    visibleWhenExpression?: SdFormGenericExpression;
    disabledWhenExpression?: SdFormGenericExpression;
    requiredWhenExpression?: SdFormGenericExpression;
    onChange?: { setValues?: Record<string, any> };
  } & Record<string, any>;
}
```

`SdFormGenericComponent` is the discriminated union over `type`. Per-variant additions:

| `type` | Interface | Adds |
| --- | --- | --- |
| `textfield` | `SdFormGenericTextfield` | `defaultValue?: string`; `validate.{minlength,maxlength,pattern,patternErrorMessage}` |
| `textarea` | `SdFormGenericTextarea` | `defaultValue?: string`; `validate.{minlength,maxlength}` |
| `number` | `SdFormGenericNumber` | `defaultValue?: number`; `validate.{min,max}` |
| `datetime` | `SdFormGenericDatetime` | `subtype: 'date' \| 'datetime'`; `defaultValue?: string`; `validate.{min,max}` (accepts the literal `'TODAY'`) |
| `checkbox` | `SdFormGenericCheckbox` | `defaultValue?: boolean` |
| `select` | `SdFormGenericSelect` | `values?` / `valuesKey?`; `defaultValue?: string \| string[]`; `properties.{query,multiple,setVariables}` |
| `radio` | `SdFormGenericRadio` | `values?` / `valuesKey?`; `defaultValue?: string`; `properties.direction: 'row' \| 'column'` |
| `checklist` | `SdFormGenericChecklist` | `values?` / `valuesKey?`; `defaultValue?: string[]`; `properties.query` |
| `chip-string` | `SdFormGenericChipString` | `defaultValue?: string[]`; `validate.{minlength,maxlength,pattern,patternErrorMessage,maxOfItems}` |
| `chip-calendar` | `SdFormGenericChipCalendar` | same validate shape as `chip-string` |
| `upload` | `SdFormGenericUpload` | `properties.{type,max,maxSize,extensions,args,source}` — mirrors `<sd-upload-file>` |
| `table` | `SdFormGenericTable` | `columns?` / `columnsKey?`; `properties.{type,titleButtonCreate}` |
| `html` | `SdFormGenericHtml` | `content: string`; `properties.{variables,queries,query}`. Has **no** `label` and its `key` is optional |
| `break` | `SdFormGenericBreak` | Nothing. Invisible spacer that forces the next field onto a new row |

`SdFormGenericGroup` is not a field — it is a titled container with its own `layout`, a nested `components` array, and required `properties.{icon, color}`. Groups do not nest: the builder hides `group` from the palette while you are editing one.

`SdFormGenericValues` is a convenience alias for `SdFormGenericRadio | SdFormGenericSelect | SdFormGenericChecklist`. Their inline `values` entries are `SdFormGenericSelectionStaticItem` — `{ value: string; label: string }` (note `label`, not `display`; the `display` spelling belongs to `SdFormGenericSelectionItem`, which is what a `valuesKey` lookup returns).

### Expressions

`*WhenExpression` and expression validations share one tree type:

```ts
interface SdFormGenericExpression {
  key: string;                 // any unique string — it is the @for track key
  type: 'combinator';
  combinator: '&&' | '||';
  conditions: (SdFormGenericExpression | SdFormGenericExpressionCondition)[];
}

interface SdFormGenericExpressionCondition {
  key: string;
  type: 'condition';
  field?: string;              // a component `key`
  operator: Operator;          // from @sdcorejs/utils/models — NOT SdFormGenericOperator
  value: any;                  // required (pass undefined for NULL / NOT_NULL)
  dayInfo: DayInfo;            // required (pass {} for non-date fields)
}
```

⚠️ `value` and `dayInfo` are **not optional** — a condition literal must include both even when they carry nothing. `operator` is the full `Operator` union from `@sdcorejs/utils/models` (`EQUAL`, `NOT_EQUAL`, `CONTAIN`, `IN`, `BETWEEN`, `NULL`, `NOT_NULL`, …). `SdFormGenericOperator` is a separate 8-member subset used only to label the pickers in `SdFormGenericOperators`; it is not the type of this field.

---

## `<sd-form-builder>`

The visual designer: a searchable palette on the left, a 12-column drag-and-drop canvas in the middle, and an attribute panel on the right.

### Inputs

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `formGeneric` | `SdFormGeneric \| undefined` | `undefined` | Seed schema. Deep-cloned on every **reference** change (`JSON.parse(JSON.stringify(...))`), so the input object is never mutated — and mutating it in place will **not** reload the canvas. Pass a new object to reset. |

### Outputs

**None.** The builder does not emit. Read the edited schema off the component instance through a template reference:

| Field | Type |
| --- | --- |
| `components` | `SdFormGeneric['components']` |
| `variables` | `SdFormGenericVariable[]` |
| `validations` | `SdFormGenericValidation[]` |

```html
<sd-form-builder #builder [formGeneric]="seed"></sd-form-builder>
<sd-button title="Save" (click)="save(builder)"></sd-button>
```

```ts
save(builder: SdFormBuilder) {
  const schema: SdFormGeneric = {
    components: builder.components,
    variables: builder.variables,
    validations: builder.validations,
  };
  return this.api.post('/api/forms', schema);
}
```

### Behaviour notes

- **Layout is a 12-column grid.** Each field carries `layout.columns` (1–12) and optional `layout.mobileColumns`. A row is full at 12; the builder refuses an inline drop when fewer than 2 columns remain.
- **Break** is not in the palette. Add it with the per-row "+ Break" quick action.
- **Live preview** — the builder embeds an `<sd-form-render>` for its preview mode, so what you see is the real renderer, not a mock.
- **Structural edits are debounced** by 200 ms before the canvas rows are recomputed.
- Requires `SdNotifyService` and `SdConfirmService` (both `providedIn: 'root'`, nothing to register).

---

## `<sd-form-render>`

Turns a schema into a live form. `OnPush`.

### Inputs

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `configuration` | `SdFormRenderConfiguration` | **yes** | Schema + hooks. Deep-cloned and normalised on every set, so the renderer never mutates your object. |
| `form` | `FormGroup` | no | The reactive form the fields register into. Defaults to a fresh empty `FormGroup`. Supply your own to submit/validate from the parent. |
| `entity` | `Record<string, any>` | no | Current values, keyed by each component's `key`. Two-way in effect: the renderer writes user input back onto this object. |
| `defaultEntity` | `Record<string, any>` | no | Seed values applied only where `entity` has no value (`entity[k] ?? defaultEntity[k]`). |
| `properties` | `string[]` | no | Restricts rendering to the listed component keys. |
| `viewed` | `boolean \| ''` | no | Read-only presentation for the whole form. Bare attribute (`<sd-form-render viewed>`) counts as `true`. |

```ts
interface SdFormRenderConfiguration {
  components: SdFormGeneric['components'];
  validations?: SdFormGeneric['validations'];
  variables?: SdFormGenericVariable[];
  onLoaded?: () => void;
  beforeSubmit?: (entity: Record<string, any>) => Promise<Record<string, any>>;
}
```

### Outputs

**None.** Read `entity` (which the renderer mutates) or the `FormGroup` you passed in.

### Public methods

| Name | Signature | Notes |
| --- | --- | --- |
| `upload()` | `() => Promise<void>` | Walks every field (including table file columns) and performs pending uploads, mapping the results into `entity`. **Call this before saving**, otherwise file fields still hold local placeholders. |
| `getValidationMessages(alert)` | `('warning' \| 'error') => Promise<string[] \| undefined>` | Runs the configured `validations` whose `alert` matches, and returns the messages that fired. ⚠️ If the underlying `FormGroup` is already invalid it calls `markAllAsTouched()` and returns **`undefined`** — not an empty array. Check for `undefined` before treating the result as "no errors". |

### Public fields

| Field | Type | Notes |
| --- | --- | --- |
| `entity` | `Record<string, any>` | Live values. |
| `formValue` | `Record<string, any>` | Last computed form value. |
| `loadCompleted` | `boolean` | `true` once a non-empty schema and entity have both arrived. |
| `setVariables` | `Subject<{ key, value }>` | Push a variable value into the rendered fields at runtime. |

### Validation model

Two kinds, both keyed by `alert: 'warning' | 'error'`:

- `{ type: 'expression', expression, message }` — `message` may contain HTML; fires when `sdEvaluateExpression(expression, entity)` is truthy.
- `{ type: 'function', code }` — `code` selects a function registered under `SD_FORM_GENERIC_CONFIGURATION.form.validation.functions`; the function returns a message string (or nothing) from `validate({ entity })`.

---

## `<sd-feel-expression>`

The condition editor. Opens an `<sd-modal>` in which the user composes a condition tree over the form's own attributes. `OnPush`.

### Inputs

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `components` | `(SdFormGenericComponent \| SdFormGenericGroup)[]` | **yes** | `input.required()`. The attribute pool the editor offers; groups are flattened. |
| `expression` | `SdFormGenericExpression \| undefined` | **yes** | Current condition tree. `undefined` is replaced with an empty `&&` combinator. |
| `model` | `string \| undefined` | **yes** | Text form of the expression. |

### Outputs

| Name | Payload | Notes |
| --- | --- | --- |
| `expressionChange` | `SdFormGenericExpression` | The edited tree. |
| `modelChange` | `string \| undefined` | Completes the two-way `[(model)]`. |
| `sdChange` | `{ model?, expression? }` | Both at once. |

### Public methods

| Name | Notes |
| --- | --- |
| `edit()` | Resolves attributes from `components()` and opens the modal. |
| `addCondition(conditions)` | Appends an empty `EQUAL` condition to the given list. |

---

## Configuration token

Portal-wide data sources are registered once through `SD_FORM_GENERIC_CONFIGURATION`. It is `@Optional` — the components work without it, but `valuesKey` / `columnsKey` / html definitions and validation functions will not resolve.

```ts
import { SD_FORM_GENERIC_CONFIGURATION } from '@sdcorejs/angular/components/form-generic';

providers: [
  {
    provide: SD_FORM_GENERIC_CONFIGURATION,
    useValue: {
      form: {
        templates: [],
        // one selection definition per `valuesKey` a schema may reference
        selections: [{ value: 'status', display: 'Status', valuesKey: 'status' }],
        tables: [],
        htmls: [],
        getValues: async key => api.get(`/api/lookup/${key}`),
        validation: {
          functions: [
            {
              value: 'BUDGET',
              display: 'Budget must cover the request',
              validate: async ({ entity }) =>
                entity['amount'] > entity['budget'] ? 'Amount exceeds the remaining budget.' : undefined,
            },
          ],
        },
      },
    },
  },
],
```

`selections`, `htmls` accept an array, a factory, or an async factory. `getValues(key, args)` backs `valuesKey`; `getLazyValues(key, args)` backs a searchable/lazy list.

---

## Examples

### 1. Design a form, then render it

```ts
import { Component, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  SdFormBuilder,
  SdFormRender,
  type SdFormGeneric,
  type SdFormRenderConfiguration,
} from '@sdcorejs/angular/components/form-generic';

@Component({
  selector: 'app-form-designer',
  imports: [SdFormBuilder, SdFormRender],
  template: `
    <sd-form-builder #builder [formGeneric]="seed()"></sd-form-builder>
    <sd-form-render [configuration]="preview(builder)" [form]="form" [entity]="entity"></sd-form-render>
  `,
})
export class FormDesignerComponent {
  readonly seed = signal<SdFormGeneric>({ components: [] });
  readonly form = new FormGroup({});
  entity: Record<string, any> = {};

  preview(builder: SdFormBuilder): SdFormRenderConfiguration {
    return { components: builder.components, variables: builder.variables, validations: builder.validations };
  }
}
```

### 2. Render a stored schema and submit it

```ts
async submit(render: SdFormRender) {
  await render.upload();                                   // resolve file fields first

  const errors = await render.getValidationMessages('error');
  if (errors === undefined) return;                        // FormGroup itself is invalid
  if (errors.length) {
    this.notify.error(errors);
    return;
  }

  await this.api.post('/api/requests', render.entity);
}
```

### 3. A hand-written schema

```ts
const schema: SdFormGeneric = {
  components: [
    {
      id: 'c1',
      key: 'fullName',
      type: 'textfield',
      label: 'Full name',
      layout: { columns: 6 },
      validate: { required: true, maxlength: 120 },
    },
    {
      id: 'c2',
      key: 'startDate',
      type: 'datetime',
      subtype: 'date',
      label: 'Start date',
      layout: { columns: 6 },
      validate: { min: 'TODAY' },
    },
    {
      id: 'c3',
      key: 'note',
      type: 'textarea',
      label: 'Reason',
      layout: { columns: 12 },
      properties: {
        // only ask for a reason when the start date is filled in
        requiredWhenExpression: {
          key: 'r1',
          type: 'combinator',
          combinator: '&&',
          conditions: [
            { key: 'r1c1', type: 'condition', field: 'startDate', operator: 'NOT_NULL', value: undefined, dayInfo: {} },
          ],
        },
      },
    },
  ],
};
```

## Anti-patterns

- ❌ Mutating the object bound to `[formGeneric]` and expecting the canvas to update — the builder only reacts to a **new reference**.
- ❌ Saving `render.entity` without awaiting `render.upload()` — file fields still point at local placeholders.
- ❌ Treating a falsy `getValidationMessages()` result as "valid" — it returns `undefined` when the `FormGroup` is invalid.
- ❌ Importing a field sub-component or a pipe from a deep path — they are not exported and the path is not an entry point.
- ❌ Reaching for this entry point when the fields are known at compile time. Static controls are smaller, typed, and easier to test.

## Related

- `<sd-table>` — backs the `table` field type.
- `<sd-upload-file>` — backs the `upload` field type.
- `<sd-query-builder>` — standalone condition builder for querying, when you do not need a whole form.
- `<sd-modal>` — hosts the builder's JSON/variables dialogs and the expression editor.
