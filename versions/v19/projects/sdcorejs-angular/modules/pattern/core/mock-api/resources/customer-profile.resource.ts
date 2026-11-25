import type {
  CustomerActivityDto,
  CustomerDebtDto,
  CustomerDocumentDto,
  CustomerOrderDto,
  CustomerSummaryDto,
} from '../../../features/customer/services/customer.model';
import type { PatternMockContext, PatternMockQuery, PatternMockResource, PatternMockResult } from '../mock-api.model';
import { pageMockRecords } from '../mock-query';
import { PROFILE_ACTIVITY, PROFILE_AS_OF, PROFILE_CUSTOMER, PROFILE_DOCUMENTS, PROFILE_INVOICES } from './customer-profile.seed';
import type { MockCustomer } from './customer.resource';
import type { MockOrder } from './order.resource';

interface CustomerEvent extends CustomerActivityDto {
  readonly customerId: string;
}

export const CUSTOMER_ACTIVITY_RESOURCE: PatternMockResource<CustomerEvent> = {
  name: 'customer-activities',
  seed: () => [],
};

export function recordCustomerUpdate(id: string, context: PatternMockContext): void {
  const resource = CUSTOMER_ACTIVITY_RESOURCE.name;
  const event: CustomerEvent = {
    id: context.nextId(resource),
    customerId: id,
    title: 'Người dùng mẫu cập nhật hồ sơ',
    category: 'Thông tin',
    date: context.now().toISOString(),
  };
  context.save(resource, [event, ...context.collection<CustomerEvent>(resource)]);
}

export function forgetCustomerActivity(id: string, context: PatternMockContext): void {
  const resource = CUSTOMER_ACTIVITY_RESOURCE.name;
  const events = context.collection<CustomerEvent>(resource);
  context.save(
    resource,
    events.filter(event => event.customerId !== id)
  );
}

const isProfile = (customer: MockCustomer) => customer.id === PROFILE_CUSTOMER.id && customer.code === PROFILE_CUSTOMER.code;
const day = 86_400_000;

function debtsOf(customer: MockCustomer, orders: readonly CustomerOrderDto[]): CustomerDebtDto[] {
  if (!customer.debt || !orders.length) return [];
  const invoices = isProfile(customer)
    ? PROFILE_INVOICES
    : [
        {
          orderId: orders[0].id,
          dueDate: new Date(Date.parse(orders[0].createdAt) + 30 * day).toISOString().slice(0, 10),
          amount: customer.debt,
        },
      ];
  return invoices.flatMap(invoice => {
    const order = orders.find(row => row.id === invoice.orderId);
    if (!order) return [];
    const overdueDays = Math.max(0, Math.round((Date.parse(PROFILE_AS_OF) - Date.parse(invoice.dueDate)) / day));
    return [{ ...invoice, id: order.id, orderCode: order.code, status: overdueDays ? 'OVERDUE' : 'CURRENT', overdueDays }];
  });
}

/** One-page PDF rendition of a fictional attachment, valid offline for all original formats. */
function pdfPreview(name: string): string {
  const title = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^\w .-]/g, '');
  const stream = `BT /F1 18 Tf 50 735 Td (${title}) Tj 0 -35 Td /F1 12 Tf (Tai lieu mau - Record 360) Tj ET`;
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    `<</Length ${stream.length}>>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = ['0000000000 65535 f \n'];
  objects.forEach((body, i) => {
    offsets.push(String(pdf.length).padStart(10, '0') + ' 00000 n \n');
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 6\n${offsets.join('')}trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return 'data:application/pdf;base64,' + btoa(pdf);
}

function documentMetadata(customer: MockCustomer) {
  if (isProfile(customer)) return PROFILE_DOCUMENTS;
  if (Number(customer.id) % 3 === 0 || Number(customer.id) > 40) return [];
  const names =
    customer.type === 'business'
      ? ['Hợp đồng nguyên tắc.pdf', 'Giấy phép kinh doanh.pdf', 'Biên bản đối chiếu công nợ.docx']
      : ['Hợp đồng mua bán.pdf', 'Phụ lục hợp đồng.pdf'];
  return names.map((name, index) => ({ name, size: 120_000 + index * 48_000, uploadedAt: customer.createdAt.slice(0, 10) }));
}

export function customerProfile(
  customer: MockCustomer,
  relation: string,
  query: PatternMockQuery,
  context: PatternMockContext,
  readLimit?: number
): PatternMockResult | undefined {
  const list = <T>(rows: T[], dateField: string) => ({
    body: pageMockRecords(readLimit === undefined ? rows : rows.slice(0, readLimit), query, { [dateField]: 'date' }, rows.length || 1),
  });
  if (relation === 'documents') {
    const documents: CustomerDocumentDto[] = documentMetadata(customer).map((doc, i) => ({
      ...doc,
      id: customer.id + '-' + (i + 1),
      previewUrl: pdfPreview(doc.name),
    }));
    return list(documents, 'uploadedAt');
  }
  const orders: CustomerOrderDto[] = context
    .collection<MockOrder>('orders')
    .filter(row => row.customerId === customer.id)
    .map(({ id, code, createdAt, total, status }) => ({ id, code, createdAt, total, status }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (relation === 'orders') return list(orders, 'createdAt');
  if (relation === 'activities') {
    const updates = context.collection<CustomerEvent>(CUSTOMER_ACTIVITY_RESOURCE.name).filter(row => row.customerId === customer.id);
    const activity: CustomerActivityDto[] = isProfile(customer)
      ? PROFILE_ACTIVITY
      : orders.map(row => ({
          id: 'order-' + row.id,
          title: 'Tạo đơn ' + row.code,
          category: 'Đơn hàng',
          date: row.createdAt,
        }));
    return list(
      [...updates, ...activity].sort((a, b) => b.date.localeCompare(a.date)),
      'date'
    );
  }
  const debts = debtsOf(customer, orders);
  if (relation === 'debts') return list(debts, 'dueDate');
  if (relation !== 'summary') return undefined;
  const overdue = debts.filter(row => row.status === 'OVERDUE');
  const latest = orders[0];
  // The fixture is a ledger snapshot. Newer orders advance its reporting date.
  const cutoff = new Date(latest && latest.createdAt > PROFILE_AS_OF ? latest.createdAt : PROFILE_AS_OF);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  const summary: CustomerSummaryDto = {
    debtTotal: debts.reduce((sum, row) => sum + row.amount, 0),
    overdueTotal: overdue.reduce((sum, row) => sum + row.amount, 0),
    overdueCount: overdue.length,
    revenue12m: orders
      .filter(row => row.status === 'done' && Date.parse(row.createdAt) >= cutoff.getTime())
      .reduce((sum, row) => sum + row.total, 0),
    orderCount: orders.length,
    documentCount: documentMetadata(customer).length,
    lastOrder: latest ? { id: latest.id, code: latest.code, date: latest.createdAt, status: latest.status } : null,
    owner: isProfile(customer) ? { name: 'Trần Thu Hà', team: 'Kinh doanh miền Nam' } : { name: 'Nguyễn An', team: 'Chăm sóc khách hàng' },
  };
  return { body: summary };
}
