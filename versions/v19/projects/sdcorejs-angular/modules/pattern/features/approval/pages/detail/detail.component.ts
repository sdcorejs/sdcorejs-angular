import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdEmptyPipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { ApprovalService } from '../../services/approval.service';
import { approvalStatusBadge, type ApprovalDto } from '../../services/approval.model';
import { ApprovalInbox } from '../list/approval-inbox';

/** Chi tiết một đề nghị trong panel phải của hộp duyệt (route con `:id`). */
@Component({
  selector: 'detail',
  standalone: true,
  imports: [
    RouterLink,
    SdBadge,
    SdButton,
    SdSection,
    SdSectionItem,
    SdPermissionDirective,
    SdEmptyPipe,
    SdFormatDatetimePipe,
    SdFormatNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let item = entity();
    <article class="d-flex flex-column gap-16 p-16" [attr.aria-label]="'Đề nghị ' + item.code">
      <header class="d-flex align-items-start justify-content-between gap-16 flex-wrap">
        <div class="d-flex flex-column gap-4">
          <!-- Màn hẹp: chi tiết thay danh sách, quay lại bằng liên kết này. -->
          <a class="approval-back" [routerLink]="['..']">← Danh sách</a>
          <div class="d-flex align-items-center gap-8">
            <h2 class="T18M m-0">{{ item.code }} · {{ item.title }}</h2>
            <sd-badge size="md" type="round" [title]="badge().title" [color]="badge().color" />
          </div>
          <span class="T14R text-secondary">{{ item.requester }} · {{ item.department }}</span>
        </div>
        @if (item.status === 'pending') {
          <div class="d-flex align-items-center gap-8">
            <sd-button
              *sdPermission="'PATTERN_APPROVAL_U_REJECT'"
              title="Từ chối"
              prefixIcon="close"
              type="light"
              color="warning"
              autoId="approval-reject"
              [disabled]="pending()"
              (click)="decide('reject')" />
            <sd-button
              *sdPermission="'PATTERN_APPROVAL_U_APPROVE'"
              title="Duyệt"
              prefixIcon="check"
              type="fill"
              color="success"
              autoId="approval-approve"
              [disabled]="pending()"
              (click)="decide('approve')" />
          </div>
        }
      </header>
      <sd-section title="Thông tin đề nghị">
        <sd-section-item label="Số tiền (₫)">{{ item.amount | sdFormatNumber: 0 }}</sd-section-item>
        <sd-section-item label="Ngày gửi">{{ item.submittedAt | sdFormatDatetime }}</sd-section-item>
        <sd-section-item label="Ghi chú">{{ item.note | sdEmpty }}</sd-section-item>
        <sd-section-item label="Lý do từ chối">{{ item.reason | sdEmpty }}</sd-section-item>
      </sd-section>
    </article>
  `,
  styles: `
    .approval-back {
      display: none;
      font-size: 13px;
    }
    @media (max-width: 767.98px) {
      .approval-back {
        display: inline;
      }
    }
  `,
})
export class DetailComponent {
  readonly #approvalService = inject(ApprovalService);
  readonly #inbox = inject(ApprovalInbox);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as ApprovalDto)), { requireSync: true });
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly badge = computed(() => approvalStatusBadge(this.entity().status));
  protected readonly pending = signal(false);

  /** Hỏi xác nhận (Từ chối kèm lý do), xử lý, rồi tự mở mục kế trong danh sách đang lọc. */
  protected async decide(action: 'approve' | 'reject'): Promise<void> {
    const item = this.entity();
    let reason: string | undefined;
    try {
      if (action === 'reject') {
        reason = await this.#confirm.withInput(`Từ chối ${item.code}. Lý do được gửi cho ${item.requester}.`, {
          title: 'Từ chối đề nghị',
          label: 'Lý do từ chối',
          required: true,
          maxlength: 200,
          yesTitle: 'Từ chối',
          noTitle: 'Không',
          yesButtonColor: 'warning',
        });
      } else {
        await this.#confirm.confirm(`Duyệt ${item.code}: ${item.title}?`, { title: 'Duyệt đề nghị', yesTitle: 'Duyệt', noTitle: 'Không' });
      }
    } catch {
      return;
    }
    this.pending.set(true);
    try {
      const next = this.#inbox.nextOf(item.id);
      this.entity.set(
        await firstValueFrom(
          action === 'approve' ? this.#approvalService.approve({ id: item.id }) : this.#approvalService.reject({ id: item.id, reason })
        )
      );
      this.#notify.success(action === 'approve' ? `Đã duyệt ${item.code}.` : `Đã từ chối ${item.code}.`);
      await this.#inbox.refresh();
      await this.#router.navigate(next ? ['..', next] : ['..'], { relativeTo: this.#route });
    } catch (error) {
      this.#notify.error(apiErrorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
