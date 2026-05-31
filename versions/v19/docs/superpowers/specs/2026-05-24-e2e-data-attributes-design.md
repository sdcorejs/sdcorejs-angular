# Spec — vn-angular E2E `data-*` runtime-state attributes

- **Date:** 2026-05-24
- **Status:** Draft (awaiting user review)
- **Owner:** vn-angular maintainers
- **Related:** existing `autoId` pattern across `projects/sdcorejs-angular/forms/**` and `projects/sdcorejs-angular/components/**`

## 1. Problem & Goals

The repo already ships an `autoId` convention: each Core UI component accepts an `autoId` input, namespaces it (`forms-input-<x>`, `components-modal-<x>`, …), and renders it as `[attr.data-autoId]` on a stable anchor element. QA automation uses `[data-autoid="..."]` selectors to locate elements.

That covers **identity** but not **runtime state**. QA still has to read Angular internals (or guess via CSS classes) to answer:

- Is this control disabled?
- What value is currently held?
- Is the form control empty / invalid?
- Is the modal / side-drawer open?
- Is the table / upload / editor currently loading?

This spec extends the existing `autoId` pattern with a small, consistent set of `data-*` attributes that expose runtime state through the DOM, so QA selectors can wait/assert without hooking into Angular.

**Goals**

1. Surface runtime state (`loading`, `disabled`, `value`, `empty`, `invalid`, `opened`, `count`) as `data-*` attributes on the same anchor element that already carries `data-autoId`.
2. Keep the convention identical across all components (always-present, `"true"`/`"false"` string, lowercase).
3. Document the catalog **per-component** AND in a **central reference doc** so both human QAs and downstream AI agents can discover what each component exposes.
4. Test the new attributes alongside the existing `autoId` test blocks.

**Non-goals**

- No new public API surface beyond template attributes (no new `@Input`s, no new directive).
- No retrofit of pre-`autoId` components that don't yet have the `autoId` input — those are out-of-scope.
- No e2e runner / Playwright scaffolding inside this repo. We only expose the hooks.

## 2. Attribute catalog

All attributes are **always present** on relevant components and use lowercase names (the browser normalizes data-attribute names to lowercase anyway). Boolean attributes carry the string literals `"true"` or `"false"`.

| Attribute | Value | Applies to | Source signal |
|---|---|---|---|
| `data-autoid` | `<namespace>-<component>-<autoId>` | All components with `autoId` input (existing) | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | All forms, button, editor, upload-file | `formControl.disabled` (forms) or `disabled` input (button/editor/upload-file) |
| `data-loading` | `"true"` / `"false"` | select, autocomplete, button, side-drawer, table, upload-file, editor | `loading` signal (or input where present) |
| `data-value` | stringified primitive | All form controls **except** input with `type="password"` and upload-file/editor (omitted there) | `formControl.value` through `sdSerializeDataValue()` |
| `data-empty` | `"true"` / `"false"` | All forms, upload-file, editor | `sdIsEmpty(value)` |
| `data-invalid` | `"true"` / `"false"` | All scalar/collection form controls that participate in validation | `formControl.invalid && (touched \|\| dirty)` |
| `data-opened` | `"true"` / `"false"` | modal, side-drawer | `isOpened` signal |
| `data-count` | numeric string | chip, chip-calendar, upload-file | `value.length` (or `files.length` for upload-file) |

**Serialization rules** (implemented in `sdSerializeDataValue`):

