import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTimeline, type SdTimelineItem } from '@sdcorejs/angular/components/timeline';
import type { Color } from '@sdcorejs/utils/models';
import type { OrderApprovalStepDto } from '../../services/order.model';

const STEP: Readonly<Record<OrderApprovalStepDto['action'], { action: string; icon: string; color: Color; badge?: SdBadgeData }>> = {
  submit: { action: 'gửi duyệt', icon: 'send', color: 'primary' },
  approve: { action: 'duyệt', icon: 'check', color: 'success', badge: { title: 'Đã duyệt', color: 'success' } },
  reject: { action: 'từ chối', icon: 'close', color: 'error', badge: { title: 'Từ chối', color: 'error' } },
};

/**
 * Quy trình duyệt của đơn, cũ nhất ở trên (tạo đơn rồi tới các bước duyệt); dùng ở cột phụ của trang chi tiết.
 * Mỗi bước là một mục `event` của `sd-timeline`: marker là icon theo bước, người làm nằm trong tiêu đề.
 */
@Component({
  selector: 'approval-steps',
  standalone: true,
  imports: [SdSection, SdTimeline],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-section title="Quy trình duyệt">
      <div class="p-16">
        <sd-timeline groupBy="none" size="sm" autoId="order-approval" ariaLabel="Quy trình duyệt" [items]="items()" />
        @if (!steps().length) {
          <p class="T12R text-secondary m-0">Chưa gửi duyệt</p>
        }
      </div>
    </sd-section>
  `,
})
export class ApprovalStepsComponent {
  readonly steps = input.required<readonly OrderApprovalStepDto[]>();
  /** Thời điểm tạo đơn: mục đầu của quy trình. */
  readonly createdAt = input.required<string>();
  /** Người tạo đơn. */
  readonly creator = input.required<string>();

  protected readonly items = computed<SdTimelineItem<OrderApprovalStepDto>[]>(() => [
    { id: 'created', at: this.createdAt(), icon: 'add', content: { layout: 'event', data: { title: `${this.creator()} tạo đơn` } } },
    ...this.steps().map((step, index): SdTimelineItem<OrderApprovalStepDto> => {
      const config = STEP[step.action];
      return {
        id: `step-${index}`,
        at: step.at,
        icon: config.icon,
        color: config.color,
        data: step,
        content: { layout: 'event', data: { title: `${step.by} ${config.action}`, badge: config.badge, note: step.reason } },
      };
    }),
  ]);
}
