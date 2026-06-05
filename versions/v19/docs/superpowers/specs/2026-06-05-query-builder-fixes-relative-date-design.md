# Query Builder — post-rebuild fixes + relative-date support

**Date:** 2026-06-05
**Component:** `<sd-query-builder>` (`projects/sdcorejs-angular/components/query-builder`)
**Status:** Approved (design) — pending implementation plan

## Problem & context

`<sd-query-builder>` was just rebuilt (`291ef972 feat(query-builder)!: rebuild …`) with
type-aware operators, `Filter` output and a view mode. A first review of the rebuilt
component surfaced four issues to address in one pass:

1. **Value editors are too tall.** The inner form controls (`sd-input`, `sd-select`,
   `sd-date`, `sd-datetime`) reserve vertical space for an inline error subscript, so each
   rule row is taller than needed.
2. **The field can be cleared, not just swapped.** A rule's field should only be
   *changed* to another field — never emptied back to "no field".
3. **Selecting the boolean field freezes the page (OOM).** In the showcase, switching a
   rule's field to "Kích hoạt" (`type: 'boolean'`) hangs the tab.
4. **No relative dates.** Date/datetime rules can only compare against an absolute picked
   date. They commonly need relative comparisons — *today*, and *previous/next* day / week
   / month.

## Goals

- Compact rule rows (no reserved error space; errors still reachable via tooltip).
- A rule's field is non-removable — swap only.
- The boolean field no longer triggers an infinite change-detection loop.
- Date/datetime single-value rules can use a relative value: *now*, or an offset of
  N day/week/month in the *previous* or *next* direction, emitted as a structured object in
  the `Filter`.

## Non-goals / out of scope (YAGNI)

- No minute / hour granularity (chosen scope is day / week / month + now).
- Relative dates are **not** offered for `BETWEEN` (only single-value operators
  `EQUAL`, `NOT_EQUAL`, `GREATER_THAN`, `LESS_THAN`).
- No field-to-field (`ATTRIBUTE`) comparison like the reference expression-builder.
- No new public sub-component (the date-value mode is derived from the rule value, so the
  editor stays inline in the parent template — no extra showcase page).
- No i18n migration: the rebuilt component already hard-codes Vietnamese strings; new
  strings follow that style. Routing the whole component through `I18nService` is recorded
  as separate tech debt, not done here.

## Reference

`sdcorejs-angular/versions/v19/.../form-builder/components/expression-builder/` — its
`dayInfo` model (`type: RELATED | NOW | DATETIME | ATTRIBUTE`, `related`, `relatedValue`)
and the `DayInfoPreviouses` "N <unit> trước/tới" pattern inform the relative-date UX. We
keep the UX shape, drop `ATTRIBUTE`, widen units to day/week/month, and emit a structured
object into `Filter.data` instead of the reference's string token.

## Design

### 1. Compact rows — `hideInlineError`

Add the `hideInlineError` attribute to every value/field editor in the rule template:
`sd-select` (field, boolean, values), `sd-input` (string, number, BETWEEN from/to),
`sd-date`, `sd-datetime`. `sd-operator` has no mat-form-field shell — unchanged. Required
validation messages remain available through each control's existing error tooltip.

### 2. Field is swap-only

- Keep `[clearable]="false"` on the field `sd-select`.
- Guard `setField(rule, key)`: return early when `key == null`, so `rule.field` is never
  reset to `undefined`. The only way to drop a condition stays the per-rule ✕ (remove rule).

### 3. OOM fix — stable `[items]` reference for the boolean editor

**Root cause.** `sd-select` does `#items$ = toObservable(this.actualItems)` and its
subscription calls `markForCheck()`. The boolean branch binds
`[items]="booleanItems(fieldOf(rule)!)"`, and `booleanItems()` builds a **new array every
change-detection cycle**. New reference → observable emits → `markForCheck()` → next CD →
new array → infinite loop → OOM. Boolean is the only editor that allocates a fresh array;
`values` reuses the stable `field.values` reference and operators use module constants.

**Fix.** Make the boolean items reference stable. Add a `computed` that builds a
`Map<fieldKey, SdQueryBuilderFieldOption[]>` from `fields()` once; the template reads the
memoized array for the rule's field. Same reference across CDs → no loop.

### 4. Relative dates

**Model** (`query-builder.model.ts`):

```ts
/** A relative (resolved-at-query-time) date value, stored in Filter.data for date/datetime rules. */
export interface SdQbRelativeDate {
  /** 'now' = current moment/today · 'offset' = now ± amount × unit. */
  rel: 'now' | 'offset';
  /** Offset unit — only for rel='offset'. */
  unit?: 'day' | 'week' | 'month';
  /** Offset magnitude (>= 1) — only for rel='offset'. */
  amount?: number;
  /** Offset direction — only for rel='offset'. */
  direction?: 'previous' | 'next';
}
```

Helpers (pure, exported, TDD-first):
- `qbIsRelativeDate(v): v is SdQbRelativeDate` — type guard (`v?.rel === 'now' | 'offset'`).
- `qbDefaultRelative(): SdQbRelativeDate` → `{ rel:'offset', unit:'day', amount:1, direction:'previous' }`.
- Option constants (module-level, stable refs): `QB_DATE_MODES` (Ngày cụ thể / Hôm nay /
  Tương đối), `QB_RELATIVE_UNITS` combined direction×unit list (6 entries: ngày trước, ngày
  tới, tuần trước, tuần tới, tháng trước, tháng tới) each `{ value:{unit,direction}, display }`.

