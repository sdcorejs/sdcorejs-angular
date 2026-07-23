import { Component, Input, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { I18nService } from '@sdcorejs/angular/i18n';
import { DocumentBuilderI18n } from '../../document-builder.model';

import {
  ClassicEditor,
  EditorConfig,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Alignment,
  // Import Plugin tự viết
  // PageNumberPlugin (nếu import từ file ngoài)
} from 'ckeditor5';
import { PageNumberPlugin } from './plugins/page-number.plugin';

@Component({
  selector: 'sd-header-footer-builder',
  standalone: true,
  imports: [CommonModule, CKEditorModule],
  template: `
    <div class="header-footer-editor-wrapper">
      <ckeditor [editor]="Editor" [config]="config" (ready)="onReady($event)"> </ckeditor>
    </div>
  `,
  styles: [
    `
      /* Style tối giản cho vùng soạn thảo Header/Footer */
      :host ::ng-deep .header-footer-editor-wrapper .ck-editor__editable_inline {
        min-height: 100px; /* Header thường ngắn */
        max-height: 200px;
        padding: 10px 20px;
        border: 1px solid #ddd;
      }

      /* Style hiển thị cho Placeholder số trang trong lúc soạn thảo */
      :host ::ng-deep .page-number-marker,
      :host ::ng-deep .total-page-marker {
        font-size: 11px;
        color: #555;
        cursor: default;
        user-select: none;
      }
    `,
  ],
})
export class SdHeaderFooterBuilder {
  readonly #i18n = inject(I18nService);
  #editor!: ClassicEditor;
  Editor = ClassicEditor;

  #model: string | undefined | null;
  @Input() set model(value: string | undefined | null) {
    if (this.#model !== value) {
      this.#model = value;
    }
  }

  readonly modelChange = output<string>();
  readonly #editorI18n: DocumentBuilderI18n = {
    t: (key, params) => this.#i18n.t(key, params),
  };

  config: EditorConfig & { _i18n?: DocumentBuilderI18n } = {
    licenseKey: 'GPL', // Hoặc key thương mại nếu có
    _i18n: this.#editorI18n,
    // 1. PLUGIN RÚT GỌN (Bỏ Table, List, PageBreak...)
    plugins: [
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Underline,
      FontSize,
      FontColor,
      FontBackgroundColor,
      Alignment,
      PageNumberPlugin, // <--- Plugin số trang
    ],
    // 2. TOOLBAR ĐƠN GIẢN
    toolbar: {
      items: [
        'undo',
        'redo',
        '|',
        'fontSize',
        'fontColor',
        '|',
        'bold',
        'italic',
        'underline',
        '|',
        'alignment', // Căn trái/phải/giữa (Quan trọng cho Header/Footer)
        '|',
        'pageNumber',
        'totalPages', // <--- 2 nút mới
      ],
      shouldNotGroupWhenFull: true,
    },
    // Cấu hình alignment
    alignment: {
      options: ['left', 'center', 'right'],
    },
  };

  onReady(editor: ClassicEditor): void {
    this.#editor = editor;
    this.#editor.setData(this.#model || '');
    this.#editor.model.document.on('change:data', () => {
      this.#model = this.#editor.getData();
      this.modelChange.emit(this.#model);
    });
  }
}
