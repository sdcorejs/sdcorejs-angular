# `<sd-entity-picker>`

**Type**: standalone form component
**Selector**: `sd-entity-picker`
**Import**: `@sdcorejs/angular/forms/entity-picker`
**Model**: `TKey | TKey[] | null | undefined`

## Purpose

Use `SdEntityPicker<T, TKey>` when a form stores stable entity keys but users need a searchable, pageable table to choose the entity. The component composes `SdQueryBar`, `SdTable`, `SdModal`, and `SdDataState`; it does not implement a second table or query engine.

```ts
import { SdEntityPicker, SdEntityPickerDataProvider } from '@sdcorejs/angular/forms/entity-picker';

readonly employees: SdEntityPickerDataProvider<Employee, number> = {
  load: request => this.api.searchEmployees({
    query: request.query,
    page: request.pageIndex,
    size: request.pageSize,
    orderBy: request.orderBy,
    orderDirection: request.orderDirection,
    signal: request.signal,
  }),
  hydrate: (keys, signal) => this.api.getEmployees(keys, signal),
};
```

```html
<sd-entity-picker
  [form]="form"
  name="employeeIds"
  label="Employees"
  [provider]="employees"
  [columns]="columns"
  [queryFields]="queryFields"
  valueField="id"
  displayField="name"
  multiple
  [(model)]="employeeIds" />
```

## Inputs

| Input                                             | Type                                  | Default              | Notes                                                                           |
| ------------------------------------------------- | ------------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `model`                                           | `TKey \| TKey[] \| null \| undefined` | `undefined`          | Single key or key array according to `multiple`.                                |
| `provider`                                        | `SdEntityPickerDataProvider<T, TKey>` | `undefined`          | Server page loader and optional initial-key hydrator.                           |
| `columns`                                         | `readonly SdTableColumn<T>[]`         | `[]`                 | Table columns. Without columns, a display column is generated.                  |
| `queryFields`                                     | `readonly SdQueryField<T>[]`          | `[]`                 | Advanced fields delegated to `SdQueryBar`.                                      |
| `pageSize`                                        | `number`                              | `20`                 | Server page size.                                                               |
| `valueField` / `keySelector`                      | nested field / `(item) => TKey`       | `undefined`          | Stable key extraction. `keySelector` wins.                                      |
| `displayField` / `displayWith`                    | nested field / `(item) => string`     | `undefined`          | Selected-value display. `displayWith` wins.                                     |
| `compareWith`                                     | `(left, right) => boolean`            | `Object.is`          | Key equality for custom key types.                                              |
| `disabledEntity`                                  | `(item) => boolean`                   | `undefined`          | Disables individual rows.                                                       |
| `multiple`                                        | `boolean`                             | `false`              | Enables key-array selection and page select-all.                                |
| `form` / `name`                                   | `FormGroup` / `string`                | — / UUID             | Registers through the shared SDCoreJS form connector.                           |
| `required`, `disabled`, `readonly`                | `boolean`                             | `false`              | Standard form-control policies. `required` renders a validation message (below). |
| `inlineError`                                     | `string \| undefined`                 | `undefined`          | Component-local error text; forces the control invalid and renders the message. |
| `viewed`                                          | `boolean \| 'inline'`                 | `false`              | Static display policy shared by SDCoreJS controls.                              |
| `clearable`                                       | `boolean`                             | `true`               | Shows the clear action when a value exists.                                     |
| `addable`                                         | `boolean`                             | `false`              | Shows an Add action and emits `sdAdd`; business creation stays in the host app. |
| `placeholder`, `modalTitle`, `ariaLabel`, `label` | `string`                              | localized / optional | Presentation and accessibility labels.                                          |

## Provider contract

`load(request)` returns `{ items, total }`. Every new search/page/sort request aborts the preceding request and receives its own `AbortSignal`. The component also ignores obsolete results and obsolete failures, so a provider that cannot cancel is still race-safe.

`hydrate(keys, signal)` resolves initial or off-page keys to entities for display. It should return only matching entities; missing keys remain in the model and are not silently deleted.

## Selection rules

- Draft selection is isolated while the modal is open; Apply commits and Cancel discards it.
- Selection is stored as keys, never as page object references.
- Select-all changes keys on the visible page and preserves keys from other pages.
- A refreshed page may return new entity objects without invalidating selection.
- Closing the modal restores focus to the trigger.

## Templates

```html
<sd-entity-picker ...>
  <ng-template sdEntityPickerSelected let-entities="entities" let-keys="keys"> {{ entities.length }} selected </ng-template>

  <ng-template sdEntityPickerRow let-employee="item"> <strong>{{ employee.name }}</strong> · {{ employee.department }} </ng-template>

  <ng-template sdEntityPickerDetail let-entities="entities"> {{ entities[0]?.description }} </ng-template>
</sd-entity-picker>
```

The selected/detail context exposes `$implicit`, `entities`, and `keys`; the row context exposes `$implicit` and `item`.

## Outputs and public methods

| Output                     | Payload                     | Notes                              |
| -------------------------- | --------------------------- | ---------------------------------- |
| `modelChange` / `sdChange` | `SdEntityPickerModel<TKey>` | Committed model changes.           |
| `sdAdd`                    | `void`                      | Host-owned create workflow.        |
| `sdLoadError`              | `unknown`                   | Current page or hydration failure. |

Public methods include `open()`, `applySelection()`, `cancel()`, `clear()`, `retry()`, `keyOf()`, and `displayEntity()`.

Public signals include `connectorState`, `errorMessage` (raw message for the current errors) and `visibleErrorMessage` (the same message after the interaction gate — this is what the template renders).

## Validation message

`[required]` and `[inlineError]` both surface a message under the trigger:

```html
<div data-entity-picker-error class="sd-entity-picker__error" role="alert">Vui lòng nhập thông tin</div>
```

- `required` → shared select message (i18n key `core.form.select.required`; the catalog has no picker-specific key yet).
- `inlineError` → the exact string you passed.
- The message is **interaction-gated**: it stays hidden until the control is `touched` or `dirty`, so a freshly rendered form is not painted red. `applySelection()` and `clear()` mark the control touched + dirty; a parent `markAllAsTouched()` on submit also reveals it.
- While the message is visible, the trigger carries `aria-invalid="true"` and `aria-describedby` pointing at the message element.

## Error and accessibility behavior

Provider errors render the compact error `SdDataState` with Retry — that is a **data-loading** failure and is separate from the validation message described above. Aborted/stale failures never replace the current result. The trigger uses `aria-haspopup="dialog"`, the modal owns focus containment, translated actions are available in en/vi/ja/ko/zh, and focus returns to the trigger after close.

## Anti-patterns

- Do not return the full dataset and page it again in the component; page in the provider.
- Do not use array/object identity as the persisted model; configure a stable key.
- Do not remove off-page keys when a page or filter changes.
- Do not start a create workflow inside the library; handle `sdAdd` in the application.
