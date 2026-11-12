import { inject, Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DialogConfirmComponent, DialogData } from './components/dialog-confirm/dialog-confirm.component';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { Color } from '@sdcorejs/utils/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import type { SdIconShape } from '@sdcorejs/angular/modules/icon';

/** Options shared by every `SdConfirmService` method. */
interface SdConfirmDisplayOption {
  /** Force the presentation. Omitted: a bottom sheet on mobile, a dialog on desktop. */
  view?: 'dialog' | 'bottom-sheet';
  /**
   * Allow closing by a backdrop click or the Esc key. Omitted = `false`. When passed, it decides and
   * `disableBackdropClose` is ignored. Closing this way rejects the promise with `'CANCEL'`.
   */
  enableBackdropClose?: boolean;
  /**
   * Block closing by a backdrop click and the Esc key. Default `true`.
   * @deprecated Use `enableBackdropClose` (the opposite meaning). Only applies when `enableBackdropClose` is omitted.
   */
  disableBackdropClose?: boolean;
}

const BOTTOM_SHEET_PANEL_CLASS = 'sd-confirm-bottom-sheet';

@Injectable({
  providedIn: 'root',
})
export class SdConfirmService {
  private dialog = inject(MatDialog);
  readonly #bottomSheet = inject(MatBottomSheet);
  // why: đọc một lần, cùng nguồn nhận diện mobile với sd-modal để hai nơi chọn kiểu hiển thị giống nhau.
  readonly #isMobile = BrowserUtilities.isMobile();

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

