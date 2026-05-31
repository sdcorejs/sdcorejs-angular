import { SdSearchReq } from '@sdcorejs/angular/forms/models';
import { Filter, PagingReq, PagingRes, QueryReq } from '@sdcorejs/utils/models';
import { SdSchema } from './schema/schema.model';

export interface SdRegister<T = any> {
  schema: () => Promise<SdSchema>;
  paging: (req?: PagingReq<T>) => Promise<PagingRes<T>>;
  all?: (req?: QueryReq<T>) => Promise<T[]>;
  search?: (req: SdSearchReq, filters?: Filter[]) => Promise<T[]>;
  detail?: (identityValue: string | number) => Promise<T>;
  create?: (entity: Partial<T>) => Promise<T>;
  update?: (identityValue: string | number, entity: Partial<T>) => Promise<T>;
  remove?: (identityValue: string | number) => Promise<void>;
}

export interface SdRegisterArgs<TData = any> {
  data?: TData;
}
