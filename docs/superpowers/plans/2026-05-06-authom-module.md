# AuthOM Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triá»ƒn khai module `authom` trong thÆ° viá»‡n `sd-angular`, mirror cáº¥u trÃºc module `keycloak` hiá»‡n cÃ³. Consumer khá»Ÿi táº¡o báº±ng `provideSdAuthOm({ useFactory: ... })`, login/logout/silent-refresh chuáº©n OAuth 2.0 + PKCE.

**Architecture:** OAuth 2.0 Authorization Code Flow + PKCE, gá»i tháº³ng AuthOM (khÃ´ng cáº§n BE proxy). Silent refresh qua iframe áº©n + file `silent-authom.html` tÄ©nh + session cookie. Token chá»‰ lÆ°u RAM (Angular signals). Auto-refresh trÆ°á»›c khi JWT `exp` báº±ng `setTimeout`.

**Tech Stack:** Angular 19 (standalone API + NgModule legacy), Web Crypto API (`crypto.subtle.digest`, `crypto.getRandomValues`, `crypto.randomUUID`), TypeScript, ng-packagr secondary entry point.

**Spec reference:** `docs/superpowers/specs/2026-05-05-authom-module-design.md`

---

## File Structure

**Create:**
- `projects/sdcorejs-angular/modules/authom/authom.configuration.ts` â€” interface `SdAuthOmTenantConfig`, `ISdAuthOmConfiguration`, token `SD_AUTHOM_CONFIGURATION`.
- `projects/sdcorejs-angular/modules/authom/authom.service.ts` â€” `SdAuthOmService` (init/login/logout/silentRefresh/handleCallback + auto-refresh timer + PKCE helpers).
- `projects/sdcorejs-angular/modules/authom/authom.interceptor.ts` â€” `SdAuthOmInterceptor` (functional) + `matchGlob` helper.
- `projects/sdcorejs-angular/modules/authom/authom.module.ts` â€” `provideSdAuthOm()` + `SdAuthOmModule.forRoot()`.
- `projects/sdcorejs-angular/modules/authom/index.ts` â€” re-export public API.
- `projects/sdcorejs-angular/modules/authom/ng-package.json` â€” secondary entry point cho ng-packagr.
- `projects/sdcorejs-angular/modules/authom/silent-authom.html` â€” file tÄ©nh template, consumer copy vÃ o `public/`.

**Modify:**
- `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts` â€” thÃªm `sha256(input: string): Promise<string>` vÃ o `StringUtilities`.
- `projects/sdcorejs-angular/modules/index.ts` â€” thÃªm `export * from '@sdcorejs/angular/modules/authom';`.

---

## Task 1: ThÃªm `sha256` vÃ o `StringUtilities`

**Files:**
- Modify: `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts`

- [ ] **Step 1: ThÃªm hÃ m `sha256` ngay trÆ°á»›c khá»‘i `export const StringUtilities`**

Má»Ÿ `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts`, tÃ¬m dÃ²ng 198 (dÃ²ng trá»‘ng ngay trÆ°á»›c `export const StringUtilities = {`). ThÃªm hÃ m sau vÃ o dÃ²ng Ä‘Ã³:

```ts
const sha256 = async (input: string): Promise<string> => {
  const buffer = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

```

- [ ] **Step 2: Export `sha256` qua `StringUtilities`**

Trong cÃ¹ng file, tÃ¬m khá»‘i `export const StringUtilities = { ... }` (dÃ²ng 199 trá»Ÿ Ä‘i). ThÃªm `sha256,` vÃ o cuá»‘i danh sÃ¡ch (sau `generateUniqueCode,`):

```ts
export const StringUtilities = {
  REGEX_EMAIL,
  REGEX_PHONE,
  REGEX_PHONE_VN,
  REGEX_IDVN_OR_PASSPORT,
  REGEX_TIME,
  isValidEmail,
  isValidPhone,
  isValidCode,
  changeAliasLowerCase,
  aliasIncludes,
  format,
  templateToDisplay,
  parseExpression,
  encrypt,
  decrypt,
  isNullOrEmpty,
  isNullOrWhiteSpace,
  convertToSnakeCaseCode,
  generateUniqueCode,
  sha256,
};
```

