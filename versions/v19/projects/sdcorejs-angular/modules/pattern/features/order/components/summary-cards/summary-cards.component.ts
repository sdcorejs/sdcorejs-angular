import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, model } from '@angular/core';
import { SdCard, SdCardGroup, type SdCardContent } from '@sdcorejs/angular/components/card';
import { SD_PAGE_LIST } from '@sdcorejs/angular/modules/layout';
import type { OrderCounts, OrderStatus } from '../../services/order.model';

type CardKey = 'all' | 'pending' | 'shipping';

const CARDS: readonly { readonly key: CardKey; readonly label: string }[] = [
  { key: 'all', label: 'Tổng đơn' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'shipping', label: 'Đang giao' },
];

/**
 * Score card của danh sách đơn: ba thẻ đầu lọc theo trạng thái, đồng bộ với tab vì cùng một state; thẻ doanh thu
 * là thẻ `static` cuối nhóm, chỉ để xem. Khi `sd-page-list` thu gọn (màn thấp), các thẻ thành một dòng 32px.
 */
@Component({
  selector: 'summary-cards',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-card-group
      class="sd-card-grid"
      autoId="order-summary"
      aria-label="Tóm tắt đơn hàng"
      [class.sd-card-grid--sm]="compact()"
      [(model)]="selected"
      (sdChange)="choose($event)">
      @for (card of cards(); track card.key) {
        <sd-card [value]="card.key" [autoId]="'order-summary-' + card.key" [content]="card.content" [size]="compact() ? 'sm' : 'md'" />
      }
      <sd-card behavior="static" autoId="order-summary-revenue" [content]="revenue()" [size]="compact() ? 'sm' : 'md'" />
    </sd-card-group>
  `,
})
export class SummaryCardsComponent {
  readonly counts = input<OrderCounts | null>(null);
  /** Trạng thái đang lọc; `null` là tất cả. */
  readonly status = model<OrderStatus | null>(null);
  protected readonly cards = computed(() => {
    const counts = this.counts();
    return CARDS.map(card => {
      const content: SdCardContent = { layout: 'stat', data: { label: card.label, value: counts ? counts[card.key] : null } };
      return { key: card.key, content };
    });
  });
  protected readonly compact = inject(SD_PAGE_LIST).compact;
  /** Trạng thái chọn từ tab mà không có thẻ (Hoàn tất, Đã huỷ): không thẻ nào sáng. */
  protected readonly selected = linkedSignal<CardKey | null>(() => {
    const status = this.status();
    return status === null ? 'all' : status === 'pending' || status === 'shipping' ? status : null;
  });
  protected readonly revenue = computed<SdCardContent>(() => ({
    layout: 'stat',
    data: { label: 'Doanh thu hoàn tất', value: this.counts()?.revenue ?? null, format: 'compact' },
  }));

  protected choose(key: unknown): void {
    // Bấm lại thẻ đang chọn (model về null) hoặc thẻ Tổng đơn đều là bỏ lọc.
    const card = (key as CardKey | null) ?? 'all';
    this.selected.set(card);
    this.status.set(card === 'all' ? null : card);
  }
}
