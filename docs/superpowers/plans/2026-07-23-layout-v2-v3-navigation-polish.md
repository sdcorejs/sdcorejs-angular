# Layout V2/V3 Navigation Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish compact Layout V2/V3 account and header controls, and replace the four V2/V3 menu searches with the approved shared Soft-pill search field.

**Architecture:** Keep navigation state and filtering in the existing sidebar components. Add one internal standalone search wrapper around `SdInput`, conditionally simplify the existing shared account trigger, and let V3 own its collapsed brand visibility; edit canonical Angular 19 only before each repository sync.

**Tech Stack:** Angular 19–21 standalone components and signal inputs/outputs, Angular Material form field internals through scoped CSS custom properties, Jasmine/Karma/ChromeHeadless, SCSS Core UI tokens, PowerShell multi-version sync, Markdown documentation.

---

## Approved contract

- Source design:
  `docs/superpowers/specs/2026-07-23-layout-v2-v3-navigation-polish-design.md`
- Approved visual direction: **A — Soft pill**.
- Approved technical direction: an internal shared Layout search component that
  wraps `SdInput`.
- Public API impact: none.
- Canonical source: `versions/v19`; Angular 20/21 are generated through
  `npm run sync`.
- Layout V1 is outside scope.

## File map

### New canonical files

- `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.ts`
  - internal signal API and standalone component composition.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.html`
  - search icon plus delegated `SdInput`.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.scss`
  - Soft-pill surface, scoped Material variables and focus ring.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.spec.ts`
  - component configuration and event-forwarding contract.

### Canonical files to modify

- `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.html`
  - omit the disclosure chevron in compact mode.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.scss`
  - center the compact avatar trigger.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts`
  - compact DOM regression.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts`
  - V2 compact account integration regression.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts`
  - replace the direct `SdInput` import with the internal search component.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html`
  - use the shared search field in the contextual flyout.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts`
  - collapsed/expanded brand and account regressions.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts`
  - replace the direct `SdInput` import with the internal search component.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html`
  - conditionally render the brand and use the shared search field.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss`
  - center the collapsed header action.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts`
  - shared search integration regression inside the open sheet.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts`
  - replace the direct `SdInput` import.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html`
  - use the shared search field.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts`
  - shared search integration regression inside the open drawer.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts`
  - replace the direct `SdInput` import.
- `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html`
  - use the shared search field in the sticky search region.
- `versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md`
  - document compact presentation and Soft-pill search.
- `CHANGELOG.md`
  - add the Unreleased Layout improvement.

### Generated files

`npm run sync` creates or updates the matching source, tests and documentation
under `versions/v20` and `versions/v21`, plus the three `SYNC-STATUS.md` files.
`npm run generate:showcase-changelog` updates:

- `versions/v19/projects/showcase/src/app/docs/generated/changelog.generated.ts`
- matching generated files under `versions/v20` and `versions/v21` after sync.

Do not add the internal search component to
`modules/layout/components/index.ts`; doing so would expand the public Layout
surface.

## Task 1: Fix compact account and V3 header presentation

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.scss`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss`

- [ ] **Step 1: Add the compact shared-user-menu RED regression**

Append this test inside `describe('SdLayoutUserMenuComponent', ...)`:

```ts
it('centers only the avatar and omits the disclosure icon in compact mode', () => {
  fixture.componentRef.setInput('compact', true);
  fixture.detectChanges();

  const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
  expect(trigger.classList).toContain('sd-layout-user-menu__trigger--compact');
  expect(trigger.querySelector('sd-avatar')).not.toBeNull();
  expect(trigger.querySelector('sd-icon')).toBeNull();
  expect(trigger.textContent).not.toContain('Demo User');
  expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
});
```

- [ ] **Step 2: Add the V2 compact integration RED regression**

Append this test inside `describe('SidebarV2Component', ...)`:

```ts
it('centers the compact account avatar without a disclosure icon', async () => {
  await create('click');

  const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
  expect(trigger.classList).toContain('sd-layout-user-menu__trigger--compact');
  expect(trigger.querySelector('sd-avatar')).not.toBeNull();
  expect(trigger.querySelector('sd-icon')).toBeNull();
});
```

- [ ] **Step 3: Add collapsed and expanded V3 RED regressions**

Append both tests inside `describe('SidebarV3Component', ...)`:

```ts
it('omits the brand and centers compact controls when collapsed', () => {
  create({ version: 3, defaultCollapsed: true });

  const header = fixture.nativeElement.querySelector('[data-v3-header]') as HTMLElement;
  const accountTrigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
  expect(header.classList).toContain('sd-sidebar-v3__header--collapsed');
  expect(header.querySelector('[data-v3-brand]')).toBeNull();
  expect(header.querySelector('button')?.getAttribute('aria-label')).toBe('Mở rộng sidebar');
  expect(accountTrigger.classList).toContain('sd-layout-user-menu__trigger--compact');
  expect(accountTrigger.querySelector('sd-icon')).toBeNull();
});

