import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdEditor, SdEditorImportDiagnostic, SdEditorOption } from '@sdcorejs/angular/components/editor';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { EDITOR_DEMO_HTML, readDemoImage } from '../../../shared/editor-demo-content';

@Component({
  selector: 'app-editor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdEditor, SdButton],
  template: `
    <demo-page
      #demoPage
      title="Editor"
      description="Soạn nội dung với thanh công cụ đầy đủ, bảng, ảnh, màu chữ và liên kết. Editor và Mini Editor dùng cùng một cấu trúc tài liệu.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-soan-noi-dung') {
        <demo-section heading="Soạn nội dung" [props]="[{ name: '[(model)]', value: 'two-way' }]">
          <div class="editor-box">
            <sd-editor
              #editor
              label="Mô tả chi tiết"
              placeholder="Nhập mô tả..."
              helperText="Chọn văn bản để định dạng; chọn ảnh để đổi kích thước và căn lề."
              height="420px"
              maxHeight="560px"
              [option]="imageOption"
              [(model)]="content"
              (sdChange)="lastChange.set($event.length)"
              (sdImportWarning)="recordWarnings($event)">
            </sd-editor>
            <div class="demo-actions">
              <sd-button type="outline" (click)="content.set(richContent)">Khôi phục nội dung mẫu</sd-button>
              <sd-button type="outline" (click)="saveImages(editor)">Hoàn tất ảnh đã chọn</sd-button>
            </div>
            <p class="hint">Demo giữ ảnh đã chọn trong HTML. Ứng dụng có thể dùng uploadFn để lưu ảnh qua API.</p>
            <p class="hint" role="status" aria-live="polite">
              {{ uploadStatus() || 'Lần thay đổi gần nhất: ' + lastChange() + ' ký tự HTML.' }}
            </p>
            @if (warning()) {
              <p class="hint" role="status">{{ warning() }}</p>
            }
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bieu-mau') {
        <demo-section
          heading="Biểu mẫu"
          [props]="[
            { name: 'required', value: 'true' },
            { name: '[maxlength]', value: '120' },
          ]">
          <div class="editor-box">
            <sd-editor
              label="Ghi chú bắt buộc"
              name="note"
              [form]="form"
              required
              [maxlength]="120"
              [disabled]="formDisabled()"
              height="180px"
              maxHeight="240px"
              [(model)]="formContent">
            </sd-editor>
            <div class="demo-actions">
              <sd-button type="outline" (click)="formContent.set('')">Xóa nội dung</sd-button>
              <sd-button type="outline" (click)="formDisabled.set(!formDisabled())">{{
                formDisabled() ? 'Mở biểu mẫu' : 'Vô hiệu hóa'
              }}</sd-button>
            </div>
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-doc') {
        <demo-section heading="Chỉ đọc" [props]="[{ name: 'readonly', value: 'true' }]">
          <div class="editor-box">
            <sd-editor label="Nội dung để đối chiếu" height="420px" maxHeight="560px" [readonly]="true" [(model)]="readOnlyContent">
            </sd-editor>
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
export class EditorDemoComponent {
  readonly richContent = EDITOR_DEMO_HTML;
  readonly content = signal(EDITOR_DEMO_HTML);
  readonly readOnlyContent = signal(EDITOR_DEMO_HTML);
  readonly formContent = signal('<p>Ghi chú có kiểm tra độ dài.</p>');
  readonly formDisabled = signal(false);
  readonly form = new FormGroup({});
  readonly lastChange = signal(0);
  readonly warning = signal('');
  readonly uploadStatus = signal('');
  readonly imageOption: SdEditorOption = {
    imageConfig: {
      uploadMode: 'deferred',
      maxImagesPerSelection: 3,
      validation: { maxSizeMB: 2, allowedFormats: ['png', 'jpg', 'jpeg', 'webp'] },
      uploadFn: files =>
        Promise.all(
          files.map(async file => ({
            idOrKey: crypto.randomUUID(),
            name: file.name,
            cdn: await readDemoImage(file),
          }))
        ),
    },
  };

  recordWarnings(diagnostics: readonly SdEditorImportDiagnostic[]): void {
    this.warning.set(diagnostics.map(item => item.code).join(', '));
  }

  async saveImages(editor: SdEditor): Promise<void> {
    try {
      const html = await editor.upload();
      this.uploadStatus.set('Đã hoàn tất ảnh; nội dung có ' + html.length + ' ký tự HTML.');
    } catch (error) {
      this.uploadStatus.set(error instanceof Error ? error.message : 'Không hoàn tất được ảnh.');
    }
  }
}
