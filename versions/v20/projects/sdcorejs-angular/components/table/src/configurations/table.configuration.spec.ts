import { OPERATORS } from '@sdcorejs/utils/constants';
import { Operator } from '@sdcorejs/utils/models';
import { DEFAULT_TABLE_CONFIG, ISdTableConfiguration, resolveTableColumnOperators, resolveTableConfiguration } from './table.configuration';

// Operator theo type của cột: danh sách của cột → cấu hình của ứng dụng → bộ mặc định của thư viện.

describe('table.configuration › default column operators', () => {
  const builtIn = DEFAULT_TABLE_CONFIG.filter!.operator!;

  describe('DEFAULT_TABLE_CONFIG', () => {
    it('ships a list for string and number only', () => {
      expect(Object.keys(builtIn.list!).sort()).toEqual(['number', 'string']);
    });

    it('lists the operators the table honours for a string column, then NULL / NOT_NULL', () => {
      expect(builtIn.list!.string).toEqual(['CONTAIN', 'NOT_CONTAIN', 'EQUAL', 'NOT_EQUAL', 'START_WITH', 'END_WITH', 'NULL', 'NOT_NULL']);
    });

    it('lists the operators the table honours for a number column, then NULL / NOT_NULL', () => {
      expect(builtIn.list!.number).toEqual([
        'EQUAL',
        'NOT_EQUAL',
        'GREATER_THAN',
        'GREATER_OR_EQUAL',
        'LESS_THAN',
        'LESS_OR_EQUAL',
        'NULL',
        'NOT_NULL',
      ]);
    });

    it('uses only operators that exist in OPERATORS, without duplicates', () => {
      const known = new Set<string>(OPERATORS.map(entry => entry.value));
      for (const list of Object.values(builtIn.list!)) {
        expect(list!.every(operator => known.has(operator))).toBeTrue();
        expect(new Set(list).size).toBe(list!.length);
      }
    });

    it('preselects an operator that is in its own list', () => {
      expect(builtIn.default).toEqual({ string: 'CONTAIN', number: 'EQUAL' });
      expect(builtIn.list!.string).toContain(builtIn.default!.string!);
      expect(builtIn.list!.number).toContain(builtIn.default!.number!);
    });
  });

  describe('resolveTableColumnOperators', () => {
    it('falls back to the built-in list and default without an application configuration', () => {
      for (const configuration of [undefined, null, {}, { filter: {} }, { filter: { operator: {} } }] as (
        | ISdTableConfiguration
        | null
        | undefined
      )[]) {
        expect(resolveTableColumnOperators('string', configuration)).toEqual({ list: builtIn.list!.string!, default: 'CONTAIN' });
        expect(resolveTableColumnOperators('number', configuration)).toEqual({ list: builtIn.list!.number!, default: 'EQUAL' });
      }
    });

    for (const type of ['boolean', 'date', 'datetime', 'time', 'values', 'lazy-values', 'children'] as const) {
      it(`has no built-in operators for ${type}`, () => {
        expect(resolveTableColumnOperators(type)).toEqual({ list: [], default: undefined });
      });
    }

    it('returns a copy, so a column cannot change the built-in list', () => {
      const first = resolveTableColumnOperators('string');
      first.list.push('IN');

      expect(resolveTableColumnOperators('string').list).toEqual(builtIn.list!.string!);
      expect(first.list).not.toBe(builtIn.list!.string!);
    });

    it('lets the application replace the list of one type and keeps the built-in list of the others', () => {
      const configuration: ISdTableConfiguration = { filter: { operator: { list: { string: ['EQUAL', 'CONTAIN'] } } } };

      expect(resolveTableColumnOperators('string', configuration).list).toEqual(['EQUAL', 'CONTAIN']);
      expect(resolveTableColumnOperators('number', configuration).list).toEqual(builtIn.list!.number!);
    });

    it('reads an empty application list as "no operators for this type"', () => {
      const configuration: ISdTableConfiguration = { filter: { operator: { list: { number: [] } } } };

      expect(resolveTableColumnOperators('number', configuration)).toEqual({ list: [], default: undefined });
    });

    it('lets the application add a list for a type that has none built in', () => {
      const configuration: ISdTableConfiguration = {
        filter: { operator: { list: { values: ['IN', 'NOT_IN'] }, default: { values: 'IN' } } },
      };

      expect(resolveTableColumnOperators('values', configuration)).toEqual({ list: ['IN', 'NOT_IN'], default: 'IN' });
    });

    it('prefers the application default over the built-in one', () => {
      const configuration: ISdTableConfiguration = { filter: { operator: { default: { string: 'EQUAL' } } } };

      expect(resolveTableColumnOperators('string', configuration).default).toBe('EQUAL');
      expect(resolveTableColumnOperators('number', configuration).default).toBe('EQUAL');
    });

    // The built-in default belongs to the built-in list: a list declared by the application keeps the old behaviour.
    it('preselects nothing for an application list without an application default', () => {
      for (const list of [
        ['EQUAL', 'START_WITH'],
        ['CONTAIN', 'EQUAL'],
      ] as Operator[][]) {
        const configuration: ISdTableConfiguration = { filter: { operator: { list: { string: list } } } };

        expect(resolveTableColumnOperators('string', configuration)).toEqual({ list, default: undefined });
      }
    });

    it('keeps an application default even when it is outside the list, as before', () => {
      const configuration: ISdTableConfiguration = {
        filter: { operator: { list: { string: ['EQUAL'] }, default: { string: 'CONTAIN' } } },
      };

      expect(resolveTableColumnOperators('string', configuration).default).toBe('CONTAIN');
    });

    describe('column list', () => {
      const own: Operator[] = ['START_WITH', 'END_WITH'];

      it('wins over the application and the built-in list', () => {
        const configuration: ISdTableConfiguration = { filter: { operator: { list: { string: ['EQUAL'] } } } };

        expect(resolveTableColumnOperators('string', configuration, own).list).toEqual(own);
        expect(resolveTableColumnOperators('string', undefined, own).list).toEqual(own);
      });

      it('is copied', () => {
        expect(resolveTableColumnOperators('string', undefined, own).list).not.toBe(own);
      });

      it('falls back to the type list when it is empty or missing', () => {
        for (const columnList of [[], null, undefined]) {
          expect(resolveTableColumnOperators('string', undefined, columnList).list).toEqual(builtIn.list!.string!);
        }
      });

      it('preselects nothing from the built-in default, whatever the column offers', () => {
        expect(resolveTableColumnOperators('string', undefined, own).default).toBeUndefined();
        expect(resolveTableColumnOperators('string', undefined, ['EQUAL', 'CONTAIN']).default).toBeUndefined();
      });

      it('still takes the application default of its type', () => {
        const configuration: ISdTableConfiguration = { filter: { operator: { default: { string: 'EQUAL' } } } };

        expect(resolveTableColumnOperators('string', configuration, own).default).toBe('EQUAL');
      });
    });
  });
});

