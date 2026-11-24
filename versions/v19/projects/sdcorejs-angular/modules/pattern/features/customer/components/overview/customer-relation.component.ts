import { ChangeDetectionStrategy, Component, computed, inject, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map, type Observable } from 'rxjs';
import { SdBadge, type SdBadgeData } from '@sdcorejs/angular/components/badge';
import { SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdFormatDatePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { RelationCardComponent, type RelationLink } from '../../../../core/relation-card/relation-card.component';
import { orderStatusBadge } from '../../../order/services/order.model';
import { customerResource } from '../../services/customer-resource';
import type { CustomerDocumentDto } from '../../services/customer.model';
import { CustomerService } from '../../services/customer.service';
import { DocumentPreviewComponent } from '../documents-view/document-preview.component';

const RELATIONS = {
  orders: { title: 'Đơn hàng gần đây', empty: 'Khách hàng chưa có đơn hàng.' },
  debts: { title: 'Công nợ', empty: 'Khách hàng không có công nợ.' },
  documents: { title: 'Tài liệu', empty: 'Khách hàng chưa có tài liệu.' },
  activity: { title: 'Hoạt động', empty: 'Khách hàng chưa có hoạt động.' },
} as const;

export type CustomerRelationKind = keyof typeof RELATIONS;

interface RelationRow {
  id: string;
  title: string;
  date: string;
  datePrefix?: string;
  amount?: number;
  orderId?: string;
  badge?: SdBadgeData;
  document?: CustomerDocumentDto;
  category?: string;
  icon?: string;
}
interface RelationPage {
  items: RelationRow[];
  total: number;
}

const fileSize = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

function documentRow(document: CustomerDocumentDto): RelationRow {
  const extension = document.name.split('.').pop()?.toUpperCase() ?? '';
  const megabyte = 1024 * 1024;
  const size =
    document.size >= megabyte ? fileSize.format(document.size / megabyte) + ' MB' : fileSize.format(document.size / 1024) + ' KB';
  return {
    id: document.id,
    title: document.name,
    date: document.uploadedAt,
    document,
    category: [extension, size].filter(Boolean).join(' · '),
    icon: extension === 'PDF' ? 'picture_as_pdf' : ['XLS', 'XLSX', 'CSV'].includes(extension) ? 'table_chart' : 'description',
  };
}

@Component({
  selector: 'customer-relation',
  imports: [
    RouterLink,
    RelationCardComponent,
    SdSectionItem,
    SdBadge,
    SdIcon,
    SdFormatDatePipe,
    SdFormatNumberPipe,
    DocumentPreviewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-relation.component.html',
  styleUrl: './customer-relation.component.scss',
})
export class CustomerRelationComponent {
  readonly #service = inject(CustomerService);
  readonly customerId = input.required<string>();
  readonly kind = input.required<CustomerRelationKind>();
  readonly limit = input<number | null>(5);
  readonly title = input<string>();
  readonly autoId = input<string>();
  readonly sectionId = input<string | null>(null);
  readonly more = input<RelationLink | null>(null);
  readonly overdueCount = input<number | null>(null);
  protected readonly preview = viewChild(DocumentPreviewComponent);
  protected readonly canOpenOrder = inject(SdPermissionService).hasPermission('PATTERN_ORDER_R_DETAIL');
  protected readonly definition = computed(() => RELATIONS[this.kind()]);

  readonly #page = customerResource(
    () => ({ id: this.customerId(), kind: this.kind(), limit: this.limit() ?? undefined }),
    ({ id, kind, limit }): Observable<RelationPage> => {
      switch (kind) {
        case 'orders':
          return this.#service.orders(id, limit).pipe(
            map(page => ({
              total: page.total,
              items: page.items.map(order => ({
                id: order.id,
                title: order.code,
                date: order.createdAt,
                orderId: order.id,
                amount: order.total,
                badge: orderStatusBadge(order.status),
              })),
            }))
          );
        case 'debts':
          return this.#service.debts(id, limit).pipe(
            map(page => ({
              total: page.total,
              items: page.items.map(debt => ({
                id: debt.id,
                title: debt.orderCode,
                date: debt.dueDate,
                datePrefix: 'Hạn ',
                orderId: debt.orderId,
                amount: debt.amount,
                badge:
                  debt.status === 'OVERDUE'
                    ? { title: 'Quá hạn ' + debt.overdueDays + ' ngày', color: 'error' }
                    : { title: 'Trong hạn', color: 'secondary' },
              })),
            }))
          );
        case 'documents':
          return this.#service.documents(id, limit).pipe(
            map(page => ({
              total: page.total,
              items: page.items.map(documentRow),
            }))
          );
        case 'activity':
          return this.#service.activities(id, limit).pipe(
            map(page => ({
              total: page.total,
              items: page.items.map(event => ({
                id: event.id,
                title: event.title,
                date: event.date,
                category: event.category,
                icon: 'history',
              })),
            }))
          );
      }
    }
  );

  readonly failed = computed(() => !!this.#page.error());
  protected readonly state = computed(() =>
    this.failed() ? 'error' : this.#page.isLoading() || !this.#page.hasValue() ? 'loading' : 'ready'
  );
  readonly settled = computed(() => this.state() !== 'loading');
  protected readonly page = computed(() => (this.state() === 'ready' ? this.#page.value() : undefined));
  protected readonly overdue = computed(() => (this.kind() === 'debts' ? (this.overdueCount() ?? 0) : 0));

  reload(): void {
    this.#page.reload();
  }
}
