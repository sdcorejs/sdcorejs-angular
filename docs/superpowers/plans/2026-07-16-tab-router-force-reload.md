# SdTabRouter Force Reload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `subagent-driven-development` (recommended) or `executing-plans` to execute this plan task-by-task. Track every checkbox and apply TDD RED → GREEN independently in both repositories.

**Goal:** Add `state.forceReload = true` beside `state.replaceTab` so navigation to an already-open tab destroys that tab instance and recreates it in place, including navigation to the currently active URL.

**Architecture:** Snapshot `Router.getCurrentNavigation().extras.state` synchronously in the RxJS pipeline before events enter the serialized `concatMap` queue. Pair normal state captured at `RoutesRecognized` with its navigation id, and read same-URL state directly from `NavigationSkipped`, which Angular 19 emits before `NavigationStart`. Activate on `NavigationEnd` or the specific `NavigationSkippedCode.IgnoredSameUrlNavigation` force-reload case. In `#activeRoute`, preserve ordinary duplicate-tab reuse, but replace an existing target with a new `SdTab`, `SdOutletInjector`, and `tabInfoChanges` subject when forced. Track both the pane and nav item by injector instance so Angular destroys subscriptions and the routed component before constructing the replacement.

**Tech Stack:** Angular Router events, `NgComponentOutlet`, signals, RxJS serialized event processing, Jasmine, Karma, TypeScript, PowerShell rollout scripts.

**Version-control boundary:** Do not commit, push, reset, or discard files while executing this plan unless the user separately authorizes it. Preserve the unrelated dirty work already present in the new repository.

---

### Task 0: Capture the dirty-worktree baseline before any implementation edit

- [ ] **Step 1: Record tracked and untracked paths plus content diffs**

Run before adding tests:

```powershell
git -C C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular status --porcelain=v1 -uall
git -C C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular diff --binary -- .sdcorejs .superpowers versions
git -C C:\Users\Admin\Documents\lib-core-angular status --porcelain=v1 -uall
git -C C:\Users\Admin\Documents\lib-core-angular diff --binary -- vn-angular
```

Keep the output in the execution log. Before rollout, refuse to run the mirror if v20/v21 contains a content-dirty or untracked path under a mirrored destination outside the planned set. After rollout, compare status and content diffs, including untracked files; stop/report if a path outside this plan gains a content change, without automatically resetting or discarding it. This guard is required because `npm run sync` mirrors version directories and the new repository already contains unrelated user work.

---

### Task 1: Add RED lifecycle and interaction regressions to Angular 19

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.lifecycle.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.integration.spec.ts`

- [ ] **Step 1: Add inactive-target and same-active-URL lifecycle regressions**

Add these tests inside `describe('SdTabRouterOutletComponent — lifecycle invariants', ...)`:

```typescript
it('destroys and recreates an existing inactive tab when forceReload is true', async () => {
  await router.navigateByUrl('/a');
  await settle(fixture);
  const firstTabA = outletCmp.tabs().find(tab => tab.url === '/a')!;
  const firstInjector = firstTabA.injector;
  const beforeClose = jasmine.createSpy('beforeClose').and.returnValue(false);
  firstTabA.beforeClose = beforeClose;

  await router.navigateByUrl('/b');
  await settle(fixture);
  await router.navigateByUrl('/a', { state: { forceReload: true } });
  await settle(fixture);

  const tabs = outletCmp.tabs();
  const reloadedTabA = tabs.find(tab => tab.url === '/a')!;
  expect(tabs.map(tab => tab.url)).toEqual(['/a', '/b']);
  expect(reloadedTabA).not.toBe(firstTabA);
  expect(reloadedTabA.injector).not.toBe(firstInjector);
  expect(reloadedTabA.isActive).toBeTrue();
  expect(beforeClose).not.toHaveBeenCalled();
  expect(counters.pageA).toEqual({ ctor: 2, init: 2, destroy: 1 });
  expect(counters.pageB).toEqual({ ctor: 1, init: 1, destroy: 0 });
});

