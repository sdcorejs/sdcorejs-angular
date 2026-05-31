import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdEditor } from '@sdcorejs/angular/components/editor';

@Component({
  selector: 'app-editor-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdEditor],
  template: `
    <demo-page
      title="Editor"
      description="Rich text editor dựa trên CKEditor 5 — đầy đủ thanh công cụ, hỗ trợ chèn ảnh, validation và FormGroup binding.">

      <demo-section heading="Soạn nội dung mô tả sản phẩm">
        <div class="editor-box">
          <sd-editor
            label="Mô tả chi tiết"
            placeholder="Nhập mô tả sản phẩm..."
            helperText="Hỗ trợ định dạng đậm / nghiêng / gạch chân / màu chữ."
            height="240px"
            maxHeight="360px"
            [(model)]="content">
          </sd-editor>
        </div>
      </demo-section>

      <demo-section heading="Chế độ chỉ đọc (xem)">
        <div class="editor-box">
          <sd-editor
            label="Điều khoản dịch vụ"
            height="200px"
            [readonly]="true"
            [(model)]="readOnlyContent">
          </sd-editor>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .editor-box {
      width: 100%;
      max-width: 720px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorDemoComponent {
  readonly content = signal<string>('<p>Sản phẩm <strong>SP-001</strong> được thiết kế dành cho doanh nghiệp vừa và nhỏ.</p><ul><li>Bảo hành 12 tháng</li><li>Hỗ trợ kỹ thuật 24/7</li></ul>');
  readonly readOnlyContent = signal<string>('<p><em>Bằng việc sử dụng dịch vụ, bạn đồng ý với các điều khoản sau:</em></p><ol><li>Không chia sẻ tài khoản cho bên thứ ba.</li><li>Tuân thủ chính sách bảo mật của hệ thống.</li></ol>');
}

