# Utilities — Models

**Import path**: `@sdcorejs/angular/utilities/models`
**Canonical source**: most types are re-exported from `@sdcorejs/utils/models` / `@sdcorejs/utils/constants`. Prefer importing from `@sdcorejs/utils` directly when there is no Angular dependency.

Type-only contracts shared across `@sdcorejs/angular` components, services, and the consuming app (filters, paging, ordering, theming tokens, ...). No runtime code beyond a couple of small constants.

| File | Exported types / values | Source | Purpose |
| --- | --- | --- | --- |
| `color.model.ts` | `Color` (type) | `@sdcorejs/utils/models` | String union `'primary' \| 'secondary' \| 'info' \| 'success' \| 'warning' \| 'error'` — the canonical theme-color token used by buttons, badges, alerts, ... |
| `empty.model.ts` | `EMPTY_STR` (const `'--'`) | `@sdcorejs/utils/constants` | Default placeholder shown by display pipes/components when a value is `null`/`undefined`. |
| `filter.model.ts` | `Filter`, `FilterHasData`, `FilterBetween`, `FilterNoData`, `FilterAndOr` | `@sdcorejs/utils/models` | Discriminated union describing a query filter expression — single-field with data / `BETWEEN` range / no-data (`NULL`/`NOT_NULL`) / nested `AND`/`OR` group. Used by list components and `PagingReq`. |
| `icon.model.ts` | `SdIconSet` (type), `SdMaterialIconSet` (type), `DefaultSdIconSet` (const), `DefaultSdMaterialIconSet` (const) | local (Angular-only) | Shared icon set types for Material font families and Lucide, plus Core UI defaults. |
| `maybe-async.model.ts` | `MaybeAsync<T>` (type), `resolveMaybeAsync<T>` (fn → `Promise<T>`), `normalizeAsync<T>` (fn → `Observable<T>`) | `@sdcorejs/utils/models` | "Sync-or-async" value: `T \| Promise<T> \| Observable<T>`, plus two helpers to coerce into a single shape. Lets APIs accept any of the three forms transparently. |
| `nested-key-of.model.ts` | `NestedKeyOf<T>` (type) | `@sdcorejs/utils/models` | Recursive dotted-path key generator — e.g. `NestedKeyOf<Order>` produces `'id' \| 'customer.name' \| 'customer.address.city' \| ...`. Powers strongly-typed `field`/`fields` parameters in filters/orders/queries. |
| `operator.model.ts` | `Operator`, `OperatorHasData`, `OperatorNoData` (types) | `@sdcorejs/utils/models` | All filter operators (`EQUAL`, `NOT_EQUAL`, `CONTAIN`, `IN`, `BETWEEN`, `NULL`, ...). For a `{value, icon, display}` table to render operator pickers, use `OPERATORS` from `@sdcorejs/utils/constants` (or the `<sd-operator>` component, which already consumes it). |
| `order.model.ts` | `Order<T>` (interface) | `@sdcorejs/utils/models` | `{ field: NestedKeyOf<T>; direction: 'ASC' \| 'DESC' }` — sort spec used in paging requests. |
| `paging.model.ts` | `QueryReq<T>`, `PagingReq<T>`, `PagingRes<T>` (interfaces) | `@sdcorejs/utils/models` | Standard request/response shapes for filtered & paginated list APIs. `PagingRes` is `{ items, total }`. |
| `pattern.model.ts` | `ValidationPatternType` (type), `ValidationPattern` (interface), `VALIDATION_PATTERNS` (const) | types: `@sdcorejs/utils/models` · constant: `@sdcorejs/utils/constants` | Predefined validation pattern catalog (`EMAIL`, `PHONE`, `VN_PHONE`, `VN_ID`, `PASSPORT`, `VN_ID_OR_PASSPORT`, `TIME`, `URL`, `DOMAIN`, `IPV4`, `IPV6`, `IMAGE_URL`, `SLUG`, `NUMBER`, `INTEGER`, `DECIMAL`, `POSITIVE_NUMBER`, ...) — each row is `{ type, name, pattern, errorMessage }` where `name` and `errorMessage` are i18n keys. Used by form components for built-in validators. |
| `size.model.ts` | `Size` (type) | `@sdcorejs/utils/models` | String union `'sm' \| 'md' \| 'lg'` — common size token across components. |
| `unwrap-signal.model.ts` | `SdUnwrapSignal<T>`, `SdUnwrapSafe<T>` (types) | local (Angular-only) | Conditional types that unwrap `InputSignal<T>` / `InputSignalWithTransform<T, U>` / `ModelSignal<T>` to their underlying value type — used when generating typed prop maps over Angular signal-based component APIs. `SdUnwrapSafe` adds `NonNullable`. |