- `null` / `undefined` / `""` → `data-value=""`, paired with `data-empty="true"`.
- `Date` → `value.toISOString()`.
- `Array` / `object` → `JSON.stringify(value)`.
- `boolean` / `number` → `String(value)`.
- For `sd-input` with `type === 'password'`, `data-value` is **omitted entirely** (bound to `null`, which Angular's `[attr.*]` removes from the DOM). `data-empty` is still rendered.

## 3. Per-component matrix

### 3.1 Forms (scalar FormControl)

| Component | data-disabled | data-value | data-empty | data-invalid | data-loading | data-count | Anchor element |
|---|---|---|---|---|---|---|---|
| `sd-input` | ✓ | ✓ (skip if `type=password`) | ✓ | ✓ | — | — | inner `<input matInput>` |
| `sd-textarea` | ✓ | ✓ | ✓ | ✓ | — | — | `<textarea matInput>` |
| `sd-input-number` | ✓ | ✓ | ✓ | ✓ | — | — | `<input>` |
| `sd-switch` | ✓ | ✓ (`"true"`/`"false"`) | ✓ | — | — | — | `<mat-slide-toggle>` |
| `sd-checkbox` | ✓ | ✓ | ✓ | — | — | — | `<mat-checkbox>` |
| `sd-radio` | ✓ | ✓ (selected key) | ✓ | — | — | — | `<mat-radio-group>` |
| `sd-date` | ✓ | ✓ (ISO) | ✓ | ✓ | — | — | `<input>` |
| `sd-datetime` | ✓ | ✓ (ISO) | ✓ | ✓ | — | — | `<input>` |

### 3.2 Forms (collection / async)

| Component | data-disabled | data-value | data-empty | data-invalid | data-loading | data-count | Anchor |
|---|---|---|---|---|---|---|---|
| `sd-select` | ✓ | ✓ (selected key) | ✓ | ✓ | ✓ (async options) | — | `<mat-select>` host |
| `sd-autocomplete` | ✓ | ✓ (selected key) | ✓ | ✓ | ✓ | — | `<input>` |
| `sd-chip` | ✓ | ✓ `JSON.stringify(arr)` | ✓ | — | — | ✓ | `<input.sd-chip-input>` |
| `sd-chip-calendar` | ✓ | ✓ ISO[] JSON | ✓ | — | — | ✓ | `<input.sd-chip-input>` |
| `sd-date-range` | ✓ | ✓ `{from,to}` ISO JSON | ✓ (either side missing) | ✓ | — | — | `<input>` |

### 3.3 Components

| Component | data-autoId placement | data-opened | data-loading | data-disabled | data-empty | data-count | Notes |
|---|---|---|---|---|---|---|---|
| `sd-button` | existing `<button mat-*>` (4 branches for 4 button types) | — | ✓ (`loading()` input) | ✓ (`disabled()` input) | — | — | No value semantics. |
| `sd-modal` | **NEW** wrapping `<div class="sd-modal-root">` inside `<ng-template>` | ✓ (`isOpened()`) | — | — | — | — | Dialog renders into MatDialog overlay (document.body). Wrapper is the QA anchor. |
| `sd-side-drawer` | existing `.sd-side-drawer` root in template | ✓ | ✓ | — | — | — | Convert `isOpened` and `isLoading` from plain booleans to signals (see §6). |
| `sd-table` | host element (already carries `data-autoId` today) | — | ✓ (`loading` signal — already exists) | — | — | — | |
| `sd-upload-file` | existing input anchor | — | ✓ (uploading) | ✓ | ✓ | ✓ (file count) | **No data-value** — File objects don't serialize safely. |
| `sd-editor` | existing host anchor | — | ✓ (Monaco init) | ✓ | ✓ | — | **No data-value** — editor content may be MBs. |

## 4. Implementation

The pattern mirrors `autoId`: per-component manual binding — no shared directive. This keeps the code style consistent with what's already in the repo and avoids hiding behavior behind decorators.

### 4.1 Shared utilities (new)

**File:** `projects/sdcorejs-angular/utilities/src/data-state/data-state.ts`

```ts
/**
 * Serialize a value for the `data-value` attribute.
 *
 * Null/undefined/empty-string → ''.
 * Date → ISO string. Arrays/objects → JSON.stringify().
 * Primitives → String().
 */
export function sdSerializeDataValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return ''; }
  }
  return String(value);
}

/** True when the value should drive `data-empty="true"`. */
export function sdIsEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
```

Both functions are exported from `@sdcorejs/angular/utilities` and unit-tested in `data-state.spec.ts`.

### 4.2 Form control reactive bridge (new)

**File:** `projects/sdcorejs-angular/forms/models/src/form-control-state.ts`

```ts
import { Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { merge } from 'rxjs';
import { startWith } from 'rxjs/operators';

/**
 * Wraps an `AbstractControl` into a reactive snapshot. The returned signal
 * re-emits whenever value/status/touched changes, so components can derive
 * `data-disabled` / `data-value` / `data-empty` / `data-invalid` cleanly.
 *
 * NOTE: the exact wiring may be simplified once we verify how existing form
 * components expose `formControl` as a signal. If `SdFormControl` already
 * provides reactive snapshots, this helper folds into a thin `computed`.
 */
export function sdFormControlState<T = unknown>(
  control: Signal<AbstractControl<T> | null | undefined>
): Signal<{ value: T | undefined; disabled: boolean; invalid: boolean; touched: boolean }> {
  return computed(() => {
    const c = control();
    if (!c) return { value: undefined, disabled: false, invalid: false, touched: false };

    const tick = toSignal(
      merge(c.valueChanges, c.statusChanges).pipe(startWith(null)),
      { initialValue: null, manualCleanup: false }
    );
    tick(); // subscribe to changes

    return {
      value: c.value as T,
      disabled: c.disabled,
      invalid: c.invalid && (c.touched || c.dirty),
      touched: c.touched
    };
  });
}
```

> **Open question to resolve during implementation:** `SdFormControl` may already wire reactive snapshots. If so, replace this helper with a simpler `computed` reading the existing signals. The spec does not block on which exact mechanism — only on the shape of the resulting `computed` consumed by templates.

### 4.3 Per-component template pattern (scalar form)

Example for `sd-input`:

```ts
// input.component.ts — add below the existing autoId computed
readonly #state = sdFormControlState(this.formControl);
readonly dataDisabled = computed(() => String(this.#state().disabled));
readonly dataInvalid = computed(() => String(this.#state().invalid));
readonly dataEmpty = computed(() => String(sdIsEmpty(this.#state().value)));
readonly dataValue = computed(() => {
  if (this.type() === 'password') return null;  // Angular removes attr when null
  return sdSerializeDataValue(this.#state().value);
});
```

```html
<input matInput
  [attr.data-autoId]="autoId()"
  [attr.data-disabled]="dataDisabled()"
  [attr.data-invalid]="dataInvalid()"
  [attr.data-empty]="dataEmpty()"
  [attr.data-value]="dataValue()" />
```

### 4.4 Per-component template pattern (collection — chip)

```ts
readonly dataCount = computed(() =>
  String((this.#state().value as unknown[] | undefined)?.length ?? 0)
);
```

`dataValue` reuses `sdSerializeDataValue` (which JSON-stringifies the array).

### 4.5 Per-component template pattern (button)

`sd-button` already has `disabled()` and `loading()` input signals. No new computed needed:

```html
<button mat-flat-button
  ...
  [attr.data-autoId]="autoId()"
  [attr.data-disabled]="disabled() ? 'true' : 'false'"
  [attr.data-loading]="loading() ? 'true' : 'false'"
  ...>
```

The same binding goes on all 4 `@if` branches (`fill`, `light`, `outline`, `link`).

### 4.6 Modal — wrapping anchor

`sd-modal` renders its content into a MatDialog overlay (or MatBottomSheet) via `<ng-template>`. The component host element is not part of the rendered DOM, so we add a **new wrapping `<div class="sd-modal-root">`** inside the template that carries the QA hooks:

```html
<!-- modal.component.html -->
<ng-template #templateRef>
  <div class="sd-modal-root"
       [attr.data-autoId]="autoId()"
       [attr.data-opened]="isOpened() ? 'true' : 'false'">
    @if (!lazyLoadContent() || alreadyOpened()) {
      <!-- existing header / body / footer markup unchanged -->
    }
  </div>
</ng-template>
```

QA selector example (works from `document`):

```ts
const modal = document.querySelector('[data-autoid="components-modal-X"][data-opened="true"]');
```

**Risk:** any existing SCSS rule that targets the first child of the dialog content directly (e.g. `.mat-mdc-dialog-content > div`) needs to be updated to traverse through `.sd-modal-root`. Verify during implementation.

### 4.7 Side-drawer — signal conversion

Today, `side-drawer.component.ts` exposes `isOpened` and `isLoading` as plain mutable booleans:

```ts
isOpened = false;
isLoading = false;
```

Public consumers may read them as plain properties (`drawer.isOpened`). Converting them to `signal<boolean>(false)` is a **breaking change** because `drawer.isOpened` becomes a function reference instead of a boolean.

**Mitigation:** keep the public read shape, change the internal storage.

```ts
readonly #isOpenedSignal = signal(false);
readonly #isLoadingSignal = signal(false);

// Public, signal-typed accessors for new consumers + templates:
readonly isOpened = this.#isOpenedSignal.asReadonly();
readonly isLoading = this.#isLoadingSignal.asReadonly();

// `open()` / `close()` / `startLoading()` / `stopLoading()` use `.set()` internally.
```

All in-template reads (`this.isOpened()`) and external `drawer.isOpened()` calls work uniformly. Any external code that accessed `drawer.isOpened` as a plain property must update to `drawer.isOpened()`. This is the **only** breaking change in this spec — flag it explicitly in the changelog.

Template root `.sd-side-drawer` element receives:

```html
<div class="sd-side-drawer"
     [attr.data-autoId]="autoId()"
     [attr.data-opened]="isOpened() ? 'true' : 'false'"
     [attr.data-loading]="isLoading() ? 'true' : 'false'">
  ...
</div>
```

> **Side note:** `sd-side-drawer` does not currently have an `autoId` input — adding it is part of this work.

### 4.8 Table / upload-file / editor

- `sd-table`: bind `[attr.data-loading]="loading() ? 'true' : 'false'"` on the host element that already carries `[attr.data-autoId]` in `table.component.html`.
- `sd-upload-file`: add `dataLoading`, `dataDisabled`, `dataEmpty`, `dataCount` computeds (uploading state, disabled input, file count). **No** `data-value`.
- `sd-editor`: add `dataLoading`, `dataDisabled`, `dataEmpty`. **No** `data-value`.

## 5. Documentation

### 5.1 Per-component markdown

Each `sd-<name>.md` already contains an Inputs/Outputs table with the `autoId` row. Add a new section directly below the table titled `## E2E test attributes` listing every `data-*` the component renders, plus the anchor element, plus a short Playwright/Cypress selector example.

Template for the new section:

```markdown
## E2E test attributes

Component renders the following attributes on `<anchor element>` to support QA automation. All values are always present and use lowercase data-attribute names.

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `<namespace>-<name>-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | … |
| `data-value` | … | … |
| `data-empty` | `"true"` / `"false"` | … |
| `data-invalid` | `"true"` / `"false"` | … |

Selector example:

```ts
const el = page.locator('[data-autoid="<namespace>-<name>-<example>"]');
await expect(el).toHaveAttribute('data-empty', 'false');
```
```

Apply to all 19 components in scope.

### 5.2 Central reference doc (new)

**File:** `projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md`

Sections:

1. **Convention** — lowercase names, always-present rule, stringify rule, password-skip rule.
2. **Attribute catalog** — full catalog table (Section 2 of this spec).
3. **Component matrix** — the per-component table (Section 3).
4. **Selector cookbook** — short Playwright + Cypress snippets for common waits (`await page.locator(...).toHaveAttribute('data-loading', 'false')`).
5. **YAML schema for AI agents** — machine-readable form so downstream agents (e.g. the SDCoreJS `angular-portal` e2e skills) can read what each component exposes without parsing markdown tables:

```yaml
sd-input:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value]
  anchor: input[matInput]
  loading: false
  special:
    - "data-value omitted when type=password"

