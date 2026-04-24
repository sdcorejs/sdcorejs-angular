/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SD_API_CONFIG, ISdApiConfiguration, SdApiHandler } from '../api.model';

@Injectable()
export class SdHttpInterceptor implements HttpInterceptor {
  constructor(
    @Inject(SD_API_CONFIG)
    @Optional()
    private configurations: ISdApiConfiguration[]
  ) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = request.url;
    if (!url) {
      throw new Error(`Invalid URL`);
    }
    const handlers = this.configurations?.reduce<SdApiHandler[]>((a, b) => [...a, ...(b?.handlers || [])], []) || [];
    const handler = handlers?.find(e => e.hosts.some(host => url.startsWith(host)));
    const intercept = handler?.intercept;
    if (intercept) {
      request = request.clone(intercept(request));
    }
    if (request.body instanceof FormData) {
      request = request.clone({
        headers: request.headers.delete('Content-Type'),
      });
    }
    const beforeRemoteHandler = handler?.beforeRemote;
    const afterRemoteHandler = handler?.afterRemote;
    const beforeRemote = beforeRemoteHandler?.(request);
    if (beforeRemote instanceof Promise) {
      return from(beforeRemote).pipe(
        switchMap(() => next.handle(request)),
        map((event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            afterRemoteHandler?.(event);
          }
          return event;
        }),
        catchError((error: HttpErrorResponse) => {
          afterRemoteHandler?.(error);
          return throwError(() => error);
        })
      );
    }
    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          afterRemoteHandler?.(event);
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        afterRemoteHandler?.(error);
        return throwError(() => error);
      })
    );
  }
}
