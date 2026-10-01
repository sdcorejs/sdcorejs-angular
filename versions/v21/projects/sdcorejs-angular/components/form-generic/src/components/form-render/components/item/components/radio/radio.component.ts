import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdRadio } from '@sdcorejs/angular/forms';
import type { SdFormGenericCatalogItem } from '../../../../../../models/form-generic-config.model';
import type { SdFormGenericOption, SdFormGenericRadio } from '../../../../../../models/form-generic-field.model';
import { sdStableStringify } from '../../../../../../models/form-generic-schema';
import { HyperlinkPipe } from '../../../../../../pipes';
import { sdFillPatch, sdResolveParams } from '../../../../../../rules/form-generic-values';
import { FormRenderCatalog } from '../../../../form-render-catalog';
import { FormRenderContext } from '../../../../form-render.context';

@Component({
  selector: 'lib-radio',
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdRadio, HyperlinkPipe],
})
export class RadioComponent {
  readonly field = input.required<SdFormGenericRadio>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  readonly #catalog = inject(FormRenderCatalog);
  readonly #loaded = signal<SdFormGenericCatalogItem[]>([]);
  #request = 0;

  readonly scope = this.#context.scope;
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key] as string | null | undefined);
  readonly params = computed(
    () => {
      const options = this.field().options;
      return options?.source === 'catalog' ? sdResolveParams(options.params, this.#context.value(), this.#context.variables()) : {};
    },
    { equal: (left, right) => sdStableStringify(left) === sdStableStringify(right) }
  );
  /** Radio luôn hiện toàn bộ lựa chọn: catalog được tải (không tìm theo từ khoá). */
  readonly items = computed<SdFormGenericOption[]>(() => {
    const options = this.field().options;
    return options?.source === 'catalog' ? this.#loaded() : (options?.items ?? []);
  });

  constructor() {
    effect(() => {
      const options = this.field().options;
      if (options?.source !== 'catalog') return;
      const params = this.params();
      untracked(() => {
        const request = ++this.#request;
        this.#catalog
          .load(options.catalog, params, { field: this.field(), value: this.#context.value(), variables: this.#context.variables() })
          .then(items => request === this.#request && this.#loaded.set(items))
          .catch(() => request === this.#request && this.#loaded.set([]));
      });
    });
  }

  select(value: unknown): void {
    const field = this.field();
    const patch: Record<string, unknown> = { [field.key]: value };
    if (field.options?.source === 'catalog' && field.options.fill?.length) {
      const selected = this.#loaded().find(item => item.value === value) ?? null;
      Object.assign(patch, sdFillPatch(field.options.fill, selected));
    }
    this.#context.patch(patch);
  }
}
