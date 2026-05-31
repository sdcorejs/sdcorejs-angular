import { HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable, Injector } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class SdNoInternetInterceptor implements HttpInterceptor {
  readonly #i18n = inject(I18nService);

  // Tráº¡ng thÃ¡i offline Ä‘á»ƒ trÃ¡nh spam request check hoáº·c hiá»ƒn thá»‹ nhiá»u snackbar
  #isOffline = false;

  // Giá»¯ tham chiáº¿u Ä‘á»ƒ cÃ³ thá»ƒ Ä‘Ã³ng/thao tÃ¡c snackbar
  #snackBarRef: MatSnackBarRef<any> | null = null;

  // Giá»¯ tham chiáº¿u interval Ä‘á»ƒ clear khi cÃ³ máº¡ng láº¡i
  #pollInterval: ReturnType<typeof setInterval> | null = null;

  // Lazy load HttpClient
  #http: HttpClient | null = null;

  // Endpoint kiá»ƒm tra máº¡ng (NÃªn dÃ¹ng 1 file tÄ©nh nháº¹ hoáº·c API ping public uy tÃ­n)
  readonly #healthCheckUrl = 'https://jsonplaceholder.typicode.com/todos/1';

  // Thá»i gian láº·p láº¡i viá»‡c kiá»ƒm tra máº¡ng (ms)
  readonly #checkIntervalDuration = 3000;

  constructor(
    private snackBar: MatSnackBar,
    private injector: Injector
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // --- TRÆ¯á»œNG Há»¢P 1: Lá»—i máº¥t káº¿t ná»‘i (Status 0) ---
        if (error.status === 0 && !this.#isOffline) {
          this.#isOffline = true;

          // Lazy load HttpClient Ä‘á»ƒ trÃ¡nh lá»—i Circular Dependency
          if (!this.#http) {
            this.#http = this.injector.get(HttpClient);
          }

          // Gá»i thá»­ má»™t API public Ä‘á»ƒ xÃ¡c minh xem lÃ  Máº¥t máº¡ng tháº­t hay do CORS/Server cháº·n
          return this.#http.get(this.#healthCheckUrl).pipe(
            // 1. Æ¯u tiÃªn báº¯t lá»—i káº¿t ná»‘i trÆ°á»›c (ÄÃ¢y lÃ  logic Máº¤T Máº NG THáº¬T)
            catchError(_checkError => {
              // Hiá»ƒn thá»‹ thÃ´ng bÃ¡o vÃ  báº¯t Ä‘áº§u polling chá» máº¡ng
              this.#showReloadSnackbar(this.#i18n.t('core.interceptor.no-internet.offline'), { isSticky: true });
              this.#startPolling();

              // NÃ©m láº¡i lá»—i gá»‘c Ä‘á»ƒ Component biáº¿t request tháº¥t báº¡i
              return throwError(() => error);
            }),

            // 2. Náº¿u khÃ´ng vÃ o catchError á»Ÿ trÃªn -> Check thÃ nh cÃ´ng -> CÃ“ Máº NG
            // Lá»—i status 0 ban Ä‘áº§u lÃ  do CORS, SSL, hoáº·c Server cháº·n connection
            switchMap(() => {
              this.#isOffline = false; // Reset cá»

              this.snackBar.open(this.#i18n.t('core.interceptor.no-internet.cors-error'), this.#i18n.t('core.common.close'), {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
              });

              // NÃ©m láº¡i lá»—i gá»‘c
              return throwError(() => error);
            })
          );
        }

        // --- TRÆ¯á»œNG Há»¢P 2: Server báº£o trÃ¬ (503) ---
        else if (error.status === 503) {
          this.snackBar.open(this.#i18n.t('core.interceptor.no-internet.maintenance'), this.#i18n.t('core.common.close'), {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 5000,
          });
        }

        // --- TRÆ¯á»œNG Há»¢P KHÃC: 401, 404, 500... ---
        // NÃ©m lá»—i ra Ä‘á»ƒ component xá»­ lÃ½ bÃ¬nh thÆ°á»ng
        return throwError(() => error);
      })
    );
  }

  /**
   * Hiá»ƒn thá»‹ Snackbar thÃ´ng bÃ¡o tráº¡ng thÃ¡i máº¡ng
   */
  #showReloadSnackbar = (message: string, options?: { duration?: number; isSticky?: boolean }): void => {
    // ÄÃ³ng snackbar cÅ© náº¿u Ä‘ang hiá»‡n
    if (this.#snackBarRef) {
      this.#snackBarRef.dismiss();
    }

    this.#snackBarRef = this.snackBar.open(message, this.#i18n.t('core.common.reload'), {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      // Náº¿u isSticky = true (máº¥t máº¡ng) -> KhÃ´ng tá»± táº¯t. Náº¿u cÃ³ duration -> tá»± táº¯t.
      duration: options?.duration,
      panelClass: options?.isSticky ? ['offline-snackbar'] : undefined, // Class CSS tÃ¹y chá»n
    });

    // Xá»­ lÃ½ sá»± kiá»‡n báº¥m nÃºt "Táº£i láº¡i trang"
    this.#snackBarRef.onAction().subscribe(() => {
      window.location.reload();
    });
  };

  /**
   * Báº¯t Ä‘áº§u vÃ²ng láº·p kiá»ƒm tra káº¿t ná»‘i máº¡ng
   */
  #startPolling = (): void => {
    this.#stopPolling(); // Clear cÅ© náº¿u cÃ³

    // @i18n-ignore â€” dev console log
    console.log('--- Báº¯t Ä‘áº§u cháº¿ Ä‘á»™ theo dÃµi máº¡ng ---');

    this.#pollInterval = setInterval(() => {
      if (!this.#http) {
        this.#http = this.injector.get(HttpClient);
      }

      // Check nháº¹
      this.#http.get(this.#healthCheckUrl).subscribe({
        next: () => {
          // --> ÄÃƒ CÃ“ Máº NG Láº I
          // @i18n-ignore â€” dev console log
          console.log('--> Káº¿t ná»‘i Ä‘Ã£ Ä‘Æ°á»£c khÃ´i phá»¥c!');

          this.#stopPolling();
          this.#isOffline = false;

          // ThÃ´ng bÃ¡o thÃ nh cÃ´ng (tá»± táº¯t sau 5s)
          this.#showReloadSnackbar(this.#i18n.t('core.interceptor.no-internet.restored'), { duration: 5000, isSticky: false });
        },
        error: () => {
          // --> VáºªN Máº¤T Máº NG: KhÃ´ng lÃ m gÃ¬ cáº£, chá» láº§n check tiáº¿p theo
        },
      });
    }, this.#checkIntervalDuration);
  };

  /**
   * Dá»«ng vÃ²ng láº·p kiá»ƒm tra
   */
  #stopPolling = (): void => {
    if (this.#pollInterval) {
      clearInterval(this.#pollInterval);
      this.#pollInterval = null;
    }
  };
}

