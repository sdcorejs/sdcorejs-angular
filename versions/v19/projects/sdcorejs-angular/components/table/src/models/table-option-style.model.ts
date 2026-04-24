export interface SdTableOptionStyle<T = any> {
  shadow?: boolean;
  maxHeight?: string;
  minHeight?: string;
  rowCss?: (rowData: T) => Record<string, string>;
}
