import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';

@Component({
  selector: 'app-upload-file-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdUploadFile],
  template: `
    <demo-page
      title="Upload File"
      description="Tải lên tệp tin / hình ảnh — kéo thả, đa file, validate đuôi và dung lượng, có preview thumbnail. Hỗ trợ FormGroup và two-way [(model)].">

      <demo-section heading="Tải nhiều ảnh có giới hạn" [props]="[{ name: 'type', value: 'image' }, { name: 'max', value: '5' }, { name: 'maxSize', value: '2' }, { name: 'model', value: 'two-way' }]">
        <div class="control-box">
          <sd-upload-file
            label="Ảnh sản phẩm"
            type="image"
            helperText="Ảnh sẽ hiển thị trên trang chi tiết sản phẩm."
            [extensions]="['jpg', 'jpeg', 'png']"
            [maxSize]="2"
            [max]="5"
            [(model)]="productImages">
          </sd-upload-file>
        </div>
      </demo-section>

      <demo-section
        heading="Tải tài liệu + báo lỗi required"
        [props]="[{ name: 'type', value: 'document' }, { name: 'required', value: 'true' }, { name: '[form]', value: 'FormGroup' }]"
        note="Bấm Kiểm tra (mô phỏng submit → markAllAsTouched) khi chưa đính kèm file: message lỗi đỏ 'Vui lòng tải tệp' hiện ngay dưới vùng upload. Đính kèm 1 file rồi Kiểm tra lại → lỗi biến mất.">
        <div class="control-box" style="display:flex; flex-direction:column; gap:12px">
          <sd-upload-file
            label="Tài liệu đính kèm"
            type="document"
            helperText="Đính kèm hợp đồng / phụ lục / biên bản."
            [extensions]="['pdf', 'doc', 'docx', 'xlsx']"
            [maxSize]="10"
            [max]="3"
            required
            [form]="form"
            name="attachments">
          </sd-upload-file>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="resetForm()">Đặt lại</button>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Vô hiệu hóa (chỉ đọc)" [props]="[{ name: 'disabled', value: 'true' }]">
        <div class="control-box">
          <sd-upload-file
            label="Đã đính kèm"
            type="file"
            [disabled]="true"
            [model]="['demo-file-id']">
          </sd-upload-file>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .control-box {
      width: 100%;
      max-width: 560px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFileDemoComponent {
  readonly productImages = signal<(string | number)[]>([]);
  readonly form = new FormGroup({});

  check() { this.form.markAllAsTouched(); }
  resetForm() { this.form.reset(); this.form.markAsUntouched(); }
}
