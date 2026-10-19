import { InjectionToken, Signal } from '@angular/core';
import { MaybeAsync } from '@sdcorejs/utils/models';
import { Observable } from 'rxjs';

/** Consumer-owned account action invoked without arguments by the shared user menu. */
export type SdLayoutAccountAction = () => void | Promise<void>;

/** Notification badge source and the action that opens the consumer's notification experience. */
export interface SdLayoutNotificationConfiguration {
  /**
   * Số lượng thông báo chưa đọc. Hỗ trợ giá trị tĩnh hoặc nguồn reactive dài hạn.
   */
  count: number | Signal<number> | Observable<number>;

  /**
   * Tác vụ do consumer xử lý khi người dùng chọn thông báo.
   */
  action: SdLayoutAccountAction;
}

export interface ISdLayoutConfiguration {
  homeUrl?: string;
  mobileBreakpoint?: number;
  // why: `MaybeAsync` của `@sdcorejs/utils` 1.1.x là `T | Promise<T> | Observable<T>` (RxJS). Từ 1.2 nó dùng
  // `SubscribableLike<T>` cấu trúc, và kiểu này KHÔNG nhận `Observable` của kiểu hẹp hơn (vd `Observable<string>`
  // cho slot `string | null | undefined`, hay Observable của một subtype). Giữ `Observable<T>` tường minh để
  // consumer đang truyền Observable/BehaviorSubject vẫn compile như trước.
  sidebar: ISdSidebarConfiguration | (() => MaybeAsync<ISdSidebarConfiguration> | Observable<ISdSidebarConfiguration>);
  userInfo: SdLayoutUserInfo | (() => MaybeAsync<SdLayoutUserInfo> | Observable<SdLayoutUserInfo>);
  signout: SdLayoutAccountAction;
  changePassword?: SdLayoutAccountAction;

  /**
   * Tác vụ chỉnh sửa hồ sơ do consumer cung cấp.
   */
  updateProfile?: SdLayoutAccountAction;

  /**
   * Tác vụ mở thiết lập tài khoản do consumer cung cấp.
   */
  setting?: SdLayoutAccountAction;

  /**
   * Cấu hình số lượng và tác vụ thông báo của tài khoản.
   */
  notification?: SdLayoutNotificationConfiguration;
}

/** Optional role metadata rendered below the user's email when `text` is non-empty. */
export interface SdLayoutUserRole {
  text: string;
  /** Icon name resolved by `SdIcon`. */
  icon?: string;
  /** CSS color applied to the role metadata. */
  color?: string;
}

export interface SdLayoutUserInfo {
  /**
   * Tên đăng nhập hoặc tên định danh của người dùng.
   * Thường dùng làm định danh rút gọn hoặc fallback hiển thị nếu user chưa cập nhật fullName.
   */
  username?: string;

  /**
   * Địa chỉ thư điện tử của người dùng.
   * Thường được hiển thị bên dưới tên người dùng trong popup/menu thông tin tài khoản.
   */
  email?: string;

  /**
   * Họ và tên đầy đủ của người dùng.
   * Đây là thông tin được ưu tiên hiển thị chính trên giao diện (VD: góc phải màn hình, lời chào).
   */
  fullName?: string;

  /**
   * Hình đại diện (avatar) của người dùng.
   * Nếu để trống, hệ thống sẽ tự động lấy ký tự đầu tiên của fullName hoặc username để tạo avatar mặc định.
   * Hỗ trợ các định dạng: URL (http/https), chuỗi base64 (data:image), hoặc đường dẫn nội bộ.
   */
  avatar?: string;

  /**
   * Chức vụ hoặc vai trò hiển thị cùng thông tin người dùng.
   * Không render khi `text` rỗng.
   */
  role?: SdLayoutUserRole;
}

export const DEFAULT_LAYOUT_MOBILE_BREAKPOINT = 1024;

/** A context the signed-in user can switch between (for example a store or a legal entity). */
export interface SdLayoutContext {
  /** Stable identifier that Core persists and matches against the configured `items`. */
  id: string;
  /** Display name shown in the switcher. */
  title: string;
  /** Secondary line shown below the title. */
  subtitle?: string;
  /** Avatar image URL; the initial of `title` is shown when it is missing or fails to load. */
  avatar?: string;
}

/**
 * Context switcher configuration shared by sidebar versions 1–4.
 * The consumer only assigns `items`; Core persists and restores the current context and reloads the page after a switch.
 * Read the current context with `SdLayoutContextService.getCurrentContext()`.
 */
export interface SdLayoutContextConfiguration {
  /** Name of the context kind shown in the switcher. Defaults to the translated "Context" label. */
  label?: string;
  /** Contexts the user can switch between. An empty list hides the switcher. */
  items: SdLayoutContext[];
  /** Forces the search box on or off. By default it is shown when there are more than 7 items. */
  searchable?: boolean;
}

export interface SidebarConfigurationBase {
  brandColor?: string;
  brandLightColor?: string;
  logoUrl?: string;
  defaultTitle?: string;
  pin?: {
    enabled?: boolean;
  };
  /**
   * Context switcher rendered in the sidebar header. The consumer only assigns `items`;
   * Core persists and restores the current context and reloads the page on switch.
   * Read it with `SdLayoutContextService.getCurrentContext()`.
   */
  context?: SdLayoutContextConfiguration;
}

export type ISdSidebarConfiguration = SidebarConfigurationV1 | SidebarConfigurationV2 | SidebarConfigurationV3 | SidebarConfigurationV4;

export interface SidebarConfigurationV1 extends SidebarConfigurationBase {
  version: 1;

