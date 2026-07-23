import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { SdJobProgress } from '@sdcorejs/angular/components/job-progress';
import { SdTaskService, SdTaskState } from '@sdcorejs/angular/services/task';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-job-progress-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdJobProgress],
  template: `
    <demo-page
      #demoPage
      title="Job Progress"
      description="SdJobProgress – progress presentation có ARIA đầy đủ, nhận direct state hoặc task ID mà không phụ thuộc backend.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-determinate-bar') {
        <demo-section
          heading="Determinate bar"
          [props]="[
            { name: 'mode', value: 'bar' },
            { name: 'progress', value: determinateState().progress },
          ]">
          <sd-job-progress [state]="determinateState()" (sdCancel)="cancelDirect()"></sd-job-progress>
          <button type="button" (click)="advanceDirect()">Tiến thêm 10%</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-indeterminate-compact') {
        <demo-section
          heading="Indeterminate compact"
          [props]="[
            { name: 'mode', value: 'compact' },
            { name: 'aria-valuenow', value: 'omitted' },
          ]">
          <sd-job-progress [state]="{ id: 'queued', status: 'queued', title: 'Đang chờ tài nguyên' }" mode="compact"></sd-job-progress>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-details-va-error') {
        <demo-section heading="Details và error" [props]="[{ name: 'mode', value: 'details' }]">
          <sd-job-progress
            [state]="{
              id: 'failed',
              status: 'failed',
              title: 'Đồng bộ dữ liệu',
              message: 'Tác vụ giữ lại context để thử lại',
              error: 'Máy chủ tạm thời không phản hồi',
            }"
            mode="details"
            (sdRetry)="retryCount.update(increment)"></sd-job-progress>
          <p data-retry-count>Retry events: {{ retryCount() }}</p>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-registry-binding') {
        <demo-section
          heading="Registry binding"
          [props]="[
            { name: 'taskId', value: 'showcase-component-task' },
            { name: 'automatic actions', value: 'cancel/retry' },
          ]">
          <sd-job-progress taskId="showcase-component-task" mode="details"></sd-job-progress>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    button {
      margin-top: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobProgressDemoComponent {
  readonly #tasks = inject(SdTaskService);
  readonly increment = (value: number): number => value + 1;
  readonly retryCount = signal(0);
  readonly determinateState = signal<SdTaskState>({
    id: 'direct-export',
    status: 'running',
    progress: 45,
    title: 'Tạo tệp xuất',
  });
  readonly registryTask = this.#tasks.watch({
    id: 'showcase-component-task',
    initialState: {
      id: 'showcase-component-task',
      status: 'running',
      progress: 72,
      title: 'Xử lý nền',
      message: 'State được đọc trực tiếp từ registry',
    },
    source: { mode: 'manual', cancel: () => undefined },
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.registryTask.destroy());
  }

  advanceDirect(): void {
    this.determinateState.update(state => {
      const progress = Math.min(100, (state.progress ?? 0) + 10);
      return { ...state, progress, status: progress === 100 ? 'succeeded' : 'running' };
    });
  }

  cancelDirect(): void {
    this.determinateState.update(state => ({ ...state, status: 'cancelled' }));
  }
}
