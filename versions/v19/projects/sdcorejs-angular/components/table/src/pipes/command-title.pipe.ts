import { Pipe, PipeTransform } from '@angular/core';
import { SdTableCommand } from '../models/table-command.model';
import { SdTableItem } from '../models/table-item.model';
@Pipe({
  name: 'commandTitle',
})
export class SdCommandTitlePipe implements PipeTransform {
  transform(command: SdTableCommand, item: SdTableItem): string {
    if (!command?.title) {
      return '';
    }
    if (typeof command.title === 'string') {
      return command.title;
    }
    return command.title(item.data);
  }
}
