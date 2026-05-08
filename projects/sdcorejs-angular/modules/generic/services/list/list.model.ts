import { SdTableColumn, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdFilter, SdOrder } from '@sdcorejs/angular/utilities';
import { SdSchemaProperty, SdRegisterArgs } from '../../models';

// Vá» nguyÃªn táº¯c thÃ¬ tá»« Schema -> GenericListOption (máº·c Ä‘á»‹nh)
// NhÆ°ng mong muá»‘n thÃ¬ GenericListOption cÃ³ thá»ƒ override
// Khi sá»­ dá»¥ng GenericListConfig, má»i ngÆ°á»i cáº§n xÃ¡c Ä‘á»‹nh kiá»ƒu dá»¯ liá»‡u (T) cá»§a model Ä‘Ã³ Ä‘á»ƒ truyá»n vÃ o
export interface GenericListOption<T = any> {
  module: string;
  typeCode: string;
  args?: SdRegisterArgs;
  // Trong trÆ°á»ng há»£p muá»‘n ghi Ä‘Ã¨ má»™t vÃ i thuá»™c tÃ­nh cá»§a Property trong Schema nhÆ°ng váº«n giá»¯ nguyÃªn cáº¥u hÃ¬nh
  override?: Partial<Record<Extract<keyof TList<T>, string>, SdSchemaProperty<TList<T>>['list']>>;
  columns?: (Extract<keyof TList<T>, string> | SdTableColumn<TList<T>>)[];
  commands?: SdTableOption<TList<T>>['commands'];
  selector?: SdTableOption<TList<T>>['selector'];
  config?: SdTableOption<TList<T>>['config'];
  export?: SdTableOption<TList<T>>['export'];
  paginate?: SdTableOption<TList<T>>['paginate'];
  filter?: SdTableOption<TList<T>>['filter'];
  sort?: SdTableOption<TList<T>>['sort'];
  fields?: string[];
  filters?: SdFilter<TList<T>>[];
  orders?: SdOrder<TList<T>>[];
}

// sdList sáº½ chá»©a nhá»¯ng dá»¯ liá»‡u do Generic Sinh ra
export type TList<T = any> = T & {
  sdList?: {
    lazyValues?: Record<string, any[]>;
  };
};