it('force reloads the currently active tab when Angular skips same-url navigation', async () => {
  await router.navigateByUrl('/a');
  await settle(fixture);
  const firstTabA = outletCmp.tabs()[0];
  const firstInjector = firstTabA.injector;

  await router.navigateByUrl('/a', { state: { forceReload: true } });
  await settle(fixture);

  const reloadedTabA = outletCmp.tabs()[0];
  expect(outletCmp.tabs().length).toBe(1);
  expect(reloadedTabA).not.toBe(firstTabA);
  expect(reloadedTabA.injector).not.toBe(firstInjector);
  expect(counters.pageA).toEqual({ ctor: 2, init: 2, destroy: 1 });
});
```

These tests establish that force reload is an explicit replacement operation and therefore bypasses `beforeClose`. The ordinary existing test `does NOT re-instantiate when revisiting the same tab key` remains the negative control.

- [ ] **Step 2: Add replaceTab composition and nav-subscription regressions**

Add this import to `tab-router-outlet.integration.spec.ts`:

```typescript
import { SdTabRouterItemComponent } from '../tab-router-item/tab-router-item.component';
```

Add this describe block after the existing `replaceTab navigation state` block:

```typescript
describe('forceReload navigation state', () => {
  it('combines with replaceTab by removing the active tab and recreating the existing target', async () => {
    await navigateAndStabilize(router, fixture, '/a');
    const firstTabA = outletCmp.tabs()[0];
    const firstInjector = firstTabA.injector;
    await navigateAndStabilize(router, fixture, '/b');

    await navigateAndStabilize(router, fixture, '/a', {
      state: { replaceTab: true, forceReload: true },
    });

    const tabs = outletCmp.tabs();
    expect(tabs.length).toBe(1);
    expect(tabs[0].url).toBe('/a');
    expect(tabs[0]).not.toBe(firstTabA);
    expect(tabs[0].injector).not.toBe(firstInjector);
    expect(tabs[0].isActive).toBeTrue();
  });

  it('recreates the nav item so it subscribes to the replacement tab metadata stream', async () => {
    await navigateAndStabilize(router, fixture, '/a');
    const firstItem = fixture.debugElement.query(By.directive(SdTabRouterItemComponent)).componentInstance as SdTabRouterItemComponent;

    await navigateAndStabilize(router, fixture, '/a', { state: { forceReload: true } });

    const reloadedTab = outletCmp.tabs()[0];
    const reloadedItem = fixture.debugElement.query(By.directive(SdTabRouterItemComponent)).componentInstance as SdTabRouterItemComponent;
    expect(reloadedItem).not.toBe(firstItem);

    reloadedTab.tabInfoChanges.next({ name: 'Reloaded A' });
    fixture.detectChanges();

    expect(reloadedItem.tabInfo).toEqual(jasmine.objectContaining({ name: 'Reloaded A' }));
  });

  it('keeps the correct target index when replaceTab removes an earlier active tab', async () => {
    await navigateAndStabilize(router, fixture, '/a');
    await navigateAndStabilize(router, fixture, '/b');
    const firstTabB = outletCmp.tabs().find(tab => tab.url === '/b')!;
    const firstInjector = firstTabB.injector;
    await navigateAndStabilize(router, fixture, '/a');

    await navigateAndStabilize(router, fixture, '/b', {
      state: { replaceTab: true, forceReload: true },
    });

    const tabs = outletCmp.tabs();
    expect(tabs.length).toBe(1);
    expect(tabs[0].url).toBe('/b');
    expect(tabs[0]).not.toBe(firstTabB);
    expect(tabs[0].injector).not.toBe(firstInjector);
    expect(tabs[0].isActive).toBeTrue();
  });

  it('adds a missing target normally when forceReload is true', async () => {
    await navigateAndStabilize(router, fixture, '/a');
    const firstTabA = outletCmp.tabs()[0];
    const firstInjector = firstTabA.injector;

    await navigateAndStabilize(router, fixture, '/c', { state: { forceReload: true } });

    expect(outletCmp.tabs().map(tab => tab.url)).toEqual(['/a', '/c']);
    expect(outletCmp.tabs()[0].injector).toBe(firstInjector);
    expect(outletCmp.tabs()[1].isActive).toBeTrue();
  });
});
```

- [ ] **Step 3: Run the Angular 19 focused suites and confirm RED**

Run from `C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular\versions\v19`:

```powershell
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.lifecycle.spec.ts' --include='projects/sdcorejs-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.integration.spec.ts'
```

Expected failures before production changes:

- Revisiting inactive `/a` reuses the old tab/injector and leaves Page A at one construction.
- Same-active `/a` is skipped and does not reach the current `RoutesRecognized`/`NavigationEnd` filter.
- Combined `replaceTab + forceReload` removes `/b` but reuses old `/a`.
- The nav item remains the same instance because the template tracks by `tab.key`.

The missing-target force case is a characterization and is already green. Existing non-force navigation and close tests must remain green.

---

### Task 2: Handle force reload in Angular 19 router events and tab activation

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.component.ts`

