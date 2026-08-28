# Layout Module

- **Type:** `@NgModule` (`SdLayoutModule`) plus standalone components, pipes, and services
- **Import path:** `@sdcorejs/angular/modules/layout`
- **Library version:** `@sdcorejs/angular@19.0.0-beta.86`

## Purpose

`<sd-layout>` is the top-level application shell for Core UI portals. It filters a typed menu tree, renders the current user, and switches between a desktop and mobile sidebar at a configurable runtime breakpoint. Version 1 remains supported; versions 2 and 3 provide alternative navigation models without changing the content host.

Use it for back-office portals that need permission-aware navigation, responsive desktop/mobile composition, pinned or recent destinations, and persistent sidebar preferences. Do not mount it inside a modal, drawer, widget, or another layout shell, and do not use it as an authentication mechanism.

## Public surface

| API                                                | Purpose                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `SdLayoutComponent` / `sd-layout`                  | Selects the configured V1, V2, or V3 desktop/mobile pair and projects page content             |
| `SdPageComponent` / `sd-page`                      | Renders a titled content frame inside the shell                                                |
| `SdSidebarV1`, `SdSidebarMobileV1`   | Existing classic sidebar and mobile drawer                                                     |
| `SdSidebarV2`, `SdSidebarMobileV2`   | Compact primary rail with contextual flyout or mobile bottom sheet                             |
| `SdSidebarV3`, `SdSidebarMobileV3`   | Collapsible navigation with search, Pinned, and Recent sections                                |
| `SdLayoutService`                                  | Exposes resolved `userInfo` and `sidebar` signals plus the resolved `homeUrl`                  |
| `SdViewportService`                                | Shared signal source for viewport dimensions and responsive state                              |
| `SdLayoutResponsiveService`                        | Deprecated compatibility adapter that evaluates the layout breakpoint over `SdViewportService` |
| `SdLayoutNavigationStateService`                   | Shares pinned/recent stable keys and version-scoped UI state                                   |
| `SdLayoutStorageService`                           | Persists layout state through `SdStorageService`, migrates legacy pinned objects lazily, and exposes `clear()` |
| `MenuPipe`, `MenuFocusPipe`, `HighLightSearchPipe` | Permission filtering, route focus, and search highlighting                                     |
| `resolveTabName(key)`                              | Resolves a translated `@SdTabComponent` tab label without Angular DI |
| `SD_LAYOUT_CONFIGURATION`                          | Consumer layout configuration. **Required** — `SdLayoutService` throws when it is missing      |
| `SD_LAYOUT_DEMO_FALLBACK`                          | `boolean`. Opt-in mock user/sidebar for demos when `SD_LAYOUT_CONFIGURATION` is absent         |
| `SD_LAYOUT_STORAGE_NAMESPACE`                      | `SdLayoutStorageNamespace` — optional user/tenant namespace for every persisted layout entry   |
| `SdLayoutStorageNamespace`                         | `string \| (() => string \| null \| undefined)` — a resolver is re-read on every handle access |
| `SD_LAYOUT_VIEWPORT`                               | Compatibility alias of the shared `SD_VIEWPORT` test/host abstraction                          |

`SdLayoutModule` also registers the built-in `home`, `not-found`, and `forbidden` child routes. Each of
them declares `data: { permission: SD_PERMISSION_PUBLIC }` so that an application mounting the layout
under `canActivateChild: [SdPermissionGuard]` can still reach them — in particular the `forbidden`
page, which is the usual `onForbiden` target and would otherwise deny itself.

## Configuration

```ts
interface ISdLayoutConfiguration {
  homeUrl?: string;
  mobileBreakpoint?: number; // default: 1024; widths below this value use mobile
  sidebar: ISdSidebarConfiguration | (() => MaybeAsync<ISdSidebarConfiguration>);
  userInfo: SdLayoutUserInfo | (() => MaybeAsync<SdLayoutUserInfo>);
  signout: () => void | Promise<void>;
  changePassword?: () => void | Promise<void>;
  updateProfile?: () => void | Promise<void>;
  setting?: () => void | Promise<void>;
  notification?: {
    count: number | Signal<number> | Observable<number>;
    action: () => void | Promise<void>;
  };
}

type ISdSidebarConfiguration = SidebarConfigurationV1 | SidebarConfigurationV2 | SidebarConfigurationV3;

interface SdLayoutUserInfo {
  username?: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  role?: SdLayoutUserRole;
}

interface SdLayoutUserRole {
  text: string;
  icon?: string;
  color?: string;
}
```

