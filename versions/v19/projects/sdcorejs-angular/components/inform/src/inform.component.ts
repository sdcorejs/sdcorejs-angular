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

// why: mỗi color có icon trạng thái mặc định khi consumer không truyền [icon].
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
  styleUrl: './inform.component.scss',
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

  // clamp dòng: null = không clamp (đầy đủ); số = số dòng tối đa.
  clampLines = computed<number | null>(() => {
    const n = this.lineClamp();
    if (!n || n <= 0) return null;
    return this.expanded() ? null : n;
  });

  // toggle hiện khi đang clamp và đã từng tràn, hoặc đang mở rộng (để còn thu gọn lại).
  showToggle = computed(() => {
    if (!this.lineClamp()) return false;
    return this.overflowing() || this.expanded();
  });

  // why: error/warning là cảnh báo → assertive 'alert'; các màu còn lại là thông tin → polite 'status'.
  liveRole = computed<'alert' | 'status'>(() => {
    const c = this.effectiveColor();
    return c === 'error' || c === 'warning' ? 'alert' : 'status';
  });

  // 5. OVERFLOW MEASUREMENT
  #measureScheduled = false;

  constructor() {
    // đo lần đầu sau render
    afterNextRender(() => this.measureOverflow());
    // why: re-đo khi nội dung/clamp/expanded đổi; đồng thời gắn ResizeObserver để bắt thay đổi kích thước container (responsive).
    effect(onCleanup => {
      this.description();
      this.lineClamp();
      this.expanded();
      const el = this.bodyRef()?.nativeElement;
      this.#scheduleMeasure();
      // why: guard instanceof Element để test stub (plain object) không làm ResizeObserver.observe ném lỗi.
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
    // gom nhiều thay đổi vào 1 lần đo sau khi DOM cập nhật xong
    queueMicrotask(() => {
      this.#measureScheduled = false;
      this.measureOverflow();
    });
  }

  /** Đo tràn dòng của body; chỉ có ý nghĩa khi đang clamp. */
  measureOverflow(): void {
    const el = this.bodyRef()?.nativeElement;
    if (!el || this.expanded() || !this.lineClamp()) return;
    // +1 chống sai số làm tròn sub-pixel
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