- [ ] **Step 1: Import terminal/cleanup events and synchronous mapping**

Replace the router import with:

```typescript
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationSkippedCode,
  Router,
  RouterOutlet,
  RoutesRecognized,
} from '@angular/router';
```

Change the operators import to:

```typescript
import { concatMap, filter, map } from 'rxjs/operators';
```

Add these file-local types above the component:

```typescript
type SdTabRouterNavigationEvent = RoutesRecognized | NavigationEnd | NavigationSkipped | NavigationCancel | NavigationError;

interface SdTabRouterNavigationContext {
  event: SdTabRouterNavigationEvent;
  navigationState: Record<string, any>;
}
```

- [ ] **Step 2: Snapshot state before the serialized queue**

Replace the router-event filter with:

```typescript
filter(
  (event): event is SdTabRouterNavigationEvent =>
    event instanceof RoutesRecognized ||
    event instanceof NavigationEnd ||
    event instanceof NavigationSkipped ||
    event instanceof NavigationCancel ||
    event instanceof NavigationError
),
map(event => ({
  event,
  // This operator runs synchronously when Router emits. Do not move the read
  // into #handleEvent: concatMap may delay that handler behind another activation.
  navigationState: this.#router.getCurrentNavigation()?.extras?.state ?? {},
})),
concatMap(context => from(this.#handleEvent(context)))
```

Keep raw router events only; do not unwrap `Scroll`, because the existing deduplication comment and tests protect against double activation. Angular 19 evaluates the same-URL ignore condition and emits `NavigationSkipped` before it reaches the `NavigationStart` branch, but `currentNavigation.extras.state` already exists at the skipped-event emission point.

- [ ] **Step 3: Pair normal state by navigation id and handle only supported terminal events**

Replace the singleton pending-state field with:

```typescript
#pendingNavigationStates = new Map<number, Record<string, any>>();
```

Replace `#handleEvent` with:

```typescript
#handleEvent = async ({ event, navigationState }: SdTabRouterNavigationContext): Promise<void> => {
  if (this.disabled()) {
    this.#pendingNavigationStates.clear();
    return;
  }

  if (event instanceof RoutesRecognized) {
    this.#pendingNavigationStates.set(event.id, navigationState);
    return;
  }

  if (event instanceof NavigationCancel || event instanceof NavigationError) {
    this.#pendingNavigationStates.delete(event.id);
    return;
  }

  let state = navigationState;
  let fullUrl: string;
  if (event instanceof NavigationSkipped) {
    this.#pendingNavigationStates.delete(event.id);
    if (event.code !== NavigationSkippedCode.IgnoredSameUrlNavigation || state['forceReload'] !== true) {
      return;
    }
    fullUrl = event.url;
  } else {
    state = this.#pendingNavigationStates.get(event.id) ?? navigationState;
    this.#pendingNavigationStates.delete(event.id);
    fullUrl = event.urlAfterRedirects || event.url;
  }

  await this.#scheduleActivation(async () => {
    const route = this.#getActivatedRouteSnapshot(this.#router.routerState.snapshot.root);
    this.#rootRoute = this.#router.routerState.root;
    await this.#activeRoute(fullUrl, route, state);
  });
};
```

Clear `#pendingNavigationStates` in `ngOnDestroy` after unsubscribing. Update the nearby state comment to explain synchronous state snapshots, navigation-id pairing, and the fact that ignored same-URL navigation has no `NavigationStart` in Angular 19.

- [ ] **Step 4: Replace only an existing target when forceReload is true**

In `#activeRoute`, declare:

```typescript
const replaceTab = state['replaceTab'];
const forceReload = state['forceReload'] === true;
```

Replace the `if (existedIndex >= 0)` branch with:

