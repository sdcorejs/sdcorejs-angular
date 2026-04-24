import { Pipe, PipeTransform } from '@angular/core';
import { SdTableCommand } from '../models/table-command.model';
import { SdTableItem } from '../models/table-item.model';
@Pipe({
  name: 'commandIcon',
})
export class SdCommandIconPipe implements PipeTransform {
  transform(command: SdTableCommand, item: SdTableItem): string {
    if (!command?.icon) {
      return '';
    }
    if (typeof command.icon === 'string') {
      return command.icon;
    }
    return command.icon(item.data);
  }
}
