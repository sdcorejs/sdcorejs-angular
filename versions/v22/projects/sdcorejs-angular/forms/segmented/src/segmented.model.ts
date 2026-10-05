import { SdIconSet } from '@sdcorejs/angular/modules/icon';

export type SdSegmentedValue = string | number | boolean;
export type SdSegmentedModel<T extends SdSegmentedValue = SdSegmentedValue> = T | readonly T[] | null | undefined;
/** Appearance only: neutral track with a raised (`light`), solid (`fill`) or bordered (`outline`) selection. */
export type SdSegmentedType = 'light' | 'fill' | 'outline';

export interface SdSegmentedItem<T extends SdSegmentedValue = SdSegmentedValue> {
  readonly value: T;
  /** Visible label, also the default accessible name for icon-only choices. */
  readonly label: string;
  readonly prefixIcon?: string;
  readonly suffixIcon?: string;
  readonly fontSet?: SdIconSet;
  readonly iconOnly?: boolean;
  readonly disabled?: boolean;
}

export interface SdSegmentedOption {
  /** Single selection by default. Multiple mode emits a fresh array in item order. */
  readonly multiple?: boolean;
  /** Allow selecting the active single item again to clear to `null`. */
  readonly allowEmpty?: boolean;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly stretch?: boolean;
}

export interface SdSegmentedItemTemplateContext<T extends SdSegmentedValue = SdSegmentedValue> {
  readonly $implicit: SdSegmentedItem<T>;
  readonly item: SdSegmentedItem<T>;
  readonly selected: boolean;
}