it('retains the brand and full account disclosure when expanded', () => {
  create();

  const header = fixture.nativeElement.querySelector('[data-v3-header]') as HTMLElement;
  const accountTrigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
  expect(header.querySelector('[data-v3-brand]')).not.toBeNull();
  expect(header.textContent).toContain('Back Office');
  expect(accountTrigger.textContent).toContain('Demo User');
  expect(accountTrigger.querySelector('mat-icon')?.textContent?.trim()).toBe('expand_more');
});
```

- [ ] **Step 4: Run the three focused specs and verify RED**

Run:

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts"
```

Expected: 22 tests discovered; four new assertions fail because the compact
chevron is still present and V3 has no conditional brand/header markers.

- [ ] **Step 5: Implement compact account rendering**

Replace the identity/icon portion of
`shared/user-menu/user-menu.component.html` with:

```html
<sd-avatar [src]="avatar()" [size]="compact() ? 32 : 40"></sd-avatar>
@if (!compact()) {
  <span class="d-flex flex-column flex-1 overflow-hidden">
    <span class="T14M text-ellipsis">{{ displayName() }}</span>
    @if (userInfo().email) {
      <span class="T12R text-black400 text-ellipsis">{{ userInfo().email }}</span>
    }
  </span>
  <sd-icon [name]="isOpen() ? 'expand_less' : 'expand_more'"></sd-icon>
}
```

Add this binding to the existing trigger button:

```html
[class.sd-layout-user-menu__trigger--compact]="compact()"
```

Append this rule to `shared/user-menu/user-menu.component.scss`:

```scss
// why: Compact rails expose the avatar itself as the disclosure affordance.
.sd-layout-user-menu__trigger--compact {
  width: 56px;
  min-height: 52px;
  justify-content: center;
  gap: 0;
  padding: 0;
}
```

- [ ] **Step 6: Implement conditional V3 brand rendering**

Replace the opening header/brand portion of
`sidebar-v3/main.component.html` with:

```html
<header
  data-v3-header
  class="sd-sidebar-v3__header d-flex align-items-center justify-content-between gap-8 p-12 border-bottom border-black200"
  [class.sd-sidebar-v3__header--collapsed]="isCollapsed()">
  @if (!isCollapsed()) {
    <div data-v3-brand class="d-flex align-items-center gap-8 overflow-hidden">
      @if (sidebar().logoUrl) {
        <img class="sd-sidebar-v3__logo" [src]="sidebar().logoUrl" alt="" />
      } @else {
        <sd-icon name="apps"></sd-icon>
      }
      <span class="T16M text-ellipsis">{{ sidebar().defaultTitle || 'Back Office' }}</span>
    </div>
  }
  <button
    type="button"
    class="sd-sidebar-v3__icon-action d-flex align-items-center justify-content-center"
    [attr.aria-label]="isCollapsed() ? 'Mở rộng sidebar' : 'Thu gọn sidebar'"
    [attr.aria-expanded]="!isCollapsed()"
    (click)="toggleCollapsed()">
    <sd-icon [name]="isCollapsed() ? 'chevron_right' : 'chevron_left'"></sd-icon>
  </button>
</header>
```

Append this rule to `sidebar-v3/main.component.scss`:

```scss
// why: The 72px collapsed drawer has room for one centered header action.
.sd-sidebar-v3__header--collapsed {
  justify-content: center;
}
```

- [ ] **Step 7: Run focused tests and verify GREEN**

Run the Step 4 command again.

Expected: 22/22 pass.

- [ ] **Step 8: Sync the compact fix and verify Angular 20/21**

Run:

```powershell
npm run sync
npm run check:sync
npm --prefix versions/v20 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts"
npm --prefix versions/v21 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts"
```

