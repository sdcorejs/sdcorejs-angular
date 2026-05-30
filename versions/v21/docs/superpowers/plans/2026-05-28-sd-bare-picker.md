# Bare Picker API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `[bare]` render mode + public `open()` to `sd-select` / `sd-date` / `sd-datetime`, then refactor `sd-query-bar` inline mode to render those bare controls and delete the bespoke `valuePopover` / `.c-valpop` panel + inline option machinery.

**Architecture:** Additive (default-off) API on the three core form controls â€” `bare` flattens the `mat-form-field` chrome via a `:host(.sd-bare)` CSS scope; `open()` opens the control's existing native picker. `sd-query-bar` composes the bare controls in its inline chips and routes `lazy-values` through `sd-select`'s `SdSearch` items, so the bar no longer owns any option/overlay logic for the inline path.

**Tech Stack:** Angular 19 standalone + signals, Angular Material (mat-select / mat-datepicker / CDK overlay), Karma+Jasmine, ng-packagr secondary entry points.

**Working directory for all commands:** `cd /c/Users/Admin/Documents/lib-core-angular/vn-angular` (the harness resets cwd between Bash calls â€” prefix every `npx ng` command with this `cd`).

**Test command template (one entry at a time keeps Karma fast):**
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include="projects/sdcorejs-angular/forms/<entry>/**/*.spec.ts" 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED|error TS" | head
```

**Commit style:** `SM-00: <type>(<scope>): <subject>` + trailing `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Core controls (each: add `bare` input + host class + `open()` + `:host(.sd-bare)` CSS):**
- `projects/sdcorejs-angular/forms/select/src/select.component.ts` â€” `bare` input, `open()`.
- `projects/sdcorejs-angular/forms/select/src/select.component.scss` â€” `:host(.sd-bare)` flatten.
- `projects/sdcorejs-angular/forms/select/src/select.component.spec.ts` â€” bare + open tests.
- `projects/sdcorejs-angular/forms/date/src/date.component.{ts,scss,spec.ts}` â€” same.
- `projects/sdcorejs-angular/forms/datetime/src/datetime.component.{ts,scss,spec.ts}` â€” `bare` + open test (`open()` already exists).

**sd-query-bar:**
- `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts` â€” add `lazyItemsFor()` adapter; delete value-popover state + ~14 methods + inline option cache; repurpose `usesValuePopover`.
- `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html` â€” route `values`/`lazy-values`/`date`/`datetime` inline chips to bare controls via `valueEditor`; delete `valuePopover` mat-menu + value-trigger buttons.
- `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss` â€” delete `.c-value-popover*` / `.c-valpop*`.
- `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts` â€” drop value-popover specs; add bare-control specs.

**Untouched:** `inline-value-chip.*` (string/number seamless), popover-mode chipPopover path.

---

## Task 1: sd-datetime â€” `bare` input + open() test

`open()` already exists (`datetime.component.ts:301`, anchors a CDK overlay to the host). Only add `bare` + verify `open()`.

**Files:**
- Modify: `projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts`
- Modify: `projects/sdcorejs-angular/forms/datetime/src/datetime.component.scss`
- Test: `projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Append to `datetime.component.spec.ts` (inside the top-level `describe`):

```ts
it('bare defaults to false and applies no host class', () => {
  fixture.detectChanges();
  expect(component.bare()).toBe(false);
  expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(false);
});

it('bare=true adds the .sd-bare host class', () => {
  fixture.componentRef.setInput('bare', true);
  fixture.detectChanges();
  expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(true);
});

