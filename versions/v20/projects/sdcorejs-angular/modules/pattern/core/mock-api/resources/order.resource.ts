import { FilterUtilities } from '@sdcorejs/utils/fns';
import type { Filter } from '@sdcorejs/utils/models';
import { PatternMockError, type PatternMockContext, type PatternMockRecord, type PatternMockResource } from '../mock-api.model';
import { createPrng, pickWith } from '../prng';
import { INACTIVE_CUSTOMER_ID } from './customer.resource';
import { PERSON_NAMES } from './names';

type OrderStatus = 'pending' | 'shipping' | 'done' | 'cancelled';
type OrderApproval = 'draft' | 'submitted' | 'approved' | 'rejected';

interface MockOrderLine {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

interface MockApprovalStep {
  readonly action: 'submit' | 'approve' | 'reject';
  readonly by: string;
  readonly at: string;
  readonly reason?: string;
}

export interface MockOrder extends PatternMockRecord {
  readonly code: string;
  readonly customerId: string;
  /** Tên khách lúc lập chứng từ (snapshot), không đổi theo danh mục khách hàng. */
  readonly customer: string;
  readonly channel: string;
  readonly warehouse: string;
  readonly payment: string;
  readonly createdAt: string;
  readonly deliveredAt: string | null;
  readonly total: number;
  readonly status: OrderStatus;
  readonly approval: OrderApproval;
  readonly approvalHistory: readonly MockApprovalStep[];
  readonly lines: readonly MockOrderLine[];
  readonly creator: string;
  readonly source: string;
  readonly tracking: string | null;
  readonly note: string | null;
  readonly cancelReason: string | null;
}

interface MockProductLink extends PatternMockRecord {
  readonly name: string;
  readonly status: 'active' | 'inactive';
  readonly price: number;
}

interface MockCustomerLink extends PatternMockRecord {
  readonly name: string;
  readonly status: 'active' | 'inactive';
}

export const CHANNELS = ['Online', 'Cửa hàng', 'Đại lý'] as const;
export const WAREHOUSES = ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] as const;
export const PAYMENTS = ['Tiền mặt', 'Chuyển khoản', 'COD'] as const;
const SOURCES = ['Website', 'Ứng dụng', 'Hotline', 'Sàn TMĐT'];
const CREATORS = ['Nguyễn An', 'Bùi Lan', 'Đỗ Minh'];
/** Số lượng tối đa một dòng; vượt thì API báo lỗi ngay trên dòng (`lines.<index>.quantity`). */
const STOCK = 50;
const ACTOR = 'Người dùng mẫu';

const STATUS_NAME: Readonly<Record<OrderStatus, string>> = {
  pending: 'Chờ xác nhận',
  shipping: 'Đang giao',
  done: 'Hoàn tất',
  cancelled: 'Đã huỷ',
};

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const fail = (message: string): never => {
  throw new PatternMockError(409, { message });
};

/**
 * 128 orders as doc 08: Park–Miller seed 20261024, codes ĐH-2400 down, four a day back from 24/10/2026. The random
 * calls happen in the order of the doc (status, customer, channel, total, warehouse, payment) so the list matches the
 * E1 screen; lines, approval and the other fields come from a second generator.
 */
function seed(): MockOrder[] {
  const random = createPrng(20261024);
  const pick = pickWith(random);
  const extra = createPrng(20261103);
  const pickExtra = pickWith(extra);
  const start = new Date(2026, 9, 24, 8, 0);
  return Array.from({ length: 128 }, (_, index) => {
    const roll = random();
    const status: OrderStatus =
      index < 3
        ? (['pending', 'shipping', 'done'] as const)[index]
        : roll < 0.1
          ? 'pending'
          : roll < 0.36
            ? 'shipping'
            : roll < 0.94
              ? 'done'
              : 'cancelled';
    const customerIndex = PERSON_NAMES.indexOf(pick(PERSON_NAMES));
    const channel = pick(CHANNELS);
    const total = Math.round((150_000 + random() * 14_850_000) / 1000) * 1000;
    const warehouse = pick(WAREHOUSES);
    const payment = pick(PAYMENTS);
    const createdAt = new Date(start);
    createdAt.setDate(start.getDate() - Math.floor(index / 4));
    createdAt.setHours(8 + (index % 4) * 2);
    // Order ĐH-2400 belongs to the inactive customer: its update shows a stopped customer loaded by ID.
    const customerId = index === 0 ? INACTIVE_CUSTOMER_ID : String(customerIndex + 1);
    const approval: OrderApproval =
      status === 'pending' ? (index % 3 === 1 ? 'submitted' : 'draft') : status === 'cancelled' ? 'rejected' : 'approved';
    const lines = splitTotal(total, extra);
    const delivered = status === 'done' ? new Date(createdAt.getTime() + (1 + Math.floor(extra() * 4)) * 86_400_000).toISOString() : null;
    return {
      id: String(2400 - index),
      code: `ĐH-${2400 - index}`,
      customerId,
      customer: PERSON_NAMES[Number(customerId) - 1],
      channel,
      warehouse,
      payment,
      createdAt: createdAt.toISOString(),
      deliveredAt: delivered,
      total,
      status,
      approval,
      approvalHistory: history(approval, createdAt, index),
      lines,
      creator: pickExtra(CREATORS),
      source: pickExtra(SOURCES),
      tracking: status === 'shipping' || status === 'done' ? `VD${String(880000 + index * 37)}` : null,
      note: index % 6 === 0 ? 'Gọi trước khi giao.' : null,
      cancelReason: status === 'cancelled' ? 'Khách đổi ý.' : null,
    };
  });
}

