import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SD_PATTERN_CONFIGURATION } from '../../configurations/pattern.configuration';
import { PatternMockApiState } from './mock-api.state';

/** Path segments of `url` under `baseUrl`, or `null` when the request is not for the pattern API. */
export function patternApiSegments(url: string, baseUrl: string): string[] | null {
  const path = url.split(/[?#]/)[0];
  const base = baseUrl.replace(/\/+$/, '');
  if (path !== base && !path.startsWith(base + '/')) return null;
  return path
    .slice(base.length)
    .split('/')
    .filter(segment => segment.length > 0)
    .map(segment => decodeURIComponent(segment));
}

/**
 * Answers requests under `apiBaseUrl` from the mock API and passes every other request on.
 * Registered by `provideSdPatterns()` on the HttpClient of the `/pattern` route only.
 */
export const patternMockApiInterceptor: HttpInterceptorFn = (request, next) => {
  const segments = patternApiSegments(request.url, inject(SD_PATTERN_CONFIGURATION).apiBaseUrl);
  return segments ? inject(PatternMockApiState).respond(request, segments) : next(request);
};
