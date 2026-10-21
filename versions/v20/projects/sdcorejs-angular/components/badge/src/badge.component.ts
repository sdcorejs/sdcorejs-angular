import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  booleanAttribute,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { SdIcon, type SdIconSet } from '@sdcorejs/angular/modules/icon';
import { Color, Size } from '@sdcorejs/utils/models';

// Export các Type để dùng chung
export type SdBadgeType = 'tag' | 'round' | 'icon';

/** Số đếm lớn hơn giá trị này hiện "99+". */
const SD_BADGE_COUNT_MAX = 99;

@Component({
  selector: 'sd-badge',
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SdIcon, SdTooltipDirective],
  host: {
    // why: `<sd-badge title="…">` để lại attribute title trên host, trình duyệt hiện tooltip riêng chồng lên
    // tooltip của badge. Giá trị vẫn tới input `title`.
    '[attr.title]': 'null',
    '(mouseenter)': 'measureTruncation()',
    '(focusin)': 'measureTruncation()',
  },
})
export class SdBadge {
  /** Tên dùng làm accessible name dự phòng khi badge bấm được không có chữ và không có icon. */
  defaultIcon = 'fiber_manual_record';

  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  type = input<SdBadgeType, SdBadgeType | undefined | null>('icon', {
    transform: value => value || 'icon',
  });

  color = input<Color, Color | undefined | null>('secondary', {
    transform: value => value || 'secondary',
  });

  primary = input(false, { transform: booleanAttribute });
  secondary = input(false, { transform: booleanAttribute });
  success = input(false, { transform: booleanAttribute });
  info = input(false, { transform: booleanAttribute });
  warning = input(false, { transform: booleanAttribute });
  error = input(false, { transform: booleanAttribute });

  fontSet = input<SdIconSet | undefined, SdIconSet | undefined | null>(undefined, {
    transform: value => value ?? undefined,
  });

  title = input<string | number | undefined | null>();
  description = input<string | undefined | null>();
  tooltip = input<string | undefined | null>();
  icon = input<string | undefined | null>();

  size = input<Size, Size | undefined | null>('sm', {
    transform: value => value || 'sm',
  });

  // ==========================================
  // 2. OUTPUT
  // ==========================================
  // why: the template reads EventEmitter.observed to expose pointer styling only when a click listener exists.
  @Output() readonly click = new EventEmitter<Event>();

  onClick = (event: Event) => {
    // why: chỉ nuốt event khi thực sự có consumer lắng nghe. Trước đây badge luôn stopPropagation
    // nên khi đặt badge bên trong một control cha (vd <a> của tab-router) thì click không bao giờ
    // tới cha — buộc cha phải nhân bản handler lên chính badge, tạo interactive lồng interactive.
    if (!this.click.observed) return;
    event.stopPropagation();
    this.click.emit(event);
  };

  // why: badge clickable trước đây là <div (click)> + aria-hidden="true" — vừa không nhận focus
  // bàn phím vừa biến mất khỏi accessibility tree, tệ hơn là không làm gì. Nay khi có consumer
  // lắng nghe (click) thì badge nhận role="button" + tabindex="0" và Enter/Space chạy đúng như click.
  onActivateKey = (event: Event) => {
    // why: chặn hành vi mặc định của Space (cuộn trang) trước khi kích hoạt.
    event.preventDefault();
    this.onClick(event);
  };

  // ==========================================
  // 3. TOOLTIP
  // ==========================================
  private readonly titleRef = viewChild<ElementRef<HTMLElement>>('titleEl');
  readonly #truncated = signal(false);

  /**
   * Đo lúc hover/focus xem chữ có bị cắt không; chỉ khi bị cắt (hoặc có `tooltip`) badge mới có tooltip.
   */
  // why: đo theo sự kiện thay vì ResizeObserver — bảng có hàng trăm badge, phần lớn không bao giờ được rê chuột.
  measureTruncation = (): void => {
    const el = this.titleRef()?.nativeElement;
    this.#truncated.set(!!el && el.scrollWidth > el.clientWidth);
  };

  /** Chữ của tooltip: `tooltip` nếu có, ngược lại là title đầy đủ khi chữ bị cắt, ngược lại rỗng (không tooltip). */
  tooltipText = computed(() => {
    const tooltip = this.tooltip()?.trim();
    if (tooltip) return tooltip;
    const title = this.title();
    return this.#truncated() && title !== undefined && title !== null ? String(title) : '';
  });

  // ==========================================
  // 4. COMPUTED STATE
  // ==========================================

  effectiveColor = computed(() => {
    if (this.primary()) return 'primary';
    if (this.secondary()) return 'secondary';
    if (this.success()) return 'success';
    if (this.info()) return 'info';
    if (this.warning()) return 'warning';
    if (this.error()) return 'error';
    return this.color();
  });

  accessibleName = computed(() => {
    const visibleText = [this.title(), this.description()]
      .filter(value => value !== undefined && value !== null && String(value).trim() !== '')
      .map(value => String(value).trim())
      .join(' ');
    if (visibleText) return visibleText;

    const tooltip = this.tooltip()?.trim();
    if (tooltip) return tooltip;

    return (this.icon() || this.defaultIcon).replace(/[_-]+/g, ' ').trim();
  });

  /** `title` là số (kể cả 0) với type round: số đếm hình tròn, chữ số đều bề rộng. Chuỗi "12" vẫn là chữ. */
  isCount = computed(() => {
    const title = this.title();
    return this.type() === 'round' && typeof title === 'number' && Number.isFinite(title);
  });

  /** Số đếm lớn hơn 99 thì cần đọc số thật cho screen reader, vì phần nhìn thấy chỉ là "99+". */
  countOverflow = computed(() => this.isCount() && (this.title() as number) > SD_BADGE_COUNT_MAX);

  displayTitle = computed(() => (this.countOverflow() ? `${SD_BADGE_COUNT_MAX}+` : this.title()));

  baseColorClasses = computed(() => {
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

  iconColorClasses = computed(() => this.baseColorClasses());

  iconSizeAndFontClasses = computed(() => {
    const s = this.size();
    return {
      'c-sm': s === 'sm',
      'c-md': s === 'md',
      'c-lg': s === 'lg',
    };
  });

  // why: type icon nằm trong dòng chữ nên to hơn một bậc so với round/tag (thiết kế đợt 3 · 1a).
  iconCssSize = computed(() => {
    const s = this.size();
    if (this.type() === 'icon') return s === 'sm' ? '16px' : '18px';
    if (s === 'md') return '16px';
    if (s === 'lg') return '18px';
    return '14px';
  });

  // why: keep container size classes separate from icon element size classes.
  containerSizeClasses = computed(() => {
    const s = this.size();
    return {
      'c-badge--sm': s === 'sm',
      'c-badge--md': s === 'md',
      'c-badge--lg': s === 'lg',
    };
  });

  // GỘP CLASS CHO BADGE TYPE = 'TAG' (cũng dùng lại cho 'ROUND' khi có icon)
  tagIconCombinedClasses = computed(() => ({
    ...this.iconSizeAndFontClasses(),
    ...this.baseColorClasses(),
  }));

  // GỘP CLASS CHO CONTAINER (màu + size modifier), dùng cho cả ba type
  containerCombinedClasses = computed(() => ({
    ...this.baseColorClasses(),
    ...this.containerSizeClasses(),
  }));

  // GỘP CLASS CHO BADGE TYPE = 'ICON'
  iconCombinedClasses = computed(() => ({
    ...this.iconSizeAndFontClasses(),
    ...this.iconColorClasses(),
  }));
}
