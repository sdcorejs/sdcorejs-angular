import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { SD_TASK_EVENT_SOURCE_FACTORY, SD_TASK_RANDOM, SdTaskEventSource, SdTaskEventSourceFactory } from './task.tokens';
import { SdTaskService } from './task.service';
import { SdTaskState } from './task.model';

class FakeEventSource implements SdTaskEventSource {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readonly close = jasmine.createSpy('close');

  open(): void {
    this.onopen?.(new Event('open'));
  }

  message(data: string): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  fail(): void {
    this.onerror?.(new Event('error'));
  }
}

class FakeEventSourceFactory implements SdTaskEventSourceFactory {
  readonly sources: FakeEventSource[] = [];
  readonly create = jasmine.createSpy('create').and.callFake(() => {
    const source = new FakeEventSource();
    this.sources.push(source);
    return source;
  });
}

describe('SdTaskService', () => {
  let service: SdTaskService;
  let eventSources: FakeEventSourceFactory;

  beforeEach(() => {
    eventSources = new FakeEventSourceFactory();
    TestBed.configureTestingModule({
      providers: [
        { provide: SD_TASK_EVENT_SOURCE_FACTORY, useValue: eventSources },
        { provide: SD_TASK_RANDOM, useValue: () => 1 },
      ],
    });
    service = TestBed.inject(SdTaskService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('supports every task status and normalizes determinate progress', () => {
    const ref = service.watch({
      id: 'import-1',
      initialState: { id: 'import-1', status: 'idle' },
      source: { mode: 'manual' },
    });

    for (const status of ['queued', 'running', 'succeeded', 'failed', 'cancelled'] as const) {
      service.update('import-1', { status, progress: status === 'running' ? 130 : undefined });
      expect(ref.state().status).toBe(status);
    }
    service.update('import-1', { status: 'running', progress: 130 });
    expect(ref.state().progress).toBe(100);
    service.update('import-1', { progress: -10 });
    expect(ref.state().progress).toBe(0);
  });

  it('shares one polling connection between duplicate subscribers and tears down after the last lease', () => {
    const request = deferred<SdTaskState>();
    const load = jasmine.createSpy('load').and.returnValue(request.promise);
    const first = service.watch({ id: 'job-1', source: { mode: 'poll', load, intervalMs: 1000 } });
    const ignoredLoad = jasmine.createSpy('ignoredLoad');
    const second = service.watch({ id: 'job-1', source: { mode: 'poll', load: ignoredLoad } });

    expect(first.state).toBe(second.state);
    expect(first.subscriberCount()).toBe(2);
    expect(load).toHaveBeenCalledTimes(1);
    expect(ignoredLoad).not.toHaveBeenCalled();

    first.destroy();
    expect(second.subscriberCount()).toBe(1);
    expect(load.calls.mostRecent().args[0].signal.aborted).toBeFalse();
    second.destroy();
    expect(load.calls.mostRecent().args[0].signal.aborted).toBeTrue();
    expect(service.get('job-1')).toBeUndefined();
  });

  it('never overlaps polling requests', fakeAsync(() => {
    const first = deferred<SdTaskState>();
    const second = deferred<SdTaskState>();
    const load = jasmine.createSpy('load').and.returnValues(first.promise, second.promise);
    service.watch({ id: 'job-1', source: { mode: 'poll', load, intervalMs: 100 } });

    tick(500);
    expect(load).toHaveBeenCalledTimes(1);

    first.resolve({ id: 'job-1', status: 'running', progress: 10 });
    flushMicrotasks();
    tick(99);
    expect(load).toHaveBeenCalledTimes(1);
    tick(1);
    expect(load).toHaveBeenCalledTimes(2);
  }));

  it('applies bounded exponential polling retry with deterministic jitter', fakeAsync(() => {
    const load = jasmine.createSpy('load').and.rejectWith(new Error('offline'));
    const ref = service.watch({
      id: 'job-1',
      source: {
        mode: 'poll',
        load,
        retry: { maxAttempts: 2, initialDelayMs: 100, backoff: 2, maxDelayMs: 250, jitter: 0.2 },
      },
    });
    flushMicrotasks();

    tick(119);
    expect(load).toHaveBeenCalledTimes(1);
    tick(1);
    expect(load).toHaveBeenCalledTimes(2);
    flushMicrotasks();
    tick(239);
    expect(load).toHaveBeenCalledTimes(2);
    tick(1);
    expect(load).toHaveBeenCalledTimes(3);
    flushMicrotasks();

    expect(ref.connection()).toBe('error');
    expect(ref.error()).toEqual(jasmine.any(Error));
    tick(1000);
    expect(load).toHaveBeenCalledTimes(3);
  }));

  it('updates SSE state, reconnects after transport/parser errors and tears down at terminal state', fakeAsync(() => {
    const ref = service.watch({
      id: 'job-1',
      source: {
        mode: 'sse',
        url: '/tasks/job-1/events',
        retry: { maxAttempts: 3, initialDelayMs: 100, backoff: 1, jitter: 0 },
      },
    });
    expect(eventSources.create).toHaveBeenCalledOnceWith('/tasks/job-1/events', undefined);

    eventSources.sources[0].open();
    expect(ref.connection()).toBe('open');
    eventSources.sources[0].message(JSON.stringify({ id: 'job-1', status: 'running', progress: 25 }));
    flushMicrotasks();
    expect(ref.state().progress).toBe(25);

    eventSources.sources[0].message('{invalid');
    flushMicrotasks();
    expect(eventSources.sources[0].close).toHaveBeenCalledTimes(1);
    expect(ref.connection()).toBe('reconnecting');
    tick(100);
    expect(eventSources.sources).toHaveSize(2);

    eventSources.sources[1].fail();
    expect(eventSources.sources[1].close).toHaveBeenCalledTimes(1);
    tick(100);
    eventSources.sources[2].open();
    eventSources.sources[2].message(JSON.stringify({ id: 'job-1', status: 'succeeded', progress: 100 }));
    flushMicrotasks();

    expect(ref.state().status).toBe('succeeded');
    expect(ref.connection()).toBe('closed');
    expect(eventSources.sources[2].close).toHaveBeenCalledTimes(1);
    tick(1000);
    expect(eventSources.sources).toHaveSize(3);
  }));

  it('coalesces cancellation, stops the connection on success and fails closed on cancellation error', async () => {
    const cancelRequest = deferred<void>();
    const cancel = jasmine.createSpy('cancel').and.returnValue(cancelRequest.promise);
    const load = jasmine.createSpy('load').and.returnValue(new Promise<SdTaskState>(() => undefined));
    const ref = service.watch({ id: 'job-1', source: { mode: 'poll', load, cancel } });

    expect(ref.canCancel()).toBeTrue();
    const first = ref.cancel();
    const second = ref.cancel();
    expect(second).toBe(first);
    expect(ref.canCancel()).toBeFalse();
    expect(cancel).toHaveBeenCalledTimes(1);
    cancelRequest.resolve();
    expect(await first).toBeTrue();
    expect(ref.state().status).toBe('cancelled');
    expect(load.calls.mostRecent().args[0].signal.aborted).toBeTrue();

    const failed = service.watch({
      id: 'job-2',
      source: { mode: 'manual', cancel: () => Promise.reject(new Error('cancel failed')) },
      initialState: { id: 'job-2', status: 'running' },
    });
    expect(await failed.cancel()).toBeFalse();
    expect(failed.state().status).toBe('running');
    expect(failed.error()).toEqual(jasmine.any(Error));
  });

  it('rejects cancellation from a destroyed lease and ignores late cancellation state', async () => {
    const cancelRequest = deferred<void>();
    const cancel = jasmine.createSpy('cancel').and.returnValue(cancelRequest.promise);
    const ref = service.watch({
      id: 'job-1',
      initialState: { id: 'job-1', status: 'running' },
      source: { mode: 'manual', cancel },
    });

    const pending = ref.cancel();
    ref.destroy();
    cancelRequest.resolve();

    expect(await pending).toBeTrue();
    expect(ref.state().status).toBe('running');
    expect(service.get('job-1')).toBeUndefined();
    expect(await ref.cancel()).toBeFalse();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('ignores retry while a connection is healthy', fakeAsync(() => {
    const load = jasmine.createSpy('load').and.resolveTo({ id: 'job-1', status: 'running' });
    const ref = service.watch({ id: 'job-1', source: { mode: 'poll', load, intervalMs: 1000 } });
    flushMicrotasks();

    ref.retry();
    flushMicrotasks();

    expect(ref.canRetry()).toBeFalse();
    expect(load).toHaveBeenCalledTimes(1);
  }));

  it('retries an exhausted connection and clears the previous transport error', fakeAsync(() => {
    let shouldFail = true;
    const load = jasmine
      .createSpy('load')
      .and.callFake(() =>
        shouldFail ? Promise.reject(new Error('offline')) : Promise.resolve<SdTaskState>({ id: 'job-1', status: 'running', progress: 40 })
      );
    const ref = service.watch({
      id: 'job-1',
      source: { mode: 'poll', load, retry: { maxAttempts: 0 } },
    });
    flushMicrotasks();
    expect(ref.connection()).toBe('error');

    shouldFail = false;
    ref.retry();
    flushMicrotasks();
    expect(load).toHaveBeenCalledTimes(2);
    expect(ref.connection()).toBe('open');
    expect(ref.error()).toBeNull();
  }));

  it('is SSR-safe when EventSource is unavailable', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SD_TASK_EVENT_SOURCE_FACTORY, useValue: null }] });
    service = TestBed.inject(SdTaskService);

    const ref = service.watch({ id: 'server-job', source: { mode: 'sse', url: '/events' } });

    expect(ref.connection()).toBe('error');
    expect(ref.error()).toEqual(jasmine.any(Error));
    expect(ref.state().status).toBe('queued');
  });

  it('destroys timers, requests and event sources with the service injector', fakeAsync(() => {
    const load = jasmine.createSpy('load').and.resolveTo({ id: 'poll', status: 'running' });
    service.watch({ id: 'poll', source: { mode: 'poll', load, intervalMs: 100 } });
    service.watch({ id: 'sse', source: { mode: 'sse', url: '/events' } });
    flushMicrotasks();

    TestBed.resetTestingModule();
    tick(1000);

    expect(load).toHaveBeenCalledTimes(1);
    expect(eventSources.sources[0].close).toHaveBeenCalledTimes(1);
  }));
});

function deferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => (resolve = res));
  return { promise, resolve };
}
