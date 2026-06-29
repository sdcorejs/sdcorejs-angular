import type { ValidationPatternType, ValidationPattern } from '@sdcorejs/utils/models';
import { VALIDATION_PATTERNS } from '@sdcorejs/utils/constants';
import { StringUtilities } from '@sdcorejs/utils/fns';
export type { ValidationPatternType, ValidationPattern };
export { VALIDATION_PATTERNS };

/**
 * @deprecated Use {@link ValidationPatternType} from `@sdcorejs/utils/models` instead.
 * Note: member names changed — PHONE_VN → VN_PHONE, IDVN → VN_ID, IDVN_OR_PASSPORT → VN_ID_OR_PASSPORT.
 */
export type SdPatternType = 'EMAIL' | 'PHONE' | 'PHONE_VN' | 'IDVN' | 'PASSPORT' | 'IDVN_OR_PASSPORT' | 'TIME';

/**
 * @deprecated Use {@link ValidationPattern} from `@sdcorejs/utils/models` instead.
 * Note: `regex` field renamed to `pattern` to align with Angular `Validators.pattern()`.
 */
export interface SdPatternCommon {
  type: SdPatternType;
  name: string;
  regex: string;
  errorMessage: string;
}

// `name` và `errorMessage` chứa i18n KEY (không phải chuỗi đã dịch).
/** @deprecated Use `VALIDATION_PATTERNS` from `@sdcorejs/utils/constants` instead. */
export const SdPatternCommons: SdPatternCommon[] = [
  { type: 'EMAIL', name: 'core.validator.email.name', regex: StringUtilities.REGEX_EMAIL, errorMessage: 'core.validator.email.error' },
  { type: 'PHONE', name: 'core.validator.phone.name', regex: StringUtilities.REGEX_PHONE, errorMessage: 'core.validator.phone.error' },
  {
    type: 'PHONE_VN',
    name: 'core.validator.phone-vn.name',
    regex: StringUtilities.REGEX_VN_PHONE,
    errorMessage: 'core.validator.phone-vn.error',
  },
  { type: 'IDVN', name: 'core.validator.cccd.name', regex: StringUtilities.REGEX_VN_ID, errorMessage: 'core.validator.cccd.error' },
  {
    type: 'PASSPORT',
    name: 'core.validator.passport.name',
    regex: StringUtilities.REGEX_PASSPORT,
    errorMessage: 'core.validator.passport.error',
  },
  {
    type: 'IDVN_OR_PASSPORT',
    name: 'core.validator.id-vn.name',
    regex: StringUtilities.REGEX_VN_ID_OR_PASSPORT,
    errorMessage: 'core.validator.id-vn.error',
  },
  { type: 'TIME', name: 'core.validator.time.name', regex: StringUtilities.REGEX_TIME, errorMessage: 'core.validator.time.error' },
];