**Emitted `Filter` examples:**
- Today: `{ field:'createdAt', operator:'GREATER_THAN', data:{ rel:'now' } }`
- 3 days ago: `data:{ rel:'offset', unit:'day', amount:3, direction:'previous' }`
- Next month: `data:{ rel:'offset', unit:'month', amount:1, direction:'next' }`

**UI** — only for single-value date/datetime operators (`EQUAL`, `NOT_EQUAL`,
`GREATER_THAN`, `LESS_THAN`); not BETWEEN, not NULL/NOT_NULL:

- A "time mode" `sd-select`: **Ngày cụ thể** / **Hôm nay** / **Tương đối**.
- `Ngày cụ thể` → existing `sd-date` / `sd-datetime` picker (absolute value).
- `Hôm nay` → no further control; value = `{ rel:'now' }`.
- `Tương đối` → `sd-input type=number` (amount, min 1) + `sd-select` of the 6 combined
  unit/direction options; value = `{ rel:'offset', unit, amount, direction }`.
- The mode is **derived from `rule.value`** (object with `rel:'now'` → now; object with
  `rel:'offset'` → relative; otherwise → absolute) — no extra component state. Changing mode
  reseeds the value (now → `{rel:'now'}`, relative → `qbDefaultRelative()`, absolute → `null`).

Component helpers: `dateMode(rule)`, `setDateMode(rule, mode)`, `setRelativeAmount(rule, n)`,
`setRelativeUnitDir(rule, {unit,direction})`. All route through the existing
`#apply()` (mutate → bump → commit).

**Serializer** (`query-builder.serializer.ts`):
- `ruleToFilter`: a relative object is a non-empty value → pass straight into `data`. Guard
  in `isEmptyValue` so `{rel:...}` is never treated as empty; for `rel:'offset'` require a
  valid `amount`/`unit`/`direction` (else drop the incomplete rule).
- `filterToTree` / `ruleFromFilter`: a `data` that is a relative object round-trips back into
  `rule.value` unchanged.
- View tokens (`ruleTokens` / `formatScalar`): render a relative value as readable text —
  `hôm nay`, `3 ngày trước`, `1 tháng tới` (unit map: day→ngày, week→tuần, month→tháng;
  direction map: previous→trước, next→tới).

## File structure

- `query-builder.model.ts` — `SdQbRelativeDate`, guards, defaults, option constants.
- `query-builder.serializer.ts` — relative round-trip + view-token rendering.
- `query-builder.component.ts` — `setField` guard, stable boolean-items computed, date-mode
  helpers.
- `query-builder.component.html` — `hideInlineError` everywhere; date/datetime single-value
  branch gains the mode select + conditional absolute/now/relative editors.
- `query-builder.component.scss` — minor layout for the relative controls row (reuse `qb-*`).
- `query-builder.component.spec.ts` / `query-builder.serializer.spec.ts` — new tests.
- `projects/showcase/.../query-builder/query-builder-demo.component.ts` — add a datetime field
  demonstrating relative dates; section props document the new capability.
- `projects/sdcorejs-angular/components/query-builder/sd-query-builder.md` — document the new model,
  the date-mode editor, the field-swap-only rule, and the `hideInlineError` rows.

## Acceptance criteria

1. Each rule row has no reserved inline-error space; required errors still surface via tooltip.
2. The field `sd-select` cannot be emptied; `setField(rule, null)` is a no-op; the field is
   only swappable.
3. Switching a rule's field to a boolean field does not loop: `booleanItems`/the memoized
   options return the **same array reference** across calls for the same field, and a
   field-change integration spec completes without exceeding CD limits.
4. A date/datetime single-value rule can pick *now* / *relative* / *absolute*; the emitted
   `Filter.data` matches the `SdQbRelativeDate` shapes above; absolute still emits the raw date.
5. `BETWEEN` and NULL/NOT_NULL editors are unchanged (no mode select).
6. Round-trip: seeding `[value]` with a relative `data` rebuilds the correct mode + controls.
7. View mode renders relative values as readable Vietnamese text.
8. `npm run build` clean; query-builder unit + integration specs green; `sd-query-builder.md`
   and the showcase demo updated in the same commit.

## Risks

- **CD-loop regression elsewhere.** Any other `[items]` bound to a freshly-allocated array
  would hit the same `sd-select` loop. Audit the template for fresh allocations while fixing
  boolean; keep all new option lists as stable constants/computed.
- **Serializer empty-value semantics.** A relative object must be recognised as non-empty;
  an *incomplete* offset (missing amount/unit/direction) must be dropped, not emitted.
- **i18n debt.** New strings are hard-coded VN to match the existing component; flagged for a
  later i18n pass over the whole component.

## Decisions (confirmed with user)

- Encoding: structured object in `Filter.data` (`{ rel, unit, amount, direction }`).
- Units: now + day / week / month (default day); no minute/hour.
- Scope: date + datetime, single-value operators only (no BETWEEN).
- Field: hard-block clearing — swap only.
- Strings: hard-coded Vietnamese (consistent with the rebuilt component); i18n deferred.
