�# query-bar Search trigger + compact value UI � Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make both query-bar modes defer the query to a single Search icon button (next to Clear-all; Enter in the search input also triggers; disabled when there are no filters and the search text is blank), and make inline value editing compact (text/number inline, values/date in a small popover).

**Architecture:** Drop live `#emitQuery()` from every mutation so editing only updates the `filters`/`logic`/`search` models; `triggerApply()` becomes the sole emitter (fires `queryChange` + `apply` once). Add a `canSearch` computed gating the new Search button. For inline value editing, split the value editor by kind: text/number stay inline (shrunk to token height), while values/lazy-values/date/datetime open a `#valuePopover` mat-menu holding the full control.

**Tech Stack:** Angular 19 standalone + signals (`computed`/`viewChild`/`afterNextRender`), Angular Material menu/tooltip, existing `sd-*` controls, Karma/Jasmine.

---

## Conventions

**Test command:** `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
**Lib typecheck:** `npm run build`

Branch `query-bar`. Commit per task. English commit messages; keep Vietnamese `// why:` comments.

## File Structure

- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts` � emit gating, `triggerApply`, `canSearch`, value-popover state.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html` � Search button, Enter handler, value-popover markup.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss` � Search button + compact value styling.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts` � emit/trigger + value-UI tests.

---

## Task 1: Defer all emits to `triggerApply` + `canSearch`

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts`
- Test: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing tests** (append a new describe)

```ts
  describe('deferred apply (single trigger)', () => {
    const field = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;

    it('canSearch is false when no filters and blank search; true otherwise', () => {
      expect(component.canSearch()).toBe(false);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: 'a' } as any]);
      expect(component.canSearch()).toBe(true);
      component.filters.set([]);
      component.search.set('  ');
      expect(component.canSearch()).toBe(false);
      component.search.set('hi');
      expect(component.canSearch()).toBe(true);
    });

    it('mutations do NOT emit queryChange or apply', () => {
      const queryChange = jasmine.createSpy('queryChange');
      const apply = jasmine.createSpy('apply');
      component.queryChange.subscribe(queryChange);
      component.apply.subscribe(apply);
      fixture.componentRef.setInput('fields', [field]);

      component.addFilter(field);
      component.setLogic('OR');
      component.removeFilter(0);
      component.clearAll();
      component.setSearch('x');

      expect(queryChange).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();
    });

    it('triggerApply emits queryChange AND apply exactly once', () => {
      const queryChange = jasmine.createSpy('queryChange');
      const apply = jasmine.createSpy('apply');
      component.queryChange.subscribe(queryChange);
      component.apply.subscribe(apply);

      component.triggerApply();

      expect(queryChange).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledTimes(1);
    });

    it('applyChipEdit commits the staged edit but does NOT emit', () => {
      fixture.componentRef.setInput('fields', [field]);
      fixture.componentRef.setInput('mode', 'popover');
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: 'old' } as any]);
      const apply = jasmine.createSpy('apply');
      const queryChange = jasmine.createSpy('queryChange');
      component.apply.subscribe(apply);
      component.queryChange.subscribe(queryChange);

      component.openChipPopover(0);
      component.editingValue.set('new');
      component.applyChipEdit();

      expect((component.filters()[0] as any).data).toBe('new');
      expect(apply).not.toHaveBeenCalled();
      expect(queryChange).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL � `component.canSearch is not a function`; emit assertions fail (mutations still emit).

- [ ] **Step 3: Remove every `#emitQuery()` from mutations, rewrite `triggerApply`, add `canSearch`**

In `query-bar.component.ts`:

(a) `addFilter` � delete the `this.#emitQuery();` line (line ~467). Keep the rest (filters.set + afterNextRender open).

(b) `changeFilterField` � delete `this.#emitQuery();` (line ~488).

(c) `updateFilter` � drop the emit param entirely:

```ts
  updateFilter(index: number, patch: Partial<Filter>): void {
    const list = [...this.filters()];
    if (index < 0 || index >= list.length) return;
    list[index] = { ...list[index], ...patch } as Filter;
    this.filters.set(list);
  }
```

And update its only caller `commitEditValue` to drop the `false` arg:

```ts
  commitEditValue(i: number, value: unknown): void {
    this.updateFilter(i, { data: value } as Partial<Filter>);
    this.#editingValueIndex.set(i === this.#editingValueIndex() ? null : this.#editingValueIndex());
  }
```

