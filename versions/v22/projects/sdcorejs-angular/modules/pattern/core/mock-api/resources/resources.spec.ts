import { HttpParams } from '@angular/common/http';
import { PatternMockError } from '../mock-api.model';
import { PatternMockBackend } from '../mock-backend';
import { PATTERN_MOCK_RESOURCES } from './index';

const query = (params: Record<string, string> = {}) => new HttpParams({ fromObject: params });
const backend = () => new PatternMockBackend(PATTERN_MOCK_RESOURCES, 'none');
const failure = (run: () => unknown): PatternMockError => {
  try {
    run();
  } catch (error) {
    return error as PatternMockError;
  }
  throw new Error('expected the request to fail');
};

interface OrderLine {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

describe('pattern mock resources', () => {
  describe('categories', () => {
    it('adds a child up to the third level and refuses a fourth', () => {
      const api = backend();
      // Seed: 1 Đồ uống (level 1) → 2 Nước giải khát (level 2) → 3 Nước suối (level 3).
      const created = api.handle('POST', ['categories'], query(), { code: 'du-nuoc-9', name: 'Nước khoáng có ga', parentId: '2' });
      expect(created.body).toEqual(jasmine.objectContaining({ code: 'DU-NUOC-9', parentId: '2' }));

      const error = failure(() => api.handle('POST', ['categories'], query(), { code: 'X', name: 'Cấp 4', parentId: '3' }));
      expect(error.status).toBe(400);
      expect(error.body.errors).toEqual([{ field: 'parentId', message: 'Danh mục chỉ có tối đa 3 cấp.' }]);
    });

    it('refuses to delete a category that still has children', () => {
      expect(failure(() => backend().handle('DELETE', ['categories', '1'], query(), null)).status).toBe(409);
    });
  });

  describe('orders', () => {
    it('confirms the pending orders of a bulk request and names the state of the others', () => {
      const result = backend().handle('POST', ['orders', 'bulk', 'confirm'], query(), { ids: ['2400', '2399'] });
      expect(result.body).toEqual({
        results: [
          { id: '2400', ok: true },
          { id: '2399', ok: false, message: 'ĐH-2399 ở trạng thái "Đang giao", không xác nhận được.' },
        ],
      });
    });

    it('reports a quantity over the stock on the field of its line', () => {
      const api = backend();
      const order = api.handle('GET', ['orders', '2400'], query(), null).body as { customerId: string; lines: OrderLine[] };
      const lines = order.lines.map((line, index) => (index === 0 ? { ...line, quantity: 60 } : line));
      const error = failure(() => api.handle('PUT', ['orders', '2400'], query(), { customerId: order.customerId, lines }));
      expect(error.status).toBe(400);
      expect(error.body.errors).toContain({ field: 'lines.0.quantity', message: 'Vượt tồn kho (còn 50).' });
    });
  });

  describe('customers', () => {
    it('reports an e-mail of another customer on the e-mail field', () => {
      const error = failure(() =>
        backend().handle('POST', ['customers'], query(), {
          name: 'Khách thử nghiệm',
          type: 'individual',
          email: 'NGUYEN.AN@mail.vn',
          phone: '0901234567',
        })
      );
      expect(error.status).toBe(409);
      expect(error.body.errors?.[0]).toEqual({ field: 'email', message: 'nguyen.an@mail.vn đã thuộc về khách hàng khác.' });
    });
  });

  describe('settings', () => {
    it('reads the single record and validates the session length on save', () => {
      const api = backend();
      const settings = api.handle('GET', ['settings'], query(), null).body as Record<string, unknown>;
      expect(settings['sessionMinutes']).toBe(30);

      const error = failure(() => api.handle('PUT', ['settings'], query(), { ...settings, sessionMinutes: 3 }));
      expect(error.body.errors).toEqual([{ field: 'sessionMinutes', message: 'Từ 5 đến 480 phút.' }]);

      const saved = api.handle('PUT', ['settings'], query(), { ...settings, sessionMinutes: 60 }).body as Record<string, unknown>;
      expect(saved['sessionMinutes']).toBe(60);
      expect(saved['id']).toBe('default');
    });
  });

  describe('partners', () => {
    it('answers whether a code is free, ignoring its case', () => {
      const api = backend();
      expect(api.handle('GET', ['partners', 'check-code'], query({ code: 'dt-001' }), null).body).toEqual({ available: false });
      expect(api.handle('GET', ['partners', 'check-code'], query({ code: 'DT-500' }), null).body).toEqual({ available: true });
      expect(api.handle('GET', ['partners', 'check-code'], query(), null).body).toEqual({ available: false });
    });
  });
});
