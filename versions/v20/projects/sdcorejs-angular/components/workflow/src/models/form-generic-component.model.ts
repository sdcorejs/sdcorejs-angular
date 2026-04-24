/* eslint-disable @typescript-eslint/no-explicit-any */
// Äá»‹nh nghÄ©a cÃ¡c Components cá»§a Form Render
import { SdTableColumn, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
import { SdColor } from '@sdcorejs/angular/utilities';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdPatternType } from '@sdcorejs/angular/utilities/models';
import { SdFormGenericSelectionStaticItem } from './form-generic-definition-selection.model';
import { SdFormGenericExpression } from './form-generic-expression.model';
import { SdFormGeneric } from './form-generic.model';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';

export interface SdFormRenderConfiguration {
  onLoaded?: () => void;
  components: SdFormGeneric['components'];
  validations?: SdFormGeneric['validations'];
  variables?: SdFormGenericVariable[];
  beforeSubmit?: (entity: Record<string, any>) => Promise<Record<string, any>>;
}

export interface SdFormGenericLayout {
  row?: string;
  columns: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  mobileColumns?:
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12;
}

export const GenerateId = () => {
  return SdUtilities.randomId('id');
};

export const GenerateKey = () => {
  return SdUtilities.randomId('key');
};

export const SdFormatComponent = (component: SdFormGenericComponent | SdFormGenericGroup) => {
  if (component) {
    if (!component.id) {
      component.id = GenerateId();
    }
    // Html vÃ  Group khÃ´ng cÃ³ key vÃ  validate
    if (component.type !== 'group') {
      if (!component.key) {
        component.key = GenerateKey();
      }
      if (!component.validate) {
        component.validate = {};
      }
    }
    if (!component.layout) {
      component.layout = {
        columns: '12',
      };
    }

    if (!component.properties) {
      component.properties = {};
    }

    if (component.type === 'datetime') {
      // Náº¿u lÃ  datetime thÃ¬ gÃ¡n máº·c Ä‘á»‹nh subtype lÃ  date
      component.subtype = component.subtype || 'date';
    } else if (component.type === 'table') {
      // Náº¿u lÃ  table thÃ¬ láº¥y columns máº«u
      if (!component.columns?.length) {
        component.columns = [
          {
            key: 'key_1',
            label: 'Cá»™t 1',
            type: 'string',
          },
          {
            key: 'key_2',
            label: 'Cá»™t 2',
            type: 'string',
          },
          {
            key: 'key_3',
            label: 'Cá»™t 3',
            type: 'string',
          },
        ];
      }
    } else if (component.type === 'radio') {
      // Náº¿u lÃ  radio thÃ¬ láº¥y values máº«u
      if (!component.values?.length) {
        component.values = [
          {
            value: 'value_1',
            label: 'Label 1',
          },
          {
            value: 'value_2',
            label: 'Label 2',
          },
        ];
      }
      // Máº·c Ä‘á»‹nh tráº£i ngang cÃ¡c lá»±a chá»n
      component.properties.direction = component.properties.direction || 'row';
    } else if (component.type === 'upload') {
      component.properties!.type = component.properties!.type || 'file';
      component.properties!.source = component.properties!.source || 'ALL';
    }
  }
};

export interface SdFormGenericVariable {
  id: string;
  key: string;
  label: string;
}

export type SdFormGenericComponent =
  | SdFormGenericTextfield
  | SdFormGenericChipString
  | SdFormGenericChipCalendar
  | SdFormGenericTextarea
  | SdFormGenericNumber
  | SdFormGenericCheckbox
  | SdFormGenericDatetime
  | SdFormGenericValues
  | SdFormGenericUpload
  | SdFormGenericTable
  | SdFormGenericHtml;