- [ ] **Step 3: Build sd-angular Ä‘á»ƒ verify thay Ä‘á»•i khÃ´ng phÃ¡ vá»¡ gÃ¬**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success, khÃ´ng cÃ³ TypeScript error.

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts
git commit -m "SM-00: ThÃªm StringUtilities.sha256 Ä‘á»ƒ há»— trá»£ PKCE"
```

---

## Task 2: Táº¡o `authom.configuration.ts`

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/authom.configuration.ts`

- [ ] **Step 1: Táº¡o file configuration**

Táº¡o file `projects/sdcorejs-angular/modules/authom/authom.configuration.ts` vá»›i ná»™i dung:

```ts
import { InjectionToken } from '@angular/core';

export interface SdAuthOmTenantConfig {
  domain: string;
  clientId: string;

  redirectUri?: string;
  audience?: string;
  organization?: string;
  scope?: string;

  secureRoutes?: string[];

  silentRefreshRedirectUri?: string;
  refreshThresholdSeconds?: number;
  authorizeTimeoutInSeconds?: number;
}

export interface ISdAuthOmConfiguration {
  loadTenantConfig: () => Promise<SdAuthOmTenantConfig>;
}

export const SD_AUTHOM_CONFIGURATION = new InjectionToken<ISdAuthOmConfiguration>('sd-authom.configuration');
```

- [ ] **Step 2: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.configuration.ts
git commit -m "SM-00: ThÃªm authom configuration interface + injection token"
```

---

## Task 3: Táº¡o `silent-authom.html`

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/silent-authom.html`

- [ ] **Step 1: Táº¡o file HTML tÄ©nh cho silent refresh iframe**

Táº¡o file `projects/sdcorejs-angular/modules/authom/silent-authom.html` vá»›i ná»™i dung:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AuthOM Silent Refresh</title>
</head>
<body>
<script>
  (function () {
    if (window.parent === window) return;

    var params = new URLSearchParams(window.location.search);
    var code = params.get('code');
    var state = params.get('state');
    var error = params.get('error');

    window.parent.postMessage(
      code
        ? { type: 'AUTHOM_SILENT_SUCCESS', code: code, state: state }
        : { type: 'AUTHOM_SILENT_ERROR', error: error || 'no_code' },
      window.location.origin
    );
  })();
</script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/silent-authom.html
git commit -m "SM-00: ThÃªm silent-authom.html template cho iframe refresh"
```

---

## Task 4: Táº¡o skeleton `authom.service.ts` (state + getter)

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: Táº¡o file service skeleton**

Táº¡o file `projects/sdcorejs-angular/modules/authom/authom.service.ts` vá»›i ná»™i dung:

```ts
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SdAuthOmTenantConfig } from './authom.configuration';

const STORAGE_KEY_STATE = 'authom_state';
const STORAGE_KEY_CODE_VERIFIER = 'authom_code_verifier';
const STORAGE_KEY_RETURN_TO = 'authom_return_to';

const DEFAULT_SCOPE = 'openid profile email';
const DEFAULT_REFRESH_THRESHOLD_SECONDS = 30;
const DEFAULT_AUTHORIZE_TIMEOUT_SECONDS = 5;

@Injectable({ providedIn: 'root' })
export class SdAuthOmService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly accessToken = signal<string | null>(null);
  readonly idTokenClaims = signal<Record<string, unknown> | null>(null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  config!: SdAuthOmTenantConfig;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  getAccessToken(): string | null {
    return this.accessToken();
  }
}
```

- [ ] **Step 2: Build Ä‘á»ƒ verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.service.ts
git commit -m "SM-00: Khá»Ÿi táº¡o SdAuthOmService skeleton vá»›i state signals"
```

---

## Task 5: ThÃªm PKCE + URL helpers vÃ o service

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: ThÃªm import StringUtilities**

Sá»­a dÃ²ng `import { SdAuthOmTenantConfig } from './authom.configuration';` thÃ nh:

```ts
import { SdAuthOmTenantConfig } from './authom.configuration';
import { StringUtilities } from '../../utilities/extensions/src/string.extension';
```

- [ ] **Step 2: ThÃªm cÃ¡c private helper trong class**

ThÃªm cÃ¡c method sau vÃ o trong class `SdAuthOmService`, ngay sau method `getAccessToken()`:

