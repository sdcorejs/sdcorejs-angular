# Layout Module

- **Type:** `@NgModule` (`SdLayoutModule`) + standalone components / pipes / services
- **Import path:** `@sdcorejs/angular/modules/layout`
- **Library version:** `@sdcorejs/angular@19.0.0-beta.86`

## One-line purpose

App shell for back-office portals: provides `<sd-layout>` (sidebar + content host), `<sd-page>` (titled content frame), responsive desktop / mobile sidebar variants, menu pipes, and built-in `home` / `not-found` / `forbidden` route modules.

## When to use

- Building a back-office portal with a left sidebar, lockable / collapsible behaviour, and a user info popup.
- Need ready-made `/home`, `/not-found`, `/forbidden` routes for landing / error / access-denied pages.
- Want menus driven from a typed `SdLayoutMenu[]` model with permission-aware filtering and search highlight.

## What it provides

**Components (standalone):**

| Component | Selector | Purpose |
|---|---|---|
| `SdLayoutComponent` | `sd-layout` | Top-level shell — picks desktop or mobile sidebar based on viewport |
| `SdPageComponent` | `sd-page` | Page frame with `title`, `description`, `noHeader` inputs |
| `SidebarV1Component` | `sidebar-v1` | Desktop sidebar (lockable, hover-to-expand) — used internally by `<sd-layout>` |
| `SidebarMobileV1Component` | `sidebar-mobile-v1` | Mobile sidebar (drawer overlay) — used internally |

**Services:**

| Service | Purpose |
|---|---|
| `SdLayoutService` (`providedIn: 'root'`) | Reads `SD_LAYOUT_CONFIGURATION`; exposes `userInfo` / `sidebar` signals to the shell |
| `SdLayoutStorageService` (`providedIn: 'root'`) | Persists sidebar state (`isShowSidebar`, `menuLockStatus`, `lastActiveMenuGroupId`) via `SdStorageService` |

**Pipes:** `MenuPipe`, `MenuFocusPipe`, `HighLightSearchPipe` (transform / focus / highlight menu items by search input).

**Sub-modules (lazy):**
- `HomeModule` — `/home` landing page with redirect guard.
- `NotFoundModule` — `/not-found` 404 illustration.
- `ForbiddenModule` — `/forbidden` access-denied illustration.

**Routing:** `SdLayoutModule` declares `RouterModule.forChild(Routes)` mapping `home` / `not-found` / `forbidden`; root path redirects to `not-found`.

**DI tokens / interfaces:** `SD_LAYOUT_CONFIGURATION`, `ISdLayoutConfiguration`, `SdLayoutUserInfo`, `ISdSidebarConfiguration`, `SidebarConfigurationV1`, `SdLayoutMenu` (+ `SdLayoutRootMenu`, `SdLayoutChildrenMenu`).

## Configuration

```ts
interface ISdLayoutConfiguration {
  /** Optional URL the home page redirect-guard should send authenticated users to */
  homeUrl?: string;

  /** Sidebar branding — sync object or factory */
  sidebar: ISdSidebarConfiguration | (() => MaybeAsync<ISdSidebarConfiguration>);

  /** Current user — sync object or factory (typically reads SdAuthService) */
  userInfo: SdLayoutUserInfo | (() => MaybeAsync<SdLayoutUserInfo>);

  signout: () => void | Promise<void>;
  changePassword?: () => void | Promise<void>;
}

interface SdLayoutUserInfo {
  username?: string;
  email?: string;
  fullName?: string;
  avatar?: string;  // URL, base64, or initials fallback
}

interface SidebarConfigurationV1 {
  version: 1;
  brandColor?: string;        // primary brand (e.g. '#1890ff')
  brandLightColor?: string;   // hover / background tint
  logoUrl?: string;           // sidebar logo
  defaultTitle?: string;      // default 'Back Office'
}

interface SdLayoutMenu {
  // SdLayoutRootMenu - leaf with route
  id?: string;
  path: string;
  queryParams?: Params;
  icon?: string;
  iconUrl?: string;
  title: string;
  permission: string | string[] | boolean | (() => boolean);
  permissionKey?: string;
  level?: number;
  tooltipTitle?: string;

  // SdLayoutChildrenMenu - group node
  // (same fields, plus children?: SdLayoutMenu[])
}
```

## Setup

```ts
// app.config.ts (standalone)
export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(SdLayoutModule),
    {
      provide: SD_LAYOUT_CONFIGURATION,
      useFactory: () => {
        const auth = inject(SdAuthService);
        return {
          homeUrl: '/dashboard',
          sidebar: {
            version: 1,
            brandColor: '#1890ff',
            logoUrl: '/assets/logo.svg',
            defaultTitle: 'Admin Portal',
          },
          userInfo: () => {
            const u = auth.getAuthInfo!() ?? {};
            return { fullName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(), email: u.email, username: u.username };
          },
          signout: () => auth.signout(),
          changePassword: () => auth.changePassword(),
        } satisfies ISdLayoutConfiguration;
      },
    },
  ],
};
```

