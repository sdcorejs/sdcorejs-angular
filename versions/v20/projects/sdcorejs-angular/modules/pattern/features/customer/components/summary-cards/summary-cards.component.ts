import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, model } from '@angular/core';
import { SdCard, SdCardGroup } from '@sdcorejs/angular/components/card';
import { SD_PAGE_LIST } from '@sdcorejs/angular/modules/layout';
import type { CustomerCounts, CustomerSegment } from '../../services/customer.model';

const CARDS: readonly { readonly key: 'all' | CustomerSegment; readonly label: string }[] = [
  { key: 'all', label: 'Tất cả khách hàng' },
  { key: 'individual', label: 'Cá nhân' },
  { key: 'business', label: 'Doanh nghiệp' },
  { key: 'vip', label: 'Khách VIP' },
];

/**
 * Score card của danh sách khách hàng: mỗi thẻ là một nhóm khách và là bộ lọc của danh sách.
 * Khi `sd-page-list` thu gọn (màn thấp), các thẻ thành một dòng 36px.
 */
@Component({
  selector: 'summary-cards',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-card-group
      class="summary"
      autoId="customer-segments"
      aria-label="Nhóm khách hàng"
      [class.summary--compact]="compact()"
      [(model)]="selected"
      (sdChange)="choose($event)">
      @for (card of cards(); track card.key) {
        <sd-card class="summary__card" [value]="card.key" [autoId]="'customer-segment-' + card.key">
          <span class="summary__label">{{ card.label }}</span>
          <strong class="summary__value">{{ card.value }}</strong>
        </sd-card>
      }
    </sd-card-group>
  `,
  styles: `
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .summary__card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 16px;
    }
    .summary__label {
      color: var(--sd-text-secondary);
      font-size: 13px;
    }
    .summary__value {
      font-size: 22px;
      line-height: 28px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .summary--compact {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 36px;
    }
    .summary--compact .summary__card {
      flex-direction: row;
      align-items: baseline;
      gap: 6px;
      padding: 4px 10px;
    }
    .summary--compact .summary__value {
      font-size: 14px;
      line-height: 20px;
    }
    @media (max-width: 767px) {
      .summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class SummaryCardsComponent {
  readonly #list = inject(SD_PAGE_LIST);
  readonly counts = input<CustomerCounts | null>(null);
  /** Nhóm đang lọc; `null` là tất cả. */
  readonly segment = model<CustomerSegment | null>(null);
  protected readonly compact = this.#list.compact;
  protected readonly selected = linkedSignal<'all' | CustomerSegment | null>(() => this.segment() ?? 'all');
  protected readonly cards = computed(() => {
    const counts = this.counts();
    return CARDS.map(card => ({ ...card, value: counts ? counts[card.key].toLocaleString('vi-VN') : '…' }));
  });

  protected choose(key: unknown): void {
    // Bấm lại thẻ đang chọn (model về null) hoặc thẻ "Tất cả" đều là bỏ lọc.
    const segment = key === null || key === 'all' ? null : (key as CustomerSegment);
    this.selected.set(segment ?? 'all');
    this.segment.set(segment);
  }
}