```ts
  private base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private generateCodeVerifier(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return this.base64UrlEncode(bytes);
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    return StringUtilities.sha256(verifier);
  }

  private buildAuthorizeUrl(params: {
    state: string;
    codeChallenge: string;
    redirectUri: string;
    prompt?: 'none';
  }): string {
    const search = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: params.redirectUri,
      state: params.state,
      code_challenge: params.codeChallenge,
      code_challenge_method: 'S256',
      scope: this.config.scope || DEFAULT_SCOPE,
    });
    if (this.config.audience) search.set('audience', this.config.audience);
    if (this.config.organization) search.set('organization', this.config.organization);
    if (params.prompt) search.set('prompt', params.prompt);
    return `https://${this.config.domain}/authorize?${search.toString()}`;
  }

  private getDefaultRedirectUri(): string {
    return this.config.redirectUri || window.location.origin;
  }

  private getSilentRedirectUri(): string {
    return this.config.silentRefreshRedirectUri || `${window.location.origin}/silent-authom.html`;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(padded + '==='.slice((padded.length + 3) % 4));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
```

- [ ] **Step 3: Build verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.service.ts
git commit -m "SM-00: ThÃªm PKCE + URL helpers cho SdAuthOmService"
```

---

## Task 6: Implement `login()` + `logout()`

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: ThÃªm method `login` vÃ  `logout`**

ThÃªm cÃ¡c method sau vÃ o trong class `SdAuthOmService`, ngay sau `decodeJwtPayload`:

```ts
  async login(options?: { returnTo?: string }): Promise<void> {
    if (!this.isBrowser) return;

    const state = crypto.randomUUID();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const returnTo = options?.returnTo || (window.location.pathname + window.location.search);

    sessionStorage.setItem(STORAGE_KEY_STATE, state);
    sessionStorage.setItem(STORAGE_KEY_CODE_VERIFIER, codeVerifier);
    sessionStorage.setItem(STORAGE_KEY_RETURN_TO, returnTo);

    window.location.href = this.buildAuthorizeUrl({
      state,
      codeChallenge,
      redirectUri: this.getDefaultRedirectUri(),
    });
  }

  logout(options?: { returnTo?: string }): void {
    if (!this.isBrowser) return;

    this.accessToken.set(null);
    this.idTokenClaims.set(null);
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const returnTo = options?.returnTo || window.location.origin;
    const search = new URLSearchParams({
      client_id: this.config.clientId,
      returnTo,
    });
    window.location.href = `https://${this.config.domain}/v2/logout?${search.toString()}`;
  }
```

- [ ] **Step 2: Build verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.service.ts
git commit -m "SM-00: ThÃªm login() vÃ  logout() cho SdAuthOmService"
```

---

## Task 7: Implement `exchangeCode` + auto-refresh timer

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: ThÃªm `exchangeCode` vÃ  `scheduleRefresh`**

ThÃªm cÃ¡c method sau vÃ o trong class `SdAuthOmService`, ngay sau `logout`:

```ts
  private async exchangeCode(code: string, codeVerifier: string, redirectUri: string): Promise<boolean> {
    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        client_id: this.config.clientId,
      });
      const res = await fetch(`https://${this.config.domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) return false;
      const data = await res.json() as { access_token?: string; id_token?: string };
      if (!data.access_token) return false;

      this.accessToken.set(data.access_token);
      if (data.id_token) {
        this.idTokenClaims.set(this.decodeJwtPayload(data.id_token));
      }
      this.scheduleRefresh(data.access_token);
      return true;
    } catch {
      return false;
    }
  }

  private scheduleRefresh(token: string): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    const claims = this.decodeJwtPayload(token);
    const exp = claims?.['exp'];
    if (typeof exp !== 'number') {
      console.warn('[SdAuthOmService] Token khÃ´ng cÃ³ exp â€” bá» qua auto-refresh');
      return;
    }
    const threshold = this.config.refreshThresholdSeconds ?? DEFAULT_REFRESH_THRESHOLD_SECONDS;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const delayMs = Math.max(0, (exp - nowSeconds - threshold) * 1000);
    this.refreshTimer = setTimeout(() => {
      this.silentRefresh();
    }, delayMs);
  }
