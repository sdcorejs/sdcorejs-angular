import { ErrorHandler, inject, Injectable } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';

// Sử dụng Global Handler để đảm bảo khi có bản build mới sẽ báo cho người dùng biết để tải lại
// Cách sử dụng: providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
@Injectable()
export class SdGlobalErrorHandler implements ErrorHandler {
  readonly #i18n = inject(I18nService);

  constructor() {}

  handleError(error: any): void {
    // Lấy message lỗi an toàn
    const errorMessage = this.#extractErrorMessage(error);

    // Danh sách các từ khóa nhận diện lỗi mất file JS/Chunk
    // Cần bao gồm nhiều biến thể do trình duyệt/bundler khác nhau
    const chunkErrorSignatures = [
      'Loading chunk',                              // Webpack cũ
      'Importing a module script failed',           // Một số trình duyệt
      'Failed to fetch dynamically imported module', // <-- Lỗi bạn đang gặp (Angular mới/Vite/Esbuild)
      'error loading dynamically imported module',  // Firefox/Safari biến thể
      'missing source map'                          // Đôi khi đi kèm
    ];

    // Kiểm tra xem lỗi có chứa từ khóa nào không
    const isChunkError = chunkErrorSignatures.some(signature =>
      errorMessage.includes(signature.toLowerCase())
    );

    if (isChunkError) {
      console.warn('=> Chunk Load error detected:', errorMessage);

      const wantReload = window.confirm(
        this.#i18n.t('core.handler.global-error.update-title') + '\n\n' +
        this.#i18n.t('core.handler.global-error.update-body')
      );

      if (wantReload) {
        window.location.reload();
      }
    } else {
      // Log lỗi thường
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
      return (typeof error.rejection === 'string')
        ? error.rejection.toLowerCase()
        : (error.rejection.message || '').toLowerCase();
    }
    return '';
  }
}
