import { computed, inject, Pipe, PipeTransform, Signal } from '@angular/core';
import { I18nService } from './i18n.service';
import { I18nParams } from './i18n.types';

// Signal memoization refreshes an existing binding when an async catalog arrives.
@Pipe({ name: 'sdTranslate', standalone: true, pure: false })
export class SdTranslatePipe implements PipeTransform {
  readonly #i18n = inject(I18nService);
  #key?: string;
  #params?: I18nParams;
  #translation?: Signal<string>;

  transform(key: string, params?: I18nParams): string {
    if (!this.#translation || key !== this.#key || params !== this.#params) {
      this.#key = key;
      this.#params = params;
      this.#translation = computed(() => this.#i18n.t(key, params));
    }
    return this.#translation();
  }
}
