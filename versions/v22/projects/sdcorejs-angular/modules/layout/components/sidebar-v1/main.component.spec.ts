import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { SdLayoutStorageService } from '../../services';
import { SdSidebarV1 } from './main.component';

const storage = <T>(value: T) => ({
  get: () => value,
  set: (_next: T) => undefined,
  setSilent: (_next: T) => undefined,
  has: () => true,
  remove: () => undefined,
});

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-sidebar-v1-panel',
  standalone: true,
  template: `
    <div class="wide-sidebar-content">
      <input data-testid="sidebar-search" />
    </div>
  `,
  styles: `
    .wide-sidebar-content {
      width: 290px;
    }

    input {
      margin-left: 180px;
    }
  `,
})
class SidebarStubComponent {
  menus = input<unknown[]>([]);
  userInfo = input.required<unknown>();
  sidebar = input.required<unknown>();
  isShowSidebar = input(false);
  isMobile = input(false);
  showSideBar = output<boolean | null>();
  expandSideBar = output<void>();
  popupUserMenuOpened = output<void>();
  popupUserMenuClosed = output<void>();
}

describe('SdSidebarV1 responsive compatibility', () => {
  let fixture: ComponentFixture<SdSidebarV1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdSidebarV1, NoopAnimationsModule],
      providers: [
        {
          provide: SdLayoutStorageService,
          useValue: { menuLockStatus: storage(true), isShowSidebar: storage(true) },
        },
      ],
    })
      .overrideComponent(SdSidebarV1, { set: { imports: [MatSidenavModule, CommonModule, SidebarStubComponent] } })
      .compileComponents();

    fixture = TestBed.createComponent(SdSidebarV1);
    fixture.componentRef.setInput('menus', []);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User' });
    fixture.componentRef.setInput('sidebar', { version: 1 });
  });

  it('uses the responsive input for its sidenav mode', () => {
    fixture.componentRef.setInput('isMobile', true);
    fixture.detectChanges();

    expect(fixture.debugElement.query(node => node.componentInstance instanceof MatSidenav).componentInstance.mode).toBe('over');
  });

  it('keeps the collapsed desktop rail mounted without horizontal focus scrolling', () => {
    fixture.componentRef.setInput('isMobile', false);
    fixture.detectChanges();
    const sidebar = fixture.nativeElement.querySelector('.c-layout-sidebar') as HTMLElement;
    const searchInput = fixture.nativeElement.querySelector('[data-testid="sidebar-search"]') as HTMLInputElement;

    fixture.componentInstance.isShowSidebar.set(true);
    fixture.detectChanges();
    expect(sidebar.classList).toContain('is-expanded');

    searchInput.focus();
    fixture.componentInstance.isShowSidebar.set(false);
    fixture.detectChanges();

    expect(sidebar.classList).toContain('mat-drawer-opened');
    expect(sidebar.classList).not.toContain('is-expanded');
    expect(sidebar.getAttribute('aria-hidden')).not.toBe('true');
    expect(getComputedStyle(sidebar).overflowX).toBe('clip');

    sidebar.scrollLeft = 120;

    expect(sidebar.scrollLeft).toBe(0);
  });
});
