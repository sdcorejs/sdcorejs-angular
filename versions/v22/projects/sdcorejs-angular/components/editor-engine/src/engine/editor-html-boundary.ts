import { sdSanitizeEditorHtml } from '@sdcorejs/angular/utilities/extensions';
import { Tokenizer, TokenizerMode } from 'parse5';
import { SdEditorImportDiagnostic } from './editor-engine.models';

const SAFE_CSS = new Set([
  'text-align',
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
  'vertical-align',
  'white-space',
  'border',
  'border-width',
  'border-style',
  'border-color',
  'border-collapse',
  'table-layout',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'width',
  'height',
  'max-width',
  'float',
  'display',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
]);
// Includes Core sanitizer DROP_WITH_CONTENT categories, document metadata and
// foreign namespaces. Safe unsupported wrappers remain original-preserving.
const ACTIVE_TAGS =
  'animate,animatecolor,animatemotion,animatetransform,applet,base,button,datalist,embed,form,frame,frameset,iframe,input,keygen,link,meta,noembed,noframes,noscript,object,optgroup,option,output,plaintext,script,select,set,foreignobject,style,template,textarea,title,use,xmp,svg,math';
const ACTIVE_TAG_NAMES = new Set(ACTIVE_TAGS.split(','));
export function sdEditorSemanticHtml(html: string): string {
  const root = new DOMParser().parseFromString(html, 'text/html').documentElement;
  const aliases: Record<string, string> = { b: 'strong', i: 'em' };
  const blocks = new Set([
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'hr',
    'ul',
    'ol',
    'li',
    'table',
    'tbody',
    'thead',
    'tfoot',
    'tr',
    'td',
    'th',
    'figure',
    'figcaption',
    'caption',
    'colgroup',
    'div',
    'dl',
    'dt',
    'dd',
  ]);
  const contentNodes = (el: Element): ChildNode[] =>
    Array.from(el.childNodes).filter(node => {
      if (
        node.nodeType !== 3 ||
        node.textContent?.trim() ||
        ['pre', 'code', 'p', 'span', 'figcaption'].includes(el.localName) ||
        /^(pre|pre-wrap|break-spaces)$/.test((el as HTMLElement).style?.whiteSpace ?? '')
      )
        return true;
      const previous = node.previousSibling;
      const next = node.nextSibling;
      const isBlock = (sibling: ChildNode | null) => sibling?.nodeType === 1 && blocks.has((sibling as Element).localName);
      return !((!previous || isBlock(previous)) && (!next || isBlock(next)) && (previous || next));
    });
  const walk = (node: Node): unknown => {
    if (node.nodeType === 3) return ['text', node.textContent];
    if (node.nodeType !== 1) return null;
    const el = node as HTMLElement;
    const tag = aliases[el.localName] ?? el.localName;
    const attrs = Array.from(el.attributes)
      .filter(attr => !(['colspan', 'rowspan'].includes(attr.name) && attr.value === '1'))
      .map(attr => {
        if (attr.name !== 'style') return [attr.name, attr.value];
        const style = Array.from(el.style)
          .sort()
          .map(key => `${key}:${el.style.getPropertyValue(key).trim()}:${el.style.getPropertyPriority(key)}`)
          .join(';');
        return ['style', style];
      })
      .filter(attr => attr[0] !== 'style' || attr[1] !== '')
      .sort((a, b) => a[0].localeCompare(b[0]));
    let children = contentNodes(el)
      .map(walk)
      .filter(item => item !== null);
    // Browser inserts tbody; a cell/list item's sole unstyled paragraph is the same inline flow.
    if (tag === 'table')
      children = contentNodes(el)
        .flatMap(child => (child.nodeName === 'TBODY' && !(child as Element).attributes.length ? contentNodes(child as Element) : [child]))
        .map(walk)
        .filter(item => item !== null);
    if (
      ['td', 'th', 'li'].includes(tag) &&
      el.children.length === 1 &&
      el.childNodes.length === 1 &&
      el.firstElementChild?.localName === 'p' &&
      !el.firstElementChild.attributes.length
    )
      children = Array.from(el.firstElementChild.childNodes)
        .map(walk)
        .filter(item => item !== null);
    if (
      tag === 'li' &&
      el.firstElementChild?.localName === 'p' &&
      !el.firstElementChild.attributes.length &&
      Array.from(el.children)
        .slice(1)
        .every(child => ['ul', 'ol'].includes(child.localName)) &&
      el.firstChild === el.firstElementChild
    )
      children = [...Array.from(el.firstElementChild.childNodes), ...Array.from(el.childNodes).slice(1)]
        .map(walk)
        .filter(item => item !== null);
    return [tag, attrs, children];
  };
  return JSON.stringify(walk(root));
}

