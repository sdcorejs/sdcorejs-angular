import { DestroyRef, Injectable, computed, effect, inject, isSignal, signal } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import {
  SdUnsavedChangesConfirmOptions,
  SdUnsavedChangesDecision,
  SdUnsavedChangesRegistration,
  SdUnsavedChangesWatcher,
} from './unsaved-changes.model';
import { SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER, SD_UNSAVED_CHANGES_WINDOW } from './unsaved-changes.tokens';

interface RegistryEntry {
  readonly watcher: SdUnsavedChangesWatcher;
  readonly dirtyOverride: ReturnType<typeof signal<boolean | undefined>>;
  readonly destroyed: ReturnType<typeof signal<boolean>>;
  readonly dirty: ReturnType<typeof computed<boolean>>;
  readonly ref: SdUnsavedChangesRegistration;
}

@Injectable({ providedIn: 'root' })
export class SdUnsavedChangesService {
  readonly #adapter = inject(SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER);
  readonly #window = inject(SD_UNSAVED_CHANGES_WINDOW);
  readonly #i18n = inject(I18nService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #entries = signal<readonly RegistryEntry[]>([]);
  readonly #pendingPrompts = new Map<unknown, Promise<boolean>>();

  readonly registrations = computed(() => this.#entries().map(entry => entry.ref));
  readonly dirty = computed(() => this.#dirtyEntries().length > 0);

  constructor() {
    effect(onCleanup => {
      if (!this.#window || !this.dirty()) return;
      const listener = (event: BeforeUnloadEvent): void => {
        const message = this.#dirtyEntries()[0]?.watcher.message ?? this.#i18n.t('core.service.unsaved-changes.message');
        event.preventDefault();
        event.returnValue = message;
      };
      this.#window.addEventListener('beforeunload', listener);
      onCleanup(() => this.#window?.removeEventListener('beforeunload', listener));
    });

    this.#destroyRef.onDestroy(() => {
      for (const entry of this.#entries()) {
        if (entry.destroyed()) continue;
        entry.destroyed.set(true);
        this.#runCleanup(entry.watcher);
      }
      this.#entries.set([]);
      this.#pendingPrompts.clear();
    });
  }

  register(watcher: SdUnsavedChangesWatcher): SdUnsavedChangesRegistration {
    const existing = this.#entries().find(entry => entry.watcher.id === watcher.id && Object.is(entry.watcher.scope, watcher.scope));
    if (existing) {
      if (existing.watcher !== watcher) this.#runCleanup(watcher);
      return existing.ref;
    }

    const dirtyOverride = signal<boolean | undefined>(undefined);
    const destroyed = signal(false);
    const dirty = computed(() => !destroyed() && (dirtyOverride() ?? readDirty(watcher.isDirty)));
    const entry = {} as RegistryEntry;
    const ref: SdUnsavedChangesRegistration = {
      id: watcher.id,
      scope: watcher.scope,
      message: watcher.message,
      destroyed: destroyed.asReadonly(),
      dirty,
      markDirty: () => dirtyOverride.set(true),
      markPristine: () => dirtyOverride.set(false),
      save: () => this.#runEntryAction(entry, 'save'),
      reset: () => this.#runEntryAction(entry, 'reset'),
      discard: () => this.#runEntryAction(entry, 'discard'),
      destroy: () => this.#destroyEntry(entry),
    };
    Object.assign(entry, { watcher, dirtyOverride, destroyed, dirty, ref });
    this.#entries.update(entries => [...entries, entry]);
    return ref;
  }

  hasChanges(scope?: unknown): boolean {
    return this.#dirtyEntries(scope).length > 0;
  }

  confirmLeave(options: SdUnsavedChangesConfirmOptions = {}): Promise<boolean> {
    if (!this.hasChanges(options.scope)) return Promise.resolve(true);
    const promptKey = options.scope;
    const existingPrompt = this.#pendingPrompts.get(promptKey);
    if (existingPrompt) return existingPrompt;

    const watchers = this.#dirtyEntries(options.scope).map(entry => entry.ref);
    const message = watchers.find(watcher => watcher.message)?.message ?? this.#i18n.t('core.service.unsaved-changes.message');
    const run = async (): Promise<boolean> => {
      try {
        const rawDecision = await Promise.resolve(
          this.#adapter.confirm({ reason: options.reason ?? 'manual', scope: options.scope, message, watchers })
        );
        const decision: SdUnsavedChangesDecision = typeof rawDecision === 'boolean' ? (rawDecision ? 'discard' : 'cancel') : rawDecision;
        if (decision === 'save') return this.saveAll(options.scope);
        if (decision === 'discard') return this.discardAll(options.scope);
        return false;
      } catch {
        return false;
      }
    };

    const pending = run().finally(() => {
      if (this.#pendingPrompts.get(promptKey) === pending) this.#pendingPrompts.delete(promptKey);
    });
    this.#pendingPrompts.set(promptKey, pending);
    return pending;
  }

  saveAll(scope?: unknown): Promise<boolean> {
    return this.#runAll('save', scope);
  }

  resetAll(scope?: unknown): Promise<boolean> {
    return this.#runAll('reset', scope);
  }

  discardAll(scope?: unknown): Promise<boolean> {
    return this.#runAll('discard', scope);
  }

  async #runAll(action: 'save' | 'reset' | 'discard', scope?: unknown): Promise<boolean> {
    for (const entry of this.#dirtyEntries(scope)) {
      if (!(await this.#runEntryAction(entry, action))) return false;
    }
    return true;
  }

  async #runEntryAction(entry: RegistryEntry, action: 'save' | 'reset' | 'discard'): Promise<boolean> {
    if (entry.destroyed()) return true;
    try {
      const callback = entry.watcher[action];
      const result = callback ? await Promise.resolve(callback()) : undefined;
      if (result === false) return false;
      // A callback owns its underlying dirty source (for example FormGroup
      // marks itself pristine). Only synthesize pristine state when there is
      // no callback capable of updating that source.
      entry.dirtyOverride.set(callback ? undefined : false);
      return true;
    } catch {
      return false;
    }
  }

  #dirtyEntries(scope?: unknown): RegistryEntry[] {
    return this.#entries().filter(entry => (scope === undefined || Object.is(entry.watcher.scope, scope)) && entry.dirty());
  }

  #destroyEntry(entry: RegistryEntry): void {
    if (entry.destroyed()) return;
    entry.destroyed.set(true);
    this.#runCleanup(entry.watcher);
    this.#entries.update(entries => entries.filter(candidate => candidate !== entry));
  }

  #runCleanup(watcher: SdUnsavedChangesWatcher): void {
    try {
      watcher.cleanup?.();
    } catch {
      // Cleanup must never prevent registry teardown.
    }
  }
}

function readDirty(source: SdUnsavedChangesWatcher['isDirty']): boolean {
  if (typeof source === 'boolean') return source;
  if (isSignal(source)) return !!source();
  return !!source();
}
