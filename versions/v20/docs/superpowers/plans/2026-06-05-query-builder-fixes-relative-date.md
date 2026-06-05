# Query Builder Fixes + Relative Date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three regressions in the rebuilt `<sd-query-builder>` (tall rows, clearable field, boolean-field OOM) and add relative-date values (now / previous-next day·week·month) for date & datetime single-value rules.

**Architecture:** Pure helpers + serializer round-trip stay in `query-builder.model.ts` / `query-builder.serializer.ts` (TDD-first, no DOM). The component derives the date "mode" from the rule value (no extra state), exposes stable option constants, and memoizes boolean options so `sd-select`'s `toObservable(items)` no longer loops. The emitted contract is a structured `{ rel, unit, amount, direction }` object inside `Filter.data`.

**Tech Stack:** Angular 19 standalone + signals, Karma/Jasmine (ChromeHeadless), `@sdcorejs/utils` `Filter`/`Operator`.

**Spec:** `docs/superpowers/specs/2026-06-05-query-builder-fixes-relative-date-design.md`

**Commands:**
- Single spec: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='<spec-path>'`
- Build (real typecheck gate): `npm run build`

> **Commit policy:** Commit steps below follow the TDD rhythm, but per this repo's harness rule commits happen only when the user asks. During execution, stage as described and pause for the user's go-ahead before each `git commit` (or batch them). Commit messages end with the `Co-Authored-By: Claude …` trailer; use a bash here-doc (gitlab pre-receive lint).

---

## File Structure

- **Modify** `projects/sdcorejs-angular/components/query-builder/src/query-builder.model.ts` — add `SdQbRelativeUnit`, `SdQbRelativeDirection`, `SdQbRelativeDate`, `QbDateMode`, `qbIsRelativeDate()`, `qbDefaultRelative()`, `QB_DATE_MODES`, `QB_RELATIVE_UNIT_OPTIONS`, `QB_EMPTY_OPTIONS`.
- **Create** `projects/sdcorejs-angular/components/query-builder/src/query-builder.model.spec.ts` — unit tests for the new pure helpers.
- **Modify** `projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.ts` — emit/round-trip relative objects + render relative view tokens.
- **Modify** `projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.spec.ts` — relative emit / round-trip / token tests.
- **Modify** `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts` — `setField` clear-guard, relative-aware `#reshapeValue`, memoized boolean options, date-mode helpers, exposed option constants.
- **Modify** `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.html` — `hideInlineError` on every editor; date/datetime single-value branch gains the mode select + conditional absolute/now/relative editors.
- **Modify** `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.scss` — layout for the relative row.
- **Modify** `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts` — clear-guard, OOM-ref-stability, date-mode helper + DOM tests.
- **Modify** `projects/showcase/src/app/pages/components/query-builder/query-builder-demo.component.ts` — add a datetime field + relative-date section.
- **Modify** `projects/sdcorejs-angular/components/query-builder/sd-query-builder.md` — document new model, date-mode editor, swap-only field, compact rows.

---

## Task 1: Relative-date model + pure helpers

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-builder/src/query-builder.model.ts`
- Test: `projects/sdcorejs-angular/components/query-builder/src/query-builder.model.spec.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `query-builder.model.spec.ts`:

```ts
import {
  QB_DATE_MODES,
  QB_RELATIVE_UNIT_OPTIONS,
  qbDefaultRelative,
  qbIsRelativeDate,
} from './query-builder.model';

describe('query-builder.model › relative date helpers', () => {
  it('qbIsRelativeDate recognises now + offset objects', () => {
    expect(qbIsRelativeDate({ rel: 'now' })).toBe(true);
    expect(qbIsRelativeDate({ rel: 'offset', unit: 'day', amount: 3, direction: 'previous' })).toBe(true);
  });

  it('qbIsRelativeDate rejects non-relative values', () => {
    expect(qbIsRelativeDate(null)).toBe(false);
    expect(qbIsRelativeDate('2026-01-01')).toBe(false);
    expect(qbIsRelativeDate(100)).toBe(false);
    expect(qbIsRelativeDate({ from: 1, to: 2 })).toBe(false);
    expect(qbIsRelativeDate({ rel: 'bogus' })).toBe(false);
  });

  it('qbDefaultRelative returns 1 day previous offset', () => {
    expect(qbDefaultRelative()).toEqual({ rel: 'offset', unit: 'day', amount: 1, direction: 'previous' });
  });

  it('qbDefaultRelative returns a fresh object each call (no shared mutable ref)', () => {
    expect(qbDefaultRelative()).not.toBe(qbDefaultRelative());
  });

  it('QB_DATE_MODES exposes absolute / now / relative', () => {
    expect(QB_DATE_MODES.map(m => m.value)).toEqual(['absolute', 'now', 'relative']);
  });

  it('QB_RELATIVE_UNIT_OPTIONS lists the 6 unit×direction tokens with VN labels', () => {
    expect(QB_RELATIVE_UNIT_OPTIONS.map(o => o.value)).toEqual([
      'day:previous', 'day:next', 'week:previous', 'week:next', 'month:previous', 'month:next',
    ]);
    expect(QB_RELATIVE_UNIT_OPTIONS.find(o => o.value === 'day:previous')!.display).toBe('ngày trước');
    expect(QB_RELATIVE_UNIT_OPTIONS.find(o => o.value === 'month:next')!.display).toBe('tháng tới');
  });

  it('QB_DATE_MODES / QB_RELATIVE_UNIT_OPTIONS are stable module references', () => {
    expect(QB_DATE_MODES).toBe(QB_DATE_MODES);
    expect(QB_RELATIVE_UNIT_OPTIONS).toBe(QB_RELATIVE_UNIT_OPTIONS);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.model.spec.ts'`
