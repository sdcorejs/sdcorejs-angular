import { ChangeDetectionStrategy, Component, HostBinding, booleanAttribute, computed, inject, input, output } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdTaskService, SdTaskState, SdTaskStatus, SdTaskView } from '@sdcorejs/angular/services/task';

export type SdJobProgressMode = 'bar' | 'compact' | 'details';

@Component({
  selector: 'sd-job-progress',
  standalone: true,
  templateUrl: './job-progress.component.html',
  styleUrl: './job-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdJobProgress {
  readonly taskId = input<string | undefined>(undefined);
  readonly state = input<SdTaskState | undefined>(undefined);
  readonly mode = input<SdJobProgressMode>('bar');
  readonly title = input<string | undefined>(undefined);
  readonly message = input<string | undefined>(undefined);
  readonly showActions = input(true, { transform: booleanAttribute });

  readonly sdCancel = output<void>();
  readonly sdRetry = output<void>();

  readonly #tasks = inject(SdTaskService);
  readonly #i18n = inject(I18nService);

  readonly task = computed<SdTaskView | undefined>(() => {
    if (this.state()) return undefined;
    const id = this.taskId();
    return id ? this.#tasks.get(id) : undefined;
  });
  readonly resolvedState = computed<SdTaskState | undefined>(() => this.state() ?? this.task()?.state());
  readonly progress = computed<number | undefined>(() => {
    const value = this.resolvedState()?.progress;
    return value === undefined || !Number.isFinite(value) ? undefined : Math.max(0, Math.min(100, value));
  });
  readonly effectiveTitle = computed(() => this.title() ?? this.resolvedState()?.title);
  readonly effectiveMessage = computed(() => this.message() ?? this.resolvedState()?.message);
  readonly statusLabel = computed(() => this.#i18n.t(`core.component.job-progress.status.${this.resolvedState()?.status ?? 'idle'}`));
  readonly progressLabel = computed(() => {
    const title = this.effectiveTitle();
    return title ? `${title}: ${this.statusLabel()}` : this.statusLabel();
  });
  readonly cancelLabel = computed(() => this.#i18n.t('core.component.job-progress.cancel'));
  readonly retryLabel = computed(() => this.#i18n.t('core.component.job-progress.retry'));
  readonly displayedError = computed(() => formatError(this.resolvedState()?.error ?? this.task()?.error()));
  readonly active = computed(() => {
    const status = this.resolvedState()?.status;
    return status === 'queued' || status === 'running';
  });
  readonly canCancel = computed(() => this.showActions() && this.active() && (this.task()?.canCancel() ?? true));
  readonly canRetry = computed(() => {
    if (!this.showActions()) return false;
    const status = this.resolvedState()?.status;
    return this.task()?.canRetry() ?? (status === 'failed' || status === 'cancelled');
  });

  @HostBinding('attr.data-mode') get modeAttr(): SdJobProgressMode {
    return this.mode();
  }

  @HostBinding('attr.data-status') get statusAttr(): SdTaskStatus {
    return this.resolvedState()?.status ?? 'idle';
  }

  @HostBinding('attr.aria-live') readonly ariaLive = 'polite';

  onCancel(): void {
    const id = this.taskId();
    if (id && this.task()) void this.#tasks.cancel(id);
    this.sdCancel.emit();
  }

  onRetry(): void {
    const id = this.taskId();
    if (id && this.task()) this.#tasks.retry(id);
    this.sdRetry.emit();
  }
}

function formatError(error: unknown): string | undefined {
  if (error === null || error === undefined) return undefined;
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : String(error);
}
