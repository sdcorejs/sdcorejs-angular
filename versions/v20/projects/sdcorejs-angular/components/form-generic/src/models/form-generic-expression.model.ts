import { Operator as SdOperator } from '@sdcorejs/utils/models';
import { SdFormGenericComponent, SdFormGenericGroup } from './form-generic-component.model';
import { DateUtilities } from '@sdcorejs/angular/utilities';

export interface SdFormGenericExpression {
  key: string; // Random, phục vụ cho @for ở attribute-expression
  type: 'combinator';
  combinator: '&&' | '||';
  conditions: (SdFormGenericExpression | SdFormGenericExpressionCondition)[];
}

export interface SdFormGenericExpressionCondition {
  key: string; // Random, phục vụ cho @for ở attribute-expression
  type: 'condition';
  field?: string;
  operator: SdOperator;
  value: any;
  dayInfo: DayInfo;
}

export type Operator = 'EQUAL' | 'NOT_EQUAL' | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_OR_EQUAL' | 'LESS_OR_EQUAL' | 'NULL' | 'NOT_NULL';
export const Operators: {
  value: Operator;
  symbol?: string;
  display: string;
}[] = [
  {
    value: 'EQUAL',
    symbol: '=',
    display: 'Bằng',
  },
  {
    value: 'NOT_EQUAL',
    symbol: '≠',
    display: 'Không bằng',
  },
  {
    value: 'GREATER_THAN',
    symbol: '>',
    display: 'Lớn hơn',
  },
  {
    value: 'LESS_THAN',
    symbol: '<',
    display: 'Nhỏ hơn',
  },
  {
    value: 'GREATER_OR_EQUAL',
    symbol: '≥',
    display: 'Lớn hơn, hoặc bằng',
  },
  {
    value: 'LESS_OR_EQUAL',
    symbol: '≤',
    display: 'Nhỏ hơn, hoặc bằng',
  },
  {
    value: 'NULL',
    symbol: 'motion_photos_off',
    display: 'Là rỗng',
  },
  {
    value: 'NOT_NULL',
    symbol: 'adjust',
    display: 'Không rỗng',
  },
];

export type Attribute = AttributeBase | AttributeBoolean | AttributeDate | AttributeValues;

interface AttributeBase {
  value: string;
  display: string;
  type: 'string' | 'number';
}

interface AttributeBoolean {
  value: string;
  display: string;
  type: 'boolean';
  displayOnTrue: string;
  displayOnFalse: string;
}

interface AttributeDate {
  value: string;
  display: string;
  type: 'datetime';
}

export interface DayInfo {
  type?: 'RELATED' | 'NOW' | 'DATETIME' | 'ATTRIBUTE';
  related?: 'LASTDAY' | 'NEXTDAY' | 'LASTWEEK' | 'NEXTWEEK' | 'LASTMONTH' | 'NEXTMONTH';
  relatedValue?: number;
}

export const DayInfoTypes = [
  { value: 'RELATED', display: 'Ngày liên quan' },
  { value: 'NOW', display: 'Ngày hiện tại' },
  { value: 'DATETIME', display: 'Ngày cụ thể' },
  { value: 'ATTRIBUTE', display: 'Trường dữ liệu' },
];

export const DayInfoPreviouses = [
  { value: 'LASTDAY', display: 'Ngày trước', format: (n: number) => `${n || 1}LastDay` },
  { value: 'NEXTDAY', display: 'Ngày tới', format: (n: number) => `${n || 1}NextDay` },
  // { value: 'LASTWEEK', display: 'Tuần trước', format: (n: number) => `${n || 1}LastWeek` },
  // { value: 'NEXTWEEK', display: 'Tuần tới', format: (n: number) => `${n || 1}NextWeek` },
  // { value: 'LASTMONTH', display: 'Tháng trước', format: (n: number) => `${n || 1}LastMonth` },
  // { value: 'NEXTMONTH', display: 'Tháng tới', format: (n: number) => `${n || 1}NextMonth` },
];

export const GetDatetimeValue = (value: string) => {
  if (!value || typeof value !== 'string') {
    return undefined;
  }
  if (value === 'now') {
    return DateUtilities.toFormat(new Date(), 'yyyy/MM/dd HH:mm:ss');
  }
  if (value?.endsWith('LastDay')) {
    const relatedValue = +value.replace('LastDay', '');
    if (relatedValue) {
      return DateUtilities.toFormat(DateUtilities.addDays(new Date(), -relatedValue), 'yyyy/MM/dd HH:mm:ss');
    }
  }
  if (value?.endsWith('NextDay')) {
    const relatedValue = +value.replace('LastDay', '');
    if (relatedValue) {
      return DateUtilities.toFormat(DateUtilities.addDays(new Date(), relatedValue), 'yyyy/MM/dd HH:mm:ss');
    }
  }
  return undefined;
};

