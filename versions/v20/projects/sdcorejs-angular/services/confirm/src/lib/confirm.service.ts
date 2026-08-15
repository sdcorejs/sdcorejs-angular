import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
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

  /**
   * Biến `afterClosed()` của dialog thành một Promise LUÔN settle.
   *
   * why: cả 6 API trước đây đều viết `if (result) { ...ACCEPT/CANCEL... }`, nên MỌI đường đóng
   * dialog không đi qua hai nút — phím ESC, click backdrop (khi `disableBackdropClose: false`),
   * hoặc `dialogRef.close()` gọi từ code — cho `result` là `undefined` và promise KHÔNG BAO GIỜ
   * settle. Closure của caller (cùng mọi thứ nó giữ) bị ghim lại đến hết phiên, và `await` đứng im
   * mãi mãi. Đóng-không-chọn về ngữ nghĩa chính là huỷ, nên nó reject `'CANCEL'` — đúng nhánh mà
   * consumer vốn đã bắt.
   */
  #settleOnClose = <TValue>(afterClosed: Observable<{ action?: 'ACCEPT' | 'CANCEL'; value?: TValue } | undefined>): Promise<TValue> =>
    new Promise<TValue>((resolve, reject) => {
      afterClosed.subscribe(result => {
        if (result?.action === 'ACCEPT') resolve(result.value as TValue);
        else reject(result?.action ?? 'CANCEL');
      });
    });

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
    return this.#settleOnClose(dialogRef.afterClosed());
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
    return this.#settleOnClose(dialogRef.afterClosed());
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
    return this.#settleOnClose(dialogRef.afterClosed());
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
    return this.#settleOnClose(dialogRef.afterClosed());
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
    return this.#settleOnClose(dialogRef.afterClosed());
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
    return this.#settleOnClose(dialogRef.afterClosed());
  };
}
