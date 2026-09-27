/**
 * Bộ lọc HTML đầu ra của `sd-editor` / `sd-mini-editor` theo allowlist.
 *
 * why: HTML do editor phát ra đi thẳng vào form value, event và thường được consumer render lại
 * bằng `innerHTML` hoặc lưu xuống DB. Nội dung dán vào (hoặc giá trị ban đầu từ server) có thể
 * mang `<a href="javascript:...">`, `<img src=x onerror=...>`, `data:text/html`... Hàm này chỉ giữ
 * lại thẻ, thuộc tính và scheme URL nằm trong allowlist, và fail closed với mọi thứ khác.
 *
 * Chính sách URL ở đây tách riêng khỏi `sdIsSafeResourceUrl`: link trong nội dung được phép
 * `mailto:`/`tel:`, còn tài nguyên tải xuống thì không.
 */
import { SD_NON_BROWSER_ORIGIN, sdParseUrl } from './url-safety';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
// why: dùng số thay cho `Node.ELEMENT_NODE` để không phụ thuộc global `Node` ngoài trình duyệt.
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/** Thẻ được giữ (theo output của CKEditor 5: đoạn văn, định dạng inline, list, bảng, ảnh, link). */
const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'dd',
  'del',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'ins',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'q',
  's',
  'small',
  'span',
  'strike',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
]);

/**
 * Thẻ bị bỏ CẢ nội dung. Thẻ lạ khác chỉ bị gỡ vỏ (giữ phần text bên trong).
 *
 * why: nhóm raw-text (`script`, `style`, `xmp`, `noscript`...) là nơi mọi kiểu mXSS dựa vào — nội
 * dung của chúng được serialize KHÔNG escape, nên nếu chỉ gỡ vỏ thì text bên trong có thể thành
 * markup thật ở lần parse sau. Form control và SVG động (`use`, `animate*`, `set`, `foreignObject`)
 * là các vector đã biết. So khớp theo tên viết thường, bất kể namespace.
 */
const DROP_WITH_CONTENT = new Set([
  'animate',
  'animatecolor',
  'animatemotion',
  'animatetransform',
  'applet',
  'base',
  'button',
  'datalist',
  'embed',
  'form',
  'frame',
  'frameset',
  'iframe',
  'input',
  'keygen',
  'link',
  'meta',
  'noembed',
  'noframes',
  'noscript',
  'object',
  'optgroup',
  'option',
  'output',
  'plaintext',
  'script',
  'select',
  'set',
  'foreignobject',
  'style',
  'template',
  'textarea',
  'title',
  'use',
  'xmp',
]);

/** Thuộc tính không mang URL, giữ nguyên giá trị. `data-*` và `aria-*` xử lý riêng. */
const PLAIN_ATTRIBUTES = new Set([
  'align',
  'alt',
  'class',
  'colspan',
  'datetime',
  'dir',
  'headers',
  'height',
  'id',
  'lang',
  // why: plugin upload ảnh của sd-editor tự gắn `loading="lazy"` (option `imageConfig.lazyLoad`);
  // bỏ đi là làm hỏng chính tính năng của thư viện. Không mang URL hay script.
  'loading',
  'rel',
  'reversed',
  'rowspan',
  'scope',
  // why: CKEditor phát `sizes` cùng `srcset` cho ảnh responsive. Không mang URL hay script.
  'sizes',
  'start',
  'style',
  'target',
  'title',
  'width',
]);

const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
// why: `blob:` là ảnh chờ upload ở chế độ `uploadMode: 'deferred'` của sd-editor — do chính app tạo
// ra (cùng origin), không chạy được script khi nằm trong `<img>`.
const IMAGE_PROTOCOLS = new Set(['http:', 'https:', 'blob:']);
const DATA_IMAGE = /^image\/[a-z0-9.+-]+\s*[;,]/i;

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const parseAgainstFixedBase = (value: string): URL | undefined => sdParseUrl(value, SD_NON_BROWSER_ORIGIN);

/** `href`/`cite`: http, https, mailto, tel, URL tương đối, `#fragment`. */
const isSafeLinkUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.startsWith('#')) return true;
  // why: URL tương đối resolve theo base cố định nên thừa hưởng `http:`; chỉ scheme là quan trọng.
  const parsed = parseAgainstFixedBase(trimmed);
  return parsed != null && LINK_PROTOCOLS.has(parsed.protocol);
};

/** `src` và từng ứng viên của `srcset`: http, https, blob, URL tương đối, `data:image/*`. */
const isSafeImageUrl = (value: string): boolean => {
  const parsed = parseAgainstFixedBase(value);
  if (!parsed) return false;
  if (IMAGE_PROTOCOLS.has(parsed.protocol)) return true;
  return parsed.protocol === 'data:' && DATA_IMAGE.test(parsed.pathname);
};

const isSpace = (char: string): boolean => char === ' ' || char === '\t' || char === '\n' || char === '\f' || char === '\r';

/**
 * Tách URL của từng ứng viên trong `srcset`, theo thuật toán parse của HTML: URL là chuỗi không có
 * khoảng trắng (nên `data:` chứa dấu phẩy vẫn nguyên vẹn), descriptor kết thúc ở dấu phẩy ngoài ngoặc.
 */