interface AttributeValues {
  value: string;
  display: string;
  type: 'values';
  values: { value: string; display: string }[];
}

export const AttributeOperators: Record<
  Attribute['type'],
  {
    value: Operator;
    symbol?: string;
    display: string;
  }[]
> = {
  string: [
    {
      value: 'EQUAL',
      symbol: '=',
      display: 'Bằng',
    },
    {
      value: 'NOT_EQUAL',
      symbol: '≠',
      display: 'Không bằng',
    },
    {
      value: 'NULL',
      symbol: 'motion_photos_off',
      display: 'Là rỗng',
    },
    {
      value: 'NOT_NULL',
      symbol: 'adjust',
      display: 'Không rỗng',
    },
  ],
  number: Operators,
  datetime: Operators,
  boolean: [
    {
      value: 'EQUAL',
      symbol: '=',
      display: 'Bằng',
    },
    {
      value: 'NOT_EQUAL',
      symbol: '≠',
      display: 'Không bằng',
    },
  ],
  values: [
    {
      value: 'EQUAL',
      symbol: '=',
      display: 'Bằng',
    },
    {
      value: 'NOT_EQUAL',
      symbol: '≠',
      display: 'Không bằng',
    },
    {
      value: 'NULL',
      symbol: 'motion_photos_off',
      display: 'Là rỗng',
    },
    {
      value: 'NOT_NULL',
      symbol: 'adjust',
      display: 'Không rỗng',
    },
  ],
};

// Từ components map thành các attributes
export const GetAttributes = (components: (SdFormGenericComponent | SdFormGenericGroup)[]): Attribute[] => {
  const attributes: Attribute[] = [];
  if (components.length) {
    for (const component of components) {
      if (component.type === 'group') {
        attributes.push(...GetAttributes(component.components));
      } else if (component.type === 'textfield' || component.type === 'textarea') {
        attributes.push({
          value: component.key,
          display: component.label,
          type: 'string',
        });
      } else if (component.type === 'number') {
        attributes.push({
          value: component.key,
          display: component.label,
          type: 'number',
        });
      } else if (component.type === 'datetime') {
        attributes.push({
          value: component.key,
          display: component.label,
          type: 'datetime',
        });
      } else if (component.type === 'checkbox') {
        attributes.push({
          value: component.key,
          display: component.label,
          type: 'boolean',
          displayOnTrue: 'YES',
          displayOnFalse: 'NO',
        });
      } else if (component.type === 'radio' || component.type === 'select') {
        if (component.values?.length) {
          attributes.push({
            value: component.key,
            display: component.label,
            type: 'values',
            values: component.values.map(e => ({
              value: e.value,
              display: e.label,
            })),
          });
        } else {
          attributes.push({
            value: component.key,
            display: component.label,
            type: 'string',
          });
        }
      }
    }
  }
  return attributes;
};

export const TemplateToCondition = (template: string | undefined | null, entity: Record<string, any>) => {
  if (!template) {
    return undefined;
  }
  const regex = /\$\{([A-Za-z0-9._-]*)\}/g;
  const matches = template.match(regex) || [];
  for (const match of matches) {
    const key = match.slice(2, match.length - 1);
    if (key) {
      // Xử lý trong trường hợp key có định dạng a.b.c ...
      let val: any = entity;
      const strs = key.split('.');
      for (const str of strs) {
        val = val?.[str];
      }
      if (typeof val === 'string') {
        // Xử lý đối với trường hợp string là 'datetime' thì cần format thành string đồng nhất để compare chính xác
        if (DateUtilities.isDate(val)) {
          template = template.replace(match, `'${DateUtilities.toFormat(val, 'yyyy/MM/dd HH:mm:ss')}'`);
        } else {
          // Nếu là chuỗi thì thêm dấu nháy khi replace giá trị để so sánh, ví dụ 'a' === 'a'
          // Nếu là số hay boolean thì không cần, ví dụ 121 === 121
          template = template.replace(match, `'${val}'`);
        }
      } else {
        template = template.replace(match, val ?? `undefined`);
      }
    }
  }
  return template;
};

const GetEntityValue = (entity: Record<string, any>, key: string | undefined) => {
  if (!key) {
    return undefined;
  }

  let value: any = entity;
  for (const part of key.split('.')) {
    value = value?.[part];
  }
  return value;
};

const NormalizeExpressionValue = (value: any) => {
  if (typeof value === 'string' && DateUtilities.isDate(value)) {
    return DateUtilities.toFormat(value, 'yyyy/MM/dd HH:mm:ss');
  }
  return value;
};

