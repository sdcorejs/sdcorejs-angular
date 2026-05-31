/* eslint-disable @angular-eslint/no-input-rename */
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
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { Color } from '@sdcorejs/utils/models';
import { DefaultMaterialIconFontSet, MaterialIconFontSet } from '@sdcorejs/angular/utilities/models';
import { Subject, Subscription } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';

// Export cÃ¡c Type ra ngoÃ i Ä‘á»ƒ tÃ¡i sá»­ dá»¥ng á»Ÿ file config/interface
export type SdButtonType = 'fill' | 'light' | 'outline' | 'link';
export type SdButtonSize = 'sm' | 'md' | 'lg';
export type SdButtonHtmlType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'sd-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  host: {
    '[class.sd-disabled]': 'disabled()',
    '[class.sd-loading]': 'loading()',
    '[class.sd-block]': 'block()',
    '[attr.disabled]': 'disabled() ? "true" : null',
  }
})
export class SdButton extends SdBaseSecureComponent implements OnInit, OnDestroy {
  // ==========================================
  // 1. INJECTS
  // ==========================================
  private el = inject(ElementRef);

  // ==========================================
  // 2. SIGNAL INPUTS (Báº£o máº­t 100% vá»›i Null/Undefined)
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  
  type = input<SdButtonType, SdButtonType | undefined | null>('light', {
    transform: (value) => value || 'light'
  });

  color = input<Color, Color | undefined | null>('secondary', {
    transform: (value) => value || 'secondary'
  });

  size = input<SdButtonSize, SdButtonSize | undefined | null>('sm', {
    transform: (value) => value || 'sm'
  });

  fontSet = input<MaterialIconFontSet, MaterialIconFontSet | undefined | null>(DefaultMaterialIconFontSet, {
    transform: (value) => value || DefaultMaterialIconFontSet
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
    transform: (value) => value || 'button'
  });

  // ==========================================
  // 3. COMPUTED STATE
  // ==========================================
  autoId = computed(() => this.autoIdInput() ? `components-button-${this.autoIdInput()}` : undefined);
  
  buttonClasses = computed(() => ({
    'c-square': (this.prefixIcon() || this.suffixIcon()) && !this.title(),
    'c-sm': this.size() === 'sm',
    'c-md': this.size() === 'md',
    'c-lg': this.size() === 'lg',
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
    super();

    // Ká»¹ thuáº­t ÄÃ¡nh cháº·n sá»± kiá»‡n (Capture Phase)
    // TÃ³m sá»‘ng má»i sá»± kiá»‡n click ngay khi nÃ³ vá»«a cháº¡m vÃ o component
    this.el.nativeElement.addEventListener(
      'click',
      (event: Event) => {
        if (this.disabled() || this.loading()) {
          // Nghiá»n nÃ¡t sá»± kiá»‡n, khÃ´ng cho Angular phÃ¡t (click) ra component cha
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

  // Nháº­n click tá»« tháº» button con bÃªn trong
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