```ts
// routes.ts
export const routes: Routes = [
  {
    path: 'layout',
    loadChildren: () => import('@sdcorejs/angular/modules/layout').then(m => m.SdLayoutModule),
  },
  {
    path: '',
    component: ShellComponent, // hosts <sd-layout>
    children: [/* ... feature routes ... */],
  },
];
```

```html
<!-- shell.component.html -->
<sd-layout [menus]="menus()">
  <router-outlet/>
</sd-layout>
```

## Public API

- **`<sd-layout [menus]>`** — host the app shell. `menus` is `SdLayoutMenu[]`. Internally selects `sidebar-v1` (desktop) or `sidebar-mobile-v1` (mobile/tablet) via `BrowserUtilities.isMobile()`.
- **`<sd-page title description noHeader>`** — wrap each routed view; renders header bar with title/description.
- **`SdLayoutService`** — read `userInfo` / `sidebar` signals (auto-resolved from `SD_LAYOUT_CONFIGURATION`).
- **`SdLayoutStorageService`** — read/write sidebar state across reloads:
  - `isShowSidebar: SdStorage<boolean>`
  - `menuLockStatus: SdStorage<boolean>`
  - `lastActiveMenuGroupId: SdStorage<string>`
- **Pipes** — `menus | menu`, `menus | menuFocus:searchText`, `text | highLightSearch:term`. Used internally by sidebars; available for custom shells.

## Behavior notes

- **Mobile detection:** `BrowserUtilities.isMobile()` decides desktop vs mobile sidebar at component init. The signal does NOT live-update on viewport change — a navigation/refresh re-evaluates.
- **Sidebar lock state:** `menuLockStatus` is read at construction (`?? true`) — locked-open by default. On mobile, `isShowSidebar` is forced false at init regardless.
- **Hover-to-expand:** when unlocked, `sidebar-v1` opens on `mouseenter` (`onhover=true`) and closes after a 400ms transition delay on `mouseleave` (`#handleMouseLeaveTransition`).
- **`onPopupOfSideBarOpened/Closed`:** mat-menu / popup interactions inside the sidebar pin it open while the popup is showing.
- **Routing:** `SdLayoutModule` registers `home` / `not-found` / `forbidden` as child routes — the typical wiring is `{ path: 'layout', loadChildren: () => SdLayoutModule }`.
- **`<sd-page>` title attribute cleanup:** the component's `effect` removes the host's native `title` attribute when the input `title` is set, preventing the browser tooltip from doubling up.
- **Permission-aware menus:** `SdLayoutMenu.permission` accepts a code string, an array (OR), a boolean, or a getter. The `MenuPipe` filters menus accordingly — pair with the `permission` module for code resolution.

## Examples

**Define a typed menu:**
```ts
const menus: SdLayoutMenu[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'home',
    permission: true,
  },
  {
    title: 'Catalog',
    icon: 'inventory',
    children: [
      { title: 'Products', path: '/products', permission: 'PCM_C_PRODUCT_LIST', permissionKey: 'pcm' },
      { title: 'Categories', path: '/categories', permission: 'PCM_C_CATEGORY_LIST', permissionKey: 'pcm' },
    ],
  },
];
```

**Wrap a routed view:**
```html
<sd-page title="Products" description="Manage product catalog">
  <button *sdPermission="'PCM_C_PRODUCT_CREATE'">New</button>
  <sd-table [option]="tableOption"></sd-table>
</sd-page>
```

**Reset sidebar state on signout:**
```ts
constructor(auth: SdAuthService, storage: SdLayoutStorageService) {
  auth.signout$?.subscribe(() => {
    storage.isShowSidebar.set(true);
    storage.menuLockStatus.set(true);
    storage.lastActiveMenuGroupId.set(undefined as any);
  });
}
```

## Anti-patterns

- Do NOT mount `<sd-layout>` inside a route that's lazy-loaded under `/layout` — the sub-module owns `home/not-found/forbidden`, and you'd nest layouts.
- Do NOT pass an Observable to `userInfo` — it expects a sync value or a function returning `MaybeAsync<SdLayoutUserInfo>` (sync / Promise).
- Do NOT bypass `SdLayoutStorageService` to read sidebar state — its keys are UUID-based; reading raw localStorage breaks if the keys change.
- Do NOT use `<sd-page>` outside an `<sd-layout>` — it expects the shell's CSS context.
- Do NOT depend on `SdLayoutComponent` for SSR — sidebar layout uses browser-only `BrowserUtilities.isMobile()` (window check).

## Related

- [auth module](./sd-auth.md) — typical source for `userInfo` / `signout` config.
- [permission module](./sd-permission.md) — backs `SdLayoutMenu.permission` filtering.
- [keycloak module](./sd-keycloak.md) — provides an auth flow that can feed the layout.
- `<sd-page>` is unique to layout (no other doc); other components like `[sd-table]` (`../components/sd-table.md`) are commonly placed inside `<sd-page>`.
