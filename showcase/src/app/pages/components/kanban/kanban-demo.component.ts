import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdKanban,
  SdKanbanCardTemplateDirective,
  SdKanbanCardActionsTemplateDirective,
  SdKanbanColumnTemplateDirective,
  SdKanbanColumn,
  SdKanbanMoveRequest,
  SdKanbanOption,
} from '@sdcorejs/angular/components/kanban';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

type Priority = 'High' | 'Medium' | 'Low';
// Demo-owned task metadata: the board only knows the mapping in `option`.
interface Task {
  key: string;
  phase: string;
  title: string;
  owner: string;
  priority: Priority;
  comments: number;
  due: string;
}
interface Content {
  uuid: string;
  workflow: { stage: string };
  content: { heading: string; kind: string };
}
const TASKS: readonly Task[] = [
  { key: 'WEB-001', phase: 'open', title: 'Design the home page', owner: 'Annie Tran', priority: 'High', comments: 2, due: 'Oct 12' },
  { key: 'BE-023', phase: 'open', title: 'Build the sign-in API', owner: 'Minh Le', priority: 'Medium', comments: 5, due: 'Oct 15' },
  { key: 'DOC-004', phase: 'open', title: 'Write the user guide', owner: 'Linh Pham', priority: 'Low', comments: 1, due: 'Oct 20' },
  { key: 'PAY-008', phase: 'doing', title: 'Integrate payments', owner: 'Quang Vo', priority: 'High', comments: 4, due: 'Oct 10' },
  { key: 'SYS-012', phase: 'doing', title: 'Improve query performance', owner: 'Minh Le', priority: 'Medium', comments: 2, due: 'Oct 14' },
  { key: 'QA-011', phase: 'review', title: 'Test the chat feature', owner: 'Annie Tran', priority: 'Medium', comments: 6, due: 'Oct 11' },
  { key: 'LIB-007', phase: 'done', title: 'Update the UI library', owner: 'Linh Pham', priority: 'Low', comments: 1, due: 'Oct 5' },
];
const TASK_OPTION: SdKanbanOption<Task> = {
  getId: task => task.key,
  getColumnId: task => task.phase,
  getTitle: task => task.title,
  getSearchText: task => `${task.title} ${task.key} ${task.owner}`,
  withColumn: (task, columnId) => ({ ...task, phase: String(columnId) }),
};