Expected: FAIL — `qbIsRelativeDate` / `qbDefaultRelative` / `QB_DATE_MODES` / `QB_RELATIVE_UNIT_OPTIONS` are not exported.

- [ ] **Step 3: Write minimal implementation**

In `query-builder.model.ts`, add after the existing `SdQueryBuilderFieldOption` / type-helpers section (near the operator-vocabulary block). Add the types + helpers:

```ts
// ---------------------------------------------------------------------------
// Relative dates — a date/datetime rule's value may be a relative spec resolved
// at query time on the backend, instead of an absolute picked date. Emitted as a
// structured object inside Filter.data. Only for single-value operators (not BETWEEN).
// ---------------------------------------------------------------------------

/** Offset unit for a relative date. */
export type SdQbRelativeUnit = 'day' | 'week' | 'month';

/** Offset direction for a relative date. */
export type SdQbRelativeDirection = 'previous' | 'next';

/** A relative (resolved-at-query-time) date value stored in `Filter.data`. */
export interface SdQbRelativeDate {
  /** `'now'` = current moment / today · `'offset'` = now ± amount × unit. */
  rel: 'now' | 'offset';
  /** Offset unit — only for `rel: 'offset'`. */
  unit?: SdQbRelativeUnit;
  /** Offset magnitude (>= 1) — only for `rel: 'offset'`. */
  amount?: number;
  /** Offset direction — only for `rel: 'offset'`. */
  direction?: SdQbRelativeDirection;
}

/** Date value editor mode for a date/datetime rule (derived from the rule value). */
export type QbDateMode = 'absolute' | 'now' | 'relative';

/** Type guard — narrows an arbitrary value to a relative-date spec. */
export function qbIsRelativeDate(v: any): v is SdQbRelativeDate {
  return !!v && typeof v === 'object' && (v.rel === 'now' || v.rel === 'offset');
}

/** Starting relative value when a rule first switches to "relative" mode. */
export function qbDefaultRelative(): SdQbRelativeDate {
  return { rel: 'offset', unit: 'day', amount: 1, direction: 'previous' };
}

/** Stable option list for the date-mode select (module ref — never reallocated). */
export const QB_DATE_MODES: ReadonlyArray<{ value: QbDateMode; display: string }> = [
  { value: 'absolute', display: 'Ngày cụ thể' },
  { value: 'now', display: 'Hôm nay' },
  { value: 'relative', display: 'Tương đối' },
];

/** Stable combined direction×unit option list (token `'unit:direction'`). */
export const QB_RELATIVE_UNIT_OPTIONS: ReadonlyArray<{ value: string; display: string }> = [
  { value: 'day:previous', display: 'ngày trước' },
  { value: 'day:next', display: 'ngày tới' },
  { value: 'week:previous', display: 'tuần trước' },
  { value: 'week:next', display: 'tuần tới' },
  { value: 'month:previous', display: 'tháng trước' },
  { value: 'month:next', display: 'tháng tới' },
];

/** Shared empty option array — stable ref for fallbacks (avoids per-call allocation). */
export const QB_EMPTY_OPTIONS: SdQueryBuilderFieldOption[] = [];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.model.spec.ts'`
Expected: PASS (all 7 specs).

- [ ] **Step 5: Stage (commit on user go-ahead)**

```bash
git add projects/sdcorejs-angular/components/query-builder/src/query-builder.model.ts \
        projects/sdcorejs-angular/components/query-builder/src/query-builder.model.spec.ts
```

---

## Task 2: Serializer — emit, round-trip & render relative dates

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.ts`
- Test: `projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `query-builder.serializer.spec.ts`. First extend the imports at the top:

```ts
import { qbNewGroup, qbNewRule, QbToken, SdQueryBuilderField } from './query-builder.model';
```
(no import change needed — tests use existing factories + raw filters)

Add these `describe` blocks at the end of the file:

```ts
describe('query-builder.serializer › relative dates', () => {
  const str = (f: Filter): string => render(filterToTokens(f, FIELDS));

  it('emits a now relative value', () => {
    const tree = qbNewGroup('AND', [qbNewRule('createdAt', 'GREATER_THAN', { rel: 'now' })]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'AND',
      data: [{ field: 'createdAt', operator: 'GREATER_THAN', data: { rel: 'now' } }],
    } as any);
  });

  it('emits a complete offset relative value', () => {
    const tree = qbNewGroup('AND', [
      qbNewRule('createdAt', 'LESS_THAN', { rel: 'offset', unit: 'day', amount: 3, direction: 'previous' }),
    ]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'AND',
      data: [{ field: 'createdAt', operator: 'LESS_THAN', data: { rel: 'offset', unit: 'day', amount: 3, direction: 'previous' } }],
    } as any);
  });

  it('drops an incomplete offset (missing amount / unit / direction)', () => {
    expect(treeToFilter(qbNewGroup('AND', [qbNewRule('createdAt', 'LESS_THAN', { rel: 'offset', unit: 'day' })]))).toBeNull();
    expect(treeToFilter(qbNewGroup('AND', [qbNewRule('createdAt', 'LESS_THAN', { rel: 'offset', amount: 2, direction: 'next' })]))).toBeNull();
    expect(treeToFilter(qbNewGroup('AND', [qbNewRule('createdAt', 'LESS_THAN', { rel: 'offset', unit: 'day', amount: 0, direction: 'next' })]))).toBeNull();
  });

  it('round-trips a relative offset value without drift', () => {
    const f1 = treeToFilter(qbNewGroup('AND', [
      qbNewRule('createdAt', 'GREATER_THAN', { rel: 'offset', unit: 'month', amount: 2, direction: 'next' }),
    ]));
    const f2 = treeToFilter(filterToTree(f1));
    expect(f2).toEqual(f1 as any);
  });

  it('round-trips a now value without drift', () => {
    const f1 = treeToFilter(qbNewGroup('AND', [qbNewRule('createdAt', 'EQUAL', { rel: 'now' })]));
    const f2 = treeToFilter(filterToTree(f1));
    expect(f2).toEqual(f1 as any);
  });

  it('renders now / offset relative values as readable Vietnamese', () => {
    expect(str({ field: 'createdAt', operator: 'GREATER_THAN', data: { rel: 'now' } } as any)).toBe('Ngày tạo > hôm nay');
    expect(str({ field: 'createdAt', operator: 'LESS_THAN', data: { rel: 'offset', unit: 'day', amount: 3, direction: 'previous' } } as any)).toBe('Ngày tạo < 3 ngày trước');
    expect(str({ field: 'createdAt', operator: 'EQUAL', data: { rel: 'offset', unit: 'month', amount: 1, direction: 'next' } } as any)).toBe('Ngày tạo = 1 tháng tới');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.serializer.spec.ts'`
