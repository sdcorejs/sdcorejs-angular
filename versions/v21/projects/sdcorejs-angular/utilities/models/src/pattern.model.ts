import { StringUtilities } from '@sdcorejs/angular/utilities/extensions';

export type SdPatternType = 'EMAIL' | 'PHONE' | 'PHONE_VN' | 'IDVN_OR_PASSPORT' | 'TIME';

export interface SdPatternCommon {
  type: SdPatternType;
  name: string;
  regex: string;
  errorMessage: string;
}

export const SdPatternCommons: SdPatternCommon[] = [
  {
    type: 'EMAIL',
    name: 'Email',
    regex: StringUtilities.REGEX_EMAIL,
    errorMessage: 'Email khÃ´ng há»£p lá»‡',
  },
  {
    type: 'PHONE',
    name: 'SÄT',
    regex: StringUtilities.REGEX_PHONE,
    errorMessage: 'Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng há»£p lá»‡',
  },
  {
    type: 'PHONE_VN',
    name: 'SÄT VN',
    regex: StringUtilities.REGEX_PHONE_VN,
    errorMessage: 'Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng há»£p lá»‡',
  },
  {
    type: 'IDVN_OR_PASSPORT',
    name: 'CCCD/Há»™ chiáº¿u',
    regex: StringUtilities.REGEX_IDVN_OR_PASSPORT,
    errorMessage: 'CCCD/CMND hoáº·c Há»™ chiáº¿u khÃ´ng há»£p lá»‡',
  },
  {
    type: 'TIME',
    name: 'Giá»',
    regex: StringUtilities.REGEX_TIME,
    errorMessage: 'Giá» khÃ´ng há»£p lá»‡ (Ä‘á»‹nh dáº¡ng HH:mm)',
  },
];

