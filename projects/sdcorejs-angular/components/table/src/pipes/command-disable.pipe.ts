import { Pipe, PipeTransform } from '@angular/core';
import { SdTableCommand } from '../models/table-command.model';
import { SdTableItem } from '../models/table-item.model';
@Pipe({
  name: 'commandDisable',
})
export class SdCommandDisablePipe implements PipeTransform {
  transform(item: SdTableItem, command: SdTableCommand): boolean {
    if ('disabled' in command) {
      const { disabled } = command;
      if (typeof disabled === 'boolean') {
        return disabled;
      }
      return disabled!(item.data);
    }
    return false;
  }
}
