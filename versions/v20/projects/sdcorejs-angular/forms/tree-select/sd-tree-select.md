# `<sd-tree-select>`

**Type**: standalone form component
**Selector**: `sd-tree-select`
**Import**: `@sdcorejs/angular/forms/tree-select`
**Model**: `TKey | TKey[] | null | undefined`

## Purpose

`SdTreeSelect<T, TKey>` is a stable-key form control that opens `SdTree` in a modal. Use it for organization units, categories, permissions, or any hierarchy where the form must persist keys rather than loaded node objects.

```html
<sd-tree-select
  [form]="form"
  name="departmentIds"
  [items]="departmentItems"
  [tree]="treeOption"
  valueField="id"
  displayField="name"
  multiple
  cascade="descendants"
  [(model)]="departmentIds" />
```

## Inputs

| Input                                             | Type                                  | Default                  | Notes                                                                       |
| ------------------------------------------------- | ------------------------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `model`                                           | `TKey \| TKey[] \| null \| undefined` | `undefined`              | Single key or key array according to `multiple`.                            |
| `items`                                           | `SdTreeDataSource<SdTreeItem<T>>`     | `[]`                     | Array, signal, sync loader, or async loader accepted by `SdTree`.           |
| `tree`                                            | `SdTreeOption<T>`                     | `{ loadType: 'static' }` | Static children or lazy `onExpandChildren`.                                 |
| `valueField` / `keySelector`                      | nested field / `(item) => TKey`       | `undefined`              | Stable key extraction. `keySelector` wins.                                  |
| `displayField` / `displayWith`                    | nested field / `(item) => string`     | `undefined`              | Trigger/view display. Unknown unloaded keys fall back to their string form. |
| `compareWith`                                     | `(left, right) => boolean`            | `Object.is`              | Key equality.                                                               |
| `disabledNode`                                    | `(item, selectedItems) => boolean`    | `undefined`              | Per-node selection policy.                                                  |
| `multiple`                                        | `boolean`                             | `false`                  | Enables key-array selection.                                                |
| `cascade`                                         | `'independent' \| 'descendants'`      | `'independent'`          | Applies selection to loaded descendants and reconciles loaded ancestors.    |
| `form` / `name`                                   | `FormGroup` / `string`                | — / UUID                 | Shared parent-form registration.                                            |
| `required`, `disabled`, `readonly`                | `boolean`                             | `false`                  | Standard form-control policies. `required` renders a message (below).       |
| `inlineError`                                     | `string \| undefined`                 | `undefined`              | Component-local error text; forces invalid and renders the message.         |
| `viewed`                                          | `boolean \| 'inline'`                 | `false`                  | Static display mode.                                                        |
| `clearable`                                       | `boolean`                             | `true`                   | Shows clear when a model exists.                                            |
| `placeholder`, `modalTitle`, `ariaLabel`, `label` | `string`                              | localized / optional     | Presentation/accessibility labels.                                          |
| `helperText`                                      | `string \| undefined`                 | `undefined`              | Info tooltip next to the floating label (same as the other form controls).  |
| `size`                                            | `Size`                                | `'md'`                   | Field height; matches `<sd-select>` (`'md'` / `'sm'`).                      |
| `appearance`                                      | `MatFormFieldAppearance \| undefined` | `SD_FORM_CONFIGURATION` ?? `'outline'` | Shell appearance, resolved like every other form control.       |
| `hideInlineError`                                 | `boolean`                             | `false`                  | Swaps the message under the field for a trailing error icon + tooltip.      |

## Shell

The trigger is a `<mat-form-field>` wrapping a readonly `<input matInput>` — the same shell every other picker in the pack uses — so a tree select lines up with `<sd-select>` in height, border, floating label, error subscript, and clear affordance. The one deliberate difference is the suffix icon: `account_tree` instead of the select caret, signalling that the control opens a tree dialog rather than a dropdown list. As in `<sd-select>`, the clear `×` **replaces** that icon while a value is present and `clearable` is on.

The input stays `readonly`: typing does nothing, no mobile keyboard opens, and click / <kbd>Enter</kbd> / <kbd>Space</kbd> all open the modal.

Because the input carries no `NgControl` (its text is the display string, while the real value is a key), the component feeds Material's `errorState` through a custom `errorStateMatcher` bound to `visibleErrorMessage()`. That is what turns the outline red, renders `<mat-error>`, and sets `aria-invalid`.

