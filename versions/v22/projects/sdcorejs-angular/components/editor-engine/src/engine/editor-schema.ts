import { AnyExtension, Extension, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Markdown } from '@tiptap/markdown';
import { TextStyle, Color, BackgroundColor, FontFamily, FontSize } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions';

const PRESERVED = /^(id|title|dir|lang|class|style|data-.+|aria-.+|cite|type|reversed|loading|width|height|srcset|sizes|headers|scope)$/;
function renderPreserved(attrs: Record<string, unknown>, nativeStyles: readonly string[] = []): Record<string, string> {
  const preserved = { ...(attrs['sdAttributes'] as Record<string, string>) };
  if (preserved['style'] && nativeStyles.length) {
    const element = document.createElement('span');
    element.setAttribute('style', preserved['style']);
    for (const property of nativeStyles) element.style.removeProperty(property);
    const style = element.getAttribute('style');
    if (style) preserved['style'] = style;
    else delete preserved['style'];
  }
  return preserved;
}
const preservedAttribute = (nativeStyles: readonly string[] = []) => ({
  sdAttributes: {
    default: {},
    parseHTML: (element: HTMLElement) =>
      Object.fromEntries(
        Array.from(element.attributes)
          .filter(attr => PRESERVED.test(attr.name))
          .map(attr => [attr.name, attr.value])
      ),
    renderHTML: (attrs: Record<string, unknown>) => renderPreserved(attrs, nativeStyles),
  },
});
const attributes = Extension.create({
  name: 'sdPreservedAttributes',
  addGlobalAttributes() {
    return [
      { types: ['paragraph', 'heading'], attributes: preservedAttribute(['text-align']) },
      { types: ['textStyle'], attributes: preservedAttribute(['color', 'background-color', 'font-family', 'font-size']) },
      {
        types: [
          'blockquote',
          'codeBlock',
          'horizontalRule',
          'hardBreak',
          'bulletList',
          'orderedList',
          'listItem',
          'table',
          'tableRow',
          'tableCell',
          'tableHeader',
          'image',
          'inlineImage',
          'figure',
          'figcaption',
          'sdMention',
          'bold',
          'italic',
          'underline',
          'strike',
          'code',
          'subscript',
          'superscript',
          'link',
        ],
        attributes: preservedAttribute(),
      },
    ];
  },
});
const span = TextStyle.extend({
  parseHTML: () => [{ tag: 'span', getAttrs: el => ((el as HTMLElement).hasAttribute('data-id') ? false : null) }],
});
const figure = Node.create({
  name: 'figure',
  group: 'block',
  content: '(image | table | figcaption)+',
  defining: true,
  parseHTML: () => [{ tag: 'figure' }],
  renderHTML: ({ HTMLAttributes }) => ['figure', HTMLAttributes, 0],
});
const caption = Node.create({
  name: 'figcaption',
  group: 'block',
  content: 'inline*',
  parseHTML: () => [{ tag: 'figcaption' }],
  renderHTML: ({ HTMLAttributes }) => ['figcaption', HTMLAttributes, 0],
});
const inlineImage = Image.extend({
  name: 'inlineImage',
  priority: 110,
  parseHTML: () => [
    { tag: 'img[src]', context: 'paragraph/' },
    { tag: 'img[src]', context: 'heading/' },
    { tag: 'img[src]', context: 'figcaption/' },
  ],
}).configure({ inline: true, allowBase64: true });
export const sdMentionNode = Node.create({
  name: 'sdMention',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes: () => ({
    id: { default: '', parseHTML: el => el.getAttribute('data-id'), renderHTML: attrs => ({ 'data-id': attrs['id'] }) },
    name: {
      default: '',
      parseHTML: el => {
        const marker = el.getAttribute('data-marker') ?? '@';
        const text = el.textContent ?? '';
        return text.startsWith(marker) ? text.slice(marker.length) : text;
      },
      renderHTML: () => ({}),
    },
    marker: {
      default: '@',
      parseHTML: el => el.getAttribute('data-marker') ?? '@',
      renderHTML: attrs => ({ 'data-marker': attrs['marker'] }),
    },
  }),
  parseHTML: () => [{ tag: 'span[data-id]', priority: 110 }],
  renderHTML: ({ node, HTMLAttributes }) => [
    'span',
    mergeAttributes(HTMLAttributes, { contenteditable: 'false' }),
    `${node.attrs['marker']}${node.attrs['name']}`,
  ],
  renderText: ({ node }) => `${node.attrs['marker']}${node.attrs['name']}`,
});
export function sdEditorExtensions(placeholder: () => string): AnyExtension[] {
  const table = Table.extend({ renderHTML: ({ HTMLAttributes }) => ['table', HTMLAttributes, ['tbody', 0]] }).configure({
    resizable: false,
  });
  return [
    StarterKit.configure({
      trailingNode: false,
      link: { openOnClick: false, autolink: false, linkOnPaste: false, HTMLAttributes: { target: null, rel: null, class: null } },
    }),
    Image.configure({ allowBase64: true }),
    inlineImage,
    table,
    TableRow,
    TableCell,
    TableHeader,
    Subscript,
    Superscript,
    span,
    Color,
    BackgroundColor,
    FontFamily,
    FontSize,
    TextAlign.configure({ types: ['paragraph', 'heading'], defaultAlignment: null }),
    Placeholder.configure({ placeholder }),
    figure,
    caption,
    sdMentionNode,
    attributes,
    Markdown,
  ];
}
