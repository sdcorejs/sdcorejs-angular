import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { SdJobProgress } from '@sdcorejs/angular/components/job-progress';
import { SdTaskService, SdTaskSubscription } from '@sdcorejs/angular/services/task';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-task-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdJobProgress],
  template: `
    <demo-page
      #demoPage
      title="Task Service"
      description="SdTaskService – registry theo stable ID, dùng chung polling/SSE connection, retry có giới hạn và cleanup xác định.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-manual-lifecycle') {
        <demo-section
          heading="Manual lifecycle"
          [props]="[
            { name: 'status', value: manualTask.state().status },
            { name: 'progress', value: manualTask.state().progress ?? 'indeterminate' },
          ]">
          <sd-job-progress taskId="showcase-manual-task" mode="details"></sd-job-progress>
          <div class="task-actions">
            <button type="button" (click)="advanceManualTask()">Tiến thêm 25%</button>
            <button type="button" (click)="completeManualTask()">Hoàn tất</button>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-shared-stable-id') {
        <demo-section
          heading="Shared stable ID"
          [props]="[
            { name: 'subscriberCount', value: sharedTask.subscriberCount() },
            { name: 'same state signal', value: sharedTask.state === sharedTaskDuplicate.state },
          ]"
          note="Hai watcher trùng ID dùng chung state/transport; entry chỉ bị xóa sau lease cuối.">
          <p data-shared-task-count>Active leases: {{ sharedTask.subscriberCount() }}</p>
          <button type="button" [disabled]="sharedDuplicateDestroyed" (click)="releaseDuplicateLease()">Hủy lease thứ hai</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-polling-va-terminal-teardown') {
        <demo-section
          heading="Polling và terminal teardown"
          [props]="[
            { name: 'load calls', value: pollLoadCount },
            { name: 'connection', value: pollingTask.connection() },
          ]"
          note="Demo trả terminal state ngay lượt đầu; service không schedule thêm poll sau succeeded.">
          <sd-job-progress taskId="showcase-poll-task"></sd-job-progress>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cancel-va-retry') {
        <demo-section
          heading="Cancel và retry"
          [props]="[
            { name: 'cancel coalescing', value: 'Promise<boolean>' },
            { name: 'retry guard', value: 'failed/cancelled/transport error' },
          ]"
          note="Cancel lỗi giữ nguyên business state; retry không restart một connection đang khỏe.">
          <sd-job-progress taskId="showcase-action-task" mode="details"></sd-job-progress>
          <button type="button" (click)="failActionTask()">Giả lập task thất bại</button>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .task-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    button {
      margin-top: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDemoComponent {
  readonly #tasks = inject(SdTaskService);
  pollLoadCount = 0;
  sharedDuplicateDestroyed = false;

  readonly manualTask = this.#tasks.watch({
    id: 'showcase-manual-task',
    initialState: {
      id: 'showcase-manual-task',
      status: 'running',
      progress: 25,
      title: 'Import danh mục',
      message: 'Đang xử lý dữ liệu cục bộ',
    },
    source: { mode: 'manual' },
  });
  readonly sharedTask = this.#tasks.watch({
    id: 'showcase-shared-task',
    initialState: { id: 'showcase-shared-task', status: 'running', progress: 10 },
    source: { mode: 'manual' },
  });
  readonly sharedTaskDuplicate = this.#tasks.watch({
    id: 'showcase-shared-task',
    source: { mode: 'manual' },
  });
  readonly pollingTask = this.#tasks.watch({
    id: 'showcase-poll-task',
    source: {
      mode: 'poll',
      intervalMs: 5_000,
      load: () => {
        this.pollLoadCount += 1;
        return {
          id: 'showcase-poll-task',
          status: 'succeeded' as const,
          progress: 100,
          title: 'Đối soát hoàn tất',
        };
      },
    },
  });
  readonly actionTask = this.#tasks.watch({
    id: 'showcase-action-task',
    initialState: {
      id: 'showcase-action-task',
      status: 'running',
      progress: 60,
      title: 'Xuất báo cáo',
      message: 'Có thể hủy khi tác vụ đang chạy',
    },
    source: { mode: 'manual', cancel: () => undefined },
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    const leases: SdTaskSubscription[] = [this.manualTask, this.sharedTask, this.sharedTaskDuplicate, this.pollingTask, this.actionTask];
    destroyRef.onDestroy(() => leases.forEach(lease => lease.destroy()));
  }

  advanceManualTask(): void {
    const progress = Math.min(100, (this.manualTask.state().progress ?? 0) + 25);
    this.#tasks.update('showcase-manual-task', { status: progress === 100 ? 'succeeded' : 'running', progress });
  }

  completeManualTask(): void {
    this.#tasks.update('showcase-manual-task', { status: 'succeeded', progress: 100, message: 'Đã nhập xong dữ liệu' });
  }

  releaseDuplicateLease(): void {
    this.sharedTaskDuplicate.destroy();
    this.sharedDuplicateDestroyed = true;
  }

  failActionTask(): void {
    this.#tasks.update('showcase-action-task', {
      status: 'failed',
      error: new Error('Không thể tạo tệp báo cáo'),
    });
  }
}