Inside the modal, the search box is an `<sd-input>` and the footer buttons are `<sd-button>` (`outline`/`secondary` for cancel, `fill`/`primary` for apply). The body owns its own `16px` padding because `.sd-modal-body` is intentionally padding-free.

## Static and lazy trees

Static nodes use `children`. Lazy nodes use `hasChildren` and the loader in `tree.onExpandChildren`. The picker delegates expansion, keyboard behavior, retry, and lazy caching to `SdTree`.

```ts
readonly treeOption: SdTreeOption<Department> = {
  loadType: 'lazy',
  onExpandChildren: item => this.api.children(item.data.id),
};
```

Root and branch request races are contained: obsolete root results cannot overwrite a newer source, and obsolete lazy results cannot attach to a replaced tree generation.

## Selection semantics

- Single mode keeps at most one loaded node selected.
- Independent mode changes only the activated node.
- Descendant cascade applies to descendants already loaded by `SdTree`; partial child selection renders the parent indeterminate.
- Disabled nodes are not selected by user interaction.
- Search hides nodes but does not delete their keys.
- Initial keys for nodes that have not loaded are preserved and shown as fallback text until their entities become available.
- The composed `SdTree` declares **no selection actions**, so its floating quick-action bar never appears here — the count is redundant with the checkboxes, and Apply/Cancel already live in the modal footer. See `sd-tree.md`.

## Node template

```html
<sd-tree-select ...>
  <ng-template sdTreeSelectNode let-item let-level="level" let-loading="loading" let-retry="retry">
    {{ level + 1 }}. {{ item.name }} @if (loading) { Loading… }
  </ng-template>
</sd-tree-select>
```

The typed context is the `SdTreeItemContext<T>` contract, including node metadata, selection/loading/error state, `toggle()`, `select()`, and `retry()`.

## Outputs and public methods

| Output                     | Payload                   | Notes                              |
| -------------------------- | ------------------------- | ---------------------------------- |
| `modelChange` / `sdChange` | `SdTreeSelectModel<TKey>` | Committed model changes.           |
| `loadError`              | `SdTreeLoadErrorEvent<T>` | Forwarded root or lazy-node error. |

Public methods include `open()`, `applySelection()`, `cancel()`, `clear()`, `filter()`, `retry()`, `keyOf()`, and `displayEntity()`.

Public signals include `connectorState`, `errorMessage` (raw message for the current errors) and `visibleErrorMessage` (the same message after the interaction gate — this is what the template renders).

## Validation message

`[required]` and `[inlineError]` both surface a message under the trigger, as a `<mat-error>` in the field subscript:

```html
<mat-error id="sd-tree-select-error-…" data-tree-select-error>Vui lòng nhập thông tin</mat-error>
```

- `required` → shared select message (i18n key `core.form.select.required`; the catalog has no tree-select-specific key yet).
- `inlineError` → the exact string you passed.
- The message is **interaction-gated**: hidden until the control is `touched` or `dirty`. `applySelection()` and `clear()` mark the control touched + dirty; a parent `markAllAsTouched()` on submit also reveals it.
- While the message is visible, `MatFormField` points the trigger's `aria-describedby` at it and the outline turns red. `aria-invalid` follows Material's rule (and therefore `<sd-select>`'s): it stays unset while the field is both `required` and empty, and reads `true` for every other error.
- `[hideInlineError]` moves the message into a trailing error icon tooltip instead.

`loadError` / tree loading failures are a separate concern and are not routed through this message.

## Accessibility

The trigger exposes dialog semantics and restores focus after close. `SdTree` provides roving tabindex, Arrow/Home/End navigation, Left/Right expand-collapse behavior, Space/Enter selection, `aria-level`, `aria-expanded`, and `aria-checked="mixed"` for partial cascade selection. Default actions are translated in en/vi/ja/ko/zh.

## Anti-patterns

- Do not pass raw entities directly; wrap them as `SdTreeItemStatic` or `SdTreeItemLazy` with stable node IDs.
- Do not expect descendant cascade to select nodes that have never loaded.
- Do not rebuild tree selection by visible rows and thereby discard hidden/unloaded keys.
- Do not duplicate lazy loading in the picker host; configure `SdTreeOption` once.