```

- [ ] **Step 2: Build verify (sáº½ bÃ¡o lá»—i `silentRefresh` chÆ°a tá»“n táº¡i â€” Ä‘Ã³ lÃ  expected, sáº½ thÃªm á»Ÿ Task 8)**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: error `Property 'silentRefresh' does not exist on type 'SdAuthOmService'`. **KhÃ´ng commit** á»Ÿ task nÃ y â€” tiáº¿p tá»¥c Task 8.

---

## Task 8: Implement `silentRefresh()`

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: ThÃªm method `silentRefresh`**

ThÃªm method sau vÃ o trong class `SdAuthOmService`, ngay sau `scheduleRefresh`:

```ts
  silentRefresh(): Promise<boolean> {
    if (!this.isBrowser) return Promise.resolve(false);

    return new Promise(async (resolve) => {
      const state = crypto.randomUUID();
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const redirectUri = this.getSilentRedirectUri();
      const timeoutMs = (this.config.authorizeTimeoutInSeconds ?? DEFAULT_AUTHORIZE_TIMEOUT_SECONDS) * 1000;

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';

      let done = false;
      const finish = (success: boolean) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        iframe.remove();
        window.removeEventListener('message', onMessage);
        resolve(success);
      };

      const timer = setTimeout(() => finish(false), timeoutMs);

      const onMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        const data = event.data as { type?: string; code?: string; state?: string } | null;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'AUTHOM_SILENT_SUCCESS' && data.code && data.state === state) {
          const ok = await this.exchangeCode(data.code, codeVerifier, redirectUri);
          if (!ok) {
            this.accessToken.set(null);
            this.idTokenClaims.set(null);
          }
          finish(ok);
        } else if (data.type === 'AUTHOM_SILENT_ERROR') {
          this.accessToken.set(null);
          this.idTokenClaims.set(null);
          finish(false);
        }
      };

      window.addEventListener('message', onMessage);

      iframe.src = this.buildAuthorizeUrl({
        state,
        codeChallenge,
        redirectUri,
        prompt: 'none',
      });
      document.body.appendChild(iframe);
    });
  }
```

- [ ] **Step 2: Build verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 3: Commit gá»™p Task 7 + 8**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.service.ts
git commit -m "SM-00: ThÃªm exchangeCode, scheduleRefresh, silentRefresh"
```

---

## Task 9: Implement `handleCallback()` + `init()`

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: ThÃªm `handleCallback` vÃ  `init`**

ThÃªm 2 method sau vÃ o trong class `SdAuthOmService`, ngay sau `silentRefresh`:

```ts
  async handleCallback(): Promise<boolean> {
    if (!this.isBrowser) return false;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code) return false;

    const savedState = sessionStorage.getItem(STORAGE_KEY_STATE);
    const codeVerifier = sessionStorage.getItem(STORAGE_KEY_CODE_VERIFIER);
    const returnTo = sessionStorage.getItem(STORAGE_KEY_RETURN_TO);
    sessionStorage.removeItem(STORAGE_KEY_STATE);
    sessionStorage.removeItem(STORAGE_KEY_CODE_VERIFIER);

    if (state !== savedState || !codeVerifier) {
      window.history.replaceState({}, '', window.location.pathname);
      sessionStorage.removeItem(STORAGE_KEY_RETURN_TO);
      return false;
    }

    const redirectUri = this.getDefaultRedirectUri();
    const ok = await this.exchangeCode(code, codeVerifier, redirectUri);

    if (returnTo) {
      sessionStorage.removeItem(STORAGE_KEY_RETURN_TO);
      window.history.replaceState({}, '', returnTo);
    } else {
      window.history.replaceState({}, '', window.location.pathname);
    }

    return ok;
  }

  async init(config: SdAuthOmTenantConfig): Promise<boolean> {
    this.config = config;
    if (!this.isBrowser) return false;

    const hasCode = new URLSearchParams(window.location.search).has('code');
    if (hasCode) {
      const ok = await this.handleCallback();
      if (ok) return true;
    }

    return this.silentRefresh();
  }
```

- [ ] **Step 2: Build verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.service.ts
git commit -m "SM-00: ThÃªm handleCallback vÃ  init cho SdAuthOmService"
```

---

## Task 10: Táº¡o `authom.interceptor.ts`

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/authom.interceptor.ts`

