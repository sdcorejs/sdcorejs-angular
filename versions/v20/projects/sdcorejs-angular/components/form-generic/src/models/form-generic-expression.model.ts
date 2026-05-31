import { Operator as SdOperator } from '@sdcorejs/utils/models';
import { SdFormGenericComponent, SdFormGenericGroup } from './form-generic-component.model';
import { DateUtilities } from '@sdcorejs/angular/utilities';

export interface SdFormGenericExpression {
  key: string; // Random, phá»¥c vá»¥ cho @for á»Ÿ attribute-expression
  type: 'combinator';
  combinator: '&&' | '||';
  conditions: (SdFormGenericExpression | SdFormGenericExpressionCondition)[];
}

export interface SdFormGenericExpressionCondition {
  key: string; // Random, phá»¥c vá»¥ cho @for á»Ÿ attribute-expression
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
    display: 'Báº±ng',
  },
  {
    value: 'NOT_EQUAL',
    symbol: 'â‰ ',
    display: 'KhÃ´ng báº±ng',
  },
  {
    value: 'GREATER_THAN',
    symbol: '>',
    display: 'Lá»›n hÆ¡n',
  },
  {
    value: 'LESS_THAN',
    symbol: '<',
    display: 'Nhá» hÆ¡n',
  },
  {
    value: 'GREATER_OR_EQUAL',
    symbol: 'â‰¥',
    display: 'Lá»›n hÆ¡n, hoáº·c báº±ng',
  },
  {
    value: 'LESS_OR_EQUAL',
    symbol: 'â‰¤',
    display: 'Nhá» hÆ¡n, hoáº·c báº±ng',
  },
  {
    value: 'NULL',
    symbol: 'motion_photos_off',
    display: 'LÃ  rá»—ng',
  },
  {
    value: 'NOT_NULL',
    symbol: 'adjust',
    display: 'KhÃ´ng rá»—ng',
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
  { value: 'RELATED', display: 'NgÃ y liÃªn quan' },
  { value: 'NOW', display: 'NgÃ y hiá»‡n táº¡i' },
  { value: 'DATETIME', display: 'NgÃ y cá»¥ thá»ƒ' },
  { value: 'ATTRIBUTE', display: 'TrÆ°á»ng dá»¯ liá»‡u' },
];

export const DayInfoPreviouses = [
  { value: 'LASTDAY', display: 'NgÃ y trÆ°á»›c', format: (n: number) => `${n || 1}LastDay` },
  { value: 'NEXTDAY', display: 'NgÃ y tá»›i', format: (n: number) => `${n || 1}NextDay` },
  // { value: 'LASTWEEK', display: 'Tuáº§n trÆ°á»›c', format: (n: number) => `${n || 1}LastWeek` },
  // { value: 'NEXTWEEK', display: 'Tuáº§n tá»›i', format: (n: number) => `${n || 1}NextWeek` },
  // { value: 'LASTMONTH', display: 'ThÃ¡ng trÆ°á»›c', format: (n: number) => `${n || 1}LastMonth` },
  // { value: 'NEXTMONTH', display: 'ThÃ¡ng tá»›i', format: (n: number) => `${n || 1}NextMonth` },
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
      display: 'Báº±ng',
    },
    {
      value: 'NOT_EQUAL',
      symbol: 'â‰ ',
      display: 'KhÃ´ng báº±ng',
    },
    {
      value: 'NULL',
      symbol: 'motion_photos_off',
      display: 'LÃ  rá»—ng',
    },
    {
      value: 'NOT_NULL',
      symbol: 'adjust',
      display: 'KhÃ´ng rá»—ng',
    },
  ],
  number: Operators,
  datetime: Operators,
  boolean: [
    {
      value: 'EQUAL',
      symbol: '=',
      display: 'Báº±ng',
    },
    {
      value: 'NOT_EQUAL',
      symbol: 'â‰ ',
      display: 'KhÃ´ng báº±ng',
    },
  ],
  values: [
    {
      value: 'EQUAL',
      symbol: '=',
      display: 'Báº±ng',
    },
    {
      value: 'NOT_EQUAL',
      symbol: 'â‰ ',
      display: 'KhÃ´ng báº±ng',
    },
    {
      value: 'NULL',
      symbol: 'motion_photos_off',
      display: 'LÃ  rá»—ng',
    },
    {
      value: 'NOT_NULL',
      symbol: 'adjust',
      display: 'KhÃ´ng rá»—ng',
    },
  ],
};

