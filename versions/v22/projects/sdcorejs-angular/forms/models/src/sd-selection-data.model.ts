export interface SdSelectionData<T = unknown> {
  multiple?: boolean;
  // Multiple
  values: any[];
  selectedItems: T[];
  // Single
  value?: any;
  selectedItem?: T;
}
