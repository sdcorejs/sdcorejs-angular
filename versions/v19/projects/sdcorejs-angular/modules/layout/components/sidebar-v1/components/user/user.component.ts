import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
// Import sd-core
import { SdAvatar } from '@sdcorejs/angular/components';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
// NOTE: Import ná»™i bá»™ trong module layout thÃ¬ dÃ¹ng path tÆ°Æ¡ng Ä‘á»‘i
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

  // Chuyá»ƒn thÃ nh void vÃ¬ cÃ¡c hÃ m emit hiá»‡n táº¡i khÃ´ng truyá»n data
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
    // DÃ¹ng Optional Chaining gá»i hÃ m cá»±c gá»n
    this.changePasswordLayoutConfig?.(); 
  };

  onToggleMenuLock = (event: Event): void => {
    this.toggleMenuLock.emit(event);
  };
}


