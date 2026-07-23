import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpRequest, HttpResponse, provideHttpClient } from '@angular/common/http';
import { SdApiService } from './api.service';
import { SdCacheService } from '@sdcorejs/angular/services/cache';
import { ISdApiConfiguration, SD_API_CONFIG, SD_API_CONFIGURATION, SdApiHandler, SdGetOption } from './api.model';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { Utilities } from '@sdcorejs/utils/fns';

// ─── helpers ──────────────────────────────────────────────────────────────────

// ─── suite ────────────────────────────────────────────────────────────────────

describe('SdApiService', () => {
  let service: SdApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), SdCacheService],
    });
    service = TestBed.inject(SdApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ─── instantiation ──────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('http getter returns the underlying HttpClient', () => {
    expect(service.http).toBeTruthy();
  });

  it('keeps SD_API_CONFIGURATION as an alias of SD_API_CONFIG', () => {
    expect(SD_API_CONFIGURATION).toBe(SD_API_CONFIG);
  });

  // ─── GET ────────────────────────────────────────────────────────────────────

  it('get() issues GET to the given URL and resolves with body', async () => {
    const promise = service.get('/api/users');
    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Alice' }]);
    const result = await promise;
    expect(result).toEqual([{ id: 1, name: 'Alice' }]);
  });

  it('get() forwards query params to the request', async () => {
    const promise = service.get('/api/items', { params: { page: '2', size: '10' } });
    const req = httpMock.expectOne(r => r.url === '/api/items');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    req.flush([]);
    await promise;
  });

  it('get() forwards custom headers to the request', async () => {
    const promise = service.get('/api/me', { headers: { 'X-Auth': 'token-abc' } });
    const req = httpMock.expectOne('/api/me');
    expect(req.request.headers.get('X-Auth')).toBe('token-abc');
    req.flush({ id: 99 });
    await promise;
  });

  // ─── POST ───────────────────────────────────────────────────────────────────

  it('post() issues POST with body and resolves with body', async () => {
    const payload = { name: 'Bob' };
    const promise = service.post('/api/users', payload);
    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 2, name: 'Bob' });
    const result = await promise;
    expect(result).toEqual({ id: 2, name: 'Bob' });
  });

  it('post() with no body sends null body', async () => {
    const promise = service.post('/api/action');
    const req = httpMock.expectOne('/api/action');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ ok: true });
    await promise;
  });

  it('post() with FormData body gets a unique key each time (no deduplication)', async () => {
    const fd1 = new FormData();
    const fd2 = new FormData();
    // Both calls are independent — two requests must be made
    const p1 = service.post('/api/upload', fd1, { autoCache: false });
    const p2 = service.post('/api/upload', fd2, { autoCache: false });
    const reqs = httpMock.match('/api/upload');
    expect(reqs.length).toBe(2);
    reqs[0].flush({ url: 'a' });
    reqs[1].flush({ url: 'b' });
    await Promise.all([p1, p2]);
  });

  // ─── PUT ────────────────────────────────────────────────────────────────────

  it('put() issues PUT with body', async () => {
    const payload = { name: 'Charlie' };
    const promise = service.put('/api/users/3', payload);
    const req = httpMock.expectOne('/api/users/3');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 3, name: 'Charlie' });
    const result = await promise;
    expect(result).toEqual({ id: 3, name: 'Charlie' });
  });

  it('patch() issues PATCH with body and resolves with body', async () => {
    const payload = { name: 'Delta' };
    const promise = service.patch('/api/users/4', payload);
    const req = httpMock.expectOne('/api/users/4');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 4, name: 'Delta' });
    await expectAsync(promise).toBeResolvedTo({ id: 4, name: 'Delta' });
  });

  // ─── DELETE ─────────────────────────────────────────────────────────────────

  it('delete() issues DELETE and resolves', async () => {
    const promise = service.delete('/api/users/4');
    const req = httpMock.expectOne('/api/users/4');
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true });
    const result = await promise;
    expect(result).toEqual({ deleted: true });
  });

  it('delete() forwards query params', async () => {
    const promise = service.delete('/api/users/5', { params: { soft: 'true' } });
    const req = httpMock.expectOne(r => r.url === '/api/users/5');
    expect(req.request.params.get('soft')).toBe('true');
    req.flush({ deleted: true });
    await promise;
  });

  // ─── error paths ────────────────────────────────────────────────────────────

  it('get() rejects when server returns 404', async () => {
    const promise = service.get('/api/not-found');
    const req = httpMock.expectOne('/api/not-found');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    await expectAsync(promise).toBeRejected();
  });

  it('get() rejects when server returns 500', async () => {
    const promise = service.get('/api/error');
    const req = httpMock.expectOne('/api/error');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    await expectAsync(promise).toBeRejected();
  });

  it('post() rejects when server returns 400', async () => {
    const promise = service.post('/api/bad-request', { invalid: true });
    const req = httpMock.expectOne('/api/bad-request');
    req.flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });
    await expectAsync(promise).toBeRejected();
  });

  // ─── { ok: false } response shape ───────────────────────────────────────────

  it('get() throws the body when response has { ok: false }', async () => {
    const errorBody = { ok: false, message: 'Unauthorized', code: 401 };
    const promise = service.get('/api/protected');
    const req = httpMock.expectOne('/api/protected');
    req.flush(errorBody);
    await expectAsync(promise).toBeRejectedWith(errorBody);
  });

  it('get() does NOT throw when response has { ok: true, ... }', async () => {
    const body = { ok: true, data: 'secret' };
    const promise = service.get('/api/protected');
    const req = httpMock.expectOne('/api/protected');
    req.flush(body);
    const result = await promise;
    expect(result).toEqual(body);
  });

  // ─── deduplication ──────────────────────────────────────────────────────────

  it('identical GET calls within 1s share one network request (deduplication)', async () => {
    // Fire two concurrent identical requests
    const p1 = service.get('/api/dedup');
    const p2 = service.get('/api/dedup');

    // Only ONE HTTP request should be pending
    const reqs = httpMock.match('/api/dedup');
    expect(reqs.length).toBe(1);
    reqs[0].flush({ data: 'shared' });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({ data: 'shared' });
    expect(r2).toEqual({ data: 'shared' });
  });

  [
    { method: 'POST', request: () => service.post('/api/default-mutation', { value: 1 }) },
    { method: 'PUT', request: () => service.put('/api/default-mutation', { value: 1 }) },
    { method: 'PATCH', request: () => service.patch('/api/default-mutation', { value: 1 }) },
    { method: 'DELETE', request: () => service.delete('/api/default-mutation') },
  ].forEach(({ method, request }) => {
    it(`${method} does not deduplicate identical requests by default`, async () => {
      const p1 = request();
      const p2 = request();
      const reqs = httpMock.match('/api/default-mutation');
      expect(reqs.length).toBe(2);
      reqs.forEach((req, index) => {
        expect(req.request.method).toBe(method);
        req.flush({ index });
      });
      await Promise.all([p1, p2]);
    });
  });

  it('deduplicates an identical mutation only when dedupe is explicitly enabled', async () => {
    const p1 = service.post('/api/opt-in-mutation', { value: 1 }, { dedupe: true });
    const p2 = service.post('/api/opt-in-mutation', { value: 1 }, { dedupe: true });

    const reqs = httpMock.match('/api/opt-in-mutation');
    expect(reqs.length).toBe(1);
    reqs[0].flush({ saved: true });

    await expectAsync(Promise.all([p1, p2])).toBeResolvedTo([{ saved: true }, { saved: true }]);
  });

  it('keeps explicit autoCache:true as a deprecated mutation dedupe opt-in', async () => {
    const p1 = service.post('/api/legacy-opt-in', { value: 1 }, { autoCache: true });
    const p2 = service.post('/api/legacy-opt-in', { value: 1 }, { autoCache: true });
    const reqs = httpMock.match('/api/legacy-opt-in');
    expect(reqs.length).toBe(1);
    reqs[0].flush({ saved: true });
    await Promise.all([p1, p2]);
  });

  it('includes params, headers, and body in the dedupe key', async () => {
    const params1 = service.get('/api/key-params', { params: { page: 1 } });
    const params2 = service.get('/api/key-params', { params: { page: 2 } });
    const paramReqs = httpMock.match(request => request.url === '/api/key-params');
    expect(paramReqs.length).toBe(2);
    paramReqs.forEach(req => req.flush({ page: req.request.params.get('page') }));

    const headers1 = service.get('/api/key-headers', { headers: { 'X-Locale': 'en' } });
    const headers2 = service.get('/api/key-headers', { headers: { 'X-Locale': 'vi' } });
    const headerReqs = httpMock.match('/api/key-headers');
    expect(headerReqs.length).toBe(2);
    headerReqs.forEach(req => req.flush({ locale: req.request.headers.get('X-Locale') }));

    const body1 = service.post('/api/key-body', { value: 1 }, { dedupe: true });
    const body2 = service.post('/api/key-body', { value: 2 }, { dedupe: true });
    const bodyReqs = httpMock.match('/api/key-body');
    expect(bodyReqs.length).toBe(2);
    bodyReqs.forEach(req => req.flush(req.request.body));

    await Promise.all([params1, params2, headers1, headers2, body1, body2]);
  });

  it('distinguishes URLSearchParams bodies by their canonical string under explicit dedupe', async () => {
    const first = service.post('/api/url-search-params-key', new URLSearchParams('query=first'), { dedupe: true });
    const second = service.post('/api/url-search-params-key', new URLSearchParams('query=second'), { dedupe: true });

    const requests = httpMock.match('/api/url-search-params-key');
    expect(requests.length).toBe(2);
    requests.forEach(request => request.flush({ query: request.request.body.toString() }));

    await expectAsync(first).toBeResolvedTo({ query: 'query=first' });
    await expectAsync(second).toBeResolvedTo({ query: 'query=second' });
  });

  it('uses stable identity for distinct ArrayBuffer bodies in persistent cache keys', async () => {
    const cacheOption = { type: 'memory' } as const;
    const firstBuffer = new Uint8Array([1]).buffer;
    const secondBuffer = new Uint8Array([2]).buffer;
    const first = service.post('/api/array-buffer-cache-key', firstBuffer, { cacheOption });
    httpMock.expectOne('/api/array-buffer-cache-key').flush({ generation: 'first' });
    await expectAsync(first).toBeResolvedTo({ generation: 'first' });

    const second = service.post('/api/array-buffer-cache-key', secondBuffer, { cacheOption });
    const requests = httpMock.match('/api/array-buffer-cache-key');
    expect(requests.length).toBe(1);
    requests.forEach(request => request.flush({ generation: 'second' }));
    await expectAsync(second).toBeResolvedTo({ generation: 'second' });
  });

  it('safely deduplicates repeated use of the same circular plain-object body', async () => {
    interface CircularBody {
      label: string;
      self?: CircularBody;
    }

    const body: CircularBody = { label: 'circular-object' };
    body.self = body;
    const first = service.post('/api/circular-object-key', body, { dedupe: true });
    const second = service.post('/api/circular-object-key', body, { dedupe: true });

    const requests = httpMock.match('/api/circular-object-key');
    expect(requests.length).toBe(1);
    requests[0].flush({ stable: true });
    await expectAsync(Promise.all([first, second])).toBeResolvedTo([{ stable: true }, { stable: true }]);
  });

  it('keeps distinct circular array bodies isolated without recursive key failures', async () => {
    const firstBody: unknown[] = ['first'];
    firstBody.push(firstBody);
    const secondBody: unknown[] = ['second'];
    secondBody.push(secondBody);
    const first = service.post('/api/circular-array-key', firstBody, { dedupe: true });
    const second = service.post('/api/circular-array-key', secondBody, { dedupe: true });

    const requests = httpMock.match('/api/circular-array-key');
    expect(requests.length).toBe(2);
    requests.forEach((request, index) => request.flush({ generation: index + 1 }));
    await expectAsync(first).toBeResolvedTo({ generation: 1 });
    await expectAsync(second).toBeResolvedTo({ generation: 2 });
  });

  it('keeps sharing a GET for its full in-flight lifetime even after the replay window duration', fakeAsync(() => {
    let firstResult: unknown;
    let secondResult: unknown;
    void service.get('/api/slow', { dedupeWindowMs: 100 }).then(value => (firstResult = value));

    tick(1001);
    void service.get('/api/slow', { dedupeWindowMs: 100 }).then(value => (secondResult = value));

    const reqs = httpMock.match('/api/slow');
    expect(reqs.length).toBe(1);
    reqs[0].flush({ value: 'shared' });
    flushMicrotasks();
    expect(firstResult).toEqual({ value: 'shared' });
    expect(secondResult).toEqual({ value: 'shared' });
  }));

  it('starts the replay window on successful completion rather than request start', fakeAsync(() => {
    let replayResult: unknown;
    const first = service.get('/api/completion-window', { dedupeWindowMs: 100 });

    tick(500);
    httpMock.expectOne('/api/completion-window').flush({ generation: 1 });
    flushMicrotasks();

    tick(99);
    void service.get('/api/completion-window', { dedupeWindowMs: 100 }).then(value => (replayResult = value));
    expect(httpMock.match('/api/completion-window').length).toBe(0);
    flushMicrotasks();
    expect(replayResult).toEqual({ generation: 1 });

    tick(2);
    const next = service.get('/api/completion-window', { dedupeWindowMs: 100 });
    httpMock.expectOne('/api/completion-window').flush({ generation: 2 });
    flushMicrotasks();
    void expectAsync(first).toBeResolvedTo({ generation: 1 });
    void expectAsync(next).toBeResolvedTo({ generation: 2 });
  }));

  it('isolates request dedupe entries by normalized replay window without changing response semantics', async () => {
    const zeroWindow = service.get('/api/replay-policy-key', { dedupeWindowMs: 0 });
    const longWindow = service.get('/api/replay-policy-key', { dedupeWindowMs: 10_000 });

    const initialRequests = httpMock.match('/api/replay-policy-key');
    expect(initialRequests.length).toBe(2);
    initialRequests.forEach((request, index) => request.flush({ generation: index === 0 ? 'zero' : 'long' }));

    await expectAsync(zeroWindow).toBeResolvedTo({ generation: 'zero' });
    await expectAsync(longWindow).toBeResolvedTo({ generation: 'long' });

    const nextZeroWindow = service.get('/api/replay-policy-key', { dedupeWindowMs: 0 });
    const replayedLongWindow = service.get('/api/replay-policy-key', { dedupeWindowMs: 10_000 });
    const followUpRequests = httpMock.match('/api/replay-policy-key');
    expect(followUpRequests.length).toBe(1);
    followUpRequests[0].flush({ generation: 'fresh-zero' });

    await expectAsync(nextZeroWindow).toBeResolvedTo({ generation: 'fresh-zero' });
    await expectAsync(replayedLongWindow).toBeResolvedTo({ generation: 'long' });
  });

  it('normalizes non-finite and out-of-range numeric policies before keying requests', async () => {
    const maxTimerMs = 2_147_483_647;
    const cases: { name: string; first: SdGetOption; normalized: SdGetOption }[] = [
      { name: 'timeout-NaN', first: { timeout: Number.NaN }, normalized: { timeout: 60_000 } },
      { name: 'attempts-Infinity', first: { retry: { attempts: Number.POSITIVE_INFINITY } }, normalized: { retry: { attempts: 0 } } },
      { name: 'delay-negative', first: { retry: { attempts: 1, delayMs: -1 } }, normalized: { retry: { attempts: 1, delayMs: 0 } } },
      {
        name: 'backoff-over-max',
        first: { retry: { attempts: 1, backoff: maxTimerMs + 1 } },
        normalized: { retry: { attempts: 1, backoff: maxTimerMs } },
      },
      { name: 'window-NaN', first: { dedupeWindowMs: Number.NaN }, normalized: { dedupeWindowMs: 1000 } },
      { name: 'window-Infinity', first: { dedupeWindowMs: Number.POSITIVE_INFINITY }, normalized: { dedupeWindowMs: 1000 } },
      { name: 'window-negative', first: { dedupeWindowMs: -1 }, normalized: { dedupeWindowMs: 0 } },
      { name: 'window-over-max', first: { dedupeWindowMs: maxTimerMs + 1 }, normalized: { dedupeWindowMs: maxTimerMs } },
    ];

    for (const testCase of cases) {
      const url = `/api/numeric-${testCase.name}`;
      const first = service.get(url, testCase.first);
      const normalized = service.get(url, testCase.normalized);
      const requests = httpMock.match(url);
      expect(requests.length).withContext(testCase.name).toBe(1);
      requests.forEach(request => request.flush({ name: testCase.name }));
      await Promise.all([first, normalized]);
    }
  });

  it('clamps the actual replay timer to the platform maximum without waiting for it', async () => {
    const maxTimerMs = 2_147_483_647;
    const setTimeoutSpy = spyOn(window, 'setTimeout').and.callThrough();
    const promise = service.get('/api/max-replay-timer', { dedupeWindowMs: maxTimerMs + 1 });

    httpMock.expectOne('/api/max-replay-timer').flush({ ok: true });
    await promise;

    expect(setTimeoutSpy.calls.allArgs().some(args => args[1] === maxTimerMs)).toBeTrue();
  });

  it('isolates dedupe entries by responseType', async () => {
    const jsonPromise = service.get<{ value: string }>('/api/representation', { responseType: 'json' });
    const textPromise = service.get<string>('/api/representation', { responseType: 'text' });

    const reqs = httpMock.match('/api/representation');
    expect(reqs.length).toBe(2);
    const jsonReq = reqs.find(req => req.request.responseType === 'json');
    const textReq = reqs.find(req => req.request.responseType === 'text');
    expect(jsonReq).toBeDefined();
    expect(textReq).toBeDefined();
    jsonReq?.flush({ value: 'json' });
    textReq?.flush('text');

    await expectAsync(jsonPromise).toBeResolvedTo({ value: 'json' });
    await expectAsync(textPromise).toBeResolvedTo('text');
  });

  it('isolates dedupe entries by withCredentials', async () => {
    const anonymous = service.get('/api/credentials', { withCredentials: false });
    const credentialed = service.get('/api/credentials', { withCredentials: true });

    const reqs = httpMock.match('/api/credentials');
    expect(reqs.length).toBe(2);
    reqs.forEach(req => req.flush({ credentialed: req.request.withCredentials }));

    await expectAsync(anonymous).toBeResolvedTo({ credentialed: false });
    await expectAsync(credentialed).toBeResolvedTo({ credentialed: true });
  });

  it('uses dedupe ahead of the deprecated autoCache alias', async () => {
    const disabled1 = service.post('/api/precedence-off', { value: 1 }, { dedupe: false, autoCache: true });
    const disabled2 = service.post('/api/precedence-off', { value: 1 }, { dedupe: false, autoCache: true });
    const disabledReqs = httpMock.match('/api/precedence-off');
    expect(disabledReqs.length).toBe(2);
    disabledReqs.forEach(req => req.flush({ ok: true }));

    const enabled1 = service.post('/api/precedence-on', { value: 1 }, { dedupe: true, autoCache: false });
    const enabled2 = service.post('/api/precedence-on', { value: 1 }, { dedupe: true, autoCache: false });
    const enabledReqs = httpMock.match('/api/precedence-on');
    expect(enabledReqs.length).toBe(1);
    enabledReqs[0].flush({ ok: true });

    await Promise.all([disabled1, disabled2, enabled1, enabled2]);
  });

  it('aborting one shared caller rejects only that caller and keeps the HTTP request alive', async () => {
    const firstController = new AbortController();
    const secondController = new AbortController();
    const first = service.get('/api/shared-abort', { signal: firstController.signal });
    const second = service.get('/api/shared-abort', { signal: secondController.signal });
    const firstOutcome = first.then(
      () => 'resolved',
      error => (error instanceof Error ? error.name : 'unknown')
    );

    const req = httpMock.expectOne('/api/shared-abort');
    firstController.abort();
    expect(req.cancelled).toBeFalse();
    req.flush({ value: 'survivor' });

    await expectAsync(firstOutcome).toBeResolvedTo('AbortError');
    await expectAsync(second).toBeResolvedTo({ value: 'survivor' });
  });

  it('rejects a pre-aborted caller without starting an HTTP request', async () => {
    const controller = new AbortController();
    controller.abort();
    const outcome = service.get('/api/pre-aborted', { signal: controller.signal }).then(
      () => 'resolved',
      error => (error instanceof Error ? error.name : 'unknown')
    );

    const unexpected = httpMock.match('/api/pre-aborted');
    expect(unexpected.length).toBe(0);
    unexpected.forEach(req => req.flush({ stale: true }));
    await expectAsync(outcome).toBeResolvedTo('AbortError');
  });

  it('aborting a non-deduped mutation cancels its own HTTP request', async () => {
    const controller = new AbortController();
    const outcome = service.post('/api/non-deduped-abort', { value: 1 }, { dedupe: false, signal: controller.signal }).then(
      () => 'resolved',
      error => (error instanceof Error ? error.name : 'unknown')
    );
    const req = httpMock.expectOne('/api/non-deduped-abort');

    controller.abort();
    expect(req.cancelled).toBeTrue();
    if (!req.cancelled) req.flush({ stale: true });
    await expectAsync(outcome).toBeResolvedTo('AbortError');
  });

  it('cancels and evicts a shared HTTP request after all callers abort', async () => {
    const firstController = new AbortController();
    const secondController = new AbortController();
    const first = service.get('/api/all-abort', { signal: firstController.signal });
    const second = service.get('/api/all-abort', { signal: secondController.signal });
    const firstOutcome = first.then(
      () => 'resolved',
      error => (error instanceof Error ? error.name : 'unknown')
    );
    const secondOutcome = second.then(
      () => 'resolved',
      error => (error instanceof Error ? error.name : 'unknown')
    );

    const req = httpMock.expectOne('/api/all-abort');
    firstController.abort();
    expect(req.cancelled).toBeFalse();
    secondController.abort();
    expect(req.cancelled).toBeTrue();
    if (!req.cancelled) req.flush({ stale: true });

    await expectAsync(firstOutcome).toBeResolvedTo('AbortError');
    await expectAsync(secondOutcome).toBeResolvedTo('AbortError');

    const retry = service.get('/api/all-abort');
    httpMock.expectOne('/api/all-abort').flush({ fresh: true });
    await expectAsync(retry).toBeResolvedTo({ fresh: true });
  });

  it('removes each caller AbortSignal listener after success', async () => {
    const controller = new AbortController();
    const addSpy = spyOn(controller.signal, 'addEventListener').and.callThrough();
    const removeSpy = spyOn(controller.signal, 'removeEventListener').and.callThrough();

    const promise = service.get('/api/listener-cleanup', { signal: controller.signal });
    httpMock.expectOne('/api/listener-cleanup').flush({ ok: true });
    await promise;

    expect(addSpy).toHaveBeenCalledWith('abort', jasmine.any(Function), jasmine.anything());
    expect(removeSpy).toHaveBeenCalledWith('abort', jasmine.any(Function));
  });

  it('evicts a failed GET so the next caller starts a fresh request', async () => {
    const failed = service.get('/api/error-eviction');
    const failedOutcome = failed.then(
      () => 'resolved',
      error => (error instanceof HttpErrorResponse ? error.status : 'unknown')
    );
    httpMock.expectOne('/api/error-eviction').flush('fail', { status: 500, statusText: 'Server Error' });
    await expectAsync(failedOutcome).toBeResolvedTo(500);

    const fresh = service.get('/api/error-eviction');
    httpMock.expectOne('/api/error-eviction').flush({ fresh: true });
    await expectAsync(fresh).toBeResolvedTo({ fresh: true });
  });

  it('does not seed persistent cache after an error', async () => {
    const option: SdGetOption = { cacheOption: { type: 'memory' } };
    const failed = service.get('/api/persistent-error', option).catch(error => error);
    httpMock.expectOne('/api/persistent-error').flush('fail', { status: 500, statusText: 'Server Error' });
    await failed;

    const fresh = service.get('/api/persistent-error', option);
    httpMock.expectOne('/api/persistent-error').flush({ fresh: true });
    await expectAsync(fresh).toBeResolvedTo({ fresh: true });
  });

  it('does not seed persistent cache when its only caller aborts', async () => {
    const controller = new AbortController();
    const option: SdGetOption = { cacheOption: { type: 'memory' }, signal: controller.signal };
    const outcome = service.get('/api/persistent-abort', option).then(
      () => 'resolved',
      error => (error instanceof Error ? error.name : 'unknown')
    );
    const req = httpMock.expectOne('/api/persistent-abort');
    controller.abort();
    expect(req.cancelled).toBeTrue();
    if (!req.cancelled) req.flush({ stale: true });
    await expectAsync(outcome).toBeResolvedTo('AbortError');

    const fresh = service.get('/api/persistent-abort', { cacheOption: { type: 'memory' } });
    httpMock.expectOne('/api/persistent-abort').flush({ fresh: true });
    await expectAsync(fresh).toBeResolvedTo({ fresh: true });
  });

  it('rejects a pre-aborted caller before reading a persistent cache hit', async () => {
    const cacheOption = { type: 'memory' } as const;
    const seeded = service.get('/api/persistent-cache-hit-abort', { cacheOption });
    httpMock.expectOne('/api/persistent-cache-hit-abort').flush({ cached: true });
    await expectAsync(seeded).toBeResolvedTo({ cached: true });

    const controller = new AbortController();
    controller.abort();
    const outcome = service.get('/api/persistent-cache-hit-abort', { cacheOption, signal: controller.signal }).then(
      () => 'resolved',
      error => (error instanceof Error ? error.name : 'unknown')
    );

    expect(httpMock.match('/api/persistent-cache-hit-abort').length).toBe(0);
    await expectAsync(outcome).toBeResolvedTo('AbortError');
  });

  it('releases each temporary layered-cache facade on success, hit, and error', async () => {
    const cacheService = TestBed.inject(SdCacheService);
    const createSpy = spyOn(cacheService, 'create').and.callThrough();
    const option: SdGetOption = { cacheOption: { type: 'memory' } };

    const seeded = service.get('/api/cache-facade-owner', option);
    httpMock.expectOne('/api/cache-facade-owner').flush({ cached: true });
    await expectAsync(seeded).toBeResolvedTo({ cached: true });
    const successFacade = createSpy.calls.mostRecent().returnValue;
    expect(() => successFacade.has()).toThrowError('Cache handle has been destroyed');

    await expectAsync(service.get('/api/cache-facade-owner', option)).toBeResolvedTo({ cached: true });
    expect(httpMock.match('/api/cache-facade-owner').length).toBe(0);
    const hitFacade = createSpy.calls.mostRecent().returnValue;
    expect(() => hitFacade.has()).toThrowError('Cache handle has been destroyed');

    const failed = service.get('/api/cache-facade-error', option);
    httpMock.expectOne('/api/cache-facade-error').flush('fail', { status: 500, statusText: 'Server Error' });
    await expectAsync(failed).toBeRejected();
    const errorFacade = createSpy.calls.mostRecent().returnValue;
    expect(() => errorFacade.has()).toThrowError('Cache handle has been destroyed');
  });

  it('treats an explicitly cached undefined response as a presence hit', async () => {
    const option: SdGetOption = { cacheOption: { type: 'memory' } };
    const cacheKey = Utilities.hash({
      method: 'GET',
      url: '/api/cached-undefined',
      body: undefined,
      headers: undefined,
      params: undefined,
      context: undefined,
      reportProgress: false,
      responseType: 'json',
      withCredentials: false,
      transferCache: undefined,
      timeout: 60000,
      retry: undefined,
    });
    const seed = TestBed.inject(SdCacheService).create<undefined>(cacheKey, option.cacheOption);
    seed.set(undefined);
    seed.release();

    await expectAsync(service.get<undefined>('/api/cached-undefined', option)).toBeResolvedTo(undefined);
    expect(httpMock.match('/api/cached-undefined').length).toBe(0);
  });

  it('retries retryable GET statuses with bounded exponential backoff', fakeAsync(() => {
    let result: unknown;
    let rejection: unknown;
    void service.get('/api/retry-backoff', { retry: { attempts: 2, delayMs: 10, backoff: 2 } }).then(
      value => (result = value),
      error => (rejection = error)
    );

    httpMock.expectOne('/api/retry-backoff').flush('first', { status: 503, statusText: 'Unavailable' });
    tick(9);
    expect(httpMock.match('/api/retry-backoff').length).toBe(0);
    tick(1);
    httpMock.expectOne('/api/retry-backoff').flush('second', { status: 503, statusText: 'Unavailable' });
    tick(19);
    expect(httpMock.match('/api/retry-backoff').length).toBe(0);
    tick(1);
    httpMock.expectOne('/api/retry-backoff').flush({ ok: true });
    flushMicrotasks();

    expect(result).toEqual({ ok: true });
    expect(rejection).toBeUndefined();
  }));

  it('stops retrying after the configured retry limit', fakeAsync(() => {
    let rejection: unknown;
    void service.get('/api/retry-limit', { retry: { attempts: 2, delayMs: 1 } }).catch(error => (rejection = error));

    httpMock.expectOne('/api/retry-limit').flush('first', { status: 503, statusText: 'Unavailable' });
    tick(1);
    httpMock.expectOne('/api/retry-limit').flush('second', { status: 503, statusText: 'Unavailable' });
    tick(1);
    httpMock.expectOne('/api/retry-limit').flush('third', { status: 503, statusText: 'Unavailable' });
    flushMicrotasks();

    expect(rejection instanceof HttpErrorResponse).toBeTrue();
    expect(httpMock.match('/api/retry-limit').length).toBe(0);
  }));

  it('does not retry mutations unless mutations is explicitly enabled', fakeAsync(() => {
    let defaultError: unknown;
    void service
      .post('/api/retry-mutation-default', { value: 1 }, { retry: { attempts: 1, delayMs: 1 } })
      .catch(error => (defaultError = error));
    httpMock.expectOne('/api/retry-mutation-default').flush('fail', { status: 503, statusText: 'Unavailable' });
    tick(1);
    flushMicrotasks();
    expect(defaultError instanceof HttpErrorResponse).toBeTrue();
    expect(httpMock.match('/api/retry-mutation-default').length).toBe(0);

    let result: unknown;
    void service.post('/api/retry-mutation-opt-in', { value: 1 }, { retry: { attempts: 1, delayMs: 1, mutations: true } }).then(
      value => (result = value),
      () => undefined
    );
    httpMock.expectOne('/api/retry-mutation-opt-in').flush('fail', { status: 503, statusText: 'Unavailable' });
    tick(1);
    httpMock.expectOne('/api/retry-mutation-opt-in').flush({ saved: true });
    flushMicrotasks();
    expect(result).toEqual({ saved: true });
  }));

  it('uses retryWhen with a one-based retry attempt', fakeAsync(() => {
    const predicateCalls: { error: unknown; attempt: number }[] = [];
    let result: unknown;
    void service
      .get('/api/retry-predicate', {
        retry: {
          attempts: 1,
          delayMs: 1,
          retryWhen: (error, attempt) => {
            predicateCalls.push({ error, attempt });
            return error instanceof HttpErrorResponse && error.status === 409;
          },
        },
      })
      .then(
        value => (result = value),
        () => undefined
      );

    httpMock.expectOne('/api/retry-predicate').flush('conflict', { status: 409, statusText: 'Conflict' });
    tick(1);
    httpMock.expectOne('/api/retry-predicate').flush({ resolved: true });
    flushMicrotasks();

    expect(predicateCalls.length).toBe(1);
    expect(predicateCalls[0].attempt).toBe(1);
    expect(result).toEqual({ resolved: true });
  }));

  it('aborting during retry backoff prevents the next attempt', fakeAsync(() => {
    const controller = new AbortController();
    let rejectionName: string | undefined;
    void service
      .get('/api/retry-abort', {
        signal: controller.signal,
        retry: { attempts: 2, delayMs: 100 },
      })
      .catch(error => (rejectionName = error instanceof Error ? error.name : 'unknown'));

    httpMock.expectOne('/api/retry-abort').flush('fail', { status: 503, statusText: 'Unavailable' });
    controller.abort();
    tick(100);
    flushMicrotasks();

    expect(httpMock.match('/api/retry-abort').length).toBe(0);
    expect(rejectionName).toBe('AbortError');
  }));

  it('can retry a timeout and abort the active retry safely', fakeAsync(() => {
    const controller = new AbortController();
    let rejectionName: string | undefined;
    void service
      .get('/api/timeout-retry-abort', {
        signal: controller.signal,
        timeout: 10,
        retry: { attempts: 1, delayMs: 1 },
      })
      .catch(error => (rejectionName = error instanceof Error ? error.name : 'unknown'));

    const first = httpMock.expectOne('/api/timeout-retry-abort');
    tick(10);
    expect(first.cancelled).toBeTrue();
    tick(1);
    const second = httpMock.expectOne('/api/timeout-retry-abort');
    controller.abort();
    expect(second.cancelled).toBeTrue();
    flushMicrotasks();

    expect(rejectionName).toBe('AbortError');
  }));

  it('cancels in-flight work when the service injector is destroyed', async () => {
    const promise = service.get('/api/destroy-pending');
    const outcome = promise.then(
      () => 'resolved',
      error => (error instanceof Error ? error.name : 'unknown')
    );
    const req = httpMock.expectOne('/api/destroy-pending');

    TestBed.resetTestingModule();
    expect(req.cancelled).toBeTrue();
    if (!req.cancelled) req.flush({ stale: true });
    await expectAsync(outcome).toBeResolvedTo('AbortError');
  });

  it('clears replay timers when the service injector is destroyed', fakeAsync(() => {
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
    void service.get('/api/destroy-timer', { dedupeWindowMs: 10000 });
    httpMock.expectOne('/api/destroy-timer').flush({ ok: true });
    flushMicrotasks();

    TestBed.resetTestingModule();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  }));

  it('autoCache:false bypasses deduplication — two distinct requests are made', async () => {
    const p1 = service.post('/api/side-effect', { x: 1 }, { autoCache: false });
    const p2 = service.post('/api/side-effect', { x: 1 }, { autoCache: false });

    const reqs = httpMock.match('/api/side-effect');
    expect(reqs.length).toBe(2);
    reqs[0].flush({ n: 1 });
    reqs[1].flush({ n: 2 });
    await Promise.all([p1, p2]);
  });

  // ─── handler: mapResponse ────────────────────────────────────────────────────

  it('accepts a narrow typed mapResponse callback without unsafe casts', async () => {
    interface MyRawResponse {
      data: string[];
    }

    const handler: SdApiHandler = {
      hosts: ['https://typed.example.com'],
      mapResponse: (response: MyRawResponse) => response.data,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SdCacheService,
        { provide: SD_API_CONFIG, multi: true, useValue: { handlers: [handler] } },
      ],
    });
    service = TestBed.inject(SdApiService);
    httpMock = TestBed.inject(HttpTestingController);

    const promise = service.get<string[]>('https://typed.example.com/items');
    httpMock.expectOne('https://typed.example.com/items').flush({ data: ['typed'] });
    await expectAsync(promise).toBeResolvedTo(['typed']);
  });

  it('uses handler mapResponse when URL matches a registered host', async () => {
    TestBed.resetTestingModule();
    const config: ISdApiConfiguration = {
      handlers: [
        {
          hosts: ['https://api.example.com'],
          mapResponse: response => {
            if (response !== null && typeof response === 'object' && 'data' in response) {
              return response.data ?? response;
            }
            return response;
          },
        },
      ],
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SdCacheService,
        { provide: SD_API_CONFIG, multi: true, useValue: config },
      ],
    });
    service = TestBed.inject(SdApiService);
    httpMock = TestBed.inject(HttpTestingController);

    const promise = service.get('https://api.example.com/users');
    const req = httpMock.expectOne('https://api.example.com/users');
    req.flush({ data: [{ id: 1 }], meta: {} });
    const result = await promise;
    expect(result).toEqual([{ id: 1 }]);
  });

  // ─── handler: no match when URL prefix differs ────────────────────────────────

  it('no handler matched when URL does not start with registered host', async () => {
    TestBed.resetTestingModule();
    const config: ISdApiConfiguration = {
      handlers: [
        {
          hosts: ['https://api.example.com'],
          mapResponse: () => 'MAPPED',
        },
      ],
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SdCacheService,
        { provide: SD_API_CONFIG, multi: true, useValue: config },
      ],
    });
    service = TestBed.inject(SdApiService);
    httpMock = TestBed.inject(HttpTestingController);

    // URL does NOT start with 'https://api.example.com' → mapResponse not applied
    const promise = service.get('/api/local/users');
    const req = httpMock.expectOne('/api/local/users');
    req.flush({ id: 5 });
    const result = await promise;
    expect(result).toEqual({ id: 5 }); // raw body, not 'MAPPED'
  });

  // ─── responseType ────────────────────────────────────────────────────────────

  it("accepts observe:'body' and still resolves the response body", async () => {
    const promise = service.get<{ value: string }>('/api/observe-body', { observe: 'body' });
    const req = httpMock.expectOne('/api/observe-body');
    req.flush({ value: 'body' });

    await expectAsync(promise).toBeResolvedTo({ value: 'body' });
  });

  it('forwards responseType to HttpClient (e.g. blob)', async () => {
    const promise = service.get<Blob>('/api/file', { responseType: 'blob' });
    const req = httpMock.expectOne('/api/file');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['data']), { status: 200, statusText: 'OK' });
    const result = await promise;
    expect(result).toBeInstanceOf(Blob);
  });

  // ─── uploadFile ──────────────────────────────────────────────────────────────

  it('uploadFile() throws "Invalid file extension" when filename has no dot', async () => {
    const fileWithNoDot = new File(['content'], 'filewithoutdot', { type: 'text/plain' });
    await expectAsync(service.uploadFile('/api/upload', fileWithNoDot)).toBeRejectedWithError('Invalid file extension');
  });

  it('uploadFile() returns null when file is falsy', async () => {
    const result = await service.uploadFile('/api/upload', null);
    expect(result).toBeNull();
  });

  it('uploadFile() sends FormData with field "file" as POST', async () => {
    const file = new File(['hello'], 'photo.png', { type: 'image/png' });
    const promise = service.uploadFile('/api/upload', file);
    const req = httpMock.expectOne('/api/upload');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    expect(req.request.body.get('file')).toBeTruthy();
    req.flush({ url: 'https://cdn.example.com/photo.png' });
    const result = await promise;
    expect(result).toEqual({ url: 'https://cdn.example.com/photo.png' });
  });
});

