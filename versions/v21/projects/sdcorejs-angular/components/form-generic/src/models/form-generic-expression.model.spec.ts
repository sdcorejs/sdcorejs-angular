import {
  AttributeOperators,
  DayInfoPreviouses,
  EvaluateExpression,
  ExpressionToJavascriptExpression,
  GetAttributes,
  GetDatetimeValue,
  Operators,
  SdFormGenericExpressionCondition,
  TemplateToCondition,
} from './form-generic-expression.model';

function condition(
  operator: SdFormGenericExpressionCondition['operator'] | undefined,
  value: unknown,
  field = 'value'
): SdFormGenericExpressionCondition {
  return { key: `${operator}`, type: 'condition', field, operator: operator as never, value, dayInfo: {} };
}

describe('form generic expression model', () => {
  describe('date expressions', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 0, 15, 10, 30, 0));
    });

    afterEach(() => jasmine.clock().uninstall());

    it('formats now and relative-day tokens deterministically', () => {
      expect(GetDatetimeValue('now')).toBe('2026/01/15 10:30:00');
      expect(GetDatetimeValue('2LastDay')).toBe('2026/01/13 10:30:00');
      expect(GetDatetimeValue('2NextDay')).toBe('2026/01/17 10:30:00');
    });

    it('rejects empty, non-string, and malformed relative-day tokens', () => {
      expect(GetDatetimeValue('')).toBeUndefined();
      expect(GetDatetimeValue(10 as unknown as string)).toBeUndefined();
      expect(GetDatetimeValue('LastDay')).toBeUndefined();
      expect(GetDatetimeValue('tomorrow')).toBeUndefined();
    });

    it('formats relative-day selector defaults and explicit values', () => {
      expect(DayInfoPreviouses[0].format(0)).toBe('1LastDay');
      expect(DayInfoPreviouses[1].format(3)).toBe('3NextDay');
    });
  });

  it('exposes operator sets appropriate to each attribute type', () => {
    expect(Operators.map(item => item.value)).toEqual([
      'EQUAL',
      'NOT_EQUAL',
      'GREATER_THAN',
      'LESS_THAN',
      'GREATER_OR_EQUAL',
      'LESS_OR_EQUAL',
      'NULL',
      'NOT_NULL',
    ]);
    expect(AttributeOperators.boolean.map(item => item.value)).toEqual(['EQUAL', 'NOT_EQUAL']);
    expect(AttributeOperators.number).toBe(Operators);
  });

  it('maps nested form controls to expression attributes and ignores unsupported controls', () => {
    const attributes = GetAttributes([
      { type: 'textfield', key: 'name', label: 'Name' },
      { type: 'textarea', key: 'notes', label: 'Notes' },
      { type: 'number', key: 'amount', label: 'Amount' },
      { type: 'datetime', key: 'createdAt', label: 'Created at' },
      { type: 'checkbox', key: 'active', label: 'Active' },
      { type: 'radio', key: 'status', label: 'Status', values: [{ value: 'open', label: 'Open' }] },
      { type: 'select', key: 'owner', label: 'Owner', values: [] },
      {
        type: 'group',
        components: [{ type: 'textfield', key: 'nested.code', label: 'Code' }],
      },
      { type: 'html', key: 'help', label: 'Help' },
    ] as never[]);

    expect(attributes).toEqual([
      { value: 'name', display: 'Name', type: 'string' },
      { value: 'notes', display: 'Notes', type: 'string' },
      { value: 'amount', display: 'Amount', type: 'number' },
      { value: 'createdAt', display: 'Created at', type: 'datetime' },
      { value: 'active', display: 'Active', type: 'boolean', displayOnTrue: 'YES', displayOnFalse: 'NO' },
      { value: 'status', display: 'Status', type: 'values', values: [{ value: 'open', display: 'Open' }] },
      { value: 'owner', display: 'Owner', type: 'string' },
      { value: 'nested.code', display: 'Code', type: 'string' },
    ]);
    expect(GetAttributes([])).toEqual([]);
  });

  it('substitutes nested entity values while preserving missing placeholders as undefined', () => {
    const template = "${user.name} === 'Ada' && ${count} > 1 && ${missing} === undefined";

    expect(TemplateToCondition(template, { user: { name: 'Ada' }, count: 2 })).toBe("'Ada' === 'Ada' && 2 > 1 && undefined === undefined");
    expect(TemplateToCondition(undefined, {})).toBeUndefined();
  });

  it('normalizes ISO date strings during template substitution', () => {
    expect(TemplateToCondition('${createdAt}', { createdAt: '2026-01-15T03:30:00.000Z' })).toMatch(/^'2026\/01\/15 \d{2}:30:00'$/);
  });

  it('evaluates comparison, null, and nested-field conditions', () => {
    const entity = { value: 10, empty: '', nested: { code: 'A' } };

    expect(EvaluateExpression(condition('EQUAL', 10), entity)).toBeTrue();
    expect(EvaluateExpression(condition('NOT_EQUAL', 11), entity)).toBeTrue();
    expect(EvaluateExpression(condition('GREATER_THAN', 9), entity)).toBeTrue();
    expect(EvaluateExpression(condition('LESS_THAN', 11), entity)).toBeTrue();
    expect(EvaluateExpression(condition('GREATER_OR_EQUAL', 10), entity)).toBeTrue();
    expect(EvaluateExpression(condition('LESS_OR_EQUAL', 10), entity)).toBeTrue();
    expect(EvaluateExpression(condition('NULL', null, 'empty'), entity)).toBeTrue();
    expect(EvaluateExpression(condition('NOT_NULL', null, 'nested.code'), entity)).toBeTrue();
  });

  it('returns undefined for incomplete or unsupported conditions', () => {
    expect(EvaluateExpression(condition(undefined, 1), { value: 1 })).toBeUndefined();
    expect(EvaluateExpression(condition('EQUAL', ''), { value: '' })).toBeUndefined();
    expect(EvaluateExpression(condition('IN' as never, 1), { value: 1 })).toBeUndefined();
    expect(EvaluateExpression({ key: 'empty', type: 'combinator', combinator: '&&', conditions: [] }, { value: 1 })).toBeUndefined();
  });

  it('evaluates boolean combinators and propagates indeterminate children', () => {
    const equalsTen = condition('EQUAL', 10);
    const greaterThanTwenty = condition('GREATER_THAN', 20);

    expect(
      EvaluateExpression({ key: 'and', type: 'combinator', combinator: '&&', conditions: [equalsTen, greaterThanTwenty] }, { value: 10 })
    ).toBeFalse();
    expect(
      EvaluateExpression({ key: 'or', type: 'combinator', combinator: '||', conditions: [equalsTen, greaterThanTwenty] }, { value: 10 })
    ).toBeTrue();
    expect(
      EvaluateExpression(
        { key: 'invalid', type: 'combinator', combinator: '&&', conditions: [equalsTen, condition(undefined, 1)] },
        { value: 10 }
      )
    ).toBeUndefined();
  });

  it('serializes every comparison operator and null check to JavaScript syntax', () => {
    const cases: [SdFormGenericExpressionCondition['operator'] | undefined, unknown, string | undefined][] = [
      ['EQUAL', 'A', "${value} === 'A'"],
      ['NOT_EQUAL', 2, '${value} !== 2'],
      ['GREATER_THAN', 2, '${value} > 2'],
      ['LESS_THAN', 2, '${value} < 2'],
      ['GREATER_OR_EQUAL', 2, '${value} >= 2'],
      ['LESS_OR_EQUAL', 2, '${value} <= 2'],
      ['NULL', null, '!${value}'],
      ['NOT_NULL', null, '!!${value}'],
      [undefined, 2, undefined],
      ['EQUAL', '', undefined],
      ['IN' as never, 2, undefined],
    ];

    for (const [operator, value, expected] of cases) {
      expect(ExpressionToJavascriptExpression(condition(operator, value))).toBe(expected);
    }
  });

  it('serializes nested combinators with stable parentheses', () => {
    const left = condition('EQUAL', 1, 'left');
    const right = condition('EQUAL', 2, 'right');

    expect(ExpressionToJavascriptExpression({ key: 'single', type: 'combinator', combinator: '&&', conditions: [left] })).toBe(
      '(${left} === 1)'
    );
    expect(ExpressionToJavascriptExpression({ key: 'both', type: 'combinator', combinator: '&&', conditions: [left, right] })).toBe(
      '((${left} === 1) && (${right} === 2))'
    );
    expect(ExpressionToJavascriptExpression({ key: 'empty', type: 'combinator', combinator: '||', conditions: [] })).toBe('');
  });
});
