import {Component, computed, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

// Import nội bộ trong module layout
import { SdLayoutMenu, SdLayoutService } from '../../services';
import { MenuPipe } from '../../pipes';
import { SidebarV1Component } from '../sidebar-v1/main.component';
import { SidebarMobileV1Component } from '../sidebar-mobile-v1/main.component';
import { BrowserUtilities } from '@sdcorejs/utils/fns';

@Component({
  selector: 'sd-layout',
  templateUrl: './layout-main.component.html',
  styleUrls: ['./layout-main.component.scss'],
  imports: [SidebarV1Component, SidebarMobileV1Component, NgTemplateOutlet],
  standalone: true,
})
export class SdLayoutComponent {
  // ==========================================
  // INJECT SERVICES
  // ==========================================
  #menuPipe = inject(MenuPipe);
  #layoutService = inject(SdLayoutService);

  // ==========================================
  // SIGNAL INPUTS
  // ==========================================
  menusInput = input<SdLayoutMenu[]>([], { alias: 'menus' });
  menus = computed(() => this.#menuPipe.transform(this.menusInput() || []));

  // ==========================================
  // CONSUME SHARED STATE
  // ==========================================
  userInfo = this.#layoutService.userInfo;
  sidebar = this.#layoutService.sidebar;

  isMobileOrTablet = signal(BrowserUtilities.isMobile());
}
