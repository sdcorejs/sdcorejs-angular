import { SdButton } from '@sdcorejs/angular/components/button';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';

/** Một lệnh trên thanh chọn nhiều: nút chạy thẳng, hoặc nút mở menu các lệnh con. */
export type SdSelectionBarAction<T = any> = SdSelectionBarActionNormal<T> | SdSelectionBarActionChildren<T>;

export interface SdSelectionBarActionNormal<T = any> {
  variant: 'normal';
  icon?: string;
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  title?: SdUnwrapSignal<SdButton['title']>;
  color?: SdUnwrapSignal<SdButton['color']>;
  type?: SdUnwrapSignal<SdButton['type']>;
  click: (selectedItems?: T[]) => void;
}

export interface SdSelectionBarActionChildren<T = any> {
  variant: 'children';
  icon?: string;
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  title?: SdUnwrapSignal<SdButton['title']>;
  color?: SdUnwrapSignal<SdButton['color']>;
  type?: SdUnwrapSignal<SdButton['type']>;
  children: SdSelectionBarActionNormal<T>[];
}
