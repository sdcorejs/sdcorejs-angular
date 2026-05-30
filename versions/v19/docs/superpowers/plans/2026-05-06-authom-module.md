�# AuthOM Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TriỒn khai module `authom` trong thư vi�!n `sd-angular`, mirror cấu trúc module `keycloak` hi�!n có. Consumer kh�xi tạo bằng `provideSdAuthOm({ useFactory: ... })`, login/logout/silent-refresh chuẩn OAuth 2.0 + PKCE.

**Architecture:** OAuth 2.0 Authorization Code Flow + PKCE, gọi thẳng AuthOM (không cần BE proxy). Silent refresh qua iframe ẩn + file `silent-authom.html` tĩnh + session cookie. Token ch�0 lưu RAM (Angular signals). Auto-refresh trư�:c khi JWT `exp` bằng `setTimeout`.

**Tech Stack:** Angular 19 (standalone API + NgModule legacy), Web Crypto API (`crypto.subtle.digest`, `crypto.getRandomValues`, `crypto.randomUUID`), TypeScript, ng-packagr secondary entry point.

**Spec reference:** `docs/superpowers/specs/2026-05-05-authom-module-design.md`

---

## File Structure

**Create:**
- `projects/sdcorejs-angular/modules/authom/authom.configuration.ts` � interface `SdAuthOmTenantConfig`, `ISdAuthOmConfiguration`, token `SD_AUTHOM_CONFIGURATION`.
- `projects/sdcorejs-angular/modules/authom/authom.service.ts` � `SdAuthOmService` (init/login/logout/silentRefresh/handleCallback + auto-refresh timer + PKCE helpers).
- `projects/sdcorejs-angular/modules/authom/authom.interceptor.ts` � `SdAuthOmInterceptor` (functional) + `matchGlob` helper.
- `projects/sdcorejs-angular/modules/authom/authom.module.ts` � `provideSdAuthOm()` + `SdAuthOmModule.forRoot()`.
- `projects/sdcorejs-angular/modules/authom/index.ts` � re-export public API.
- `projects/sdcorejs-angular/modules/authom/ng-package.json` � secondary entry point cho ng-packagr.
- `projects/sdcorejs-angular/modules/authom/silent-authom.html` � file tĩnh template, consumer copy vào `public/`.

**Modify:**
- `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts` � thêm `sha256(input: string): Promise<string>` vào `StringUtilities`.
- `projects/sdcorejs-angular/modules/index.ts` � thêm `export * from '@sdcorejs/angular/modules/authom';`.

---

## Task 1: Thêm `sha256` vào `StringUtilities`

**Files:**
- Modify: `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts`

- [ ] **Step 1: Thêm hàm `sha256` ngay trư�:c kh�i `export const StringUtilities`**

M�x `projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts`, tìm dòng 198 (dòng tr�ng ngay trư�:c `export const StringUtilities = {`). Thêm hàm sau vào dòng �ó:

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

Trong cùng file, tìm kh�i `export const StringUtilities = { ... }` (dòng 199 tr�x �i). Thêm `sha256,` vào cu�i danh sách (sau `generateUniqueCode,`):

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

- [ ] **Step 3: Build sd-angular �Ồ verify thay ��"i không phá vỡ gì**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success, không có TypeScript error.

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/utilities/extensions/src/string.extension.ts
git commit -m "SM-00: Thêm StringUtilities.sha256 �Ồ h� trợ PKCE"
```

---

## Task 2: Tạo `authom.configuration.ts`

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/authom.configuration.ts`

- [ ] **Step 1: Tạo file configuration**

Tạo file `projects/sdcorejs-angular/modules/authom/authom.configuration.ts` v�:i n�"i dung:

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
git commit -m "SM-00: Thêm authom configuration interface + injection token"
```

---

## Task 3: Tạo `silent-authom.html`

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/silent-authom.html`

- [ ] **Step 1: Tạo file HTML tĩnh cho silent refresh iframe**

Tạo file `projects/sdcorejs-angular/modules/authom/silent-authom.html` v�:i n�"i dung:

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
git commit -m "SM-00: Thêm silent-authom.html template cho iframe refresh"
```

---

## Task 4: Tạo skeleton `authom.service.ts` (state + getter)

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: Tạo file service skeleton**

Tạo file `projects/sdcorejs-angular/modules/authom/authom.service.ts` v�:i n�"i dung:

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

- [ ] **Step 2: Build �Ồ verify**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: build success.

- [ ] **Step 3: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.service.ts
git commit -m "SM-00: Kh�xi tạo SdAuthOmService skeleton v�:i state signals"
```

---

## Task 5: Thêm PKCE + URL helpers vào service

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: Thêm import StringUtilities**

Sửa dòng `import { SdAuthOmTenantConfig } from './authom.configuration';` thành:

