# Layout Module

- **Type:** `@NgModule` (`SdLayoutModule`) plus standalone components, pipes, and services
- **Import path:** `@sdcorejs/angular/modules/layout`
- **Library version:** `@sdcorejs/angular@19.0.0-beta.86`

## Purpose

`<sd-layout>` is the top-level application shell for Core UI portals. It filters a typed menu tree, renders the current user, and switches between a desktop and mobile sidebar at a configurable runtime breakpoint. Version 1 remains supported; versions 2, 3 and 4 provide alternative navigation models without changing the content host.

Every sidebar version can also host a Context Switcher. Assign `sidebar.context` and Core persists the context the user works in (a store, a branch, a tenant), restores it on the next load and reloads the page after a switch; see [Context switcher](#context-switcher).

Use it for back-office portals that need permission-aware navigation, responsive desktop/mobile composition, pinned or recent destinations, and persistent sidebar preferences. Do not mount it inside a modal, drawer, widget, or another layout shell, and do not use it as an authentication mechanism.

The V1 desktop menu tree scrolls to the bottom of the sidebar. Only the icon rail reserves space for the fixed user avatar and collapse controls; long lists in both columns remain independently scrollable.

V1 uses a light 304px sidebar with a 56px module rail, a bold neutral title, and compact Material Icons Outlined from the existing menu `icon` / `iconUrl` fields. Child branches have guide lines and a separate active-page marker; the existing route matching, search, permissions, pinning and expand/collapse behavior are unchanged. The avatar and compact collapse control occupy only the bottom of the rail. No footer is reserved below the menu tree. Menu/sidebar configuration has no description field, so the header renders only its title without a placeholder or reserved description space. The existing mobile layout remains selected by the same responsive rules.

The V1 menu search uses a native search input with a leading Material Icons Outlined icon, a 36px light field and a single thin focus border. Its translated clear button supports keyboard activation and returns focus to the input. Search matching, the existing menu-count threshold, IME composition handling and selected-path restoration remain unchanged.

## Public surface

| API                                                | Purpose                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `SdLayoutComponent` / `sd-layout`                  | Selects the configured V1, V2, V3, or V4 desktop/mobile pair and projects page content         |
| `SdPageComponent` / `sd-page`                      | Page frame; also `sd-page-detail`, `sd-page-form`. See `components/page/sd-page.md`            |
| `SdPageList` / `sd-page-list`                      | List screen with sd-table: fits the viewport. See `components/page-list/sd-page-list.md`       |
| `SdSidebarV1`, `SdSidebarMobileV1`   | Existing classic sidebar and mobile drawer                                                     |
| `SdSidebarV2`, `SdSidebarMobileV2`   | Compact primary rail with contextual flyout or mobile bottom sheet                             |
| `SdSidebarV3`, `SdSidebarMobileV3`   | Collapsible navigation with search, Pinned, and Recent sections                                |
| `SdSidebarV4`, `SdSidebarMobileV4`   | Token-coloured V3 successor: menu sections, trailing badges and status, `Ctrl+K` search, a collapsible rail with flyouts, and a mobile app bar, drawer and optional bottom bar |
| `SdLayoutContextSwitcher` / `sd-layout-context-switcher` | Context Switcher that every sidebar version mounts when `context` is configured |
| `SdLayoutContextService`                           | Owns the current context: `getCurrentContext()`, `setCurrentContext(id)`, reconcile with `items`, and the cross-tab notice |
| `SD_LAYOUT_CONTEXT_RUNTIME`                        | `SdLayoutContextRuntime` — page reload, cross-tab `storage` events and the per-tab reconcile marker; provide a fake in specs and demos |
| `searchAvailableMenuLeaves`, `groupMenusBySection`, `resolveMenuTrailing` | Menu helpers behind the V4 search, section headings and trailing slot |
| `SdLayoutService`                                  | Exposes resolved `userInfo` and `sidebar` signals plus the resolved `homeUrl`                  |
| `SdViewportService`                                | Shared signal source for viewport dimensions and responsive state                              |
| `SdLayoutResponsiveService`                        | Deprecated compatibility adapter that evaluates the layout breakpoint over `SdViewportService` |
| `SdLayoutNavigationStateService`                   | Shares pinned/recent stable keys and version-scoped UI state                                   |
| `SdLayoutStorageService`                           | Persists layout state (including the context snapshot) through `SdStorageService`, migrates legacy pinned objects lazily, and exposes `clear()` |
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
  sidebar: ISdSidebarConfiguration | (() => MaybeAsync<ISdSidebarConfiguration> | Observable<ISdSidebarConfiguration>);
  userInfo: SdLayoutUserInfo | (() => MaybeAsync<SdLayoutUserInfo> | Observable<SdLayoutUserInfo>);
  signout: () => void | Promise<void>;
  changePassword?: () => void | Promise<void>;
  updateProfile?: () => void | Promise<void>;
  setting?: () => void | Promise<void>;
  notification?: {
    count: number | Signal<number> | Observable<number>;
    action: () => void | Promise<void>;
  };
}