Expected: sync checks pass; Angular 20 and 21 each report 22/22 pass.

- [ ] **Step 9: Commit the compact fix**

Stage only the canonical/mirror user-menu and V3 header source/spec files,
the V2 specs, and generated `SYNC-STATUS.md` changes:

```powershell
git add -- `
  versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu `
  versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts `
  versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3 `
  versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/user-menu `
  versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts `
  versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3 `
  versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/user-menu `
  versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts `
  versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3 `
  versions/v19/SYNC-STATUS.md versions/v20/SYNC-STATUS.md versions/v21/SYNC-STATUS.md
git diff --cached --check
git commit -m "fix(layout): polish compact navigation controls"
```

Expected: one commit containing no `.superpowers/` or `.sdcorejs/tasks/`
artifacts.

## Task 2: Build the internal Soft-pill search component

**Files:**

- Create: `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.spec.ts`
- Create: `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.ts`
- Create: `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.html`
- Create: `versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.scss`

- [ ] **Step 1: Write the shared search-field spec before the component**

Create
`versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.spec.ts`
with:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdInput } from '@sdcorejs/angular/forms';
import { SdLayoutSearchFieldComponent } from './search-field.component';

describe('SdLayoutSearchFieldComponent', () => {
  let fixture: ComponentFixture<SdLayoutSearchFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdLayoutSearchFieldComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdLayoutSearchFieldComponent);
    fixture.componentRef.setInput('placeholder', 'Tìm trong tất cả menu');
    fixture.componentRef.setInput('autoId', 'layout-test-search');
    fixture.componentRef.setInput('model', 'report');
    fixture.detectChanges();
  });

  it('renders the Soft-pill shell and forwards input configuration', () => {
    const shell = fixture.nativeElement.querySelector('[data-layout-search]') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(shell.classList).toContain('sd-layout-search-field--soft-pill');
    expect(shell.querySelector('mat-icon')?.textContent?.trim()).toBe('search');
    expect(input.placeholder).toBe('Tìm trong tất cả menu');
    expect(input.getAttribute('data-autoid')).toBe('forms-input-layout-test-search');
    expect(input.value).toBe('report');
  });

  it('forwards SdInput changes as strings', () => {
    const change = jasmine.createSpy('change');
    fixture.componentInstance.sdChange.subscribe(change);

    fixture.debugElement.query(By.directive(SdInput)).triggerEventHandler('sdChange', 'tasks');

    expect(change).toHaveBeenCalledOnceWith('tasks');
  });
});
```

- [ ] **Step 2: Run the new spec and verify RED**

Run:

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.spec.ts"
```

Expected: TypeScript compilation fails because
`./search-field.component` does not exist.

- [ ] **Step 3: Create the standalone component class**

Create `search-field.component.ts` with:

```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SdInput } from '@sdcorejs/angular/forms';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'sd-layout-search-field',
  standalone: true,
  imports: [SdIcon, SdInput],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdLayoutSearchFieldComponent {
  model = input('');
  placeholder = input.required<string>();
  autoId = input.required<string>();
  sdChange = output<string>();
}
```

- [ ] **Step 4: Create the delegated search template**

Create `search-field.component.html` with:

```html
<div
  data-layout-search
  class="sd-layout-search-field sd-layout-search-field--soft-pill d-flex align-items-center gap-8">
  <sd-icon class="sd-layout-search-field__icon" name="search"></sd-icon>
  <sd-input
    class="sd-layout-search-field__control"
    size="sm"
    [placeholder]="placeholder()"
    [autoId]="autoId()"
    [model]="model()"
    (sdChange)="sdChange.emit($event)">
  </sd-input>
</div>
```

- [ ] **Step 5: Create the scoped Soft-pill styles**

Create `search-field.component.scss` with:

```scss
:host {
  display: block;
  min-width: 0;
}

// why: Layout search is a navigation affordance, not a generic outlined form.
.sd-layout-search-field {
  min-height: 38px;
  padding: 0 12px;
  border: 0;
  border-radius: 9999px;
  outline: 2px solid transparent;
  outline-offset: 2px;
  background: var(--sd-black100);
  color: var(--sd-black400);
}

// why: Keyboard focus must remain visible after the Material outline is hidden.
.sd-layout-search-field:focus-within {
  outline-color: var(--sd-primary);
}

.sd-layout-search-field__icon {
  flex: 0 0 auto;
  color: var(--sd-black400);
}

// why: MDC variables are inherited into SdInput without changing global fields.
.sd-layout-search-field__control {
  flex: 1;
  min-width: 0;
  --mdc-outlined-text-field-outline-color: transparent;
  --mdc-outlined-text-field-hover-outline-color: transparent;
  --mdc-outlined-text-field-focus-outline-color: transparent;
  --mdc-outlined-text-field-input-text-placeholder-color: var(--sd-black400);
  --mdc-outlined-text-field-container-shape: 0px;
}
```

