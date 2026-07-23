import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmComponent } from './components/dialog-confirm/dialog-confirm.component';
import { Color } from '@sdcorejs/utils/models';
import { I18nService } from '@sdcorejs/angular/i18n';

@Injectable({
  providedIn: 'root',
})
export class SdConfirmService {
  private dialog = inject(MatDialog);

  readonly #i18n = inject(I18nService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  confirm = (
    message: string,
    option: {
      title?: string;
      yesTitle?: string;
      noTitle?: string;
      yesButtonColor?: Color;
      noButtonColor?: Color;
      width?: string;
      disableBackdropClose?: boolean;
    } = {}
  ) => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: option?.width || '400px',
      disableClose: option?.disableBackdropClose ?? true,
      data: {
        title: option?.title || this.#i18n.t('core.confirm.title'),
        message,
        yesTitle: option?.yesTitle || this.#i18n.t('core.confirm.yes'),
        noTitle: option?.noTitle || this.#i18n.t('core.confirm.no'),
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
      yesButtonColor?: Color;
      noButtonColor?: Color;
      defaultValue?: string;
      disableBackdropClose?: boolean;
    }
  ): Promise<string> => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: '400px',
      disableClose: option?.disableBackdropClose ?? true,
      data: {
        title: option?.title || this.#i18n.t('core.confirm.title'),
        message,
        yesTitle: option?.yesTitle || this.#i18n.t('core.confirm.yes-short'),
        noTitle: option?.noTitle || this.#i18n.t('core.confirm.no-short'),
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
      yesButtonColor?: Color;
      noButtonColor?: Color;
      defaultValue?: string | number;
      items: any[];
      valueField: string;
      displayField: string;
      display?: 'row' | 'column';
      disableBackdropClose?: boolean;
    }
  ): Promise<string> => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: '400px',
      disableClose: option?.disableBackdropClose ?? true,
      data: {
        title: option?.title || this.#i18n.t('core.confirm.title'),
        message,
        yesTitle: option?.yesTitle || this.#i18n.t('core.confirm.yes-short'),
        noTitle: option?.noTitle || this.#i18n.t('core.confirm.no-short'),
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

  withSelect = (
    message?: string,
    option?: {
      title?: string;
      yesTitle?: string;
      noTitle?: string;
      required?: boolean;
      yesButtonColor?: Color;
      noButtonColor?: Color;
      defaultValue?: string | number | (string | number)[];
      items: any[];
      valueField: string;
      displayField: string;
      placeholder?: string;
      multiple?: boolean;
      disableBackdropClose?: boolean;
    }
  ): Promise<string | number | (string | number)[]> => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: '400px',
      disableClose: option?.disableBackdropClose ?? true,
      data: {
        title: option?.title || this.#i18n.t('core.confirm.title'),
        message,
        yesTitle: option?.yesTitle || this.#i18n.t('core.confirm.yes-short'),
        noTitle: option?.noTitle || this.#i18n.t('core.confirm.no-short'),
        noButtonColor: option?.noButtonColor || 'secondary',
        yesButtonColor: option?.yesButtonColor || 'primary',
        select: {
          items: option?.items || [],
          valueField: option?.valueField || 'value',
          displayField: option?.displayField || 'label',
          placeholder: option?.placeholder,
          multiple: option?.multiple,
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
      yesButtonColor?: Color;
      noButtonColor?: Color;
      defaultValue?: string | Date;
      placeholder?: string;
      min?: string | Date;
      max?: string | Date;
      disableBackdropClose?: boolean;
    }
  ): Promise<string | Date> => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: '400px',
      disableClose: option?.disableBackdropClose ?? true,
      data: {
        title: option?.title || this.#i18n.t('core.confirm.title'),
        message,
        yesTitle: option?.yesTitle || this.#i18n.t('core.confirm.yes-short'),
        noTitle: option?.noTitle || this.#i18n.t('core.confirm.no-short'),
        noButtonColor: option?.noButtonColor || 'secondary',
        yesButtonColor: option?.yesButtonColor || 'primary',
        date: {
          placeholder: option?.placeholder,
          required: option?.required,
          defaultValue: option?.defaultValue || '',
          min: option?.min,
          max: option?.max,
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

  withDatetime = (
    message?: string,
    option?: {
      title?: string;

      yesTitle?: string;
      noTitle?: string;
      required?: boolean;
      yesButtonColor?: Color;
      noButtonColor?: Color;
      defaultValue?: string | Date;
      placeholder?: string;
      min?: string | Date;
      max?: string | Date;
      showSeconds?: boolean;
      disableBackdropClose?: boolean;
    }
  ): Promise<string | Date> => {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      width: '400px',
      disableClose: option?.disableBackdropClose ?? true,
      data: {
        title: option?.title || this.#i18n.t('core.confirm.title'),
        message,
        yesTitle: option?.yesTitle || this.#i18n.t('core.confirm.yes-short'),
        noTitle: option?.noTitle || this.#i18n.t('core.confirm.no-short'),
        noButtonColor: option?.noButtonColor || 'secondary',
        yesButtonColor: option?.yesButtonColor || 'primary',
        datetime: {
          placeholder: option?.placeholder,
          required: option?.required,
          defaultValue: option?.defaultValue || '',
          min: option?.min,
          max: option?.max,
          showSeconds: option?.showSeconds,
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
