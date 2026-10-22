import { ChangeDetectionStrategy, Component, booleanAttribute, computed, effect, input, isDevMode, signal } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { Color } from '@sdcorejs/utils/models';

// Theme tokens (themes/_component-tokens.scss), each with its 2.15 colour as fallback so the avatar looks the same
// when no theme is loaded. The name palette keeps the 2.15 order: a name hashes to the same slot as before.
const SD_AVATAR_PALETTE = [
  'var(--sd-avatar-color-1, #1abc9c)',
  'var(--sd-avatar-color-2, #2ecc71)',
  'var(--sd-avatar-color-3, #3498db)',
  'var(--sd-avatar-color-4, #9b59b6)',
  'var(--sd-avatar-color-5, #34495e)',
  'var(--sd-avatar-color-6, #16a085)',
  'var(--sd-avatar-color-7, #27ae60)',
  'var(--sd-avatar-color-8, #2980b9)',
  'var(--sd-avatar-color-9, #8e44ad)',
  'var(--sd-avatar-color-10, #2c3e50)',
  'var(--sd-avatar-color-11, #f1c40f)',
  'var(--sd-avatar-color-12, #e67e22)',
  'var(--sd-avatar-color-13, #e74c3c)',
  'var(--sd-avatar-color-14, #95a5a6)',
  'var(--sd-avatar-color-15, #f39c12)',
  'var(--sd-avatar-color-16, #d35400)',
  'var(--sd-avatar-color-17, #c0392b)',
  'var(--sd-avatar-color-18, #bdc3c7)',
  'var(--sd-avatar-color-19, #7f8c8d)',
] as const;
const SD_AVATAR_NEUTRAL = 'var(--sd-avatar-neutral, #bdc3c7)';
/** Base the chip background mixes the palette colour into (white in light, a dark surface in dark). */
const SD_AVATAR_TINT = 'var(--sd-avatar-tint, #ffffff)';
/** Base the initials colour mixes the palette colour into (black in light, white in dark). */
const SD_AVATAR_INK = 'var(--sd-avatar-ink, #000000)';
const SD_AVATAR_URL = /^(http|https|data:image|\/)/;

@Component({
  selector: 'sd-avatar',
  standalone: true,
  imports: [SdBadge, SdTooltipDirective],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // why: host là một ảnh duy nhất "Tên, trạng thái"; không có tên lẫn trạng thái thì để trang trí, không đọc.
    '[attr.role]': "accessibleName() ? 'img' : null",
    '[attr.aria-label]': 'accessibleName() || null',
  },
})
export class SdAvatar {
  /**
   * The source string to be used for the avatar.
   * - If it matches a URL pattern, an image is displayed.
   * - If it is a string representing a name, initials and a colored background are generated.
   * - If undefined, it falls back to a neutral ? initial.
   */
  readonly src = input.required<string | undefined | null>();
  readonly size = input<number>(32);
  /** Tên người: dùng cho tên truy cập, tooltip của avatar ảnh và chữ viết tắt khi ảnh lỗi. */
  readonly name = input<string | null | undefined>();
  /** Màu chấm trạng thái. Không có thì không hiện chấm. */
  readonly status = input<Color | null | undefined>(null);
  /** Chữ mô tả trạng thái (tooltip của chấm, nối vào tên truy cập). Bắt buộc khi có `status`. */
  readonly statusLabel = input<string | null | undefined>();
  /** Vòng sáng nhấp nháy quanh chấm. */
  readonly statusPulse = input(false, { transform: booleanAttribute });

  readonly #imageError = signal<boolean>(false);

  constructor() {
    // Reset image error state whenever src changes
    effect(() => {
      this.src();
      this.#imageError.set(false);
    });
    // why: chấm chỉ có màu; không có statusLabel thì người dùng và screen reader không biết màu đó nghĩa là gì.
    effect(() => {
      if (isDevMode() && this.status() && !this.statusLabel()?.trim()) {
        console.warn(
          '[sd-avatar] `status` is set without `statusLabel`: the status dot has no text for its tooltip or for screen readers.'
        );
      }
    });
  }

  readonly #srcIsUrl = computed(() => SD_AVATAR_URL.test(this.src() || ''));

  readonly isUrl = computed(() => {
    // If image has failed to load, treat it as a non-url to fallback to initials using the literal URL text
    if (this.#imageError()) {
      return false;
    }
    return this.#srcIsUrl();
  });

  /** Chuỗi lấy chữ viết tắt và màu: `src` khi nó là tên; ảnh lỗi thì lấy `name` (không có thì vẫn là chuỗi URL như cũ). */
  readonly #textSource = computed(() => {
    const src = this.src() || '';
    if (!this.#srcIsUrl()) return src;
    return this.name()?.trim() || src;
  });

  /** Tên người: `name`, hoặc `src` khi `src` là tên. */
  readonly personName = computed(() => this.name()?.trim() || (this.#srcIsUrl() ? '' : (this.src() || '').trim()));

  /** Tên truy cập của host: tên, nối thêm ", {statusLabel}" khi có trạng thái. */
  readonly accessibleName = computed(() => {
    const label = this.status() ? this.statusLabel()?.trim() : '';
    return [this.personName(), label].filter(Boolean).join(', ');
  });

  /** Tooltip của avatar ảnh: tên (avatar chữ đã hiện chữ viết tắt). */
  readonly imageTooltip = computed(() => (this.isUrl() ? this.name()?.trim() || '' : ''));

  // Hình học chấm: đường kính clamp(8px, size × 0.25, 20px); viền 2px (3px từ size 64); tâm chấm nằm trên mép
  // avatar ở góc 45° nên right = bottom = size × 0.146 − (chấm + 2 × viền) / 2.
  readonly statusDotSize = computed(() => Math.min(20, Math.max(8, this.size() * 0.25)));
  readonly statusRingWidth = computed(() => (this.size() >= 64 ? 3 : 2));
  readonly statusOffset = computed(() => this.size() * 0.146 - (this.statusDotSize() + 2 * this.statusRingWidth()) / 2);

  readonly baseColor = computed(() => {
    if (this.isUrl()) {
      return 'transparent';
    }
    const val = this.#textSource();
    if (!val) {
      return SD_AVATAR_NEUTRAL;
    }
    return this.#generateColor(val);
  });

  readonly bgColor = computed(() =>
    this.isUrl() ? 'transparent' : 'color-mix(in srgb, ' + this.baseColor() + ' 14%, ' + SD_AVATAR_TINT + ')'
  );
  readonly textColor = computed(() => 'color-mix(in srgb, ' + this.baseColor() + ' 45%, ' + SD_AVATAR_INK + ')');

  readonly initials = computed(() => {
    if (this.isUrl()) {
      return '';
    }
    const val = this.#textSource();
    if (!val) {
      return '?';
    }
    return this.#getInitials(val);
  });

  handleError() {
    this.#imageError.set(true);
  }

  #getInitials = (name: string): string => {
    const words = name.trim().split(' ').filter(Boolean);
    if (!words.length) return '';
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  #generateColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return SD_AVATAR_PALETTE[Math.abs(hash) % SD_AVATAR_PALETTE.length];
  };
}