```typescript
if (existedIndex >= 0) {
  // replaceTab may remove the previously active tab before the existing target.
  const idx = replaceTab && activatedIndex >= 0 && activatedIndex < existedIndex ? existedIndex - 1 : existedIndex;

  if (forceReload) {
    // Explicit reload: preserve list position, but replace every per-tab instance resource.
    updatedTabs = updatedTabs.map((tab, index) => (index === idx ? newTab : tab));
    this.#tabRouterService.setCurrentTab(newTab);
    this.#tabRouterService.pushEvent(newTab, SdTabActivated);
    this.tabs.set(updatedTabs);
  } else {
    // Ordinary duplicate navigation keeps the existing component and injector alive.
    this.#tabRouterService.setCurrentTab(updatedTabs[idx]);
    this.#tabRouterService.pushEvent(updatedTabs[idx], SdTabActivated);
    this.tabs.set(updatedTabs);
  }
} else {
  this.#tabRouterService.setCurrentTab(newTab);
  this.tabs.set([...updatedTabs, newTab]);

  if (this.tabs().length > 30) {
    this.#sdNotifyService.warning(this.#i18n.t('core.component.tab-router.too-many-tabs'));
  }
}
```

Do not call `#closeTab` from this branch. `forceReload` is a programmatic instruction and intentionally bypasses the target tab's `beforeClose` guard. If the target does not exist, the existing add-new branch remains unchanged.

---

