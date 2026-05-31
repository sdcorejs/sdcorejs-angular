# query-bar inline alignment + BETWEEN dual + selected-display fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the inline query-bar chip so every variant (seamless string/number + token select/date/datetime/boolean) sits on a single vertically-centered row, surface the selected value inside `sd-select [bare]`, and render two `sd-date`/`sd-datetime` pickers for `BETWEEN` on date/datetime fields.

**Architecture:** Pure query-bar changes — `::ng-deep` overrides scoped under `.c-token` for alignment + bare-select value display, a small dual-render branch in the inline build value step and inline edit value editor, and two TS helpers (`setBuildRangeFrom` / `setBuildRangeTo`). No edits to `sd-select` / `sd-date` / `sd-datetime` core.

**Tech Stack:** Angular 19 standalone + signals, Angular Material MDC form-field internals (targeted via `::ng-deep`), existing `sd-*` bare picker mode + `sd-query-inline-value-chip`, Karma/Jasmine.

---

## Conventions

**Test command:** `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
**Lib typecheck:** `npm run build`

Branch `query-bar`. Each commit must start with the ticket prefix `SM-00:` (pre-receive hook requires it — branch convention). Keep Vietnamese `// why:` comments.

## File Structure

- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss` — `::ng-deep` overrides under `.c-token`.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts` — `setBuildRangeFrom` / `setBuildRangeTo` + a small inline-edit range setter wrapper.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html` — BETWEEN dual branches in the build value step + the inline edit value editor.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts` — DOM + behavioral tests.

---

## Task 1: Chip-level CSS overrides — alignment + bare-select value visibility

**Files:** `query-bar.component.scss`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing DOM test** (append a new describe)

```ts
  describe('inline chip alignment + bare select selected display', () => {
    const valuesField = {
      key: 'status', label: 'Status', kind: 'values', operators: ['EQUAL'],
      option: { items: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }], valueField: 'id', displayField: 'name' },
    } as unknown as SdQueryField;

    it('a completed values chip exposes a non-empty .mat-mdc-select-value', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      component.filters.set([{ field: 'status', operator: 'EQUAL', data: 'a' } as any]);
      fixture.detectChanges();

      const sel = fixture.nativeElement.querySelector('.c-token sd-select.sd-bare');
      expect(sel).not.toBeNull();
      const valueEl = sel.querySelector('.mat-mdc-select-value');
      expect(valueEl).not.toBeNull();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL — `sd-select.sd-bare` either renders without `.mat-mdc-select-value` exposed in the test fixture OR the structural query doesn't find it under the chip class. (Either way, the test pins the contract that the chip must render the bare select with a value element.)

- [ ] **Step 3: Add the `::ng-deep` overrides under `.c-token`**

In `query-bar.component.scss`, place the new block immediately after the existing `.c-token` rules (search for `// Inline mode (GitLab-style token builder) — flat completed chips` and add at the end of that section, before the next `---` divider):

```scss
// Chip-level overrides for the bare pickers inside .c-token.
// why: bare sd-* hosts strip the mat-form-field outline but the inner MDC paddings/line-heights
// still push the baseline. Force every wrapper to 0 padding + line-height:1 so each child sits
// flush on the 28/32px chip row. Scoped to .c-token so the standalone sd-* controls elsewhere
// keep their default sizing.
.c-token ::ng-deep {
  .mat-mdc-form-field { line-height: 1; }
  .mat-mdc-text-field-wrapper,
  .mat-mdc-form-field-flex { padding: 0; min-height: 0; background: transparent; }
  .mat-mdc-form-field-infix { padding: 0; min-height: 0; width: auto; border: 0; display: inline-flex; align-items: center; }
  .mat-mdc-select-value,
  .mat-mdc-input-element,
  input { line-height: 1; font-size: 13px; padding: 0; height: auto; color: inherit; }

  // sd-select bare's selected text — make it visible (primary, weight, ellipsized) and avoid
  // collapsing inside the inline-flex chip. Without min-width:0 + max-width it can render at
  // 0 width inside the flex container.
  .mat-mdc-select-value {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    color: $qb-primary;
    font-weight: 500;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run the query-bar spec. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "SM-00: fix(query-bar): align bare pickers inside .c-token + surface bare-select value"
```

