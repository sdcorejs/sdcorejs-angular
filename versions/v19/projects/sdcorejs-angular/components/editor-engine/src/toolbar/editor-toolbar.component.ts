import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SdButton, SdButtonItem, SdButtonItemDivider } from '@sdcorejs/angular/components/button';
import { I18nService } from '@sdcorejs/angular/i18n';
import type { ChainedCommands } from '@tiptap/core';
import type { Mark, Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection, type SelectionBookmark, type Transaction } from '@tiptap/pm/state';
import { SdEditorEngine } from '../engine/editor-engine';
import { SdEditorButtonDirective } from './editor-button.directive';

type Action =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'subscript'
  | 'superscript'
  | 'undo'
  | 'redo'
  | 'paragraph'
  | 'heading'
  | 'bullet'
  | 'ordered'
  | 'left'
  | 'center'
  | 'right'
  | 'justify'
  | 'insert-table'
  | 'row-before'
  | 'row-after'
  | 'delete-row'
  | 'column-before'
  | 'column-after'
  | 'delete-column'
  | 'merge-cells'
  | 'split-cell'
  | 'delete-table';
type Popup = 'link' | 'color' | 'font';

@Component({
  selector: 'sd-editor-toolbar',
  standalone: true,
  imports: [SdButton, SdButtonItem, SdButtonItemDivider, SdEditorButtonDirective],
  templateUrl: './editor-toolbar.component.html',
  styleUrl: './editor-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdEditorToolbar {
  readonly engine = input<SdEditorEngine | null>(null);
  readonly variant = input<'full' | 'compact'>('full');
  readonly revision = input(0);
  readonly sourceVersion = input(0);
  readonly uploadEnabled = input(false);
  readonly requestFiles = output<void>();
  readonly #i18n = inject(I18nService);
  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #document = inject(DOCUMENT);
  private static nextPopupId = 0;
  readonly popupErrorId = `sd-editor-popup-error-${SdEditorToolbar.nextPopupId++}`;
  readonly popupElement = viewChild<ElementRef<HTMLElement>>('popup');
  readonly popupField = viewChild<ElementRef<HTMLInputElement>>('popupField');
  readonly focusedId = signal('bold');
  readonly popup = signal<Popup | null>(null);
  readonly popupValue = signal('');
  readonly popupError = signal('');
  readonly popupComposing = signal(false);
  readonly marks = ['bold', 'italic', 'underline'] as const;
  readonly additionalMarks = ['strike', 'code', 'subscript', 'superscript'] as const;
  readonly icons = {
    bold: 'format_bold',
    italic: 'format_italic',
    underline: 'format_underlined',
    strike: 'strikethrough_s',
    code: 'code',
    subscript: 'subscript',
    superscript: 'superscript',
    undo: 'undo',
    redo: 'redo',
    bullet: 'format_list_bulleted',
    ordered: 'format_list_numbered',
    left: 'format_align_left',
    center: 'format_align_center',
    right: 'format_align_right',
    justify: 'format_align_justify',
  } as const;
  readonly levels = [1, 2, 3, 4, 5, 6] as const;
  readonly sizes = ['10', '11', '12', '14', '16', '18', '20'];
  readonly alignments = ['left', 'center', 'right', 'justify'] as const;
  readonly tableActions = [
    'insert-table',
    'row-before',
    'row-after',
    'delete-row',
    'column-before',
    'column-after',
    'delete-column',
    'merge-cells',
    'split-cell',
    'delete-table',
  ] as const;
  readonly imageWidths = ['25%', '50%', '75%', '100%'] as const;
  #bookmark: SelectionBookmark | null = null;
  #storedMarks: readonly Mark[] | null = null;
  #range: { from: number; to: number } | null = null;
  #trigger: HTMLButtonElement | null = null;
  #bookmarkGeneration: number | null = null;

  constructor() {
    effect(onCleanup => {
      const engine = this.engine();
      if (!engine) return;
      const transaction = ({ transaction: tr }: { transaction: Transaction }): void => {
        if (!this.#bookmark || !this.#range || !tr.docChanged) return;
        const from = tr.mapping.mapResult(this.#range.from, 1);
        const to = tr.mapping.mapResult(this.#range.to, -1);
        if (from.deletedAcross || to.deletedAcross) {
          this.close(false);
          return;
        }
        this.#range = { from: from.pos, to: to.pos };
        this.#bookmark = this.#bookmark.map(tr.mapping);
      };
      engine.editor.on('transaction', transaction);
      onCleanup(() => engine.editor.off('transaction', transaction));
    });
    effect(() => {
      this.sourceVersion();
      untracked(() => this.close(false));
    });
    effect(() => {
      this.revision();
      const editable = this.engine()?.editor.isEditable;
      if (!editable) untracked(() => this.close(false));
    });
    afterRenderEffect(() => {
      if (this.popup()) this.popupField()?.nativeElement.focus();
    });
    afterRenderEffect(() => {
      this.revision();
      this.variant();
      this.reconcileNavigation();
    });
    afterRenderEffect(onCleanup => {
      const win = this.#document.defaultView;
      if (!win || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.reconcileNavigation());
      observer.observe(this.#element.nativeElement);
      onCleanup(() => observer.disconnect());
    });
    const outside = (event: Event): void => {
      if (!this.popup()) return;
      const target = event.target as Node | null;
      if (target && !this.popupElement()?.nativeElement.contains(target) && !this.#trigger?.contains(target)) this.close(false);
    };
    this.#document.addEventListener?.('pointerdown', outside);
    inject(DestroyRef).onDestroy(() => {
      this.#document.removeEventListener?.('pointerdown', outside);
      this.close(false);
    });
  }

  t(key: string, params?: Record<string, string | number>): string {
    return this.#i18n.t(`core.component.editor.toolbar.${key}`, params);
  }
  cancelLabel(): string {
    return this.#i18n.t('core.common.cancel');
  }
  alignmentIcon(): string {
    this.revision();
    const editor = this.engine()?.editor;
    return this.icons[this.alignments.find(alignment => editor?.isActive({ textAlign: alignment })) ?? 'left'];
  }
  choiceTooltip(key: string, attribute: 'fontSize' | 'fontFamily' | 'color'): string {
    const value = this.choiceValue(attribute);
    return value ? `${this.t(key)}: ${value}` : this.t(key);
  }
  available(): boolean {
    this.revision();
    return !!this.engine()?.editor.isEditable && !this.engine()?.editor.view.composing;
  }

  active(action: string): boolean | 'mixed' | undefined {
    this.revision();
    const editor = this.engine()?.editor;
    if (!editor || !['bold', 'italic', 'underline', 'strike', 'code', 'subscript', 'superscript', 'bullet', 'ordered'].includes(action))
      return undefined;
    const name = action === 'bullet' ? 'bulletList' : action === 'ordered' ? 'orderedList' : action;
    if (editor.isActive(name)) return true;
    if (editor.state.selection.empty || action === 'bullet' || action === 'ordered') return false;
    let has = false;
    let lacks = false;
    editor.state.doc.nodesBetween(editor.state.selection.from, editor.state.selection.to, node => {
      if (node.isText) {
        if (node.marks.some(mark => mark.type.name === name)) has = true;
        else lacks = true;
      }
    });
    return has && lacks ? 'mixed' : false;
  }

  can(action: Action, value?: number): boolean {
    if (!this.available()) return false;
    try {
      return this.command(this.engine()!.editor.can().chain(), action, value).run();
    } catch {
      return false;
    }
  }

  canStyle(kind: Popup): boolean {
    if (!this.available()) return false;
    const chain = this.engine()!.editor.can().chain();
    if (kind === 'link') return chain.setLink({ href: 'https://example.invalid' }).run();
    if (kind === 'font') return chain.setFontFamily('serif').run();
    return chain.setColor('black').run();
  }

  canSize(size: string): boolean {
    return this.available() && this.engine()!.editor.can().setFontSize(`${size}px`);
  }

  execute(action: Action, value?: number): void {
    if (!this.can(action, value)) return;
    if (!this.restore()) return;
    this.command(this.engine()!.editor.chain().focus(), action, value).run();
    this.#bookmark = null;
  }

  private command(chain: ChainedCommands, action: Action, value?: number): ChainedCommands {
    switch (action) {
      case 'bold':
        return chain.toggleBold();
      case 'italic':
        return chain.toggleItalic();
      case 'underline':
        return chain.toggleUnderline();
      case 'strike':
        return chain.toggleStrike();
      case 'code':
        return chain.toggleCode();
      case 'subscript':
        return chain.toggleSubscript();
      case 'superscript':
        return chain.toggleSuperscript();
      case 'undo':
        return chain.undo();
      case 'redo':
        return chain.redo();
      case 'paragraph':
        return chain.setParagraph();
      case 'heading':
        return chain.toggleHeading({ level: value as 1 | 2 | 3 | 4 | 5 | 6 });
      case 'bullet':
        return chain.toggleBulletList();
      case 'ordered':
        return chain.toggleOrderedList();
      case 'left':
      case 'center':
      case 'right':
      case 'justify':
        return chain.setTextAlign(action);
      case 'insert-table':
        return chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
      case 'row-before':
        return chain.addRowBefore();
      case 'row-after':
        return chain.addRowAfter();
      case 'delete-row':
        return chain.deleteRow();
      case 'column-before':
        return chain.addColumnBefore();
      case 'column-after':
        return chain.addColumnAfter();
      case 'delete-column':
        return chain.deleteColumn();
      case 'merge-cells':
        return chain.mergeCells();
      case 'split-cell':
        return chain.splitCell();
      case 'delete-table':
        return chain.deleteTable();
    }
  }

  capture(): void {
    const editor = this.engine()?.editor;
    if (!editor || !editor.isEditable || this.popup()) return;
    this.#bookmark = editor.state.selection.getBookmark();
    this.#bookmarkGeneration = this.engine()!.generation;
    this.#storedMarks = editor.state.storedMarks;
    this.#range = { from: editor.state.selection.from, to: editor.state.selection.to };
  }

  private restore(): boolean {
    const editor = this.engine()?.editor;
    if (!editor?.isEditable || editor.view.composing) return false;
    if (this.#bookmark && this.#bookmarkGeneration !== this.engine()!.generation) {
      this.close(false);
      return false;
    }
    if (this.#bookmark) {
      try {
        editor.view.dispatch(editor.state.tr.setSelection(this.#bookmark.resolve(editor.state.doc)).setStoredMarks(this.#storedMarks));
      } catch {
        this.close(false);
        return false;
      }
    }
    return true;
  }

  rememberFocus(id: string): void {
    this.focusedId.set(id);
    if (!this.popup()) this.capture();
  }

  private reconcileNavigation(): void {
    const controls = Array.from(
      this.#element.nativeElement.querySelectorAll<HTMLButtonElement>('button[data-editor-control]:not(:disabled)')
    ).filter(button => button.getClientRects().length > 0);
    const current = controls.find(button => button.dataset['editorControl'] === this.focusedId());
    if (!current && controls[0]) this.focusedId.set(controls[0].dataset['editorControl']!);
  }

  navigate(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.isComposing || this.popupElement()?.nativeElement.contains(event.target as Node)) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const controls = Array.from(
      this.#element.nativeElement.querySelectorAll<HTMLButtonElement>('button[data-editor-control]:not(:disabled)')
    ).filter(button => button.getClientRects().length > 0);
    const current = controls.indexOf(event.target as HTMLButtonElement);
    if (current < 0 || !controls.length) return;
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? controls.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + controls.length) % controls.length;
    event.preventDefault();
    controls[index].focus();
  }

  choiceValue(attribute: 'fontSize' | 'fontFamily' | 'color'): string {
    this.revision();
    const editor = this.engine()?.editor;
    if (!editor) return '';
    if (!editor.state.selection.empty) {
      const values = new Set<string>();
      editor.state.doc.nodesBetween(editor.state.selection.from, editor.state.selection.to, node => {
        if (node.isText) values.add(String(node.marks.find(mark => mark.type.name === 'textStyle')?.attrs[attribute] ?? ''));
      });
      if (values.size > 1) return this.t('mixed');
    }
    return String(editor.getAttributes('textStyle')[attribute] ?? '');
  }

  setSize(size: string): void {
    if (!this.canSize(size) || !this.restore()) return;
    this.engine()!.editor.chain().focus().setFontSize(`${size}px`).run();
    this.#bookmark = null;
  }

  open(kind: Popup, triggerId: string): void {
    if (!this.canStyle(kind)) return;
    if (!this.#bookmark) this.capture();
    this.#trigger = this.#element.nativeElement.querySelector<HTMLButtonElement>(`button[data-editor-control="${triggerId}"]`);
    const editor = this.engine()!.editor;
    const value =
      kind === 'link' ? editor.getAttributes('link')['href'] : editor.getAttributes('textStyle')[kind === 'font' ? 'fontFamily' : 'color'];
    this.popupValue.set(String(value ?? ''));
    this.popupError.set('');
    this.popupComposing.set(false);
    this.popup.set(kind);
  }

  apply(event?: Event): void {
    event?.preventDefault();
    const kind = this.popup();
    if (!kind || !this.available() || this.popupComposing()) return;
    let value = this.popupValue().trim();
    if (kind === 'link' && value) {
      if (!/^[a-z][a-z\d+.-]*:/i.test(value)) value = `https://${value}`;
      try {
        if (!['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(value).protocol)) throw new Error();
      } catch {
        this.popupError.set(this.t('invalid-link'));
        return;
      }
    }
    if (kind === 'font' && value && !/^[\p{L}\p{N}\s,'".-]+$/u.test(value)) {
      this.popupError.set(this.t('invalid-style'));
      return;
    }
    if (
      kind === 'color' &&
      value &&
      (typeof CSS === 'undefined' || !CSS.supports('color', value) || /[();@\\]|url|var\s*\(/i.test(value))
    ) {
      // rgb() is legitimate CSS, but custom color entry deliberately accepts plain named/hex values only.
      this.popupError.set(this.t('invalid-style'));
      return;
    }
    if (!this.restore()) return;
    const chain = this.engine()!.editor.chain().focus();
    if (kind === 'link') {
      if (this.engine()!.editor.isActive('link')) chain.extendMarkRange('link');
      if (value) chain.setLink({ href: value, target: '_blank', rel: 'noopener noreferrer' });
      else chain.unsetLink();
    }
    if (kind === 'font') {
      if (value) chain.setFontFamily(value);
      else chain.unsetFontFamily();
    }
    if (kind === 'color') {
      if (value) chain.setColor(value);
      else chain.unsetColor();
    }
    chain.run();
    this.close(false);
  }

  close(restoreFocus: boolean): void {
    const trigger = this.#trigger;
    this.popup.set(null);
    this.popupComposing.set(false);
    this.popupError.set('');
    this.#bookmark = null;
    this.#storedMarks = null;
    this.#range = null;
    this.#trigger = null;
    this.#bookmarkGeneration = null;
    if (restoreFocus && this.engine()?.editor.isEditable) {
      const destination =
        trigger?.isConnected && !trigger.disabled && trigger.getClientRects().length
          ? trigger
          : this.#element.nativeElement.querySelector<HTMLButtonElement>('button[data-editor-control="more"]:not(:disabled)');
      destination?.focus();
    }
  }

  popupKeydown(event: KeyboardEvent): void {
    if (event.isComposing || this.popupComposing()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  chooseFiles(): void {
    if (this.available() && this.uploadEnabled() && this.restore()) {
      this.requestFiles.emit();
      this.#bookmark = null;
    }
  }

  selectedImage(): boolean {
    this.revision();
    const selection = this.engine()?.editor.state.selection;
    return selection instanceof NodeSelection && ['image', 'inlineImage'].includes(selection.node.type.name);
  }

  resizeImage(width: '25%' | '50%' | '75%' | '100%' | null): boolean {
    if (width !== null && !this.imageWidths.includes(width)) return false;
    return this.imageGeometry((image, imageAttributes, figure) => {
      if (width === null) {
        // Explicit user reset to intrinsic dimensions, rather than a cached prior resize.
        image.removeProperty('width');
        image.removeProperty('height');
        delete imageAttributes['width'];
        delete imageAttributes['height'];
        if (figure) {
          figure.width = 'fit-content';
          figure.maxWidth = '100%';
        }
      } else {
        image.width = figure ? '100%' : width;
        image.height = 'auto';
        if (figure) {
          figure.width = width;
          figure.maxWidth = '100%';
        }
      }
    }, width === null);
  }

  alignImage(alignment: 'left' | 'center' | 'right'): boolean {
    if (!['left', 'center', 'right'].includes(alignment)) return false;
    return this.imageGeometry((image, _attributes, figure) => {
      const style = figure ?? image;
      style.display = 'block';
      style.cssFloat = 'none';
      style.marginLeft = alignment === 'left' ? '0' : 'auto';
      style.marginRight = alignment === 'right' ? '0' : 'auto';
    });
  }

  private imageGeometry(
    change: (image: CSSStyleDeclaration, attributes: Record<string, string>, figure: CSSStyleDeclaration | null) => void,
    resetDimensions = false
  ): boolean {
    if (!this.available() || !this.restore()) return false;
    const editor = this.engine()!.editor;
    const selection = editor.state.selection;
    if (!(selection instanceof NodeSelection) || !['image', 'inlineImage'].includes(selection.node.type.name)) return false;
    let figure: { node: ProseMirrorNode; position: number } | null = null;
    const parent = selection.$from.parent;
    if (parent.type.name === 'figure') {
      let images = 0;
      let otherContent = false;
      parent.forEach(node => {
        if (node.type.name === 'image') images++;
        else if (node.type.name !== 'figcaption') otherContent = true;
      });
      if (images === 1 && !otherContent) figure = { node: parent, position: selection.$from.before(selection.$from.depth) };
    }
    const imageAttributes = { ...selection.node.attrs['sdAttributes'] } as Record<string, string>;
    const imageStyle = this.#document.createElement('span').style;
    imageStyle.cssText = imageAttributes['style'] ?? '';
    const figureAttributes = figure ? ({ ...figure.node.attrs['sdAttributes'] } as Record<string, string>) : null;
    const figureStyle = figure ? this.#document.createElement('span').style : null;
    if (figureStyle) figureStyle.cssText = figureAttributes!['style'] ?? '';
    change(imageStyle, imageAttributes, figureStyle);
    if (imageStyle.cssText) imageAttributes['style'] = imageStyle.cssText;
    else delete imageAttributes['style'];
    const nodeAttributes: Record<string, unknown> = { ...selection.node.attrs, sdAttributes: imageAttributes };
    if (resetDimensions) {
      // The installed image schema may declare native dimensions as well as preserved HTML attrs.
      for (const key of ['width', 'height']) if (Object.prototype.hasOwnProperty.call(nodeAttributes, key)) nodeAttributes[key] = null;
    }
    const transaction = editor.state.tr.setNodeMarkup(selection.from, undefined, nodeAttributes);
    if (figure && figureStyle && figureAttributes) {
      if (figureStyle.cssText) figureAttributes['style'] = figureStyle.cssText;
      else delete figureAttributes['style'];
      transaction.setNodeMarkup(figure.position, undefined, { ...figure.node.attrs, sdAttributes: figureAttributes });
    }
    transaction.setSelection(NodeSelection.create(transaction.doc, selection.from));
    const expected = transaction.doc;
    editor.view.dispatch(transaction);
    const applied = editor.state.doc.eq(expected);
    this.#bookmark = null;
    if (applied) this.engine()!.focus();
    return applied;
  }
}
