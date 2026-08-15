import { EN_MESSAGES } from './en';
import { JA_MESSAGES } from './ja';
import { KO_MESSAGES } from './ko';
import { VI_MESSAGES } from './vi';
import { ZH_MESSAGES } from './zh';
import type { Language } from '@sdcorejs/utils/models';

export const I18N_MESSAGES: Record<Language, Readonly<Record<string, string>>> = {
  vi: VI_MESSAGES,
  en: EN_MESSAGES,
  ja: JA_MESSAGES,
  ko: KO_MESSAGES,
  zh: ZH_MESSAGES,
};
