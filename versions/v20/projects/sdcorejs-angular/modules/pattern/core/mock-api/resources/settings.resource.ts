import { PatternMockError, type PatternMockRecord, type PatternMockResource } from '../mock-api.model';

export interface MockSettings extends PatternMockRecord {
  readonly storeName: string;
  readonly hotline: string;
  readonly address: string;
  readonly currency: string;
  readonly orderPrefix: string;
  readonly autoConfirm: boolean;
  readonly lowStockThreshold: number;
  readonly emailNotify: boolean;
  readonly smsNotify: boolean;
  readonly notifyEmail: string;
  readonly sessionMinutes: number;
  readonly twoFactor: boolean;
  readonly updatedAt: string;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** `settings`: one record. `GET settings` reads it, `PUT settings` replaces it. */
export const SETTINGS_RESOURCE: PatternMockResource<MockSettings> = {
  name: 'settings',
  seed: () => [
    {
      id: 'default',
      storeName: 'Cửa hàng mẫu SDCoreJS',
      hotline: '1900 6868',
      address: '12 Lê Lợi, Quận 1, TP.HCM',
      currency: 'VND',
      orderPrefix: 'ĐH',
      autoConfirm: false,
      lowStockThreshold: 10,
      emailNotify: true,
      smsNotify: false,
      notifyEmail: 'vanhanh@cuahang.vn',
      sessionMinutes: 30,
      twoFactor: false,
      updatedAt: new Date(2026, 9, 24, 9, 30).toISOString(),
    },
  ],
  route: (method, segments, _query, body, context) => {
    if (segments.length) return undefined;
    const current = context.collection<MockSettings>('settings')[0];
    if (method === 'GET') return { body: current };
    if (method !== 'PUT') return undefined;
    const errors: { field: string; message: string }[] = [];
    if (!text(body['storeName'])) errors.push({ field: 'storeName', message: 'Nhập tên cửa hàng.' });
    if (!text(body['orderPrefix'])) errors.push({ field: 'orderPrefix', message: 'Nhập tiền tố mã đơn.' });
    const minutes = Number(body['sessionMinutes']);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) errors.push({ field: 'sessionMinutes', message: 'Từ 5 đến 480 phút.' });
    if (errors.length) throw new PatternMockError(400, { message: 'Dữ liệu chưa hợp lệ.', errors });
    const updated: MockSettings = {
      ...current,
      ...(body as Partial<MockSettings>),
      id: current.id,
      updatedAt: context.now().toISOString(),
    };
    context.save('settings', [updated]);
    return { body: updated };
  },
};