- [ ] **Step 6: Run the component spec and verify GREEN**

Run the Step 2 command again.

Expected: 2/2 pass.

- [ ] **Step 7: Confirm the component is internal**

Run:

```powershell
rg -n "search-field|SdLayoutSearchFieldComponent" `
  versions/v19/projects/sdcorejs-angular/modules/layout/components/index.ts `
  versions/v19/projects/sdcorejs-angular/modules/layout/index.ts
```

Expected: no matches and exit code 1; neither public barrel exports the
component.

- [ ] **Step 8: Sync and test the new component on Angular 20/21**

Run:

```powershell
npm run sync
npm run check:sync
npm --prefix versions/v20 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.spec.ts"
npm --prefix versions/v21 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.spec.ts"
```

Expected: sync passes; Angular 20 and 21 each report 2/2 pass.

- [ ] **Step 9: Commit the internal search component**

```powershell
git add -- `
  versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field `
  versions/v20/projects/sdcorejs-angular/modules/layout/components/shared/search-field `
  versions/v21/projects/sdcorejs-angular/modules/layout/components/shared/search-field `
  versions/v19/SYNC-STATUS.md versions/v20/SYNC-STATUS.md versions/v21/SYNC-STATUS.md
git diff --cached --check
git commit -m "feat(layout): add soft-pill menu search"
```

Expected: the commit contains the internal component and mirrors only; public
barrels remain unchanged.

## Task 3: Integrate Soft-pill search into all V2/V3 variants

**Files:**

- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html`

- [ ] **Step 1: Add the V2 desktop shared-search RED regression**

Append inside `describe('SidebarV2Component', ...)`:

```ts
it('uses the shared search field in the contextual flyout', async () => {
  await create('click');
  fixture.componentInstance.selectGroup(work);
  fixture.detectChanges();

  const input = fixture.nativeElement.querySelector(
    'sd-layout-search-field input[data-autoid="forms-input-layout-v2-context-search"]'
  ) as HTMLInputElement;
  expect(input).not.toBeNull();
  expect(input.placeholder).toBe('Tìm trong nhóm');
});
```

- [ ] **Step 2: Add the V3 desktop shared-search RED regression**

Append inside `describe('SidebarV3Component', ...)`:

```ts
it('uses the shared search field in the expanded drawer', () => {
  create();

  const input = fixture.nativeElement.querySelector(
    'sd-layout-search-field input[data-autoid="forms-input-layout-v3-global-search"]'
  ) as HTMLInputElement;
  expect(input).not.toBeNull();
  expect(input.placeholder).toBe('Tìm trong tất cả menu');
});
```

- [ ] **Step 3: Add the V2 mobile shared-search RED regression**

Append inside `describe('SidebarMobileV2Component', ...)`:

```ts
it('uses the shared search field inside the open sheet', () => {
  fixture.componentInstance.openMore();
  fixture.detectChanges();

  const input = fixture.nativeElement.querySelector(
    'sd-layout-search-field input[data-autoid="forms-input-layout-v2-mobile-search"]'
  ) as HTMLInputElement;
  expect(input).not.toBeNull();
  expect(input.placeholder).toBe('Tìm trong menu');
});
```

- [ ] **Step 4: Add the V3 mobile shared-search RED regression**

Append inside `describe('SidebarMobileV3Component', ...)`:

```ts
it('uses the shared search field inside the open drawer', () => {
  fixture.componentInstance.openDrawer();
  fixture.detectChanges();

  const input = fixture.nativeElement.querySelector(
    'sd-layout-search-field input[data-autoid="forms-input-layout-v3-mobile-global-search"]'
  ) as HTMLInputElement;
  expect(input).not.toBeNull();
  expect(input.placeholder).toBe('Tìm trong tất cả menu');
});
```

- [ ] **Step 5: Run all four sidebar specs and verify RED**

Run:

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts"
```

