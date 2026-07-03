import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
// Import sd-core
import { SdAvatar } from '@sdcorejs/angular/components';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
// NOTE: Import nội bộ trong module layout thì dùng path tương đối
import { SD_LAYOUT_CONFIGURATION, SdLayoutUserInfo } from '../../../../configurations';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'lib-layout-user',
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
  imports: [SdIcon, MatMenuModule, MatButtonModule, MatTooltipModule, SdAvatar, TranslatePipe],
  standalone: true,
})
export class LayoutUserComponent {
  // ==========================================
  // INJECT SERVICES
  // ==========================================
  #layoutConfiguration = inject(SD_LAYOUT_CONFIGURATION);

  // ==========================================
  // SIGNAL INPUTS & OUTPUTS
  // ==========================================
  isMobileOrTablet = input<boolean>(false);
  isMenuLock = input<boolean>(false);
  isShowSidebar = input<boolean>(false);
  userInfo = input.required<SdLayoutUserInfo>();

  // Chuyển thành void vì các hàm emit hiện tại không truyền data
  menuClosed = output<void>();
  menuOpened = output<void>();
  toggleMenuLock = output<Event>();

  // Config actions
  singoutLayoutConfig = this.#layoutConfiguration.signout;
  changePasswordLayoutConfig = this.#layoutConfiguration?.changePassword;

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  onMenuOpened = (): void => {
    this.menuOpened.emit();
  };

  onMenuClosed = (): void => {
    this.menuClosed.emit();
  };

  keepOpenWhenClickInsideMenu = (event: Event): void => {
    event.stopPropagation();
  };

  logout = (): void => {
    this.singoutLayoutConfig();
  };

  changePassword = (): void => {
    // Dùng Optional Chaining gọi hàm cực gọn
    this.changePasswordLayoutConfig?.();
  };

  onToggleMenuLock = (event: Event): void => {
    this.toggleMenuLock.emit(event);
  };
}
