# Permission Module

- **Type:** Tree-shakable directive + service + guard (no `forRoot` — provide the config token directly)
- **Import path:** `@sdcorejs/angular/modules/permission`
- **Library version:** `@sdcorejs/angular@19.0.0-beta.86`

## One-line purpose

RBAC permission layer: `*sdPermission` directive conditionally renders templates, `SdPermissionGuard` gates route children by permission code, and `SdPermissionService` caches loaded permission lists per "key" so multi-tenant / multi-profile portals can mix permission sources.

## When to use

- Hide buttons / sections based on user permission codes (e.g. `'PCM_C_PRODUCT_CREATE'`).
- Block route activation when the user lacks the route's `data.permission`.
- Portal aggregates several products with different permission APIs — multiple `SD_PERMISSION_CONFIGURATION` providers (using `multi: true`) let you scope by `key`, with `key === undefined` acting as the portal-wide fallback.
- Need a per-key in-memory permission cache with an explicit `reset()` / `invalidate()` lifecycle (and, opt-in per key, a `sessionStorage` mirror that survives reload).

## When NOT to use

- Do not use it as the only security layer. It hides UI and blocks client routes; APIs must enforce permissions again.
- Do not use it for authentication or token refresh. Pair it with `auth`, `keycloak`, or an app-owned provider.
- Do not use `SdPermissionGuard.canActivate` on each leaf route. Use it once at the portal layer to preload; enforce children with `canActivateChild`.
- Do not use permission codes as labels or feature names in the UI. Keep them as stable backend-facing identifiers.

## What it provides

| Symbol | Kind | Purpose |
|---|---|---|
| `SdPermissionDirective` | Directive (selector `[sdPermission]`) | Structural directive — renders template only if user has at least one of the given codes |
| `SdPermissionService` | Service (`providedIn: 'root'`) | Loads / caches permissions per key, exposes `hasPermission`, `reset`, `invalidate`, `getToken`, `readUnverifiedTokenClaims` |
| `SdPermissionGuard` | Route guard (`CanActivate` + `CanActivateChild`) | `canActivate` preloads ALL permissions (use at portal layer); `canActivateChild` checks `route.data.permission` against `route.data.permissionKey` |
| `SD_PERMISSION_CONFIGURATION` | InjectionToken | `multi`-capable token — single config or array |
| `ISdPermissionConfiguration` | Interface | Per-key configuration shape |
| `SD_PERMISSION_PUBLIC` | `const string` | The **only** accepted "no restriction" opt-out — use it in `route.data.permission` / `[sdPermission]` |
| `SdPermissionInput` | Type alias | `string \| string[] \| null \| undefined` — input type of `hasPermission` / `[sdPermission]` |

## Configuration

```ts
interface ISdPermissionConfiguration {
  /** Identifier — undefined = default portal-level fallback */
  key?: string;

  /** Set true to bypass all permission checks (POC / UAT toggle) */
  disabled?: boolean;

  /** Resolver returning the user's permission codes — sync, Promise, or Observable */
  loadPermissions: () => MaybeAsync<string[]>;

  /** Called when canActivateChild denies — e.g. router.navigateByUrl('/layout/forbidden') */
  onForbiden?: () => void;

  /** Returns current access token — used by readUnverifiedTokenClaims() */
  getToken?: () => MaybeAsync<string | undefined | null>;

  /**
   * Opt-in: mirror this key's permission codes to sessionStorage so they survive a reload.
   * Default false — codes are memory-only. NOT an authorization boundary (see "Caching" below).
   */
  persistCache?: boolean;
}

// Token accepts a single config OR an array (multi-tenant)
const SD_PERMISSION_CONFIGURATION = new InjectionToken<
  ISdPermissionConfiguration | ISdPermissionConfiguration[]
>('sd-permission.configuration');
```

## Setup

**Single config (most apps):**
```ts
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: SD_PERMISSION_CONFIGURATION,
      // useFactory (not useValue): the callbacks below run long after bootstrap, and inject() only
      // works inside an injection context — calling it from a callback body throws NG0203.
      useFactory: (): ISdPermissionConfiguration => {
        const router = inject(Router);
        const keycloak = inject(SdKeycloakService);
        return {
          loadPermissions: () => fetch('/api/me/permissions').then(r => r.json()),
          getToken: () => keycloak.getToken() ?? '',
          onForbiden: () => void router.navigateByUrl('/layout/forbidden'),
        };
      },
    },
  ],
};
```

