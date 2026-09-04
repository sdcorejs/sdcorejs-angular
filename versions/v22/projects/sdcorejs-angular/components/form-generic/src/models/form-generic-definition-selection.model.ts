import { SdSearch } from '@sdcorejs/angular/forms/models';
import { SdFormGenericArgs } from './form-render/form-render-args.model';

// Khi render ra các UI như dropdown, radio, checklist, để đơn giản hóa việc cài đặt mình sẽ sử dụng valuesKey và gán value tương ứng
// Dựa vào value, có thể xác định được API cần gọi để lấy data, xử lý logic đặc thù
// Args là
export interface SdFormGenericSelectionItem<T = unknown> {
  value: string;
  display: string;
  disabled?: boolean;
  template?: string;
  data?: T;
}

// Model dựa theo values của Camunda
export interface SdFormGenericSelectionStaticItem {
  value: string;
  label: string;
}

export type SdFormGenericDefinitionSelection<T = unknown, TArgs = unknown> =
  | SelectionValues<T>
  | SelectionLazyValues<T>
  | SelectionValuesKey<TArgs>
  | SelectionLazyValuesKey<TArgs>;

interface SelectionVariables<T = unknown> {
  // Thực tế khi selection thay đổi, dựa vào thông tin detail ví dụ { code: 'a', name: 'b', ...} sẽ có mong muốn gán các thông tin này vào form
  // Sử dụng chung với thuộc tính setVariables trong properties để trigger việc thay đổi giá trị khi selection thay đổi
  // Chẳng hạn như ở màn hình cập nhật gì đó, khi chọn dữ liệu muốn cập nhật thì UI load sẵn dữ liệu được chọn
  items?: { value: Extract<keyof T, string>; display: string }[];
  detail?: (values: string | number | string[] | number[], args: SdFormGenericArgs) => Promise<T | undefined>;
}

interface SelectionQueries {
  items?: { value: string; display: string }[];
}

interface SelecttionBase {
  value: string; // Giá trị sẽ được gán cho valuesKey
  display: string;
  // Xử lý hiển thị ở trạng thái viewed của dữ liệu
  viewed?: (values: (string | number)[], args: SdFormGenericArgs) => Promise<string>;
  queries?: SelectionQueries;
  variables?: SelectionVariables;
}

// Trong configuration sẽ có 1 function xử lý chỉ dựa vào key trả về values hoặc lazyValues
interface SelectionValuesKey<TArgs> extends SelecttionBase {
  valuesKey: string;
  args?: TArgs;
}

interface SelectionLazyValuesKey<TArgs> extends SelecttionBase {
  lazyValuesKey: string;
  args?: TArgs;
}

interface SelectionValues<T = unknown> extends SelecttionBase {
  values: (args: SdFormGenericArgs) => Promise<SdFormGenericSelectionItem<T>[]>;
}

interface SelectionLazyValues<T = unknown> extends SelecttionBase {
  lazyValues: (searchArgs: Parameters<SdSearch>[0], args: SdFormGenericArgs) => Promise<SdFormGenericSelectionItem<T>[]>;
}
