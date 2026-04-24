import { SdButton } from '@sdcorejs/angular/components/button';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';

export interface SdTableOptionSelector<T = any> {
  visible?: boolean;
  single?: boolean;
  actions?: SdTableAction<T>[];
  message?: string | ((selectedItems?: T[]) => string);
  onSelect?: (rowData?: T, selectedItems?: T[]) => void;
  onSelectAll?: (selectedItems: T[]) => void;
  disabled?: (rowData?: T, selectedItems?: T[]) => boolean;
}

export type SdTableAction<T = any> = SdTableActionNormal<T> | SdTableActionChildren<T>;

export interface SdTableActionNormal<T = any> {
  icon?: string;
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  title?: SdUnwrapSignal<SdButton['title']>;
  color?: SdUnwrapSignal<SdButton['color']>;
  type?: SdUnwrapSignal<SdButton['type']>;
  hidden?: boolean | ((rowData?: T) => boolean);
  isGrouped?: boolean;
  click: (selectedItems?: T[]) => void;
}

interface SdTableActionChildren<T = any> {
  icon?: string;
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  title?: SdUnwrapSignal<SdButton['title']>;
  color?: SdUnwrapSignal<SdButton['color']>;
  type?: SdUnwrapSignal<SdButton['type']>;
  hidden?: boolean | ((rowData?: T) => boolean);
  isGrouped?: boolean;
  children: SdTableActionNormal<T>[];
}

