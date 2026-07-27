import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';

// NOTE: Import nội bộ trong module layout
import { SdLayoutUserInfo, SidebarConfigurationV1 } from '../../configurations';
import { SdLayoutMenu, SdLayoutStorageService } from '../../services';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'sidebar-v1',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  imports: [MatSidenavModule, CommonModule, SidebarComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarV1Component {
  // ==========================================
  // INJECT SERVICES
  // ==========================================
  #layoutStorageService = inject(SdLayoutStorageService);

  // ==========================================
  // VIEW CHILD & INPUTS
  // ==========================================
  sidenav = viewChild.required<MatSidenav>('sidenav');
  menus = input<SdLayoutMenu[]>([]);
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV1>();
  isMobile = input(false);

  // ==========================================
  // STATE SIGNALS
  // ==========================================
  // Trạng thái khóa menu (luôn mở rộng hay không)
  isMenuLock = signal<boolean>(this.#layoutStorageService.menuLockStatus?.get() ?? true);

  // Trạng thái hiển thị (mở/đóng) của Sidenav
  isShowSidebar = signal<boolean>(this.isMobile() ? false : (this.#layoutStorageService.menuLockStatus?.get() ?? true));

  onhover = signal<boolean>(false);

  // ==========================================
  // PRIVATE TIMERS
  // ==========================================
  #timerMouseInMenu: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // EFFECT: Tự động đồng bộ isShowSidebar vào storage service mỗi khi nó thay đổi
    effect(() => {
      const isShow = this.isShowSidebar();
      untracked(() => {
        this.#layoutStorageService.isShowSidebar.set(isShow);
      });
    });
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  #mouseLeave = (): void => {
    if (this.#timerMouseInMenu) {
      clearTimeout(this.#timerMouseInMenu);
    }

    if (this.onhover() && this.isShowSidebar()) {
      this.isShowSidebar.set(false);
      this.onhover.set(false);
    }
  };

  #handleMouseLeaveTransition = (): void => {
    if (!this.isShowSidebar()) {
      const delayTime = 400;
      if (this.#timerMouseInMenu) {
        clearTimeout(this.#timerMouseInMenu);
      }
      setTimeout(() => {
        this.#mouseLeave();
      }, delayTime);
    } else {
      this.#mouseLeave();
    }
  };

  openSidebar = (): void => {
    if (!this.isMobile()) {
      return;
    }

    if (!this.isShowSidebar()) {
      this.isShowSidebar.set(true);
      this.onhover.set(true);
    }
  };

  onPopupOfSideBarOpened = (): void => {
    this.onhover.set(false);
    this.isShowSidebar.set(true);
  };

  onPopupOfSideBarClosed = (): void => {
    const delayTime = 500;
    if (!this.isMenuLock()) {
      this.onhover.set(true);
      setTimeout(() => {
        this.#mouseLeave();
      }, delayTime);
    }
  };

  onExpandSideBar = (): void => {
    if (this.isMobile()) {
      return;
    }
    if (!this.isShowSidebar()) {
      this.isShowSidebar.set(true);
      this.onhover.set(true);
    }
  };

  onMouseleaveSideBar = (): void => {
    if (this.isMobile()) {
      return;
    }
    this.#mouseLeave();
  };

  onSidenavOpenedChange = (opened: boolean): void => {
    if (this.isMobile()) {
      this.isShowSidebar.set(opened);
    }
  };

  onToggle = (data: boolean | null) => {
    if (data === null) {
      this.#handleMouseLeaveTransition();
    } else {
      this.#mouseLeave();
      this.isShowSidebar.set(data);
      this.isMenuLock.set(data);

      // Desktop keeps the Material drawer mounted as a 60px rail; mobile still opens and closes the overlay.
      if (this.isMobile()) {
        const sidenavComp = this.sidenav();
        if (sidenavComp) {
          if (data) {
            sidenavComp.open();
          } else {
            sidenavComp.close();
          }
        }
      }
    }
  };
}
