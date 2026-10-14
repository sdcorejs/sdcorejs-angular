import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdMiniEditor, SdEditorImportDiagnostic, SdMiniEditorOption } from '@sdcorejs/angular/components/mini-editor';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { EDITOR_DEMO_HTML, EDITOR_DEMO_MARKDOWN } from '../../../shared/editor-demo-content';

@Component({
  selector: 'app-mini-editor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdMiniEditor, SdButton, FormsModule, ReactiveFormsModule],
  template: `
    <demo-page
      #demoPage
      title="Mini Editor"
      description="Thanh công cụ gọn cho bình luận và ghi chú; vẫn giữ bảng, ảnh, chú thích và định dạng có sẵn. Hỗ trợ mention, biểu mẫu và Markdown.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-dau-ra-html') {
        <demo-section heading="Định dạng đầu ra HTML" [props]="[{ name: 'outputFormat', value: 'html' }]">
          <div class="editor-box">
            <sd-mini-editor
              [option]="commentOption"
              [(ngModel)]="commentContent"
              (contentChange)="lastChange.set($event.length)"
              (importWarning)="recordWarnings($event)">
            </sd-mini-editor>
            <div class="demo-actions">
              <sd-button type="outline" (click)="commentContent = richContent">Khôi phục nội dung mẫu</sd-button>
            </div>
            <p class="hint">Cùng nội dung mẫu với Editor. Gõ &#64; để chọn An hoặc Bình.</p>
            <p class="hint" role="status" aria-live="polite">Lần thay đổi gần nhất: {{ lastChange() }} ký tự HTML.</p>
            @if (warning()) {
              <p class="hint" role="status">{{ warning() }}</p>
            }
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dinh-dang-dau-ra-markdown') {
        <demo-section heading="Định dạng đầu ra Markdown" [props]="[{ name: 'outputFormat', value: 'markdown' }]">
          <div class="editor-box">
            <sd-mini-editor [option]="markdownOption" [(ngModel)]="markdownContent"></sd-mini-editor>
            <p class="hint">Nội dung được xuất dưới dạng Markdown.</p>
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bieu-mau') {
        <demo-section heading="Biểu mẫu" [props]="[{ name: '[formControl]', value: 'FormControl' }]">
          <div class="editor-box">
            <sd-mini-editor [option]="formOption" [formControl]="formNote"></sd-mini-editor>
            <div class="demo-actions">
              <sd-button type="outline" (click)="toggleForm()">{{ formDisabled() ? 'Mở biểu mẫu' : 'Vô hiệu hóa' }}</sd-button>
              <sd-button type="outline" (click)="resetForm()">Khôi phục ghi chú</sd-button>
            </div>
            <p class="hint">Blur đánh dấu touched; trạng thái disabled lấy từ FormControl.</p>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .editor-box {
        width: 100%;
        max-width: 800px;
      }
      .demo-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }
      .hint {
        margin: 8px 0 0;
        opacity: 0.72;
        font-size: 13px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniEditorDemoComponent {
  readonly richContent = EDITOR_DEMO_HTML;
  readonly lastChange = signal(0);
  readonly warning = signal('');
  readonly formDisabled = signal(false);
  readonly formNote = new FormControl('<p>Ghi chú trong biểu mẫu.</p>', { nonNullable: true });
  readonly commentOption: SdMiniEditorOption = {
    outputFormat: 'html',
    placeholder: 'Nhập bình luận...',
    maxHeight: '560px',
    enableMention: true,
    mentionConfig: {
      feeds: [
        {
          marker: '@',
          feed: [
            { id: 'an', name: 'An' },
            { id: 'binh', name: 'Bình' },
          ],
          minimumCharacters: 0,
        },
      ],
    },
  };
  readonly markdownOption: SdMiniEditorOption = { outputFormat: 'markdown', placeholder: 'Ghi chú...', maxHeight: '240px' };
  readonly formOption: SdMiniEditorOption = { placeholder: 'Ghi chú biểu mẫu...', maxHeight: '240px' };
  commentContent = EDITOR_DEMO_HTML;
  markdownContent = EDITOR_DEMO_MARKDOWN;

  recordWarnings(diagnostics: readonly SdEditorImportDiagnostic[]): void {
    this.warning.set(diagnostics.map(item => item.code).join(', '));
  }

  toggleForm(): void {
    if (this.formNote.disabled) this.formNote.enable();
    else this.formNote.disable();
    this.formDisabled.set(this.formNote.disabled);
  }

  resetForm(): void {
    this.formNote.setValue('<p>Ghi chú trong biểu mẫu.</p>');
  }
}
