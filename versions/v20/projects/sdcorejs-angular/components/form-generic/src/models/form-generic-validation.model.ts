/* eslint-disable @typescript-eslint/no-explicit-any */
// Định nghĩa các Components của Form Render
import { SdFormGenericExpression } from './form-generic-expression.model';

export type SdFormGenericValidation = ValidationExpression | ValidationFunction;

interface ValidationBase {
  alert: 'warning' | 'error'; //
}

export const ValidationAlerts = [
  {
    value: 'error',
    display: 'Lỗi',
  },
  {
    value: 'warning',
    display: 'Cảnh báo',
  },
];

interface ValidationExpression extends ValidationBase {
  type: 'expression';
  expression: SdFormGenericExpression;
  message: string; // Có thể là html
}

interface ValidationFunction extends ValidationBase {
  type: 'function';
  code: string; // Lấy từ value của SdFormGenericValidationFunction
}

interface ValidateArgs {
  entity: Record<string, any>;
}

export interface SdFormGenericValidationFunction {
  value: string;
  display: string;
  validate: (args: ValidateArgs) => Promise<string | undefined | null>; // Hàm trả về string message nếu có lỗi, message có thể là html
}

export interface SdFormGenericValidationConfiguration {
  // Danh sách các functions validate được cấu hình sẵn để làm dữ liêu cho dropdown
  functions?: SdFormGenericValidationFunction[];
}
