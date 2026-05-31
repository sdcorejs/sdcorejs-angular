�# query-bar popover compact + Search placement + inline value panels � Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compact the chip popover (operator on the header row, no section labels, no Áp dụng button, auto-apply on close), move the Search button to the far-right with a neutral style, and make inline value editing show selection panels directly (custom option list for values, `mat-calendar` for date) instead of nested dropdowns.

**Architecture:** Pure query-bar component changes (TS + HTML + SCSS), TDD. Popover-mode auto-apply reuses the existing staged-edit commit but moves it to `(menuClosed)` with no emit (Search stays the sole query trigger). Inline value panels replace the collapsed `sd-select`/`sd-date` inside the existing `#valuePopover` mat-menu with a direct option list / `mat-calendar`, committing through the existing `commitValuePopover` plumbing; the active trigger is captured on open so single-select/date can close programmatically.

**Tech Stack:** Angular 19 standalone + signals, Angular Material menu/datepicker (`MatCalendar`), existing `sd-*` + `sd-operator`, Karma/Jasmine.

---

## Conventions

**Test command:** `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
**Lib typecheck:** `npm run build`

Branch `query-bar`. Commit per task. English commit messages; keep Vietnamese `// why:` comments.

## File Structure

- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts` � popover close commit, value-panel state/helpers, `MatDatepickerModule` import.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html` � popover header/body/footer, Search button position, value popover content.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss` � header/operator, neutral search button, option-list + calendar styling.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts` � tests.

---

## Task 1: Popover auto-apply on close

