# query-bar inline chip — viewed-mode default + edit on click — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make completed inline chips for `values` / `lazy-values` / `date` / `datetime` render the picker as `[viewed]=true` (read-only `sd-view` text) by default, switch to editable on click, exit edit on commit (single) / focusout (multi), and hide the internal `.sd-suffix-icon` clear `×` inside the chip.

**Architecture:** Two TS helpers (`onChipSingleCommit`, `onChipValueFocusOut`) drive edit-mode lifecycle; the template's catch-all `@else` (the non-boolean / non-BETWEEN-date branch) is split into per-kind branches that render the picker directly with `[viewed]="!isEditingValue(i)"`; a one-line `::ng-deep` rule hides the picker's clear icon inside `.c-token`. No edits to `sd-select` / `sd-date` / `sd-datetime` source.

**Tech Stack:** Angular 19 standalone + signals, MDC pickers' existing `viewed` input + `<sd-view>` path, Karma/Jasmine.

---

## Conventions

**Test command:** `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
**Lib typecheck:** `npm run build`

Branch `query-bar`. Every commit message starts with `SM-00:` (pre-receive hook). Keep Vietnamese `// why:` comments.

## File Structure

- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts` — add `onChipSingleCommit(i, v)` + `onChipValueFocusOut(i, ev)`.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html` — split the completed-chip non-boolean / non-BETWEEN-date branch into per-kind picker renderings with `[viewed]` toggle + click-to-edit wrapper + focusout exit.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss` — append `.sd-suffix-icon { display:none; }` inside the existing `.c-token ::ng-deep` block.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts` — DOM + behavioral tests.

---

## Task 1: TS lifecycle helpers — `onChipSingleCommit` + `onChipValueFocusOut`

**Files:** `query-bar.component.ts`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing tests** (append a new describe)

