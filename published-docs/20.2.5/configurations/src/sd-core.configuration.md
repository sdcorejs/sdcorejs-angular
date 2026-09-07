# `SD_CORE_CONFIGURATION`

**Type**: DI Token (`InjectionToken<ISdCoreConfiguration>`) + interface (`ISdCoreConfiguration`)
**Symbol**: `'sd-core.configuration'`
**Class / Token**: `SD_CORE_CONFIGURATION`
**Import path**: `@sdcorejs/angular/configurations`
**Provided in**: NOT provided by default — consumer app must register it in `app.config.ts`

## One-line purpose
Root-level configuration token for `@sdcorejs/angular` — carries global presentation preferences (number format, default language) shared by every component in the package.

## Interface

```ts
export interface ISdCoreConfiguration {
  format?: {
    number?: '1,234,567.89' | '1.234.567,89'; // Default: '1,234,567.89'
  };
  // Ngôn ngữ mặc định cho các message của Core UI.
  // - Language enum ('vi' | 'en' | 'ja' | 'ko' | 'zh') — dùng catalog built-in.
  // - Function () => Record<string, string> — custom catalog do portal tự định nghĩa.
  // Có thể bị override bởi localStorage (chỉ Language enum). Default: 'vi'.
  language?: Language | (() => Record<string, string>);
}

export const SD_CORE_CONFIGURATION = new InjectionToken<ISdCoreConfiguration>('sd-core.configuration');
```

## Field reference

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `format.number` | `'1,234,567.89' \| '1.234.567,89'` | `'1,234,567.89'` | Number-format style for the whole app. The `'.'` thousand / `','` decimal variant is the Vietnamese-locale default. |
| `language` | `Language \| (() => Record<string, string>)` | `'vi'` | Default language for Core UI messages. A `Language` enum value (`'vi' \| 'en' \| 'ja' \| 'ko' \| 'zh'`) selects a built-in catalog; a function returns a custom catalog owned by the portal. A `Language` value stored in `localStorage` wins over the configured enum; a custom catalog function is never overridden. |

## Setup

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { SD_CORE_CONFIGURATION, ISdCoreConfiguration } from '@sdcorejs/angular/configurations';

const sdCoreConfig: ISdCoreConfiguration = {
  language: 'vi',
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

- `I18nService`: resolves the active catalog from `language` (falling back to `localStorage`, then `'vi'`).
- Number-formatting pipes and form fields: pick the thousands/decimal separator from `format.number`.
- Components rendering currency/numeric values inherit the global format — individual components rarely override it.

To read the token in your own code:

```ts
import { inject } from '@angular/core';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';

const config = inject(SD_CORE_CONFIGURATION, { optional: true });
const numberFormat = config?.format?.number ?? '1,234,567.89';
```

## Anti-patterns
- Do NOT provide the token at a feature module / route level — it's a root singleton; provide it once in `ApplicationConfig`.
- Do NOT mutate the config object after providing it — `useValue` is read once at injection time.
- Do NOT expect a `licenseKey` field — the package is MIT and carries no license gate. The field, `SdLicenseService`, and `SdBaseSecureComponent` were removed; delete any leftover `licenseKey` from your config object.
