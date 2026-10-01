import { inject, Injectable } from '@angular/core';
import { SD_FORM_GENERIC_CONFIG } from '../../configurations/form-generic-config.token';
import type { SdFormGenericCatalog, SdFormGenericCatalogContext, SdFormGenericCatalogItem } from '../../models/form-generic-config.model';
import { sdCatalogKey } from '../../rules/form-generic-values';

/**
 * Truy cập catalog của portal cho MỘT `sd-form-render` (provide ở component).
 *
 * why: kết quả `load` được đệm theo catalog id + params đã giải, trong phạm vi instance — hai form
 * trên cùng trang không dùng lẫn dữ liệu, và bộ đệm mất khi form bị huỷ.
 */
@Injectable()
export class FormRenderCatalog {
  readonly #config = inject(SD_FORM_GENERIC_CONFIG);
  readonly #cache = new Map<string, Promise<SdFormGenericCatalogItem[]>>();
  readonly #warned = new Set<string>();

  catalog(id: string): SdFormGenericCatalog | undefined {
    const catalog = this.#config.catalogs.find(candidate => candidate.id === id);
    if (!catalog && !this.#warned.has(id)) {
      this.#warned.add(id);
      console.warn(`[sd-form-render] catalog "${id}" is not registered in provideSdFormGeneric({ catalogs }).`);
    }
    return catalog;
  }

  searchable(id: string): boolean {
    return !!this.catalog(id)?.search;
  }

  load(id: string, params: Record<string, unknown>, context: SdFormGenericCatalogContext): Promise<SdFormGenericCatalogItem[]> {
    const catalog = this.catalog(id);
    if (!catalog) return Promise.resolve([]);
    const key = sdCatalogKey(id, params);
    const cached = this.#cache.get(key);
    if (cached) return cached;
    const pending = Promise.resolve()
      .then(() => catalog.load(params, context))
      .then(items => items ?? []);
    this.#cache.set(key, pending);
    // why: a failed request must be retried on the next call, not remembered.
    pending.catch(() => this.#cache.delete(key));
    return pending;
  }

  async search(
    id: string,
    term: string,
    params: Record<string, unknown>,
    context: SdFormGenericCatalogContext
  ): Promise<SdFormGenericCatalogItem[]> {
    const catalog = this.catalog(id);
    if (!catalog?.search) return this.load(id, params, context);
    return (await catalog.search(term, params, context)) ?? [];
  }

  /** Nhãn của các giá trị đã chọn: `catalog.labels` nếu có, nếu không thì tra trong `load`. */
  async labels(
    id: string,
    values: readonly string[],
    params: Record<string, unknown>,
    context: SdFormGenericCatalogContext
  ): Promise<Record<string, string>> {
    const catalog = this.catalog(id);
    if (!catalog || !values.length) return {};
    const options = catalog.labels ? await catalog.labels([...values], params) : await this.load(id, params, context);
    const labels: Record<string, string> = {};
    for (const option of options ?? []) if (values.includes(option.value)) labels[option.value] = option.label;
    return labels;
  }
}
