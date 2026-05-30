import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdPreviewImage, SdPreviewPdf } from '@sdcorejs/angular/components/preview';

@Component({
  selector: 'app-preview-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdPreviewImage, SdPreviewPdf],
  template: `
    <demo-page
      title="Preview"
      description="Bộ xem ảnh và PDF dạng lightbox — tự co theo container, hỗ trợ zoom / rotate / fullscreen / tải xuống. Có thể nhúng inline, trong sd-modal hoặc trong sd-side-drawer.">

      <demo-section heading="Thư viện ảnh — thanh thumbnail dưới">
        <div class="preview-box">
          <sd-preview-image [items]="images" [startIndex]="0"></sd-preview-image>
        </div>
      </demo-section>

      <demo-section heading="Ảnh đơn — không hiển thị thumbnail">
        <div class="preview-box">
          <sd-preview-image [items]="[singleImage]" thumbnailPosition="none"></sd-preview-image>
        </div>
      </demo-section>

      <demo-section heading="Xem PDF mẫu">
        <div class="preview-box">
          <sd-preview-pdf [source]="pdfUrl()" sidebar="thumbnails"></sd-preview-pdf>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .preview-box {
      width: 100%;
      height: 480px;
      border: 1px solid #e6e6e6;
      border-radius: 6px;
      overflow: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewDemoComponent {
  readonly images: string[] = [
    'https://picsum.photos/seed/sd1/1600/1000',
    'https://picsum.photos/seed/sd2/1200/1600',
    'https://picsum.photos/seed/sd3/2000/1200',
    'https://picsum.photos/seed/sd4/1400/1400',
    'https://picsum.photos/seed/sd5/1800/900',
  ];

  readonly singleImage = 'https://picsum.photos/seed/single/1920/1080';

  readonly pdfUrl = signal<string>('https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf');
}

