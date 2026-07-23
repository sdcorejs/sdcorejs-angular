import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EN_MESSAGES } = require('../projects/sdcorejs-angular/i18n/src/en.ts');
const { JA_MESSAGES } = require('../projects/sdcorejs-angular/i18n/src/ja.ts');
const { KO_MESSAGES } = require('../projects/sdcorejs-angular/i18n/src/ko.ts');
const { VI_MESSAGES } = require('../projects/sdcorejs-angular/i18n/src/vi.ts');
const { ZH_MESSAGES } = require('../projects/sdcorejs-angular/i18n/src/zh.ts');

const catalogs = {
  en: EN_MESSAGES,
  vi: VI_MESSAGES,
  ja: JA_MESSAGES,
  ko: KO_MESSAGES,
  zh: ZH_MESSAGES,
};
const canonicalKeys = Object.keys(EN_MESSAGES).sort();
const failures = [];

for (const [locale, messages] of Object.entries(catalogs)) {
  const keys = Object.keys(messages).sort();
  const missing = canonicalKeys.filter(key => !(key in messages));
  const extra = keys.filter(key => !(key in EN_MESSAGES));

  if (missing.length > 0) failures.push(`${locale}: missing ${missing.join(', ')}`);
  if (extra.length > 0) failures.push(`${locale}: extra ${extra.join(', ')}`);
}

if (failures.length > 0) {
  console.error('i18n parity violated:');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`i18n parity OK (${canonicalKeys.length} keys × ${Object.keys(catalogs).length} languages)`);
}
