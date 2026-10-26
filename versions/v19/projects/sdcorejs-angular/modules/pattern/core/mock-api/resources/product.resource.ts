import { PatternMockError, type PatternMockRecord, type PatternMockResource } from '../mock-api.model';
import { createPrng, pickWith } from '../prng';

export interface MockProduct extends PatternMockRecord {
  readonly code: string;
  readonly name: string;
  readonly status: 'active' | 'inactive';
  readonly unit: string;
  readonly price: number;
}

const NAMES = [
  'Nước suối 500ml',
  'Sữa tươi 1L',
  'Mì gói hảo hạng',
  'Gạo thơm 5kg',
  'Dầu ăn 1L',
  'Nước mắm 500ml',
  'Đường tinh luyện 1kg',
  'Cà phê rang xay 500g',
  'Trà xanh 100 gói',
  'Bánh quy bơ',
  'Nước ngọt 330ml',
  'Bột giặt 3kg',
  'Nước rửa chén 750ml',
  'Khăn giấy 10 gói',
  'Kem đánh răng',
  'Dầu gội 650ml',
  'Sữa chua 4 hộp',
  'Bánh mì sandwich',
  'Xúc xích 500g',
  'Trứng gà 10 quả',
  'Nước tương 500ml',
  'Hạt nêm 900g',
  'Bia lon 330ml',
  'Ngũ cốc 400g',
  'Sữa đặc 380g',
  'Bánh gạo',
  'Snack khoai tây',
  'Kẹo dẻo trái cây',
  'Nước cam ép 1L',
  'Bột mì 1kg',
  'Muối i-ốt 500g',
  'Tương ớt 250g',
  'Mật ong 500ml',
  'Hạt điều rang 250g',
  'Sốt mayonnaise',
  'Phô mai lát',
];
const UNITS = ['Chai', 'Hộp', 'Gói', 'Thùng', 'Cái'];

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** Validates a create/update body like a real API would: required fields, then a unique code. */
function validate(body: Record<string, unknown>, records: readonly MockProduct[], id?: string): Omit<MockProduct, 'id'> {
  const code = text(body['code']);
  const name = text(body['name']);
  const unit = text(body['unit']);
  const price = Number(body['price']);
  const status = body['status'] === 'inactive' ? 'inactive' : 'active';
  const errors: { field: string; message: string }[] = [];
  if (!code) errors.push({ field: 'code', message: 'Nhập mã sản phẩm.' });
  if (!name) errors.push({ field: 'name', message: 'Nhập tên sản phẩm.' });
  if (!Number.isFinite(price) || price < 0) errors.push({ field: 'price', message: 'Giá bán phải là số không âm.' });
  if (errors.length) throw new PatternMockError(400, { message: 'Dữ liệu chưa hợp lệ.', errors });
  if (records.some(record => record.id !== id && record.code.toLowerCase() === code.toLowerCase())) {
    throw new PatternMockError(409, {
      message: 'Mã sản phẩm đã tồn tại.',
      errors: [{ field: 'code', message: `Mã ${code} đã được dùng cho sản phẩm khác.` }],
    });
  }
  return { code, name, unit: unit || 'Cái', price, status };
}

interface ImportRow {
  readonly code: string;
  readonly name: string;
  readonly unit: string;
  readonly price: number;
}

/** Classifies each row of an import: new, duplicate of a stored code, or invalid. */
function preview(rows: readonly Record<string, unknown>[], records: readonly MockProduct[]) {
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const code = text(row['code']).toUpperCase();
    const name = text(row['name']);
    const price = Number(row['price']);
    const base = { index, code, name, unit: text(row['unit']) || 'Cái', price };
    if (!code || !name) return { ...base, result: 'invalid' as const, message: 'Thiếu mã hoặc tên.' };
    if (!Number.isFinite(price) || price < 0) return { ...base, result: 'invalid' as const, message: 'Giá bán không hợp lệ.' };
    if (seen.has(code)) return { ...base, result: 'invalid' as const, message: 'Trùng mã trong tệp.' };
    seen.add(code);
    const existing = records.find(record => record.code.toUpperCase() === code);
    return existing ? { ...base, result: 'duplicate' as const, message: `Đã có: ${existing.name}` } : { ...base, result: 'new' as const };
  });
}

/**
 * `products`: 36 products, every seventh inactive (used by order lines and the inactive-select case).
 * `POST products/import/preview` classifies rows; `POST products/import` writes them (`duplicates`: skip | overwrite).
 */
export const PRODUCT_RESOURCE: PatternMockResource<MockProduct> = {
  name: 'products',
  seed: () => {
    const random = createPrng(20261101);
    const pick = pickWith(random);
    return NAMES.map((name, index) => ({
      id: String(index + 1),
      code: `SP-${String(index + 1).padStart(3, '0')}`,
      name,
      status: (index + 1) % 7 === 0 ? 'inactive' : 'active',
      unit: pick(UNITS),
      price: Math.round((8_000 + random() * 392_000) / 1000) * 1000,
    }));
  },
  create: (body, records, context) => ({ id: context.nextId('products'), ...validate(body, records) }),
  // The code is locked after creation: the update keeps the stored one whatever the body says.
  update: (current, body, records) => ({ ...current, ...validate({ ...body, code: current.code }, records, current.id) }),
  route: (method, segments, _query, body, context) => {
    if (method !== 'POST' || segments[0] !== 'import') return undefined;
    const records = context.collection<MockProduct>('products');
    const rows = preview(Array.isArray(body['rows']) ? (body['rows'] as Record<string, unknown>[]) : [], records);
    if (segments[1] === 'preview') return { body: { rows } };
    if (segments.length !== 1) return undefined;
    const overwrite = body['duplicates'] === 'overwrite';
    let next = [...records];
    let created = 0;
    let updated = 0;
    for (const row of rows) {
      const data: ImportRow = { code: row.code, name: row.name, unit: row.unit, price: row.price };
      if (row.result === 'new') {
        next = [
          { id: String(next.reduce((max, record) => Math.max(max, Number(record.id) || 0), 0) + 1), status: 'active', ...data },
          ...next,
        ];
        created++;
      } else if (row.result === 'duplicate' && overwrite) {
        next = next.map(record => (record.code.toUpperCase() === row.code ? { ...record, ...data, code: record.code } : record));
        updated++;
      }
    }
    context.save('products', next);
    return { body: { created, updated, skipped: rows.length - created - updated } };
  },
};