export type SdFormGenericValues = SdFormGenericRadio | SdFormGenericSelect | SdFormGenericChecklist;
export interface SdFormGenericComponentBase {
  template?: string;
  id: string;
  key: string;
  label: string;
  helperText?: string;
  layout?: SdFormGenericLayout;
  validate?: {
    required?: boolean;
  };
  disabled?: boolean;
  properties?: {
    viewed?: boolean; // true náº¿u muá»‘n hiá»ƒn thá»‹ dáº¡ng view (view khÃ¡c vá»›i disable)
    hyperlink?: string; // Hyperlink khi á»Ÿ tráº¡ng thÃ¡i viewed
    hidden?: boolean;
    hiddenWhenExpression?: SdFormGenericExpression;
    visibleWhenExpression?: SdFormGenericExpression;
    disabledWhenExpression?: SdFormGenericExpression;
    requiredWhenExpression?: SdFormGenericExpression;
    onChange?: {
      // Thá»±c táº¿ khi sá»­ dá»¥ng sáº½ cÃ³ mong muá»‘n trigger sá»± kiá»‡n change sáº½ lÃ m gÃ¬ Ä‘Ã³
      // Náº¿u muá»‘n setValues thÃ¬ cÃº phÃ¡p sáº½ lÃ  "key": "${otherKey}" hoáº·c "key": true, "key": "value"
      setValues?: Record<string, any>;
    };
  } & Record<string, any>;
}
export interface SdFormGenericTextfield extends SdFormGenericComponentBase {
  type: 'textfield';
  defaultValue?: string;
  validate?: {
    maxlength?: number;
    minlength?: number;
    pattern?: SdPatternType | string; // Regex
    patternErrorMessage?: string; // Message lá»—i khi invalid pattern
  } & SdFormGenericComponentBase['validate'];
}

export interface SdFormGenericChipString extends SdFormGenericComponentBase {
  type: 'chip-string';
  defaultValue?: string[];
  validate?: {
    maxlength?: number;
    minlength?: number;
    pattern?: SdPatternType | string; // Regex
    patternErrorMessage?: string; // Message lá»—i khi invalid pattern
    maxOfItems?: number; // Sá»‘ lÆ°á»£ng item tá»‘i Ä‘a
  } & SdFormGenericComponentBase['validate'];
}
export interface SdFormGenericChipCalendar extends SdFormGenericComponentBase {
  type: 'chip-calendar';
  defaultValue?: string[];
  validate?: {
    maxlength?: number;
    minlength?: number;
    pattern?: SdPatternType | string; // Regex
    patternErrorMessage?: string; // Message lá»—i khi invalid pattern
    maxOfItems?: number; // Sá»‘ lÆ°á»£ng item tá»‘i Ä‘a
  } & SdFormGenericComponentBase['validate'];
}
export interface SdFormGenericTextarea extends SdFormGenericComponentBase {
  type: 'textarea';
  defaultValue?: string;
  validate?: {
    maxlength?: number;
    minlength?: number;
  } & SdFormGenericComponentBase['validate'];
}

export interface SdFormGenericNumber extends SdFormGenericComponentBase {
  type: 'number';
  defaultValue?: number;
  validate?: {
    min?: number;
    max?: number;
  } & SdFormGenericComponentBase['validate'];
}

export interface SdFormGenericCheckbox extends SdFormGenericComponentBase {
  type: 'checkbox';
  defaultValue?: boolean;
}

export interface SdFormGenericDatetime extends SdFormGenericComponentBase {
  type: 'datetime';
  subtype: 'date' | 'datetime';
  defaultValue?: string;
  validate?: {
    min?: 'TODAY' | string;
    max?: 'TODAY' | string;
  } & SdFormGenericComponentBase['validate'];
}
export interface SdFormGenericRadio extends SdFormGenericComponentBase {
  type: 'radio';
  values?: SdFormGenericSelectionStaticItem[];
  valuesKey?: string; // Mapping tá»« form-render-values
  defaultValue?: string;
  properties?: {
    direction?: 'row' | 'column';
  } & SdFormGenericComponentBase['properties'];
}
export interface SdFormGenericSelect extends SdFormGenericComponentBase {
  type: 'select';
  values?: SdFormGenericSelectionStaticItem[];
  valuesKey?: string; // Mapping tá»« form-render-values
  defaultValue?: string | string[];
  properties?: {
    query?: Record<string, any>;
    multiple?: boolean;
    setVariables?: Record<string, string>; // Chá»‰ Ä‘á»‘i vá»›i dá»¯ liá»‡u tá»« API
  } & SdFormGenericComponentBase['properties'];
}
export interface SdFormGenericChecklist extends SdFormGenericComponentBase {
  type: 'checklist';
  values?: SdFormGenericSelectionStaticItem[];
  valuesKey?: string; // Mapping tá»« form-render-values
  defaultValue?: string[];
  properties?: {
    query?: Record<string, any>;
  } & SdFormGenericComponentBase['properties'];
}
export interface SdFormGenericGroup {
  id: string;
  type: 'group';
  label: string;
  layout: SdFormGenericLayout;
  components: SdFormGenericComponent[];
  properties: {
    icon: string;
    color: SdColor;
    hidden?: boolean;
    hiddenWhenExpression?: SdFormGenericExpression;
    visibleWhenExpression?: SdFormGenericExpression;
  };
}