sd-modal:
  attrs: [data-autoid, data-opened]
  anchor: .sd-modal-root
  rendered_into: document.body  # via MatDialog overlay
  loading: false

sd-side-drawer:
  attrs: [data-autoid, data-opened, data-loading]
  anchor: .sd-side-drawer
  rendered_into: document.body  # via CdkPortal
  loading: true

# ... one block per component
```

### 5.3 Root README

Add a one-liner under the "Testing" section of `projects/sdcorejs-angular/README.md` (or repo-root `README.md` if there's no library-level README) linking to `docs/E2E-ATTRIBUTES.md`.

## 6. Tests

For each component in scope, rename the existing `describe('… — autoId', () => {...})` block to `describe('… — E2E attributes', () => {...})` and add cases for every new attribute that component renders. Each new attribute gets at least one test that flips the underlying signal/input and asserts the DOM attribute.

Typical scalar-form test set:

```ts
it('renders data-disabled reflecting FormControl state', () => {
  fixture.componentInstance.formControl.disable();
  fixture.detectChanges();
  expect(input.getAttribute('data-disabled')).toBe('true');
});

it('renders data-empty=true when value is null/empty', () => {
  expect(input.getAttribute('data-empty')).toBe('true');
});

it('renders data-value reflecting FormControl value', () => {
  fixture.componentInstance.formControl.setValue('hello');
  fixture.detectChanges();
  expect(input.getAttribute('data-value')).toBe('hello');
});

