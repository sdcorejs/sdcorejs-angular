import { HttpErrorResponse, HttpResponse, type HttpEvent, type HttpRequest } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { defer, map, NEVER, switchMap, throwError, timer, type Observable } from 'rxjs';
import { SD_PATTERN_CONFIGURATION } from '../../configurations/pattern.configuration';
import { readSessionValue, writeSessionValue } from '../session-state';
import { PatternMockError, type PatternMockErrorBody } from './mock-api.model';
import type { PatternMockBackend } from './mock-backend';

/** Error the toolbar makes every mock request return. */
export type PatternMockFailure = 'none' | '500' | 'timeout' | '404' | '403';

/** Read state for an exact GET path, e.g. "orders" or "customers/12/documents". */
export interface PatternMockReadOverride {
  /** Serve only the first `limit` records of the collection. */
  readonly limit?: number;
  /** `error-once` lets a retry succeed while other cards remain available. */
  readonly mode?: 'normal' | 'loading' | 'error' | 'error-once';
}

/** How long a simulated timeout waits before the request fails. */
export const PATTERN_MOCK_TIMEOUT_MS = 3000;

const STATE_KEY = 'sd-pattern.mock-api';

const STATUS_TEXT: Readonly<Record<number, string>> = {
  0: 'Unknown Error',
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  500: 'Internal Server Error',
};

const FAILURES: Readonly<Record<Exclude<PatternMockFailure, 'none' | 'timeout'>, PatternMockError>> = {
  '500': new PatternMockError(500, { message: 'Máy chủ gặp lỗi (mô phỏng 500).' }),
  '404': new PatternMockError(404, { message: 'Không tìm thấy bản ghi (mô phỏng 404).' }),
  '403': new PatternMockError(403, { message: 'Không có quyền thao tác (mô phỏng 403).' }),
};

/**
 * Toolbar state of the mock API (latency, simulated error, per-resource read overrides) and the lazily
 * created backend. Provided at the `/pattern` route by `provideSdPatterns()` when `mockApi` is on.
 */
@Injectable()
export class PatternMockApiState {
  readonly #configuration = inject(SD_PATTERN_CONFIGURATION);
  readonly #stored = readSessionValue<{
    latencyMs?: number;
    failure?: PatternMockFailure;
    reads?: Record<string, PatternMockReadOverride>;
  }>(STATE_KEY, {});
  readonly #latencyMs = signal(this.#stored.latencyMs ?? this.#configuration.latencyMs);
  readonly #failure = signal<PatternMockFailure>(this.#stored.failure ?? 'none');
  readonly #reads = signal<Readonly<Record<string, PatternMockReadOverride>>>(this.#stored.reads ?? {});
  #backend?: Promise<PatternMockBackend>;

  readonly latencyMs = this.#latencyMs.asReadonly();
  readonly failure = this.#failure.asReadonly();

  setLatency(latencyMs: number): void {
    this.#latencyMs.set(Math.max(0, latencyMs));
    this.#persist();
  }

  setFailure(failure: PatternMockFailure): void {
    this.#failure.set(failure);
    this.#persist();
  }

  /** Forces just the GET endpoint at this path; `undefined` removes the override. */
  setReadOverride(resource: string, override: PatternMockReadOverride | undefined): void {
    this.#reads.update(reads => {
      const { [resource]: _previous, ...others } = reads;
      return override ? { ...others, [resource]: override } : others;
    });
    this.#persist();
  }

  /** The backend, loaded on the first request so the seeds stay out of the host's bundle. */
  backend(): Promise<PatternMockBackend> {
    this.#backend ??= import('./mock-backend.factory').then(module => module.createPatternMockBackend(this.#configuration.storage));
    return this.#backend;
  }

  /** Throws away created, updated and deleted records. */
  async resetData(): Promise<void> {
    (await this.backend()).reset();
  }

  /** Answers a request whose URL is under `apiBaseUrl`; `segments` is the path after it. */
  respond(request: HttpRequest<unknown>, segments: readonly string[]): Observable<HttpEvent<unknown>> {
    const failure = this.#failure();
    const path = segments.join('/');
    const read = request.method === 'GET' ? this.#reads()[path] : undefined;
    if (read?.mode === 'loading') return NEVER;
    if (failure === 'timeout') {
      return timer(PATTERN_MOCK_TIMEOUT_MS).pipe(
        switchMap(() => throwError(() => this.#error(request, 0, { message: 'Hết thời gian chờ (mô phỏng).' })))
      );
    }
    return timer(this.#latencyMs()).pipe(
      switchMap(() => defer(() => this.backend())),
      map(backend => {
        const failOnce = read?.mode === 'error-once' && this.#reads()[path] === read;
        if (failOnce) this.setReadOverride(path, undefined);
        const simulated = read?.mode === 'error' || failOnce ? FAILURES['500'] : failure === 'none' ? undefined : FAILURES[failure];
        try {
          if (simulated) throw simulated;
          const result = backend.handle(request.method, segments, request.params, request.body, read?.limit);
          return new HttpResponse({ status: result.status ?? 200, statusText: 'OK', body: result.body, url: request.urlWithParams });
        } catch (error) {
          if (error instanceof PatternMockError) throw this.#error(request, error.status, error.body);
          throw error;
        }
      })
    );
  }

  #error(request: HttpRequest<unknown>, status: number, body: PatternMockErrorBody): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: STATUS_TEXT[status] ?? 'Error', error: body, url: request.urlWithParams });
  }

  #persist(): void {
    const reads = this.#reads();
    writeSessionValue(STATE_KEY, {
      latencyMs: this.#latencyMs(),
      failure: this.#failure(),
      ...(Object.keys(reads).length ? { reads } : {}),
    });
  }
}
