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
- Uses the canonical `keycloak-js` SDK (full Keycloak feature set: `loginRequired`, account console, role mappings) rather than a hand-rolled OAuth/PKCE implementation.

## What it provides

| Symbol | Kind | Purpose |
|---|---|---|
| `provideSdKeycloak(options)` | EnvironmentProviders factory | Standalone-bootstrap registration |
| `SdKeycloakModule.forRoot(options)` | NgModule | Legacy `AppModule` registration |
| `SdKeycloakService` | Service (`providedIn: 'root'`) | Wraps the `Keycloak` instance with helpers |
| `SdKeycloakInterceptor` | `HttpInterceptorFn` | Refreshes token if needed, then attaches `Bearer <token>` to URLs whose path includes any `secureRoutes` substring |
| `SD_KEYCLOAK_CONFIGURATION` | InjectionToken | Holds the `loadTenantConfig()` provider |
| `SdKeycloakTenantConfig` | Interface | `{ url, realm, clientId, secureRoutes?, silentRenewUrl?, authErrorUrl? }` |
| `ISdKeycloakConfiguration` | Interface | `{ loadTenantConfig: () => Promise<SdKeycloakTenantConfig> }` |

## Configuration

```ts
interface SdKeycloakTenantConfig {
  url: string;             // 'https://sso.example.com' (Keycloak base URL)
  realm: string;           // 'my-realm'
  clientId: string;        // 'my-spa'
  secureRoutes?: string[]; // substrings to match req.url against, e.g. ['/api/v1']
  silentRenewUrl?: string; // basename of the silent-SSO redirect file in public/ (default 'silent-renew' -> ${origin}/silent-renew.html)
  authErrorUrl?: string;   // basename of the static error page in public/ (default 'auth-keycloak-error' -> redirect target when init() throws)
}

interface ISdKeycloakConfiguration {
  loadTenantConfig: () => Promise<SdKeycloakTenantConfig>;
}
```

`loadTenantConfig` is called once at `APP_INITIALIZER` — fetch realm config from your backend or return a static object.

## Required `public/` files

This module references **two static HTML files** that the consumer must serve from the app's `public/`
folder (Angular copies `public/**` to the build root). Both filenames are configurable; the defaults
keep backward compatibility.

| File (default) | Config override | Purpose | Missing → effect |
|---|---|---|---|
| `silent-renew.html` | `silentRenewUrl` (default `'silent-renew'`) | Keycloak **silent SSO** redirect target. Posts its URL back to the parent window so `check-sso` can complete in a hidden iframe. Referenced as `${origin}/<silentRenewUrl>.html`. | Silent `check-sso` fails; `init()` resolves `false` → users wrongly treated as anonymous. |
| `auth-keycloak-error.html` | `authErrorUrl` (default `'auth-keycloak-error'`) | **Static error page**. If `keycloak.init()` throws (Keycloak down, network error, bad realm), the app does a full-page redirect to `${origin}/<authErrorUrl>.html`. Static → renders even when the Angular bundle failed to boot. | Redirect lands on the host's 404 page instead of a branded error. |

**Reference templates** ship inside the package at `modules/keycloak/htmls/`:
- `silent-renew.html` — copy verbatim (do not edit; it is a fixed Keycloak contract).
- `auth-keycloak-error.html` — a generic core template that is **usable as-is** (no logo, no email, no external deps). Copy it; optionally uncomment the inline placeholders to add your logo / support contact / copy.

The override value is a **basename** (no `.html`, no leading `/` — both are tolerated and stripped). To nest
the files, pass a path: `silentRenewUrl: 'assets/silent-renew'` → `${origin}/assets/silent-renew.html`.

### How to provision them (so consumers don't hand-author)

Three escalating options — pick one:

1. **Manual (simplest):** copy the two templates from `node_modules/@sdcorejs/angular/modules/keycloak/htmls/`
   into your `public/`. Done once.
2. **Auto-copy via `angular.json` assets (recommended, no hand-authoring):** the package publishes the
   templates (`ng-package.json` → `"assets": ["./htmls"]`), so point the build at them:
   ```jsonc
   // angular.json → projects.<app>.architect.build.options.assets
   {
     "glob": "*.html",
     "input": "node_modules/@sdcorejs/angular/modules/keycloak/htmls",
     "output": "/"
   }
   ```
   The two files land at the web root on every build — upgrade-safe, nothing to maintain. (Override the
   `auth-keycloak-error.html` later by placing your own copy in `public/`, which wins.)
