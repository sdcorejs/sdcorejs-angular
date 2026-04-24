import { SdFormGenericComponent, SdFormGenericTableColumn } from '../form-generic-component.model';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SdFormGenericArgs {
  entity: Record<string, any>;
  component?: SdFormGenericComponent;
  column?: SdFormGenericTableColumn;
  query?: Record<string, any>; // Sử dụng để trả về query cho dropdown/radio/checklist
}
