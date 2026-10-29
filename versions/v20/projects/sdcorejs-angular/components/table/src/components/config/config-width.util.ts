// why: độ rộng cột là chuỗi CSS tự do ('120px', '20%', '12rem'). Modal chỉ sửa được px bằng số; mọi đơn vị khác hiện
// nguyên văn. Một số trần cũng coi là px, vì đó là cái người dùng gõ vào ô số.
const PX_WIDTH = /^\s*(\d+(?:\.\d+)?)\s*(?:px)?\s*$/i;

/** The px value of a width, `undefined` when it is empty or uses another unit. */
export const configWidthPx = (value: string | null | undefined): number | undefined => {
  const match = PX_WIDTH.exec(value ?? '');
  return match ? Number(match[1]) : undefined;
};

/** What the width field stores: a number becomes `${n}px`, empty becomes `undefined`, anything else stays verbatim. */
export const configWidthFromInput = (value: unknown): string | undefined => {
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  const px = configWidthPx(text);
  return px === undefined ? text : `${px}px`;
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
