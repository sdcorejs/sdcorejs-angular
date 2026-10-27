import { HttpParams } from '@angular/common/http';
import { PatternMockError, type PatternMockRecord, type PatternMockResource } from './mock-api.model';
import { PatternMockBackend } from './mock-backend';
import { PRODUCT_RESOURCE } from './resources/product.resource';

interface Item extends PatternMockRecord {
  readonly code: string;
  readonly status: 'open' | 'done';
  readonly amount: number;
}

const ITEMS: PatternMockResource<Item> = {
  name: 'items',
  seed: () => [
    { id: '1', code: 'B', status: 'open', amount: 20 },
    { id: '2', code: 'A', status: 'done', amount: 0 },
    { id: '3', code: 'C', status: 'open', amount: 5 },
  ],
  create: (body, _records, context) => ({ id: context.nextId('items'), code: String(body['code']), status: 'open', amount: 0 }),
  update: (current, body) => ({ ...current, amount: Number(body['amount']) }),
  beforeDelete: current => {
    if (current.status === 'done') throw new PatternMockError(409, { message: 'Đã hoàn tất.' });
  },
  actions: {
    close: current => {
      if (current.status === 'done') throw new PatternMockError(409, { message: `${current.code} đã đóng.` });
      return { ...current, status: 'done' };
    },
  },
};

const query = (params: Record<string, string> = {}) => new HttpParams({ fromObject: params });
const erase = (resource: object) => resource as PatternMockResource;

describe('PatternMockBackend', () => {
  afterEach(() => sessionStorage.removeItem('sd-pattern.db.items'));

  it('filters, sorts and pages a collection from the blueprint list request', () => {
    const backend = new PatternMockBackend([erase(ITEMS)], 'none');
    const result = backend.handle(
      'GET',
      ['items'],
      query({
        pageNumber: '0',
        pageSize: '1',
        filters: JSON.stringify([{ field: 'status', operator: 'EQUAL', data: 'open' }]),
        orders: JSON.stringify([{ field: 'amount', direction: 'ASC' }]),
      }),
      null
    );
    expect(result.body).toEqual({ items: [{ id: '3', code: 'C', status: 'open', amount: 5 }], total: 2 });
  });

  it('serves the first records only when a read override limits the collection', () => {
    const backend = new PatternMockBackend([erase(ITEMS)], 'none');
    expect((backend.handle('GET', ['items'], query(), null, 2).body as { total: number }).total).toBe(2);
  });

  it('answers detail, create, update and delete, with 404 for an unknown id', () => {
    const backend = new PatternMockBackend([erase(ITEMS)], 'none');
    expect(backend.handle('GET', ['items', '2'], query(), null).body).toEqual(jasmine.objectContaining({ code: 'A' }));
    expect(() => backend.handle('GET', ['items', '9'], query(), null)).toThrowMatching(error => (error as PatternMockError).status === 404);

    const created = backend.handle('POST', ['items'], query(), { code: 'D' });
    expect(created).toEqual({ status: 201, body: { id: '4', code: 'D', status: 'open', amount: 0 } });
    expect(backend.handle('PUT', ['items', '4'], query(), { amount: 7 }).body).toEqual(jasmine.objectContaining({ amount: 7 }));
    expect(backend.handle('DELETE', ['items', '4'], query(), null)).toEqual({ status: 204, body: null });
    expect(backend.collection('items').length).toBe(3);
  });

  it('answers each id of a bulk action, keeping the failures apart', () => {
    const backend = new PatternMockBackend([erase(ITEMS)], 'none');
    const result = backend.handle('POST', ['items', 'bulk', 'close'], query(), { ids: ['1', '2', '3'] });
    expect(result.body).toEqual({
      results: [
        { id: '1', ok: true },
        { id: '2', ok: false, message: 'A đã đóng.' },
        { id: '3', ok: true },
      ],
    });
    expect(backend.collection('items').every(item => (item as Item).status === 'done')).toBeTrue();
    expect(() => backend.handle('POST', ['items', 'bulk', 'close'], query(), { ids: [] })).toThrowMatching(
      error => (error as PatternMockError).status === 400
    );
  });

  it('keeps changes in sessionStorage and goes back to the seed on reset', () => {
    const backend = new PatternMockBackend([erase(ITEMS)], 'session');
    backend.handle('POST', ['items'], query(), { code: 'D' });
    expect(new PatternMockBackend([erase(ITEMS)], 'session').collection('items').length).toBe(4);

    backend.reset();
    expect(sessionStorage.getItem('sd-pattern.db.items')).toBeNull();
    expect(backend.collection('items').length).toBe(3);
  });

  it('rejects a bad query, an unknown resource and an unsupported method', () => {
    const backend = new PatternMockBackend([erase(ITEMS)], 'none');
    const status = (run: () => unknown) => {
      try {
        run();
      } catch (error) {
        return (error as PatternMockError).status;
      }
      return 200;
    };
    expect(status(() => backend.handle('GET', ['items'], query({ filters: '{' }), null))).toBe(400);
    expect(status(() => backend.handle('GET', ['nope'], query(), null))).toBe(404);
    expect(status(() => backend.handle('PATCH', ['items', '1'], query(), null))).toBe(405);
    expect(status(() => backend.handle('POST', ['items', '1', 'reopen'], query(), null))).toBe(405);
    expect(status(() => backend.handle('DELETE', ['items', '2'], query(), null))).toBe(409);
  });
});

describe('PRODUCT_RESOURCE', () => {
  const backend = () => new PatternMockBackend([erase(PRODUCT_RESOURCE)], 'none');

  it('seeds the same 36 products every time, every seventh inactive', () => {
    const products = PRODUCT_RESOURCE.seed();
    expect(products.length).toBe(36);
    expect(products).toEqual(PRODUCT_RESOURCE.seed());
    expect(products[6].status).toBe('inactive');
    expect(products[0].code).toBe('SP-001');
  });

  it('reports missing fields and a duplicate code on the fields', () => {
    const api = backend();
    expect(() => api.handle('POST', ['products'], query(), { code: '', name: '', price: -1 })).toThrowMatching(
      error => (error as PatternMockError).body.errors?.map(item => item.field).join() === 'code,name,price'
    );
    expect(() => api.handle('POST', ['products'], query(), { code: 'sp-001', name: 'X', price: 1 })).toThrowMatching(
      error => (error as PatternMockError).status === 409 && (error as PatternMockError).body.errors?.[0].field === 'code'
    );
  });

  it('keeps the stored code on update', () => {
    const updated = backend().handle('PUT', ['products', '1'], query(), { code: 'NEW', name: 'Đổi tên', price: 1000, unit: 'Hộp' });
    expect(updated.body).toEqual(jasmine.objectContaining({ id: '1', code: 'SP-001', name: 'Đổi tên', unit: 'Hộp' }));
  });
});
