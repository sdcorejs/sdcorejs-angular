/**
 * Vị trí nhãn của một form control Core.
 *
 * - `'float'` (mặc định): floating label của Material nằm trong viền `mat-form-field`. Đây là
 *   hành vi lịch sử của mọi control — KHÔNG đổi.
 * - `'top'`: nhãn tĩnh (`<label for>` thật) đặt phía trên control, luôn hiển thị; placeholder
 *   chỉ là placeholder (không còn tự lấy nhãn làm placeholder); helper text hiện thành dòng
 *   gợi ý phía dưới control và được liên kết `aria-describedby`, bị thay bằng thông báo lỗi khi
 *   control lỗi.
 *
 * why: form-generic (builder/renderer) cần nhãn rời phía trên control mà không đổi mặc định của
 * toàn bộ thư viện. Đây là API additive — control nào không truyền vẫn là `'float'`.
 */
export type SdLabelPlacement = 'float' | 'top';
