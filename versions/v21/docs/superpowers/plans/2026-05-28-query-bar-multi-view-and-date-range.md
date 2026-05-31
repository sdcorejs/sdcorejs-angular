# chip multi "head +N" view + sd-date-range bare/viewed + BETWEEN unify — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the inline chip's multi `sd-select` show `"first +N"` instead of a comma-joined list, and replace the dual `sd-date`/`sd-datetime` BETWEEN pickers with a single `<sd-date-range bare>` (after adding `bare` / `viewed` / `open()` to `sd-date-range`). Then refresh the relevant `*.md` docs.

**Architecture:** sd-select already accepts a `#sdValue` content-child template that overrides its viewed display; the chip projects a template doing the head+N logic. sd-date-range gets the same bare/viewed/open() pattern as sd-date so it can be dropped into chips. query-bar's BETWEEN branches collapse to one component; `setFilterRangeFrom`/`To` + `setBuildRangeFrom`/`To` retire.

**Tech Stack:** Angular 19 standalone + signals, Angular Material `MatDateRangePicker`, existing `sd-select` valueTemplate / `sd-view` path, Karma/Jasmine.

---

## Conventions

**Test command:** `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='<spec-path>'`
**Lib typecheck:** `npm run build`

Branch `query-bar`. Every commit starts with `SM-00:` (pre-receive hook). Vietnamese `// why:` comments for tricky logic.

## File Structure

- Modify: `projects/sdcorejs-angular/forms/date-range/src/date-range.component.ts` — add `bare`, `viewed` inputs + `sdValueTemplate` contentChild + public `open()` + `formatted()` computed.
- Modify: `projects/sdcorejs-angular/forms/date-range/src/date-range.component.html` — viewed branch with `<sd-view>`.
- Modify: `projects/sdcorejs-angular/forms/date-range/src/date-range.component.scss` — `:host(.sd-viewed) { padding-top: 0 }` + the documented bare block (mirror sd-date).
- Modify: `projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts` — bare/viewed/open() tests.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html` — chip sd-select `#sdValue` template + BETWEEN sd-date-range.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts` — `setFilterRange(i, ev)` helper; remove unused `setFilterRangeFrom/To` + `setBuildRangeFrom/To`. Import `SdDateRange`, add to component imports.
- Modify: `projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts` — multi "head +N" + sd-date-range chip DOM + setFilterRange behavior.
- Update docs: `projects/sdcorejs-angular/forms/date-range/sd-date-range.md`, `projects/sdcorejs-angular/components/query-bar/sd-query-bar.md` (or `HANDOFF.md`), `CLAUDE.md`.

---

## Task 1: sd-date-range — add `[bare]`, `[viewed]`, public `open()` (+ tests)

**Files:** `date-range.component.ts`, `.html`, `.scss`, `.spec.ts`

- [ ] **Step 1: Write the failing tests** (append to `date-range.component.spec.ts`)

```ts
  describe('bare + viewed + open()', () => {
    it('bare host adds .sd-bare', () => {
      // host bindings reflect from inputs after detectChanges
      host.bare = true; // add `bare` to the test host component as a passthrough input
      fixture.detectChanges();
      const hostEl = fixture.nativeElement.querySelector('sd-date-range') as HTMLElement;
      expect(hostEl.classList.contains('sd-bare')).toBe(true);
    });

    it('viewed renders sd-view (not the mat-form-field input)', () => {
      host.viewed = true;
      fixture.detectChanges();
      const view = fixture.nativeElement.querySelector('sd-date-range sd-view');
      expect(view).not.toBeNull();
      const dateInput = fixture.nativeElement.querySelector('sd-date-range mat-date-range-input');
      expect(dateInput).toBeNull();
    });

    it('open() opens the range picker programmatically', () => {
      // grab the inner sd-date-range component instance
      const cmp = fixture.debugElement.query(By.directive(SdDateRange)).componentInstance as SdDateRange;
      const picker = cmp.picker();
      expect(picker).toBeTruthy();
      spyOn(picker!, 'open');
      cmp.open();
      expect(picker!.open).toHaveBeenCalled();
    });
  });
```