Shared sidebar fields are `brandColor`, `brandLightColor`, `logoUrl`, `defaultTitle`, and `pin.enabled`.

`homeUrl` is the destination the built-in `forbidden` and `not-found` pages navigate to (via `Router`) when the user presses their "back home" button; it defaults to `/`. It is also exposed as `SdLayoutService.homeUrl`.

### `SD_LAYOUT_CONFIGURATION` is required

`SdLayoutService` throws when the token is not provided. It used to log a warning and degrade to a mock user (`demo@example.com`) with a no-op sign-out, which let a misconfigured application ship a UI that claimed the visitor was signed in.

Demos and playgrounds that genuinely want the mock data must say so:

```ts
import { SD_LAYOUT_DEMO_FALLBACK } from '@sdcorejs/angular/modules/layout';

providers: [{ provide: SD_LAYOUT_DEMO_FALLBACK, useValue: true }];
```

The flag is a separate token rather than a field of `ISdLayoutConfiguration` because it has to be readable in exactly the case where no configuration object exists. Never enable it in a real environment.

Account actions appear only when their callback is configured. Their order is `updateProfile`, `setting`, `notification`, `changePassword`, then `signout`. Role metadata is hidden when `role.text` is empty. Notification counts are normalized to a non-negative integer, hidden at zero, and capped visually at `99+`; the notification action remains available at zero. Observable sources are subscribed once per current configuration and released with the account menu component.

| Version | Configuration                                   | Defaults and behavior                                                                                                 |
| ------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| V1      | `{ version: 1 }`                                | Existing classic layout; runtime desktop/mobile switching now uses `mobileBreakpoint`                                 |
| V2      | `{ version: 2, interaction?, primaryMenuIds? }` | `interaction` defaults to `click`; at most three valid primary groups are used and remaining groups fall back to More |
| V3      | `{ version: 3, defaultCollapsed?, recent? }`    | `defaultCollapsed` defaults to `false`; Recent defaults to enabled with `maxItems: 5`                                 |

## Setup

```ts
import { ApplicationConfig, importProvidersFrom, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SdAuthService } from '@sdcorejs/angular/modules/auth';
import { ISdLayoutConfiguration, SD_LAYOUT_CONFIGURATION, SdLayoutModule } from '@sdcorejs/angular/modules/layout';

const unreadNotificationCount = signal(6);

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(SdLayoutModule),
    {
      provide: SD_LAYOUT_CONFIGURATION,
      useFactory: () => {
        const auth = inject(SdAuthService);
        const router = inject(Router);
        return {
          homeUrl: '/dashboard',
          mobileBreakpoint: 1024,
          sidebar: {
            version: 2,
            interaction: 'click',
            primaryMenuIds: ['workspace', 'reports', 'settings'],
            pin: { enabled: true },
          },
          userInfo: () => {
            const user = auth.getAuthInfo!() ?? {};
            return {
              fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
              email: user.email,
              username: user.username,
              role: user.roleName ? { text: user.roleName, icon: 'badge' } : undefined,
            };
          },
          signout: () => auth.signout(),
          changePassword: () => auth.changePassword(),
          updateProfile: async () => {
            await router.navigate(['/account/profile']);
          },
          setting: async () => {
            await router.navigate(['/account/settings']);
          },
          notification: {
            count: unreadNotificationCount,
            action: async () => {
              await router.navigate(['/notifications']);
            },
          },
        } satisfies ISdLayoutConfiguration;
      },
    },
  ],
};
```

```html
<sd-layout [menus]="menus()">
  <router-outlet />
</sd-layout>
```

Provide the permission module configuration used by `MenuPipe` whenever menu permissions are strings. Boolean permissions such as `permission: true` are useful for public destinations and isolated demos. Every navigable leaf must carry a `permission` field; see "Menu filtering fails closed" below.

## Version examples

All three objects below are compile-ready values for `ISdLayoutConfiguration['sidebar']`.

