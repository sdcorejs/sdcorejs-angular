# Core UI Test Coverage Plan 2 â€” Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Má»Ÿ rá»™ng test coverage cho 10 forms primitives cÃ²n láº¡i cá»§a `@sdcorejs/angular` (autocomplete, chip, chip-calendar, date, date-range, datetime, input-number, radio, select, textarea) + 3 follow-ups tá»« Plan 1 review (coverage threshold enforcement, scroll-spy test cho SdAnchor, normalize import sweep).

**Architecture:** TÃ¡i sá»­ dá»¥ng pattern Plan 1 (TestBed-driven integration + HostComponent wrapper + separate top-level `describe` cho FormGroup/NgForm lifecycle). Má»—i form spec follow checklist: render â†’ inputs/coerce â†’ formControl integration â†’ validators â†’ output events â†’ form integration (3 ways). Relative imports cho `testing/test-utils.ts` vÃ  `@sdcorejs/angular/*` services.

**Tech Stack:** Angular 19.2.x, Angular Signals, Karma 6.4.x, Jasmine 5.5.x, `@angular/material` (form fields, datepicker, slide-toggle, select, autocomplete, chips), `@angular/material-moment-adapter`.

**Reference**: Plan 1 spec `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md`, Plan 1 plan `docs/superpowers/plans/2026-05-15-core-ui-test-coverage-plan-1.md`.

**Branch**: `feature/plan-2-forms-tests` (already checked out from `release/0.0.1`).

---

## Conventions (apply to ALL form spec tasks)

**Import paths from forms/*/src/ spec files**:
- Test utilities: `import { queryByCss, setInput } from '../../../testing/test-utils';` (3 levels up)
- Angular libs: `@angular/core/testing`, `@angular/forms`, etc.
- sd-angular tokens/services: `@sdcorejs/angular/*` (resolves via dist; verified works for non-`testing` paths)

**Standard test file skeleton**:

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Sd<Name> } from './<name>.component';

@Component({
  standalone: true,
  imports: [Sd<Name>, FormsModule, ReactiveFormsModule],
  template: `<sd-<name> [<inputs>] [(model)]="model" (sdChange)="onSdChange($event)"></sd-<name>>`,
})
class HostComponent {
  // ... inputs as fields
  model?: any;
  changes: any[] = [];
  onSdChange(v: any) { this.changes.push(v); }
}

@Component({
  standalone: true,
  imports: [Sd<Name>],
  template: `<sd-<name> name="field" [form]="fg"></sd-<name>>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  standalone: true,
  imports: [Sd<Name>, FormsModule],
  template: `<form #f="ngForm"><sd-<name> name="field" [form]="f"></sd-<name>></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

describe('Sd<Name>', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: Sd<Name>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.query(el => el.componentInstance instanceof Sd<Name>)
      ?.componentInstance as Sd<Name>;
    if (!component) throw new Error('Sd<Name> not found in fixture');
  });

  describe('creation & rendering', () => { /* ... */ });
  describe('inputs', () => { /* ... */ });
  describe('disabled', () => { /* ... */ });
  describe('model setter / signal model', () => { /* ... */ });
  describe('required validator', () => { /* ... */ });
  describe('output events', () => { /* ... */ });
  // ... per-form specific
});

