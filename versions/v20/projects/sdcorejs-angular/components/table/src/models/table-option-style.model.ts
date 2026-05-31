export interface SdTableRowCssContext {
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

export interface SdTableOptionStyle<T = any> {
  shadow?: boolean;
  maxHeight?: string;
  minHeight?: string;
  rowCss?: (rowData: T, index?: number, ctx?: SdTableRowCssContext) => Record<string, string>;
}
