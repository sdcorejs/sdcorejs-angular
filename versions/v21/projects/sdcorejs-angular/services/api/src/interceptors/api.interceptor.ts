import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, from, Observable, of, throwError } from 'rxjs';
import { catchError, concatMap, dematerialize, map, materialize, switchMap } from 'rxjs/operators';
import { sdApiMatchesHandlerHosts } from '../api-host';
import { ISdApiConfiguration, SD_API_CONFIG, SdApiHandler } from '../api.model';

@Injectable()
export class SdHttpInterceptor implements HttpInterceptor {
  readonly #configurations = inject<ISdApiConfiguration[]>(SD_API_CONFIG, { optional: true }) ?? [];

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!request.url) throw new Error('Invalid URL');

    const handler = this.#findHandler(request.url);
    if (handler?.intercept) {
      const interceptedRequest = handler.intercept(request);
      request = interceptedRequest instanceof HttpRequest ? interceptedRequest : request.clone(interceptedRequest);
    }
    if (typeof FormData !== 'undefined' && request.body instanceof FormData) {
      request = request.clone({ headers: request.headers.delete('Content-Type') });
    }

    const beforeRemote = handler?.beforeRemote?.(request);
    if (beforeRemote instanceof Promise) {
      return from(beforeRemote).pipe(switchMap(() => this.#handleRemote(request, next, handler)));
    }
    return this.#handleRemote(request, next, handler);
  }

  #handleRemote(request: HttpRequest<unknown>, next: HttpHandler, handler: SdApiHandler | undefined): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      materialize(),
      concatMap(notification => {
        const afterValue =
          notification.kind === 'N' && notification.value instanceof HttpResponse
            ? notification.value
            : notification.kind === 'E' && (notification.error instanceof Error || notification.error instanceof HttpErrorResponse)
              ? notification.error
              : undefined;
        if (!afterValue || !handler?.afterRemote) {
          return of(notification);
        }

        return defer(() => {
          const result = handler.afterRemote?.(afterValue);
          return result instanceof Promise ? result : Promise.resolve();
        }).pipe(
          map(() => notification),
          catchError(hookError => (notification.kind === 'E' ? of(notification) : throwError(() => hookError)))
        );
      }),
      dematerialize()
    );
  }

  #findHandler(url: string): SdApiHandler | undefined {
    const handlers = this.#configurations.flatMap(configuration => configuration.handlers ?? []);
    // why: `url.startsWith(host)` cho phép host nhìn-giống-thật (`https://api.example.com.attacker.tld`)
    // khớp handler của `https://api.example.com` và nhận trọn `intercept` — kể cả header auth.
    return handlers.find(handler => sdApiMatchesHandlerHosts(url, handler.hosts));
  }
}