```ts
import { SidebarConfigurationV1, SidebarConfigurationV2, SidebarConfigurationV3 } from '@sdcorejs/angular/modules/layout';

const sidebarV1: SidebarConfigurationV1 = {
  version: 1,
  defaultTitle: 'Admin Portal',
  brandColor: '#1565c0',
  pin: { enabled: true },
};

const sidebarV2: SidebarConfigurationV2 = {
  version: 2,
  interaction: 'hover-lock',
  primaryMenuIds: ['workspace', 'reports', 'settings'],
  pin: { enabled: true },
};

const sidebarV3: SidebarConfigurationV3 = {
  version: 3,
  defaultCollapsed: false,
  recent: { enabled: true, maxItems: 5 },
  pin: { enabled: true },
};
```

The active version can also change at runtime. The shell keeps projected content mounted and recomposes only the sidebar pair.

```ts
import { inject } from '@angular/core';
import { SdLayoutService, SidebarConfigurationV3 } from '@sdcorejs/angular/modules/layout';

export class ShellPreferences {
  readonly #layout = inject(SdLayoutService);

  useCompactSidebar(): void {
    const sidebar: SidebarConfigurationV3 = {
      version: 3,
      defaultCollapsed: true,
      recent: { enabled: true, maxItems: 5 },
    };
    this.#layout.sidebar.set(sidebar);
  }
}
```

## Menu model

Use a stable `id` for every group and leaf. A route `path` is used as the stable fallback for leaves when an id is unavailable.

```ts
import { SdLayoutMenu } from '@sdcorejs/angular/modules/layout';

const menus: SdLayoutMenu[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    icon: 'space_dashboard',
    children: [
      { id: 'overview', title: 'Overview', path: '/overview', permission: true },
      { id: 'tasks', title: 'Tasks', path: '/tasks', permission: 'TASK_R_LIST' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: 'bar_chart',
    children: [{ id: 'sales', title: 'Sales', path: '/reports/sales', permission: 'REPORT_R_SALES' }],
  },
];
```

V2 honors up to three valid `primaryMenuIds` in the supplied order, fills missing slots from the remaining visible roots, and exposes overflow through More. V3 search is accent-insensitive and searches the filtered menu tree.

### Active menu resolution prefers the most exact path

A menu is active only when it owns the longest `path` that matches the current route. With both `/appointment` and `/appointment/cs` declared, standing on `/appointment/cs` highlights the child alone — the ancestor entry is no longer lit up, and `aria-current="page"` is set on that one row. `resolveActiveMenuPath(menus, routePath)` from the layout `utils` is the single decision point: V1 uses it for node focus, menu-group binding and branch expansion, and the shared `sd-layout-menu-tree` (V2, V3 and their mobile variants) uses it for `isActive`. Matching stays segment-based, so `/appointment` never matches `/appointments`, and a route with no menu of its own (`/appointment/cs/123`) still activates its closest declared ancestor. `MenuFocusPipe` takes the resolved path as its third argument; called with two arguments it keeps the previous prefix matching.

### Menu filtering fails closed

`MenuPipe` drops a leaf instead of rendering it when either check fails:

- **`permission` is missing.** A leaf that has a `path` but no `permission` key is removed. A mistyped key (`permision`, `permissions`) therefore hides the entry rather than showing it to everyone. `permission: undefined` was already handled and still fails closed. Entries with neither `path` nor `children` (labels, dividers) are unaffected.
- **`path` uses an unsafe scheme.** A path is kept when it is app-relative (`/reports`) or an absolute `http:` / `https:` URL. Anything else — `javascript:`, `data:`, `vbscript:` — is removed, and a group left with no surviving children is removed with it.

External destinations open through the shared `sdOpenExternal` helper, so every sidebar version passes `noopener,noreferrer` and never hands `window.opener` to the opened tab. The previous `path.includes('http')` test was a substring match, so a value such as `javascript:fetch(...)//http` passed it and executed in the application origin.

V2's desktop rail and V3's collapsed desktop drawer center the avatar as the account-menu trigger without rendering a separate disclosure chevron. Collapsed V3 also hides the brand block and keeps only the centered expand control; the expanded drawer and both mobile variants retain the full account identity presentation.

V2/V3 desktop and mobile menu searches share the same internal Soft-pill field: a gray token-based surface, leading search icon and primary focus ring. Placeholder text, `autoId` hooks, accent-insensitive filtering and parent-owned search signals keep their existing contracts.

## Built-in page tabs

All three built-in pages register themselves with `<sd-tab-router>` via `@SdTabComponent`, so opening them in a tabbed shell shows a proper icon + localized label instead of an empty tab:

