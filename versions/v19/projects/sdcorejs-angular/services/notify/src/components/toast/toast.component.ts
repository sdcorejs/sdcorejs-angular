import { Component, Input, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class ToastComponent implements OnInit, OnDestroy {
  @Input({ required: true }) data!: ToastData;
  
  isExpanded = signal(false);
  readonly MAX_SHOW = 2;

  // --- Logic Timer ---
  private timer: any;
  private start!: number;
  private remaining!: number;

  constructor(private notifyService: SdNotifyService) {}

  ngOnInit() {
    // Khá»Ÿi táº¡o thá»i gian cÃ²n láº¡i báº±ng duration ban Ä‘áº§u
    this.remaining = this.data.duration;
    // Báº¯t Ä‘áº§u Ä‘áº¿m ngÆ°á»£c ngay khi hiá»‡n ra
    this.resumeTimer();
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  // --- Logic Pause/Resume ---

  @HostListener('mouseenter')
  pauseTimer() {
    if (this.timer) {
      // XÃ³a timer hiá»‡n táº¡i
      clearTimeout(this.timer);
      this.timer = null;
      // TÃ­nh toÃ¡n thá»i gian Ä‘Ã£ trÃ´i qua Ä‘á»ƒ trá»« Ä‘i
      this.remaining -= Date.now() - this.start;
    }
  }

  @HostListener('mouseleave')
  resumeTimer() {
    // Chá»‰ cháº¡y tiáº¿p náº¿u cÃ²n thá»i gian vÃ  timer chÆ°a cháº¡y
    if (this.remaining > 0 && !this.timer) {
      this.start = Date.now();
      this.timer = setTimeout(() => {
        this.close();
      }, this.remaining);
    }
  }

  // --- Logic cÅ© ---

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
