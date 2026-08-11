import { Pipe, PipeTransform } from '@angular/core';
import { StringUtilities } from '@sdcorejs/utils/fns';

@Pipe({
  name: 'hyperlink',
  standalone: true,
})
// Pipe xử lý hiển thị detail cho component
export class HyperlinkPipe implements PipeTransform {
  constructor() {}
  transform = (hyperlink: string | undefined | null, entity: Record<string, any>): string => {
    if (!hyperlink) {
      return '';
    }
    return StringUtilities.templateToDisplay(hyperlink, entity);
  };
}
