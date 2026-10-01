import type { Filter } from '@sdcorejs/utils/models';
import type { SdFormGenericSchema } from '../models/form-generic-schema.model';
import { sdElementState, sdEvaluateFilter, sdFilterFieldTypes, sdFormScope, sdIsEmptyFilter } from './form-generic-filter';

const isoDaysAgo = (days: number) => {
  const date = new Date(2026, 8, 30, 10, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

describe('form generic filter evaluation', () => {
  beforeEach(() =>
    jasmine
      .clock()
      .install()
      .mockDate(new Date(2026, 8, 30, 10, 0, 0))
  );
  afterEach(() => jasmine.clock().uninstall());

  describe('operators produced by sd-query-builder', () => {
    const scope = { name: 'Nguyen Van A', age: 30, agree: true, city: 'HCM', tags: ['a', 'b'], empty: '', none: null, cost: 20, price: 25 };
    const cases: [string, Filter, boolean][] = [
      ['EQUAL string', { field: 'city', operator: 'EQUAL', data: 'HCM' }, true],
      ['EQUAL boolean', { field: 'agree', operator: 'EQUAL', data: true }, true],
      ['NOT_EQUAL', { field: 'city', operator: 'NOT_EQUAL', data: 'HN' }, true],
      ['CONTAIN', { field: 'name', operator: 'CONTAIN', data: 'Van' }, true],
      ['NOT_CONTAIN', { field: 'name', operator: 'NOT_CONTAIN', data: 'Tran' }, true],
      ['START_WITH', { field: 'name', operator: 'START_WITH', data: 'Nguyen' }, true],
      ['END_WITH', { field: 'name', operator: 'END_WITH', data: ' A' }, true],
      ['IN', { field: 'city', operator: 'IN', data: ['HN', 'HCM'] }, true],
      ['NOT_IN', { field: 'city', operator: 'NOT_IN', data: ['HN', 'DN'] }, true],
      ['IN on a multiple value', { field: 'tags', operator: 'IN', data: ['b', 'c'] }, true],
      ['NOT_IN on a multiple value', { field: 'tags', operator: 'NOT_IN', data: ['c'] }, true],
      ['GREATER_THAN', { field: 'age', operator: 'GREATER_THAN', data: 18 }, true],
      ['LESS_THAN', { field: 'age', operator: 'LESS_THAN', data: 18 }, false],
      ['GREATER_OR_EQUAL', { field: 'age', operator: 'GREATER_OR_EQUAL', data: 30 }, true],
      ['LESS_OR_EQUAL', { field: 'age', operator: 'LESS_OR_EQUAL', data: 29 }, false],
      ['BETWEEN', { field: 'age', operator: 'BETWEEN', data: { from: 18, to: 60 } }, true],
      ['NULL on an empty string', { field: 'empty', operator: 'NULL' }, true],
      ['NULL on null', { field: 'none', operator: 'NULL' }, true],
      ['NULL on a missing key', { field: 'missing', operator: 'NULL' }, true],
      ['NOT_NULL', { field: 'city', operator: 'NOT_NULL' }, true],
      ['NOT_NULL on an empty string', { field: 'empty', operator: 'NOT_NULL' }, false],
      ['field compared with another field', { field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' }, true],
      [
        'AND',
        {
          operator: 'AND',
          data: [
            { field: 'agree', operator: 'EQUAL', data: true },
            { field: 'age', operator: 'GREATER_THAN', data: 40 },
          ],
        },
        false,
      ],
      [
        'nested OR',
        {
          operator: 'OR',
          data: [
            { field: 'age', operator: 'GREATER_THAN', data: 40 },
            { operator: 'AND', data: [{ field: 'city', operator: 'EQUAL', data: 'HCM' }] },
          ],
        },
        true,
      ],
    ];
    for (const [label, filter, expected] of cases) {
      it(`${label} → ${expected}`, () => expect(sdEvaluateFilter(filter, scope)).toBe(expected));
    }

    it('supports today and relative dates on datetime fields', () => {
      const schema = {
        pages: [{ id: 'p', elements: [{ id: 'd', key: 'joined', type: 'datetime', label: 'Joined' }] }],
      } as SdFormGenericSchema;
      const fieldTypes = sdFilterFieldTypes(schema);
      const threeDaysAgo: Filter = {
        field: 'joined',
        operator: 'GREATER_OR_EQUAL',
        dataType: 'date-relative',
        data: { amount: 3, direction: 'previous', unit: 'day' },
      };
      expect(sdEvaluateFilter(threeDaysAgo, { joined: isoDaysAgo(2) }, fieldTypes)).toBeTrue();
      expect(sdEvaluateFilter(threeDaysAgo, { joined: isoDaysAgo(5) }, fieldTypes)).toBeFalse();
      const beforeToday: Filter = { field: 'joined', operator: 'LESS_THAN', dataType: 'date-today', data: 'TODAY' };
      expect(sdEvaluateFilter(beforeToday, { joined: isoDaysAgo(1) }, fieldTypes)).toBeTrue();
    });
  });

  describe('sdFormScope', () => {
    it('evaluates on value merged with variables', () => {
      expect(sdFormScope({ a: 1 }, { tenant: 'x' })).toEqual({ a: 1, tenant: 'x' });
      expect(sdFormScope(undefined, undefined)).toEqual({});
    });
  });

  describe('sdElementState', () => {
    const element = {
      hidden: false,
      disabled: false,
      validation: { required: false },
      rules: {
        visible: { field: 'agree', operator: 'EQUAL', data: true } as Filter,
        required: { field: 'contact', operator: 'EQUAL', data: 'email' } as Filter,
        disabled: { field: 'locked', operator: 'EQUAL', data: true } as Filter,
      },
    };

    it('follows value and variables', () => {
      expect(sdElementState(element, sdFormScope({ agree: false }, {}))).toEqual({ visible: false, disabled: false, required: false });
      expect(sdElementState(element, sdFormScope({ agree: true, contact: 'email' }, { locked: true }))).toEqual({
        visible: true,
        disabled: true,
        required: true,
      });
    });

    it('treats a missing rule as not restricting and ORs static flags', () => {
      expect(sdElementState({}, {})).toEqual({ visible: true, disabled: false, required: false });
      expect(sdElementState({ disabled: true, validation: { required: true } }, {})).toEqual({
        visible: true,
        disabled: true,
        required: true,
      });
    });

    it('hides when the hidden rule matches or the static hidden flag is on', () => {
      const hiddenRule = { rules: { hidden: { field: 'type', operator: 'EQUAL', data: 'b' } as Filter } };
      expect(sdElementState(hiddenRule, { type: 'b' }).visible).toBeFalse();
      expect(sdElementState(hiddenRule, { type: 'a' }).visible).toBeTrue();
      expect(sdElementState({ hidden: true }, {}).visible).toBeFalse();
    });
  });

  describe('groups without conditions', () => {
    it('treats a rule or a sub-group without conditions as no condition', () => {
      const empty = { operator: 'AND', data: [] } as Filter;
      expect(sdElementState({ rules: { hidden: empty, required: empty, disabled: empty, visible: empty } }, {})).toEqual({
        visible: true,
        disabled: false,
        required: false,
      });
      const withEmptyBranch = { operator: 'OR', data: [empty, { field: 'a', operator: 'EQUAL', data: 1 }] } as Filter;
      expect(sdEvaluateFilter(withEmptyBranch, { a: 2 })).toBeFalse();
      expect(sdEvaluateFilter(withEmptyBranch, { a: 1 })).toBeTrue();
    });
  });

  describe('multiple values and checkboxes', () => {
    it('reads EQUAL / NOT_EQUAL on a multiple value as "one selected item equals" / "none equals"', () => {
      const scope = { tags: ['a', 'b'] };
      expect(sdEvaluateFilter({ field: 'tags', operator: 'EQUAL', data: 'b' }, scope)).toBeTrue();
      expect(sdEvaluateFilter({ field: 'tags', operator: 'EQUAL', data: 'c' }, scope)).toBeFalse();
      expect(sdEvaluateFilter({ field: 'tags', operator: 'NOT_EQUAL', data: 'c' }, scope)).toBeTrue();
      expect(sdEvaluateFilter({ field: 'tags', operator: 'NOT_EQUAL', data: 'a' }, scope)).toBeFalse();
    });

    it('treats a checkbox without a value as unticked', () => {
      const types = { agree: 'boolean' } as const;
      expect(sdEvaluateFilter({ field: 'agree', operator: 'EQUAL', data: false }, {}, types)).toBeTrue();
      expect(sdEvaluateFilter({ field: 'agree', operator: 'EQUAL', data: true }, { agree: null }, types)).toBeFalse();
      expect(sdEvaluateFilter({ field: 'agree', operator: 'EQUAL', data: true }, { agree: true }, types)).toBeTrue();
    });
  });

  describe('malformed input (hand-edited JSON)', () => {
    it('treats null children as absent and never matches a leaf without a field', () => {
      const withNull = { operator: 'AND', data: [null, { field: 'a', operator: 'EQUAL', data: 1 }] } as unknown as Filter;
      expect(() => sdEvaluateFilter(withNull, { a: 1 })).not.toThrow();
      expect(sdEvaluateFilter(withNull, { a: 1 })).toBeTrue();
      expect(sdEvaluateFilter({ operator: 'EQUAL', data: 1 } as unknown as Filter, { a: 1 })).toBeFalse();
      expect(sdEvaluateFilter(null as unknown as Filter, { a: 1 })).toBeFalse();
    });

    it('knows an empty filter: absent, or groups whose children are all empty', () => {
      expect(sdIsEmptyFilter(undefined)).toBeTrue();
      expect(sdIsEmptyFilter({ operator: 'AND', data: [] })).toBeTrue();
      expect(sdIsEmptyFilter({ operator: 'OR', data: [{ operator: 'AND', data: [] }] })).toBeTrue();
      expect(sdIsEmptyFilter({ operator: 'OR', data: [{ field: 'a', operator: 'NULL' } as Filter] })).toBeFalse();
      expect(sdIsEmptyFilter({ field: 'a', operator: 'NOT_NULL' } as Filter)).toBeFalse();
    });
  });
});
