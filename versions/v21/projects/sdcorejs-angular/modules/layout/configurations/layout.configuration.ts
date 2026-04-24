import { InjectionToken } from '@angular/core';
import { SdMaybeAsync } from '@sdcorejs/angular/utilities/models';
export interface ISdLayoutConfiguration {
  homeUrl?: string;
  sidebar: ISdSidebarConfiguration | (() => SdMaybeAsync<ISdSidebarConfiguration>);
  userInfo: SdLayoutUserInfo | (() => SdMaybeAsync<SdLayoutUserInfo>);
  signout: () => void | Promise<void>;
  changePassword?: () => void | Promise<void>;
}

export interface SdLayoutUserInfo {
  /**
   * TÃªn Ä‘Äƒng nháº­p hoáº·c tÃªn Ä‘á»‹nh danh cá»§a ngÆ°á»i dÃ¹ng.
   * ThÆ°á»ng dÃ¹ng lÃ m Ä‘á»‹nh danh rÃºt gá»n hoáº·c fallback hiá»ƒn thá»‹ náº¿u user chÆ°a cáº­p nháº­t fullName.
   */
  username?: string;

  /**
   * Äá»‹a chá»‰ thÆ° Ä‘iá»‡n tá»­ cá»§a ngÆ°á»i dÃ¹ng.
   * ThÆ°á»ng Ä‘Æ°á»£c hiá»ƒn thá»‹ bÃªn dÆ°á»›i tÃªn ngÆ°á»i dÃ¹ng trong popup/menu thÃ´ng tin tÃ i khoáº£n.
   */
  email?: string;

  /**
   * Há» vÃ  tÃªn Ä‘áº§y Ä‘á»§ cá»§a ngÆ°á»i dÃ¹ng.
   * ÄÃ¢y lÃ  thÃ´ng tin Ä‘Æ°á»£c Æ°u tiÃªn hiá»ƒn thá»‹ chÃ­nh trÃªn giao diá»‡n (VD: gÃ³c pháº£i mÃ n hÃ¬nh, lá»i chÃ o).
   */
  fullName?: string;

  /**
   * HÃ¬nh Ä‘áº¡i diá»‡n (avatar) cá»§a ngÆ°á»i dÃ¹ng.
   * Náº¿u Ä‘á»ƒ trá»‘ng, há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng láº¥y kÃ½ tá»± Ä‘áº§u tiÃªn cá»§a fullName hoáº·c username Ä‘á»ƒ táº¡o avatar máº·c Ä‘á»‹nh.
   * Há»— trá»£ cÃ¡c Ä‘á»‹nh dáº¡ng: URL (http/https), chuá»—i base64 (data:image), hoáº·c Ä‘Æ°á»ng dáº«n ná»™i bá»™.
   */
  avatar?: string;
}

export type ISdSidebarConfiguration = SidebarConfigurationV1;

export interface SidebarConfigurationV1 {
  version: 1;

  /**
   * MÃ u brand chÃ­nh.
   * NÃªn sá»­ dá»¥ng mÃ£ mÃ u #HEX hoáº·c rgb Ä‘á»ƒ há»— trá»£ opacity khi hover.
   * VÃ­ dá»¥: #1890ff, rgb(24,144,255)
   */
  brandColor?: string;

  /**
   * MÃ u brand nháº¡t (light).
   * DÃ¹ng cho background, hover nháº¹.
   */
  brandLightColor?: string;

  /**
   * URL logo hiá»ƒn thá»‹ á»Ÿ sidebar.
   * NÃªn Ä‘áº·t trong thÆ° má»¥c public hoáº·c dÃ¹ng URL CDN.
   */
  logoUrl?: string;

  /**
   * Title máº·c Ä‘á»‹nh cá»§a há»‡ thá»‘ng.
   * Náº¿u menu khÃ´ng truyá»n title thÃ¬ sáº½ dÃ¹ng giÃ¡ trá»‹ nÃ y.
   * @default "Back Office"
   */
  defaultTitle?: string;
}

export const SD_LAYOUT_CONFIGURATION = new InjectionToken<ISdLayoutConfiguration>('sd.layout.configuration');