(d) `removeFilter` � delete the trailing `if (this.mode() !== 'inline') this.#emitQuery();` line entirely (keep the splice + filters.set + the editing-index cleanup above it).

(e) `clearAll` � delete `this.#emitQuery();` (line ~527).

(f) `setLogic` � delete `this.#emitQuery();` (line ~533).

(g) `setSearch` � delete `this.#emitQuery();` (line ~539). Keeps just the guard + `this.search.set(value)`.

(h) `applyChipEdit` � delete BOTH `this.#emitQuery();` and `this.apply.emit(this.#buildQuery());` (lines ~639-640). It now only commits + closes:

```ts
  applyChipEdit(): void {
    const idx = this.editingIndex();
    if (idx === null) return;
    const next: Filter = {
      field: (this.filters()[idx] as any).field,
      operator: this.editingOperator(),
      data: this.editingValue(),
    } as Filter;
    const list = [...this.filters()];
    list[idx] = next;
    this.filters.set(list);
    // why: deferred model � the global Search button is the only thing that runs the
    // query; Áp dụng just commits the staged edit into `filters` and closes the panel.
    this.chipTriggers()[idx]?.closeMenu();
    this.editingIndex.set(null);
  }
```

(i) `triggerApply` � emit both outputs once, and remove the now-unused `#emitQuery`:

```ts
  triggerApply(): void {
    // why: single deferred trigger � fire both the change notification and the reload
    // signal once, from here only (mutations no longer emit).
    const q = this.#buildQuery();
    this.queryChange.emit(q);
    this.apply.emit(q);
  }
```

Delete the `#emitQuery()` method (lines ~663-665) � no remaining callers.

(j) Add the `canSearch` computed near the other derived signals (e.g. after `showOrConnector`):

```ts
  /** Search button is actionable only when there is something to apply. */
  readonly canSearch = computed(() => this.filters().length > 0 || this.search().trim().length > 0);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "feat(query-bar): defer query to single triggerApply + add canSearch"
```

---

## Task 2: Search button in the action toolbar + Enter-to-search

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html`
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss`
- Test: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing DOM tests** (append)

```ts
  describe('search trigger button', () => {
    const field = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;

    it('renders the Search button disabled when no filters and blank search', () => {
      fixture.componentRef.setInput('fields', [field]);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.c-search-trigger') as HTMLButtonElement;
      expect(btn).not.toBeNull();
      expect(btn.disabled).toBe(true);
    });

    it('enables the Search button once a filter exists and fires apply on click', () => {
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: 'a' } as any]);
      fixture.detectChanges();
      const apply = jasmine.createSpy('apply');
      component.apply.subscribe(apply);

      const btn = fixture.nativeElement.querySelector('.c-search-trigger') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
      btn.click();

      expect(apply).toHaveBeenCalledTimes(1);
    });

    it('does not render the old inline search button', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [field]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.c-inline-search')).toBeNull();
    });

    it('pressing Enter in the free-text search input triggers apply', () => {
      fixture.componentRef.setInput('showSearch', true);
      fixture.detectChanges();
      const apply = jasmine.createSpy('apply');
      component.apply.subscribe(apply);

      const input = fixture.nativeElement.querySelector('.c-search-input') as HTMLInputElement;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(apply).toHaveBeenCalledTimes(1);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL � `.c-search-trigger` not found; old `.c-inline-search` still present.

- [ ] **Step 3: Update the template**

In `query-bar.component.html`:

(a) Add Enter handling to the free-text search input (the `<input class="c-search-input" ...>` around line 27):

```html
      <input
        class="c-search-input"
        type="text"
        [ngModel]="search()"
        (ngModelChange)="setSearch($event)"
        (keydown.enter)="triggerApply()"
        placeholder="Tìm kiếm..." />
