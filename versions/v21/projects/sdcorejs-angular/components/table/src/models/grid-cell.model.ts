import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';

export interface SdCellView {
  badge?: {
    type: SdUnwrapSignal<SdBadge['type']>;
    color: SdUnwrapSignal<SdBadge['color']>;
    icon: string;
  };
  tooltip?: string;
  display: {
    align: 'center' | 'left' | 'right';
    value: string;
    hasHtml?: boolean;
    html?: string;
  };
  click?: () => void;
}

