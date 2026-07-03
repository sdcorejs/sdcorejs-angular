# Utilities — Models

**Import path**: `@sdcorejs/angular/utilities/models`
**Canonical source**: most types are re-exported from `@sdcorejs/utils/models` / `@sdcorejs/utils/constants`. Prefer importing from `@sdcorejs/utils` directly when there is no Angular dependency.

Type-only contracts shared across `@sdcorejs/angular` components, services, and the consuming app (filters, paging, ordering, theming tokens, ...). No runtime code beyond a couple of small constants and one `SdOperators` lookup table (i18n-keyed, Angular-only).

| File | Exported types / values | Source | Purpose |
| --- | --- | --- | --- |
| `color.model.ts` | `Color` (type) | `@sdcorejs/utils/models` | String union `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'` — the canonical theme-color token used by buttons, badges, alerts, ... |
| `empty.model.ts` | `EMPTY_STR` (const `'--'`) | `@sdcorejs/utils/constants` | Default placeholder shown by display pipes/components when a value is `null`/`undefined`. |
| `filter.model.ts` | `Filter`, `FilterHasData`, `FilterBetween`, `FilterNoData`, `FilterAndOr` | `@sdcorejs/utils/models` | Discriminated union describing a query filter expression — single-field with data / `BETWEEN` range / no-data (`NULL`/`NOT_NULL`) / nested `AND`/`OR` group. Used by list components and `PagingReq`. |
| `icon.model.ts` | `SdIconSet` (type), `SdMaterialIconSet` (type), `DefaultSdIconSet` (const), `DefaultSdMaterialIconSet` (const) | local (Angular-only) | Shared icon set types for Material font families and Lucide, plus Core UI defaults. |
| `maybe-async.model.ts` | `MaybeAsync<T>` (type), `resolveMaybeAsync<T>` (fn → `Promise<T>`), `normalizeAsync<T>` (fn → `Observable<T>`) | `@sdcorejs/utils/models` | "Sync-or-async" value: `T \| Promise<T> \| Observable<T>`, plus two helpers to coerce into a single shape. Lets APIs accept any of the three forms transparently. |
| `nested-key-of.model.ts` | `NestedKeyOf<T>` (type) | `@sdcorejs/utils/models` | Recursive dotted-path key generator — e.g. `NestedKeyOf<Order>` produces `'id' \| 'customer.name' \| 'customer.address.city' \| ...`. Powers strongly-typed `field`/`fields` parameters in filters/orders/queries. |
| `operator.model.ts` | `Operator`, `OperatorHasData`, `OperatorNoData` (types), `SdOperators` (const lookup table) | types: `@sdcorejs/utils/models` · `SdOperators`: local (Angular-only) | All filter operators (`EQUAL`, `NOT_EQUAL`, `CONTAIN`, `IN`, `BETWEEN`, `NULL`, ...) and a `{value, symbol, display}` table for rendering operator pickers. `SdOperators.display` values are i18n keys (`'core.operator.equal.display'`) — wrap through `I18nService.t()` before render. |
| `order.model.ts` | `Order<T>` (interface) | `@sdcorejs/utils/models` | `{ field: NestedKeyOf<T>; direction: 'ASC' \| 'DESC' }` — sort spec used in paging requests. |
| `paging.model.ts` | `QueryReq<T>`, `PagingReq<T>`, `PagingRes<T>` (interfaces) | `@sdcorejs/utils/models` | Standard request/response shapes for filtered & paginated list APIs. `PagingRes` is `{ items, total }`. |
| `pattern.model.ts` | `ValidationPatternType` (type), `ValidationPattern` (interface), `VALIDATION_PATTERNS` (const) | types: `@sdcorejs/utils/models` · constant: `@sdcorejs/utils/constants` | Predefined validation pattern catalog (`EMAIL`, `PHONE`, `VN_PHONE`, `VN_ID`, `PASSPORT`, `VN_ID_OR_PASSPORT`, `TIME`, `URL`, `DOMAIN`, `IPV4`, `IPV6`, `IMAGE_URL`, `SLUG`, `NUMBER`, `INTEGER`, `DECIMAL`, `POSITIVE_NUMBER`, ...) — each row is `{ type, name, pattern, errorMessage }` where `name` and `errorMessage` are i18n keys. Used by form components for built-in validators. |
| `size.model.ts` | `Size` (type) | `@sdcorejs/utils/models` | String union `'xs' \| 'sm' \| 'md' \| 'lg'` — common size token across components. |
| `unwrap-signal.model.ts` | `SdUnwrapSignal<T>`, `SdUnwrapSafe<T>` (types) | local (Angular-only) | Conditional types that unwrap `InputSignal<T>` / `InputSignalWithTransform<T, U>` / `ModelSignal<T>` to their underlying value type — used when generating typed prop maps over Angular signal-based component APIs. `SdUnwrapSafe` adds `NonNullable`. |

## Notes

- `Filter`, `Order`, `PagingReq` all parameterize over an entity type `T` and use `NestedKeyOf<T>` to constrain `field` keys at compile time.
- `SdOperators` is the only file in this folder that emits non-trivial runtime output — every other re-export is a type alias / interface / small constant.
- `pattern.model.ts` no longer depends on `@sdcorejs/angular/utilities/extensions`: regex strings live inside `VALIDATION_PATTERNS` records (sourced from `@sdcorejs/utils/constants`).

## Deprecated aliases (kept for back-compat)

The previous `Sd*`-prefixed names still type-check via deprecated aliases — `SdColor`, `SdSize`, `SdNestedKeyOf`, `SdOrder`, `SdOperator`, `SdOperatorHasData`, `SdOperatorNoData`, `SdFilter`, `SdFilterHasData`, `SdFilterBetween`, `SdFilterNoData`, `SdFilterAndOr`, `SdQueryReq`, `SdPagingReq`, `SdPagingRes`, `SdMaybeAsync`, `SdResolveMaybeAsync`, `SdNormalizeAsync`, `SD_EMPTY_STR`. New code should use the canonical names listed in the table above.

`SdPatternType` / `SdPatternCommon` / `SdPatternCommons` are kept as deprecated aliases mapping to the OLD shape (`regex` field, legacy enum names `PHONE_VN` / `IDVN` / `IDVN_OR_PASSPORT`). Migrate to `ValidationPatternType` / `ValidationPattern` / `VALIDATION_PATTERNS` which use the renamed enum values (`VN_PHONE` / `VN_ID` / `VN_ID_OR_PASSPORT`) and the `pattern` field.
