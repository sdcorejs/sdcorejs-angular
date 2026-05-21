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
  /**
   * Key Ä‘á»‹nh danh cá»§a table option.
   * ThÆ°á»ng dÃ¹ng khi má»™t sá»‘ tÃ­nh nÄƒng con cáº§n lÆ°u tráº¡ng thÃ¡i riÃªng theo table,
   * vÃ­ dá»¥ cÃ¡c option cÃ³ há»— trá»£ cache/config theo key.
   */
  key?: string;
  /**
   * Cáº¥u hÃ¬nh hiá»ƒn thá»‹/phá»¥c há»“i config cá»§a table.
   * Xem thÃªm kiá»ƒu chi tiáº¿t táº¡i `TableOptionConfig`.
   */
  config?: TableOptionConfig;
  /**
   * Cáº¥u hÃ¬nh chá»n dÃ²ng (checkbox selector, action theo selection, pre-select...).
   * Xem thÃªm táº¡i `SdTableOptionSelector`.
   */
  selector?: SdTableOptionSelector<T>;
  /**
   * Cáº¥u hÃ¬nh expand row.
   * Xem thÃªm táº¡i `SdTableOptionExpand` Ä‘á»ƒ biáº¿t cÃ¡ch disable, expand nhiá»u dÃ²ng,
   * hoáº·c luÃ´n hiá»ƒn thá»‹ vÃ¹ng expand.
   */
  expand?: SdTableOptionExpand<T>;
  /**
   * Báº­t/táº¯t sorting á»Ÿ cáº¥p table.
   * Xem thÃªm táº¡i `SdTableOptionSort`.
   */
  sort?: SdTableOptionSort;
  /**
   * Cáº¥u hÃ¬nh phÃ¢n trang.
   * Xem thÃªm táº¡i `SdTableOptionPaginate`.
   */
  paginate?: SdTableOptionPaginate;
  /**
   * Cáº¥u hÃ¬nh hÃ nh vi reload dá»¯ liá»‡u.
   * Xem thÃªm táº¡i `SdTableOptionReload`.
   */
  reload?: SdTableOptionReload<T>;
  /**
   * Cáº¥u hÃ¬nh export dá»¯ liá»‡u.
   * Xem thÃªm táº¡i `SdTableOptionExport` Ä‘á»ƒ biáº¿t mode `default`/`custom`, mapping,
   * sheet export vÃ  giá»›i háº¡n sá»‘ dÃ²ng.
   */
  export?: SdTableOptionExport<T>;
  /**
   * Cáº¥u hÃ¬nh group dá»¯ liá»‡u theo nhiá»u field.
   * Xem thÃªm táº¡i `SdTableOptionGroup`.
   */
  group?: SdTableOptionGroup<T>;
  /**
   * Cáº¥u hÃ¬nh filter cá»§a table.
   * Xem thÃªm táº¡i `SdTableOptionFilter` Ä‘á»ƒ biáº¿t filter inline, external filter,
   * manual filter, cacheable vÃ  callback clear filter.
   */
  filter?: SdTableOptionFilter;
  /**
   * Cáº¥u hÃ¬nh kÃ©o-tháº£ Ä‘á»•i thá»© tá»± dÃ²ng.
   * Chá»‰ báº­t khi table cho phÃ©p reorder dá»¯ liá»‡u phÃ­a client.
   */
  rowReorder?: {
    /** Báº­t/táº¯t tÃ­nh nÄƒng reorder row. */
    enabled?: boolean;
    /**
     * Callback sau khi reorder xong.
     * `newRows` lÃ  máº£ng sau khi Ä‘Ã£ Ä‘á»•i vá»‹ trÃ­ á»Ÿ UI,
     * `movedItem` lÃ  item vá»«a Ä‘Æ°á»£c kÃ©o,
     * `fromIndex` vÃ  `toIndex` lÃ  vá»‹ trÃ­ cÅ©/má»›i.
     */
    onChange?: (newRows: T[], movedItem: T, fromIndex: number, toIndex: number) => void;
    /**
     * TÃªn icon hiá»ƒn thá»‹ cho drag handle.
     * Náº¿u khÃ´ng truyá»n thÃ¬ table dÃ¹ng icon reorder máº·c Ä‘á»‹nh cá»§a Material.
     * Náº¿u truyá»n custom icon, nÃªn dÃ¹ng tÃªn glyph cá»§a Material Icons:
     * https://fonts.google.com/icons
     */
    icon?: string;
    /**
     * Disable kháº£ nÄƒng reorder theo tá»«ng dÃ²ng.
     * Tráº£ vá» `true` Ä‘á»ƒ cháº·n kÃ©o-tháº£ dÃ²ng tÆ°Æ¡ng á»©ng.
     */
    disabled?: (row: T, index: number) => boolean;
  };
  /**
   * Danh sÃ¡ch command thao tÃ¡c theo tá»«ng dÃ²ng.
   * Xem thÃªm táº¡i `SdTableCommand`.
   */
  commands?: SdTableCommand<T>[];
  /**
   * Cáº¥u hÃ¬nh vÃ¹ng command táº­p trung.
   * DÃ¹ng khi cáº§n set thÃªm alignment hoáº·c bá»c danh sÃ¡ch command trong object option.
   * Xem thÃªm táº¡i `SdTableCommandOption`.
   */
  command?: SdTableCommandOption<T>;
  /**
   * Danh sÃ¡ch cá»™t hiá»ƒn thá»‹ cá»§a table.
   * ÄÃ¢y lÃ  pháº§n báº¯t buá»™c. Xem thÃªm táº¡i `SdTableColumn` Ä‘á»ƒ cáº¥u hÃ¬nh field, filter,
   * sort, transform, template vÃ  export cá»§a tá»«ng cá»™t.
   */
  columns: SdTableColumn<T>[];
  /**
   * Cáº¥u hÃ¬nh style/layout chung cá»§a table.
   * Xem thÃªm táº¡i `SdTableOptionStyle`.
   */
  style?: SdTableOptionStyle<T>;
}

