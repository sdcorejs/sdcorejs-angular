export type PartnerType = 'individual' | 'business';

export const PARTNER_TYPE_OPTIONS = [
  { value: 'individual', label: 'Cá nhân' },
  { value: 'business', label: 'Doanh nghiệp' },
] satisfies { value: PartnerType; label: string }[];

export interface PartnerDto {
  readonly id: string;
  readonly code: string;
  readonly type: PartnerType;
  readonly name: string;
  /** CCCD của cá nhân hoặc mã số thuế của doanh nghiệp. */
  readonly identity: string;
  readonly representative: string | null;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
}

export interface PartnerSaveReq {
  readonly code: string;
  readonly type: PartnerType;
  readonly name: string;
  readonly identity: string;
  readonly representative: string | null;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
}
