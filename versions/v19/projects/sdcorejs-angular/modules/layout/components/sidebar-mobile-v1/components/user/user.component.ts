import { Component, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
// Import sd-core
import { SdAvatar } from '@sdcorejs/angular/components';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
// NOTE: Import nội bộ trong module layout thì dùng path tương đối
import { SD_LAYOUT_CONFIGURATION, SdLayoutUserInfo } from '../../../../configurations';

@Component({
  selector: 'lib-layout-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  imports: [MatMenuModule, MatButtonModule, MatIconModule, MatTooltipModule, SdAvatar, TranslatePipe],
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

  menuClosed = output<void>();
  menuOpened = output<void>();
  toggleMenuLock = output<Event>();

  // Config actions
  singoutLayoutConfig = this.#layoutConfiguration.signout;
  changePasswordLayoutConfig = this.#layoutConfiguration?.changePassword;

  // Accordion state for mobile inline expand
  isExpanded = signal<boolean>(false);

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

  toggleExpanded = (): void => {
    this.isExpanded.update(v => !v);
    if (this.isExpanded()) {
      this.menuOpened.emit();
    } else {
      this.menuClosed.emit();
    }
  };

  logout = (): void => {
    this.singoutLayoutConfig();
  };

  changePassword = (): void => {
    this.changePasswordLayoutConfig?.();
  };

  onToggleMenuLock = (event: Event): void => {
    this.toggleMenuLock.emit(event);
  };
}

