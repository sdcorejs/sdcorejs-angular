import { SdTableUrlStateContext, SdTableUrlState, parseTableQueryState, serializeTableQueryState } from './table-query-params.util';

const context = (overrides: Partial<SdTableUrlStateContext> = {}): SdTableUrlStateContext => ({
  defaults: {
    quickSearch: { term: '', filters: { region: null } },
    columnOperator: { name: 'CONTAIN', amount: 'EQUAL' },
    columnFilter: {},
    externalFilter: { status: 'ACTIVE' },
    pageSize: 20,
  },
  fields: {
    column: new Set(['name', 'amount', 'createdAt']),
    operator: new Map([
      ['name', new Set(['CONTAIN', 'START_WITH'])],
      ['amount', new Set(['EQUAL', 'GREATER_THAN'])],
    ]),
    external: new Set(['status', 'owner']),
    quickSearch: new Set(['region']),
    sort: new Set(['name', 'amount']),
  },
  pageSizes: [20, 50, 100],
  pageIndex: true,
  ...overrides,
});

const state = (overrides: Partial<SdTableUrlState> = {}): SdTableUrlState => ({
  quickSearch: { term: '', filters: { region: null } },
  columnOperator: { name: 'CONTAIN', amount: 'EQUAL' },
  columnFilter: {},
  externalFilter: { status: 'ACTIVE' },
  sort: { active: '', direction: '' },
  pageIndex: 0,
  pageSize: 20,
  ...overrides,
});

describe('table query params util', () => {
  it('serializes the default state to null', () => {
    expect(serializeTableQueryState(state(), context())).toBeNull();
    // Empty values equal the default: an emptied input does not dirty the URL.
    expect(serializeTableQueryState(state({ columnFilter: { name: '', amount: [] } }), context())).toBeNull();
  });

  it('writes only what differs from the default, with short keys in a fixed order', () => {
    const raw = serializeTableQueryState(
      state({
        quickSearch: { term: 'acme', filters: { region: 'north' } },
        columnFilter: { name: 'An', amount: { from: 10, to: null } },
        columnOperator: { name: 'START_WITH', amount: 'EQUAL' },
        externalFilter: { status: null, owner: 'me' },
        sort: { active: 'amount', direction: 'desc' },
        pageIndex: 2,
        pageSize: 50,
      }),
      context()
    );
    expect(raw).toBe(
      '{"q":{"t":"acme","f":{"region":"north"}},"c":{"amount":{"from":10,"to":null},"name":"An"},"o":{"name":"START_WITH"},"e":{"owner":"me","status":null},"s":["amount","desc"],"p":3,"z":50}'
    );
  });

  it('round-trips through parse, reviving dates', () => {
    const date = new Date('2026-01-02T03:04:05.000Z');
    const original = state({
      columnFilter: { createdAt: { from: date, to: null }, name: 'An' },
      externalFilter: { status: null, owner: 'me' },
      sort: { active: 'name', direction: 'asc' },
      pageIndex: 1,
      pageSize: 100,
    });
    const raw = serializeTableQueryState(original, context())!;
    const parsed = parseTableQueryState(raw, context())!;
    expect(parsed.columnFilter['createdAt']).toEqual({ from: date, to: null });
    expect((parsed.columnFilter['createdAt'] as { from: Date }).from instanceof Date).toBeTrue();
    expect(parsed.externalFilter).toEqual({ status: null, owner: 'me' });
    expect(parsed.columnOperator).toEqual({ name: 'CONTAIN', amount: 'EQUAL' });
    expect(parsed.sort).toEqual({ active: 'name', direction: 'asc' });
    expect(parsed.pageIndex).toBe(1);
    expect(parsed.pageSize).toBe(100);
    expect(serializeTableQueryState(parsed, context())).toBe(raw);
  });

  it('starts parsing from the defaults', () => {
    const parsed = parseTableQueryState('{"c":{"name":"An"}}', context())!;
    expect(parsed).toEqual(state({ columnFilter: { name: 'An' } }));
  });

  it('rejects malformed input', () => {
    expect(parseTableQueryState('not json', context())).toBeUndefined();
    expect(parseTableQueryState('[1,2]', context())).toBeUndefined();
    expect(parseTableQueryState('null', context())).toBeUndefined();
  });

  it('drops unknown fields, bad shapes, bad sort and bad paging', () => {
    const parsed = parseTableQueryState(
      JSON.stringify({
        q: { t: 5, f: { region: 'north', secret: 'x' } },
        c: { name: 'An', password: 'x', amount: { nested: { deep: 1 } } },
        o: { name: 'START_WITH', createdAt: 'EQUAL', amount: 7 },
        e: { owner: 'me', hack: 'x' },
        s: ['createdAt', 'asc'],
        p: -1,
        z: 33,
        x: 'ignored',
      }),
      context()
    )!;
    expect(parsed.quickSearch).toEqual({ term: '', filters: { region: 'north' } });
    expect(parsed.columnFilter).toEqual({ name: 'An' });
    expect(parsed.columnOperator).toEqual({ name: 'START_WITH', amount: 'EQUAL' });
    expect(parsed.externalFilter).toEqual({ status: 'ACTIVE', owner: 'me' });
    expect(parsed.sort).toEqual({ active: '', direction: '' });
    expect(parsed.pageIndex).toBe(0);
    expect(parsed.pageSize).toBe(20);
  });

  it('accepts only the operators listed for the column', () => {
    const parsed = parseTableQueryState('{"o":{"name":"EQUAL","amount":"GREATER_THAN"}}', context())!;
    expect(parsed.columnOperator).toEqual({ name: 'CONTAIN', amount: 'GREATER_THAN' });
  });

  it('never writes or reads the page index when the table has no total', () => {
    const noTotal = context({ pageIndex: false });
    expect(serializeTableQueryState(state({ pageIndex: 3, pageSize: 50 }), noTotal)).toBe('{"z":50}');
    expect(parseTableQueryState('{"p":4,"z":50}', noTotal)).toEqual(state({ pageSize: 50 }));
  });

  it('omits quick search when the table has none', () => {
    const plain = context({ defaults: { ...context().defaults, quickSearch: undefined } });
    expect(serializeTableQueryState(state({ quickSearch: undefined, pageSize: 50 }), plain)).toBe('{"z":50}');
    expect(parseTableQueryState('{"q":{"t":"x"}}', plain)!.quickSearch).toBeUndefined();
  });
});
