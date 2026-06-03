import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdMiniEditor, SdMiniEditorOption } from '@sdcorejs/angular/components/mini-editor';

@Component({
  selector: 'app-mini-editor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdMiniEditor, FormsModule],
  template: `
    <demo-page
      title="Mini Editor"
      description="Editor đơn giản (bold / italic / link / list) dành cho ô comment, ghi chú ngắn. Hỗ trợ mention và xuất HTML hoặc Markdown.">

      <demo-section heading="Định dạng đầu ra HTML" [props]="[{ name: 'outputFormat', value: 'html' }]">
        <div class="editor-box">
          <sd-mini-editor
            [option]="commentOption"
            [(ngModel)]="commentContent">
          </sd-mini-editor>
          <p class="hint">Định dạng đầu ra: HTML</p>
        </div>
      </demo-section>

      <demo-section heading="Định dạng đầu ra Markdown" [props]="[{ name: 'outputFormat', value: 'markdown' }]">
        <div class="editor-box">
          <sd-mini-editor
            [option]="markdownOption"
            [(ngModel)]="markdownContent">
          </sd-mini-editor>
          <p class="hint">Định dạng đầu ra: Markdown</p>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .editor-box {
      width: 100%;
      max-width: 560px;
    }
    .hint {
      margin: 6px 0 0;
      font-size: 12px;
      color: #6b6b6b;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniEditorDemoComponent {
  readonly commentOption: SdMiniEditorOption = {
    outputFormat: 'html',
    placeholder: 'Nhập bình luận của bạn...',
    maxHeight: '160px',
  };

  readonly markdownOption: SdMiniEditorOption = {
    outputFormat: 'markdown',
    placeholder: 'Ghi chú (Markdown)...',
    maxHeight: '160px',
  };

  commentContent = '<p>Đồng ý với <strong>đề xuất</strong> trên!</p>';
  markdownContent = '**Lưu ý:** Đây là ghi chú Markdown.';
}