interface SdTableLocalOption<T = any> extends SdTableBaseOption<T> {
  /** DÃ¹ng dá»¯ liá»‡u local táº¡i client. */
  type: 'local';
  /**
   * HÃ m tráº£ dá»¯ liá»‡u local cho table.
   * Table sáº½ tá»± gá»i hÃ m nÃ y Ä‘á»ƒ láº¥y máº£ng item nguá»“n.
   * CÃ³ thá»ƒ tráº£ vá» Ä‘á»“ng bá»™ hoáº·c `Promise<T[]>`.
   */
  items: () => T[] | Promise<T[]>;
}

interface SdTableServerOption<T = any> extends SdTableBaseOption<T> {
  /** DÃ¹ng dá»¯ liá»‡u tá»« server, cÃ³ paging/filter/sort theo request cá»§a table. */
  type: 'server';
  /**
   * HÃ m láº¥y dá»¯ liá»‡u tá»« server.
   * `filterRequest` chá»©a tráº¡ng thÃ¡i filter/sort/visible columns á»Ÿ dáº¡ng cá»§a table.
   * `pagingReq` lÃ  dá»¯ liá»‡u paging Ä‘Ã£ Ä‘Æ°á»£c chuáº©n hÃ³a Ä‘á»ƒ dá»… map sang API backend.
   * HÃ m cáº§n tráº£ vá» `{ items, total }` Ä‘á»ƒ table render vÃ  tÃ­nh phÃ¢n trang.
   */
  items: (filterRequest: SdTableFilterRequest<T>, pagingReq: SdPagingReq<T>) => Promise<{ items: T[]; total: number }>;
  /**
   * Hook cháº¡y khi table phÃ¡t sinh filter request.
   * DÃ¹ng Ä‘á»ƒ can thiá»‡p thÃªm trÆ°á»›c/sau khi gá»i API, vÃ­ dá»¥ sync external state,
   * theo dÃµi tráº¡ng thÃ¡i valid cá»§a external filter, hoáº·c ghi log request filter hiá»‡n táº¡i.
   */
  onFilter?: (
    filterRequest: SdTableFilterRequest<T>,
    args: {
      /** Cho biáº¿t toÃ n bá»™ external filter hiá»‡n táº¡i cÃ³ há»£p lá»‡ Ä‘á»ƒ trigger filter hay khÃ´ng. */
      externalFilterValid: boolean;
    }
  ) => void;
}

