/**
 * Tìm kiếm không phân biệt dấu / hoa-thường cho tiếng Việt, kèm vị trí khớp trên chuỗi GỐC.
 *
 * why: các chỗ highlight cũ (vd pipe `highLightSearch` của layout) bỏ dấu cả chuỗi rồi dựng
 * `new RegExp(keyword)` từ input người dùng. Ký tự như `(`, `[`, `*` làm RegExp ném lỗi hoặc khớp
 * sai, và index trên chuỗi đã bỏ dấu chỉ trùng với chuỗi gốc khi mỗi ký tự giữ nguyên độ dài. Ở đây
 * chuẩn hoá theo từng code point, giữ bảng map về index gốc, và so khớp bằng `indexOf` — không có
 * RegExp nào được dựng từ input.
 */

/** Dấu kết hợp (combining diacritical marks) — đủ cho mọi dấu tiếng Việt và dấu Latin thông dụng. */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** Một đoạn khớp trên chuỗi gốc: `[start, end)` theo index UTF-16. */
export interface SdHighlightRange {
  /** Index bắt đầu (bao gồm) trên chuỗi gốc. */
  start: number;
  /** Index kết thúc (không bao gồm) trên chuỗi gốc. */
  end: number;
}

interface NormalizedText {
  value: string;
  /** Với mỗi đơn vị UTF-16 của `value`: index bắt đầu của code point gốc sinh ra nó. */
  starts: number[];
  /** Với mỗi đơn vị UTF-16 của `value`: index kết thúc (không bao gồm) của code point gốc. */
  ends: number[];
}

const normalizeCodePoint = (codePoint: string): string => {
  // why: fast path cho ASCII — phần lớn text là ASCII, không cần NFD.
  if (codePoint.length === 1 && codePoint.charCodeAt(0) < 0x80) return codePoint.toLowerCase();
  // why: hạ chữ thường TRƯỚC khi tách dấu, vì `toLowerCase()` có thể sinh thêm dấu kết hợp
  // (vd 'İ' -> 'i' + U+0307); 'đ' không có dạng tách nên phải thay tay.
  // @i18n-ignore — 'đ' là dữ liệu của thuật toán, không phải chữ hiển thị.
  return codePoint.toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '').replace(/đ/g, 'd');
};

const normalizeWithMap = (text: string): NormalizedText => {
  let value = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  // Vị trí (trong `starts`/`ends`) của nhóm đơn vị do code point hiển thị gần nhất sinh ra.
  let lastGroupStart = -1;
  // why: `for...of` duyệt theo code point, nên một cặp surrogate (emoji…) không bao giờ bị cắt đôi.
  for (const codePoint of text) {
    const start = offset;
    offset += codePoint.length;
    const normalized = normalizeCodePoint(codePoint);
    if (!normalized) {
      // why: code point chỉ là dấu kết hợp (text ở dạng NFD). Gộp nó vào ký tự đứng trước, để đoạn
      // khớp không tách dấu khỏi chữ cái của nó khi render.
      for (let i = lastGroupStart; i >= 0 && i < ends.length; i++) ends[i] = offset;
      continue;
    }
    lastGroupStart = starts.length;
    for (let i = 0; i < normalized.length; i++) {
      starts.push(start);
      ends.push(offset);
    }
    value += normalized;
  }
  return { value, starts, ends };
};

/**
 * Chuẩn hoá chuỗi để so khớp: chữ thường, bỏ dấu (kể cả đ/Đ -> d), giữ nguyên khoảng trắng và ký
 * tự khác. `null`/`undefined` trả `''`.
 *
 * @example sdNormalizeSearchText('Đà Nẵng') // 'da nang'
 */
export function sdNormalizeSearchText(value: string | null | undefined): string {
  if (typeof value !== 'string' || !value) return '';
  return normalizeWithMap(value).value;
}

/**
 * Tìm mọi đoạn khớp (không chồng nhau, trái sang phải) của `term` trong `text`, không phân biệt
 * dấu và hoa-thường. Kết quả là index trên chuỗi GỐC, dùng trực tiếp để cắt `text`.
 *
 * - `term` được trim; term rỗng (hoặc chỉ có khoảng trắng / chỉ có dấu) trả `[]`.
 * - Ký tự đặc biệt của RegExp (`.`, `*`, `(`…) được so như ký tự thường.
 * - Không bao giờ ném lỗi.
 *
 * @example sdFindHighlightRanges('Nguyễn Văn Đức', 'duc') // [{ start: 11, end: 14 }]
 */
export function sdFindHighlightRanges(text: string | null | undefined, term: string | null | undefined): SdHighlightRange[] {
  if (typeof text !== 'string' || typeof term !== 'string' || !text) return [];
  const needle = sdNormalizeSearchText(term.trim());
  if (!needle) return [];

  const { value, starts, ends } = normalizeWithMap(text);
  const ranges: SdHighlightRange[] = [];
  let from = 0;
  while (from <= value.length - needle.length) {
    const index = value.indexOf(needle, from);
    if (index < 0) break;
    const start = starts[index];
    const end = ends[index + needle.length - 1];
    const previous = ranges[ranges.length - 1];
    // why: một code point có thể nở thành nhiều đơn vị (vd âm tiết Hangul tách jamo), nên hai lần
    // khớp liên tiếp có thể rơi vào cùng một code point gốc — gộp lại để không render trùng text.
    if (previous && start < previous.end) {
      previous.end = Math.max(previous.end, end);
    } else {
      ranges.push({ start, end });
    }
    from = index + needle.length;
  }
  return ranges;
}
