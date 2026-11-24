import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTimeline, type SdTimelineItem } from '@sdcorejs/angular/components/timeline';
import { customerResource } from '../../services/customer-resource';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'activity-view',
  imports: [SdDataState, SdSection, SdTimeline],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-section title="Hoạt động">
      <sd-data-state
        [state]="state()"
        compact
        [retryable]="state() === 'error'"
        [title]="state() === 'error' ? 'Không tải được hoạt động' : undefined"
        [message]="state() === 'error' ? 'Các phần khác của hồ sơ vẫn dùng được.' : undefined"
        (sdRetry)="activities.reload()">
        <div class="p-16">
          <sd-timeline autoId="customer-activity" ariaLabel="Hoạt động của khách hàng" [items]="items()" />
        </div>
      </sd-data-state>
    </sd-section>
  `,
})
export class ActivityViewComponent {
  readonly #service = inject(CustomerService);
  readonly customerId = input.required<string>();
  readonly activities = customerResource(this.customerId, id => this.#service.activities(id));
  protected readonly items = computed<SdTimelineItem[]>(() =>
    this.activities.hasValue()
      ? this.activities.value()!.items.map(event => ({
          id: event.id,
          at: event.date,
          icon: 'history',
          source: event.category,
          content: { layout: 'event', data: { title: event.title } },
        }))
      : []
  );
  protected readonly state = computed(() => {
    if (this.activities.error()) return 'error';
    if (this.activities.isLoading() || !this.activities.hasValue()) return 'loading';
    return this.items().length ? 'success' : 'empty';
  });
}
