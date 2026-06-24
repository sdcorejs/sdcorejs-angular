// Định nghĩa các Components của Form Render
import { SdTableColumn, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
import { Color, ValidationPatternType } from '@sdcorejs/utils/models';
import { Utilities } from '@sdcorejs/utils/fns';
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
  return Utilities.randomId('id');
};

export const GenerateKey = () => {
  return Utilities.randomId('key');
};

export const SdFormatComponent = (component: SdFormGenericComponent | SdFormGenericGroup) => {
  if (component) {
    if (!component.id) {
      component.id = GenerateId();
    }
    // Html và Group không có key và validate
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
      // Nếu là datetime thì gán mặc định subtype là date
      component.subtype = component.subtype || 'date';
    } else if (component.type === 'table') {
      // Nếu là table thì lấy columns mẫu
      if (!component.columns?.length) {
        component.columns = [
          {
            key: 'key_1',
            label: 'Cột 1',
            type: 'string',
          },
          {
            key: 'key_2',
            label: 'Cột 2',
            type: 'string',
          },
          {
            key: 'key_3',
            label: 'Cột 3',
            type: 'string',
          },
        ];
      }
    } else if (component.type === 'radio') {
      // Nếu là radio thì lấy values mẫu
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
      // Mặc định trải ngang các lựa chọn
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
  | SdFormGenericHtml
  | SdFormGenericBreak;

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
    viewed?: boolean; // true nếu muốn hiển thị dạng view (view khác với disable)
    hyperlink?: string; // Hyperlink khi ở trạng thái viewed
    hidden?: boolean;
    hiddenWhenExpression?: SdFormGenericExpression;
    visibleWhenExpression?: SdFormGenericExpression;
    disabledWhenExpression?: SdFormGenericExpression;
    requiredWhenExpression?: SdFormGenericExpression;
    onChange?: {
      // Thực tế khi sử dụng sẽ có mong muốn trigger sự kiện change sẽ làm gì đó
      // Nếu muốn setValues thì cú pháp sẽ là "key": "${otherKey}" hoặc "key": true, "key": "value"
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
    pattern?: ValidationPatternType | string; // Regex
    patternErrorMessage?: string; // Message lỗi khi invalid pattern
  } & SdFormGenericComponentBase['validate'];
}

export interface SdFormGenericChipString extends SdFormGenericComponentBase {
  type: 'chip-string';
  defaultValue?: string[];
  validate?: {
    maxlength?: number;
    minlength?: number;
    pattern?: ValidationPatternType | string; // Regex
    patternErrorMessage?: string; // Message lỗi khi invalid pattern
    maxOfItems?: number; // Số lượng item tối đa
  } & SdFormGenericComponentBase['validate'];
}
export interface SdFormGenericChipCalendar extends SdFormGenericComponentBase {
  type: 'chip-calendar';
  defaultValue?: string[];
  validate?: {
    maxlength?: number;
    minlength?: number;
    pattern?: ValidationPatternType | string; // Regex
    patternErrorMessage?: string; // Message lỗi khi invalid pattern
    maxOfItems?: number; // Số lượng item tối đa
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
  valuesKey?: string; // Mapping từ form-render-values
  defaultValue?: string;
  properties?: {
    direction?: 'row' | 'column';
  } & SdFormGenericComponentBase['properties'];
}
export interface SdFormGenericSelect extends SdFormGenericComponentBase {
  type: 'select';
  values?: SdFormGenericSelectionStaticItem[];
  valuesKey?: string; // Mapping từ form-render-values
  defaultValue?: string | string[];
  properties?: {
    query?: Record<string, any>;
    multiple?: boolean;
    setVariables?: Record<string, string>; // Chỉ đối với dữ liệu từ API
  } & SdFormGenericComponentBase['properties'];
}
export interface SdFormGenericChecklist extends SdFormGenericComponentBase {
  type: 'checklist';
  values?: SdFormGenericSelectionStaticItem[];
  valuesKey?: string; // Mapping từ form-render-values
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
    color: Color;
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
    maxSize?: SdUnwrapSignal<SdUploadFile['maxSize']>; // Dung lượng tối đa
    max?: SdUnwrapSignal<SdUploadFile['max']>; // Số lượng file tối đa
    extensions?: SdUnwrapSignal<SdUploadFile['extensions']>;
    args?: Record<string, any>; //.tham số
    // Dành cho mobile
    source?: 'ALL' | 'PHOTO_LIBRARY' | 'CAPTURE'; // Mặc định là ALL
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
    display: 'Chuỗi',
  },
  {
    value: 'number',
    display: 'Số',
  },
  {
    value: 'date',
    display: 'Ngày',
  },
  {
    value: 'datetime',
    display: 'Ngày giờ',
  },
  {
    value: 'values',
    display: 'Chọn giá trị',
  },
  {
    value: 'boolean',
    display: 'True/False',
  },
  {
    value: 'file',
    display: 'Tệp',
  },
  {
    value: 'image',
    display: 'Ảnh',
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
    titleButtonCreate?: string; // Tiêu đề nút tạo mới
  } & SdFormGenericComponentBase['properties'];
}

/**
 * Break component — invisible runtime element ép xuống dòng mới. Dùng khi layout có
 * vùng cố định và việc ẩn/hiện trường khác không nên xáo trộn vị trí các trường còn lại.
 * Ở canvas (design) render thanh ngang mảnh; ở runtime render empty 12-col cell.
 *
 * Extend SdFormGenericComponentBase để tương thích với union narrowing trong các pipe/render
 * (key, validate, disabled, properties full) — runtime sẽ ignore mọi field ngoài id/type/layout.
 */
export interface SdFormGenericBreak extends SdFormGenericComponentBase {
  type: 'break';
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
    hyperlink?: string; // Hyperlink khi ở trạng thái viewed
    hidden?: boolean;
    hiddenWhenExpression?: SdFormGenericExpression;
    visibleWhenExpression?: SdFormGenericExpression;
    variables?: { key: string; label: string; value?: string }[];
    queries?: { key: string; label: string }[];
    query?: Record<string, any>;
  };
}

