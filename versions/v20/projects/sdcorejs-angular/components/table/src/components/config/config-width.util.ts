// why: độ rộng cột là chuỗi CSS tự do ('120px', '20%', '12rem'). Modal chỉ sửa được px bằng số; mọi đơn vị khác hiện
// nguyên văn. Một số trần cũng coi là px, vì đó là cái người dùng gõ vào ô số.
const PX_WIDTH = /^\s*(\d+(?:\.\d+)?)\s*(?:px)?\s*$/i;

/** The px value of a width, `undefined` when it is empty or uses another unit. */
export const configWidthPx = (value: string | null | undefined): number | undefined => {
  const match = PX_WIDTH.exec(value ?? '');
  return match ? Number(match[1]) : undefined;
};

// A number as an `<input type="number">` may hold it: sign, decimals, exponent, optional px.
const NUMBER_INPUT = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?\s*(?:px)?$/i;

/**
 * What the width field stores: a positive number becomes `${n}px`, zero or a negative number and an empty field become
 * `undefined`, anything else (`20%`, `12rem`) stays verbatim.
 */
export const configWidthFromInput = (value: unknown): string | undefined => {
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  if (!NUMBER_INPUT.test(text)) return text;
  const px = Number(text.replace(/px$/i, '').trim());
  return Number.isFinite(px) && px > 0 ? `${px}px` : undefined;
};

/** Rounds a px width and keeps it inside the px `minWidth` / `maxWidth`; bounds in another unit cannot be compared. */
export const configWidthClamp = (width: string | undefined, min: string | undefined, max: string | undefined): string | undefined => {
  const px = configWidthPx(width);
  if (px === undefined) return width;
  const low = configWidthPx(min);
  const high = configWidthPx(max);
  let value = Math.round(px);
  if (low !== undefined) value = Math.max(value, low);
  if (high !== undefined) value = Math.min(value, high);
  return `${value}px`;
};
