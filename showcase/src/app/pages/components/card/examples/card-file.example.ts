import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdCard, SdCardActionsDirective, SdCardGroup, type SdCardFileData } from '@sdcorejs/angular/components/card';

/** Inline placeholder picture so the example has a thumbnail without a network request. */
const STORE_THUMBNAIL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 88"><rect width="160" height="88" fill="#cfe3f5"/>' +
      '<rect x="30" y="34" width="100" height="54" fill="#7aa7d1"/><rect x="66" y="56" width="28" height="32" fill="#3d6f9e"/></svg>'
  );

@Component({
  selector: 'app-card-file-example',
  standalone: true,
  imports: [SdButton, SdCard, SdCardActionsDirective, SdCardGroup],
  templateUrl: './card-file.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFileExampleComponent {
  readonly files: readonly { readonly id: string; readonly data: SdCardFileData }[] = [
    { id: 'contract', data: { name: 'Hợp đồng nguyên tắc 2026.pdf', size: 1_258_291 } },
    { id: 'store', data: { name: 'Ảnh cửa hàng Q1.jpg', size: 2_516_582, thumbnail: STORE_THUMBNAIL } },
    { id: 'prices', data: { name: 'Bảng giá áp dụng Q4.xlsx', size: 90_112 } },
    { id: 'handover', data: { name: 'Biên bản bàn giao.docx', size: 143_360 } },
  ];
  readonly selected = signal<string | string[] | null>(['handover']);
  readonly lastAction = signal('Chưa có tác vụ');
}
