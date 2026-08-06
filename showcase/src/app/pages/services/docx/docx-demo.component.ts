import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDocxService } from '@sdcorejs/angular/services/docx';

@Component({
  selector: 'app-docx-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: `
    <demo-page #demoPage title="Docx" description="SdDocxService – chuyển đổi file .docx sang HTML qua pandoc.wasm. API chính: open() mở file picker; convertToHtml(file) / convertToHtmlString(file) chuyển trực tiếp một File/Blob.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mo-file-docx') {
      <demo-section heading="Mở file .docx" [props]="[{ name: 'open()', value: 'method' }]" note="open() – mở file picker, đọc file, gọi pandoc.wasm, trả về { html, messages }. WASM được tải lần đầu (~vài MB) nên có thể chậm.">
        <button mat-flat-button color="primary" [disabled]="busy()" (click)="onOpen()">Chọn file .docx</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chuyen-doi-sang-html') {
      <demo-section heading="Chuyển đổi sang HTML" [props]="[{ name: 'convertToHtmlString()', value: 'method' }]" note="convertToHtmlString() – không trả mảng cảnh báo.">
        <button mat-stroked-button color="primary" [disabled]="busy()" (click)="onOpenString()">Chọn file & lấy HTML</button>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ket-qua') {
      <demo-section heading="Kết quả">
        <div style="width:100%">
          <div style="font-size:12px;color:#666;margin-bottom:6px">{{ status() }}</div>
          @if (preview()) {
            <div style="max-height:280px;overflow:auto;border:1px solid #ddd;border-radius:6px;padding:12px;background:#fff" [innerHTML]="preview()"></div>
          }
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocxDemoComponent {
  readonly #docx = inject(SdDocxService);
  readonly busy = signal(false);
  readonly status = signal('(chưa chọn file)');
  readonly preview = signal<string | null>(null);

  async onOpen() {
    this.busy.set(true);
    this.status.set('Đang xử lý...');
    try {
      const result = await this.#docx.open();
      if (!result) {
        this.status.set('Đã hủy hoặc không có file.');
        this.preview.set(null);
      } else {
        this.status.set(`Thành công. ${result.messages.length} cảnh báo.`);
        this.preview.set(result.html);
      }
    } finally {
      this.busy.set(false);
    }
  }

  async onOpenString() {
    this.busy.set(true);
    this.status.set('Đang xử lý...');
    try {
      const html = await new Promise<string | null>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.doc,.docx';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) { resolve(null); return; }
          resolve(await this.#docx.convertToHtmlString(file));
        };
        input.click();
      });
      if (html == null) {
        this.status.set('Đã hủy hoặc lỗi chuyển đổi.');
        this.preview.set(null);
      } else {
        this.status.set('Đã chuyển đổi sang HTML.');
        this.preview.set(html);
      }
    } finally {
      this.busy.set(false);
    }
  }
}