Add `bare` + `viewed` pass-through inputs to the existing `StubHost` (or whichever host the spec uses) so the test can bind them. Also import `SdDateRange` and `By` in the spec if not already.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts'`
Expected: FAIL — `[bare]`/`[viewed]` not bindable; `open()` not a method.

- [ ] **Step 3: Add inputs + host bindings + open() + formatted() to TS**

In `date-range.component.ts`:

Add to the `import { ... } from '@angular/core'` line: `booleanAttribute` (if not already).

Inside `@Component({ ... })` decorator, set the host bindings:

```ts
host: { '[class.sd-bare]': 'bare()', '[class.sd-viewed]': 'viewed()' },
```

Inside the class, add inputs + a `sdValueTemplate` content-child + a `formatted()` computed + the public `open()` method. Place them near the other inputs (e.g. after `disabled`):

```ts
  /** Bare mode — strip the form-field shell to fit inline in a chip / token. */
  bare = input(false, { transform: booleanAttribute });

  /** Viewed mode — render a read-only <sd-view> instead of the editable form-field. */
  viewed = input(false, { transform: booleanAttribute });

  /** Optional <ng-template #sdValue> projected by consumer to override the viewed text. */
  sdValueTemplate = contentChild<TemplateRef<unknown>>('sdValue');

  /**
   * Formatted "dd/MM/yyyy → dd/MM/yyyy" string for the viewed-mode display.
   * Returns empty when both ends are blank, "from →" when only from is set, and so on.
   */
  formatted = computed<string>(() => {
    const m = this.valueModel();
    const fmt = (d: unknown): string => {
      if (d == null || d === '') return '';
      const dt = d instanceof Date ? d : new Date(String(d));
      if (isNaN(dt.getTime())) return '';
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${dt.getFullYear()}`;
    };
    const a = fmt(m?.from);
    const b = fmt(m?.to);
    if (!a && !b) return '';
    return `${a} → ${b}`;
  });

  /** Open the range picker panel programmatically (for query-bar chip auto-open). */
  open = (): void => {
    if (this.formControl.disabled) return;
    this.picker()?.open();
  };
```

`TemplateRef` is already a separate import — add to the existing `@angular/core` import: `TemplateRef`. `computed` may already be imported.

- [ ] **Step 4: Add the viewed branch to the template**

In `date-range.component.html`, wrap the existing `<mat-form-field>` (and any other label/error rendering) in an `@if (!viewed())` / `@else` so viewed mode renders `<sd-view>` instead. Place this near the top of the template, before the existing `<mat-form-field>`:

```html
@if (viewed()) {
  <sd-view
    [label]="lbl"
    [labelTemplate]="lblDef?.templateRef ?? null"
    [value]="valueModel()"
    [display]="formatted()"
    [valueTemplate]="sdValueTemplate()">
  </sd-view>
} @else {
```

Then add a matching `}` at the end of the file (after the closing `</mat-form-field>` and its hint/error siblings).

Add `SdView` to the `imports` array of `@Component({...})` if not already present. (`sd-date` / `sd-datetime` already import it — match their pattern.)

- [ ] **Step 5: Add SCSS — viewed padding zero + the documented bare block**

In `date-range.component.scss`, change the existing `padding-top: 5px;` → `padding-top: 4px;` on `:host` (consistency with sd-select/sd-date/sd-datetime). Then add the rules at the END of the file:

```scss
// why: viewed mode hiển thị sd-view (text only) → bỏ đệm trên.
:host(.sd-viewed) { padding-top: 0; }

// =============================================================================
// Bare mode — "không khung": bóc hết shell mat-form-field để control nằm phẳng
// trong context inline (vd. chip query-bar BETWEEN date/datetime).
// -----------------------------------------------------------------------------
// Khi dùng <sd-date-range bare>:
//   - Trong chip / token / inline editor — nơi đã có viền riêng & layout chặt.
// Khi KHÔNG dùng:
//   - Form thông thường (cần outline + label + subscript).
//   - State chỉ-đọc: dùng [viewed]=true để render <sd-view> (text only).
//
// bare và viewed bù nhau:
//   - viewed=true               → text qua <sd-view>, không có form-field.
//   - bare=true + viewed=false  → form-field bị bóc khung, vẫn mở được range picker.
// =============================================================================

