import type { MaybeAsync } from '@sdcorejs/utils/models';
import { resolveMaybeAsync, normalizeAsync } from '@sdcorejs/utils/models';
export type { MaybeAsync };
export { resolveMaybeAsync, normalizeAsync };

/** @deprecated Use {@link MaybeAsync} from `@sdcorejs/utils/models` instead */
export type SdMaybeAsync<T> = MaybeAsync<T>;
/** @deprecated Use {@link resolveMaybeAsync} from `@sdcorejs/utils/models` instead */
export const SdResolveMaybeAsync = resolveMaybeAsync;
/** @deprecated Use {@link normalizeAsync} from `@sdcorejs/utils/models` instead */
export const SdNormalizeAsync = normalizeAsync;
