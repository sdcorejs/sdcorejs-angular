# `<sd-form-builder>` & `<sd-form-render>`

**Type**: Components (two public components in one entry point)
**Selectors**: `sd-form-builder`, `sd-form-render`
**Import path**: `@sdcorejs/angular/components/form-generic`
**Classes**: `SdFormBuilder`, `SdFormRender`
**Standalone**: yes

## One-line purpose

A schema-driven form system: `<sd-form-builder>` is an embedded drag-and-drop designer that produces an `SdFormGenericSchema` JSON document, and `<sd-form-render>` turns that document into a live Angular form with a `[(value)]` model.

## When to use

- The set of fields is data, not code — a portal where an admin composes the form and end users fill it in.
- The same schema must drive both an editable form and a read-only detail view (`[viewed]`).
- Fields need to show/hide/disable/require each other through configured conditions rather than hand-written template logic.
- The layout must adapt to the width of the **form** (a drawer, a dialog, a page) with a span per level (desktop / tablet / mobile).

## When NOT to use

- A form whose fields are known at compile time. Compose `<sd-input>` / `<sd-select>` / … directly — you get real types and far less indirection.
- A single dynamic field. Use `@if` over the concrete control.
- A page that only needs conditional display. `@if` on a signal is lighter than a schema.

## Exported surface

The entry point exports exactly five runtime symbols — guarded by `src/public-api.spec.ts`:

| Runtime symbol                 | Kind                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `SdFormBuilder`                | component `sd-form-builder`                                 |
| `SdFormRender`                 | component `sd-form-render`                                  |
| `SdFormRenderService`          | service (`viewEntities`)                                    |
| `provideSdFormGeneric(config)` | `EnvironmentProviders` for the portal configuration         |
| `SD_FORM_GENERIC_BREAKPOINTS`  | frozen default breakpoints `{ tablet: 600, desktop: 1024 }` |

Everything else is **type-only**: the schema (`SdFormGenericSchema`, `SdFormGenericPage`, `SdFormGenericGroup`, `SdFormGenericVariable`, `SdFormGenericValidation`, …), the field model (`SdFormGenericField` and one interface per `type`, `SdFormGenericLayout`, `SdFormGenericRules`, `SdFormGenericFieldValidation`, `SdFormGenericOptions`, `SdFormGenericValueRef`, `SdFormGenericParam`, `SdFormGenericFill`, …), the configuration (`SdFormGenericConfig`, `SdFormGenericCatalog`, `SdFormGenericCatalogItem`, `SdFormGenericCatalogContext`, `SdFormGenericTemplate`, `SdFormGenericHtmlDefinition`, `SdFormGenericValidator`), the breakpoint types (`SdFormGenericBreakpoint`, `SdFormGenericBreakpoints`) and the result of `validate()` (`SdFormGenericValidationResult`, `SdFormGenericValidationMessages`).

**Not exported** (internal): the renderer's field sub-components, the builder's canvas / palette / inspector / preview parts and its state layer, the layout / rule / reference helpers, `FormGenericService`, the presets and the pipes. There is no supported way to mount one of them on its own.

---

## Schema — `SdFormGenericSchema`

This is the **first version** of the schema: there is no `schemaVersion` field and no migration from the pre-3.0 `SdFormGeneric` shape.

```ts
interface SdFormGenericSchema {
  pages: SdFormGenericPage[]; // a single-page form still stores one page
  navigation?: { type: 'tabs' } | { type: 'steps'; linear?: boolean }; // absent: first page; linear defaults false
  variables?: SdFormGenericVariable[]; // { key, label } — values come from [variables]
  validations?: SdFormGenericValidation[]; // form-level checks run by validate()
}

interface SdFormGenericPage {
  id: string;
  label?: string;
  icon?: string;
  rules?: { visible?: Filter; hidden?: Filter };
  elements: (SdFormGenericGroup | SdFormGenericField)[];
}
```

The grammar is fixed: **schema → pages → group | field**, and a group holds fields only — groups do not nest. Every element has an `id`; every field that stores a value has a `key`, unique across fields **and** variables (one namespace). A key cannot be a JavaScript `Object.prototype` name (`__proto__`, `constructor`, `toString`…) or `prototype`; the builder refuses it and the renderer skips such a field (one dev-mode warning per key). The renderer uses the first page when navigation is absent; the builder can edit all pages while preserving their serialized order and metadata.

### Tabs and steps