**Multi-product portal (multi: true):**
```ts
providers: [
  {
    provide: SD_PERMISSION_CONFIGURATION, multi: true,
    useFactory: () => ({ key: 'pcm', loadPermissions: () => pcmApi.getPermissions() }),
  },
  {
    provide: SD_PERMISSION_CONFIGURATION, multi: true,
    useFactory: () => ({ key: 'oms', loadPermissions: () => omsApi.getPermissions() }),
  },
  {
    // Portal-level fallback (key: undefined)
    provide: SD_PERMISSION_CONFIGURATION, multi: true,
    useFactory: () => {
      const router = inject(Router); // hoisted: onForbiden runs outside the injection context
      return { loadPermissions: () => coreApi.getPermissions(), onForbiden: () => void router.navigateByUrl('/layout/forbidden') };
    },
  },
]
```

**Routes — preload at portal, gate per-feature:**
```ts
export const routes: Routes = [
  {
    path: '',
    canActivate: [SdPermissionGuard],         // portal: preload ALL keys
    canActivateChild: [SdPermissionGuard],    // child: enforce route.data.permission
    children: [
      { path: 'products', loadComponent: () => import('./products'),
        data: { permission: 'PCM_C_PRODUCT_LIST', permissionKey: 'pcm' } },
      { path: 'orders', loadComponent: () => import('./orders'),
        data: { permission: ['OMS_C_ORDER_LIST', 'OMS_C_ORDER_VIEW'], permissionKey: 'oms' } },
      // EVERY child under canActivateChild must declare data.permission — a genuinely public
      // child opts out explicitly, otherwise it is denied.
      { path: 'about', loadComponent: () => import('./about'),
        data: { permission: SD_PERMISSION_PUBLIC } },
      // The onForbiden target is itself a child: declare it public or nobody can ever land on it.
      // (SdLayoutModule already ships data: { permission: SD_PERMISSION_PUBLIC } on its built-in
      // home / not-found / forbidden routes.)
      { path: 'forbidden', loadComponent: () => import('./forbidden'),
        data: { permission: SD_PERMISSION_PUBLIC } },
    ],
  },
];
```

**Reset on signout (required):**
```ts
// SdPermissionService is providedIn: 'root' — a signout → signin in the same SPA session would
// otherwise keep the previous user's permission set.
// inject() only works inside an injection context, so resolve both services there and keep the
// references — calling inject() from the subscription callback throws NG0203 at runtime.
providers: [
  provideAppInitializer(() => {
    const auth = inject(SdAuthService);
    const permissions = inject(SdPermissionService);
    auth.signout$?.pipe(takeUntilDestroyed()).subscribe(() => permissions.reset());
  }),
];
```

## Breaking changes — fail-closed defaults

Every permissive default in this module has been removed. **A misconfigured consumer that used to "work" now denies.** That is the point: the old behaviour rendered a UI that looked correct and enforced nothing.

| Before | Now | Who is affected |
|---|---|---|
| `hasPermission('')` / `(undefined)` / `(null)` / `([])` returned `true` | Returns `false` + `console.error` in dev mode | Any caller passing an empty/absent code. Opt out with `SD_PERMISSION_PUBLIC` |
| `canActivateChild` allowed a route whose `data.permission` was missing or misspelled (`permision`, `permissions`) | Denies + `console.error` in dev mode. **`onForbiden` is NOT called** on this branch | Every child route under `canActivateChild: [SdPermissionGuard]` that does not declare `data.permission` |
| `*sdPermission=""` / `*sdPermission="undefinedVar"` rendered unconditionally (directive short-circuited before ever consulting the service) | Hidden — the directive always delegates to `hasPermission` | Templates binding a possibly-undefined variable |
| Permission codes were mirrored to `sessionStorage` under a fixed UUID (`212a51fa-…`), shared by all keys | Memory-only by default; per-key + namespaced (`sd-permission.codes.<key>`) only when `persistCache: true` | Anything reading that UUID key directly (nothing supported did). The old entry is no longer written or read |
| No way to clear the singleton's cache | `reset()` / `invalidate(key?)` | Apps doing signout → signin without a full page reload **must** call `reset()` |
| `decodeToken<T>()` | `readUnverifiedTokenClaims<T>()`; `decodeToken` kept as a `@deprecated` alias | Rename at your convenience; the alias will be removed in a later release |

Migration:

```ts
// Public route / element — say it out loud:
data: { permission: SD_PERMISSION_PUBLIC }
<button *sdPermission="SD_PERMISSION_PUBLIC">Always visible</button>

// Signout must clear the singleton:
permissionService.reset();

// Keep reload caching (accepting the sessionStorage exposure):
{ provide: SD_PERMISSION_CONFIGURATION, useValue: { persistCache: true, loadPermissions: … } }
```

