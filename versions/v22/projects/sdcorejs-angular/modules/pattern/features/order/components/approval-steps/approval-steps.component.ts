import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';
import type { OrderApprovalStepDto } from '../../services/order.model';

const ACTION_NAME: Readonly<Record<OrderApprovalStepDto['action'], string>> = {
  submit: 'Gửi duyệt',
  approve: 'Duyệt',
  reject: 'Từ chối',
};

/** Quy trình duyệt của đơn, mới nhất ở cuối; dùng ở cột phụ của trang chi tiết. */
@Component({
  selector: 'approval-steps',
  standalone: true,
  imports: [SdSection, SdFormatDatetimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-section title="Quy trình duyệt">
      <ol class="approval-steps">
        <li class="approval-steps__item approval-steps__item--done">
          <span class="T14M">Tạo đơn</span>
        </li>
        @for (step of steps(); track $index) {
          <li class="approval-steps__item" [class.approval-steps__item--rejected]="step.action === 'reject'">
            <span class="T14M">{{ actionName[step.action] }}</span>
            <span class="T12R text-secondary">{{ step.by }} · {{ step.at | sdFormatDatetime }}</span>
            @if (step.reason) {
              <span class="T12R">Lý do: {{ step.reason }}</span>
            }
          </li>
        } @empty {
          <li class="approval-steps__item approval-steps__item--pending">
            <span class="T12R text-secondary">Chưa gửi duyệt</span>
          </li>
        }
      </ol>
    </sd-section>
  `,
  styles: `
    .approval-steps {
      margin: 0;
      padding: 16px 16px 16px 32px;
      list-style: none;
    }
    .approval-steps__item {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-bottom: 16px;
    }
    .approval-steps__item::before {
      content: '';
      position: absolute;
      top: 4px;
      left: -18px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--sd-primary);
    }
    .approval-steps__item--rejected::before {
      background: var(--sd-error, currentColor);
    }
    .approval-steps__item--pending::before {
      background: var(--sd-border-strong);
    }
  `,
})
export class ApprovalStepsComponent {
  readonly steps = input.required<readonly OrderApprovalStepDto[]>();
  protected readonly actionName = ACTION_NAME;
}
