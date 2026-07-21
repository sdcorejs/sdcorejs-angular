import { NgTemplateOutlet } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SD_LAYOUT_CONFIGURATION } from '../../configurations';
import { MenuPipe } from '../../pipes';
import { SdLayoutResponsiveService } from '../../services';
import { SdLayoutService } from '../../services/layout.service';
import { SdLayoutComponent } from './layout-main.component';

@Component({ selector: 'sidebar-v1', standalone: true, template: '<span data-testid="desktop-v1"></span>' })
class DesktopV1StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
  isMobile = input(false);
}

@Component({ selector: 'sidebar-mobile-v1', standalone: true, template: '<span data-testid="mobile-v1"></span>' })
class MobileV1StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

@Component({ selector: 'sidebar-v2', standalone: true, template: '' })
class DesktopV2StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

@Component({ selector: 'sidebar-mobile-v2', standalone: true, template: '' })
class MobileV2StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

@Component({ selector: 'sidebar-v3', standalone: true, template: '' })
class DesktopV3StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

@Component({ selector: 'sidebar-mobile-v3', standalone: true, template: '' })
class MobileV3StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

describe('SdLayoutComponent responsive V1 composition', () => {
  let fixture: ComponentFixture<SdLayoutComponent>;
  const viewportWidth = signal(1280);

  beforeEach(async () => {
    viewportWidth.set(1280);
    await TestBed.configureTestingModule({
      imports: [SdLayoutComponent],
      providers: [
        {
          provide: SdLayoutService,
          useValue: {
            userInfo: signal({ fullName: 'Demo User' }),
            sidebar: signal({ version: 1, defaultTitle: 'Portal' }),
          },
        },
        { provide: MenuPipe, useValue: { transform: (menus: unknown[]) => menus } },
        {
          provide: SdLayoutResponsiveService,
          useValue: { viewportWidth, isMobile: (breakpoint: number) => viewportWidth() < breakpoint },
        },
        {
          provide: SD_LAYOUT_CONFIGURATION,
          useValue: { mobileBreakpoint: 900, sidebar: { version: 1 }, userInfo: {}, signout: () => undefined },
        },
      ],
    })
      .overrideComponent(SdLayoutComponent, {
        set: {
          imports: [
            DesktopV1StubComponent,
            MobileV1StubComponent,
            DesktopV2StubComponent,
            MobileV2StubComponent,
            DesktopV3StubComponent,
            MobileV3StubComponent,
            NgTemplateOutlet,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SdLayoutComponent);
    fixture.detectChanges();
  });

  it('switches V1 from desktop to mobile live without navigation or reload', () => {
    expect(fixture.nativeElement.querySelector('[data-testid="desktop-v1"]')).not.toBeNull();

    viewportWidth.set(640);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="desktop-v1"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="mobile-v1"]')).not.toBeNull();
  });

  it('uses the consumer mobileBreakpoint instead of a fixed device check', () => {
    viewportWidth.set(950);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="desktop-v1"]')).not.toBeNull();

    viewportWidth.set(899);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="mobile-v1"]')).not.toBeNull();
  });
});