:host(.sd-bare) {
  display: inline-flex;
  align-items: center;
}

:host(.sd-bare) ::ng-deep {
  // Form-field mặc định 100% width — co về auto.
  .mat-mdc-form-field { width: auto; }

  // Wrapper outline/nền: bỏ đệm + nền để text ngồi sát viền chip.
  .mat-mdc-text-field-wrapper { padding: 0; background: transparent; }

  // Flex row chứa prefix/infix/suffix: bỏ đệm, canh giữa dọc.
  .mat-mdc-form-field-flex { padding: 0; align-items: center; }

  // Viền outline ("notched"): ẩn — chip đã có viền riêng.
  .mdc-notched-outline { display: none; }

  // Vùng hint/error dưới control: ẩn — chip không có chỗ cho subscript.
  .mat-mdc-form-field-subscript-wrapper { display: none; }

  // Infix là vùng input thật: bỏ đệm + min-height, canh giữa, bỏ border.
  .mat-mdc-form-field-infix {
    padding: 0;
    min-height: 0;
    width: auto;
    border: 0;
    display: inline-flex;
    align-items: center;
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts'`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/forms/date-range
git commit -m "SM-00: feat(date-range): add [bare] / [viewed] / open() — mirror sd-date pattern"
```

---

## Task 2: query-bar chip sd-select — `#sdValue` template "head +N"

**Files:** `query-bar.component.html`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
  describe('chip multi sd-select "head +N" view', () => {
    const valuesField = {
      key: 'depts', label: 'Departments', kind: 'values', operators: ['IN'],
      option: {
        items: [
          { id: 'a', name: 'Alpha' },
          { id: 'b', name: 'Beta' },
          { id: 'c', name: 'Gamma' },
        ],
        valueField: 'id', displayField: 'name',
      },
    } as unknown as SdQueryField;

    it('renders "head +N" when multi has 2+ selected', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      component.filters.set([{ field: 'depts', operator: 'IN', data: ['a', 'b', 'c'] } as any]);
      fixture.detectChanges();
      const txt = (fixture.nativeElement.querySelector('.c-token sd-select') as HTMLElement)?.textContent ?? '';
      expect(txt).toMatch(/Alpha\s*\+2/);
    });

    it('renders the single label when multi has exactly 1', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [valuesField]);
      component.filters.set([{ field: 'depts', operator: 'IN', data: ['b'] } as any]);
      fixture.detectChanges();
      const txt = (fixture.nativeElement.querySelector('.c-token sd-select') as HTMLElement)?.textContent ?? '';
      expect(txt).toContain('Beta');
      expect(txt).not.toContain('+');
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL — chip currently renders all labels comma-joined.

- [ ] **Step 3: Project `#sdValue` template inside the completed-chip sd-select**

In `query-bar.component.html`, the completed-chip values branch currently looks like:

```html
              } @else if (_field.kind === 'values' || _field.kind === 'lazy-values') {
                @let _opt = $any(_field).option;
                <span ... (focusout)="onChipValueFocusOut(i, $event)">
                  <sd-select #chipPicker bare size="sm" minWidthPanel="300px"
                    [autoId]="inlineAutoId(i, 'value')"
                    [items]="_field.kind === 'lazy-values' ? lazyItemsFor(_field) : $any(_opt.items)"
                    [valueField]="_opt.valueField"
                    [displayField]="_opt.displayField"
                    [multiple]="_op === 'IN' || _op === 'NOT_IN'"
                    [viewed]="!isEditingValue(i)"
                    [model]="_data"
                    (sdChange)="_op === 'IN' || _op === 'NOT_IN' ? editValueFn(i)($event) : onChipSingleCommit(i, $event)"></sd-select>
                </span>
```

Add a `<ng-template #sdValue>` projection INSIDE the `<sd-select>` (before the closing tag). Replace the self-closing `... ></sd-select>` with an opening tag + content + close:

```html
                  <sd-select #chipPicker bare size="sm" minWidthPanel="300px"
                    [autoId]="inlineAutoId(i, 'value')"
                    [items]="_field.kind === 'lazy-values' ? lazyItemsFor(_field) : $any(_opt.items)"
                    [valueField]="_opt.valueField"
                    [displayField]="_opt.displayField"
                    [multiple]="_op === 'IN' || _op === 'NOT_IN'"
                    [viewed]="!isEditingValue(i)"
                    [model]="_data"
                    (sdChange)="_op === 'IN' || _op === 'NOT_IN' ? editValueFn(i)($event) : onChipSingleCommit(i, $event)">
                    <!-- why: viewed mode mặc định dùng comma-joined cho multi — quá dài cho chip.
                         Override bằng template "head +N" giống popover chipValueText. -->
                    <ng-template #sdValue let-selectedItems="selectedItems">
                      @if ((selectedItems?.length ?? 0) > 1) {
                        {{ $any(selectedItems)[0][_opt.displayField] }} +{{ selectedItems.length - 1 }}
                      } @else if ((selectedItems?.length ?? 0) === 1) {
                        {{ $any(selectedItems)[0][_opt.displayField] }}
                      }
                    </ng-template>
                  </sd-select>
```

- [ ] **Step 4: Do the same for the build chip sd-select**

The build chip sd-select (around line 386 in `query-bar.component.html`) — same treatment. Replace its self-closing form with an open/close pair and project the template:

```html
              <sd-select #bPicker bare size="sm" minWidthPanel="300px" autoId="qb-build-value"
                [items]="_b.field.kind === 'lazy-values' ? lazyItemsFor(_b.field) : $any(_bopt.items)"
                [valueField]="_bopt.valueField" [displayField]="_bopt.displayField"
                [multiple]="_b.operator === 'IN' || _b.operator === 'NOT_IN'"
                [model]="$any(_b.value)"
                (sdChange)="commitBuildValue($event)">
                <ng-template #sdValue let-selectedItems="selectedItems">
                  @if ((selectedItems?.length ?? 0) > 1) {
                    {{ $any(selectedItems)[0][_bopt.displayField] }} +{{ selectedItems.length - 1 }}
                  } @else if ((selectedItems?.length ?? 0) === 1) {
                    {{ $any(selectedItems)[0][_bopt.displayField] }}
                  }
                </ng-template>
              </sd-select>
```

- [ ] **Step 5: Same for the shared `#valueEditor` template's two sd-select branches**

The shared `#valueEditor` ng-template (around lines 226-231) has values + lazy-values sd-selects. Apply the same `#sdValue` projection. Use `$any(field).option.displayField` since the field is passed via context:

```html
      } @else if (field.kind === 'values') {
        @let _opt = $any(field).option;
        <sd-select bare size="sm" minWidthPanel="300px" [autoId]="autoId" [items]="$any(_opt.items)" [valueField]="_opt.valueField" [displayField]="_opt.displayField" [multiple]="isMulti" [model]="data" (sdChange)="change($event); enter()">
          <ng-template #sdValue let-selectedItems="selectedItems">
            @if ((selectedItems?.length ?? 0) > 1) {
              {{ $any(selectedItems)[0][_opt.displayField] }} +{{ selectedItems.length - 1 }}
            } @else if ((selectedItems?.length ?? 0) === 1) {
              {{ $any(selectedItems)[0][_opt.displayField] }}
            }
          </ng-template>
        </sd-select>
      } @else if (field.kind === 'lazy-values') {
        @let _lopt = $any(field).option;
        <sd-select bare size="sm" minWidthPanel="300px" [autoId]="autoId" [items]="lazyItemsFor(field)" [valueField]="_lopt.valueField" [displayField]="_lopt.displayField" [multiple]="isMulti" [model]="data" (sdChange)="change($event); enter()">
          <ng-template #sdValue let-selectedItems="selectedItems">
            @if ((selectedItems?.length ?? 0) > 1) {
              {{ $any(selectedItems)[0][_lopt.displayField] }} +{{ selectedItems.length - 1 }}
            } @else if ((selectedItems?.length ?? 0) === 1) {
              {{ $any(selectedItems)[0][_lopt.displayField] }}
            }
          </ng-template>
        </sd-select>
      } @else if (field.kind === 'date') {
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar
git commit -m "SM-00: feat(query-bar): chip multi sd-select view shows 'head +N' (custom #sdValue template)"
```

---

## Task 3: query-bar BETWEEN — replace dual pickers with sd-date-range

**Files:** `query-bar.component.html`, `query-bar.component.ts`, `query-bar.component.spec.ts`

- [ ] **Step 1: Write the failing tests** (append)

```ts
  describe('BETWEEN uses sd-date-range', () => {
    const dateField = { key: 'created', label: 'Created', kind: 'date', operators: ['BETWEEN'] } as unknown as SdQueryField;
    const dtField = { key: 'updatedAt', label: 'Updated', kind: 'datetime', operators: ['BETWEEN'] } as unknown as SdQueryField;

    it('build BETWEEN date renders one sd-date-range (not two sd-date)', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dateField]);
      component.beginBuild(dateField);
      fixture.detectChanges();
      const tokens = fixture.nativeElement.querySelectorAll('.c-token-building sd-date-range');
      expect(tokens.length).toBe(1);
      expect(fixture.nativeElement.querySelectorAll('.c-token-building sd-date').length).toBe(0);
    });

    it('build BETWEEN datetime renders one sd-date-range', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dtField]);
      component.beginBuild(dtField);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.c-token-building sd-date-range').length).toBe(1);
      expect(fixture.nativeElement.querySelectorAll('.c-token-building sd-datetime').length).toBe(0);
    });

    it('completed-chip BETWEEN date renders one sd-date-range bound to filter data', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dateField]);
      component.filters.set([{ field: 'created', operator: 'BETWEEN', data: { from: '2024-01-01', to: '2024-01-31' } } as any]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.c-token sd-date-range').length).toBe(1);
    });

    it('setFilterRange(i, ev) writes the full {from,to} payload via updateFilter', () => {
      fixture.componentRef.setInput('mode', 'inline');
      fixture.componentRef.setInput('fields', [dateField]);
      component.filters.set([{ field: 'created', operator: 'BETWEEN', data: { from: null, to: null } } as any]);
      component.setFilterRange(0, { from: '2024-02-01', to: '2024-02-28' });
      expect((component.filters()[0] as any).data).toEqual({ from: '2024-02-01', to: '2024-02-28' });
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: FAIL — chips still render dual sd-date / sd-datetime; `setFilterRange` not a method.

- [ ] **Step 3: Add `setFilterRange` + import `SdDateRange` in TS**

In `query-bar.component.ts`, add to imports:

```ts
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
```

Add `SdDateRange` to the component's `imports` array (next to `SdDate` / `SdDatetime`).

Add the helper next to the existing `updateFilter`:

```ts
  /**
   * Commit both ends of a BETWEEN range at once.
   * why: sd-date-range emits {from,to} via (sdChange) — single call replaces the old
   * setFilterRangeFrom / setFilterRangeTo pair.
   */
  setFilterRange(i: number, ev: { from: unknown; to: unknown } | null): void {
    this.updateFilter(i, { data: ev ?? { from: null, to: null } } as Partial<Filter>);
  }
```

- [ ] **Step 4: Replace the BETWEEN branches in the template**

In `query-bar.component.html`:

**Build chip — date branch (current dual `<sd-date>` for BETWEEN):**

Replace the `@if (_b.operator === 'BETWEEN') { …two sd-date with dash… } @else { …single… }` markup inside the `_b.field.kind === 'date'` block with:

```html
          } @else if (_b.field.kind === 'date') {
            <span class="c-token-value c-token-value-edit">
              @if (_b.operator === 'BETWEEN') {
                <!-- why: 1 control sd-date-range thay 2 sd-date — gọn hơn, behavior thống nhất. -->
                <sd-date-range #bPicker bare size="sm"
                  [autoId]="'qb-build-value'"
                  [model]="$any(_b.value)"
                  (sdChange)="commitBuildValue($event)"></sd-date-range>
              } @else {
                <sd-date #bPicker bare size="sm" autoId="qb-build-value" [model]="$any(_b.value)" (sdChange)="commitBuildValue($event)"></sd-date>
              }
            </span>
```

**Build chip — datetime branch:** mirror exactly, swap `sd-datetime` for the single case but use `sd-date-range` for BETWEEN (datetime downgrades to date precision):

```html
          } @else if (_b.field.kind === 'datetime') {
            <span class="c-token-value c-token-value-edit">
              @if (_b.operator === 'BETWEEN') {
                <!-- why: datetime BETWEEN downgrade về date-range (mất time precision, đã thống nhất). -->
                <sd-date-range #bPicker bare size="sm"
                  [autoId]="'qb-build-value'"
                  [model]="$any(_b.value)"
                  (sdChange)="commitBuildValue($event)"></sd-date-range>
              } @else {
                <sd-datetime #bPicker bare size="sm" autoId="qb-build-value" [model]="$any(_b.value)" (sdChange)="commitBuildValue($event)"></sd-datetime>
              }
            </span>
```

**Completed-chip BETWEEN edit (date or datetime) — collapse to one branch:**

Replace the existing `@else if ((_field.kind === 'date' || _field.kind === 'datetime') && _op === 'BETWEEN') { …dual… }` block with:

```html
              } @else if ((_field.kind === 'date' || _field.kind === 'datetime') && _op === 'BETWEEN') {
                <!-- why: dùng sd-date-range thống nhất cho cả date + datetime BETWEEN (datetime downgrade về date). -->
                <span class="c-token-value c-token-value-edit">
                  <sd-date-range bare size="sm"
                    [autoId]="inlineAutoId(i, 'value')"
                    [viewed]="!isEditingValue(i)"
                    [model]="$any(_data)"
                    (sdChange)="setFilterRange(i, $any($event))"></sd-date-range>
                </span>
```

- [ ] **Step 5: Remove now-unused helpers**

Grep first:

```bash
grep -rn "setFilterRangeFrom\|setFilterRangeTo\|setBuildRangeFrom\|setBuildRangeTo" projects/sdcorejs-angular/components/query-bar/src
```

If only the definitions remain in `query-bar.component.ts` (no template / no spec call), delete them. If a spec test still references the build range helpers, drop those obsolete tests too (their behavior is now covered by sd-date-range commit emitting `{from,to}` directly via `commitBuildValue`).

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts'`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add projects/sdcorejs-angular/components/query-bar
git commit -m "SM-00: feat(query-bar): BETWEEN uses one sd-date-range (date + datetime) + setFilterRange helper"
```

---

## Task 4: Docs refresh

**Files:** `sd-date-range.md`, `sd-query-bar.md` (or `HANDOFF.md` — whichever exists), `CLAUDE.md`

- [ ] **Step 1: Refresh `sd-date-range.md`**

In `projects/sdcorejs-angular/forms/date-range/sd-date-range.md`, add (or update) a section documenting the new inputs / method. Append (or insert after the existing API table) the following:

```markdown
## Bare / viewed / programmatic open

| API | Type | Notes |
|---|---|---|
| `[bare]` | `boolean` | Strips the form-field shell so the control fits inline in a chip / token. Use inside `<sd-query-bar>` BETWEEN or other inline editors. Default `false`. |
| `[viewed]` | `boolean` | Read-only mode — renders `<sd-view>` showing `dd/MM/yyyy → dd/MM/yyyy`. Project an `<ng-template #sdValue>` inside `<sd-date-range>` to override the display. Default `false`. |
| `open()` | method | Programmatically opens the range picker panel (anchors to the trigger). Used by query-bar chip's auto-open after the user enters edit mode. |

`bare` and `viewed` are independent and complementary:
- `viewed=true` → text-only `<sd-view>`, no form-field.
- `bare=true, viewed=false` → editable form-field stripped of outline/subscript/arrow so it sits flush in a chip.
```

- [ ] **Step 2: Refresh `sd-query-bar.md` (or `HANDOFF.md`)**

In `projects/sdcorejs-angular/components/query-bar/sd-query-bar.md` (or `HANDOFF.md` if that's the kept doc — pick the one that exists), add a "Inline chip rendering rules" subsection if missing:

```markdown
## Inline chip rendering rules

- **Multi sd-select (`IN` / `NOT_IN`):** the chip projects a `<ng-template #sdValue>` so the viewed display renders `"<first label> +<N-1>"` instead of the comma-joined default. Mirrors the popover-mode `chipValueText` pattern.
- **`BETWEEN` (date / datetime):** uses one `<sd-date-range bare>` for both the build chip and the completed-chip edit. The `datetime` kind downgrades to date precision (no time picker on the range panel) — committed `{from, to}` carries date values only.
- **viewed-by-default:** completed chips for `values` / `lazy-values` / `date` / `datetime` render their picker with `[viewed]="!isEditingValue(i)"`. Click flips to editable + auto-opens the panel; focusout exits edit.
```

- [ ] **Step 3: Refresh `CLAUDE.md` recent-work bullets**

In `CLAUDE.md` (root `vn-angular/`), append a line under "Recent work" (or whichever heading lists the query-bar iterations):

```markdown
- **2026-05-28** — chip multi sd-select shows "head +N" via projected `#sdValue` template; BETWEEN (date + datetime) uses one `<sd-date-range bare>` (added `bare` / `viewed` / `open()` to sd-date-range). Datetime BETWEEN downgrades to date precision. See `docs/superpowers/specs/2026-05-28-query-bar-multi-view-and-date-range-design.md`.
```

If the open follow-ups list mentions BETWEEN inline editing as deferred, remove that bullet (it's now shipped).

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/forms/date-range/sd-date-range.md projects/sdcorejs-angular/components/query-bar/sd-query-bar.md projects/sdcorejs-angular/components/query-bar/HANDOFF.md CLAUDE.md
git commit -m "SM-00: docs: chip multi 'head +N' + sd-date-range bare/viewed/open"
```

(`git add` will silently ignore any file that doesn't exist — fine.)

---

## Task 5: Full build + combined sweep

**Files:** none (verification only)

- [ ] **Step 1: Lib typecheck**

Run: `npm run build`
Expected: `Built Angular Package`, no errors.

- [ ] **Step 2: Combined sweep**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include='projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/query-bar/src/query-bar.component.spec.ts' \
  --include='projects/sdcorejs-angular/forms/select/src/select.component.spec.ts' \
  --include='projects/sdcorejs-angular/components/operator/src/operator.component.spec.ts'
```

Expected: TOTAL all SUCCESS.

- [ ] **Step 3: Commit any fixup**

```bash
git add -A
git commit -m "SM-00: test(query-bar,date-range): green build + sweep for multi view + BETWEEN unify"
```

(Skip if no changes.)

---

## Self-Review notes

- **Spec coverage:**
  - A. Multi "head +N" → Task 2 (template projection in 4 sd-select sites).
  - B. sd-date-range bare / viewed / open() → Task 1; BETWEEN unify → Task 3; datetime downgrade documented in Task 3 code comment + Task 4 doc.
  - Docs → Task 4. Build/sweep → Task 5.
- **Type consistency:** `setFilterRange(i, { from, to } | null)` matches sd-date-range's `(sdChange)` payload `{from,to}`. `open()` method signature matches `sd-date` / `sd-select` shape. `bare` / `viewed` typed `boolean` with `booleanAttribute` transform. `formatted(): string` consistent.
- **Risk:** the test at Task 1 Step 1 assumes `picker()` is a non-null viewChild after detectChanges. If the spec's existing `StubHost` doesn't include `<sd-date-range>` in its template, add it (or use direct `createComponent(SdDateRange)`). Adapt minimally if the host shape differs.
- **Out of scope:** sd-select / sd-date / sd-datetime source; popover-mode BETWEEN (its 2-control panel layout stays); a datetime-range with time precision.