With no `navigation`, the renderer keeps the released first-page behavior. `{ type: 'tabs' }` renders the visible pages as manually activated tabs: arrows/Home/End move focus, Enter/Space activates. Labels use `page.label` or localized "Page n"; icons are optional. The header scrolls horizontally on narrow screens.

`{ type: 'steps' }` allows free step selection. Add `linear: true` to validate all visible predecessor pages before moving forward. Errors block advancement and reveal the first invalid page; warnings do not block. Previous/backward navigation remains available while async forward validation is pending and cancels that transition. Additional forward requests are rejected while it is pending; they are not queued. Changing schema, values, page visibility or the active page invalidates old results. There is no automatic save/submit or final-step callback.

```ts
const schema: SdFormGenericSchema = {
  navigation: { type: 'steps', linear: true },
  pages: [
    {
      id: 'contact',
      label: 'Contact',
      icon: 'person',
      elements: [{ id: 'email', key: 'email', type: 'textfield', label: 'Email', subtype: 'email', validation: { required: true } }],
    },
    { id: 'notes', label: 'Notes', elements: [{ id: 'note', key: 'note', type: 'textarea', label: 'Notes' }] },
  ],
};
```

```html
<sd-form-render #renderer [schema]="schema" [(value)]="value" [(activePageId)]="activePageId"></sd-form-render>
```

`activePageId` is transient navigation state. Initial null/unknown IDs choose the first visible page. If the active page disappears, the nearest surviving successor is selected, then predecessor/first. Consumer writes to a later linear step use the same validation gate as Next. A pending/rejected write restores the accepted model. No visible pages means `activePageId = null` and no header.

Visible inactive panels stay mounted with `hidden` and `inert`: controls, dirty/touched state and async validators remain intact, while inactive fields cannot receive focus. A rule-hidden page unmounts its owned controls and retains its values. `validate()` checks all visible pages, including unvisited ones, waits for async field validation, then runs form-level validations once. External FormGroup controls still participate. Only a current failed field-validation attempt navigates/focuses; global/external-only errors have no invented field destination. `upload()` visits mounted visible fields once and skips rule-hidden pages.

The builder page strip selects/adds/duplicates/reorders/deletes pages. Select a page to edit label/icon/visibility rules in the inspector; form settings choose Single page/Tabs/Steps and Linear. Page commands/configuration participate in the existing undo/redo history; page selection does not. The last page cannot be removed. Nonempty/referenced page deletion is confirmed, and external references remain for consumer repair. Duplicate rewrites only structured references owned by the copied page and assigns globally unique field keys/IDs. Unsupported elements disable page duplication with an explanation. Unknown metadata and imported pages survive single-page view. Preview uses the real renderer and applies page rules and navigation.

An element whose `type` this version does not know (added by a later release) is **skipped** by the renderer (one dev-mode warning per type) and **kept as-is** by the builder, which shows it as an "unsupported" card that can be moved or deleted but not edited or duplicated.

An `id` that is missing, or that repeats an earlier one (for example in hand-copied JSON), gets a new id when a component loads the schema; the first element keeps its id.

### Field base

Every field has these properties:

| Property                       | Type                           | Notes                                                                                                                                       |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                           | `string`                       | Unique element id.                                                                                                                          |
| `type`                         | see table below                | Discriminates the field union.                                                                                                              |
| `key`                          | `string`                       | The property of `value` this field reads and writes (optional on `html`).                                                                   |
| `label`                        | `string`                       | Visible label.                                                                                                                              |
| `placeholder`, `helperText`    | `string`                       | Hint inside the control / described-by text under it.                                                                                       |
| `defaultValue`                 | per type                       | Applied only while the key is `undefined` — see _Field behaviour_.                                                                          |
| `layout`                       | `SdFormGenericLayout`          | Span per level and `newRow` — see _Layout_.                                                                                                 |
| `rules`                        | `SdFormGenericRules`           | Dynamic `visible` / `hidden` / `disabled` / `required` conditions (`Filter`).                                                               |
| `validation`                   | `SdFormGenericFieldValidation` | Static constraints.                                                                                                                         |
| `disabled`, `viewed`, `hidden` | `boolean`                      | Static state. `viewed` is a read-only presentation (not the same as disabled).                                                              |
| `hyperlink`                    | `string`                       | Link used in viewed mode (select / radio); `${key}` inside is free text (not rewritten on rename) and is replaced by the URL-encoded value. |

