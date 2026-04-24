import { SdTableItem } from './table-item.model';

export interface SdTableOptionReload<T = any> {
  visible?: boolean;
  onReload?: (items: SdTableItem<T>[], args?: { fromSource?: 'PAGING' | 'RELOAD' }) => Promise<void> | void;
}