function configureSynchronousHttp(sourceFactory: (request: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>): {
  service: SdApiService;
  requestSpy: jasmine.Spy<(request: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>>;
} {
  TestBed.resetTestingModule();
  const requestSpy = jasmine
    .createSpy<(request: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>>('request')
    .and.callFake(sourceFactory);
  TestBed.configureTestingModule({
    providers: [SdCacheService, { provide: HttpClient, useValue: { request: requestSpy } }],
  });
  return { service: TestBed.inject(SdApiService), requestSpy };
}

describe('SdApiService synchronous source lifecycle', () => {
  it('registers a zero-window request before a synchronous success can evict it', async () => {
    let generation = 0;
    const sync = configureSynchronousHttp(() => of(new HttpResponse({ body: { generation: ++generation } })));

    const first = sync.service.get('/api/synchronous-success', { dedupeWindowMs: 0 });
    const second = sync.service.get('/api/synchronous-success', { dedupeWindowMs: 0 });

    await expectAsync(first).toBeResolvedTo({ generation: 1 });
    await expectAsync(second).toBeResolvedTo({ generation: 2 });
    expect(sync.requestSpy).toHaveBeenCalledTimes(2);
    TestBed.resetTestingModule();
  });

  it('registers a request before a synchronous error can evict it', async () => {
    let generation = 0;
    const sync = configureSynchronousHttp(() => throwError(() => new Error(`synchronous-${++generation}`)));

    const first = sync.service
      .get('/api/synchronous-error', { dedupeWindowMs: 0 })
      .catch(error => (error instanceof Error ? error.message : 'unknown'));
    const second = sync.service
      .get('/api/synchronous-error', { dedupeWindowMs: 0 })
      .catch(error => (error instanceof Error ? error.message : 'unknown'));

    await expectAsync(first).toBeResolvedTo('synchronous-1');
    await expectAsync(second).toBeResolvedTo('synchronous-2');
    expect(sync.requestSpy).toHaveBeenCalledTimes(2);
    TestBed.resetTestingModule();
  });

  it('rejects and evicts when a source completes without a response', fakeAsync(() => {
    const sync = configureSynchronousHttp(() => EMPTY);
    let firstError: unknown;
    let secondError: unknown;

    void sync.service.get('/api/empty-response').catch(error => (firstError = error));
    flushMicrotasks();
    expect(firstError instanceof Error ? firstError.message : firstError).toBe('HTTP request completed without a response');

    void sync.service.get('/api/empty-response').catch(error => (secondError = error));
    flushMicrotasks();
    expect(secondError instanceof Error ? secondError.message : secondError).toBe('HTTP request completed without a response');
    expect(sync.requestSpy).toHaveBeenCalledTimes(2);

    TestBed.resetTestingModule();
    flushMicrotasks();
  }));
});
