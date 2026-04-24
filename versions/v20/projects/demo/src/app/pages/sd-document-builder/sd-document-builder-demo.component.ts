import { Component, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SdDocumentBuilder, SdDocumentBuilderOption, SdDocumentBuilderVariable, SdPasteEventData } from '@sdcorejs/angular/components';
import { CkComment } from '@sdcorejs/angular/components/document-builder';
import { SdDocxService } from '@sdcorejs/angular/services/docx';

@Component({
  selector: 'app-document-builder-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, SdDocumentBuilder],
  templateUrl: './sd-document-builder-demo.component.html',
  styleUrl: './sd-document-builder-demo.component.scss',
})
export class DocumentBuilderDemoComponent implements AfterViewInit {
  @ViewChild(SdDocumentBuilder) builder!: SdDocumentBuilder;

  // â”€â”€ LocalStorage keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private readonly STORAGE_KEY_CONTENT = 'demo_document_content';
  private readonly STORAGE_KEY_COMMENTS = 'demo_document_comments';

  // â”€â”€ Default content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private readonly DEFAULT_CONTENT = `
    <h2>Há»¢P Äá»’NG LAO Äá»˜NG</h2>
    <p>HÃ´m nay, ngÃ y <span class="variable-widget ck-widget" data-id="var-date" data-uuid="uuid-date-001" data-value="var-date" data-display="NgÃ y kÃ½" contenteditable="false">{{NgÃ y kÃ½}}</span>, táº¡i vÄƒn phÃ²ng cÃ´ng ty, chÃºng tÃ´i gá»“m cÃ³:</p>
    <p><strong>BÃªn A:</strong> CÃ´ng ty TNHH ABC, Ä‘áº¡i diá»‡n bá»Ÿi <span class="variable-widget ck-widget" data-id="var-rep" data-uuid="uuid-rep-001" data-value="var-rep" data-display="NgÆ°á»i Ä‘áº¡i diá»‡n" contenteditable="false">{{NgÆ°á»i Ä‘áº¡i diá»‡n}}</span></p>
    <p><strong>BÃªn B:</strong> Ã”ng/BÃ  <span class="variable-widget ck-widget" data-id="var-name" data-uuid="uuid-name-001" data-value="var-name" data-display="Há» tÃªn NLÄ" contenteditable="false">{{Há» tÃªn NLÄ}}</span>, CCCD sá»‘ <span class="variable-widget ck-widget" data-id="var-cccd" data-uuid="uuid-cccd-001" data-value="var-cccd" data-display="Sá»‘ CCCD" contenteditable="false">{{Sá»‘ CCCD}}</span></p>
    <p>Hai bÃªn thá»a thuáº­n kÃ½ káº¿t há»£p Ä‘á»“ng lao Ä‘á»™ng vá»›i cÃ¡c Ä‘iá»u khoáº£n sau Ä‘Ã¢y:</p>
    <h3>Äiá»u 1: CÃ´ng viá»‡c vÃ  Ä‘á»‹a Ä‘iá»ƒm lÃ m viá»‡c</h3>
    <p>BÃªn B Ä‘á»“ng Ã½ lÃ m viá»‡c táº¡i vá»‹ trÃ­ láº­p trÃ¬nh viÃªn, thuá»™c phÃ²ng <span class="ck-comment-marker" data-comment-id="comment:1771776648577">CÃ´ng nghá»‡ thÃ´ng tin.</span></p>
    <h3>Äiá»u 2: Thá»i háº¡n há»£p Ä‘á»“ng</h3>
    <p>Há»£p Ä‘á»“ng cÃ³ thá»i háº¡n 12 thÃ¡ng, ká»ƒ tá»« ngÃ y kÃ½.</p>
    <h3>Äiá»u 3: LÆ°Æ¡ng vÃ  phÃºc lá»£i</h3>
    <p>Má»©c lÆ°Æ¡ng cÆ¡ báº£n lÃ  20.000.000 VNÄ má»—i thÃ¡ng, chÆ°a bao gá»“m thuáº¿ thu nháº­p cÃ¡ nhÃ¢n vÃ  cÃ¡c khoáº£n báº£o hiá»ƒm báº¯t buá»™c.</p>
  `;

  constructor(
    private docxService: SdDocxService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      const savedContent = localStorage.getItem(this.STORAGE_KEY_CONTENT);
      const content = savedContent || this.DEFAULT_CONTENT;
      this.builder.setContent(content);
      // Sau khi load content, refresh danh sÃ¡ch variables tá»« document
      setTimeout(() => this.refreshVariables(), 200);
    }, 100);
  }

  // â”€â”€ Sidebar tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  activeTab: 'variables' | 'comments' = 'variables';

  // â”€â”€ Draggable variable list (danh sÃ¡ch biáº¿n cho phÃ©p kÃ©o tháº£ vÃ o editor) â”€
  draggableVariables: SdDocumentBuilderVariable[] = [
    { id: 'var-date', display: 'NgÃ y kÃ½', value: 'var-date' },
    { id: 'var-rep', display: 'NgÆ°á»i Ä‘áº¡i diá»‡n', value: 'var-rep' },
    { id: 'var-name', display: 'Há» tÃªn NLÄ', value: 'var-name' },
    { id: 'var-cccd', display: 'Sá»‘ CCCD', value: 'var-cccd' },
    { id: 'var-salary', display: 'Má»©c lÆ°Æ¡ng', value: 'var-salary' },
    { id: 'var-dept', display: 'PhÃ²ng ban', value: 'var-dept' },
  ];

  // â”€â”€ Binding panel state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /** Danh sÃ¡ch variable duy nháº¥t (theo id) Ä‘ang cÃ³ trong document */
  documentVariables: SdDocumentBuilderVariable[] = [];
  /** ngModel lÆ°u giÃ¡ trá»‹ nháº­p binding cho tá»«ng id */
  bindingInputs: Record<string, string> = {};

  /** Dá»¯ liá»‡u máº«u Ä‘á»ƒ test bind nhanh */
  readonly sampleBindingData: Record<string, string> = {
    'var-date': '15/04/2025',
    'var-rep': 'Nguyá»…n Thá»‹ HÆ°Æ¡ng',
    'var-name': 'Tráº§n VÄƒn BÃ¬nh',
    'var-cccd': '079204012345',
    'var-salary': '25.000.000 VNÄ',
    'var-dept': 'PhÃ²ng Ká»¹ thuáº­t',
  };

  // â”€â”€ Comment state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  ckComments: CkComment[] = [];
  selectedCommentId: string | null = null;
  pendingComment: CkComment | null = null;
  commentInput = '';

  // â”€â”€ Builder options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  builderOptions: SdDocumentBuilderOption = {
    comment: {
      debug: true,
      onPendingComment: (comment: CkComment) => {
        this.pendingComment = comment;
        this.commentInput = '';
        this.#getCommentPluginAPI()?.setPendingSelection(comment.startPath, comment.endPath);
        this.cdr.markForCheck();
      },
      onAddComment: () => {
        this.#getCommentPluginAPI()?.clearPendingSelection();
        this.pendingComment = null;
        this.commentInput = '';
        this.saveCommentsToStorage();
        this.cdr.markForCheck();
      },
      onSelectComment: (id: string | number) => {
        this.selectedCommentId = id as string;
        this.cdr.markForCheck();
      },
      onRemoveComment: () => {
        setTimeout(() => this.saveCommentsToStorage(), 100);
      },
      onChange: (comments: CkComment[]) => {
        this.ckComments = comments;
        this.cdr.markForCheck();
      },
      onCancelPending: () => {
        this.pendingComment = null;
        this.commentInput = '';
        this.cdr.markForCheck();
      },
    },

    onDropVariable: variable => {
      console.log('onDropVariable (trÆ°á»›c insert):', variable);
      return true; // validate/transform only â€” khÃ´ng gá»i variable.all() á»Ÿ Ä‘Ã¢y, chÆ°a cÃ³ trong model
    },

    // Fires SAU model.change() â†’ variable Ä‘Ã£ thá»±c sá»± cÃ³ trong model
    onAfterDropVariable: (variable: SdDocumentBuilderVariable) => {
      console.log('onAfterDropVariable (sau insert):', variable);
      this.refreshVariables(); // gá»i variable.all() an toÃ n, sáº½ tháº¥y biáº¿n má»›i
    },

    // Khi paste {{display}} tá»« bÃªn ngoÃ i â†’ tra cá»©u trong draggableVariables
    onPasteVariable: (display: string) => {
      const found = this.draggableVariables.find(v => v.display === display);
      console.log(`onPasteVariable("${display}") â†’`, found ?? 'not found');
      return found ?? null;
    },

    onPaste: (data: SdPasteEventData) => {
      console.log('Paste event:', data.source, `HTML: ${data.html?.length ?? 0} chars, Text: ${data.text.length} chars`);
    },
    orientation: 'LANDSCAPE',

    onOrientation: (orientation: 'PORTRAIT' | 'LANDSCAPE') => {
      console.log('Orientation changed:', orientation);
    },
  };

  // â”€â”€ Drag & drop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  onDragStart(event: DragEvent, variable: SdDocumentBuilderVariable) {
    event.dataTransfer?.setData('ck-variable', JSON.stringify(variable));
  }

  // â”€â”€ Variable binding API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  #getVariableAPI() {
    return this.builder.getVariablePluginAPI();
  }

  /** Láº¥y láº¡i danh sÃ¡ch variable duy nháº¥t (theo id) tá»« document */

  refreshVariables() {
    const all = this.#getVariableAPI()?.all() ?? [];
    const map = new Map<string, SdDocumentBuilderVariable>();
    for (const v of all) {
      if (!map.has(v.id)) {
        map.set(v.id, v);
        if (!(v.id in this.bindingInputs)) {
          this.bindingInputs[v.id] = '';
        }
      }
    }
    this.documentVariables = Array.from(map.values());
    this.cdr.markForCheck();
  }

  /** Bind 1 variable theo id */
  onBindSingle(id: string) {
    const value = this.bindingInputs[id]?.trim();
    const count = this.#getVariableAPI()?.bindValue(id, value ?? '') ?? 0;
    console.log(`bindValue('${id}', '${value}') â†’ ${count} instance(s) updated`);
  }

  /** Clear binding cá»§a 1 variable theo id */
  onClearSingle(id: string) {
    const count = this.#getVariableAPI()?.clearValue(id) ?? 0;
    console.log(`clearValue('${id}') â†’ ${count} instance(s) cleared`);
  }

  /** Bind táº¥t cáº£ báº±ng dá»¯ liá»‡u nháº­p trong form */
  onBindAll() {
    const map: Record<string, string> = {};
    for (const v of this.documentVariables) {
      const value = this.bindingInputs[v.id]?.trim();
      if (value) map[v.id] = value;
    }
    this.#getVariableAPI()?.bindValues(map);
    console.log('bindValues:', map);
  }

  /** Äiá»n sáºµn dá»¯ liá»‡u máº«u vÃ o cÃ¡c input vÃ  bind ngay */
  onFillSampleData() {
    for (const v of this.documentVariables) {
      if (this.sampleBindingData[v.id]) {
        this.bindingInputs[v.id] = this.sampleBindingData[v.id];
      }
    }
    this.onBindAll();
  }

  /** Clear toÃ n bá»™ binding trong document */
  onClearAll() {
    this.#getVariableAPI()?.clearAllValues();
    console.log('clearAllValues()');
  }

  // â”€â”€ Comment API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  #getCommentPluginAPI() {
    return this.builder.getCommentPluginAPI();
  }

  goToComment(id: string | number) {
    this.#getCommentPluginAPI()?.selectComment(id);
  }

  deleteComment(id: string | number) {
    this.#getCommentPluginAPI()?.removeComment(id);
  }

  confirmComment() {
    if (!this.pendingComment || !this.commentInput.trim()) return;
    const newComment: CkComment = {
      ...this.pendingComment,
      id: `comment-${Date.now()}`,
      data: { content: this.commentInput.trim() },
    };
    this.builder.getCommentPluginAPI()?.addComment(newComment);
  }

  cancelComment() {
    this.builder.getCommentPluginAPI()?.clearPendingSelection();
  }

  // â”€â”€ Toolbar actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  onPreviewPrint() {
    const content = this.builder.getContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>In áº¥n</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  onSave() {
    const html = this.builder.getContent();
    localStorage.setItem(this.STORAGE_KEY_CONTENT, html);
    this.saveCommentsToStorage();
    console.log('âœ… ÄÃ£ lÆ°u ná»™i dung vÃ  bÃ¬nh luáº­n vÃ o localStorage');
  }

  onLoadComments() {
    const savedComments = localStorage.getItem(this.STORAGE_KEY_COMMENTS);
    if (savedComments) {
      try {
        const comments: CkComment[] = JSON.parse(savedComments);
        this.#getCommentPluginAPI()?.setComments(comments);
        console.log('âœ… Loaded', comments.length, 'comments from localStorage');
      } catch (e) {
        console.error('âŒ Error parsing comments:', e);
      }
    }
  }

  onExportWord() {
    const header = '<p style="text-align: center; color: #666;">Cá»˜NG HÃ’A XÃƒ Há»˜I CHá»¦ NGHÄ¨A VIá»†T NAM</p>';
    const footer = `
      <table style="width: 100%; border: none;">
        <tr>
          <td style="border: none; text-align: left;">ÄÆ°á»£c táº¡o bá»Ÿi há»‡ thá»‘ng ABC</td>
          <td style="border: none; text-align: right;">
            Trang <span style="mso-field-code: PAGE"></span>
          </td>
        </tr>
      </table>
    `;
    this.builder.exportDocx({ fileName: 'hop_dong.docx', header, footer });
  }

  async onImportDocx() {
    const result = await this.docxService.open({
      validateFormat: true,
      validateSize: true,
      maxSizeInMb: 50,
    });
    if (result?.html) {
      this.builder.setContent(result.html);
      setTimeout(() => this.refreshVariables(), 200);
      console.log('DOCX imported successfully');
    }
  }

  private saveCommentsToStorage() {
    const comments = this.builder.getCommentPluginAPI()?.comments?.map(c => ({
      id: c.id,
      startPath: c.startPath,
      endPath: c.endPath,
      originalText: c.originalText,
      data: c.data,
    }));
    localStorage.setItem(this.STORAGE_KEY_COMMENTS, JSON.stringify(comments));
  }
}