## Notes

- `Filter`, `Order`, `PagingReq` all parameterize over an entity type `T` and use `NestedKeyOf<T>` to constrain `field` keys at compile time.
- `pattern.model.ts` no longer depends on `@sdcorejs/angular/utilities/extensions`: regex strings live inside `VALIDATION_PATTERNS` records (sourced from `@sdcorejs/utils/constants`).

## Removed aliases

`SdOperator`, `SdOperatorHasData`, `SdOperatorNoData` and the `SdOperators` lookup table have been **removed**. `SdOperator` in particular now unambiguously refers to the `<sd-operator>` component class exported from `@sdcorejs/angular/components/operator`; while the deprecated type alias also existed, the root barrel `@sdcorejs/angular` could not be compiled at all. Use `Operator` from `@sdcorejs/utils/models` and `OPERATORS` from `@sdcorejs/utils/constants`.

## Deprecated aliases — REMOVED (BREAKING)

Every `@deprecated` re-export alias under `utilities/**` was **deleted**, with no replacement shim. Use the
canonical name from the table above.

| Removed alias | Use instead | From |
| --- | --- | --- |
| `SdColor` | `Color` | `@sdcorejs/utils/models` |
| `SdSize` | `Size` | `@sdcorejs/utils/models` |
| `SdNestedKeyOf<T>` | `NestedKeyOf<T>` | `@sdcorejs/utils/models` |
| `SdOrder<T>` | `Order<T>` | `@sdcorejs/utils/models` |
| `SdFilter<T>`, `SdFilterHasData<T>`, `SdFilterBetween<T>`, `SdFilterNoData<T>`, `SdFilterAndOr<T>` | `Filter<T>`, `FilterHasData<T>`, `FilterBetween<T>`, `FilterNoData<T>`, `FilterAndOr<T>` | `@sdcorejs/utils/models` |
| `SdQueryReq<T>`, `SdPagingReq<T>`, `SdPagingRes<T>` | `QueryReq<T>`, `PagingReq<T>`, `PagingRes<T>` | `@sdcorejs/utils/models` |
| `SdMaybeAsync<T>`, `SdResolveMaybeAsync`, `SdNormalizeAsync` | `MaybeAsync<T>`, `resolveMaybeAsync`, `normalizeAsync` | `@sdcorejs/utils/models` |
| `SD_EMPTY_STR` | `EMPTY_STR` | `@sdcorejs/utils/constants` |
| `hslToHex`, `rgbToHex` (module-level) | `ColorUtilities.hslToHex`, `ColorUtilities.rgbToHex` | `@sdcorejs/utils/fns` |
| `StringUtilities.REGEX_PHONE_VN` / `.REGEX_IDVN` / `.REGEX_IDVN_OR_PASSPORT` | `StringUtilities.REGEX_VN_PHONE` / `.REGEX_VN_ID` / `.REGEX_VN_ID_OR_PASSPORT` | `@sdcorejs/utils/fns` |
| `StringUtilities.isValidEmail` / `.isValidPhone` / `.isValidCode` | `ValidationUtilities.isEmail` / `.isPhone` / `.isCode` | `@sdcorejs/utils/fns` |
| `SdPatternType`, `SdPatternCommon`, `SdPatternCommons` | `ValidationPatternType`, `ValidationPattern`, `VALIDATION_PATTERNS` | types: `@sdcorejs/utils/models` · constant: `@sdcorejs/utils/constants` |

⚠️ The pattern migration is not a pure rename: the record field `regex` is now `pattern`, and three enum
members were renamed (`PHONE_VN` → `VN_PHONE`, `IDVN` → `VN_ID`, `IDVN_OR_PASSPORT` → `VN_ID_OR_PASSPORT`),
each with a matching i18n-key change (`core.validator.cccd.*` → `core.validator.vn-id.*`, etc.).
`<sd-input [pattern]>` still accepts the three legacy strings through an internal alias map, so templates do
not break — only direct imports of the removed types do.

**`SdUtilities` is NOT removed.** Despite its former `@deprecated` marker it is not an alias: all 14 members
are implemented locally in `utilities/extensions/src/utility.extension.ts`. The misleading marker was
dropped; the implementation stays.
