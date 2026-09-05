import type { SdIconSet } from '@sdcorejs/angular/modules/icon';
import type { SdButton, SdButtonColor } from '@sdcorejs/angular/components/button';
import type { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';

/** Internal presentation only; closures keep row and selection callbacks distinct. */
export interface SdTableMobileAction {
  key: string;
  title: string;
  icon?: string;
  fontSet?: SdIconSet;
  color?: SdButtonColor;
  type?: SdUnwrapSignal<SdButton['type']>;
  disabled?: boolean;
  htmlTemplate?: string;
  children?: SdTableMobileAction[];
  run?: () => unknown;
}
