const parseStyle = (style: string): Map<string, string> => {
  const map = new Map<string, string>();
  for (const decl of style.split(';')) {
    const colon = decl.indexOf(':');
    if (colon === -1) continue;
    const key = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (key && value) map.set(key, value);
  }
  return map;
};

const serializeStyle = (map: Map<string, string>): string =>
  [...map.entries()].map(([k, v]) => `${k}:${v}`).join(';');

export const countTextLength = (content: string): number => {
  if (!content) return 0;
  const doc = new DOMParser().parseFromString(content, 'text/html');
  doc.querySelectorAll('img, figure').forEach(el => el.remove());
  return doc.body.textContent?.length ?? 0;
};

export const imageClassesToInlineStyles = (html: string): string => {
  if (!html) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('figure.image').forEach(figure => {
    const styleMap = parseStyle(figure.getAttribute('style') || '');
    const classList = figure.classList;
    const hasResizeWidth = styleMap.has('width') && /\d/.test(styleMap.get('width')!);

    styleMap.set('display', 'block');
    styleMap.set('max-width', '100%');

    if (classList.contains('image-style-align-left')) {
      if (hasResizeWidth && styleMap.get('width') === '100%') {
        styleMap.delete('float');
        styleMap.set('margin', '0 auto 0 0');
      } else {
        styleMap.set('float', 'left');
        styleMap.set('margin', '0 1em 0 0');
      }
    } else if (classList.contains('image-style-align-right')) {
      if (hasResizeWidth && styleMap.get('width') === '100%') {
        styleMap.delete('float');
        styleMap.set('margin', '0 0 0 auto');
      } else {
        styleMap.set('float', 'right');
        styleMap.set('margin', '0 0 0 1em');
      }
    } else if (classList.contains('image-style-block-align-left')) {
      styleMap.delete('float');
      styleMap.set('margin', '0 auto 0 0');
    } else if (classList.contains('image-style-block-align-right')) {
      styleMap.delete('float');
      styleMap.set('margin', '0 0 0 auto');
    } else {
      styleMap.delete('float');
      styleMap.set('margin', '0 auto');
    }

    if (!hasResizeWidth) styleMap.set('width', 'fit-content');
    figure.setAttribute('style', serializeStyle(styleMap));

    if (hasResizeWidth) {
      const img = figure.querySelector('img');
      if (img) {
        const imgStyle = parseStyle(img.getAttribute('style') || '');
        imgStyle.set('width', '100%');
        imgStyle.set('height', 'auto');
        img.setAttribute('style', serializeStyle(imgStyle));
      }
    }
  });

  return doc.body.innerHTML;
};