it('omits data-value when type=password', () => {
  fixture.componentInstance.type = 'password';
  fixture.componentInstance.formControl.setValue('secret');
  fixture.detectChanges();
  expect(input.hasAttribute('data-value')).toBe(false);
});

it('data-invalid flips on touched + invalid', () => {
  fixture.componentInstance.formControl.setValidators([Validators.required]);
  fixture.componentInstance.formControl.markAsTouched();
  fixture.componentInstance.formControl.updateValueAndValidity();
  fixture.detectChanges();
  expect(input.getAttribute('data-invalid')).toBe('true');
});
```

Modal / side-drawer specs additionally cover open → close → `data-opened` transitions. Button spec covers `disabled` / `loading` input flips. Table covers the `loading` signal flip.

A dedicated unit-test file at `projects/sdcorejs-angular/utilities/src/data-state/data-state.spec.ts` covers `sdSerializeDataValue` and `sdIsEmpty` directly (all stringify branches, edge cases).

## 7. Backwards compatibility & risks

| Risk | Mitigation |
|---|---|
| `sd-side-drawer.isOpened` / `.isLoading` changing from plain bool to signal breaks consumers that read them as property. | Convert via `signal()` + `.asReadonly()`. Document the breaking change clearly in the changelog. All in-repo consumers are also migrated as part of this work. |
| Modal SCSS selectors that target a direct child of the dialog content may break when `<div.sd-modal-root>` wraps the body. | Grep SCSS for `.mat-mdc-dialog-content > *`, `.cdk-overlay-pane > *`, `> sd-modal` style rules. Adjust during implementation. |
| `data-value` on text-like inputs leaks user input to the DOM. Password is explicit-skipped, but other "sensitive" controls (e.g. credit-card-like custom inputs) inherit the default. | The repo currently has no such control. If one is added later, it must opt out by overriding `dataValue` to return `null`. Document the override pattern in `E2E-ATTRIBUTES.md`. |
| Large array values (e.g. chip with hundreds of items) bloat DOM via `data-value=JSON.stringify(arr)`. | `data-count` is the primary QA signal for collections. Consumers should prefer `data-count` over parsing `data-value` for long arrays. Documented in cookbook. |
| Editor content potentially MBs — explicitly excluded from `data-value`. | Documented in catalog. `data-empty` covers the "has content?" case. |

## 8. Out of scope

- Components that don't yet have an `autoId` input AND are not in the picked scope (e.g. `sd-preview-pdf`, `sd-preview-image`). They can be added later in a follow-up.
- An e2e test harness (Playwright/Cypress runner setup) inside this repo.
- A directive-based abstraction for the bindings. The repo's house style is per-component manual binding.

## 9. Acceptance criteria

- [ ] `sdSerializeDataValue` and `sdIsEmpty` exist in `@sdcorejs/angular/utilities`, with unit tests.
- [ ] `sdFormControlState` exists (or equivalent computed inside each form component) and emits on value/status changes.
- [ ] Every component in §3 renders its listed attributes on the listed anchor element.
- [ ] Every component spec has a renamed `E2E attributes` describe block with at least one test per new attribute.
- [ ] Every `sd-<name>.md` has an `## E2E test attributes` section listing the attributes.
- [ ] `projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md` exists with the convention, catalog, matrix, cookbook, and YAML schema sections.
- [ ] Root or library README links to the central doc.
- [ ] `sd-side-drawer` `isOpened` / `isLoading` migrated to signals with `.asReadonly()` accessors; all in-repo consumers updated.
- [ ] `sd-modal` template wraps body in `<div class="sd-modal-root">` carrying `data-autoId` + `data-opened`.
- [ ] `npm run test` for `projects/sdcorejs-angular` passes locally.

## 10. Implementation order (rough)

1. Land utilities (`sdSerializeDataValue`, `sdIsEmpty`, `sdFormControlState`) + their unit tests.
2. Roll out one scalar form (`sd-input`) end-to-end: code + spec + md update. Use it as the reference implementation.
3. Apply pattern to other scalar forms.
4. Apply to collection / async forms (`sd-select`, `sd-autocomplete`, `sd-chip`, `sd-chip-calendar`, `sd-date-range`).
5. Components: `sd-button` (simplest), then `sd-table`, then `sd-upload-file` / `sd-editor`.
6. Overlays: `sd-modal` (add wrapping div), then `sd-side-drawer` (signal conversion + add `autoId` input).
7. Write `docs/E2E-ATTRIBUTES.md` + update README link.
8. Final pass: run full test suite, fix any regressions.

The implementation plan (written by `superpowers:writing-plans` next) will break this down into reviewable PR-sized chunks.
