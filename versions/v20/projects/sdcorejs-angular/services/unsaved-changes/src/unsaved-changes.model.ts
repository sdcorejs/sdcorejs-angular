import { Signal } from '@angular/core';

export type SdUnsavedChangesMaybeAsync<T> = T | PromiseLike<T>;
export type SdUnsavedChangesDirtySource = boolean | Signal<boolean> | (() => boolean);
export type SdUnsavedChangesDecision = 'save' | 'discard' | 'cancel';
export type SdUnsavedChangesReason = 'navigation' | 'close' | 'manual';

export interface SdUnsavedChangesWatcher {
  readonly id: string;
  readonly scope?: unknown;
  readonly isDirty: SdUnsavedChangesDirtySource;
  readonly message?: string;
  readonly save?: () => SdUnsavedChangesMaybeAsync<void | boolean>;
  readonly reset?: () => SdUnsavedChangesMaybeAsync<void | boolean>;
  readonly discard?: () => SdUnsavedChangesMaybeAsync<void | boolean>;
  readonly cleanup?: () => void;
}

export interface SdUnsavedChangesPromptContext {
  readonly reason: SdUnsavedChangesReason;
  readonly scope?: unknown;
  readonly message: string;
  readonly watchers: readonly SdUnsavedChangesRegistration[];
}

export interface SdUnsavedChangesConfirmationAdapter {
  confirm(context: SdUnsavedChangesPromptContext): SdUnsavedChangesMaybeAsync<SdUnsavedChangesDecision | boolean>;
}

export interface SdUnsavedChangesRegistration {
  readonly id: string;
  readonly scope?: unknown;
  readonly message?: string;
  readonly destroyed: Signal<boolean>;
  readonly dirty: Signal<boolean>;
  markDirty(): void;
  markPristine(): void;
  save(): Promise<boolean>;
  reset(): Promise<boolean>;
  discard(): Promise<boolean>;
  destroy(): void;
}

export interface SdUnsavedChangesConfirmOptions {
  readonly scope?: unknown;
  readonly reason?: SdUnsavedChangesReason;
}