- [ ] **Step 1: Táº¡o interceptor**

Táº¡o file `projects/sdcorejs-angular/modules/authom/authom.interceptor.ts` vá»›i ná»™i dung:

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SdAuthOmService } from './authom.service';

const escapeRegExp = (str: string): string => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

export const matchGlob = (pattern: string, url: string): boolean => {
  const regexBody = pattern.split('*').map(escapeRegExp).join('.*');
  return new RegExp(`^${regexBody}$`).test(url);
};

export const SdAuthOmInterceptor: HttpInterceptorFn = (req, next) => {
  const authom = inject(SdAuthOmService);
  const token = authom.getAccessToken();
  const config = authom.config;

  if (!token || !config) return next(req);

  const isSecure = config.secureRoutes?.some(pattern => matchGlob(pattern, req.url));
  if (!isSecure) return next(req);

  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });
  return next(authReq);
};
```

- [ ] **Step 2: Build verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.interceptor.ts
git commit -m "SM-00: ThÃªm SdAuthOmInterceptor vá»›i glob match cho secureRoutes"
```

---

## Task 11: Táº¡o `authom.module.ts`

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/authom.module.ts`

- [ ] **Step 1: Táº¡o module vá»›i `provideSdAuthOm` vÃ  `SdAuthOmModule.forRoot`**

Táº¡o file `projects/sdcorejs-angular/modules/authom/authom.module.ts` vá»›i ná»™i dung:

```ts
import {
  ModuleWithProviders,
  NgModule,
  Provider,
  Type,
  EnvironmentProviders,
  makeEnvironmentProviders,
  provideAppInitializer,
  inject,
  APP_INITIALIZER,
} from '@angular/core';
import { ISdAuthOmConfiguration, SD_AUTHOM_CONFIGURATION } from './authom.configuration';
import { SdAuthOmService } from './authom.service';

interface ProvideOptions {
  useClass?: Type<ISdAuthOmConfiguration>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory?: (...args: any[]) => ISdAuthOmConfiguration;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps?: any[];
}

export function provideSdAuthOm(options: ProvideOptions): EnvironmentProviders {
  const providers: Array<Provider | EnvironmentProviders> = [SdAuthOmService];

  if (options.useFactory) {
    providers.push({ provide: SD_AUTHOM_CONFIGURATION, useFactory: options.useFactory, deps: options.deps || [] });
  } else if (options.useClass) {
    providers.push({ provide: SD_AUTHOM_CONFIGURATION, useClass: options.useClass });
  }

  providers.push(
    provideAppInitializer(() => {
      const configLoader = inject(SD_AUTHOM_CONFIGURATION);
      const authom = inject(SdAuthOmService);
      return configLoader.loadTenantConfig().then((config) => authom.init(config));
    })
  );

  return makeEnvironmentProviders(providers);
}

@NgModule({})
export class SdAuthOmModule {
  static forRoot(options: ProvideOptions): ModuleWithProviders<SdAuthOmModule> {
    return {
      ngModule: SdAuthOmModule,
      providers: [
        SdAuthOmService,
        ...(options.useFactory
          ? [{ provide: SD_AUTHOM_CONFIGURATION, useFactory: options.useFactory, deps: options.deps || [] }]
          : [{ provide: SD_AUTHOM_CONFIGURATION, useClass: options.useClass! }]
        ),
        {
          provide: APP_INITIALIZER,
          multi: true,
          useFactory: () => {
            const configLoader = inject(SD_AUTHOM_CONFIGURATION);
            const authom = inject(SdAuthOmService);
            return () => configLoader.loadTenantConfig().then((config) => authom.init(config));
          },
        },
      ],
    };
  }
}
```

- [ ] **Step 2: Build verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.module.ts
git commit -m "SM-00: ThÃªm provideSdAuthOm vÃ  SdAuthOmModule.forRoot"
```

---