```ts
interface SdFormGenericFieldValidation {
  required?: boolean;
  min?: number | 'today' | string; // number: numeric bound; datetime: 'today' (whole day for date+time) or an ISO date
  max?: number | 'today' | string;
  minLength?: number;
  maxLength?: number;
  pattern?: { value: string; message?: string };
  maxItems?: number; // chip-string / chip-calendar
  phoneCountry?: 'VN'; // textfield subtype 'phone'
}
```

### Field types

| `type`          | Adds                                                                                                                                | Value                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `textfield`     | `subtype?: 'text' \| 'email' \| 'phone' \| 'url' \| 'password'` (see _Presets_)                                                     | `string`                    |
| `textarea`      | —                                                                                                                                   | `string`                    |
| `number`        | `subtype?: 'integer' \| 'decimal' \| 'currency' \| 'percent'`, `precision?`, `currency?`                                            | `number`                    |
| `select`        | `options`, `multiple?`                                                                                                              | `string \| string[]`        |
| `radio`         | `options`, `direction?: 'row' \| 'column'`                                                                                          | `string`                    |
| `checkbox`      | —                                                                                                                                   | `boolean`                   |
| `datetime`      | `subtype?: 'date' \| 'datetime'`                                                                                                    | ISO `string`                |
| `chip-string`   | —                                                                                                                                   | `string[]`                  |
| `chip-calendar` | —                                                                                                                                   | `string[]` (dates)          |
| `upload`        | `accept?: 'file' \| 'image'`, `source?: 'ALL' \| 'PHOTO_LIBRARY' \| 'CAPTURE'`, `extensions?`, `maxFiles?`, `maxSizeMb?`, `params?` | result of the portal upload |
| `html`          | static `content` + `variables`, **or** a portal `definition` + `query`                                                              | — (no value)                |

A line break is no longer an element: a field that must start a new row sets `layout.newRow: true`.

### Group

```ts
interface SdFormGenericGroup {
  id: string;
  type: 'group';
  label: string;
  icon?: string; // Material icon name before the title
  color?: Color; // icon accent: primary (default) · secondary · info · success · warning · error
  collapsible?: boolean; // expand / collapse in the builder preview and the renderer
  hidden?: boolean;
  rules?: { visible?: Filter; hidden?: Filter };
  elements: SdFormGenericField[];
}
```

A group always takes a full row and is presentation only: its children read and write **flat** keys on `value`. A group whose children are all hidden is not rendered. Collapsing changes presentation only — child controls keep their values, touched state and validation.

### Layout

```ts
interface SdFormGenericLayout {
  span?: { desktop?: number; tablet?: number; mobile?: number }; // 1–12
  newRow?: boolean;
}
```

The grid has 12 columns and three levels. Inheritance:

| Level   | Span                                                    |
| ------- | ------------------------------------------------------- |
| desktop | `span.desktop ?? 12`                                    |
| tablet  | `span.tablet ?? span.desktop ?? 12` — _same as Desktop_ |
| mobile  | `span.mobile ?? 12` — _default_ (full row)              |

Rows are packed greedily in schema order: a field that does not fit starts a new row, `newRow: true` always starts one, and a group takes a full row. The renderer and the builder canvas use **the same packing function**, so the same schema at the same level gives the same rows.

The level is chosen from the width of the **form** — a `ResizeObserver` on the renderer's grid, not the viewport — so a form in a narrow drawer stacks like it would on a phone:

| Form width                           | Level   |
| ------------------------------------ | ------- |
| `< tablet` (600 px)                  | mobile  |
| `tablet` … `< desktop` (600–1023 px) | tablet  |
| `≥ desktop` (1024 px)                | desktop |

The thresholds are `SD_FORM_GENERIC_BREAKPOINTS`; a portal overrides either one with `provideSdFormGeneric({ breakpoints: { tablet: 700 } })` (the other keeps its default). `<sd-form-render [breakpoint]>` forces a level regardless of the width.

### Rules — `Filter`

Conditions are stored as `Filter` from `@sdcorejs/utils/models` — the same shape `<sd-query-builder>` edits — and evaluated against `{ ...value, ...variables }`:

```ts
rules: {
  visible:  { field: 'agree', operator: 'EQUAL', data: true },
  required: { field: 'amount', operator: 'GREATER_THAN', data: 1000 },
  disabled: { field: 'tenantLocked', operator: 'EQUAL', data: true },   // a variable key
}
```

