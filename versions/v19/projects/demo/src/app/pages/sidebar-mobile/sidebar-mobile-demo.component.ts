import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  SD_LAYOUT_CONFIGURATION,
  SidebarConfigurationV1,
  SdLayoutUserInfo,
  SdLayoutMenu,
  SidebarMobileOverlayComponent,
} from '@sdcorejs/angular/modules/layout';

const MOCK_MENUS: SdLayoutMenu[] = [
  {
    id: 'clms',
    title: 'CLMS',
    iconUrl: '/logo-clms.png',
    children: [
      {
        id: 'clms-contract',
        title: 'Quáº£n lÃ½ há»£p Ä‘á»“ng',
        icon: 'assignment',
        children: [
          {
            id: 'clms-contract-1',
            path: '/clm/contract',
            title: 'Quáº£n lÃ½ há»£p Ä‘á»“ng',
            permission: 'CLMS_P_CONTRACT',
          },
        ],
      },
      {
        id: 'clms-data',
        title: 'Quáº£n lÃ½ dá»¯ liá»‡u',
        icon: 'storage',
        children: [
          {
            id: 'clms-data-1',
            path: '/clm/doc-template',
            title: 'Quáº£n lÃ½ vÄƒn báº£n máº«u',
            permission: 'CLMS_P_TEMPLATE',
          },
          {
            id: 'clms-data-2',
            path: '/clm/variable-template',
            title: 'Quáº£n lÃ½ dá»¯ liá»‡u máº«u',
            permission: 'CLMS_P_VARIABLETEMPLATE',
          },
          {
            id: 'clms-data-3',
            path: '/clm/org',
            title: 'Quáº£n lÃ½ Ä‘á»‘i tÃ¡c',
            permission: 'CLMS_P_ORGANIZATION',
          },
          {
            id: 'clms-data-4',
            path: '/clm/variable-data-source',
            title: 'Quáº£n lÃ½ nguá»“n dá»¯ liá»‡u',
            permission: 'CLMS_P_SOURCEPROVIDER',
          },
          {
            id: 'clms-data-5',
            path: '/clm/integration-log',
            title: 'Intergration Log',
            permission: 'CLMS_P_INTEGRATION_LOG',
          },
        ],
      },
      {
        id: 'clms-config',
        icon: 'settings',
        title: 'Cáº¥u hÃ¬nh há»£p Ä‘á»“ng',
        children: [
          {
            id: 'clms-config-1',
            path: '/clm/look-up',
            title: 'QL thuá»™c tÃ­nh danh sÃ¡ch',
            permission: 'CLMS_P_LOOKUP',
          },
          {
            id: 'clms-config-2',
            path: '/clm/category',
            title: 'QL thÆ° viá»‡n danh má»¥c',
            permission: 'CLMS_P_CATEGORY',
          },
          {
            id: 'clms-config-3',
            title: 'Cáº¥u hÃ¬nh dá»¯ liá»‡u hiá»ƒn thá»‹',
            path: '/clm/contract-metadata-config',
            permission: 'CLMS_P_METADATA',
          },
        ],
      },
      {
        id: 'clms-users',
        icon: 'group',
        title: 'QL ngÆ°á»i dÃ¹ng',
        children: [
          {
            id: 'clms-users-1',
            path: '/clm/business-unit',
            title: 'Quáº£n lÃ½ Ä‘Æ¡n vá»‹ kinh doanh',
            permission: 'CLMS_P_BUSINESSUNIT',
          },
          {
            id: 'clms-users-2',
            path: '/clm/department',
            title: 'Quáº£n lÃ½ phÃ²ng ban',
            permission: 'CLMS_P_DEPARTMENT',
          },
          {
            id: 'clms-users-3',
            path: '/clm/user',
            title: 'Quáº£n lÃ½ há»“ sÆ¡ ngÆ°á»i dÃ¹ng',
            permission: 'CLMS_P_USERPROFILE',
          },
        ],
      },
      {
        id: 'clms-history',
        path: '/clm/document-history-activity',
        title: 'TÃ­ch há»£p/Lá»‹ch sá»­',
        icon: 'history',
        permission: 'CLMS_P_DOCUMENT_HISTORY_ACTIVITY',
      },
    ],
  },
  {
    id: 'scm',
    title: 'SCM',
    children: [
      {
        id: 'scm-order',
        title: 'Quáº£n lÃ½ Ä‘Æ¡n hÃ ng',
        icon: 'assignment',
        path: '/scm/purchase-order',
        permission: 'SCM_P_PURCHASE_ORDER',
      },
    ],
  },
  {
    id: 'mdm',
    title: 'MDM',
    children: [
      {
        id: 'mdm-product',
        title: 'Quáº£n lÃ½ sáº£n pháº©m',
        icon: 'assignment',
        path: '/mdm/product',
        permission: 'MDM_P_PRODUCT',
      },
    ],
  },
];

