# E2E `data-*` Runtime-State Attributes â€” Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `autoId` pattern with `data-loading` / `data-disabled` / `data-value` / `data-empty` / `data-invalid` / `data-opened` / `data-count` attributes on 19 Core UI components so QA automation can read runtime state from the DOM.

**Architecture:** Per-component manual binding (mirror current `autoId` style). Two new utility helpers (`sdSerializeDataValue`, `sdIsEmpty`) live in `@sdcorejs/angular/utilities`. A reactive bridge (`sdFormControlState`) lives in `@sdcorejs/angular/forms/models`. Each component template adds `[attr.data-*]` bindings on the same anchor element that already carries `[attr.data-autoId]`. Modal gains a wrapping `<div class="sd-modal-root">` inside its template. Side-drawer migrates `isOpened`/`isLoading` from plain booleans to `signal()`-backed read-only signals and gains an `autoId` input.

**Tech Stack:** Angular 18 signals, Angular Material 18, Karma + Jasmine test runner.

**Reference spec:** [`docs/superpowers/specs/2026-05-24-e2e-data-attributes-design.md`](../specs/2026-05-24-e2e-data-attributes-design.md)

---

## File Structure

### New files

- `projects/sdcorejs-angular/utilities/src/data-state/data-state.ts` â€” `sdSerializeDataValue`, `sdIsEmpty`
- `projects/sdcorejs-angular/utilities/src/data-state/data-state.spec.ts` â€” unit tests for above
- `projects/sdcorejs-angular/utilities/src/data-state/index.ts` â€” barrel re-export (if utilities use barrels)
- `projects/sdcorejs-angular/forms/models/src/form-control-state.ts` â€” `sdFormControlState`
- `projects/sdcorejs-angular/forms/models/src/form-control-state.spec.ts` â€” unit tests
- `projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md` â€” central reference doc (catalog + YAML schema)

### Modified files (per component)

| Component | TS | HTML | Spec | MD |
|---|---|---|---|---|
| `sd-input` | add computeds | add 4 `[attr.data-*]` bindings | add E2E attribute tests | add E2E attributes section |
| `sd-textarea` | ditto | ditto | ditto | ditto |
| `sd-input-number` | ditto | ditto | ditto | ditto |
| `sd-switch` | ditto | ditto | ditto | ditto |
| `sd-checkbox` | ditto | ditto | ditto | ditto |
| `sd-radio` | ditto | ditto | ditto | ditto |
| `sd-date` | ditto | ditto | ditto | ditto |
| `sd-datetime` | ditto | ditto | ditto | ditto |
| `sd-select` | + `data-loading` | + `data-loading` | + cases | + row |
| `sd-autocomplete` | ditto | ditto | ditto | ditto |
| `sd-chip` | + `data-count` | + `data-count` | + cases | + row |
| `sd-chip-calendar` | ditto | ditto | ditto | ditto |
| `sd-date-range` | + JSON value | + bindings | + cases | + section |
| `sd-button` | use existing signals | + 2 bindings Ã— 4 type branches | + cases | + section |
| `sd-table` | + host bindings | n/a (host) | + cases | + section |
| `sd-upload-file` | + computeds | + bindings | + cases | + section |
| `sd-editor` | + computeds | + bindings | + cases | + section |
| `sd-modal` | bind `dataOpened` computed | wrap body in `<div.sd-modal-root>` | + open/close case | + section |
| `sd-side-drawer` | signal migration + `autoId` input | update `@if (isOpened())` everywhere, add attrs | + cases | + section |
| `projects/sdcorejs-angular/README.md` | n/a | n/a | n/a | link to E2E-ATTRIBUTES.md |

### Convention reminder

- Attribute names are lowercase (browser normalizes anyway). Bindings use `[attr.data-loading]` etc.
- Boolean attributes are always present with `"true"` or `"false"` (not boolean attribute style).
- `data-value` is **omitted** (bound to `null`) for `sd-input` with `type="password"` and for `sd-upload-file` / `sd-editor`.

---

## Phase 1 â€” Foundation utilities

### Task 1: Serialization helpers

**Files:**
- Create: `projects/sdcorejs-angular/utilities/src/data-state/data-state.ts`
- Test: `projects/sdcorejs-angular/utilities/src/data-state/data-state.spec.ts`

- [ ] **Step 1: Write the failing tests**

`projects/sdcorejs-angular/utilities/src/data-state/data-state.spec.ts`:

```ts
import { sdSerializeDataValue, sdIsEmpty } from './data-state';

describe('sdSerializeDataValue', () => {
  it('returns empty string for null/undefined/empty-string', () => {
    expect(sdSerializeDataValue(null)).toBe('');
    expect(sdSerializeDataValue(undefined)).toBe('');
    expect(sdSerializeDataValue('')).toBe('');
  });

  it('returns ISO string for Date', () => {
    const d = new Date('2026-05-24T10:00:00.000Z');
    expect(sdSerializeDataValue(d)).toBe('2026-05-24T10:00:00.000Z');
  });

  it('JSON.stringifies arrays', () => {
    expect(sdSerializeDataValue(['a', 'b'])).toBe('["a","b"]');
    expect(sdSerializeDataValue([])).toBe('[]');
  });

  it('JSON.stringifies plain objects', () => {
    expect(sdSerializeDataValue({ a: 1 })).toBe('{"a":1}');
  });

  it('returns "" when JSON.stringify throws (circular)', () => {
    const a: Record<string, unknown> = {};
    a['self'] = a;
    expect(sdSerializeDataValue(a)).toBe('');
  });

  it('String()-coerces primitives', () => {
    expect(sdSerializeDataValue(42)).toBe('42');
    expect(sdSerializeDataValue(true)).toBe('true');
    expect(sdSerializeDataValue(false)).toBe('false');
    expect(sdSerializeDataValue('hello')).toBe('hello');
  });
});

describe('sdIsEmpty', () => {
  it('returns true for null/undefined/empty-string', () => {
    expect(sdIsEmpty(null)).toBe(true);
    expect(sdIsEmpty(undefined)).toBe(true);
    expect(sdIsEmpty('')).toBe(true);
  });

  it('returns true for empty array, false for non-empty', () => {
    expect(sdIsEmpty([])).toBe(true);
    expect(sdIsEmpty(['a'])).toBe(false);
  });

  it('returns false for non-empty primitives and objects', () => {
    expect(sdIsEmpty('x')).toBe(false);
    expect(sdIsEmpty(0)).toBe(false);
    expect(sdIsEmpty(false)).toBe(false);
    expect(sdIsEmpty({})).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/utilities/src/data-state/data-state.spec.ts
```

Expected: FAIL â€” module `./data-state` not found.

- [ ] **Step 3: Implement the helpers**

`projects/sdcorejs-angular/utilities/src/data-state/data-state.ts`:

```ts
/**
 * Serialize a value for the `data-value` attribute consumed by QA automation.
 *
 * null/undefined/empty-string â†’ ''.
 * Date â†’ ISO string.
 * Array / object â†’ JSON.stringify, '' on failure (circular refs).
 * Primitives â†’ String().
 */
export function sdSerializeDataValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return ''; }
  }
  return String(value);
}

/** True when the value should drive `data-empty="true"` on a form control. */
export function sdIsEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
```

- [ ] **Step 4: Wire the barrel re-export**

Check whether `projects/sdcorejs-angular/utilities/src/public-api.ts` (or equivalent index) exists and re-exports submodules. If it does, append:

```ts
export * from './data-state/data-state';
```

If utilities use a different barrel structure (e.g. per-subfolder `index.ts`), follow that style. Confirm by inspecting an adjacent helper's export path before committing.

- [ ] **Step 5: Run tests to verify they pass**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/utilities/src/data-state/data-state.spec.ts
```

Expected: PASS (8+ specs).

- [ ] **Step 6: Commit**

```
git add projects/sdcorejs-angular/utilities/src/data-state/
git add projects/sdcorejs-angular/utilities/src/public-api.ts   # if changed
git commit -m "feat(utilities): add sdSerializeDataValue + sdIsEmpty for E2E data attrs"
```

---

### Task 2: Reactive form control bridge

**Files:**
- Create: `projects/sdcorejs-angular/forms/models/src/form-control-state.ts`
- Test: `projects/sdcorejs-angular/forms/models/src/form-control-state.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { TestBed } from '@angular/core/testing';
import { Component, signal, AbstractControl } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { sdFormControlState } from './form-control-state';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: '',
})
class HostCmp {
  controlSig = signal<FormControl<string | null>>(new FormControl<string | null>(''));
  state = sdFormControlState(this.controlSig);
}

