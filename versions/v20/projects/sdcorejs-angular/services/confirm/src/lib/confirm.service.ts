import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { SdColor } from '@sdcorejs/angular/utilities/models';

@Injectable({
  providedIn: 'root',
})
export class SdConfirmService {
  constructor(private dialog: MatDialog) {}

  confirm = (
    message: string,
    option: {
      title?: string;
      yesTitle?: string;
      noTitle?: string;
      yesButtonColor?: SdColor;
      noButtonColor?: SdColor;
      width?: string;
    } = {}
  ) => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: option?.width || '400px',
      data: {
        title: option?.title || 'XÃ¡c nháº­n',
        message,
        yesTitle: option?.yesTitle || 'Äá»“ng Ã½',
        noTitle: option?.noTitle || 'Há»§y bá»',
        noButtonColor: option?.noButtonColor || 'secondary',
        yesButtonColor: option?.yesButtonColor || 'primary',
      },
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          if (result.action === 'CANCEL') {
            reject(result.action);
          } else if (result.action === 'ACCEPT') {
            resolve(result.value);
          }
        }
      });
    });
  };

  withInput = (
    message?: string,
    option?: {
      title?: string;
      yesTitle?: string;
      noTitle?: string;
      required?: boolean;
      maxlength?: number;
      yesButtonColor?: SdColor;
      noButtonColor?: SdColor;
      defaultValue?: string;
    }
  ): Promise<string> => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: '400px',
      data: {
        title: option?.title || 'XÃ¡c nháº­n',
        message,
        yesTitle: option?.yesTitle || 'CÃ³',
        noTitle: option?.noTitle || 'KhÃ´ng',
        noButtonColor: option?.noButtonColor || 'secondary',
        yesButtonColor: option?.yesButtonColor || 'primary',
        input: {
          maxlength: option?.maxlength || 255,
          required: option?.required,
          defaultValue: option?.defaultValue || '',
        },
      },
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          if (result.action === 'CANCEL') {
            reject(result.action);
          } else if (result.action === 'ACCEPT') {
            resolve(result.value);
          }
        }
      });
    });
  };

  withRadio = (
    message?: string,
    option?: {
      title?: string;
      yesTitle?: string;
      noTitle?: string;
      required?: boolean;
      yesButtonColor?: SdColor;
      noButtonColor?: SdColor;
      defaultValue?: string | number;
      items: any[];
      valueField: string;
      displayField: string;
      display?: 'row' | 'column';
    }
  ): Promise<string> => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: '400px',
      data: {
        title: option?.title || 'XÃ¡c nháº­n',
        message,
        yesTitle: option?.yesTitle || 'CÃ³',
        noTitle: option?.noTitle || 'KhÃ´ng',
        noButtonColor: option?.noButtonColor || 'secondary',
        yesButtonColor: option?.yesButtonColor || 'primary',
        radio: {
          items: option?.items || [],
          valueField: option?.valueField || 'value',
          displayField: option?.displayField || 'label',
          display: option?.display || 'row',
          required: option?.required,
          defaultValue: option?.defaultValue,
        },
      },
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          if (result.action === 'CANCEL') {
            reject(result.action);
          } else if (result.action === 'ACCEPT') {
            resolve(result.value);
          }
        }
      });
    });
  };

  withDate = (
    message?: string,
    option?: {
      title?: string;

      yesTitle?: string;
      noTitle?: string;
      required?: boolean;
      yesButtonColor?: SdColor;
      noButtonColor?: SdColor;
      defaultValue?: string | Date;
      placeholder?: string;
    }
  ): Promise<string> => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: '400px',
      data: {
        title: option?.title || 'XÃ¡c nháº­n',
        message,
        yesTitle: option?.yesTitle || 'CÃ³',
        noTitle: option?.noTitle || 'KhÃ´ng',
        noButtonColor: option?.noButtonColor || 'secondary',
        yesButtonColor: option?.yesButtonColor || 'primary',
        date: {
          placeholder: option?.placeholder,
          required: option?.required,
          defaultValue: option?.defaultValue || '',
        },
      },
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          if (result.action === 'CANCEL') {
            reject(result.action);
          } else if (result.action === 'ACCEPT') {
            resolve(result.value);
          }
        }
      });
    });
  };
}

