export interface SdImportExcelValidation {
  idx: number;
  errorMessage?: string;
  warningMessage?: string;
}
export interface SdImportExcelSheet<T = any> {
  name: string; // Tên của sheet
  items: T[] | (() => Promise<T[]>);
  headers: {
    value: Extract<keyof T, string>; // Trường muốn hiển thị
    display: string; // Label hiển thị
  }[];
}

export interface SdImportExcelOption<T = any> {
  columns: SdUploadExcelColumn<T>[];
  accept: (items: T[], args: { file: File }) => SdImportExcelValidation[] | Promise<SdImportExcelValidation[]>;
  title?: string;
  fileName?: string;
  limit?: number;
  sheets?: SdImportExcelSheet[];
  transform?: (items: SdImportExcelItem<T>[]) => SdImportExcelItem<T>[] | Promise<SdImportExcelItem<T>[]>;
  validateItem?: (item: T, idx: number, items: T[]) => SdImportExcelValidation | Promise<SdImportExcelValidation>;
  validateItems?: (items: T[]) => SdImportExcelValidation[] | Promise<SdImportExcelValidation[]>;
}

export type SdUploadExcelColumn<T = any> =
  | SdUploadExcelColumnString<T>
  | SdUploadExcelColumnNumber<T>
  | SdUploadExcelColumnBool<T>
  | SdUploadExcelColumnDate<T>
  | SdUploadExcelColumnTime<T>
  | SdUploadExcelColumnDateTime<T>
  | SdUploadExcelColumnValues<T>
  | SdUploadExcelColumnStringArray<T>;

export interface SdUploadExcelBaseColumn<T = any> {
  field: string;
  title: string;
  required?: boolean;
  width?: string;
  description?: string;
  hidden?: boolean | (() => boolean);
  fontColor?: string;
  fill?: string;
  transform?: (value: any, rowData: T) => string | Promise<string>;
}

export interface SdUploadExcelColumnString<T = any> extends SdUploadExcelBaseColumn<T> {
  type: 'string';
  defaultValue?: string;
  pattern?: string;
  minlength?: number;
  maxlength?: number;
}

export interface SdUploadExcelColumnNumber<T = any> extends SdUploadExcelBaseColumn<T> {
  type: 'number';
  defaultValue?: number;
  min?: number;
  max?: number;
}

export interface SdUploadExcelColumnBool<T = any> extends SdUploadExcelBaseColumn<T> {
  type: 'bool';
  defaultValue?: boolean;
  parseToBool?: boolean;
}

export interface SdUploadExcelColumnDate<T = any> extends SdUploadExcelBaseColumn<T> {
  type: 'date';
  format?: 'dd/MM/yyyy';
  defaultValue?: Date;
  minDate?: Date;
  maxDate?: Date;
}

export interface SdUploadExcelColumnTime<T = any> extends SdUploadExcelBaseColumn<T> {
  type: 'time';
  format?: 'HH:mm' | 'HH:mm:ss';
  defaultValue?: Date;
  minDate?: Date;
  maxDate?: Date;
}

export interface SdUploadExcelColumnDateTime<T = any> extends SdUploadExcelBaseColumn<T> {
  type: 'datetime';
  format?: 'dd/MM/yyyy HH:mm' | 'dd/MM/yyyy';
  defaultValue?: Date;
  minDate?: Date;
  maxDate?: Date;
}

export interface SdUploadExcelColumnValues<T = any> extends SdUploadExcelBaseColumn<T> {
  type: 'values' | 'radio';
  defaultValue?: string | number;
  values: (string | number)[];
  checkValueInArray?: boolean;
}

export interface SdUploadExcelColumnStringArray<T = any> extends SdUploadExcelBaseColumn<T> {
  type: 'array';
  divideString: string | ';';
  unitString: string | 'items';
  defaultValue?: string;
  minlength?: number;
  maxlength?: number;
}

export interface SdImportExcelItem<T = any> {
  data: T;
  meta: {
    excelIndex: number;
    origin: T;
    error: Record<string, string>;
    errorMessages: string[];
    warning: Record<string, string>;
    warningMessages: string[];
  };
}

// export type ExcelItem<T> = {
//   origin?: T;
//   excelIndex?: number;
//   validation: SdUploadExcelValidation;
// } & T;