// CUSTOM
export interface SdFormGenericUpload extends SdFormGenericComponentBase {
  type: 'upload';
  properties?: {
    type?: SdUnwrapSignal<SdUploadFile['type']>;
    maxSize?: SdUnwrapSignal<SdUploadFile['maxSize']>; // Dung lÆ°á»£ng tá»‘i Ä‘a
    max?: SdUnwrapSignal<SdUploadFile['max']>; // Sá»‘ lÆ°á»£ng file tá»‘i Ä‘a
    extensions?: SdUnwrapSignal<SdUploadFile['extensions']>;
    args?: Record<string, any>; //.tham sá»‘
    // DÃ nh cho mobile
    source?: 'ALL' | 'PHOTO_LIBRARY' | 'CAPTURE'; // Máº·c Ä‘á»‹nh lÃ  ALL
  } & SdFormGenericComponentBase['properties'];
}

export interface FormRenderComponentTableColumnValues {
  valuesKey: string;
  query?: Record<string, any>;
}

export type SdFormGenericTableColumn<T = any> =
  | TableColumnString<T>
  | TableColumnNumber<T>
  | TableColumnBool<T>
  | TableColumnDate<T>
  | TableColumnDatetime<T>
  | TableColumnRadio<T>
  | TableColumnValues<T>
  | TableColumnImage<T>
  | TableColumnFile<T>;

export const TableColumnTypes = [
  {
    value: 'string',
    display: 'Chuá»—i',
  },
  {
    value: 'number',
    display: 'Sá»‘',
  },
  {
    value: 'date',
    display: 'NgÃ y',
  },
  {
    value: 'datetime',
    display: 'NgÃ y giá»',
  },
  {
    value: 'values',
    display: 'Chá»n giÃ¡ trá»‹',
  },
  {
    value: 'boolean',
    display: 'True/False',
  },
  {
    value: 'file',
    display: 'Tá»‡p',
  },
  {
    value: 'image',
    display: 'áº¢nh',
  },
];

interface TableColumnBase<T = any> {
  key: Extract<keyof T, string>;
  label: string;
  width?: SdTableColumn['width'];
  validate?: {
    required?: boolean;
  };
}

interface TableColumnString<T = any> extends TableColumnBase<T> {
  type: 'string';
  validate?: { minlength?: number; maxlength?: number; pattern?: string; patternErrorMessage?: string } & TableColumnBase['validate'];
}

interface TableColumnNumber<T = any> extends TableColumnBase<T> {
  type: 'number';
  validate?: { min?: number; max?: number } & TableColumnBase['validate'];
}

interface TableColumnDate<T = any> extends TableColumnBase<T> {
  type: 'date';
  validate?: { min?: 'TODAY' | string; max?: 'TODAY' | string } & TableColumnBase['validate'];
}

interface TableColumnDatetime<T = any> extends TableColumnBase<T> {
  type: 'datetime';
  validate?: { min?: 'TODAY' | string; max?: 'TODAY' | string } & TableColumnBase['validate'];
}

interface TableColumnBool<T = any> extends TableColumnBase<T> {
  type: 'boolean';
  displayOnTrue?: string;
  displayOnFalse?: string;
}

interface TableColumnRadio<T = any> extends TableColumnBase<T> {
  type: 'radio';
  values?: SdFormGenericSelectionStaticItem[];
}

interface TableColumnValues<T = any> extends TableColumnBase<T> {
  type: 'values';
  valuesKey: string;
  query?: Record<string, any>;
  values?: SdFormGenericSelectionStaticItem[];
}
interface TableColumnImage<T = any> extends TableColumnBase<T> {
  type: 'image';
  args?: Record<string, any>;
  validate?: { max?: number; maxSize?: number } & TableColumnBase['validate'];
}