```

(b) Remove the inline-only search button (the `<sd-button class="c-inline-search" ... (click)="triggerApply()">...</sd-button>` block, around lines 312-320). Delete it entirely.

(c) Make the action toolbar always render and add the Search button as the FIRST action (left of Clear-all). Replace the `@if (...) { <div class="c-query-bar__actions"> ... </div> }` wrapper condition so the wrapper is unconditional:

Replace:

```html
  @if ((showLogicToggle() && _filters.length >= 2) || showSavedViews() || (showClearAll() && _filters.length > 0)) {
    <div class="c-query-bar__actions">
```

with:

```html
    <div class="c-query-bar__actions">
      <!-- Search � the single deferred trigger for both modes -->
      <button
        type="button"
        class="c-search-trigger"
        [disabled]="!canSearch()"
        matTooltip="Tìm kiếm"
        (click)="triggerApply()">
        <mat-icon fontSet="material-icons-outlined">search</mat-icon>
      </button>
```

and remove the matching closing-brace `}` of that old `@if` (the `}` right after the `</div>` that closes `c-query-bar__actions`, around line 450). The `</div>` stays; only the wrapping `@if (...) {` and its `}` are removed. The inner logic-toggle / saved-views / clear-all `@if` blocks stay unchanged.

- [ ] **Step 4: Add styling**

In `query-bar.component.scss`, add a `.c-search-trigger` rule mirroring `.c-clear-all`. Find the `.c-clear-all` rule and add alongside it (use existing `$qb-*` vars):

```scss
  .c-search-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    color: $qb-primary;

    mat-icon { font-size: 18px; width: 18px; height: 18px; }
    &:hover:not([disabled]) { background: $qb-bg-soft; }
    &[disabled] { color: $qb-text-muted; opacity: 0.5; cursor: not-allowed; }
  }
```

(Place this inside the same selector scope as `.c-clear-all` � i.e. as a sibling rule in the file, matching how `.c-clear-all` is nested.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "feat(query-bar): single Search action button + Enter-to-search; drop inline search button"
```

---

