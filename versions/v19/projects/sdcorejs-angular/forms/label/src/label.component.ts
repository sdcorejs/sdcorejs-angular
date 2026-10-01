import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
@Component({
  selector: 'sd-label',
  templateUrl: './label.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SdIcon, MatTooltipModule],
})
export class SdLabel {
  label?: string | null;
  @Input('label') set _label(val: string | undefined | null) {
    this.label = val;
  }
  description?: string | null;
  @Input('description') set _description(description: string | undefined | null) {
    this.description = description;
  }
  required = false;
  @Input('required') set _required(val: boolean | '' | undefined | null) {
    this.required = val === '' || !!val;
  }

  helperText?: string;
  @Input('helperText') set _helperText(val: string | undefined) {
    this.helperText = val;
  }

  /**
   * `id` của phần tử nhập liệu THẬT (input/textarea) mà nhãn gắn vào. Khi có, nhãn render bằng
   * `<label for>` gốc: bấm nhãn focus control và screen reader đọc nhãn làm tên của control.
   *
   * why: `<sd-label>` trước đây chỉ là `<span>` trình bày — bấm vào không làm gì và không nối
   * được với control. Nhãn rời (`labelPlacement="top"`) cần liên kết thật tới input.
   */
  htmlFor?: string | null;
  @Input('for') set _for(val: string | undefined | null) {
    this.htmlFor = val || null;
  }

  /**
   * `id` đặt lên phần tử chứa chữ của nhãn, để control không phải input gốc (vd `mat-select`)
   * trỏ `aria-labelledby` sang.
   */
  labelId?: string | null;
  @Input('labelId') set _labelId(val: string | undefined | null) {
    this.labelId = val || null;
  }
}