## Public API

- **`SdPermissionDirective`** (`*sdPermission`):
  - `[sdPermission]` (`SdPermissionInput`) — codes; OR-joined when array. **Falsy/empty → hidden.** `SD_PERMISSION_PUBLIC` → always rendered.
  - `[sdPermissionKey]` (`string | undefined`) — which configuration key to consult.
- **`SdPermissionService`**:
  - `loadPermissions(key?)` — fetches + caches in memory; idempotent per key (skips on cache hit until `reset()` / `invalidate()`).
  - `loadAllPermissions()` — runs `loadPermissions` for every configured key (used by `canActivate`).
  - `hasPermission(permission, key?): boolean` — sync OR check. `true` when the `disabled` config is set or the input is exactly `SD_PERMISSION_PUBLIC`; **`false` for any empty input**.
  - `reset(): void` — clears every key: in-memory map, "already loaded" flags, and the `sessionStorage` mirror of `persistCache` keys. **Call this on signout.**
  - `invalidate(key?): void` — same, for a single key (`undefined` = the portal-level key). Next `loadPermissions(key)` re-runs the loader.
  - `getToken(key?)` — resolves the configured `getToken()`.
  - `readUnverifiedTokenClaims<T>(key?)` — base64url-decodes the JWT payload; returns `null` on failure. **No signature / `exp` verification** — see below.
  - `decodeToken<T>(key?)` — `@deprecated` alias of `readUnverifiedTokenClaims`.
- **`SdPermissionGuard`**:
  - `canActivate` → preloads (does not deny).
  - `canActivateChild` → **denies when `route.data` has no `permission` entry**; otherwise checks it against `route.data.permissionKey`. A permission that is declared but not granted calls the matching config's `onForbiden`. A route that declares **nothing** is denied silently (dev-mode `console.error` only) — see below.

## Behavior notes

- **Cache is in memory by default.** Resolved permission codes live only in the service instance. Nothing is written to `sessionStorage` / `localStorage` unless a config sets `persistCache: true`; that key then also writes `sd-permission.codes.<key>` through `SdCacheService` (`type: 'session'`) and hydrates from it on the next `loadPermissions`.
  - ⚠️ **The cache is NOT an authorization boundary.** A `sessionStorage` entry is readable **and writable** by any script on the origin and is shared by every app instance in the tab, so anyone with script execution can hand themselves UI permissions. It only saves one API round-trip on reload. The server must re-check permissions on every request regardless.
  - ⚠️ A hydrated key is *stale by construction* — the loader is not re-run for that key until `reset()` / `invalidate(key)`.
- **Singleton lifetime.** The service is `providedIn: 'root'`, so its cache outlives a client-side signout. Wire `reset()` into your signout flow or the next user inherits the previous user's permission set.
- **Resolution algorithm — `#getEffectivePermissionKey`:**
  1. If a configuration with that exact `key` exists, use it.
  2. Else if the requested `key` is non-undefined AND a portal-level config (`key === undefined`) exists, fall back to the portal config.
  3. Else use the requested `key` as-is (will resolve to empty permissions list).
- **OR semantics:** array codes pass if user has ANY one. There is no AND helper — split into multiple `*sdPermission` guards or use a custom check via `hasPermission(...)` in TS.
- **Empty / missing permission input → DENY (fail closed).** `undefined`, `null`, `''`, `[]` and arrays of blank strings are treated as a broken configuration, not as "no restriction": the directive hides, `hasPermission` returns `false`, and `canActivateChild` denies when `route.data` carries no `permission` entry at all. Under `isDevMode()` each of these logs a `console.error` naming the fix. The only accepted way to say "no restriction" is the explicit `SD_PERMISSION_PUBLIC` sentinel.
- **Unverified token claims.** `readUnverifiedTokenClaims()` is a plain base64url decode of the JWT payload. It checks **no** signature, `exp`, `nbf`, `aud` or `iss` — anyone can craft a token with arbitrary claims and this method will happily return them. Use it for display only (name, avatar, current tenant). **Never** let its result drive an authorization decision on the client or be forwarded as proof to a backend.
- **`disabled: true`** short-circuits `hasPermission` to always-true (NOT guard preload — it still runs, but checks pass).
- **Duplicate keys:** providing two configs with the same `key` (incl. both `undefined`) throws on first service injection.
- **`onForbiden` lookup:** for a child route that declared a permission and did not get it, the guard finds the first config matching `permissionKey` (or, when `permissionKey` is set but no exact match, the portal-level `undefined` config) that has an `onForbiden` and calls it.
- **`onForbiden` is deliberately NOT called when the route declared no `permission` at all.** `onForbiden` typically navigates to a forbidden page, and that page is a child route too: if it were also missing its declaration, the guard would deny it and call `onForbiden` again — an infinite redirect loop that hangs the app. A missing declaration is a *configuration* error, so the guard denies silently (plus the dev-mode `console.error`) and a misconfiguration can never self-recurse. Declare `data: { permission: SD_PERMISSION_PUBLIC }` on the `onForbiden` target; `SdLayoutModule`'s built-in `home` / `not-found` / `forbidden` routes already do.

