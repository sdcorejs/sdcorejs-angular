export interface SdTableOptionExpand<T = any> {
  disabled?: (rowData: T) => boolean;
  onExpand?: (rowData: T) => Promise<any> | any;
  multiple?: boolean;
  always?: boolean;
}
