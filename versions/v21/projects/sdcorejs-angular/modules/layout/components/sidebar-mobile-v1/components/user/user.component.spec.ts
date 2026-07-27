import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SD_LAYOUT_CONFIGURATION } from '../../../../configurations';
import { LayoutUserComponent } from './user.component';

describe('mobile sidebar V1 LayoutUserComponent', () => {
  let fixture: ComponentFixture<LayoutUserComponent>;

  beforeEach(async () => {
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
            signout: () => undefined,
            changePassword: () => undefined,
            updateProfile: () => undefined,
            setting: () => undefined,
            notification: { count: 8, action: () => undefined },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutUserComponent);
    fixture.componentRef.setInput('isMobileOrTablet', true);
    fixture.componentRef.setInput('userInfo', {
      fullName: 'Demo User',
      email: 'demo@example.com',
      role: { text: 'Operator' },
    });
    fixture.detectChanges();
  });

  it('uses the shared mobile account row with direct sign-out and optional actions below', () => {
    const element = fixture.nativeElement as HTMLElement;
    const row = element.querySelector('[data-mobile-account-row]');
    const actions = element.querySelector('[data-mobile-account-actions]');

    expect(element.querySelector('sd-layout-user-menu')).not.toBeNull();
    expect(element.querySelector('.m-user-card')).toBeNull();
    expect(row?.querySelector('[data-user-summary]')).not.toBeNull();
    expect(row?.querySelector('[data-user-action="signout"]')).not.toBeNull();
    expect(actions?.querySelector('[data-user-action="update-profile"]')).not.toBeNull();
    expect(actions?.querySelector('[data-user-action="setting"]')).not.toBeNull();
    expect(actions?.querySelector('[data-user-action="notification"]')).not.toBeNull();
    expect(actions?.querySelector('[data-user-action="change-password"]')).not.toBeNull();
  });

  it('keeps the compact desktop disclosure and rail toggle outside the mobile breakpoint', () => {
    fixture.componentRef.setInput('isMobileOrTablet', false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-user-trigger]')).not.toBeNull();
    expect(element.querySelector('[data-mobile-account-row]')).toBeNull();
    expect(element.querySelector('.c-layout-icon-toggle')?.getAttribute('aria-label')).toBe('Toggle sidebar');
  });
});
