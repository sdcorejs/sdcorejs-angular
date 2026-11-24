import { rxResource } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';

/** Bind a cancellable HTTP stream to the current record across the supported Angular resource APIs. */
export function customerResource<Request, Result>(params: () => Request, read: (request: Request) => Observable<Result>) {
  const options = {
    // Angular 19 names these options request/loader; later majors name them params/stream.
    request: params,
    loader: (context: { request: Request }) => read(context.request),
    params,
    stream: (context: { params: Request }) => read(context.params),
  };
  return rxResource<Result, Request>(options);
}
