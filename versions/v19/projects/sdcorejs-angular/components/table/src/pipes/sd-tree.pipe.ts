import { Pipe, PipeTransform } from '@angular/core';
import { SdTableOptionTree } from '../models/table-option-tree.model';
import { SdTableItem } from '../models/table-item.model';
import { flattenTree } from '../services/tree/tree.util';

@Pipe({ name: 'sdTree' })
export class SdTreePipe implements PipeTransform {
  transform(items: SdTableItem[], treeOption?: SdTableOptionTree, _revision = 0): SdTableItem[] {
    if (!treeOption) return items;
    return flattenTree(items, treeOption);
  }
}
