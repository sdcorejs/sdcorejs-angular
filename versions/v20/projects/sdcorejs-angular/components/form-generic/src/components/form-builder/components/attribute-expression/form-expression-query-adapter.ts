import { SdQueryBuilderField } from '@sdcorejs/angular/components/query-builder';
import { Filter, Operator } from '@sdcorejs/utils/models';
import { Attribute, AttributeOperators, DayInfo, SdFormGenericExpression, SdFormGenericExpressionCondition } from '../../../../models';

let expressionId = 0;

export function formAttributesToQueryFields(attributes: Attribute[]): SdQueryBuilderField[] {
  return attributes.map(attribute => ({
    key: attribute.value,
    label: attribute.display,
    type: attribute.type === 'datetime' ? 'datetime' : attribute.type,
    operators: AttributeOperators[attribute.type].map(operator => operator.value as Operator),
    values: attribute.type === 'values' ? attribute.values : undefined,
    trueLabel: attribute.type === 'boolean' ? attribute.displayOnTrue : undefined,
    falseLabel: attribute.type === 'boolean' ? attribute.displayOnFalse : undefined,
  }));
}

export function formExpressionToFilter(expression: SdFormGenericExpression | undefined | null): Filter | null {
  if (!expression?.conditions?.length) return null;

  const data = expression.conditions
    .map(condition => (condition.type === 'combinator' ? formExpressionToFilter(condition) : conditionToFilter(condition)))
    .filter((filter): filter is Filter => !!filter);

  if (!data.length) return null;

  return {
    operator: expression.combinator === '||' ? 'OR' : 'AND',
    data,
  } as Filter;
}

export function filterToFormExpression(filter: Filter | null | undefined): SdFormGenericExpression {
  const root = newExpression(filter && isAndOrFilter(filter) && filter.operator === 'OR' ? '||' : '&&');
  if (!filter) return root;

  if (isAndOrFilter(filter)) {
    root.conditions = filter.data.map(filterToExpressionNode);
    return root;
  }

  root.conditions = [filterToCondition(filter)];
  return root;
}

function conditionToFilter(condition: SdFormGenericExpressionCondition): Filter | null {
  if (!condition.field || !condition.operator) return null;

  if (condition.operator === 'NULL' || condition.operator === 'NOT_NULL') {
    return {
      field: condition.field as never,
      operator: condition.operator,
    } as Filter;
  }

  if (condition.value === undefined || condition.value === null || condition.value === '') return null;

  return {
    field: condition.field as never,
    operator: condition.operator,
    data: condition.value,
  } as Filter;
}

function filterToExpressionNode(filter: Filter): SdFormGenericExpression | SdFormGenericExpressionCondition {
  return isAndOrFilter(filter) ? filterToGroupExpression(filter) : filterToCondition(filter);
}

function filterToGroupExpression(filter: { operator: 'AND' | 'OR'; data: Filter[] }): SdFormGenericExpression {
  return {
    ...newExpression(filter.operator === 'OR' ? '||' : '&&'),
    conditions: filter.data.map(filterToExpressionNode),
  };
}

function filterToCondition(filter: Filter): SdFormGenericExpressionCondition {
  const raw = filter as Record<string, any>;
  const relative = readRelativeDate(raw);

  return {
    key: nextExpressionId('condition'),
    type: 'condition',
    field: raw['field'],
    operator: raw['operator'],
    value: relative.value,
    dayInfo: relative.dayInfo,
  };
}

function readRelativeDate(filter: Record<string, any>): { value: any; dayInfo: DayInfo } {
  if (filter['dataType'] === 'date-today') {
    return { value: 'now', dayInfo: { type: 'NOW' } };
  }

  if (filter['dataType'] === 'date-relative') {
    const data = filter['data'];
    if (data?.unit === 'day' && typeof data.amount === 'number') {
      const related = data.direction === 'next' ? 'NEXTDAY' : 'LASTDAY';
      const suffix = related === 'NEXTDAY' ? 'NextDay' : 'LastDay';

      return {
        value: `${data.amount}${suffix}`,
        dayInfo: {
          type: 'RELATED',
          related,
          relatedValue: data.amount,
        },
      };
    }
  }

  return { value: filter['data'], dayInfo: {} };
}

function newExpression(combinator: '&&' | '||'): SdFormGenericExpression {
  return {
    key: nextExpressionId('group'),
    type: 'combinator',
    combinator,
    conditions: [],
  };
}

function nextExpressionId(prefix: string): string {
  expressionId += 1;
  return `${prefix}-${expressionId}`;
}

function isAndOrFilter(filter: any): filter is { operator: 'AND' | 'OR'; data: Filter[] } {
  return !!filter && (filter.operator === 'AND' || filter.operator === 'OR') && Array.isArray(filter.data);
}