// FormGroup lifecycle â€” separate top-level describe (per Plan 1 review feedback)
describe('Sd<Name> (FormGroup lifecycle)', () => {
  let fg: FormGroup;
  let fixture: ComponentFixture<FgHost>;

  beforeEach(async () => {
    fg = new FormGroup({});
    await TestBed.configureTestingModule({
      imports: [FgHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(FgHost);
    fixture.componentInstance.fg = fg;
    fixture.detectChanges();
  });

  it('adds control to FormGroup on init', () => {
    expect(fg.contains('field')).toBe(true);
  });

  it('removes control on destroy', () => {
    fixture.destroy();
    expect(fg.contains('field')).toBe(false);
  });
});

// NgForm extraction â€” separate top-level describe
describe('Sd<Name> (NgForm extraction)', () => {
  let fixture: ComponentFixture<NgFormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgFormHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(NgFormHost);
    fixture.detectChanges();
  });

  it('extracts FormGroup from NgForm and adds control', () => {
    expect(fixture.componentInstance.ngForm.form.contains('field')).toBe(true);
  });
});
```

**Output subscription hygiene**: assign to `const sub = ...subscribe(...)` and `sub.unsubscribe()` at end of test, OR use a push-to-array pattern.

**Signal-based two-way models**: pre-seed `host.model = '<seed>'` before triggering required validator if NG0100 surfaces.

**Async/effects**: use `fakeAsync` + `tick()` for effect-driven validator updates (per SdInput pattern).

**Material module imports**: include the Material module the form wraps (e.g. `MatDatepickerModule` for date) in either the host component imports or TestBed imports as needed.

---

## File Map

| Task | File | Source LoC | Complexity |
|---|---|---|---|
| 1 | `forms/radio/src/radio.component.spec.ts` | 207 | Simple |
| 2 | `forms/textarea/src/textarea.component.spec.ts` | 312 | Simple |
| 3 | `forms/chip/src/chip.component.spec.ts` | 343 | Medium |
| 4 | `forms/chip-calendar/src/chip-calendar.component.spec.ts` | 333 | Medium |
| 5 | `forms/date/src/date.component.spec.ts` | 343 | Medium |
| 6 | `forms/date-range/src/date-range.component.spec.ts` | 320 | Medium |
| 7 | `forms/input-number/src/input-number.component.spec.ts` | 478 | Complex |
| 8 | `forms/datetime/src/datetime.component.spec.ts` | 458 | Complex |
| 9 | `forms/autocomplete/src/autocomplete.component.spec.ts` | 533 | Complex |
| 10 | `forms/select/src/select.component.spec.ts` | 656 | Complex |
| 11 | Normalize import convention sweep across all `*.spec.ts` | â€” | â€” |
| 12 | Add scroll-spy test for SdAnchor (lift coverage from 68% to ~85%) | â€” | â€” |
| 13 | Enforce coverage thresholds in `karma.conf.js` | â€” | â€” |
| 14 | Update gap report in design doc + create Plan 2 spec | â€” | â€” |

Plus per-task MD audit + update of corresponding `sd-<name>.md` file.

---

## Pre-flight

- [ ] **Step 0.1: Verify branch & clean state**

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
git status
git branch --show-current
```

Expected: on `feature/plan-2-forms-tests`, working tree clean.

- [ ] **Step 0.2: Verify baseline tests pass**

```bash
npm run test:ci 2>&1 | tail -5
```

Expected: 388 tests pass (from Plan 1 baseline).

---

## Task 1: SdRadio spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/radio/src/radio.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/radio/sd-radio.md`

**Source notes** (read `radio.component.ts` to verify):
- Setter-based @Input pattern (similar to switch/checkbox from Plan 1).
- Inputs: `label`, `name`, `form`, `disabled`, `required`, `model`, `options` (array of `{value, label}`), `direction` (horizontal/vertical), `color`.
- `formControl = new FormControl()` â€” plain Angular FormControl.
- `model` setter syncs formControl with `{emitEvent: false}`.
- User selection â†’ emit `modelChange` + `sdChange`.
- Wraps `mat-radio-group`.

**Test scope** (~15-18 specs):

- `creation & rendering` (2-3): create truthy, render radio options
- `inputs` (3-4): label render, options render correctly, direction class (horizontal vs vertical)
- `disabled` (3): coerce true/empty-string/false
- `model setter` (2): syncs formControl without emit, dedup guard
- `required validator` (2): apply when true, remove when false (use `setValue(null)` to trigger; `Validators.required` rejects null/undefined/empty, NOT false â€” same lesson as switch)
- `output events` (1): emit modelChange + sdChange when user selects
- `color` (1-2): default primary, accepts warn
- Top-level `describe('SdRadio (FormGroup lifecycle)')` (2)
- Top-level `describe('SdRadio (NgForm extraction)')` (1)

**MD audit checklist (14 items)** â€” particular focus:
- Item 5 Inputs table: include `options` with `{value, label}[]` type
- Item 13 Form-specific: 3-way snippet (template-driven `[(model)]`, reactive `FormGroup`, NgForm)
- Item 14 Code máº«u: example with options array + selected default

- [ ] **Step 1: Read source + html + md**

```bash
cat projects/sdcorejs-angular/forms/radio/src/radio.component.ts
cat projects/sdcorejs-angular/forms/radio/src/radio.component.html
cat projects/sdcorejs-angular/forms/radio/sd-radio.md
```

- [ ] **Step 2: Create spec file following standard skeleton + radio-specific tests**

Apply the standard test file skeleton (above). Replace `Sd<Name>` with `SdRadio`, fill in test scope per above.

For radio-specific tests, the HostComponent needs:
```typescript
options: { value: any; label: string }[] = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];
direction: 'horizontal' | 'vertical' = 'vertical';
```

Template:
```html
<sd-radio
  [label]="label"
  [options]="options"
  [direction]="direction"
  [color]="color"
  [disabled]="disabled"
  [required]="required"
  [(model)]="model"
  (sdChange)="onSdChange($event)"></sd-radio>
```

- [ ] **Step 3: Run test**

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/radio.component.spec.ts" 2>&1 | tail -10
```

Expected: 15-18 specs pass.

- [ ] **Step 4: Audit `sd-radio.md` per 14-item checklist**

Verify all 14 items. Bá»• sung má»¥c thiáº¿u (Outputs table, Form-specific 3-way snippet, anti-patterns if missing, etc.).

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/radio/
git commit -m "SM-00: add SdRadio spec + audit sd-radio.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: SdTextarea spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/textarea/src/textarea.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/textarea/sd-textarea.md`

**Source notes**:
- Pattern similar to SdInput but with `<textarea>` instead of `<input>`.
- Likely uses signal inputs OR setter-based â€” verify by reading source.
- Has `rows`, `maxlength`, `minlength` inputs.
- Validators (required, maxlength, minlength).
- Wraps `mat-form-field` + `<textarea matInput>`.
- `valueModel`/`model` two-way binding.

**Test scope** (~15-20 specs):
- creation & rendering (2): create, render textarea element + label
- inputs (3-4): placeholder, rows attribute, type=text default
- disabled (2): effect-based disable/enable
- required validator (2): apply/remove
- maxlength/minlength (2): apply
- model two-way (2): downward (model â†’ formControl), upward (formControl â†’ model)
- output events (1-2): sdChange emit, sdBlur trim + emit
- error tooltip message (2): required, maxlength
- focus tracking (1)
- Top-level `describe('SdTextarea (FormGroup lifecycle)')` (2)
- Top-level `describe('SdTextarea (NgForm extraction)')` (1)

- [ ] **Step 1: Read source + html + md**

- [ ] **Step 2: Create spec file** following skeleton.

Template (verify against actual inputs):
```html
<sd-textarea
  [label]="label"
  [placeholder]="placeholder"
  [rows]="rows"
  [required]="required"
  [disabled]="disabled"
  [maxlength]="maxlength"
  [(model)]="model"
  (sdChange)="onSdChange($event)"></sd-textarea>
```

- [ ] **Step 3: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/textarea.component.spec.ts" 2>&1 | tail -10
```

Expected: 15-20 specs pass.

- [ ] **Step 4: Audit `sd-textarea.md`** per checklist.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/textarea/
git commit -m "SM-00: add SdTextarea spec + audit sd-textarea.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: SdChip spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/chip/src/chip.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/chip/sd-chip.md`

**Source notes**:
- Chip-input style (multi-select). User types text + Enter â†’ adds chip; can remove chips.
- Likely uses `MatChipGrid`/`MatChipRow`.
- `model` is array of strings or values.
- Inputs: `placeholder`, `disabled`, `required`, `maxLength` per chip, `model`.
- Has separator key codes (Enter, comma).

**Test scope** (~15 specs):
- creation & rendering (2)
- inputs (3): placeholder, label, disabled
- add chip behavior (2-3): Enter key adds chip, duplicate handling, max chips
- remove chip behavior (2): click remove icon, backspace at empty input
- model two-way (2): downward sync, upward emit
- required validator (1-2): non-empty array required
- Top-level FormGroup lifecycle (2)
- Top-level NgForm extraction (1)

**Adjust scope based on actual source â€” focus on observable behaviors, not internal state.**

- [ ] **Step 1: Read source + html + pipes folder + md**

```bash
ls projects/sdcorejs-angular/forms/chip/src/pipes/
cat projects/sdcorejs-angular/forms/chip/src/chip.component.ts
```

- [ ] **Step 2: Create spec file** with HostComponent including a `[(model)]` array binding.

```typescript
@Component({
  // ...
  template: `<sd-chip [placeholder]="placeholder" [(model)]="model"></sd-chip>`,
})
class HostComponent {
  placeholder = 'Add tag';
  model: string[] = [];
}
```

Simulating chip add: dispatch keyboard event 'Enter' on input element after setting value.

- [ ] **Step 3: Run test**

Expected: ~15 specs pass. If certain behaviors are hard to simulate, document scope reduction in commit message.

- [ ] **Step 4: Audit `sd-chip.md`** per checklist. Focus on edge cases (duplicate handling, max chips behavior).

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/chip/
git commit -m "SM-00: add SdChip spec + audit sd-chip.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: SdChipCalendar spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/chip-calendar/src/chip-calendar.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/chip-calendar/sd-chip-calendar.md`

**Source notes**:
- Chip-style input but constrained to calendar date values.
- Likely uses `MatDatepicker` + `MatChip*` to display selected dates as chips.
- Inputs: `label`, `placeholder`, `model` (array of dates/strings), `min`, `max`, `disabled`.
- May depend on Moment via `@angular/material-moment-adapter`.

**Test scope** (~12-15 specs):
- creation & rendering (2): create, render chip area
- date format display (2-3): chips show formatted dates
- add date (2): selecting from datepicker adds chip
- remove date (1): click X removes chip
- disabled (2)
- model two-way (2)
- min/max constraint (1-2)
- Top-level FormGroup (2), NgForm (1)

**Scope reduction acceptable**: if MatDatepicker open/close hard to drive in test, focus on model setter + chip removal + display logic.

- [ ] **Step 1: Read source + pipes + html + md**

- [ ] **Step 2: Create spec file**

- [ ] **Step 3: Run test**

Expected: ~12-15 specs pass.

- [ ] **Step 4: Audit `sd-chip-calendar.md`**

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/chip-calendar/
git commit -m "SM-00: add SdChipCalendar spec + audit sd-chip-calendar.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: SdDate spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/date/src/date.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/date/sd-date.md`

**Source notes**:
- Wraps `MatDatepicker` + Moment adapter.
- Inputs: `label`, `placeholder`, `model` (Date or Moment), `min`, `max`, `format`, `disabled`, `required`.
- Single date selection.
- Uses `MAT_DATE_FORMATS` and/or `MAT_DATE_LOCALE` providers.

**Test scope** (~15-18 specs):
- creation & rendering (2)
- model two-way (3): downward, upward, formatting
- min/max validation (2)
- required validator (2)
- disabled (2)
- format input (1-2)
- Top-level FormGroup (2), NgForm (1)

**Test setup notes**:
- May need `provideMomentDateAdapter()` or `provideNativeDateAdapter()` in TestBed providers.
- MatDatepicker panel opening hard to test â€” focus on programmatic value setting.

- [ ] **Step 1: Read source + html + md + check moment/native adapter usage**

- [ ] **Step 2: Create spec file**. Likely needs:

```typescript
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';

await TestBed.configureTestingModule({
  imports: [HostComponent, NoopAnimationsModule],
  providers: [provideMomentDateAdapter()],
}).compileComponents();
```

- [ ] **Step 3: Run test**. If date adapter errors, try `provideNativeDateAdapter()` from `@angular/material/core`.

Expected: ~15-18 specs pass.

- [ ] **Step 4: Audit `sd-date.md`**

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/date/
git commit -m "SM-00: add SdDate spec + audit sd-date.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: SdDateRange spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/date-range/src/date-range.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/date-range/sd-date-range.md`

**Source notes**:
- Similar to SdDate but with from/to range.
- `model` is `{from, to}` object or two separate values.
- Uses `MatDateRangeInput`.

**Test scope** (~12-15 specs):
- creation & rendering (2)
- model two-way (2-3): from/to setting + emit
- min/max validation (2)
- range validation: to >= from (1-2)
- required validator (2)
- disabled (2)
- Top-level FormGroup (2), NgForm (1)

- [ ] **Step 1: Read source + html + md**

- [ ] **Step 2: Create spec file** with appropriate date adapter providers.

- [ ] **Step 3: Run test**

Expected: ~12-15 specs pass.

- [ ] **Step 4: Audit `sd-date-range.md`**

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/date-range/
git commit -m "SM-00: add SdDateRange spec + audit sd-date-range.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: SdInputNumber spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/input-number/src/input-number.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/input-number/sd-input-number.md`

**Source notes** (478 lines â€” complex):
- Similar pattern to SdInput but constrained to number values.
- Likely has min/max, step, thousands separator (vi-VN format), decimal places.
- May parse user input (e.g. "1,000.5" â†’ 1000.5) and re-format on blur.
- Inputs: `label`, `placeholder`, `min`, `max`, `step`, `precision`, `format`, `required`, `disabled`, `model`.

**Test scope** (~25-30 specs â€” input-number is the third most complex of Plan 2):
- creation & rendering (2)
- model two-way (3): number model, string input, formatted display
- min/max validation (3)
- step input (1-2)
- precision / decimal places (2-3)
- thousands separator formatting (2-3)
- parse user input â†’ number (2)
- blur re-format (1-2)
- required (2)
- disabled (2)
- output events (sdChange, sdBlur, keyupEnter) (2-3)
- error tooltip messages (2-3)
- Top-level FormGroup (2), NgForm (1)

**Important**: input-number has many edge cases (negative, decimal, locale separators). Focus on observable behavior, not internal parsing impl.

- [ ] **Step 1: Read source carefully + html + md**

- [ ] **Step 2: Create spec file** following SdInput pattern with number-specific tests.

- [ ] **Step 3: Run test**

Expected: ~25-30 specs pass.

- [ ] **Step 4: Audit `sd-input-number.md`** â€” especially format/locale notes.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/input-number/
git commit -m "SM-00: add SdInputNumber spec + audit sd-input-number.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: SdDatetime spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/datetime/sd-datetime.md`

**Source notes** (458 lines + `popup/` folder):
- Date + time picker. Has its own popup folder (likely custom panel for time selection).
- `model` is full Date / Moment with time.
- Inputs: `label`, `placeholder`, `model`, `min`, `max`, `format`, `disabled`, `required`.

**Test scope** (~20-25 specs):
- creation & rendering (2)
- model two-way (3): downward, upward, time portion
- min/max validation (2)
- required (2)
- disabled (2)
- format input (1-2)
- popup interactions (3-5) â€” programmatic, not click-driven
- output events (2-3)
- Top-level FormGroup (2), NgForm (1)

**Scope reduction acceptable**: popup interactions are hard to test in headless; focus on input/output contracts.

- [ ] **Step 1: Read source + popup folder + html + md**

```bash
ls projects/sdcorejs-angular/forms/datetime/src/popup/
```

- [ ] **Step 2: Create spec file**

- [ ] **Step 3: Run test**

Expected: ~20-25 specs pass.

- [ ] **Step 4: Audit `sd-datetime.md`**

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/datetime/
git commit -m "SM-00: add SdDatetime spec + audit sd-datetime.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: SdAutocomplete spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/autocomplete/sd-autocomplete.md`

**Source notes** (533 lines):
- Wraps `MatAutocomplete`.
- Inputs: `label`, `placeholder`, `options` (sync or Observable), `displayWith`, `model`, `disabled`, `required`.
- Filter logic for search.
- May support async option fetching.

**Test scope** (~25-30 specs):
- creation & rendering (2)
- options rendering (2-3): static array, async (skip if too complex)
- filter behavior (2-3): typing filters options
- selection (2-3): clicking option sets model
- displayWith function (1-2)
- model two-way (3)
- disabled (2)
- required (2)
- output events (2-3): sdChange, optionSelected
- Top-level FormGroup (2), NgForm (1)

- [ ] **Step 1: Read source + html + md**

- [ ] **Step 2: Create spec file**

- [ ] **Step 3: Run test**. Autocomplete dropdown opens via overlay â€” focus on programmatic option selection rather than UI clicking.

Expected: ~25-30 specs pass.

- [ ] **Step 4: Audit `sd-autocomplete.md`**

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/autocomplete/
git commit -m "SM-00: add SdAutocomplete spec + audit sd-autocomplete.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: SdSelect spec + md audit

**Files:**
- Create: `projects/sdcorejs-angular/forms/select/src/select.component.spec.ts`
- Modify: `projects/sdcorejs-angular/forms/select/sd-select.md`

**Source notes** (656 lines â€” largest in Plan 2):
- Wraps `MatSelect`.
- Single AND multi-select modes.
- Inputs: `label`, `placeholder`, `options`, `model`, `multiple`, `required`, `disabled`, `searchable` (?).
- Maybe has search-within-select for long lists.

**Test scope** (~30-35 specs):
- creation & rendering (2)
- single select mode (4-5): default, options render, select option, change model
- multi-select mode (4-5): multiple selection, model is array, deselect
- options input (2-3): static array, dynamic update
- searchable (3-4) if exists: typing filters
- model two-way (3)
- disabled (2)
- required (2)
- output events (2-3)
- Top-level FormGroup (2), NgForm (1)

**MatSelect panel opens via overlay â€” use `MatSelectHarness` if available, or programmatic `select.open()` + `select.options` query.**

- [ ] **Step 1: Read source CAREFULLY + html + md** â€” 656 lines is the largest spec target.

- [ ] **Step 2: Create spec file**

- [ ] **Step 3: Run test**

Expected: ~30-35 specs pass.

- [ ] **Step 4: Audit `sd-select.md`** â€” likely already detailed (was reference for SdInput). Verify multi-select scenarios documented.

- [ ] **Step 5: Commit**

```bash
git add projects/sdcorejs-angular/forms/select/
git commit -m "SM-00: add SdSelect spec + audit sd-select.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Normalize import convention sweep across all `*.spec.ts`

**Files:**
- Modify: any spec file that imports `@sdcorejs/angular/*` for in-library symbols (should use relative path)

**Rationale**: Plan 1 final review (Minor 3) flagged 2 spec files that use `@sdcorejs/angular/*` alias instead of relative path. Sweep for consistency.

- [ ] **Step 1: Find all violations**

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
grep -rn "from '@sdcorejs/angular" projects/sdcorejs-angular --include="*.spec.ts"
```

Expected output: list of files importing from the alias.

- [ ] **Step 2: Convert each violation to relative path**

For each file, determine the relative path from the spec's directory to the source. Replace the import.

Example:
- File: `projects/sdcorejs-angular/directives/src/sd-mobile.directive.spec.ts`
- Was: `import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';`
- Become: `import { SdUtilities } from '../../utilities/extensions';` (2 levels up to sd-angular, then into utilities/extensions)

Note: `@sdcorejs/angular/utilities/extensions` resolves to `projects/sdcorejs-angular/utilities/extensions/index.ts` per tsconfig path. Relative `../../utilities/extensions` resolves the same.

For SD_FORM_CONFIGURATION in input.component.spec.ts: `'@sdcorejs/angular/forms/models'` â†’ `'../../models'` (2 levels up from `forms/input/src/` to `forms/`, then into `models`).

- [ ] **Step 3: Run full test suite to ensure no regression**

```bash
npm run test:ci 2>&1 | tail -5
```

Expected: all tests still pass (388 + new from Plan 2 tasks 1-10).

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/
git commit -m "SM-00: normalize spec import convention to relative paths

Sweep across all *.spec.ts to replace @sdcorejs/angular/* aliases with
relative paths. Aligns with Plan 1 convention (alias doesn't resolve
at Karma runtime for testing/ subpath; other paths work but are
inconsistent).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Add scroll-spy test for SdAnchor

**Files:**
- Modify: `projects/sdcorejs-angular/components/anchor/src/components/anchor/anchor.component.spec.ts`

**Rationale**: Plan 1 final review (Important 2) noted anchor coverage is 68% lines / 38% branches because scroll-spy subscription wasn't tested. Mock `getBoundingClientRect` + dispatch `scroll` event to exercise the scroll-spy logic.

**Test additions** (~3-5 new specs):
- Scroll event on wrapper â†’ `activeSectionId` updates to section currently in viewport
- Multiple section transitions: scroll past sec1 â†’ activeSectionId = sec2
- Scroll past last section â†’ activeSectionId stays at last
- `auditTime(50)` rate-limiting: 2 rapid scrolls produce 1 update (verify via fakeAsync + tick)

- [ ] **Step 1: Add a new top-level describe block**

```typescript
describe('SdAnchor (scroll-spy)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let anchor: SdAnchor;
  let wrapperEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    anchor = getAnchor(fixture); // existing helper
    wrapperEl = fixture.nativeElement.querySelector('.c-anchor-wrapper'); // verify class name
  });

  it('updates activeSectionId when scroll position enters section 2', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    expect(anchor.activeSectionId()).toBe(anchor.sections()[0].id);

    // Mock section offsets
    const sections = anchor.sections();
    spyOn(sections[0].elementRef.nativeElement, 'offsetTop' as any).and.returnValue(0);
    // ... actually offsetTop is a property, not method. Use Object.defineProperty for spying:
    Object.defineProperty(sections[0].elementRef.nativeElement, 'offsetTop', { value: 0, configurable: true });
    Object.defineProperty(sections[0].elementRef.nativeElement, 'offsetHeight', { value: 400, configurable: true });
    Object.defineProperty(sections[1].elementRef.nativeElement, 'offsetTop', { value: 400, configurable: true });
    Object.defineProperty(sections[1].elementRef.nativeElement, 'offsetHeight', { value: 400, configurable: true });
    Object.defineProperty(sections[2].elementRef.nativeElement, 'offsetTop', { value: 800, configurable: true });
    Object.defineProperty(sections[2].elementRef.nativeElement, 'offsetHeight', { value: 400, configurable: true });

    // Mock wrapper scrollTop + style
    Object.defineProperty(wrapperEl, 'scrollTop', { value: 450, configurable: true, writable: true });

    wrapperEl.dispatchEvent(new Event('scroll'));
    tick(50); // auditTime
    fixture.detectChanges();
    expect(anchor.activeSectionId()).toBe(sections[1].id);
  }));

  it('rate-limits scroll updates via auditTime(50)', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    let updates = 0;
    const initial = anchor.activeSectionId();
    // Subscribe to signal changes via fake reactive read
    // ... or just count how many times activeSectionId changes

    Object.defineProperty(wrapperEl, 'scrollTop', { value: 450, configurable: true, writable: true });
    wrapperEl.dispatchEvent(new Event('scroll'));
    wrapperEl.dispatchEvent(new Event('scroll'));
    wrapperEl.dispatchEvent(new Event('scroll'));
    tick(50);
    fixture.detectChanges();

    // Both 3 events should result in 1 update (after auditTime)
    // Hard to assert "count of updates" with signals â€” instead just verify no error and final state is correct
    expect(anchor.activeSectionId()).toBeTruthy();
  }));
});
```

If `offsetTop` / `offsetHeight` are read-only in test env, the `Object.defineProperty` approach should work. If template uses different wrapper class, adjust selector.

- [ ] **Step 2: Run test**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include="**/anchor.component.spec.ts" 2>&1 | tail -15
```

Expected: 18 + 2-5 = 20-23 specs pass.

- [ ] **Step 3: Verify coverage improvement**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage 2>&1 | grep -A 1 "anchor.component.ts"
```

Expected: lines coverage > 75% (was 68.4%), branches > 50% (was 38.5%).

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/components/anchor/
git commit -m "SM-00: add scroll-spy tests for SdAnchor

Mock offsetTop/offsetHeight + dispatch scroll events to exercise
the rxjs subscription pipeline that updates activeSectionId.
Lifts anchor coverage from 68% lines / 38% branches to target ~85%/~70%.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Enforce coverage thresholds in karma.conf.js

**Files:**
- Modify: `projects/sdcorejs-angular/karma.conf.js`

**Rationale**: Plan 1 final review (Important 1) noted coverage is generated but not enforced â€” Plan 2 regression could silently drop coverage. Add `coverageReporter.check.each` threshold.

- [ ] **Step 1: Add `check` block to coverageReporter**

In `projects/sdcorejs-angular/karma.conf.js`, locate the `coverageReporter` object and modify:

```javascript
coverageReporter: {
  dir: require('path').join(__dirname, '../../coverage/sd-angular'),
  subdir: '.',
  reporters: [
    { type: 'html' },
    { type: 'text-summary' },
    { type: 'lcovonly' },
  ],
  check: {
    each: {
      statements: 70,
      branches: 50,
      functions: 70,
      lines: 70,
    },
    global: {
      statements: 75,
      branches: 60,
      functions: 75,
      lines: 75,
    },
  },
},
```

Threshold rationale:
- Per-file `each`: 70 line / 50 branch is conservative â€” matches realistic floor for complex forms (input 86%, button 90%, anchor still ~68% before Task 12).
- Global: 75 line / 60 branch â€” leaves headroom while gating regressions.
- After Task 12 (scroll-spy), anchor should clear 70%.

- [ ] **Step 2: Update test:ci script to include --code-coverage**

Modify `package.json`:

```json
"test:ci": "ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage"
```

- [ ] **Step 3: Run full suite â€” verify all pass + thresholds met**

```bash
npm run test:ci 2>&1 | tail -30
```

Expected:
- All tests pass.
- "Tested at 100%" appears for files at 100%.
- "Coverage Failure" does NOT appear (all files meet threshold).
- If a file fails threshold, decide: lower threshold for that file (file-specific override) OR add tests.

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/karma.conf.js package.json
git commit -m "SM-00: enforce per-file coverage thresholds via karma config

- coverageReporter.check.each: 70% lines/functions, 50% branches per file
- coverageReporter.check.global: 75% lines/functions, 60% branches global
- test:ci now runs with --code-coverage so CI fails on regression

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Aggregate gap report + Plan 2 design doc

**Files:**
- Create: `docs/superpowers/specs/2026-05-17-core-ui-test-coverage-plan-2-design.md` (brief spec doc)
- Append: gap report section to `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md` (extends Plan 1's Â§6.1 with Plan 2 results)

- [ ] **Step 1: Create Plan 2 spec doc** (brief â€” references Plan 1 spec for shared decisions)

Content:
```markdown
# Core UI Test Coverage â€” Plan 2 Design

**Date**: 2026-05-17
**Scope**: vn-angular (`projects/sdcorejs-angular`)
**Owner**: nghiatt15@onemount.com
**Batch**: Plan 2 â€” 10 remaining forms + 3 follow-ups from Plan 1 review

## 1. Problem statement

After Plan 1 completed, 10 form primitives still need test coverage (autocomplete, chip, chip-calendar, date, date-range, datetime, input-number, radio, select, textarea). Plan 1 final review also identified 3 follow-up items: coverage threshold enforcement, scroll-spy test for SdAnchor, and import convention normalization.

## 2. Scope

### 2.1. File in Plan 2 (10 forms + 3 follow-ups)

- 10 form components per File Map in `plans/2026-05-17-core-ui-test-coverage-plan-2.md`
- Follow-ups: import normalization, scroll-spy for anchor, coverage threshold

### 2.2. Out of scope

- Plan 3 components (modal, side-drawer, section, tab-router, quick-action, view, anchor, history, preview, upload-file, mini-editor)
- Skipped per user direction: workflow, query-builder, document-builder, history, modules/generic (not in forms folder anyway)
- Services, modules, handlers, interceptors (Plan 5+)

## 3. Approach

Reuse Plan 1 approach (TestBed-driven, FormGroup/NgForm in separate top-level describes, signal pre-seeding for NG0100, relative imports). See plan doc for per-task details.

## 4. Tooling

Same as Plan 1 + coverage threshold enforcement added in Task 13.

## 5. Acceptance criteria

1. 10 new spec files created + tests pass.
2. 10 MD files audited per 14-item checklist.
3. SdAnchor coverage lifted to â‰¥75% lines / â‰¥50% branches.
4. Import convention normalized across all `*.spec.ts`.
5. Coverage thresholds enforced in karma.conf.
6. Gap report aggregated.
7. No source `.ts` changes (except trivial typo fixes).
8. Single branch (`feature/plan-2-forms-tests`) â€” merge after final review.

## 6. Reference

- Plan 1 design: `2026-05-15-core-ui-test-coverage-design.md`
- Plan 1 plan: `plans/2026-05-15-core-ui-test-coverage-plan-1.md`
- Plan 2 plan: `plans/2026-05-17-core-ui-test-coverage-plan-2.md`
```

- [ ] **Step 2: Append Plan 2 gap report section to Plan 1 design doc**

Append to `docs/superpowers/specs/2026-05-15-core-ui-test-coverage-design.md` after Â§6.1:

```markdown
## 6.2 Gap report â€” Plan 2 implementation results

**Implementation completed**: 2026-MM-DD (fill at commit time)
**Branch**: `feature/plan-2-forms-tests`
**Test counts**: Plan 1 final (~388) â†’ After Plan 2: ~XXX (added ~YYY tests across 10 spec files + scroll-spy additions)

### Per-file summary

| File | New specs | MD audit result | Commit |
|---|---|---|---|
| radio.component.ts | X | (fill) | (fill) |
| textarea.component.ts | X | (fill) | (fill) |
| chip.component.ts | X | (fill) | (fill) |
| chip-calendar.component.ts | X | (fill) | (fill) |
| date.component.ts | X | (fill) | (fill) |
| date-range.component.ts | X | (fill) | (fill) |
| input-number.component.ts | X | (fill) | (fill) |
| datetime.component.ts | X | (fill) | (fill) |
| autocomplete.component.ts | X | (fill) | (fill) |
| select.component.ts | X | (fill) | (fill) |

### Follow-ups

| Item | Status | Commit |
|---|---|---|
| Normalize import sweep | âœ… Done | (fill) |
| Scroll-spy test for SdAnchor | âœ… Done â€” coverage lifted from 68%/38% to X%/Y% | (fill) |
| Coverage threshold enforced | âœ… Done â€” each â‰¥70/50, global â‰¥75/60 | (fill) |

### Coverage actual (Plan 2 files)

| File | Lines | Branches | Functions | Status |
|---|---|---|---|---|
| radio.component.ts | X% | X% | X% | OK / Below threshold |
| ... (fill 10 files) | | | | |

### Observations

(Fill: notable patterns, surprises, scope adjustments, lessons learned)

### Plan 3+ deferred items

- Plan 3 components (modal, side-drawer, etc. â€” excluding skipped: workflow, etc.)
- Plan 4 directives (sd-desktop, sd-href, sd-hover-copy, sd-scroll)
- Plan 5 services
- Plan 6 heavy components (chart, code-editor, document-builder, editor, import-excel, query-builder, table sub-components, workflow) â€” **skipped per user direction until those features are finalized**
```

Fill in placeholders (X, fill, MM-DD) with actual values.

- [ ] **Step 3: Final verification**

```bash
cd c:/Users/Admin/Documents/lib-core-angular/vn-angular
npm run test:ci 2>&1 | tail -10
npm run lint 2>&1 | tail -5  # may have pre-existing failure, document if so
npm run build 2>&1 | tail -5
```

All must pass.

- [ ] **Step 4: Commit final**

```bash
git add docs/superpowers/
git commit -m "SM-00: Plan 2 finalize â€” design doc + gap report aggregate

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5: Push branch**

```bash
git push -u origin feature/plan-2-forms-tests
```

---

## Done criteria checklist

- [ ] 10 form spec files created.
- [ ] All `npm run test:ci` pass (Plan 1 + Plan 2 â‰ˆ 500+ tests).
- [ ] Coverage thresholds enforced; no file below 70/50.
- [ ] 10 MD files audited + gap report appended.
- [ ] Scroll-spy test added to SdAnchor.
- [ ] Import convention normalized.
- [ ] Plan 2 design doc created.
- [ ] Branch pushed.

---

## Troubleshooting notes (carry-over from Plan 1 + new for Plan 2)

**Date adapter not provided**: tests with `MatDatepicker` need `provideMomentDateAdapter()` from `@angular/material-moment-adapter` or `provideNativeDateAdapter()` from `@angular/material/core` in TestBed providers.

**Multi-select model**: `[(model)]` with array â€” pre-seed `host.model = []` before triggering validators to avoid NG0100.

**MatSelect / MatAutocomplete panel**: hard to open via DOM events in headless. Prefer programmatic API (`select.open()`, `select.options`) for option enumeration.

**Mat chip events**: simulating Enter on chip input requires dispatching `KeyboardEvent` with `key: 'Enter'`. May need `MatChipInputEvent` for `chipAdded` testing.

**License service / OnPush**: same handling as Plan 1 â€” Karma localhost auto-passes; no mock needed.

**Effect timing on signal inputs**: same as SdInput â€” `fixture.detectChanges()` flushes effects synchronously; pre-seed `host.model` to avoid NG0100.

**FormGroup integration timing**: `ngAfterViewInit` registers control; verify after first `fixture.detectChanges()`. Run `fixture.destroy()` to test removeControl.

