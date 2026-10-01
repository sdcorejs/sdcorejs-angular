import { inject, Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StringUtilities } from '@sdcorejs/utils/fns';

/** Thay `${key}` bằng biến của field html rồi sanitize nội dung. */
@Pipe({
  name: 'htmlPipe',
  standalone: true,
})
export class HtmlPipe implements PipeTransform {
  readonly #sanitizer = inject(DomSanitizer);

  transform(content: string | null | undefined, variables?: Readonly<Record<string, string>> | null): string {
    if (!content) return '';
    const rendered = StringUtilities.templateToDisplay(content, { ...(variables ?? {}) });
    return this.#sanitizer.sanitize(SecurityContext.HTML, rendered) || '';
  }
}
