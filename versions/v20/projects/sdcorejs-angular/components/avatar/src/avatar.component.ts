import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

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

  readonly bgColor = computed(() => {
    if (this.isUrl()) {
      return 'transparent';
    }
    const val = this.src() || '';
    if (!val) {
      return '#bdc3c7';
    }
    return this.#generateColor(val);
  });

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
    const colors = [
      '#1abc9c',
      '#2ecc71',
      '#3498db',
      '#9b59b6',
      '#34495e',
      '#16a085',
      '#27ae60',
      '#2980b9',
      '#8e44ad',
      '#2c3e50',
      '#f1c40f',
      '#e67e22',
      '#e74c3c',
      '#95a5a6',
      '#f39c12',
      '#d35400',
      '#c0392b',
      '#bdc3c7',
      '#7f8c8d',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };
}
