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
- Need cached, session-persisted permission lists (backed by `SdCacheService` with `type: 'session'`).

## When NOT to use

- Do not use it as the only security layer. It hides UI and blocks client routes; APIs must enforce permissions again.
- Do not use it for authentication or token refresh. Pair it with `auth`, `keycloak`, or an app-owned provider.
- Do not use `SdPermissionGuard.canActivate` on each leaf route. Use it once at the portal layer to preload; enforce children with `canActivateChild`.
- Do not use permission codes as labels or feature names in the UI. Keep them as stable backend-facing identifiers.

## What it provides

| Symbol | Kind | Purpose |
|---|---|---|
| `SdPermissionDirective` | Directive (selector `[sdPermission]`) | Structural directive — renders template only if user has at least one of the given codes |
| `SdPermissionService` | Service (`providedIn: 'root'`) | Loads / caches permissions per key, exposes `hasPermission`, `getToken`, `decodeToken` |
| `SdPermissionGuard` | Route guard (`CanActivate` + `CanActivateChild`) | `canActivate` preloads ALL permissions (use at portal layer); `canActivateChild` checks `route.data.permission` against `route.data.permissionKey` |
| `SD_PERMISSION_CONFIGURATION` | InjectionToken | `multi`-capable token — single config or array |
| `ISdPermissionConfiguration` | Interface | Per-key configuration shape |

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

  /** Returns current access token — used by decodeToken() */
  getToken?: () => MaybeAsync<string | undefined | null>;
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
      useValue: {
        loadPermissions: () => fetch('/api/me/permissions').then(r => r.json()),
        getToken: () => inject(SdKeycloakService).getToken() ?? '',
        onForbiden: () => inject(Router).navigateByUrl('/layout/forbidden'),
      } satisfies ISdPermissionConfiguration,
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
    useFactory: () => ({ loadPermissions: () => coreApi.getPermissions(), onForbiden: () => router.navigateByUrl('/layout/forbidden') }),
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
    ],
  },
];
```

## Public API

- **`SdPermissionDirective`** (`*sdPermission`):
  - `[sdPermission]` (`string | string[] | null | undefined`) — codes; OR-joined when array. Falsy/empty → render unconditionally.
  - `[sdPermissionKey]` (`string | undefined`) — which configuration key to consult.
- **`SdPermissionService`**:
  - `loadPermissions(key?)` — fetches + caches; idempotent per key (skips on cache hit).
  - `loadAllPermissions()` — runs `loadPermissions` for every configured key (used by `canActivate`).
  - `hasPermission(permission, key?)` — sync OR check; truthy if `disabled` config or empty input.
  - `getToken(key?)` — resolves the configured `getToken()`.
  - `decodeToken<T>(key?)` — base64url-decodes JWT payload; returns `null` on failure.
- **`SdPermissionGuard`**:
  - `canActivate` → preloads (does not deny).
  - `canActivateChild` → checks `route.data.permission` against `route.data.permissionKey`; on deny, calls matching config's `onForbiden`.

## Behavior notes

- **Cache:** permissions per key are stored in `SdCacheService` (`type: 'session'`, sessionStorage-backed) keyed by an internal UUID. Survives reloads within the same browser session. `permissionMapByKey` is also held in memory for synchronous `hasPermission` lookups.
- **Resolution algorithm — `#getEffectivePermissionKey`:**
  1. If a configuration with that exact `key` exists, use it.
  2. Else if the requested `key` is non-undefined AND a portal-level config (`key === undefined`) exists, fall back to the portal config.
  3. Else use the requested `key` as-is (will resolve to empty permissions list).
- **OR semantics:** array codes pass if user has ANY one. There is no AND helper — split into multiple `*sdPermission` guards or use a custom check via `hasPermission(...)` in TS.
- **Empty / missing permission input** → directive renders the template (treated as "no restriction"). Same for `route.data.permission` being undefined → guard returns true.
- **`disabled: true`** short-circuits `hasPermission` to always-true (NOT guard preload — it still runs, but checks pass).
- **Duplicate keys:** providing two configs with the same `key` (incl. both `undefined`) throws on first service injection.
- **`onForbiden` lookup:** for a denied child route, the guard finds the first config matching `permissionKey` (or, when `permissionKey` is set but no exact match, the portal-level `undefined` config) that has an `onForbiden` and calls it.

## Examples

**Hide a button:**
```html
<button *sdPermission="'PCM_C_PRODUCT_CREATE'">New product</button>

<!-- ANY of -->
<button *sdPermission="['PCM_C_PRODUCT_UPDATE', 'PCM_C_PRODUCT_ADMIN']">Edit</button>

<!-- Multi-product portal: scope to product key -->
<a *sdPermission="'OMS_C_ORDER_LIST'; sdPermissionKey: 'oms'" routerLink="/orders">Orders</a>
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

## Anti-patterns

- Do NOT use `SdPermissionGuard.canActivate` on every leaf route — it's designed for a portal-level preload (calls `loadAllPermissions`). Per-route enforcement belongs in `canActivateChild`.
- Do NOT mutate the array returned by `loadPermissions()` — it's distinct'd and cached, but mutation will not refresh the in-memory map.
- Do NOT rely on `*sdPermission` for security — it only hides UI. Always also enforce on the API.
- Do NOT pass duplicate `key` values across multi providers — service constructor throws.
- Do NOT call `loadPermissions(key)` from inside `loadPermissions` (recursive) — the service guards against re-entry but produces an empty list.

## Related

- [auth module](./sd-auth.md) — usually paired so `getToken` resolves to the auth provider's current access token.
- [keycloak module](./sd-keycloak.md) or an app-owned provider — typical sources for `loadPermissions` (decode JWT roles or call a backend).
- [layout module](./sd-layout.md) — sidebar `SdLayoutMenu` items carry `permission` / `permissionKey` and are filtered using the same service.
- [sd-cache](../services/sd-cache.md) — backing store for permission lists (`type: 'session'`).
