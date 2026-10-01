/**
 * Chèn chuỗi của người dùng (nhãn, key) vào message hiển thị như HTML — `SdConfirmService` render
 * message bằng `innerHTML` (đã sanitize, nhưng thẻ vẫn được vẽ). Toast của `SdNotifyService` là text
 * thuần (trừ khi `html: true`) nên KHÔNG escape message của toast.
 */
export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);
