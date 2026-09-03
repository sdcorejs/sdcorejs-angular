import { Filter } from '@sdcorejs/utils/models';
import { Attribute, SdFormGenericExpression } from '../../../../models';
import { filterToFormExpression, formAttributesToQueryFields, formExpressionToFilter } from './form-expression-query-adapter';

describe('form-expression-query-adapter', () => {
  it('maps form attributes to query-builder fields while preserving existing operator limits', () => {
    const attributes: Attribute[] = [
      { value: 'customerName', display: 'Customer name', type: 'string' },
      { value: 'age', display: 'Age', type: 'number' },
      { value: 'active', display: 'Active', type: 'boolean', displayOnTrue: 'Yes', displayOnFalse: 'No' },
      {
        value: 'plan',
        display: 'Plan',
        type: 'values',
        values: [
          { value: 'free', display: 'Free' },
          { value: 'pro', display: 'Pro' },
        ],
      },
    ];

    const fields = formAttributesToQueryFields(attributes);

    expect(fields).toEqual([
      jasmine.objectContaining({
        key: 'customerName',
        label: 'Customer name',
        type: 'string',
        operators: ['EQUAL', 'NOT_EQUAL', 'NULL', 'NOT_NULL'],
      }),
      jasmine.objectContaining({ key: 'age', label: 'Age', type: 'number' }),
      jasmine.objectContaining({ key: 'active', label: 'Active', type: 'boolean', trueLabel: 'Yes', falseLabel: 'No' }),
      jasmine.objectContaining({
        key: 'plan',
        label: 'Plan',
        type: 'values',
        values: [
          { value: 'free', display: 'Free' },
          { value: 'pro', display: 'Pro' },
        ],
      }),
    ]);
  });

  it('converts nested SdFormGenericExpression to a query-builder Filter tree', () => {
    const expression: SdFormGenericExpression = {
      key: 'root',
      type: 'combinator',
      combinator: '&&',
      conditions: [
        { key: 'age-rule', type: 'condition', field: 'age', operator: 'GREATER_OR_EQUAL', value: 18, dayInfo: {} },
        {
          key: 'plan-group',
          type: 'combinator',
          combinator: '||',
          conditions: [
            { key: 'plan-pro', type: 'condition', field: 'plan', operator: 'EQUAL', value: 'pro', dayInfo: {} },
            { key: 'plan-empty', type: 'condition', field: 'plan', operator: 'NULL', value: undefined, dayInfo: {} },
          ],
        },
      ],
    };

    expect(formExpressionToFilter(expression)).toEqual({
      operator: 'AND',
      data: [
        { field: 'age', operator: 'GREATER_OR_EQUAL', data: 18 },
        {
          operator: 'OR',
          data: [
            { field: 'plan', operator: 'EQUAL', data: 'pro' },
            { field: 'plan', operator: 'NULL' },
          ],
        },
      ],
    } as Filter);
  });

  it('converts query-builder relative date filters back to runtime-compatible form expressions', () => {
    const expression = filterToFormExpression({
      operator: 'AND',
      data: [
        { field: 'startDate', operator: 'EQUAL', dataType: 'date-today', data: 'TODAY' },
        {
          field: 'endDate',
          operator: 'LESS_OR_EQUAL',
          dataType: 'date-relative',
          data: { amount: 2, direction: 'previous', unit: 'day' },
        },
      ],
    } as Filter);

    expect(expression.conditions.length).toBe(2);
    expect(expression.conditions[0]).toEqual(
      jasmine.objectContaining({
        type: 'condition',
        field: 'startDate',
        operator: 'EQUAL',
        value: 'now',
        dayInfo: { type: 'NOW' },
      })
    );
    expect(expression.conditions[1]).toEqual(
      jasmine.objectContaining({
        type: 'condition',
        field: 'endDate',
        operator: 'LESS_OR_EQUAL',
        value: '2LastDay',
        dayInfo: { type: 'RELATED', related: 'LASTDAY', relatedValue: 2 },
      })
    );
  });
});
