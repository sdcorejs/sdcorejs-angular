import type { Color, Filter } from '@sdcorejs/utils/models';
import type { SdFormGenericValidationMessages } from '../rules/form-generic-validation';
import type { SdFormGenericLayout } from './form-generic-field.model';
import type { SdFormGenericVisibilityRules } from './form-generic-schema.model';

/**
 * Phần tử không phải field (đợt 2): đặt trong trang hoặc group như field, có `layout` và `rules`, nhưng
 * KHÔNG có `key` — không bao giờ nằm trong `value`, `validate()` hay `viewEntities`.
 *
 * Mọi chữ là chữ thuần do người thiết kế nhập: không HTML, không chèn giá trị động (nội dung giàu dùng
 * field `html`).
 */
interface SdFormGenericElementBase {
  id: string;
  layout?: SdFormGenericLayout;
  hidden?: boolean;
}

/** Cấp tiêu đề; vắng = 3. */
export type SdFormGenericHeadingLevel = 2 | 3 | 4;

export interface SdFormGenericHeading extends SdFormGenericElementBase {
  type: 'heading';
  text: string;
  level?: SdFormGenericHeadingLevel;
  rules?: SdFormGenericVisibilityRules;
}

/** Đoạn văn; xuống dòng trong `text` được giữ. */
export interface SdFormGenericParagraph extends SdFormGenericElementBase {
  type: 'paragraph';
  text: string;
  rules?: SdFormGenericVisibilityRules;
}

export interface SdFormGenericQuote extends SdFormGenericElementBase {
  type: 'quote';
  text: string;
  cite?: string;
  rules?: SdFormGenericVisibilityRules;
}

/**
 * Ảnh theo URL. `src` chỉ được dùng khi an toàn (http(s) không kèm credential, đường dẫn tương đối,
 * `data:image/*`); rỗng = chưa đặt. `alt` rỗng nghĩa là ảnh trang trí. `width` tính bằng px, tối đa bề
 * rộng ô.
 */
export interface SdFormGenericImage extends SdFormGenericElementBase {
  type: 'image';
  src: string;
  alt: string;
  width?: number;
  caption?: string;
  rules?: SdFormGenericVisibilityRules;
}

/**
 * Liên kết. `href` chỉ được dùng khi an toàn (http(s) không kèm credential, đường dẫn tương đối cùng
 * origin, `mailto:`, `tel:`); không an toàn hoặc rỗng thì chỉ hiện chữ.
 */
export interface SdFormGenericLink extends SdFormGenericElementBase {
  type: 'link';
  text: string;
  href: string;
  /** Mở tab mới (luôn kèm `rel="noopener noreferrer"`). */
  newTab?: boolean;
  rules?: SdFormGenericVisibilityRules;
}

export interface SdFormGenericDivider extends SdFormGenericElementBase {
  type: 'divider';
  rules?: SdFormGenericVisibilityRules;
}

export type SdFormGenericNoticeColor = 'info' | 'success' | 'warning' | 'error';

/** Hộp thông báo (`sd-inform`); vắng `color` = `info`. */
export interface SdFormGenericNotice extends SdFormGenericElementBase {
  type: 'notice';
  text: string;
  title?: string;
  color?: SdFormGenericNoticeColor;
  rules?: SdFormGenericVisibilityRules;
}

export type SdFormGenericStatic =
  | SdFormGenericHeading
  | SdFormGenericParagraph
  | SdFormGenericQuote
  | SdFormGenericImage
  | SdFormGenericLink
  | SdFormGenericDivider
  | SdFormGenericNotice;

export type SdFormGenericStaticType = SdFormGenericStatic['type'];

/**
 * `submit`: chạy `validate()`, chỉ phát `(sdAction)` khi hợp lệ. `reset`: đưa value về giá trị consumer nạp
 * gần nhất. `custom`: phát `name` ngay, hoặc như submit khi `validate: true`.
 */
export type SdFormGenericButtonAction = 'submit' | 'reset' | 'custom';

/** Kiểu của `sd-button`. */
export type SdFormGenericButtonVariant = 'fill' | 'light' | 'outline' | 'text';

export type SdFormGenericButtonAlign = 'start' | 'center' | 'end' | 'stretch';

/** Điều kiện của button: ẩn/hiện và vô hiệu. */
export interface SdFormGenericButtonRules extends SdFormGenericVisibilityRules {
  disabled?: Filter;
}

/** Nút hành động. Renderer không gọi API: consumer xử lý `(sdAction)`. */
export interface SdFormGenericButton extends SdFormGenericElementBase {
  type: 'button';
  label: string;
  /** Tên icon Material đặt trước nhãn. */
  icon?: string;
  action: SdFormGenericButtonAction;
  /** Bắt buộc với `custom`: action được phát. Không được là `submit` hay `reset`. */
  name?: string;
  /** Chỉ có hiệu lực với `custom`: `true` thì chạy như submit. */
  validate?: boolean;
  /** Vắng: `fill` cho submit, `light` cho reset và custom. */
  variant?: SdFormGenericButtonVariant;
  /** Vắng: `primary` cho submit, `secondary` cho reset và custom. */
  color?: Color;
  /** Vắng: `start`; `stretch` chiếm hết ô. */
  align?: SdFormGenericButtonAlign;
  disabled?: boolean;
  /** Ở `[viewed]` mọi button bị ẩn, trừ button bật cờ này (vd "In"). */
  showWhenViewed?: boolean;
  rules?: SdFormGenericButtonRules;
}

/** Payload của `(sdAction)` của `<sd-form-render>`. */
export interface SdFormGenericAction {
  /** `submit`, `reset`, hoặc `name` của button custom. */
  action: 'submit' | 'reset' | (string & {});
  /** `null` khi gọi `submit()` / `reset()` từ code. */
  buttonId: string | null;
  /** Object value lúc chạy action (chưa có kết quả upload — gọi `upload()` trước khi lưu). */
  value: Readonly<Record<string, unknown>>;
  /** Thông báo của validation cấp form khi action đã validate; `null` khi không validate. */
  messages: SdFormGenericValidationMessages | null;
}

/** Kết quả của `submit()`. */
export interface SdFormGenericSubmitResult {
  valid: boolean;
  messages: SdFormGenericValidationMessages;
  value: Readonly<Record<string, unknown>>;
}
