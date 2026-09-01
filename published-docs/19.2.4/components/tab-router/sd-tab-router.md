# `<sd-tab-router-outlet>` & friends

**Type**: Component group (3 components + 1 decorator, documented together)
**Selectors**: `sd-tab-router-outlet`, `sd-tab-router-nav`, `sd-tab-router-item`
**Import path**: `@sdcorejs/angular/components/tab-router` (or barrel: `@sdcorejs/angular/components`)
**Classes**: `SdTabRouterOutletComponent`, `SdTabRouterNavComponent`, `SdTabRouterItemComponent`
**Standalone**: yes (all three)
**Change detection**: `OnPush` for all three

## One-line purpose

Browser-style multi-tab router shell — every navigated route becomes a tab; tabs persist their component instances on ordinary switches, can be explicitly reloaded, closed, reordered (drag), and replaced. Drives the "open many records side-by-side" UX seen in admin / CRM apps.

## When to use

- App shell where users open many detail pages and want to switch back and forth without losing state
- CRM / admin / ticketing apps where the user juggles 5–20 records at once
- Any layout that should mimic browser tabs with one URL per tab
- When you want components to keep scroll position, form state, in-flight requests when the user navigates away and back

## When NOT to use

- For small apps with linear navigation (a single `<router-outlet>` is fine)
- For nested tabs INSIDE a route (use a non-routed tab component, not this one)
- When you want unmount-on-leave semantics (tab-router intentionally KEEPS components alive)
- For static dashboards with no detail navigation

## Architecture (3 layers)

| Layer  | Selector               | Role                                                                                                                                                                                                                                                                     |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Outlet | `sd-tab-router-outlet` | Replaces `<router-outlet>`. Listens to raw router events, builds the tab list, hosts component instances via `*ngComponentOutlet`, manages activate / deactivate / close / explicit reload, and supports `replaceTab`, `switchTab`, and `forceReload` navigation states. |
| Nav    | `sd-tab-router-nav`    | Renders the horizontal tab strip on top. Supports drag-to-reorder (CDK Drag-Drop, locked to X-axis). Auto-switches between `default` and `compact` modes based on available width / number of tabs.                                                                      |
| Item   | `sd-tab-router-item`   | One tab pill — contains an `<sd-badge>` showing icon + name + tooltip, plus a close `×` button. Supports middle-click close; close requests delegate to `SdTabRouterService.close()` (outlet runs `beforeClose` if set).                                                 |

> Tab metadata (name, icon, tooltip, color) is provided **per-component** via the `@SdTabComponent` decorator (see Decorator below). Routes don't declare the metadata — the destination component does.

## `<sd-tab-router-outlet>`

### Inputs

| Name       | Type                                       | Default | Notes                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `disabled` | `boolean` (coerced via `booleanAttribute`) | `false` | When `true`, the outlet bypasses all tab management. Navigation falls through to a standard `<router-outlet>` instead. Useful for embedding the outlet in contexts where tab behaviour should be suppressed (e.g. print view, modal shell). |

### Outputs

None.

### Behaviors