```ts
import { SdAuthOmTenantConfig } from './authom.configuration';
import { StringUtilities } from '../../utilities/extensions/src/string.extension';
```

- [ ] **Step 2: Thêm các private helper trong class**

Thêm các method sau vào trong class `SdAuthOmService`, ngay sau method `getAccessToken()`:

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
git commit -m "SM-00: Thêm PKCE + URL helpers cho SdAuthOmService"
```

---

## Task 6: Implement `login()` + `logout()`

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: Thêm method `login` và `logout`**

Thêm các method sau vào trong class `SdAuthOmService`, ngay sau `decodeJwtPayload`:

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
git commit -m "SM-00: Thêm login() và logout() cho SdAuthOmService"
```

---

## Task 7: Implement `exchangeCode` + auto-refresh timer

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: Thêm `exchangeCode` và `scheduleRefresh`**

Thêm các method sau vào trong class `SdAuthOmService`, ngay sau `logout`:

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
      console.warn('[SdAuthOmService] Token không có exp � bỏ qua auto-refresh');
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

- [ ] **Step 2: Build verify (sẽ báo l�i `silentRefresh` chưa t�n tại � �ó là expected, sẽ thêm �x Task 8)**

```bash
npx ng build sdcorejs-angular --configuration development
```

Expected: error `Property 'silentRefresh' does not exist on type 'SdAuthOmService'`. **Không commit** �x task này � tiếp tục Task 8.

---

## Task 8: Implement `silentRefresh()`

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: Thêm method `silentRefresh`**

Thêm method sau vào trong class `SdAuthOmService`, ngay sau `scheduleRefresh`:

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

- [ ] **Step 3: Commit g�"p Task 7 + 8**

```bash
git add projects/sdcorejs-angular/modules/authom/authom.service.ts
git commit -m "SM-00: Thêm exchangeCode, scheduleRefresh, silentRefresh"
```

---

## Task 9: Implement `handleCallback()` + `init()`

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/authom.service.ts`

- [ ] **Step 1: Thêm `handleCallback` và `init`**

Thêm 2 method sau vào trong class `SdAuthOmService`, ngay sau `silentRefresh`:

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
git commit -m "SM-00: Thêm handleCallback và init cho SdAuthOmService"
```

---

## Task 10: Tạo `authom.interceptor.ts`

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/authom.interceptor.ts`

- [ ] **Step 1: Tạo interceptor**

Tạo file `projects/sdcorejs-angular/modules/authom/authom.interceptor.ts` v�:i n�"i dung:

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
git commit -m "SM-00: Thêm SdAuthOmInterceptor v�:i glob match cho secureRoutes"
```

---

## Task 11: Tạo `authom.module.ts`

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/authom.module.ts`

- [ ] **Step 1: Tạo module v�:i `provideSdAuthOm` và `SdAuthOmModule.forRoot`**

Tạo file `projects/sdcorejs-angular/modules/authom/authom.module.ts` v�:i n�"i dung:

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
git commit -m "SM-00: Thêm provideSdAuthOm và SdAuthOmModule.forRoot"
```

---

## Task 12: Tạo `index.ts` + `ng-package.json` cho secondary entry

**Files:**
- Create: `projects/sdcorejs-angular/modules/authom/index.ts`
- Create: `projects/sdcorejs-angular/modules/authom/ng-package.json`

- [ ] **Step 1: Tạo `index.ts`**

Tạo file `projects/sdcorejs-angular/modules/authom/index.ts` v�:i n�"i dung:

```ts
export * from './authom.configuration';
export * from './authom.service';
export * from './authom.interceptor';
export * from './authom.module';
```

- [ ] **Step 2: Tạo `ng-package.json`**

Tạo file `projects/sdcorejs-angular/modules/authom/ng-package.json` v�:i n�"i dung:

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

Expected: build success. Trong output dist sẽ có `dist/sdcorejs-angular/modules/authom/` v�:i `.d.ts`/`.mjs`.

- [ ] **Step 4: Commit**

```bash
git add projects/sdcorejs-angular/modules/authom/index.ts projects/sdcorejs-angular/modules/authom/ng-package.json
git commit -m "SM-00: Thêm secondary entry point cho module authom"
```

---

## Task 13: Re-export module authom từ `modules/index.ts`

**Files:**
- Modify: `projects/sdcorejs-angular/modules/index.ts`

- [ ] **Step 1: Thêm export cho authom**

M�x `projects/sdcorejs-angular/modules/index.ts`. Thêm dòng sau vào cu�i file (sau `export * from '@sdcorejs/angular/modules/layout';`):

```ts
export * from '@sdcorejs/angular/modules/authom';
```