- A field is shown when (`visible` is absent or true) **and** (`hidden` is absent or false) **and** the static `hidden` flag is off.
- `disabled` / `required` are OR-ed with the static `disabled` / `validation.required`.
- Field-to-field comparisons use `dataType: 'field'`; dates support `dataType: 'date-today'` and `'date-relative'`.
- On a multiple value (a `select` with `multiple`, chips) `IN` / `NOT_IN` mean _one selected item is / none is in the list_, and `EQUAL` / `NOT_EQUAL` mean _one selected item equals / none equals_.
- A checkbox without a value (never touched) counts as unticked: `EQUAL false` matches it.
- An `AND` / `OR` group without conditions is _no condition_: inside a group it is skipped, and a rule or a form validation that is only an empty group does not apply.
- `CONTAIN` / `START_WITH` / `END_WITH` (and their `NOT_` forms) on a multiple value compare the comma-joined text of the selected items.
- A condition the evaluator cannot read (hand-edited JSON, for example a leaf without `field`) never matches, so a form validation built on it never fires.
- A hidden field is not rendered (the rows reflow) and therefore not validated; its value stays in `value`.

### Form-level validations

```ts
type SdFormGenericValidation =
  | { type: 'filter'; filter: Filter; message: string; alert: 'error' | 'warning' } // message when the filter is true
  | { type: 'function'; validator: string; alert: 'error' | 'warning' }; // id of a registered validator
```

`validate()` runs them after the field validators. A `function` validation whose id is **not registered** in `provideSdFormGeneric({ validators })` fails closed with an error message (`core.component.form-generic.validation.unregistered`); a validator that throws reports `core.component.form-generic.validation.failed`. Only `error` messages make the form invalid.

### Options — static or catalog

```ts
type SdFormGenericOptions =
  | { source: 'static'; items: { value: string; label: string; disabled?: boolean }[] }
  | {
      source: 'catalog';
      catalog: string; // id of a registered catalog
      params?: { name: string; value: SdFormGenericValueRef }[];
      fill?: { field: string; from: string }[]; // on select: value[field] = item.data[from]
    };

type SdFormGenericValueRef = { field: string } | { variable: string } | { value: string | number | boolean };
```

A catalog is registered by the portal (see _Configuration_): the components never call HTTP themselves. `params` are resolved from `value` / `variables` and the catalog is reloaded when a resolved parameter changes; a catalog with `search` makes the select search by term instead. Loaded lists are cached per catalog and parameters for the lifetime of the renderer.

Every reference to another key is **structured** — `rules` (`Filter.field` and field-to-field `data`), `options.params`, `options.fill`, upload `params`, html `query`, form validations — so the builder can rename a key everywhere. `${key}` inside `hyperlink` and html `content` is free text and is never rewritten.

### Presets

Presets are **not** new types. They reuse `textfield` / `number` with a `subtype`, so nothing asks the end user for a regular expression.

| Preset   | Schema                                | Native input                                     | Validation (empty is always valid — `required` decides)                                             | Stored value                                                                                         |
| -------- | ------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Text     | `textfield`, no `subtype` or `'text'` | `type="text"`                                    | `minLength` / `maxLength` / `pattern`                                                               | string                                                                                               |
| Email    | `subtype: 'email'`                    | `type="email"`, `autocomplete="email"`           | format check                                                                                        | string, as typed                                                                                     |
| Phone    | `subtype: 'phone'`                    | `type="tel"`, `autocomplete="tel"`               | phone characters and 7–15 digits; with `validation.phoneCountry: 'VN'` the Vietnamese mobile format | string — `+` and a leading `0` are kept                                                              |
| URL      | `subtype: 'url'`                      | `type="url"`                                     | `http://` / `https://` only                                                                         | string                                                                                               |
| Password | `subtype: 'password'`                 | `type="password"`, `autocomplete="new-password"` | none                                                                                                | string; **never** filled from `defaultValue`, **never** shown in viewed mode (a fixed mask is shown) |
| Integer  | `number`, `subtype: 'integer'`        | numeric keyboard when `min ≥ 0`                  | whole numbers only                                                                                  | number                                                                                               |
| Decimal  | `subtype: 'decimal'`                  | decimal keyboard                                 | at most `precision` decimals (default 2)                                                            | number                                                                                               |
| Currency | `subtype: 'currency'`                 | as decimal                                       | at most `precision` decimals (default 0)                                                            | number — `currency` (default `VND`) is a display suffix                                              |
| Percent  | `subtype: 'percent'`                  | as decimal                                       | at most `precision` decimals (default 2)                                                            | number — `10` means 10 %                                                                             |

