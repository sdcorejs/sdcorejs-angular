import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChildren } from '@angular/core';
import type { Params } from '@angular/router';
import { SdCard, type SdCardContent } from '@sdcorejs/angular/components/card';
import { sdTableQueryParams } from '@sdcorejs/angular/components/table';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdFormatDatePipe } from '@sdcorejs/angular/pipes';
import { orderStatusBadge } from '../../../order/services/order.model';
import type { CustomerSummaryDto } from '../../services/customer.model';
import { CustomerRelationComponent } from './customer-relation.component';

interface Stat {
  key: string;
  content: SdCardContent;
  link?: string[];
  queryParams?: Params;
}

const compactMoney = new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'long', maximumFractionDigits: 2 });

@Component({
  selector: 'customer-overview',
  imports: [SdCard, SdPermissionDirective, CustomerRelationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sd-card-grid stats">
      @for (stat of stats(); track stat.key) {
        <sd-card
          [autoId]="'customer-360-stat-' + stat.key"
          [content]="stat.content"
          [behavior]="stat.link ? 'link' : 'static'"
          [link]="stat.link"
          [queryParams]="stat.queryParams"
          [loading]="loading()"
          [error]="failed()"
          (sdRetry)="retry.emit()" />
      }
    </div>
    <div class="relations">
      <customer-relation kind="orders" [customerId]="customerId()" [more]="{ link: [], queryParams: { tab: 'orders' } }" />
      <customer-relation
        *sdPermission="'PATTERN_CUSTOMER_R_DEBTS'"
        kind="debts"
        [customerId]="customerId()"
        [overdueCount]="summary()?.overdueCount ?? null"
        [more]="{ link: [], queryParams: { tab: 'debts' } }" />
      <customer-relation kind="documents" [customerId]="customerId()" [more]="{ link: [], queryParams: { tab: 'documents' } }" />
      <customer-relation kind="activity" [customerId]="customerId()" [more]="{ link: [], queryParams: { tab: 'activity' } }" />
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
    .stats {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .relations {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
      gap: 16px;
    }
    @media (max-width: 1199.98px) {
      .relations {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    @media (max-width: 680px) {
      .stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class OverviewComponent {
  readonly #permissions = inject(SdPermissionService);
  readonly #date = inject(SdFormatDatePipe);
  readonly customerId = input.required<string>();
  readonly summary = input<CustomerSummaryDto>();
  readonly loading = input.required<boolean>();
  readonly failed = input.required<boolean>();
  readonly retry = output<void>();
  private readonly relations = viewChildren(CustomerRelationComponent);
  protected readonly stats = computed(() => {
    const summary = this.summary();
    const last = summary?.lastOrder;
    const stats: Stat[] = [];
    if (this.#permissions.hasPermission('PATTERN_CUSTOMER_R_DEBTS')) {
      stats.push({
        key: 'debt',
        content: {
          layout: 'stat',
          data: {
            label: 'Công nợ',
            value: summary ? compactMoney.format(summary.debtTotal) : null,
            format: 'text',
            context: summary ? compactMoney.format(summary.overdueTotal) + ' quá hạn' : undefined,
            contextColor: summary?.overdueCount ? 'error' : 'secondary',
          },
        },
        link: [],
        queryParams: { tab: 'debts', ...sdTableQueryParams('customer-debts', { columnFilter: { status: 'OVERDUE' } }) },
      });
    }
    stats.push(
      {
        key: 'revenue',
        content: {
          layout: 'stat',
          data: {
            label: 'Doanh số 12 tháng',
            value: summary ? compactMoney.format(summary.revenue12m) : null,
            format: 'text',
            context: summary ? summary.orderCount + ' đơn' : undefined,
          },
        },
        link: [],
        queryParams: { tab: 'orders' },
      },
      {
        key: 'last-order',
        content: {
          layout: 'stat',
          data: {
            label: 'Đơn gần nhất',
            value: last ? this.#date.transform(last.date) : null,
            format: 'text',
            context: last ? last.code + ' · ' + orderStatusBadge(last.status).title : undefined,
          },
        },
        link: last && this.#permissions.hasPermission('PATTERN_ORDER_R_DETAIL') ? ['../../../order', last.id, 'detail'] : undefined,
      },
      {
        key: 'owner',
        content: {
          layout: 'stat',
          data: {
            label: 'Phụ trách',
            value: summary?.owner.name ?? null,
            format: 'text',
            context: summary?.owner.team,
          },
        },
      }
    );
    return stats;
  });

  reloadActivity(): void {
    this.relations()
      .find(relation => relation.kind() === 'activity')
      ?.reload();
  }
}