/** One to three lines of the 36 seeded products; the last line takes what is left, so they add up to the total. */
function splitTotal(total: number, random: () => number): MockOrderLine[] {
  const count = 1 + Math.floor(random() * 3);
  const result: MockOrderLine[] = [];
  let left = total;
  for (let line = 0; line < count - 1; line++) {
    const quantity = 1 + Math.floor(random() * 4);
    const unitPrice = Math.max(1000, Math.round((total * (0.15 + random() * 0.15)) / quantity / 1000) * 1000);
    result.push({ productId: String(1 + Math.floor(random() * 36)), quantity, unitPrice });
    left -= quantity * unitPrice;
  }
  result.push({ productId: String(1 + Math.floor(random() * 36)), quantity: 1, unitPrice: left });
  return result;
}

function history(approval: OrderApproval, createdAt: Date, index: number): MockApprovalStep[] {
  if (approval === 'draft') return [];
  const submitted = {
    action: 'submit' as const,
    by: CREATORS[index % CREATORS.length],
    at: new Date(createdAt.getTime() + 3_600_000).toISOString(),
  };
  if (approval === 'submitted') return [submitted];
  const decidedAt = new Date(createdAt.getTime() + 7_200_000).toISOString();
  return approval === 'approved'
    ? [submitted, { action: 'approve', by: 'Trần Bình', at: decidedAt }]
    : [submitted, { action: 'reject', by: 'Trần Bình', at: decidedAt, reason: 'Khách đổi ý.' }];
}

/** Validates and prices the lines like a real API: a line error names its field (`lines.<index>.<field>`). */
function lines(body: Record<string, unknown>, context: PatternMockContext, current?: readonly MockOrderLine[]): MockOrderLine[] {
  const raw = Array.isArray(body['lines']) ? (body['lines'] as Record<string, unknown>[]) : [];
  const products = context.collection<MockProductLink>('products');
  const errors: { field: string; message: string }[] = [];
  if (!raw.length) errors.push({ field: 'lines', message: 'Thêm ít nhất một dòng hàng.' });
  const result = raw.map((line, index) => {
    const productId = text(line['productId']);
    const quantity = Number(line['quantity']);
    const product = products.find(item => item.id === productId);
    const kept = current?.some(item => item.productId === productId);
    if (!product) errors.push({ field: `lines.${index}.productId`, message: 'Chọn sản phẩm.' });
    else if (product.status === 'inactive' && !kept)
      errors.push({ field: `lines.${index}.productId`, message: `${product.name} đã ngừng kinh doanh.` });
    if (!Number.isInteger(quantity) || quantity < 1)
      errors.push({ field: `lines.${index}.quantity`, message: 'Số lượng phải là số nguyên dương.' });
    else if (quantity > STOCK) errors.push({ field: `lines.${index}.quantity`, message: `Vượt tồn kho (còn ${STOCK}).` });
    const unitPrice = Number(line['unitPrice']);
    return { productId, quantity, unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : (product?.price ?? 0) };
  });
  if (errors.length) throw new PatternMockError(400, { message: 'Dữ liệu chưa hợp lệ.', errors });
  return result;
}

function header(body: Record<string, unknown>, context: PatternMockContext, current?: MockOrder) {
  const customerId = text(body['customerId']);
  const customer = context.collection<MockCustomerLink>('customers').find(item => item.id === customerId);
  const errors: { field: string; message: string }[] = [];
  if (!customer) errors.push({ field: 'customerId', message: 'Chọn khách hàng.' });
  else if (customer.status === 'inactive' && customer.id !== current?.customerId) {
    errors.push({ field: 'customerId', message: `${customer.name} đã ngừng hoạt động.` });
  }
  if (errors.length) throw new PatternMockError(400, { message: 'Dữ liệu chưa hợp lệ.', errors });
  const pickOf = <T extends string>(values: readonly T[], value: unknown): T => (values.includes(value as T) ? (value as T) : values[0]);
  return {
    customerId,
    customer: current?.customerId === customerId ? current.customer : customer!.name,
    channel: pickOf(CHANNELS, body['channel']),
    warehouse: pickOf(WAREHOUSES, body['warehouse']),
    payment: pickOf(PAYMENTS, body['payment']),
    note: text(body['note']) || null,
  };
}

