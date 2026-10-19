import { OverlayContainer } from '@angular/cdk/overlay';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { SD_LAYOUT_CONFIGURATION, SdLayoutContext, SidebarConfigurationV2 } from '../../configurations';
import { SdLayoutContextService, SdLayoutMenu } from '../../services';
import { SdLayoutContextSwitcher } from '../shared/context-switcher/context-switcher.component';
import { SdSidebarMobileV2 } from './main.component';

interface ContextServiceStub {
  current: WritableSignal<SdLayoutContext | null>;
  items: WritableSignal<readonly SdLayoutContext[]>;
  switchingId: WritableSignal<string | null>;
  switchFailed: WritableSignal<boolean>;
  changedElsewhere: WritableSignal<boolean>;
  syncItems: jasmine.Spy;
  setCurrentContext: jasmine.Spy;
  reload: jasmine.Spy;
  getCurrentContext: jasmine.Spy;
}

// why: service thật reload trang qua runtime — spec sidebar chỉ cần state đã đối chiếu (INV-010).
function createContextStub(): ContextServiceStub {
  const stub: ContextServiceStub = {
    current: signal<SdLayoutContext | null>(null),
    items: signal<readonly SdLayoutContext[]>([]),
    switchingId: signal<string | null>(null),
    switchFailed: signal(false),
    changedElsewhere: signal(false),
    syncItems: jasmine.createSpy('syncItems'),
    setCurrentContext: jasmine.createSpy('setCurrentContext'),
    reload: jasmine.createSpy('reload'),
    getCurrentContext: jasmine.createSpy('getCurrentContext'),
  };
  stub.syncItems.and.callFake((items: readonly SdLayoutContext[] | null | undefined) => {
    const list = items ?? [];
    stub.items.set(list);
    if (!stub.current() && list.length) stub.current.set(list[0]);
  });
  stub.getCurrentContext.and.callFake(() => stub.current());
  return stub;
}

const dashboard: SdLayoutMenu = { id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true };
const work: SdLayoutMenu = { id: 'work', title: 'Công việc', children: [dashboard] };
const admin: SdLayoutMenu = {
  id: 'admin',
  title: 'Quản trị',
  children: [{ id: 'users', title: 'Người dùng', path: '/users', permission: true }],
};
const reports: SdLayoutMenu = { id: 'reports', title: 'Báo cáo', children: [{ title: 'Doanh số', path: '/reports', permission: true }] };
const help: SdLayoutMenu = { id: 'help', title: 'Trợ giúp', children: [{ title: 'FAQ', path: '/help', permission: true }] };

