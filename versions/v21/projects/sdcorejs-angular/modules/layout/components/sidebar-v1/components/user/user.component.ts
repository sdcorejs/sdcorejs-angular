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

  sdMenuClosed = output<void>();
  sdMenuOpened = output<void>();
  sdToggleMenuLock = output<Event>();

  onMenuOpened(): void {
    this.sdMenuOpened.emit();
  }

  onMenuClosed(): void {
    this.sdMenuClosed.emit();
  }

  onToggleMenuLock(event: Event): void {
    this.sdToggleMenuLock.emit(event);
  }
}
