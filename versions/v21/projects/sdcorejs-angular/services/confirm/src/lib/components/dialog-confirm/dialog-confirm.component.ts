import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { Color } from '@sdcorejs/utils/models';
import { Utilities } from '@sdcorejs/utils/fns';
import { SD_ICON_CONFIGURATION, SdIcon, type SdIconShape } from '@sdcorejs/angular/modules/icon';

export interface DialogData {
  icon?: string;
  iconShape?: SdIconShape;
  title?: string;
  message?: string;
  yesTitle?: string;
  noTitle?: string;
  yesButtonColor?: Color;
  noButtonColor?: Color;
  input?: {
    label?: string;
    placeholder?: string;
    minlength?: number;
    maxlength?: number;
    required?: boolean;
    defaultValue?: string;
  };
  date?: {
    required?: boolean;
    placeholder?: string;
    defaultValue?: string | Date;
    min?: string | Date;
    max?: string | Date;
  };
  datetime?: {
    required?: boolean;
    placeholder?: string;
    defaultValue?: string | Date;
    min?: string | Date;
    max?: string | Date;
    showSeconds?: boolean;
  };
  radio?: {
    required?: boolean;
    defaultValue?: string | number;
    items: any[];
    valueField: string;
    displayField: string;
    display?: 'row' | 'column';
  };
  select?: {
    required?: boolean;
    defaultValue?: string | number | (string | number)[];
    items: any[];
    valueField: string;
    displayField: string;
    placeholder?: string;
    multiple?: boolean;
  };
}

@Component({
  selector: 'sd-dialog-confirm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'dialog-confirm.component.html',
  styleUrl: './dialog-confirm.component.scss',
  imports: [SdIcon, CommonModule, FormsModule, MatDialogModule, SdButton, SdDate, SdDatetime, SdRadio, SdSelect, SdTextarea],
  host: { '[class.sd-dialog-confirm--sheet]': 'isBottomSheet' },
})
export class DialogConfirmComponent {
  value: any;
  required = false;
  id = `I${Utilities.generateUuid()}`;
  // why: cùng một component chạy trong MatDialog hoặc MatBottomSheet nên cả hai ref đều là tùy chọn. SdConfirmService
  // quyết định kiểu hiển thị; component chỉ dùng ref đang có.
  public readonly dialogRef = inject(MatDialogRef<DialogConfirmComponent>, { optional: true });
  readonly #bottomSheetRef = inject(MatBottomSheetRef<DialogConfirmComponent>, { optional: true });
  /** `true` when opened in a bottom sheet; selects the stacked mobile action layout. */
  public readonly isBottomSheet = !!this.#bottomSheetRef;
  public readonly data: DialogData =
    (this.isBottomSheet
      ? inject<DialogData>(MAT_BOTTOM_SHEET_DATA, { optional: true })
      : inject<DialogData>(MAT_DIALOG_DATA, { optional: true })) ?? {};

  readonly iconTone = this.data.yesButtonColor || 'primary';
  readonly iconShape: SdIconShape = this.data.iconShape ?? inject(SD_ICON_CONFIGURATION).defaultShape;
  readonly resolvedIcon =
    this.data.icon?.trim() ||
    (this.iconTone === 'error'
      ? 'delete'
      : this.iconTone === 'warning'
        ? 'warning_amber'
        : this.data.input
          ? 'edit_note'
          : this.data.date || this.data.datetime
            ? 'today'
            : this.data.radio || this.data.select
              ? 'list'
              : 'check_circle');
  readonly hasFields = !!(this.data.input || this.data.date || this.data.radio || this.data.datetime || this.data.select);

  constructor() {
    if (this.data?.input) {
      this.value = this.data?.input?.defaultValue ?? '';
      this.required = this.data?.input?.required || false;
    }
    if (this.data?.date) {
      this.value = this.data?.date?.defaultValue ?? '';
      this.required = this.data?.date?.required || false;
    }
    if (this.data?.datetime) {
      this.value = this.data?.datetime?.defaultValue ?? '';
      this.required = this.data?.datetime?.required || false;
    }
    if (this.data?.radio) {
      this.value = this.data?.radio?.defaultValue ?? '';
      this.required = this.data?.radio?.required || false;
    }
    if (this.data?.select) {
      this.value = this.data?.select?.defaultValue ?? (this.data?.select?.multiple ? [] : null);
      this.required = this.data?.select?.required || false;
    }
  }

  /** Accept stays disabled while a required field is empty (a whitespace-only input counts as empty). */
  get acceptDisabled(): boolean {
    const value = this.value;
    return (
      this.required &&
      (value === undefined ||
        value === null ||
        value === '' ||
        (!!this.data.input && !value.trim()) ||
        (value.length !== undefined && value.length === 0))
    );
  }

  #close(result: { action: 'ACCEPT' | 'CANCEL'; value: unknown }): void {
    if (this.#bottomSheetRef) {
      this.#bottomSheetRef.dismiss(result);
    } else {
      this.dialogRef?.close(result);
    }
  }

  onCancel = () => {
    this.#close({ action: 'CANCEL', value: null });
  };

  onAccept = () => {
    // Always return an object with action and value for consistency
    if (this.data?.radio || this.data?.input || this.data?.date || this.data?.datetime || this.data?.select) {
      this.#close({ action: 'ACCEPT', value: this.value });
    } else {
      this.#close({ action: 'ACCEPT', value: null });
    }
  };
}