## Examples

**Hide a button:**
```html
<button *sdPermission="'PCM_C_PRODUCT_CREATE'">New product</button>

<!-- ANY of -->
<button *sdPermission="['PCM_C_PRODUCT_UPDATE', 'PCM_C_PRODUCT_ADMIN']">Edit</button>

<!-- Multi-product portal: scope to product key -->
<a *sdPermission="'OMS_C_ORDER_LIST'; sdPermissionKey: 'oms'" routerLink="/orders">Orders</a>

<!-- Intentionally unrestricted: must be explicit — an empty/undefined binding is now HIDDEN -->
<button *sdPermission="SD_PERMISSION_PUBLIC">Help</button>
```

**Programmatic check:**
```ts
@Component({ ... })
export class Toolbar {
  private readonly perm = inject(SdPermissionService);

  canBulkDelete = computed(() =>
    this.perm.hasPermission(['PCM_C_PRODUCT_DELETE', 'PCM_ADMIN'], 'pcm')
  );
}
```

**Route data:**
```ts
{
  path: 'detail/:id',
  loadComponent: () => import('./detail'),
  data: { permission: 'PCM_C_PRODUCT_DETAIL', permissionKey: 'pcm' },
}
```

## Test coverage

| File | Specs | Notes |
|---|---|---|
| `src/services/permission.service.spec.ts` | 51 | config validation, load / loadAll, `hasPermission` **fail-closed + `SD_PERMISSION_PUBLIC`**, memory-only cache + `persistCache` opt-in, `reset()` / `invalidate()`, `readUnverifiedTokenClaims` |
| `src/guards/permission.guard.spec.ts` | 17 | portal preload, **deny on missing / misspelled `data.permission`**, explicit opt-out, `onForbiden` routing, **no redirect loop when the forbidden target itself declares nothing** |
| `../layout/layout.routing.spec.ts` | 4 | the library's own `home` / `not-found` / `forbidden` routes declare `SD_PERMISSION_PUBLIC` and really pass `canActivateChild` |
| `src/directives/permission.directive.spec.ts` | 15 | **empty binding hides**, always delegates to `hasPermission`, keyed lookup, reactivity |

## Anti-patterns

- Do NOT use `SdPermissionGuard.canActivate` on every leaf route — it's designed for a portal-level preload (calls `loadAllPermissions`). Per-route enforcement belongs in `canActivateChild`.
- Do NOT mutate the array returned by `loadPermissions()` — it's distinct'd and cached, but mutation will not refresh the in-memory map.
- Do NOT rely on `*sdPermission` for security — it only hides UI. Always also enforce on the API.
- Do NOT pass duplicate `key` values across multi providers — service constructor throws.
- Do NOT call `loadPermissions(key)` from inside `loadPermissions` (recursive) — the service guards against re-entry but produces an empty list.
- Do NOT leave `data.permission` off a child route under `canActivateChild` and expect it to be reachable — declare a code or `SD_PERMISSION_PUBLIC`.
- Do NOT forget `reset()` on signout — the root singleton would otherwise carry the previous user's permissions into the next session.
- Do NOT enable `persistCache` and then treat the stored codes as trustworthy — any script on the origin can rewrite that entry.
- Do NOT branch on `readUnverifiedTokenClaims()` (or the deprecated `decodeToken()`) for authorization — the payload is unauthenticated attacker-controllable data.

## Related

- [auth module](./sd-auth.md) — usually paired so `getToken` resolves to the auth provider's current access token; also the place to hook `signout$ → permissionService.reset()`.
- [keycloak module](./sd-keycloak.md) or an app-owned provider — typical sources for `loadPermissions` (decode JWT roles or call a backend).
- [layout module](./sd-layout.md) — sidebar `SdLayoutMenu` items carry `permission` / `permissionKey` and are filtered using the same service (a menu item with an empty `permission` is now hidden).
- [sd-cache](../services/sd-cache.md) — backing store used only for the opt-in `persistCache` mirror (`type: 'session'`).