describe('SdSidebarMobileV2', () => {
  let fixture: ComponentFixture<SdSidebarMobileV2>;
  let router: Router;
  let signout: jasmine.Spy;

  beforeEach(async () => {
    signout = jasmine.createSpy('signout');
    await TestBed.configureTestingModule({
      imports: [SdSidebarMobileV2],
      providers: [
        provideRouter([]),
        {
          provide: SD_LAYOUT_CONFIGURATION,
          useValue: {
            sidebar: { version: 2 },
            userInfo: { fullName: 'Demo User' },
            signout,
            changePassword: jasmine.createSpy('changePassword'),
            updateProfile: jasmine.createSpy('updateProfile'),
            setting: jasmine.createSpy('setting'),
            notification: { count: 5, action: jasmine.createSpy('notification') },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SdSidebarMobileV2);
    fixture.componentRef.setInput('menus', [dashboard, work, admin, reports, help]);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User', role: { text: 'Operator' } });
    fixture.componentRef.setInput('sidebar', { version: 2, primaryMenuIds: ['admin', 'missing', 'admin'] });
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders the custom-element host as a block so the mobile shell starts inside its preview container', () => {
    expect(getComputedStyle(fixture.nativeElement).display).toBe('block');
  });

  it('normalizes three unique primary groups and keeps the remaining groups under More', () => {
    expect(fixture.componentInstance.primaryMenus().map(menu => menu.id)).toEqual(['admin', 'dashboard', 'work']);
    expect(fixture.componentInstance.overflowMenus().map(menu => menu.id)).toEqual(['reports', 'help']);
  });

  it('shows static mobile identity with a direct sign-out action', () => {
    fixture.componentInstance.openMore();
    fixture.detectChanges();

    const sheet = fixture.nativeElement.querySelector('[data-v2-sheet]') as HTMLElement;
    const accountRow = sheet.querySelector('[data-mobile-account-row]') as HTMLElement;
    expect(accountRow.querySelector('[data-user-summary]')).not.toBeNull();
    expect(accountRow.querySelector('[data-user-role]')?.textContent).toContain('Operator');
    expect(sheet.querySelector('[data-user-trigger]')).toBeNull();
    expect(sheet.querySelector('[data-user-action="update-profile"]')).not.toBeNull();
    expect(sheet.querySelector('[data-notification-badge]')?.textContent).toContain('5');
    expect(accountRow.classList).toContain('sd-layout-user-menu__mobile--inline');
    expect(getComputedStyle(accountRow).flexDirection).toBe('row');

    (sheet.querySelector('[data-user-action="signout"]') as HTMLButtonElement).click();

    expect(signout).toHaveBeenCalledTimes(1);
  });

  it('opens More as a sheet containing only overflow groups', () => {
    fixture.componentInstance.openMore();
    fixture.detectChanges();

    expect(fixture.componentInstance.isSheetOpen()).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-v2-sheet]').textContent).toContain('Báo cáo');
    expect(fixture.nativeElement.querySelector('[data-v2-sheet]').textContent).toContain('Trợ giúp');
  });

  it('opens groups in context but navigates leaf primaries directly', () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.componentInstance.activateMenu(work);
    expect(fixture.componentInstance.sheetGroupKey()).toBe('id:work');

    fixture.componentInstance.activateMenu(dashboard);
    expect(navigate).toHaveBeenCalledWith(['/dashboard'], jasmine.any(Object));
  });

  it('opens an absolute http(s) menu with noopener,noreferrer and never opens a javascript: scheme', () => {
    const windowOpen = spyOn(window, 'open');
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    fixture.componentInstance.onNavigate({ id: 'docs', title: 'Tài liệu', path: 'https://example.com/docs', permission: true });
    expect(windowOpen).toHaveBeenCalledWith('https://example.com/docs', '_blank', 'noopener,noreferrer');
    expect(navigate).not.toHaveBeenCalled();

    windowOpen.calls.reset();
    fixture.componentInstance.onNavigate({
      id: 'evil',
      title: 'Evil',
      path: 'javascript:fetch("//evil.example.com")//http',
      permission: true,
    });
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('closes on Escape, restores focus and releases body scroll', () => {
    const trigger = fixture.nativeElement.querySelector('[data-mobile-menu-key="id:work"]') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.nativeElement.querySelector('[data-v2-sheet]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isSheetOpen()).toBeFalse();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(trigger);
  });

  it('uses the shared search field inside the open sheet', () => {
    fixture.componentInstance.openMore();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'sd-layout-search-field input[data-autoid="forms-input-layout-v2-mobile-search"]'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toBe('Tìm trong menu');
  });

  it('always exposes a compatible pin action inside the mobile sheet', () => {
    fixture.componentInstance.openMore();
    fixture.detectChanges();

    const pin = fixture.nativeElement.querySelector('[data-pin-key]') as HTMLButtonElement;
    expect(pin).not.toBeNull();
    expect(getComputedStyle(pin).opacity).toBe('1');
    expect(pin.querySelector('mat-icon')?.textContent?.trim()).toBe('push_pin');
  });

  // -------------------------------------------------------------------------
  // Context switcher (R-008, D-027): mobile V2 không có drawer — trigger là dòng đầu của sheet menu,
  // sheet chọn context xếp chồng lên sheet menu. Không có `context` thì sheet render như cũ (INV-001).
  // -------------------------------------------------------------------------
  describe('context switcher (R-008, AC-011, AC-018)', () => {
    const contexts: SdLayoutContext[] = [
      { id: 'hq', title: 'Head Office', subtitle: 'Owner' },
      { id: 'north', title: 'North Branch', subtitle: 'Manager' },
    ];
    let context: ContextServiceStub;
    let contextServiceCreations: number;
    let ctxFixture: ComponentFixture<SdSidebarMobileV2>;

    const root = () => ctxFixture.nativeElement as HTMLElement;
    const q = (selector: string) => root().querySelector<HTMLElement>(selector);
    const switchers = () => ctxFixture.debugElement.queryAll(By.directive(SdLayoutContextSwitcher));
    const overlayRoot = () => TestBed.inject(OverlayContainer).getContainerElement();

    async function create(options: { sidebar?: SidebarConfigurationV2; menus?: SdLayoutMenu[] } = {}): Promise<void> {
      TestBed.resetTestingModule();
      context = createContextStub();
      contextServiceCreations = 0;
      await TestBed.configureTestingModule({
        imports: [SdSidebarMobileV2],
        providers: [
          provideRouter([]),
          {
            provide: SdLayoutContextService,
            // why: đếm số lần tạo để chứng minh app không cấu hình `context` không bao giờ tạo service (EXEC-D1).
            useFactory: () => {
              contextServiceCreations++;
              return context;
            },
          },
        ],
      }).compileComponents();
      ctxFixture = TestBed.createComponent(SdSidebarMobileV2);
      ctxFixture.componentRef.setInput('menus', options.menus ?? [dashboard, work, admin, reports, help]);
      ctxFixture.componentRef.setInput('userInfo', { fullName: 'Demo User', role: { text: 'Operator' } });
      ctxFixture.componentRef.setInput('sidebar', options.sidebar ?? { version: 2 });
      ctxFixture.detectChanges();
      await ctxFixture.whenStable();
      ctxFixture.detectChanges();
    }

    async function openMenuSheet(key = 'id:work'): Promise<HTMLButtonElement> {
      const trigger = q(`[data-mobile-menu-key="${key}"]`) as HTMLButtonElement;
      trigger.focus();
      trigger.click();
      ctxFixture.detectChanges();
      await ctxFixture.whenStable();
      ctxFixture.detectChanges();
      return trigger;
    }

    it('renders the sheet switcher as the first row of the menu sheet body, before the inline user menu', async () => {
      await create({ sidebar: { version: 2, context: { items: contexts } } });
      await openMenuSheet();

      const sheet = q('[data-v2-sheet]')!;
      const body = sheet.querySelector<HTMLElement>(':scope > header + div')!;
      const host = switchers()[0].nativeElement as HTMLElement;
      const instance = switchers()[0].componentInstance as SdLayoutContextSwitcher;

      expect(switchers().length).toBe(1);
      expect(instance.appearance()).toBe('sheet');
      expect(body.firstElementChild).toBe(host);
      expect(host.nextElementSibling?.localName).toBe('sd-layout-user-menu');
      expect(context.syncItems).toHaveBeenCalledWith(contexts);

      const trigger = host.querySelector<HTMLElement>('[data-context-trigger]')!.getBoundingClientRect();
      const accountRow = sheet.querySelector<HTMLElement>('[data-mobile-account-row]')!.getBoundingClientRect();
      expect(trigger.height).toBeGreaterThanOrEqual(44);
      expect(trigger.bottom).toBeLessThanOrEqual(accountRow.top);
    });

    // why: switcher chỉ mount khi sheet menu mở — đối chiếu phải chạy từ lúc khởi tạo, nếu không lần chạm đầu
    // vào menu ở lần truy cập đầu sẽ kích reload đối chiếu và listener nhiều tab chưa chạy (EXEC-D1, D-021).
    it('reconciles the configured context on init, before the menu sheet and its switcher first render', async () => {
      await create({ sidebar: { version: 2, context: { items: contexts } } });

      expect(ctxFixture.componentInstance.isSheetOpen()).toBeFalse();
      expect(q('[data-v2-sheet]')).toBeNull();
      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(context.syncItems).toHaveBeenCalledOnceWith(contexts);
      expect(contextServiceCreations).toBe(1);
    });

    it('forwards changed context items to the context service while the menu sheet stays closed', async () => {
      await create({ sidebar: { version: 2, context: { items: contexts } } });
      const next: SdLayoutContext[] = [...contexts, { id: 'south', title: 'South Branch' }];

      ctxFixture.componentRef.setInput('sidebar', { version: 2, context: { items: next } });
      ctxFixture.detectChanges();

      expect(context.syncItems.calls.allArgs()).toEqual([[contexts], [next]]);
      expect(contextServiceCreations).toBe(1);
    });

    it('never creates the context service without context, even after the menu sheet opens', async () => {
      await create();
      await openMenuSheet();

      expect(ctxFixture.componentInstance.isSheetOpen()).toBeTrue();
      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(context.syncItems).not.toHaveBeenCalled();
      expect(contextServiceCreations).toBe(0);
    });

    it('stacks the context sheet above the modal menu sheet and keeps Escape from closing the menu sheet (D-027)', async () => {
      await create({ sidebar: { version: 2, context: { items: contexts } } });
      await openMenuSheet();
      const menuSheet = q('[data-v2-sheet]')!;
      const trigger = q('[data-context-trigger]')!;

      trigger.focus();
      trigger.click();
      ctxFixture.detectChanges();
      await ctxFixture.whenStable();

      const contextSheet = overlayRoot().querySelector<HTMLElement>('[data-context-sheet]');
      expect(contextSheet).withContext('context sheet rendered').not.toBeNull();
      expect(menuSheet.contains(contextSheet)).toBeFalse();
      expect(menuSheet.getAttribute('aria-modal')).toBe('true');
      const rect = contextSheet!.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      expect(contextSheet!.contains(hit)).withContext('context sheet is hit-tested above the menu sheet').toBeTrue();

      const sheetKeydown = spyOn(ctxFixture.componentInstance, 'onSheetKeydown').and.callThrough();
      contextSheet!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      ctxFixture.detectChanges();

      expect(sheetKeydown).not.toHaveBeenCalled();
      expect(overlayRoot().querySelector('[data-context-sheet]')).toBeNull();
      expect(ctxFixture.componentInstance.isSheetOpen()).toBeTrue();
      expect(q('[data-v2-sheet]')).toBe(menuSheet);
      expect(document.activeElement).toBe(trigger);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('takes no sheet row for a context without items', async () => {
      await create({ sidebar: { version: 2, context: { items: [] } } });
      await openMenuSheet();
      const host = switchers()[0].nativeElement as HTMLElement;

      expect(host.childElementCount).toBe(0);
      expect(getComputedStyle(host).display).toBe('none');
    });

    it('renders the bar and menu sheet as before without context, even for menus with V4-only fields (AC-011, INV-001)', async () => {
      const v4Fields = {
        section: 'Workspace',
        badge: { value: 'NEW-7', tone: 'warning' as const },
        status: { label: 'Connected', tone: 'success' as const, live: true },
      };
      const soon: SdLayoutMenu = { id: 'soon', title: 'Soon', path: '/soon', permission: true, comingSoon: true, ...v4Fields };
      const v4Group: SdLayoutMenu = { id: 'v4-group', title: 'Group', comingSoon: true, ...v4Fields, children: [soon] };
      await create({ menus: [v4Group, work, admin] });
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      const groupTrigger = await openMenuSheet('id:v4-group');
      expect(groupTrigger.hasAttribute('aria-disabled')).toBeFalse();

      const sheet = q('[data-v2-sheet]')!;
      const body = sheet.querySelector<HTMLElement>(':scope > header + div')!;
      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(Array.from(body.children).map(child => child.localName)).toEqual([
        'sd-layout-user-menu',
        'sd-layout-search-field',
        'sd-layout-menu-tree',
      ]);
      expect(context.syncItems).not.toHaveBeenCalled();
      expect(contextServiceCreations).toBe(0);
      expect(
        root().querySelector(
          ':is(.sd-sidebar-mobile-v2__bar, [data-v2-sheet] sd-layout-menu-tree) :is([class*="badge"], [class*="status"], [class*="section"])'
        )
      ).toBeNull();
      expect(root().textContent).not.toContain('Workspace');
      expect(root().textContent).not.toContain('NEW-7');
      expect(root().textContent).not.toContain('Connected');

      // comingSoon không có nghĩa gì ở mobile V2 (D-005): mục vẫn điều hướng như cũ.
      const soonButton = sheet.querySelector<HTMLElement>('[data-menu-key="id:soon"]')!;
      expect(soonButton.hasAttribute('aria-disabled')).toBeFalse();
      soonButton.click();
      expect(navigate).toHaveBeenCalledWith(['/soon'], { queryParams: {}, state: { switchTab: true } });
    });
  });
});
