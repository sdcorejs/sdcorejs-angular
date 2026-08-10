import { NgTemplateOutlet } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdViewportService } from '../../../../services/viewport';
import { SD_LAYOUT_CONFIGURATION } from '../../configurations';
import { MenuPipe } from '../../pipes';
import { SdLayoutResponsiveService } from '../../services';
import { SdLayoutService } from '../../services/layout.service';
import { SdLayoutComponent } from './layout-main.component';

@Component({ selector: 'sd-sidebar-v1', standalone: true, template: '<span data-testid="desktop-v1"></span>' })
class DesktopV1StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
  isMobile = input(false);
}

@Component({ selector: 'sd-sidebar-mobile-v1', standalone: true, template: '<span data-testid="mobile-v1"></span>' })
class MobileV1StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

@Component({ selector: 'sd-sidebar-v2', standalone: true, template: '<span data-testid="desktop-v2"></span>' })
class DesktopV2StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

@Component({ selector: 'sd-sidebar-mobile-v2', standalone: true, template: '<span data-testid="mobile-v2"></span>' })
class MobileV2StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

@Component({ selector: 'sd-sidebar-v3', standalone: true, template: '<span data-testid="desktop-v3"></span>' })
class DesktopV3StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

@Component({ selector: 'sd-sidebar-mobile-v3', standalone: true, template: '<span data-testid="mobile-v3"></span>' })
class MobileV3StubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
}

describe('SdLayoutComponent responsive V1/V2/V3 composition', () => {
  let fixture: ComponentFixture<SdLayoutComponent>;
  const viewportWidth = signal(1280);
  const sharedViewportWidth = signal(1280);
  const sidebar = signal<{ version: 1 | 2 | 3; defaultTitle: string }>({ version: 1, defaultTitle: 'Portal' });

  beforeEach(async () => {
    viewportWidth.set(1280);
    sharedViewportWidth.set(1280);
    sidebar.set({ version: 1, defaultTitle: 'Portal' });
    await TestBed.configureTestingModule({
      imports: [SdLayoutComponent],
      providers: [
        {
          provide: SdLayoutService,
          useValue: {
            userInfo: signal({ fullName: 'Demo User' }),
            sidebar,
          },
        },
        { provide: MenuPipe, useValue: { transform: (menus: unknown[]) => menus } },
        {
          provide: SdViewportService,
          useValue: { width: sharedViewportWidth },
        },
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

  it('renders the layout host as a block so the responsive shell does not align to an inline baseline', () => {
    expect(getComputedStyle(fixture.nativeElement).display).toBe('block');
  });

  ([1, 2, 3] as const).forEach(version => {
    it(`switches V${version} from desktop to mobile live without navigation or reload`, () => {
      sidebar.set({ version, defaultTitle: 'Portal' });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector(`[data-testid="desktop-v${version}"]`)).not.toBeNull();

      viewportWidth.set(640);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector(`[data-testid="desktop-v${version}"]`)).toBeNull();
      expect(fixture.nativeElement.querySelector(`[data-testid="mobile-v${version}"]`)).not.toBeNull();
    });
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
