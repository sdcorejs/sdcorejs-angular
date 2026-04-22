import { InjectionToken } from '@angular/core';
import { SdTableOptionPaginate } from '../models/table-option-paginate.model';
import { SdTableOptionFilter } from '../services/table-filter/table-filter.model';
import { SdOperator } from '@sdcorejs/angular/utilities';
import { SdTableColumn } from '../models';

export interface ISdTableConfiguration {
  paginate?: {
    /** Sá»‘ dÃ²ng má»—i trang. */
    pageSize?: SdTableOptionPaginate['pageSize'];

    /** Danh sÃ¡ch cÃ¡c tuá»³ chá»n sá»‘ dÃ²ng/trang mÃ  ngÆ°á»i dÃ¹ng cÃ³ thá»ƒ chá»n. */
    pages?: SdTableOptionPaginate['pages'];

    showFirstLastButtons?: SdTableOptionPaginate['showFirstLastButtons'];
  };
  filter?: {
    /** áº¨n bá»™ lá»c dÆ°á»›i cá»™t, náº¿u khÃ´ng cáº¥u hÃ¬nh thÃ¬ giÃ¡ trá»‹ máº·c Ä‘á»‹nh lÃ  false */
    hideInlineFilter?: SdTableOptionFilter['hideInlineFilter'];

    /** Sá»‘ lÆ°á»£ng external filter má»—i dÃ²ng, máº·c Ä‘á»‹nh lÃ  6 */
    externalFilterPerRow?: SdTableOptionFilter['externalFilterPerRow'];

    /**  KÃ­ch hoáº¡t cháº¿ Ä‘á»™ lá»c thá»§ cÃ´ng, hiá»ƒn thá»‹ nÃºt Ã¡p dá»¥ng, máº·c Ä‘á»‹nh lÃ  false */
    manualFilter?: SdTableOptionFilter['manualFilter'];

    /** áº¨n toolbar (xÃ³a bá»™ lá»c, thiáº¿t láº­p) cá»§a external filter, khi cÃ³ Ã­t external filter user khÃ´ng cáº§n chá»©c nÄƒng nÃ y, máº·c Ä‘á»‹nh lÃ  false */
    hideExternalFilterToolbar?: SdTableOptionFilter['hideExternalFilterToolbar'];

    operator?: {
      list?: Partial<Record<SdTableColumn['type'], SdOperator[]>>;
      default?: Partial<Record<SdTableColumn['type'], SdOperator>>;
    };
  };
  images?: {
    filterRequired?: string; // Link áº£nh cho table á»Ÿ tráº¡ng thÃ¡i cáº§n nháº­p filter
    dataEmpty?: string; // Link áº£nh cho table á»Ÿ tráº¡ng thÃ¡i khÃ´ng cÃ³ dá»¯ liá»‡u
    filterEmpty?: string; // Link áº£nh cho table á»Ÿ tráº¡ng thÃ¡i filter khÃ´ng cÃ³ dá»¯ liá»‡u
  };
}

export const DEFAULT_TABLE_CONFIG: ISdTableConfiguration = {
  paginate: {
    pageSize: 20,
    pages: [20, 50, 100, 200],
  },
};

export const SD_TABLE_CONFIGURATION = new InjectionToken<ISdTableConfiguration>('sd-table.configuration');

