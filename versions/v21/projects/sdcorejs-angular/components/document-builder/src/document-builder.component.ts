import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { SdUtilities } from '@sdcorejs/angular/utilities';
import {
  PageOrientation,
  TableCustom,
  VariablePlugin,
  ImageUploadPlugin,
  HeadingPlugin,
  ImageCustomPlugin,
  PasteHandler,
  HighlightRangePlugin,
  BlockSpace,
  CkCommentPlugin,
} from './plugins';
import { getPresetColors, getColorPickerConfig, getFontSizeOptions, getHeadingOptions } from './document-builder.config';
import { SdDocumentBuilderHeading, SdDocumentBuilderOption, SdDocumentBuilderVariable, SdEditorConfig } from './document-builder.model';
import { CkComment } from './plugins/ck-comment/ck-comment.plugin.model';
import { normalize } from './document-builder.utils';

@Component({
  selector: 'sd-document-builder',
  standalone: true,
  imports: [CommonModule, CKEditorModule],
  templateUrl: './document-builder.component.html',
  styleUrls: [
    './document-builder.component.scss',
    './plugins/heading/heading.plugin.scss',
    './plugins/variable/variable.plugin.scss',
    './plugins/highlight-range/highlight-range.plugin.scss',
    './plugins/ck-comment/ck-comment.plugin.scss',
  ],
})
export class SdDocumentBuilder {
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
  #headingElementsMap = new Map<string, ModelElement>(); // Hash lÆ°u trá»¯ cÃ¡c heading

  // Config
  config: SdEditorConfig = {
    getOption: () => this.option,
    licenseKey: 'GPL', // Hoáº·c key thÆ°Æ¡ng máº¡i náº¿u cÃ³
    plugins: [
      // GeneralHtmlSupport,
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
      Alignment, // Canh lá»
      Subscript, // MÅ© dÆ°á»›i (Hâ‚‚O)
      Superscript, // MÅ© trÃªn (xÂ²)
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

    // 4. Cáº¥u hÃ¬nh báº£ng mÃ u (TÃ¹y chá»n)
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
      offset: 48, // ÄÆ¡n vá»‹ px cho má»—i má»©c indent (tÆ°Æ¡ng Ä‘Æ°Æ¡ng 0.5 inch)
      unit: 'px',
    },

    // Quan trá»ng: Cho phÃ©p paste style tá»« Word nhÆ°ng bá» qua margin/padding
    htmlSupport: {
      allow: [
        {
          name: /.*/, // Cho phÃ©p táº¥t cáº£ tÃªn tháº» HTML
          attributes: true, // Cho phÃ©p táº¥t cáº£ attributes
          classes: true, // Cho phÃ©p táº¥t cáº£ classes
          styles: true, // Cho phÃ©p táº¥t cáº£ styles
        },
      ],
    },
  };