Expected: FAIL — offset rule emits `[object Object]` / incomplete offset is emitted instead of dropped / tokens render `[object Object]`.

- [ ] **Step 3: Write minimal implementation**

In `query-builder.serializer.ts`:

(a) Extend the model import to include the relative helpers + types:

```ts
import {
  isQbGroup,
  QB_MULTI_OPERATORS,
  QB_NO_DATA_OPERATORS,
  qbIsRelativeDate,
  QbGroup,
  QbNode,
  QbRule,
  QbToken,
  qbNewGroup,
  qbNewRule,
  SdQbRelativeDate,
  SdQbRelativeUnit,
  SdQueryBuilderField,
} from './query-builder.model';
```

(b) In `ruleToFilter`, insert a relative-value branch immediately BEFORE the final scalar `if (isEmptyValue(rule.value)) return null;`:

```ts
  if (qbIsRelativeDate(rule.value)) {
    const v = rule.value;
    if (v.rel === 'now') return { field: rule.field as any, operator, data: { rel: 'now' } } as Filter;
    // offset — only emit when fully specified, else drop the incomplete rule
    if (v.unit && v.direction && typeof v.amount === 'number' && v.amount >= 1) {
      return {
        field: rule.field as any,
        operator,
        data: { rel: 'offset', unit: v.unit, amount: v.amount, direction: v.direction },
      } as Filter;
    }
    return null;
  }
```

(Inbound `ruleFromFilter` needs NO change: a relative `data` object is passed straight into `qbNewRule(field, op, data)` as `rule.value`, so `filterToTree` round-trips it untouched.)

(c) Add a relative-render helper + hook it into `formatScalar`. Add near the top (after `escapeStr`):

```ts
const REL_UNIT_VI: Record<SdQbRelativeUnit, string> = { day: 'ngày', week: 'tuần', month: 'tháng' };

/** Render a relative-date spec as readable Vietnamese for the view string. */
function formatRelative(v: SdQbRelativeDate): string {
  if (v.rel === 'now') return 'hôm nay';
  const unit = REL_UNIT_VI[v.unit ?? 'day'];
  const dir = v.direction === 'next' ? 'tới' : 'trước';
  return `${v.amount ?? 1} ${unit} ${dir}`;
}
```

Then add the first line of `formatScalar`:

```ts
function formatScalar(field: SdQueryBuilderField | undefined, raw: any): string {
  if (qbIsRelativeDate(raw)) return formatRelative(raw);
  if (raw === null || raw === undefined) return '';
  // …unchanged…
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.serializer.spec.ts'`
Expected: PASS (all existing + 6 new relative specs).

- [ ] **Step 5: Stage (commit on user go-ahead)**

```bash
git add projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.ts \
        projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.spec.ts
```

---

## Task 3: Component — field swap-only guard + relative-aware reshape

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts:227-243` (`setField`), `:282-288` (`#reshapeValue`)
- Test: `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add to `query-builder.component.spec.ts` (inside the top-level `describe('SdQueryBuilder', …)`):

```ts
  describe('field swap-only (issue #2)', () => {
    it('ignores a null key — the field is never cleared', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'name');
      expect(r.field).toBe('name');

      component.setField(r, null); // attempt to clear
      expect(r.field).toBe('name'); // unchanged — swap only

      component.setField(r, undefined as any);
      expect(r.field).toBe('name');
    });

    it('still swaps to another field', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'name');
      component.setField(r, 'price');
      expect(r.field).toBe('price');
    });
  });

  describe('relative value survives a single-value operator change', () => {
    it('keeps a relative offset when switching GREATER_THAN → LESS_THAN', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'createdAt');
      component.setOperator(r, 'GREATER_THAN');
      component.setDateMode(r, 'relative'); // added in Task 5
      expect(r.value).toEqual({ rel: 'offset', unit: 'day', amount: 1, direction: 'previous' });

      component.setOperator(r, 'LESS_THAN');
      expect(r.value).toEqual({ rel: 'offset', unit: 'day', amount: 1, direction: 'previous' });
    });

    it('resets a relative value to {from,to} when switching to BETWEEN', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'createdAt');
      component.setOperator(r, 'GREATER_THAN');
      component.setDateMode(r, 'now');
      expect(r.value).toEqual({ rel: 'now' });

      component.setOperator(r, 'BETWEEN');
      expect(r.value).toEqual({ from: null, to: null });
    });
  });
```

> Note: the `setDateMode` helper used here lands in Task 5. If executing strictly task-by-task, write only the `field swap-only` block in this task and add the `relative value survives …` block at Task 5. They are listed together here so the reshape change is covered.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.component.spec.ts'`
Expected: FAIL — `setField(r, null)` currently sets `r.field = undefined`; (and `setDateMode` undefined until Task 5).

- [ ] **Step 3: Write minimal implementation**

(a) Guard `setField` — replace its body's first two lines:

