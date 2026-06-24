import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SdApiService } from './api.service';
import { SdCacheService } from '@sdcorejs/angular/services/cache';
import { ISdApiConfiguration, SD_API_CONFIG } from './api.model';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Flush a pending request and return the captured req object. */
function flushOne(httpMock: HttpTestingController, url: string, method: string, body: any) {
  const req = httpMock.expectOne(url);
  expect(req.request.method).toBe(method);
  req.flush(body);
  return req;
}

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

  it('uses handler mapResponse when URL matches a registered host', async () => {
    TestBed.resetTestingModule();
    const config: ISdApiConfiguration = {
      handlers: [
        {
          hosts: ['https://api.example.com'],
          mapResponse: ((res: any) => res?.data ?? res) as any,
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
          mapResponse: ((res: any) => 'MAPPED') as any,
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

  it('forwards responseType to HttpClient (e.g. blob)', async () => {
    const promise = service.get<Blob>('/api/file', { responseType: 'blob' } as any);
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
    const result = await service.uploadFile('/api/upload', null as any);
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
