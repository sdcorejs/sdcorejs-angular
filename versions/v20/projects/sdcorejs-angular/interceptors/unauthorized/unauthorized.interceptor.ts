import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SdAuthService } from '@sdcorejs/angular/modules';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class SdUnauthorizedInterceptor implements HttpInterceptor {
  #unauthorizedHandled = false;

  constructor(private authService: SdAuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.#unauthorizedHandled) {
          this.#unauthorizedHandled = true;
          this.authService.signout();
        }

        return throwError(() => error);
      })
    );
  }
}

