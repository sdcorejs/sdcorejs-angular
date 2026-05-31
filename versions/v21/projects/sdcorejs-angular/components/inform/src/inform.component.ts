/* eslint-disable @angular-eslint/no-output-rename */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Color } from '@sdcorejs/utils/models';
import { MaterialIconFontSet } from '@sdcorejs/angular/utilities/models';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdInformActionDirective } from './inform-action.directive';

// why: má»—i color cÃ³ icon tráº¡ng thÃ¡i máº·c Ä‘á»‹nh khi consumer khÃ´ng truyá»n [icon].
const SD_INFORM_DEFAULT_ICON: Record<Color, string> = {
  primary: 'info',
  secondary: 'info',
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

@Component({
  selector: 'sd-inform',
  templateUrl: './inform.component.html',
  styleUrls: ['./inform.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
})
export class SdInform {
  // 1. INPUTS
  color = input<Color, Color | undefined | null>('primary', {
    transform: value => value || 'primary',
  });

  primary = input(false, { transform: booleanAttribute });
  secondary = input(false, { transform: booleanAttribute });
  info = input(false, { transform: booleanAttribute });
  success = input(false, { transform: booleanAttribute });
  warning = input(false, { transform: booleanAttribute });
  error = input(false, { transform: booleanAttribute });

  title = input<string | undefined>();
  description = input<string | undefined>();
  icon = input<string | undefined>();
  hideIcon = input(false, { transform: booleanAttribute });

  fontSet = input<MaterialIconFontSet, MaterialIconFontSet | undefined | null>('material-icons', {
    transform: value => value || 'material-icons',
  });

  closable = input(false, { transform: booleanAttribute });
  actionLabel = input<string | undefined>();
  lineClamp = input<number | undefined>();
  autoId = input<string | undefined>();

  // 2. OUTPUTS
  sdClosed = output<Event>();
  sdAction = output<Event>();

  // 3. STATE
  readonly dismissed = signal(false);
  readonly expanded = signal(false);
  readonly overflowing = signal(false);

  protected readonly bodyRef = viewChild<ElementRef<HTMLElement>>('body');
  protected readonly actionSlot = contentChild(SdInformActionDirective);

  // 4. COMPUTED
  effectiveColor = computed<Color>(() => {
    if (this.primary()) return 'primary';
    if (this.secondary()) return 'secondary';
    if (this.info()) return 'info';
    if (this.success()) return 'success';
    if (this.warning()) return 'warning';
    if (this.error()) return 'error';
    return this.color();
  });

  colorClasses = computed(() => {
    const c = this.effectiveColor();
    return {
      'c-primary': c === 'primary',
      'c-secondary': c === 'secondary',
      'c-info': c === 'info',
      'c-success': c === 'success',
      'c-warning': c === 'warning',
      'c-error': c === 'error',
    };
  });

  effectiveIcon = computed<string | null>(() => {
    if (this.hideIcon()) return null;
    return this.icon() || SD_INFORM_DEFAULT_ICON[this.effectiveColor()];
  });

  fontSetClasses = computed(() => {
    const f = this.fontSet();
    return {
      'material-icons': f === 'material-icons',
      'material-icons-outlined': f === 'material-icons-outlined',
      'material-icons-round': f === 'material-icons-round',
      'material-icons-sharp': f === 'material-icons-sharp',
    };
  });

  hasActionSlot = computed(() => !!this.actionSlot());

  // clamp dÃ²ng: null = khÃ´ng clamp (Ä‘áº§y Ä‘á»§); sá»‘ = sá»‘ dÃ²ng tá»‘i Ä‘a.
  clampLines = computed<number | null>(() => {
    const n = this.lineClamp();
    if (!n || n <= 0) return null;
    return this.expanded() ? null : n;
  });

  // toggle hiá»‡n khi Ä‘ang clamp vÃ  Ä‘Ã£ tá»«ng trÃ n, hoáº·c Ä‘ang má»Ÿ rá»™ng (Ä‘á»ƒ cÃ²n thu gá»n láº¡i).
  showToggle = computed(() => {
    if (!this.lineClamp()) return false;
    return this.overflowing() || this.expanded();
  });

  // why: error/warning lÃ  cáº£nh bÃ¡o â†’ assertive 'alert'; cÃ¡c mÃ u cÃ²n láº¡i lÃ  thÃ´ng tin â†’ polite 'status'.
  liveRole = computed<'alert' | 'status'>(() => {
    const c = this.effectiveColor();
    return c === 'error' || c === 'warning' ? 'alert' : 'status';
  });

  // 5. OVERFLOW MEASUREMENT
  #measureScheduled = false;

  constructor() {
    // Ä‘o láº§n Ä‘áº§u sau render
    afterNextRender(() => this.measureOverflow());
    // why: re-Ä‘o khi ná»™i dung/clamp/expanded Ä‘á»•i; Ä‘á»“ng thá»i gáº¯n ResizeObserver Ä‘á»ƒ báº¯t thay Ä‘á»•i kÃ­ch thÆ°á»›c container (responsive).
    effect(onCleanup => {
      this.description();
      this.lineClamp();
      this.expanded();
      const el = this.bodyRef()?.nativeElement;
      this.#scheduleMeasure();
      // why: guard instanceof Element Ä‘á»ƒ test stub (plain object) khÃ´ng lÃ m ResizeObserver.observe nÃ©m lá»—i.
      if (el instanceof Element && typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => this.measureOverflow());
        ro.observe(el);
        onCleanup(() => ro.disconnect());
      }
    });
  }

  #scheduleMeasure(): void {
    if (this.#measureScheduled) return;
    this.#measureScheduled = true;
    // gom nhiá»u thay Ä‘á»•i vÃ o 1 láº§n Ä‘o sau khi DOM cáº­p nháº­t xong
    queueMicrotask(() => {
      this.#measureScheduled = false;
      this.measureOverflow();
    });
  }

  /** Äo trÃ n dÃ²ng cá»§a body; chá»‰ cÃ³ Ã½ nghÄ©a khi Ä‘ang clamp. */
  measureOverflow(): void {
    const el = this.bodyRef()?.nativeElement;
    if (!el || this.expanded() || !this.lineClamp()) return;
    // +1 chá»‘ng sai sá»‘ lÃ m trÃ²n sub-pixel
    this.overflowing.set(el.scrollHeight > el.clientHeight + 1);
  }

  // 6. HANDLERS
  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  onClose(event: Event): void {
    event.stopPropagation();
    this.dismissed.set(true);
    this.sdClosed.emit(event);
  }

  onAction(event: Event): void {
    event.stopPropagation();
    this.sdAction.emit(event);
  }
}

