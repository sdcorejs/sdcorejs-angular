/* eslint-disable @typescript-eslint/no-explicit-any */
import { HTTP_INTERCEPTORS, HttpClient, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ISdApiConfiguration, SD_API_CONFIG } from '../api.model';
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
    configure([{
      hosts: ['/api'],
      // why: `intercept` is typed as returning HttpRequest but at runtime the
      // value is spread into `request.clone({...})` — cast to bypass the
      // declared (incorrect) type.
      intercept: ((_request: any) => ({ setHeaders: { 'X-Custom': 'patched' } })) as any,
    }]);
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

  it('invokes beforeRemote (sync) and afterRemote on success', (done) => {
    const beforeSpy = jasmine.createSpy('beforeRemote');
    const afterSpy = jasmine.createSpy('afterRemote');
    configure([{
      hosts: ['/api'],
      beforeRemote: beforeSpy,
      afterRemote: afterSpy,
    }]);
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

  it('waits for beforeRemote Promise to resolve before dispatching the request', (done) => {
    let resolveBefore!: () => void;
    const beforePromise = new Promise<void>(resolve => { resolveBefore = resolve; });
    const beforeSpy = jasmine.createSpy('beforeRemote').and.returnValue(beforePromise);
    const afterSpy = jasmine.createSpy('afterRemote');

    configure([{
      hosts: ['/api'],
      beforeRemote: beforeSpy,
      afterRemote: afterSpy,
    }]);
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

  it('calls afterRemote with HttpErrorResponse on error (sync branch)', (done) => {
    const afterSpy = jasmine.createSpy('afterRemote');
    configure([{
      hosts: ['/api'],
      afterRemote: afterSpy,
    }]);
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

  it('calls afterRemote with HttpErrorResponse on error (async beforeRemote branch)', (done) => {
    const afterSpy = jasmine.createSpy('afterRemote');
    configure([{
      hosts: ['/api'],
      beforeRemote: () => Promise.resolve(),
      afterRemote: afterSpy,
    }]);
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

  it('no handler match → skips intercept/beforeRemote/afterRemote entirely', (done) => {
    const interceptSpy = jasmine.createSpy('intercept');
    const beforeSpy = jasmine.createSpy('beforeRemote');
    const afterSpy = jasmine.createSpy('afterRemote');
    configure([{
      hosts: ['https://other-host'],
      intercept: interceptSpy as any,
      beforeRemote: beforeSpy,
      afterRemote: afterSpy,
    }]);
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

  it('handles config with no handlers list gracefully', () => {
    // why: a configuration object with falsy/undefined handlers must not blow up
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: SdHttpInterceptor, multi: true },
        { provide: SD_API_CONFIG, multi: true, useValue: { handlers: undefined as any } },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/api/x').subscribe(res => expect(res).toEqual({ ok: 1 }));
    ctrl.expectOne('/api/x').flush({ ok: 1 });
    ctrl.verify();
  });
});
