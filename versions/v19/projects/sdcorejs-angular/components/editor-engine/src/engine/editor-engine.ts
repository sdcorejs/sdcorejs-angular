import { Editor } from '@tiptap/core';
import { DOMParser as ProseMirrorParser, DOMSerializer, Node as ProseMirrorNode } from '@tiptap/pm/model';
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import {
  SdEditorEngineOptions,
  SdEditorImageAttributes,
  SdEditorImportDiagnostic,
  SdEditorImportError,
  SdEditorMentionFeed,
  SdEditorMentionItem,
} from './editor-engine.models';
import { sdEditorExtensions } from './editor-schema';
import { sdEditorHtmlBoundary, sdEditorSemanticHtml } from './editor-html-boundary';

let nextEngineId = 0;

export class SdEditorEngine {
  readonly editor: Editor;
  private source = '';
  private sourceHtml = '';
  private markdownSourceSnapshot: { value: string; html: string } | undefined;
  private changed = false;
  private requestedEditable: boolean;
  private composing = false;
  private pendingCompositionChange = false;
  private queuedSource: string | undefined;
  private queuedFormat: 'html' | 'markdown' | undefined;
  private applying = false;
  private destroyed = false;
  private sourceGeneration = 0;
  private warnings: readonly SdEditorImportDiagnostic[] = [];
  private readonly editorHost: HTMLElement;
  private readonly preview: HTMLElement;
  private mentionKeys: string[] = [];
  private suggestionPopups = new Set<HTMLElement>();
  private mentionGeneration = 0;
  private readonly popupId = `sd-editor-mention-${++nextEngineId}`;
  private placeholder = '';
  get diagnostics(): readonly SdEditorImportDiagnostic[] {
    return this.warnings;
  }
  get generation(): number {
    return this.sourceGeneration;
  }
  get format(): 'html' | 'markdown' {
    return this.options.format ?? 'html';
  }
  private readonly options: SdEditorEngineOptions;
  constructor(element: HTMLElement, options: SdEditorEngineOptions = {}) {
    this.options = { ...options };
    this.requestedEditable = options.editable !== false;
    this.editorHost = document.createElement('div');
    this.preview = document.createElement('div');
    this.preview.className = 'sd-editor-import-preview';
    this.preview.hidden = true;
    element.append(this.editorHost, this.preview);
    this.editor = new Editor({
      element: this.editorHost,
      extensions: sdEditorExtensions(() => this.placeholder),
      content: '',
      editable: false,
      editorProps: {
        handlePaste: (_view, event) => {
          if (!this.editor.isEditable) return true;
          const html = event.clipboardData?.getData('text/html');
          if (!html) return false;
          const imported = this.inspectHtml(html);
          if (imported.diagnostics.length) {
            this.options.onDiagnostics?.(imported.diagnostics);
            return true;
          }
          return false;
        },
      },
      onUpdate: () => {
        if (this.applying || this.destroyed || this.queuedSource !== undefined) return;
        this.changed = true;
        if (this.composing) this.pendingCompositionChange = true;
        else this.emitChange();
      },
      onTransaction: () => this.options.onStateChange?.(),
    });
    this.editor.registerPlugin(
      new Plugin({
        key: new PluginKey('sdEditorSafeTransactions'),
        filterTransaction: transaction => {
          if (this.applying || !transaction.docChanged) return true;
          if (!this.editor.isEditable || this.destroyed) return false;
          const html = this.serialize(transaction.doc);
          const boundary = sdEditorHtmlBoundary(html);
          if (boundary.diagnostics.length) {
            this.options.onDiagnostics?.(boundary.diagnostics);
            return false;
          }
          if (this.options.format === 'markdown' && !this.markdownRoundTrip(transaction.doc).safe) {
            this.options.onDiagnostics?.([
              { code: 'markdown-loss', path: '/', detail: 'This edit cannot be represented losslessly in Markdown.' },
            ]);
            return false;
          }
          return true;
        },
      })
    );
    this.editor.view.dom.addEventListener('focus', this.onFocus);
    this.editor.view.dom.addEventListener('blur', this.onBlur);
    this.editor.view.dom.addEventListener('compositionstart', this.onCompositionStart);
    this.editor.view.dom.addEventListener('compositionend', this.onCompositionEnd);
    this.editor.view.dom.tabIndex = 0;
    this.setPlaceholder(options.placeholder);
    this.setMentionFeeds(options.mentionFeeds);
    this.applySource(options.content ?? '');
  }
  private readonly onFocus = (event: FocusEvent): void => {
    this.options.onFocus?.(event);
  };
  private readonly onBlur = (event: FocusEvent): void => {
    this.options.onBlur?.(event);
  };
  private readonly onCompositionStart = (): void => {
    this.composing = true;
    this.options.onCompositionStateChange?.(true);
  };
  private readonly onCompositionEnd = (): void => {
    this.composing = false;
    const format = this.queuedFormat;
    this.queuedFormat = undefined;
    try {
      if (this.queuedSource !== undefined) {
        const value = this.queuedSource;
        this.queuedSource = undefined;
        this.pendingCompositionChange = false;
        if (format) this.options.format = format;
        this.applySource(value);
      } else if (format) {
        this.pendingCompositionChange = false;
        this.convertCurrentFormat(format);
      } else if (this.pendingCompositionChange) {
        this.pendingCompositionChange = false;
        if (this.editor.isEditable) this.emitChange();
      }
    } finally {
      this.options.onCompositionStateChange?.(false);
    }
  };
  private serialize(doc: ProseMirrorNode): string {
    const target = document.createElement('div');
    target.append(DOMSerializer.fromSchema(this.editor.schema).serializeFragment(doc.content));
    return target.innerHTML;
  }
  private parseHtml(html: string): ProseMirrorNode {
    const target = document.createElement('template');
    target.innerHTML = html;
    return ProseMirrorParser.fromSchema(this.editor.schema).parse(target.content);
  }
  private inspectHtml(html: string): { html: string; doc: ProseMirrorNode; diagnostics: SdEditorImportDiagnostic[] } {
    const boundary = sdEditorHtmlBoundary(html);
    const doc = this.parseHtml(boundary.html);
    if (boundary.html && sdEditorSemanticHtml(boundary.html) !== sdEditorSemanticHtml(this.serialize(doc)))
      boundary.diagnostics.push({
        code: 'unsupported-html',
        path: '/',
        detail: 'The schema cannot preserve all source nodes, attributes or text.',
      });
    return { ...boundary, doc };
  }
  private applySource(value: string): void {
    this.source = value;
    this.changed = false;
    this.applying = true;
    try {
      const manager = this.editor.storage.markdown.manager;
      const html = this.options.format === 'markdown' ? (manager.instance.parse(value, { async: false }) as string) : value;
      const imported = this.inspectHtml(html);
      if (this.options.format === 'markdown' && !imported.diagnostics.length) {
        if (!this.preservesMarkdownSource(value, imported.doc))
          imported.diagnostics.push({
            code: 'markdown-loss',
            path: '/',
            detail: 'Markdown source cannot preserve its HTML semantics through import and export.',
          });
      }
      this.warnings = imported.diagnostics;
      const unsafe = imported.diagnostics.some(item => item.code === 'unsafe-html');
      // The sanitized preview must never replace the raw safe source used by unchanged getters.
      this.sourceHtml = unsafe ? imported.html : html;
      this.markdownSourceSnapshot = this.options.format === 'markdown' && !unsafe ? { value, html } : undefined;
      this.editor.commands.setContent(imported.doc.toJSON(), { emitUpdate: false });
      // Authoritative imports establish a new document baseline. Suppressing the
      // update event alone still records the import and the superseded document
      // in native history. Keep the same editor and plugins, with fresh state.
      const importedState = this.editor.state;
      this.editor.view.updateState(
        EditorState.create({
          schema: importedState.schema,
          doc: importedState.doc,
          selection: importedState.selection,
          plugins: importedState.plugins,
        })
      );
      if (
        imported.html &&
        sdEditorSemanticHtml(imported.html) !== sdEditorSemanticHtml(this.serialize(this.editor.state.doc)) &&
        !imported.diagnostics.some(item => item.code === 'unsupported-html')
      )
        imported.diagnostics.push({
          code: 'unsupported-html',
          path: '/',
          detail: 'Editor plugins would repair or normalize the source document geometry.',
        });
      this.preview.innerHTML = imported.html;
      this.preview.hidden = !this.warnings.length;
      this.editorHost.hidden = !!this.warnings.length;
      this.refreshEditable();
      this.options.onDiagnostics?.(this.warnings);
    } finally {
      this.applying = false;
    }
  }
  private refreshEditable(): void {
    this.editor.setEditable(this.requestedEditable && !this.warnings.length && this.queuedSource === undefined && !this.destroyed, false);
  }
  setContent(value: string, format?: 'html' | 'markdown'): void {
    if (this.destroyed) return;
    const formatChanged = format !== undefined && format !== (this.queuedFormat ?? this.format);
    if (!formatChanged && ((!this.changed && value === this.source && this.queuedSource === undefined) || value === this.queuedSource))
      return;
    if (!formatChanged && !this.warnings.length && this.changed && value === this.getContent()) {
      this.sourceHtml = this.getHtml();
      this.source = value;
      this.changed = false;
      return;
    }
    if (formatChanged) {
      if (this.composing) this.queuedFormat = format;
      else this.options.format = format;
    }
    this.sourceGeneration++;
    this.options.onSourceChange?.('source');
    this.clearPopups();
    if (this.composing) {
      this.queuedSource = value;
      this.pendingCompositionChange = false;
      this.refreshEditable();
    } else this.applySource(value);
  }
  private assertSafe(): void {
    if (this.warnings.some(item => item.code === 'unsafe-html')) throw new SdEditorImportError(this.warnings);
  }
  getContent(): string {
    this.assertSafe();
    if (this.options.format === 'markdown' && this.warnings.some(item => item.code === 'markdown-loss'))
      throw new SdEditorImportError(this.warnings);
    if (!this.changed) return this.source;
    if (this.options.format === 'markdown') {
      const result = this.markdownRoundTrip(this.editor.state.doc);
      if (!result.safe)
        throw new SdEditorImportError([{ code: 'markdown-loss', path: '/', detail: 'Markdown export would lose document semantics.' }]);
      return result.markdown;
    }
    return this.getHtml();
  }
  getHtml(): string {
    this.assertSafe();
    if (!this.changed && this.options.format !== 'markdown') return this.source;
    if (!this.changed) return this.sourceHtml;
    const html = this.editor.getHTML();
    const boundary = sdEditorHtmlBoundary(html);
    if (boundary.diagnostics.length) throw new SdEditorImportError(boundary.diagnostics);
    return html;
  }
  private markdownRoundTrip(doc: ProseMirrorNode): { safe: boolean; markdown: string } {
    const manager = this.editor.storage.markdown.manager;
    try {
      const markdown = manager.serialize(doc.toJSON());
      const restored = this.editor.schema.nodeFromJSON(manager.parse(markdown));
      return { markdown, safe: sdEditorSemanticHtml(this.serialize(doc)) === sdEditorSemanticHtml(this.serialize(restored)) };
    } catch {
      return { safe: false, markdown: '' };
    }
  }
  private preservesMarkdownSource(value: string, doc: ProseMirrorNode): boolean {
    try {
      const parsed = this.editor.schema.nodeFromJSON(this.editor.storage.markdown.manager.parse(value));
      return sdEditorSemanticHtml(this.serialize(doc)) === sdEditorSemanticHtml(this.serialize(parsed)) && this.markdownRoundTrip(doc).safe;
    } catch {
      return false;
    }
  }
  private emitChange(): void {
    try {
      this.options.onChange?.(this.getContent());
    } catch (error) {
      if (error instanceof SdEditorImportError) this.options.onDiagnostics?.(error.diagnostics);
      else throw error;
    }
  }
  setEditable(value: boolean): void {
    this.requestedEditable = value;
    if (!value) {
      this.sourceGeneration++;
      this.pendingCompositionChange = false;
      this.clearPopups();
      this.options.onSourceChange?.('editable');
    }
    this.refreshEditable();
  }
  setPlaceholder(value: string | undefined): void {
    this.placeholder = value ?? '';
    this.editor.view.dom.setAttribute('data-placeholder', value ?? '');
    this.editor.view.dom.setAttribute('aria-label', value || 'Rich text editor');
    this.editor.view.dispatch(this.editor.state.tr);
  }
  setFormat(value: 'html' | 'markdown'): void {
    if (this.destroyed || this.queuedFormat === value || (this.queuedFormat === undefined && (this.options.format ?? 'html') === value))
      return;
    this.sourceGeneration++;
    this.options.onSourceChange?.('format');
    this.clearPopups();
    if (this.composing) {
      this.queuedFormat = value;
      this.pendingCompositionChange = false;
    } else this.convertCurrentFormat(value);
  }
  private convertCurrentFormat(value: 'html' | 'markdown'): void {
    if (this.warnings.some(item => item.code === 'unsafe-html')) {
      this.options.format = value;
      this.options.onDiagnostics?.(this.warnings);
      this.options.onFormatChange?.(undefined);
      return;
    }
    // Change representation of the current document, without replacing its selection/history.
    const html = this.getHtml();
    const remaining = this.warnings.filter(item => item.code !== 'markdown-loss');
    this.options.format = value;
    this.sourceHtml = html;
    this.source = html;
    this.changed = false;
    if (value === 'markdown') {
      const original = this.markdownSourceSnapshot;
      if (original && sdEditorSemanticHtml(original.html) === sdEditorSemanticHtml(html)) {
        this.source = original.value;
        // Restoring source bytes must also restore the original loss decision.
        // Safe unsupported snapshots remain read-only and original-preserving.
        if (!remaining.length && !this.preservesMarkdownSource(original.value, this.editor.state.doc))
          remaining.push({ code: 'markdown-loss', path: '/', detail: 'The restored Markdown source cannot preserve its HTML semantics.' });
      } else {
        const conversion = this.markdownRoundTrip(this.editor.state.doc);
        if (remaining.length || !conversion.safe)
          remaining.push({
            code: 'markdown-loss',
            path: '/',
            detail: 'The current document cannot be converted to Markdown without losing semantics.',
          });
        else {
          this.source = conversion.markdown;
          this.markdownSourceSnapshot = { value: conversion.markdown, html };
        }
      }
    }
    this.warnings = remaining;
    this.preview.innerHTML = sdEditorHtmlBoundary(html).html;
    this.preview.hidden = !this.warnings.length;
    this.editorHost.hidden = !!this.warnings.length;
    this.refreshEditable();
    this.options.onDiagnostics?.(this.warnings);
    this.notifyFormatChange();
  }
  private notifyFormatChange(): void {
    if (!this.options.onFormatChange) return;
    let value: string | undefined;
    try {
      value = this.getContent();
    } catch (error) {
      if (!(error instanceof SdEditorImportError)) throw error;
    }
    this.options.onFormatChange(value);
  }
  focus(): void {
    if (!this.destroyed && !this.editorHost.hidden) {
      this.editor.commands.focus();
      this.editor.view.dom.focus({ preventScroll: true });
    }
  }
  insertMention(item: { id: string; name: string; marker?: string }): void {
    if (!this.editor.isEditable || !item.id) return;
    this.editor.commands.insertContent({ type: 'sdMention', attrs: { id: item.id, name: item.name, marker: item.marker ?? '@' } });
  }
  getMentions(): { id: string; name: string; marker: string }[] {
    const items: { id: string; name: string; marker: string }[] = [];
    this.editor.state.doc.descendants(node => {
      if (node.type.name === 'sdMention') items.push({ id: node.attrs['id'], name: node.attrs['name'], marker: node.attrs['marker'] });
    });
    return items;
  }
  insertImage(attributes: SdEditorImageAttributes): void {
    this.assertSafe();
    if (!this.editor.isEditable) return;
    const image = document.createElement('img');
    for (const [key, value] of Object.entries(attributes)) if (value != null) image.setAttribute(key, String(value));
    const checked = sdEditorHtmlBoundary(image.outerHTML);
    if (checked.diagnostics.length) throw new SdEditorImportError(checked.diagnostics);
    this.editor.commands.insertContent({
      type: 'image',
      attrs: {
        src: attributes.src,
        alt: attributes.alt ?? null,
        sdAttributes: Object.fromEntries(
          Object.entries(attributes).filter(([key, value]) => key !== 'src' && key !== 'alt' && value != null)
        ),
      },
    });
  }
  activeImageSources(): Set<string> {
    const result = new Set<string>();
    this.editor.state.doc.descendants(node => {
      if (['image', 'inlineImage'].includes(node.type.name)) result.add(node.attrs['src']);
    });
    return result;
  }
  replaceImage(oldSrc: string, attributes: SdEditorImageAttributes): boolean {
    this.assertSafe();
    if (!this.editor.isEditable || this.destroyed) return false;
    const probe = document.createElement('img');
    for (const [key, value] of Object.entries(attributes)) if (value != null) probe.setAttribute(key, String(value));
    const checked = sdEditorHtmlBoundary(probe.outerHTML);
    if (checked.diagnostics.length) throw new SdEditorImportError(checked.diagnostics);
    const transaction = this.editor.state.tr;
    let replaced = false;
    this.editor.state.doc.descendants((node, pos) => {
      if (['image', 'inlineImage'].includes(node.type.name) && node.attrs['src'] === oldSrc) {
        transaction.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          src: attributes.src,
          alt: attributes.alt ?? node.attrs['alt'],
          sdAttributes: {
            ...node.attrs['sdAttributes'],
            ...Object.fromEntries(Object.entries(attributes).filter(([key, value]) => key !== 'src' && key !== 'alt' && value != null)),
          },
        });
        replaced = true;
      }
    });
    if (replaced) this.editor.view.dispatch(transaction);
    return replaced;
  }
  setMentionFeeds(feeds: readonly SdEditorMentionFeed[] | undefined): void {
    this.mentionGeneration++;
    for (const key of this.mentionKeys) this.editor.unregisterPlugin(key);
    this.mentionKeys = [];
    this.clearPopups();
    for (const [index, feed] of (feeds ?? []).entries()) {
      if (!feed.marker || (feed as unknown as { itemRenderer?: unknown }).itemRenderer) {
        this.options.onDiagnostics?.([
          { code: 'invalid-option', path: `/mentionFeeds/${index}`, detail: 'A marker is required; CK itemRenderer is unsupported.' },
        ]);
        continue;
      }
      const key = `sdMentionFeed${index}`;
      this.mentionKeys.push(key);
      let popup: HTMLElement | undefined;
      let selected = 0;
      let choose: ((index: number) => void) | undefined;
      const remove = () => {
        if (popup && this.editor.view.dom.getAttribute('aria-controls') === popup.id) {
          this.editor.view.dom.removeAttribute('aria-controls');
          this.editor.view.dom.removeAttribute('aria-activedescendant');
        }
        popup?.remove();
        if (popup) this.suggestionPopups.delete(popup);
        popup = undefined;
      };
      this.editor.registerPlugin(
        Suggestion<SdEditorMentionItem>({
          editor: this.editor,
          pluginKey: new PluginKey(key),
          char: feed.marker,
          allow: ({ state, range }) =>
            this.editor.isEditable && range.to - range.from - feed.marker.length >= (feed.minimumCharacters ?? 0),
          items: async ({ query }) => {
            const generation = this.sourceGeneration;
            const mentionGeneration = this.mentionGeneration;
            let supplied: readonly (string | SdEditorMentionItem)[];
            try {
              supplied = typeof feed.feed === 'function' ? await feed.feed(query) : feed.feed;
            } catch {
              if (!this.destroyed && generation === this.sourceGeneration && mentionGeneration === this.mentionGeneration)
                this.options.onDiagnostics?.([{ code: 'invalid-option', path: `/mentionFeeds/${index}`, detail: 'Mention feed failed.' }]);
              return [];
            }
            if (this.destroyed || generation !== this.sourceGeneration || mentionGeneration !== this.mentionGeneration) return [];
            return supplied
              .map(item => (typeof item === 'string' ? { id: item, name: item } : item))
              .filter(item => item.id && (item.name ?? item.text ?? item.id).toLowerCase().includes(query.toLowerCase()))
              .slice(0, feed.dropdownLimit ?? 10);
          },
          command: ({ editor, range, props }) => {
            if (
              editor
                .chain()
                .focus()
                .insertContentAt(range, [
                  { type: 'sdMention', attrs: { id: props.id, name: props.name ?? props.text ?? props.id, marker: feed.marker } },
                  { type: 'text', text: ' ' },
                ])
                .run()
            )
              this.options.onMentionSelect?.(props);
          },
          render: () => {
            const render = (props: {
              items: SdEditorMentionItem[];
              command: (item: SdEditorMentionItem) => void;
              clientRect?: (() => DOMRect | null) | null;
            }) => {
              remove();
              if (!props.items.length) return;
              popup = document.createElement('div');
              popup.id = `${this.popupId}-${key}-${this.sourceGeneration}`;
              popup.setAttribute('role', 'listbox');
              popup.setAttribute('aria-label', this.options.mentionLabel?.() ?? 'Mention suggestions');
              popup.className = 'sd-editor-mention-list';
              this.editor.view.dom.setAttribute('aria-controls', popup.id);
              selected = 0;
              choose = position => {
                const item = props.items[position];
                if (item) props.command(item);
                remove();
              };
              props.items.forEach((item, position) => {
                const option = document.createElement('div');
                option.id = `${popup!.id}-option-${position}`;
                option.setAttribute('role', 'option');
                option.setAttribute('aria-selected', String(position === selected));
                option.textContent = item.name ?? item.text ?? item.id;
                option.addEventListener('pointerdown', event => {
                  event.preventDefault();
                  choose?.(position);
                });
                popup!.append(option);
              });
              this.editor.view.dom.setAttribute('aria-activedescendant', `${popup.id}-option-0`);
              document.body.append(popup);
              this.suggestionPopups.add(popup);
              const rect = props.clientRect?.();
              if (rect) {
                const currentPopup = popup;
                const generation = this.sourceGeneration;
                void computePosition({ getBoundingClientRect: () => rect }, popup, {
                  placement: 'bottom-start',
                  strategy: 'fixed',
                  middleware: [offset(4), flip(), shift({ padding: 12 })],
                })
                  .then(({ x, y }) => {
                    if (!this.destroyed && generation === this.sourceGeneration && popup === currentPopup && currentPopup.isConnected) {
                      currentPopup.style.position = 'fixed';
                      currentPopup.style.left = `${x}px`;
                      currentPopup.style.top = `${y}px`;
                    }
                  })
                  .catch(() => remove());
              }
            };
            return {
              onStart: render,
              onUpdate: render,
              onExit: remove,
              onKeyDown: ({ event }) => {
                if (event.key === 'Escape') {
                  remove();
                  return true;
                }
                if (!popup) return false;
                if (event.key === 'Enter') {
                  choose?.(selected);
                  return true;
                }
                if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
                  selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + popup.children.length) % popup.children.length;
                  Array.from(popup.children).forEach((child, position) =>
                    child.setAttribute('aria-selected', String(position === selected))
                  );
                  this.editor.view.dom.setAttribute('aria-activedescendant', `${popup.id}-option-${selected}`);
                  return true;
                }
                if (event.key === 'Tab') remove();
                return false;
              },
            };
          },
        }),
        (plugin, plugins) => [plugin, ...plugins]
      );
    }
  }
  private clearPopups(): void {
    for (const popup of this.suggestionPopups) popup.remove();
    this.suggestionPopups.clear();
    this.editor.view.dom.removeAttribute('aria-controls');
    this.editor.view.dom.removeAttribute('aria-activedescendant');
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sourceGeneration++;
    this.queuedSource = undefined;
    this.queuedFormat = undefined;
    this.pendingCompositionChange = false;
    this.clearPopups();
    this.editor.view.dom.removeEventListener('focus', this.onFocus);
    this.editor.view.dom.removeEventListener('blur', this.onBlur);
    this.editor.view.dom.removeEventListener('compositionstart', this.onCompositionStart);
    this.editor.view.dom.removeEventListener('compositionend', this.onCompositionEnd);
    this.editor.destroy();
    this.editorHost.remove();
    this.preview.remove();
  }
}
