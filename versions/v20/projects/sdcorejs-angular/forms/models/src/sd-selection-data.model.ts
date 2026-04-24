export interface SdSelectionData<T = any> {
  multiple?: boolean;
  // Multiple
  values: any[];
  selectedItems: T[];
  // Single
  value?: any;
  selectedItem?: T;
}
