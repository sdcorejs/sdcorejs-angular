import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, booleanAttribute, computed, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdIcon, type SdIconSet } from '@sdcorejs/angular/modules/icon';
import { Color, Size } from '@sdcorejs/utils/models';
import { MaterialIconFontSet } from '@sdcorejs/angular/utilities/models';

// Export các Type để dùng chung
export type SdBadgeType = 'tag' | 'round' | 'icon';

@Component({
  selector: 'sd-badge',
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SdIcon, MatTooltipModule],
})
export class SdBadge {
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

  fontSet = input<MaterialIconFontSet | undefined, MaterialIconFontSet | undefined | null>(undefined, {
    transform: value => value ?? undefined,
  });

  iconSet = input<SdIconSet | undefined, SdIconSet | undefined | null>(undefined, {
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
  @Output() click = new EventEmitter<Event>();

  onClick = (event: Event) => {
    event.stopPropagation();
    this.click.emit(event);
  };

  // ==========================================
  // 3. COMPUTED STATE
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

  iconColorClasses = computed(() => {
    const c = this.effectiveColor();
    return {
      'c-primary': c === 'primary',
      'c-black400': c === 'secondary',
      'c-info': c === 'info',
      'c-success': c === 'success',
      'c-warning': c === 'warning',
      'c-error': c === 'error',
    };
  });

  iconSizeAndFontClasses = computed(() => {
    const s = this.size();
    return {
      'c-sm': s === 'sm',
      'c-md': s === 'md',
      'c-lg': s === 'lg',
    };
  });

  iconCssSize = computed(() => {
    const s = this.size();
    if (s === 'md') return '18px';
    if (s === 'lg') return '24px';
    return '16px';
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

  // GỘP CLASS CHO CONTAINER round/tag (color tint + size modifier)
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
