import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdCKEditorStyles } from '@sdcorejs/angular/components/ckeditor-styles';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import {
  Alignment,
  Bold,
  ClassicEditor,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  // GeneralHtmlSupport,
  Heading,
  Image,
  ImageBlock,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  List,
  ModelElement,
  ModelRange,
  PageBreak,
  Paragraph,
  Subscript,
  Superscript,
  Table,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  Underline,
  Undo,
} from 'ckeditor5';
import { throttleTime, Subject, Subscription } from 'rxjs';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import {
  PageOrientation,
  TableCustom,
  VariablePlugin,
  sanitizeVariableHtmlBoundSerializedHtml,
  ImageUploadPlugin,
  HeadingPlugin,
  ImageCustomPlugin,
  PasteHandler,
  HighlightRangePlugin,
  BlockSpace,
  CkCommentPlugin,
} from './plugins';
import { getPresetColors, getColorPickerConfig, getFontSizeOptions, getHeadingOptions } from './document-builder.config';
import { DocumentBuilderI18n, DocumentBuilderOption, SdDocumentBuilderHeading, SdDocumentBuilderOption } from './document-builder.model';
import { normalize } from './document-builder.utils';

@Component({
  selector: 'sd-document-builder',
  standalone: true,
  imports: [CommonModule, CKEditorModule, SdCKEditorStyles],
  templateUrl: './document-builder.component.html',
  styleUrls: [
    './document-builder.component.scss',
    './plugins/heading/heading.plugin.scss',
    './plugins/variable/variable.plugin.scss',
    './plugins/highlight-range/highlight-range.plugin.scss',
    './plugins/ck-comment/ck-comment.plugin.scss',
  ],
})
export class SdDocumentBuilder implements OnInit, OnDestroy {
  readonly #i18n = inject(I18nService);

  @Input({ required: true }) option!: SdDocumentBuilderOption;

  disabled = false;
  @Input('disabled') set _disabled(val: boolean | '' | undefined | null) {
    this.disabled = val === '' || !!val;
    this.#updateState();
  }

  @Output() contentChange = new EventEmitter<string>(); // Emit HTML content

  Editor = ClassicEditor;
  #editor!: ClassicEditor;

  #id = '55b0afb0-288d-423c-98b3-5f9db286e16d';
  #subscription = new Subscription();
  #sharedColors = getPresetColors();
  #headingOptions = getHeadingOptions();
  #fontSizeOptions = getFontSizeOptions();
  #colorPickerConfig = getColorPickerConfig();
  #contentChangeSubject = new Subject<string>();
  #idTimeOutScrollHeading: ReturnType<typeof setTimeout> | null = null;
  #headingElementsMap = new Map<string, ModelElement>(); // Hash lưu trữ các heading