- Listens to raw router events only (it never unwraps `Scroll`): `RoutesRecognized` captures `extras.state`, `NavigationEnd` applies the route after redirects, `NavigationSkipped` handles an explicitly forced same-URL reload, and `NavigationCancel` / `NavigationError` discard pending state
- Navigation state is snapshotted synchronously before serialized async handling. In-flight state is stored by navigation id so overlapping navigations cannot overwrite one another
- `NavigationSkipped` continues only for `NavigationSkippedCode.IgnoredSameUrlNavigation` with a directly snapshotted `state.forceReload === true`; this is why reloading the currently active identical URL works even though Angular does not emit `NavigationEnd`
- Tab identity = hash of `url + queryParams` — ordinary same-key navigation preserves the per-tab injector, `tabInfoChanges` stream, and component instance/state; the `SdTabRouterTab` descriptor may be immutably copied when `isActive` changes
- `state.replaceTab = true` → new tab replaces the current active tab (instead of stacking)
- `state.switchTab = true` → user clicked an existing tab pill (used by item click handler to avoid creating duplicates)
- `state.forceReload = true` affects an existing target key only: the outlet replaces that tab at the same list index with a fresh `SdTabRouterTab`, per-tab injector, `tabInfoChanges`, body component, and nav item. Tab count and order stay unchanged
- If the forced target does not exist, it is added normally. `forceReload` does not change missing-target behavior
- `forceReload` is an explicit replacement operation and therefore bypasses the old tab's `beforeClose` guard
- `forceReload` and `replaceTab` are independent. When both are `true`, normal replace semantics remove the other active tab and the existing target is recreated at its correctly shifted index
- Omitting `forceReload` (or passing anything other than literal `true`) preserves the per-tab injector, `tabInfoChanges` stream, component instance/state, and ordinary revisit behavior; the descriptor may still be immutably copied to update `isActive`
- Component instances are kept alive: switching tabs only toggles `[class.active]` on `.tab-router__pane` divs; `*ngComponentOutlet` reference is preserved when only `isActive` changes (uses spread instead of mutation)
- Outlet panes and nav items track `tab.injector ?? tab.key`: ordinary activation keeps the same tracked identity, while an explicit reload's fresh injector recreates both views
- Per-tab `Injector` overrides `ActivatedRoute` so each tab's component injects its OWN route, not the router's current one — avoids state-leak between tabs
- Soft cap warning: if the user opens more than 30 tabs, `SdNotifyService.warning('Bạn đã mở quá nhiều tab.')` fires
- Closing the active tab navigates to the neighbor (next, then previous, else `/`)

## `<sd-tab-router-nav>`

### Inputs

| Name   | Type      | Default | Notes                                          |
| ------ | --------- | ------- | ---------------------------------------------- |
| `tabs` | `SdTabRouterTab[]` | `[]`    | Array of tab objects (provided by the outlet). |

### Behaviors

- Renders the strip horizontally, scrollable / wrapped depending on count
- `mode` is internal: switches to `'compact'` when `(width − tabs*68) / tabs <= 20` — i.e. when each tab would be too narrow to show a name, items collapse to icon-only
- `cdkDropList` lockaxis x → user drags tabs left/right to reorder (mutates `tabs` in place via `moveItemInArray`)
- Hidden when only 1 tab exists (`[class.d-none]="tabs.length > 1"` — note: this template condition hides the bar when MORE than 1 tab; check carefully if you fork)
- Re-checks UI mode on `window:resize`

## `<sd-tab-router-item>`

### Inputs

| Name  | Type               | Default | Notes               |
| ----- | ------------------ | ------- | ------------------- |
| `tab` | `SdTabRouterTab` (REQUIRED) | —       | The tab descriptor. |

### Behaviors

