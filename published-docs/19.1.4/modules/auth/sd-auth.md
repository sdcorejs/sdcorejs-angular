# Auth Module

- **Type:** Tree-shakable services + guards (no `@NgModule`, providers via `providedIn: 'root'`)
- **Import path:** `@sdcorejs/angular/modules/auth`
- **Library version:** `@sdcorejs/angular@19.0.0-beta.86`

## One-line purpose

Provider-agnostic auth abstraction: app supplies sign-out / change-password actions and guard callbacks via DI; module exposes a service + two route guards that delegate to those callbacks.

## When to use

- App already owns its auth flow (Keycloak or an app-owned backend/provider) and just wants a uniform `SdAuthService` for the layout/header to call `signout()` / `changePassword()` and read `getAuthInfo()`.
- Need `SdAuthGuard` / `SdPortalGuard` route guards that an app can wire into `canActivate` / `canActivateChild` without coupling to a specific auth library.
- Pair with `@sdcorejs/angular/modules/keycloak` or an app-owned provider — the provider implements the actual sign-in / token logic, while this module gives the app shell a stable surface to consume.

## When NOT to use

- Do not use it as the actual OAuth / SSO client. Use `keycloak` or an app-owned provider for token lifecycle.
- Do not use it for RBAC checks. Use the `permission` module for `*sdPermission`, permission caching, and route permission gates.
- Do not expect guards to block routes by default. Without configured callbacks, `SdAuthGuard` and `SdPortalGuard` intentionally pass through.
- Do not inject it into low-level HTTP interceptors as the token source unless your `SD_AUTH_CONFIGURATION` explicitly exposes token access elsewhere; this facade only owns user/action/guard callbacks.

## What it provides

| Symbol | Kind | Purpose |
|---|---|---|
| `SdAuthService` | Service (`providedIn: 'root'`) | Exposes `getAuthInfo` (Signal), `signout()`, `changePassword()`, `signout$` / `changePassword$` Observables |
| `SdAuthGuard` | Route guard (`CanActivate`) | Delegates to `config.guard.auth`; passes through if not configured |
| `SdPortalGuard` | Route guard (`CanActivate`) | Delegates to `config.guard.portal`; passes through if not configured |
| `SD_AUTH_CONFIGURATION` | InjectionToken | DI token for `ISdAuthConfiguration` |
| `ISdAuthConfiguration` | Interface | Configuration shape (see below) |
| `SdAuthInfo<T>` | Interface | User profile shape returned by `getAuthInfo` |

## Configuration

```ts
interface ISdAuthConfiguration {
  action?: {
    signout: () => MaybeAsync<void>;
    changePassword?: () => MaybeAsync<void>;
  };
  guard?: {
    auth?: CanActivate['canActivate'];     // optional canActivate fn for SdAuthGuard
    portal?: CanActivate['canActivate'];   // optional canActivate fn for SdPortalGuard
    authInfo: () => MaybeAsync<SdAuthInfo>; // required if you want a real user
  };
}

interface SdAuthInfo<T = any> {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  data?: T; // any extra payload
}
```

If `SD_AUTH_CONFIGURATION` is not provided, `SdAuthService` falls back to a `guest` user signal and `signout` / `changePassword` become no-ops.

## Setup

Standalone (Angular 19) — `app.config.ts`:

```ts
import { ApplicationConfig } from '@angular/core';
import { SD_AUTH_CONFIGURATION } from '@sdcorejs/angular/modules/auth';
import { SdKeycloakService } from '@sdcorejs/angular/modules/keycloak';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: SD_AUTH_CONFIGURATION,
      useFactory: () => {
        const kc = inject(SdKeycloakService);
        return {
          action: {
            signout: () => kc.logout(),
            changePassword: () => kc.keycloak.login({ action: 'UPDATE_PASSWORD' }),
          },
          guard: {
            authInfo: () => {
              const claims = kc.keycloak.tokenParsed ?? {};
              return {
                id: claims['sub'],
                username: claims['preferred_username'],
                firstName: claims['given_name'],
                lastName: claims['family_name'],
                email: claims['email'],
              };
            },
          },
        };
      },
    },
  ],
};
```

