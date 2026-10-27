import { PatternMockError, type PatternMockRecord, type PatternMockResource } from '../mock-api.model';
import { COMPANY_NAMES, PERSON_NAMES } from './names';

export interface MockPartner extends PatternMockRecord {
  readonly code: string;
  readonly type: 'individual' | 'business';
  readonly name: string;
  readonly identity: string;
  readonly representative: string | null;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * `partners`: đối tác của flow tạo nhiều bước. `GET partners/check-code?code=` trả `{ available }` để kiểm tra trùng mã
 * khi chuyển bước; `POST partners` kiểm tra lại (409 nếu trùng).
 */
export const PARTNER_RESOURCE: PatternMockResource<MockPartner> = {
  name: 'partners',
  seed: () =>
    [...PERSON_NAMES.slice(0, 5), ...COMPANY_NAMES.slice(0, 5)].map((name, index) => ({
      id: String(index + 1),
      code: `DT-${String(index + 1).padStart(3, '0')}`,
      type: index < 5 ? 'individual' : 'business',
      name,
      identity: index < 5 ? `0790${String(index).padStart(8, '0')}` : `0${String(310100000 + index)}`,
      representative: index < 5 ? null : PERSON_NAMES[index],
      email: `doitac${index + 1}@mail.vn`,
      phone: `0912${String(100000 + index).padStart(6, '0')}`,
      address: 'TP.HCM',
    })),
  create: (body, records, context) => {
    const code = text(body['code']).toUpperCase();
    const type = body['type'] === 'business' ? 'business' : 'individual';
    const errors: { field: string; message: string }[] = [];
    for (const field of ['code', 'name', 'identity', 'email', 'phone']) {
      if (!text(body[field])) errors.push({ field, message: 'Bắt buộc nhập.' });
    }
    if (type === 'business' && !text(body['representative'])) errors.push({ field: 'representative', message: 'Bắt buộc nhập.' });
    if (errors.length) throw new PatternMockError(400, { message: 'Dữ liệu chưa hợp lệ.', errors });
    if (records.some(record => record.code === code)) {
      throw new PatternMockError(409, {
        message: 'Mã đối tác đã tồn tại.',
        errors: [{ field: 'code', message: `Mã ${code} đã được dùng.` }],
      });
    }
    return {
      id: context.nextId('partners'),
      code,
      type,
      name: text(body['name']),
      identity: text(body['identity']),
      representative: type === 'business' ? text(body['representative']) : null,
      email: text(body['email']),
      phone: text(body['phone']),
      address: text(body['address']),
    };
  },
  route: (method, segments, query, _body, context) => {
    if (method !== 'GET' || segments.length !== 1 || segments[0] !== 'check-code') return undefined;
    const code = (query.get('code') ?? '').trim().toUpperCase();
    return { body: { available: !!code && !context.collection<MockPartner>('partners').some(record => record.code === code) } };
  },
};
