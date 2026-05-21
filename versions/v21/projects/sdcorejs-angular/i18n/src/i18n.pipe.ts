import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';
import { I18nParams } from './i18n.types';

@Pipe({ name: 'translate', standalone: true })
export class TranslatePipe implements PipeTransform {
  readonly #i18n = inject(I18nService);

  transform(key: string, params?: I18nParams): string {
    return this.#i18n.t(key, params);
  }
}
