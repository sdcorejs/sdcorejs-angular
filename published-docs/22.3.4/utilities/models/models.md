# Utilities — Models

**Import path**: `@sdcorejs/angular/utilities/models`

Angular-only type helpers owned by this library.

> **No more `@sdcorejs/utils` re-exports.** This entry point used to re-export the shared domain types (`Color`, `Size`, `Filter`, `Operator`, `Order`, `NestedKeyOf`, `QueryReq` / `PagingReq` / `PagingRes`, `MaybeAsync` + helpers, `ValidationPattern*` / `VALIDATION_PATTERNS`, `EMPTY_STR`). Those re-exports are removed: anything owned by `@sdcorejs/utils` is imported from `@sdcorejs/utils/models` / `@sdcorejs/utils/constants` directly and documented there. The former `@sdcorejs/angular/models` leaf entry point (`Language`, `SUPPORTED_LANGUAGES`) is removed for the same reason. `@sdcorejs/utils` is a runtime dependency of this package, so it is already in your tree — add it to your own `package.json` when you import from it directly.

| File | Exported types / values | Purpose |
| --- | --- | --- |
| `icon.model.ts` | `SdIconSet` (type), `SdMaterialIconSet` (type), `DefaultSdIconSet` (const), `DefaultSdMaterialIconSet` (const) | Shared icon set types for Material font families and Lucide, plus Core UI defaults. |
| `unwrap-signal.model.ts` | `SdUnwrapSignal<T>`, `SdUnwrapSafe<T>` (types) | Conditional types that unwrap `InputSignal<T>` / `InputSignalWithTransform<T, U>` / `ModelSignal<T>` to their underlying value type — used when generating typed prop maps over Angular signal-based component APIs. `SdUnwrapSafe` adds `NonNullable`. |

## Where the shared domain types live now

| Symbol | Import from |
| --- | --- |
| `Color`, `Size`, `Order<T>`, `NestedKeyOf<T>` | `@sdcorejs/utils/models` |
| `Filter`, `FilterHasData`, `FilterBetween`, `FilterNoData`, `FilterAndOr` | `@sdcorejs/utils/models` |
| `Operator`, `OperatorHasData`, `OperatorNoData` | `@sdcorejs/utils/models` (operator table `OPERATORS`: `@sdcorejs/utils/constants`) |
| `QueryReq<T>`, `PagingReq<T>`, `PagingRes<T>` | `@sdcorejs/utils/models` |
| `MaybeAsync<T>`, `resolveMaybeAsync`, `normalizeAsync` | `@sdcorejs/utils/models` |
| `ValidationPatternType`, `ValidationPattern` | `@sdcorejs/utils/models` |
| `VALIDATION_PATTERNS`, `EMPTY_STR` | `@sdcorejs/utils/constants` |
| `Language`, `SUPPORTED_LANGUAGES` | `@sdcorejs/utils/models` / `@sdcorejs/utils/constants` |

## Removed aliases

`SdOperator`, `SdOperatorHasData`, `SdOperatorNoData` and the `SdOperators` lookup table have been **removed**. `SdOperator` in particular now unambiguously refers to the `<sd-operator>` component class exported from `@sdcorejs/angular/components/operator`; while the deprecated type alias also existed, the root barrel `@sdcorejs/angular` could not be compiled at all. Use `Operator` from `@sdcorejs/utils/models` and `OPERATORS` from `@sdcorejs/utils/constants`.

## Deprecated aliases — REMOVED (BREAKING)

Every `@deprecated` re-export alias under `utilities/**` was **deleted**, with no replacement shim. Use the
canonical name from the table below.

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