interface TableColumnFile<T = any> extends TableColumnBase<T> {
  type: 'file';
  args?: Record<string, any>;
  validate?: { max?: number; maxSize?: number } & TableColumnBase['validate'];
}

export interface SdFormGenericTable extends SdFormGenericComponentBase {
  type: 'table';
  columnsKey?: string;
  columns?: SdFormGenericTableColumn[];
  properties?: {
    type?: SdTableOption['type'];
    titleButtonCreate?: string; // TiÃªu Ä‘á» nÃºt táº¡o má»›i
  } & SdFormGenericComponentBase['properties'];
}

export interface SdFormGenericHtml {
  template?: string;
  id: string;
  key?: string;
  type: 'html';
  content: string;
  validate?: {
    required?: boolean;
  };
  layout?: SdFormGenericLayout;
  properties?: {
    viewed?: boolean;
    hyperlink?: string; // Hyperlink khi á»Ÿ tráº¡ng thÃ¡i viewed
    hidden?: boolean;
    hiddenWhenExpression?: SdFormGenericExpression;
    visibleWhenExpression?: SdFormGenericExpression;
    variables?: { key: string; label: string; value?: string }[];
    queries?: { key: string; label: string }[];
    query?: Record<string, any>;
  };
}

export interface FormBuilderComponent {
  type: string;
  icon: string;
  name: string;
}

