/**
 * Color Utilities Extension
 * Các tiện ích xử lý màu
 */

/**
 * Chuyển đổi màu HSL sang định dạng hex
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Mã màu hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  // Chuyển đổi sang định dạng 0-1
  const hNormalized = h / 360;
  const sNormalized = s / 100;
  const lNormalized = l / 100;

  let r: number, g: number, b: number;

  if (sNormalized === 0) {
    // Màu xám (grayscale)
    r = g = b = lNormalized;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = lNormalized < 0.5 
      ? lNormalized * (1 + sNormalized) 
      : lNormalized + sNormalized - lNormalized * sNormalized;
    const p = 2 * lNormalized - q;

    r = hue2rgb(p, q, hNormalized + 1/3);
    g = hue2rgb(p, q, hNormalized);
    b = hue2rgb(p, q, hNormalized - 1/3);
  }

  // Chuyển đổi sang hex
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Chuyển đổi màu RGB sang hex
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Mã màu hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (x: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
