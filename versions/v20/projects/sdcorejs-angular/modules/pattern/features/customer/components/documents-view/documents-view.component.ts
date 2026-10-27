import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDocumentDto } from '../../services/customer.model';

/** Tab Tài liệu của hồ sơ 360°: danh sách ngắn, trạng thái riêng bằng `sd-data-state`. */
@Component({
  selector: 'documents-view',
  standalone: true,
  imports: [SdDataState, SdSection, SdSectionItem, SdFormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-data-state
      [state]="state()"
      retryable
      title=""
      [message]="state() === 'empty' ? 'Khách hàng chưa có tài liệu.' : undefined"
      (sdRetry)="load()">
      <sd-section title="Tài liệu">
        @for (document of documents(); track document.id) {
          <sd-section-item [label]="document.name">{{ document.size / 1024 | sdFormatNumber: 0 }} KB</sd-section-item>
        }
      </sd-section>
    </sd-data-state>
  `,
})
export class DocumentsViewComponent implements OnInit {
  readonly #customerService = inject(CustomerService);
  readonly customerId = input.required<string>();
  protected readonly state = signal<'loading' | 'empty' | 'error' | 'success'>('loading');
  protected readonly documents = signal<readonly CustomerDocumentDto[]>([]);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      const res = await firstValueFrom(this.#customerService.documents(this.customerId()));
      this.documents.set(res.items);
      this.state.set(res.items.length ? 'success' : 'empty');
    } catch {
      this.state.set('error');
    }
  }
}
