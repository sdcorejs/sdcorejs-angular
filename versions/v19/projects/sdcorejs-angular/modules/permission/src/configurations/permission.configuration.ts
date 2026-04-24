import { InjectionToken } from '@angular/core';
import { SdMaybeAsync } from '@sdcorejs/angular/utilities';

/**
 * Cáº¥u hÃ¬nh trung tÃ¢m cho module permission.
 *
 * Luá»“ng hoáº¡t Ä‘á»™ng chÃ­nh:
 * 1. `loadPermissions(key?)` á»Ÿ service Ä‘Æ°á»£c gá»i Ä‘á»ƒ láº¥y danh sÃ¡ch mÃ£ quyá»n theo tá»«ng `key` cáº¥u hÃ¬nh.
 * 2. Guard/service Ä‘á»‘i chiáº¿u mÃ£ quyá»n theo route metadata.
 * 3. Khi khÃ´ng Ä‘á»§ quyá»n, callback `onForbiden()` sáº½ Ä‘Æ°á»£c gá»i (náº¿u cÃ³).
 *
 * LÆ°u Ã½:
 * - `SD_PERMISSION_CONFIGURATION` há»— trá»£ cáº£ cáº¥u hÃ¬nh Ä‘Æ¡n vÃ  máº£ng cáº¥u hÃ¬nh (`multi: true`).
 * - Náº¿u cáº§n táº¡m bá» qua kiá»ƒm tra quyá»n (POC/UAT cá»¥c bá»™), Ä‘áº·t `disabled = true`.
 */
export interface ISdPermissionConfiguration {
  /**
   * KhÃ³a Ä‘á»‹nh danh cáº¥u hÃ¬nh.
    * DÃ¹ng Ä‘á»ƒ phÃ¢n biá»‡t khi há»‡ thá»‘ng má»Ÿ rá»™ng theo nhiá»u profile permission.
    *
    * LÆ°u Ã½: `undefined` cÅ©ng Ä‘Æ°á»£c xem lÃ  má»™t key há»£p lá»‡ (cáº¥u hÃ¬nh máº·c Ä‘á»‹nh).
   */
  key?: string;

  /**
   * Báº­t/táº¯t kiá»ƒm tra permission toÃ n cá»¥c.
   * - `true`: bá» qua kiá»ƒm tra quyá»n.
   * - `false | undefined`: kiá»ƒm tra quyá»n theo cáº¥u hÃ¬nh route.
   */
  disabled?: boolean;

  /**
   * Tráº£ vá» danh sÃ¡ch mÃ£ quyá»n cá»§a user hiá»‡n táº¡i.
   * CÃ³ thá»ƒ Ä‘á»“ng bá»™ hoáº·c báº¥t Ä‘á»“ng bá»™.
   *
   * VÃ­ dá»¥ giÃ¡ trá»‹ tráº£ vá»:
   * - `['PRODUCT_C_EMPLOYEE_VIEW', 'PRODUCT_C_EMPLOYEE_UPDATE']`
   */
  loadPermissions: () => SdMaybeAsync<string[]>;

  /**
   * Callback xá»­ lÃ½ khi user khÃ´ng cÃ³ quyá»n truy cáº­p URL hiá»‡n táº¡i.
   * ThÆ°á»ng dÃ¹ng Ä‘á»ƒ Ä‘iá»u hÆ°á»›ng sang trang forbidden hoáº·c hiá»ƒn thá»‹ thÃ´ng bÃ¡o.
   *
   * Giá»¯ nguyÃªn tÃªn `onForbiden` Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch API hiá»‡n táº¡i.
   */
  onForbiden?: () => void;

  /**
   * Cung cáº¥p access token hiá»‡n táº¡i cho cÃ¡c tÃ¡c vá»¥ liÃªn quan permission.
   * Há»— trá»£ tráº£ vá» Ä‘á»“ng bá»™, Promise hoáº·c Observable.
   */
  getToken?: () => SdMaybeAsync<string | undefined | null>;
}

/**
 * InjectionToken cho cáº¥u hÃ¬nh permission.
 *
 * VÃ­ dá»¥ provider:
 * {
 *   provide: SD_PERMISSION_CONFIGURATION,
 *   useValue: {
 *     disabled: false,
 *     loadPermissions: () => ['SAMPLE_C_EMPLOYEE_VIEW'],
 *     onForbiden: () => router.navigateByUrl('/layout/forbidden')
 *   }
 * }
 */
export const SD_PERMISSION_CONFIGURATION =
  new InjectionToken<ISdPermissionConfiguration | ISdPermissionConfiguration[]>('sd-permission.configuration');

