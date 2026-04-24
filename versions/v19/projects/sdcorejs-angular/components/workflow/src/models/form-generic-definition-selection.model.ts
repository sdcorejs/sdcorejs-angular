/* eslint-disable @typescript-eslint/no-explicit-any */
import { SdSearch } from '@sdcorejs/angular/forms/models';
import { SdFormGenericArgs } from './form-render/form-render-args.model';

// Khi render ra cÃ¡c UI nhÆ° dropdown, radio, checklist, Ä‘á»ƒ Ä‘Æ¡n giáº£n hÃ³a viá»‡c cÃ i Ä‘áº·t mÃ¬nh sáº½ sá»­ dá»¥ng valuesKey vÃ  gÃ¡n value tÆ°Æ¡ng á»©ng
// Dá»±a vÃ o value, cÃ³ thá»ƒ xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c API cáº§n gá»i Ä‘á»ƒ láº¥y data, xá»­ lÃ½ logic Ä‘áº·c thÃ¹
// Args lÃ 
export interface SdFormGenericSelectionItem<T = any> {
  value: string;
  display: string;
  disabled?: boolean;
  template?: string;
  data?: T;
}

// Model dá»±a theo values cá»§a Camunda
export interface SdFormGenericSelectionStaticItem {
  value: string;
  label: string;
}

export type SdFormGenericDefinitionSelection<T = any, TArgs = any> =
  | SelectionValues<T>
  | SelectionLazyValues<T>
  | SelectionValuesKey<TArgs>
  | SelectionLazyValuesKey<TArgs>;

interface SelectionVariables<T = any> {
  // Thá»±c táº¿ khi selection thay Ä‘á»•i, dá»±a vÃ o thÃ´ng tin detail vÃ­ dá»¥ { code: 'a', name: 'b', ...} sáº½ cÃ³ mong muá»‘n gÃ¡n cÃ¡c thÃ´ng tin nÃ y vÃ o form
  // Sá»­ dá»¥ng chung vá»›i thuá»™c tÃ­nh setVariables trong properties Ä‘á»ƒ trigger viá»‡c thay Ä‘á»•i giÃ¡ trá»‹ khi selection thay Ä‘á»•i
  // Cháº³ng háº¡n nhÆ° á»Ÿ mÃ n hÃ¬nh cáº­p nháº­t gÃ¬ Ä‘Ã³, khi chá»n dá»¯ liá»‡u muá»‘n cáº­p nháº­t thÃ¬ UI load sáºµn dá»¯ liá»‡u Ä‘Æ°á»£c chá»n
  items?: { value: Extract<keyof T, string>; display: string }[];
  detail?: (values: string | number | string[] | number[], args: SdFormGenericArgs) => Promise<T | undefined>;
}

interface SelectionQueries {
  items?: { value: string; display: string }[];
}

interface SelecttionBase {
  value: string; // GiÃ¡ trá»‹ sáº½ Ä‘Æ°á»£c gÃ¡n cho valuesKey
  display: string;
  // Xá»­ lÃ½ hiá»ƒn thá»‹ á»Ÿ tráº¡ng thÃ¡i viewed cá»§a dá»¯ liá»‡u
  viewed?: (values: (string | number)[], args: SdFormGenericArgs) => Promise<string>;
  queries?: SelectionQueries;
  variables?: SelectionVariables;
}

// Trong configuration sáº½ cÃ³ 1 function xá»­ lÃ½ chá»‰ dá»±a vÃ o key tráº£ vá» values hoáº·c lazyValues
interface SelectionValuesKey<TArgs> extends SelecttionBase {
  valuesKey: string;
  args?: TArgs;
}

interface SelectionLazyValuesKey<TArgs> extends SelecttionBase {
  lazyValuesKey: string;
  args?: TArgs;
}

interface SelectionValues<T = any> extends SelecttionBase {
  values: (args: SdFormGenericArgs) => Promise<SdFormGenericSelectionItem<T>[]>;
}

interface SelectionLazyValues<T = any> extends SelecttionBase {
  lazyValues: (searchArgs: Parameters<SdSearch>[0], args: SdFormGenericArgs) => Promise<SdFormGenericSelectionItem<T>[]>;
}

