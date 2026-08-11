import { Pipe, PipeTransform, SecurityContext, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StringUtilities } from '@sdcorejs/utils/fns';
import { SdFormGenericHtml } from '../models';

@Pipe({
  name: 'htmlPipe',
  standalone: true,
})
// Pipe xử lý hiển thị detail cho component
export class HtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}
  // Hash component để pipe nhận biết được content hay variables có thay đổi render lại
  transform = (hashed: string | undefined | null, content: string, component: SdFormGenericHtml) => {
    if (!content) {
      return '';
    }
    const variables: Record<string, any> = {};
    if (component.properties?.variables?.length) {
      component.properties.variables.forEach(variable => (variables[variable.key] = variable.value));
    }
    const renderedHtml = StringUtilities.templateToDisplay(content, variables);
    return this.sanitizer.sanitize(SecurityContext.HTML, renderedHtml) || '';
  };
}
