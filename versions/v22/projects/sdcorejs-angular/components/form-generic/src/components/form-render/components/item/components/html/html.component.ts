import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import type { SdFormGenericHtmlDefinition } from '../../../../../../models/form-generic-config.model';
import type { SdFormGenericHtml } from '../../../../../../models/form-generic-field.model';
import { sdStableStringify } from '../../../../../../models/form-generic-schema';
import { HtmlPipe } from '../../../../../../pipes';
import { sdResolveParams } from '../../../../../../rules/form-generic-values';
import { FormGenericService } from '../../../../../../services/form-generic.service';
import { FormRenderContext } from '../../../../form-render.context';

/**
 * Nội dung HTML: `content` + `variables` của field, hoặc html definition của portal (`definition`),
 * definition kiểu query được gọi lại khi tham số đã giải thay đổi. Nội dung không nằm trong value.
 */
@Component({
  selector: 'lib-html',
  templateUrl: './html.component.html',
  styleUrl: './html.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HtmlPipe],
})
export class HtmlComponent {
  readonly field = input.required<SdFormGenericHtml>();

  readonly #context = inject(FormRenderContext);
  readonly #service = inject(FormGenericService);
  readonly #definition = signal<SdFormGenericHtmlDefinition | undefined>(undefined);
  readonly #queried = signal('');
  #request = 0;

  readonly #params = computed(() => sdResolveParams(this.field().query, this.#context.value(), this.#context.variables()), {
    equal: (left, right) => sdStableStringify(left) === sdStableStringify(right),
  });

  readonly content = computed(() => {
    const definition = this.#definition();
    if (!this.field().definition) return this.field().content ?? '';
    if (!definition) return '';
    return definition.type === 'static' ? definition.content : this.#queried();
  });

  /** Giá trị mặc định của biến trong definition, ghi đè bằng biến của field. */
  readonly variables = computed(() => {
    const defaults: Record<string, string> = {};
    for (const variable of this.#definition()?.variables ?? []) if (variable.value !== undefined) defaults[variable.key] = variable.value;
    return { ...defaults, ...(this.field().variables ?? {}) };
  });

  constructor() {
    effect(() => {
      const id = this.field().definition;
      untracked(() => {
        if (!id) {
          this.#definition.set(undefined);
          return;
        }
        this.#service.htmlDefinition(id).then(definition => this.#definition.set(definition));
      });
    });
    effect(() => {
      const definition = this.#definition();
      if (definition?.type !== 'query') return;
      const params = this.#params();
      untracked(() => {
        const request = ++this.#request;
        this.#service.htmlContent(definition.id, params).then(content => request === this.#request && this.#queried.set(content));
      });
    });
  }
}