const MOCK_USER_INFO: SdLayoutUserInfo = {
  fullName: 'Nguyen Van A',
  email: 'chuyenvien.kinhdoanh@onemount.com',
  username: 'nguyen.van.a',
};

const MOCK_SIDEBAR_CONFIG: SidebarConfigurationV1 = {
  version: 1,
  defaultTitle: 'Danh má»¥c',
  brandColor: '#2962FF',
  brandLightColor: '#E3F2FD',
};

@Component({
  selector: 'sidebar-mobile-demo',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, SidebarMobileOverlayComponent],
  providers: [
    {
      provide: SD_LAYOUT_CONFIGURATION,
      useValue: {
        userInfo: MOCK_USER_INFO,
        sidebar: MOCK_SIDEBAR_CONFIG,
        signout: () => alert('ÄÄƒng xuáº¥t'),
        changePassword: () => alert('Äá»•i máº­t kháº©u'),
      },
    },
  ],
  template: `
    <div
      style="background: #f0f0f0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px; gap: 16px;">
      <h2 style="margin: 0; font-family: sans-serif;">Demo: Sidebar Mobile V1</h2>

      <!-- NÃºt má»Ÿ sidebar -->
      <button mat-raised-button color="primary" (click)="openSidebar()">
        <mat-icon>menu</mat-icon>
        Má»Ÿ Sidebar
      </button>

      <!-- Giáº£ láº­p khung Ä‘iá»‡n thoáº¡i -->
      <div
        style="
        width: 375px;
        height: 667px;
        border: 2px solid #ccc;
        border-radius: 20px;
        overflow: hidden;
        position: relative;
        background: #fff;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      ">
        <!-- Ná»™i dung trang chÃ­nh -->
        <div style="padding: 16px; font-family: sans-serif; background: #fff; height: 100%; box-sizing: border-box;">
          <p style="color: #999; text-align: center; margin-top: 80px;">Ná»™i dung trang chÃ­nh</p>
          <p style="color: #ccc; text-align: center; font-size: 13px;">Báº¥m nÃºt "Má»Ÿ Sidebar" á»Ÿ trÃªn</p>
        </div>

        <!-- Sidebar overlay bÃªn trong khung Ä‘iá»‡n thoáº¡i -->
        <sd-sidebar-mobile-overlay
          [menus]="menus"
          [userInfo]="userInfo"
          [sidebar]="sidebarConfig"
          [isShowSidebar]="isOpen()"
          (showSideBar)="onSidebarToggle($event)">
        </sd-sidebar-mobile-overlay>
      </div>
    </div>
  `,
})
export class SidebarMobileDemoComponent {
  menus = MOCK_MENUS;
  userInfo = MOCK_USER_INFO;
  sidebarConfig = MOCK_SIDEBAR_CONFIG;

  isOpen = signal(false);

  openSidebar(): void {
    this.isOpen.set(true);
  }

  onSidebarToggle(value: boolean | null): void {
    if (value === null || value === false) {
      this.isOpen.set(false);
    }
  }
}

