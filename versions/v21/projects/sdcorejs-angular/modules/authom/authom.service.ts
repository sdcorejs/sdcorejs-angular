import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SdAuthOmTenantConfig } from './authom.configuration';
import { StringUtilities } from '@sdcorejs/utils/fns';

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

  private base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
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

  private buildAuthorizeUrl(params: { state: string; codeChallenge: string; redirectUri: string; prompt?: 'none' }): string {
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

  async login(options?: { returnTo?: string }): Promise<void> {
    if (!this.isBrowser) return;

    const state = crypto.randomUUID();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const returnTo = options?.returnTo || window.location.pathname + window.location.search;

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
      const data = (await res.json()) as { access_token?: string; id_token?: string };
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
      // @i18n-ignore — dev console warning
      console.warn('[SdAuthOmService] Token không có exp — bỏ qua auto-refresh');
      return;
    }
    const threshold = this.config.refreshThresholdSeconds ?? DEFAULT_REFRESH_THRESHOLD_SECONDS;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const delayMs = Math.max(0, (exp - nowSeconds - threshold) * 1000);
    this.refreshTimer = setTimeout(() => {
      this.silentRefresh();
    }, delayMs);
  }

  async silentRefresh(): Promise<boolean> {
    if (!this.isBrowser) return false;

    const state = crypto.randomUUID();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const redirectUri = this.getSilentRedirectUri();
    const timeoutMs = (this.config.authorizeTimeoutInSeconds ?? DEFAULT_AUTHORIZE_TIMEOUT_SECONDS) * 1000;

    return new Promise(resolve => {
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
}
