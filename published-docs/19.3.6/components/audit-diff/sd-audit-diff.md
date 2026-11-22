# `<sd-audit-diff>` and `sdBuildAuditDiff`

**Type:** pure diff engine + standalone presentation component
**Selector:** `sd-audit-diff`
**Import path:** `@sdcorejs/angular/components/audit-diff`
**Change detection:** `OnPush`

## Purpose

Compare two business snapshots without embedding comparison logic in an Angular template. `sdBuildAuditDiff()` creates deterministic typed rows; `<sd-audit-diff>` presents those rows as a semantic table or detail list.

## Basic usage

```ts
readonly before = { profile: { name: 'Ada', team: 'Sales' }, active: true };
readonly after = { profile: { name: 'Ada', team: 'Finance' }, active: false };

readonly options: SdAuditDiffOptions = {
  fields: [
    { path: 'profile.team', label: 'Team', order: 1 },
    { path: 'active', label: 'Active', order: 2 },
  ],
};
```

```html
<sd-audit-diff [before]="before" [after]="after" [options]="options"></sd-audit-diff>
<sd-audit-diff [before]="before" [after]="after" [options]="options" mode="detail-list"></sd-audit-diff>
```

## Diff rules

```ts
interface SdAuditDiffField {
  path: string;
  label?: string;
  order?: number;
  hidden?: boolean;
  redacted?: boolean;
  arrayKey?: string | ((item: unknown) => unknown);
  enumMap?: Readonly<Record<string, unknown>>;
  format?: (value: unknown, context: SdAuditDiffFormatContext) => unknown;
}
```

`SdAuditDiffOptions.rootLabel` overrides the localized label used when comparing root scalar values.

- Nested plain objects become leaf rows.
- Arrays are atomic unless their field has `arrayKey`. Stable arrays use canonical config paths such as `lines[].quantity` and type-qualified, URI-encoded instance paths such as `lines[id=string%3AA].quantity`; reorder alone creates no rows and keys like `1` / `"1"` remain distinct.
- Missing/duplicate/non-primitive stable keys fall back to one atomic array row so data is never silently dropped.
- `enumMap` and `format` run in the pure engine before rows reach the template.
- Explicit `order` sorts configured rows first; remaining rows use deterministic lexical paths.
- `includeUnchanged` includes `unchanged` rows; the default is changed rows only.
- `null`, explicit `undefined`, and a missing side remain distinct in normalized row metadata.

## Protected values

`hidden` removes the path and descendants. `redacted` classifies changes with raw values but replaces values before returning a row. Parent and nested stable-array rules are applied before normalized rows reach a template. Never use a formatter as a security boundary; use `hidden` or `redacted`.

```ts
const options: SdAuditDiffOptions = {
  redactedValue: '[redacted]',
  fields: [
    { path: 'password', hidden: true },
    { path: 'credentials.token', redacted: true },
  ],
};
```

## Custom value template

```html
<sd-audit-diff [before]="before" [after]="after">
  <ng-template sdAuditDiffValue let-value let-row="row" let-side="side">
    <app-audit-value [value]="value" [field]="row.configPath" [side]="side"></app-audit-value>
  </ng-template>
</sd-audit-diff>
```

The typed context contains `$implicit`, `row`, and `side: 'before' | 'after'`. Values are already mapped/formatted/redacted.

## Accessibility and responsive behavior

Table mode uses column headers and `scope="row"` field headers. Detail-list mode uses `dl`/`dt`/`dd` and repeats localized Before/After labels. The empty result is a polite status. Table mode scrolls horizontally on narrow hosts; detail-list mode collapses to one column below `640px`.