  /**
   * Màu brand chính.
   * Nên sử dụng mã màu #HEX hoặc rgb để hỗ trợ opacity khi hover.
   * Ví dụ: #1890ff, rgb(24,144,255)
   */
  brandColor?: string;

  /**
   * Màu brand nhạt (light).
   * Dùng cho background, hover nhẹ.
   */
  brandLightColor?: string;

  /**
   * URL logo hiển thị ở sidebar.
   * Nên đặt trong thư mục public hoặc dùng URL CDN.
   */
  logoUrl?: string;

  /**
   * Title mặc định của hệ thống.
   * Nếu menu không truyền title thì sẽ dùng giá trị này.
   * @default "Back Office"
   */
  defaultTitle?: string;

  /**
   * Cấu hình tính năng ghim menu.
   * - `enabled`: bật/tắt tính năng ghim.
   * Hệ thống mặc định là false
   */
  pin?: {
    enabled?: boolean;
  };
}

export interface SidebarConfigurationV2 extends SidebarConfigurationBase {
  version: 2;
  interaction?: 'click' | 'hover-lock';
  primaryMenuIds?: string[];
}

export interface SidebarConfigurationV3 extends SidebarConfigurationBase {
  version: 3;
  defaultCollapsed?: boolean;
  recent?: {
    enabled?: boolean;
    maxItems?: number;
  };
}

/** Sidebar V4: V3 behaviour (collapse, pinned, recent) with token-driven colours; `brandColor`/`brandLightColor` are ignored. */
export interface SidebarConfigurationV4 extends Omit<SidebarConfigurationV3, 'version'> {
  version: 4;
  /** Shape of the active/hover item highlight. @default 'pill' */
  itemShape?: 'pill' | 'soft';
  /** Row height: `compact` 36/32px, `comfortable` 40/34px. @default 'compact' */
  density?: 'compact' | 'comfortable';
  /** How a group opens while the rail is collapsed. @default 'flyout' */
  collapsedGroup?: 'flyout' | 'expand';
  /** Mobile shell options. `bottomBar` lists at most 4 menu ids shown in the bottom navigation bar. */
  mobile?: { bottomBar?: string[] };
}

export interface ResolvedSidebarRecentConfiguration {
  enabled: boolean;
  maxItems: number;
}

export function normalizeLayoutMobileBreakpoint(value: number | undefined): number {
  if (!Number.isFinite(value) || Number(value) <= 0) {
    return DEFAULT_LAYOUT_MOBILE_BREAKPOINT;
  }
  return Math.floor(Number(value));
}

export function resolveSidebarV2Interaction(sidebar: SidebarConfigurationV2): 'click' | 'hover-lock' {
  return sidebar.interaction === 'hover-lock' ? 'hover-lock' : 'click';
}

export function resolveSidebarV3Recent(sidebar: SidebarConfigurationV3): ResolvedSidebarRecentConfiguration {
  const configuredLimit = sidebar.recent?.maxItems;
  const maxItems = Number.isFinite(configuredLimit) && Number(configuredLimit) > 0 ? Math.floor(Number(configuredLimit)) : 5;
  return {
    enabled: sidebar.recent?.enabled ?? true,
    maxItems,
  };
}

function sanitizeSidebarV4BottomBar(bottomBar: unknown): string[] {
  const ids = Array.isArray(bottomBar) ? bottomBar.filter((id): id is string => typeof id === 'string').map(id => id.trim()) : [];
  return [...new Set(ids.filter(Boolean))].slice(0, 4);
}

export function normalizeSidebarConfiguration(_sidebar: SidebarConfigurationV1): SidebarConfigurationV1;
export function normalizeSidebarConfiguration(_sidebar: SidebarConfigurationV2): SidebarConfigurationV2;
export function normalizeSidebarConfiguration(_sidebar: SidebarConfigurationV3): SidebarConfigurationV3;
export function normalizeSidebarConfiguration(_sidebar: SidebarConfigurationV4): SidebarConfigurationV4;
export function normalizeSidebarConfiguration(sidebar: ISdSidebarConfiguration): ISdSidebarConfiguration {
  if (sidebar.version === 2) {
    return {
      ...sidebar,
      interaction: resolveSidebarV2Interaction(sidebar),
      primaryMenuIds: [...new Set((sidebar.primaryMenuIds ?? []).filter(id => typeof id === 'string' && id.trim()))].slice(0, 3),
    };
  }
  if (sidebar.version === 3) {
    return {
      ...sidebar,
      defaultCollapsed: sidebar.defaultCollapsed ?? false,
      recent: resolveSidebarV3Recent(sidebar),
    };
  }
  if (sidebar.version === 4) {
    const { mobile } = sidebar;
    return {
      ...sidebar,
      defaultCollapsed: sidebar.defaultCollapsed ?? false,
      // why: V4 kế thừa `recent` của V3; dùng lại đúng resolver V3 mà không nới kiểu tham số public của nó.
      recent: resolveSidebarV3Recent({ version: 3, recent: sidebar.recent }),
      itemShape: sidebar.itemShape === 'soft' ? 'soft' : 'pill',
      density: sidebar.density === 'comfortable' ? 'comfortable' : 'compact',
      collapsedGroup: sidebar.collapsedGroup === 'expand' ? 'expand' : 'flyout',
      // why: không có `bottomBar` thì giữ nguyên `mobile` (kể cả vắng mặt) — không tự tạo bottom bar rỗng.
      ...(mobile?.bottomBar == null ? {} : { mobile: { ...mobile, bottomBar: sanitizeSidebarV4BottomBar(mobile.bottomBar) } }),
    };
  }
  return sidebar;
}

export const SD_LAYOUT_CONFIGURATION = new InjectionToken<ISdLayoutConfiguration>('sd.layout.configuration');