type ISdSidebarConfiguration = SidebarConfigurationV1 | SidebarConfigurationV2 | SidebarConfigurationV3 | SidebarConfigurationV4;

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

Shared sidebar fields are `brandColor`, `brandLightColor`, `logoUrl`, `defaultTitle`, `pin.enabled`, and `context` (see [Context switcher](#context-switcher)). V4 ignores `brandColor` and `brandLightColor`: its colours come from theme tokens.

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
| V4      | `{ version: 4, defaultCollapsed?, recent?, itemShape?, density?, collapsedGroup?, mobile? }` | V3 defaults plus `itemShape: 'pill'`, `density: 'compact'`, `collapsedGroup: 'flyout'`; `mobile.bottomBar` keeps at most 4 ids. See [Sidebar V4](#sidebar-v4) |

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

All four objects below are compile-ready values for `ISdLayoutConfiguration['sidebar']`.

```ts
import {
  SidebarConfigurationV1,
  SidebarConfigurationV2,
  SidebarConfigurationV3,
  SidebarConfigurationV4,
} from '@sdcorejs/angular/modules/layout';

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

const sidebarV4: SidebarConfigurationV4 = {
  version: 4,
  defaultTitle: 'Admin Portal',
  itemShape: 'pill',
  density: 'compact',
  collapsedGroup: 'flyout',
  recent: { enabled: true, maxItems: 5 },
  pin: { enabled: true },
  mobile: { bottomBar: ['overview', 'tasks', 'sales'] },
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

## Sidebar V4

`version: 4` renders `sd-sidebar-v4` on desktop and `sd-sidebar-mobile-v4` below `mobileBreakpoint`; the shell switches between them without a reload. `SidebarConfigurationV4` keeps every V3 option (`defaultCollapsed`, `recent`, `pin`, `logoUrl`, `defaultTitle`, `context`) and adds:

| Option             | Values                       | Default     | Effect |
| ------------------ | ---------------------------- | ----------- | ------ |
| `itemShape`        | `'pill' \| 'soft'`           | `'pill'`    | Hover and active highlight: fully rounded (`pill`) or 8px corners (`soft`) |
| `density`          | `'compact' \| 'comfortable'` | `'compact'` | Desktop row heights: 36px top-level / 32px child, or 40px / 34px. A coarse pointer and the mobile drawer always use 44px rows |
| `collapsedGroup`   | `'flyout' \| 'expand'`       | `'flyout'`  | Clicking a group on the collapsed rail opens a flyout panel with its children, or expands the drawer and opens that group (the V3 behaviour) |
| `mobile.bottomBar` | `string[]`                   | none        | Menu ids shown in the mobile bottom bar, followed by "More" |

`normalizeSidebarConfiguration` is the only place these defaults are filled; `sd-layout` normalizes V4 before rendering it. For `mobile.bottomBar` it trims each id, drops non-strings, blank and duplicate ids, then keeps the first four. (V2 `primaryMenuIds` are not trimmed: they must match a menu `id` exactly.) The cap applies before the ids are looked up, so an id that matches no menu leaves the bar with fewer than four destinations. Without `bottomBar`, or when none of its ids matches a menu (including `bottomBar: []`), no bottom bar is rendered.

Desktop (`sd-sidebar-v4`):

- A 280px drawer that collapses to a 72px rail. The content offset follows the same `--sd-sidebar-v4-width` / `--sd-sidebar-v4-rail-width` tokens; V1 and V3 keep their 304px layout.
- The header holds the logo (or the initial of `defaultTitle`), the title, the Context Switcher when `context` is set, and the collapse button.
- The pill search (`Ctrl+K`, `⌘K` on Apple platforms) lists matching leaves flat, accent-insensitive, with the matched text highlighted and each result's parent path, plus a result count or a "no match" message. `comingSoon` items and everything under a `comingSoon` group are left out.
- Pinned and Recent come first (Recent follows the V3 `recent` option), then the menu, grouped under `section` headings. There is no "All menus" heading.
- Icons appear on top-level rows only. Children are text with a branch rail, and the active child has a marker; a closed group that contains the current route shows a dot. Each row carries at most one trailing element (see [Menu model](#menu-model)).
- The collapsed rail shows top-level items with separators between sections, native `title` tooltips, and only warning/error badges and live status dots.
- The collapsed preference is stored in the same version 3 entry as V3, so an app that moves from V3 to V4 keeps each user's choice; `defaultCollapsed` applies when nothing is stored. Routing, external links, pinning and Recent behave as in V3.

Mobile (`sd-sidebar-mobile-v4`):

- A 56px app bar with the menu button, the title, a search button and the user's initials.
- The drawer (`min(88vw, 360px)`) is a modal dialog with a focus trap. It holds the search, Pinned, Recent, the menu with 44px rows, the account footer and the Context Switcher, which opens a bottom sheet. The backdrop, the close button, Escape and choosing a menu all close it; every close clears the search and returns focus to the control that opened it. `density` and the collapsed preference do not apply on mobile.
- The bottom bar looks the configured ids up at any depth of `menus`. A route opens directly; a group opens the drawer at that group; a `comingSoon` destination is disabled. "More" opens the drawer.

V4 has no colour inputs. Colours come from the `--sd-sidebar-v4-*` component tokens of the theme (see `assets/THEME.md`). The size tokens (`--sd-sidebar-v4-width`, `-rail-width`, `-item-height`, `-child-height`, `-item-radius`) are declared on the host and follow `density`, `itemShape` and the pointer type.

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

Desktop V3 menu groups support expand/collapse at every depth without additional configuration. Groups start expanded; click the group row or focus it with Tab and press Enter/Space to toggle its children. The disclosure chevron and `aria-expanded` reflect the current state. Closing a parent preserves each nested group's state, and group toggles do not navigate or pin items.

Group state belongs to the mounted V3 sidebar: search still finds leaves inside closed groups, clearing the query restores the tree state, and toggling the whole sidebar between drawer and icon rail preserves it. Activating a group icon in the rail opens the drawer and that root group. A route change opens the ancestors of the most exact active menu; unrelated groups retain their state. Group state resets when the sidebar is recreated and is not stored in local storage. Pinned/Recent shortcuts, V2 and mobile navigation retain their existing behavior.

### Sections, badges, status and `comingSoon` (V4)

`SdLayoutRootMenu` and `SdLayoutChildrenMenu` accept four optional fields. Only Sidebar V4 (desktop and mobile) renders them. V1–V3 ignore them, so existing menus compile and behave as before, and a `comingSoon` item still navigates there.

```ts
const menus: SdLayoutMenu[] = [
  {
    id: 'operations',
    title: 'Operations',
    icon: 'space_dashboard',
    section: 'Workspace',
    children: [
      { id: 'approvals', title: 'Approvals', path: '/approvals', permission: true, badge: { value: 3, tone: 'warning' } },
      { id: 'inbox', title: 'Inbox', path: '/inbox', permission: true, badge: { value: 12 } },
      { id: 'sync', title: 'Sync', path: '/sync', permission: true, status: { label: '1 running', tone: 'success', live: true } },
    ],
  },
  { id: 'forecast', title: 'Forecast', path: '/forecast', icon: 'bar_chart', permission: true, section: 'Insights', comingSoon: true },
];
```

| Field        | Type                                                                                   | V4 rendering |
| ------------ | -------------------------------------------------------------------------------------- | ------------ |
| `section`    | `string`                                                                               | Heading that groups top-level menus, in order of first appearance. Menus without a section get no heading |
| `badge`      | `SdLayoutMenuBadge` — `{ value: number \| string; tone?: 'neutral' \| 'warning' \| 'error' }` | Work waiting for the user. `neutral` (the default) is a plain count; `warning` and `error` are a pill read out as "{count} pending" |
| `status`     | `SdLayoutMenuStatus` — `{ label: string; tone: 'success' \| 'warning' \| 'error'; live?: boolean }` | Informational state: a dot and the label; `live` adds a ring around the dot |
| `comingSoon` | `boolean`                                                                              | "Soon" chip and `aria-disabled="true"`; the item never navigates, a group never expands, and the item and everything under it are left out of the V4 search |

- Each row shows at most one trailing element, in the order `comingSoon`, `badge`, `status`. A blank or non-finite badge value and a blank status label are skipped. Omit `badge` to hide it: `value: 0` renders `0`.
- The collapsed rail and the mobile bottom bar show only `warning`/`error` badges and `live` status dots; neutral counts and other statuses stay in the expanded tree.
- A menu without `section` that follows a sectioned one starts a new group without a heading, spaced apart from the section above.

Helpers exported next to `searchMenuLeaves` (which is unchanged):

- `searchAvailableMenuLeaves(menus, query)` — the V4 search: accent-insensitive like `searchMenuLeaves`, without `comingSoon` leaves and without anything under a `comingSoon` group.
- `groupMenusBySection(menus)` — `SdLayoutMenuSectionGroup[]` (`{ section: string | null; menus }`) in order of first appearance; `section: null` holds unsectioned menus.
- `resolveMenuTrailing(menu)` — the one trailing element as `SdLayoutMenuTrailing`: `{ kind: 'soon' }`, `{ kind: 'count', value }`, `{ kind: 'badge', value, tone }`, `{ kind: 'status', label, tone, live }`, or `null`.

### Active menu resolution prefers the most exact path

A menu is active only when it owns the longest `path` that matches the current route. With both `/appointment` and `/appointment/cs` declared, standing on `/appointment/cs` highlights the child alone — the ancestor entry is no longer lit up, and `aria-current="page"` is set on that one row. `resolveActiveMenuPath(menus, routePath)` from the layout `utils` is the single decision point: V1 uses it for node focus, menu-group binding and branch expansion, and the shared `sd-layout-menu-tree` (V2, V3 and their mobile variants) and the V4 tree use it for `isActive`. Matching stays segment-based, so `/appointment` never matches `/appointments`, and a route with no menu of its own (`/appointment/cs/123`) still activates its closest declared ancestor. `MenuFocusPipe` takes the resolved path as its third argument; called with two arguments it keeps the previous prefix matching.

### Menu filtering fails closed

`MenuPipe` drops a leaf instead of rendering it when either check fails:

- **`permission` is missing.** A leaf that has a `path` but no `permission` key is removed. A mistyped key (`permision`, `permissions`) therefore hides the entry rather than showing it to everyone. `permission: undefined` was already handled and still fails closed. Entries with neither `path` nor `children` (labels, dividers) are unaffected.
- **`path` uses an unsafe scheme.** A path is kept when it is app-relative (`/reports`) or an absolute `http:` / `https:` URL. Anything else — `javascript:`, `data:`, `vbscript:` — is removed, and a group left with no surviving children is removed with it.

External destinations open through the shared `sdOpenExternal` helper, so every sidebar version passes `noopener,noreferrer` and never hands `window.opener` to the opened tab. The previous `path.includes('http')` test was a substring match, so a value such as `javascript:fetch(...)//http` passed it and executed in the application origin.

V2's desktop rail and V3's collapsed desktop drawer center the avatar as the account-menu trigger without rendering a separate disclosure chevron. Collapsed V3 also hides the brand block and keeps only the centered expand control; the expanded drawer and both mobile variants retain the full account identity presentation.

V2 and the mobile variants retain the shared Soft-pill search surface. V3 desktop uses the same `SdInput` control in a compact 7px-radius field with a subtle border, matching V1. Placeholder text, `autoId` hooks, accent-insensitive filtering and parent-owned search signals keep their existing contracts.

V3 desktop renders navigation icons only for first-level menu entries (including `iconUrl`). Nested groups and routes use text, 16px indentation steps and subtle ancestor rails; the current route has a primary marker and `aria-current="page"`. Long titles wrap. Search results, Pinned and Recent are text-only shortcuts. Pin/search/collapse/account icons remain action controls. Keyboard focus reveals pin actions; coarse-pointer route and pin targets are at least 44px. The shared tree's default presentation leaves V2/mobile styling unchanged.

Visible V1 Material tree items and V2 shared menu controls remain exposed to assistive technology while focused. Do not put `aria-hidden="true"` on an interactive node, its route label, or an ancestor. Decorative disclosure icons may remain hidden. Regression tests cover V1 branch expansion/collapse and nested routes, plus V2 route and pin focus.

## Context switcher

`context` belongs to `SidebarConfigurationBase`, so it works on every sidebar version. The consumer assigns the items; Core persists the selected context, restores it on the next load and reloads the page after a switch. There is no change event or observable: the app reads the context once, at bootstrap.

```ts
interface SdLayoutContext {
  id: string; // stable id that Core persists and matches against `items`
  title: string;
  subtitle?: string;
  avatar?: string; // image URL; the initial of `title` is shown when it is missing or fails to load
}

interface SdLayoutContextConfiguration {
  label?: string; // name of the context kind; defaults to the translated "Context"
  items: SdLayoutContext[];
  searchable?: boolean; // default: search shown when there are more than 7 items
}
```

```ts
const sidebar: SidebarConfigurationV4 = {
  version: 4,
  context: {
    label: 'Store',
    items: [
      { id: 'hn-01', title: 'Hanoi Central', subtitle: '12 Trang Tien' },
      { id: 'hcm-01', title: 'Saigon Riverside', avatar: '/assets/stores/hcm-01.png' },
    ],
  },
};
```

- Without `context` the sidebar renders exactly as before and does not create `SdLayoutContextService`. With `context` but no usable item, nothing renders and nothing is stored. Items with a blank `id` or `title`, and repeated ids, are ignored.
- One item: the switcher shows its name only and does not open.
- Search appears with more than 7 items; `searchable: true` or `false` forces it. It matches title and subtitle, accent-insensitive.
- The popover shows `{label} · {count}`, one row per item with its avatar image or initial, and a check on the active row (`aria-current="true"`). Choosing another row marks it busy ("Switching…"), disables the other rows and reloads the page once the new snapshot is confirmed in storage. Choosing the active row only closes the popover. When the snapshot cannot be stored, the switcher shows an inline error and the page does not reload.
- Core does not load permissions or menus for a context. Do that at bootstrap from `getCurrentContext()`.
- The switcher takes its colours from theme tokens in every version; V1 `brandColor` does not apply to it.

| Sidebar                | Where the switcher sits |
| ---------------------- | ----------------------- |
| V1                     | Under the title in the header; when the sidebar is closed, an avatar under the logo on the 56px rail with a popover that opens to the right |
| V2                     | Avatar under the brand button on the rail; the popover opens to the right |
| V3, V4                 | Under the app name in the header, with the popover under the header; when collapsed, an avatar at the top of the rail with a popover that opens to the right |
| Mobile V1, V3, V4      | Trigger in the drawer header; opens a bottom sheet |
| Mobile V2              | First row of the menu sheet; the context sheet opens above it |

### Reading the context at bootstrap

```ts
import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { SdLayoutContextService } from '@sdcorejs/angular/modules/layout';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const context = inject(SdLayoutContextService).getCurrentContext(); // null until a context was stored
      inject(ApiContextHeader).set(context?.id); // ApiContextHeader: your own service
    }),
  ],
};
```

- `SdLayoutContextService` is `providedIn: 'root'` and needs neither `SD_LAYOUT_CONFIGURATION` nor `SdLayoutService`, so an app initializer can read it before the `sidebar` configuration resolves.
- The snapshot is captured when the service is first injected. `getCurrentContext()` returns a copy of it, or `null` before any context was stored. Its `id` stays the same during the page load (only `title`, `subtitle` and `avatar` may refresh from `items`), with three exceptions: a reconcile that moves to a new target sets it in memory just before its reload; a reconcile whose target could not be stored or whose reload was blocked keeps that target in memory (below); and after a storage namespace change in the running app (sign-in or sign-out), the next reconcile or `storage` event captures the snapshot of the new partition without a notice.
- `SD_LAYOUT_STORAGE_NAMESPACE` must already resolve to the signed-in identity when the service is first injected, and must never depend on the context itself. With a namespace that resolves later, the app initializer reads the anonymous partition on every load. The per-tab marker then limits the damage to one reconcile reload per target, and a dev-mode console warning points here.

### Reconcile with `items`

The switcher passes `items` to `SdLayoutContextService.syncItems()` when it renders. Mobile V2, V3 and V4 render their switcher only inside the drawer or sheet, so they make the same call themselves on init when `context` is set. In every version, reconcile therefore runs as soon as the sidebar renders and never waits for the first tap.

- The stored id is in `items`: its title, subtitle and avatar are refreshed (written only when they changed), and the page does not reload.
- Nothing stored (first visit) or an id that is no longer in `items`: Core stores `items[0]`, reads it back to confirm the write, and reloads once so that the next load starts with it.
- A reconcile reloads at most once per target id while the per-tab marker holds that id. The marker lives in `sessionStorage` under `SD_LAYOUT_CONTEXT_MARKER_KEY`. When the write cannot be confirmed, or the marker blocks the reload, Core keeps the target in memory and does not reload.
- Empty `items`: nothing is stored and the switcher is hidden.

### Other tabs

- After the first `syncItems()` the service listens to `storage` events. When another tab switches the stored context in the same namespace, this tab keeps its context and shows "Context changed in another tab" with a Reload button. It never reloads by itself. On a collapsed rail the notice sits in the popover and the avatar shows a dot.
- When another tab removes the snapshot (for example `clear()` at sign-out), no notice appears and this tab keeps its current context in memory.

### Service API

| Member | Purpose |
| ------ | ------- |
| `getCurrentContext()` | Copy of the context of this page load, or `null` |
| `setCurrentContext(id)` | Stores the item with `id` and reloads once the write is confirmed. Ignored for the active id, for an id that is not in `items` (or before the first `syncItems()`), and after a reload was requested |
| `syncItems(items)` | Reconciles the snapshot with the configured items. The switcher and the mobile sidebars call it; an app normally does not |
| `reload()` | Reloads the page (the Reload button of the cross-tab notice) |
| `current`, `items`, `switchingId`, `switchFailed`, `changedElsewhere` | Read-only signals of the state above |

`SdLayoutContextSwitcher` (`sd-layout-context-switcher`) is mounted by the sidebars. Its inputs are `configuration`, `appearance` (`'header' | 'rail' | 'sheet'`), `placement` (`'below' | 'right'`) and `anchor`, the `HTMLElement` the popover aligns to (for example a template reference to the sidebar header). `isOpen()`, `open()`, `close()` and `toggle()` are public; V4 reads `isOpen()` to give its header the hover background while the popover is open.

CSS hooks, set on or above the switcher host:

- `--sd-layout-context-switcher-popover-width` — width of the desktop popover. It is read when the popover opens, because the popover renders in the overlay container. V1, V3 and V4 set it to their drawer width minus 24px.
- `--sd-layout-context-switcher-dot-ring-color` — colour of the ring around the "changed in another tab" dot on the rail avatar, so the dot stands apart from the rail background. Defaults to `--sd-surface`; V4 sets it to its sidebar background.

### Testing and demos: `SD_LAYOUT_CONTEXT_RUNTIME`

The service reloads the page, listens to `storage` events and reads the per-tab marker only through `SD_LAYOUT_CONTEXT_RUNTIME` (`SdLayoutContextRuntime`). The default, `createSdLayoutContextBrowserRuntime(document.defaultView)`, does nothing without a window (SSR). Provide a fake in specs and demos so nothing reloads for real:

```ts
import { SD_LAYOUT_CONTEXT_RUNTIME, SdLayoutContextRuntime } from '@sdcorejs/angular/modules/layout';

const runtime: SdLayoutContextRuntime = {
  reload: () => console.log('reload requested'),
  onStorage: () => () => undefined, // returns the unsubscribe function
  readMarker: () => null, // undefined means sessionStorage is unavailable: reconcile reloads are skipped
  writeMarker: () => true,
};

providers: [{ provide: SD_LAYOUT_CONTEXT_RUNTIME, useValue: runtime }];
```

Once a reload was requested, the service ignores later switches, reconciles and `storage` events in that page load. A demo with a fake reload should provide `SdLayoutContextService` (and the runtime) at component level and recreate it to start over.

### Known limitations

- If a `beforeunload` handler cancels the reload, the page stays but the service is still waiting for it: the busy row stays busy and further switches are ignored until the page reloads.
- A layout storage that does not survive a page reload (an in-memory replacement of `SdStorageService`) cannot keep a switch: each switch costs one extra reconcile reload before the marker stops it.

## Icons under the Lucide renderer

Menu icons and the pin toggle of Sidebar V4 always use the bundled Material Icons fonts (outlined; filled when active or pinned). The other controls of V4 and of the Context Switcher follow the app's default renderer. `@lucide/angular` renders registered icons only, so an app with `defaultFontSet: 'lucide'` registers these:

| Used by | Lucide icons |
| ------- | ------------ |
| Context Switcher (every version) | `chevrons-up-down`, `refresh-cw`, `check`, `search`, `x` |
| Sidebar V4 desktop and mobile | `menu`, `panel-left-close`, `search`, `x`, `chevron-down`, `chevron-up` |

```ts
import {
  LucideCheck,
  LucideChevronDown,
  LucideChevronUp,
  LucideChevronsUpDown,
  LucideMenu,
  LucidePanelLeftClose,
  LucideRefreshCw,
  LucideSearch,
  LucideX,
} from '@lucide/angular';
import { provideSdIcon } from '@sdcorejs/angular/modules/icon';

provideSdIcon({
  defaultFontSet: 'lucide',
  lucideIcons: [
    LucideMenu, LucidePanelLeftClose, LucideSearch, LucideX, LucideChevronDown, LucideChevronUp,
    LucideChevronsUpDown, LucideRefreshCw, LucideCheck, /* app icons */
  ],
});
```

The open switcher shows `unfold_less`, which has no default Lucide alias; under Lucide it keeps `chevrons-up-down` unless the app adds `lucideAliases: { unfold_less: 'chevrons-down-up' }` and registers `LucideChevronsDownUp`.

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
- `SdLayout` keeps consuming the compatibility `SdLayoutResponsiveService`, which reads `SdViewportService.width`; existing service overrides remain valid and V1–V4 switch from the same application-wide resize listener.
- `SdLayoutResponsiveService` delegates to `SdViewportService`; `SD_LAYOUT_VIEWPORT` aliases `SD_VIEWPORT`, so existing consumers and test providers continue to work without registering a second listener.
- Pinned and Recent entries are persisted as stable menu keys. Missing or no-longer-permitted keys are discarded when the current menu tree is hydrated.
- Existing V1 pinned menu objects are migrated lazily to stable keys the first time the shared navigation state is read. No eager storage rewrite is required during application startup.
- Pinned and Recent data are shared between sidebar versions. Version-specific UI state such as V2 active/locked group and V3 collapsed state remains scoped by version. V4 reads and writes the V3 collapsed entry and adds no storage key of its own.
- For V3 and V4, a persisted collapsed value takes precedence over `defaultCollapsed`. Recent items are deduplicated, newest first, and capped by `recent.maxItems`.
- The context snapshot (`currentContext`) stores `{ id, title, subtitle?, avatar? }` in the same namespace as the other entries. Only `SdLayoutContextService` reads and writes it; do not use the handle directly. The per-tab reconcile marker is a separate `sessionStorage` entry (`SD_LAYOUT_CONTEXT_MARKER_KEY`): it is not namespaced and `clear()` does not remove it.
- Do not read the UUID-backed local-storage entries directly. Use `SdLayoutStorageService` or `SdLayoutNavigationStateService` so validation and migration continue to run.
- Persisted entries are keyed by fixed UUIDs that carry no identity. On a shared browser that means the next person to sign in inherits the previous user's pinned and recently visited modules unless the application separates them. Two mechanisms are available and are meant to be used together:

  ```ts
  import { SD_LAYOUT_STORAGE_NAMESPACE, SdLayoutStorageService } from '@sdcorejs/angular/modules/layout';
  import { SdAuthService } from '@sdcorejs/angular/modules/auth';

  // 1. Scope every entry to the signed-in user or tenant.
  //    SdLayoutStorageService is a root singleton and is usually constructed BEFORE anyone has
  //    signed in, so provide a FUNCTION: it is re-evaluated on every handle access, and the eight
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

  `SD_LAYOUT_STORAGE_NAMESPACE` accepts a `string` or a `() => string | null | undefined` resolver (`SdLayoutStorageNamespace`). A blank or whitespace-only value is treated as no namespace, and a handle created without a namespace keeps exactly the storage key the library used before this token existed — existing installations keep reading their current data after an upgrade. Because the namespace is resolved at call time, `clear()` wipes the partition of whoever is signed in *at that moment*: call it before the auth info goes back to `undefined`, otherwise it clears the anonymous partition and leaves the signed-out user's data behind. `clear()` removes `isShowSidebar`, `menuLockStatus`, `lastActiveMenuGroupId`, `pinnedMenuGroup`, `pinnedMenuKeys`, `recentMenuKeys`, `versionStates`, and `currentContext`; in-memory pinned/recent signals are rebuilt on the next `SdLayoutNavigationStateService.hydrate()`. Never derive the namespace from the current context (see [Context switcher](#context-switcher)).
- The built-in `forbidden` and `not-found` pages leave through `Router.navigateByUrl(homeUrl)`. They no longer assign to `window.location`, which reloaded the error page itself and was unavailable during server-side rendering.

## Accessibility

- Version controls and sidebar actions are native buttons with visible keyboard focus and explicit names; tooltips are supplemental rather than the naming source.
- Desktop flyouts and mobile sheets close with Escape. Mobile overlays trap focus, restore focus to their trigger, and release body scroll when closed or destroyed.
- Active, expanded, pressed, dialog, and navigation states are exposed with the corresponding ARIA attributes.
- Motion used for preview/sidebar transitions is removed when `prefers-reduced-motion: reduce` is active.
- Sidebar v1 uses a real `/layout/home` link, native route links for leaf nodes, native disclosure buttons for branches, and independent named pin buttons. Material owns `tree` / `treeitem`; neutral wrappers and explicit `role="group"` containers avoid invalid `list` / `listitem` nesting.
- A hidden Sidebar v1 tree is contained by `inert` instead of `aria-hidden`, so its links, buttons, and search control cannot remain keyboard-exposed while absent from the accessibility tree.
- Keep menu titles meaningful and unique; icons are supplementary and must not be the only accessible label.
- Sidebar V4 desktop: `Ctrl+K` (`⌘K` on Apple platforms) expands a collapsed drawer and focuses the menu search. The shortcut is skipped when another handler already called `preventDefault()` or when focus is inside a dialog or an overlay. The search is a combobox: the first result is preselected, `↑`/`↓` move the selection, `Enter` opens it and `Esc` clears the query. The result count and the "no match" message are announced through a live region.
- The V4 rail flyout closes with Escape, a click outside or navigation, and returns focus to its group button.
- The mobile V4 drawer and the context bottom sheet are modal dialogs with focus traps. Escape closes the topmost one only (the sheet before the drawer, a non-empty search before the drawer), and focus returns to the control that opened it.
- `comingSoon` rows are `aria-disabled="true"`. Warning/error badges are read as "{count} pending"; the active context row has `aria-current="true"` and the switching row `aria-busy="true"`.
- With a coarse pointer, V4 menu rows are at least 44px tall; the mobile V4 drawer always uses 44px rows.

## i18n

Chrome the layout owns (as opposed to consumer-supplied menu titles) resolves through `I18nService`:

| What                                                               | Key                                   |
| ------------------------------------------------------------------ | ------------------------------------- |
| "Pinned" heading (v1 tooltip + group title, v3, mobile v3)         | `core.module.layout.sidebar.pinned`   |
| "Recent" heading (v3, mobile v3)                                   | `core.module.layout.sidebar.recent`   |
| "All menus" heading (v3, mobile v3)                                | `core.module.layout.sidebar.all-menu` |
| Drawer menu `nav` `aria-label` (mobile v4; existing key reused)    | `core.module.layout.sidebar.all-menu` |
| Pin toggle `aria-label` (shared `menu-tree`, v1 sidebar)           | `core.module.layout.menu.pin`         |
| Unpin toggle `aria-label` (shared `menu-tree`, v1 sidebar)         | `core.module.layout.menu.unpin`       |
| Home link `aria-label` on the v1 logo                              | `core.module.layout.home.tab-name`    |
| Brand button `aria-label` (v2 rail)                                | `core.module.layout.home.tab-name`    |
| Menu-group nav `aria-label` (v2 rail)                              | `core.module.layout.sidebar.menu-groups` |
| Backdrop / close `aria-label` (v2, mobile v2)                      | `core.module.layout.sidebar.close-menu` |
| Context search placeholder (v2)                                    | `core.module.layout.sidebar.search-in-group` |
| Primary-nav `aria-label` (mobile v2)                               | `core.module.layout.sidebar.primary-nav` |
| Menu `nav` `aria-label` (v4) and bottom bar `aria-label` (mobile v4); existing key reused | `core.module.layout.sidebar.primary-nav` |
| "More" bar action label + `aria-label` (mobile v2)                  | `core.module.layout.sidebar.more` / `.more-menu` |
| Menu search placeholder (mobile v2)                                | `core.module.layout.sidebar.search-in-menu` |
| Search placeholder, result count, no-match text, keyboard hint (v4, mobile v4) | `core.module.layout.sidebar.v4-search-placeholder` / `.result-count` / `.no-match` / `.search-hint` |
| "Soon" chip and badge description "{count} pending" (v4, mobile v4) | `core.module.layout.sidebar.coming-soon` / `.badge-pending` |
| Collapse / expand toggle (v4)                                      | `core.module.layout.sidebar.collapse` / `.expand` |
| App-bar menu button (mobile v4)                                    | `core.module.layout.sidebar.open-menu` |
| "More" bottom-bar action (mobile v4; existing key reused)          | `core.module.layout.sidebar.more` |
| Context switcher: default label, trigger name, search, sheet title, "Switching…", switch error, cross-tab notice | `core.module.layout.context.default-label` / `.trigger` / `.search-placeholder` / `.choose-title` / `.switching` / `.switch-failed` / `.changed-elsewhere` |
| Reload button of the cross-tab notice                              | `core.common.reload` |

`menu.pin` / `menu.unpin` interpolate `{title}` (the menu's own title) so each locale places the verb and the
name in its own order — the previous `'Pin ' + title` concatenation forced English word order everywhere. The
label is built inside the `nodes` / `pinnedMenuGroup` computeds, so it follows a language change.

`SdLayoutService` deliberately keeps its "SD_LAYOUT_CONFIGURATION was not provided" throw/warn out of the
catalogue: those are developer diagnostics, not user-facing copy (marked `@i18n-ignore` in the source).

## Notes and anti-patterns

- Do not pass an Observable directly to `userInfo` or `sidebar`; pass a value or a function returning a supported `MaybeAsync` value or an RxJS `Observable` (the first emitted value is used).
- Do not use viewport user-agent detection or cache a one-time mobile boolean. Let `<sd-layout>` react to `mobileBreakpoint` changes in the viewport.
- Do not mutate raw pinned/recent arrays or store full new menu objects. Stable ids keep state valid across labels, permissions, and versions.
- Do not read or write the context snapshot yourself, and do not derive `SD_LAYOUT_STORAGE_NAMESPACE` from the context. Read the context through `SdLayoutContextService.getCurrentContext()` at bootstrap.
- Do not mount `<sd-layout>` under another layout route; it owns fixed navigation and the page content boundary.
- Use `inject()` in new consumers instead of constructor injection, and derive display state with signals/computed values.

## Related

The shared account menu listens for document Escape and outside pointer events only while open. Closing or destroying the menu removes both listeners; closed account menus do not process page-wide events.

- [Auth module](../auth/sd-auth.md) supplies the user and sign-out actions.
- [Permission module](../permission/sd-permission.md) resolves string permission codes used by menus.
- [Keycloak module](../keycloak/sd-keycloak.md) can feed authenticated identity and roles into both configurations.
