import { inject, Injectable } from '@angular/core';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import type { SdFormGenericField, SdFormGenericOption } from '../models/form-generic-field.model';
import { sdSchemaFields } from '../models/form-generic-schema';
import type { SdFormGenericSchema } from '../models/form-generic-schema.model';
import { sdDisplayValue } from '../rules/form-generic-display';
import { sdCatalogKey, sdResolveParams } from '../rules/form-generic-values';
import { FormGenericService } from './form-generic.service';

@Injectable({
  providedIn: 'root',
})
export class SdFormRenderService {
  readonly #formGeneric = inject(FormGenericService);
  readonly #core = inject(SD_CORE_CONFIGURATION, { optional: true });

  /**
   * Giá trị hiển thị (chuỗi) theo từng field của mỗi entity — cùng định dạng với chế độ chỉ xem.
   * Bỏ qua upload và html. Nhãn của options catalog lấy qua catalog của portal, một lần cho mỗi
   * catalog + params + giá trị.
   */
  async viewEntities(schema: SdFormGenericSchema, entities: readonly Record<string, unknown>[]): Promise<Record<string, string>[]> {
    const fields = sdSchemaFields(schema).filter(field => !!field.key && field.type !== 'upload' && field.type !== 'html');
    const cache = new Map<string, Promise<readonly SdFormGenericOption[]>>();
    const numberFormat = this.#core?.format?.number;
    const results: Record<string, string>[] = [];
    for (const entity of entities ?? []) {
      const result: Record<string, string> = {};
      for (const field of fields) {
        const value = entity?.[field.key as string];
        const labels = await this.#catalogLabels(field, value, entity ?? {}, cache);
        result[field.key as string] = sdDisplayValue(field, value, { labels, numberFormat });
      }
      results.push(result);
    }
    return results;
  }

  /**
   * Nhãn của các giá trị catalog. why: `labels(values)` được đệm theo catalog + params + giá trị, còn
   * `load(params)` trả CẢ danh sách nên chỉ đệm theo catalog + params — 1000 entity cùng tham số chỉ tải
   * một lần, không phải một lần cho mỗi giá trị khác nhau.
   */
  async #catalogLabels(
    field: SdFormGenericField,
    value: unknown,
    entity: Readonly<Record<string, unknown>>,
    cache: Map<string, Promise<readonly SdFormGenericOption[]>>
  ): Promise<Record<string, string> | undefined> {
    if ((field.type !== 'select' && field.type !== 'radio') || field.options?.source !== 'catalog') return undefined;
    const values = (Array.isArray(value) ? value : [value]).filter(item => item !== undefined && item !== null && item !== '').map(String);
    const catalog = this.#formGeneric.catalog(field.options.catalog);
    if (!catalog || !values.length) return undefined;
    const params = sdResolveParams(field.options.params, entity, {});
    const key = catalog.labels ? `${sdCatalogKey(catalog.id, params)}|${values.join(',')}` : sdCatalogKey(catalog.id, params);
    let pending = cache.get(key);
    if (!pending) {
      pending = Promise.resolve()
        .then(() => (catalog.labels ? catalog.labels(values, params) : catalog.load(params, { field, value: entity, variables: {} })))
        .then(options => options ?? [])
        .catch(error => {
          console.error(error);
          return [];
        });
      cache.set(key, pending);
    }
    const labels: Record<string, string> = {};
    for (const option of await pending) if (values.includes(option.value)) labels[option.value] = option.label;
    return labels;
  }
}
