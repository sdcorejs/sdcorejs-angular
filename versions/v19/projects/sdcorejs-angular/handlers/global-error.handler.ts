import { ErrorHandler, inject, Injectable } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';

// Sá»­ dá»¥ng Global Handler Ä‘á»ƒ Ä‘áº£m báº£o khi cÃ³ báº£n build má»›i sáº½ bÃ¡o cho ngÆ°á»i dÃ¹ng biáº¿t Ä‘á»ƒ táº£i láº¡i
// CÃ¡ch sá»­ dá»¥ng: providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
@Injectable()
export class SdGlobalErrorHandler implements ErrorHandler {
  readonly #i18n = inject(I18nService);

  constructor() {}

  handleError(error: any): void {
    // Láº¥y message lá»—i an toÃ n
    const errorMessage = this.#extractErrorMessage(error);

    // Danh sÃ¡ch cÃ¡c tá»« khÃ³a nháº­n diá»‡n lá»—i máº¥t file JS/Chunk
    // Cáº§n bao gá»“m nhiá»u biáº¿n thá»ƒ do trÃ¬nh duyá»‡t/bundler khÃ¡c nhau
    const chunkErrorSignatures = [
      'Loading chunk',                              // Webpack cÅ©
      'Importing a module script failed',           // Má»™t sá»‘ trÃ¬nh duyá»‡t
      'Failed to fetch dynamically imported module', // <-- Lá»—i báº¡n Ä‘ang gáº·p (Angular má»›i/Vite/Esbuild)
      'error loading dynamically imported module',  // Firefox/Safari biáº¿n thá»ƒ
      'missing source map'                          // ÄÃ´i khi Ä‘i kÃ¨m
    ];

    // Kiá»ƒm tra xem lá»—i cÃ³ chá»©a tá»« khÃ³a nÃ o khÃ´ng
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
      // Log lá»—i thÆ°á»ng
      console.error('Application error:', error);
    }
  }

  // HÃ m phá»¥ trá»£ Ä‘á»ƒ láº¥y text lá»—i tá»« object error báº¥t ká»³
  #extractErrorMessage = (error: any): string => {
    if (!error) return '';

    // Náº¿u lÃ  chuá»—i
    if (typeof error === 'string') return error.toLowerCase();

    // Náº¿u lÃ  Error Object chuáº©n
    if (error.message) return error.message.toLowerCase();

    // Náº¿u lá»—i náº±m trong rejection (Promise)
    if (error.rejection) {
      return (typeof error.rejection === 'string')
        ? error.rejection.toLowerCase()
        : (error.rejection.message || '').toLowerCase();
    }
    return '';
  }
}