Expected: 29 tests discovered; four new tests fail because the sidebars still
render `sd-input` directly.

- [ ] **Step 6: Replace desktop V2 search**

In `sidebar-v2/main.component.ts`:

```ts
// Remove:
import { SdInput } from '@sdcorejs/angular/forms';

// Add:
import { SdLayoutSearchFieldComponent } from '../shared/search-field/search-field.component';
```

Set the component imports to:

```ts
imports: [SdIcon, SdLayoutSearchFieldComponent, SdLayoutMenuTreeComponent, SdLayoutUserMenuComponent],
```

Replace the V2 search block in `sidebar-v2/main.component.html` with:

```html
<div class="p-12">
  <sd-layout-search-field
    placeholder="Tìm trong nhóm"
    [autoId]="'layout-v2-context-search'"
    [model]="searchText()"
    (sdChange)="searchText.set($event)">
  </sd-layout-search-field>
</div>
```

- [ ] **Step 7: Replace desktop V3 search**

In `sidebar-v3/main.component.ts`:

```ts
// Remove:
import { SdInput } from '@sdcorejs/angular/forms';

// Add:
import { SdLayoutSearchFieldComponent } from '../shared/search-field/search-field.component';
```

Set the component imports to:

```ts
imports: [SdIcon, SdLayoutSearchFieldComponent, SdLayoutMenuTreeComponent, SdLayoutUserMenuComponent],
```

Replace the expanded V3 search block in `sidebar-v3/main.component.html` with:

```html
<div class="p-12">
  <sd-layout-search-field
    placeholder="Tìm trong tất cả menu"
    [autoId]="'layout-v3-global-search'"
    [model]="searchText()"
    (sdChange)="searchText.set($event)">
  </sd-layout-search-field>
</div>
```

- [ ] **Step 8: Replace mobile V2 search**

In `sidebar-mobile-v2/main.component.ts`:

```ts
// Remove:
import { SdInput } from '@sdcorejs/angular/forms';

// Add:
import { SdLayoutSearchFieldComponent } from '../shared/search-field/search-field.component';
```

Set the component imports to:

```ts
imports: [A11yModule, SdIcon, SdLayoutSearchFieldComponent, SdLayoutMenuTreeComponent, SdLayoutUserMenuComponent],
```

Replace the mobile V2 search block in
`sidebar-mobile-v2/main.component.html` with:

```html
<sd-layout-search-field
  placeholder="Tìm trong menu"
  [autoId]="'layout-v2-mobile-search'"
  [model]="searchText()"
  (sdChange)="searchText.set($event)">
</sd-layout-search-field>
```

- [ ] **Step 9: Replace mobile V3 search**

In `sidebar-mobile-v3/main.component.ts`:

```ts
// Remove:
import { SdInput } from '@sdcorejs/angular/forms';

// Add:
import { SdLayoutSearchFieldComponent } from '../shared/search-field/search-field.component';
```

Set the component imports to:

```ts
imports: [A11yModule, SdIcon, SdLayoutSearchFieldComponent, SdLayoutMenuTreeComponent, SdLayoutUserMenuComponent],
```

Replace the sticky mobile V3 search block in
`sidebar-mobile-v3/main.component.html` with:

```html
<div class="sd-sidebar-mobile-v3__search bg-white">
  <sd-layout-search-field
    placeholder="Tìm trong tất cả menu"
    [autoId]="'layout-v3-mobile-global-search'"
    [model]="searchText()"
    (sdChange)="searchText.set($event)">
  </sd-layout-search-field>
</div>
```

- [ ] **Step 10: Run the four sidebar specs and verify GREEN**

Run the Step 5 command again.

Expected: 29/29 pass.

- [ ] **Step 11: Run the complete changed-spec set**

Run:

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts"
```

Expected: 38/38 pass.

- [ ] **Step 12: Sync integration and verify Angular 20/21**

Run:

```powershell
npm run sync
npm run check:sync
npm --prefix versions/v20 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts"
npm --prefix versions/v21 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.spec.ts" `
  --include="projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.spec.ts"
