import { PatternMockError, type PatternMockRecord, type PatternMockResource } from '../mock-api.model';
import { createPrng, pickWith } from '../prng';
import { PERSON_NAMES } from './names';

export interface MockApproval extends PatternMockRecord {
  readonly code: string;
  readonly title: string;
  readonly requester: string;
  readonly department: string;
  readonly amount: number;
  readonly submittedAt: string;
  readonly status: 'pending' | 'approved' | 'rejected';
  readonly reason: string | null;
  readonly note: string | null;
}

const TITLES = [
  'Thanh toán tiền thuê kho',
  'Tạm ứng công tác',
  'Mua văn phòng phẩm',
  'Thanh toán nhà cung cấp',
  'Chi phí quảng cáo',
  'Sửa chữa xe giao hàng',
  'Mua thiết bị IT',
  'Chi phí tiếp khách',
];
const DEPARTMENTS = ['Kinh doanh', 'Kho vận', 'Kế toán', 'Marketing', 'Hành chính'];

const decide = (current: MockApproval, status: 'approved' | 'rejected', reason: string | null): MockApproval => {
  if (current.status !== 'pending') throw new PatternMockError(409, { message: `${current.code} đã được xử lý.` });
  return { ...current, status, reason };
};

/** `approvals`: 30 đề nghị thanh toán, 18 đang chờ duyệt. Actions `approve`, `reject` (reason). */
export const APPROVAL_RESOURCE: PatternMockResource<MockApproval> = {
  name: 'approvals',
  fieldTypes: { submittedAt: 'date' },
  seed: () => {
    const random = createPrng(20261104);
    const pick = pickWith(random);
    return Array.from({ length: 30 }, (_, index) => {
      const submitted = new Date(2026, 9, 24, 17 - (index % 8), 0);
      submitted.setDate(24 - Math.floor(index / 3));
      const status = index < 18 ? 'pending' : index % 2 === 0 ? 'approved' : 'rejected';
      return {
        id: String(index + 1),
        code: `ĐN-${String(130 - index).padStart(4, '0')}`,
        title: pick(TITLES),
        requester: pick(PERSON_NAMES),
        department: pick(DEPARTMENTS),
        amount: Math.round((500_000 + random() * 49_500_000) / 1000) * 1000,
        submittedAt: submitted.toISOString(),
        status,
        reason: status === 'rejected' ? 'Thiếu chứng từ.' : null,
        note: index % 4 === 0 ? 'Cần thanh toán trước cuối tháng.' : null,
      };
    });
  },
  actions: {
    approve: current => decide(current, 'approved', null),
    reject: (current, body) => {
      const reason = typeof body['reason'] === 'string' ? body['reason'].trim() : '';
      if (!reason)
        throw new PatternMockError(400, { message: 'Nhập lý do từ chối.', errors: [{ field: 'reason', message: 'Nhập lý do từ chối.' }] });
      return decide(current, 'rejected', reason);
    },
  },
};
