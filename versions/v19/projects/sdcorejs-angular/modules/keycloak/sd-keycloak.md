# Keycloak Module

- **Type:** `EnvironmentProviders` (`provideSdKeycloak`) **or** `NgModule.forRoot` (`SdKeycloakModule`)
- **Import path:** `@sdcorejs/angular/modules/keycloak`
- **Library version:** `@sdcorejs/angular@19.0.0-beta.86`

## One-line purpose

Thin wrapper around the official `keycloak-js` SDK: bootstraps Keycloak at app-init via `check-sso`, auto-refreshes tokens on `onTokenExpired`, and provides an `HttpInterceptor` that attaches `Bearer <token>` to allow-listed API routes.

## When to use

- Your app authenticates against a Keycloak realm (self-hosted or RH SSO).
- You want `keycloak-js` initialized as part of `APP_INITIALIZER` so routes never activate before SSO check completes.
- You need automatic 30-second-ahead silent token refresh, with auto-redirect to login on refresh failure.
- Differs from `authom`: this module uses the canonical `keycloak-js` SDK (full Keycloak feature set: `loginRequired`, account console, role mappings) â€” not a hand-rolled OAuth/PKCE implementation.

## What it provides

| Symbol | Kind | Purpose |
|---|---|---|
| `provideSdKeycloak(options)` | EnvironmentProviders factory | Standalone-bootstrap registration |
| `SdKeycloakModule.forRoot(options)` | NgModule | Legacy `AppModule` registration |
| `SdKeycloakService` | Service (`providedIn: 'root'`) | Wraps the `Keycloak` instance with helpers |
| `SdKeycloakInterceptor` | `HttpInterceptorFn` | Refreshes token if needed, then attaches `Bearer <token>` to URLs whose path includes any `secureRoutes` substring |
| `SD_KEYCLOAK_CONFIGURATION` | InjectionToken | Holds the `loadTenantConfig()` provider |
| `SdKeycloakTenantConfig` | Interface | `{ url, realm, clientId, secureRoutes? }` |
| `ISdKeycloakConfiguration` | Interface | `{ loadTenantConfig: () => Promise<SdKeycloakTenantConfig> }` |

## Configuration

```ts
interface SdKeycloakTenantConfig {
  url: string;            // 'https://sso.example.com' (Keycloak base URL)
  realm: string;          // 'my-realm'
  clientId: string;       // 'my-spa'
  secureRoutes?: string[]; // substrings to match req.url against, e.g. ['/api/v1']
}

interface ISdKeycloakConfiguration {
  loadTenantConfig: () => Promise<SdKeycloakTenantConfig>;
}
```

`loadTenantConfig` is called once at `APP_INITIALIZER` â€” fetch realm config from your backend or return a static object.

## Setup

**Required app-side files:**
- `silent-renew.html` in app `public/` â€” Keycloak silent SSO redirect target (referenced as `${origin}/silent-renew.html`).

**Standalone (`app.config.ts`):**
```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideSdKeycloak, SdKeycloakInterceptor } from '@sdcorejs/angular/modules/keycloak';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([SdKeycloakInterceptor])),
    provideSdKeycloak({
      useFactory: () => ({
        loadTenantConfig: () => Promise.resolve({
          url: 'https://sso.example.com',
          realm: 'my-realm',
          clientId: 'my-spa',
          secureRoutes: ['/api/v1', '/api/v2'],
        }),
      }),
    }),
  ],
};
```

**NgModule fallback:**
```ts
@NgModule({
  imports: [
    SdKeycloakModule.forRoot({
      useFactory: () => ({ loadTenantConfig: () => fetch('/keycloak.json').then(r => r.json()) }),
    }),
  ],
  providers: [provideHttpClient(withInterceptors([SdKeycloakInterceptor]))],
})
export class AppModule {}
```

## Public API

- **`SdKeycloakService`**
  - `keycloak: Keycloak` â€” the underlying `keycloak-js` instance (use for advanced calls: `hasRealmRole`, `loadUserProfile`, etc.)
  - `config: SdKeycloakTenantConfig` â€” resolved tenant config
  - `init(config)` â€” called by `APP_INITIALIZER`; returns `Promise<boolean>` (`authenticated`)
  - `login()`, `logout()` â€” convenience wrappers (logout returns to `window.location.origin`)
  - `getToken(): string | undefined` â€” current access token
  - `getIsAuthenticated(): boolean | undefined` â€” current auth state
