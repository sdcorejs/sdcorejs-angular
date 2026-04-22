/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, booleanAttribute, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdColor, SdSize } from '@sdcorejs/angular/utilities/models';
import { MaterialIconFontSet, DefaultMaterialIconFontSet } from '@sdcorejs/angular/utilities/models';

// Export cÃ¡c Type Ä‘á»ƒ dÃ¹ng chung
export type SdBadgeType = 'tag' | 'round' | 'icon';

@Component({
  selector: 'sd-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
})
export class SdBadge {
  defaultIcon = 'fiber_manual_record';

  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  type = input<SdBadgeType, SdBadgeType | undefined | null>('icon', {
    transform: value => value || 'icon',
  });

  color = input<SdColor, SdColor | undefined | null>('secondary', {
    transform: value => value || 'secondary',
  });

  primary = input(false, { transform: booleanAttribute });
  secondary = input(false, { transform: booleanAttribute });
  success = input(false, { transform: booleanAttribute });
  info = input(false, { transform: booleanAttribute });
  warning = input(false, { transform: booleanAttribute });
  error = input(false, { transform: booleanAttribute });

  fontSet = input<MaterialIconFontSet, MaterialIconFontSet | undefined | null>('material-icons', {
    transform: value => value || 'material-icons',
  });

  title = input<string | number | undefined | null>();
  description = input<string | undefined | null>();
  tooltip = input<string | undefined | null>();
  icon = input<string | undefined | null>();

  size = input<SdSize, SdSize | undefined | null>('sm', {
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
    const f = this.fontSet();
    return {
      'c-xs': s === 'xs',
      'c-sm': s === 'sm',
      'c-md': s === 'md',
      'c-lg': s === 'lg',
      'material-icons': f === 'material-icons',
      'material-icons-outlined': f === 'material-icons-outlined',
      'material-icons-round': f === 'material-icons-round',
      'material-icons-sharp': f === 'material-icons-sharp',
    };
  });

  // Gá»˜P CLASS CHO BADGE TYPE = 'TAG'
  tagIconCombinedClasses = computed(() => ({
    ...this.iconSizeAndFontClasses(),
    ...this.baseColorClasses(),
  }));

  // Gá»˜P CLASS CHO BADGE TYPE = 'ICON'
  iconCombinedClasses = computed(() => ({
    ...this.iconSizeAndFontClasses(),
    ...this.iconColorClasses(),
  }));
}

