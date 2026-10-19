import { OverlayContainer } from '@angular/cdk/overlay';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { SdLayoutContext, SdLayoutContextConfiguration } from '../../configurations';
import { SdLayoutContextService, SdLayoutMenu } from '../../services';
import { SdLayoutContextSwitcher } from '../shared/context-switcher/context-switcher.component';
import { SdSidebarV2 } from './main.component';

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

const work: SdLayoutMenu = {
  id: 'work',
  title: 'Công việc',
  children: [{ id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true }],
};
const admin: SdLayoutMenu = {
  id: 'admin',
  title: 'Quản trị',
  children: [{ id: 'users', title: 'Người dùng', path: '/users', permission: true }],
};

describe('SdSidebarV2', () => {
  let fixture: ComponentFixture<SdSidebarV2>;

  async function create(interaction: 'click' | 'hover-lock' = 'click'): Promise<void> {
    await TestBed.configureTestingModule({ imports: [SdSidebarV2], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(SdSidebarV2);
    fixture.componentRef.setInput('menus', [work, admin]);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User' });
    fixture.componentRef.setInput('sidebar', { version: 2, interaction });
    fixture.detectChanges();
  }

  it('toggles and switches flyout groups in click mode', async () => {
    await create('click');
    fixture.componentInstance.selectGroup(work);
    expect(fixture.componentInstance.activeGroupKey()).toBe('id:work');
    expect(fixture.componentInstance.isFlyoutOpen()).toBeTrue();

    fixture.componentInstance.selectGroup(admin);
    expect(fixture.componentInstance.activeGroupKey()).toBe('id:admin');
    fixture.componentInstance.selectGroup(admin);
    expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();
  });

  it('previews on hover and preserves a clicked hover-lock flyout', async () => {
    await create('hover-lock');
    fixture.componentInstance.previewGroup(work);
    expect(fixture.componentInstance.isFlyoutOpen()).toBeTrue();
    fixture.componentInstance.leaveFlyout();
    expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();

    fixture.componentInstance.previewGroup(work);
    fixture.componentInstance.selectGroup(work);
    fixture.componentInstance.leaveFlyout();
    expect(fixture.componentInstance.isFlyoutLocked()).toBeTrue();
    expect(fixture.componentInstance.isFlyoutOpen()).toBeTrue();
  });

  it('closes unlocked state through backdrop, Escape and navigation', async () => {
    await create('click');
    for (const close of [
      () => fixture.componentInstance.closeFromBackdrop(),
      () => fixture.componentInstance.closeFromEscape(),
      () => fixture.componentInstance.closeFromNavigation(),
    ]) {
      fixture.componentInstance.selectGroup(work);
      close();
      expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();
      expect(fixture.componentInstance.isFlyoutLocked()).toBeFalse();
    }
  });

  it('keeps the projected-content offset fixed while the flyout changes', async () => {
    await create('click');
    const content = fixture.nativeElement.querySelector('[data-v2-content]');
    expect(content.getAttribute('data-content-offset')).toBe('rail');
    fixture.componentInstance.selectGroup(work);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-v2-content]').getAttribute('data-content-offset')).toBe('rail');
  });

  it('closes on Escape while focus remains on the rail trigger', async () => {
    await create('click');
    const trigger = fixture.nativeElement.querySelector('[data-v2-group-key="id:work"]') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();
  });

  it('centers the compact account avatar without a disclosure icon', async () => {
    await create('click');

    const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    expect(trigger.classList).toContain('sd-layout-user-menu__trigger--compact');
    expect(trigger.querySelector('sd-avatar')).not.toBeNull();
    expect(trigger.querySelector('sd-icon')).toBeNull();
  });

  it('opens an absolute http(s) menu with noopener,noreferrer and never opens a javascript: scheme', async () => {
    await create('click');
    const windowOpen = spyOn(window, 'open');
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

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

  // -------------------------------------------------------------------------
  // Context switcher (R-008, D-010): avatar context ngay dưới nút brand trên rail, popover mở sang phải
  // từ mép rail. Không có `context` thì rail và flyout render như cũ (INV-001).
  // -------------------------------------------------------------------------
  describe('context switcher (R-008, AC-011, AC-018)', () => {
    const contexts: SdLayoutContext[] = [
      { id: 'hq', title: 'Head Office', subtitle: 'Owner' },
      { id: 'north', title: 'North Branch', subtitle: 'Manager' },
    ];
    let context: ContextServiceStub;

    const root = () => fixture.nativeElement as HTMLElement;
    const q = (selector: string) => root().querySelector<HTMLElement>(selector);
    const switchers = () => fixture.debugElement.queryAll(By.directive(SdLayoutContextSwitcher));
    const switcher = () => switchers()[0]?.componentInstance as SdLayoutContextSwitcher;
    const overlayRoot = () => TestBed.inject(OverlayContainer).getContainerElement();

    async function createWithContext(
      options: { interaction?: 'click' | 'hover-lock'; context?: SdLayoutContextConfiguration; menus?: SdLayoutMenu[] } = {}
    ): Promise<void> {
      context = createContextStub();
      await TestBed.configureTestingModule({
        imports: [SdSidebarV2],
        providers: [provideRouter([]), { provide: SdLayoutContextService, useValue: context }],
      }).compileComponents();
      fixture = TestBed.createComponent(SdSidebarV2);
      fixture.componentRef.setInput('menus', options.menus ?? [work, admin]);
      fixture.componentRef.setInput('userInfo', { fullName: 'Demo User' });
      fixture.componentRef.setInput('sidebar', {
        version: 2,
        interaction: options.interaction ?? 'click',
        ...(options.context ? { context: options.context } : {}),
      });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    async function openSwitcher(): Promise<void> {
      q('[data-context-trigger]')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('renders the rail switcher directly below the brand button, anchored to the rail, and opens its popover to the right', async () => {
      await createWithContext({ context: { items: contexts } });
      const rail = q('.sd-sidebar-v2__rail')!;
      const brand = q('.sd-sidebar-v2__brand')!;
      const host = switchers()[0].nativeElement as HTMLElement;

      expect(switchers().length).toBe(1);
      expect(switcher().appearance()).toBe('rail');
      expect(switcher().anchor()).toBe(rail);
      expect(rail.localName).toBe('aside');
      expect(host.parentElement).toBe(rail);
      expect(brand.nextElementSibling).toBe(host);
      expect(context.syncItems).toHaveBeenCalledWith(contexts);

      const railRect = rail.getBoundingClientRect();
      const triggerRect = q('[data-context-trigger]')!.getBoundingClientRect();
      expect(triggerRect.top).toBeGreaterThanOrEqual(brand.getBoundingClientRect().bottom);
      expect(triggerRect.bottom).toBeLessThanOrEqual(rail.querySelector('nav')!.getBoundingClientRect().top);
      expect(triggerRect.left + triggerRect.width / 2).toBeCloseTo(railRect.left + railRect.width / 2, 0);

      await openSwitcher();

      const popover = overlayRoot().querySelector<HTMLElement>('[data-context-popover]')!;
      expect(switcher().isOpen()).toBeTrue();
      expect(popover.getBoundingClientRect().left).toBeCloseTo(railRect.right + 8, 0);
      expect(popover.getBoundingClientRect().top).toBeCloseTo(triggerRect.top, 0);
    });

    it('never previews or opens the hover-lock flyout when the rail switcher is hovered, focused or opened', async () => {
      await createWithContext({ interaction: 'hover-lock', context: { items: contexts } });
      const trigger = q('[data-context-trigger]')!;

      trigger.dispatchEvent(new MouseEvent('mouseenter'));
      trigger.focus();
      await openSwitcher();

      expect(switcher().isOpen()).toBeTrue();
      expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();
      expect(q('.sd-sidebar-v2__flyout')).toBeNull();

      switcher().close();
      fixture.detectChanges();

      expect(document.activeElement).toBe(trigger);
      expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();
      expect(q('.sd-sidebar-v2__flyout')).toBeNull();
    });

    for (const interaction of ['click', 'hover-lock'] as const) {
      it(`keeps Escape inside the rail popover from closing the open ${interaction} flyout`, async () => {
        await createWithContext({ interaction, context: { items: contexts } });
        fixture.componentInstance.selectGroup(work);
        fixture.detectChanges();
        const locked = fixture.componentInstance.isFlyoutLocked();

        await openSwitcher();
        const popover = overlayRoot().querySelector<HTMLElement>('[data-context-popover]');
        expect(popover).withContext('popover rendered').not.toBeNull();
        const closeFromEscape = spyOn(fixture.componentInstance, 'closeFromEscape').and.callThrough();
        const row = popover!.querySelector<HTMLElement>('[data-context-row]')!;
        row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        fixture.detectChanges();

        expect(closeFromEscape).not.toHaveBeenCalled();
        expect(switcher().isOpen()).toBeFalse();
        expect(fixture.componentInstance.isFlyoutOpen()).toBeTrue();
        expect(fixture.componentInstance.isFlyoutLocked()).toBe(locked);
        expect(q('.sd-sidebar-v2__flyout')).not.toBeNull();

        // Đối chứng: cùng phím Esc phát từ trigger (trong host) vẫn tới handler của host và đóng flyout như cũ.
        q('[data-context-trigger]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        fixture.detectChanges();

        expect(closeFromEscape).toHaveBeenCalledTimes(1);
        expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();
      });
    }

    it('takes no rail space for a context without items', async () => {
      await createWithContext({ context: { items: [] } });
      const host = switchers()[0].nativeElement as HTMLElement;

      expect(switchers().length).toBe(1);
      expect(host.childElementCount).toBe(0);
      expect(getComputedStyle(host).display).toBe('none');
    });

    it('renders the rail and flyout as before without context, even for menus with V4-only fields (AC-011, INV-001)', async () => {
      const v4Fields = {
        section: 'Workspace',
        badge: { value: 'NEW-7', tone: 'warning' as const },
        status: { label: 'Connected', tone: 'success' as const, live: true },
      };
      const soon: SdLayoutMenu = { id: 'soon', title: 'Soon', path: '/soon', permission: true, comingSoon: true, ...v4Fields };
      const v4Group: SdLayoutMenu = { id: 'v4-group', title: 'Group', comingSoon: true, ...v4Fields, children: [soon] };
      await createWithContext({ menus: [v4Group, work] });
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      const rail = q('.sd-sidebar-v2__rail')!;
      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(Array.from(rail.children).map(child => child.localName)).toEqual(['button', 'nav', 'sd-layout-user-menu']);
      expect(rail.firstElementChild!.classList).toContain('sd-sidebar-v2__brand');

      const groupTrigger = q('[data-v2-group-key="id:v4-group"]')!;
      expect(groupTrigger.hasAttribute('aria-disabled')).toBeFalse();
      groupTrigger.click();
      fixture.detectChanges();

      expect(context.syncItems).not.toHaveBeenCalled();
      expect(
        root().querySelector(
          ':is(.sd-sidebar-v2__rail nav, .sd-sidebar-v2__flyout) :is([class*="badge"], [class*="status"], [class*="section"])'
        )
      ).toBeNull();
      expect(root().textContent).not.toContain('Workspace');
      expect(root().textContent).not.toContain('NEW-7');
      expect(root().textContent).not.toContain('Connected');

      // comingSoon không có nghĩa gì ở V2 (D-005): mục vẫn điều hướng như cũ.
      const soonButton = q('.sd-sidebar-v2__flyout [data-menu-key="id:soon"]')!;
      expect(soonButton.hasAttribute('aria-disabled')).toBeFalse();
      soonButton.click();
      expect(navigate).toHaveBeenCalledWith(['/soon'], { queryParams: {}, state: { switchTab: true } });
    });
  });
});
