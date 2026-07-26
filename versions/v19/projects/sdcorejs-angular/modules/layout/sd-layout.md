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
| `SidebarV1Component`, `SidebarMobileV1Component`   | Existing classic sidebar and mobile drawer                                                     |
| `SidebarV2Component`, `SidebarMobileV2Component`   | Compact primary rail with contextual flyout or mobile bottom sheet                             |
| `SidebarV3Component`, `SidebarMobileV3Component`   | Collapsible navigation with search, Pinned, and Recent sections                                |
| `SdLayoutService`                                  | Exposes resolved `userInfo` and `sidebar` signals                                              |
| `SdViewportService`                                | Shared signal source for viewport dimensions and responsive state                              |
| `SdLayoutResponsiveService`                        | Deprecated compatibility adapter that evaluates the layout breakpoint over `SdViewportService` |
| `SdLayoutNavigationStateService`                   | Shares pinned/recent stable keys and version-scoped UI state                                   |
| `SdLayoutStorageService`                           | Persists layout state through `SdStorageService` and migrates legacy pinned objects lazily     |
| `MenuPipe`, `MenuFocusPipe`, `HighLightSearchPipe` | Permission filtering, route focus, and search highlighting                                     |
| `SD_LAYOUT_CONFIGURATION`                          | Consumer layout configuration                                                                  |
| `SD_LAYOUT_VIEWPORT`                               | Compatibility alias of the shared `SD_VIEWPORT` test/host abstraction                          |

`SdLayoutModule` also registers the built-in `home`, `not-found`, and `forbidden` child routes.

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

Provide the permission module configuration used by `MenuPipe` whenever menu permissions are strings. Boolean permissions such as `permission: true` are useful for public destinations and isolated demos.

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

V2's desktop rail and V3's collapsed desktop drawer center the avatar as the account-menu trigger without rendering a separate disclosure chevron. Collapsed V3 also hides the brand block and keeps only the centered expand control; the expanded drawer and both mobile variants retain the full account identity presentation.

V2/V3 desktop and mobile menu searches share the same internal Soft-pill field: a gray token-based surface, leading search icon and primary focus ring. Placeholder text, `autoId` hooks, accent-insensitive filtering and parent-owned search signals keep their existing contracts.

## Responsive, storage, and migration behavior

- `mobileBreakpoint` defaults to `1024`. A width strictly below the normalized value is mobile; invalid or non-positive values fall back to the default.
- `SdLayout` keeps consuming the compatibility `SdLayoutResponsiveService`, which reads `SdViewportService.width`; existing service overrides remain valid and V1/V2/V3 switch from the same application-wide resize listener.
- `SdLayoutResponsiveService` delegates to `SdViewportService`; `SD_LAYOUT_VIEWPORT` aliases `SD_VIEWPORT`, so existing consumers and test providers continue to work without registering a second listener.
- Pinned and Recent entries are persisted as stable menu keys. Missing or no-longer-permitted keys are discarded when the current menu tree is hydrated.
- Existing V1 pinned menu objects are migrated lazily to stable keys the first time the shared navigation state is read. No eager storage rewrite is required during application startup.
- Pinned and Recent data are shared between sidebar versions. Version-specific UI state such as V2 active/locked group and V3 collapsed state remains scoped by version.
- For V3, a persisted collapsed value takes precedence over `defaultCollapsed`. Recent items are deduplicated, newest first, and capped by `recent.maxItems`.
- Do not read the UUID-backed local-storage entries directly. Use `SdLayoutStorageService` or `SdLayoutNavigationStateService` so validation and migration continue to run.

## Accessibility

- Version controls and sidebar actions are native buttons with visible keyboard focus.
- Desktop flyouts and mobile sheets close with Escape. Mobile overlays trap focus, restore focus to their trigger, and release body scroll when closed or destroyed.
- Active, expanded, pressed, dialog, and navigation states are exposed with the corresponding ARIA attributes.
- Motion used for preview/sidebar transitions is removed when `prefers-reduced-motion: reduce` is active.
- Keep menu titles meaningful and unique; icons are supplementary and must not be the only accessible label.

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
