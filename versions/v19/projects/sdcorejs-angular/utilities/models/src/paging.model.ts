import type { QueryReq, PagingReq, PagingRes } from '@sdcorejs/utils/models';
export type { QueryReq, PagingReq, PagingRes };

/** @deprecated Use {@link QueryReq} from `@sdcorejs/utils/models` instead */
export type SdQueryReq<T = any> = QueryReq<T>;
/** @deprecated Use {@link PagingReq} from `@sdcorejs/utils/models` instead */
export type SdPagingReq<T = any> = PagingReq<T>;
/** @deprecated Use {@link PagingRes} from `@sdcorejs/utils/models` instead */
export type SdPagingRes<T = any> = PagingRes<T>;