- Click → router navigates to `tab.url` with `tab.queryParams` and `state: { switchTab: true }` (so the outlet doesn't recreate, it just activates)
- Middle-click (`mousedown` button 1 default-prevented; `mouseup` triggers close) → close tab
- Close `×` / middle-click → `tabRouterService.close(tab)`; outlet `#closeTab` runs `tab.beforeClose` if defined. It closes only on `true`; `false`, throw, and rejection all fail closed.
- Tab info (`name`, `icon`, `tooltip`, `color`) is reactive via `tab.tabInfoChanges: Subject<SdTabInfo>` — components can call `next(...)` to update their tab pill at runtime (e.g. show unsaved-changes dot, change name after rename)
- `<sd-badge>` renders the visual: `icon` → `[icon]`, `name` → `[title]` (the pill label), `tooltip` (falls back to `name`) → `[tooltip]`, `color` → `[color]`

## Decorator: `@SdTabComponent`

```ts
@SdTabComponent({
  component: EmployeeDetailComponent,
  name: ({ params }) => `Nhân viên #${params.id}`,
  icon: 'person',
  tooltip: 'Chi tiết nhân viên',
  color: 'primary'
})
@Component({...})
export class EmployeeDetailComponent { ... }
```

| Field       | Type                         | Notes                                                                   |
| ----------- | ---------------------------- | ----------------------------------------------------------------------- |
| `component` | `Type<any>` (REQUIRED)       | The component class this metadata belongs to.                           |
| `name`      | `string \| (args) => string` | Tab label. Function form receives `{ url, params, queryParams, data }`. |
| `icon`      | `string \| (args) => string` | Material icon name.                                                     |
| `tooltip`   | `string \| (args) => string` | Hover tooltip on the badge.                                             |
| `color`     | `Color \| (args) => Color`   | Badge color token.                                                      |

The decorator writes the builder into a plain module-level collection at class-definition time. `<sd-tab-router-outlet>` drains that collection into `SdTabRouterService` when it initialises, and any class decorated later (lazy routes) is forwarded straight to the connected outlet.

> Previously the decorator subscribed to `SdTabDecoratorService.tabRouterService` (a static `BehaviorSubject`) at class-definition time. If an application never provided `SdTabRouterService`, `take(1)` never fired and every decorated class stayed pinned by a live subscriber for the lifetime of the app. `SdTabDecoratorService.tabRouterService` still publishes the service instance for backward compatibility, but the decorator no longer subscribes to it.

## Public API

| API                                 | Kind                    | Use it when                                                                                                                                                                                                                                   |
| ----------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<sd-tab-router-outlet [disabled]>` | Component               | Replacing the app shell's `<router-outlet>` with a persistent multi-tab router host.                                                                                                                                                          |
| `<sd-tab-router-nav [tabs]>`        | Component               | Rendering the tab strip supplied by the outlet. Usually used internally, not by feature screens.                                                                                                                                              |
| `<sd-tab-router-item [tab]>`        | Component               | Rendering one draggable/closable tab pill inside the nav. Usually used internally.                                                                                                                                                            |
| `@SdTabComponent({...})`            | Decorator               | Supplying route-component tab metadata: name, icon, tooltip, and color.                                                                                                                                                                       |
| `SdTabRouterService`                | Service                 | Advanced programmatic tab operations such as setting the current tab, closing, or listening to tab events. Prefer router navigation first.                                                                                                    |
| `SdTabRouterTab` / `SdTabInfo`               | Interfaces              | Strongly typing custom tab metadata or service integrations.                                                                                                                                                                                  |
| `SD_TAB`                            | `InjectionToken<SdTabRouterTab>` | Inject `SdTabRouterTab` của tab hiện tại từ bên trong component để set `beforeClose` hoặc gọi `tabInfoChanges.next(...)`. Scoped tự động per-tab qua `SdOutletInjector`. Dùng `{ optional: true }` nếu component có thể chạy ngoài tab-router context. |

Feature pages normally need only `@SdTabComponent` plus normal Angular `Router.navigate(...)`. App shells wire `<sd-tab-router-outlet>` once.

## Tab data model

```ts
interface SdTabRouterTab {
  component: Type<any>;
  injector?: Injector;
  key: string; // hash(url + queryParams)
  isActive: boolean;
  url: string;
  params?: Record<string, string | number>;
  queryParams?: Record<string, string | number>;
  data?: Record<string, any>;
  tabInfoChanges: Subject<SdTabInfo>;
  beforeClose?: () => boolean | Promise<boolean>;
}

interface SdTabInfo {
  name: string;
  icon?: string;
  tooltip?: string;
  color?: Color;
}
```

## Visual cues (helps agent map screenshots → component)

- A horizontal strip of "tab pills" at the top of the main content area, browser-style
- Each pill (`.tab-router__item`):
  - Pill / chip shape rendered via `<sd-badge>` (rounded, colored)
  - Icon on the left, name in the middle, close `×` (Material `close` icon) on the right
  - Active tab has class `tab-router__item--active` — typically a brighter background and a bottom indicator
  - Drag-handle: the whole pill is draggable horizontally (cursor changes to `grab` on hover)
- Compact mode (when too many tabs): names disappear, only icon + close remain
- Below the strip is `.tab-router__list`, a stack of `.tab-router__pane` divs — only the one with `.active` is visible (display toggled in CSS); others are kept in DOM (state preserved)
- Empty state: an empty `.tab-router__empty` div (intentionally blank — the page should render its own welcome content via a default route)

## Examples

### 1. App shell wiring

```html
<!-- app.component.html -->
<sd-page>
  <sd-tab-router-outlet></sd-tab-router-outlet>
</sd-page>
```

### 2. Decorating a routed component with tab metadata