it('open() opens the picker overlay', () => {
  fixture.detectChanges();
  component.open();
  expect(component.pickerOpened()).toBe(true);
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run:
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="projects/sdcorejs-angular/forms/datetime/**/*.spec.ts" 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED|error TS" | head
```
Expected: FAIL â€” `component.bare is not a function` (input missing).

- [ ] **Step 3: Add the `bare` input + host class binding**

In `datetime.component.ts`, add to the `@Component` decorator a host binding and add the input next to the other `input(...)` declarations. Add the host binding by adding/merging the `host` property on the decorator:

```ts
  host: { '[class.sd-bare]': 'bare()' },
```

Add the input (near the other boolean inputs such as `required`/`disabled`; ensure `booleanAttribute` is imported from `@angular/core`):

```ts
  /** Flatten the field chrome to a chip-friendly trigger (value + caret only). */
  bare = input(false, { transform: booleanAttribute });
```

- [ ] **Step 4: Add the bare CSS**

Append to `datetime.component.scss`:

```scss
// Bare mode â€” flatten the field so the control fits inline in a chip (sd-query-bar).
:host(.sd-bare) {
  display: inline-flex;

  .mat-mdc-form-field { width: auto; }
  .mat-mdc-text-field-wrapper { padding: 0; background: transparent; }
  .mat-mdc-form-field-flex { padding: 0; }
  .mdc-notched-outline { display: none; }
  .mat-mdc-form-field-subscript-wrapper { display: none; }
  .mat-mdc-form-field-infix { padding: 0; min-height: 0; width: auto; border: 0; }
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run the Step 2 command. Expected: `TOTAL: N SUCCESS` (no FAILED).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && git add projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts projects/sdcorejs-angular/forms/datetime/src/datetime.component.scss projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts && git commit -m "$(cat <<'EOF'
SM-00: feat(datetime): add [bare] render mode for inline/chip hosts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: sd-date â€” `open()` + `bare`

`date.component.ts` has `datePicker = viewChild<MatDatepicker<Date>>(MatDatepicker)` (line 85) and a `focus()` that calls `datePicker()?.open()`. Add a clean public `open()` + `bare`.

**Files:**
- Modify: `projects/sdcorejs-angular/forms/date/src/date.component.ts`
- Modify: `projects/sdcorejs-angular/forms/date/src/date.component.scss`
- Test: `projects/sdcorejs-angular/forms/date/src/date.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Append to `date.component.spec.ts` (top-level `describe`):

```ts
it('bare=true adds the .sd-bare host class (default off)', () => {
  fixture.detectChanges();
  expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(false);
  fixture.componentRef.setInput('bare', true);
  fixture.detectChanges();
  expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(true);
});

it('open() opens the datepicker', () => {
  fixture.detectChanges();
  component.open();
  expect(component.datePicker()?.opened).toBe(true);
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run:
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="projects/sdcorejs-angular/forms/date/**/*.spec.ts" 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED|error TS" | head
```
Expected: FAIL â€” `component.open is not a function` and/or `component.bare is not a function`.

- [ ] **Step 3: Add `bare` input, host class, `open()`**

In `date.component.ts` `@Component` decorator add:
```ts
  host: { '[class.sd-bare]': 'bare()' },
```
(If a `host` already exists, merge the binding into it.)

Add the input (ensure `booleanAttribute` imported from `@angular/core`), near other boolean inputs:
```ts
  /** Flatten the field chrome to a chip-friendly trigger (value + caret only). */
  bare = input(false, { transform: booleanAttribute });
```

Add the public method near `focus` (around line 285):
```ts
  /** Open the datepicker calendar programmatically (anchors to the field input). */
  open = () => {
    if (this.formControl.disabled) return;
    this.datePicker()?.open();
  };
```

- [ ] **Step 4: Add the bare CSS**

Append to `date.component.scss`:
```scss
:host(.sd-bare) {
  display: inline-flex;

  .mat-mdc-form-field { width: auto; }
  .mat-mdc-text-field-wrapper { padding: 0; background: transparent; }
  .mat-mdc-form-field-flex { padding: 0; }
  .mdc-notched-outline { display: none; }
  .mat-mdc-form-field-subscript-wrapper { display: none; }
  .mat-mdc-form-field-infix { padding: 0; min-height: 0; width: auto; border: 0; }
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run the Step 2 command. Expected: `TOTAL: N SUCCESS`.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && git add projects/sdcorejs-angular/forms/date/src/date.component.ts projects/sdcorejs-angular/forms/date/src/date.component.scss projects/sdcorejs-angular/forms/date/src/date.component.spec.ts && git commit -m "$(cat <<'EOF'
SM-00: feat(date): add public open() + [bare] render mode

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: sd-select â€” `open()` + `bare`

`select.component.ts` has `selectRef = viewChild<MatSelect>('select')` (line 96) and a `focus()` that calls `selectRef()?.open()`.

**Files:**
- Modify: `projects/sdcorejs-angular/forms/select/src/select.component.ts`
- Modify: `projects/sdcorejs-angular/forms/select/src/select.component.scss`
- Test: `projects/sdcorejs-angular/forms/select/src/select.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Append to `select.component.spec.ts` (top-level `describe`; ensure the test module sets `valueField`/`displayField` the way the existing specs do):

```ts
it('bare=true adds the .sd-bare host class (default off)', () => {
  fixture.detectChanges();
  expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(false);
  fixture.componentRef.setInput('bare', true);
  fixture.detectChanges();
  expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(true);
});

it('open() opens the select panel', () => {
  fixture.detectChanges();
  component.open();
  expect(component.selectRef()?.panelOpen).toBe(true);
});
```

> If the existing spec file lacks required inputs (`valueField`/`displayField`) for `createComponent`, mirror the setup already used by the other `select.component.spec.ts` tests (set them via `fixture.componentRef.setInput` before `detectChanges`).

- [ ] **Step 2: Run tests, verify they fail**

Run:
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="projects/sdcorejs-angular/forms/select/**/*.spec.ts" 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED|error TS" | head
```
Expected: FAIL â€” `component.open is not a function` / `component.bare is not a function`.

- [ ] **Step 3: Add `bare` input, host class, `open()`**

In `select.component.ts` `@Component` decorator add:
```ts
  host: { '[class.sd-bare]': 'bare()' },
```

Add the input (near `multiple`/`disabled`; `booleanAttribute` is already imported):
```ts
  /** Flatten the field chrome to a chip-friendly trigger (value + caret only). */
  bare = input(false, { transform: booleanAttribute });
```

Add the public method near `focus` (around line 627):
```ts
  /** Open the select panel programmatically (anchors to the mat-select trigger). */
  open = () => {
    if (this.formControl.disabled) return;
    this.focus();
  };
```
(`focus()` already calls `selectRef()?.open()` after focusing; reuse it so search-input focus behavior stays identical.)

- [ ] **Step 4: Add the bare CSS**

Append to `select.component.scss`:
```scss
:host(.sd-bare) {
  display: inline-flex;

  .mat-mdc-form-field { width: auto; }
  .mat-mdc-text-field-wrapper { padding: 0; background: transparent; }
  .mat-mdc-form-field-flex { padding: 0; }
  .mdc-notched-outline { display: none; }
  .mat-mdc-form-field-subscript-wrapper { display: none; }
  .mat-mdc-form-field-infix { padding: 0; min-height: 0; width: auto; border: 0; }
  // hide the trailing dropdown arrow â€” the chip provides its own affordance
  .mat-mdc-select-arrow-wrapper { display: none; }
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run the Step 2 command. Expected: `TOTAL: N SUCCESS`.

- [ ] **Step 6: Commit**

```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && git add projects/sdcorejs-angular/forms/select/src/select.component.ts projects/sdcorejs-angular/forms/select/src/select.component.scss projects/sdcorejs-angular/forms/select/src/select.component.spec.ts && git commit -m "$(cat <<'EOF'
SM-00: feat(select): add public open() + [bare] render mode

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: sd-query-bar â€” lazy `SdSearch` adapter + reroute inline value editor to bare controls

This task changes behavior; do template + TS together so the entry still compiles, then run specs.

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts`
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html`

- [ ] **Step 1: Add the lazy adapter + repurpose `usesValuePopover`, in `query-bar.component.ts`**

Add imports at top (merge with existing rxjs import line):
```ts
import { firstValueFrom, isObservable } from 'rxjs';
```
(`isObservable` is already imported; add `firstValueFrom`.)

Add a method (near `optionsFor`, before its deletion in Step 3 â€” or anywhere in the class):
```ts
  /**
   * Build an `SdSearch` function for a lazy-values field so `sd-select` owns the
   * search + chip-display lookups. `SEARCH` -> field.option.search; `VALUE` -> field.option.views.
   */
  lazyItemsFor(field: SdQueryField): SdSearch {
    const opt = (field as any).option;
    return async (req): Promise<any[]> => {
      if (req.type === 'VALUE') {
        const values = Array.isArray(req.value) ? req.value : req.value == null ? [] : [req.value];
        return opt?.views ? await opt.views(values) : [];
      }
      const result = opt.search({ search: req.searchText ?? '' });
      return isObservable(result) ? await firstValueFrom(result) : await result;
    };
  }
```
Import `SdSearch`:
```ts
import { SdSearch } from '@sdcorejs/angular/forms/models';
```

- [ ] **Step 2: Rewrite the `valueEditor` ng-template to use bare controls (in `query-bar.component.html`)**

Replace the existing `#valueEditor` template (the `<ng-template #valueEditor ...>` block, currently around lines 222-238) with this version. It uses `bare` on every control, passes the `SdSearch` adapter for `lazy-values`, and keeps the boolean + number + string branches:

```html
<ng-template #valueEditor let-field="field" let-data="data" let-isMulti="isMulti" let-change="change" let-enter="enter" let-autoId="autoId">
  @if (field.kind === 'boolean') {
    <sd-button [autoId]="autoId + '-true'" [type]="data === true ? 'fill' : 'outline'" color="primary" [title]="$any(field).trueLabel || 'CÃ³'" (click)="change(true); enter()"></sd-button>
    <sd-button [autoId]="autoId + '-false'" [type]="data === false ? 'fill' : 'outline'" color="primary" [title]="$any(field).falseLabel || 'KhÃ´ng'" (click)="change(false); enter()"></sd-button>
  } @else if (field.kind === 'values') {
    @let _opt = $any(field).option;
    <sd-select bare size="sm" [autoId]="autoId" [items]="$any(_opt.items)" [valueField]="_opt.valueField" [displayField]="_opt.displayField" [multiple]="isMulti" [model]="data" (sdChange)="change($event); enter()"></sd-select>
  } @else if (field.kind === 'lazy-values') {
    @let _lopt = $any(field).option;
    <sd-select bare size="sm" [autoId]="autoId" [items]="lazyItemsFor(field)" [valueField]="_lopt.valueField" [displayField]="_lopt.displayField" [multiple]="isMulti" [model]="data" (sdChange)="change($event); enter()"></sd-select>
  } @else if (field.kind === 'date') {
    <sd-date bare size="sm" [autoId]="autoId" [model]="data" (sdChange)="change($event); enter()"></sd-date>
  } @else if (field.kind === 'datetime') {
    <sd-datetime bare size="sm" [autoId]="autoId" [model]="data" (sdChange)="change($event); enter()"></sd-datetime>
  } @else if (field.kind === 'number') {
    <sd-input-number size="sm" [autoId]="autoId" [model]="data" (sdChange)="change($event)" (keyupEnter)="enter()"></sd-input-number>
  } @else {
    <sd-input size="sm" [autoId]="autoId" [model]="data" (sdChange)="change($event)" (keyupEnter)="enter()"></sd-input>
  }
</ng-template>
```

- [ ] **Step 3: Route inline completed + build chips for `values`/`lazy-values`/`date`/`datetime` through the bare editor (in `query-bar.component.html`)**

In the **inline completed chip** `@else` branch (the non-seamless `.c-token` block), replace the value section. The current section is:

```html
            @if (!isNoDataOperator(_op)) {
              @if (usesValuePopover(_field.kind)) {
                <button
                  type="button"
                  class="c-token-value c-token-value-trigger"
                  #editValueTrigger="matMenuTrigger"
                  [matMenuTriggerFor]="valuePopover"
                  [matMenuTriggerData]="{ mode: 'edit', index: i, field: _field }"
                  (menuOpened)="openEditValuePopover(i, _field, editValueTrigger)">
                  {{ chipValueText(filter) }}
                </button>
              } @else if (isEditingValue(i)) {
                <span class="c-token-value c-token-value-edit">
                  <ng-container *ngTemplateOutlet="valueEditor; context: { field: _field, data: _data, isMulti: isMultiOperator(_op), change: setEditDraftFn(), enter: commitEditDraftFn(i), autoId: inlineAutoId(i, 'value') }"></ng-container>
                </span>
              } @else {
                <button type="button" class="c-token-value" (click)="beginEditValue(i)">{{ chipValueText(filter) }}</button>
              }
            }
```

Replace it with (boolean keeps the edit-toggle; values/lazy/date/datetime always render the bare control which shows the value and opens its own panel on click):

```html
            @if (!isNoDataOperator(_op)) {
              @if (_field.kind === 'boolean') {
                @if (isEditingValue(i)) {
                  <span class="c-token-value c-token-value-edit">
                    <ng-container *ngTemplateOutlet="valueEditor; context: { field: _field, data: _data, isMulti: isMultiOperator(_op), change: setEditDraftFn(), enter: commitEditDraftFn(i), autoId: inlineAutoId(i, 'value') }"></ng-container>
                  </span>
                } @else {
                  <button type="button" class="c-token-value" (click)="beginEditValue(i)">{{ chipValueText(filter) }}</button>
                }
              } @else {
                <span class="c-token-value c-token-value-edit">
                  <ng-container *ngTemplateOutlet="valueEditor; context: { field: _field, data: _data, isMulti: isMultiOperator(_op), change: editValueFn(i), enter: noop, autoId: inlineAutoId(i, 'value') }"></ng-container>
                </span>
              }
            }
```

In the **build chip** value step, replace the popover-trigger branch. Current:
```html
          @if (usesValuePopover(_b.field.kind)) {
            <button
              #buildValueTrigger="matMenuTrigger"
              type="button"
              class="c-token-value c-token-value-trigger"
              [matMenuTriggerFor]="valuePopover"
              [matMenuTriggerData]="{ mode: 'build', index: -1, field: _b.field }"
              (menuOpened)="openBuildValuePopover(_b.field, buildValueTrigger)">
              {{ _b.value == null ? 'Chá»nâ€¦' : chipValueText($any({ field: _b.field.key, operator: _b.operator, data: _b.value })) }}
            </button>
          } @else {
            <span class="c-token-value c-token-value-edit">
              <ng-container *ngTemplateOutlet="valueEditor; context: { field: _b.field, data: _b.value ?? null, isMulti: isMultiOperator($any(_b.operator)), change: setBuildDraftFn(), enter: commitBuildDraftFn(), autoId: 'qb-build-value' }"></ng-container>
            </span>
          }
```
Replace the whole `@if (usesValuePopover(...)) {...} @else {...}` with just the editor (all non-string/number build kinds use the bare editor now):
```html
          <span class="c-token-value c-token-value-edit">
            <ng-container *ngTemplateOutlet="valueEditor; context: { field: _b.field, data: _b.value ?? null, isMulti: isMultiOperator($any(_b.operator)), change: setBuildDraftFn(), enter: commitBuildDraftFn(), autoId: 'qb-build-value' }"></ng-container>
          </span>
```

- [ ] **Step 4: Add the `editValueFn` + `noop` helpers, delete value-popover state/methods + inline option cache (in `query-bar.component.ts`)**

Add helpers (near `setEditDraftFn`):
```ts
  /** Live-commit an inline edit for a completed chip (bare control path). */
  editValueFn(i: number): (v: unknown) => void {
    return (v: unknown) => this.updateFilter(i, { data: v } as Partial<Filter>);
  }
  noop = (): void => undefined;
```

Delete these members (value-popover, no longer referenced after Step 2-3):
`#valueCtx`, `valueCtx`, `#valuePopoverSearch`, `valuePopoverSearch`, `setValuePopoverSearch`, `#activeValueTrigger`, `openEditValuePopover`, `openBuildValuePopover`, `commitValuePopover`, `valuePopoverMulti`, `currentDraftValue`, `valuePopoverOptions`, `isOptionSelected`, `pickValueOption`, `toggleValueOption`, `commitValuePopoverDate`, `onValuePopoverClosed`.

Delete the inline option cache (used only by the deleted valuePopover + the now-`SdSearch`-driven select): `#optionsCache`, `optionsFor`, `#loadedOptionKeys`, `#ensureOptions`, `#setOptions`, and the constructor `effect(() => { if (this.mode() !== 'inline') return; ... #ensureOptions ... })` block.

Delete `usesValuePopover` (no longer referenced) **only after** confirming Step 2-3 removed all template uses (grep below).

- [ ] **Step 5: Delete the `valuePopover` mat-menu (in `query-bar.component.html`)**

Delete the entire `<mat-menu #valuePopover ...> ... </mat-menu>` block (the "Shared value popover" comment + menu, currently ~lines 435-449 plus its body up to the closing `</mat-menu>`).

- [ ] **Step 6: Verify no dangling references**

Run:
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && grep -rnE "valuePopover|c-valpop|optionsFor|usesValuePopover|openEditValuePopover|openBuildValuePopover|#ensureOptions" projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html | grep -v "spec.ts"
```
Expected: no output. If any line prints, remove that reference before continuing.

- [ ] **Step 7: Build the query-bar entry (AOT type-check)**

Run:
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && npx ng build sdcorejs-angular --configuration=development 2>&1 | tr '\r' '\n' > /tmp/qb-bare-build.log; grep -niE "Built @sdcorejs/angular/components/query-bar|query-bar.*error TS|forms/(select|date|datetime).*error TS" /tmp/qb-bare-build.log | head
```
Expected: `âœ” Built @sdcorejs/angular/components/query-bar`, no query-bar/forms errors. (`form-generic` failing later is pre-existing and unrelated.)

- [ ] **Step 8: Commit**

```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html && git commit -m "$(cat <<'EOF'
SM-00: refactor(query-bar): inline values/date use bare core pickers, drop bespoke panel

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: sd-query-bar â€” delete `.c-valpop` styles + fix specs

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss`
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Delete the value-popover styles**

In `query-bar.component.scss`, delete the entire block under the comment `// Value popover â€” minimal panel ...` â€” the `::ng-deep .mat-mdc-menu-panel.c-value-popover .c-value-popover-body { ... }` rule and its nested `.c-valpop-*` selectors.

- [ ] **Step 2: Find spec references to the removed surface**

Run:
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && grep -nE "valuePopover|c-valpop|c-token-value-trigger|openEditValuePopover|openBuildValuePopover|valuePopoverOptions|usesValuePopover" projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
```
Note each line; the next steps rewrite them.

- [ ] **Step 3: Rewrite the build-step value spec**

The spec `'uses the value popover (mat-menu trigger) for a values field at the build value step'` (asserts `.c-token-value-trigger`) is obsolete. Replace its body so it asserts the bare `sd-select` renders at the build value step:

```ts
it('renders a bare sd-select at the values build value step', () => {
  component.beginBuild(valuesField); // single op IN -> straight to value step
  fixture.detectChanges();

  const building = fixture.nativeElement.querySelector('.c-token-building');
  const select = building.querySelector('sd-select');
  expect(select).not.toBeNull();
  expect(select.classList.contains('sd-bare')).toBe(true);
  expect(building.querySelector('[matMenuTriggerFor]')).toBeNull();
});
```

- [ ] **Step 4: Rewrite the 'inline value panel' specs**

Any spec in the `inline value panel helpers` / `inline value panel DOM` describes that call the deleted methods (`openEditValuePopover`, `valuePopoverOptions`, `pickValueOption`, etc.) or query `.c-token-value-trigger` must be deleted or rewritten. Delete those `it(...)` blocks whose sole purpose was the bespoke panel. For a completed `values` chip, add one DOM spec proving the bare control renders:

```ts
it('renders a bare sd-select for a completed values chip', () => {
  const field = {
    key: 'status', label: 'Status', kind: 'values', operators: ['IN'],
    option: { items: [{ id: 'a', name: 'A' }], valueField: 'id', displayField: 'name' },
  } as unknown as SdQueryField;
  fixture.componentRef.setInput('mode', 'inline');
  fixture.componentRef.setInput('fields', [field]);
  component.filters.set([{ field: 'status', operator: 'IN', data: ['a'] } as any]);
  fixture.detectChanges();

  const select = fixture.nativeElement.querySelector('.c-token sd-select');
  expect(select).not.toBeNull();
  expect(select.classList.contains('sd-bare')).toBe(true);
});
```

- [ ] **Step 5: Add a lazy-adapter unit spec**

Append (top-level `describe`):
```ts
describe('lazyItemsFor adapter', () => {
  const lazyField = {
    key: 'city', label: 'City', kind: 'lazy-values', operators: ['IN'],
    option: {
      search: (req: { search?: string }) => Promise.resolve(
        [{ id: 'hn', name: 'HÃ  Ná»™i' }].filter(c => !req.search || c.name.includes(req.search))),
      views: (values: unknown[]) => Promise.resolve([{ id: 'hn', name: 'HÃ  Ná»™i' }].filter(c => values.includes(c.id))),
      valueField: 'id', displayField: 'name',
    },
  } as unknown as SdQueryField;

  it('SEARCH delegates to option.search', async () => {
    const fn = component.lazyItemsFor(lazyField);
    const res = await fn({ type: 'SEARCH', searchText: '' });
    expect(res.length).toBe(1);
  });

  it('VALUE delegates to option.views', async () => {
    const fn = component.lazyItemsFor(lazyField);
    const res = await fn({ type: 'VALUE', value: ['hn'] });
    expect((res[0] as any).id).toBe('hn');
  });
});
```

- [ ] **Step 6: Run the query-bar specs**

Run:
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="projects/sdcorejs-angular/components/query-bar/**/*.spec.ts" 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED|error TS|Expected" | head -30
```
Expected: `TOTAL: N SUCCESS`. If a `FAILED` line names a leftover bespoke-panel spec, delete/rewrite it per Steps 3-4.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts && git commit -m "$(cat <<'EOF'
SM-00: test(query-bar): cover bare picker inline path, drop valuePopover specs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Full sd-angular suite (regression â€” bare/open are additive)**

Run:
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless 2>&1 | tr '\r' '\n' | grep -iE "TOTAL|FAILED" | tail -5
```
Expected: `TOTAL: N SUCCESS` (no FAILED). If any pre-existing unrelated failure appears, note it; bare/open changes must not add failures.

- [ ] **Step 2: Build the affected entries**

Run:
```bash
cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && npx ng build sdcorejs-angular --configuration=development 2>&1 | tr '\r' '\n' | grep -niE "Built @sdcorejs/angular/(components/query-bar|forms/select|forms/date|forms/datetime)|error TS" | head
```
Expected: all four entries `âœ” Built ...`, no `error TS` for them. (`form-generic` failing afterward is pre-existing.)

- [ ] **Step 3: Manual demo check (UI correctness â€” cannot be asserted by tests)**

Run `cd /c/Users/Admin/Documents/lib-core-angular/vn-angular && npx ng serve demo`, open `/sd-query-bar`, switch to **inline** mode, and verify:
- Adding/editing a `PhÃ²ng ban` (values) chip opens the **native sd-select panel** (search + checkboxes), not the old `.c-valpop` list.
- `ThÃ nh phá»‘ (lazy)` chip searches via the lazy backend through sd-select.
- `NgÃ y vÃ o` (date) opens the mat-calendar; `ÄÄƒng nháº­p cuá»‘i` (datetime) opens the datetime overlay.
- Chips still read `label : value` with grey label / primary bold value; toolbar stays anchored.

If serve cannot run in this environment, state that explicitly rather than claiming success.

---

## Self-Review notes

- **Spec coverage:** bare (Tasks 1-3 + query-bar specs), open() (Tasks 1-3), lazy adapter (Task 5 Step 5), removal of valuePopover/.c-valpop (Task 4 Step 5, Task 5 Step 1), inline reroute (Task 4 Steps 2-3), risk/regression (Task 6). All design sections covered.
- **Type consistency:** `open()` added as an arrow property on date/select (matches the `focus = () => {}` style already in those files); `bare = input(false, {transform: booleanAttribute})` identical across all three. `lazyItemsFor` returns `SdSearch` and is consumed by `sd-select [items]` which accepts `SdSearch`. `editValueFn(i)` mirrors the existing `setEditDraftFn`/`commitEditDraftFn` factory style.
- **Placeholder scan:** every code step contains concrete code; deletions reference exact members/blocks + a grep gate (Task 4 Step 6) to catch leftovers.

