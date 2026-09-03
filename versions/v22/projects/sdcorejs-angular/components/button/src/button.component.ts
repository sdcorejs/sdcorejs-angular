import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Color } from '@sdcorejs/utils/models';
import { SdIcon, type SdIconSet } from '@sdcorejs/angular/modules/icon';
import { Subject, Subscription } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';

// Export các Type ra ngoài để tái sử dụng ở file config/interface
export type SdButtonType = 'fill' | 'light' | 'outline' | 'text';
export type SdButtonSize = 'sm' | 'md' | 'lg';
export type SdButtonHtmlType = 'button' | 'submit' | 'reset';
export type SdButtonColor = Color | 'black';

@Component({
  selector: 'sd-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, SdIcon],
  host: {
    '[class.sd-disabled]': 'disabled()',
    '[class.sd-loading]': 'loading()',
    '[class.sd-block]': 'block()',
    '[attr.disabled]': 'disabled() ? "true" : null',
  },
})
export class SdButton implements OnInit, OnDestroy {
  // ==========================================
  // 1. INJECTS
  // ==========================================
  private el = inject(ElementRef);

  // ==========================================
  // 2. SIGNAL INPUTS (Bảo mật 100% với Null/Undefined)
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });

  type = input<SdButtonType, SdButtonType | undefined | null>('light', {
    transform: value => value || 'light',
  });

  color = input<SdButtonColor, SdButtonColor | undefined | null>('secondary', {
    transform: value => value || 'secondary',
  });

  size = input<SdButtonSize, SdButtonSize | undefined | null>('sm', {
    transform: value => value || 'sm',
  });

  fontSet = input<SdIconSet | undefined, SdIconSet | undefined | null>(undefined, {
    transform: value => value ?? undefined,
  });

  title = input<string | undefined | null>(undefined);
  width = input<string | undefined | null>(undefined);
  tooltip = input<string | undefined | null>(undefined);
  prefixIcon = input<string | undefined | null>(undefined);
  suffixIcon = input<string | undefined | null>(undefined);

  disabled = input(false, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });
  block = input(false, { transform: booleanAttribute });

  htmlType = input<SdButtonHtmlType, SdButtonHtmlType | undefined | null>('button', {
    transform: value => value || 'button',
  });

  // ==========================================
  // 3. COMPUTED STATE
  // ==========================================
  autoId = computed(() => (this.autoIdInput() ? `components-button-${this.autoIdInput()}` : undefined));

  buttonClasses = computed(() => ({
    'c-square': (this.prefixIcon() || this.suffixIcon()) && !this.title(),
    'c-sm': this.size() === 'sm',
    'c-md': this.size() === 'md',
    'c-lg': this.size() === 'lg',
    'c-black': this.color() === 'black',
    'c-disabled': this.disabled(),
    'c-block': this.block(),
  }));

  // ==========================================
  // 4. OUTPUT & RXJS STREAMS
  // ==========================================
  click = output<Event>();

  #clickSubject = new Subject<Event>();
  #subscription = new Subscription();

  constructor() {
    // Kỹ thuật Đánh chặn sự kiện (Capture Phase)
    // Tóm sống mọi sự kiện click ngay khi nó vừa chạm vào component
    this.el.nativeElement.addEventListener(
      'click',
      (event: Event) => {
        if (this.disabled() || this.loading()) {
          // Nghiền nát sự kiện, không cho Angular phát (click) ra component cha
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
      },
      { capture: true }
    );
  }

  ngOnInit() {
    this.#subscription.add(
      this.#clickSubject
        .pipe(
          throttleTime(300, undefined, { leading: true, trailing: false }),
          filter(() => !this.disabled() && !this.loading())
        )
        .subscribe(event => {
          this.click.emit(event);
        })
    );
  }

  // Nhận click từ thẻ button con bên trong
  onInternalClick(event: Event) {
    event.stopPropagation();

    if (this.disabled() || this.loading()) {
      return;
    }

    this.#clickSubject.next(event);
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }
}
