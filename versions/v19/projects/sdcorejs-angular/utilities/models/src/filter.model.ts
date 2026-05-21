import type { Filter, FilterHasData, FilterBetween, FilterNoData, FilterAndOr } from '@sdcorejs/utils/models';
export type { Filter, FilterHasData, FilterBetween, FilterNoData, FilterAndOr };

/** @deprecated Use {@link Filter} from `@sdcorejs/utils/models` instead */
export type SdFilter<T = any> = Filter<T>;
/** @deprecated Use {@link FilterHasData} from `@sdcorejs/utils/models` instead */
export type SdFilterHasData<T = any> = FilterHasData<T>;
/** @deprecated Use {@link FilterBetween} from `@sdcorejs/utils/models` instead */
export type SdFilterBetween<T = any> = FilterBetween<T>;
/** @deprecated Use {@link FilterNoData} from `@sdcorejs/utils/models` instead */
export type SdFilterNoData<T = any> = FilterNoData<T>;
/** @deprecated Use {@link FilterAndOr} from `@sdcorejs/utils/models` instead */
export type SdFilterAndOr<T = any> = FilterAndOr<T>;