// Portal có nhiều module, mỗi module một backend: SD_TABLE_CONFIGURATION nhận nhiều cấu hình, bảng chọn theo key.

describe('table.configuration › configuration by key', () => {
  const portal: ISdTableConfiguration = {
    paginate: { pageSize: 50, pages: [50, 100] },
    filter: { manualFilter: true, operator: { list: { string: ['CONTAIN', 'EQUAL'], number: ['EQUAL'] }, default: { string: 'CONTAIN' } } },
    images: { dataEmpty: 'portal-empty.svg', filterEmpty: 'portal-filter.svg' },
  };
  const sales: ISdTableConfiguration = {
    key: 'sales',
    paginate: { pageSize: 10 },
    filter: { operator: { list: { string: ['EQUAL'] }, default: { number: 'EQUAL' } } },
    images: { dataEmpty: 'sales-empty.svg' },
  };
  const stock: ISdTableConfiguration = { key: 'stock', filter: { operator: { list: { number: [] } } } };

  describe('a single configuration (as before)', () => {
    it('returns nothing when no configuration is provided', () => {
      for (const source of [undefined, null, []]) {
        expect(resolveTableConfiguration(source)).toBeNull();
        expect(resolveTableConfiguration(source, 'sales')).toBeNull();
      }
    });

    it('returns the same object, with or without a table key', () => {
      expect(resolveTableConfiguration(portal)).toBe(portal);
      expect(resolveTableConfiguration(portal, 'sales')).toBe(portal);
      expect(resolveTableConfiguration([portal])).toBe(portal);
    });

    it('ignores empty entries of a multi provider', () => {
      expect(resolveTableConfiguration([null, portal, undefined] as unknown as ISdTableConfiguration[])).toBe(portal);
    });
  });

  describe('several configurations', () => {
    const all = [portal, sales, stock];

    it('gives a table without a key the portal configuration', () => {
      expect(resolveTableConfiguration(all)).toBe(portal);
      expect(resolveTableConfiguration(all, null)).toBe(portal);
    });

    it('falls back to the portal configuration for a key nobody declared', () => {
      expect(resolveTableConfiguration(all, 'unknown')).toBe(portal);
    });

    it('lays the keyed configuration over the portal one, field by field', () => {
      const resolved = resolveTableConfiguration(all, 'sales')!;

      expect(resolved.key).toBe('sales');
      expect(resolved.paginate).toEqual({ pageSize: 10, pages: [50, 100] });
      expect(resolved.filter!.manualFilter).toBeTrue();
      expect(resolved.images).toEqual({ dataEmpty: 'sales-empty.svg', filterEmpty: 'portal-filter.svg' });
    });

    it('replaces the operator list of a type as a whole and keeps the other types', () => {
      const resolved = resolveTableConfiguration(all, 'sales')!;

      expect(resolved.filter!.operator!.list).toEqual({ string: ['EQUAL'], number: ['EQUAL'] });
      expect(resolved.filter!.operator!.default).toEqual({ string: 'CONTAIN', number: 'EQUAL' });
      expect(resolveTableColumnOperators('string', resolved)).toEqual({ list: ['EQUAL'], default: 'CONTAIN' });
    });

    it('lets a module switch the operators of a type off', () => {
      const resolved = resolveTableConfiguration(all, 'stock');

      expect(resolveTableColumnOperators('number', resolved).list).toEqual([]);
      expect(resolveTableColumnOperators('string', resolved).list).toEqual(['CONTAIN', 'EQUAL']);
    });

    it('does not let an undefined field of the module erase the portal value', () => {
      const resolved = resolveTableConfiguration([portal, { key: 'hr', paginate: { pageSize: undefined }, images: undefined }], 'hr')!;

      expect(resolved.paginate).toEqual({ pageSize: 50, pages: [50, 100] });
      expect(resolved.images).toEqual(portal.images);
    });

    it('leaves the declared configurations untouched', () => {
      const before = JSON.stringify(all);
      const resolved = resolveTableConfiguration(all, 'sales')!;

      expect(resolved).not.toBe(sales);
      expect(resolved).not.toBe(portal);
      expect(JSON.stringify(all)).toBe(before);
    });

    it('uses the keyed configuration alone when the portal declares no default', () => {
      expect(resolveTableConfiguration([sales, stock], 'sales')).toBe(sales);
      expect(resolveTableConfiguration([sales, stock])).toBeNull();
      expect(resolveTableConfiguration([sales, stock], 'unknown')).toBeNull();
    });

    it('is independent of the declaration order', () => {
      expect(resolveTableConfiguration([stock, sales, portal], 'sales')).toEqual(resolveTableConfiguration(all, 'sales'));
    });
  });

  describe('duplicate keys', () => {
    it('throws for two configurations with the same key', () => {
      expect(() => resolveTableConfiguration([portal, sales, { key: 'sales' }], 'stock')).toThrowError(
        '[sd-table] Duplicate table configuration key: sales'
      );
    });

    it('throws for two portal configurations', () => {
      expect(() => resolveTableConfiguration([portal, {}])).toThrowError('[sd-table] Duplicate table configuration key: undefined');
    });
  });
});
