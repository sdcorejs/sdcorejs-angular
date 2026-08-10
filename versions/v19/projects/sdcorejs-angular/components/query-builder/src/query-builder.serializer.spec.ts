import { Filter } from '@sdcorejs/utils/models';
import { QB_TODAY, qbNewGroup, qbNewRule, QbToken, SdQueryBuilderField } from './query-builder.model';
import { I18N_MESSAGES } from '@sdcorejs/angular/i18n';
import { filterToTokens, filterToTree, treeToFilter } from './query-builder.serializer';

const FIELDS: SdQueryBuilderField[] = [
  { key: 'code', label: 'Mã', type: 'string' },
  { key: 'name', label: 'Tên', type: 'string' },
  { key: 'price', label: 'Giá', type: 'number' },
  { key: 'cost', label: 'Cost', type: 'number' },
  { key: 'amount', label: 'Amount', type: 'number' },
  { key: 'limit', label: 'Limit', type: 'number' },
  {
    key: 'status',
    label: 'Trạng thái',
    type: 'values',
    values: [
      { value: 'active', display: 'Hoạt động' },
      { value: 'inactive', display: 'Ngừng' },
    ],
  },
  { key: 'active', label: 'Kích hoạt', type: 'boolean', trueLabel: 'Có', falseLabel: 'Không' },
  { key: 'createdAt', label: 'Ngày tạo', type: 'date' },
];

/**
 * Translator dựng từ catalog `vi` thật.
 * why: serializer nay nhận hàm dịch từ ngoài (component truyền `I18nService.t`); spec dùng đúng
 * catalog đang ship để nhãn trong chuỗi view khớp với thứ người dùng thấy, thay vì hardcode lại.
 */
const t = (key: string, params?: Record<string, string | number>): string => {
  const raw = I18N_MESSAGES.vi[key] ?? key;
  return params ? raw.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m)) : raw;
};

/** Join token texts back into the rendered raw string. */
const render = (tokens: QbToken[]): string => tokens.map(t => t.text).join('');

describe('query-builder.serializer › treeToFilter', () => {
  it('returns null for an empty root group', () => {
    expect(treeToFilter(qbNewGroup('AND', []))).toBeNull();
  });

  it('wraps a single complete rule under a FilterAndOr root', () => {
    const tree = qbNewGroup('AND', [qbNewRule('code', 'EQUAL', 'ABC')]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'AND',
      data: [{ field: 'code', operator: 'EQUAL', data: 'ABC' }],
    } as any);
  });

  it('emits a nested FilterAndOr tree preserving group structure', () => {
    const tree = qbNewGroup('OR', [
      qbNewGroup('AND', [qbNewRule('code', 'EQUAL', 'ABC'), qbNewRule('name', 'CONTAIN', 'abc')]),
      qbNewRule('price', 'GREATER_THAN', 100),
    ]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'OR',
      data: [
        {
          operator: 'AND',
          data: [
            { field: 'code', operator: 'EQUAL', data: 'ABC' },
            { field: 'name', operator: 'CONTAIN', data: 'abc' },
          ],
        },
        { field: 'price', operator: 'GREATER_THAN', data: 100 },
      ],
    } as any);
  });

  it('maps BETWEEN to FilterBetween { from, to }', () => {
    const tree = qbNewGroup('AND', [qbNewRule('price', 'BETWEEN', { from: 10, to: 20 })]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'AND',
      data: [{ field: 'price', operator: 'BETWEEN', data: { from: 10, to: 20 } }],
    } as any);
  });

  it('keeps NULL / NOT_NULL as FilterNoData (no data key)', () => {
    const tree = qbNewGroup('AND', [qbNewRule('code', 'NULL')]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'AND',
      data: [{ field: 'code', operator: 'NULL' }],
    } as any);
  });

  it('drops incomplete rules (missing field / operator / value)', () => {
    const tree = qbNewGroup('AND', [
      qbNewRule('code', 'EQUAL', 'ABC'),
      qbNewRule(undefined, 'EQUAL', 'x'), // no field
      qbNewRule('name', undefined, 'y'), // no operator
      qbNewRule('price', 'EQUAL', ''), // empty value
    ]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'AND',
      data: [{ field: 'code', operator: 'EQUAL', data: 'ABC' }],
    } as any);
  });

  it('drops a BETWEEN rule that is missing an endpoint', () => {
    const tree = qbNewGroup('AND', [qbNewRule('price', 'BETWEEN', { from: 10, to: null })]);
    expect(treeToFilter(tree)).toBeNull();
  });

  it('drops an IN rule with an empty array', () => {
    const tree = qbNewGroup('AND', [qbNewRule('status', 'IN', [])]);
    expect(treeToFilter(tree)).toBeNull();
  });

  it('drops an empty nested group', () => {
    const tree = qbNewGroup('AND', [qbNewGroup('OR', []), qbNewRule('code', 'EQUAL', 'ABC')]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'AND',
      data: [{ field: 'code', operator: 'EQUAL', data: 'ABC' }],
    } as any);
  });

  it('emits a field-reference operand as dataType field', () => {
    const rule = qbNewRule('price', 'GREATER_THAN') as any;
    rule.valueSource = 'field';
    rule.compareField = 'cost';

    expect(treeToFilter(qbNewGroup('AND', [rule]))).toEqual({
      operator: 'AND',
      data: [{ field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' }],
    } as any);
  });

  it('drops an incomplete field-reference operand', () => {
    const rule = qbNewRule('price', 'GREATER_THAN') as any;
    rule.valueSource = 'field';

    expect(treeToFilter(qbNewGroup('AND', [rule]))).toBeNull();
  });
});