  // Wrapper giữ `this` của I18nService — CKEditor config không truyền được class instance có private fields.
  readonly #editorI18n: DocumentBuilderI18n = {
    t: (key, params) => this.#i18n.t(key, params),
  };

  // Config
  config: DocumentBuilderOption = {
    getOption: () => this.option,
    _i18n: this.#editorI18n,
    licenseKey: 'GPL', // Hoặc key thương mại nếu có
    plugins: [
      FontSize,
      FontColor,
      FontFamily,
      FontBackgroundColor,
      Bold,
      Italic,
      Underline,
      Essentials,
      Paragraph,
      Heading,
      List,
      Table,
      TableToolbar,
      TableProperties,
      TableCellProperties,
      TableColumnResize,
      PageBreak,
      Undo,
      Alignment, // Canh lề
      Subscript, // Mũ dưới (H₂O)
      Superscript, // Mũ trên (x²)
      // Image
      Image,
      ImageUpload,
      ImageToolbar,
      ImageCaption,
      ImageResize,
      ImageStyle,
      ImageBlock,
      // Indent
      Indent,
      IndentBlock,
      // Custom Plugin
      HeadingPlugin,
      VariablePlugin,
      TableCustom,
      PageOrientation,
      ImageUploadPlugin,
      ImageCustomPlugin,
      HighlightRangePlugin,
      PasteHandler,
      BlockSpace,
      CkCommentPlugin,
    ],
    toolbar: {
      items: [
        'pageOrientation',
        '|',
        'heading',
        'fontFamily',
        '|',
        'fontSize',
        'fontColor',
        'fontBackgroundColor',
        '|',
        'bold',
        'italic',
        'underline',
        'subscript',
        'superscript',
        '|',
        'alignment',
        'bulletedList',
        'numberedList',
        '|',
        'insertTable',
        'imageUpload',
        'pageBreak',
        '|',
        'undo',
        'redo',
      ],
      shouldNotGroupWhenFull: true,
    },

    image: {
      styles: {
        options: ['inline', 'alignLeft', 'alignRight', 'alignCenter'],
      },
      toolbar: [
        'imageStyle:inline',
        'imageStyle:alignCenter',
        {
          name: 'imageStyle:alignDropdown',
          items: ['imageStyle:alignLeft', 'imageStyle:alignRight'],
          defaultItem: 'imageStyle:alignLeft',
        },
      ],
    },

    fontSize: {
      options: this.#fontSizeOptions,
      supportAllValues: true,
    },

    heading: {
      options: this.#headingOptions,
    },

    // 4. Cấu hình bảng màu (Tùy chọn)
    fontColor: {
      // columns: 5,
      documentColors: 10,
      colorPicker: this.#colorPickerConfig,
      colors: this.#sharedColors,
    },

    fontBackgroundColor: {
      // columns: 5,
      documentColors: 10,
      colorPicker: this.#colorPickerConfig,
      colors: this.#sharedColors,
    },

    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', '|', 'tableProperties', 'tableCellProperties'],
      tableProperties: {
        borderColors: this.#sharedColors,
        backgroundColors: this.#sharedColors,
        colorPicker: this.#colorPickerConfig,
        defaultProperties: {
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: '#ccc',
        },
      },
      tableCellProperties: {
        borderColors: this.#sharedColors,
        backgroundColors: this.#sharedColors,
        colorPicker: this.#colorPickerConfig,
        defaultProperties: {
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: '#ccc',
        },
      },
    },

    indentBlock: {
      offset: 48, // Đơn vị px cho mỗi mức indent (tương đương 0.5 inch)
      unit: 'px',
    },

    // Quan trọng: Cho phép paste style từ Word nhưng bỏ qua margin/padding
    htmlSupport: {
      allow: [
        {
          name: /.*/, // Cho phép tất cả tên thẻ HTML
          attributes: true, // Cho phép tất cả attributes
          classes: true, // Cho phép tất cả classes
          styles: true, // Cho phép tất cả styles
        },
      ],
    },
  };

  ngOnInit() {
    // Debounce trong rxjs không hỗ trợ leading --> throttleTime
    this.#subscription.add(
      this.#contentChangeSubject.pipe(throttleTime(500, undefined, { leading: true, trailing: true })).subscribe(content => {
        this.contentChange.emit(normalize(content));
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  onReady(editor: ClassicEditor) {
    this.#editor = editor;

    // Setup orientation plugin callback
    try {
      const orientationPlugin = editor.plugins.get('PageOrientation') as PageOrientation;
      if (orientationPlugin && typeof orientationPlugin.onOrientationChange === 'function') {
        orientationPlugin.onOrientationChange(orientation => {
          this.option.onOrientation?.(orientation);
        });

        // Set initial orientation if provided
        if (this.option.orientation) {
          orientationPlugin.setOrientation(this.option.orientation);
        }
      }
    } catch (error) {
      console.warn('PageOrientation not available:', error);
    }

    // Lắng nghe selection
    editor.model.document.selection.on('change', $event => {
      this.option.onSelection?.(this.#editor.model.document.selection, $event);
    });

    // Lắng nghe sự kiện thay đổi nội dung
    editor.model.document.on('change:data', () => {
      const content = editor.getData();
      this.#contentChangeSubject.next(content);
    });

    try {
      // Manual keybinding cho Tab nếu cần
      editor.keystrokes.set('Tab', (evt, cancel) => {
        const command = editor.commands.get('indentBlock');
        if (command && command.isEnabled) {
          editor.execute('indentBlock');
          cancel();
        }
      });

      // Manual keybinding cho Shift+Tab
      editor.keystrokes.set('Shift+Tab', (evt, cancel) => {
        const command = editor.commands.get('outdentBlock');
        if (command && command.isEnabled) {
          editor.execute('outdentBlock');
          cancel();
        }
      });
    } catch (error) {
      console.warn('Error setting up indent keybindings:', error);
    }

    this.#updateState();

    // Setup CkCommentPlugin callbacks
    this.#setupCkCommentPlugin();
  }

  #setupCkCommentPlugin() {
    if (!this.#editor) return;

    try {
      const ckCommentPlugin = this.#editor.plugins.get('CkComment') as CkCommentPlugin;
      if (ckCommentPlugin && this.option.comment) {
        ckCommentPlugin.setConfig(this.option.comment);
      }
    } catch (error) {
      console.warn('CkCommentPlugin not available:', error);
    }
  }

  setContent = (html: string) => {
    const safe = sanitizeVariableHtmlBoundSerializedHtml(html);
    this.#editor?.setData?.(safe);
  };

  getContent = () => {
    if (this.#editor) {
      return this.#editor.getData();
    }
    return '';
  };

  setOrientation = (orientation: 'PORTRAIT' | 'LANDSCAPE'): void => {
    if (!this.#editor) return;

    try {
      const orientationPlugin = this.#editor.plugins.get('PageOrientation') as PageOrientation;
      if (orientationPlugin && typeof orientationPlugin.setOrientation === 'function') {
        orientationPlugin.setOrientation(orientation);
      }
    } catch (error) {
      console.warn('Failed to set orientation:', error);
    }
  };

  getOrientation = (): 'PORTRAIT' | 'LANDSCAPE' => {
    if (!this.#editor) return 'PORTRAIT';

    try {
      const orientationPlugin = this.#editor.plugins.get('PageOrientation') as PageOrientation;
      if (orientationPlugin && typeof orientationPlugin.getOrientation === 'function') {
        return orientationPlugin.getOrientation();
      }
    } catch (error) {
      console.warn('Failed to get orientation:', error);
    }

    return 'PORTRAIT';
  };

  scrollToTop() {
    setTimeout(() => {
      if (this.#editor) {
        const editableElement = this.#editor.ui.view.editable.element;
        if (editableElement) {
          const scrollContainer = editableElement.closest('.builder-container');
          if (scrollContainer) {
            scrollContainer.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          } else {
            editableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    }, 100);
  }

  #updateState(): void {
    if (!this.#editor) return;
    if (this.disabled) {
      // Bật chế độ chỉ đọc với ID khóa
      this.#editor.enableReadOnlyMode(this.#id);

      // Disable page orientation button
      try {
        const orientationPlugin = this.#editor.plugins.get('PageOrientation') as PageOrientation;
        if (orientationPlugin && (orientationPlugin as any).buttonView) {
          (orientationPlugin as any).buttonView.isEnabled = false;
        }
      } catch (error) {
        console.warn('Failed to disable orientation button:', error);
      }
    } else {
      // Tắt chế độ chỉ đọc với ID khóa tương ứng
      this.#editor.disableReadOnlyMode(this.#id);

      // Enable page orientation button
      try {
        const orientationPlugin = this.#editor.plugins.get('PageOrientation') as PageOrientation;
        if (orientationPlugin && (orientationPlugin as any).buttonView) {
          (orientationPlugin as any).buttonView.isEnabled = true;
        }
      } catch (error) {
        console.warn('Failed to enable orientation button:', error);
      }
    }
  }

  #getTextFromElement = (element: ModelElement): string => {
    let text = '';
    // Heading trong Model chứa các text node con
    for (const child of element.getChildren()) {
      if (child.is('$text') || child.is('$textProxy')) {
        text += (child as any).data;
      }
    }
    return text;
  };

  #getTextFromRange = (range: ModelRange): string => {
    let text = '';
    for (const item of range.getItems()) {
      // TextProxy là một phần của Text Node nằm trong Range
      if (item.is('$textProxy') || item.is('$text')) {
        text += (item as any).data;
      }
    }
    return text;
  };

  // ========================================================================
  // 1. QUẢN LÝ HEADING
  // ========================================================================
  heading = {
    /**
     * Lấy tất cả headings trong document
     * @returns Danh sách tất cả headings
     */
    all: (): SdDocumentBuilderHeading[] => {
      if (!this.#editor) return [];

      const root = this.#editor.model.document.getRoot();
      if (!root) return [];

      // Reset lại map mỗi lần quét
      this.#headingElementsMap.clear();

      const headings: SdDocumentBuilderHeading[] = [];
      const range = this.#editor.model.createRangeIn(root);

      // Biến đếm để tạo ID unique
      let index = 0;

      for (const item of range.getItems()) {
        // Kiểm tra xem item có phải là Element và tên bắt đầu bằng 'heading' không
        if (item.is('element') && item.name.startsWith('heading')) {
          // 1. Lấy text của heading
          const text = this.#getTextFromElement(item);
          // 2. Xác định Level (heading1 -> 1, heading2 -> 2)
          // item.name có dạng 'heading1', 'heading2'
          const level = parseInt(item.name.replace('heading', ''), 10) || 1;
          // 3. Tạo ID runtime (Dùng để map khi click scroll)
          // Bạn có thể generate slug từ text nếu muốn, ở đây mình dùng index cho đơn giản và unique
          const id = `heading_${index}_${Date.now()}`;
          // 4. Lưu tham chiếu Model Element vào Map
          this.#headingElementsMap.set(id, item as ModelElement);
          headings.push({
            id: id,
            text: text,
            level: level,
            type: item.name,
          });
          index++;
        }
      }

      return headings;
    },

    /**
     * Scroll tới vị trí của heading
     * @param id - ID của heading cần scroll tới
     */
    scroll: (id: string) => {
      if (!this.#editor) return;

      const modelElement = this.#headingElementsMap.get(id);

      if (modelElement) {
        this.#editor.model.change(writer => {
          // Xóa marker cũ
          if (this.#idTimeOutScrollHeading) {
            clearTimeout(this.#idTimeOutScrollHeading);
          }
          const currentMarker = this.#editor.model.markers.get('highlightMarker');
          if (currentMarker) {
            writer.removeMarker(currentMarker);
          }

          // Tạo Range bao trùm highlight
          const range = writer.createRangeOn(modelElement);

          // Thêm Marker mới
          writer.addMarker('highlightMarker', {
            range: range,
            usingOperation: false,
          });
        });

        // Scroll tới vị trí tìm được
        const viewElement = this.#editor.editing.mapper.toViewElement(modelElement);
        if (viewElement) {
          const domElement = this.#editor.editing.view.domConverter.viewToDom(viewElement);
          if (domElement) {
            domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }

        // Tự động tắt marker sau 5 giây
        this.#idTimeOutScrollHeading = setTimeout(() => {
          if (this.#editor) {
            this.#editor.model.change(writer => {
              const marker = this.#editor.model.markers.get('highlightMarker');
              if (marker) writer.removeMarker(marker);
            });
          }
        }, 5000);
      } else {
        console.warn(`Heading with id ${id} not found.`);
      }
    },
  };

  // ========================================================================
  // 2. QUẢN LÝ COMMENT (Marker-based)
  // ========================================================================
  getCommentPluginAPI() {
    if (!this.#editor) return null;
    try {
      const plugin = this.#editor.plugins.get('CkComment') as CkCommentPlugin;
      return plugin;
    } catch (error) {
      console.warn('CkCommentPlugin not available:', error);
      return null;
    }
  }

  // ========================================================================
  // 3. QUẢN LÝ VARIABLE
  // ========================================================================
  getVariablePluginAPI(): VariablePlugin | null {
    if (!this.#editor) return null;
    try {
      // Dùng class reference (không dùng string) → an toàn trong build minified, TypeScript-typed
      return this.#editor.plugins.get(VariablePlugin);
    } catch (error) {
      console.warn('VariablePlugin not available:', error);
      return null;
    }
  }

  // ========================================================================
  // 4. HÀM EXPORT DOCX (FULL HEADER/FOOTER + PAGE NUMBER)
  // ========================================================================
  /**
   * Xuất file Word có Header/Footer
   * @param fileName Tên file
   * @param headerText Nội dung Header (hoặc HTML)
   * '<p style="text-align: center; font-weight: bold;">CÔNG TY CỔ PHẦN CÔNG NGHỆ ABC</p>'
   * @param footerText Nội dung Footer (hoặc HTML)
   * '<p style="text-align: right; font-size: 10pt;">Trang <span style="mso-field-code: PAGE"></span> / <span style="mso-field-code: NUMPAGES"></span></p>'
   */
  exportDocx(args: { fileName?: string; header?: string; footer?: string }): void {
    if (!this.#editor) return;
    const fileName = args?.fileName || `document_${Date.now()}.docx`;
    const header = args?.header || ``;
    const footer = args?.footer || ``;
    // 1. Kiểm tra xoay giấy
    const rootElement = this.#editor.editing.view.document.getRoot();
    const isLandscape = rootElement?.hasClass('landscape');
    const orientation = isLandscape ? 'landscape' : 'portrait';

    // Kích thước giấy cho Word (A4)
    // Portrait: 21cm x 29.7cm
    // Landscape: 29.7cm x 21cm
    // @page size trong CSS Word đôi khi cần set cứng width/height để header không bị lệch
    const pageCss = isLandscape
      ? 'size: 29.7cm 21cm; mso-page-orientation: landscape;'
      : 'size: 21cm 29.7cm; mso-page-orientation: portrait;';

    const contentHtml = this.#editor.getData();

    // 2. TẠO HTML CHUẨN MICROSOFT WORD XML
    // Phải có xmlns:o và xmlns:w thì Word mới hiểu được các lệnh mso-
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="UTF-8">
          <title>Export Document</title>
          
          <style>
            /* --- 1. SETUP TRANG GIẤY & HEADER/FOOTER --- */
            @page {
              ${pageCss}
              margin: 2.0cm; /* Lề chuẩn 2cm */
              
              /* Kỹ thuật map ID của Word */
              mso-header: header1;
              mso-footer: footer1;
            }

            /* Quan trọng: Ẩn các div header/footer khỏi luồng văn bản chính */
            /* Chúng sẽ chỉ hiện thị khi được @page gọi thông qua mso-header/footer */
            div#header1 { display: none; }
            div#footer1 { display: none; }

            /* --- 2. STYLE CƠ BẢN --- */
            body {
              font-family: 'Times New Roman', serif;
              font-size: 13pt;
              line-height: 1.5;
              tab-interval: 36pt;
            }
            
            /* Style Bảng */
            table { width: 100%; border-collapse: collapse; }
            td, th { border: 1px solid black; padding: 5px; }

            /* Style Biến (Giữ nguyên giao diện đẹp của bạn) */
            .variable-widget {
              color: #1565c0; font-weight: bold;
              background: #e3f2fd; padding: 0 4px; border-radius: 4px;
              border: 1px solid #90caf9;
            }
            
            /* Ẩn Comment khi in/xuất file */
            .ck-comment-marker { background-color: transparent; border: none; text-decoration: none; }
          </style>
        </head>
        <body>
          
          <div id="header1">
            <div style="mso-element:header">
               ${header}
               <div style='border-bottom: 1px solid #000; margin-top: 5px; margin-bottom: 20px;'></div>
            </div>
          </div>

          <div id="footer1">
            <div style="mso-element:footer">
               <div style='border-top: 1px solid #000; margin-top: 20px; margin-bottom: 5px;'></div>
               ${footer}
            </div>
          </div>

          <div class="content">
            ${contentHtml}
          </div>

        </body>
      </html>
    `;

    // 3. TẠO BLOB VÀ TẢI XUỐNG
    // Lưu ý: Dùng type 'application/msword' thay vì dùng thư viện html-docx-js
    // Thêm '\ufeff' (BOM) để fix lỗi font tiếng Việt
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    BrowserUtilities.downloadBlob(blob, fileName);
  }

  hightSelectRange = (range: ModelRange): void => {
    if (!range) return;
    const editor = this.#editor;

    editor.model.change(writer => {
      // Xóa marker cũ (nếu có)
      if (editor.model.markers.has('highlightRange')) {
        writer.removeMarker('highlightRange');
      }

      // Tạo marker mới
      writer.addMarker('highlightRange', {
        usingOperation: false, // Không lưu vào lịch sử Undo/Redo
        affectsData: false, // Không ảnh hưởng đến data lấy ra (getData)
        range: range,
      });
    });
  };

  removeHighlightSeclectRange = (): void => {
    const editor = this.#editor;
    editor.model.change(writer => {
      if (editor.model.markers.has('highlightRange')) {
        writer.removeMarker('highlightRange');
      }
    });
  };
}