@Component({
  selector: 'app-kanban-demo',
  standalone: true,
  imports: [
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
      description="A reusable status board with local ordering, generic domain mapping and consumer-confirmed asynchronous moves.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-local-board') {
        <demo-section
          heading="Local board"
          [props]="[{ name: 'model / option', value: 'immutable local data' }]"
          note="Drag by the handle, use the movement menu, or focus the handle and press Alt plus an arrow key. Search preserves hidden cards and counts. Card metadata comes from the card template.">
          <div class="example-content">
            <sd-kanban ariaLabel="Task board" [columns]="columns" [option]="localOption" [(model)]="tasks" autoId="local">
              <ng-template [sdKanbanCardTemplate]="localOption" let-task>
                <strong class="task-title">{{ task.title }}</strong>
                <span class="task-code">{{ task.key }}</span>
                <sd-badge class="task-priority" type="round" [color]="priorityColor[task.priority]" [title]="task.priority" />
                <div class="task-meta">
                  <sd-avatar [src]="task.owner" [size]="24" aria-hidden="true" />
                  <span class="visually-hidden">Assigned to {{ task.owner }}</span>
                  <span class="task-meta-item">
                    <sd-icon name="chat_bubble_outline" size="sm" />{{ task.comments }}
                    <span class="visually-hidden">comments</span>
                  </span>
                  <span class="task-meta-item task-due">
                    <sd-icon name="event" size="sm" /><span class="visually-hidden">Due</span>{{ task.due }}
                  </span>
                </div>
              </ng-template>
              <ng-template [sdKanbanCardActionsTemplate]="localOption" let-task let-pending="pending">
                <sd-button type="text" size="sm" title="Details" [disabled]="pending" (click)="selectedTask.set(task.title)" />
              </ng-template>
            </sd-kanban>
            @if (selectedTask()) {
              <p role="status">Selected: {{ selectedTask() }}</p>
            }
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cms-mapping') {
        <demo-section
          heading="CMS mapping"
          [props]="[
            { name: 'option.filter', value: 'articles only' },
            { name: 'readonly', value: 'true' },
          ]"
          note="Nested CMS fields map through option callbacks. Readonly prevents moves while search and column collapse remain available.">
          <div class="example-content">
            <sd-kanban ariaLabel="Editorial board" [columns]="cmsColumns" [option]="cmsOption" [model]="content" readonly>
              <ng-template sdKanbanColumnTemplate let-column
                ><span>{{ column.label }}</span></ng-template
              >
              <ng-template [sdKanbanCardTemplate]="cmsOption" let-item>
                <span class="card-key">{{ item.uuid }}</span
                ><strong>{{ item.content.heading }}</strong>
                <p>{{ item.content.kind }}</p>
              </ng-template>
            </sd-kanban>
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-async-confirmation') {
        <demo-section
          heading="Async confirmation"
          [props]="[{ name: 'option.move', value: 'Promise<boolean | void>' }]"
          note="Start a move, then confirm, reject, or fail it. The card stays in its previous column until confirmation. Refreshing data cancels the pending proposal.">
          <div class="example-content">
            <div class="demo-actions">
              <button type="button" [disabled]="!pendingRequest()" (click)="confirm()">Confirm move</button>
              <button type="button" [disabled]="!pendingRequest()" (click)="reject()">Reject move</button>
              <button type="button" [disabled]="!pendingRequest()" (click)="fail()">Fail move</button>
              <button type="button" (click)="refresh()">Refresh data</button>
              <button type="button" (click)="loadState.set(loadState() === 'loading' ? 'ready' : 'loading')">Toggle loading</button>
              <button type="button" (click)="loadState.set(loadState() === 'error' ? 'ready' : 'error')">Toggle error</button>
            </div>
            @if (pendingRequest(); as request) {
              <p role="status">Confirm moving {{ request.item.title }} to {{ request.toColumnId }}?</p>
            }
            <sd-kanban
              ariaLabel="Confirmed task board"
              [columns]="columns"
              [option]="asyncOption"
              [(model)]="asyncTasks"
              [loading]="loadState() === 'loading'"
              [error]="loadState() === 'error' ? 'The board could not be loaded.' : null"
              (sdRetry)="loadState.set('ready')"
              autoId="async" />
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
      .card-key,
      .task-code {
        display: block;
        color: var(--sd-text-secondary);
        font-size: 12px;
        line-height: 16px;
      }
      strong {
        display: block;
      }
      .task-title {
        font-weight: 600;
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
        font-size: 12px;
        color: var(--sd-text-secondary);
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanDemoComponent {
  readonly columns: readonly SdKanbanColumn[] = [
    { id: 'open', label: 'To do', color: 'primary' },
    { id: 'doing', label: 'In progress', color: 'info' },
    { id: 'review', label: 'In review', color: 'warning' },
    { id: 'done', label: 'Done', color: 'success' },
  ];
  readonly priorityColor = { High: 'error', Medium: 'info', Low: 'success' } as const;
  readonly tasks = signal<readonly Task[]>(TASKS);
  readonly asyncTasks = signal<readonly Task[]>(TASKS);
  readonly localOption = TASK_OPTION;
  readonly selectedTask = signal('');
  readonly pendingRequest = signal<SdKanbanMoveRequest<Task> | null>(null);
  readonly loadState = signal<'ready' | 'loading' | 'error'>('ready');
  #resolve?: (value: boolean) => void;
  #reject?: (reason: Error) => void;
  readonly asyncOption: SdKanbanOption<Task> = {
    ...TASK_OPTION,
    move: request =>
      new Promise<boolean>((resolve, reject) => {
        this.pendingRequest.set(request);
        this.#resolve = resolve;
        this.#reject = reject;
        request.signal.addEventListener(
          'abort',
          () => {
            this.pendingRequest.set(null);
            resolve(false);
          },
          { once: true }
        );
      }),
  };
  readonly cmsColumns: readonly SdKanbanColumn[] = [
    { id: 'draft', label: 'Drafts' },
    { id: 'review', label: 'Editorial review', color: 'warning' },
    { id: 'published', label: 'Published', color: 'success' },
  ];
  readonly content: readonly Content[] = [
    { uuid: 'article-1', workflow: { stage: 'draft' }, content: { heading: 'Getting started with the workspace', kind: 'Article' } },
    { uuid: 'asset-2', workflow: { stage: 'draft' }, content: { heading: 'Product photography', kind: 'Asset' } },
    { uuid: 'article-3', workflow: { stage: 'review' }, content: { heading: 'How the editorial team works', kind: 'Article' } },
  ];
  readonly cmsOption: SdKanbanOption<Content> = {
    getId: item => item.uuid,
    getColumnId: item => item.workflow.stage,
    getTitle: item => item.content.heading,
    withColumn: (item, columnId) => ({ ...item, workflow: { ...item.workflow, stage: String(columnId) } }),
    filter: item => item.content.kind === 'Article',
  };
  confirm(): void {
    this.#resolve?.(true);
    this.pendingRequest.set(null);
  }
  reject(): void {
    this.#resolve?.(false);
    this.pendingRequest.set(null);
  }
  fail(): void {
    this.#reject?.(new Error('Demo persistence failure'));
    this.pendingRequest.set(null);
  }
  refresh(): void {
    this.asyncTasks.set([...TASKS]);
    this.loadState.set('ready');
  }
}
