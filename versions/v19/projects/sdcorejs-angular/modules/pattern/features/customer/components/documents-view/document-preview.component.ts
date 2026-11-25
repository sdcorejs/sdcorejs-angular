import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdPreviewPdf } from '@sdcorejs/angular/components/preview';
import type { CustomerDocumentDto } from '../../services/customer.model';

@Component({
  selector: 'document-preview',
  imports: [SdModal, SdPreviewPdf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-modal [title]="document()?.name" width="lg" height="80vh" enableBackdropClose (sdClosed)="document.set(null)">
      @if (source(); as pdf) {
        <sd-preview-pdf [source]="pdf" [title]="document()?.name" />
      }
    </sd-modal>
  `,
})
export class DocumentPreviewComponent {
  private readonly modal = viewChild.required(SdModal);
  protected readonly document = signal<CustomerDocumentDto | null>(null);
  protected readonly source = computed(() => {
    const url = this.document()?.previewUrl;
    if (!url) return null;
    // The fixture supplies a PDF rendition, including for office documents. Give PDF.js the local bytes directly.
    const prefix = 'data:application/pdf;base64,';
    return url.startsWith(prefix) ? Uint8Array.from(atob(url.slice(prefix.length)), char => char.charCodeAt(0)) : url;
  });

  open(document: CustomerDocumentDto): void {
    this.document.set(document);
    this.modal().open();
  }
}
