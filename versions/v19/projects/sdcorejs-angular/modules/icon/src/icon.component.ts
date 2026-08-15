import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LucideDynamicIcon } from '@lucide/angular';
import { type Size } from '@sdcorejs/utils/models';
import { DefaultSdMaterialIconSet } from '@sdcorejs/angular/utilities/models';
import { SD_ICON_SIZE_MAP, type SdIconSet, type SdMaterialIconSet } from './icon.model';
import { SD_ICON_CONFIGURATION } from './icon.provider';

/**
 * Facade icon dùng chung cho Core UI.
 *
 * Component này giữ template app theo tên icon ổn định, còn renderer có thể đổi giữa Material font và Lucide SVG qua provider hoặc input.
 */
@Component({
  selector: 'sd-icon',
  standalone: true,
  imports: [MatIconModule, LucideDynamicIcon],
  template: `
    @if (resolvedName(); as _name) {
      @if (resolvedFontSet() === 'lucide') {
        <svg
          class="sd-icon__svg"
          [lucideIcon]="_name"
          [size]="resolvedSize()"
          [strokeWidth]="resolvedStrokeWidth()"
          [absoluteStrokeWidth]="resolvedAbsoluteStrokeWidth()"
          [title]="ariaLabel()"></svg>
      } @else {
        <mat-icon
          class="sd-icon__material"
          [fontSet]="resolvedMaterialFontSet()"
          [attr.aria-label]="ariaLabel()"
          [attr.aria-hidden]="ariaLabel() ? null : 'true'">
          {{ _name }}
        </mat-icon>
      }
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--sd-icon-size);
        height: var(--sd-icon-size);
        min-width: var(--sd-icon-size);
        color: currentColor;
        font-size: var(--sd-icon-size);
        line-height: 1;
        vertical-align: middle;
        flex: 0 0 auto;
      }

      /* why: base CSS của Material nhắm thẳng .mat-icon con trong menu/list/button item và ép
         width/height 24px + margin-right 12px lên nó. Glyph khi đó to hơn host --sd-icon-size,
         bị overflow hidden xén mất và lệch sang trái — lỗi "icon bị cắt đè" trong mat-menu. Selector
         đi qua :host (0,3,0) để luôn thắng .mat-mdc-menu-item .mat-icon (0,2,0) bất kể thứ tự nạp
         stylesheet; khoảng cách với nhãn để menu/list lo ở cấp host, không nhét vào trong glyph. */
      :host .sd-icon__material {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        margin: 0;
        color: currentColor;
        font-size: inherit;
        line-height: 1;
        overflow: hidden;
      }

      .sd-icon__svg {
        display: block;
        width: 100%;
        height: 100%;
        color: currentColor;
        stroke: currentColor;
        flex: 0 0 auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-icon',
    '[class.sd-icon--material]': 'resolvedFontSet() !== "lucide"',
    '[class.sd-icon--material-icons-outlined]': 'resolvedFontSet() === "material-icons-outlined"',
    '[class.sd-icon--lucide]': 'resolvedFontSet() === "lucide"',
    '[style.--sd-icon-size]': 'resolvedCssSize()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-hidden]': 'ariaLabel() ? null : "true"',
    '[attr.color]': 'color()',
  },
})
export class SdIcon {
  // why: InjectionToken cho phép app đổi default/alias mà không buộc từng component nhận thêm input cấu hình
  private readonly config = inject(SD_ICON_CONFIGURATION);

  /**
   * Tên icon theo namespace hiện tại.
   *
   * Khi `set` là `lucide`, tên này sẽ đi qua alias để app có thể tiếp tục dùng tên Material trong template.
   */
  name = input<string | undefined, string | undefined | null>(undefined, {
    transform: coerceStringInput,
  });

  fontIcon = input<string | undefined, string | undefined | null>(undefined, {
    transform: coerceStringInput,
  });

  color = input<string | undefined, string | undefined | null>(undefined, {
    transform: coerceStringInput,
  });

  /**
   * Renderer icon của riêng instance này.
   *
   * Deprecated alias for `fontSet`.
   */
  set = input<SdIconSet | undefined, SdIconSet | undefined | null>(undefined, {
    transform: value => value ?? undefined,
  });

  /**
   * Escape hatch cho Material icon font set.
   *
   * Prefer this input for both Material font families and Lucide SVG icons.
   */
  fontSet = input<SdIconSet | undefined, SdIconSet | undefined | null>(undefined, {
    transform: value => value ?? undefined,
  });

  /**
   * Kích thước icon theo token SDCoreJS hoặc CSS size tùy biến.
   *
   * Token `sm | md | lg` giữ icon đồng bộ với các component Core UI; CSS string xử lý các ngoại lệ layout.
   */
  size = input<Size | (string & {}), Size | (string & {}) | undefined | null>('md', {
    transform: value => value ?? 'md',
  });

  /**
   * Độ dày stroke riêng cho Lucide SVG.
   *
   * Bỏ trống để nhận giá trị từ `lucideConfig` app-level.
   */
  strokeWidth = input<number | string | undefined, number | string | undefined | null>(undefined, {
    transform: value => value ?? undefined,
  });

  /**
   * Giữ stroke width tuyệt đối cho Lucide khi SVG đổi kích thước.
   *
   * Input này đi qua `booleanAttribute` để hỗ trợ cả attribute trần trong template.
   */
  absoluteStrokeWidth = input<boolean | undefined, boolean | string | undefined | null>(undefined, {
    transform: value => (value == null ? undefined : booleanAttribute(value)),
  });

  /**
   * Nhãn truy cập cho icon có ý nghĩa.
   *
   * Khi không có nhãn, component tự đánh dấu decorative bằng `aria-hidden`.
   */
  ariaLabel = input<string | undefined, string | undefined | null>(undefined, {
    transform: coerceStringInput,
  });

  /**
   * Set icon cuối cùng sau khi áp dụng input và provider.
   *
   * @returns renderer hiện tại của component.
   */
  resolvedFontSet = computed<SdIconSet>(() => this.fontSet() ?? this.set() ?? this.config.defaultFontSet);

  /** @deprecated Use `resolvedFontSet` instead. */
  resolvedSet = computed<SdIconSet>(() => this.resolvedFontSet());

  /**
   * Tên icon cuối cùng theo renderer hiện tại.
   *
   * @returns tên icon đã áp alias nếu renderer yêu cầu.
   */
  resolvedName = computed(() => {
    const name = this.name() ?? this.fontIcon();
    if (!name) {
      return undefined;
    }

    const aliases = this.resolvedFontSet() === 'lucide' ? this.config.lucideAliases : this.config.materialAliases;
    return aliases[name] ?? name;
  });

  /**
   * Font set Material cuối cùng.
   *
   * @returns font set dùng cho `mat-icon`; với Lucide trả về fallback Material để computed luôn có type ổn định.
   */
  resolvedMaterialFontSet = computed<SdMaterialIconSet>(() => {
    const fontSet = this.resolvedFontSet();
    return fontSet === 'lucide' ? DefaultSdMaterialIconSet : fontSet;
  });

  /**
   * Kích thước runtime cho renderer hiện tại.
   *
   * @returns số pixel cho token chuẩn hoặc CSS string nguyên bản cho custom size.
   */
  resolvedSize = computed<number | string>(() => {
    const size = this.size();
    return isSizeToken(size) ? SD_ICON_SIZE_MAP[size] : size;
  });

  /**
   * Kích thước CSS cuối cùng cho host element.
   *
   * @returns CSS length dùng cho custom property `--sd-icon-size`.
   */
  resolvedCssSize = computed(() => {
    const size = this.resolvedSize();
    return typeof size === 'number' ? `${size}px` : size;
  });

  /**
   * Stroke width cuối cùng cho Lucide SVG.
   *
   * @returns giá trị input instance hoặc fallback từ provider.
   */
  resolvedStrokeWidth = computed(() => this.strokeWidth() ?? this.config.lucideConfig.strokeWidth);

  /**
   * Absolute stroke width cuối cùng cho Lucide SVG.
   *
   * @returns giá trị input instance hoặc fallback từ provider.
   */
  resolvedAbsoluteStrokeWidth = computed(() => this.absoluteStrokeWidth() ?? this.config.lucideConfig.absoluteStrokeWidth);
}

/**
 * Chuẩn hóa string input rỗng thành `undefined` để fallback provider hoạt động nhất quán.
 *
 * @param value - giá trị string từ input Angular.
 * @returns string đã trim hoặc `undefined`.
 */
function coerceStringInput(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/**
 * Kiểm tra một size có phải token chuẩn của SDCoreJS hay không.
 *
 * @param value - token size hoặc CSS size string.
 * @returns `true` khi value có mapping pixel trong `SD_ICON_SIZE_MAP`.
 */
function isSizeToken(value: Size | (string & {})): value is Size {
  return value in SD_ICON_SIZE_MAP;
}
