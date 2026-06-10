# Query Builder Field Compare

Track: angular-portal
Date: 2026-06-10 02:14 Asia/Saigon

## Summary

Added field-to-field comparison support to `<sd-query-builder>` while keeping literal-only mode as the default.

## Changes

- Added `comparisonMode: 'value-only' | 'value-or-field'` input. Default `value-only` keeps the existing literal-value builder behavior.
- Added per-rule internal `valueSource: 'literal' | 'field'` plus `compareField` state.
- Field references emit the canonical `@sdcorejs/utils` filter shape: `{ dataType: 'field', data: '<rightField>' }`.
- Candidate compare fields are same `SdQueryBuilderField.type`, exclude the left field, skip `allowFieldCompare: false`, and honor matching `compareGroup` when declared.
- Field compare is limited to single-operand operators. `BETWEEN`, `IN`, `NOT_IN`, `NULL`, and `NOT_NULL` do not show field operands.
- `filterToTree` and `filterToTokens` round-trip/render `dataType: 'field'`.
- Updated `sd-query-builder.md` and query-builder specs.

## Verification

- `npm run test -- sd-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/query-builder/src/*.spec.ts` -> 83 specs passed.
- `npm run build` still fails in pre-existing/unrelated `components/query-bar` Angular metadata errors (`Unknown reference` in standalone imports), not in query-builder.
