/**
 * Permission codes of the pattern screens: `PATTERN_<ENTITY>_<R|C|U|D>_<ACTION>`.
 * R reads, C creates, U changes a record (update and every status action), D deletes.
 * Features write the code itself in `data.permission` and `*sdPermission`; this list only feeds the sample roles.
 */
export const PATTERN_PERMISSION_CODES = [
  'PATTERN_PRODUCT_R_LIST',
  'PATTERN_PRODUCT_R_DETAIL',
  'PATTERN_PRODUCT_C_CREATE',
  'PATTERN_PRODUCT_U_UPDATE',
  'PATTERN_PRODUCT_C_IMPORT',
  'PATTERN_PRODUCT_R_EXPORT',
  'PATTERN_PRODUCT_R_MENU',
  'PATTERN_CUSTOMER_R_LIST',
  'PATTERN_CUSTOMER_R_DETAIL',
  'PATTERN_CUSTOMER_C_CREATE',
  'PATTERN_CUSTOMER_U_UPDATE',
  'PATTERN_CUSTOMER_D_DELETE',
  'PATTERN_ORDER_R_LIST',
  'PATTERN_ORDER_R_DETAIL',
  'PATTERN_ORDER_C_CREATE',
  'PATTERN_ORDER_U_UPDATE',
  'PATTERN_ORDER_U_SUBMIT',
  'PATTERN_ORDER_U_APPROVE',
  'PATTERN_ORDER_U_REJECT',
  'PATTERN_ORDER_U_CONFIRM',
  'PATTERN_ORDER_U_CANCEL',
  'PATTERN_ORDER_R_PRINT',
  'PATTERN_ORDER_R_EXPORT',
  'PATTERN_APPROVAL_R_LIST',
  'PATTERN_APPROVAL_R_DETAIL',
  'PATTERN_APPROVAL_U_APPROVE',
  'PATTERN_APPROVAL_U_REJECT',
  'PATTERN_CATEGORY_R_LIST',
  'PATTERN_CATEGORY_C_CREATE',
  'PATTERN_CATEGORY_U_UPDATE',
  'PATTERN_CATEGORY_D_DELETE',
  'PATTERN_IMPORT_C_IMPORT',
  'PATTERN_PARTNER_C_CREATE',
  'PATTERN_SETTINGS_R_DETAIL',
  'PATTERN_SETTINGS_U_UPDATE',
] as const;

export type PatternPermissionCode = (typeof PATTERN_PERMISSION_CODES)[number];

export type PatternRole = 'admin' | 'staff' | 'viewer';

export const PATTERN_ROLES: readonly { readonly value: PatternRole; readonly label: string; readonly description: string }[] = [
  { value: 'admin', label: 'Quản trị', description: 'Toàn quyền' },
  { value: 'staff', label: 'Nhân viên', description: 'Không xoá, không duyệt' },
  { value: 'viewer', label: 'Chỉ xem', description: 'Chỉ xem danh sách và chi tiết' },
];

const DECISIONS = /_U_(APPROVE|REJECT)$/;

/** The permission codes a sample role holds. */
export function patternPermissionsOf(role: PatternRole): string[] {
  switch (role) {
    case 'admin':
      return [...PATTERN_PERMISSION_CODES];
    case 'staff':
      return PATTERN_PERMISSION_CODES.filter(code => !code.includes('_D_') && !DECISIONS.test(code));
    case 'viewer':
      return PATTERN_PERMISSION_CODES.filter(code => code.includes('_R_'));
  }
}
