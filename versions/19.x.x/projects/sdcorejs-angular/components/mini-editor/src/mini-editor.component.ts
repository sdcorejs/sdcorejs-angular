import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
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
 * Component sd-mini-editor - Editor đơn giản cho comment input
 * Sử dụng CKEditor với chế độ đơn giản (bold, italic, link)
 * Hỗ trợ mention và output format (html/markdown)
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
  imports: [CommonModule, CKEditorModule],
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
  /** Cấu hình option cho editor */
  @Input({ required: true }) option!: SdMiniEditorOption;

  /** NgModel binding - nội dung HTML/Markdown */
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  /** Event emitter khi content thay đổi */
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
   * Kiểm tra có nên enable mention plugin không
   */
  #shouldEnableMention(): boolean {
    return this.option?.enableMention ?? false;
  }

  /**
   * Xử lý khi editor ready
   */
  onReady(editor: ClassicEditor) {
    this.#editor = editor;

    // Set initial content
    if (this.value) {
      this.setContent(this.value);
    }

    // Lắng nghe sự kiện thay đổi nội dung
    editor.model.document.on('change:data', () => {
      const content = editor.getData();
      this.#contentChangeSubject.next(content);
    });

    // Lắng nghe focus/blur events
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

    // Lắng nghe sự kiện mention được chọn
    if (this.#shouldEnableMention()) {
      editor.commands.get('mention')?.on('execute', (_evt, data: any) => {
        const mentionData = data[0];
        this.option?.onMentionSelect?.(mentionData.mention);
        // Trigger content change sau khi insert mention
        const content = editor.getData();
        this.#contentChangeSubject.next(content);
      });

      // Custom downcast converter để thay đổi cấu trúc mention HTML
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

      // Xử lý keyboard để xóa mention 1 lần
      editor.editing.view.document.on('keydown', (evt, data) => {
        const keyEvent = data as { keyCode: number; domEvent: KeyboardEvent };
        // Delete (46) hoặc Backspace (8)
        if (keyEvent.keyCode === 46 || keyEvent.keyCode === 8) {
          const model = editor.model;
          const selection = model.document.selection;
          const position = selection.getFirstPosition();
          if (!position) return;

          // Tìm text node có mention attribute
          const node = position.textNode || position.nodeBefore || position.nodeAfter;
          if (node && node.is('$text')) {
            const mentionAttr = node.getAttribute('mention');
            if (mentionAttr) {
              // Xóa toàn bộ text node chứa mention
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
   * Convert output theo format (html hoặc markdown)
   * Khi sử dụng CKEditor Markdown plugin, getData() tự động trả về Markdown
   */
  #convertOutput(content: string): string {
    // CKEditor Markdown plugin tự động xử lý conversion
    // Không cần manual conversion nữa
    return content;
  }

  /**
   * Set nội dung cho editor
   */
  setContent(content: string) {
    this.#editor?.setData?.(content);
  }

  /**
   * Get nội dung từ editor
   */
  getContent(): string {
    if (this.#editor) {
      const html = this.#editor.getData();
      return this.#convertOutput(html);
    }
    return '';
  }

  /**
   * Get nội dung HTML gốc (không convert)
   */
  getHtmlContent(): string {
    return this.#editor?.getData?.() || '';
  }

  /**
   * Focus vào editor
   */
  focusEditor() {
    this.#editor?.editing?.view?.focus?.();
  }

  /**
   * Insert mention vào vị trí con trỏ hiện tại
   */
  insertMention(item: { id: string; name: string; marker?: string }) {
    if (!this.#editor) return;

    const firstFeed = this.option?.mentionConfig?.feeds?.[0];
    const marker = item.marker || (firstFeed as any)?.marker || '@';

    // Sử dụng CKEditor mention command
    this.#editor.execute('mention', {
      marker,
      mention: {
        id: item.id,
        text: `${marker}${item.name}`,
      },
    });
  }

  /**
   * Get danh sách mentions trong nội dung
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