NgModule fallback — provide the same value in `AppModule.providers`.

## Public API

- **`SdAuthService`** — inject anywhere. Read user with `authService.getAuthInfo()` (Signal). Call `authService.signout()` / `authService.changePassword()`. Subscribe to `signout$` / `changePassword$` for cross-component side effects (e.g. clear app state on sign-out).
- **`SdAuthGuard`** — register on protected routes:
  ```ts
  { path: 'admin', canActivate: [SdAuthGuard], loadChildren: ... }
  ```
- **`SdPortalGuard`** — separate guard slot for portal-level checks (typical use: redirect from portal root after auth, distinct from per-feature `auth`).

## Behavior notes

- **No built-in token storage / refresh.** This module is intentionally a thin façade — the actual sign-in / token lifecycle lives in `keycloak` or an app-owned service.
- `getAuthInfo` is always defined: it is `toSignal(authInfo())` if a callback is configured, otherwise `signal(defaultGuestUser)`.
- `signout()` only fires `signout$` after the configured `action.signout` Promise resolves — subscribers get a clean "post-signout" hook.
- Guards default to `true` when not configured — they NEVER block by default. You must wire `guard.auth` / `guard.portal` for them to gate anything.
- `signout$` and `changePassword$` are exposed as RxJS Observables (not signals) — they emit only on action completion, not initial subscription.

## Examples

**Header user-menu binding (Signal):**
```ts
@Component({
  selector: 'app-user-menu',
  template: `
    <button [matMenuTriggerFor]="menu">
      {{ user()?.firstName }} {{ user()?.lastName }}
    </button>
    <mat-menu #menu>
      <button mat-menu-item (click)="auth.changePassword()">Change password</button>
      <button mat-menu-item (click)="auth.signout()">Sign out</button>
    </mat-menu>
  `,
})
export class UserMenu {
  protected readonly auth = inject(SdAuthService);
  protected readonly user = this.auth.getAuthInfo!;
}
```

**Clear app cache on sign-out:**
```ts
@Injectable({ providedIn: 'root' })
export class AppSessionCleanup {
  constructor(auth: SdAuthService, cache: SdCacheService) {
    auth.signout$?.subscribe(() => cache.clearAll());
  }
}
```

**Route protection:**
```ts
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [SdPortalGuard],
    canActivateChild: [SdAuthGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./dashboard/routes') },
    ],
  },
];
```

## Test coverage

| File | Specs | Notes |
|---|---|---|
| `guards/auth.guard.spec.ts` | 6 | no-config pass-through, no-callback pass-through, delegate true/false/UrlTree |
| `guards/portal.guard.spec.ts` | 6 | same pattern — delegates to `config.guard.portal` |
| `services/auth.service.spec.ts` | 14 | constructor defaults, `getAuthInfo` signal, `signout()`, `changePassword()`, observable streams |

## Anti-patterns

- Do NOT call `keycloak.logout()` directly from a header component — go through `SdAuthService.signout()` so `signout$` subscribers also fire.
- Do NOT implement token-refresh inside `action.signout` — that belongs in the underlying Keycloak or app-owned provider interceptor.
- Do NOT inject `SdAuthService` inside `SD_AUTH_CONFIGURATION`'s factory — circular DI. Inject the underlying provider service instead (e.g. `SdKeycloakService`).
- Do NOT skip providing `SD_AUTH_CONFIGURATION` if you rely on guards — they will silently pass everything through.

## Related

- [keycloak module](./sd-keycloak.md) — typical `action.signout` / `guard.authInfo` source for Keycloak SSO.
- [permission module](./sd-permission.md) — runs on top of auth; uses `getToken` to call your permission API.
- [layout module](./sd-layout.md) — `SdLayoutService` consumes `SdAuthService` indirectly via its own `signout` / `userInfo` config (not auto-wired).
