import type { SdTableOption } from './table-option.model';
import type { SdTableMobileCardData, SdTableMobileTemplate } from './table-mobile.model';

interface Order {
  code: string;
  total: number;
  locked: boolean;
  customer: { name: string };
}

const columns: SdTableOption<Order>['columns'] = [{ field: 'code', type: 'string', title: 'Code' }];

/**
 * Build-time checks of `mobile.template` (handoff table-mobile 9.3). Each `@ts-expect-error` fails the Karma build
 * when the line stops being an error, so a regression in the types breaks the suite.
 */
describe('SdTableMobileTemplate types', () => {
  it('accepts fields, nested fields, fixed text and a fixed badge', () => {
    const orderCard = (row: Order): SdTableMobileCardData<Order> => ({
      title: 'code',
      subtitle: { text: row.customer.name },
      badge: row.locked ? { title: 'Locked', color: 'error' } : 'code',
      highlight: 'total',
      fields: ['customer.name', 'total'],
      maxFields: 2,
    });
    const inline: SdTableMobileTemplate<Order> = { layout: 'card', data: row => ({ title: 'customer.name', badge: 'code' }) };
    const option: SdTableOption<Order> = {
      type: 'local',
      items: () => [],
      columns,
      mobile: { rowLabel: row => row.code, template: { data: orderCard } },
    };
    const off: SdTableOption<Order> = { type: 'local', items: () => [], columns, mobile: { template: false } };
    expect([inline, option, off].length).toBe(3);
  });

  it('rejects an unknown field, a slot of another layout and an unknown layout', () => {
    const unknownField: SdTableMobileTemplate<Order> = {
      // @ts-expect-error 'cod' is not a NestedKeyOf<Order>
      data: () => ({ title: 'cod' }),
    };
    const listSlot: SdTableMobileTemplate<Order> = {
      // @ts-expect-error a card has no `trailing`
      data: () => ({ title: 'code', trailing: 'x' }),
    };
    const listLayout: SdTableMobileTemplate<Order> = {
      // @ts-expect-error `list` is not a layout yet
      layout: 'list',
      data: () => ({ title: 'code' }),
    };
    expect([unknownField, listSlot, listLayout].length).toBe(3);
  });
});