// Tá»« components map thÃ nh cÃ¡c attributes
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
      // Xá»­ lÃ½ trong trÆ°á»ng há»£p key cÃ³ Ä‘á»‹nh dáº¡ng a.b.c ...
      let val: any = entity;
      const strs = key.split('.');
      for (const str of strs) {
        val = val?.[str];
      }
      if (typeof val === 'string') {
        // Xá»­ lÃ½ Ä‘á»‘i vá»›i trÆ°á»ng há»£p string lÃ  'datetime' thÃ¬ cáº§n format thÃ nh string Ä‘á»“ng nháº¥t Ä‘á»ƒ compare chÃ­nh xÃ¡c
        if (DateUtilities.isDate(val)) {
          template = template.replace(match, `'${DateUtilities.toFormat(val, 'yyyy/MM/dd HH:mm:ss')}'`);
        } else {
          // Náº¿u lÃ  chuá»—i thÃ¬ thÃªm dáº¥u nhÃ¡y khi replace giÃ¡ trá»‹ Ä‘á»ƒ so sÃ¡nh, vÃ­ dá»¥ 'a' === 'a'
          // Náº¿u lÃ  sá»‘ hay boolean thÃ¬ khÃ´ng cáº§n, vÃ­ dá»¥ 121 === 121
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

export const EvaluateExpression = (condition: SdFormGenericExpression | SdFormGenericExpressionCondition, entity: Record<string, any>): boolean | undefined => {
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
    // Náº¿u nhiá»u hÆ¡n 1 Ä‘iá»u kiá»‡n, bá»c Ä‘iá»u kiá»‡n báº±ng cáº·p ngoáº·c ()
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
  // Convert thÃ nh syntax ${field}
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
  // Xá»­ lÃ½ Ä‘á»‘i vá»›i trÆ°á»ng há»£p string lÃ  'datetime' thÃ¬ value sáº½ cÃ³ thá»ƒ lÃ  'now', '1LastDay' ....
  const datetimeValue = GetDatetimeValue(value);
  if (operator === 'EQUAL') {
    // Náº¿u lÃ  chuá»—i thÃ¬ thÃªm dáº¥u nhÃ¡y, náº¿u khÃ´ng thÃ¬ bá» qua
    if (typeof value === 'string') {
      return `${field} === '${datetimeValue || value}'`;
    }
    return `${field} === ${value}`;
  }
  if (operator === 'GREATER_THAN') {
    // Náº¿u lÃ  chuá»—i thÃ¬ thÃªm dáº¥u nhÃ¡y, náº¿u khÃ´ng thÃ¬ bá» qua
    if (typeof value === 'string') {
      return `${field} > '${datetimeValue || value}'`;
    }
    return `${field} > ${value}`;
  }
  if (operator === 'LESS_THAN') {
    // Náº¿u lÃ  chuá»—i thÃ¬ thÃªm dáº¥u nhÃ¡y, náº¿u khÃ´ng thÃ¬ bá» qua
    if (typeof value === 'string') {
      return `${field} < '${datetimeValue || value}'`;
    }
    return `${field} < ${value}`;
  }
  if (operator === 'NOT_EQUAL') {
    // Náº¿u lÃ  chuá»—i thÃ¬ thÃªm dáº¥u nhÃ¡y, náº¿u khÃ´ng thÃ¬ bá» qua
    if (typeof value === 'string') {
      return `${field} !== '${datetimeValue || value}'`;
    }
    return `${field} !== ${value}`;
  }
  if (operator === 'GREATER_OR_EQUAL') {
    // Náº¿u lÃ  chuá»—i thÃ¬ thÃªm dáº¥u nhÃ¡y, náº¿u khÃ´ng thÃ¬ bá» qua
    if (typeof value === 'string') {
      return `${field} >= '${datetimeValue || value}'`;
    }
    return `${field} >= ${value}`;
  }
  if (operator === 'LESS_OR_EQUAL') {
    // Náº¿u lÃ  chuá»—i thÃ¬ thÃªm dáº¥u nhÃ¡y, náº¿u khÃ´ng thÃ¬ bá» qua
    if (typeof value === 'string') {
      return `${field} <= '${datetimeValue || value}'`;
    }
    return `${field} <= ${value}`;
  }
  return undefined;
};

