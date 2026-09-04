import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

// Import nội bộ trong module layout
import { SdLayoutMenu, SdLayoutResponsiveService, SdLayoutService } from '../../services';
import { MenuPipe } from '../../pipes';
import { SdSidebarV1 } from '../sidebar-v1/main.component';
import { SdSidebarMobileV1 } from '../sidebar-mobile-v1/main.component';
import { SdSidebarV2 } from '../sidebar-v2/main.component';
import { SdSidebarMobileV2 } from '../sidebar-mobile-v2/main.component';
import { SdSidebarV3 } from '../sidebar-v3/main.component';
import { SdSidebarMobileV3 } from '../sidebar-mobile-v3/main.component';
import {
  SD_LAYOUT_CONFIGURATION,
  SidebarConfigurationV1,
  SidebarConfigurationV2,
  SidebarConfigurationV3,
  normalizeLayoutMobileBreakpoint,
} from '../../configurations';

@Component({
  selector: 'sd-layout',
  templateUrl: './layout-main.component.html',
  styleUrl: './layout-main.component.scss',
  imports: [SdSidebarV1, SdSidebarMobileV1, SdSidebarV2, SdSidebarMobileV2, SdSidebarV3, SdSidebarMobileV3, NgTemplateOutlet],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdLayoutComponent {
  // ==========================================
  // INJECT SERVICES
  // ==========================================
  #menuPipe = inject(MenuPipe);
  #layoutService = inject(SdLayoutService);
  #responsiveService = inject(SdLayoutResponsiveService);
  #layoutConfiguration = inject(SD_LAYOUT_CONFIGURATION, { optional: true });

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
  sidebarV1 = computed<SidebarConfigurationV1 | undefined>(() => {
    const sidebar = this.sidebar();
    return sidebar?.version === 1 ? sidebar : undefined;
  });
  sidebarV2 = computed<SidebarConfigurationV2 | undefined>(() => {
    const sidebar = this.sidebar();
    return sidebar?.version === 2 ? sidebar : undefined;
  });
  sidebarV3 = computed<SidebarConfigurationV3 | undefined>(() => {
    const sidebar = this.sidebar();
    return sidebar?.version === 3 ? sidebar : undefined;
  });
  mobileBreakpoint = normalizeLayoutMobileBreakpoint(this.#layoutConfiguration?.mobileBreakpoint);
  isMobile = computed(() => this.#responsiveService.isMobile(this.mobileBreakpoint));
}
