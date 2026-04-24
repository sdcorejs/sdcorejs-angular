import { SdFilter } from './filter.model';
import { SdNestedKeyOf } from './nested-key-of.model';
import { SdOrder } from './order.model';

export interface SdQueryReq<T = any> {
  filters?: SdFilter<T>[];
  fields?: SdNestedKeyOf<T>[];
}

export interface SdPagingReq<T = any> extends SdQueryReq<T> {
  pageSize?: number;
  pageNumber?: number;
  orders?: SdOrder<T>[];
}

export interface SdPagingRes<T = any> {
  items: T[];
  total: number;
}