## Task 3: Compact inline value editing (inline vs popover by kind)

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts`
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html`
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss`
- Test: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing DOM tests** (append)

```ts
  describe('compact inline value editing', () => {
    const textField = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;
    const valuesField = {
      key: 'status', label: 'Status', kind: 'values', operators: ['IN'],
      option: { items: [{ id: 'a', name: 'A' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [textField, valuesField]);
    });

    it('text field uses an inline sd-input at the build value step (no value popover)', () => {
      component.beginBuild(textField);
      component.pickBuildOperator('CONTAIN');
      fixture.detectChanges();

      const building = fixture.nativeElement.querySelector('.c-token-building');
      expect(building.querySelector('sd-input')).not.toBeNull();
      expect(building.querySelector('[matMenuTriggerFor]')).toBeNull();
    });

    it('uses the value popover (mat-menu trigger) for a values field at the build value step', () => {
      component.beginBuild(valuesField); // single op IN �  straight to value step
      fixture.detectChanges();

      const building = fixture.nativeElement.querySelector('.c-token-building');
      // values kind renders a popover trigger, not an inline sd-select
      expect(building.querySelector('.c-token-value-trigger')).not.toBeNull();
      expect(building.querySelector('sd-select')).toBeNull();
    });

    it('usesValuePopover reflects the kind split', () => {
      expect(component.usesValuePopover('string')).toBe(false);
      expect(component.usesValuePopover('number')).toBe(false);
      expect(component.usesValuePopover('boolean')).toBe(false);
      expect(component.usesValuePopover('values')).toBe(true);
      expect(component.usesValuePopover('lazy-values')).toBe(true);
      expect(component.usesValuePopover('date')).toBe(true);
      expect(component.usesValuePopover('datetime')).toBe(true);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL � `component.usesValuePopover is not a function`; `.c-token-value-trigger` not found.

- [ ] **Step 3: Add the kind split + value-popover state (TS)**

In `query-bar.component.ts`:

```ts
  /** Kinds whose value control is too tall for the inline token �  edit in a popover. */
  usesValuePopover(kind: SdQueryFieldKind): boolean {
    return kind === 'values' || kind === 'lazy-values' || kind === 'date' || kind === 'datetime';
  }
```

Import `SdQueryFieldKind` from `./query-bar.model` (add it to the existing import block).

Add value-popover context state + open/commit helpers:

```ts
  /** Context for the shared value popover (which chip/build is being edited). */
  readonly #valueCtx = signal<{ mode: 'build' | 'edit'; index: number; field: SdQueryField } | null>(null);
  readonly valueCtx = this.#valueCtx.asReadonly();

  /** Open the value popover for an existing chip (edit) � seeds the edit draft. */
  openEditValuePopover(i: number, field: SdQueryField): void {
    this.beginEditValue(i); // seeds #editDraft + #editingValueIndex, ensures options
    this.#valueCtx.set({ mode: 'edit', index: i, field });
  }

  /** Commit from the value popover then clear context. */
  commitValuePopover(value: unknown): void {
    const ctx = this.#valueCtx();
    if (!ctx) return;
    if (ctx.mode === 'edit') this.commitEditValue(ctx.index, value);
    else this.commitBuildValue(value);
    this.#valueCtx.set(null);
  }
```

- [ ] **Step 4: Update the template � split inline vs popover by kind**

In `query-bar.component.html`, the completed-chip value segment and the building value step currently always use `#valueEditor`. Gate them on `usesValuePopover(kind)`.

(a) **Completed chip value segment** � replace the editing/else block (the `@if (isEditingValue(i)) { ... } @else { <button ... beginEditValue(i)>text</button> }`) with:

```html
            @if (usesValuePopover(_field.kind)) {
              <button
                type="button"
                class="c-token-value c-token-value-trigger"
                [matMenuTriggerFor]="valuePopover"
                [matMenuTriggerData]="{ mode: 'edit', index: i, field: _field }"
                (menuOpened)="openEditValuePopover(i, _field)">
                {{ chipValueText(filter) }}
              </button>
            } @else if (isEditingValue(i)) {
              <span class="c-token-value c-token-value-edit">
                <ng-container *ngTemplateOutlet="valueEditor; context: { field: _field, data: _data, isMulti: isMultiOperator(_op), change: setEditDraftFn(), enter: commitEditDraftFn(i), autoId: inlineAutoId(i, 'value') }"></ng-container>
              </span>
            } @else {
              <button type="button" class="c-token-value" (click)="beginEditValue(i)">{{ chipValueText(filter) }}</button>
            }
```

(b) **Building value step** � replace the value-step `<span class="c-token-value c-token-value-edit"><ng-container *ngTemplateOutlet="valueEditor; ...building..."></span>` with a kind split:

```html
          @if (usesValuePopover(_b.field.kind)) {
            <button
              #buildValueTrigger="matMenuTrigger"
              type="button"
              class="c-token-value c-token-value-trigger"
              [matMenuTriggerFor]="valuePopover"
              [matMenuTriggerData]="{ mode: 'build', index: -1, field: _b.field }">
              {{ _b.value == null ? 'Chọn⬦' : chipValueText($any({ field: _b.field.key, operator: _b.operator, data: _b.value })) }}
            </button>
          } @else {
            <span class="c-token-value c-token-value-edit">
              <ng-container *ngTemplateOutlet="valueEditor; context: { field: _b.field, data: _b.value ?? null, isMulti: isMultiOperator($any(_b.operator)), change: setBuildDraftFn(), enter: commitBuildDraftFn(), autoId: 'qb-build-value' }"></ng-container>
            </span>
          }
```

> Note: `chipValueText` takes a `Filter`. To render the building preview text, call it with `$any({ field: _b.field.key, operator: _b.operator, data: _b.value })`. Use `$any(...)` directly in the template (no custom pipe): replace the `{{ chipValueText(...) | sdAny }}` line with `{{ _b.value == null ? 'Chọn⬦' : chipValueText($any({ field: _b.field.key, operator: _b.operator, data: _b.value })) }}`.

(c) **Add the shared value popover** `<mat-menu>` once, near the other menus (after `#fieldPicker`). It renders the full control by kind, wired to `commitValuePopover`:

```html
  <mat-menu #valuePopover="matMenu" class="c-value-popover" xPosition="after" yPosition="below">
    <ng-template matMenuContent let-field="field">
      <div class="c-value-popover-body" (click)="$event.stopPropagation()">
        @if (field.kind === 'values' || field.kind === 'lazy-values') {
          @let _opt = $any(field).option;
          <sd-select size="sm"
            [autoId]="'qb-valpop'"
            [items]="optionsFor($any(field.key))"
            [valueField]="_opt.valueField"
            [displayField]="_opt.displayField"
            [multiple]="valuePopoverMulti()"
            (sdChange)="commitValuePopover($event)">
          </sd-select>
        } @else if (field.kind === 'date') {
          <sd-date size="sm" [autoId]="'qb-valpop'" (sdChange)="commitValuePopover($event)"></sd-date>
        } @else if (field.kind === 'datetime') {
          <sd-datetime size="sm" [autoId]="'qb-valpop'" (sdChange)="commitValuePopover($event)"></sd-datetime>
        }
      </div>
    </ng-template>
  </mat-menu>
```

> Simplify the `[multiple]` binding: do NOT use a pipe. Compute multi from the popover context's filter operator via a helper. Add to the component:
> ```ts
>   /** Is the value popover's target operator a multi (IN/NOT_IN) one? */
>   valuePopoverMulti(): boolean {
>     const ctx = this.#valueCtx();
>     if (!ctx) return false;
>     const op = ctx.mode === 'edit'
>       ? ((this.filters()[ctx.index] as any)?.operator as Operator)
>       : (this.building()?.operator as Operator);
>     return this.isMultiOperator(op);
>   }
> ```
> and bind `[multiple]="valuePopoverMulti()"`.

(d) **Auto-open the build value popover** for popover-kinds. Add a viewChild + open-on-render. In `beginBuild` / `pickBuildOperator`, after setting `step: 'value'` for a popover-kind, schedule the open. Add:

```ts
  private readonly buildValueTrigger = viewChild<MatMenuTrigger>('buildValueTrigger');
```

and where the build enters the value step (in `beginBuild`'s single-op value branch and at the end of `pickBuildOperator`'s value branch), add:

```ts
    if (this.usesValuePopover(field.kind)) {
      afterNextRender(() => this.buildValueTrigger()?.openMenu(), { injector: this.#injector });
    }
```

(In `pickBuildOperator` use `b.field.kind`.) `MatMenuTrigger` is already imported.

- [ ] **Step 5: Styling � compact inline controls + popover panel**

In `query-bar.component.scss`, under the inline token rules, constrain inline editors and add the popover body:

```scss
  // Inline text/number editor sits flush in the token � small + no extra frame.
  .c-token-value-edit {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 160px;

    sd-input, sd-input-number { display: inline-flex; max-width: 140px; }
  }

  .c-token-value-trigger {
    border: none;
    background: transparent;
    font: inherit;
    color: $qb-text-muted;
    cursor: pointer;
    &:hover { color: $qb-text; text-decoration: underline; }
  }
}

// Value popover panel � minimal, just the full control.
.c-value-popover .c-value-popover-body {
  padding: 10px;
  min-width: 200px;
}
```

> Place the first two rules inside the same `.c-query-bar` / token scope as the existing `.c-token-*` rules; place `.c-value-popover` at the top level (mat-menu panels render in an overlay, outside `:host`). If the file scopes token rules under a parent selector, match that nesting.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar
git commit -m "feat(query-bar): compact inline value editing � inline text/number, popover for values/date"
```

---

## Task 4: Build + combined sweep

**Files:** none (verification only)

- [ ] **Step 1: Full lib build**

Run: `npm run build`
Expected: `Built Angular Package`, no errors.

- [ ] **Step 2: Combined targeted test run**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.spec.ts'
```

Expected: TOTAL all SUCCESS.

- [ ] **Step 3: Commit any fixups**

```bash
git add -A
git commit -m "test(query-bar): green build + sweep for search-trigger + value-ui"
```

---

## Self-Review notes

- **Spec coverage:** deferred single trigger + no live emit (Task 1); Search button placement/disabled/Enter (Task 2); compact text/number inline + values/date popover + build auto-open (Task 3); build+sweep (Task 4). All spec sections mapped. BETWEEN explicitly out of scope (unchanged).
- **Type consistency:** `canSearch()`, `triggerApply()` (emits queryChange+apply), `usesValuePopover(kind: SdQueryFieldKind)`, `valueCtx()`, `openEditValuePopover(i, field)`, `commitValuePopover(value)`, `valuePopoverMulti()`, `buildValueTrigger` viewChild � consistent across TS + template.
- **No-pipe rule:** the template uses `$any(...)` and component helpers (`valuePopoverMulti`) instead of inventing pipes (`sdAny`/`sdFilterOp` mentioned only as a thing to AVOID � Step 4 notes replace them with `$any` + helper).
- **Risk:** the value popover commits on the control's `sdChange`; for `sd-select multiple` that fires per selection � acceptable (each change commits the array). Auto-open relies on `afterNextRender` + `MatMenuTrigger` viewChild; if the build value trigger isn't found (kind mismatch), open is a no-op.
```

