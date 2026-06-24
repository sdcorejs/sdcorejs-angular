import { Component, Input, signal, HostListener, OnInit, OnDestroy, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { animate, style, transition, trigger } from '@angular/animations';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { ToastData } from '../../notify.model';
import { SdNotifyService } from '../../notify.service';

@Component({
  selector: 'toast',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))]),
    ]),
  ],
  host: {
    '[@toastAnimation]': 'true',
    '[class]': '"bg-white sd-toast"',
    // E2E hooks đọc bởi sd-autoid-inspector: autoid theo loại + state type/title/message.
    '[attr.data-autoid]': 'autoId',
    '[attr.data-type]': 'data.type',
    '[attr.data-title]': 'data.title ?? null',
    '[attr.data-message]': 'dataMessage',
  },
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input({ required: true }) data!: ToastData;

  isExpanded = signal(false);
  readonly MAX_SHOW = 2;

  // --- Logic Timer ---
  private timer: any;
  private start!: number;
  private remaining!: number;

  constructor(
    private notifyService: SdNotifyService,
    private sanitizer: DomSanitizer
  ) {}

  /**
   * Sanitize HTML tường minh trước khi render qua `[innerHTML]` — strip
   * `<script>`, event handler (`on*`), `javascript:` URL. Chỉ chạy ở nhánh
   * `data.html === true`; nhánh mặc định render text (auto-escape) nên không
   * có sink này. // why: phơi rõ việc sanitize cho review/scanner bảo mật.
   */
  sanitizeHtml(value: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';
  }

  /** Message ở dạng chuỗi đơn (chỉ dùng khi !isMultiMessage). */
  get singleMessage(): string {
    return this.data.message as string;
  }

  ngOnInit() {
    // Khởi tạo thời gian còn lại bằng duration ban đầu
    this.remaining = this.data.duration;
    // Bắt đầu đếm ngược ngay khi hiện ra
    this.resumeTimer();
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  // --- Logic Pause/Resume ---

  @HostListener('mouseenter')
  pauseTimer() {
    if (this.timer) {
      // Xóa timer hiện tại
      clearTimeout(this.timer);
      this.timer = null;
      // Tính toán thời gian đã trôi qua để trừ đi
      this.remaining -= Date.now() - this.start;
    }
  }

  @HostListener('mouseleave')
  resumeTimer() {
    // Chỉ chạy tiếp nếu còn thời gian và timer chưa chạy
    if (this.remaining > 0 && !this.timer) {
      this.start = Date.now();
      this.timer = setTimeout(() => {
        this.close();
      }, this.remaining);
    }
  }

  // --- Logic cũ ---

  close() {
    this.notifyService.remove(this.data.id);
  }

  onActionClick() {
    this.data.onAction?.();
  }

  toggleExpand() {
    this.isExpanded.update(v => !v);
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

  /** autoid theo loại toast để E2E chọn trực tiếp, vd `services-notify-toast-success`. */
  get autoId(): string {
    return `services-notify-toast-${this.data.type}`;
  }

  /** Gộp message (mảng nối ' | ') để phơi ra data-message cho E2E. */
  get dataMessage(): string {
    return Array.isArray(this.data.message) ? this.data.message.join(' | ') : this.data.message;
  }
}
