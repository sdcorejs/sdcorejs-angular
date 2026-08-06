import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdPreviewImage, SdPreviewPdf } from '@sdcorejs/angular/components/preview';
import { createPreviewPdfFixture } from './preview-pdf.fixture';

@Component({
  selector: 'app-preview-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdPreviewImage, SdPreviewPdf],
  template: `
    <demo-page
      #demoPage
      title="Preview"
      description="Bộ xem ảnh và PDF dạng lightbox — tự co theo container, hỗ trợ zoom / rotate / fullscreen / tải xuống. Có thể nhúng inline, trong sd-modal hoặc trong sd-side-drawer.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-thu-vien-anh') {
        <demo-section heading="Thư viện ảnh" [props]="[{ name: 'items', value: '[…]' }]">
          <div class="preview-box">
            <sd-preview-image [items]="images" [startIndex]="0"></sd-preview-image>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-anh-don') {
        <demo-section heading="Ảnh đơn" [props]="[{ name: 'thumbnailPosition', value: 'none' }]">
          <div class="preview-box">
            <sd-preview-image [items]="[singleImage]" thumbnailPosition="none"></sd-preview-image>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-xem-pdf') {
        <demo-section
          heading="Xem PDF"
          [props]="[
            { name: 'source', value: 'local 3-page fixture' },
            { name: 'sidebar', value: 'thumbnails' },
          ]">
          <div class="preview-box">
            <sd-preview-pdf [source]="pdfSource()" sidebar="thumbnails"></sd-preview-pdf>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-pdf-nang-cao') {
        <demo-section
          heading="PDF nâng cao"
          [props]="[
            { name: 'sidebar', value: 'outline' },
            { name: 'scrollMode', value: 'continuous' },
            { name: 'fixture', value: '3 pages + PDF Outlines' },
            { name: 'print', value: 'header action / Ctrl+P' },
          ]">
          <div class="preview-box preview-box--advanced-pdf">
            <sd-preview-pdf [source]="pdfSource()" sidebar="outline" scrollMode="continuous"></sd-preview-pdf>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .preview-box {
        width: 100%;
        height: 480px;
        border: 1px solid #e6e6e6;
        border-radius: 6px;
        overflow: hidden;
      }

      .preview-box--advanced-pdf {
        height: 640px;
      }
    `,
  ],
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

  readonly pdfSource = signal<Uint8Array>(createPreviewPdfFixture());
}
