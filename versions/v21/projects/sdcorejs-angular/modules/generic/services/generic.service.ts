import { inject, Injectable } from '@angular/core';
import { SdApiService } from '@sdcorejs/angular/services/api';
import { ArrayUtilities, StringUtilities } from '@sdcorejs/angular/utilities';
import { Utilities } from '@sdcorejs/utils/fns';
import { Subject } from 'rxjs';
import { ISdGenericConfiguration, SD_GENERIC_CONFIGURATION } from '../configurations';
import { SdRegister, SdRegisterArgs } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SdGenericService {
  dataChanges = new Subject<{ module: string; typeCode: string }>();
  #register: Record<string, ISdGenericConfiguration['register']> = {};
  protected readonly apiService = inject(SdApiService);
  private readonly configurations: ISdGenericConfiguration[] = inject(SD_GENERIC_CONFIGURATION);

  constructor() {
    for (const configuration of this.configurations || []) {
      for (const module of configuration.modules || []) {
        this.#register[module] = configuration.register;
      }
    }
  }

  getRegister = <T = any>(module: string, typeCode: string, args?: SdRegisterArgs): Required<SdRegister<T>> => {
    const register = this.#register[module]?.(module, typeCode, args);
    if (!register) {
      throw new Error(`Module ${module} not found`);
    }
    const schema: SdRegister<T>['schema'] = async () => {
      return await register.schema();
    };
    const paging: SdRegister<T>['paging'] = async req => {
      return await register.paging(req);
    };
    const all: SdRegister<T>['all'] = async req => {
      // Nếu register có phương thức all thì sử dụng phương thức đó
      if (register.all) {
        return await register.all(req);
      }
      const { properties } = await schema();
      // Nếu không có phương thức all thì sử dụng phương thức paging để lấy tất cả dữ liệu
      return await Utilities.fetchAllByPaging(async (pageSize, pageNumber) => {
        const res = await paging({
          ...req,
          pageSize,
          pageNumber,
          fields: properties.map(e => e.code as any),
        });
        return {
          items: res?.items || [],
          total: res?.total || 0,
        };
      });
    };
    const search: SdRegister<T>['search'] = async (req, filters) => {
      // Nếu register có phương thức search thì sử dụng phương thức đó
      if (register.search) {
        return await register.search(req);
      }
      const { primaryKey, properties } = await schema();
      const { type, searchText, searchFields, value } = req;
      if (type === 'VALUE') {
        if (value) {
          return await all({
            filters: [
              {
                field: primaryKey as never,
                operator: 'IN',
                data: Array.isArray(value) ? value : [value],
              },
            ],
          });
        }
      } else if (type === 'SEARCH') {
        if (StringUtilities.isNullOrWhiteSpace(searchText)) {
          const res = await paging({
            filters: filters || [],
            fields: properties.map(e => e.code as never),
          });
          return res?.items || [];
        } else {
          const searchByField = async (field: string) => {
            const property = properties.find(e => e.code === field);
            if (!property) {
              const res = await paging({
                filters,
              });
              return res?.items || [];
            }
            // Luôn filter contain đối với search
            const res = await paging({
              filters: [
                ...(filters || []),
                {
                  field,
                  operator: 'CONTAIN',
                  data: searchText,
                },
              ],
              fields: properties.map(e => e.code as never),
            });
            return res?.items || [];
          };
          let items: T[] = [];
          for (const field of searchFields || []) {
            const moreItems = await searchByField(field).catch(() => []);
            items = ArrayUtilities.union(primaryKey, [...items, ...moreItems]);
          }
          return items;
        }
      }
      return [];
    };
    const create: SdRegister<T>['create'] = async (entity: Partial<T>) => {
      if (!register.create) {
        throw new Error(`Module ${module} not support create operation`);
      }
      const { properties } = await schema();
      const req: Record<string, any> = { ...entity };
      // Xóa các properties không cho phép insert trước khi gửi lên
      for (const property of properties.filter(e => !e.detail?.insertable)) {
        delete req[property.code];
      }
      const result = await register.create(entity);
      this.dataChanges.next({
        module,
        typeCode,
      });
      return result;
    };
    const detail: SdRegister<T>['detail'] = async identityValue => {
      if (!identityValue) {
        return undefined;
      }
      // Nếu register có phương thức detail thì sử dụng phương thức đó
      if (register.detail) {
        return await register.detail(identityValue);
      }
      const items = await search({
        type: 'VALUE',
        value: identityValue,
      });
      return items?.[0];
    };
    const update: SdRegister<T>['update'] = async (identityValue: string, entity: Partial<T>) => {
      if (!register.update) {
        throw new Error(`Module ${module} not support update operation`);
      }
      const { properties } = await schema();
      const req: Record<string, any> = { ...entity };
      // Xóa các properties không cho phép update trước khi gửi lên
      for (const property of properties.filter(e => !e.detail?.updatable)) {
        delete req[property.code];
      }
      const result = await register.update(identityValue, req);
      this.dataChanges.next({
        module,
        typeCode,
      });
      return result;
    };
    const remove: SdRegister<T>['remove'] = async (identityValue: string) => {
      if (!register.remove) {
        throw new Error(`Module ${module} not support remove operation`);
      }
      const result = await register.remove(identityValue);
      this.dataChanges.next({
        module,
        typeCode,
      });
      return result;
    };
    return {
      schema,
      paging,
      all,
      search,
      create,
      detail,
      update,
      remove,
    };
  };
}
