import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  SecurityContext,
  computed,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

import { ToastData } from '../../notify.model';
import { SdNotifyService } from '../../notify.service';

const TOAST_EXIT_ANIMATION_MS = 200;

@Component({
  selector: 'toast',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.data-autoid]': 'autoId',
    '[attr.data-type]': 'data.type',
    '[attr.data-title]': 'data.title ?? null',
    '[attr.data-message]': 'dataMessage',
  },
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input({ required: true }) data!: ToastData;

  readonly isExpanded = signal(false);
  readonly isClosing = signal(false);
  readonly hostClasses = computed(() => (this.isClosing() ? 'bg-white sd-toast sd-toast--closing' : 'bg-white sd-toast'));
  readonly MAX_SHOW = 2;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private start = 0;
  private remaining = 0;

  constructor(
    private notifyService: SdNotifyService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.remaining = this.data.duration;
    this.resumeTimer();
  }

  ngOnDestroy(): void {
    this.clearAutoDismissTimer();
    this.clearCloseTimer();
  }

  @HostListener('mouseenter')
  pauseTimer(): void {
    if (!this.timer || this.isClosing()) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = null;
    this.remaining = Math.max(this.remaining - (Date.now() - this.start), 0);
  }

  @HostListener('mouseleave')
  resumeTimer(): void {
    if (this.remaining <= 0 || this.timer || this.isClosing()) {
      return;
    }

    this.start = Date.now();
    this.timer = setTimeout(() => {
      this.close();
    }, this.remaining);
  }

  close(): void {
    if (this.isClosing()) {
      return;
    }

    this.clearAutoDismissTimer();
    this.isClosing.set(true);
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.notifyService.remove(this.data.id);
    }, TOAST_EXIT_ANIMATION_MS);
  }

  onActionClick(): void {
    this.data.onAction?.();
  }

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  sanitizeHtml(value: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';
  }

  get singleMessage(): string {
    return this.data.message as string;
  }

  get isMultiMessage(): boolean {
    return Array.isArray(this.data.message);
  }

  get messages(): string[] {
    return this.data.message as string[];
  }

  get displayMessages(): string[] {
    const msgs = this.messages;
    if (this.isExpanded()) return msgs;
    return msgs.slice(0, this.MAX_SHOW);
  }

  get restCount(): number {
    return this.messages.length - this.MAX_SHOW;
  }

  get hasMore(): boolean {
    return this.isMultiMessage && this.messages.length > this.MAX_SHOW;
  }

  get autoId(): string {
    return `services-notify-toast-${this.data.type}`;
  }

  get dataMessage(): string {
    return Array.isArray(this.data.message) ? this.data.message.join(' | ') : this.data.message;
  }

  private clearAutoDismissTimer(): void {
    if (!this.timer) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = null;
  }

  private clearCloseTimer(): void {
    if (!this.closeTimer) {
      return;
    }

    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }
}
