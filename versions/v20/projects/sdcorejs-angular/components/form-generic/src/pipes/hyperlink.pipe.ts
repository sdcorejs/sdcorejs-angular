/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pipe, PipeTransform } from '@angular/core';
import { StringUtilities } from '@sdcorejs/angular/utilities/extensions';

@Pipe({
  name: 'hyperlink',
  standalone: true,
})
// Pipe xá»­ lÃ½ hiá»ƒn thá»‹ detail cho component
export class HyperlinkPipe implements PipeTransform {
  constructor() {}
  transform = (hyperlink: string | undefined | null, entity: Record<string, any>): string => {
    if (!hyperlink) {
      return '';
    }
    return StringUtilities.templateToDisplay(hyperlink, entity);
  };
}