```ts
  setField(rule: QbRule, key: any): void {
    if (this.disabled()) return;
    if (key == null) return; // swap-only: never clear the field (issue #2)
    rule.field = key;
    const field = this.fieldByKey()[rule.field as string];
    const op = qbDefaultOperator(field);
    rule.operator = op;
    rule.value = this.#defaultValueFor(op);
    this.#apply();
  }
```

(b) Make `#reshapeValue` preserve relative objects for single-value operators and reset them for BETWEEN. Replace the method:

```ts
  #reshapeValue(op: Operator | undefined, current: any): any {
    if (qbIsNoDataOperator(op)) return null;
    if (qbIsMultiOperator(op)) return Array.isArray(current) ? current : current == null ? [] : [current];
    if (op === 'BETWEEN') {
      // a relative spec can't be a BETWEEN endpoint — reset to a fresh range
      return current && typeof current === 'object' && !Array.isArray(current) && !qbIsRelativeDate(current)
        ? current
        : { from: null, to: null };
    }
    // single value — keep a relative spec; otherwise drop array/range remnants
    if (qbIsRelativeDate(current)) return current;
    return Array.isArray(current) || (current && typeof current === 'object') ? null : current;
  }
```

(c) Add `qbIsRelativeDate` to the model import in `query-builder.component.ts`:

```ts
import {
  isQbGroup,
  QbGroup,
  QbNode,
  QbRule,
  QbToken,
  qbAllowedOperators,
  qbDefaultOperator,
  qbIsMultiOperator,
  qbIsNoDataOperator,
  qbIsRelativeDate,
  qbNewGroup,
  qbNewRule,
  SdQueryBuilderField,
  SdQueryBuilderFieldOption,
} from './query-builder.model';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.component.spec.ts'`
Expected: PASS for the `field swap-only` block. (The `relative value survives …` block passes after Task 5.)

- [ ] **Step 5: Stage (commit on user go-ahead)**

```bash
git add projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts \
        projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts
```

---

## Task 4: Component — stable boolean options (OOM fix, issue #3)

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts:320-325` (`booleanItems`)
- Test: `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add to `query-builder.component.spec.ts`:

```ts
  describe('boolean items stability (OOM fix — issue #3)', () => {
    const booleanField = (): SdQueryBuilderField => FIELDS.find(f => f.key === 'active')!;

    it('returns the SAME array reference across calls for the same field', () => {
      const a = component.booleanItems(booleanField());
      const b = component.booleanItems(booleanField());
      expect(a).toBe(b); // stable ref — no fresh allocation per CD
    });

    it('does not loop / throw when a rule field is switched to a boolean field', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'active');
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(() => fixture.detectChanges()).not.toThrow();
      // boolean value editor rendered
      expect(fixture.nativeElement.querySelectorAll('sd-select').length).toBeGreaterThan(0);
    });

    it('still maps the boolean labels (default + overridden)', () => {
      const items = component.booleanItems(booleanField());
      expect(items).toEqual([
        { value: true, display: 'Có' },
        { value: false, display: 'Không' },
      ]);
    });
  });
```

> Reminder for the OOM repro: the bug only manifests with an unstable `[items]` ref feeding `sd-select`'s `toObservable(items)` → `markForCheck()` loop. The reference-equality assertion is the durable regression guard.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.component.spec.ts'`
Expected: FAIL on the `same array reference` spec — `booleanItems` currently builds a new array each call.

- [ ] **Step 3: Write minimal implementation**

In `query-builder.component.ts`:

(a) Add `computed` to the imports from `@angular/core` (already imported — confirm `computed` is present; it is).

(b) Import `QB_EMPTY_OPTIONS` from the model (add to the import list edited in Task 3):

```ts
  QB_EMPTY_OPTIONS,
```

(c) Add a memoized options map near the other `computed`s (after `fieldByKey`):

```ts
  /** Boolean fields → their stable `[true,false]` option list. Memoized so the template
   *  binding hands `sd-select` the SAME array ref each CD (else its `toObservable(items)`
   *  → `markForCheck()` loops → OOM). Recomputes only when `fields()` changes. */
  readonly #booleanOptionsByKey = computed<Map<string, SdQueryBuilderFieldOption[]>>(() => {
    const map = new Map<string, SdQueryBuilderFieldOption[]>();
    for (const f of this.fields()) {
      if (f.type === 'boolean') {
        map.set(f.key, [
          { value: true, display: f.trueLabel ?? 'Có' },
          { value: false, display: f.falseLabel ?? 'Không' },
        ]);
      }
    }
    return map;
  });
