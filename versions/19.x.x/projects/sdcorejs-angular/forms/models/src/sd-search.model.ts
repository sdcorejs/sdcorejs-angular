export interface SdSearchReq<TData extends string | number = string> {
  type: 'SEARCH' | 'VALUE';
  searchText?: string;
  searchFields?: string[]; // Các field muốn searchs
  value?: TData | TData[];
}
export type SdSearch<T = any> = (args: SdSearchReq) => Promise<T[]>;
