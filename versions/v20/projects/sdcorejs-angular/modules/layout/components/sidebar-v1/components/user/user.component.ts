import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdLayoutUserInfo } from '../../../../configurations';
import { SdLayoutUserMenuComponent } from '../../../shared/user-menu/user-menu.component';

@Component({
  selector: 'lib-layout-user',
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
  imports: [SdIcon, SdLayoutUserMenuComponent, SdTranslatePipe],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutUserComponent {
  isMobileOrTablet = input<boolean>(false);
  isMenuLock = input<boolean>(false);
  isShowSidebar = input<boolean>(false);
  userInfo = input.required<SdLayoutUserInfo>();

  menuClosed = output<void>();
  menuOpened = output<void>();
  toggleMenuLock = output<Event>();

  onMenuOpened(): void {
    this.menuOpened.emit();
  }

  onMenuClosed(): void {
    this.menuClosed.emit();
  }

  onToggleMenuLock(event: Event): void {
    this.toggleMenuLock.emit(event);
  }
}
