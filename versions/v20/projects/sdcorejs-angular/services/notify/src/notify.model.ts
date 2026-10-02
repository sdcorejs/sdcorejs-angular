import type { SdIconShape } from '@sdcorejs/angular/modules/icon';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string | string[];
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
  /**
   * Render `message` dưới dạng HTML thay vì text.
   * - `false` (mặc định): message render dạng TEXT (auto-escape) — an toàn tuyệt đối.
   * - `true`: message render dạng HTML, đã được `DomSanitizer.sanitize(HTML)`
   *   (strip `<script>`, event handler, `javascript:` URL). CHỈ dùng cho markup
   *   TIN CẬY (do dev tự viết); KHÔNG truyền data người dùng vào đây.
   */
  html?: boolean;
  /** Hình nền ô icon; bỏ trống thì toast dùng `defaultShape` của `provideSdIcon`. */
  iconShape?: SdIconShape;
}

export interface NotifyOption {
  duration?: number; // Input từ user thì vẫn để là tùy chọn
  title?: string;
  actionLabel?: string;
  /**
   * Callback khi bấm nút action — do APP tự cung cấp (không phải input không tin cậy).
   * Chỉ được gọi khi user bấm `actionLabel`.
   */
  onAction?: () => void;
  /**
   * Render message dạng HTML đã sanitize (mặc định `false` = text an toàn).
   * Chỉ dùng cho markup tin cậy. Xem `ToastData.html`.
   */
  html?: boolean;
  /**
   * Hình nền ô icon: `square` | `circle` | `none`. Bỏ trống thì dùng `defaultShape` của `provideSdIcon`.
   * Với `warning`/`error` (gom theo debounce), option của lời gọi cuối được dùng — giống `title`/`duration`.
   */
  iconShape?: SdIconShape;
}