export const FormBuilderComponents: FormBuilderComponent[] = [
  {
    type: 'textfield',
    icon: '<svg class="svg" fill="currentcolor" viewBox="0 0 54 54"><path fill-rule="evenodd" d="M45 16a3 3 0 013 3v16a3 3 0 01-3 3H9a3 3 0 01-3-3V19a3 3 0 013-3h36zm0 2H9a1 1 0 00-1 1v16a1 1 0 001 1h36a1 1 0 001-1V19a1 1 0 00-1-1zm-32 4v10h-2V22h2z"></path></svg>',
    name: 'Text field',
  },
  {
    type: 'textarea',
    icon: '<svg class="svg" fill="currentcolor" viewBox="0 0 54 54"><path fill-rule="evenodd" d="M45 13a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3zm0 2H9a1 1 0 0 0-1 1v22a1 1 0 0 0 1 1h36a1 1 0 0 0 1-1V16a1 1 0 0 0-1-1m-1.136 15.5.849.849-6.364 6.364-.849-.849zm.264 3.5.849.849-2.828 2.828-.849-.849zM13 19v10h-2V19z"></path></svg>',
    name: 'Text area',
  },
  {
    type: 'chip-string',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-240q-33 0-56.5-23.5T80-320v-320q0-33 23.5-56.5T160-720h640q33 0 56.5 23.5T880-640v320q0 33-23.5 56.5T800-240H160Zm0-80h640v-320H160v320Zm130-40h60v-90h90v-60h-90v-90h-60v90h-90v60h90v90Zm-130 40v-320 320Z"/></svg>',
    name: 'Chip string',
  },
  {
    type: 'chip-calendar',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-240q-33 0-56.5-23.5T80-320v-320q0-33 23.5-56.5T160-720h640q33 0 56.5 23.5T880-640v320q0 33-23.5 56.5T800-240H160Zm0-80h640v-320H160v320Zm130-40h60v-90h90v-60h-90v-90h-60v90h-90v60h90v90Zm-130 40v-320 320Z"/></svg>',
    name: 'Chip calendar',
  },
  {
    type: 'number',
    icon: '<svg class="svg" fill="currentcolor" viewBox="0 0 54 54"><path fill-rule="evenodd" d="M45 16a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3zm0 2H9a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h36a1 1 0 0 0 1-1V19a1 1 0 0 0-1-1M35 28.444h7l-3.5 4zM35 26h7l-3.5-4z"></path></svg>',
    name: 'Number',
  },
  {
    type: 'datetime',
    icon: '<svg class="svg" fill="currentcolor" viewBox="0 0 54 54"><path fill-rule="evenodd" d="M37.908 13.418h-5.004v-2.354h-1.766v2.354H21.13v-2.354h-1.766v2.354H14.36a2.07 2.07 0 0 0-2.06 2.06v23.549a2.07 2.07 0 0 0 2.06 2.06h6.77v-1.766h-6.358a.707.707 0 0 1-.706-.706V15.89c0-.39.316-.707.706-.707h4.592v2.355h1.766v-2.355h10.008v2.355h1.766v-2.355h4.592a.71.71 0 0 1 .707.707v6.358h1.765v-6.77c0-1.133-.927-2.06-2.06-2.06"></path><path d="m35.13 37.603 1.237-1.237-3.468-3.475v-5.926h-1.754v6.654l3.984 3.984Z"></path><path fill-rule="evenodd" d="M23.08 36.962a9.678 9.678 0 1 0 17.883-7.408 9.678 9.678 0 0 0-17.882 7.408Zm4.54-10.292a7.924 7.924 0 1 1 8.805 13.177A7.924 7.924 0 0 1 27.62 26.67"></path></svg>',
    name: 'Date',
  },
  {
    type: 'select',
    icon: '<svg class="svg" fill="currentcolor" viewBox="0 0 54 54"><path fill-rule="evenodd" d="M45 16a3 3 0 013 3v16a3 3 0 01-3 3H9a3 3 0 01-3-3V19a3 3 0 013-3h36zm0 2H9a1 1 0 00-1 1v16a1 1 0 001 1h36a1 1 0 001-1V19a1 1 0 00-1-1zm-12 7h9l-4.5 6-4.5-6z"></path></svg>',
    name: 'Select',
  },
  {
    type: 'radio',
    icon: '<svg class="svg" fill="currentcolor" viewBox="0 0 54 54"><path fill-rule="evenodd" d="M27 22c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5m0-5c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10m0 18a8 8 0 1 1 0-16 8 8 0 1 1 0 16"></path></svg>',
    name: 'Radio',
  },

  {
    type: 'checkbox',
    icon: '<svg class="svg" fill="currentcolor" viewBox="0 0 54 54"><path fill-rule="evenodd" d="M34 18H20a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V20a2 2 0 0 0-2-2m-9 14-5-5 1.41-1.41L25 29.17l7.59-7.59L34 23z"></path></svg>',
    name: 'Check box',
  },
  {
    type: 'html',
    icon: '<span style="font-size:32px" class="material-icons">code</span>',
    name: 'HTML',
  },
  {
    type: 'upload',
    icon: '<svg class="svg" fill="currentcolor" class="fjs-palette-field-icon" viewBox="0 0 54 54"><path fill-rule="evenodd" d="M34.636 21.91A3.818 3.818 0 1127 21.908a3.818 3.818 0 017.636 0zm-2 0A1.818 1.818 0 1129 21.908a1.818 1.818 0 013.636 0z" clip-rule="evenodd"></path><path fill-rule="evenodd" d="M15 13a2 2 0 00-2 2v24a2 2 0 002 2h24a2 2 0 002-2V15a2 2 0 00-2-2H15zm24 2H15v12.45l4.71-4.709a1.91 1.91 0 012.702 0l6.695 6.695 2.656-1.77a1.91 1.91 0 012.411.239L39 32.73V15zM15 39v-8.754a.975.975 0 00.168-.135l5.893-5.893 6.684 6.685a1.911 1.911 0 002.41.238l2.657-1.77 6.02 6.02c.052.051.108.097.168.135V39H15z" clip-rule="evenodd"></path></svg>',
    name: 'Upload',
  },
  {
    type: 'table',
    icon: '<span style="font-size:32px" class="material-icons">table_chart</span>',
    name: 'Table',
  },
];

export const GetComponentAttributes = (components: (SdFormGenericComponent | SdFormGenericGroup)[]) => {
  const attributes: { value: string; display: string }[] = [];
  if (components.length) {
    for (const component of components) {
      if (component.type === 'group') {
        attributes.push(...GetComponentAttributes(component.components));
      } else if (component.type !== 'html') {
        attributes.push({
          value: component.key,
          display: component.label,
        });
      }
    }
  }
  return attributes;
};

export const GetVariableAttributes = (variables: SdFormGenericVariable[]) => {
  const attributes: { value: string; display: string }[] = [];
  if (variables.length) {
    for (const variable of variables) {
      attributes.push({
        value: variable.key,
        display: `[VARIABLE] ${variable.label}`,
      });
    }
  }
  return attributes;
};

