import { Component, ViewEncapsulation, Input, Output, EventEmitter, inject } from '@angular/core';
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
  // Import Plugin tá»± viáº¿t
  // PageNumberPlugin (náº¿u import tá»« file ngoÃ i)
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
      /* Style tá»‘i giáº£n cho vÃ¹ng soáº¡n tháº£o Header/Footer */
      :host ::ng-deep .header-footer-editor-wrapper .ck-editor__editable_inline {
        min-height: 100px; /* Header thÆ°á»ng ngáº¯n */
        max-height: 200px;
        padding: 10px 20px;
        border: 1px solid #ddd;
      }

      /* Style hiá»ƒn thá»‹ cho Placeholder sá»‘ trang trong lÃºc soáº¡n tháº£o */
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

  @Output() modelChange = new EventEmitter<string>();
  readonly #editorI18n: DocumentBuilderI18n = {
    t: (key, params) => this.#i18n.t(key, params),
  };

  config: EditorConfig & { _i18n?: DocumentBuilderI18n } = {
    licenseKey: 'GPL', // Hoáº·c key thÆ°Æ¡ng máº¡i náº¿u cÃ³
    _i18n: this.#editorI18n,
    // 1. PLUGIN RÃšT Gá»ŒN (Bá» Table, List, PageBreak...)
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
      PageNumberPlugin, // <--- Plugin sá»‘ trang
    ],
    // 2. TOOLBAR ÄÆ N GIáº¢N
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
        'alignment', // CÄƒn trÃ¡i/pháº£i/giá»¯a (Quan trá»ng cho Header/Footer)
        '|',
        'pageNumber',
        'totalPages', // <--- 2 nÃºt má»›i
      ],
      shouldNotGroupWhenFull: true,
    },
    // Cáº¥u hÃ¬nh alignment
    alignment: {
      options: ['left', 'center', 'right'],
    },
  };

  onReady(editor: ClassicEditor): void {
    this.#editor = editor;
    this.#editor.setData(this.#model || '');
    this.#editor.model.document.on('change:data', () => {
      this.#model = this.#editor.getData();
      this.modelChange.next(this.#model);
    });
  }
}

