import { isPlatformBrowser } from '@angular/common';
import { ErrorHandler, inject, Injectable, isDevMode, PLATFORM_ID } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';

// Sử dụng Global Handler để đảm bảo khi có bản build mới sẽ báo cho người dùng biết để tải lại
// Cách sử dụng: providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
@Injectable()
export class SdGlobalErrorHandler implements ErrorHandler {
  readonly #i18n = inject(I18nService);

  // why: `window.confirm` / `window.location.reload` không tồn tại khi render trên server. Gọi
  // thẳng sẽ làm CHÍNH ErrorHandler ném lỗi, và lỗi gốc bị che mất hoàn toàn.
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {}

  handleError(error: any): void {
    // Lấy message lỗi an toàn
    const errorMessage = this.#extractErrorMessage(error);

    // Danh sách các từ khóa nhận diện lỗi mất file JS/Chunk
    // Cần bao gồm nhiều biến thể do trình duyệt/bundler khác nhau
    const chunkErrorSignatures = [
      'Loading chunk', // Webpack cũ
      'Importing a module script failed', // Một số trình duyệt
      'Failed to fetch dynamically imported module', // <-- Lỗi bạn đang gặp (Angular mới/Vite/Esbuild)
      'error loading dynamically imported module', // Firefox/Safari biến thể
      'missing source map', // Đôi khi đi kèm
    ];

    // Kiểm tra xem lỗi có chứa từ khóa nào không
    const isChunkError = chunkErrorSignatures.some(signature => errorMessage.includes(signature.toLowerCase()));

    if (isChunkError) {
      // why: đây là log chẩn đoán dài dòng cho dev (dump nguyên message đã lowercase) và nhánh này
      // đã có UI riêng — hộp thoại xác nhận tải lại. Gate theo dev mode là hợp lý.
      if (isDevMode()) console.warn('=> Chunk Load error detected:', errorMessage);

      // why: trên server không có gì để reload — thoát sớm để lỗi gốc vẫn nổi lên nguyên vẹn.
      if (!this.#isBrowser) return;

      const wantReload = window.confirm(
        this.#i18n.t('core.handler.global-error.update-title') + '\n\n' + this.#i18n.t('core.handler.global-error.update-body')
      );

      if (wantReload) {
        window.location.reload();
      }
    } else {
      // why: KHÔNG gate `console.error` theo `isDevMode()`. Đăng ký `ErrorHandler` này là THAY THẾ
      // ErrorHandler mặc định của Angular — thứ vốn luôn log. Gate lại thì bản production nuốt sạch
      // mọi lỗi ứng dụng: không còn gì trong console, không còn gì cho công cụ thu thập log của
      // trình duyệt, và bug production trở nên vô hình. Log lỗi chính là toàn bộ giá trị chẩn đoán
      // của một ErrorHandler; muốn giấu thì là việc của app (thay ErrorHandler khác), không phải
      // hành vi mặc định của thư viện.
      console.error('Application error:', error);
    }
  }

  // Hàm phụ trợ để lấy text lỗi từ object error bất kỳ
  #extractErrorMessage = (error: any): string => {
    if (!error) return '';

    // Nếu là chuỗi
    if (typeof error === 'string') return error.toLowerCase();

    // Nếu là Error Object chuẩn
    if (error.message) return error.message.toLowerCase();

    // Nếu lỗi nằm trong rejection (Promise)
    if (error.rejection) {
      return typeof error.rejection === 'string' ? error.rejection.toLowerCase() : (error.rejection.message || '').toLowerCase();
    }
    return '';
  };
}
