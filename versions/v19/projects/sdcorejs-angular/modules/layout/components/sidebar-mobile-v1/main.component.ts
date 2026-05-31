import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
// NOTE: Import nội bộ trong module layout
import { SdLayoutUserInfo, SidebarConfigurationV1 } from '../../configurations';
import { SdLayoutMenu, SdLayoutStorageService } from '../../services';
import { SidebarMobileOverlayComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'sidebar-mobile-v1',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [MatIconModule, CommonModule, SidebarMobileOverlayComponent],
  standalone: true,
})
export class SidebarMobileV1Component {
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