## Task 12: Táº¡o `index.ts` + `ng-package.json` cho secondary entry

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/index.ts`
- Create: `projects/sdcorejs-angular/modules/authom/ng-package.json`

- [ ] **Step 1: Táº¡o `index.ts`**

Táº¡o file `projects/sdcorejs-angular/modules/authom/index.ts` vá»›i ná»™i dung:

```ts
export * from './authom.configuration';
export * from './authom.service';
export * from './authom.interceptor';
export * from './authom.module';
```

- [ ] **Step 2: Táº¡o `ng-package.json`**

Táº¡o file `projects/sdcorejs-angular/modules/authom/ng-package.json` vá»›i ná»™i dung:

```json
{
  "$schema": "../../../../node_modules/ng-packagr/ng-package.schema.json",
  "lib": {
    "entryFile": "index.ts"
  }
}
```

- [ ] **Step 3: Build verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success. Trong output dist sáº½ cÃ³ `dist/sdcorejs-angular/modules/authom/` vá»›i `.d.ts`/`.mjs`.

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/index.ts projects/sdcorejs-angular/modules/authom/ng-package.json
git commit -m "SM-00: ThÃªm secondary entry point cho module authom"
```

---

## Task 13: Re-export module authom tá»« `modules/index.ts`

**Files:**
- Modify: `projects/sdcorejs-angular/modules/index.ts`

- [ ] **Step 1: ThÃªm export cho authom**

Má»Ÿ `projects/sdcorejs-angular/modules/index.ts`. ThÃªm dÃ²ng sau vÃ o cuá»‘i file (sau `export * from '@sdcorejs/angular/modules/layout';`):

```ts
export * from '@sdcorejs/angular/modules/authom';
```

File sau khi sá»­a sáº½ lÃ :

```ts
export * from '@sdcorejs/angular/modules/keycloak';
export * from '@sdcorejs/angular/modules/permission';
export * from '@sdcorejs/angular/modules/auth';
export * from '@sdcorejs/angular/modules/layout';
export * from '@sdcorejs/angular/modules/authom';
```

- [ ] **Step 2: Build verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/modules/index.ts
git commit -m "SM-00: Re-export module authom tá»« modules barrel"
```

---

## Task 14: Final verification (production build + lint)

**Files:** none (verify-only)

- [ ] **Step 1: Production build**

```bash
npx ng build sdcorejs-angular --configuration production
```

Expected: build success, khÃ´ng cÃ³ error.

- [ ] **Step 2: Lint**

```bash
npx ng lint sd-angular
```

Expected: pass hoáº·c chá»‰ cÃ³ warnings khÃ´ng liÃªn quan tá»›i authom. Náº¿u cÃ³ error trong file authom â€” fix inline (Ä‘a sá»‘ sáº½ lÃ  `eslint-disable-next-line @typescript-eslint/no-explicit-any` Ä‘Ã£ cÃ³ sáºµn cho `useFactory` deps).

- [ ] **Step 3: Verify dist artifacts**

```bash
ls dist/sdcorejs-angular/modules/authom/
```

Expected: tháº¥y cÃ³ `index.d.ts` (hoáº·c `*.d.ts`), `package.json`, `index.mjs` (hoáº·c tÆ°Æ¡ng tá»±). Cáº¥u trÃºc giá»‘ng `dist/sdcorejs-angular/modules/keycloak/`.

- [ ] **Step 4: Verify smoke test public-api**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless
```

Expected: `public-api.spec.ts` pass (entry point load OK). Náº¿u test config khÃ´ng sáºµn ChromeHeadless â†’ bá» qua, khÃ´ng báº¯t buá»™c.

- [ ] **Step 5: Final commit (náº¿u cáº§n fix lint)**

Náº¿u cÃ³ thay Ä‘á»•i do lint fix:

```bash
git add -A
git commit -m "SM-00: Fix lint warnings cho module authom"
```

---