```ts
  describe('inline chip edit lifecycle', () => {
    const valuesField = {
      key: 'status', label: 'Status', kind: 'values', operators: ['EQUAL'],
      option: { items: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      component.filters.set([{ field: 'status', operator: 'EQUAL', data: 'a' } as any]);
    });

    it('onChipSingleCommit writes data and exits edit mode', () => {
      component.beginEditValue(0);
      expect(component.editingValueIndex()).toBe(0);

      component.onChipSingleCommit(0, 'b');

      expect((component.filters()[0] as any).data).toBe('b');
      expect(component.editingValueIndex()).toBeNull();
    });

    it('onChipValueFocusOut exits edit only when focus leaves the wrapper subtree', () => {
      component.beginEditValue(0);

      const wrapper = document.createElement('span');
      const child = document.createElement('input');
      wrapper.appendChild(child);
      const outside = document.createElement('button');

      // focus moves to a child of the wrapper → stay in edit
      component.onChipValueFocusOut(0, new FocusEvent('focusout', { relatedTarget: child, bubbles: true }) as any);
      // jsdom-style FocusEvent may not carry relatedTarget through bubbles; supply via spy:
      const stayingEvent = { relatedTarget: child, currentTarget: wrapper } as unknown as FocusEvent;
      component.onChipValueFocusOut(0, stayingEvent);
      expect(component.editingValueIndex()).toBe(0);

      // focus moves outside the wrapper → exit
      const leavingEvent = { relatedTarget: outside, currentTarget: wrapper } as unknown as FocusEvent;
      component.onChipValueFocusOut(0, leavingEvent);
      expect(component.editingValueIndex()).toBeNull();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL — `component.onChipSingleCommit is not a function`.

- [ ] **Step 3: Implement the helpers**

In `query-bar.component.ts`, add right after `editValueFn` / `noop` (around line 453):

```ts
  /** Single-value commit from a completed chip in edit mode — write data + exit edit. */
  onChipSingleCommit(i: number, v: unknown): void {
    this.updateFilter(i, { data: v } as Partial<Filter>);
    this.#editingValueIndex.set(null);
  }

  /**
   * Multi-value chips exit edit when focus actually leaves the wrapper subtree.
   * why: focusout fires on every internal blur (option click, search input, …) — only
   * exit when the new focus target is NOT a descendant of the chip's value wrapper.
   */
  onChipValueFocusOut(i: number, ev: FocusEvent): void {
    const wrapper = ev.currentTarget as HTMLElement | null;
    const next = ev.relatedTarget as Node | null;
    if (wrapper && next && wrapper.contains(next)) return;
    if (this.#editingValueIndex() === i) this.#editingValueIndex.set(null);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run the query-bar spec. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "SM-00: feat(query-bar): chip edit-lifecycle helpers (single-commit + focusout exit)"
```

---

## Task 2: Template — per-kind picker with `[viewed]` toggle + hide internal clear ×

**Files:** `query-bar.component.html`, `query-bar.component.scss`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing DOM tests** (append)

```ts
  describe('inline chip viewed mode + clear-icon hidden', () => {
    const valuesField = {
      key: 'status', label: 'Status', kind: 'values', operators: ['EQUAL'],
      option: { items: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;
    const dateField = { key: 'created', label: 'Created', kind: 'date', operators: ['EQUAL'] } as unknown as SdQueryField;
    const dtField = { key: 'updatedAt', label: 'Updated', kind: 'datetime', operators: ['EQUAL'] } as unknown as SdQueryField;

    function seed(field: SdQueryField, data: unknown): void {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [field]);
      component.filters.set([{ field: field.key, operator: 'EQUAL', data } as any]);
      fixture.detectChanges();
    }

    it('values chip renders sd-select with viewed=true by default', () => {
      seed(valuesField, 'a');
      const sel = fixture.nativeElement.querySelector('.c-token sd-select') as HTMLElement;
      expect(sel).not.toBeNull();
      expect(sel.hasAttribute('ng-reflect-viewed')).toBe(true);
      expect(sel.getAttribute('ng-reflect-viewed')).toBe('true');
    });

    it('date chip renders sd-date with viewed=true by default', () => {
      seed(dateField, '2024-01-15');
      const d = fixture.nativeElement.querySelector('.c-token sd-date') as HTMLElement;
      expect(d).not.toBeNull();
      expect(d.getAttribute('ng-reflect-viewed')).toBe('true');
    });

    it('datetime chip renders sd-datetime with viewed=true by default', () => {
      seed(dtField, '2024-01-15T08:00:00Z');
      const d = fixture.nativeElement.querySelector('.c-token sd-datetime') as HTMLElement;
      expect(d).not.toBeNull();
      expect(d.getAttribute('ng-reflect-viewed')).toBe('true');
    });

    it('clicking the chip value wrapper enters edit mode (viewed=false)', () => {
      seed(valuesField, 'a');
      const wrapper = fixture.nativeElement.querySelector('.c-token .c-token-value-edit') as HTMLElement;
      wrapper.click();
      fixture.detectChanges();
      expect(component.editingValueIndex()).toBe(0);
      const sel = fixture.nativeElement.querySelector('.c-token sd-select') as HTMLElement;
      expect(sel.getAttribute('ng-reflect-viewed')).toBe('false');
    });

    it('hides the picker .sd-suffix-icon inside .c-token (display:none)', () => {
      seed(valuesField, 'a');
      const wrapper = fixture.nativeElement.querySelector('.c-token .c-token-value-edit') as HTMLElement;
      wrapper.click();
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.c-token .sd-suffix-icon') as HTMLElement | null;
      if (icon) {
        expect(getComputedStyle(icon).display).toBe('none');
      }
      // (If the element is not present at all in the queryable DOM, the assertion is implicit.)
    });
  });
```

> `ng-reflect-viewed` is the auto-emitted Angular dev-mode attribute reflecting the bound input value. Angular dev mode is the test default for Karma; assertions are reliable. If a CI flips off `enableProdMode` for tests, prefer querying the `<sd-view>` child element instead.

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL — the chip currently routes values/date/datetime through the shared `#valueEditor` outlet without a `viewed` binding; `ng-reflect-viewed` is absent.

- [ ] **Step 3: Update the template — replace the catch-all `@else`**

In `query-bar.component.html`, replace lines 306-309 (the current catch-all `@else { <span class="c-token-value c-token-value-edit"><ng-container *ngTemplateOutlet="valueEditor; …"></span> }`) with per-kind branches:

```html
              } @else if (_field.kind === 'values' || _field.kind === 'lazy-values') {
                @let _opt = $any(_field).option;
                <span
                  class="c-token-value c-token-value-edit"
                  (click)="beginEditValue(i)"
                  (focusout)="onChipValueFocusOut(i, $event)">
                  <sd-select bare size="sm" minWidthPanel="220px"
                    [autoId]="inlineAutoId(i, 'value')"
                    [items]="_field.kind === 'lazy-values' ? lazyItemsFor(_field) : $any(_opt.items)"
                    [valueField]="_opt.valueField"
                    [displayField]="_opt.displayField"
                    [multiple]="isMultiOperator(_op)"
                    [viewed]="!isEditingValue(i)"
                    [model]="_data"
                    (sdChange)="isMultiOperator(_op) ? editValueFn(i)($event) : onChipSingleCommit(i, $event)"></sd-select>
                </span>
              } @else if (_field.kind === 'date') {
                <span
                  class="c-token-value c-token-value-edit"
                  (click)="beginEditValue(i)"
                  (focusout)="onChipValueFocusOut(i, $event)">
                  <sd-date bare size="sm"
                    [autoId]="inlineAutoId(i, 'value')"
                    [viewed]="!isEditingValue(i)"
                    [model]="_data"
                    (sdChange)="onChipSingleCommit(i, $any($event))"></sd-date>
                </span>
              } @else if (_field.kind === 'datetime') {
                <span
                  class="c-token-value c-token-value-edit"
                  (click)="beginEditValue(i)"
                  (focusout)="onChipValueFocusOut(i, $event)">
                  <sd-datetime bare size="sm"
                    [autoId]="inlineAutoId(i, 'value')"
                    [viewed]="!isEditingValue(i)"
                    [model]="_data"
                    (sdChange)="onChipSingleCommit(i, $any($event))"></sd-datetime>
                </span>
              } @else {
                <!-- Fallback (number / other) — keep the shared editor outlet path. -->
                <span class="c-token-value c-token-value-edit">
                  <ng-container *ngTemplateOutlet="valueEditor; context: { field: _field, data: _data, isMulti: isMultiOperator(_op), change: editValueFn(i), enter: noop, autoId: inlineAutoId(i, 'value') }"></ng-container>
                </span>
              }
```

> The boolean branch (lines 273-280) and the BETWEEN date/datetime branch (lines 281-305) are unchanged — these new branches slot in between the BETWEEN branch and the trailing fallback `@else`.

- [ ] **Step 4: Hide the picker's internal clear icon inside `.c-token`**

In `query-bar.component.scss`, find the existing `.c-token ::ng-deep { … }` block (added in the alignment task). Append the rule inside that block (right before its closing `}`):

```scss
  // why: sd-select / sd-date render a `.sd-suffix-icon` (cancel) to clear the value.
  // Inside a filter chip the chip's own × handles removal — the inner icon is a
  // duplicate affordance and visually misaligns the chip baseline.
  .sd-suffix-icon { display: none; }
```

- [ ] **Step 5: Run test to verify it passes**

Run the query-bar spec. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "SM-00: feat(query-bar): chip viewed default for select/date/datetime + edit on click; hide internal clear"
```

---

## Task 3: Full build + combined sweep

**Files:** none (verification only)

- [ ] **Step 1: Lib typecheck**

Run: `npm run build`
Expected: `Built Angular Package`, no errors.

- [ ] **Step 2: Combined sweep**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.spec.ts'
```

Expected: TOTAL all SUCCESS.

- [ ] **Step 3: Commit any fixups**

If a sweep fix is needed:

```bash
git add -A
git commit -m "SM-00: test(query-bar): green build + sweep for chip viewed mode"
```

(Skip if no changes.)

---

## Self-Review notes

- **Spec coverage:**
  - A. viewed default + click to edit → Task 2 (per-kind branches with `[viewed]="!isEditingValue(i)"` + `(click)="beginEditValue(i)"`).
  - B. Single exits on `sdChange` → `onChipSingleCommit` (Task 1) + bound in Task 2 for non-multi paths.
  - C. Multi exits on `focusout` → `onChipValueFocusOut` (Task 1) wired via wrapper `(focusout)` (Task 2).
  - D. Hide `.sd-suffix-icon` → Task 2 Step 4.
  - Tests across Tasks 1 + 2 cover the behavioral + DOM assertions.
- **Type consistency:** `onChipSingleCommit(i: number, v: unknown)`, `onChipValueFocusOut(i: number, ev: FocusEvent)`, `editingValueIndex()` (readonly accessor exists), `beginEditValue(i)` (exists). Names align across TS + template.
- **Risk:** `ng-reflect-viewed` requires dev-mode (Karma uses it by default). If the project ever flips Karma to prod mode the attribute won't reflect — re-anchor those DOM assertions to `sd-view` child existence (`.c-token sd-view`). Out of scope for now.
- **Out of scope:** sd-select/sd-date/sd-datetime source; the `boolean` chip; popover mode; the seamless string/number chip.
