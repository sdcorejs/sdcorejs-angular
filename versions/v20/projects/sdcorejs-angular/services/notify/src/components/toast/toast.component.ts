import { Component, Input, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastData } from '../../notify.model';
import { SdNotifyService } from '../../notify.service';

@Component({
  selector: 'sd-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
  host: {
    '[@toastAnimation]': 'true',
    '[class]': '"bg-white sd-toast"'
  }
})
export class SdToastComponent implements OnInit, OnDestroy {
  @Input({ required: true }) data!: ToastData;
  
  isExpanded = signal(false);
  readonly MAX_SHOW = 2;

  // --- Logic Timer ---
  private timer: any;
  private start!: number;
  private remaining!: number;

  constructor(private notifyService: SdNotifyService) {}

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
}