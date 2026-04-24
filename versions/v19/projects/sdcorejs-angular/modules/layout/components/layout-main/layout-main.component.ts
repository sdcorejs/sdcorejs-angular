import { Component, computed, inject, input } from '@angular/core';

// Import nội bộ trong module layout
import { SdLayoutMenu, SdLayoutService } from '../../services';
import { MenuPipe } from '../../pipes';
import { SidebarV1Component } from '../sidebar-v1/main.component';

@Component({
  selector: 'sd-layout',
  templateUrl: './layout-main.component.html',
  styleUrls: ['./layout-main.component.scss'],
  imports: [SidebarV1Component],
  standalone: true,
})
export class SdLayoutComponent {
  // ==========================================
  // INJECT SERVICES
  // ==========================================
  #menuPipe = inject(MenuPipe);
  #layoutService = inject(SdLayoutService); // Inject LayoutService

  // ==========================================
  // SIGNAL INPUTS
  // ==========================================
  menusInput = input<SdLayoutMenu[]>([], { alias: 'menus' });

  // Tự động format qua MenuPipe mỗi khi menusInput từ component cha thay đổi
  menus = computed(() => this.#menuPipe.transform(this.menusInput() || []));

  // ==========================================
  // CONSUME SHARED STATE (Tuỳ chọn)
  // ==========================================
  // Bạn có thể gán biến ngắn gọn để xài trong HTML (ví dụ: userInfo() thay vì layoutService.userInfo())
  userInfo = this.#layoutService.userInfo;
  sidebar = this.#layoutService.sidebar;
}
