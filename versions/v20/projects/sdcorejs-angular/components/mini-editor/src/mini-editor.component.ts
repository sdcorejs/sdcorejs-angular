import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output, forwardRef } from '@angular/core';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SdCKEditorStyles } from '@sdcorejs/angular/components/ckeditor-styles';
import {
  Bold,
  ClassicEditor,
  Essentials,
  Italic,
  Link,
  List,
  FontColor,
  Markdown,
  Mention,
  Paragraph,
  Underline,
  Undo,
  Widget,
} from 'ckeditor5';
import { Subject, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { SdMiniEditorOption, SdMiniEditorConfig, SdMiniEditorMentionItem } from './mini-editor.model';

/**
 * Component sd-mini-editor - Editor Ä‘Æ¡n giáº£n cho comment input
 * Sá»­ dá»¥ng CKEditor vá»›i cháº¿ Ä‘á»™ Ä‘Æ¡n giáº£n (bold, italic, link)
 * Há»— trá»£ mention vÃ  output format (html/markdown)
 *
 * @example
 * ```html
 * <sd-mini-editor
 *   [option]="editorOption"
 *   [(ngModel)]="content"
 *   (contentChange)="onContentChange($event)"
 * >
 * </sd-mini-editor>
 * ```
 */
@Component({
  selector: 'sd-mini-editor',
  standalone: true,
  imports: [CommonModule, CKEditorModule, SdCKEditorStyles],
  templateUrl: './mini-editor.component.html',
  styleUrls: ['./mini-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SdMiniEditor),
      multi: true,
    },
  ],
})
export class SdMiniEditor implements ControlValueAccessor {
  /** Cáº¥u hÃ¬nh option cho editor */
  @Input({ required: true }) option!: SdMiniEditorOption;

  @HostBinding('style.--sd-mini-editor-max-height')
  get maxEditorHeight(): string | undefined {
    return this.option?.maxHeight;
  }

  /** NgModel binding - ná»™i dung HTML/Markdown */
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  /** Event emitter khi content thay Ä‘á»•i */
  @Output() contentChange = new EventEmitter<string>();

  /** Event emitter khi blur */
  @Output() blur = new EventEmitter<FocusEvent>();

  /** Event emitter khi focus */
  @Output() focus = new EventEmitter<FocusEvent>();

  /** Disabled state */
  @Input() disabled = false;

  Editor = ClassicEditor;
  #editor!: ClassicEditor;
  #subscription = new Subscription();
  #contentChangeSubject = new Subject<string>();

  // Build editor config dynamically
  get editorConfig(): SdMiniEditorConfig {
    const enableMention = this.option?.enableMention ?? false;
    const useMarkdown = this.option?.outputFormat === 'markdown';
    const plugins: any[] = [Essentials, FontColor, Paragraph, Bold, Italic, Underline, Link, List, Undo, Widget];

    // Add Markdown plugin if outputFormat is markdown
    if (useMarkdown) {
      plugins.push(Markdown);
    }

    // Add Mention plugin if enabled
    if (enableMention) {
      plugins.push(Mention);
    }

    // Build base config
    const config: SdMiniEditorConfig = {
      licenseKey: 'GPL',
      getOption: () => this.option,
      plugins,
      toolbar: {
        items: ['bold', 'italic', 'underline', '|', 'fontColor', '|', 'bulletedList', 'numberedList', '|', 'link'],
        shouldNotGroupWhenFull: true,
      },
      placeholder: this.option?.placeholder,
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
      },
      fontColor: {
        columns: 5,
        documentColors: 10,
        colorPicker: { format: 'hex' },
      },
    };

    // Add mention configuration if enabled
    if (enableMention && this.option?.mentionConfig?.feeds) {
      config.mention = {
        feeds: this.option.mentionConfig.feeds,
      };
    }

