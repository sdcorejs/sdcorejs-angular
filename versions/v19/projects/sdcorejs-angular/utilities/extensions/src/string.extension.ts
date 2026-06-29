import { StringUtilities as _Utils, ValidationUtilities } from '@sdcorejs/utils/fns';

export { ValidationUtilities };

// Deprecated wrappers — moved to ValidationUtilities
const isValidEmail = (value: any) => ValidationUtilities.isEmail(value);
const isValidPhone = (value: any) => ValidationUtilities.isPhone(value);
const isValidCode = (value: any) => ValidationUtilities.isCode(value);

export const StringUtilities = {
  ..._Utils,
  // Deprecated aliases for renamed regex constants (renamed in @sdcorejs/utils v1.0.2)
  /** @deprecated Use REGEX_VN_PHONE instead */
  REGEX_PHONE_VN: _Utils.REGEX_VN_PHONE,
  /** @deprecated Use REGEX_VN_ID instead */
  REGEX_IDVN: _Utils.REGEX_VN_ID,
  /** @deprecated Use REGEX_VN_ID_OR_PASSPORT instead */
  REGEX_IDVN_OR_PASSPORT: _Utils.REGEX_VN_ID_OR_PASSPORT,
  // Deprecated validators — moved to ValidationUtilities
  /** @deprecated Use {@link ValidationUtilities.isEmail} instead */
  isValidEmail,
  /** @deprecated Use {@link ValidationUtilities.isPhone} instead */
  isValidPhone,
  /** @deprecated Use {@link ValidationUtilities.isCode} instead */
  isValidCode,
};