| Page | Icon | Color | Label key |
|---|---|---|---|
| `home` | `home` | `primary` | `core.module.layout.home.tab-name` |
| `forbidden` | `block` | `error` | `core.module.layout.forbidden.tab-name` |
| `not-found` | `search_off` | `warning` | `core.module.layout.not-found.tab-name` |

Labels are translated in all five bundled locales (English: "Home" / "Access Denied" / "Page Not Found"). Follow the same shape when adding a new page:

```ts
@SdTabComponent({
  component: MyPageComponent,
  name: () => resolveTabName('core.module.layout.my-page.tab-name'),
  icon: 'description',
  color: 'primary',
})
```

## Responsive, storage, and migration behavior

- `mobileBreakpoint` defaults to `1024`. A width strictly below the normalized value is mobile; invalid or non-positive values fall back to the default.
- Layout and the V2/V3 mobile custom-element hosts are block-level so their full-height shells start at the containing block instead of an inline text baseline.
- `SdLayout` keeps consuming the compatibility `SdLayoutResponsiveService`, which reads `SdViewportService.width`; existing service overrides remain valid and V1/V2/V3 switch from the same application-wide resize listener.
- `SdLayoutResponsiveService` delegates to `SdViewportService`; `SD_LAYOUT_VIEWPORT` aliases `SD_VIEWPORT`, so existing consumers and test providers continue to work without registering a second listener.
- Pinned and Recent entries are persisted as stable menu keys. Missing or no-longer-permitted keys are discarded when the current menu tree is hydrated.
- Existing V1 pinned menu objects are migrated lazily to stable keys the first time the shared navigation state is read. No eager storage rewrite is required during application startup.
- Pinned and Recent data are shared between sidebar versions. Version-specific UI state such as V2 active/locked group and V3 collapsed state remains scoped by version.
- For V3, a persisted collapsed value takes precedence over `defaultCollapsed`. Recent items are deduplicated, newest first, and capped by `recent.maxItems`.
- Do not read the UUID-backed local-storage entries directly. Use `SdLayoutStorageService` or `SdLayoutNavigationStateService` so validation and migration continue to run.
- Persisted entries are keyed by fixed UUIDs that carry no identity. On a shared browser that means the next person to sign in inherits the previous user's pinned and recently visited modules unless the application separates them. Two mechanisms are available and are meant to be used together:

  ```ts
  import { SD_LAYOUT_STORAGE_NAMESPACE, SdLayoutStorageService } from '@sdcorejs/angular/modules/layout';
  import { SdAuthService } from '@sdcorejs/angular/modules/auth';

  // 1. Scope every entry to the signed-in user or tenant.
  //    SdLayoutStorageService is a root singleton and is usually constructed BEFORE anyone has
  //    signed in, so provide a FUNCTION: it is re-evaluated on every handle access, and the seven
  //    handles are rebuilt as soon as it reports a different identity.
  providers: [
    {
      provide: SD_LAYOUT_STORAGE_NAMESPACE,
      useFactory: () => {
        const auth = inject(SdAuthService); // hoisted — the resolver runs outside the injection context
        return () => auth.getAuthInfo?.()?.id;
      },
    },
  ];

  // 2. Wipe the entries on sign-out, BEFORE the identity is dropped.
  @Injectable({ providedIn: 'root' })
  export class SessionService {
    readonly #layoutStorage = inject(SdLayoutStorageService); // hoisted — inject() in the body throws NG0203
    readonly #auth = inject(SdAuthService);

    async signout(): Promise<void> {
      this.#layoutStorage.clear();
      this.#auth.signout();
    }
  }
  ```

  `SD_LAYOUT_STORAGE_NAMESPACE` accepts a `string` or a `() => string | null | undefined` resolver (`SdLayoutStorageNamespace`). A blank or whitespace-only value is treated as no namespace, and a handle created without a namespace keeps exactly the storage key the library used before this token existed — existing installations keep reading their current data after an upgrade. Because the namespace is resolved at call time, `clear()` wipes the partition of whoever is signed in *at that moment*: call it before the auth info goes back to `undefined`, otherwise it clears the anonymous partition and leaves the signed-out user's data behind. `clear()` removes `isShowSidebar`, `menuLockStatus`, `lastActiveMenuGroupId`, `pinnedMenuGroup`, `pinnedMenuKeys`, `recentMenuKeys`, and `versionStates`; in-memory pinned/recent signals are rebuilt on the next `SdLayoutNavigationStateService.hydrate()`.
