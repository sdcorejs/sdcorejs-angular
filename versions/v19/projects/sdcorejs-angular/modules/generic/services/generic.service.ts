import { Inject, Injectable } from '@angular/core';
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
  constructor(
    protected apiService: SdApiService,
    @Inject(SD_GENERIC_CONFIGURATION) configurations: ISdGenericConfiguration[]
  ) {
    for (const configuration of configurations || []) {
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
      // Náº¿u register cÃ³ phÆ°Æ¡ng thá»©c all thÃ¬ sá»­ dá»¥ng phÆ°Æ¡ng thá»©c Ä‘Ã³
      if (register.all) {
        return await register.all(req);
      }
      const { properties } = await schema();
      // Náº¿u khÃ´ng cÃ³ phÆ°Æ¡ng thá»©c all thÃ¬ sá»­ dá»¥ng phÆ°Æ¡ng thá»©c paging Ä‘á»ƒ láº¥y táº¥t cáº£ dá»¯ liá»‡u
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
      // Náº¿u register cÃ³ phÆ°Æ¡ng thá»©c search thÃ¬ sá»­ dá»¥ng phÆ°Æ¡ng thá»©c Ä‘Ã³
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
            // LuÃ´n filter contain Ä‘á»‘i vá»›i search
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
      // XÃ³a cÃ¡c properties khÃ´ng cho phÃ©p insert trÆ°á»›c khi gá»­i lÃªn
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
      // Náº¿u register cÃ³ phÆ°Æ¡ng thá»©c detail thÃ¬ sá»­ dá»¥ng phÆ°Æ¡ng thá»©c Ä‘Ã³
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
      // XÃ³a cÃ¡c properties khÃ´ng cho phÃ©p update trÆ°á»›c khi gá»­i lÃªn
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

