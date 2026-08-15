import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';
import { I18nParams } from './i18n.types';

// why: tên pipe cũ `translate` đụng trực diện với pipe cùng tên của `@ngx-translate/core`. Cả hai đều
// standalone nên consumer dùng song song KHÔNG thể import chung vào một component (Angular báo lỗi
// trùng tên pipe trong cùng scope). Đổi sang `sdTranslate` để tên pipe nằm trong namespace `sd` của lib.
@Pipe({ name: 'sdTranslate', standalone: true })
export class SdTranslatePipe implements PipeTransform {
  readonly #i18n = inject(I18nService);

  transform(key: string, params?: I18nParams): string {
    return this.#i18n.t(key, params);
  }
}
