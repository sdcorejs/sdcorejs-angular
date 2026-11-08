import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, model } from '@angular/core';
import { SdCard, SdCardGroup, type SdCardContent } from '@sdcorejs/angular/components/card';
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
 * Khi `sd-page-list` thu gọn (màn thấp), thẻ tự về size `sm` (một dòng 32px) và nhóm xếp thành hàng.
 */
@Component({
  selector: 'summary-cards',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-card-group
      class="sd-card-grid"
      autoId="customer-segments"
      aria-label="Nhóm khách hàng"
      [class.sd-card-grid--sm]="compact()"
      [(model)]="selected"
      (sdChange)="choose($event)">
      @for (card of cards(); track card.key) {
        <sd-card [value]="card.key" [autoId]="'customer-segment-' + card.key" [loading]="!counts()" [content]="card.content" />
      }
    </sd-card-group>
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
    return CARDS.map(card => {
      const content: SdCardContent = { layout: 'stat', data: { label: card.label, value: counts ? counts[card.key] : null } };
      return { key: card.key, content };
    });
  });

  protected choose(key: unknown): void {
    // Bấm lại thẻ đang chọn (model về null) hoặc thẻ "Tất cả" đều là bỏ lọc.
    const segment = key === null || key === 'all' ? null : (key as CustomerSegment);
    this.selected.set(segment ?? 'all');
    this.segment.set(segment);
  }
}
