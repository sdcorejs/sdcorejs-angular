/* eslint-disable @typescript-eslint/no-explicit-any */
import { SdPagingReq } from '@sdcorejs/angular/utilities';
import { SdTableFilterRequest, SdTableOptionFilter } from '../services/table-filter/table-filter.model';
import { SdTableColumn } from './table-column.model';
import { SdTableCommand, SdTableCommandOption } from './table-command.model';
import { TableOptionConfig } from './table-option-config.model';
import { SdTableOptionExpand } from './table-option-expand.model';
import { SdTableOptionExport } from './table-option-export.model';
import { SdTableOptionGroup } from './table-option-group.model';
import { SdTableOptionPaginate } from './table-option-paginate.model';
import { SdTableOptionReload } from './table-option-reload.model';
import { SdTableOptionSelector } from './table-option-selector.model';
import { SdTableOptionSort } from './table-option-sort.model';
import { SdTableOptionStyle } from './table-option-style.model';

export type SdTableOption<T = any> = SdTableLocalOption<T> | SdTableServerOption<T>;

interface SdTableBaseOption<T = any> {
  key?: string;
  config?: TableOptionConfig;
  selector?: SdTableOptionSelector<T>;
  expand?: SdTableOptionExpand<T>;
  sort?: SdTableOptionSort;
  paginate?: SdTableOptionPaginate;
  reload?: SdTableOptionReload<T>;
  export?: SdTableOptionExport<T>;
  group?: SdTableOptionGroup<T>;
  filter?: SdTableOptionFilter;
  rowReorder?: {
    enabled?: boolean;
    // Callback khi reorder xong
    onChange?: (newRows: T[], movedItem: T, fromIndex: number, toIndex: number) => void;
    // Náº¿u muá»‘n dÃ¹ng icon khÃ¡c, khÃ´ng thÃ¬ máº·c Ä‘á»‹nh sáº½ lÃ  icon reorder cá»§a material
    icon?: string; 
    // Cho phÃ©p reorder hay khÃ´ng (dynamic, theo row)
    disabled?: (row: T, index: number) => boolean;
  };
  commands?: SdTableCommand<T>[];
  command?: SdTableCommandOption<T>;
  columns: SdTableColumn<T>[];
  style?: SdTableOptionStyle<T>;
}

interface SdTableLocalOption<T = any> extends SdTableBaseOption<T> {
  type: 'local';
  items: () => T[] | Promise<T[]>;
}

interface SdTableServerOption<T = any> extends SdTableBaseOption<T> {
  type: 'server';
  items: (filterRequest: SdTableFilterRequest<T>, pagingReq: SdPagingReq<T>) => Promise<{ items: T[]; total: number }>;
  onFilter?: (
    filterRequest: SdTableFilterRequest<T>,
    args: {
      externalFilterValid: boolean;
    }
  ) => void;
}