A `number` without `subtype` keeps the `<sd-input-number>` default of 3 decimals, while editing and in viewed mode. In viewed mode a URL links only safe `http(s)` URLs. A `validation.pattern` that is not a valid regular expression is ignored by the renderer (with a dev-mode warning) and flagged in the builder inspector.

### HTML field

Either static `content` with `${key}` placeholders filled from `variables`, or `definition` — the id of a portal html definition. A `static` definition supplies the content; a `query` definition receives `query` (value refs resolved like catalog params) and is called again when a resolved parameter changes. Content is sanitized.

---

## Configuration — `provideSdFormGeneric`

Portal-wide data enters the form only through this provider. Without it both components work with the default breakpoints, no catalogs, templates, html definitions or validators. Call it at bootstrap or in the `providers` of a route: the builder, the renderer and `SdFormRenderService` under that route all read the route's configuration.

```ts
import { provideSdFormGeneric } from '@sdcorejs/angular/components/form-generic';

bootstrapApplication(AppComponent, {
  providers: [
    provideSdFormGeneric({
      catalogs: [
        {
          id: 'districts',
          label: 'Districts',
          params: [{ name: 'provinceId', label: 'Province', required: true }],
          fields: [{ name: 'postalCode', label: 'Postal code' }],
          load: async ({ provinceId }) =>
            (await api.districts(provinceId)).map(d => ({ value: d.id, label: d.name, data: { postalCode: d.zip } })),
          labels: async values => api.districtLabels(values), // optional: labels for viewed mode / viewEntities
        },
      ],
      validators: [
        {
          id: 'budget',
          label: 'Budget covers the request',
          validate: value => ((value['amount'] as number) > (value['budget'] as number) ? 'Amount exceeds the budget.' : null),
        },
      ],
      htmlDefinitions: async () => api.htmlDefinitions(), // an array, a factory or an async factory
      templates: [], // quick-pick field templates in the builder inspector
      breakpoints: { tablet: 700 }, // partial override of SD_FORM_GENERIC_BREAKPOINTS
    }),
  ],
});
```

| Key               | Type                           | Used by                                                                                                                                                                    |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalogs`        | `SdFormGenericCatalog[]`       | `options.source: 'catalog'`. `load(params, ctx)`, optional `search(term, params, ctx)` and `labels(values, params)`; `params` / `fields` describe what the builder offers. |
| `validators`      | `SdFormGenericValidator[]`     | `{ type: 'function', validator: id }`. `validate(value)` returns a message (may be HTML) or `null` / `''`.                                                                 |
| `htmlDefinitions` | list, factory or async factory | html `definition`. Called once.                                                                                                                                            |
| `templates`       | `SdFormGenericTemplate[]`      | Builder inspector: apply a predefined field (same `type`).                                                                                                                 |
| `breakpoints`     | `{ tablet?, desktop? }`        | Level thresholds of both components.                                                                                                                                       |

---

## `<sd-form-render>`

Turns a schema into a live form. `OnPush`. It never mutates the schema or the value object you pass.

### Inputs

| Name             | Type                                        | Default      | Notes                                                                                                                            |
| ---------------- | ------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `schema`         | `SdFormGenericSchema`                       | **required** | Normalised internally (missing or repeated ids get new ids); the input is never mutated.                                         |
| `value`          | `Record<string, unknown>`                   | `{}`         | `model()` — bind `[(value)]`. Every change emits a **new** object; the previous object is untouched (a deep-frozen value works). |
| `activePageId`   | `string \| null`                            | `null`       | `model()` - bind `[(activePageId)]`. Effective visible page; consumer forward requests obey the linear gate.                     |
| `form`           | `FormGroup \| null`                         | own group    | The reactive form the controls register into — supply yours to read status from the parent.                                      |
| `variables`      | `Record<string, unknown> \| null`           | `null`       | Values for the schema variables; used by rules, value refs and hyperlinks.                                                       |
| `viewed`         | `boolean`                                   | `false`      | Read-only presentation of the whole form.                                                                                        |
| `breakpoint`     | `'desktop' \| 'tablet' \| 'mobile' \| null` | `null`       | Forces a level; `null` measures the form width.                                                                                  |
| `labelPlacement` | `'top' \| 'float'`                          | `'top'`      | Labels above the controls (real `<label for>`), or Material floating labels.                                                     |
| `keys`           | `readonly string[] \| null`                 | `null`       | Renders only the fields whose key is listed.                                                                                     |

### Methods

| Name         | Signature                                      | Notes                                                                                                                                                                                                                                                                               |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate()` | `() => Promise<SdFormGenericValidationResult>` | Marks every control touched, waits for pending async validators, then runs the form-level `validations`. Always resolves `{ valid, messages: { error: string[]; warning: string[] } }` — never `undefined`. `valid` is `false` when a field is invalid or an `error` message fired. |
| `upload()`   | `() => Promise<void>`                          | Uploads the pending files of every `upload` field with its resolved `params` and writes the results into `value`. **Call it before saving.**                                                                                                                                        |