describe('query-builder.serializer › filterToTree (roundtrip)', () => {
  it('round-trips a nested filter without structural drift', () => {
    const tree = qbNewGroup('OR', [
      qbNewGroup('AND', [qbNewRule('code', 'EQUAL', 'ABC'), qbNewRule('name', 'CONTAIN', 'abc')]),
      qbNewRule('price', 'GREATER_THAN', 100),
    ]);
    const f1 = treeToFilter(tree);
    const f2 = treeToFilter(filterToTree(f1));
    expect(f2).toEqual(f1 as any);
  });

  it('wraps a bare (non-group) filter in an AND root', () => {
    const bare: Filter = { field: 'code', operator: 'EQUAL', data: 'ABC' } as any;
    const tree = filterToTree(bare);
    expect(tree.kind).toBe('group');
    expect(tree.logic).toBe('AND');
    expect(tree.children.length).toBe(1);
    expect(tree.children[0].kind).toBe('rule');
  });

  it('returns an empty AND group for null', () => {
    const tree = filterToTree(null);
    expect(tree.kind).toBe('group');
    expect(tree.children.length).toBe(0);
  });

  it('round-trips a field-reference operand without drift', () => {
    const seed: Filter = {
      operator: 'AND',
      data: [{ field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' }],
    } as any;

    const tree = filterToTree(seed);
    const rule = tree.children[0] as any;
    expect(rule.valueSource).toBe('field');
    expect(rule.compareField).toBe('cost');
    expect(treeToFilter(tree)).toEqual(seed as any);
  });
});

describe('query-builder.serializer › filterToTokens (SQL-ish, field = label)', () => {
  const str = (f: Filter): string => render(filterToTokens(f, FIELDS, t));

  it('returns no tokens for null', () => {
    expect(filterToTokens(null, FIELDS, t)).toEqual([]);
  });

  it('renders EQUAL with a quoted string and the field label', () => {
    expect(str({ field: 'code', operator: 'EQUAL', data: 'ABC' } as any)).toBe("Mã = 'ABC'");
  });

  it('renders CONTAIN as like %v%', () => {
    expect(str({ field: 'name', operator: 'CONTAIN', data: 'abc' } as any)).toBe("Tên like '%abc%'");
  });

  it('renders NOT_CONTAIN / START_WITH / END_WITH', () => {
    expect(str({ field: 'name', operator: 'NOT_CONTAIN', data: 'abc' } as any)).toBe("Tên not like '%abc%'");
    expect(str({ field: 'name', operator: 'START_WITH', data: 'abc' } as any)).toBe("Tên like 'abc%'");
    expect(str({ field: 'name', operator: 'END_WITH', data: 'abc' } as any)).toBe("Tên like '%abc'");
  });

  it('renders numeric comparison unquoted', () => {
    expect(str({ field: 'price', operator: 'GREATER_THAN', data: 100 } as any)).toBe('Giá > 100');
    expect(str({ field: 'price', operator: 'NOT_EQUAL', data: 100 } as any)).toBe('Giá != 100');
  });

  it('renders BETWEEN as between a and b', () => {
    expect(str({ field: 'price', operator: 'BETWEEN', data: { from: 10, to: 20 } } as any)).toBe('Giá between 10 and 20');
  });

  it('renders NULL / NOT_NULL with no value', () => {
    expect(str({ field: 'code', operator: 'NULL' } as any)).toBe('Mã is null');
    expect(str({ field: 'code', operator: 'NOT_NULL' } as any)).toBe('Mã is not null');
  });

  it('renders IN with display labels of a values field', () => {
    expect(str({ field: 'status', operator: 'IN', data: ['active', 'inactive'] } as any)).toBe("Trạng thái in ('Hoạt động', 'Ngừng')");
  });

  it('renders a boolean value using its label, unquoted', () => {
    expect(str({ field: 'active', operator: 'EQUAL', data: true } as any)).toBe('Kích hoạt = Có');
    expect(str({ field: 'active', operator: 'EQUAL', data: false } as any)).toBe('Kích hoạt = Không');
  });

  it('escapes single quotes by doubling them', () => {
    expect(str({ field: 'code', operator: 'EQUAL', data: "O'Brien" } as any)).toBe("Mã = 'O''Brien'");
  });

  it('falls back to the raw key when no field matches', () => {
    expect(str({ field: 'unknown', operator: 'EQUAL', data: 1 } as any)).toBe('unknown = 1');
  });

  it('renders a nested group with parentheses and lowercase and/or', () => {
    const f: Filter = {
      operator: 'OR',
      data: [
        {
          operator: 'AND',
          data: [
            { field: 'code', operator: 'EQUAL', data: 'ABC' },
            { field: 'name', operator: 'CONTAIN', data: 'abc' },
          ],
        },
        { field: 'price', operator: 'GREATER_THAN', data: 100 },
      ],
    } as any;
    expect(str(f)).toBe("(Mã = 'ABC' and Tên like '%abc%') or Giá > 100");
  });

  it('tags operator and value tokens with distinct kinds for highlighting', () => {
    const tokens = filterToTokens({ field: 'code', operator: 'EQUAL', data: 'ABC' } as any, FIELDS, t);
    expect(tokens.some(t => t.kind === 'field' && t.text === 'Mã')).toBe(true);
    expect(tokens.some(t => t.kind === 'op' && t.text === '=')).toBe(true);
    expect(tokens.some(t => t.kind === 'value' && t.text === "'ABC'")).toBe(true);
  });

  it('renders a field-reference operand as a field label', () => {
    expect(str({ field: 'amount', operator: 'LESS_OR_EQUAL', dataType: 'field', data: 'limit' } as any)).toBe('Amount <= Limit');
  });
});

describe('query-builder.serializer › relative dates', () => {
  const str = (f: Filter): string => render(filterToTokens(f, FIELDS, t));

  it('emits a date-today value', () => {
    const tree = qbNewGroup('AND', [qbNewRule('createdAt', 'GREATER_THAN', QB_TODAY)]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'AND',
      data: [{ field: 'createdAt', operator: 'GREATER_THAN', dataType: 'date-today', data: 'TODAY' }],
    } as any);
  });

  it('emits a complete date-relative offset value', () => {
    const tree = qbNewGroup('AND', [qbNewRule('createdAt', 'LESS_THAN', { amount: 3, direction: 'previous', unit: 'day' })]);
    expect(treeToFilter(tree)).toEqual({
      operator: 'AND',
      data: [
        { field: 'createdAt', operator: 'LESS_THAN', dataType: 'date-relative', data: { amount: 3, direction: 'previous', unit: 'day' } },
      ],
    } as any);
  });

  it('drops an incomplete offset (missing amount / unit / direction)', () => {
    expect(treeToFilter(qbNewGroup('AND', [qbNewRule('createdAt', 'LESS_THAN', { unit: 'day' } as any)]))).toBeNull();
    expect(treeToFilter(qbNewGroup('AND', [qbNewRule('createdAt', 'LESS_THAN', { amount: 2, direction: 'next' } as any)]))).toBeNull();
    expect(
      treeToFilter(qbNewGroup('AND', [qbNewRule('createdAt', 'LESS_THAN', { amount: 0, direction: 'next', unit: 'day' } as any)]))
    ).toBeNull();
  });

  it('round-trips a date-relative offset value without drift', () => {
    const f1 = treeToFilter(qbNewGroup('AND', [qbNewRule('createdAt', 'GREATER_THAN', { amount: 2, direction: 'next', unit: 'month' })]));
    const f2 = treeToFilter(filterToTree(f1));
    expect(f2).toEqual(f1 as any);
  });

  it('round-trips a date-today value without drift', () => {
    const f1 = treeToFilter(qbNewGroup('AND', [qbNewRule('createdAt', 'EQUAL', QB_TODAY)]));
    const f2 = treeToFilter(filterToTree(f1));
    expect(f2).toEqual(f1 as any);
  });

  it('renders date-today / date-relative values through the injected translator', () => {
    expect(str({ field: 'createdAt', operator: 'GREATER_THAN', dataType: 'date-today', data: 'TODAY' } as any)).toBe('Ngày tạo > Hôm nay');
    expect(
      str({
        field: 'createdAt',
        operator: 'LESS_THAN',
        dataType: 'date-relative',
        data: { amount: 3, direction: 'previous', unit: 'day' },
      } as any)
    ).toBe('Ngày tạo < 3 ngày trước');
    expect(
      str({
        field: 'createdAt',
        operator: 'EQUAL',
        dataType: 'date-relative',
        data: { amount: 1, direction: 'next', unit: 'month' },
      } as any)
    ).toBe('Ngày tạo = 1 tháng tới');
  });

  it('renders the same value tokens in another language when handed another translator', () => {
    // why: chốt rằng chuỗi view KHÔNG còn khoá cứng tiếng Việt — đổi translator là đổi ngôn ngữ.
    const en = (key: string, params?: Record<string, string | number>): string => {
      const raw = I18N_MESSAGES.en[key] ?? key;
      return params ? raw.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m)) : raw;
    };
    const filter = {
      field: 'createdAt',
      operator: 'LESS_THAN',
      dataType: 'date-relative',
      data: { amount: 3, direction: 'previous', unit: 'day' },
    } as any;
    expect(render(filterToTokens(filter, FIELDS, en))).toBe('Ngày tạo < 3 days ago');
    expect(render(filterToTokens({ field: 'active', operator: 'EQUAL', data: true } as any, FIELDS, en))).toBe('Kích hoạt = Có');
  });

  it('falls back to raw i18n keys when called without a translator (pure-function use)', () => {
    // why: `filterToTokens` vẫn phải gọi được ngoài Angular; khi đó nó trả key để việc thiếu bản
    // dịch lộ ra ngay thay vì im lặng in ra tiếng Việt.
    expect(render(filterToTokens({ field: 'createdAt', operator: 'EQUAL', dataType: 'date-today', data: 'TODAY' } as any, FIELDS))).toBe(
      'Ngày tạo = core.component.query-builder.date-mode.now'
    );
  });

  it('back-compat: seeds legacy { rel } payloads and re-emits the new dataType shape', () => {
    const legacyNow: Filter = {
      operator: 'AND',
      data: [{ field: 'createdAt', operator: 'EQUAL', data: { rel: 'now' } }],
    } as any;
    expect(treeToFilter(filterToTree(legacyNow))).toEqual({
      operator: 'AND',
      data: [{ field: 'createdAt', operator: 'EQUAL', dataType: 'date-today', data: 'TODAY' }],
    } as any);

    const legacyOffset: Filter = {
      operator: 'AND',
      data: [{ field: 'createdAt', operator: 'LESS_THAN', data: { rel: 'offset', unit: 'week', amount: 2, direction: 'previous' } }],
    } as any;
    expect(treeToFilter(filterToTree(legacyOffset))).toEqual({
      operator: 'AND',
      data: [
        { field: 'createdAt', operator: 'LESS_THAN', dataType: 'date-relative', data: { amount: 2, direction: 'previous', unit: 'week' } },
      ],
    } as any);
  });
});
