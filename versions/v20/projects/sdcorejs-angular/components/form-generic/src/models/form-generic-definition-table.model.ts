/* eslint-disable @typescript-eslint/no-explicit-any */
import { SdFormGenericTableColumn } from './form-generic-component.model';
import { SdFormGenericArgs } from './form-render/form-render-args.model';

export interface SdFormGenericDefinitionTable<T = any> {
  value: string; // Giá trị sẽ được gán cho valuesKey
  display: string;
  columns: () => SdFormGenericTableColumn<T>[];
  // items: (args: SdFormGenericArgs) => T[];
}