const srcsetUrls = (value: string): string[] => {
  const urls: string[] = [];
  let i = 0;
  while (i < value.length) {
    while (i < value.length && (isSpace(value[i]) || value[i] === ',')) i++;
    if (i >= value.length) break;
    const start = i;
    while (i < value.length && !isSpace(value[i])) i++;
    let url = value.slice(start, i);
    if (url.endsWith(',')) {
      url = url.replace(/,+$/, '');
    } else {
      let depth = 0;
      while (i < value.length) {
        const char = value[i++];
        if (char === '(') depth++;
        else if (char === ')') depth = Math.max(0, depth - 1);
        else if (char === ',' && depth === 0) break;
      }
    }
    if (url) urls.push(url);
  }
  return urls;
};

const isAllowedAttribute = (tag: string, name: string, value: string): boolean => {
  if (name.startsWith('data-') || name.startsWith('aria-')) return true;
  switch (name) {
    case 'href':
    case 'cite':
      return isSafeLinkUrl(value);
    case 'src':
      return isSafeImageUrl(value);
    case 'srcset': {
      const urls = srcsetUrls(value);
      return urls.length > 0 && urls.every(isSafeImageUrl);
    }
    case 'type':
      return tag === 'ol';
    case 'contenteditable':
      // why: span mention của sd-mini-editor mang `contenteditable="false"`; giá trị khác thì bỏ.
      return value.trim().toLowerCase() === 'false';
    default:
      return PLAIN_ATTRIBUTES.has(name);
  }
};

interface SanitizeState {
  removed: boolean;
}

const sanitizeAttributes = (element: Element, tag: string, state: SanitizeState): void => {
  for (const attribute of Array.from(element.attributes)) {
    if (!isAllowedAttribute(tag, attribute.name.toLowerCase(), attribute.value)) {
      element.removeAttributeNode(attribute);
      state.removed = true;
    }
  }
};

const sanitizeChildren = (parent: Node, state: SanitizeState): void => {
  let node = parent.firstChild;
  while (node) {
    const next = node.nextSibling;
    if (node.nodeType === ELEMENT_NODE) {
      sanitizeElement(node as Element, state);
    } else if (node.nodeType !== TEXT_NODE) {
      // Comment, processing instruction, CDATA.
      parent.removeChild(node);
      state.removed = true;
    }
    node = next;
  }
};

const sanitizeElement = (element: Element, state: SanitizeState): void => {
  const tag = element.localName.toLowerCase();
  if (DROP_WITH_CONTENT.has(tag)) {
    element.remove();
    state.removed = true;
    return;
  }
  if (element.namespaceURI !== HTML_NAMESPACE || !ALLOWED_TAGS.has(tag)) {
    // why: gỡ vỏ nhưng giữ nội dung đã lọc. Phần tử SVG/MathML luôn bị gỡ vỏ (kể cả khi trùng tên
    // với thẻ HTML được phép, như `a` của SVG) để output không còn chuyển namespace.
    sanitizeChildren(element, state);
    const parent = element.parentNode;
    if (parent) {
      while (element.firstChild) parent.insertBefore(element.firstChild, element);
    }
    element.remove();
    state.removed = true;
    return;
  }
  sanitizeAttributes(element, tag, state);
  sanitizeChildren(element, state);
};

const parseHtml = (parser: DOMParser, html: string): Document => parser.parseFromString(html, 'text/html');

/**
 * Lọc HTML đầu ra của editor theo allowlist.
 *
 * - Thẻ ngoài allowlist bị gỡ vỏ (giữ text); nhóm nguy hiểm (`script`, `style`, `iframe`, form
 *   control, SVG động...) bị bỏ cả nội dung. Comment bị bỏ.
 * - Thuộc tính ngoài allowlist bị bỏ, kể cả mọi `on*`, `srcdoc`, `formaction`, `xlink:href`.
 * - `href`: http, https, mailto, tel, tương đối, `#fragment`. `src`/`srcset`: http, https, blob,
 *   tương đối, `data:image/*`.
 * - Nội dung đã sạch và ở dạng chuẩn (như output CKEditor) được trả NGUYÊN chuỗi đầu vào, không
 *   serialize lại; hàm idempotent.
 * - Không có `DOMParser` (SSR): trả text đã escape HTML — fail closed.
 */
export function sdSanitizeEditorHtml(html: string | null | undefined): string {
  if (typeof html !== 'string' || html === '') return '';
  if (typeof DOMParser === 'undefined') return escapeHtml(html);

  const parser = new DOMParser();
  const doc = parseHtml(parser, html);
  const state: SanitizeState = { removed: false };
  // why: parser đưa `<meta>`, `<link>`, `<style>`, `<base>`... đứng đầu chuỗi vào `<head>`, và gộp
  // thuộc tính của `<body>`/`<html>` (vd `<body onload=...>`) vào phần tử có sẵn. Không duyệt
  // `body` là không thấy, nên coi như đã bị bỏ để bắt buộc serialize lại.
  if (doc.head?.childNodes.length || doc.body.attributes.length || doc.documentElement.attributes.length) {
    state.removed = true;
  }
  sanitizeChildren(doc.body, state);

  let output = doc.body.innerHTML;
  if (!state.removed && output === html) return html;

  // why: gỡ vỏ có thể tạo ra cây mà parser không bao giờ sinh (vd `<p>` chứa `<div>` sau khi gỡ
  // `<math>`). Parse lại tới khi ổn định để chuỗi trả về là điểm bất động -> hàm idempotent. Output
  // chỉ còn thẻ/thuộc tính đã cho phép nên parse lại không sinh thêm thứ gì mới.
  for (let round = 0; round < 3; round++) {
    const again = parseHtml(parser, output).body.innerHTML;
    if (again === output) break;
    output = again;
  }
  return output;
}
