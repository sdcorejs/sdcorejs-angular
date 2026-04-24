export interface SdExcelTemplate {
  fileName?: string;
  columns: SdExcelTemplateColumn[];
  sheets?: SdExcelSheet[];
}
export interface SdExcelColumn {
  field: string;
  title: string;
  description?: string;
  width?: string;
}

export interface SdExcelTemplateColumn extends SdExcelColumn {
  required?: boolean;
  color?: string;
  fontColor?: string;
  fill?: string;
}

export interface SdExcelSheet<T = any> {
  name: string;
  items: T[];
  headers: {
    value: Extract<keyof T, string>; // Trường muốn hiển thị
    display: string; // Label hiển thị
  }[];
}

export interface SdExcelExportOption<T = any> {
  columns: SdExcelTemplateColumn[];
  items: T[];
  fileName?: string;
  sheets?: SdExcelSheet[];
}
