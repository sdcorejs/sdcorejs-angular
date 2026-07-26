import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SD_LAYOUT_CONFIGURATION } from '../../../../configurations';
import { LayoutUserComponent } from './user.component';

describe('sidebar V1 LayoutUserComponent', () => {
  let fixture: ComponentFixture<LayoutUserComponent>;
  let signout: jasmine.Spy;

  beforeEach(async () => {
    signout = jasmine.createSpy('signout');
    const translations: Record<string, string> = {
      'core.module.layout.user.update-profile': 'Update profile',
      'core.module.layout.user.setting': 'Settings',
      'core.module.layout.user.notification': 'Notifications',
      'core.module.layout.user.change-password': 'Change password',
      'core.module.layout.user.logout': 'Sign out',
      'core.module.layout.sidebar.toggle': 'Toggle sidebar',
    };
    await TestBed.configureTestingModule({
      imports: [LayoutUserComponent],
      providers: [
        { provide: I18nService, useValue: { t: (key: string) => translations[key] ?? key } },
        {
          provide: SD_LAYOUT_CONFIGURATION,
          useValue: {
            sidebar: { version: 1 },
            userInfo: {},
            signout,
            updateProfile: () => undefined,
            setting: () => undefined,
            notification: { count: 3, action: () => undefined },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutUserComponent);
    fixture.componentRef.setInput('userInfo', {
      fullName: 'Demo User',
      email: 'demo@example.com',
      role: { text: 'Administrator', icon: 'badge', color: '#005cbb' },
    });
    fixture.detectChanges();
  });

  it('uses the shared disclosure with horizontal identity and a red icon sign-out action', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('sd-layout-user-menu')).not.toBeNull();
    expect(element.querySelector('mat-menu')).toBeNull();

    element.querySelector<HTMLButtonElement>('[data-user-trigger]')?.click();
    fixture.detectChanges();

    const identity = element.querySelector('[data-user-identity]');
    const signoutButton = element.querySelector<HTMLButtonElement>('[data-user-action="signout"]');
    expect(identity?.querySelector('sd-avatar')).not.toBeNull();
    expect(identity?.textContent).toContain('Demo User');
    expect(identity?.textContent).toContain('demo@example.com');
    expect(identity?.textContent).toContain('Administrator');
    expect(signoutButton?.classList).toContain('text-error');
    expect(signoutButton?.querySelector('sd-icon')).not.toBeNull();
    expect(signoutButton?.textContent).toContain('Sign out');
    expect(element.textContent).not.toContain('core.module.layout.user.logout');
  });

  it('forwards shared menu lifecycle events and preserves the rail toggle output', () => {
    const opened = jasmine.createSpy('opened');
    const closed = jasmine.createSpy('closed');
    const toggle = jasmine.createSpy('toggle');
    fixture.componentInstance.menuOpened.subscribe(opened);
    fixture.componentInstance.menuClosed.subscribe(closed);
    fixture.componentInstance.toggleMenuLock.subscribe(toggle);

    fixture.nativeElement.querySelector('[data-user-trigger]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-user-action="signout"]').click();
    const toggleButton = fixture.nativeElement.querySelector('.c-layout-icon-toggle') as HTMLButtonElement;
    toggleButton.click();

    expect(opened).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(signout).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(toggleButton.getAttribute('aria-label')).toBe('Toggle sidebar');
  });
});
