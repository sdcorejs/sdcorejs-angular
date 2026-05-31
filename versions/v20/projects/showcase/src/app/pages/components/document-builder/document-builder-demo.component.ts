import { AfterViewInit, ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdDocumentBuilder, SdDocumentBuilderOption } from '@sdcorejs/angular/components/document-builder';

@Component({
  selector: 'app-document-builder-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdDocumentBuilder],
  template: `
    <demo-page
      title="Document Builder"
      description="Trình soạn thảo tài liệu đầy đủ — định dạng nâng cao, chèn bảng, ảnh, heading, biến (variable), comment. Dùng để dựng mẫu hợp đồng, văn bản nội bộ.">

      <demo-section heading="Soạn mẫu hợp đồng lao động">
        <div class="doc-box">
          <sd-document-builder
            style="height: 100%; width: 100%"
            [option]="builderOption"
            (contentChange)="onContentChange($event)">
          </sd-document-builder>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .doc-box {
      width: 100%;
      height: 520px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentBuilderDemoComponent implements AfterViewInit {
  readonly builderRef = viewChild(SdDocumentBuilder);

  readonly builderOption: SdDocumentBuilderOption = {
    orientation: 'PORTRAIT',
  };

  readonly defaultContent = `
    <h2>HỢP ĐỒNG LAO ĐỘNG</h2>
    <p>Hôm nay, ngày ____/____/______, tại văn phòng công ty, chúng tôi gồm có:</p>
    <p><strong>Bên A:</strong> Công ty TNHH ABC</p>
    <p><strong>Bên B:</strong> Ông/Bà ______________________, CCCD số ______________</p>
    <h3>Điều 1: Công việc và địa điểm làm việc</h3>
    <p>Bên B đồng ý làm việc tại vị trí lập trình viên, thuộc phòng Công nghệ thông tin.</p>
    <h3>Điều 2: Thời hạn hợp đồng</h3>
    <p>Hợp đồng có thời hạn 12 tháng, kể từ ngày ký.</p>
    <h3>Điều 3: Lương và phúc lợi</h3>
    <p>Mức lương cơ bản là 20.000.000 VNĐ mỗi tháng.</p>
  `;

  readonly htmlOutput = signal<string>('');

  ngAfterViewInit(): void {
    // Document Builder không có @Input content — phải gọi setContent sau khi view init.
    queueMicrotask(() => this.builderRef()?.setContent(this.defaultContent));
  }

  onContentChange(html: string): void {
    this.htmlOutput.set(html);
  }
}
