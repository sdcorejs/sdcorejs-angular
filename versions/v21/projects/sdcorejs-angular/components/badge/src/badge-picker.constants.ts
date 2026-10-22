import { Color } from '@sdcorejs/utils/models';
import { SdBadgeType } from './badge.component';

/** Một lựa chọn type của `sd-badge`, với key i18n cho tên và mô tả. */
export interface SdBadgeTypeOption {
  value: SdBadgeType;
  labelKey: string;
  descriptionKey: string;
}

/** Giá trị của `sd-badge-picker` (và của FormControl khi dùng `[form]`). */
export interface SdBadgePickerValue {
  type: SdBadgeType;
  color: Color;
  icon: string | null;
}

/** Sáu type của `sd-badge`, theo thứ tự hiện trong `sd-badge-picker`. */
export const SD_BADGE_TYPE_OPTIONS: readonly SdBadgeTypeOption[] = [
  { value: 'icon', labelKey: 'core.component.badge.type.icon', descriptionKey: 'core.component.badge.type.icon.description' },
  { value: 'round', labelKey: 'core.component.badge.type.round', descriptionKey: 'core.component.badge.type.round.description' },
  { value: 'tag', labelKey: 'core.component.badge.type.tag', descriptionKey: 'core.component.badge.type.tag.description' },
  { value: 'solid', labelKey: 'core.component.badge.type.solid', descriptionKey: 'core.component.badge.type.solid.description' },
  { value: 'dot', labelKey: 'core.component.badge.type.dot', descriptionKey: 'core.component.badge.type.dot.description' },
  { value: 'pair', labelKey: 'core.component.badge.type.pair', descriptionKey: 'core.component.badge.type.pair.description' },
];

/** Lưới icon mặc định của `sd-badge-picker` (23 icon, theo `badge.md` của thiết kế đợt 3). */
export const SD_BADGE_ICON_PRESET: readonly string[] = [
  'check_circle',
  'cancel',
  'schedule',
  'error',
  'warning',
  'info',
  'sync',
  'flag',
  'star',
  'bolt',
  'lock',
  'visibility',
  'edit_note',
  'label',
  'sell',
  'local_shipping',
  'payments',
  'inventory_2',
  'person',
  'group',
  'task_alt',
  'hourglass_empty',
  'pause_circle',
];
