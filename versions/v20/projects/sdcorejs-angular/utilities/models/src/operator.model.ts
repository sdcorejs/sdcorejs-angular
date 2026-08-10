import type { Operator, OperatorHasData, OperatorNoData } from '@sdcorejs/utils/models';
export type { Operator, OperatorHasData, OperatorNoData };

// why: the deprecated `SdOperator` / `SdOperatorHasData` / `SdOperatorNoData` aliases and the
// `SdOperators` table were removed here. `SdOperator` in particular is now unambiguous — it is
// the `<sd-operator>` component class exported from `@sdcorejs/angular/components/operator`.
// While both names existed, the root barrel `@sdcorejs/angular` could not compile (TS2308).
// Use `Operator` from `@sdcorejs/utils/models` and `OPERATORS` from `@sdcorejs/utils/constants`.