### Task 3: Make the pane and nav item follow tab instance identity

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-nav/tab-router-nav.component.html`

- [ ] **Step 1: Track the routed pane by injector instance with a key fallback**

Change the outlet loop to:

```angular-html
@for (tab of tabs(); track tab.injector ?? tab.key) {
```

Normal activation creates spread tab objects but retains the same injector, so existing components remain mounted. Force reload creates a new `SdOutletInjector`, so Angular removes the old pane and runs `ngOnDestroy` before mounting the replacement.

- [ ] **Step 2: Track the nav item by the same identity**

Change the nav loop to:

```angular-html
@for (tab of tabs(); track tab.injector ?? tab.key) {
```

This recreates `SdTabRouterItemComponent` so its `ngOnInit` subscription follows the new `tabInfoChanges` subject instead of the discarded tab.

- [ ] **Step 3: Run the Angular 19 focused suites and confirm GREEN**

Run the Task 1 command again.

Expected: all new force-reload tests and all existing normal-revisit, close, race, `replaceTab`, and scroll-wrapper tests pass.

---

### Task 4: Document the navigation-state option

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/components/tab-router/sd-tab-router.md`

- [ ] **Step 1: Update architecture and behavior descriptions**

Update the outlet architecture row and behavior list to state:

```markdown
- `state.forceReload = true` affects an already-open target tab: the outlet destroys that tab and recreates it at the same list position with a fresh injector and metadata stream. If the target is not open, navigation adds it normally.
- Force reload also works for the currently active URL, even though Angular normally reports that navigation as `NavigationSkipped`.
- `forceReload` is an explicit programmatic reload and does not invoke `beforeClose`; normal user close behavior is unchanged.
- `replaceTab` and `forceReload` are independent. When both are true, the previously active different tab is removed and the existing target is recreated.
```

Update the router-event description to explain that state is snapshotted synchronously at event emission, normal navigation is paired through `RoutesRecognized`/`NavigationEnd`, and force-only same-URL activation uses `NavigationSkipped`.

- [ ] **Step 2: Add usage examples beside replaceTab**

Add:

```typescript
// Reload an existing tab; add normally when it is not open yet.
this.router.navigate(['/employees', id], {
  state: { forceReload: true },
});

// Remove the current different tab, then recreate the existing target tab.
this.router.navigate(['/employees', id], {
  state: { replaceTab: true, forceReload: true },
});
```

State explicitly that omitting `forceReload` preserves the existing component instance and form/scroll state.

---

### Task 5: Roll Angular 19 changes to Angular 20 and 21

**Files generated by rollout:**

- Angular 20/21 copies of the outlet source, both outlet specs, outlet template, nav template, and `sd-tab-router.md`
- Repository sync-status files updated by the supported script

- [ ] **Step 1: Snapshot pre-existing versioned changes**

From `C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular`, run:

```powershell
git status --porcelain=v1 -uall
git diff --binary -- .sdcorejs .superpowers versions
```

Compare all non-planned paths with the Task 0 output. Do not run the mirror if an unrelated file changed unexpectedly.

- [ ] **Step 2: Run the supported rollout and sync check**

```powershell
npm run sync
npm run check:sync
```

Expected: common v20/v21 tab-router files match v19. Re-run the status and binary diff after sync; stop and report if any non-planned content changed, without automatically resetting or discarding it. Do not hand-edit generated common logic.

- [ ] **Step 3: Run the focused Angular 20 and 21 suites**

From each version workspace, run:

```powershell
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.lifecycle.spec.ts' --include='projects/sdcorejs-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.integration.spec.ts'
```

Expected: all focused tests pass in Angular 20 and 21.

---

### Task 6: Reproduce and fix the independent legacy repository

**Files:**

- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\tab-router\src\components\tab-router-outlet\tab-router-outlet.lifecycle.spec.ts`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\tab-router\src\components\tab-router-outlet\tab-router-outlet.integration.spec.ts`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\tab-router\src\components\tab-router-outlet\tab-router-outlet.component.ts`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\tab-router\src\components\tab-router-outlet\tab-router-outlet.component.html`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\tab-router\src\components\tab-router-nav\tab-router-nav.component.html`
- Modify: `C:\Users\Admin\Documents\lib-core-angular\vn-angular\projects\sd-angular\components\tab-router\sd-tab-router.md`

- [ ] **Step 1: Add the four force-reload tests without copying production changes**

Apply the exact lifecycle and integration regressions from Task 1 to the equivalent legacy specs. The legacy repository uses the same Angular Router 19 event types and the same component/test structure.

- [ ] **Step 2: Run the legacy focused suites and confirm RED**

Run from `C:\Users\Admin\Documents\lib-core-angular\vn-angular`:

```powershell
npx ng test sd-angular --watch=false --browsers=ChromeHeadless --include='projects/sd-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.lifecycle.spec.ts' --include='projects/sd-angular/components/tab-router/src/components/tab-router-outlet/tab-router-outlet.integration.spec.ts'
```

Expected: the new force-reload assertions fail while existing tab-router tests pass.

- [ ] **Step 3: Apply the same event handling, replacement branch, template tracking, and documentation**

Use the exact implementations from Tasks 2–4 in the equivalent legacy files. Keep any repository-specific import prefix or unrelated surrounding content intact.

- [ ] **Step 4: Re-run the legacy focused suites and confirm GREEN**

Run the Task 6 focused command again.

Expected: all legacy focused specs pass.

---

### Task 7: Verify builds, state transitions, encoding, and scope

- [ ] **Step 1: Build each affected library workspace**

Run from `C:\Users\Admin\Documents\sdcorejs\sdcorejs-angular`:

```powershell
npm --prefix .\versions\v19 run build
npm --prefix .\versions\v20 run build
npm --prefix .\versions\v21 run build
npm --prefix C:\Users\Admin\Documents\lib-core-angular\vn-angular run build
```

Expected: every command exits `0` and reports a completed Angular package build.

- [ ] **Step 2: Verify rollout and diff hygiene**

From the new repository root:

```powershell
npm run check:sync
git diff --check
git status --short
```

From `C:\Users\Admin\Documents\lib-core-angular`:

```powershell
git diff --check
git status --short
```

Expected: sync passes, diff checks emit no errors, and no unrelated file is overwritten.

- [ ] **Step 3: Scan touched UTF-8 text for mojibake markers**

Read each touched `.ts`, `.html`, and `.md` file explicitly as UTF-8 and review any replacement character or common double-decoding sequence (`Ã`, `Â`, `â€`, `áº`, `á»`). Do not mass-rewrite existing documentation.

- [ ] **Step 4: Inspect the final behavior matrix**

Confirm:

| Target state | `forceReload` | `replaceTab` | Expected result |
| --- | --- | --- | --- |
| Missing | `false` or omitted | `false` | Add a new tab |
| Existing inactive | `false` or omitted | `false` | Activate and preserve instance |
| Existing inactive | `true` | `false` | Recreate at the same index; keep other tabs |
| Existing active same URL | `true` | `false` | Handle ignored same-URL navigation and recreate |
| Existing inactive | `true` | `true` | Remove the other active tab and recreate target |
| Missing | `true` | `false` | Add normally and keep the prior tab |
| Missing | `true` | `true` | Preserve existing `replaceTab`: remove the other active tab, then add target |

Also confirm force reload does not call `beforeClose`, ordinary close still does, `SdTabActivated` is emitted for the replacement, nav metadata updates bind to the replacement subject, and ordinary duplicate navigation still preserves its injector/component.