  ngOnInit() {
    // Debounce trong rxjs khÃ´ng há»— trá»£ leading --> throttleTime
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

    // Láº¯ng nghe selection
    editor.model.document.selection.on('change', $event => {
      this.option.onSelection?.(this.#editor.model.document.selection, $event);
    });

    // Láº¯ng nghe sá»± kiá»‡n thay Ä‘á»•i ná»™i dung
    editor.model.document.on('change:data', () => {
      const content = editor.getData();
      this.#contentChangeSubject.next(content);
    });

    try {
      // Manual keybinding cho Tab náº¿u cáº§n
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
    this.#editor?.setData?.(html);
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
      // Báº­t cháº¿ Ä‘á»™ chá»‰ Ä‘á»c vá»›i ID khÃ³a
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
      // Táº¯t cháº¿ Ä‘á»™ chá»‰ Ä‘á»c vá»›i ID khÃ³a tÆ°Æ¡ng á»©ng
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
    // Heading trong Model chá»©a cÃ¡c text node con
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
      // TextProxy lÃ  má»™t pháº§n cá»§a Text Node náº±m trong Range
      if (item.is('$textProxy') || item.is('$text')) {
        text += (item as any).data;
      }
    }
    return text;
  };

  // ========================================================================
  // 1. QUáº¢N LÃ HEADING
  // ========================================================================
  heading = {
    /**
     * Láº¥y táº¥t cáº£ headings trong document
     * @returns Danh sÃ¡ch táº¥t cáº£ headings
     */
    all: (): SdDocumentBuilderHeading[] => {
      if (!this.#editor) return [];

      const root = this.#editor.model.document.getRoot();
      if (!root) return [];

      // Reset láº¡i map má»—i láº§n quÃ©t
      this.#headingElementsMap.clear();

      const headings: SdDocumentBuilderHeading[] = [];
      const range = this.#editor.model.createRangeIn(root);

      // Biáº¿n Ä‘áº¿m Ä‘á»ƒ táº¡o ID unique
      let index = 0;

      for (const item of range.getItems()) {
        // Kiá»ƒm tra xem item cÃ³ pháº£i lÃ  Element vÃ  tÃªn báº¯t Ä‘áº§u báº±ng 'heading' khÃ´ng
        if (item.is('element') && item.name.startsWith('heading')) {
          // 1. Láº¥y text cá»§a heading
          const text = this.#getTextFromElement(item);
          // 2. XÃ¡c Ä‘á»‹nh Level (heading1 -> 1, heading2 -> 2)
          // item.name cÃ³ dáº¡ng 'heading1', 'heading2'
          const level = parseInt(item.name.replace('heading', ''), 10) || 1;
          // 3. Táº¡o ID runtime (DÃ¹ng Ä‘á»ƒ map khi click scroll)
          // Báº¡n cÃ³ thá»ƒ generate slug tá»« text náº¿u muá»‘n, á»Ÿ Ä‘Ã¢y mÃ¬nh dÃ¹ng index cho Ä‘Æ¡n giáº£n vÃ  unique
          const id = `heading_${index}_${Date.now()}`;
          // 4. LÆ°u tham chiáº¿u Model Element vÃ o Map
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
     * Scroll tá»›i vá»‹ trÃ­ cá»§a heading
     * @param id - ID cá»§a heading cáº§n scroll tá»›i
     */
    scroll: (id: string) => {
      if (!this.#editor) return;

      const modelElement = this.#headingElementsMap.get(id);

      if (modelElement) {
        this.#editor.model.change(writer => {
          // XÃ³a marker cÅ©
          if (this.#idTimeOutScrollHeading) {
            clearTimeout(this.#idTimeOutScrollHeading);
          }
          const currentMarker = this.#editor.model.markers.get('highlightMarker');
          if (currentMarker) {
            writer.removeMarker(currentMarker);
          }

          // Táº¡o Range bao trÃ¹m highlight
          const range = writer.createRangeOn(modelElement);

          // ThÃªm Marker má»›i
          writer.addMarker('highlightMarker', {
            range: range,
            usingOperation: false,
          });
        });

        // Scroll tá»›i vá»‹ trÃ­ tÃ¬m Ä‘Æ°á»£c
        const viewElement = this.#editor.editing.mapper.toViewElement(modelElement);
        if (viewElement) {
          const domElement = this.#editor.editing.view.domConverter.viewToDom(viewElement);
          if (domElement) {
            domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }

        // Tá»± Ä‘á»™ng táº¯t marker sau 5 giÃ¢y
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
  // 2. QUáº¢N LÃ COMMENT (Marker-based)
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
  // 3. QUáº¢N LÃ VARIABLE
  // ========================================================================
  getVariablePluginAPI(): VariablePlugin | null {
    if (!this.#editor) return null;
    try {
      // DÃ¹ng class reference (khÃ´ng dÃ¹ng string) â†’ an toÃ n trong build minified, TypeScript-typed
      return this.#editor.plugins.get(VariablePlugin);
    } catch (error) {
      console.warn('VariablePlugin not available:', error);
      return null;
    }
  }



  // ========================================================================
  // 4. HÃ€M EXPORT DOCX (FULL HEADER/FOOTER + PAGE NUMBER)
  // ========================================================================
  /**
   * Xuáº¥t file Word cÃ³ Header/Footer
   * @param fileName TÃªn file
   * @param headerText Ná»™i dung Header (hoáº·c HTML)
   * '<p style="text-align: center; font-weight: bold;">CÃ”NG TY Cá»” PHáº¦N CÃ”NG NGHá»† ABC</p>'
   * @param footerText Ná»™i dung Footer (hoáº·c HTML)
   * '<p style="text-align: right; font-size: 10pt;">Trang <span style="mso-field-code: PAGE"></span> / <span style="mso-field-code: NUMPAGES"></span></p>'
   */
  exportDocx(args: { fileName?: string; header?: string; footer?: string }): void {
    if (!this.#editor) return;
    const fileName = args?.fileName || `document_${Date.now()}.docx`;
    const header = args?.header || ``;
    const footer = args?.footer || ``;
    // 1. Kiá»ƒm tra xoay giáº¥y
    const rootElement = this.#editor.editing.view.document.getRoot();
    const isLandscape = rootElement?.hasClass('landscape');
    const orientation = isLandscape ? 'landscape' : 'portrait';

    // KÃ­ch thÆ°á»›c giáº¥y cho Word (A4)
    // Portrait: 21cm x 29.7cm
    // Landscape: 29.7cm x 21cm
    // @page size trong CSS Word Ä‘Ã´i khi cáº§n set cá»©ng width/height Ä‘á»ƒ header khÃ´ng bá»‹ lá»‡ch
    const pageCss = isLandscape
      ? 'size: 29.7cm 21cm; mso-page-orientation: landscape;'
      : 'size: 21cm 29.7cm; mso-page-orientation: portrait;';

    const contentHtml = this.#editor.getData();

    // 2. Táº O HTML CHUáº¨N MICROSOFT WORD XML
    // Pháº£i cÃ³ xmlns:o vÃ  xmlns:w thÃ¬ Word má»›i hiá»ƒu Ä‘Æ°á»£c cÃ¡c lá»‡nh mso-
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="UTF-8">
          <title>Export Document</title>
          
          <style>
            /* --- 1. SETUP TRANG GIáº¤Y & HEADER/FOOTER --- */
            @page {
              ${pageCss}
              margin: 2.0cm; /* Lá» chuáº©n 2cm */
              
              /* Ká»¹ thuáº­t map ID cá»§a Word */
              mso-header: header1;
              mso-footer: footer1;
            }

            /* Quan trá»ng: áº¨n cÃ¡c div header/footer khá»i luá»“ng vÄƒn báº£n chÃ­nh */
            /* ChÃºng sáº½ chá»‰ hiá»‡n thá»‹ khi Ä‘Æ°á»£c @page gá»i thÃ´ng qua mso-header/footer */
            div#header1 { display: none; }
            div#footer1 { display: none; }

            /* --- 2. STYLE CÆ  Báº¢N --- */
            body {
              font-family: 'Times New Roman', serif;
              font-size: 13pt;
              line-height: 1.5;
              tab-interval: 36pt;
            }
            
            /* Style Báº£ng */
            table { width: 100%; border-collapse: collapse; }
            td, th { border: 1px solid black; padding: 5px; }

            /* Style Biáº¿n (Giá»¯ nguyÃªn giao diá»‡n Ä‘áº¹p cá»§a báº¡n) */
            .variable-widget {
              color: #1565c0; font-weight: bold;
              background: #e3f2fd; padding: 0 4px; border-radius: 4px;
              border: 1px solid #90caf9;
            }
            
            /* áº¨n Comment khi in/xuáº¥t file */
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

    // 3. Táº O BLOB VÃ€ Táº¢I XUá»NG
    // LÆ°u Ã½: DÃ¹ng type 'application/msword' thay vÃ¬ dÃ¹ng thÆ° viá»‡n html-docx-js
    // ThÃªm '\ufeff' (BOM) Ä‘á»ƒ fix lá»—i font tiáº¿ng Viá»‡t
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    SdUtilities.downloadBlob(blob, fileName);
  }

  hightSelectRange = (range: ModelRange): void => {
    if (!range) return;
    const editor = this.#editor;

    editor.model.change(writer => {
      // XÃ³a marker cÅ© (náº¿u cÃ³)
      if (editor.model.markers.has('highlightRange')) {
        writer.removeMarker('highlightRange');
      }

      // Táº¡o marker má»›i
      writer.addMarker('highlightRange', {
        usingOperation: false, // KhÃ´ng lÆ°u vÃ o lá»‹ch sá»­ Undo/Redo
        affectsData: false, // KhÃ´ng áº£nh hÆ°á»Ÿng Ä‘áº¿n data láº¥y ra (getData)
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