3. **Runtime guard (safety net):** `SdKeycloakService.init()` already redirects to `authErrorUrl` on failure,
   so a missing `silent-renew.html` surfaces as a failed `check-sso`. For louder DX you may add a `HEAD`
   fetch on the silent-renew URL in dev and `console.warn` if it 404s (not built in — opt-in).

> An `ng add` schematic that copies the files + patches `angular.json` automatically would be the
> gold-standard provisioning path, but is not shipped yet.

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
          // Optional — defaults shown; the matching public/ files must exist:
          // silentRenewUrl: 'silent-renew',          // -> public/silent-renew.html
          // authErrorUrl: 'auth-keycloak-error',     // -> public/auth-keycloak-error.html
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
  - `keycloak: Keycloak` — the underlying `keycloak-js` instance (use for advanced calls: `hasRealmRole`, `loadUserProfile`, etc.)
  - `config: SdKeycloakTenantConfig` — resolved tenant config
  - `init(config)` — called by `APP_INITIALIZER`; returns `Promise<boolean>` (`authenticated`)
  - `login()`, `logout()` — convenience wrappers (logout returns to `window.location.origin`)
  - `getToken(): string | undefined` — current access token
  - `getIsAuthenticated(): boolean | undefined` — current auth state
- **`SdKeycloakInterceptor`** — registered via `withInterceptors([...])`. No setup beyond that.

## Behavior notes

- **Init mode:** `keycloak.init({ onLoad: 'check-sso', silentCheckSsoRedirectUri: '${origin}/<silentRenewUrl>.html', checkLoginIframe: false })` (`<silentRenewUrl>` defaults to `silent-renew`). The `check-sso` mode does NOT force login — unauthenticated users see the app as anonymous; the app itself decides when to call `login()`.
- **Init failure → error page:** if `keycloak.init()` throws, the service logs the error and does a full-page redirect to `${origin}/<authErrorUrl>.html` (default `auth-keycloak-error.html`). To avoid a redirect loop, `init()` returns `false` early without re-initializing when the current path already IS the error page.
- **`checkLoginIframe: false`** is set deliberately to prevent the Keycloak iframe loop bug. SSO state is therefore only validated at refresh time, not continuously.
- **Auto-refresh:** `onTokenExpired` triggers `updateToken(30)` (refresh if expiry within 30s). On failure, `keycloak.login()` runs — full-page redirect.
- **Interceptor refresh:** before each secured request, `keycloak.updateToken(30)` is awaited — guarantees the request never carries a token expiring in <30s.
- **`secureRoutes` matching is substring-based** (`req.url.includes(route)`), NOT glob. `'/api'` will match `https://thirdparty.com/api/x` — be specific.
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

**Wire into auth façade for the layout module:**
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

- Do NOT call `kc.keycloak.init(...)` yourself — `provideSdKeycloak` already wires it as `APP_INITIALIZER`. A second `init` throws.
- Do NOT use vague `secureRoutes` like `['/api']` if your app calls third-party APIs containing `/api/` — use unique segments (`'/api/v1/myproduct'`) or full origin substrings.
- Do NOT remove `silent-renew.html` from `public/` — silent SSO check fails and `init` resolves `false` unexpectedly. (Prefer the `angular.json` assets glob so it can't go missing on a fresh checkout.)
- The core `auth-keycloak-error.html` works verbatim, but for production you'll usually add a logo / support contact / branded copy via its inline placeholders. Do NOT put app-bundle-dependent markup (external JS/CSS/images) in it — it must render when the bundle failed.
- Do NOT rename only the `*Url` config without creating the matching `public/<name>.html` — the basename and the file must agree.
- Do NOT inject `SdKeycloakService` inside the `loadTenantConfig` factory — that creates a DI cycle. Inject `HttpClient` if you need to fetch config.
- Do NOT enable `checkLoginIframe: true` without testing — known to cause infinite reload loops in some browsers.

## Related

- [auth module](./sd-auth.md) — generic façade you can layer on top to expose `SdAuthService`.
- [permission module](./sd-permission.md) — `getToken` callback can return `kc.getToken()` so permission decoding works.
- [layout module](./sd-layout.md) — `SdLayoutService` consumes user info / signout that you wire from this service.