- **`SdKeycloakInterceptor`** â€” registered via `withInterceptors([...])`. No setup beyond that.

## Behavior notes

- **Init mode:** `keycloak.init({ onLoad: 'check-sso', silentCheckSsoRedirectUri: '${origin}/silent-renew.html', checkLoginIframe: false })`. The `check-sso` mode does NOT force login â€” unauthenticated users see the app as anonymous; the app itself decides when to call `login()`.
- **`checkLoginIframe: false`** is set deliberately to prevent the Keycloak iframe loop bug. SSO state is therefore only validated at refresh time, not continuously.
- **Auto-refresh:** `onTokenExpired` triggers `updateToken(30)` (refresh if expiry within 30s). On failure, `keycloak.login()` runs â€” full-page redirect.
- **Interceptor refresh:** before each secured request, `keycloak.updateToken(30)` is awaited â€” guarantees the request never carries a token expiring in <30s.
- **`secureRoutes` matching is substring-based** (`req.url.includes(route)`), NOT glob. `'/api'` will match `https://thirdparty.com/api/x` â€” be specific.
- **Anonymous requests pass through:** if `keycloak.authenticated` is falsy, the interceptor calls `next(req)` unmodified.
- **No SSR guard.** This service assumes a browser. Importing it server-side will throw on `keycloak-js` browser globals.

## Examples

**Header user-menu:**
```ts
@Component({ template: `
  @if (kc.getIsAuthenticated()) {
    <span>{{ kc.keycloak.tokenParsed?.['preferred_username'] }}</span>
    <button (click)="kc.logout()">Logout</button>
  } @else {
    <button (click)="kc.login()">Login</button>
  }
` })
export class HeaderUser {
  protected readonly kc = inject(SdKeycloakService);
}
```

**Wire into auth faÃ§ade for the layout module:**
```ts
{
  provide: SD_AUTH_CONFIGURATION,
  useFactory: () => {
    const kc = inject(SdKeycloakService);
    return {
      action: { signout: () => kc.logout() },
      guard: {
        authInfo: () => {
          const t = kc.keycloak.tokenParsed ?? {};
          return {
            id: t['sub'], username: t['preferred_username'],
            firstName: t['given_name'], lastName: t['family_name'], email: t['email'],
          };
        },
      },
    };
  },
}
```

**Use Keycloak roles in a permission resolver:**
```ts
{
  provide: SD_PERMISSION_CONFIGURATION,
  useFactory: () => {
    const kc = inject(SdKeycloakService);
    return {
      loadPermissions: () => kc.keycloak.realmAccess?.roles ?? [],
      getToken: () => kc.getToken() ?? '',
      onForbiden: () => inject(Router).navigateByUrl('/layout/forbidden'),
    };
  },
}
```

## Anti-patterns

- Do NOT call `kc.keycloak.init(...)` yourself â€” `provideSdKeycloak` already wires it as `APP_INITIALIZER`. A second `init` throws.
- Do NOT use vague `secureRoutes` like `['/api']` if your app calls third-party APIs containing `/api/` â€” use unique segments (`'/api/v1/myproduct'`) or full origin substrings.
- Do NOT remove `silent-renew.html` from `public/` â€” silent SSO check fails and `init` resolves `false` unexpectedly.
- Do NOT inject `SdKeycloakService` inside the `loadTenantConfig` factory â€” that creates a DI cycle. Inject `HttpClient` if you need to fetch config.
- Do NOT enable `checkLoginIframe: true` without testing â€” known to cause infinite reload loops in some browsers.

## Related

- [authom module](./sd-authom.md) â€” alternative SSO provider (Auth0/AuthOM via PKCE).
- [auth module](./sd-auth.md) â€” generic faÃ§ade you can layer on top to expose `SdAuthService`.
- [permission module](./sd-permission.md) â€” `getToken` callback can return `kc.getToken()` so permission decoding works.
- [layout module](./sd-layout.md) â€” `SdLayoutService` consumes user info / signout that you wire from this service.