const sum = (orderLines: readonly MockOrderLine[]): number => orderLines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);

const step = (action: MockApprovalStep['action'], reason?: string): MockApprovalStep => ({
  action,
  by: ACTOR,
  at: new Date().toISOString(),
  ...(reason ? { reason } : {}),
});

/** Tab and card counts under the filters of the list, without the status the tabs choose. */
function counts(records: readonly MockOrder[], filters: Filter[]): Record<'all' | OrderStatus | 'revenue', number> {
  const matched = records.filter(record =>
    FilterUtilities.match(filters, record, { fieldTypes: { createdAt: 'date', deliveredAt: 'date' } })
  );
  const of = (status: OrderStatus) => matched.filter(record => record.status === status);
  return {
    all: matched.length,
    pending: of('pending').length,
    shipping: of('shipping').length,
    done: of('done').length,
    cancelled: of('cancelled').length,
    revenue: of('done').reduce((total, record) => total + record.total, 0),
  };
}

/**
 * `orders`: chứng từ có dòng hàng và quy trình duyệt. Actions: `confirm`, `cancel` (reason), `submit`, `approve`,
 * `reject` (reason), one by one or in bulk; a record in the wrong state fails alone. `GET orders/counts` for tabs and cards.
 */
export const ORDER_RESOURCE: PatternMockResource<MockOrder> = {
  name: 'orders',
  fieldTypes: { createdAt: 'date', deliveredAt: 'date' },
  seed,
  create: (body, _records, context) => {
    const head = header(body, context);
    const orderLines = lines(body, context);
    const id = String(Math.max(2400, ...context.collection('orders').map(order => Number(order.id) || 0)) + 1);
    return {
      id,
      code: `ĐH-${id}`,
      ...head,
      createdAt: context.now().toISOString(),
      deliveredAt: null,
      total: sum(orderLines),
      status: 'pending',
      approval: 'draft',
      approvalHistory: [],
      lines: orderLines,
      creator: ACTOR,
      source: 'Website',
      tracking: null,
      cancelReason: null,
    };
  },
  update: (current, body, _records, context) => {
    if (current.status !== 'pending' || current.approval === 'submitted' || current.approval === 'approved') {
      fail(`Đơn ${current.code} đã gửi duyệt hoặc đã xử lý, không cập nhật được.`);
    }
    const orderLines = lines(body, context, current.lines);
    return { ...current, ...header(body, context, current), lines: orderLines, total: sum(orderLines) };
  },
  actions: {
    confirm: current => {
      if (current.status !== 'pending') fail(`${current.code} ở trạng thái "${STATUS_NAME[current.status]}", không xác nhận được.`);
      return { ...current, status: 'shipping', tracking: current.tracking ?? `VD${current.id}` };
    },
    cancel: (current, body) => {
      const reason = text(body['reason']);
      if (!reason)
        throw new PatternMockError(400, { message: 'Nhập lý do huỷ.', errors: [{ field: 'reason', message: 'Nhập lý do huỷ.' }] });
      if (current.status === 'done' || current.status === 'cancelled')
        fail(`${current.code} ở trạng thái "${STATUS_NAME[current.status]}", không huỷ được.`);
      return { ...current, status: 'cancelled', cancelReason: reason };
    },
    submit: current => {
      if (current.approval !== 'draft' && current.approval !== 'rejected') fail(`${current.code} đã gửi duyệt.`);
      return { ...current, approval: 'submitted', approvalHistory: [...current.approvalHistory, step('submit')] };
    },
    approve: current => {
      if (current.approval !== 'submitted') fail(`${current.code} không chờ duyệt.`);
      return { ...current, approval: 'approved', approvalHistory: [...current.approvalHistory, step('approve')] };
    },
    reject: (current, body) => {
      const reason = text(body['reason']);
      if (!reason)
        throw new PatternMockError(400, { message: 'Nhập lý do từ chối.', errors: [{ field: 'reason', message: 'Nhập lý do từ chối.' }] });
      if (current.approval !== 'submitted') fail(`${current.code} không chờ duyệt.`);
      return { ...current, approval: 'rejected', approvalHistory: [...current.approvalHistory, step('reject', reason)] };
    },
  },
  route: (method, segments, query, _body, context) => {
    if (method === 'GET' && segments.length === 1 && segments[0] === 'counts') {
      const filters = JSON.parse(query.get('filters') ?? '[]') as Filter[];
      return { body: counts(context.collection<MockOrder>('orders'), filters) };
    }
    return undefined;
  },
};
