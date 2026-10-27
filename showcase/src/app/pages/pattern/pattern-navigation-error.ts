import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { RedirectCommand, Router, type NavigationError } from '@angular/router';

/**
 * Host mapping of failed navigations under /pattern (resolver 404/403, timeout, 5xx) to its error page; other
 * failed navigations of the showcase keep the router's default handling.
 */
export function patternNavigationError(event: NavigationError): RedirectCommand | void {
  if (!event.url.startsWith('/pattern/')) return;
  const status = event.error instanceof HttpErrorResponse ? event.error.status : 0;
  const kind = status === 404 ? 'not-found' : status === 403 ? 'forbidden' : 'unavailable';
  return new RedirectCommand(inject(Router).parseUrl('/pattern-error/' + kind));
}
