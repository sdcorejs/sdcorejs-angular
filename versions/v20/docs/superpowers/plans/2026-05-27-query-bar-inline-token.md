�# query-bar inline token builder � Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework query-bar **inline mode** into a GitLab-style progressive token builder � flat completed chips (field text · operator icon · value text · �), step-by-step build (field �  operator �  value), inline value-only editing, query emitted only on Search. Popover mode unchanged.

**Architecture:** Add a small state machine to `SdQueryBar`: a `#building` signal for the single in-progress chip (held outside `filters` until complete) and an `#editingValueIndex` signal for inline value edits. Completed chips live in the existing `filters` model. Inline mutations update `filters` for rendering but do NOT emit `queryChange`; only the Search button emits (`apply`). The collapsed `sd-operator` gains a public `open()` so the build flow can auto-open the operator menu.

**Tech Stack:** Angular 19 standalone + signals (`signal`/`computed`/`viewChild`/`afterNextRender`), Angular Material menu/tooltip, existing `sd-operator` + `sd-*` form controls, Karma/Jasmine.

---

## Conventions

**Targeted test command:**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='<spec-path>'
```

Query-bar spec: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`
Operator spec: `projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts`

**Lib typecheck:** `npm run build`

All work is on branch `query-bar`. Commit at each task's commit step. English commit messages; keep Vietnamese `// why:` comments.

## File Structure

- Modify: `projects/sdcorejs-angular/components/operator/src/operator.component.ts` (+ `.spec.ts`) � add `open()`.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts` � build/edit state machine + emit gating.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html` � inline-mode template rewrite.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss` � flat token styling.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts` � state-machine + DOM tests.

---

## Task 1: `sd-operator` exposes `open()`

**Files:**
- Modify: `projects/sdcorejs-angular/components/operator/src/operator.component.ts`
- Modify: `projects/sdcorejs-angular/components/operator/src/operator.component.html`
- Test: `projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append inside the existing `describe('SdOperator')`)

```ts
  describe('open()', () => {
    it('opens the operator menu programmatically', () => {
      fixture.componentRef.setInput('operators', ['EQUAL', 'CONTAIN']);
      fixture.detectChanges();

      component.open();
      fixture.detectChanges();

      const overlay = TestBed.inject(OverlayContainer).getContainerElement();
      expect(overlay.querySelectorAll('.c-op-row').length).toBe(2);
      overlay.remove();
    });
  });
```

(`OverlayContainer` is already imported in this spec from the menu tests.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'`
Expected: FAIL � `component.open is not a function`.

- [ ] **Step 3: Implement `open()`**

In `operator.component.ts`, add the `MatMenuTrigger` import and a `viewChild` ref + method. Add to the existing `@angular/material/menu` import:

```ts
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
```

Add `viewChild` to the `@angular/core` import list (alongside the existing imports), then inside the class:

```ts
  private readonly trigger = viewChild(MatMenuTrigger);

  /** Open the operator menu programmatically (used by the query-bar build flow). */
  open(): void {
    this.trigger()?.openMenu();
  }
```

The template already has `[matMenuTriggerFor]="menu"` on the trigger button, so `viewChild(MatMenuTrigger)` resolves to it � no template change needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/operator
git commit -m "feat(operator): expose open() to trigger the menu programmatically"
```

---

## Task 2: Inline build/edit state signals + emit-gated `updateFilter`

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts`
- Test: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append a new describe in the query-bar spec)

```ts
  describe('inline build/edit state', () => {
    it('starts with no building chip and no value-edit index', () => {
      expect(component.building()).toBeNull();
      expect(component.editingValueIndex()).toBeNull();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL � `component.building is not a function`.

- [ ] **Step 3: Add the state + emit flag**

In `query-bar.component.ts`, near the other signals, add the `BuildingChip` type (above the class) and the signals (inside the class):

```ts
interface BuildingChip {
  field: SdQueryField;
  operator?: Operator;
  step: 'operator' | 'value';
}
```

Inside the class (e.g. after `#editingOptions` related signals):

