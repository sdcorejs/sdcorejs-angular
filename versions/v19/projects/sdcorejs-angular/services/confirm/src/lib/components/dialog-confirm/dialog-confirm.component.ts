import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { Color } from '@sdcorejs/utils/models';
import * as uuid from 'uuid';

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
  radio?: {
    required?: boolean;
    defaultValue?: string | number;
    items: any[];
    valueField: string;
    displayField: string;
    display?: 'row' | 'column';
  };
}

@Component({
  selector: 'sd-dialog-confirm',
  templateUrl: 'dialog-confirm.component.html',
  styleUrls: ['./dialog-confirm.component.scss'],
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, SdButton, SdDate, SdRadio, SdTextarea],
})
export class DialogConfirmComponent {
  value: any;
  required = false;
  id = `I${uuid.v4()}`;
  constructor(
    public dialogRef: MatDialogRef<DialogConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    if (data?.input) {
      this.value = data?.input?.defaultValue ?? '';
      this.required = data?.input?.required || false;
    }
    if (data?.date) {
      this.value = data?.date?.defaultValue ?? '';
      this.required = data?.date?.required || false;
    }
    if (data?.radio) {
      this.value = data?.radio?.defaultValue ?? '';
      this.required = data?.radio?.required || false;
    }
  }

  onCancel = () => {
    this.dialogRef.close({ action: 'CANCEL', value: null });
  };

  onAccept = () => {
    // Always return an object with action and value for consistency
    if (this.data?.radio || this.data?.input || this.data?.date) {
      this.dialogRef.close({ action: 'ACCEPT', value: this.value });
    } else {
      this.dialogRef.close({ action: 'ACCEPT', value: null });
    }
  };
}