  /**
   * Đường mở duy nhất của cả 6 API: chọn dialog hay bottom sheet, tính quyền đóng bằng nền/Esc rồi trả về stream đóng
   * để `#settleOnClose` biến thành Promise.
   *
   * why: mỗi API trước đây tự gọi `dialog.open` với cùng một khối cấu hình. Gom lại để kiểu hiển thị và quy tắc cờ
   * (`enableBackdropClose` thắng `disableBackdropClose`) không thể lệch nhau giữa các API.
   */
  #open(option: SdConfirmDisplayOption | undefined, width: string, autoFocus: string, data: DialogData): Observable<any> {
    const closeAllowed = option?.enableBackdropClose ?? option?.disableBackdropClose === false;
    const disableClose = !closeAllowed;
    const view = option?.view ?? (this.#isMobile ? 'bottom-sheet' : 'dialog');

    if (view === 'bottom-sheet') {
      return this.#bottomSheet
        .open(DialogConfirmComponent, {
          panelClass: BOTTOM_SHEET_PANEL_CLASS,
          // why: tiêu đề cho phép HTML (innerHtml) nhưng tên cho trình đọc màn hình phải là text thuần.
          ariaLabel: (data.title ?? '').replace(/<[^>]*>/g, '').trim(),
          autoFocus,
          disableClose,
          data,
        })
        .afterDismissed();
    }
    return this.dialog
      .open(DialogConfirmComponent, {
        width,
        panelClass: 'sd-confirm-panel',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100dvh - 32px)',
        autoFocus,
        disableClose,
        data,
      })
      .afterClosed();
  }

  confirm = (
    message: string,
    option: SdConfirmDisplayOption & {
      title?: string;
      icon?: string;
      /** Hình nền ô icon; bỏ trống thì dùng `defaultShape` của `provideSdIcon`. */
      iconShape?: SdIconShape;
      yesTitle?: string;
      noTitle?: string;
      yesButtonColor?: Color;
      noButtonColor?: Color;
      /** Dialog width. Not applied to the bottom sheet, which is always full-width. */
      width?: string;
    } = {}
  ) => {
    return this.#settleOnClose(
      this.#open(option, option?.width || '440px', '[data-confirm-cancel] button', {
        icon: option?.icon,
        iconShape: option?.iconShape,
        title: option?.title || this.#i18n.t('core.confirm.title'),
        message,
        yesTitle: option?.yesTitle || this.#i18n.t('core.confirm.yes'),
        noTitle: option?.noTitle || this.#i18n.t('core.confirm.no'),
        noButtonColor: option?.noButtonColor || 'secondary',
        yesButtonColor: option?.yesButtonColor || 'primary',
      })
    );
  };

  withInput = (
    message?: string,
    option?: SdConfirmDisplayOption & {
      title?: string;
      icon?: string;
      /** Hình nền ô icon; bỏ trống thì dùng `defaultShape` của `provideSdIcon`. */
      iconShape?: SdIconShape;
      yesTitle?: string;
      noTitle?: string;
      required?: boolean;
      maxlength?: number;
      label?: string;
      placeholder?: string;
      yesButtonColor?: Color;
      noButtonColor?: Color;
      defaultValue?: string;
    }
  ): Promise<string> => {
    return this.#settleOnClose(
      this.#open(option, '440px', 'textarea', {
        icon: option?.icon,
        iconShape: option?.iconShape,
        title: option?.title || this.#i18n.t('core.confirm.title'),
        message,
        yesTitle: option?.yesTitle || this.#i18n.t('core.confirm.yes-short'),
        noTitle: option?.noTitle || this.#i18n.t('core.confirm.no-short'),
        noButtonColor: option?.noButtonColor || 'secondary',
        yesButtonColor: option?.yesButtonColor || 'primary',
        input: {
          label: option?.label,
          placeholder: option?.placeholder,
          maxlength: option?.maxlength || 255,
          required: option?.required,
          defaultValue: option?.defaultValue || '',
        },
      })
    );
  };

  withRadio = (
    message?: string,
    option?: SdConfirmDisplayOption & {
      title?: string;
      icon?: string;
      /** Hình nền ô icon; bỏ trống thì dùng `defaultShape` của `provideSdIcon`. */
      iconShape?: SdIconShape;
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
    }
  ): Promise<string> => {
    return this.#settleOnClose(
      this.#open(option, '440px', 'first-tabbable', {
        icon: option?.icon,
        iconShape: option?.iconShape,
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
      })
    );
  };

  withSelect = (
    message?: string,
    option?: SdConfirmDisplayOption & {
      title?: string;
      icon?: string;
      /** Hình nền ô icon; bỏ trống thì dùng `defaultShape` của `provideSdIcon`. */
      iconShape?: SdIconShape;
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
    }
  ): Promise<string | number | (string | number)[]> => {
    return this.#settleOnClose(
      this.#open(option, '440px', 'first-tabbable', {
        icon: option?.icon,
        iconShape: option?.iconShape,
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
      })
    );
  };

  withDate = (
    message?: string,
    option?: SdConfirmDisplayOption & {
      title?: string;
      icon?: string;
      /** Hình nền ô icon; bỏ trống thì dùng `defaultShape` của `provideSdIcon`. */
      iconShape?: SdIconShape;

      yesTitle?: string;
      noTitle?: string;
      required?: boolean;
      yesButtonColor?: Color;
      noButtonColor?: Color;
      defaultValue?: string | Date;
      placeholder?: string;
      min?: string | Date;
      max?: string | Date;
    }
  ): Promise<string | Date> => {
    return this.#settleOnClose(
      this.#open(option, '440px', 'first-tabbable', {
        icon: option?.icon,
        iconShape: option?.iconShape,
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
      })
    );
  };

  withDatetime = (
    message?: string,
    option?: SdConfirmDisplayOption & {
      title?: string;
      icon?: string;
      /** Hình nền ô icon; bỏ trống thì dùng `defaultShape` của `provideSdIcon`. */
      iconShape?: SdIconShape;

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
    }
  ): Promise<string | Date> => {
    return this.#settleOnClose(
      this.#open(option, '440px', 'first-tabbable', {
        icon: option?.icon,
        iconShape: option?.iconShape,
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
      })
    );
  };
}