```

Expected: sync passes; Angular 20 and 21 each report 38/38 pass.

- [ ] **Step 13: Commit four-variant integration**

```powershell
git add -- `
  versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2 `
  versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3 `
  versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2 `
  versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3 `
  versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v2 `
  versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-v3 `
  versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2 `
  versions/v20/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3 `
  versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v2 `
  versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-v3 `
  versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2 `
  versions/v21/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3 `
  versions/v19/SYNC-STATUS.md versions/v20/SYNC-STATUS.md versions/v21/SYNC-STATUS.md
git diff --cached --check
git commit -m "refactor(layout): share menu search presentation"
```

Expected: one integration commit; no public barrel, design-session or checkpoint
artifact is staged.

## Task 4: Update release notes and Layout documentation

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md`
- Generate: `versions/v19/projects/showcase/src/app/docs/generated/changelog.generated.ts`
- Generate through sync: matching Layout docs and Showcase changelog under
  `versions/v20` and `versions/v21`
- Generate: `versions/v19/SYNC-STATUS.md`
- Generate: `versions/v20/SYNC-STATUS.md`
- Generate: `versions/v21/SYNC-STATUS.md`

- [ ] **Step 1: Add the Unreleased changelog entry**

Insert this section between `## [Unreleased]` and the existing `### Fixed`:

```markdown
### Changed

- **Layout V2/V3 navigation polish** - centered compact account and drawer controls, removed the collapsed V3 fallback brand icon, and unified desktop/mobile menu search behind an internal Soft-pill presentation without changing public APIs or filtering behavior.
```

- [ ] **Step 2: Document compact controls and menu search**

Insert these paragraphs after the existing sentence ending with
“V3 search is accent-insensitive and searches the filtered menu tree.” in
`versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md`:

```markdown
V2's desktop rail and V3's collapsed desktop drawer center the avatar as the account-menu trigger without rendering a separate disclosure chevron. Collapsed V3 also hides the brand block and keeps only the centered expand control; the expanded drawer and both mobile variants retain the full account identity presentation.

V2/V3 desktop and mobile menu searches share the same internal Soft-pill field: a gray token-based surface, leading search icon and primary focus ring. Placeholder text, `autoId` hooks, accent-insensitive filtering and parent-owned search signals keep their existing contracts.
```

- [ ] **Step 3: Regenerate and test Showcase changelog data**

Run:

```powershell
npm run generate:showcase-changelog
npm run test:showcase-changelog
```

Expected: generator succeeds and all changelog generator tests pass.

- [ ] **Step 4: Sync documentation and verify parity**

Run:

```powershell
npm run sync
npm run check:sync
git diff --check
```

Expected: v20/v21 Layout docs and generated changelog match canonical v19;
sync and whitespace checks pass.

- [ ] **Step 5: Commit documentation and generated release data**

```powershell
git add -- `
  CHANGELOG.md `
  versions/v19/projects/sdcorejs-angular/modules/layout/sd-layout.md `
  versions/v20/projects/sdcorejs-angular/modules/layout/sd-layout.md `
  versions/v21/projects/sdcorejs-angular/modules/layout/sd-layout.md `
  versions/v19/projects/showcase/src/app/docs/generated/changelog.generated.ts `
  versions/v20/projects/showcase/src/app/docs/generated/changelog.generated.ts `
  versions/v21/projects/showcase/src/app/docs/generated/changelog.generated.ts `
  versions/v19/SYNC-STATUS.md versions/v20/SYNC-STATUS.md versions/v21/SYNC-STATUS.md
git diff --cached --check
git commit -m "docs(layout): document navigation polish"
```

Expected: documentation/release-data commit only.

## Task 5: Run full verification and browser visual checks

**Files:**

- Verify only; do not change implementation unless a failing check identifies a
  real regression.

- [ ] **Step 1: Run the complete Layout suite on Angular 19**

Run:

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless `
  --include="projects/sdcorejs-angular/modules/layout/**/*.spec.ts"
```

Expected: all Layout specs pass with zero failures.

- [ ] **Step 2: Run the changed-spec matrix on Angular 20/21**

Run the two Angular 20/21 commands from Task 3 Step 12.

Expected: 38/38 pass on each maintained mirror.

- [ ] **Step 3: Run release lint and parity checks**

Run:

