import { SdButton } from '@sdcorejs/angular/components/button';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
import { SdNotifyService } from '@sdcorejs/angular/services';
import { registerUploadedSample, uploadSampleDetails } from './upload-file-samples';

@Component({
  selector: 'app-upload-file-demo',
  standalone: true,
  imports: [SdButton, DemoPageComponent, DemoSectionComponent, SdUploadFile],
  template: `
    <demo-page
      #demoPage
      title="Upload File"
      description="Tải lên tệp tin / hình ảnh — kéo thả, đa file, validate đuôi và dung lượng, có preview thumbnail. Hỗ trợ FormGroup và two-way [(model)].">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tai-nhieu-anh-co-gioi-han') {
        <demo-section
          heading="Tải nhiều ảnh có giới hạn"
          [props]="[
            { name: 'type', value: 'image' },
            { name: 'max', value: '5' },
            { name: 'maxSize', value: '2' },
            { name: 'model', value: 'two-way' },
          ]">
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
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tai-tai-lieu-bao-loi-required') {
        <demo-section
          heading="Tải tài liệu + báo lỗi required"
          [props]="[
            { name: 'type', value: 'document' },
            { name: 'required', value: 'true' },
            { name: '[form]', value: 'FormGroup' },
          ]"
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
              <sd-button (click)="check()" size="sm" type="light" color="secondary" htmlType="button" title="Kiểm tra"></sd-button>
              <sd-button (click)="resetForm()" size="sm" type="light" color="secondary" htmlType="button" title="Đặt lại"></sd-button>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-anh-va-tai-lieu-xem-truoc') {
        <demo-section
          heading="Ảnh và tài liệu, xem trước"
          [props]="[
            { name: 'type', value: 'file' },
            { name: 'details', value: 'fn' },
            { name: 'upload', value: 'fn' },
          ]"
          note="Bấm một ảnh hay một hàng tài liệu để mở popup tại đúng file đó (←/→, +/−/0, Esc). Thả tệp từ máy vào ô Tải lên; tệp sai định dạng hay quá 5 MB nằm lại trong danh sách cùng lý do. Gọi upload() để thấy hàng đang tải lên; bật mô phỏng lỗi để thấy hàng lỗi và nút Thử lại.">
          <div class="control-box" style="display:flex; flex-direction:column; gap:12px">
            <sd-upload-file
              #mixed
              label="Hồ sơ hiện trường"
              type="file"
              [extensions]="['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx', 'zip']"
              [maxSize]="5"
              [max]="10"
              [details]="details"
              [upload]="upload"
              [download]="download"
              [(model)]="mixedFiles">
            </sd-upload-file>
            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px">
              <sd-button (click)="uploadNow()" size="sm" type="light" color="primary" htmlType="button" title="Gọi upload()"></sd-button>
              <label style="display:flex; align-items:center; gap:6px; font-size:13px">
                <input type="checkbox" [checked]="failUpload()" (change)="failUpload.set(!failUpload())" />
                Mô phỏng lỗi tải lên
              </label>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-inline-trong-bang') {
        <demo-section
          heading="Inline trong bảng"
          [props]="[
            { name: 'variant', value: 'inline' },
            { name: 'maxOfImage', value: '3' },
          ]"
          note="Một dòng cao 32px: ô tải lên, ảnh, chip tài liệu và +N cho phần còn lại. Không nhãn, mô tả hay bộ đếm.">
          <table class="inline-table">
            <thead>
              <tr><th>Hồ sơ</th><th>Chứng từ</th></tr>
            </thead>
            <tbody>
              @for (row of inlineRows; track row.name) {
                <tr>
                  <td>{{ row.name }}</td>
                  <td>
                    <sd-upload-file variant="inline" type="file" [maxOfImage]="3" [disabled]="row.disabled" [details]="details" [upload]="upload" [(model)]="row.files"></sd-upload-file>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-vo-hieu-hoa-chi-doc') {
        <demo-section heading="Vô hiệu hóa (chỉ đọc)" [props]="[{ name: 'disabled', value: 'true' }]">
          <div class="control-box">
            <sd-upload-file label="Đã đính kèm" type="file" [disabled]="true" [details]="details" [model]="readonlyFiles"> </sd-upload-file>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      @media (max-width: 600px) {
        :host ::ng-deep sd-button button {
          min-height: 44px;
        }
      }
      .control-box {
        width: 100%;
        max-width: 560px;
      }
      .inline-table {
        width: 100%;
        max-width: 640px;
        border-collapse: collapse;
        font-size: 13px;
      }
      .inline-table th,
      .inline-table td {
        padding: 6px 12px;
        border-bottom: 1px solid var(--sd-border);
        text-align: left;
        vertical-align: middle;
      }
      .inline-table th {
        color: var(--sd-text-secondary);
        font-weight: 500;
      }
      .inline-table td:last-child {
        width: 60%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFileDemoComponent {
  readonly #notify = inject(SdNotifyService);
  readonly productImages = signal<(string | number)[]>([]);
  readonly form = new FormGroup({});
  readonly mixed = viewChild<SdUploadFile>('mixed');
  readonly failUpload = signal(false);
  readonly details = uploadSampleDetails;
  mixedFiles: (string | number)[] = ['img-hien-truong-1', 'img-hien-truong-2', 'img-bien-ban', 'doc-hop-dong', 'doc-bang-ke', 'doc-phu-luc'];
  readonly readonlyFiles = ['img-hien-truong-1', 'img-hien-truong-2', 'img-bien-ban', 'img-mat-truoc', 'doc-hop-dong', 'doc-ho-so'];
  readonly inlineRows = [
    { name: 'Chưa có chứng từ', files: [] as (string | number)[], disabled: false },
    { name: 'Hai ảnh và hợp đồng', files: ['img-hien-truong-1', 'img-bien-ban', 'doc-hop-dong'] as (string | number)[], disabled: false },
    { name: 'Nhiều tệp (+N)', files: ['img-hien-truong-1', 'img-hien-truong-2', 'img-bien-ban', 'doc-hop-dong', 'doc-bang-ke', 'doc-ho-so'] as (string | number)[], disabled: false },
    { name: 'Chỉ xem', files: ['img-mat-truoc', 'doc-phu-luc'] as (string | number)[], disabled: true },
  ];

  // why: mô phỏng server — chờ 1.5s rồi trả một id cho mỗi file, hoặc báo lỗi khi bật công tắc.
  readonly upload = async (files: File[]): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (this.failUpload()) throw new Error('Mô phỏng lỗi tải lên');
    return files.map((file, index) => {
      const id = `uploaded-${Date.now()}-${index}`;
      registerUploadedSample(id, file);
      return id;
    });
  };

  readonly download = async (id: string | number): Promise<void> => {
    this.#notify.info(`Tải xuống ${id}`);
  };

  uploadNow() {
    this.mixed()
      ?.upload()
      .catch(() => this.#notify.error('Tải lên thất bại — bấm Thử lại trên hàng lỗi.'));
  }

  check() {
    this.form.markAllAsTouched();
  }
  resetForm() {
    this.form.reset();
    this.form.markAsUntouched();
  }
}
