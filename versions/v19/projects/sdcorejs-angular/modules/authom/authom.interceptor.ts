import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SdAuthOmService } from './authom.service';

const escapeRegExp = (str: string): string => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

export const matchGlob = (pattern: string, url: string): boolean => {
  const regexBody = pattern.split('*').map(escapeRegExp).join('.*');
  return new RegExp(`^${regexBody}$`).test(url);
};

export const SdAuthOmInterceptor: HttpInterceptorFn = (req, next) => {
  const authom = inject(SdAuthOmService);
  const token = authom.getAccessToken();
  const config = authom.config;

  if (!token || !config) return next(req);

  const isSecure = config.secureRoutes?.some(pattern => matchGlob(pattern, req.url));
  if (!isSecure) return next(req);

  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });
  return next(authReq);
};
