/** Cài đặt cửa hàng: một bản ghi, không có danh sách. */
export interface SettingsDto {
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

export type SettingsSaveReq = Omit<SettingsDto, 'updatedAt'>;