File sau khi sửa sẽ là:

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
git commit -m "SM-00: Re-export module authom từ modules barrel"
```

---

## Task 14: Final verification (production build + lint)

**Files:** none (verify-only)

- [ ] **Step 1: Production build**

```bash
npx ng build sdcorejs-angular --configuration production
```

Expected: build success, không có error.

- [ ] **Step 2: Lint**

```bash
npx ng lint sd-angular
```

Expected: pass hoặc ch�0 có warnings không liên quan t�:i authom. Nếu có error trong file authom � fix inline (�a s� sẽ là `eslint-disable-next-line @typescript-eslint/no-explicit-any` �ã có sẵn cho `useFactory` deps).

- [ ] **Step 3: Verify dist artifacts**

```bash
ls dist/sdcorejs-angular/modules/authom/
```

Expected: thấy có `index.d.ts` (hoặc `*.d.ts`), `package.json`, `index.mjs` (hoặc tương tự). Cấu trúc gi�ng `dist/sdcorejs-angular/modules/keycloak/`.

- [ ] **Step 4: Verify smoke test public-api**

```bash
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless
```

Expected: `public-api.spec.ts` pass (entry point load OK). Nếu test config không sẵn ChromeHeadless �  bỏ qua, không bắt bu�"c.

- [ ] **Step 5: Final commit (nếu cần fix lint)**

Nếu có thay ��"i do lint fix:

```bash
git add -A
git commit -m "SM-00: Fix lint warnings cho module authom"
```

---

## Task 15: Document cách dùng (README inline trong file index hoặc commit separate)

**Files:**
- Modify: `projects/sdcorejs-angular/modules/authom/index.ts` (thêm header comment)

- [ ] **Step 1: Thêm header comment vào index.ts**

M�x `projects/sdcorejs-angular/modules/authom/index.ts`. Thay thế n�"i dung thành:

```ts
/**
 * Module `authom` � OAuth 2.0 + PKCE authentication client cho AuthOM (Auth0-based).
 *
 * Cách dùng (standalone):
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
 * Yêu cầu setup thêm:
 * 1. Copy file `silent-authom.html` từ source module này vào thư mục `public/` của app.
 * 2. App phải chạy trên HTTPS (hoặc localhost) � Web Crypto API yêu cầu secure context.
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
git commit -m "SM-00: Thêm hư�:ng dẫn sử dụng module authom vào index.ts"
```

---

## Self-Review

**1. Spec coverage:**
- �S& Section 3 (cấu trúc file) �  Tasks 2, 3, 4, 10, 11, 12.
- �S& Section 4 (configuration) �  Task 2.
- �S& Section 5.1 (init) �  Task 9.
- �S& Section 5.2 (login) �  Task 6.
- �S& Section 5.3 (logout) �  Task 6.
- �S& Section 5.4 (silentRefresh) �  Task 8.
- �S& Section 5.5 (handleCallback) �  Task 9.
- �S& Section 5.6 (auto-refresh timer / scheduleRefresh) �  Task 7.
- �S& Section 6 (interceptor + matchGlob) �  Task 10.
- �S& Section 7 (silent-authom.html) �  Task 3.
- �S& Section 8 (module providers) �  Task 11.
- �S& Section 9 (StringUtilities.sha256) �  Task 1.
- �S& Section 10 (edge cases) �  handled in Tasks 4, 6, 7, 8, 9 (`isBrowser` guard, state mismatch return false, timeout, JWT exp missing �  log warn).
- �S& Section 11 (public API export) �  Tasks 12, 13.
- �S& Section 12 (usage example) �  Task 15.

**2. Placeholder scan:** Không có TBD/TODO/"implement later". Mọi step có code cụ thỒ hoặc command cụ thỒ.

**3. Type consistency:**
- `SdAuthOmTenantConfig`/`ISdAuthOmConfiguration`/`SD_AUTHOM_CONFIGURATION` � ��9nh nghĩa Task 2, dùng nhất quán Tasks 9, 10, 11.
- `SdAuthOmService.config`, `accessToken`, `getAccessToken` � ��9nh nghĩa Task 4, dùng Tasks 5, 6, 7, 8, 9, 10.
- `STORAGE_KEY_*` constants � ��9nh nghĩa Task 4, dùng Tasks 6, 9.
- `DEFAULT_*` constants � ��9nh nghĩa Task 4, dùng Tasks 5, 7, 8.
- Method signatures kh�:p giữa task ��9nh nghĩa (5, 6, 7, 8, 9) và caller (Task 10 interceptor gọi `getAccessToken`, Task 11 module gọi `init`).
- `AUTHOM_SILENT_SUCCESS` / `AUTHOM_SILENT_ERROR` � postMessage type kh�:p giữa Task 3 (`silent-authom.html`) và Task 8 (service `onMessage`).

Plan hoàn ch�0nh, sẵn sàng thực thi.

