import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, SD_UNSAVED_CHANGES_WINDOW, SdUnsavedChangesWindow } from './unsaved-changes.tokens';
import { SdUnsavedChangesConfirmationAdapter } from './unsaved-changes.model';
import { SdUnsavedChangesService } from './unsaved-changes.service';

class FakeWindow implements SdUnsavedChangesWindow {
  readonly listeners = new Set<(event: BeforeUnloadEvent) => void>();
  addCount = 0;
  removeCount = 0;

  addEventListener(_type: 'beforeunload', listener: (event: BeforeUnloadEvent) => void): void {
    this.addCount += 1;
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'beforeunload', listener: (event: BeforeUnloadEvent) => void): void {
    this.removeCount += 1;
    this.listeners.delete(listener);
  }
}

describe('SdUnsavedChangesService', () => {
  let service: SdUnsavedChangesService;
  let windowRef: FakeWindow;
  let adapter: SdUnsavedChangesConfirmationAdapter;
  let confirm: jasmine.Spy;

  beforeEach(() => {
    windowRef = new FakeWindow();
    confirm = jasmine.createSpy('confirm').and.resolveTo('cancel');
    adapter = { confirm } as SdUnsavedChangesConfirmationAdapter;
    TestBed.configureTestingModule({
      providers: [
        { provide: SD_UNSAVED_CHANGES_WINDOW, useValue: windowRef },
        { provide: SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, useValue: adapter },
      ],
    });
    service = TestBed.inject(SdUnsavedChangesService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('tracks multiple scoped watchers and returns an idempotent registration ref', () => {
    const firstDirty = signal(true);
    const secondDirty = signal(false);
    const first = service.register({ id: 'editor', scope: 'page-a', isDirty: firstDirty });
    const duplicate = service.register({ id: 'editor', scope: 'page-a', isDirty: firstDirty });
    service.register({ id: 'settings', scope: 'page-b', isDirty: secondDirty });

    expect(duplicate).toBe(first);
    expect(service.registrations()).toHaveSize(2);
    expect(service.hasChanges()).toBeTrue();
    expect(service.hasChanges('page-a')).toBeTrue();
    expect(service.hasChanges('page-b')).toBeFalse();

    first.destroy();
    first.destroy();
    expect(service.registrations()).toHaveSize(1);
  });

  it('namespaces idempotent registration ids by scope', () => {
    const first = service.register({ id: 'editor', scope: 'page-a', isDirty: signal(true) });
    const second = service.register({ id: 'editor', scope: 'page-b', isDirty: signal(false) });

    expect(second).not.toBe(first);
    expect(service.registrations()).toHaveSize(2);
    expect(service.hasChanges('page-a')).toBeTrue();
    expect(service.hasChanges('page-b')).toBeFalse();
  });

  it('coalesces overlapping prompts and applies save, discard and cancel decisions', async () => {
    const dirty = signal(true);
    const save = jasmine.createSpy('save').and.callFake(() => dirty.set(false));
    service.register({ id: 'editor', isDirty: dirty, save });
    const pending = deferred<'save' | 'discard' | 'cancel'>();
    confirm.and.returnValue(pending.promise);

    const first = service.confirmLeave({ reason: 'navigation' });
    const second = service.confirmLeave({ reason: 'close' });

    expect(second).toBe(first);
    expect(confirm).toHaveBeenCalledTimes(1);
    pending.resolve('save');
    expect(await first).toBeTrue();
    expect(save).toHaveBeenCalledTimes(1);

    dirty.set(true);
    confirm.and.resolveTo('cancel');
    expect(await service.confirmLeave()).toBeFalse();
    expect(dirty()).toBeTrue();

    const discard = jasmine.createSpy('discard').and.callFake(() => dirty.set(false));
    service.register({ id: 'discardable', isDirty: dirty, discard });
    confirm.and.resolveTo('discard');
    expect(await service.confirmLeave()).toBeTrue();
    expect(discard).toHaveBeenCalledTimes(1);
  });

  it('does not share pending prompt results between different scopes', async () => {
    const firstDirty = signal(true);
    const secondDirty = signal(true);
    service.register({ id: 'editor', scope: 'page-a', isDirty: firstDirty, discard: () => firstDirty.set(false) });
    service.register({ id: 'editor', scope: 'page-b', isDirty: secondDirty, discard: () => secondDirty.set(false) });
    const firstDecision = deferred<'discard' | 'cancel'>();
    const secondDecision = deferred<'discard' | 'cancel'>();
    confirm.and.returnValues(firstDecision.promise, secondDecision.promise);

    const first = service.confirmLeave({ scope: 'page-a' });
    const second = service.confirmLeave({ scope: 'page-b' });

    expect(second).not.toBe(first);
    expect(confirm).toHaveBeenCalledTimes(2);
    firstDecision.resolve('discard');
    secondDecision.resolve('cancel');
    expect(await first).toBeTrue();
    expect(await second).toBeFalse();
    expect(firstDirty()).toBeFalse();
    expect(secondDirty()).toBeTrue();
  });

  it('runs watcher cleanup once on destroy and cleans ignored duplicate registrations', () => {
    const firstCleanup = jasmine.createSpy('firstCleanup');
    const duplicateCleanup = jasmine.createSpy('duplicateCleanup');
    const first = service.register({ id: 'editor', scope: 'page-a', isDirty: false, cleanup: firstCleanup });
    const duplicate = service.register({ id: 'editor', scope: 'page-a', isDirty: false, cleanup: duplicateCleanup });

    expect(duplicate).toBe(first);
    expect(duplicateCleanup).toHaveBeenCalledTimes(1);
    first.destroy();
    first.destroy();
    expect(firstCleanup).toHaveBeenCalledTimes(1);
  });

  it('does not clean up the active resource when the same watcher object is registered twice', () => {
    const cleanup = jasmine.createSpy('cleanup');
    const watcher = { id: 'editor', isDirty: false, cleanup };

    const first = service.register(watcher);
    expect(service.register(watcher)).toBe(first);
    expect(cleanup).not.toHaveBeenCalled();

    first.destroy();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('fails closed when confirmation or watcher actions throw', async () => {
    const dirty = signal(true);
    service.register({ id: 'editor', isDirty: dirty, save: () => Promise.reject(new Error('save failed')) });

    confirm.and.rejectWith(new Error('prompt failed'));
    expect(await service.confirmLeave()).toBeFalse();

    confirm.and.resolveTo('save');
    expect(await service.confirmLeave()).toBeFalse();
  });

  it('supports explicit save, reset and discard operations for dirty watchers', async () => {
    const dirty = signal(true);
    const save = jasmine.createSpy('save').and.callFake(() => dirty.set(false));
    const reset = jasmine.createSpy('reset').and.callFake(() => dirty.set(false));
    const discard = jasmine.createSpy('discard').and.callFake(() => dirty.set(false));
    service.register({ id: 'editor', isDirty: dirty, save, reset, discard });

    expect(await service.saveAll()).toBeTrue();
    dirty.set(true);
    expect(await service.resetAll()).toBeTrue();
    dirty.set(true);
    expect(await service.discardAll()).toBeTrue();
    expect(save).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(discard).toHaveBeenCalledTimes(1);
  });

  it('registers beforeunload only while dirty and cleans it up on destroy', () => {
    const dirty = signal(false);
    service.register({ id: 'editor', isDirty: dirty, message: 'Editor has changes' });
    TestBed.flushEffects();
    expect(windowRef.addCount).toBe(0);

    dirty.set(true);
    TestBed.flushEffects();
    expect(windowRef.addCount).toBe(1);
    expect(windowRef.listeners.size).toBe(1);

    const event = { preventDefault: jasmine.createSpy('preventDefault'), returnValue: '' } as unknown as BeforeUnloadEvent;
    windowRef.listeners.values().next().value?.(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe('Editor has changes');

    dirty.set(false);
    TestBed.flushEffects();
    expect(windowRef.removeCount).toBe(1);
    expect(windowRef.listeners.size).toBe(0);

    dirty.set(true);
    TestBed.flushEffects();
    TestBed.resetTestingModule();
    expect(windowRef.removeCount).toBe(2);
  });

  it('is SSR-safe when no browser window is available', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: SD_UNSAVED_CHANGES_WINDOW, useValue: null },
        { provide: SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, useValue: adapter },
      ],
    });
    service = TestBed.inject(SdUnsavedChangesService);
    service.register({ id: 'server', isDirty: signal(true) });

    expect(() => TestBed.flushEffects()).not.toThrow();
    expect(service.hasChanges()).toBeTrue();
  });
});

function deferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => (resolve = res));
  return { promise, resolve };
}
