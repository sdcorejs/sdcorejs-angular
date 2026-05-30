/**
 * Document Builder Utilities
 * Các hàm tiện ích cho document builder
 */

import { ColorUtilities } from '@sdcorejs/utils/fns';

/**
 * Chuẩn hóa nội dung bằng cách chuyển đổi tất cả màu HSL và RGB sang hex
 * @param content - Nội dung HTML cần chuẩn hóa
 * @returns Nội dung đã được chuẩn hóa với màu hex
 */
export function normalize(content: string): string {
  let normalized = content;

  // Chuyển đổi HSL sang hex
  const hslRegex = /hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/gi;
  normalized = normalized.replace(hslRegex, (match, h, s, l) => {
    try {
      const hue = parseInt(h, 10);
      const saturation = parseInt(s, 10);
      const lightness = parseInt(l, 10);

      // Kiểm tra giá trị hợp lệ
      if (hue >= 0 && hue <= 360 && saturation >= 0 && saturation <= 100 && lightness >= 0 && lightness <= 100) {
        return ColorUtilities.hslToHex(hue, saturation, lightness);
      }
    } catch (error) {
      console.warn('Failed to convert HSL to hex:', error, match);
    }

    return match; // Giữ nguyên nếu không thể chuyển đổi
  });

  // Chuyển đổi RGB sang hex
  const rgbRegex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi;
  normalized = normalized.replace(rgbRegex, (match, r, g, b) => {
    try {
      const red = parseInt(r, 10);
      const green = parseInt(g, 10);
      const blue = parseInt(b, 10);

      if (red >= 0 && red <= 255 && green >= 0 && green <= 255 && blue >= 0 && blue <= 255) {
        return ColorUtilities.rgbToHex(red, green, blue);
      }
    } catch (error) {
      console.warn('Failed to convert RGB to hex:', error, match);
    }

    return match;
  });

  return normalized;
}
