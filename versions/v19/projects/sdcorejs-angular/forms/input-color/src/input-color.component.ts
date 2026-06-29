import { booleanAttribute, ChangeDetectionStrategy, Component, computed, ElementRef, input, model, output, viewChild } from '@angular/core';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSuffixDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdViewed, SdViewedInput, sdViewedTransform } from '@sdcorejs/angular/forms/models';
import { Size } from '@sdcorejs/utils/models';

// why: matches #RGB, #RRGGBB, #RRGGBBAA. Capital + lowercase hex allowed.
// Native <input type="color"> only emits #RRGGBB, so we canonicalize before
// feeding the picker (expand 3-char, strip alpha) and let the swatch render
// the raw model value when it's a valid hex.
export const SD_INPUT_COLOR_HEX_PATTERN = '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$';

@Component({
  selector: 'sd-input-color',
  standalone: true,
  imports: [SdInput, SdSuffixDefDirective],
  templateUrl: './input-color.component.html',
  styleUrl: './input-color.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdInputColor {
  readonly hexPattern = SD_INPUT_COLOR_HEX_PATTERN;
  readonly #hexRegex = new RegExp(SD_INPUT_COLOR_HEX_PATTERN);

  // ==========================================
  // Inputs (forwarded to <sd-input>)
  // ==========================================
  readonly label = input<string | undefined>();
  readonly helperText = input<string | undefined>();
  readonly placeholder = input<string>('#RRGGBB');
  readonly size = input<Size>('md');
  readonly appearance = input<MatFormFieldAppearance | undefined>(undefined);
  // why: type as `any` — the inner <sd-input> applies the FormGroup|NgForm transform.

  readonly form = input<any>(undefined);
  readonly name = input<string | undefined>();
  readonly autoId = input<string | undefined>();

  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly hideInlineError = input(false, { transform: booleanAttribute });
  /** Display mode — forwarded to the inner `<sd-input>`. `'inline'` = borderless inline-edit; disabled `'inline'` → static. */
  readonly viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });

  // Two-way model — same alias as <sd-input>
  readonly valueModel = model<string | null | undefined>(undefined, { alias: 'model' });

  // ==========================================
  // Outputs
  // ==========================================
  readonly sdChange = output<string | null | undefined>();

  // ==========================================
  // ViewChild
  // ==========================================
  readonly picker = viewChild<ElementRef<HTMLInputElement>>('picker');

  // ==========================================
  // Derived state
  // ==========================================
  // why: <input type="color"> only accepts #RRGGBB. Expand 3-char hex; strip
  // alpha from 8-char. Fallback to #000000 for empty/invalid so the OS picker
  // always opens on something.
  readonly pickerSafeValue = computed<string>(() => {
    const v = this.valueModel();
    if (!v) return '#000000';
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
    if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
      const r = v[1];
      const g = v[2];
      const b = v[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    if (/^#[0-9A-Fa-f]{8}$/.test(v)) return v.slice(0, 7);
    return '#000000';
  });

  // Swatch shows the raw model value when valid; otherwise transparent so the
  // user gets visual feedback that the hex string is malformed.
  readonly swatchColor = computed<string>(() => {
    const v = this.valueModel();
    if (!v) return 'transparent';
    return this.#hexRegex.test(v) ? v : 'transparent';
  });

  // ==========================================
  // Handlers
  // ==========================================
  // why: <sd-input> built-in clear bắn null khi clear (thao tác chủ động) → coi
  // như "không có màu". Chuỗi rỗng cũng quy về null. Set model = null (không phải
  // undefined): undefined chỉ dành cho trạng thái pristine chưa từng thao tác.
  onInputChange = (v: unknown): void => {
    const str = v == null || v === '' ? null : String(v);
    this.valueModel.set(str);
    this.sdChange.emit(str);
  };

  openPicker = (): void => {
    if (this.disabled() || this.readonly() || this.viewed()) return;
    this.picker()?.nativeElement.click();
  };

  onPickerChange = (ev: Event): void => {
    const v = (ev.target as HTMLInputElement).value;
    this.valueModel.set(v);
    this.sdChange.emit(v);
  };

  // why: nút clear hiển thị giờ do <sd-input> render. Giữ method public này cho
  // consumer gọi tay (programmatic). No-op khi không sửa được hoặc đã rỗng.
  clear = (ev?: Event): void => {
    ev?.stopPropagation();
    if (this.required() || this.disabled() || this.readonly() || this.viewed()) return;
    const v = this.valueModel();
    if (v == null || v === '') return;
    this.valueModel.set(null);
    this.sdChange.emit(null);
  };
}
