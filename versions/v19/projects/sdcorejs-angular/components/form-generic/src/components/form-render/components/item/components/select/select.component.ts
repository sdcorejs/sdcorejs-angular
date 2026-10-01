import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdSelect } from '@sdcorejs/angular/forms';
import type { SdSearch, SdSearchReq } from '@sdcorejs/angular/forms/models';
import type { SdFormGenericCatalogContext, SdFormGenericCatalogItem } from '../../../../../../models/form-generic-config.model';
import type { SdFormGenericOption, SdFormGenericSelect } from '../../../../../../models/form-generic-field.model';
import { sdStableStringify } from '../../../../../../models/form-generic-schema';
import { HyperlinkPipe } from '../../../../../../pipes';
import { sdFillPatch, sdResolveParams } from '../../../../../../rules/form-generic-values';
import { FormRenderCatalog } from '../../../../form-render-catalog';
import { FormRenderContext } from '../../../../form-render.context';

const sameParams = (left: Record<string, unknown>, right: Record<string, unknown>) => sdStableStringify(left) === sdStableStringify(right);

@Component({
  selector: 'lib-select',
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdSelect, HyperlinkPipe],
})
export class SelectComponent {
  readonly field = input.required<SdFormGenericSelect>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  readonly #catalog = inject(FormRenderCatalog);
  readonly #loaded = signal<SdFormGenericCatalogItem[]>([]);
  /** Mục đã thấy (tải hoặc tìm) theo value — để `fill` đọc `item.data` của mục được chọn. */
  readonly #seen = new Map<string, SdFormGenericCatalogItem>();
  #request = 0;

  readonly labelPlacement = this.#context.labelPlacement;
  readonly scope = this.#context.scope;
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key] as string | string[] | null | undefined);
  readonly #catalogId = computed(() => {
    const options = this.field().options;
    return options?.source === 'catalog' ? options.catalog : null;
  });
  /** Params đã giải; chỉ đổi khi giá trị thực sự đổi (không phải mỗi lần gõ ở field khác). */
  readonly params = computed(
    () => {
      const options = this.field().options;
      return options?.source === 'catalog' ? sdResolveParams(options.params, this.#context.value(), this.#context.variables()) : {};
    },
    { equal: sameParams }
  );
  readonly #searchable = computed(() => {
    const id = this.#catalogId();
    return !!id && this.#catalog.searchable(id);
  });

  readonly items = computed<SdFormGenericOption[] | SdSearch>(() => {
    const options = this.field().options;
    if (options?.source !== 'catalog') return options?.items ?? [];
    if (!this.#searchable()) return this.#loaded();
    const id = options.catalog;
    const params = this.params();
    return (request: SdSearchReq) => this.#search(id, params, request);
  });

  constructor() {
    // why: a catalog without search is loaded once per resolved params; a newer request wins.
    effect(() => {
      const id = this.#catalogId();
      if (!id || this.#searchable()) return;
      const params = this.params();
      untracked(() => {
        const request = ++this.#request;
        this.#catalog
          .load(id, params, this.#catalogContext())
          .then(items => {
            if (request !== this.#request) return;
            items.forEach(item => this.#seen.set(item.value, item));
            this.#loaded.set(items);
          })
          .catch(() => {
            if (request === this.#request) this.#loaded.set([]);
          });
      });
    });
  }

  select(value: unknown): void {
    const field = this.field();
    const patch: Record<string, unknown> = { [field.key]: value };
    const options = field.options;
    if (options?.source === 'catalog' && options.fill?.length && !field.multiple) {
      const selected = value === null || value === undefined || value === '' ? null : (this.#seen.get(String(value)) ?? null);
      Object.assign(patch, sdFillPatch(options.fill, selected));
    }
    this.#context.patch(patch);
  }

  #catalogContext(): SdFormGenericCatalogContext {
    return { field: this.field(), value: this.#context.value(), variables: this.#context.variables() };
  }

  async #search(id: string, params: Record<string, unknown>, request: SdSearchReq): Promise<SdFormGenericOption[]> {
    if (request.type === 'VALUE') {
      const values = (Array.isArray(request.value) ? request.value : [request.value])
        .filter(item => item !== undefined && item !== null && item !== '')
        .map(String);
      const labels = await this.#catalog.labels(id, values, params, this.#catalogContext());
      return values.filter(value => labels[value] !== undefined).map(value => this.#seen.get(value) ?? { value, label: labels[value] });
    }
    const items = await this.#catalog.search(id, request.searchText ?? '', params, this.#catalogContext());
    items.forEach(item => this.#seen.set(item.value, item));
    return items;
  }
}
