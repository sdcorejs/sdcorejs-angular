import { MaterialIconFontSet } from '@sdcorejs/angular/utilities/models';
import { Color } from '@sdcorejs/utils/models';

export interface SdTableCommandOption<T = any> {
  align?: 'left' | 'right';
  commands?: SdTableCommand<T>[];
}

export type SdTableCommand<T = any> = SdTableCommandNormal<T> | SdTableCommandChildren<T>;

export interface SdTableCommandNormal<T = any> {
  color?: Color;
  icon?: string | ((rowData: T) => string);
  fontSet?: MaterialIconFontSet;
  title?: string | ((rowData: T) => string);
  disabled?: boolean | ((rowData: T) => boolean);
  hidden?: boolean | ((rowData: T) => boolean | Promise<boolean>);
  click: (rowData: T) => void;
  htmlTemplate?: (rowData: T) => string;
}

export interface SdTableCommandChildren<T = any> {
  icon?: string | ((rowData: T) => string);
  fontSet?: MaterialIconFontSet;
  title?: string | ((rowData: T) => string);
  disabled?: boolean | ((rowData: T) => boolean);
  hidden?: boolean | ((rowData: T) => boolean | Promise<boolean>);
  children: SdTableCommandNormal<T>[];
}
