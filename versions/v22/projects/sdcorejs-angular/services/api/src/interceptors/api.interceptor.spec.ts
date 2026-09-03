import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ISdApiConfiguration, SD_API_CONFIG, SdApiHandler } from '../api.model';
import { SdHttpInterceptor } from './api.interceptor';

/**
 * Drive the interceptor end-to-end through HttpClient + HttpTestingController.
 *
 * why: the interceptor is wired through DI as HTTP_INTERCEPTORS — exercising it
 * via the real HttpClient pipeline is the only way the `next.handle()` branch
 * gets covered. We mount different configs per-test by resetting TestBed.
 */
function configure(handlers: ISdApiConfiguration['handlers'] | null) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting(),
      { provide: HTTP_INTERCEPTORS, useClass: SdHttpInterceptor, multi: true },
      ...(handlers ? [{ provide: SD_API_CONFIG, multi: true, useValue: { handlers } }] : []),
    ],
  });
}

describe('SdHttpInterceptor', () => {
  it('accepts narrow typed handler callbacks without unsafe casts', () => {
    interface MyRequestBody {
      command: string;
    }

    interface MyResponseBody {
      result: string;
    }

    const handler: SdApiHandler = {
      hosts: ['/api'],
      intercept: (request: HttpRequest<MyRequestBody>) => request.clone({ setHeaders: { 'X-Command': request.body?.command ?? '' } }),
      beforeRemote: (request: HttpRequest<MyRequestBody>) => {
        void request.body?.command;
      },
      afterRemote: (response: HttpResponse<MyResponseBody> | HttpErrorResponse | Error) => {
        if (response instanceof HttpResponse) void response.body?.result;
      },
    };

    expect(handler.intercept).toBeDefined();
    expect(handler.beforeRemote).toBeDefined();
    expect(handler.afterRemote).toBeDefined();
  });

  it('lets a normal request through unchanged when no handler matches', () => {
    configure(null);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/no-handler').subscribe(res => expect(res).toEqual({ ok: true }));

    const req = ctrl.expectOne('/api/no-handler');
    req.flush({ ok: true });
    ctrl.verify();
  });

  it('applies handler.intercept() patch to the outgoing request', () => {
    configure([
      {
        hosts: ['/api'],
        intercept: request => request.clone({ setHeaders: { 'X-Custom': 'patched' } }),
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/foo').subscribe();

    const req = ctrl.expectOne('/api/foo');
    expect(req.request.headers.get('X-Custom')).toBe('patched');
    req.flush(null);
    ctrl.verify();
  });

  it('removes Content-Type header when body is FormData (browser must set boundary)', () => {
    configure(null);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'a.txt');
    // why: explicitly set Content-Type so we can prove interceptor strips it.
    http.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data; boundary=manual' } }).subscribe();

    const req = ctrl.expectOne('/api/upload');
    expect(req.request.headers.get('Content-Type')).toBeNull();
    req.flush({});
    ctrl.verify();
  });

  it('invokes beforeRemote (sync) and afterRemote on success', done => {
    const beforeSpy = jasmine.createSpy('beforeRemote');
    const afterSpy = jasmine.createSpy('afterRemote');
    configure([
      {
        hosts: ['/api'],
        beforeRemote: beforeSpy,
        afterRemote: afterSpy,
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/sync').subscribe(() => {
      expect(beforeSpy).toHaveBeenCalled();
      expect(afterSpy).toHaveBeenCalled();
      // why: afterRemote receives the HttpResponse on success path
      const arg = afterSpy.calls.mostRecent().args[0];
      expect(arg instanceof HttpResponse).toBeTrue();
      done();
    });

    const req = ctrl.expectOne('/api/sync');
    req.flush({ value: 1 });
    ctrl.verify();
  });

  it('supports the legacy clone-update shape returned by handler.intercept()', () => {
    configure([
      {
        hosts: ['/api'],
        intercept: () => ({ setHeaders: { 'X-Legacy': 'patched' } }),
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/legacy-intercept').subscribe();

    const req = ctrl.expectOne('/api/legacy-intercept');
    expect(req.request.headers.get('X-Legacy')).toBe('patched');
    req.flush(null);
    ctrl.verify();
  });

  it('waits for an async afterRemote hook before emitting a successful response', fakeAsync(() => {
    let resolveAfter!: () => void;
    const afterPromise = new Promise<void>(resolve => {
      resolveAfter = resolve;
    });
    configure([
      {
        hosts: ['/api'],
        afterRemote: () => afterPromise,
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    let emitted = false;

    http.get('/api/async-after-success').subscribe(() => (emitted = true));
    ctrl.expectOne('/api/async-after-success').flush({ ok: true });
    expect(emitted).toBeFalse();

    resolveAfter();
    flushMicrotasks();
    expect(emitted).toBeTrue();
    ctrl.verify();
  }));

  it('propagates a synchronous afterRemote failure after a successful HTTP response', () => {
    configure([
      {
        hosts: ['/api'],
        afterRemote: () => {
          throw new Error('synchronous success hook failure');
        },
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    let capturedError: unknown;

    http.get('/api/success-sync-hook-failure').subscribe({
      next: () => fail('successful response must wait for the hook'),
      error: error => (capturedError = error),
    });
    ctrl.expectOne('/api/success-sync-hook-failure').flush({ ok: true });

    expect(capturedError instanceof Error ? capturedError.message : capturedError).toBe('synchronous success hook failure');
    ctrl.verify();
  });

  it('propagates a rejected afterRemote Promise after a successful HTTP response', fakeAsync(() => {
    configure([
      {
        hosts: ['/api'],
        afterRemote: () => Promise.reject(new Error('asynchronous success hook failure')),
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    let capturedError: unknown;

    http.get('/api/success-async-hook-failure').subscribe({
      next: () => fail('successful response must wait for the hook'),
      error: error => (capturedError = error),
    });
    ctrl.expectOne('/api/success-async-hook-failure').flush({ ok: true });
    expect(capturedError).toBeUndefined();

    flushMicrotasks();
    expect(capturedError instanceof Error ? capturedError.message : capturedError).toBe('asynchronous success hook failure');
    ctrl.verify();
  }));

  it('waits for an async afterRemote hook before emitting an HTTP error', fakeAsync(() => {
    let resolveAfter!: () => void;
    const afterPromise = new Promise<void>(resolve => {
      resolveAfter = resolve;
    });
    configure([
      {
        hosts: ['/api'],
        afterRemote: () => afterPromise,
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    let emittedError = false;

    http.get('/api/async-after-error').subscribe({ error: () => (emittedError = true) });
    ctrl.expectOne('/api/async-after-error').flush('fail', { status: 500, statusText: 'Server Error' });
    expect(emittedError).toBeFalse();

    resolveAfter();
    flushMicrotasks();
    expect(emittedError).toBeTrue();
    ctrl.verify();
  }));

  it('preserves the original HTTP error when afterRemote throws synchronously', done => {
    configure([
      {
        hosts: ['/api'],
        afterRemote: () => {
          throw new Error('synchronous hook failure');
        },
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/original-error-sync-hook').subscribe({
      error: error => {
        expect(error instanceof HttpErrorResponse).toBeTrue();
        expect(error.status).toBe(503);
        done();
      },
    });
    ctrl.expectOne('/api/original-error-sync-hook').flush('original', { status: 503, statusText: 'Unavailable' });
    ctrl.verify();
  });

  it('preserves the original HTTP error after awaiting an afterRemote rejection', fakeAsync(() => {
    configure([
      {
        hosts: ['/api'],
        afterRemote: () => Promise.reject(new Error('asynchronous hook failure')),
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);
    let capturedError: unknown;

    http.get('/api/original-error-async-hook').subscribe({ error: error => (capturedError = error) });
    ctrl.expectOne('/api/original-error-async-hook').flush('original', { status: 502, statusText: 'Bad Gateway' });
    expect(capturedError).toBeUndefined();

    flushMicrotasks();
    expect(capturedError instanceof HttpErrorResponse).toBeTrue();
    expect(capturedError instanceof HttpErrorResponse ? capturedError.status : undefined).toBe(502);
    ctrl.verify();
  }));

  it('waits for beforeRemote Promise to resolve before dispatching the request', done => {
    let resolveBefore!: () => void;
    const beforePromise = new Promise<void>(resolve => {
      resolveBefore = resolve;
    });
    const beforeSpy = jasmine.createSpy('beforeRemote').and.returnValue(beforePromise);
    const afterSpy = jasmine.createSpy('afterRemote');

    configure([
      {
        hosts: ['/api'],
        beforeRemote: beforeSpy,
        afterRemote: afterSpy,
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/async').subscribe(() => {
      expect(afterSpy).toHaveBeenCalled();
      done();
    });

    // why: while beforeRemote is still pending, no HTTP request should be issued.
    ctrl.match('/api/async').forEach(() => fail('request fired before beforeRemote resolved'));

    resolveBefore();
    // microtask flush
    Promise.resolve().then(() => {
      const req = ctrl.expectOne('/api/async');
      req.flush({ ok: true });
      ctrl.verify();
    });
  });

  it('calls afterRemote with HttpErrorResponse on error (sync branch)', done => {
    const afterSpy = jasmine.createSpy('afterRemote');
    configure([
      {
        hosts: ['/api'],
        afterRemote: afterSpy,
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/boom').subscribe({
      error: () => {
        expect(afterSpy).toHaveBeenCalled();
        const arg = afterSpy.calls.mostRecent().args[0];
        expect(arg.status).toBe(500);
        done();
      },
    });

    const req = ctrl.expectOne('/api/boom');
    req.flush('boom', { status: 500, statusText: 'Server Error' });
    ctrl.verify();
  });

  it('calls afterRemote with HttpErrorResponse on error (async beforeRemote branch)', done => {
    const afterSpy = jasmine.createSpy('afterRemote');
    configure([
      {
        hosts: ['/api'],
        beforeRemote: () => Promise.resolve(),
        afterRemote: afterSpy,
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/async-boom').subscribe({
      error: () => {
        expect(afterSpy).toHaveBeenCalled();
        const arg = afterSpy.calls.mostRecent().args[0];
        expect(arg.status).toBe(400);
        done();
      },
    });

    // why: Promise.resolve() goes through microtask before next.handle()
    Promise.resolve().then(() => {
      const req = ctrl.expectOne('/api/async-boom');
      req.flush({ msg: 'bad' }, { status: 400, statusText: 'Bad Request' });
      ctrl.verify();
    });
  });

  it('no handler match → skips intercept/beforeRemote/afterRemote entirely', done => {
    const interceptSpy = jasmine.createSpy<(request: HttpRequest<unknown>) => HttpRequest<unknown>>('intercept');
    const beforeSpy = jasmine.createSpy('beforeRemote');
    const afterSpy = jasmine.createSpy('afterRemote');
    configure([
      {
        hosts: ['https://other-host'],
        intercept: interceptSpy,
        beforeRemote: beforeSpy,
        afterRemote: afterSpy,
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/local').subscribe(() => {
      expect(interceptSpy).not.toHaveBeenCalled();
      expect(beforeSpy).not.toHaveBeenCalled();
      expect(afterSpy).not.toHaveBeenCalled();
      done();
    });
    const req = ctrl.expectOne('/api/local');
    req.flush({});
    ctrl.verify();
  });

  // ─── host matching: parsed origin, not a raw string prefix ──────────────────

  it('does not run a handler for a lookalike host that shares the configured host as a string prefix', () => {
    const interceptSpy = jasmine
      .createSpy<(request: HttpRequest<unknown>) => HttpRequest<unknown>>('intercept')
      .and.callFake(request => request.clone({ setHeaders: { Authorization: 'Bearer secret' } }));
    configure([{ hosts: ['https://api.example.com'], intercept: interceptSpy }]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    // why: với `url.startsWith(host)`, host giả mạo này khớp handler của api.example.com và nhận
    // luôn header Authorization mà `intercept` gắn vào.
    http.get('https://api.example.com.attacker.tld/x').subscribe();

    const req = ctrl.expectOne('https://api.example.com.attacker.tld/x');
    expect(interceptSpy).not.toHaveBeenCalled();
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush(null);
    ctrl.verify();
  });

  it('still runs the handler for the exact configured origin', () => {
    configure([
      {
        hosts: ['https://api.example.com'],
        intercept: request => request.clone({ setHeaders: { Authorization: 'Bearer secret' } }),
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('https://api.example.com/v1/users').subscribe();

    const req = ctrl.expectOne('https://api.example.com/v1/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer secret');
    req.flush(null);
    ctrl.verify();
  });

  it('treats a configured host path as a segment prefix so /v1 does not cover /v1beta', () => {
    configure([
      {
        hosts: ['https://api.example.com/v1'],
        intercept: request => request.clone({ setHeaders: { Authorization: 'Bearer secret' } }),
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('https://api.example.com/v1/users').subscribe();
    const covered = ctrl.expectOne('https://api.example.com/v1/users');
    expect(covered.request.headers.get('Authorization')).toBe('Bearer secret');
    covered.flush(null);

    http.get('https://api.example.com/v1beta/users').subscribe();
    const sibling = ctrl.expectOne('https://api.example.com/v1beta/users');
    expect(sibling.request.headers.get('Authorization')).toBeNull();
    sibling.flush(null);
    ctrl.verify();
  });

  it('keeps matching same-origin relative hosts such as /api', () => {
    configure([
      {
        hosts: ['/api'],
        intercept: request => request.clone({ setHeaders: { 'X-Relative': 'matched' } }),
      },
    ]);
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/users').subscribe();
    const matched = ctrl.expectOne('/api/users');
    expect(matched.request.headers.get('X-Relative')).toBe('matched');
    matched.flush(null);

    // why: cùng origin nhưng khác nhánh path thì không được coi là thuộc handler '/api'.
    http.get('/public/ping').subscribe();
    const unmatched = ctrl.expectOne('/public/ping');
    expect(unmatched.request.headers.get('X-Relative')).toBeNull();
    unmatched.flush(null);
    ctrl.verify();
  });

  it('handles config with no handlers list gracefully', () => {
    // why: a configuration object with falsy/undefined handlers must not blow up
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: SdHttpInterceptor, multi: true },
        { provide: SD_API_CONFIG, multi: true, useValue: { handlers: undefined } },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/x').subscribe(res => expect(res).toEqual({ ok: 1 }));
    ctrl.expectOne('/api/x').flush({ ok: 1 });
    ctrl.verify();
  });
});