**Files:** `query-bar.component.ts`, `query-bar.component.html`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
  describe('popover auto-apply on close', () => {
    const field = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;

    it('committing on close writes staged operator+value into the chip without emitting', () => {
      fixture.componentRef.setInput('mode', 'popover');
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: 'old' } as any]);
      const apply = jasmine.createSpy('apply');
      const queryChange = jasmine.createSpy('queryChange');
      component.apply.subscribe(apply);
      component.queryChange.subscribe(queryChange);

      component.openChipPopover(0);
      component.onEditingOperatorChange('EQUAL');
      component.editingValue.set('new');
      component.commitChipEditOnClose();

      expect(component.filters()[0]).toEqual(
        jasmine.objectContaining({ field: 'name', operator: 'EQUAL', data: 'new' }),
      );
      expect(component.editingIndex()).toBeNull();
      expect(apply).not.toHaveBeenCalled();
      expect(queryChange).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL � `component.commitChipEditOnClose is not a function`.

- [ ] **Step 3: Implement**

In `query-bar.component.ts`, add `commitChipEditOnClose` (do NOT delete `applyChipEdit` yet � the footer button still calls it until Task 2 removes the footer):

```ts
  /**
   * Commit the staged operator + value into the chip when the popover closes.
   * why: the Áp dụng button is gone � closing the popover (out-focus) auto-applies the
   * staged edit. No emit: the global Search button remains the only query trigger.
   */
  commitChipEditOnClose(): void {
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
    this.editingIndex.set(null);
  }
```

Delete the old `cancelChipEdit()` method (it was only used by the old `(menuClosed)` binding, which this task repoints).

In `query-bar.component.html`, change the chip trigger's close binding (line ~351):

```html
        (menuClosed)="commitChipEditOnClose()">
```

- [ ] **Step 4: Run test to verify it passes**

Run the query-bar spec. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "feat(query-bar): popover auto-applies staged edit on close (no Áp dụng button)"
```

---

## Task 2: Popover layout � operator in header, no labels, no footer, placeholders

**Files:** `query-bar.component.html`, `query-bar.component.scss`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing DOM tests** (append)

```ts
  describe('compact popover layout', () => {
    const field = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;

    function openPopoverDom() {
      fixture.componentRef.setInput('mode', 'popover');
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: '' } as any]);
      fixture.detectChanges();
      const chip = fixture.nativeElement.querySelector('.c-chip') as HTMLButtonElement;
      chip.click();
      fixture.detectChanges();
      return TestBed.inject(OverlayContainer).getContainerElement();
    }

    it('renders the operator inside the header and drops section labels + footer', () => {
      const panel = openPopoverDom();
      expect(panel.querySelector('.c-pop-header sd-operator')).not.toBeNull();
      expect(panel.querySelector('.c-pop-section-label')).toBeNull();
      expect(panel.querySelector('.c-pop-footer')).toBeNull();
      panel.remove();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL � operator not in `.c-pop-header`, section labels / footer still present.

- [ ] **Step 3: Rewrite the popover header + body + footer**

In `query-bar.component.html`, replace the header block (lines ~75-87) with one that includes the operator on the right:

```html
        <div class="c-pop-header" (click)="$event.stopPropagation()">
          <mat-icon fontSet="material-icons-outlined">{{ iconFor(_editField) }}</mat-icon>
          <button
            type="button"
            class="c-pop-header-field"
            [matMenuTriggerFor]="fieldSwitchPicker"
            [matMenuTriggerData]="{ currentIndex: index }"
            matTooltip="Đ�"i field">
            <span>{{ _editField.label }}</span>
            <mat-icon fontSet="material-icons-outlined">unfold_more</mat-icon>
          </button>
          @if (editingShowOperatorSelector()) {
            <sd-operator
              class="c-pop-header-operator"
              [autoId]="chipAutoId('operator')"
              [operators]="editingAllowedOperators()"
              [model]="_editOp"
              (modelChange)="onEditingOperatorChange($any($event))" />
          }
        </div>
```

In the body, delete the operator block + both `c-pop-section-label` rows. Replace the body open (lines ~89-106, from `<div class="c-pop-body" ...>` through the removed `Giá tr�9` label) so the body starts directly with the value `@if`:

```html
        <div class="c-pop-body" (click)="$event.stopPropagation()">
          <!-- Value � per-kind sd-* control, skipped for NULL / NOT_NULL. Placeholder
               makes the field self-explanatory now that section labels are gone. -->
          @if (!isNoDataOperator(_editOp)) {
            @if (_editOp === 'BETWEEN') {
```

(The `@if (_editOp === 'BETWEEN')` and the rest of the value ladder stay; just remove the wrapping `<div>` + `<div class="c-pop-section-label">Giá tr�9</div>` that previously sat between `c-pop-body` and the value `@if`. Ensure the closing `}` / `</div>` count stays balanced � the value ladder's outer `@if (!isNoDataOperator(_editOp))` now wraps the kind branches directly.)

Add placeholders to the single-value controls in that ladder:
- `sd-select` (values/lazy-values, line ~174): add `placeholder="Chọn giá tr�9"`.
- `sd-date` (line ~187): add `placeholder="Chọn giá tr�9"`.
- `sd-datetime` (line ~193): add `placeholder="Chọn giá tr�9"`.
- `sd-input-number` (line ~199): add `placeholder="Nhập giá tr�9"`.
- `sd-input` (line ~205): add `placeholder="Nhập giá tr�9"`.
(BETWEEN keeps its `Từ`/`Đến`; boolean unchanged.)

Delete the footer block entirely (lines ~215-224):

```html
        <div class="c-pop-footer">
          <sd-button ... title="Áp dụng" ... (click)="applyChipEdit()"></sd-button>
        </div>
```

Now that nothing references it, delete the `applyChipEdit()` method from `query-bar.component.ts` (its commit logic lives in `commitChipEditOnClose` from Task 1). Grep `applyChipEdit` to confirm zero remaining references before removing.

- [ ] **Step 4: Add header styling**

In `query-bar.component.scss`, find the `.c-pop-header` rule and ensure it is a centered flex row + push the operator right. Add/replace:

```scss
.c-pop-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .c-pop-header-operator { margin-left: auto; }
}
```

(If a `.c-pop-header` rule already exists, merge these declarations into it rather than duplicating.)

- [ ] **Step 5: Run test to verify it passes**

Run the query-bar spec. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "feat(query-bar): compact popover � operator in header, no labels/footer, value placeholders"
```

---

## Task 3: Search button � far right + neutral style

**Files:** `query-bar.component.html`, `query-bar.component.scss`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
  describe('search button placement', () => {
    const field = { key: 'name', label: 'Name', kind: 'string', operators: true } as SdQueryField;

    it('is the last child of the action toolbar (after clear-all)', () => {
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: 'name', operator: 'CONTAIN', data: 'a' } as any]);
      fixture.detectChanges();

      const actions = fixture.nativeElement.querySelector('.c-query-bar__actions');
      const buttons = actions.querySelectorAll(':scope > button');
      const last = buttons[buttons.length - 1] as HTMLElement;
      expect(last.classList).toContain('c-search-trigger');
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL � search-trigger is the first child, not last.

- [ ] **Step 3: Move the button + restyle**

In `query-bar.component.html`, move the Search `<button class="c-search-trigger">` block from the top of `.c-query-bar__actions` to be the **last** element inside that div (after the Clear-all `@if` block, before the closing `</div>` at line ~493).

In `query-bar.component.scss`, restyle `.c-search-trigger` to match the neutral Clear-all look (bordered, dark, density-sized) � replace the primary-tinted rule:

```scss
.c-search-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $qb-border;
  border-radius: $qb-radius-input;
  background: $qb-bg;
  color: $qb-text-secondary;
  cursor: pointer;
  padding: 0;

  .c-density-compact & { width: 28px; height: 28px; }
  .c-density-comfortable & { width: 32px; height: 32px; }

  mat-icon { font-size: 18px; width: 18px; height: 18px; }

  &:hover:not([disabled]) { border-color: $qb-primary; color: $qb-primary; }
  &[disabled] { opacity: 0.5; cursor: not-allowed; }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run the query-bar spec. Expected: PASS (the earlier `search trigger button` tests still pass � disabled state + click still wired).

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "feat(query-bar): move Search button to far right, neutral style"
```

---

## Task 4: Inline value panel state + helpers (option list, calendar, close commit)

**Files:** `query-bar.component.ts`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing tests** (append)

```ts
  describe('inline value panel helpers', () => {
    const valuesField = {
      key: 'status', label: 'Status', kind: 'values', operators: ['IN'],
      option: { items: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      // load options into the cache
      component.allowedOperatorsFor(valuesField);
      component.beginBuild(valuesField);
      component.openBuildValuePopover(valuesField, null);
    });

    it('valuePopoverOptions filters by search (case-insensitive), all when blank', () => {
      expect(component.valuePopoverOptions().length).toBe(2);
      component.setValuePopoverSearch('be');
      expect(component.valuePopoverOptions().map((o: any) => o.id)).toEqual(['b']);
      component.setValuePopoverSearch('');
      expect(component.valuePopoverOptions().length).toBe(2);
    });

    it('toggleValueOption builds the array draft (multi) without committing; close commits it', () => {
      component.toggleValueOption({ id: 'a', name: 'Alpha' });
      component.toggleValueOption({ id: 'b', name: 'Beta' });
      expect(component.filters().length).toBe(0); // not committed yet
      expect(component.isOptionSelected({ id: 'a', name: 'Alpha' })).toBe(true);

      component.onValuePopoverClosed();
      expect(component.filters()).toEqual([
        jasmine.objectContaining({ field: 'status', operator: 'IN', data: ['a', 'b'] }),
      ]);
    });

    it('pickValueOption commits a single value immediately', () => {
      // single-operator scenario: rebuild with a non-multi op
      const single = { ...valuesField, operators: ['EQUAL'] } as unknown as SdQueryField;
      fixture.componentRef.setInput('fields', [single]);
      component.beginBuild(single);
      component.openBuildValuePopover(single, null);
      component.pickValueOption({ id: 'a', name: 'Alpha' });
      expect(component.filters()).toEqual([
        jasmine.objectContaining({ field: 'status', operator: 'EQUAL', data: 'a' }),
      ]);
    });
  });
```

> The build option-cache: `beginBuild` already calls `#ensureOptions` for values fields, so `optionsFor('status')` returns the configured items synchronously (array `items`).

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL � `valuePopoverOptions`/`toggleValueOption`/etc. not functions; `openBuildValuePopover` arity differs.

- [ ] **Step 3: Implement the state + helpers**

In `query-bar.component.ts`:

Add `MatMenuTrigger` is already imported. Add the search signal + accessor near `#valueCtx`:

```ts
  /** Client-side search term for the active value popover's option list. */
  readonly #valuePopoverSearch = signal('');
  readonly valuePopoverSearch = this.#valuePopoverSearch.asReadonly();
  setValuePopoverSearch(v: string): void { this.#valuePopoverSearch.set(v); }

  /** The trigger that opened the value popover � lets single-select/date close it. */
  #activeValueTrigger: MatMenuTrigger | null = null;
```

Extend the two open handlers to capture the trigger + reset search:

```ts
  openEditValuePopover(i: number, field: SdQueryField, trigger: MatMenuTrigger | null): void {
    this.beginEditValue(i);
    this.#valuePopoverSearch.set('');
    this.#activeValueTrigger = trigger;
    this.#valueCtx.set({ mode: 'edit', index: i, field });
  }

  openBuildValuePopover(field: SdQueryField, trigger: MatMenuTrigger | null): void {
    this.#valuePopoverSearch.set('');
    this.#activeValueTrigger = trigger;
    this.#valueCtx.set({ mode: 'build', index: -1, field });
  }
```

Add the draft + option helpers:

```ts
  /** Current uncommitted value for the active popover (edit draft or building value). */
  currentDraftValue(): unknown {
    const ctx = this.#valueCtx();
    if (!ctx) return null;
    return ctx.mode === 'edit' ? this.#editDraft() : this.building()?.value ?? null;
  }

  /** Active field's options filtered by the search term. */
  valuePopoverOptions(): any[] {
    const ctx = this.#valueCtx();
    if (!ctx) return EMPTY_ARRAY;
    const all = this.optionsFor(ctx.field.key as string);
    const q = this.#valuePopoverSearch().trim().toLowerCase();
    if (!q) return all;
    const df = (ctx.field as any).option?.displayField as string;
    return all.filter((o) => String(o?.[df] ?? '').toLowerCase().includes(q));
  }

  isOptionSelected(opt: any): boolean {
    const ctx = this.#valueCtx();
    if (!ctx) return false;
    const vf = (ctx.field as any).option?.valueField as string;
    const v = opt?.[vf];
    const draft = this.currentDraftValue();
    return this.valuePopoverMulti() ? Array.isArray(draft) && draft.includes(v) : draft === v;
  }

  /** Single select: commit one value + close the popover. */
  pickValueOption(opt: any): void {
    const ctx = this.#valueCtx();
    if (!ctx) return;
    const vf = (ctx.field as any).option?.valueField as string;
    this.commitValuePopover(opt?.[vf]);
    this.#activeValueTrigger?.closeMenu();
  }

  /** Multi select: toggle the value into/out of the draft (no commit until close). */
  toggleValueOption(opt: any): void {
    const ctx = this.#valueCtx();
    if (!ctx) return;
    const vf = (ctx.field as any).option?.valueField as string;
    const v = opt?.[vf];
    const draft = this.currentDraftValue();
    const arr = Array.isArray(draft) ? [...draft] : [];
    const at = arr.indexOf(v);
    if (at >= 0) arr.splice(at, 1); else arr.push(v);
    if (ctx.mode === 'edit') this.#editDraft.set(arr);
    else { const b = this.#building(); if (b) this.#building.set({ ...b, value: arr }); }
  }

  /** Date panel select: commit + close. */
  commitValuePopoverDate(d: Date): void {
    this.commitValuePopover(d);
    this.#activeValueTrigger?.closeMenu();
  }

  /** On popover close: multi rows only updated the draft � commit it now. Single/date
   *  already committed (ctx cleared), so this is a no-op for them. Always reset search. */
  onValuePopoverClosed(): void {
    const ctx = this.#valueCtx();
    if (ctx && this.valuePopoverMulti()) this.commitValuePopover(this.currentDraftValue());
    this.#valueCtx.set(null);
    this.#valuePopoverSearch.set('');
    this.#activeValueTrigger = null;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run the query-bar spec. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "feat(query-bar): inline value-panel helpers (option list, multi toggle, close commit)"
```

---

## Task 5: Inline value popover template � option list + calendar, styling, build sweep

**Files:** `query-bar.component.ts`, `query-bar.component.html`, `query-bar.component.scss`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing DOM tests** (append)

```ts
  describe('inline value panel DOM', () => {
    const valuesField = {
      key: 'status', label: 'Status', kind: 'values', operators: ['IN'],
      option: { items: [{ id: 'a', name: 'Alpha' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    const dateField = { key: 'created', label: 'Created', kind: 'date', operators: ['EQUAL'] } as unknown as SdQueryField;

    function openValuePopover(): HTMLElement {
      fixture.detectChanges();
      const trigger = fixture.nativeElement.querySelector('.c-token-building .c-token-value-trigger') as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      return TestBed.inject(OverlayContainer).getContainerElement();
    }

    it('values field shows a custom option list + search (no sd-select)', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      component.beginBuild(valuesField);
      const panel = openValuePopover();
      expect(panel.querySelector('.c-valpop-search')).not.toBeNull();
      expect(panel.querySelector('.c-valpop-row')).not.toBeNull();
      expect(panel.querySelector('sd-select')).toBeNull();
      panel.remove();
    });

    it('date field shows a mat-calendar (no sd-date)', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dateField]);
      component.beginBuild(dateField);
      const panel = openValuePopover();
      expect(panel.querySelector('mat-calendar')).not.toBeNull();
      expect(panel.querySelector('sd-date')).toBeNull();
      panel.remove();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL � popover still renders `sd-select` / `sd-date`.

- [ ] **Step 3: Import MatDatepickerModule**

In `query-bar.component.ts`, add the import and register it:

```ts
import { MatDatepickerModule } from '@angular/material/datepicker';
```

Add `MatDatepickerModule` to the component `imports` array (alongside `MatMenuModule`).

- [ ] **Step 4: Rewrite the value popover content + capture triggers**

In `query-bar.component.html`, replace the `#valuePopover` mat-menu (lines ~422-442) with:

```html
  <mat-menu #valuePopover="matMenu" class="c-value-popover" xPosition="after" yPosition="below" (closed)="onValuePopoverClosed()">
    <ng-template matMenuContent let-field="field">
      <div class="c-value-popover-body" (click)="$event.stopPropagation()">
        @if (field.kind === 'values' || field.kind === 'lazy-values') {
          @let _opt = $any(field).option;
          <input
            class="c-valpop-search"
            type="text"
            [ngModel]="valuePopoverSearch()"
            (ngModelChange)="setValuePopoverSearch($event)"
            placeholder="Tìm..." />
          <div class="c-valpop-list">
            @for (o of valuePopoverOptions(); track $any(o)[_opt.valueField]) {
              <button
                type="button"
                class="c-valpop-row"
                [class.c-valpop-selected]="isOptionSelected(o)"
                (click)="valuePopoverMulti() ? toggleValueOption(o) : pickValueOption(o)">
                @if (valuePopoverMulti()) {
                  <mat-icon fontSet="material-icons-outlined">{{ isOptionSelected(o) ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
                }
                <span class="c-valpop-label">{{ $any(o)[_opt.displayField] }}</span>
                @if (!valuePopoverMulti() && isOptionSelected(o)) {
                  <mat-icon class="c-valpop-check" fontSet="material-icons-outlined">check</mat-icon>
                }
              </button>
            } @empty {
              <div class="c-valpop-empty">Không có kết quả</div>
            }
          </div>
        } @else if (field.kind === 'date') {
          <mat-calendar [selected]="$any(currentDraftValue())" (selectedChange)="commitValuePopoverDate($any($event))"></mat-calendar>
        } @else if (field.kind === 'datetime') {
          <sd-datetime size="sm" [autoId]="'qb-valpop'" placeholder="Chọn giá tr�9" (sdChange)="commitValuePopover($event)"></sd-datetime>
        }
      </div>
    </ng-template>
  </mat-menu>
```

Update the two value-trigger buttons to declare a local `matMenuTrigger` ref and pass it to the open handler:

- Edit trigger (line ~270-274) � add `#editValueTrigger="matMenuTrigger"` and change `(menuOpened)`:
  ```html
              <button
                type="button"
                class="c-token-value c-token-value-trigger"
                #editValueTrigger="matMenuTrigger"
                [matMenuTriggerFor]="valuePopover"
                [matMenuTriggerData]="{ field: _field }"
                (menuOpened)="openEditValuePopover(i, _field, editValueTrigger)">
                {{ chipValueText(filter) }}
              </button>
  ```
- Build trigger (line ~301-308) � it already has `#buildValueTrigger="matMenuTrigger"`; change `(menuOpened)`:
  ```html
              (menuOpened)="openBuildValuePopover(_b.field, buildValueTrigger)">
  ```

- [ ] **Step 5: Add styling**

In `query-bar.component.scss`, under the value-popover rules, add:

```scss
.c-value-popover .c-value-popover-body {
  padding: 6px;
  min-width: 220px;

  .c-valpop-search {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid $qb-border;
    border-radius: $qb-radius-input;
    padding: 4px 8px;
    font-size: 13px;
    margin-bottom: 4px;
    outline: none;
    &:focus { border-color: $qb-primary; }
  }

  .c-valpop-list { max-height: 240px; overflow: auto; }

  .c-valpop-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 4px;
    font: inherit;
    color: $qb-text;
    text-align: left;

    mat-icon { font-size: 18px; width: 18px; height: 18px; color: $qb-text-muted; }
    .c-valpop-label { flex: 1; }
    .c-valpop-check { color: $qb-primary; }
    &:hover { background: $qb-bg-soft; }
    &.c-valpop-selected { color: $qb-primary; }
  }

  .c-valpop-empty { padding: 8px; color: $qb-text-muted; font-size: 13px; }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run the query-bar spec. Expected: PASS.

- [ ] **Step 7: Full build + combined sweep**

Run: `npm run build` � Expected: `Built Angular Package`, no errors.

Run:
```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.spec.ts'
```
Expected: TOTAL all SUCCESS.

- [ ] **Step 8: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar
git commit -m "feat(query-bar): inline value direct panels � option list + mat-calendar"
```

---

## Self-Review notes

- **Spec coverage (compact popover):** operator in header + no "Điều ki�!n" label (Task 2); drop "Giá tr�9" label + placeholders (Task 2); remove Áp dụng + auto-apply on close, no emit (Task 1); no-data �  empty body (existing `@if (!isNoDataOperator)` retained, Task 2). **Search button (B):** far right (Task 3) + neutral style (Task 3).
- **Spec coverage (inline value panels):** option list single/multi + search (Task 4 helpers + Task 5 DOM); `isOptionSelected` (Task 4); mat-calendar for date (Task 5); commit-on-close for multi (Task 4 `onValuePopoverClosed`); datetime keeps `sd-datetime` (Task 5 template); input/number/boolean unchanged.
- **Type consistency:** `commitChipEditOnClose()`, `openEditValuePopover(i, field, trigger)` / `openBuildValuePopover(field, trigger)` (both gain a `MatMenuTrigger | null` param � callers updated in Task 5 template), `valuePopoverOptions()`, `isOptionSelected(opt)`, `pickValueOption(opt)`, `toggleValueOption(opt)`, `commitValuePopoverDate(d)`, `onValuePopoverClosed()`, `currentDraftValue()`, `valuePopoverSearch()` / `setValuePopoverSearch(v)` � names consistent across TS + template.
- **Note:** Task 4's tests call `openBuildValuePopover(field, null)` (trigger optional/null in tests); the template passes the real `MatMenuTrigger`. `#activeValueTrigger?.closeMenu()` is null-safe.
- **Risk:** `mat-calendar [selected]` expects a `Date`; if the stored draft is a string the calendar may not highlight � acceptable (selection still commits a `Date`). The existing `commitValuePopover` reshaping handles data types.
```

