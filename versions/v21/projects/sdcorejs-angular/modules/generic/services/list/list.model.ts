import { SdTableColumn, SdTableOption } from '@sdcorejs/angular/components/table';
import { Filter, Order } from '@sdcorejs/utils/models';
import { SdSchemaProperty, SdRegisterArgs } from '../../models';

// Về nguyên tắc thì từ Schema -> GenericListOption (mặc định)
// Nhưng mong muốn thì GenericListOption có thể override
// Khi sử dụng GenericListConfig, mọi người cần xác định kiểu dữ liệu (T) của model đó để truyền vào
export interface GenericListOption<T = any> {
  module: string;
  typeCode: string;
  args?: SdRegisterArgs;
  // Trong trường hợp muốn ghi đè một vài thuộc tính của Property trong Schema nhưng vẫn giữ nguyên cấu hình
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
  filters?: Filter<TList<T>>[];
  orders?: Order<TList<T>>[];
}

// sdList sẽ chứa những dữ liệu do Generic Sinh ra
export type TList<T = any> = T & {
  sdList?: {
    lazyValues?: Record<string, any[]>;
  };
};