    return config;
  }

  constructor() {
    // Setup debounce cho content change
    this.#subscription.add(
      this.#contentChangeSubject.pipe(throttleTime(500, undefined, { leading: true, trailing: true })).subscribe(content => {
        const output = this.#convertOutput(content);
        this.value = output;
        this.#onChange(output);
        this.valueChange.emit(output);
        this.contentChange.emit(output);
        this.option?.onChange?.(output);
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
    this.#editor?.destroy?.();
  }

  /**
   * Kiá»ƒm tra cÃ³ nÃªn enable mention plugin khÃ´ng
   */
  #shouldEnableMention(): boolean {
    return this.option?.enableMention ?? false;
  }

  /**
   * Xá»­ lÃ½ khi editor ready
   */
  onReady(editor: ClassicEditor) {
    this.#editor = editor;

    // Set initial content
    if (this.value) {
      this.setContent(this.value);
    }

    // Láº¯ng nghe sá»± kiá»‡n thay Ä‘á»•i ná»™i dung
    editor.model.document.on('change:data', () => {
      const content = editor.getData();
      this.#contentChangeSubject.next(content);
    });

    // Láº¯ng nghe focus/blur events
    editor.editing.view.document.on('focus', evt => {
      const domEvent = (evt as any).domEvent as FocusEvent;
      this.focus.emit(domEvent);
      this.option?.onFocus?.(domEvent);
    });

    editor.editing.view.document.on('blur', evt => {
      const domEvent = (evt as any).domEvent as FocusEvent;
      this.blur.emit(domEvent);
      this.option?.onBlur?.(domEvent);
    });

    // Láº¯ng nghe sá»± kiá»‡n mention Ä‘Æ°á»£c chá»n
    if (this.#shouldEnableMention()) {
      editor.commands.get('mention')?.on('execute', (_evt, data: any) => {
        const mentionData = data[0];
        this.option?.onMentionSelect?.(mentionData.mention);
        // Trigger content change sau khi insert mention
        const content = editor.getData();
        this.#contentChangeSubject.next(content);
      });

      // Custom downcast converter Ä‘á»ƒ thay Ä‘á»•i cáº¥u trÃºc mention HTML
      editor.conversion.for('downcast').attributeToElement({
        model: 'mention',
        view: (mentionData, { writer }) => {
          const data = mentionData as SdMiniEditorMentionItem;
          const rawId = data?.id || '';
          const marker = rawId[0];
          const cleanId = rawId.slice(1);

          return writer.createAttributeElement('span', {
            class: 'ck-custom-mention',
            'data-id': cleanId,
            'data-marker': marker,
            contenteditable: 'false',
          });
        },
        converterPriority: 'highest',
      });

      // Xá»­ lÃ½ keyboard Ä‘á»ƒ xÃ³a mention 1 láº§n
      editor.editing.view.document.on('keydown', (evt, data) => {
        const keyEvent = data as { keyCode: number; domEvent: KeyboardEvent };
        // Delete (46) hoáº·c Backspace (8)
        if (keyEvent.keyCode === 46 || keyEvent.keyCode === 8) {
          const model = editor.model;
          const selection = model.document.selection;
          const position = selection.getFirstPosition();
          if (!position) return;

          // TÃ¬m text node cÃ³ mention attribute
          const node = position.textNode || position.nodeBefore || position.nodeAfter;
          if (node && node.is('$text')) {
            const mentionAttr = node.getAttribute('mention');
            if (mentionAttr) {
              // XÃ³a toÃ n bá»™ text node chá»©a mention
              model.change(writer => {
                writer.remove(node);
              });
              evt.stop();
            }
          }
        }
      });
    }
  }

  /**
   * Convert output theo format (html hoáº·c markdown)
   * Khi sá»­ dá»¥ng CKEditor Markdown plugin, getData() tá»± Ä‘á»™ng tráº£ vá» Markdown
   */
  #convertOutput(content: string): string {
    // CKEditor Markdown plugin tá»± Ä‘á»™ng xá»­ lÃ½ conversion
    // KhÃ´ng cáº§n manual conversion ná»¯a
    return content;
  }

  /**
   * Set ná»™i dung cho editor
   */
  setContent(content: string) {
    this.#editor?.setData?.(content);
  }

  /**
   * Get ná»™i dung tá»« editor
   */
  getContent(): string {
    if (this.#editor) {
      const html = this.#editor.getData();
      return this.#convertOutput(html);
    }
    return '';
  }

  /**
   * Get ná»™i dung HTML gá»‘c (khÃ´ng convert)
   */
  getHtmlContent(): string {
    return this.#editor?.getData?.() || '';
  }

  /**
   * Focus vÃ o editor
   */
  focusEditor() {
    this.#editor?.editing?.view?.focus?.();
  }

  /**
   * Insert mention vÃ o vá»‹ trÃ­ con trá» hiá»‡n táº¡i
   */
  insertMention(item: { id: string; name: string; marker?: string }) {
    if (!this.#editor) return;

    const firstFeed = this.option?.mentionConfig?.feeds?.[0];
    const marker = item.marker || (firstFeed as any)?.marker || '@';

    // Sá»­ dá»¥ng CKEditor mention command
    this.#editor.execute('mention', {
      marker,
      mention: {
        id: item.id,
        text: `${marker}${item.name}`,
      },
    });
  }

  /**
   * Get danh sÃ¡ch mentions trong ná»™i dung
   */
  getMentions(): Array<{ id: string; name: string; marker: string }> {
    if (!this.#editor) return [];

    const mentions: Array<{ id: string; name: string; marker: string }> = [];
    const root = this.#editor.model.document.getRoot();
    if (!root) return mentions;

    const range = this.#editor.model.createRangeIn(root);

    for (const item of range.getItems()) {
      if (item.is('$text')) {
        const mentionAttr = item.getAttribute('mention');
        if (mentionAttr) {
          const text = (item as any).data as string;
          const marker = text.charAt(0);
          const name = text.substring(1);
          const id = item.getAttribute('data-user-id') as string;

          mentions.push({ id, name, marker });
        }
      }
    }

    return mentions;
  }

  /**
   * ControlValueAccessor: Write value
   */
  writeValue(value: string): void {
    this.value = value || '';
    if (this.#editor) {
      this.setContent(this.value);
    }
  }

  /**
   * ControlValueAccessor: Register change callback
   */
  registerOnChange(fn: (value: string) => void): void {
    this.#onChange = fn;
  }

  /**
   * ControlValueAccessor: Register touched callback
   */
  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  /** ControlValueAccessor callbacks */
  #onChange: (value: string) => void = () => {};
  #onTouched: () => void = () => {};
}

