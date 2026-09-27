import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

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

@Component({
  selector: 'sd-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  readonly #imageError = signal<boolean>(false);

  constructor() {
    // Reset image error state whenever src changes
    effect(() => {
      this.src();
      this.#imageError.set(false);
    });
  }

  readonly isUrl = computed(() => {
    // If image has failed to load, treat it as a non-url to fallback to initials using the literal URL text
    if (this.#imageError()) {
      return false;
    }
    const val = this.src() || '';
    const urlPattern = /^(http|https|data:image|\/)/;
    return urlPattern.test(val);
  });

  readonly baseColor = computed(() => {
    if (this.isUrl()) {
      return 'transparent';
    }
    const val = this.src() || '';
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
    const val = this.src() || '';
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
