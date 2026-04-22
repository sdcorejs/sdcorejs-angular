import { Pipe, PipeTransform } from '@angular/core';
// import hash from 'object-hash';
import { SdTableOption } from '../models/table-option.model';
import { MapToSdTableItem, SdTableItem } from '../models/table-item.model';
import { SdUtilities } from '@sdcorejs/angular/utilities';
@Pipe({
  name: 'sdGroup',
})
export class SdGroupPipe implements PipeTransform {
  transform(items: SdTableItem[], gridOption: SdTableOption): SdTableItem[] {
    const { group } = gridOption;
    if (!group) {
      return items;
    }
    const { fields, htmlTemplate } = group;
    if (!fields?.length) {
      return items;
    }
    const groupItem: Record<string, SdTableItem[]> = {};
    for (const item of items) {
      let obj = {};
      for (const field of fields) {
        obj = {
          ...obj,
          ...((item as any)[field] ?? { [field]: (item as any)[field] }),
        };
      }
      const key = SdUtilities.hash(obj);
      if (!groupItem[key]) {
        groupItem[key] = [];
      }
      groupItem[key].push(item);
    }
    const results: SdTableItem[] = [];
    for (const key of Object.keys(groupItem)) {
      const result = MapToSdTableItem({}, );
      result.meta.group!.items = groupItem[key];
      result.meta.group!.htmlTemplate = htmlTemplate(groupItem[key]);
      results.push(result);
      for (const item of groupItem[key]) {
        results.push(item);
      }
    }
    return results;
  }
}

