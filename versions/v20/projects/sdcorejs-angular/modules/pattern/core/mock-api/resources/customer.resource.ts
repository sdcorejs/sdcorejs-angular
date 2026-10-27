import { FilterUtilities } from '@sdcorejs/utils/fns';
import type { Filter } from '@sdcorejs/utils/models';
import { PatternMockError, type PatternMockRecord, type PatternMockResource } from '../mock-api.model';
import { createPrng, pickWith } from '../prng';
import { COMPANY_NAMES, PERSON_NAMES, slug } from './names';

export interface MockCustomer extends PatternMockRecord {
  readonly code: string;
  readonly name: string;
  readonly type: 'individual' | 'business';
  readonly tier: 'standard' | 'vip';
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly taxCode: string | null;
  readonly status: 'active' | 'inactive';
  readonly debt: number;
  readonly createdAt: string;
  readonly note: string | null;
}

/** Customer of order ĐH-2400: inactive, so `order/2400/update` shows a stopped customer loaded by ID. */
export const INACTIVE_CUSTOMER_ID = '4';

const CITIES = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
const STREETS = ['Lê Lợi', 'Trần Hưng Đạo', 'Nguyễn Huệ', 'Hai Bà Trưng', 'Lý Thường Kiệt', 'Phan Chu Trinh'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const code = (id: number): string => `KH-${String(id).padStart(4, '0')}`;

function validate(
  body: Record<string, unknown>,
  records: readonly MockCustomer[],
  id?: string
): Omit<MockCustomer, 'id' | 'code' | 'debt' | 'createdAt'> {
  const name = text(body['name']);
  const email = text(body['email']).toLowerCase();
  const phone = text(body['phone']);
  const type = body['type'] === 'business' ? 'business' : 'individual';
  const taxCode = text(body['taxCode']) || null;
  const errors: { field: string; message: string }[] = [];
  if (!name) errors.push({ field: 'name', message: 'Nhập tên khách hàng.' });
  if (!email || !EMAIL.test(email)) errors.push({ field: 'email', message: 'Email không hợp lệ.' });
  if (!phone) errors.push({ field: 'phone', message: 'Nhập số điện thoại.' });
  if (type === 'business' && !taxCode) errors.push({ field: 'taxCode', message: 'Doanh nghiệp cần mã số thuế.' });
  if (errors.length) throw new PatternMockError(400, { message: 'Dữ liệu chưa hợp lệ.', errors });
  if (records.some(record => record.id !== id && record.email === email)) {
    throw new PatternMockError(409, {
      message: 'Email đã được dùng.',
      errors: [{ field: 'email', message: `${email} đã thuộc về khách hàng khác.` }],
    });
  }
  return {
    name,
    email,
    phone,
    type,
    taxCode: type === 'business' ? taxCode : null,
    tier: body['tier'] === 'vip' ? 'vip' : 'standard',
    address: text(body['address']),
    status: body['status'] === 'inactive' ? 'inactive' : 'active',
    note: text(body['note']) || null,
  };
}

interface MockOrderLink extends PatternMockRecord {
  readonly code: string;
  readonly customerId: string;
  readonly createdAt: string;
  readonly total: number;
  readonly status: string;
}

/** Card counts under the filters of the list, without the segment the cards choose. */
function counts(records: readonly MockCustomer[], filters: Filter[]): Record<'all' | 'individual' | 'business' | 'vip', number> {
  const matched = records.filter(record => FilterUtilities.match(filters, record));
  return {
    all: matched.length,
    individual: matched.filter(record => record.type === 'individual').length,
    business: matched.filter(record => record.type === 'business').length,
    vip: matched.filter(record => record.tier === 'vip').length,
  };
}

/**
 * `customers`: 16 individuals named like the order seed (ids 1–16), 8 businesses and 16 more individuals.
 * Extra endpoints: `GET customers/counts`, `GET customers/:id/orders|debts|documents` for the 360° tabs.
 */
export const CUSTOMER_RESOURCE: PatternMockResource<MockCustomer> = {
  name: 'customers',
  fieldTypes: { createdAt: 'date' },
  seed: () => {
    const random = createPrng(20261102);
    const pick = pickWith(random);
    const names = [...PERSON_NAMES, ...COMPANY_NAMES, ...PERSON_NAMES.map(name => `${name} ${pick(['Anh', 'Thu', 'Hải', 'Linh'])}`)];
    return names.map((name, index) => {
      const id = index + 1;
      const business = index >= PERSON_NAMES.length && index < PERSON_NAMES.length + COMPANY_NAMES.length;
      const createdAt = new Date(2026, 9, 24 - index * 3, 9, 0);
      return {
        id: String(id),
        code: code(id),
        name,
        type: business ? 'business' : 'individual',
        tier: random() < 0.25 ? 'vip' : 'standard',
        email: `${slug(name)}${business ? '@congty.vn' : '@mail.vn'}`,
        phone: `09${String(Math.floor(random() * 1e8)).padStart(8, '0')}`,
        address: `${10 + Math.floor(random() * 190)} ${pick(STREETS)}, ${pick(CITIES)}`,
        taxCode: business ? `0${String(310000000 + id * 7919)}` : null,
        status: String(id) === INACTIVE_CUSTOMER_ID || id % 11 === 0 ? 'inactive' : 'active',
        debt: random() < 0.4 ? Math.round((random() * 50_000_000) / 1000) * 1000 : 0,
        createdAt: createdAt.toISOString(),
        note: id % 5 === 0 ? 'Ưu tiên giao buổi sáng.' : null,
      };
    });
  },
  create: (body, records, context) => {
    const id = context.nextId('customers');
    return { id, code: code(Number(id)), debt: 0, createdAt: context.now().toISOString(), ...validate(body, records) };
  },
  update: (current, body, records) => ({ ...current, ...validate(body, records, current.id) }),
  beforeDelete: (current, context) => {
    if (context.collection<MockOrderLink>('orders').some(order => order.customerId === current.id)) {
      throw new PatternMockError(409, { message: `${current.name} còn đơn hàng, không xoá được.` });
    }
  },
  route: (method, segments, query, _body, context) => {
    if (method !== 'GET') return undefined;
    if (segments.length === 1 && segments[0] === 'counts') {
      const filters = JSON.parse(query.get('filters') ?? '[]') as Filter[];
      return { body: counts(context.collection<MockCustomer>('customers'), filters) };
    }
    if (segments.length !== 2) return undefined;
    const [id, tab] = segments;
    const customer = context.collection<MockCustomer>('customers').find(record => record.id === id);
    if (!customer) throw new PatternMockError(404, { message: 'Không tìm thấy khách hàng.' });
    const orders = context.collection<MockOrderLink>('orders').filter(order => order.customerId === id);
    if (tab === 'orders') {
      const items = orders.map(order => ({
        id: order.id,
        code: order.code,
        createdAt: order.createdAt,
        total: order.total,
        status: order.status,
      }));
      return { body: { items, total: items.length } };
    }
    if (tab === 'debts') {
      const items = orders
        .filter(order => order.status === 'done')
        .slice(0, customer.debt ? 4 : 0)
        .map((order, index) => ({
          id: order.id,
          orderCode: order.code,
          dueDate: new Date(new Date(order.createdAt).getTime() + (15 + index * 15) * 86_400_000).toISOString(),
          amount: Math.round(order.total / 2 / 1000) * 1000,
        }));
      return { body: { items, total: items.length } };
    }
    if (tab === 'documents') {
      const kinds =
        customer.type === 'business'
          ? ['Hợp đồng nguyên tắc', 'Giấy phép kinh doanh', 'Biên bản đối chiếu công nợ']
          : ['Hợp đồng mua bán', 'CCCD'];
      const items =
        Number(id) % 3 === 0 ? [] : kinds.map((name, index) => ({ id: `${id}-${index + 1}`, name, size: 120_000 + index * 48_000 }));
      return { body: { items, total: items.length } };
    }
    return undefined;
  },
};