```powershell
npm run check:sync
npm run lint:release
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Build all libraries**

Run sequentially:

```powershell
npm --prefix versions/v19 run build
npm --prefix versions/v20 run build
npm --prefix versions/v21 run build
```

Expected: all three library builds exit 0.

- [ ] **Step 5: Build the Angular 19 Showcase**

Run:

```powershell
npm --prefix versions/v19 run build:showcase
```

Expected: production Showcase build exits 0 and regenerates example/changelog
sources without drift.

- [ ] **Step 6: Start the local Showcase for visual verification**

Run in a persistent terminal:

```powershell
npm --prefix versions/v19 run showcase
```

Open:

```text
http://localhost:4200/v/latest/modules-integrations/layout/examples
```

- [ ] **Step 7: Verify V2 desktop**

In the live Layout example:

1. Select `V2 - Rail`.
2. Select `Desktop`.
3. Confirm the bottom account trigger contains one centered avatar and no
   `expand_more` icon.
4. Open a rail group.
5. Confirm `Tìm trong nhóm` uses the gray Soft-pill surface, leading search
   icon and visible primary focus ring.
6. Type a matching query and confirm the visible menu tree filters.

Expected: no horizontal overflow, displaced avatar or console error.

- [ ] **Step 8: Verify V3 expanded and collapsed**

1. Select `V3 - Collapsible`.
2. Confirm expanded mode shows brand/title, full account identity and
   disclosure chevron.
3. Focus the search field and confirm the Soft-pill focus ring.
4. Collapse the drawer.
5. Confirm the header shows only a centered `chevron_right`; no logo or `apps`
   icon remains.
6. Confirm the collapsed account trigger shows one centered avatar with no
   chevron or overflow.

Expected: content offset stays at 304px expanded and 72px collapsed; account
popup still opens in both states.

- [ ] **Step 9: Verify mobile V2/V3**

1. Select `Mobile`.
2. In V2, open `Thêm`, confirm the sheet search is Soft pill and filters the
   sheet tree.
3. Switch to V3, open the drawer, confirm the sticky global search is Soft pill
   and filters the global tree.
4. Press `Escape` in each overlay and confirm focus restoration and body-scroll
   cleanup.

Expected: no search clipping, sticky-region overlap or residual overlay.

- [ ] **Step 10: Inspect browser console and repository state**

Confirm the Layout page has no new console errors. Then run:

```powershell
git status --short
git log -4 --oneline
```

Expected implementation commits:

```text
docs(layout): document navigation polish
refactor(layout): share menu search presentation
feat(layout): add soft-pill menu search
fix(layout): polish compact navigation controls
```

The pre-existing `.sdcorejs/tasks/current-session.md` checkpoint and
`.superpowers/brainstorm/` visual-session artifacts must not appear in any
implementation commit.

## Task 6: Finish review and delivery readiness

**Files:**

- Review all commits and changed source/docs generated by Tasks 1–4.
- Update the session checkpoint through the active execution workflow.

- [ ] **Step 1: Review the final diff against the approved design**

Run:

```powershell
git diff fc27458..HEAD -- `
  CHANGELOG.md `
  docs/superpowers/specs/2026-07-23-layout-v2-v3-navigation-polish-design.md `
  versions/v19/SYNC-STATUS.md versions/v20/SYNC-STATUS.md versions/v21/SYNC-STATUS.md `
  versions/v19/projects/sdcorejs-angular/modules/layout `
  versions/v20/projects/sdcorejs-angular/modules/layout `
  versions/v21/projects/sdcorejs-angular/modules/layout `
  versions/v19/projects/showcase/src/app/docs/generated/changelog.generated.ts `
  versions/v20/projects/showcase/src/app/docs/generated/changelog.generated.ts `
  versions/v21/projects/showcase/src/app/docs/generated/changelog.generated.ts
```

Confirm all ten acceptance criteria in the approved design have implementation
or verification evidence, Layout V1 is untouched, and no public search export
was introduced.

- [ ] **Step 2: Run the mandatory finishing chain**

Use the repository workflow to perform:

1. focused/full test evidence review;
2. read-only Angular code review;
3. repair loop for verified findings;
4. code-documentation check for touched source;
5. final Angular browser UI check;
6. verify-before-done and branch-readiness checks;
7. auto-doc/session summary and living task tracker refresh.

Expected: no blocker or required finding remains. If a finding changes source,
rerun its focused tests, `npm run check:sync`, lint, affected builds and the
relevant browser scenario before claiming completion.

- [ ] **Step 3: Stop before push, PR, tag or release**

Report the verified commit list, test/build/browser evidence, remaining
untracked visual-session artifacts and current branch status. Do not push,
create a PR, tag or release unless the user explicitly authorizes that separate
delivery action.
