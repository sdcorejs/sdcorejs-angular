# `SD_CORE_CONFIGURATION`

**Type**: DI Token (`InjectionToken<ISdCoreConfiguration>`) + interface (`ISdCoreConfiguration`)
**Symbol**: `'sd-core.configuration'`
**Class / Token**: `SD_CORE_CONFIGURATION`
**Import path**: `@sdcorejs/angular/configurations`
**Provided in**: NOT provided by default â€” consumer app must register it in `app.config.ts`

## One-line purpose
Root-level configuration token for `@sdcorejs/angular` â€” carries the per-domain license key(s) that unlock licensed features and global formatting preferences (e.g. number locale).

## Interface

```ts
export interface ISdCoreConfiguration {
  // License Key Ä‘Æ°á»£c cáº¥p theo domain/sub domain, vÃ­ dá»¥: domain.com, sub.domain.com
  // Domain localhost, 127.0.0.1 khÃ´ng cáº§n key
  // CÃ¡c domain DEV/QC/UAT/PROD ... cáº§n key tÆ°Æ¡ng á»©ng cho tá»«ng domain
  licenseKey?: string | string[];
  format?: {
    number?: '1,234,567.89' | '1.234.567,89'; // Default: '1,234,567.89'
  };
}

export const SD_CORE_CONFIGURATION = new InjectionToken<ISdCoreConfiguration>('sd-core.configuration');
```

## Field reference

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `licenseKey` | `string \| string[]` | â€” | License keys are issued per domain / subdomain (e.g. `domain.com`, `sub.domain.com`). `localhost` and `127.0.0.1` do NOT require a key. Each environment (DEV / QC / UAT / PROD) needs its matching key â€” provide an array if a build serves multiple domains. |
| `format.number` | `'1,234,567.89' \| '1.234.567,89'` | `'1,234,567.89'` | Number-format style for the whole app. The `'.'` thousand / `','` decimal variant is the Vietnamese-locale default. |

## Setup

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { SD_CORE_CONFIGURATION, ISdCoreConfiguration } from '@sdcorejs/angular/configurations';
import { environment } from '../environments/environment';

const sdCoreConfig: ISdCoreConfiguration = {
  licenseKey: environment.sdLicenseKeys, // string | string[]
  format: {
    number: '1.234.567,89', // optional; default is '1,234,567.89'
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: SD_CORE_CONFIGURATION, useValue: sdCoreConfig },
    // ... other providers (SdGlobalErrorHandler, SdNoInternetInterceptor, ...)
  ],
};
```

## Consumers

The token is read internally by `@sdcorejs/angular` services and components that need a global setting:

- License-gated components / features: validate `licenseKey` against current `window.location.hostname` at bootstrap.
- Number-formatting pipes and form fields: pick the thousands/decimal separator from `format.number`.
- Components rendering currency/numeric values inherit the global format â€” individual components rarely override it.

To read the token in your own code:

```ts
import { inject } from '@angular/core';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';

const config = inject(SD_CORE_CONFIGURATION, { optional: true });
const numberFormat = config?.format?.number ?? '1,234,567.89';
```

## Anti-patterns
- Do NOT hard-code a production license key in source â€” wire it via `environment.*.ts` so DEV/QC/UAT/PROD each get their own key.
- Do NOT provide the token at a feature module / route level â€” it's a root singleton; provide it once in `ApplicationConfig`.
- Do NOT pass `licenseKey: ''` on production builds expecting it to be a no-op â€” empty/missing key on a non-localhost domain is treated as unlicensed.
- Do NOT mutate the config object after providing it â€” `useValue` is read once at injection time.

