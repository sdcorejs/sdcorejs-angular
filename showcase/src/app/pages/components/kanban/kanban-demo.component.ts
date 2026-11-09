import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdKanban,
  SdKanbanCard,
  SdKanbanCardActionsTemplateDirective,
  SdKanbanCardTemplateDirective,
  SdKanbanColumn,
  SdKanbanColumnTemplateDirective,
  SdKanbanMoveRequest,
  SdKanbanOption,
} from '@sdcorejs/angular/components/kanban';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

// ---- Orders (pattern P1): a data source paged by column ----
interface Order {
  readonly code: string;
  readonly customer: string;
  readonly amount: number;
  readonly status: string;
}
const CUSTOMERS = ['Công ty An Phát', 'Nhà thuốc Minh Châu', 'Cửa hàng Lan Anh', 'Siêu thị Hoà Bình', 'Quán Bảo Ngọc'];
function seedOrders(): Order[] {
  return Array.from({ length: 26 }, (_, index) => ({
    code: `DH-${1001 + index}`,
    customer: CUSTOMERS[index % CUSTOMERS.length],
    amount: 450_000 + ((index * 137_000) % 2_300_000),
    status: index < 9 ? 'pending' : index < 16 ? 'shipping' : index < 24 ? 'done' : 'cancelled',
  }));
}
const money = (value: number): string => `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
const millions = (value: number): string => `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu ₫`;
/** A server delay that stops when the board aborts the load. */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

// ---- Tasks: items with reorder, search and templates ----
type Priority = 'High' | 'Medium' | 'Low';
interface Task {
  readonly key: string;
  readonly owner: string;
  readonly priority: Priority;
  readonly comments: number;
  readonly due: string;
}
interface TaskRow extends Task {
  readonly title: string;
  readonly columnId: string;
}
const TASK_ROWS: readonly TaskRow[] = [
  { title: 'Design the home page', columnId: 'open', key: 'WEB-001', owner: 'Annie Tran', priority: 'High', comments: 2, due: 'Oct 12' },
  { title: 'Build the sign-in API', columnId: 'open', key: 'BE-023', owner: 'Minh Le', priority: 'Medium', comments: 5, due: 'Oct 15' },
  { title: 'Write the user guide', columnId: 'open', key: 'DOC-004', owner: 'Linh Pham', priority: 'Low', comments: 1, due: 'Oct 20' },
  { title: 'Integrate payments', columnId: 'doing', key: 'PAY-008', owner: 'Quang Vo', priority: 'High', comments: 4, due: 'Oct 10' },
  { title: 'Improve query performance', columnId: 'doing', key: 'SYS-012', owner: 'Minh Le', priority: 'Medium', comments: 2, due: 'Oct 14' },
  { title: 'Test the chat feature', columnId: 'review', key: 'QA-011', owner: 'Annie Tran', priority: 'Medium', comments: 6, due: 'Oct 11' },
  { title: 'Update the UI library', columnId: 'done', key: 'LIB-007', owner: 'Linh Pham', priority: 'Low', comments: 1, due: 'Oct 5' },
];
const TASKS: readonly SdKanbanCard<Task>[] = TASK_ROWS.map(({ title, columnId, ...task }) => ({
  id: task.key,
  columnId,
  title,
  searchText: `${title} ${task.key} ${task.owner}`,
  data: task,
}));

// ---- CMS mapping: the consumer maps its own records to cards ----
interface Content {
  readonly uuid: string;
  readonly workflow: { readonly stage: string };
  readonly content: { readonly heading: string; readonly kind: string };
}
const CONTENT: readonly Content[] = [
  { uuid: 'article-1', workflow: { stage: 'draft' }, content: { heading: 'Getting started with the workspace', kind: 'Article' } },
  { uuid: 'asset-2', workflow: { stage: 'draft' }, content: { heading: 'Product photography', kind: 'Asset' } },
  { uuid: 'article-3', workflow: { stage: 'review' }, content: { heading: 'How the editorial team works', kind: 'Article' } },
];

@Component({
  selector: 'app-kanban-demo',
  standalone: true,
  imports: [
    JsonPipe,
    DemoPageComponent,
    DemoSectionComponent,
    SdAvatar,
    SdBadge,
    SdButton,
    SdIcon,
    SdKanban,
    SdKanbanCardTemplateDirective,
    SdKanbanCardActionsTemplateDirective,
    SdKanbanColumnTemplateDirective,
  ],
  template: `
    <demo-page
      #demoPage
      title="Kanban"
      description="A board of cards in columns: items or a data source paged by column, consumer-confirmed moves, selection and keyboard moves.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-orders') {
        <demo-section
          heading="Orders"
          [props]="[
            { name: 'option.dataSource', value: 'by column, 400ms, pageSize 5' },
            { name: 'option.move.droppable', value: 'no skipping a step' },
            { name: 'option.move.reorder', value: 'false' },
          ]"
          note="Pattern P1. Drag an order from Chờ xác nhận: Hoàn tất fades at once. Moving to Đã huỷ asks for a reason; closing the dialog cancels. The toast undoes the move. Click an order to open its details.">
          <div class="example-content">
            <div class="demo-actions">
              <button type="button" data-testid="fail-shipping" (click)="failShipping.set(!failShipping())">
                Lỗi cột Đang giao: {{ failShipping() ? 'bật' : 'tắt' }}
              </button>
              <button type="button" data-testid="reload-shipping" (click)="orders.reload('shipping')">Tải lại Đang giao</button>
            </div>
            <div class="orders-layout">
              <sd-kanban
                #orders
                ariaLabel="Đơn hàng"
                autoId="orders"
                searchable
                [columns]="orderColumns"
                [option]="orderOption"
                [collapsedColumns]="['cancelled']"
                (sdSelect)="selectedOrder.set($event.data ?? null)">
                <ng-template [sdKanbanCardTemplate]="orderOption" let-card>
                  <strong class="order-code">{{ card.title }}</strong>
                  <span class="order-customer">{{ card.data?.customer }}</span>
                  <span class="order-amount">{{ money(card.data?.amount ?? 0) }}</span>
                </ng-template>
              </sd-kanban>
              @if (selectedOrder(); as order) {
                <aside class="order-drawer" data-testid="order-drawer" aria-label="Chi tiết đơn">
                  <h4>{{ order.code }}</h4>
                  <p>{{ order.customer }}</p>
                  <p>{{ money(order.amount) }}</p>
                  <button type="button" (click)="selectedOrder.set(null)">Đóng</button>
                </aside>
              }
            </div>
            @if (reason(); as asking) {
              <div class="reason-dialog" role="dialog" aria-modal="false" aria-label="Lý do huỷ" data-testid="reason-dialog">
                <p>Huỷ {{ asking.title }}: nhập lý do</p>
                <button type="button" data-testid="reason-confirm" (click)="answerReason('Khách đổi ý')">Xác nhận huỷ</button>
                <button type="button" data-testid="reason-close" (click)="answerReason(null)">Đóng</button>
              </div>
            }
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tasks') {
        <demo-section
          heading="Tasks"
          [props]="[
            { name: 'items', value: 'local cards' },
            { name: 'option.move.reorder', value: 'true' },
            { name: 'searchable', value: 'true' },
          ]"
          note="Drag a card to another place or column, use the move menu, or focus a card and press Alt with an arrow key. The card template holds no controls; the Details button lives in the actions template.">
          <div class="example-content">
            <div class="demo-actions">
              <button type="button" data-testid="tasks-many" (click)="loadManyTasks()">200 thẻ mỗi cột</button>
              <button type="button" (click)="tasks.set(taskCards)">Dữ liệu mẫu</button>
            </div>
            <sd-kanban
              ariaLabel="Task board"
              autoId="tasks"
              searchable
              [columns]="taskColumns"
              [items]="tasks()"
              [option]="taskOption"
              (sdMove)="lastRequest.set({ to: $event.to, source: $event.source })">
              <ng-template [sdKanbanCardTemplate]="taskOption" let-card>
                <strong class="task-title">{{ card.title }}</strong>
                <span class="task-code">{{ card.data?.key }}</span>
                <sd-badge class="task-priority" type="round" [color]="priorityColor[card.data?.priority ?? 'Low']" [title]="card.data?.priority ?? ''" />
                <span class="task-meta">
                  <sd-avatar [src]="card.data?.owner ?? ''" [size]="24" aria-hidden="true" />
                  <span class="visually-hidden">Assigned to {{ card.data?.owner }}</span>
                  <span class="task-meta-item"><sd-icon name="chat_bubble_outline" size="sm" />{{ card.data?.comments }}</span>
                  <span class="task-meta-item task-due"><sd-icon name="event" size="sm" />{{ card.data?.due }}</span>
                </span>
              </ng-template>
              <ng-template [sdKanbanCardActionsTemplate]="taskOption" let-card let-pending="pending">
                <sd-button type="text" size="sm" title="Details" [disabled]="pending" (click)="selectedTask.set(card.title)" />
              </ng-template>
            </sd-kanban>
            <p class="demo-readout" data-testid="tasks-request">sdMove: {{ lastRequest() | json }}</p>
            @if (selectedTask()) {
              <p class="demo-readout">Details: {{ selectedTask() }}</p>
            }
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cms-mapping') {
        <demo-section
          heading="CMS mapping"
          [props]="[
            { name: 'items', value: 'mapped from CMS records' },
            { name: 'readonly', value: 'true' },
          ]"
          note="The consumer maps nested CMS fields to cards (articles only). Readonly keeps selection, search and collapse; there is no move.">
          <div class="example-content">
            <sd-kanban ariaLabel="Editorial board" [columns]="cmsColumns" [items]="cmsCards" [option]="cmsOption" readonly>
              <ng-template sdKanbanColumnTemplate let-column><span>{{ column.label }}</span></ng-template>
              <ng-template [sdKanbanCardTemplate]="cmsOption" let-card>
                <span class="card-key">{{ card.id }}</span>
                <strong>{{ card.title }}</strong>
                <span class="card-key">{{ card.data?.content?.kind }}</span>
              </ng-template>
            </sd-kanban>
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-async-confirmation') {
        <demo-section
          heading="Async confirmation"
          [props]="[{ name: 'option.move.onMove', value: 'Promise<boolean | cancel | void>' }]"
          note="Start a move, then confirm, reject, fail or cancel it. The card stays in its column until the answer. Refreshing the data aborts the pending move.">
          <div class="example-content">
            <div class="demo-actions">
              <button type="button" [disabled]="!pendingRequest()" (click)="settle(true)">Confirm</button>
              <button type="button" [disabled]="!pendingRequest()" (click)="settle(false)">Reject</button>
              <button type="button" [disabled]="!pendingRequest()" (click)="settle('fail')">Fail</button>
              <button type="button" [disabled]="!pendingRequest()" (click)="settle('cancel')">Cancel</button>
              <button type="button" (click)="refreshAsync()">Refresh data</button>
            </div>
            @if (pendingRequest(); as request) {
              <p class="demo-readout">Move {{ request.card.title }} to {{ request.to.columnId }}?</p>
            }
            <sd-kanban ariaLabel="Confirmed task board" autoId="async" [columns]="taskColumns" [items]="asyncTasks()" [option]="asyncOption" />
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .example-content {
        width: 100%;
        min-width: 0;
      }
      .orders-layout {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        > sd-kanban {
          flex: 1;
          min-width: 0;
        }
      }
      .order-drawer {
        flex: none;
        width: 240px;
        padding: 12px;
        border: 1px solid var(--sd-border, #c4c6d0);
        border-radius: 12px;
        background: var(--sd-surface, #fdfbff);
        h4 {
          margin: 0 0 8px;
        }
      }
      .reason-dialog {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-top: 12px;
        padding: 12px;
        border-radius: 10px;
        background: var(--sd-surface, #fdfbff);
        box-shadow: var(--sd-shadow-lg);
        p {
          flex: 1 0 100%;
          margin: 0;
        }
      }
      .order-code,
      .task-title,
      strong {
        display: block;
        font-weight: 600;
      }
      .order-customer,
      .order-amount,
      .card-key,
      .task-code {
        display: block;
        color: var(--sd-text-secondary);
        font-size: 12px;
        line-height: 16px;
      }
      .order-amount {
        font-variant-numeric: tabular-nums;
      }
      .task-priority {
        display: inline-flex;
        margin-top: 6px;
      }
      .task-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 10px;
        color: var(--sd-text-secondary);
        font-size: 12px;
      }
      .task-meta-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .task-due {
        margin-inline-start: auto;
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
      .demo-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
      }
      .demo-readout {
        margin: 12px 0 0;
        color: var(--sd-text-secondary);
        font-size: 13px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanDemoComponent {
  readonly #notify = inject(SdNotifyService);
  readonly money = money;

  // ---- Orders ----
  readonly ordersBoard = viewChild<SdKanban<Order>>('orders');
  readonly orderColumns: readonly SdKanbanColumn[] = [
    { id: 'pending', label: 'Chờ xác nhận', color: 'warning' },
    { id: 'shipping', label: 'Đang giao', color: 'info' },
    { id: 'done', label: 'Hoàn tất', color: 'success' },
    { id: 'cancelled', label: 'Đã huỷ', color: 'error' },
  ];
  readonly failShipping = signal(false);
  readonly selectedOrder = signal<Order | null>(null);
  readonly reason = signal<{ readonly title: string } | null>(null);
  #answerReason?: (reason: string | null) => void;
  #store = seedOrders();
  readonly orderOption: SdKanbanOption<Order> = {
    pageSize: 5,
    dataSource: {
      onLoad: async ({ columnId, cursor, pageSize, keyword, signal }) => {
        await delay(400, signal);
        if (columnId === 'shipping' && this.failShipping()) throw new Error('Máy chủ không phản hồi');
        const term = keyword.toLowerCase();
        const matching = this.#store.filter(
          order => order.status === columnId && (!term || `${order.code} ${order.customer}`.toLowerCase().includes(term))
        );
        const start = cursor ? Number(cursor) : 0;
        const next = start + pageSize;
        return {
          items: matching.slice(start, next).map(order => ({ id: order.code, columnId: order.status, title: order.code, data: order })),
          nextCursor: next < matching.length ? String(next) : null,
          total: matching.length,
          summary: millions(matching.reduce((sum, order) => sum + order.amount, 0)),
        };
      },
    },
    move: {
      // No skipping a step: an order waiting for confirmation cannot go straight to Hoàn tất.
      droppable: ({ from, to }) => !(from.id === 'pending' && to.id === 'done'),
      onMove: async request => {
        if (request.to.columnId === 'cancelled' && request.source !== 'api') {
          const reason = await new Promise<string | null>(resolve => {
            this.#answerReason = resolve;
            this.reason.set({ title: request.card.title });
          });
          if (!reason) return 'cancel';
        }
        this.#store = this.#store.map(order => (order.code === request.card.id ? { ...order, status: request.to.columnId } : order));
        if (request.source !== 'api') {
          this.#notify.success(`Đã chuyển ${request.card.title}`, {
            actionLabel: 'Hoàn tác',
            onAction: () => void this.ordersBoard()?.move(request.card.id, { columnId: request.from.columnId }, 'api'),
          });
        }
        return true;
      },
    },
  };

  answerReason(reason: string | null): void {
    this.reason.set(null);
    this.#answerReason?.(reason);
    this.#answerReason = undefined;
  }

  // ---- Tasks ----
  readonly taskColumns: readonly SdKanbanColumn[] = [
    { id: 'open', label: 'To do', color: 'primary' },
    { id: 'doing', label: 'In progress', color: 'info' },
    { id: 'review', label: 'In review', color: 'warning' },
    { id: 'done', label: 'Done', color: 'success' },
  ];
  readonly priorityColor = { High: 'error', Medium: 'info', Low: 'success' } as const;
  readonly taskCards = TASKS;
  readonly tasks = signal<readonly SdKanbanCard<Task>[]>(TASKS);
  readonly selectedTask = signal('');
  readonly lastRequest = signal<Pick<SdKanbanMoveRequest<Task>, 'to' | 'source'> | null>(null);
  readonly taskOption: SdKanbanOption<Task> = { move: { reorder: true, onMove: () => true } };

  /** TESTING §10: 4 columns × 200 cards. */
  loadManyTasks(): void {
    const cards: SdKanbanCard<Task>[] = [];
    for (const column of this.taskColumns) {
      for (let index = 0; index < 200; index++) {
        const key = `${column.id.toUpperCase()}-${index + 1}`;
        cards.push({
          id: key,
          columnId: column.id,
          title: `Task ${key}`,
          data: { key, owner: CUSTOMERS[index % CUSTOMERS.length], priority: 'Low', comments: index % 7, due: 'Nov 30' },
        });
      }
    }
    this.tasks.set(cards);
  }

  // ---- CMS ----
  readonly cmsColumns: readonly SdKanbanColumn[] = [
    { id: 'draft', label: 'Drafts' },
    { id: 'review', label: 'Editorial review', color: 'warning' },
    { id: 'published', label: 'Published', color: 'success' },
  ];
  readonly cmsCards: readonly SdKanbanCard<Content>[] = CONTENT.filter(item => item.content.kind === 'Article').map(item => ({
    id: item.uuid,
    columnId: item.workflow.stage,
    title: item.content.heading,
    data: item,
  }));
  readonly cmsOption: SdKanbanOption<Content> = {};

  // ---- Async confirmation ----
  readonly asyncTasks = signal<readonly SdKanbanCard<Task>[]>(TASKS);
  readonly pendingRequest = signal<SdKanbanMoveRequest<Task> | null>(null);
  #answer?: (answer: boolean | 'cancel' | 'fail') => void;
  readonly asyncOption: SdKanbanOption<Task> = {
    move: {
      onMove: request =>
        new Promise<boolean | 'cancel'>((resolve, reject) => {
          this.pendingRequest.set(request);
          this.#answer = answer => (answer === 'fail' ? reject(new Error('Demo persistence failure')) : resolve(answer));
          request.signal.addEventListener('abort', () => this.pendingRequest.set(null), { once: true });
        }),
    },
  };

  /** A new items reference: the board drops its copy and aborts a waiting move. */
  refreshAsync(): void {
    this.asyncTasks.set([...this.taskCards]);
  }

  settle(answer: boolean | 'cancel' | 'fail'): void {
    this.pendingRequest.set(null);
    this.#answer?.(answer);
    this.#answer = undefined;
  }
}