export function sdEditorHtmlBoundary(source: string): { html: string; diagnostics: SdEditorImportDiagnostic[] } {
  const diagnostics: SdEditorImportDiagnostic[] = [];
  const original = new DOMParser().parseFromString(source, 'text/html');
  let html = sdSanitizeEditorHtml(source);
  const safe = new DOMParser().parseFromString(html, 'text/html');
  const add = (code: SdEditorImportDiagnostic['code'], detail: string, path = '/', tag?: string, attribute?: string) =>
    diagnostics.push({ code, detail, path, tag, attribute });
  const sourcePath = (el: Element): string => {
    if (el === original.documentElement) return '/html';
    if (el === original.head) return '/html/head';
    if (el === original.body) return '/html/body';
    const siblings = Array.from(el.parentElement?.children ?? []).filter(sibling => sibling.localName === el.localName);
    return `${el.parentElement ? sourcePath(el.parentElement) : ''}/${el.localName}[${siblings.indexOf(el) + 1}]`;
  };
  for (const el of [original.documentElement, original.head, original.body])
    for (const attribute of Array.from(el.attributes))
      add(
        'unsupported-html',
        'Document envelope attributes are not represented by the editor schema.',
        `${sourcePath(el)}/@${attribute.name}`,
        el.localName,
        attribute.name
      );
  for (const el of Array.from(original.querySelectorAll(ACTIVE_TAGS)))
    add('unsafe-html', 'Active or raw-text elements were removed before mounting.', sourcePath(el), el.localName);
  // Inspect actual parsed attributes. Raw pattern matching also catches harmless
  // handler spelling inside quoted title values and comments.
  for (const el of Array.from(original.querySelectorAll('*')))
    for (const attribute of Array.from(el.attributes))
      if (/^on|^(srcdoc|formaction|xlink:href)$/i.test(attribute.name))
        add('unsafe-html', 'Active attributes are prohibited.', `${sourcePath(el)}/@${attribute.name}`, el.localName, attribute.name);
  // Diagnose tokens DOMParser discards without treating comment/attribute text
  // as markup. The pinned HTML tokenizer handles ordinary and bogus comments,
  // end-tag attributes and raw-text states. DOMParser and Core's sanitizer own
  // all mounted markup; tokens only classify the unchanged source contract.
  let sourceComment = false;
  const sourceTokens = new Tokenizer(
    {},
    {
      onComment: () => {
        sourceComment = true;
      },
      onDoctype: () => add('unsupported-html', 'Document types are not represented by the editor schema.'),
      onStartTag: token => {
        const name = token.tagName.toLowerCase();
        if (!original.getElementsByTagName(name).length) {
          const active = ACTIVE_TAG_NAMES.has(name);
          add(
            active ? 'unsafe-html' : 'unsupported-html',
            active ? 'The browser parser discarded an active source element.' : 'The browser parser discarded a source element.',
            '/',
            name
          );
        }
        if (name === 'script') sourceTokens.state = TokenizerMode.SCRIPT_DATA;
        else if (name === 'title' || name === 'textarea') sourceTokens.state = TokenizerMode.RCDATA;
        else if (name === 'plaintext') sourceTokens.state = TokenizerMode.PLAINTEXT;
        else if (['style', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript'].includes(name)) sourceTokens.state = TokenizerMode.RAWTEXT;
      },
      onEndTag: token => {
        if (token.attrs.length)
          add('unsupported-html', 'Closing-tag attributes are not represented by the editor schema.', '/', token.tagName);
      },
      onEof: () => {},
      onCharacter: () => {},
      onNullCharacter: () => {},
      onWhitespaceCharacter: () => {},
    }
  );
  sourceTokens.write(source, true);
  // Reuse Core's URL policy on a known allowed probe, independently of wrapper survival.
  for (const el of Array.from(original.querySelectorAll('*')))
    for (const name of ['href', 'cite', 'src', 'srcset']) {
      const value = el.getAttribute(name);
      if (value == null) continue;
      const probe = original.createElement(name === 'src' || name === 'srcset' ? 'img' : 'a');
      probe.setAttribute(name, value);
      const checked = new DOMParser().parseFromString(sdSanitizeEditorHtml(probe.outerHTML), 'text/html').body.firstElementChild;
      if (checked?.getAttribute(name) !== value)
        add('unsafe-html', 'The source URL violates the Core sanitizer URL policy.', `${sourcePath(el)}/@${name}`, el.localName, name);
    }
  if (sdEditorSemanticHtml(source) !== sdEditorSemanticHtml(html))
    add('unsupported-html', 'The sanitizer changed source elements, attributes or text.');
  if (sourceComment || original.createTreeWalker(original, NodeFilter.SHOW_COMMENT).nextNode())
    add('unsupported-html', 'Comments are not represented by the editor schema.');
  const inspectCss = (el: HTMLElement, path: string, sanitize: boolean): void => {
    const css = el.getAttribute('style');
    if (css != null) {
      const active = /url\s*\(|expression\s*\(|var\s*\(|@|\\|[<>]/i.test(css);
      if (active) {
        add('unsafe-html', 'Active or escaped CSS values are prohibited.', path, el.localName, 'style');
        if (sanitize) el.removeAttribute('style');
        return;
      }
      const declared = css
        .split(';')
        .filter(part => part.trim())
        .map(part => part.split(':')[0].trim().toLowerCase());
      for (const name of declared) {
        if (!SAFE_CSS.has(name) || !el.style.getPropertyValue(name)) {
          add('unsupported-html', `Unsupported CSS property or value: ${name}.`, path, el.localName, 'style');
          if (sanitize) el.style.removeProperty(name);
        }
      }
      for (const name of Array.from(el.style)) {
        const value = el.style.getPropertyValue(name);
        if (/[a-z-]+\s*\(/i.test(value) && !/^(?:rgba?|hsla?)\([\d\s.,%+-]+\)$/i.test(value.trim())) {
          add('unsafe-html', 'CSS functions are not supported.', path, el.localName, 'style');
          if (sanitize) el.style.removeProperty(name);
        }
      }
    }
  };
  // Inspect source CSS before sanitization can discard envelope or unknown-element styles.
  for (const el of Array.from(original.querySelectorAll<HTMLElement>('[style]'))) inspectCss(el, `${sourcePath(el)}/@style`, false);
  for (const [index, el] of Array.from(safe.body.querySelectorAll<HTMLElement>('[style]')).entries())
    inspectCss(el, `/html/body/${el.localName}[${index + 1}]/@style`, true);
  html = safe.body.innerHTML;
  return { html, diagnostics };
}
