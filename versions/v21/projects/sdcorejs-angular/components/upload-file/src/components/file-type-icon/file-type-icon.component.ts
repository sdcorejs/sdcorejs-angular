import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { sdFileTypeIcon } from '../../helpers/file-type';

/**
 * Icon SVG theo đuôi file (đợt 3 · 4a). Một component dùng chung để bộ SVG (inline thành data URI lúc build) chỉ nằm một
 * lần trong CSS, thay cho ba bảng `[class]` + `content: url(...)` từng lặp ở ô tải lên và popup. Nội bộ, không export.
 */
@Component({
  selector: 'sd-upload-file-type-icon',
  template: '',
  styleUrl: './file-type-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class]': 'iconClass()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class SdUploadFileTypeIcon {
  /** Đuôi file (`pdf`, `.PDF`…); không có icon thì dùng icon `file`. */
  readonly extension = input<string | null | undefined>();
  /** Cạnh icon (px). */
  readonly size = input(24);

  readonly icon = computed(() => sdFileTypeIcon(this.extension()));
  readonly iconClass = computed(() => `sd-upload-file-type-icon sd-upload-file-type-icon--${this.icon()}`);
}
