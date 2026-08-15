import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
// NOTE: Import nội bộ trong module layout
import { SdLayoutUserInfo, SidebarConfigurationV1 } from '../../configurations';
import { SdLayoutMenu, SdLayoutStorageService } from '../../services';
import { SdSidebarMobileOverlay } from './components/sidebar/sidebar.component';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'sd-sidebar-mobile-v1',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  imports: [SdIcon, CommonModule, SdSidebarMobileOverlay],
  standalone: true,
})
export class SdSidebarMobileV1 {
  #layoutStorageService = inject(SdLayoutStorageService);

  menus = input<SdLayoutMenu[]>([]);
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV1>();

  // Sidebar luôn bắt đầu đóng trên mobile
  isShowSidebar = signal<boolean>(false);
  titleMenuGroup = signal<string | undefined>('');

  constructor() {
    effect(() => {
      const isShow = this.isShowSidebar();
      untracked(() => {
        this.#layoutStorageService.isShowSidebar.set(isShow);
      });
    });
  }

  openSidebar = (): void => {
    this.isShowSidebar.set(true);
  };

  onToggle = (_data: boolean | null): void => {
    this.isShowSidebar.set(false);
  };

  onPopupOfSideBarOpened = (): void => {};
  onPopupOfSideBarClosed = (): void => {};
  onExpandSideBar = (): void => {};
  onMouseleaveSideBar = (): void => {};
  onTitleMenuGroupChanged = (title: string | undefined): void => {
    this.titleMenuGroup.set(title);
  };
}
