/**
 * Document Builder Utilities
 * CÃ¡c hÃ m tiá»‡n Ã­ch cho document builder
 */

import { hslToHex, rgbToHex } from '@sdcorejs/angular/utilities';

/**
 * Chuáº©n hÃ³a ná»™i dung báº±ng cÃ¡ch chuyá»ƒn Ä‘á»•i táº¥t cáº£ mÃ u HSL vÃ  RGB sang hex
 * @param content - Ná»™i dung HTML cáº§n chuáº©n hÃ³a
 * @returns Ná»™i dung Ä‘Ã£ Ä‘Æ°á»£c chuáº©n hÃ³a vá»›i mÃ u hex
 */
export function normalize(content: string): string {
  let normalized = content;

  // Chuyá»ƒn Ä‘á»•i HSL sang hex
  const hslRegex = /hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/gi;
  normalized = normalized.replace(hslRegex, (match, h, s, l) => {
    try {
      const hue = parseInt(h, 10);
      const saturation = parseInt(s, 10);
      const lightness = parseInt(l, 10);

      // Kiá»ƒm tra giÃ¡ trá»‹ há»£p lá»‡
      if (hue >= 0 && hue <= 360 && saturation >= 0 && saturation <= 100 && lightness >= 0 && lightness <= 100) {
        return hslToHex(hue, saturation, lightness);
      }
    } catch (error) {
      console.warn('Failed to convert HSL to hex:', error, match);
    }

    return match; // Giá»¯ nguyÃªn náº¿u khÃ´ng thá»ƒ chuyá»ƒn Ä‘á»•i
  });

  // Chuyá»ƒn Ä‘á»•i RGB sang hex
  const rgbRegex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi;
  normalized = normalized.replace(rgbRegex, (match, r, g, b) => {
    try {
      const red = parseInt(r, 10);
      const green = parseInt(g, 10);
      const blue = parseInt(b, 10);

      if (red >= 0 && red <= 255 && green >= 0 && green <= 255 && blue >= 0 && blue <= 255) {
        return rgbToHex(red, green, blue);
      }
    } catch (error) {
      console.warn('Failed to convert RGB to hex:', error, match);
    }

    return match;
  });

  return normalized;
}

