import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { Color } from '@sdcorejs/utils/models';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

export interface DialogData {
  icon?: string;
  title?: string;
  message?: string;
  yesTitle?: string;
  noTitle?: string;
  yesButtonColor?: Color;
  noButtonColor?: Color;
  input?: {
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
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-dialog-confirm',
  templateUrl: 'dialog-confirm.component.html',
  styleUrl: './dialog-confirm.component.scss',
  imports: [SdIcon, CommonModule, FormsModule, MatDialogModule, SdButton, SdDate, SdDatetime, SdRadio, SdSelect, SdTextarea],
})
export class DialogConfirmComponent {
  value: any;
  required = false;
  id = `I${Utilities.generateUuid()}`;
  public readonly dialogRef = inject(MatDialogRef<DialogConfirmComponent>);
  public readonly data = inject<DialogData>(MAT_DIALOG_DATA);

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

  onCancel = () => {
    this.dialogRef.close({ action: 'CANCEL', value: null });
  };

  onAccept = () => {
    // Always return an object with action and value for consistency
    if (this.data?.radio || this.data?.input || this.data?.date || this.data?.datetime || this.data?.select) {
      this.dialogRef.close({ action: 'ACCEPT', value: this.value });
    } else {
      this.dialogRef.close({ action: 'ACCEPT', value: null });
    }
  };
}
