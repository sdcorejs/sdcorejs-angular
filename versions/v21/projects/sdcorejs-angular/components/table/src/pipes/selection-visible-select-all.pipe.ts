import { Pipe, PipeTransform } from '@angular/core';
import { SdTableOptionSelector } from '../models/table-option-selector.model';
import { SdTableItem } from '../models/table-item.model';
@Pipe({
  name: 'selectionVisibleSelectAll',
})
export class SdSelectionVisibleSelectAllPipe implements PipeTransform {
  transform = async (items: SdTableItem[], selector: SdTableOptionSelector | undefined): Promise<boolean> => {
    // Nếu chỉ chọn 1 thì không có select all
    if (selector?.single) {
      return false;
    }
    if (!items.length) {
      return false;
    }
    if (!selector?.actions?.length) {
      return true;
    }
    if (selector.actions.some(e => ('children' in e && e.children.some(e1 => e1.isGrouped)) || e.isGrouped)) {
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const first = items.find(t => t.meta.selector?.actions?.length);
    if (first) {
      for (const action of first.meta.selector?.actions ?? []) {
        if (items.filter(t => t.meta.selector?.actions?.length).every(e => e.meta.selector?.actions?.includes(action))) {
          return true;
        }
      }
    }
    return false;
  };
}