export type FormBuilderComponentGroup = 'basic' | 'choice' | 'advanced' | 'layout';

export interface FormBuilderComponent {
  type: string;
  /** Material Symbols Rounded icon name. Rendered via <span class="msi">{symbol}</span>. */
  symbol: string;
  /** Category group for the left palette grouping. */
  group: FormBuilderComponentGroup;
  name: string;
}

export const FormBuilderComponents: FormBuilderComponent[] = [
  // ── Basic ───────────────────────────────────────────────────
  { type: 'textfield', symbol: 'text_fields', group: 'basic', name: 'Text field' },
  { type: 'textarea', symbol: 'notes', group: 'basic', name: 'Text area' },
  { type: 'number', symbol: '123', group: 'basic', name: 'Number' },
  { type: 'datetime', symbol: 'calendar_month', group: 'basic', name: 'Date' },
  // ── Choice ──────────────────────────────────────────────────
  { type: 'select', symbol: 'arrow_drop_down_circle', group: 'choice', name: 'Select' },
  { type: 'radio', symbol: 'radio_button_checked', group: 'choice', name: 'Radio' },
  { type: 'checkbox', symbol: 'check_box', group: 'choice', name: 'Check box' },
  // ── Advanced ────────────────────────────────────────────────
  { type: 'chip-string', symbol: 'label', group: 'advanced', name: 'Chip string' },
  { type: 'chip-calendar', symbol: 'event_note', group: 'advanced', name: 'Chip calendar' },
  { type: 'upload', symbol: 'upload_file', group: 'advanced', name: 'Upload' },
  { type: 'table', symbol: 'table_rows', group: 'advanced', name: 'Table' },
  // ── Layout ──────────────────────────────────────────────────
  // Break KHÔNG có trong palette — thêm qua per-row "+ Break" quick-add button.
  { type: 'group', symbol: 'category', group: 'layout', name: 'Group' },
  { type: 'html', symbol: 'code_blocks', group: 'layout', name: 'HTML' },
];

/** Lookup: component type → Material Symbol + label, used by attribute panel header. */
export const COMPONENT_ICONS: Record<string, { symbol: string; label: string }> = FormBuilderComponents.reduce(
  (acc, c) => ({ ...acc, [c.type]: { symbol: c.symbol, label: c.name } }),
  {} as Record<string, { symbol: string; label: string }>
);

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
