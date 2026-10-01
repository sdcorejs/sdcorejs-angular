import { inject, Injectable } from '@angular/core';
import { SD_FORM_GENERIC_CONFIG } from '../configurations/form-generic-config.token';
import type {
  SdFormGenericCatalog,
  SdFormGenericHtmlDefinition,
  SdFormGenericTemplate,
  SdFormGenericValidator,
} from '../models/form-generic-config.model';

/**
 * Đọc cấu hình của portal (`provideSdFormGeneric`) cho renderer và builder.
 * Không có state theo form: bộ đệm catalog theo từng renderer nằm ở `FormRenderCatalog`.
 */
@Injectable({
  providedIn: 'root',
})
export class FormGenericService {
  readonly #config = inject(SD_FORM_GENERIC_CONFIG);
  #htmlDefinitions?: Promise<SdFormGenericHtmlDefinition[]>;

  get catalogs(): readonly SdFormGenericCatalog[] {
    return this.#config.catalogs;
  }

  get templates(): readonly SdFormGenericTemplate[] {
    return this.#config.templates;
  }

  get validators(): readonly SdFormGenericValidator[] {
    return this.#config.validators;
  }

  catalog(id: string | null | undefined): SdFormGenericCatalog | undefined {
    return id ? this.#config.catalogs.find(catalog => catalog.id === id) : undefined;
  }

  /** Danh sách html definition; hàm/Promise của portal chỉ được gọi một lần. */
  htmlDefinitions(): Promise<SdFormGenericHtmlDefinition[]> {
    this.#htmlDefinitions ??= Promise.resolve()
      .then(() => {
        const source = this.#config.htmlDefinitions;
        return typeof source === 'function' ? source() : source;
      })
      .then(definitions => definitions ?? [])
      .catch(error => {
        console.error(error);
        this.#htmlDefinitions = undefined;
        return [];
      });
    return this.#htmlDefinitions;
  }

  async htmlDefinition(id: string | null | undefined): Promise<SdFormGenericHtmlDefinition | undefined> {
    if (!id) return undefined;
    return (await this.htmlDefinitions()).find(definition => definition.id === id);
  }

  /** Nội dung của html definition: chuỗi tĩnh, hoặc kết quả `content(params)` của definition query. */
  async htmlContent(id: string | null | undefined, params: Record<string, unknown> = {}): Promise<string> {
    const definition = await this.htmlDefinition(id);
    if (!definition) return '';
    if (definition.type === 'static') return definition.content ?? '';
    try {
      return (await definition.content(params)) ?? '';
    } catch (error) {
      console.error(error);
      return '';
    }
  }
}
