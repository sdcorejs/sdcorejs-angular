import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, model } from '@angular/core';
import { SdCard, SdCardGroup } from '@sdcorejs/angular/components/card';
import { SD_PAGE_LIST } from '@sdcorejs/angular/modules/layout';
import type { OrderCounts, OrderStatus } from '../../services/order.model';

type CardKey = 'all' | 'pending' | 'shipping';

const CARDS: readonly { readonly key: CardKey; readonly label: string }[] = [
  { key: 'all', label: 'Tổng đơn' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'shipping', label: 'Đang giao' },
];

/** 1.234.567.890 → "1,2 tỷ"; 350.000.000 → "350 triệu". */
function money(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  return `${Math.round(value / 1_000_000).toLocaleString('vi-VN')} triệu`;
}

/**
 * Score card của danh sách đơn: ba thẻ đầu lọc theo trạng thái, đồng bộ với tab vì cùng một state; thẻ doanh thu
 * chỉ để xem. Khi `sd-page-list` thu gọn (màn thấp), các thẻ thành một dòng 36px.
 */
@Component({
  selector: 'summary-cards',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-card-group
      class="summary"
      autoId="order-summary"
      aria-label="Tóm tắt đơn hàng"
      [class.summary--compact]="compact()"
      [(model)]="selected"
      (sdChange)="choose($event)">
      @for (card of cards(); track card.key) {
        <sd-card class="summary__card" [value]="card.key" [autoId]="'order-summary-' + card.key">
          <span class="summary__label">{{ card.label }}</span>
          <strong class="summary__value">{{ card.value }}</strong>
        </sd-card>
      }
      <div class="summary__card summary__card--static" data-autoid="order-summary-revenue">
        <span class="summary__label">Doanh thu hoàn tất</span>
        <strong class="summary__value">{{ revenue() }}</strong>
      </div>
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
    .summary__card--static {
      border: 1px solid var(--sd-border);
      border-radius: 8px;
      background: var(--sd-surface);
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
    .summary--compact .summary__card--static {
      border: 0;
      background: transparent;
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
  readonly counts = input<OrderCounts | null>(null);
  /** Trạng thái đang lọc; `null` là tất cả. */
  readonly status = model<OrderStatus | null>(null);
  protected readonly cards = computed(() => {
    const counts = this.counts();
    return CARDS.map(card => ({ ...card, value: counts ? counts[card.key].toLocaleString('vi-VN') : '…' }));
  });
  protected readonly compact = inject(SD_PAGE_LIST).compact;
  /** Trạng thái chọn từ tab mà không có thẻ (Hoàn tất, Đã huỷ): không thẻ nào sáng. */
  protected readonly selected = linkedSignal<CardKey | null>(() => {
    const status = this.status();
    return status === null ? 'all' : status === 'pending' || status === 'shipping' ? status : null;
  });
  protected readonly revenue = computed(() => {
    const counts = this.counts();
    return counts ? money(counts.revenue) : '…';
  });

  protected choose(key: unknown): void {
    // Bấm lại thẻ đang chọn (model về null) hoặc thẻ Tổng đơn đều là bỏ lọc.
    const card = (key as CardKey | null) ?? 'all';
    this.selected.set(card);
    this.status.set(card === 'all' ? null : card);
  }
}
