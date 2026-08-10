# Unsaved Changes

Scoped registry for dirty state, confirmation, browser unload protection, Angular route guards, FormGroup snapshots, and additive close hooks.

## Import

```ts
import {
  SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER,
  SdUnsavedChangesService,
  createSdUnsavedChangesCloseGuard,
  registerSdUnsavedChangesForm,
  sdUnsavedChangesGuard,
} from '@sdcorejs/angular/services/unsaved-changes';
```

## Register a watcher

```ts
readonly dirty = signal(false);
readonly unsaved = inject(SdUnsavedChangesService);
readonly registration = this.unsaved.register({
  id: 'customer-editor',
  scope: this.customerId,
  isDirty: this.dirty,
  message: 'Customer has unsaved changes.',
  save: async () => {
    await this.api.save();
    this.dirty.set(false);
  },
  discard: () => this.dirty.set(false),
});
```

`id` is idempotent inside one `scope`. The same id may be reused in a different scope. Always call `registration.destroy()` when a feature-scoped registration is no longer valid.

## Router guard

```ts
export const routes: Routes = [
  {
    path: 'customers/:id',
    component: CustomerEditorComponent,
    canDeactivate: [sdUnsavedChangesGuard],
  },
];
```

The default functional guard checks the whole registry. For a feature scope, call `confirmLeave({ scope, reason: 'navigation' })` from a small application guard.

## FormGroup adapter

```ts
readonly formRef = registerSdUnsavedChangesForm(this.unsaved, this.form, {
  id: 'customer-form',
  scope: this.customerId,
  save: value => this.api.save(value),
});
```

The adapter snapshots `getRawValue()`. `reset()` and `discard()` restore that snapshot unless custom callbacks are supplied. A successful `save()` promotes the saved value to the new snapshot. Destroying the registration unsubscribes from `form.events`.

## Modal, drawer, and tab close hooks

```ts
readonly beforeClose = createSdUnsavedChangesCloseGuard(this.unsaved, {
  scope: this.customerId,
});
```

```html
<sd-modal [beforeClose]="beforeClose" (sdCloseError)="report($event)">...</sd-modal>
<sd-side-drawer [beforeClose]="beforeClose" (sdCloseError)="report($event)">...</sd-side-drawer>
<sd-tab [beforeClose]="beforeClose" (sdCloseError)="report($event)">...</sd-tab>
```

The hooks are additive. Without `beforeClose`, close remains synchronous and backward-compatible. With a hook, concurrent close requests share one promise. `false`, a thrown error, or a rejected promise keeps the surface open.

For tab-router pages, inject `SD_TAB` and assign the same guard to `tab.beforeClose`. TabRouter also fails closed when the callback throws or rejects.

## Custom confirmation adapter

```ts
providers: [
  {
    provide: SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER,
    useValue: {
      confirm: async context => openSaveDiscardCancelDialog(context),
    },
  },
];
```

An adapter returns `'save'`, `'discard'`, `'cancel'`, or a boolean (`true` means discard). The built-in browser adapter uses `window.confirm`, maps accept to discard, and returns cancel when no browser confirmation API exists.

## Service API

| Member                   | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `registrations`          | Read-only signal of active registration refs.              |
| `dirty`                  | `true` when any active watcher is dirty.                   |
| `register(watcher)`      | Register or return the existing ref for the same scope/id. |
| `hasChanges(scope?)`     | Check the whole registry or one scope.                     |
| `confirmLeave(options?)` | Prompt once per scope and apply save/discard/cancel.       |
| `saveAll(scope?)`        | Save dirty watchers sequentially; stop on failure.         |
| `resetAll(scope?)`       | Reset dirty watchers sequentially; stop on failure.        |
| `discardAll(scope?)`     | Discard dirty watchers sequentially; stop on failure.      |

## Browser and SSR behavior

- A `beforeunload` listener exists only while at least one watcher is dirty.
- The listener is removed as soon as the registry becomes clean and during service teardown.
- `SD_UNSAVED_CHANGES_WINDOW` may be overridden for tests or SSR; `null` is supported.
- Confirmation and watcher callback exceptions fail closed.
- Prompt coalescing is scope-aware, so one scope cannot reuse another scope's decision.
