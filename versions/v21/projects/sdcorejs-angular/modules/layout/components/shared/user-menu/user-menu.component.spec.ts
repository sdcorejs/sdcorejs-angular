import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { BehaviorSubject } from 'rxjs';
import { SdLayoutUserMenuComponent } from './user-menu.component';

describe('SdLayoutUserMenuComponent', () => {
  let fixture: ComponentFixture<SdLayoutUserMenuComponent>;
  let utilityStyles: HTMLStyleElement;

  beforeEach(async () => {
    // The library test target omits consumer global styles; load the Core utility declarations under test.
    utilityStyles = document.createElement('style');
    utilityStyles.textContent =
      '.w-full { width: 100% !important; } .w-56 { width: 56px !important; } .gap-8 { gap: 8px !important; } .gap-0 { gap: 0 !important; }';
    document.head.appendChild(utilityStyles);
    const translations: Record<string, string> = {
      'core.module.layout.user.update-profile': 'Update profile',
      'core.module.layout.user.setting': 'Settings',
      'core.module.layout.user.notification': 'Notifications',
      'core.module.layout.user.change-password': 'Change password',
      'core.module.layout.user.logout': 'Sign out',
    };
    await TestBed.configureTestingModule({
      imports: [SdLayoutUserMenuComponent],
      providers: [{ provide: I18nService, useValue: { t: (key: string) => translations[key] ?? key } }],
    }).compileComponents();
    fixture = TestBed.createComponent(SdLayoutUserMenuComponent);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User', email: 'demo@example.com' });
    fixture.detectChanges();
  });

  afterEach(() => utilityStyles.remove());

  it('renders the shared user identity and avatar trigger', () => {
    const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    expect(trigger.getAttribute('aria-label')).toBeNull();
    expect(trigger.textContent).toContain('Demo User');
    expect(fixture.nativeElement.textContent).toContain('Demo User');
    expect(fixture.nativeElement.textContent).toContain('demo@example.com');
  });

  it('renders a non-empty role with its optional icon and color, then hides an empty role', () => {
    fixture.componentRef.setInput('userInfo', {
      fullName: 'Demo User',
      email: 'demo@example.com',
      role: { text: 'Administrator', icon: 'badge', color: '#005cbb' },
    });
    fixture.componentInstance.open();
    fixture.detectChanges();

    const role = fixture.nativeElement.querySelector('[data-user-role]') as HTMLElement;
    expect(role.textContent).toContain('Administrator');
    expect(role.querySelector('sd-icon')).not.toBeNull();
    expect(role.style.color).toBe('rgb(0, 92, 187)');

    fixture.componentRef.setInput('userInfo', {
      fullName: 'Demo User',
      role: { text: '   ', icon: 'badge', color: '#005cbb' },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-user-role]')).toBeNull();
  });

  it('renders configured account actions in the agreed order and invokes each callback once', () => {
    const updateProfile = jasmine.createSpy('updateProfile');
    const setting = jasmine.createSpy('setting');
    const notification = jasmine.createSpy('notification');
    const changePassword = jasmine.createSpy('changePassword');
    const signout = jasmine.createSpy('signout');
    fixture.componentRef.setInput('updateProfile', updateProfile);
    fixture.componentRef.setInput('setting', setting);
    fixture.componentRef.setInput('notification', { count: 4, action: notification });
    fixture.componentRef.setInput('changePassword', changePassword);
    fixture.componentRef.setInput('signout', signout);
    fixture.componentInstance.open();
    fixture.detectChanges();

    const actionNames = [...fixture.nativeElement.querySelectorAll('[data-user-action]')].map((element: Element) =>
      element.getAttribute('data-user-action')
    );
    expect(actionNames).toEqual(['update-profile', 'setting', 'notification', 'change-password', 'signout']);

    for (const actionName of actionNames) {
      fixture.componentInstance.open();
      fixture.detectChanges();
      fixture.nativeElement.querySelector(`[data-user-action="${actionName}"]`).click();
    }

    expect(updateProfile).toHaveBeenCalledTimes(1);
    expect(setting).toHaveBeenCalledTimes(1);
    expect(notification).toHaveBeenCalledTimes(1);
    expect(changePassword).toHaveBeenCalledTimes(1);
    expect(signout).toHaveBeenCalledTimes(1);
  });

  it('normalizes and reacts to Signal notification counts while keeping the zero-count action visible', () => {
    const count = signal(0);
    fixture.componentRef.setInput('notification', { count, action: () => undefined });
    fixture.componentInstance.open();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-user-action="notification"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-notification-badge]')).toBeNull();

    count.set(120.8);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-notification-badge]').textContent.trim()).toBe('99+');

    count.set(-3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-notification-badge]')).toBeNull();
  });

  it('subscribes once to an Observable notification count and releases it on destroy', () => {
    const count = new BehaviorSubject(7.9);
    fixture.componentRef.setInput('notification', { count, action: () => undefined });
    fixture.componentInstance.open();
    fixture.detectChanges();

    expect(count.observed).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-notification-badge]').textContent.trim()).toBe('7');

    fixture.detectChanges();
    expect(count.observers.length).toBe(1);

    count.next(Number.NaN);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-notification-badge]')).toBeNull();

    fixture.destroy();
    expect(count.observed).toBeFalse();
  });

  it('invokes the supplied change-password and sign-out actions', () => {
    const changePassword = jasmine.createSpy('changePassword');
    const signout = jasmine.createSpy('signout');
    fixture.componentRef.setInput('changePassword', changePassword);
    fixture.componentRef.setInput('signout', signout);
    fixture.componentInstance.open();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-user-action="change-password"]').click();
    fixture.componentInstance.open();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-user-action="signout"]').click();

    expect(changePassword).toHaveBeenCalledTimes(1);
    expect(signout).toHaveBeenCalledTimes(1);
  });

  it('omits change password when no action is available', () => {
    fixture.componentRef.setInput('signout', () => undefined);
    fixture.componentInstance.open();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-user-action="change-password"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-user-action="signout"]')).not.toBeNull();
  });

  it('closes on Escape and restores focus to its trigger', () => {
    const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBeTrue();

    fixture.nativeElement.querySelector('[data-user-menu]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBeFalse();
    expect(document.activeElement).toBe(trigger);
  });

  it('moves focus into the menu and handles Escape from the document', () => {
    fixture.componentRef.setInput('signout', () => undefined);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const firstAction = fixture.nativeElement.querySelector('[role="menuitem"]') as HTMLButtonElement;
    expect(document.activeElement).toBe(firstAction);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBeFalse();
    expect(document.activeElement).toBe(trigger);
  });

  it('moves keyboard focus through the complete account action list', () => {
    fixture.componentRef.setInput('updateProfile', () => undefined);
    fixture.componentRef.setInput('setting', () => undefined);
    fixture.componentRef.setInput('notification', { count: 1, action: () => undefined });
    fixture.componentRef.setInput('changePassword', () => undefined);
    fixture.componentRef.setInput('signout', () => undefined);
    fixture.componentInstance.open();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector('[data-user-menu]') as HTMLElement;
    const actions = [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    expect(document.activeElement).toBe(actions[0]);

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(actions[actions.length - 1]);

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(actions[0]);

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(actions[0]);
  });

  it('closes without stealing focus when the user clicks outside', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    fixture.nativeElement.querySelector('[data-user-trigger]').click();
    fixture.detectChanges();

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBeFalse();
    outside.remove();
  });

  it('centers only the avatar and omits the disclosure icon in compact mode', () => {
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    expect(trigger.classList).toContain('sd-layout-user-menu__trigger--compact');
    expect(trigger.querySelector('sd-avatar')).not.toBeNull();
    expect(trigger.querySelector('sd-icon')).toBeNull();
    expect(trigger.textContent).not.toContain('Demo User');
    expect(trigger.getAttribute('aria-label')).toBe('Demo User');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(getComputedStyle(trigger).width).toBe('56px');
    expect(getComputedStyle(trigger).gap).toBe('0px');
    expect(getComputedStyle(trigger).minHeight).toBe('52px');
  });

  it('renders mobile identity as static content with a direct sign-out action', () => {
    const signout = jasmine.createSpy('signout');
    fixture.componentRef.setInput('presentation', 'mobile');
    fixture.componentRef.setInput('changePassword', jasmine.createSpy('changePassword'));
    fixture.componentRef.setInput('signout', signout);
    fixture.detectChanges();

    const summary = fixture.nativeElement.querySelector('[data-user-summary]') as HTMLElement;
    const signoutButton = fixture.nativeElement.querySelector('[data-user-action="signout"]') as HTMLButtonElement;

    expect(summary).not.toBeNull();
    expect(summary.textContent).toContain('Demo User');
    expect(summary.textContent).toContain('demo@example.com');
    expect(fixture.nativeElement.querySelector('[data-user-trigger]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-user-menu]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-user-action="change-password"]')).not.toBeNull();

    signoutButton.click();

    expect(signout).toHaveBeenCalledTimes(1);
  });

  it('renders the V3 mobile sign-out action in the same row as the profile', () => {
    fixture.componentRef.setInput('presentation', 'mobile-inline');
    fixture.componentRef.setInput('signout', () => undefined);
    fixture.detectChanges();

    const accountRow = fixture.nativeElement.querySelector('[data-mobile-account-row]') as HTMLElement;
    expect(accountRow).not.toBeNull();
    expect(accountRow.querySelector('[data-user-summary]')).not.toBeNull();
    expect(accountRow.querySelector('[data-user-action="signout"]')).not.toBeNull();
    expect(getComputedStyle(accountRow).flexDirection).toBe('row');
  });

  it('keeps both mobile presentations inline and places optional actions below the identity row', () => {
    fixture.componentRef.setInput('presentation', 'mobile');
    fixture.componentRef.setInput('updateProfile', () => undefined);
    fixture.componentRef.setInput('setting', () => undefined);
    fixture.componentRef.setInput('notification', { count: 2, action: () => undefined });
    fixture.componentRef.setInput('changePassword', () => undefined);
    fixture.componentRef.setInput('signout', () => undefined);
    fixture.detectChanges();

    const accountRow = fixture.nativeElement.querySelector('[data-mobile-account-row]') as HTMLElement;
    const actions = fixture.nativeElement.querySelector('[data-mobile-account-actions]') as HTMLElement;
    expect(getComputedStyle(accountRow).flexDirection).toBe('row');
    expect(accountRow.querySelector('[data-user-summary]')).not.toBeNull();
    expect(accountRow.querySelector('[data-user-action="signout"]')).not.toBeNull();
    expect(actions).not.toBeNull();
    expect([...actions.querySelectorAll('[data-user-action]')].map(element => element.getAttribute('data-user-action'))).toEqual([
      'update-profile',
      'setting',
      'notification',
      'change-password',
    ]);
  });
});