---

## Task 2: Build-mode BETWEEN range helpers

**Files:** `query-bar.component.ts`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing tests** (append)

```ts
  describe('inline build BETWEEN range', () => {
    const dateField = { key: 'created', label: 'Created', kind: 'date', operators: ['BETWEEN'] } as unknown as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dateField]);
      component.beginBuild(dateField);
    });

    it('setBuildRangeFrom stores `from` on building.value without committing', () => {
      component.setBuildRangeFrom('2024-01-01');
      expect((component.building()?.value as any)?.from).toBe('2024-01-01');
      expect(component.filters().length).toBe(0);
    });

    it('setBuildRangeTo with both ends set commits a {from, to} chip', () => {
      component.setBuildRangeFrom('2024-01-01');
      component.setBuildRangeTo('2024-01-31');
      expect(component.building()).toBeNull();
      expect(component.filters()).toEqual([
        jasmine.objectContaining({ field: 'created', operator: 'BETWEEN', data: { from: '2024-01-01', to: '2024-01-31' } }),
      ]);
    });

    it('setBuildRangeTo without `from` keeps building open', () => {
      component.setBuildRangeTo('2024-01-31');
      expect(component.building()).not.toBeNull();
      expect((component.building()?.value as any)?.to).toBe('2024-01-31');
      expect(component.filters().length).toBe(0);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL — `component.setBuildRangeFrom is not a function`.

- [ ] **Step 3: Implement the helpers**

In `query-bar.component.ts`, add right after `setBuildDraftFn` (around line 467):

```ts
  /** Update the `from` end of the build chip's BETWEEN range without committing. */
  setBuildRangeFrom(v: unknown): void {
    const b = this.#building();
    if (!b) return;
    const cur = (b.value && typeof b.value === 'object') ? (b.value as any) : {};
    this.#building.set({ ...b, value: { ...cur, from: v } });
  }

  /**
   * Update the `to` end of the build chip's BETWEEN range. Once both ends are set, commit
   * the chip so the user does not need an extra blur / apply press.
   */
  setBuildRangeTo(v: unknown): void {
    const b = this.#building();
    if (!b) return;
    const cur = (b.value && typeof b.value === 'object') ? (b.value as any) : {};
    const next = { ...cur, to: v };
    this.#building.set({ ...b, value: next });
    if (next.from != null && next.to != null) this.commitBuildValue(next);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run the query-bar spec. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "SM-00: feat(query-bar): setBuildRangeFrom / setBuildRangeTo for BETWEEN inline build"
```

---

## Task 3: Template — render dual pickers for BETWEEN date/datetime

**Files:** `query-bar.component.html`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing DOM tests** (append)

```ts
  describe('inline BETWEEN dual pickers (date / datetime)', () => {
    const dateField = { key: 'created', label: 'Created', kind: 'date', operators: ['BETWEEN'] } as unknown as SdQueryField;
    const dtField = { key: 'updatedAt', label: 'Updated', kind: 'datetime', operators: ['BETWEEN'] } as unknown as SdQueryField;

    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'inline');
    });

    it('date BETWEEN build value step renders two sd-date (Từ / Đến)', () => {
      fixture.componentRef.setInput('fields', [dateField]);
      component.beginBuild(dateField); // single op BETWEEN → straight to value step
      fixture.detectChanges();

      const dates = fixture.nativeElement.querySelectorAll('.c-token-building sd-date');
      expect(dates.length).toBe(2);
      expect((dates[0] as HTMLElement).getAttribute('placeholder')).toBe('Từ');
      expect((dates[1] as HTMLElement).getAttribute('placeholder')).toBe('Đến');
    });

    it('datetime BETWEEN build value step renders two sd-datetime (Từ / Đến)', () => {
      fixture.componentRef.setInput('fields', [dtField]);
      component.beginBuild(dtField);
      fixture.detectChanges();

      const dts = fixture.nativeElement.querySelectorAll('.c-token-building sd-datetime');
      expect(dts.length).toBe(2);
      expect((dts[0] as HTMLElement).getAttribute('placeholder')).toBe('Từ');
      expect((dts[1] as HTMLElement).getAttribute('placeholder')).toBe('Đến');
    });

    it('date BETWEEN completed chip edit renders two sd-date bound to data.from / data.to', () => {
      fixture.componentRef.setInput('fields', [dateField]);
      component.filters.set([{ field: 'created', operator: 'BETWEEN', data: { from: '2024-01-01', to: '2024-01-31' } } as any]);
      fixture.detectChanges();

      const dates = fixture.nativeElement.querySelectorAll('.c-token sd-date');
      expect(dates.length).toBe(2);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run the query-bar spec. Expected: FAIL — only one `<sd-date>` rendered (current branch always renders a single picker for date/datetime).

- [ ] **Step 3: Update the inline build value step**

In `query-bar.component.html`, replace the build `date` branch (around line 328) with:

```html
          } @else if (_b.field.kind === 'date') {
            <span class="c-token-value c-token-value-edit">
              @if (_b.operator === 'BETWEEN') {
                <sd-date #bPicker bare size="sm" autoId="qb-build-value-from" placeholder="Từ"
                  [model]="$any(_b.value)?.from" (sdChange)="setBuildRangeFrom($event)"></sd-date>
                <span class="c-token-dash" aria-hidden="true">—</span>
                <sd-date bare size="sm" autoId="qb-build-value-to" placeholder="Đến"
                  [model]="$any(_b.value)?.to" (sdChange)="setBuildRangeTo($event)"></sd-date>
              } @else {
                <sd-date #bPicker bare size="sm" autoId="qb-build-value" [model]="$any(_b.value)" (sdChange)="commitBuildValue($event)"></sd-date>
              }
            </span>
          } @else if (_b.field.kind === 'datetime') {
            <span class="c-token-value c-token-value-edit">
              @if (_b.operator === 'BETWEEN') {
                <sd-datetime #bPicker bare size="sm" autoId="qb-build-value-from" placeholder="Từ"
                  [model]="$any(_b.value)?.from" (sdChange)="setBuildRangeFrom($event)"></sd-datetime>
                <span class="c-token-dash" aria-hidden="true">—</span>
                <sd-datetime bare size="sm" autoId="qb-build-value-to" placeholder="Đến"
                  [model]="$any(_b.value)?.to" (sdChange)="setBuildRangeTo($event)"></sd-datetime>
              } @else {
                <sd-datetime #bPicker bare size="sm" autoId="qb-build-value" [model]="$any(_b.value)" (sdChange)="commitBuildValue($event)"></sd-datetime>
              }
            </span>
          }
```

The `#bPicker` ref stays on the FIRST picker (Từ) so the existing `buildPicker()?.open()` auto-opens it on entering the value step.

- [ ] **Step 4: Update the inline edit value editor (completed chip BETWEEN)**

In the completed-chip branch (around line 281-285, where `_field.kind !== 'boolean'` falls through to the shared `#valueEditor` outlet), add a BETWEEN-specific branch BEFORE the shared outlet so date/datetime BETWEEN edits render dual pickers. Replace the `@else` block at lines 281-285:

```html
              } @else if ((_field.kind === 'date' || _field.kind === 'datetime') && _op === 'BETWEEN') {
                <span class="c-token-value c-token-value-edit">
                  @if (_field.kind === 'date') {
                    <sd-date bare size="sm" placeholder="Từ"
                      [autoId]="inlineAutoId(i, 'value-from')"
                      [model]="$any(_data)?.from"
                      (sdChange)="setFilterRangeFrom(i, $any($event))"></sd-date>
                    <span class="c-token-dash" aria-hidden="true">—</span>
                    <sd-date bare size="sm" placeholder="Đến"
                      [autoId]="inlineAutoId(i, 'value-to')"
                      [model]="$any(_data)?.to"
                      (sdChange)="setFilterRangeTo(i, $any($event))"></sd-date>
                  } @else {
                    <sd-datetime bare size="sm" placeholder="Từ"
                      [autoId]="inlineAutoId(i, 'value-from')"
                      [model]="$any(_data)?.from"
                      (sdChange)="setFilterRangeFrom(i, $any($event))"></sd-datetime>
                    <span class="c-token-dash" aria-hidden="true">—</span>
                    <sd-datetime bare size="sm" placeholder="Đến"
                      [autoId]="inlineAutoId(i, 'value-to')"
                      [model]="$any(_data)?.to"
                      (sdChange)="setFilterRangeTo(i, $any($event))"></sd-datetime>
                  }
                </span>
              } @else {
                <span class="c-token-value c-token-value-edit">
                  <ng-container *ngTemplateOutlet="valueEditor; context: { field: _field, data: _data, isMulti: isMultiOperator(_op), change: editValueFn(i), enter: noop, autoId: inlineAutoId(i, 'value') }"></ng-container>
                </span>
              }
```

`setFilterRangeFrom(i, v)` / `setFilterRangeTo(i, v)` already exist in `query-bar.component.ts` (used by popover-mode BETWEEN). They take `index, value` and write `{from, to}` back via `updateFilter`.

- [ ] **Step 5: Add the dash spacer SCSS**

In `query-bar.component.scss`, after the existing `.c-token-sep` rule (search for `.c-token-sep`), add:

```scss
.c-token-dash {
  color: $qb-text-muted;
  padding: 0 4px;
  line-height: 1;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run the query-bar spec. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts
git commit -m "SM-00: feat(query-bar): dual sd-date / sd-datetime bare pickers for BETWEEN inline"
```

---

## Task 4: Full build + combined sweep

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

If the build or sweep surfaced a small fix, stage and commit it:

```bash
git add -A
git commit -m "SM-00: test(query-bar): green build + sweep for alignment + BETWEEN dual"
```

(If nothing changed, skip this step.)

---

## Self-Review notes

- **Spec coverage:**
  - A. Chip alignment → Task 1 (`::ng-deep` overrides under `.c-token`).
  - B. sd-select bare selected display → Task 1 (`.mat-mdc-select-value` styled with primary color + min-width + ellipsis).
  - C. BETWEEN dual for date/datetime → Tasks 2 (TS helpers) + 3 (template build value step + inline edit value editor + dash SCSS).
  - D. Tests → each task ships its own DOM + behavioral assertions; Task 4 confirms full build + cross-component sweep.
- **Type consistency:** `setBuildRangeFrom(v: unknown)` / `setBuildRangeTo(v: unknown)` consistent across TS + template. `setFilterRangeFrom(i, v)` / `setFilterRangeTo(i, v)` reused from existing popover wiring — verified by the prior plan that introduced them.
- **Risk:** the `::ng-deep` overrides apply to ALL mat-form-fields inside `.c-token` — that's exactly the bare pickers (and nothing else lives inside a token), so scope is correct. The `auto-commit on both-set` behavior in `setBuildRangeTo` is the same approach the inline-value-chip already uses for seamless BETWEEN (`commitRange()` on blur with both ends populated) — consistent UX.
- **Out of scope reminder:** no changes to `sd-select` / `sd-date` / `sd-datetime` source. If the bare-select value still does not appear after Task 1, the Minor follow-up is `lazyItemsFor`'s memoization — verify it resolves a real array (not a fn) before the select renders; do NOT modify `sd-select` itself.