```

(d) Replace `booleanItems` to read from the memoized map (stable fallback):

```ts
  /** `[true/false]` option list for a boolean field's value select (stable reference). */
  booleanItems(field: SdQueryBuilderField): SdQueryBuilderFieldOption[] {
    return this.#booleanOptionsByKey().get(field.key) ?? QB_EMPTY_OPTIONS;
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.component.spec.ts'`
Expected: PASS (boolean stability block green).

- [ ] **Step 5: Stage (commit on user go-ahead)**

```bash
git add projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts \
        projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts
```

---

## Task 5: Component — date-mode helpers + exposed option constants

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts`
- Test: `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add to `query-builder.component.spec.ts`:

```ts
  describe('date-mode helpers (relative dates — issue #4)', () => {
    const dateRule = (): QbRule => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'createdAt');
      component.setOperator(r, 'GREATER_THAN'); // single-value op
      return r;
    };

    it('dateMode derives absolute / now / relative from the value', () => {
      const r = dateRule();
      expect(component.dateMode(r)).toBe('absolute'); // default value is null
      r.value = { rel: 'now' };
      expect(component.dateMode(r)).toBe('now');
      r.value = { rel: 'offset', unit: 'day', amount: 2, direction: 'next' };
      expect(component.dateMode(r)).toBe('relative');
    });

    it('setDateMode reseeds the value per mode', () => {
      const r = dateRule();
      component.setDateMode(r, 'now');
      expect(r.value).toEqual({ rel: 'now' });
      component.setDateMode(r, 'relative');
      expect(r.value).toEqual({ rel: 'offset', unit: 'day', amount: 1, direction: 'previous' });
      component.setDateMode(r, 'absolute');
      expect(r.value).toBeNull();
    });

    it('relativeAmount reads the offset amount (default 1)', () => {
      const r = dateRule();
      expect(component.relativeAmount(r)).toBe(1);
      r.value = { rel: 'offset', unit: 'week', amount: 5, direction: 'previous' };
      expect(component.relativeAmount(r)).toBe(5);
    });

    it('setRelativeAmount clamps to an integer >= 1', () => {
      const r = dateRule();
      component.setDateMode(r, 'relative');
      component.setRelativeAmount(r, 4);
      expect(r.value).toEqual({ rel: 'offset', unit: 'day', amount: 4, direction: 'previous' });
      component.setRelativeAmount(r, 0);
      expect((r.value as any).amount).toBe(1);
      component.setRelativeAmount(r, 'abc');
      expect((r.value as any).amount).toBe(1);
      component.setRelativeAmount(r, 2.7);
      expect((r.value as any).amount).toBe(2);
    });

    it('relativeUnitDirValue reads / setRelativeUnitDir writes the unit:direction token', () => {
      const r = dateRule();
      component.setDateMode(r, 'relative');
      expect(component.relativeUnitDirValue(r)).toBe('day:previous');
      component.setRelativeUnitDir(r, 'month:next');
      expect(r.value).toEqual({ rel: 'offset', unit: 'month', amount: 1, direction: 'next' });
      expect(component.relativeUnitDirValue(r)).toBe('month:next');
    });

    it('exposes stable option lists for the template', () => {
      expect(component.dateModes).toBe(component.dateModes);
      expect(component.relativeUnitOptions).toBe(component.relativeUnitOptions);
      expect(component.dateModes.map(m => m.value)).toEqual(['absolute', 'now', 'relative']);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.component.spec.ts'`
Expected: FAIL — `dateMode` / `setDateMode` / `relativeAmount` / `setRelativeAmount` / `relativeUnitDirValue` / `setRelativeUnitDir` / `dateModes` / `relativeUnitOptions` undefined.

- [ ] **Step 3: Write minimal implementation**

(a) Extend the model import (the one edited in Tasks 3-4) to add:

```ts
  QB_DATE_MODES,
  QB_RELATIVE_UNIT_OPTIONS,
  qbDefaultRelative,
  QbDateMode,
  SdQbRelativeDirection,
  SdQbRelativeUnit,
```

(b) Expose the option constants as readonly fields (near the other template helpers / inputs):

```ts
  /** Stable option list for the date-mode select. */
  readonly dateModes = QB_DATE_MODES;
  /** Stable combined unit×direction option list for the relative select. */
  readonly relativeUnitOptions = QB_RELATIVE_UNIT_OPTIONS;
```

(c) Add the date-mode helper methods (in the "Rule field / operator / value mutations" section, after `setBetweenTo`):

```ts
  /** Current date-value mode of a rule, derived from its value (no separate state). */
  dateMode(rule: QbRule): QbDateMode {
    const v = rule.value;
    if (qbIsRelativeDate(v)) return v.rel === 'now' ? 'now' : 'relative';
    return 'absolute';
  }

  /** Switch a date/datetime rule's value mode, reseeding the value for the new mode. */
  setDateMode(rule: QbRule, mode: QbDateMode): void {
    if (this.disabled()) return;
    if (mode === 'now') rule.value = { rel: 'now' };
    else if (mode === 'relative') rule.value = qbDefaultRelative();
    else rule.value = null; // absolute — pick a concrete date
    this.#apply();
  }

  /** Read the offset amount of a relative rule (default 1). */
  relativeAmount(rule: QbRule): number {
    const v = rule.value;
    return qbIsRelativeDate(v) && v.rel === 'offset' ? v.amount ?? 1 : 1;
  }

  /** Set the offset amount (clamped to an integer >= 1). */
  setRelativeAmount(rule: QbRule, raw: any): void {
    if (this.disabled()) return;
    const n = Math.floor(Number(raw));
    const amount = Number.isNaN(n) || n < 1 ? 1 : n;
    const cur = qbIsRelativeDate(rule.value) ? rule.value : qbDefaultRelative();
    rule.value = { rel: 'offset', unit: cur.unit ?? 'day', amount, direction: cur.direction ?? 'previous' };
    this.#apply();
  }

  /** Read the `'unit:direction'` token of a relative rule (default `'day:previous'`). */
  relativeUnitDirValue(rule: QbRule): string {
    const v = rule.value;
    if (qbIsRelativeDate(v) && v.rel === 'offset') return `${v.unit ?? 'day'}:${v.direction ?? 'previous'}`;
    return 'day:previous';
  }

  /** Set the offset unit + direction from a `'unit:direction'` token. */
  setRelativeUnitDir(rule: QbRule, token: string): void {
    if (this.disabled()) return;
    const [unit, direction] = (token ?? 'day:previous').split(':') as [SdQbRelativeUnit, SdQbRelativeDirection];
    const cur = qbIsRelativeDate(rule.value) ? rule.value : qbDefaultRelative();
    rule.value = { rel: 'offset', unit, amount: cur.amount ?? 1, direction };
    this.#apply();
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.component.spec.ts'`
Expected: PASS — date-mode helper block green AND the Task 3 `relative value survives …` block now green.

- [ ] **Step 5: Stage (commit on user go-ahead)**

```bash
git add projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts \
        projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts
```

---

## Task 6: Template — compact rows (issue #1) + date-mode editor UI

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.html`
- Modify: `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.scss`
- Test: `projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add to `query-builder.component.spec.ts`:

```ts
  describe('date-mode UI + compact rows', () => {
    const setupDateRule = (op: string) => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'createdAt');
      component.setOperator(r, op as any);
      fixture.detectChanges();
      return r;
    };

    it('renders the date-mode select for a single-value date operator', () => {
      setupDateRule('GREATER_THAN');
      expect(fixture.nativeElement.querySelector('.qb-date-mode')).not.toBeNull();
    });

    it('does NOT render the date-mode select for BETWEEN', () => {
      setupDateRule('BETWEEN');
      expect(fixture.nativeElement.querySelector('.qb-date-mode')).toBeNull();
      // two absolute pickers instead
      expect(fixture.nativeElement.querySelectorAll('sd-date').length).toBe(2);
    });

    it('shows the relative controls when mode = relative, hides the date picker', () => {
      const r = setupDateRule('GREATER_THAN');
      component.setDateMode(r, 'relative');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.qb-rel-amount')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.qb-rel-unit')).not.toBeNull();
    });

    it('shows no value editor when mode = now', () => {
      const r = setupDateRule('GREATER_THAN');
      component.setDateMode(r, 'now');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.qb-rel-amount')).toBeNull();
      // the absolute date picker is also hidden in now mode
      expect(fixture.nativeElement.querySelector('.qb-rule sd-date.qb-val')).toBeNull();
    });

    it('passes hideInlineError to value editors (compact rows)', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'name'); // string → sd-input
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('sd-input.qb-val');
      // hideInlineError reflects to the host (truthy attribute present)
      expect(input?.hasAttribute('hideinlineerror') || input?.getAttribute('ng-reflect-hide-inline-error') === 'true').toBeTrue();
    });
  });
```

> If the `hideInlineError` reflection assertion proves brittle in the headless runner (attribute casing / no ng-reflect in prod mode), fall back to asserting the input's rendered host height is below a threshold, or assert on a spy of the child input's `hideInlineError()` signal. Prefer the attribute check first.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.component.spec.ts'`
Expected: FAIL — `.qb-date-mode` / `.qb-rel-amount` not in the template; `hideInlineError` not set.

- [ ] **Step 3: Write minimal implementation**

(a) In `query-builder.component.html`, add `hideInlineError` to every value/field editor. The field select (line ~62) and all value editors. Replace the rule template's editors. Field select:

```html
    <sd-select
      class="qb-field"
      [items]="fields()"
      valueField="key"
      displayField="label"
      placeholder="Chọn trường"
      size="sm"
      [model]="rule.field"
      (modelChange)="setField(rule, $event)"
      [disabled]="disabled()"
      [clearable]="false"
      hideInlineError
      [autoId]="autoIdFor('field-' + index)"
    ></sd-select>
```

(b) Replace the BETWEEN block's number/date/datetime editors to add `hideInlineError` (numbers + the two pickers each gain `hideInlineError`). For each `sd-input` / `sd-date` / `sd-datetime` inside `.qb-between`, append `hideInlineError`. Example for the number case:

```html
              @case ('number') {
                <sd-input class="qb-val" type="number" placeholder="Từ" size="sm" [model]="rule.value?.from" (modelChange)="setBetweenFrom(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('from-' + index)"></sd-input>
                <span class="qb-dash">—</span>
                <sd-input class="qb-val" type="number" placeholder="Đến" size="sm" [model]="rule.value?.to" (modelChange)="setBetweenTo(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('to-' + index)"></sd-input>
              }
              @case ('date') {
                <sd-date class="qb-val" size="sm" [model]="rule.value?.from" (modelChange)="setBetweenFrom(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('from-' + index)"></sd-date>
                <span class="qb-dash">—</span>
                <sd-date class="qb-val" size="sm" [model]="rule.value?.to" (modelChange)="setBetweenTo(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('to-' + index)"></sd-date>
              }
              @case ('datetime') {
                <sd-datetime class="qb-val" size="sm" [model]="rule.value?.from" (modelChange)="setBetweenFrom(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('from-' + index)"></sd-datetime>
                <span class="qb-dash">—</span>
                <sd-datetime class="qb-val" size="sm" [model]="rule.value?.to" (modelChange)="setBetweenTo(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('to-' + index)"></sd-datetime>
              }
```

(c) Replace the non-BETWEEN `@switch (fieldOf(rule)?.type)` value block. The `string`, `number`, `boolean`, `values` cases just gain `hideInlineError`; the `date` and `datetime` cases are rewritten to the mode editor. Full block:

```html
        } @else {
          @switch (fieldOf(rule)?.type) {
            @case ('string') {
              <sd-input class="qb-val" placeholder="Giá trị" size="sm" [model]="rule.value" (modelChange)="setScalar(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('val-' + index)"></sd-input>
            }
            @case ('number') {
              <sd-input class="qb-val" type="number" placeholder="Giá trị" size="sm" [model]="rule.value" (modelChange)="setScalar(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('val-' + index)"></sd-input>
            }
            @case ('boolean') {
              <sd-select class="qb-val" [items]="booleanItems(fieldOf(rule)!)" valueField="value" displayField="display" placeholder="Giá trị" size="sm" [model]="rule.value" (modelChange)="setScalar(rule, $event)" [disabled]="disabled()" [clearable]="false" hideInlineError [autoId]="autoIdFor('val-' + index)"></sd-select>
            }
            @case ('date') {
              @let _dateMode = dateMode(rule);
              <sd-select class="qb-date-mode" [items]="dateModes" valueField="value" displayField="display" size="sm" [model]="_dateMode" (modelChange)="setDateMode(rule, $event)" [disabled]="disabled()" [clearable]="false" hideInlineError [autoId]="autoIdFor('datemode-' + index)"></sd-select>
              @switch (_dateMode) {
                @case ('absolute') {
                  <sd-date class="qb-val" size="sm" [model]="rule.value" (modelChange)="setScalar(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('val-' + index)"></sd-date>
                }
                @case ('relative') {
                  <sd-input class="qb-rel-amount" type="number" [min]="1" size="sm" [model]="relativeAmount(rule)" (modelChange)="setRelativeAmount(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('rel-amount-' + index)"></sd-input>
                  <sd-select class="qb-rel-unit" [items]="relativeUnitOptions" valueField="value" displayField="display" size="sm" [model]="relativeUnitDirValue(rule)" (modelChange)="setRelativeUnitDir(rule, $event)" [disabled]="disabled()" [clearable]="false" hideInlineError [autoId]="autoIdFor('rel-unit-' + index)"></sd-select>
                }
              }
            }
            @case ('datetime') {
              @let _dtMode = dateMode(rule);
              <sd-select class="qb-date-mode" [items]="dateModes" valueField="value" displayField="display" size="sm" [model]="_dtMode" (modelChange)="setDateMode(rule, $event)" [disabled]="disabled()" [clearable]="false" hideInlineError [autoId]="autoIdFor('datemode-' + index)"></sd-select>
              @switch (_dtMode) {
                @case ('absolute') {
                  <sd-datetime class="qb-val" size="sm" [model]="rule.value" (modelChange)="setScalar(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('val-' + index)"></sd-datetime>
                }
                @case ('relative') {
                  <sd-input class="qb-rel-amount" type="number" [min]="1" size="sm" [model]="relativeAmount(rule)" (modelChange)="setRelativeAmount(rule, $event)" [disabled]="disabled()" hideInlineError [autoId]="autoIdFor('rel-amount-' + index)"></sd-input>
                  <sd-select class="qb-rel-unit" [items]="relativeUnitOptions" valueField="value" displayField="display" size="sm" [model]="relativeUnitDirValue(rule)" (modelChange)="setRelativeUnitDir(rule, $event)" [disabled]="disabled()" [clearable]="false" hideInlineError [autoId]="autoIdFor('rel-unit-' + index)"></sd-select>
                }
              }
            }
            @case ('values') {
              <sd-select class="qb-val" [items]="fieldOf(rule)!.values || []" valueField="value" displayField="display" [multiple]="isMulti(rule.operator)" placeholder="Giá trị" size="sm" [model]="rule.value" (modelChange)="setScalar(rule, $event)" [disabled]="disabled()" [clearable]="false" hideInlineError [autoId]="autoIdFor('val-' + index)"></sd-select>
            }
          }
        }
```

> Note the `values` case keeps `fieldOf(rule)!.values || []`. `field.values` is a stable config reference; the `|| []` only allocates when a `values` field has no options (a misconfiguration), so it does not loop in practice. Leave as-is to avoid scope creep.

(d) In `query-builder.component.scss`, add layout for the relative row (reuse `qb-*` tokens). Append:

```scss
.qb-date-mode { min-width: 120px; }
.qb-rel-amount { width: 72px; }
.qb-rel-unit { min-width: 110px; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='**/query-builder.component.spec.ts'`
Expected: PASS (date-mode UI block green; existing DOM specs still green).

- [ ] **Step 5: Stage (commit on user go-ahead)**

```bash
git add projects/sdcorejs-angular/components/query-builder/src/query-builder.component.html \
        projects/sdcorejs-angular/components/query-builder/src/query-builder.component.scss \
        projects/sdcorejs-angular/components/query-builder/src/query-builder.component.spec.ts
```

---

## Task 7: Showcase demo — datetime field + relative date

**Files:**
- Modify: `projects/showcase/src/app/pages/components/query-builder/query-builder-demo.component.ts`

- [ ] **Step 1: Add a datetime field + a relative section**

In `query-builder-demo.component.ts`:

(a) Add a datetime field to `fields`:

```ts
    { key: 'createdAt', label: 'Ngày tạo', type: 'date' },
    { key: 'updatedAt', label: 'Cập nhật lúc', type: 'datetime' },
```

(b) Add a new `<demo-section>` after the "Disabled" section documenting relative dates:

```html
      <demo-section
        heading="Ngày tương đối"
        note="Với date/datetime + toán tử đơn (=, !=, >, <), chọn 'Hôm nay' hoặc 'Tương đối' (N ngày/tuần/tháng trước·tới). Emit ra Filter.data dạng { rel, unit, amount, direction }. BETWEEN không có chế độ tương đối."
        [props]="[{ name: 'fields', value: 'date | datetime' }, { name: 'value', value: '{ rel, unit, amount, direction }' }]">
        <div class="builder-box">
          <sd-query-builder [fields]="fields" [(value)]="relativeValue"></sd-query-builder>
        </div>
        <div class="qb-demo-out">
          <strong>Filter</strong>
          <pre>{{ relativeValue() | json }}</pre>
        </div>
      </demo-section>
```

(c) Add the backing signal seeded with a relative example:

```ts
  /** Seed for the relative-date demo: createdAt > 7 days ago. */
  readonly relativeValue = signal<Filter | null>({
    operator: 'AND',
    data: [{ field: 'createdAt', operator: 'GREATER_THAN', data: { rel: 'offset', unit: 'day', amount: 7, direction: 'previous' } }],
  } as Filter);
```

- [ ] **Step 2: Verify the showcase builds**

Run: `npm run build`
Expected: PASS (lib build clean; showcase typechecks the demo).

> The showcase visual check (Edit→pick a date field→switch mode to Hôm nay/Tương đối) is manual — note it in the handoff; automated tests can't assert the rendered layout.

- [ ] **Step 3: Stage (commit on user go-ahead)**

```bash
git add projects/showcase/src/app/pages/components/query-builder/query-builder-demo.component.ts
```

---

## Task 8: Docs — `sd-query-builder.md`

**Files:**
- Modify: `projects/sdcorejs-angular/components/query-builder/sd-query-builder.md`

- [ ] **Step 1: Update the component doc**

Read the current `sd-query-builder.md`, then update (same commit as code per repo doc-discipline):

1. **Model section** — add the `SdQbRelativeDate` interface (`{ rel: 'now'|'offset', unit?, amount?, direction? }`) + the `SdQbRelativeUnit` / `SdQbRelativeDirection` / `QbDateMode` types, with the three emitted `Filter.data` examples (now / offset / and that BETWEEN has no relative).
2. **Value editors** — document the date/datetime mode select (Ngày cụ thể / Hôm nay / Tương đối), that mode is derived from the value, and that relative is single-value-operators-only.
3. **Field behavior** — note the field is swap-only (`[clearable]="false"` + `setField` ignores null); the only removal is the per-rule ✕.
4. **Rows** — note every value editor uses `hideInlineError` (compact rows; errors via tooltip).
5. **View mode** — note relative values render as `hôm nay` / `N ngày|tuần|tháng trước|tới`.
6. **Known limitations / i18n** — record that the component hard-codes Vietnamese strings (i18n migration is deferred tech debt) and that minute/hour granularity + field-to-field comparison are intentionally out of scope.

- [ ] **Step 2: Verify doc matches the shipped API**

Re-read the updated `.md`; confirm every input/method/type named exists in the final code (no renamed/removed members). Fix drift inline.

- [ ] **Step 3: Stage (commit on user go-ahead)**

```bash
git add projects/sdcorejs-angular/components/query-builder/sd-query-builder.md
```

---

## Task 9: Full verification + CLAUDE.md "Recent work" bullet + commit

**Files:**
- Modify: `projects/sdcorejs-angular/CLAUDE.md` (append a "Recent work" bullet)

- [ ] **Step 1: Run the full query-builder test set**

Run:
```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless \
  --include='**/query-builder.model.spec.ts' \
  --include='**/query-builder.serializer.spec.ts' \
  --include='**/query-builder.component.spec.ts'
```
Expected: ALL green. Record the new total spec count.

- [ ] **Step 2: Run the build gate**

Run: `npm run build`
Expected: ng-packagr completes clean (no TS errors).

- [ ] **Step 3: Append the CLAUDE.md "Recent work" bullet**

Add a numbered bullet under "Recent work (this branch …)" in `projects/sdcorejs-angular/CLAUDE.md` summarizing: hideInlineError compact rows; swap-only field; boolean-field OOM fix (unstable `[items]` → `sd-select` `toObservable` loop) via memoized options; relative dates (`SdQbRelativeDate` now/offset day·week·month, single-value ops only, structured `Filter.data`, readable view tokens); showcase + `sd-query-builder.md` updated; spec/plan at `docs/superpowers/{specs,plans}/2026-06-05-query-builder-fixes-relative-date*`.

- [ ] **Step 4: Commit everything (on user go-ahead)**

```bash
git add -A
git commit -m "$(cat <<'EOF'
SM-00: fix(query-builder): compact rows, swap-only field, boolean OOM fix + relative dates

- hideInlineError on all value/field editors (compact rule rows; errors via tooltip)
- field is swap-only: keep [clearable]=false + setField ignores a null key
- fix OOM when selecting a boolean field: booleanItems allocated a fresh array each CD,
  feeding sd-select's toObservable(items) -> markForCheck() -> infinite CD loop. Memoized
  per-field boolean options (stable ref) breaks the loop.
- relative dates for date/datetime single-value operators (=, !=, >, <; not BETWEEN):
  mode select Ngày cụ thể / Hôm nay / Tương đối; emits structured { rel, unit, amount,
  direction } in Filter.data; view mode renders "hôm nay" / "N ngày|tuần|tháng trước|tới".
- showcase: datetime field + relative-date section; sd-query-builder.md + CLAUDE.md updated.
- spec/plan: docs/superpowers/{specs,plans}/2026-06-05-query-builder-fixes-relative-date*

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Confirm clean tree**

Run: `git status`
Expected: clean working tree on `release/0.0.1`.

---

## Self-Review

**Spec coverage:**
- AC1 compact rows → Task 6 (hideInlineError everywhere).
- AC2 field swap-only → Task 3 (`setField` guard, keep clearable=false).
- AC3 boolean OOM → Task 4 (memoized stable options + ref-equality + no-throw specs).
- AC4 relative emit shapes → Tasks 1, 2, 5 (model, serializer emit, component helpers + UI Task 6).
- AC5 BETWEEN/NULL unchanged → Task 6 (no mode select for BETWEEN; `#reshapeValue` resets relative→{from,to}).
- AC6 round-trip → Task 2 (filterToTree round-trip specs).
- AC7 view tokens → Task 2 (formatRelative).
- AC8 build clean + docs same commit → Tasks 7, 8, 9.

**Placeholder scan:** No "TBD/TODO" steps; every code step shows full code. The Task 8 doc edit is descriptive (prose doc) but enumerates the 6 concrete sections to write.

**Type consistency:** `SdQbRelativeDate`/`SdQbRelativeUnit`/`SdQbRelativeDirection`/`QbDateMode`/`qbIsRelativeDate`/`qbDefaultRelative`/`QB_DATE_MODES`/`QB_RELATIVE_UNIT_OPTIONS`/`QB_EMPTY_OPTIONS` defined in Task 1 and used consistently in Tasks 2-6. Component methods (`dateMode`/`setDateMode`/`relativeAmount`/`setRelativeAmount`/`relativeUnitDirValue`/`setRelativeUnitDir`/`booleanItems`) and props (`dateModes`/`relativeUnitOptions`) match across the component, template, and specs. Token format `'unit:direction'` consistent between `relativeUnitDirValue` (read) and `setRelativeUnitDir` (write) and `QB_RELATIVE_UNIT_OPTIONS`.
