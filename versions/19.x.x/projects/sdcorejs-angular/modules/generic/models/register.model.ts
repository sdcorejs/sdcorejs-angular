import { SdSearchReq } from '@sdcorejs/angular/forms/models';
import { SdFilter, SdPagingReq, SdPagingRes, SdQueryReq } from '@sdcorejs/angular/utilities/models';
import { SdSchema } from './schema/schema.model';

export interface SdRegister<T = any> {
  schema: () => Promise<SdSchema>;
  paging: (req?: SdPagingReq<T>) => Promise<SdPagingRes<T>>;
  all?: (req?: SdQueryReq<T>) => Promise<T[]>;
  search?: (req: SdSearchReq, filters?: SdFilter[]) => Promise<T[]>;
  detail?: (identityValue: string | number) => Promise<T>;
  create?: (entity: Partial<T>) => Promise<T>;
  update?: (identityValue: string | number, entity: Partial<T>) => Promise<T>;
  remove?: (identityValue: string | number) => Promise<void>;
}

export interface SdRegisterArgs<TData = any> {
  data?: TData;
}

