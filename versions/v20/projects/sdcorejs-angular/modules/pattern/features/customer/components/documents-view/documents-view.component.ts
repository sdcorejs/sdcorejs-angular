import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { SdDataState, SdDataStateTemplateDirective } from '@sdcorejs/angular/components/data-state';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import type { CustomerDocumentDto } from '../../services/customer.model';
import { CustomerService } from '../../services/customer.service';
import { DocumentPreviewComponent } from './document-preview.component';

@Component({
  selector: 'documents-view',
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdDataState, SdDataStateTemplateDirective, SdFormatNumberPipe, DocumentPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-table #table autoId="customer-documents" syncQueryParams [option]="option">
      <ng-template sdDataStateTemplate let-state let-retry="retry">
        <sd-data-state
          [state]="state"
          compact
          [retryable]="state === 'error'"
          [title]="state === 'error' ? 'Không tải được tài liệu' : undefined"
          [message]="
            state === 'empty' ? (table.isFiltered() ? 'Không có tài liệu phù hợp với bộ lọc.' : 'Khách hàng chưa có tài liệu.') : undefined
          "
          (sdRetry)="retry()" />
      </ng-template>
      <ng-template sdTableCellDef="name" let-document="item">
        <button class="text-primary" type="button" (click)="preview.open(document)">{{ document.name }}</button>
      </ng-template>
      <ng-template sdTableCellDef="size" let-document="item">{{ document.size / 1024 | sdFormatNumber: 0 }} KB</ng-template>
    </sd-table>
    <document-preview #preview />
  `,
  styles: `
    button {
      font: inherit;
      text-align: start;
      cursor: pointer;
      padding: 0;
      border: 0;
      background: none;
    }
    button:hover {
      text-decoration: underline;
    }
  `,
})
export class DocumentsViewComponent {
  readonly #service = inject(CustomerService);
  readonly #destroy = inject(DestroyRef);
  readonly customerId = input.required<string>();
  protected readonly option: SdTableOption<CustomerDocumentDto> = {
    type: 'server',
    rowKey: 'id',
    items: (_, req) => firstValueFrom(this.#service.documents(this.customerId(), req).pipe(takeUntilDestroyed(this.#destroy))),
    paginate: { pageSize: 10 },
    filter: { hideInlineFilter: 'auto' },
    columns: [
      { field: 'name', title: 'Tên tài liệu', type: 'string' },
      { field: 'uploadedAt', title: 'Ngày tải lên', type: 'date', width: '160px' },
      { field: 'size', title: 'Dung lượng', type: 'number', align: 'right', width: '130px', filter: { disabled: true } },
    ],
  };
}