const EvaluateExpressionCondition = (condition: SdFormGenericExpressionCondition, entity: Record<string, any>) => {
  const actualValue = NormalizeExpressionValue(GetEntityValue(entity, condition.field));
  const { operator } = condition;
  if (!operator) {
    return undefined;
  }
  if (operator === 'NULL') {
    return !actualValue;
  }
  if (operator === 'NOT_NULL') {
    return !!actualValue;
  }

  const expectedValue = typeof condition.value === 'string' ? GetDatetimeValue(condition.value) || condition.value : condition.value;
  if (expectedValue === undefined || expectedValue === null || expectedValue === '') {
    return undefined;
  }

  const normalizedExpectedValue = NormalizeExpressionValue(expectedValue);
  if (operator === 'EQUAL') {
    return actualValue === normalizedExpectedValue;
  }
  if (operator === 'GREATER_THAN') {
    return actualValue > normalizedExpectedValue;
  }
  if (operator === 'LESS_THAN') {
    return actualValue < normalizedExpectedValue;
  }
  if (operator === 'NOT_EQUAL') {
    return actualValue !== normalizedExpectedValue;
  }
  if (operator === 'GREATER_OR_EQUAL') {
    return actualValue >= normalizedExpectedValue;
  }
  if (operator === 'LESS_OR_EQUAL') {
    return actualValue <= normalizedExpectedValue;
  }
  return undefined;
};

export const EvaluateExpression = (
  condition: SdFormGenericExpression | SdFormGenericExpressionCondition,
  entity: Record<string, any>
): boolean | undefined => {
  if (condition.type === 'combinator') {
    if (!condition.conditions?.length) {
      return undefined;
    }

    const results = condition.conditions.map(child => EvaluateExpression(child, entity));
    if (results.some(result => typeof result !== 'boolean')) {
      return undefined;
    }

    if (condition.combinator === '&&') {
      return results.every(result => result === true);
    }
    return results.some(result => result === true);
  }

  return EvaluateExpressionCondition(condition, entity);
};

export const ExpressionToJavascriptExpression = (condition: SdFormGenericExpression | SdFormGenericExpressionCondition) => {
  const queries: string[] = [];
  if (condition.type === 'combinator') {
    if (condition.conditions?.length) {
      for (const child of condition.conditions) {
        queries.push(`(${ExpressionToJavascriptExpression(child)})`);
      }
    }
    // Nếu nhiều hơn 1 điều kiện, bọc điều kiện bằng cặp ngoặc ()
    const query = queries.join(` ${condition.combinator} `);
    if (queries.length > 1) {
      return `(${query})`;
    } else {
      return query;
    }
  } else {
    return ConvertToJavascriptExpression(condition);
  }
};
const ConvertToJavascriptExpression = (condition: SdFormGenericExpressionCondition) => {
  const { value } = condition;
  // Convert thành syntax ${field}
  const field = '${' + condition.field + '}';
  const { operator } = condition;
  if (!operator) {
    return undefined;
  }
  if (operator === 'NULL') {
    return `!${field}`;
  }
  if (operator === 'NOT_NULL') {
    return `!!${field}`;
  }
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  // Xử lý đối với trường hợp string là 'datetime' thì value sẽ có thể là 'now', '1LastDay' ....
  const datetimeValue = GetDatetimeValue(value);
  if (operator === 'EQUAL') {
    // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
    if (typeof value === 'string') {
      return `${field} === '${datetimeValue || value}'`;
    }
    return `${field} === ${value}`;
  }
  if (operator === 'GREATER_THAN') {
    // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
    if (typeof value === 'string') {
      return `${field} > '${datetimeValue || value}'`;
    }
    return `${field} > ${value}`;
  }
  if (operator === 'LESS_THAN') {
    // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
    if (typeof value === 'string') {
      return `${field} < '${datetimeValue || value}'`;
    }
    return `${field} < ${value}`;
  }
  if (operator === 'NOT_EQUAL') {
    // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
    if (typeof value === 'string') {
      return `${field} !== '${datetimeValue || value}'`;
    }
    return `${field} !== ${value}`;
  }
  if (operator === 'GREATER_OR_EQUAL') {
    // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
    if (typeof value === 'string') {
      return `${field} >= '${datetimeValue || value}'`;
    }
    return `${field} >= ${value}`;
  }
  if (operator === 'LESS_OR_EQUAL') {
    // Nếu là chuỗi thì thêm dấu nháy, nếu không thì bỏ qua
    if (typeof value === 'string') {
      return `${field} <= '${datetimeValue || value}'`;
    }
    return `${field} <= ${value}`;
  }
  return undefined;
};
