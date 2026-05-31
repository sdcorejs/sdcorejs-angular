import { InjectionToken } from '@angular/core';
import { MaybeAsync } from '@sdcorejs/utils/models';
export interface ISdLayoutConfiguration {
  homeUrl?: string;
  sidebar: ISdSidebarConfiguration | (() => MaybeAsync<ISdSidebarConfiguration>);
  userInfo: SdLayoutUserInfo | (() => MaybeAsync<SdLayoutUserInfo>);
  signout: () => void | Promise<void>;
  changePassword?: () => void | Promise<void>;
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
}

export type ISdSidebarConfiguration = SidebarConfigurationV1;

export interface SidebarConfigurationV1 {
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

export const SD_LAYOUT_CONFIGURATION = new InjectionToken<ISdLayoutConfiguration>('sd.layout.configuration');