## Task 15: Document cÃ¡ch dÃ¹ng (README inline trong file index hoáº·c commit separate)

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/index.ts` (thÃªm header comment)

- [ ] **Step 1: ThÃªm header comment vÃ o index.ts**

Má»Ÿ `projects/sdcorejs-angular/modules/authom/index.ts`. Thay tháº¿ ná»™i dung thÃ nh:

```ts
/**
 * Module `authom` â€” OAuth 2.0 + PKCE authentication client cho AuthOM (Auth0-based).
 *
 * CÃ¡ch dÃ¹ng (standalone):
 * ```ts
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { provideSdAuthOm, SdAuthOmInterceptor } from '@sdcorejs/angular/modules/authom';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(withInterceptors([SdAuthOmInterceptor])),
 *     provideSdAuthOm({
 *       useFactory: () => ({
 *         loadTenantConfig: () => Promise.resolve({
 *           domain: 'login.example.com',
 *           clientId: 'YOUR_CLIENT_ID',
 *           audience: 'https://api.example.com',
 *           organization: 'org_xxx',
 *           scope: 'openid profile email offline_access',
 *           secureRoutes: ['https://api.example.com/*'],
 *         }),
 *       }),
 *     }),
 *   ],
 * };
 * ```
 *
 * YÃªu cáº§u setup thÃªm:
 * 1. Copy file `silent-authom.html` tá»« source module nÃ y vÃ o thÆ° má»¥c `public/` cá»§a app.
 * 2. App pháº£i cháº¡y trÃªn HTTPS (hoáº·c localhost) â€” Web Crypto API yÃªu cáº§u secure context.
 */
export * from './authom.configuration';
export * from './authom.service';
export * from './authom.interceptor';
export * from './authom.module';
```

- [ ] **Step 2: Build verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/index.ts
git commit -m "SM-00: ThÃªm hÆ°á»›ng dáº«n sá»­ dá»¥ng module authom vÃ o index.ts"
```

---

## Self-Review

**1. Spec coverage:**
- âœ… Section 3 (cáº¥u trÃºc file) â†’ Tasks 2, 3, 4, 10, 11, 12.
- âœ… Section 4 (configuration) â†’ Task 2.
- âœ… Section 5.1 (init) â†’ Task 9.
- âœ… Section 5.2 (login) â†’ Task 6.
- âœ… Section 5.3 (logout) â†’ Task 6.
- âœ… Section 5.4 (silentRefresh) â†’ Task 8.
- âœ… Section 5.5 (handleCallback) â†’ Task 9.
- âœ… Section 5.6 (auto-refresh timer / scheduleRefresh) â†’ Task 7.
- âœ… Section 6 (interceptor + matchGlob) â†’ Task 10.
- âœ… Section 7 (silent-authom.html) â†’ Task 3.
- âœ… Section 8 (module providers) â†’ Task 11.
- âœ… Section 9 (StringUtilities.sha256) â†’ Task 1.
- âœ… Section 10 (edge cases) â†’ handled in Tasks 4, 6, 7, 8, 9 (`isBrowser` guard, state mismatch return false, timeout, JWT exp missing â†’ log warn).
- âœ… Section 11 (public API export) â†’ Tasks 12, 13.
- âœ… Section 12 (usage example) â†’ Task 15.

**2. Placeholder scan:** KhÃ´ng cÃ³ TBD/TODO/"implement later". Má»i step cÃ³ code cá»¥ thá»ƒ hoáº·c command cá»¥ thá»ƒ.

**3. Type consistency:**
- `SdAuthOmTenantConfig`/`ISdAuthOmConfiguration`/`SD_AUTHOM_CONFIGURATION` â€” Ä‘á»‹nh nghÄ©a Task 2, dÃ¹ng nháº¥t quÃ¡n Tasks 9, 10, 11.
- `SdAuthOmService.config`, `accessToken`, `getAccessToken` â€” Ä‘á»‹nh nghÄ©a Task 4, dÃ¹ng Tasks 5, 6, 7, 8, 9, 10.
- `STORAGE_KEY_*` constants â€” Ä‘á»‹nh nghÄ©a Task 4, dÃ¹ng Tasks 6, 9.
- `DEFAULT_*` constants â€” Ä‘á»‹nh nghÄ©a Task 4, dÃ¹ng Tasks 5, 7, 8.
- Method signatures khá»›p giá»¯a task Ä‘á»‹nh nghÄ©a (5, 6, 7, 8, 9) vÃ  caller (Task 10 interceptor gá»i `getAccessToken`, Task 11 module gá»i `init`).
- `AUTHOM_SILENT_SUCCESS` / `AUTHOM_SILENT_ERROR` â€” postMessage type khá»›p giá»¯a Task 3 (`silent-authom.html`) vÃ  Task 8 (service `onMessage`).

Plan hoÃ n chá»‰nh, sáºµn sÃ ng thá»±c thi.