- The built-in `forbidden` and `not-found` pages leave through `Router.navigateByUrl(homeUrl)`. They no longer assign to `window.location`, which reloaded the error page itself and was unavailable during server-side rendering.

## Accessibility

- Version controls and sidebar actions are native buttons with visible keyboard focus.
- Desktop flyouts and mobile sheets close with Escape. Mobile overlays trap focus, restore focus to their trigger, and release body scroll when closed or destroyed.
- Active, expanded, pressed, dialog, and navigation states are exposed with the corresponding ARIA attributes.
- Motion used for preview/sidebar transitions is removed when `prefers-reduced-motion: reduce` is active.
- **No nested interactive elements.** On the v1 sidebar the menu row keeps its click handler as a mouse convenience, but `role="button"` / `tabindex` / `aria-current` / Enter-Space sit on the TITLE element, with the pin toggle as an independent sibling button. A `role="button"` wrapper around another button makes assistive tech collapse the pair into a single control and drop the inner one.
- Keep menu titles meaningful and unique; icons are supplementary and must not be the only accessible label.

## i18n

Chrome the layout owns (as opposed to consumer-supplied menu titles) resolves through `I18nService`:

| What                                                               | Key                                   |
| ------------------------------------------------------------------ | ------------------------------------- |
| "Pinned" heading (v1 tooltip + group title, v3, mobile v3)         | `core.module.layout.sidebar.pinned`   |
| "Recent" heading (v3, mobile v3)                                   | `core.module.layout.sidebar.recent`   |
| "All menus" heading (v3, mobile v3)                                | `core.module.layout.sidebar.all-menu` |
| Pin toggle `aria-label` (shared `menu-tree`, v1 sidebar)           | `core.module.layout.menu.pin`         |
| Unpin toggle `aria-label` (shared `menu-tree`, v1 sidebar)         | `core.module.layout.menu.unpin`       |
| Home link `aria-label` on the v1 logo                              | `core.module.layout.home.tab-name`    |
| Brand button `aria-label` (v2 rail)                                | `core.module.layout.home.tab-name`    |
| Menu-group nav `aria-label` (v2 rail)                              | `core.module.layout.sidebar.menu-groups` |
| Backdrop / close `aria-label` (v2, mobile v2)                      | `core.module.layout.sidebar.close-menu` |
| Context search placeholder (v2)                                    | `core.module.layout.sidebar.search-in-group` |
| Primary-nav `aria-label` (mobile v2)                               | `core.module.layout.sidebar.primary-nav` |
| "More" bar action label + `aria-label` (mobile v2)                  | `core.module.layout.sidebar.more` / `.more-menu` |
| Menu search placeholder (mobile v2)                                | `core.module.layout.sidebar.search-in-menu` |

`menu.pin` / `menu.unpin` interpolate `{title}` (the menu's own title) so each locale places the verb and the
name in its own order — the previous `'Pin ' + title` concatenation forced English word order everywhere. The
label is built inside the `nodes` / `pinnedMenuGroup` computeds, so it follows a language change.

`SdLayoutService` deliberately keeps its "SD_LAYOUT_CONFIGURATION was not provided" throw/warn out of the
catalogue: those are developer diagnostics, not user-facing copy (marked `@i18n-ignore` in the source).

## Notes and anti-patterns

- Do not pass an Observable directly to `userInfo` or `sidebar`; pass a value or a function returning a supported `MaybeAsync` value.
- Do not use viewport user-agent detection or cache a one-time mobile boolean. Let `<sd-layout>` react to `mobileBreakpoint` changes in the viewport.
- Do not mutate raw pinned/recent arrays or store full new menu objects. Stable ids keep state valid across labels, permissions, and versions.
- Do not mount `<sd-layout>` under another layout route; it owns fixed navigation and the page content boundary.
- Use `inject()` in new consumers instead of constructor injection, and derive display state with signals/computed values.

## Related

- [Auth module](../auth/sd-auth.md) supplies the user and sign-out actions.
- [Permission module](../permission/sd-permission.md) resolves string permission codes used by menus.
- [Keycloak module](../keycloak/sd-keycloak.md) can feed authenticated identity and roles into both configurations.
