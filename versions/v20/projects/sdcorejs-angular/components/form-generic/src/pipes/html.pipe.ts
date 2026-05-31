/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { StringUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdFormGenericHtml } from '../models';

@Pipe({
  name: 'htmlPipe',
  standalone: true,
})
// Pipe xá»­ lÃ½ hiá»ƒn thá»‹ detail cho component
export class HtmlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}
  // Hash component Ä‘á»ƒ pipe nháº­n biáº¿t Ä‘Æ°á»£c content hay variables cÃ³ thay Ä‘á»•i render láº¡i
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

