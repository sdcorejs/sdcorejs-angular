import { HttpParams } from '@angular/common/http';
import type { PagingRes } from '@sdcorejs/utils/models';
import type {
  CustomerActivityDto,
  CustomerDebtDto,
  CustomerDocumentDto,
  CustomerDto,
  CustomerOrderDto,
  CustomerSummaryDto,
} from '../../../features/customer/services/customer.model';
import { PatternMockError } from '../mock-api.model';
import { PatternMockBackend } from '../mock-backend';
import { PATTERN_MOCK_RESOURCES } from './index';

describe('customer profile mock API', () => {
  let api: PatternMockBackend;
  beforeEach(() => (api = new PatternMockBackend(PATTERN_MOCK_RESOURCES, 'none')));

  function get<T>(path: string, params: Record<string, string> = {}): T {
    return api.handle('GET', path.split('/'), new HttpParams({ fromObject: params }), null).body as T;
  }

  it('preserves the original catalogue sizes, order workflow examples and document-empty profile', () => {
    expect(get<PagingRes<CustomerDto>>('customers', { pageSize: '100' }).items.filter(row => row.type === 'business').length).toBe(8);
    expect(get<PagingRes<CustomerOrderDto>>('orders').total).toBe(128);
    expect(get('orders/2400')).toEqual(jasmine.objectContaining({ customer: 'Phạm Dũng', status: 'pending' }));
    expect(get('orders/2399')).toEqual(jasmine.objectContaining({ status: 'shipping' }));
    expect(get('customers/3/documents')).toEqual({ items: [], total: 0 });
  });

  it('summarizes all related records and returns only the most recent orders requested', () => {
    const summary = get<CustomerSummaryDto>('customers/12/summary');
    const orders = get<PagingRes<CustomerOrderDto>>('customers/12/orders', { limit: '5' });
    expect(orders.total).toBe(48);
    expect(orders.items.map(order => order.code)).toEqual(['DH2408', 'DH2391', 'DH2377', 'DH2360', 'DH2342']);
    expect(summary).toEqual({
      debtTotal: 128_400_000,
      overdueCount: 2,
      overdueTotal: 84_200_000,
      revenue12m: 1_820_000_000,
      orderCount: orders.total,
      documentCount: 4,
      lastOrder: { id: orders.items[0].id, code: 'DH2408', status: 'shipping', date: orders.items[0].createdAt },
      owner: { name: 'Trần Thu Hà', team: 'Kinh doanh miền Nam' },
    });
    for (const { id, code, total } of orders.items) {
      expect(get('orders/' + id)).toEqual(jasmine.objectContaining({ code, customerId: '12', total }));
    }
    expect(get<PagingRes<CustomerOrderDto>>('customers/12/orders').items.length).toBe(48);
    expect(get<PagingRes<CustomerDocumentDto>>('customers/12/documents', { limit: '1' }).total).toBe(4);
    expect(get<PagingRes<CustomerActivityDto>>('customers/12/activities', { limit: '5' }).total).toBe(12);
  });

  it('filters, sorts and pages debts against the same invoices the summary counts', () => {
    const debts = get<PagingRes<CustomerDebtDto>>('customers/12/debts', {
      filters: JSON.stringify([{ field: 'status', operator: 'EQUAL', data: 'OVERDUE' }]),
      orders: JSON.stringify([{ field: 'amount', direction: 'DESC' }]),
      pageNumber: '1',
      pageSize: '1',
    });
    expect(debts.total).toBe(2);
    expect(debts.items.length).toBe(1);
    expect(debts.items[0]).toEqual(jasmine.objectContaining({ orderCode: 'DH2318', amount: 32_200_000, overdueDays: 25 }));
    expect(get('orders/' + debts.items[0].orderId)).toEqual(jasmine.objectContaining({ code: 'DH2318', customerId: '12' }));
    expect(get<PagingRes<CustomerDebtDto>>('customers/12/debts').items.reduce((sum, row) => sum + row.amount, 0)).toBe(128_400_000);
  });

  it('provides a local PDF preview of each mock document', () => {
    for (const doc of get<PagingRes<CustomerDocumentDto>>('customers/12/documents').items) {
      expect(doc.previewUrl).toMatch(/^data:application\/pdf;base64,/);
      expect(atob(doc.previewUrl.split(',')[1])).toMatch(/^%PDF-1\.[0-9][\s\S]*%%EOF/);
    }
  });

  it('keeps empty and missing customers distinct and validates recent limits', () => {
    for (const relation of ['orders', 'debts', 'documents', 'activities']) {
      expect(get('customers/39/' + relation, { limit: '5' })).toEqual({ items: [], total: 0 });
      expect(() => get('customers/missing/' + relation)).toThrowMatching(e => e instanceof PatternMockError && e.status === 404);
    }
    expect(get<CustomerSummaryDto>('customers/39/summary')).toEqual(
      jasmine.objectContaining({ orderCount: 0, overdueCount: 0, lastOrder: null })
    );
    expect(get('customers/12/orders', { limit: '0' })).toEqual({ items: [], total: 48 });
    expect(() => get('customers/12/orders', { limit: '-2' })).toThrowMatching(e => e instanceof PatternMockError && e.status === 400);
  });

  it('logs only successful customer edits and keeps the activity isolated per customer and backend', () => {
    const detail = get<CustomerDto>('customers/12');
    const original = get('customers/3/activities');
    expect(() => api.handle('PUT', ['customers', '12'], new HttpParams(), { ...detail, name: '' })).toThrow();
    expect(get<PagingRes<CustomerActivityDto>>('customers/12/activities').total).toBe(12);
    api.handle('PUT', ['customers', '12'], new HttpParams(), { ...detail, note: 'Ghi chú mẫu' });
    const events = get<PagingRes<CustomerActivityDto>>('customers/12/activities', { limit: '1' });
    expect(events.total).toBe(13);
    expect(events.items[0].title).toContain('cập nhật');
    expect(get('customers/3/activities')).toEqual(original);
    api = new PatternMockBackend(PATTERN_MOCK_RESOURCES, 'none');
    expect(get<PagingRes<CustomerActivityDto>>('customers/12/activities').total).toBe(12);
  });

  it('does not inherit a deleted customer’s activity when the mock reuses its numeric ID', () => {
    const input = { ...get<CustomerDto>('customers/3'), email: 'customer@example.test' };
    const create = () => api.handle('POST', ['customers'], new HttpParams(), input).body as CustomerDto;
    const customer = create();
    api.handle('PUT', ['customers', customer.id], new HttpParams(), input);
    expect(get<PagingRes<CustomerActivityDto>>('customers/' + customer.id + '/activities').total).toBe(1);
    api.handle('DELETE', ['customers', customer.id], new HttpParams(), null);
    expect(create().id).toBe(customer.id);
    expect(get('customers/' + customer.id + '/activities')).toEqual({ items: [], total: 0 });
  });
});