```ts
  /** The single in-progress inline chip (not yet in `filters`). */
  readonly #building = signal<BuildingChip | null>(null);
  readonly building = this.#building.asReadonly();

  /** Index of the completed chip whose value is being inline-edited (inline mode). */
  readonly #editingValueIndex = signal<number | null>(null);
  readonly editingValueIndex = this.#editingValueIndex.asReadonly();

  /** True when chip `i` is in inline value-edit mode. */
  isEditingValue(i: number): boolean {
    return this.#editingValueIndex() === i;
  }
```

Refactor `updateFilter` to make emission optional (so inline callers can skip `queryChange`):

```ts
  updateFilter(index: number, patch: Partial<Filter>, emit = true): void {
    const list = [...this.filters()];
    if (index < 0 || index >= list.length) return;
    list[index] = { ...list[index], ...patch } as Filter;
    this.filters.set(list);
    if (emit) this.#emitQuery();
  }
```

(Existing popover callers keep calling `updateFilter(i, patch)` � `emit` defaults to `true`, behavior unchanged.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "feat(query-bar): add inline build/edit state signals + emit-gated updateFilter"
```

---

## Task 3: `beginBuild(field)`

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts`
- Test: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing tests** (append to `describe('inline build/edit state')`)

```ts
    it('beginBuild on a multi-operator field starts at the operator step', () => {
      const field = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;
      component.beginBuild(field);
      expect(component.building()?.step).toBe('operator');
      expect(component.building()?.operator).toBeUndefined();
    });

    it('beginBuild on a single-operator field skips to the value step with the default operator', () => {
      const field = { key: 'name', label: 'Name', kind: 'string', operators: ['CONTAIN'] } as SdQueryField;
      component.beginBuild(field);
      expect(component.building()?.step).toBe('value');
      expect(component.building()?.operator).toBe('CONTAIN');
    });

    it('beginBuild with a single no-data operator finishes the chip immediately', () => {
      const field = { key: 'deleted', label: 'Deleted', kind: 'string', operators: ['NULL'] } as SdQueryField;
      component.beginBuild(field);
      expect(component.building()).toBeNull();
      expect(component.filters().length).toBe(1);
      expect(component.filters()[0].operator).toBe('NULL');
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL � `component.beginBuild is not a function`.

- [ ] **Step 3: Implement `beginBuild` + the shared finish helper**

Add these methods to `query-bar.component.ts` (inline-mode section). `#pushComplete` builds the `Filter`, reshaping data exactly like `setFilterOperator` does, and appends without emitting:

```ts
  /** Append a completed chip to `filters` WITHOUT emitting (inline mode commits on Search). */
  #pushComplete(field: SdQueryField, operator: Operator, value: unknown): void {
    let data: unknown = value;
    if (SD_QUERY_NO_DATA_OPERATORS.includes(operator)) data = null;
    else if (operator === 'BETWEEN') {
      if (!data || typeof data !== 'object') data = { from: null, to: null };
    } else if (SD_QUERY_MULTI_OPERATORS.includes(operator)) {
      data = Array.isArray(data) ? data : value == null ? [] : [value];
    }
    const next = { field: field.key as any, operator, data } as Filter;
    this.filters.set([...this.filters(), next]);
  }

  /** Entry point from the field picker � start building a chip for `field`. */
  beginBuild(field: SdQueryField): void {
    this.#editingValueIndex.set(null);
    const allowed = sdQueryAllowedOperators(field);
    if (allowed.length > 1) {
      this.#building.set({ field, step: 'operator' });
      return;
    }
    const operator = allowed[0] ?? sdQueryDefaultOperator(field);
    if (SD_QUERY_NO_DATA_OPERATORS.includes(operator)) {
      this.#pushComplete(field, operator, null);
      this.#building.set(null);
      return;
    }
    if (field.kind === 'values' || field.kind === 'lazy-values') this.#ensureOptions(field);
    this.#building.set({ field, operator, step: 'value' });
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar
git commit -m "feat(query-bar): beginBuild starts the inline chip build flow"
```

---

## Task 4: `pickBuildOperator(op)` + `commitBuildValue(value)` + `cancelBuild()`

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts`
- Test: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing tests** (append)

```ts
  describe('inline build steps', () => {
    const stringField = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;

    it('pickBuildOperator advances a data operator to the value step', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      expect(component.building()?.step).toBe('value');
      expect(component.building()?.operator).toBe('CONTAIN');
      expect(component.filters().length).toBe(0);
    });

    it('pickBuildOperator with a no-data operator finishes the chip immediately', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('NULL');
      expect(component.building()).toBeNull();
      expect(component.filters()[0].operator).toBe('NULL');
    });

    it('commitBuildValue pushes the completed chip and clears building', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      component.commitBuildValue('abc');
      expect(component.building()).toBeNull();
      expect(component.filters()).toEqual([
        jasmine.objectContaining({ field: 'name', operator: 'CONTAIN', data: 'abc' }),
      ]);
    });

    it('cancelBuild discards the in-progress chip', () => {
      component.beginBuild(stringField);
      component.cancelBuild();
      expect(component.building()).toBeNull();
      expect(component.filters().length).toBe(0);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL � `component.pickBuildOperator is not a function`.

- [ ] **Step 3: Implement the methods**

```ts
  /** Operator chosen during build � finish (no-data) or advance to the value step. */
  pickBuildOperator(op: Operator): void {
    const b = this.#building();
    if (!b) return;
    if (SD_QUERY_NO_DATA_OPERATORS.includes(op)) {
      this.#pushComplete(b.field, op, null);
      this.#building.set(null);
      return;
    }
    if (b.field.kind === 'values' || b.field.kind === 'lazy-values') this.#ensureOptions(b.field);
    this.#building.set({ ...b, operator: op, step: 'value' });
  }

  /** Value committed during build � push the completed chip, clear building. No emit. */
  commitBuildValue(value: unknown): void {
    const b = this.#building();
    if (!b || !b.operator) return;
    this.#pushComplete(b.field, b.operator, value);
    this.#building.set(null);
  }

  /** Abandon the in-progress chip. */
  cancelBuild(): void {
    this.#building.set(null);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar
git commit -m "feat(query-bar): pickBuildOperator + commitBuildValue + cancelBuild"
```

---

## Task 5: `beginEditValue(i)` / `commitEditValue(i, value)` + inline-aware `removeFilter`

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts`
- Test: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing tests** (append)

```ts
  describe('inline value editing + emit gating', () => {
    const stringField = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;

    function seedOneChip(): void {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      component.commitBuildValue('abc');
    }

    it('beginEditValue sets the editing index and cancels any build', () => {
      seedOneChip();
      component.beginEditValue(0);
      expect(component.editingValueIndex()).toBe(0);
      expect(component.building()).toBeNull();
    });

    it('commitEditValue changes only data, keeps operator/field, clears editing', () => {
      seedOneChip();
      component.beginEditValue(0);
      component.commitEditValue(0, 'xyz');
      expect(component.editingValueIndex()).toBeNull();
      expect(component.filters()[0]).toEqual(
        jasmine.objectContaining({ field: 'name', operator: 'CONTAIN', data: 'xyz' }),
      );
    });

    it('build / edit / remove do NOT emit queryChange; Search emits apply once', () => {
      const queryChange = jasmine.createSpy('queryChange');
      const apply = jasmine.createSpy('apply');
      component.queryChange.subscribe(queryChange);
      component.apply.subscribe(apply);
      fixture.componentRef.setInput('mode', 'inline');

      seedOneChip();
      component.beginEditValue(0);
      component.commitEditValue(0, 'xyz');
      expect(queryChange).not.toHaveBeenCalled();

      component.removeFilter(0);
      expect(queryChange).not.toHaveBeenCalled();

      component.triggerApply();
      expect(apply).toHaveBeenCalledTimes(1);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL � `component.beginEditValue is not a function` (and the emit-gating test fails because `removeFilter` currently emits).

- [ ] **Step 3: Implement edit methods + gate `removeFilter`**

Add:

```ts
  /** Start inline value edit on a completed chip (operator + field stay locked). */
  beginEditValue(i: number): void {
    if (i < 0 || i >= this.filters().length) return;
    this.#building.set(null);
    const field = this.fieldByKey()[(this.filters()[i] as any).field];
    if (field && (field.kind === 'values' || field.kind === 'lazy-values')) this.#ensureOptions(field);
    this.#editingValueIndex.set(i);
  }

  /** Commit an inline value edit � change only `data`, no emit. */
  commitEditValue(i: number, value: unknown): void {
    this.updateFilter(i, { data: value } as Partial<Filter>, false);
    this.#editingValueIndex.set(i === this.#editingValueIndex() ? null : this.#editingValueIndex());
  }
```

Update `removeFilter` to skip emit in inline mode (keep popover behavior). Replace its trailing `this.#emitQuery();`:

```ts
  removeFilter(index: number): void {
    const list = [...this.filters()];
    if (index < 0 || index >= list.length) return;
    if (this.editingIndex() === index) {
      this.chipTriggers()[index]?.closeMenu();
      this.editingIndex.set(null);
    }
    if (this.#editingValueIndex() === index) this.#editingValueIndex.set(null);
    list.splice(index, 1);
    this.filters.set(list);
    if (this.mode() !== 'inline') this.#emitQuery();
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar
git commit -m "feat(query-bar): inline value editing + emit gated to Search"
```

---

## Task 6: Inline template rewrite � flat chips + build chip + value editors

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html`
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts` (field picker now calls `beginBuild`)
- Test: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing DOM tests** (append)

```ts
  describe('inline DOM', () => {
    const stringField = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [stringField]);
    });

    it('renders a completed chip as a flat token (field text + operator icon + value text + remove)', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      component.commitBuildValue('abc');
      fixture.detectChanges();

      const chip = fixture.nativeElement.querySelector('.c-token');
      expect(chip).not.toBeNull();
      expect(chip.querySelector('.c-token-field')?.textContent).toContain('Name');
      expect(chip.querySelector('.c-token-op svg')).not.toBeNull();
      expect(chip.querySelector('.c-token-value')?.textContent).toContain('abc');
      expect(chip.querySelector('.c-token-remove')).not.toBeNull();
    });

    it('renders the building chip with the value editor at the value step', () => {
      component.beginBuild(stringField);
      component.pickBuildOperator('CONTAIN');
      fixture.detectChanges();

      const building = fixture.nativeElement.querySelector('.c-token-building');
      expect(building).not.toBeNull();
      expect(building.querySelector('sd-input')).not.toBeNull();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL � `.c-token` not found (old inline markup).

- [ ] **Step 3: Rewrite the inline block**

In `query-bar.component.html`, replace the entire inline branch (currently the `@for ... c-inline-filter ...` chips, the "Thêm filter" button, and the inline search button � from `@for (filter of _filters; track $index; let i = $index) {` down to the `</sd-button>` of `c-inline-search`, inside the `@if (mode() === 'inline')` block) with the markup below. Reuse the existing value-editor `@if (_field.kind ...)` ladder, but route its outputs to the build/edit commit methods. Define a reusable value-editor template `#valueEditor` to avoid duplicating the ladder between the building chip and the editing chip.

```html
  @if (mode() === 'inline') {
    <!-- ===== INLINE MODE (GitLab-style token builder) ===== -->

    <!-- Reusable value editor. ctx: field, data, isMulti, change (stash fn), enter (finalize fn), autoId
         why: text/number commit on Enter, so the typed value is stashed via `change` then finalized
         by `enter`; selection-style controls (select/date/boolean) stash + finalize in one action. -->
    <ng-template #valueEditor let-field="field" let-data="data" let-isMulti="isMulti" let-change="change" let-enter="enter" let-autoId="autoId">
      @if (field.kind === 'boolean') {
        <sd-button [autoId]="autoId + '-true'" [type]="data === true ? 'fill' : 'outline'" color="primary" [title]="$any(field).trueLabel || 'Có'" (click)="change(true); enter()"></sd-button>
        <sd-button [autoId]="autoId + '-false'" [type]="data === false ? 'fill' : 'outline'" color="primary" [title]="$any(field).falseLabel || 'Không'" (click)="change(false); enter()"></sd-button>
      } @else if (field.kind === 'values' || field.kind === 'lazy-values') {
        @let _opt = $any(field).option;
        <sd-select size="sm" [autoId]="autoId" [items]="optionsFor($any(field.key))" [valueField]="_opt.valueField" [displayField]="_opt.displayField" [multiple]="isMulti" [model]="data" (sdChange)="change($event); enter()"></sd-select>
      } @else if (field.kind === 'date') {
        <sd-date size="sm" [autoId]="autoId" [model]="data" (sdChange)="change($event); enter()"></sd-date>
      } @else if (field.kind === 'datetime') {
        <sd-datetime size="sm" [autoId]="autoId" [model]="data" (sdChange)="change($event); enter()"></sd-datetime>
      } @else if (field.kind === 'number') {
        <sd-input-number size="sm" [autoId]="autoId" [model]="data" (sdChange)="change($event)" (keyupEnter)="enter()"></sd-input-number>
      } @else {
        <sd-input size="sm" [autoId]="autoId" [model]="data" (sdChange)="change($event)" (keyupEnter)="enter()"></sd-input>
      }
    </ng-template>

    <!-- Completed chips -->
    @for (filter of _filters; track $index; let i = $index) {
      @if (_showOr && i > 0) {
        <span class="c-or-connector" aria-hidden="true">OR</span>
      }
      @let _field = fieldByKey()[$any(filter).field];
      @if (_field) {
        @let _op = $any(filter.operator);
        @let _data = $any(filter).data;
        <div class="c-token" [class.c-token-editing]="isEditingValue(i)">
          <span class="c-token-field">{{ _field.label }}</span>
          @if (!isNoDataOperator(_op)) {
            <sd-operator class="c-token-op" [operators]="[_op]" [model]="_op" [disabled]="true" />
          }
          @if (!isNoDataOperator(_op)) {
            @if (isEditingValue(i)) {
              <span class="c-token-value c-token-value-edit">
                <ng-container *ngTemplateOutlet="valueEditor; context: { field: _field, data: _data, isMulti: isMultiOperator(_op), change: setEditDraftFn(), enter: commitEditDraftFn(i), autoId: inlineAutoId(i, 'value') }"></ng-container>
              </span>
            } @else {
              <button type="button" class="c-token-value" (click)="beginEditValue(i)">{{ chipValueText(filter) }}</button>
            }
          }
          <button type="button" class="c-token-remove" aria-label="Remove filter" (click)="removeFilter(i)">
            <mat-icon fontSet="material-icons-outlined">close</mat-icon>
          </button>
        </div>
      }
    }

    <!-- Building chip (in-progress) -->
    @if (building(); as _b) {
      <div class="c-token c-token-building">
        <span class="c-token-field">{{ _b.field.label }}</span>
        @if (_b.step === 'operator') {
          <sd-operator #buildOperator class="c-token-op" [operators]="allowedOperatorsFor(_b.field)" [model]="_b.operator" (modelChange)="pickBuildOperator($any($event))" />
        } @else {
          <sd-operator class="c-token-op" [operators]="[_b.operator]" [model]="_b.operator" [disabled]="true" />
          <span class="c-token-value c-token-value-edit">
            <ng-container *ngTemplateOutlet="valueEditor; context: { field: _b.field, data: _b.value ?? null, isMulti: isMultiOperator($any(_b.operator)), change: setBuildDraftFn(), enter: commitBuildDraftFn(), autoId: 'qb-build-value' }"></ng-container>
          </span>
        }
        <button type="button" class="c-token-remove" aria-label="Cancel" (click)="cancelBuild()">
          <mat-icon fontSet="material-icons-outlined">close</mat-icon>
        </button>
      </div>
    }

    <!-- Add filter -->
    <button
      type="button"
      class="c-add-filter"
      [matMenuTriggerFor]="fieldPicker"
      [disabled]="_fields.length === 0 || _used.size >= _fields.length"
      [matTooltip]="_fields.length === 0 ? 'Chưa cấu hình fields' : 'Thêm filter'">
      <mat-icon fontSet="material-icons-outlined">add</mat-icon>
      <span>Thêm filter</span>
    </button>

    <!-- Search -->
    <sd-button
      class="c-inline-search"
      [autoId]="(autoIdInput() || 'qb') + '-search'"
      type="fill"
      color="primary"
      prefixIcon="search"
      title="Tìm kiếm"
      (click)="triggerApply()">
    </sd-button>
  } @else {
```

Then point the add-filter field picker at `beginBuild`. In the `#fieldPicker` menu (line ~403) change `(click)="addFilter(field)"` to `(click)="beginBuild(field)"`.

Add the draft signals + curried `change`/`enter` factories to `query-bar.component.ts`. The draft holds the typed value so Enter can finalize it; `BuildingChip` gains an optional `value` (updated on `change` so the editor re-renders with the typed text):

```ts
  /** Latest value typed/selected during inline value edit (chip already in `filters`). */
  readonly #editDraft = signal<unknown>(null);

  setEditDraftFn(): (v: unknown) => void {
    return (v: unknown) => this.#editDraft.set(v);
  }
  commitEditDraftFn(i: number): () => void {
    return () => this.commitEditValue(i, this.#editDraft());
  }

  setBuildDraftFn(): (v: unknown) => void {
    return (v: unknown) => {
      const b = this.#building();
      if (b) this.#building.set({ ...b, value: v });
    };
  }
  commitBuildDraftFn(): () => void {
    return () => {
      const b = this.#building();
      if (b) this.commitBuildValue(b.value);
    };
  }
```

Extend the `BuildingChip` interface (Task 2) with `value?: unknown` � update its declaration:

```ts
interface BuildingChip {
  field: SdQueryField;
  operator?: Operator;
  step: 'operator' | 'value';
  value?: unknown;
}
```

On entering the edit state, seed `#editDraft` with the current value. Update `beginEditValue` (Task 5) to also set the draft:

```ts
  beginEditValue(i: number): void {
    if (i < 0 || i >= this.filters().length) return;
    this.#building.set(null);
    const filter = this.filters()[i];
    const field = this.fieldByKey()[(filter as any).field];
    if (field && (field.kind === 'values' || field.kind === 'lazy-values')) this.#ensureOptions(field);
    this.#editDraft.set((filter as any).data ?? null);
    this.#editingValueIndex.set(i);
  }
```

> Note on BETWEEN: the `valueEditor` template above commits a single value; BETWEEN range editing keeps the existing two-input pattern. For this iteration, BETWEEN in inline mode is built/edited via the existing `setFilterRangeFrom/To` handlers � if a field's default/allowed operators include BETWEEN, render the two range inputs inside the `@else` of the value step instead of `#valueEditor`. Since the spec's display rule only requires `"from �  to"` text for completed BETWEEN chips (handled by `chipValueText`), and most inline fields are string/number/select, wire BETWEEN range inputs only if the configured fields use it. Keep `setFilterRangeFrom/To` available.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Auto-open operator menu + focus (afterNextRender)**

Add a `viewChild` for the build operator and open it when entering the operator step. In `query-bar.component.ts`:

```ts
  private readonly buildOperator = viewChild<SdOperator>('buildOperator');
```

In `beginBuild` (multi-operator branch) and after setting `step: 'operator'`, schedule the open:

```ts
      this.#building.set({ field, step: 'operator' });
      afterNextRender(() => this.buildOperator()?.open(), { injector: this.#injector });
      return;
```

- [ ] **Step 6: Run test again to confirm still green**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar
git commit -m "feat(query-bar): inline token-builder template (flat chips + build flow + inline value edit)"
```

---

## Task 7: Flat-token styling

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss`

- [ ] **Step 1: Replace inline-chip styles**

Remove the old `.c-inline-filter`, `.c-inline-field`, `.c-inline-operator`, `.c-inline-value`, `.c-inline-remove` rules (they framed each segment). Add flat-token rules. Use the existing `$qb-*` SCSS variables already defined at the top of the file (`$qb-primary`, `$qb-border`, `$qb-bg-soft`, `$qb-text`, `$qb-text-muted`).

```scss
  .c-token {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 6px 0 10px;
    border: 1px solid $qb-border;
    border-radius: 14px;
    background: $qb-bg-soft;
    font-size: 13px;
    color: $qb-text;
    white-space: nowrap;
  }

  .c-token-field { font-weight: 600; }

  .c-token-op {
    display: inline-flex;
    align-items: center;
    color: $qb-primary;
  }

  .c-token-value {
    border: none;
    background: transparent;
    padding: 0;
    font: inherit;
    color: $qb-text-muted;
    cursor: pointer;

    &:hover { color: $qb-text; text-decoration: underline; }
  }

  // Active editor (building value step / editing-value) � the only place borders show.
  .c-token-value-edit {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .c-token-building { border-style: dashed; }

  .c-token-remove {
    display: inline-flex;
    align-items: center;
    border: none;
    background: transparent;
    cursor: pointer;
    color: $qb-text-muted;
    padding: 2px;
    border-radius: 50%;

    mat-icon { font-size: 16px; width: 16px; height: 16px; }
    &:hover { background: rgba(0, 0, 0, 0.06); color: $qb-text; }
  }
```

> The control-skin in `query-bar.controls.scss` already scopes input/select borders; verify the completed chip's `c-token-value` (a plain `<button>`) has no border. The skin only applies to `sd-*` controls, which appear only in the edit/build value editor � exactly where borders are wanted.

- [ ] **Step 2: Build to verify styles compile**

Run: `npm run build`
Expected: query-bar entry point builds with no SCSS errors.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss
git commit -m "style(query-bar): flat token chips for inline mode"
```

---

## Task 8: Full build + combined sweep + cleanup check

**Files:** none (verification only)

- [ ] **Step 1: Confirm no dead inline code remains**

```bash
grep -rn "c-inline-filter\|c-inline-field\|c-inline-value\|c-inline-remove\|addFilter(" projects/sdcorejs-angular/components/query-bar/src
```

Expected: no references to the removed classes; `addFilter` only remains if popover still uses it � verify the popover branch. If `addFilter` is now unused (popover uses a different add path), remove it; otherwise leave it. `setFilterValue` / `setFilterOperator` / `setFilterRangeFrom` / `setFilterRangeTo` / `inlineAutoId` / `onInlineEnter` � check usage with grep and remove any now-orphaned by the template rewrite.

- [ ] **Step 2: Full lib build**

Run: `npm run build`
Expected: `Built Angular Package` with no errors.

- [ ] **Step 3: Combined targeted test run**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'
```

Expected: TOTAL all SUCCESS.

- [ ] **Step 4: Commit any cleanup**

```bash
git add -A
git commit -m "refactor(query-bar): remove dead inline-mode code after token rewrite"
```

---

## Self-Review notes

- **Spec coverage:** flat completed chip (Task 6 DOM + Task 7 style); build flow field� operator� value (Tasks 3,4,6); skip-operator single-op (Task 3); no-data immediate finish (Tasks 3,4); inline value-only edit (Task 5,6); emit only on Search (Tasks 2,5); multi/range display via `chipValueText` (reused; BETWEEN range editing noted in Task 6); auto-open operator menu (Task 1 `open()` + Task 6 Step 5). All spec sections mapped.
- **Type consistency:** `BuildingChip { field, operator?, step }`; `beginBuild(field)`, `pickBuildOperator(op: Operator)`, `commitBuildValue(value)`, `beginEditValue(i)`, `commitEditValue(i, value)`, `building()`, `editingValueIndex()`, `isEditingValue(i)`, `buildValueCommitFn()`, `editValueCommitFn(i)` � names consistent across tasks and template.
- **Reuse:** the `#valueEditor` template is shared by the building value step and the editing-value segment (DRY). `#pushComplete` centralizes data reshaping. `updateFilter(⬦, emit=false)` reused for no-emit edits.
- **Risk:** auto-open + focus rely on `afterNextRender`; if flaky in tests, the state-machine tests (Tasks 2�5) don't depend on DOM and stay green. `sd-input` commit uses `(keyupEnter)` (matches existing inline usage at the old line 296).
```