### Field behaviour

- `defaultValue` fills a key only while it is `undefined` — a key the user cleared (`null`, `''`) is not refilled. Not in viewed mode, and never for the password preset.
- Controls register into the `FormGroup` while rendered; a hidden field unregisters, so it does not block `validate()`.
- A viewed field (its own `viewed`, or the renderer's `[viewed]`) is not validated: the user cannot change it, so its `required` and constraints never make `validate()` fail.
- A select / radio with catalog options loads (or searches) through the portal catalog; choosing an item applies `fill`.
- In viewed mode values are formatted like `SdFormRenderService.viewEntities` (option labels, dates, numbers by preset, password mask).

---

## `<sd-form-builder>`

An **embedded** visual designer, not an application: it has no header, save / draft / publish / import / export actions. Persistence belongs to the host page. It fills the height its host gives it — give the element (or its flex container) a height.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [Design | Preview | Schema]  [Desktop | Tablet | Mobile]            [↶] [↷] [⋮]  │
├──────────────────────┬──────────────────────────────────────┬────────────────────┤
│ Components|Structure │ canvas (rows of the level in view)   │ Properties         │
└──────────────────────┴──────────────────────────────────────┴────────────────────┘
```

### Inputs / outputs

| Name     | Type                                      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema` | `model<SdFormGenericSchema \| undefined>` | Bind `[(schema)]`. The builder emits `schemaChange` with an independent snapshot (deep clone) after **every user change**, including undo and redo — not when a schema loads, nor for selection, mode or viewport changes. A new reference with **different content** loads another form and resets the undo history and the selection. The snapshot the builder just emitted, or another object with the **same content**, is ignored — so `[(schema)]` neither loops nor wipes the history. Mutating the bound object in place does nothing; pass a new object. |

```html
<sd-form-builder [(schema)]="schema"></sd-form-builder>
```

| Method        | Notes                                                        |
| ------------- | ------------------------------------------------------------ |
| `getSchema()` | Snapshot of the current schema (deep clone), safe to mutate. |

### Behaviour notes

- **Desktop | Tablet | Mobile** picks the level being designed. The canvas packs rows with the span of that level (the same packing as the renderer) in a 768 px (tablet) or 390 px (mobile) frame. Resizing a field and the _Layout_ tab write the span of **that level only**; a level without its own span shows _Same as Desktop_ (tablet) or _Default_ (mobile), and _Reset to inherited_ removes the level's own span.
- **Start a new row** (`layout.newRow`) is a switch in _Layout_ and in each field's ⋮ menu; the canvas marks such fields. When a drop needs a row start to keep the row you pointed at, the planner turns `newRow` on instead of inserting an element.
- **Preview** is the real `<sd-form-render>` with `[breakpoint]` forced to the level in view — its rows match the canvas at every level. The canvas also keeps a place for statically hidden fields (dimmed) and unsupported elements so they stay selectable; the renderer skips them, so around such an element the canvas rows can differ from Preview. Test data typed there never reaches the schema; _Validate_ runs `validate()` and lists invalid fields and form messages separately.
- **Schema** shows the read-only JSON that `schemaChange` emits. The level switch is hidden there.
- **One drop position per pointer location**: the top or bottom quarter of a row means _a new row above / below_; the middle means _this row_. A new field dropped into a row takes the remaining width (at least 3 columns); an existing field must fit as it is. Other fields are never shrunk. The indicator and the commit use the same planner. Moving or deleting an element never pulls untouched rows up: the planner turns `newRow` on where a row would otherwise merge into the one before it — for a move at the level in view, for a delete at every level. `newRow` is one flag for all levels, so a row start kept for one level also starts a row at the others.
- **Groups** are edited in place. Fields move page ↔ group and group ↔ group by dragging or through the ⋮ menu (_Move into group …_, _Move out of group_). Groups do not nest.
- **Inspector**: _General · Data · Rules · Layout_ for a field, _General · Rules · Layout_ for a group. _Data_ chooses the options source — a static list (value, label; reorder by the grip or ↑ / ↓) or a portal catalog with its parameters (`params`: field, variable or fixed value) and _Fill other fields on select_ (`fill`). _Rules_ edits `visible` / `hidden` / `disabled` / `required` in `<sd-query-builder>` and stores the `Filter` as is. The ⋮ _Tools_ menu holds the variables and form-validation dialogs; form validations are a `Filter` with a message or a registered validator.
- **Undo / redo**: every edit is one command; typing in one property coalesces into one step; 100 steps are kept. Ctrl/⌘+Z, Ctrl/⌘+Y and Ctrl/⌘+Shift+Z act inside the builder only and never replace the text undo of an input.
- **Keys**: a new field gets `<preset>_<hash>` (`email_k3x9qa`), never an existing key. Renaming checks the format and uniqueness (fields of every page and variables share one namespace), then asks **Yes / No** with how many structured references are updated with it, how many free-text uses (`hyperlink`, html `content`) are not, and that data saved under the old key is not moved. Applying a template whose key differs asks the same question — _No_ applies the template and keeps the key. Renaming a variable in the variables dialog updates its structured references too; saving the dialog without a variable that is still used asks first.
- **Delete** asks first when a group still has fields or other elements reference the key; every delete offers **Undo** in a 5 s toast that closes as soon as the schema changes in another way. Focus moves to the neighbouring card (or the group, or the canvas).
- **Drag** uses Pointer Events for mouse, pen and touch; on touch only the grip starts a drag so the canvas still scrolls. Nothing is written until release; Escape or dropping outside the canvas cancels.
- When the builder is narrower than 900 px, the palette and the inspector become overlay panels opened from the toolbar; opening one moves focus into it and Escape closes it back to its button.
- Requires `SdConfirmService` and `SdNotifyService` (both `providedIn: 'root'`).

### Keyboard

| Keys                               | Where                                                | Action                          |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------- |
| Enter / Space                      | canvas card                                          | select                          |
| Delete / Backspace                 | selected card                                        | delete (asks when needed)       |
| Alt+↑ / Alt+↓                      | selected card                                        | move before / after its sibling |
| Ctrl/⌘+D                           | selected card                                        | duplicate                       |
| Ctrl/⌘+Z, Ctrl/⌘+Y, Ctrl/⌘+Shift+Z | anywhere in the builder except text inputs           | undo / redo                     |
| Escape                             | while dragging or resizing                           | cancel                          |
| Escape                             | inside an open overlay panel (narrow builder)        | close it                        |
| ← / → / ↑ / ↓ / Home / End         | Design · Preview · Schema, Desktop · Tablet · Mobile | switch                          |
| ↑ / ↓ / Home / End / Enter         | Structure tree                                       | move / select                   |
| ↑ / ↓                              | grip of a static option (inspector)                  | move the option up / down       |

---

## `SdFormRenderService`

| Method                           | Signature                                                                               | Notes                                                                                                                                                                                                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `viewEntities(schema, entities)` | `(SdFormGenericSchema, Record<string, unknown>[]) => Promise<Record<string, string>[]>` | Display text per field key for each entity — option labels (static items, or the catalog's `labels` / `load`), dates, numbers by preset, the password mask. For list and export screens. Within one call a catalog without `labels` is loaded once per resolved parameters, not once per value. |

---

## Examples

### 1. Design a form, then render it

```ts
import { Component, signal } from '@angular/core';
import { SdFormBuilder, SdFormRender, type SdFormGenericSchema } from '@sdcorejs/angular/components/form-generic';

@Component({
  selector: 'app-form-designer',
  imports: [SdFormBuilder, SdFormRender],
  template: `
    <div style="height: 720px">
      <sd-form-builder [(schema)]="schema"></sd-form-builder>
    </div>
    <sd-form-render [schema]="schema()" [(value)]="value"></sd-form-render>
  `,
})
export class FormDesignerComponent {
  readonly schema = signal<SdFormGenericSchema>({ pages: [{ id: 'main', elements: [] }] });
  readonly value = signal<Record<string, unknown>>({});

  save() {
    return this.api.post('/api/forms', this.schema());
  }
}
```

### 2. Validate, upload and submit

```ts
async submit(render: SdFormRender) {
  const { valid, messages } = await render.validate();
  if (messages.warning.length) this.notify.warning(messages.warning);
  if (!valid) {
    if (messages.error.length) this.notify.error(messages.error);
    return;
  }
  await render.upload();                         // resolve file fields first
  await this.api.post('/api/requests', this.value());
}
```

### 3. A hand-written schema

```ts
const schema: SdFormGenericSchema = {
  pages: [
    {
      id: 'main',
      elements: [
        {
          id: 'f1',
          key: 'fullName',
          type: 'textfield',
          label: 'Full name',
          layout: { span: { desktop: 6, mobile: 12 } },
          validation: { required: true, maxLength: 120 },
        },
        {
          id: 'f2',
          key: 'email',
          type: 'textfield',
          subtype: 'email', // preset: format checked, no regex needed
          label: 'Email',
          placeholder: 'name@example.com',
          layout: { span: { desktop: 6 } }, // tablet follows desktop, mobile is a full row
        },
        {
          id: 'f3',
          key: 'province',
          type: 'select',
          label: 'Province',
          layout: { span: { desktop: 4, tablet: 6 } },
          options: {
            source: 'static',
            items: [
              { value: 'HN', label: 'Hà Nội' },
              { value: 'SG', label: 'TP. HCM' },
            ],
          },
        },
        {
          id: 'f4',
          key: 'district',
          type: 'select',
          label: 'District',
          layout: { span: { desktop: 4, tablet: 6 } },
          options: {
            source: 'catalog',
            catalog: 'districts',
            params: [{ name: 'provinceId', value: { field: 'province' } }],
            fill: [{ field: 'postalCode', from: 'postalCode' }],
          },
        },
        {
          id: 'g1',
          type: 'group',
          label: 'Budget',
          icon: 'payments',
          elements: [
            {
              id: 'f5',
              key: 'budget',
              type: 'number',
              subtype: 'currency',
              label: 'Budget',
              layout: { span: { desktop: 6 } },
              validation: { min: 0 },
              currency: 'VND',
            },
            {
              id: 'f6',
              key: 'reason',
              type: 'textarea',
              label: 'Reason',
              layout: { newRow: true }, // always on its own row
              rules: { required: { field: 'budget', operator: 'GREATER_THAN', data: 100000000 } },
            },
          ],
        },
      ],
    },
  ],
  validations: [{ type: 'function', validator: 'budget', alert: 'error' }],
};
```

## Accessibility

- **Canvas cards** are `role="button"` elements with `aria-pressed` (selected) and an `aria-label` built from the label, the preset and the required / hidden state. The card content is an `aria-hidden` illustration without real inputs. The drag grip, duplicate, delete and ⋮ menu are separate buttons, rendered for the selected field only, which keeps the DOM of large forms small.
- **Structure** is an ARIA tree with a roving tab stop (↑ ↓ Home End, Enter selects and scrolls the canvas to the item).
- Adding, moving, deleting and undoing are announced through a polite live region. Every drag has a keyboard path: Alt+↑ / Alt+↓, the ⋮ menu (_Move into group …_, _Move out of group_, _Start a new row_) and click / Enter on a palette item. Resize has _Layout_ → width of the level in view.
- In `<sd-form-render>` (default `labelPlacement="top"`) each control is named by exactly one visible label and described by its helper text or its error.

## Limitations

- Static content elements beyond the existing HTML field, action buttons, and repeating tables are not part of this release. Tabs/steps and page editing are supported as described above.
- `checkbox` `validation.required` is not enforced (`<sd-checkbox>` has no `required` input).
- The password preset has no show / hide toggle.
- Groups always span the full row and do not nest.
- Schema mode is read-only.

## Anti-patterns

- ❌ Mutating the object bound to `[(schema)]` and expecting the canvas to update — the builder only reacts to a **new reference** with different content.
- ❌ Writing a delayed save response back into `[(schema)]`. If the user edited meanwhile, the older schema differs from the current one and is loaded, discarding the newer edits and the undo history. Keep the schema you sent.
- ❌ Calling HTTP from a component or pipe to feed a select — register a catalog in `provideSdFormGeneric` and reference it with `options: { source: 'catalog' }`.
- ❌ Referencing a function validation id that the portal does not register — it fails closed and blocks submit.
- ❌ Asking end users for a regex to validate an email or a phone number — use the `email` / `phone` presets.
- ❌ Saving without awaiting `render.upload()` — file fields still hold local placeholders.
- ❌ Importing a field sub-component, a pipe or a helper from a deep path — they are not exported and the path is not an entry point.

## Related

- `<sd-query-builder>` — edits the `Filter` conditions the schema stores.
- `<sd-upload-file>` — backs the `upload` field type.
- `<sd-section>` — renders a group.
- `<sd-input>` / `<sd-select>` / … — the controls the renderer composes; `labelPlacement` is available on them too (default `'float'` there).
