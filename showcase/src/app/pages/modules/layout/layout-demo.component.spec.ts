import { Component, EnvironmentInjector, Injector, ViewEncapsulation, createComponent } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SD_LAYOUT_STORAGE_NAMESPACE, SdLayoutStorageService } from '@sdcorejs/angular/modules/layout';
import { SHOWCASE_DEMO_SECTION_ID } from '../../../shared/demo-page.component';
import { LAYOUT_DEMO_CONTEXT, LAYOUT_DEMO_NOTIFICATION_COUNT, LayoutDemoComponent } from './layout-demo.component';

// why: target test của Showcase không nạp global styles (angular.json chỉ khai cho build), nên nạp chính
// src/styles.scss qua một component rỗng để kiểm tra scope graphite thật thay vì chép lại giá trị token.
@Component({
  selector: 'app-showcase-global-styles',
  standalone: true,
  template: '',
  styleUrl: '../../../../styles.scss',
  encapsulation: ViewEncapsulation.None,
})
class ShowcaseGlobalStylesComponent {}

function showcaseOf(element: HTMLElement, id: string): HTMLElement {
  const showcase = element.querySelector<HTMLElement>(`[data-layout-showcase="${id}"]`);
  if (!showcase) throw new Error(`Missing layout showcase "${id}"`);
  return showcase;
}

function contextTriggerOf(showcase: HTMLElement): HTMLButtonElement | null {
  return showcase.querySelector<HTMLButtonElement>('sd-layout-context-switcher [data-context-trigger]');
}

function popoverRows(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('[data-context-popover] [data-context-row]'));
}

const PREVIEW_NAMESPACES = {
  '1': 'showcase-layout-v1',
  '2': 'showcase-layout-v2',
  '3': 'showcase-layout-v3',
  '4': 'showcase-layout-v4',
  '4-graphite': 'showcase-layout-v4-graphite',
} as const;

/** Layout storage of one preview, read the way Core reads it (same namespace). */
function previewStorage(namespace: string): SdLayoutStorageService {
  return Injector.create({
    providers: [SdLayoutStorageService, { provide: SD_LAYOUT_STORAGE_NAMESPACE, useValue: namespace }],
    parent: TestBed.inject(Injector),
  }).get(SdLayoutStorageService);
}

// why: localStorage sống qua các spec — xoá toàn bộ state layout của từng preview để mỗi test bắt đầu như lần đầu mở trang.
function clearPreviewStorage(): void {
  for (const namespace of Object.values(PREVIEW_NAMESPACES)) previewStorage(namespace).clear();
  previewStorage('').currentContext.remove();
}

