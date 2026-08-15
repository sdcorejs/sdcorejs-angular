import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SHOWCASE_DEMO_SECTION_ID } from '../../../shared/demo-page.component';
import { LAYOUT_DEMO_NOTIFICATION_COUNT, LayoutDemoComponent } from './layout-demo.component';

describe('LayoutDemoComponent', () => {
  let fixture: ComponentFixture<LayoutDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutDemoComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutDemoComponent);
    fixture.detectChanges();
  });

  it('renders V1, V2 and V3 as independent showcases', () => {
    const element = fixture.nativeElement as HTMLElement;

    for (const version of [1, 2, 3]) {
      const showcase = element.querySelector<HTMLElement>(`[data-layout-showcase="${version}"]`);
      expect(showcase).withContext(`showcase V${version}`).not.toBeNull();
      expect(showcase?.querySelector(`[data-active-layout-version="${version}"]`)).not.toBeNull();
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

  it('renders all six desktop and mobile sidebar variants without runtime errors', () => {
    const element = fixture.nativeElement as HTMLElement;
    const variants = [
      [1, 'desktop', 'sd-sidebar-v1'],
      [1, 'mobile', 'sd-sidebar-mobile-v1'],
      [2, 'desktop', 'sd-sidebar-v2'],
      [2, 'mobile', 'sd-sidebar-mobile-v2'],
      [3, 'desktop', 'sd-sidebar-v3'],
      [3, 'mobile', 'sd-sidebar-mobile-v3'],
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
    expect(v1Showcase?.querySelector<HTMLInputElement>('input[data-autoid="forms-input-layout-v1-menu-search"]')?.placeholder).toBe(
      'Search menu'
    );
  });

  it('keeps the V1 desktop account avatar inside the live preview', () => {
    const element = fixture.nativeElement as HTMLElement;
    const v1Preview = element.querySelector<HTMLElement>('[data-layout-showcase="1"] [data-active-layout-version="1"]');
    const avatar = v1Preview?.querySelector<HTMLElement>('.c-layout-user-avatar');

    expect(avatar).not.toBeNull();
    expect(v1Preview?.classList).toContain('layout-demo__preview--contain-v1');
    expect(avatar?.getBoundingClientRect().bottom).toBeLessThanOrEqual(v1Preview?.getBoundingClientRect().bottom ?? 0);
  });

  it('demonstrates role, optional account actions and reactive notification badges in every desktop version', () => {
    const element = fixture.nativeElement as HTMLElement;
    LAYOUT_DEMO_NOTIFICATION_COUNT.set(12);
    fixture.detectChanges();

    for (const version of [1, 2, 3]) {
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
        showcase?.querySelector<HTMLButtonElement>('button[aria-label="Thêm menu"]')?.click();
        fixture.detectChanges();
      }
      if (version === 3) {
        showcase?.querySelector<HTMLButtonElement>('[data-v3-mobile-trigger]')?.click();
        fixture.detectChanges();
      }

      const row = showcase?.querySelector('[data-mobile-account-row]');
      const actions = showcase?.querySelector('[data-mobile-account-actions]');
      expect(row?.querySelector('[data-user-summary]')).withContext(`V${version} profile`).not.toBeNull();
      expect(row?.querySelector('[data-user-action="signout"]')).withContext(`V${version} signout`).not.toBeNull();
      expect(row?.querySelector('[data-user-role]')?.textContent).withContext(`V${version} role`).toContain('Product Owner');
      expect(actions?.querySelector('[data-user-action="update-profile"]')).withContext(`V${version} actions`).not.toBeNull();
    }
  });
});

for (const [version, sectionId] of [
  [1, 'example-sidebar-v1-classic'],
  [2, 'example-sidebar-v2-rail'],
  [3, 'example-sidebar-v3-collapsible'],
] as const) {
  describe(`LayoutDemoComponent focused V${version} showcase`, () => {
    it('renders the requested version without mounting the other showcases', async () => {
      await TestBed.configureTestingModule({
        imports: [LayoutDemoComponent],
        providers: [provideRouter([]), { provide: SHOWCASE_DEMO_SECTION_ID, useValue: sectionId }],
      }).compileComponents();

      const focusedFixture = TestBed.createComponent(LayoutDemoComponent);
      focusedFixture.detectChanges();
      const element = focusedFixture.nativeElement as HTMLElement;

      expect(element.querySelector(`[data-layout-showcase="${version}"]`)).not.toBeNull();
      expect(element.querySelectorAll('[data-layout-showcase]').length).toBe(1);
    });
  });
}