```ts
import { SdTabComponent } from '@sdcorejs/angular/components/tab-router';

@SdTabComponent({
  component: EmployeeDetailComponent,
  name: ({ params }) => `Nhân viên #${params.id ?? '—'}`,
  icon: 'person',
  color: 'primary'
})
@Component({
  selector: 'app-employee-detail',
  standalone: true,
  templateUrl: './employee-detail.component.html'
})
export class EmployeeDetailComponent { ... }
```

### 3. Replace-tab navigation (open Edit on top of Detail)

```ts
this.router.navigate(['/employees', id, 'edit'], {
  state: { replaceTab: true },
});
```

### 4. Force-reload an existing tab

```ts
this.router.navigate(['/employees', id], {
  state: { forceReload: true },
});
```

If this is already the active identical URL, Angular emits `NavigationSkipped`; the outlet still recreates the existing tab. If the target is not open, it is added normally.

### 5. Force-reload an existing target and replace the other active tab

```ts
this.router.navigate(['/employees', id, 'edit'], {
  state: { forceReload: true, replaceTab: true },
});
```

`replaceTab` removes the other active tab according to its normal rules; `forceReload` independently recreates the target when that target already exists.

### 6. `beforeClose` hook — cảnh báo unsaved changes

```ts
import { SD_TAB } from '@sdcorejs/angular/components/tab-router';

@Component({ ... })
export class EmployeeDetailComponent {
  // inject SD_TAB để lấy SdTabRouterTab của chính tab này (scoped per-tab qua DI)
  readonly #tab = inject(SD_TAB);

  constructor() {
    // Set trong constructor dưới dạng closure — đọc live state tại thời điểm close
    this.#tab.beforeClose = () => {
      if (!this.form.dirty) return true;
      return this.confirm.ask('Bạn có thay đổi chưa lưu. Đóng tab?');
    };
  }
}
```

Component dùng cả trong lẫn ngoài tab-router: dùng `inject(SD_TAB, { optional: true })` (trả về `null` ngoài tab-router context).

An explicit `forceReload` does not call this hook; use it only when the caller intentionally wants to discard and recreate the existing tab.

### 7. Updating tab info at runtime

```ts
this.tab.tabInfoChanges.next({
  name: this.employee.name, // tab name now matches the loaded record
  icon: this.form.dirty ? 'edit' : 'person',
  color: this.form.dirty ? 'warning' : 'primary',
});
```

## Anti-patterns

- ❌ Using `<router-outlet>` AND `<sd-tab-router-outlet>` in the same shell — they will both react to navigation and double-render
- ❌ Mutating `tab.isActive` directly in app code — the outlet rebuilds tabs immutably; your mutation will be overwritten on the next nav
- ❌ Decorating a non-routable component with `@SdTabComponent` — the decorator only takes effect when the route activates the class
- ❌ Counting on `ngOnDestroy` for cleanup when the user closes a tab — the component is destroyed only when its `*ngComponentOutlet` is removed; this happens on close, but timing is async after navigation
- ❌ Relying on global state via `SdTabRouterService` from inside a tab without checking `tab === currentTab` — services are app-wide; multiple tabs can subscribe simultaneously
- ❌ Opening the same URL with different query params and expecting tab reuse — keys include `queryParams`, so any difference creates a new tab

## Accessibility

- Tabs are `<a>` anchors with `[href]` bound to the `tab.url` string → right-click "open in new tab" works (creates a new browser tab, leaves the SPA-tab list alone)
- Close button is a real `<button type="button">` with an i18n `aria-label` (`core.common.close`) and a `:focus-visible` ring. It is keyboard reachable and Enter/Space close the tab. It previously carried `aria-hidden="true"` — which still let it take tab focus while announcing nothing, strictly worse than doing nothing.
- The `<sd-badge>` inside a tab is **not** interactive: no `role`, no `tabindex`, no `(click)` binding. Clicks bubble up to the enclosing `<a>`, so there is no interactive-inside-interactive nesting.
- No `role="tablist" / "tab" / "tabpanel"` ARIA wiring (this is a router shell, not WAI-ARIA tabs)

## Related

- `<sd-badge>` — used to render each tab pill
- Angular `Router` — drives all tab creation / activation
- `SdTabRouterService` — programmatic API for `setCurrentTab`, `close`, event stream
- `SdTabDecoratorService` — legacy wiring layer; still publishes `SdTabRouterService` on a static `BehaviorSubject`, but `@SdTabComponent` no longer subscribes to it