describe('LayoutDemoComponent', () => {
  let fixture: ComponentFixture<LayoutDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutDemoComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    clearPreviewStorage();
    fixture = TestBed.createComponent(LayoutDemoComponent);
    fixture.detectChanges();
  });

  afterEach(() => clearPreviewStorage());

  it('renders V1, V2, V3, V4 and the graphite V4 as independent showcases', () => {
    const element = fixture.nativeElement as HTMLElement;

    for (const [id, version] of [
      ['1', 1],
      ['2', 2],
      ['3', 3],
      ['4', 4],
      ['4-graphite', 4],
    ] as const) {
      const showcase = element.querySelector<HTMLElement>(`[data-layout-showcase="${id}"]`);
      expect(showcase).withContext(`showcase ${id}`).not.toBeNull();
      expect(showcase?.querySelector(`[data-active-layout-version="${version}"]`)).withContext(`showcase ${id}`).not.toBeNull();
    }

    expect(element.querySelector('[data-layout-version]')).toBeNull();
  });

  it('keeps viewport selection independent for each showcase', () => {
    const element = fixture.nativeElement as HTMLElement;
    const v1Showcase = element.querySelector<HTMLElement>('[data-layout-showcase="1"]');
    const v2Showcase = element.querySelector<HTMLElement>('[data-layout-showcase="2"]');
    const v3Showcase = element.querySelector<HTMLElement>('[data-layout-showcase="3"]');

    v2Showcase?.querySelector<HTMLButtonElement>('[data-layout-viewport="mobile"]')?.click();
    fixture.detectChanges();

    expect(v1Showcase?.querySelector('[data-active-layout-viewport="desktop"]')).not.toBeNull();
    expect(v2Showcase?.querySelector('[data-active-layout-viewport="mobile"]')).not.toBeNull();
    expect(v3Showcase?.querySelector('[data-active-layout-viewport="desktop"]')).not.toBeNull();
  });

  it('renders all eight desktop and mobile sidebar variants without runtime errors', () => {
    const element = fixture.nativeElement as HTMLElement;
    const variants = [
      [1, 'desktop', 'sd-sidebar-v1'],
      [1, 'mobile', 'sd-sidebar-mobile-v1'],
      [2, 'desktop', 'sd-sidebar-v2'],
      [2, 'mobile', 'sd-sidebar-mobile-v2'],
      [3, 'desktop', 'sd-sidebar-v3'],
      [3, 'mobile', 'sd-sidebar-mobile-v3'],
      [4, 'desktop', 'sd-sidebar-v4'],
      [4, 'mobile', 'sd-sidebar-mobile-v4'],
    ] as const;

    for (const [version, viewport, expectedSelector] of variants) {
      const showcase = element.querySelector<HTMLElement>(`[data-layout-showcase="${version}"]`);

      expect(() => {
        showcase?.querySelector<HTMLButtonElement>(`[data-layout-viewport="${viewport}"]`)?.click();
        fixture.detectChanges();
      })
        .withContext(`sidebar V${version} ${viewport}`)
        .not.toThrow();
      expect(showcase?.querySelector(expectedSelector)).withContext(`sidebar V${version} ${viewport}`).not.toBeNull();
    }
  });

  it('shows V1 menu search with a compatible Insights icon and a rich menu fixture', () => {
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;
    const workspace = component.menus.find(menu => menu.id === 'workspace');
    const insights = component.menus.find(menu => menu.id === 'insights');
    const v1Showcase = element.querySelector<HTMLElement>('[data-layout-showcase="1"]');

    v1Showcase?.querySelector<HTMLButtonElement>('.c-menu-group button')?.click();
    fixture.detectChanges();

    expect(workspace && 'children' in workspace ? workspace.children?.length : 0).toBeGreaterThan(10);
    expect(insights?.icon).toBe('bar_chart');
    expect(v1Showcase?.querySelector('.c-menu-tree-search')).not.toBeNull();
    const search = v1Showcase?.querySelector<HTMLInputElement>('input[data-autoid="layout-v1-menu-search"]');
    expect(search?.placeholder).toBe('Search menu');
    expect(search?.type).toBe('search');
    expect(search?.getAttribute('aria-label')).toBe('Search menu');
  });

  it('keeps the V1 desktop account avatar inside the live preview', () => {
    const element = fixture.nativeElement as HTMLElement;
    const v1Preview = element.querySelector<HTMLElement>('[data-layout-showcase="1"] [data-active-layout-version="1"]');
    const avatar = v1Preview?.querySelector<HTMLElement>('.c-layout-user-avatar');

    expect(avatar).not.toBeNull();
    expect(v1Preview?.classList).toContain('layout-demo__preview--contain-v1');
    expect(avatar?.getBoundingClientRect().bottom).toBeLessThanOrEqual(v1Preview?.getBoundingClientRect().bottom ?? 0);
  });

  it('fits the desktop V4 shell exactly to the live preview', () => {
    const element = fixture.nativeElement as HTMLElement;
    const v4Preview = element.querySelector<HTMLElement>('[data-layout-showcase="4"] [data-active-layout-version="4"]')!;
    const host = v4Preview.querySelector<HTMLElement>('sd-sidebar-v4')!;
    const content = v4Preview.querySelector<HTMLElement>('[data-v4-content]')!;
    const drawer = v4Preview.querySelector<HTMLElement>('[data-v4-sidebar]')!;
    const footer = v4Preview.querySelector<HTMLElement>('[data-v4-footer]')!;
    const innerHeight = v4Preview.clientHeight;

    // why: so bằng giá trị chính xác — không dựa vào việc viewport của Karma cao hơn preview 620px.
    expect(getComputedStyle(host).minHeight).toBe('0px');
    expect(getComputedStyle(content).minHeight).toBe('0px');
    expect(host.getBoundingClientRect().height).toBe(innerHeight);
    expect(content.getBoundingClientRect().height).toBe(innerHeight);
    expect(drawer.getBoundingClientRect().height).toBe(innerHeight);
    expect(footer.getBoundingClientRect().bottom).toBeCloseTo(drawer.getBoundingClientRect().bottom, 1);
  });

  it('demonstrates role, optional account actions and reactive notification badges in every desktop version', () => {
    const element = fixture.nativeElement as HTMLElement;
    LAYOUT_DEMO_NOTIFICATION_COUNT.set(12);
    fixture.detectChanges();

    for (const version of [1, 2, 3, 4]) {
      const showcase = element.querySelector<HTMLElement>(`[data-layout-showcase="${version}"]`);
      const userMenu = showcase?.querySelector<HTMLElement>('sd-layout-user-menu');
      userMenu?.querySelector<HTMLButtonElement>('[data-user-trigger]')?.click();
      fixture.detectChanges();

      expect(userMenu?.querySelector('[data-user-role]')?.textContent).withContext(`V${version} role`).toContain('Product Owner');
      expect(userMenu?.querySelector('[data-user-action="update-profile"]')).withContext(`V${version} updateProfile`).not.toBeNull();
      expect(userMenu?.querySelector('[data-user-action="setting"]')).withContext(`V${version} setting`).not.toBeNull();
      expect(userMenu?.querySelector('[data-user-action="notification"]')).withContext(`V${version} notification`).not.toBeNull();
      expect(userMenu?.querySelector('[data-notification-badge]')?.textContent?.trim()).withContext(`V${version} badge`).toBe('12');
      expect(userMenu?.textContent).withContext(`V${version} translated copy`).not.toContain('core.module.layout.user.');
    }
  });

  it('keeps profile and sign-out inline with optional account actions below in all mobile versions', () => {
    const element = fixture.nativeElement as HTMLElement;

    for (const version of [1, 2, 3]) {
      const showcase = element.querySelector<HTMLElement>(`[data-layout-showcase="${version}"]`);
      showcase?.querySelector<HTMLButtonElement>('[data-layout-viewport="mobile"]')?.click();
      fixture.detectChanges();
      if (version === 2) {
        const moreButton = showcase?.querySelector<HTMLButtonElement>('button[aria-label="More menu"]') ?? null;
        expect(moreButton).withContext('V2 More trigger').not.toBeNull();
        moreButton?.click();
        fixture.detectChanges();
      }
      if (version === 3) {
        showcase?.querySelector<HTMLButtonElement>('[data-v3-mobile-trigger]')?.click();
        fixture.detectChanges();
      }

      const row = showcase?.querySelector<HTMLElement>('[data-mobile-account-row]') ?? null;
      const actions = showcase?.querySelector<HTMLElement>('[data-mobile-account-actions]') ?? null;
      expect(row).withContext(`V${version} account row`).not.toBeNull();
      expect(actions).withContext(`V${version} account actions`).not.toBeNull();
      expect(row!.querySelector('[data-user-summary]')).withContext(`V${version} profile`).not.toBeNull();
      expect(row!.querySelector('[data-user-action="signout"]')).withContext(`V${version} signout`).not.toBeNull();
      expect(row!.querySelector('[data-user-role]')?.textContent).withContext(`V${version} role`).toContain('Product Owner');
      expect(actions!.querySelector('[data-user-action="update-profile"]')).withContext(`V${version} actions`).not.toBeNull();
    }
  });

  it('shows the shared Project context switcher in every version, including the graphite V4', () => {
    const element = fixture.nativeElement as HTMLElement;
    const [first] = LAYOUT_DEMO_CONTEXT.items;

    expect(LAYOUT_DEMO_CONTEXT.items.length).toBeGreaterThan(7);
    for (const id of ['1', '2', '3', '4', '4-graphite']) {
      const trigger = contextTriggerOf(showcaseOf(element, id));
      expect(trigger).withContext(`showcase ${id} trigger`).not.toBeNull();
      expect(trigger?.getAttribute('aria-label')).withContext(`showcase ${id} name`).toBe(`${first.title}, Change Project`);
    }
  });

  it('renders the V4 demo menu with sections, an attention badge, a count, a live status and a coming-soon item', () => {
    const v4 = showcaseOf(fixture.nativeElement as HTMLElement, '4');
    const toggle = v4.querySelector<HTMLButtonElement>('[data-v4-toggle]');
    if (toggle?.getAttribute('aria-expanded') === 'false') {
      toggle.click();
      fixture.detectChanges();
    }
    const tree = v4.querySelector<HTMLElement>('[data-v4-tree]');

    expect(Array.from(tree?.querySelectorAll('[data-v4-section-label]') ?? [], label => label.textContent?.trim())).toEqual([
      'Operations',
      'Administration',
    ]);
    expect(tree?.querySelector('[data-v4-trailing="badge"]')?.getAttribute('aria-label')).toBe('3 pending');
    expect(tree?.querySelector('[data-v4-trailing="count"]')?.textContent?.trim()).toBe('9');
    expect(tree?.querySelector('[data-v4-trailing="status"]')?.textContent?.trim()).toBe('1 running');
    expect(tree?.querySelector('[data-v4-status-dot]')?.classList).toContain('sd-sidebar-v4-menu-tree__status-dot--live');
    expect(tree?.querySelector('[data-v4-trailing="soon"]')?.textContent?.trim()).toBe('Soon');
    expect(v4.querySelector<HTMLInputElement>('[data-v4-search-input]')?.placeholder).toBe('Search menu');
    expect(tree?.textContent).not.toContain('core.module.layout.');
  });

  it('shows the V4 mobile app bar, bottom bar destinations and the context switcher in the drawer', () => {
    const v4 = showcaseOf(fixture.nativeElement as HTMLElement, '4');
    v4.querySelector<HTMLButtonElement>('[data-layout-viewport="mobile"]')?.click();
    fixture.detectChanges();

    const mobile = v4.querySelector<HTMLElement>('sd-sidebar-mobile-v4');
    expect(mobile).not.toBeNull();
    expect(mobile?.querySelectorAll('[data-v4m-bottom-bar] [data-v4m-destination]').length).toBe(4);
    expect(mobile?.querySelector('[data-v4m-badge]')?.textContent?.trim()).toBe('3');
    expect(mobile?.querySelector('[data-v4m-live]')).not.toBeNull();
    expect(mobile?.querySelector('[data-v4m-more] [data-v4m-label]')?.textContent?.trim()).toBe('More');

    mobile?.querySelector<HTMLButtonElement>('[data-v4m-menu-trigger]')?.click();
    fixture.detectChanges();

    const drawerTrigger = mobile?.querySelector<HTMLButtonElement>('[data-v4m-drawer] sd-layout-context-switcher [data-context-trigger]');
    expect(drawerTrigger).not.toBeNull();
    expect(drawerTrigger?.getAttribute('aria-label')).toBe(`${LAYOUT_DEMO_CONTEXT.items[0].title}, Change Project`);
  });

  it("lets Core store the first context on a first visit and rebuilds every preview silently, in its own namespace", async () => {
    const element = fixture.nativeElement as HTMLElement;
    const [first] = LAYOUT_DEMO_CONTEXT.items;
    await fixture.whenStable();

    expect(element.querySelector('[data-layout-demo-reload-notice]')).toBeNull();
    expect(element.contains(document.activeElement)).withContext('focus stays where it was').toBeFalse();
    for (const [id, namespace] of Object.entries(PREVIEW_NAMESPACES)) {
      expect(contextTriggerOf(showcaseOf(element, id))?.getAttribute('aria-label')).withContext(id).toBe(`${first.title}, Change Project`);
      expect(previewStorage(namespace).readCurrentContext()?.id).withContext(`${namespace} snapshot`).toBe(first.id);
    }
    expect(previewStorage('').readCurrentContext()).withContext('no snapshot outside the preview namespaces').toBeNull();
  });

  it('restarts only the switching preview with the chosen context instead of reloading the page', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const href = window.location.href;
    const [first, second] = LAYOUT_DEMO_CONTEXT.items;
    const v4 = showcaseOf(element, '4');
    const v1 = showcaseOf(element, '1');

    expect(v4.querySelector('[data-layout-demo-reload-notice]')).toBeNull();
    contextTriggerOf(v4)?.click();
    fixture.detectChanges();
    // why: để focus trap của popover bắt focus khi popover còn mở (không trễ sang lúc preview đã dựng lại).
    await fixture.whenStable();
    const target = popoverRows().find(row => row.querySelector('[data-context-row-title]')?.textContent?.trim() === second.title);
    expect(target).withContext('second context row').toBeDefined();
    target?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(window.location.href).toBe(href);
    expect(v4.querySelector('[data-layout-demo-reload-notice]')?.textContent).toContain('page reload');
    expect(contextTriggerOf(v4)?.getAttribute('aria-label')).toBe(`${second.title}, Change Project`);
    expect(document.activeElement).withContext('focus moves to the rebuilt switcher').toBe(contextTriggerOf(v4));
    expect(previewStorage(PREVIEW_NAMESPACES['4']).readCurrentContext()?.id).toBe(second.id);

    // why: mỗi preview có namespace riêng — preview khác giữ context của nó và không báo "đổi ở tab khác" kể cả khi mount lại switcher.
    expect(previewStorage(PREVIEW_NAMESPACES['4-graphite']).readCurrentContext()?.id).toBe(first.id);
    expect(contextTriggerOf(showcaseOf(element, '4-graphite'))?.getAttribute('aria-label')).toBe(`${first.title}, Change Project`);
    v1.querySelector<HTMLButtonElement>('[data-layout-viewport="mobile"]')?.click();
    fixture.detectChanges();
    v1.querySelector<HTMLButtonElement>('[data-layout-viewport="desktop"]')?.click();
    fixture.detectChanges();
    expect(contextTriggerOf(v1)?.getAttribute('aria-label')).toBe(`${first.title}, Change Project`);
    expect(element.querySelector('[data-context-notice]')).toBeNull();
    expect(v1.querySelector('[data-layout-demo-reload-notice]')).toBeNull();

    // why: preview được dựng lại với service mới — không còn kẹt ở trạng thái "đang chuyển" sau lần reload giả.
    contextTriggerOf(v4)?.click();
    fixture.detectChanges();
    // why: để focus trap của popover bắt focus khi popover còn mở (không trễ sang lúc preview đã dựng lại).
    await fixture.whenStable();
    const rows = popoverRows();
    expect(rows.length).toBe(LAYOUT_DEMO_CONTEXT.items.length);
    expect(rows.some(row => row.disabled)).toBeFalse();
    expect(rows.find(row => row.getAttribute('aria-current') === 'true')?.textContent).toContain(second.title);
    rows.find(row => row.getAttribute('aria-current') === 'true')?.click();
    fixture.detectChanges();

    const dismiss = v4.querySelector<HTMLButtonElement>('[data-layout-demo-reload-notice] button');
    dismiss?.focus();
    expect(document.activeElement).toBe(dismiss);
    dismiss?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(v4.querySelector('[data-layout-demo-reload-notice]')).toBeNull();
    expect(document.activeElement).withContext('focus returns to the switcher after Dismiss').toBe(contextTriggerOf(v4));
  });

  it('scopes the graphite preset to the graphite showcase only', () => {
    // why: TestBed.createComponent gỡ root element của fixture trước — tạo ngoài TestBed để chỉ nạp style, giữ fixture trong DOM.
    const globalStyles = createComponent(ShowcaseGlobalStylesComponent, { environmentInjector: TestBed.inject(EnvironmentInjector) });
    try {
      const element = fixture.nativeElement as HTMLElement;
      const scope = showcaseOf(element, '4-graphite').querySelector<HTMLElement>('.layout-demo__preview--graphite');
      const graphiteSidebar = scope?.querySelector<HTMLElement>('sd-sidebar-v4');
      const defaultSidebar = showcaseOf(element, '4').querySelector<HTMLElement>('sd-sidebar-v4');

      expect(graphiteSidebar).not.toBeNull();
      const graphite = getComputedStyle(graphiteSidebar!);
      expect(graphite.getPropertyValue('--sd-primary').trim()).toBe('#16181d');
      expect(graphite.getPropertyValue('--sd-surface').trim()).toBe('#ffffff');
      expect(graphite.getPropertyValue('--sd-sidebar-v4-active-bg').trim()).toBe('#ffffff');
      expect(graphite.getPropertyValue('--sd-sidebar-v4-active-shadow')).toContain('0 0 0 1px');
      expect(getComputedStyle(defaultSidebar!).getPropertyValue('--sd-primary').trim()).not.toBe('#16181d');
    } finally {
      globalStyles.destroy();
    }
  });
});

for (const [showcase, sectionId] of [
  ['1', 'example-sidebar-v1-classic'],
  ['2', 'example-sidebar-v2-rail'],
  ['3', 'example-sidebar-v3-collapsible'],
  ['4', 'example-sidebar-v4-navigation'],
  ['4-graphite', 'example-sidebar-v4-graphite'],
] as const) {
  describe(`LayoutDemoComponent focused ${showcase} showcase`, () => {
    it('renders the requested version without mounting the other showcases', async () => {
      await TestBed.configureTestingModule({
        imports: [LayoutDemoComponent],
        providers: [provideRouter([]), { provide: SHOWCASE_DEMO_SECTION_ID, useValue: sectionId }],
      }).compileComponents();

      const focusedFixture = TestBed.createComponent(LayoutDemoComponent);
      focusedFixture.detectChanges();
      const element = focusedFixture.nativeElement as HTMLElement;

      expect(element.querySelector(`[data-layout-showcase="${showcase}"]`)).not.toBeNull();
      expect(element.querySelectorAll('[data-layout-showcase]').length).toBe(1);
    });
  });
}