describe('sdFormControlState', () => {
  it('emits initial snapshot with disabled=false, invalid=false, value=""', () => {
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const snap = fixture.componentInstance.state();
    expect(snap.value).toBe('');
    expect(snap.disabled).toBe(false);
    expect(snap.invalid).toBe(false);
    expect(snap.touched).toBe(false);
  });

  it('reflects disabled state', () => {
    const fixture = TestBed.createComponent(HostCmp);
    fixture.componentInstance.controlSig().disable();
    fixture.detectChanges();
    expect(fixture.componentInstance.state().disabled).toBe(true);
  });

  it('reflects value changes', () => {
    const fixture = TestBed.createComponent(HostCmp);
    fixture.componentInstance.controlSig().setValue('hi');
    fixture.detectChanges();
    expect(fixture.componentInstance.state().value).toBe('hi');
  });

  it('only flags invalid after touched or dirty', () => {
    const fixture = TestBed.createComponent(HostCmp);
    const c = fixture.componentInstance.controlSig();
    c.setValidators(Validators.required);
    c.updateValueAndValidity();
    fixture.detectChanges();
    expect(fixture.componentInstance.state().invalid).toBe(false); // not touched yet

    c.markAsTouched();
    fixture.detectChanges();
    expect(fixture.componentInstance.state().invalid).toBe(true);
  });

  it('returns inert snapshot when control signal yields undefined', () => {
    const fixture = TestBed.createComponent(HostCmp);
    fixture.componentInstance.controlSig.set(undefined as unknown as FormControl<string | null>);
    fixture.detectChanges();
    expect(fixture.componentInstance.state()).toEqual({
      value: undefined, disabled: false, invalid: false, touched: false,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/forms/models/src/form-control-state.spec.ts
```

Expected: FAIL â€” module not found.

- [ ] **Step 3: Implement the bridge**

`projects/sdcorejs-angular/forms/models/src/form-control-state.ts`:

```ts
import { Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { merge } from 'rxjs';
import { startWith } from 'rxjs/operators';

export interface SdFormControlSnapshot<T> {
  value: T | undefined;
  disabled: boolean;
  invalid: boolean;
  touched: boolean;
}

/**
 * Wrap an AbstractControl into a reactive snapshot signal.
 * Re-emits on value or status changes. Consumers derive
 * `data-disabled` / `data-value` / `data-empty` / `data-invalid`
 * from this single signal.
 */
export function sdFormControlState<T = unknown>(
  control: Signal<AbstractControl<T> | null | undefined>
): Signal<SdFormControlSnapshot<T>> {
  return computed(() => {
    const c = control();
    if (!c) return { value: undefined, disabled: false, invalid: false, touched: false };

    const tick = toSignal(
      merge(c.valueChanges, c.statusChanges).pipe(startWith(null)),
      { initialValue: null, manualCleanup: false }
    );
    tick(); // subscribe to value/status changes

    return {
      value: c.value as T,
      disabled: c.disabled,
      invalid: c.invalid && (c.touched || c.dirty),
      touched: c.touched,
    };
  });
}
```

- [ ] **Step 4: Wire the barrel re-export**

Check `projects/sdcorejs-angular/forms/models/src/public-api.ts` (or equivalent). Add:

```ts
export * from './form-control-state';
```

- [ ] **Step 5: Run tests to verify they pass**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/forms/models/src/form-control-state.spec.ts
```

Expected: PASS (5 specs).

- [ ] **Step 6: Commit**

```
git add projects/sdcorejs-angular/forms/models/src/form-control-state.ts
git add projects/sdcorejs-angular/forms/models/src/form-control-state.spec.ts
git add projects/sdcorejs-angular/forms/models/src/public-api.ts   # if changed
git commit -m "feat(forms): add sdFormControlState reactive bridge"
```

---

## Phase 2 â€” Reference scalar form implementation

### Task 3: `sd-input` â€” full E2E attribute set

**Files:**
- Modify: `projects/sdcorejs-angular/forms/input/src/input.component.ts`
- Modify: `projects/sdcorejs-angular/forms/input/src/input.component.html`
- Modify: `projects/sdcorejs-angular/forms/input/src/input.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/input/sd-input.md`

Anchor element: the existing `<input matInput>` already carrying `[attr.data-autoId]="autoId()"`.

- [ ] **Step 1: Write the failing tests**

Open `input.component.spec.ts`. Locate the existing `describe('â€¦ â€” autoId', () => {...})` block (or create one if missing) and **rename** it to `describe('SdInput â€” E2E attributes', () => {...})`. Inside it, after the existing autoId test, append:

```ts
it('renders data-disabled reflecting FormControl state', () => {
  fixture.componentInstance.autoId = 'username';
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input[matInput]');
  expect(el.getAttribute('data-disabled')).toBe('false');

  fixture.componentInstance.formControl.disable();
  fixture.detectChanges();
  expect(el.getAttribute('data-disabled')).toBe('true');
});

it('renders data-empty=true when value is null/empty', () => {
  fixture.componentInstance.autoId = 'username';
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input[matInput]');
  expect(el.getAttribute('data-empty')).toBe('true');

  fixture.componentInstance.formControl.setValue('hello');
  fixture.detectChanges();
  expect(el.getAttribute('data-empty')).toBe('false');
});

it('renders data-value reflecting FormControl value', () => {
  fixture.componentInstance.autoId = 'username';
  fixture.componentInstance.formControl.setValue('hello');
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input[matInput]');
  expect(el.getAttribute('data-value')).toBe('hello');
});

it('omits data-value when type=password', () => {
  fixture.componentInstance.autoId = 'pwd';
  fixture.componentInstance.type = 'password';
  fixture.componentInstance.formControl.setValue('secret');
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input[matInput]');
  expect(el.hasAttribute('data-value')).toBe(false);
});

it('renders data-invalid=true only after touched + invalid', () => {
  fixture.componentInstance.autoId = 'email';
  fixture.componentInstance.formControl.setValidators([Validators.required]);
  fixture.componentInstance.formControl.updateValueAndValidity();
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input[matInput]');
  expect(el.getAttribute('data-invalid')).toBe('false');

  fixture.componentInstance.formControl.markAsTouched();
  fixture.detectChanges();
  expect(el.getAttribute('data-invalid')).toBe('true');
});
```

Ensure `Validators` import exists at the top of the spec file.

- [ ] **Step 2: Run tests to verify they fail**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/forms/input/src/input.component.spec.ts
```

Expected: FAIL â€” `data-disabled`, `data-value`, `data-empty`, `data-invalid` attributes do not exist.

- [ ] **Step 3: Implement TS computeds**

Open `input.component.ts`. Add the following imports near the existing imports:

```ts
import { sdSerializeDataValue, sdIsEmpty } from '@sdcorejs/angular/utilities';
import { sdFormControlState } from '@sdcorejs/angular/forms/models';
```

Inside the `SdInput` class, immediately below the existing `autoId = computed(...)`, add:

```ts
readonly #state = sdFormControlState(computed(() => this.formControl ?? null));
readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
readonly dataInvalid = computed(() => (this.#state().invalid ? 'true' : 'false'));
readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
readonly dataValue = computed<string | null>(() => {
  if (this.type() === 'password') return null;
  return sdSerializeDataValue(this.#state().value);
});
```

> **Note:** `this.formControl` may already be a signal in the existing code. If it is, pass it directly: `sdFormControlState(this.formControl)`. If it's a getter that returns the control, wrap with `computed(() => this.formControl)`. Inspect the existing field type before writing the wrapper.

- [ ] **Step 4: Implement template bindings**

Open `input.component.html`. Locate the `<input matInput>` that carries `[attr.data-autoId]="autoId()"` (around line 74). Append four new attribute bindings on the same element:

```html
<input matInput
  [attr.data-autoId]="autoId()"
  [attr.data-disabled]="dataDisabled()"
  [attr.data-invalid]="dataInvalid()"
  [attr.data-empty]="dataEmpty()"
  [attr.data-value]="dataValue()"
  ...existing-bindings... />
```

Keep all existing bindings intact.

- [ ] **Step 5: Run tests to verify they pass**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/forms/input/src/input.component.spec.ts
```

Expected: PASS â€” all 5 new specs green, existing autoId spec still green.

- [ ] **Step 6: Update `sd-input.md`**

Open `projects/sdcorejs-angular/forms/input/sd-input.md`. After the existing Inputs/Outputs table, insert a new section:

```markdown
## E2E test attributes

The component renders the following lowercase `data-*` attributes on the inner `<input matInput>` element (the same one that carries `data-autoId`) to support QA automation. All values are always present.

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `forms-input-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | `formControl.disabled` |
| `data-invalid` | `"true"` / `"false"` | `formControl.invalid && (touched || dirty)` |
| `data-empty` | `"true"` / `"false"` | `sdIsEmpty(formControl.value)` |
| `data-value` | string (skipped when `type="password"`) | `sdSerializeDataValue(formControl.value)` |

Selector example:

```ts
const el = page.locator('[data-autoid="forms-input-username"]');
await expect(el).toHaveAttribute('data-empty', 'false');
await expect(el).toHaveAttribute('data-invalid', 'false');
await expect(el).toHaveAttribute('data-value', 'someuser');
```
```

- [ ] **Step 7: Commit**

```
git add projects/sdcorejs-angular/forms/input/
git commit -m "feat(input): render data-disabled/value/empty/invalid for E2E"
```

---

## Phase 3 â€” Other scalar forms

> Each task in this phase follows the same shape as Task 3. The code shown per task is complete â€” read it on its own without referring back to Task 3.

### Task 4: `sd-textarea`

**Files:**
- Modify: `projects/sdcorejs-angular/forms/textarea/src/textarea.component.ts`
- Modify: `projects/sdcorejs-angular/forms/textarea/src/textarea.component.html`
- Modify: `projects/sdcorejs-angular/forms/textarea/src/textarea.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/textarea/sd-textarea.md`

Anchor: existing `<textarea matInput>`. No password special-case â€” `data-value` always rendered.

- [ ] **Step 1: Write failing tests** â€” open `textarea.component.spec.ts`, rename the autoId describe to `describe('SdTextarea â€” E2E attributes', ...)`, and append four cases analogous to sd-input minus the password one:

```ts
it('renders data-disabled reflecting FormControl state', () => {
  fixture.componentInstance.autoId = 'notes';
  fixture.detectChanges();
  const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[matInput]');
  expect(el.getAttribute('data-disabled')).toBe('false');
  fixture.componentInstance.formControl.disable();
  fixture.detectChanges();
  expect(el.getAttribute('data-disabled')).toBe('true');
});

it('renders data-empty toggling with value', () => {
  fixture.componentInstance.autoId = 'notes';
  fixture.detectChanges();
  const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[matInput]');
  expect(el.getAttribute('data-empty')).toBe('true');
  fixture.componentInstance.formControl.setValue('hello');
  fixture.detectChanges();
  expect(el.getAttribute('data-empty')).toBe('false');
});

it('renders data-value reflecting FormControl value', () => {
  fixture.componentInstance.autoId = 'notes';
  fixture.componentInstance.formControl.setValue('hello');
  fixture.detectChanges();
  const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[matInput]');
  expect(el.getAttribute('data-value')).toBe('hello');
});

it('flips data-invalid after touched + invalid', () => {
  fixture.componentInstance.autoId = 'notes';
  fixture.componentInstance.formControl.setValidators([Validators.required]);
  fixture.componentInstance.formControl.updateValueAndValidity();
  fixture.detectChanges();
  const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[matInput]');
  expect(el.getAttribute('data-invalid')).toBe('false');
  fixture.componentInstance.formControl.markAsTouched();
  fixture.detectChanges();
  expect(el.getAttribute('data-invalid')).toBe('true');
});
```

- [ ] **Step 2: Run tests, verify FAIL**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/forms/textarea/src/textarea.component.spec.ts
```

- [ ] **Step 3: TS â€” add computeds**

In `textarea.component.ts` add imports and computeds (immediately below the existing `autoId = computed(...)`):

```ts
import { sdSerializeDataValue, sdIsEmpty } from '@sdcorejs/angular/utilities';
import { sdFormControlState } from '@sdcorejs/angular/forms/models';

// inside class:
readonly #state = sdFormControlState(computed(() => this.formControl ?? null));
readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
readonly dataInvalid = computed(() => (this.#state().invalid ? 'true' : 'false'));
readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));
```

- [ ] **Step 4: HTML â€” add bindings**

On the `<textarea matInput ...>` element carrying `[attr.data-autoId]`, append:

```html
[attr.data-disabled]="dataDisabled()"
[attr.data-invalid]="dataInvalid()"
[attr.data-empty]="dataEmpty()"
[attr.data-value]="dataValue()"
```

- [ ] **Step 5: Run tests, verify PASS**

- [ ] **Step 6: Update `sd-textarea.md`** with the same `## E2E test attributes` section as sd-input, swapping the prefix to `forms-textarea-` and removing the password row.

- [ ] **Step 7: Commit**

```
git add projects/sdcorejs-angular/forms/textarea/
git commit -m "feat(textarea): render data-disabled/value/empty/invalid for E2E"
```

---

### Task 5: `sd-input-number`

**Files:**
- Modify: `projects/sdcorejs-angular/forms/input-number/src/input-number.component.ts`
- Modify: `projects/sdcorejs-angular/forms/input-number/src/input-number.component.html`
- Modify: `projects/sdcorejs-angular/forms/input-number/src/input-number.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/input-number/sd-input-number.md`

Anchor: existing `<input>` carrying `data-autoId`. Value is numeric; `sdSerializeDataValue` coerces via `String()`.

- [ ] **Step 1: Write failing tests** â€” rename autoId describe to `SdInputNumber â€” E2E attributes`. Add:

```ts
it('renders data-disabled reflecting FormControl', () => {
  fixture.componentInstance.autoId = 'qty';
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
  expect(el.getAttribute('data-disabled')).toBe('false');
  fixture.componentInstance.formControl.disable();
  fixture.detectChanges();
  expect(el.getAttribute('data-disabled')).toBe('true');
});

it('renders data-empty toggling with value', () => {
  fixture.componentInstance.autoId = 'qty';
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
  expect(el.getAttribute('data-empty')).toBe('true');
  fixture.componentInstance.formControl.setValue(7);
  fixture.detectChanges();
  expect(el.getAttribute('data-empty')).toBe('false');
});

it('renders data-value as stringified number', () => {
  fixture.componentInstance.autoId = 'qty';
  fixture.componentInstance.formControl.setValue(42);
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
  expect(el.getAttribute('data-value')).toBe('42');
});

it('flips data-invalid after touched + invalid', () => {
  fixture.componentInstance.autoId = 'qty';
  fixture.componentInstance.formControl.setValidators([Validators.required]);
  fixture.componentInstance.formControl.updateValueAndValidity();
  fixture.componentInstance.formControl.markAsTouched();
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
  expect(el.getAttribute('data-invalid')).toBe('true');
});
```

- [ ] **Step 2: Run, FAIL.**
- [ ] **Step 3: TS** â€” same computed quartet as Task 4 (no password skip).
- [ ] **Step 4: HTML** â€” add four `[attr.data-*]` bindings on the `<input>` already carrying `data-autoId`.
- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” append `## E2E test attributes` section (prefix `forms-input-number-`).
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/forms/input-number/
git commit -m "feat(input-number): render data-disabled/value/empty/invalid for E2E"
```

---

### Task 6: `sd-switch`

**Files:**
- Modify: `projects/sdcorejs-angular/forms/switch/src/switch.component.{ts,html,spec.ts}`
- Modify: `projects/sdcorejs-angular/forms/switch/sd-switch.md`

Anchor: existing `<mat-slide-toggle>` carrying `[attr.data-autoId]`. Value is boolean. No `data-invalid` needed (boolean switches don't validate in this repo). No password skip.

- [ ] **Step 1: Write failing tests** â€” rename autoId describe to `SdSwitch â€” E2E attributes`. Add:

```ts
it('renders data-disabled reflecting FormControl', () => {
  fixture.componentInstance.autoId = 'active';
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('mat-slide-toggle');
  expect(el.getAttribute('data-disabled')).toBe('false');
  fixture.componentInstance.formControl.disable();
  fixture.detectChanges();
  expect(el.getAttribute('data-disabled')).toBe('true');
});

it('renders data-value as "true"/"false"', () => {
  fixture.componentInstance.autoId = 'active';
  fixture.componentInstance.formControl.setValue(true);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('mat-slide-toggle');
  expect(el.getAttribute('data-value')).toBe('true');
  fixture.componentInstance.formControl.setValue(false);
  fixture.detectChanges();
  expect(el.getAttribute('data-value')).toBe('false');
});

it('renders data-empty=false once value set, true when null', () => {
  fixture.componentInstance.autoId = 'active';
  fixture.componentInstance.formControl.setValue(null);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('mat-slide-toggle');
  expect(el.getAttribute('data-empty')).toBe('true');
  fixture.componentInstance.formControl.setValue(false);
  fixture.detectChanges();
  expect(el.getAttribute('data-empty')).toBe('false');
});
```

- [ ] **Step 2: Run, FAIL.**
- [ ] **Step 3: TS** â€” add imports + the same `#state` / `dataDisabled` / `dataEmpty` / `dataValue` computeds (no `dataInvalid`).
- [ ] **Step 4: HTML** â€” on the `<mat-slide-toggle ...>` already carrying `[attr.data-autoId]`, append:

```html
[attr.data-disabled]="dataDisabled()"
[attr.data-empty]="dataEmpty()"
[attr.data-value]="dataValue()"
```

- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” append `## E2E test attributes` (prefix `forms-switch-`).
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/forms/switch/
git commit -m "feat(switch): render data-disabled/value/empty for E2E"
```

---

### Task 7: `sd-checkbox`

**Files:**
- Modify: `projects/sdcorejs-angular/forms/checkbox/src/checkbox.component.{ts,html,spec.ts}`
- Modify: `projects/sdcorejs-angular/forms/checkbox/sd-checkbox.md`

Anchor: existing `<mat-checkbox>` carrying `[attr.data-autoId]`. Same shape as `sd-switch` (bool value, no invalid).

- [ ] **Step 1: Write failing tests** â€” rename autoId describe to `SdCheckbox â€” E2E attributes`. Add three tests identical in shape to sd-switch, swapping selector to `mat-checkbox`.
- [ ] **Step 2: Run, FAIL.**
- [ ] **Step 3: TS** â€” same imports + computeds as sd-switch.
- [ ] **Step 4: HTML** â€” on `<mat-checkbox ...>` append `[attr.data-disabled]`, `[attr.data-empty]`, `[attr.data-value]`.
- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” `## E2E test attributes` (prefix `forms-checkbox-`).
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/forms/checkbox/
git commit -m "feat(checkbox): render data-disabled/value/empty for E2E"
```

---

### Task 8: `sd-radio`

**Files:**
- Modify: `projects/sdcorejs-angular/forms/radio/src/radio.component.{ts,html,spec.ts}`
- Modify: `projects/sdcorejs-angular/forms/radio/sd-radio.md`

Anchor: existing `<mat-radio-group>` carrying `[attr.data-autoId]`. Value is the selected key (string). No `data-invalid` (radios typically required-only â€” add if existing spec already covers `Validators.required`; otherwise omit).

- [ ] **Step 1: Write failing tests** â€” rename autoId describe to `SdRadio â€” E2E attributes`. Add:

```ts
it('renders data-disabled reflecting FormControl', () => {
  fixture.componentInstance.autoId = 'gender';
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('mat-radio-group');
  expect(el.getAttribute('data-disabled')).toBe('false');
  fixture.componentInstance.formControl.disable();
  fixture.detectChanges();
  expect(el.getAttribute('data-disabled')).toBe('true');
});

it('renders data-value reflecting selected key', () => {
  fixture.componentInstance.autoId = 'gender';
  fixture.componentInstance.formControl.setValue('female');
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('mat-radio-group');
  expect(el.getAttribute('data-value')).toBe('female');
});

it('renders data-empty toggling', () => {
  fixture.componentInstance.autoId = 'gender';
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('mat-radio-group');
  expect(el.getAttribute('data-empty')).toBe('true');
  fixture.componentInstance.formControl.setValue('male');
  fixture.detectChanges();
  expect(el.getAttribute('data-empty')).toBe('false');
});
```

- [ ] **Step 2: Run, FAIL.**
- [ ] **Step 3: TS** â€” same imports + `dataDisabled` / `dataEmpty` / `dataValue` computeds.
- [ ] **Step 4: HTML** â€” on `<mat-radio-group ...>` append the three `[attr.data-*]` bindings.
- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” `## E2E test attributes` (prefix `forms-radio-`).
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/forms/radio/
git commit -m "feat(radio): render data-disabled/value/empty for E2E"
```

---

### Task 9: `sd-date`

**Files:**
- Modify: `projects/sdcorejs-angular/forms/date/src/date.component.{ts,html,spec.ts}`
- Modify: `projects/sdcorejs-angular/forms/date/sd-date.md`

Anchor: existing `<input>` carrying `[attr.data-autoId]`. Value is a `Date` â€” `sdSerializeDataValue` produces ISO string.

- [ ] **Step 1: Write failing tests** â€” rename autoId describe to `SdDate â€” E2E attributes`. Add tests for disabled, value=ISO, empty toggle, invalid-after-touch. Sample:

```ts
it('renders data-value as ISO string for Date', () => {
  fixture.componentInstance.autoId = 'dob';
  const d = new Date('2026-05-24T00:00:00.000Z');
  fixture.componentInstance.formControl.setValue(d);
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
  expect(el.getAttribute('data-value')).toBe('2026-05-24T00:00:00.000Z');
});
```

Plus the three standard `data-disabled` / `data-empty` / `data-invalid` cases (analogous to sd-input).

- [ ] **Step 2: Run, FAIL.**
- [ ] **Step 3: TS** â€” full computed quartet (no password skip).
- [ ] **Step 4: HTML** â€” bind `data-disabled`, `data-empty`, `data-value`, `data-invalid` on the `<input>` anchor.
- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” `## E2E test attributes` (prefix `forms-date-`), note that `data-value` is ISO format.
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/forms/date/
git commit -m "feat(date): render data-disabled/value/empty/invalid for E2E"
```

---

### Task 10: `sd-datetime`

Same shape as `sd-date`. Files: `projects/sdcorejs-angular/forms/datetime/`. Prefix `forms-datetime-`. ISO `data-value`. Repeat Steps 1-7 with the datetime spec / md.

- [ ] **Step 1-7:** mirror Task 9 with selector adapted to the datetime component's anchor `<input>`.
- [ ] Final commit:

```
git add projects/sdcorejs-angular/forms/datetime/
git commit -m "feat(datetime): render data-disabled/value/empty/invalid for E2E"
```

---

## Phase 4 â€” Collection / async forms

### Task 11: `sd-select`

**Files:** `projects/sdcorejs-angular/forms/select/src/select.component.{ts,html,spec.ts}`, `sd-select.md`

Anchor: existing `<mat-select>` carrying `data-autoId`. Adds `data-loading` driven by the existing async-options loading signal (verify name: likely `loading` or `optionsLoading`; inspect `select.component.ts` before binding).

- [ ] **Step 1: Failing tests** â€” rename autoId describe to `SdSelect â€” E2E attributes`. Add:

```ts
it('renders data-disabled', () => {/* analogous to sd-input */});
it('renders data-empty toggling', () => {/* analogous */});
it('renders data-value reflecting selected key', () => {
  fixture.componentInstance.autoId = 'country';
  fixture.componentInstance.formControl.setValue('VN');
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('mat-select');
  expect(el.getAttribute('data-value')).toBe('VN');
});
it('renders data-invalid after touched + invalid', () => {/* analogous */});
it('renders data-loading reflecting async options state', () => {
  fixture.componentInstance.autoId = 'country';
  // Trigger whatever sets the loading signal (depends on component API).
  // Example placeholder â€” adapt to actual API:
  (fixture.componentInstance as any).setLoading(true);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('mat-select');
  expect(el.getAttribute('data-loading')).toBe('true');
});
```

> **Note for implementer:** confirm the loading signal name. If it doesn't exist yet but async loading does, expose a `readonly loading = signal(false)` set inside the async-options subscription before writing the test.

- [ ] **Step 2: Run, FAIL.**
- [ ] **Step 3: TS** â€” add the standard quartet plus:

```ts
readonly dataLoading = computed(() => (this.loading() ? 'true' : 'false'));
```

- [ ] **Step 4: HTML** â€” append `[attr.data-loading]="dataLoading()"` along with the standard four.
- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” `## E2E test attributes` (prefix `forms-select-`) including the `data-loading` row.
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/forms/select/
git commit -m "feat(select): render data-loading/disabled/value/empty/invalid for E2E"
```

---

### Task 12: `sd-autocomplete`

Same as `sd-select`. Files: `projects/sdcorejs-angular/forms/autocomplete/`. Anchor: the existing `<input>` carrying `data-autoId`. Prefix: `forms-autocomplete-`.

- [ ] **Step 1-7:** mirror Task 11; commit:

```
git add projects/sdcorejs-angular/forms/autocomplete/
git commit -m "feat(autocomplete): render data-loading/disabled/value/empty/invalid for E2E"
```

---

### Task 13: `sd-chip`

**Files:** `projects/sdcorejs-angular/forms/chip/src/chip.component.{ts,html,spec.ts}`, `sd-chip.md`

Anchor: `<input.sd-chip-input>` carrying `data-autoId`. Value is `string[]`. Adds `data-count`.

- [ ] **Step 1: Failing tests** â€” rename autoId describe to `SdChip â€” E2E attributes`. Add:

```ts
it('renders data-disabled', () => {/* analogous */});

it('renders data-value as JSON-stringified array', () => {
  fixture.componentInstance.autoId = 'tags';
  fixture.componentInstance.formControl.setValue(['ng', 'rxjs']);
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
  expect(el.getAttribute('data-value')).toBe('["ng","rxjs"]');
});

it('renders data-empty true for [] / false for non-empty', () => {
  fixture.componentInstance.autoId = 'tags';
  fixture.componentInstance.formControl.setValue([]);
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
  expect(el.getAttribute('data-empty')).toBe('true');
  fixture.componentInstance.formControl.setValue(['x']);
  fixture.detectChanges();
  expect(el.getAttribute('data-empty')).toBe('false');
});

it('renders data-count reflecting array length', () => {
  fixture.componentInstance.autoId = 'tags';
  fixture.componentInstance.formControl.setValue(['a', 'b', 'c']);
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
  expect(el.getAttribute('data-count')).toBe('3');
});
```

- [ ] **Step 2: Run, FAIL.**
- [ ] **Step 3: TS** â€” standard trio + `dataCount`:

```ts
readonly dataCount = computed(() => {
  const v = this.#state().value;
  return String(Array.isArray(v) ? v.length : 0);
});
```

- [ ] **Step 4: HTML** â€” append `[attr.data-disabled]`, `[attr.data-empty]`, `[attr.data-value]`, `[attr.data-count]` on the `<input.sd-chip-input>`.
- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” `## E2E test attributes` (prefix `forms-chip-`) with the `data-count` row.
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/forms/chip/
git commit -m "feat(chip): render data-disabled/value/empty/count for E2E"
```

---

### Task 14: `sd-chip-calendar`

Same as `sd-chip` but value is `Date[]` â€” JSON.stringify produces ISO[]. Files: `projects/sdcorejs-angular/forms/chip-calendar/`. Prefix `forms-chip-calendar-`.

- [ ] **Step 1-7:** mirror Task 13; selector remains `input.sd-chip-input`. Test sample for value:

```ts
fixture.componentInstance.formControl.setValue([new Date('2026-05-24T00:00:00.000Z')]);
fixture.detectChanges();
expect(el.getAttribute('data-value')).toBe('["2026-05-24T00:00:00.000Z"]');
```

- Commit:

```
git add projects/sdcorejs-angular/forms/chip-calendar/
git commit -m "feat(chip-calendar): render data-disabled/value/empty/count for E2E"
```

---

### Task 15: `sd-date-range`

**Files:** `projects/sdcorejs-angular/forms/date-range/src/date-range.component.{ts,html,spec.ts}`, `sd-date-range.md`

Value is `{ from: Date | null; to: Date | null }`. `data-value` is `JSON.stringify(value)`. `data-empty="true"` when either side is missing.

- [ ] **Step 1: Failing tests** â€” rename autoId describe. Add cases for `data-disabled`, `data-value` (object), `data-empty`, `data-invalid` (after touched + required).

```ts
it('renders data-value as JSON for {from, to}', () => {
  fixture.componentInstance.autoId = 'period';
  const from = new Date('2026-05-01T00:00:00.000Z');
  const to = new Date('2026-05-31T00:00:00.000Z');
  fixture.componentInstance.formControl.setValue({ from, to });
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
  expect(el.getAttribute('data-value')).toBe(JSON.stringify({ from, to }));
});

it('renders data-empty=true when from or to missing', () => {
  fixture.componentInstance.autoId = 'period';
  fixture.componentInstance.formControl.setValue({ from: new Date(), to: null });
  fixture.detectChanges();
  const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
  expect(el.getAttribute('data-empty')).toBe('true');
});
```

- [ ] **Step 2: Run, FAIL.**
- [ ] **Step 3: TS** â€” override `dataEmpty`:

```ts
readonly dataEmpty = computed(() => {
  const v = this.#state().value as { from?: Date | null; to?: Date | null } | null | undefined;
  const empty = !v || !v.from || !v.to;
  return empty ? 'true' : 'false';
});
```

Standard `dataDisabled`, `dataValue` (uses `sdSerializeDataValue`), `dataInvalid` as in sd-input.

- [ ] **Step 4: HTML** â€” append four `[attr.data-*]` on the `<input>` anchor.
- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” `## E2E test attributes` (prefix `forms-date-range-`), note that `data-empty` requires both `from` and `to`.
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/forms/date-range/
git commit -m "feat(date-range): render data-disabled/value/empty/invalid for E2E"
```

---

## Phase 5 â€” Components

### Task 16: `sd-button`

**Files:**
- Modify: `projects/sdcorejs-angular/components/button/src/button.component.html`
- Modify: `projects/sdcorejs-angular/components/button/src/button.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/button/sd-button.md`

`sd-button` already has `disabled()` and `loading()` input signals. No TS changes needed beyond ensuring they are reachable from the template (they already are). Add bindings on **all four** `@if` branches.

- [ ] **Step 1: Failing tests** â€” open `button.component.spec.ts`. Add an `E2E attributes` describe block:

```ts
describe('SdButton â€” E2E attributes', () => {
  let fixture: ComponentFixture<SdButton>;
  let btn: HTMLButtonElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(SdButton);
    fixture.componentRef.setInput('autoId', 'save');
    fixture.componentRef.setInput('type', 'fill');
    fixture.detectChanges();
    btn = fixture.nativeElement.querySelector('button.c-button');
  });

  it('renders data-disabled reflecting disabled input', () => {
    expect(btn.getAttribute('data-disabled')).toBe('false');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(btn.getAttribute('data-disabled')).toBe('true');
  });

  it('renders data-loading reflecting loading input', () => {
    expect(btn.getAttribute('data-loading')).toBe('false');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(btn.getAttribute('data-loading')).toBe('true');
  });
});
```

- [ ] **Step 2: Run, FAIL.**

- [ ] **Step 3: HTML** â€” in `button.component.html`, on **each** of the four `<button mat-*-button>` elements (one per `@if (btnType === 'fill'|'light'|'outline'|'link')`), append:

```html
[attr.data-disabled]="disabled() ? 'true' : 'false'"
[attr.data-loading]="loading() ? 'true' : 'false'"
```

next to the existing `[attr.data-autoId]="autoId()"`.

- [ ] **Step 4: Run, PASS.**
- [ ] **Step 5: MD** â€” append `## E2E test attributes` to `sd-button.md`:

```markdown
## E2E test attributes

Rendered on the inner `<button mat-*-button>` element (same anchor as `data-autoId`):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `components-button-<autoId>` | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | input `disabled` |
| `data-loading` | `"true"` / `"false"` | input `loading` |
```

- [ ] **Step 6: Commit**:

```
git add projects/sdcorejs-angular/components/button/
git commit -m "feat(button): render data-disabled/loading for E2E"
```

---

### Task 17: `sd-table`

**Files:**
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.ts`
- Modify: `projects/sdcorejs-angular/components/table/src/table.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/table/sd-table.md`

`sd-table` currently passes `autoId` to children but does NOT carry `[attr.data-autoId]` on its own host. Both `data-autoId` and `data-loading` should land on the host via the `host:` decorator.

- [ ] **Step 1: Failing tests** â€” in `table.component.spec.ts`, add an E2E attributes describe block:

```ts
describe('SdTable â€” E2E attributes', () => {
  it('renders data-autoId on host element', () => {
    const fixture = TestBed.createComponent(/* existing host harness */);
    fixture.componentInstance.autoId = 'employees';
    fixture.detectChanges();
    const host = fixture.debugElement.query(By.directive(SdTable)).nativeElement as HTMLElement;
    expect(host.getAttribute('data-autoid')).toBe('components-table-employees');
  });

  it('renders data-loading reflecting loading signal', () => {
    const fixture = TestBed.createComponent(/* existing host harness */);
    fixture.componentInstance.autoId = 'employees';
    fixture.detectChanges();
    const host = fixture.debugElement.query(By.directive(SdTable)).nativeElement as HTMLElement;
    expect(host.getAttribute('data-loading')).toBe('false');

    // Trigger loading (depends on existing test harness â€” call whatever sets `loading.set(true)`).
    (fixture.componentInstance as any).startLoading?.();
    fixture.detectChanges();
    expect(host.getAttribute('data-loading')).toBe('true');
  });
});
```

If a usable host fixture doesn't yet exist in the spec, reuse the pattern already established in this spec for other autoId tests (search for the existing `By.directive(SdTable)` selector or wrap with a minimal `@Component` host).

- [ ] **Step 2: Run, FAIL.**

- [ ] **Step 3: TS** â€” open `table.component.ts`. Add to the `@Component` decorator:

```ts
@Component({
  // ...existing config
  host: {
    '[attr.data-autoId]': 'autoId()',
    '[attr.data-loading]': 'loading() ? "true" : "false"',
  },
})
```

If a `host:` block already exists, merge these two bindings into it.

- [ ] **Step 4: Run, PASS.**
- [ ] **Step 5: MD** â€” append `## E2E test attributes` to `sd-table.md`:

```markdown
## E2E test attributes

Rendered on the `<sd-table>` host element:

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `components-table-<autoId>` | input `autoId` |
| `data-loading` | `"true"` / `"false"` | `loading` signal (toggled by paging / external-filter submit) |
```

Remove the inaccurate row in the existing Inputs table (line 141) that claims the host already renders `data-autoId`, or leave it â€” both are now true.

- [ ] **Step 6: Commit**:

```
git add projects/sdcorejs-angular/components/table/
git commit -m "feat(table): render host data-autoId + data-loading for E2E"
```

---

### Task 18: `sd-upload-file`

**Files:**
- Modify: `projects/sdcorejs-angular/components/upload-file/src/upload-file.component.{ts,html,spec.ts}`
- Modify: `projects/sdcorejs-angular/components/upload-file/sd-upload-file.md`

Anchor: existing input element carrying `[attr.data-autoId]="autoId()"`. Adds `data-loading`, `data-disabled`, `data-empty`, `data-count`. **No** `data-value` (cannot serialize File).

- [ ] **Step 1: Failing tests** â€” rename autoId describe to `SdUploadFile â€” E2E attributes`. Add:

```ts
it('renders data-disabled reflecting disabled input', () => { /* setInput('disabled', true), assert "true" */ });
it('renders data-loading reflecting uploading signal', () => { /* trigger upload-start, assert "true" */ });
it('renders data-empty toggling with file list', () => {
  // initially empty
  expect(host.getAttribute('data-empty')).toBe('true');
  // simulate the existing "files" model receiving a non-empty array
});
it('renders data-count reflecting file count', () => {
  // after pushing two files via the existing flow
  expect(host.getAttribute('data-count')).toBe('2');
});
```

Adapt the harness to whichever input/output API `sd-upload-file` already exposes (`files` model? `(filesChange)` output?). Inspect the spec file to follow existing conventions.

- [ ] **Step 2: Run, FAIL.**

- [ ] **Step 3: TS** â€” add imports + computeds. Assume the component already has `files = signal<â€¦[]>([])` and an `uploading = signal(false)` (or equivalent). If `uploading` doesn't exist, add it and set it inside the existing upload subscription:

```ts
import { sdIsEmpty } from '@sdcorejs/angular/utilities';

readonly dataDisabled = computed(() => (this.disabled() ? 'true' : 'false'));
readonly dataLoading = computed(() => (this.uploading() ? 'true' : 'false'));
readonly dataEmpty = computed(() => (sdIsEmpty(this.files()) ? 'true' : 'false'));
readonly dataCount = computed(() => String(this.files()?.length ?? 0));
```

- [ ] **Step 4: HTML** â€” on the existing anchor element carrying `[attr.data-autoId]`, append:

```html
[attr.data-disabled]="dataDisabled()"
[attr.data-loading]="dataLoading()"
[attr.data-empty]="dataEmpty()"
[attr.data-count]="dataCount()"
```

- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” append `## E2E test attributes` (prefix `components-upload-file-`), noting that `data-value` is intentionally not exposed (File objects don't serialize).
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/components/upload-file/
git commit -m "feat(upload-file): render data-disabled/loading/empty/count for E2E"
```

---

### Task 19: `sd-editor`

**Files:**
- Modify: `projects/sdcorejs-angular/components/editor/src/editor.component.{ts,html,spec.ts}`
- Modify: `projects/sdcorejs-angular/components/editor/sd-editor.md`

Anchor: existing host (`<sd-editor>`) carrying `[attr.data-autoId]`. Adds `data-loading` (Monaco init), `data-disabled`, `data-empty`. **No** `data-value` (content may be MBs).

- [ ] **Step 1: Failing tests** â€” rename autoId describe to `SdEditor â€” E2E attributes`. Add:

```ts
it('renders data-disabled reflecting disabled input', () => {/* setInput('disabled', true) */});
it('renders data-loading=true during Monaco init, false after', () => {/* drive the init flag */});
it('renders data-empty true for blank content, false otherwise', () => {/* setValue('') vs setValue('x') */});
```

- [ ] **Step 2: Run, FAIL.**

- [ ] **Step 3: TS** â€” add `readonly dataDisabled` / `dataLoading` / `dataEmpty` computeds. The component likely already has a `loading` or `ready` signal; if not, expose a `readonly loading = signal(true)` set to `false` inside the existing Monaco-ready callback.

```ts
import { sdIsEmpty } from '@sdcorejs/angular/utilities';

readonly dataDisabled = computed(() => (this.disabled() ? 'true' : 'false'));
readonly dataLoading = computed(() => (this.loading() ? 'true' : 'false'));
readonly dataEmpty = computed(() => (sdIsEmpty(this.value()) ? 'true' : 'false'));
```

(`this.value()` is the editor's content signal; verify the exact name.)

- [ ] **Step 4: HTML** â€” on the existing anchor, append `[attr.data-disabled]`, `[attr.data-loading]`, `[attr.data-empty]`.
- [ ] **Step 5: Run, PASS.**
- [ ] **Step 6: MD** â€” append `## E2E test attributes` (prefix `components-editor-`); explicitly document that `data-value` is omitted (use `data-empty` instead).
- [ ] **Step 7: Commit**:

```
git add projects/sdcorejs-angular/components/editor/
git commit -m "feat(editor): render data-disabled/loading/empty for E2E"
```

---

### Task 20: `sd-modal` â€” wrapping root div

**Files:**
- Modify: `projects/sdcorejs-angular/components/modal/src/modal.component.ts`
- Modify: `projects/sdcorejs-angular/components/modal/src/modal.component.html`
- Modify: `projects/sdcorejs-angular/components/modal/src/modal.component.spec.ts`
- Modify: `projects/sdcorejs-angular/components/modal/src/modal.component.scss` (verify selector impact)
- Modify: `projects/sdcorejs-angular/components/modal/sd-modal.md`

The modal renders into a MatDialog overlay via `<ng-template>`, so the QA hook must live on a wrapping element inside the template.

- [ ] **Step 1: Failing tests** â€” open `modal.component.spec.ts`. Locate existing autoId block. Rename to `SdModal â€” E2E attributes` and add:

```ts
it('renders data-autoId + data-opened on the wrapping .sd-modal-root', async () => {
  hostFixture.componentInstance.autoId = 'confirm';
  hostFixture.detectChanges();
  // Trigger open()
  hostFixture.componentInstance.modal.open();
  await hostFixture.whenStable();

  const root = document.querySelector('.sd-modal-root[data-autoid="components-modal-confirm"]');
  expect(root).toBeTruthy();
  expect(root!.getAttribute('data-opened')).toBe('true');

  hostFixture.componentInstance.modal.close();
  await hostFixture.whenStable();
  // After close, the dialog is detached â€” element should be gone.
  expect(document.querySelector('.sd-modal-root[data-autoid="components-modal-confirm"]')).toBeNull();
});
```

If the existing test harness doesn't expose the modal instance, adapt to the harness already used by the autoId block.

- [ ] **Step 2: Run, FAIL.**

- [ ] **Step 3: TS** â€” add a computed below the existing `closeButtonAutoId`:

```ts
readonly dataOpened = computed(() => (this.isOpened() ? 'true' : 'false'));
```

- [ ] **Step 4: HTML** â€” wrap the existing body of `<ng-template #templateRef>` in a new `<div class="sd-modal-root">`:

```html
<ng-template #templateRef>
  <div class="sd-modal-root"
       [attr.data-autoId]="autoId()"
       [attr.data-opened]="dataOpened()">
    @if (!lazyLoadContent() || alreadyOpened()) {
      <!-- existing header / body / footer markup, UNCHANGED -->
    }
  </div>
</ng-template>
```

- [ ] **Step 5: Inspect SCSS** â€” open `modal.component.scss` and search for selectors that target a direct child of the dialog content (`> div`, `:first-child`, or rely on the previous DOM depth). If any rule needs to traverse through `.sd-modal-root`, update it. Also grep the rest of the repo for `.mat-mdc-dialog-content > sd-modal` style rules; none are expected but worth confirming.

- [ ] **Step 6: Run tests, verify PASS**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/components/modal/src/modal.component.spec.ts
```

- [ ] **Step 7: MD** â€” append `## E2E test attributes` to `sd-modal.md`:

```markdown
## E2E test attributes

Because `sd-modal` renders into a MatDialog overlay (which lives at `document.body`), the QA anchor lives on a `<div class="sd-modal-root">` wrapping the template content:

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `components-modal-<autoId>` | input `autoId` |
| `data-opened` | `"true"` while open, element absent after close | `isOpened` signal |

Selector example:

```ts
await page.locator('.sd-modal-root[data-autoid="components-modal-confirm"][data-opened="true"]').waitFor();
```
```

- [ ] **Step 8: Commit**:

```
git add projects/sdcorejs-angular/components/modal/
git commit -m "feat(modal): wrap template in .sd-modal-root with data-opened for E2E"
```

---

### Task 21: `sd-side-drawer` â€” signal migration + `autoId` + attrs

**Files:**
- Modify: `projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.{ts,html,spec.ts}`
- Modify: `projects/sdcorejs-angular/components/side-drawer/sd-side-drawer.md`
- Modify: any in-repo consumer of `drawer.isOpened` / `drawer.isLoading` as a property (search for `\.isOpened\b` and `\.isLoading\b` references on `SdSideDrawer`).

`sd-side-drawer` currently:
- Has **no** `autoId` input.
- Stores `isOpened` and `isLoading` as plain mutable booleans.
- Reads them in the template as `isOpened` (property), not `isOpened()` (signal).

This task converts them to signals via `.asReadonly()` accessors, adds the `autoId` input, and wires the three new `data-*` attributes onto the `.sd-side-drawer` root.

- [ ] **Step 1: Failing tests** â€” append to `side-drawer.component.spec.ts`:

```ts
describe('SdSideDrawer â€” E2E attributes', () => {
  let host: ComponentFixture<HostCmp>;
  let drawer: SdSideDrawer;

  // â€¦ reuse the existing host harness already used for sd-side-drawer specs

  beforeEach(() => {
    host = TestBed.createComponent(HostCmp);
    host.componentInstance.autoId = 'filters';
    host.detectChanges();
    drawer = host.debugElement.query(By.directive(SdSideDrawer)).componentInstance;
  });

  it('renders data-autoId on .sd-side-drawer root', () => {
    drawer.open();
    host.detectChanges();
    const root = document.querySelector('.sd-side-drawer');
    expect(root?.getAttribute('data-autoid')).toBe('components-side-drawer-filters');
  });

  it('renders data-opened toggling with open()/close()', () => {
    expect(document.querySelector('.sd-side-drawer')?.getAttribute('data-opened')).toBe('false');
    drawer.open();
    host.detectChanges();
    expect(document.querySelector('.sd-side-drawer')?.getAttribute('data-opened')).toBe('true');
    drawer.close();
    host.detectChanges();
    expect(document.querySelector('.sd-side-drawer')?.getAttribute('data-opened')).toBe('false');
  });

  it('renders data-loading toggling with startLoading()/stopLoading()', () => {
    drawer.open();
    drawer.startLoading();
    host.detectChanges();
    expect(document.querySelector('.sd-side-drawer')?.getAttribute('data-loading')).toBe('true');
    drawer.stopLoading();
    host.detectChanges();
    expect(document.querySelector('.sd-side-drawer')?.getAttribute('data-loading')).toBe('false');
  });
});
```

- [ ] **Step 2: Run, FAIL.**

- [ ] **Step 3: TS â€” convert booleans to signals + add `autoId`**

Open `side-drawer.component.ts`. Replace:

```ts
isOpened = false;
isLoading = false;
```

with:

```ts
readonly #isOpenedSignal = signal(false);
readonly #isLoadingSignal = signal(false);

readonly isOpened = this.#isOpenedSignal.asReadonly();
readonly isLoading = this.#isLoadingSignal.asReadonly();

readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
readonly autoId = computed(() =>
  this.autoIdInput() ? `components-side-drawer-${this.autoIdInput()}` : undefined
);

readonly dataOpened = computed(() => (this.#isOpenedSignal() ? 'true' : 'false'));
readonly dataLoading = computed(() => (this.#isLoadingSignal() ? 'true' : 'false'));
```

Update every internal mutation:
- `open()` body: change `this.isOpened = true;` â†’ `this.#isOpenedSignal.set(true);`
- `close()` body: change `this.isOpened = false;` â†’ `this.#isOpenedSignal.set(false);`
- `startLoading()` body: change `this.isLoading = true;` â†’ `this.#isLoadingSignal.set(true);`
- `stopLoading()` body: change `this.isLoading = false;` â†’ `this.#isLoadingSignal.set(false);`
- The `if (this.isOpened) { ... }` block inside `#destroyRef.onDestroy` becomes `if (this.#isOpenedSignal()) { ... }`.

Also import `signal`, `computed`, `input` from `@angular/core` if not already imported.

- [ ] **Step 4: HTML â€” update template reads + add attrs**

Open `side-drawer.component.html`. Replace every `isOpened` (property read) with `isOpened()` (signal call). Specific lines (per current file):
- Line 7: `[class.sd-side-drawer-active]="isOpened"` â†’ `[class.sd-side-drawer-active]="isOpened()"`
- Line 9: `@if (isOpened) {` â†’ `@if (isOpened()) {`
- Line 37: `@if (isOpened) {` â†’ `@if (isOpened()) {`
- Line 50: `@if (isOpened) {` â†’ `@if (isOpened()) {`

On the root `<div class="sd-side-drawer" â€¦>`, append:

```html
[attr.data-autoId]="autoId()"
[attr.data-opened]="dataOpened()"
[attr.data-loading]="dataLoading()"
```

- [ ] **Step 5: Migrate in-repo consumers**

Search the repo for property access:

```
grep -rn "\.isOpened\b\|\.isLoading\b" projects/ --include='*.ts' --include='*.html'
```

Filter to references against `SdSideDrawer`. For each one:
- If it's a non-template read (`drawer.isOpened`), change to `drawer.isOpened()`.
- If it's inside an Angular template (`{{ drawer.isOpened }}` or `@if (drawer.isOpened)`), change to `drawer.isOpened()`.

If there are no in-repo consumers, that's fine â€” record this in the commit message.

- [ ] **Step 6: Run all side-drawer tests, verify PASS**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/components/side-drawer/**/*.spec.ts
```

If any pre-existing test reads `drawer.isOpened` as a property, update it to `drawer.isOpened()`.

- [ ] **Step 7: MD** â€” append `## E2E test attributes` to `sd-side-drawer.md`:

```markdown
## E2E test attributes

Rendered on the `.sd-side-drawer` root element (which lives at `document.body` via `CdkPortal`):

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `components-side-drawer-<autoId>` | NEW input `autoId` |
| `data-opened` | `"true"` / `"false"` | `isOpened` signal |
| `data-loading` | `"true"` / `"false"` | `isLoading` signal |

> **Breaking change (v0.0.x â†’ v0.1.0):** `isOpened` and `isLoading` are now `Signal<boolean>` (read with `drawer.isOpened()` / `drawer.isLoading()`) instead of plain booleans. Update any external consumer that reads them as properties.
```

Also add a row for the new `autoId` input to the existing Inputs table.

- [ ] **Step 8: Commit**:

```
git add projects/sdcorejs-angular/components/side-drawer/
# include any external consumer files touched in Step 5
git commit -m "feat(side-drawer)!: add autoId + migrate isOpened/isLoading to signals; render data-opened/loading for E2E"
```

Use `!` in the commit type to flag the breaking change (matches Conventional Commits convention used elsewhere in this repo).

---

## Phase 6 â€” Documentation & final sweep

### Task 22: Central `E2E-ATTRIBUTES.md`

**Files:**
- Create: `projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md`

- [ ] **Step 1: Create the file** with the following content:

```markdown
# Core UI â€” E2E test attributes reference

This document is the source of truth for the `data-*` attributes rendered by `@sdcorejs/angular` components for QA automation. Both human QA engineers and downstream AI agents (e.g. SDCoreJS skill packs that generate e2e tests) should be able to read this file alone and know what each component exposes.

## Convention

- Attribute names are **lowercase**. The browser normalizes data-attribute names regardless of casing in the source, so `[attr.data-autoId]` ends up as `data-autoid` in the DOM.
- Boolean attributes are **always present** with the string literals `"true"` or `"false"` (not boolean-attribute style). This lets QA write straightforward selectors like `[data-loading="false"]`.
- `data-value` is **omitted** (bound to `null`) for sensitive or non-serializable inputs:
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

The shared helpers live in `@sdcorejs/angular/utilities`: `sdSerializeDataValue()` and `sdIsEmpty()`.

## Attribute catalog

| Attribute | Value | Applies to | Source |
|---|---|---|---|
| `data-autoid` | namespaced ID | all `autoId`-enabled components | input `autoId` |
| `data-disabled` | `"true"` / `"false"` | all forms, button, editor, upload-file | `formControl.disabled` or `disabled` input |
| `data-loading` | `"true"` / `"false"` | select, autocomplete, button, side-drawer, table, upload-file, editor | `loading` signal or input |
| `data-value` | stringified primitive | all forms (skipped for password / upload-file / editor) | `formControl.value` via `sdSerializeDataValue()` |
| `data-empty` | `"true"` / `"false"` | all forms, upload-file, editor | `sdIsEmpty(value)` |
| `data-invalid` | `"true"` / `"false"` | scalar / collection form controls that validate | `formControl.invalid && (touched \|\| dirty)` |
| `data-opened` | `"true"` / `"false"` | modal, side-drawer | `isOpened` signal |
| `data-count` | numeric string | chip, chip-calendar, upload-file | `value.length` / `files.length` |

## Component matrix

| Component | autoId prefix | Anchor element | Attributes |
|---|---|---|---|
| `sd-input` | `forms-input` | `input[matInput]` | disabled, invalid, empty, value (skipped for password) |
| `sd-textarea` | `forms-textarea` | `textarea[matInput]` | disabled, invalid, empty, value |
| `sd-input-number` | `forms-input-number` | `input` | disabled, invalid, empty, value |
| `sd-switch` | `forms-switch` | `mat-slide-toggle` | disabled, empty, value |
| `sd-checkbox` | `forms-checkbox` | `mat-checkbox` | disabled, empty, value |
| `sd-radio` | `forms-radio` | `mat-radio-group` | disabled, empty, value |
| `sd-date` | `forms-date` | `input` | disabled, invalid, empty, value (ISO) |
| `sd-datetime` | `forms-datetime` | `input` | disabled, invalid, empty, value (ISO) |
| `sd-select` | `forms-select` | `mat-select` | disabled, invalid, empty, value, loading |
| `sd-autocomplete` | `forms-autocomplete` | `input` | disabled, invalid, empty, value, loading |
| `sd-chip` | `forms-chip` | `input.sd-chip-input` | disabled, empty, value (JSON arr), count |
| `sd-chip-calendar` | `forms-chip-calendar` | `input.sd-chip-input` | disabled, empty, value (JSON ISO arr), count |
| `sd-date-range` | `forms-date-range` | `input` | disabled, invalid, empty, value (JSON `{from,to}`) |
| `sd-button` | `components-button` | `button.c-button` | disabled, loading |
| `sd-modal` | `components-modal` | `.sd-modal-root` (inside dialog overlay) | opened |
| `sd-side-drawer` | `components-side-drawer` | `.sd-side-drawer` (in `document.body` via CdkPortal) | opened, loading |
| `sd-table` | `components-table` | `<sd-table>` host | loading |
| `sd-upload-file` | `components-upload-file` | existing input anchor | disabled, loading, empty, count |
| `sd-editor` | `components-editor` | host | disabled, loading, empty |

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
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value]
  anchor: input[matInput]
  prefix: forms-input
  loading: false
  notes:
    - "data-value is omitted when type=password"

sd-textarea:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value]
  anchor: textarea[matInput]
  prefix: forms-textarea
  loading: false

sd-input-number:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value]
  anchor: input
  prefix: forms-input-number
  loading: false

sd-switch:
  attrs: [data-autoid, data-disabled, data-empty, data-value]
  anchor: mat-slide-toggle
  prefix: forms-switch
  loading: false

sd-checkbox:
  attrs: [data-autoid, data-disabled, data-empty, data-value]
  anchor: mat-checkbox
  prefix: forms-checkbox
  loading: false

sd-radio:
  attrs: [data-autoid, data-disabled, data-empty, data-value]
  anchor: mat-radio-group
  prefix: forms-radio
  loading: false

sd-date:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value]
  anchor: input
  prefix: forms-date
  loading: false
  value_format: ISO string

sd-datetime:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value]
  anchor: input
  prefix: forms-datetime
  loading: false
  value_format: ISO string

sd-select:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-loading]
  anchor: mat-select
  prefix: forms-select
  loading: true

sd-autocomplete:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value, data-loading]
  anchor: input
  prefix: forms-autocomplete
  loading: true

sd-chip:
  attrs: [data-autoid, data-disabled, data-empty, data-value, data-count]
  anchor: input.sd-chip-input
  prefix: forms-chip
  loading: false
  value_format: JSON-stringified array

sd-chip-calendar:
  attrs: [data-autoid, data-disabled, data-empty, data-value, data-count]
  anchor: input.sd-chip-input
  prefix: forms-chip-calendar
  loading: false
  value_format: JSON-stringified array of ISO strings

sd-date-range:
  attrs: [data-autoid, data-disabled, data-invalid, data-empty, data-value]
  anchor: input
  prefix: forms-date-range
  loading: false
  value_format: JSON-stringified {from, to}

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
  attrs: [data-autoid, data-disabled, data-loading, data-empty, data-count]
  anchor: existing input anchor in the component template
  prefix: components-upload-file
  loading: true
  notes:
    - "data-value omitted â€” File objects don't serialize safely"

sd-editor:
  attrs: [data-autoid, data-disabled, data-loading, data-empty]
  anchor: host
  prefix: components-editor
  loading: true
  notes:
    - "data-value omitted â€” content may be MB-sized"
```
```

- [ ] **Step 2: Commit**:

```
git add projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md
git commit -m "docs(sd-angular): add central E2E-ATTRIBUTES.md reference"
```

---

### Task 23: README link

**Files:**
- Modify: `projects/sdcorejs-angular/README.md` (if present) or repo-root `README.md`

- [ ] **Step 1:** identify which README is the canonical entry for `@sdcorejs/angular` users. If both exist, prefer the library-level one. Add a one-liner under a "Testing" or "QA / E2E" heading:

```markdown
## QA / E2E

Core UI components expose runtime state via lowercase `data-*` attributes. See [`docs/E2E-ATTRIBUTES.md`](docs/E2E-ATTRIBUTES.md) for the full catalog, component matrix, selector cookbook, and YAML schema for AI agents.
```

If no Testing/QA section exists, append one at the bottom.

- [ ] **Step 2: Commit**:

```
git add projects/sdcorejs-angular/README.md   # or whichever README was changed
git commit -m "docs(sd-angular): link to E2E-ATTRIBUTES from README"
```

---

### Task 24: Full sweep â€” run all tests, fix regressions, build verification

- [ ] **Step 1: Run the entire sd-angular test suite**

```
npm run test -- --watch=false --include=projects/sdcorejs-angular/**/*.spec.ts
```

Expected: PASS. If any pre-existing test fails, the most likely cause is the side-drawer signal migration (Task 21) â€” a leftover `drawer.isOpened` property read. Fix any failures inline.

- [ ] **Step 2: Run the production build**

```
npm run build:sd-angular
```

(or whichever script builds the library â€” check `package.json` scripts before running)

Expected: build succeeds. Any TypeScript error here typically means a consumer of `sd-side-drawer.isOpened` / `.isLoading` still treats them as plain booleans.

- [ ] **Step 3: Run lint**

```
npm run lint -- --files=projects/sdcorejs-angular
```

(or use the equivalent CLI flag in the repo's `package.json`)

Fix any newly introduced lint errors.

- [ ] **Step 4: Demo smoke check**

If the workspace exposes a demo app (e.g. `projects/demo`), run it and visually confirm that:
- An `sd-input` element in the demo shows `data-disabled="false"` and `data-value="<typed text>"` in DevTools.
- Opening a modal in the demo results in a `<div class="sd-modal-root" data-opened="true">` in `document.body`.

```
npm run start
```

This is a sanity check, not a hard gate. Skip if the demo doesn't ship any of the touched components.

- [ ] **Step 5: Final commit** (only if Steps 1-3 surfaced any fixes)

```
git add -A
git commit -m "test(sd-angular): fix regressions surfaced by full sweep"
```

If no fixes were needed, skip this commit.

---

## Acceptance criteria (from spec Â§9)

- [ ] `sdSerializeDataValue` and `sdIsEmpty` exist in `@sdcorejs/angular/utilities`, with unit tests.
- [ ] `sdFormControlState` exists and emits on value/status changes, with unit tests.
- [ ] Every component in the matrix renders its listed attributes on the listed anchor element.
- [ ] Every component spec has an `E2E attributes` describe block with at least one test per new attribute.
- [ ] Every `sd-<name>.md` has an `## E2E test attributes` section.
- [ ] `projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md` exists with the convention, catalog, matrix, cookbook, and YAML schema sections.
- [ ] README links to the central doc.
- [ ] `sd-side-drawer.isOpened` / `.isLoading` migrated to signals with `.asReadonly()` accessors; all in-repo consumers updated.
- [ ] `sd-modal` template wraps body in `<div class="sd-modal-root">` carrying `data-autoId` + `data-opened`.
- [ ] `npm run test` for `projects/sdcorejs-angular` passes.
- [ ] `npm run build` for the library passes.

---

## Self-review notes

- **Spec coverage:** Every section/requirement in the spec maps to a task. Spec Â§3 (matrix) â†’ Tasks 3-21. Spec Â§4 (utilities + bridge) â†’ Tasks 1-2. Spec Â§5 (docs) â†’ Tasks 22-23. Spec Â§6 (tests) â†’ embedded in every component task. Spec Â§7 (backwards compat for side-drawer) â†’ Task 21 Steps 3-5. Spec Â§10 (implementation order) â†’ followed by the phase ordering.
- **Type consistency:** `sdFormControlState` returns `Signal<SdFormControlSnapshot<T>>`. All component computeds read `.value` / `.disabled` / `.invalid` from the snapshot. `dataValue` is `Signal<string | null>` (null only when bound for password-omit case). Bindings consistently use `[attr.data-disabled]` etc.
- **Naming:** Tasks 3-15 follow Conventional Commits with type `feat(<scope>)`. Task 21 uses `feat(side-drawer)!` to flag the breaking change.

