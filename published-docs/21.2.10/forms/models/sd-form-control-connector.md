# Internal form-control connector

**API:** `ɵsdFormControlConnector<TModel, TControl>`
**Import path:** `@sdcorejs/angular/forms/models`
**Audience:** SDCoreJS control maintainers; the `ɵ` prefix marks an internal compatibility surface.

The connector centralizes the lifecycle shared by form controls without changing their external `[(model)]`, `[form]`, `name`, validation, disabled, readonly or viewed bindings.

## Responsibilities

- Register and unregister the internal Angular control when the parent or name changes.
- Avoid overwriting another control during dynamic registration.
- Synchronize model and control values without feedback loops.
- Rebuild validators and required/error state when inputs change.
- Preserve touched/dirty timing and allow control-specific model/control conversion.
- Stop effects/subscriptions and unregister on destroy.

Controls with special display representations, such as masks and canonical time strings, supply conversion/equality hooks instead of copying registration logic.

## Usage boundary

Application templates do not call the connector. Library controls create it inside an Angular injection context and expose only their established public bindings. Direct control subclasses should prefer composition unless they already depend on a documented inherited component contract.

## Migration and verification

Existing consumer templates require no connector-specific change. Applications that directly instantiate component classes or change the parent/name dynamically should run lifecycle tests. Contract coverage includes initial/dynamic registration, collisions, parent changes, model/control loop suppression, validation timing, disabled state and teardown.

## Other internal exports from `@sdcorejs/angular/forms/models`

The entry point re-exports a second `ɵ`-prefixed helper. **Everything with a `ɵ` prefix is internal and is NOT covered by SemVer** — it can be renamed, changed or removed in any release, including a patch. Application code must not import it; it is listed here only so maintainers can find it and so its presence in the public entry point is not mistaken for a supported API.

| Export | Kind | Notes |
| --- | --- | --- |
| `ɵsdTimerScope()` / `ɵSdTimerScope` | factory + interface | Destroy-scoped `setTimeout` bag. `schedule(handler, delayMs?)` keeps the same timing as `setTimeout` but tracks the handle and clears it on `DestroyRef` destroy; scheduling after destroy is a no-op. `clear()` cancels pending timers without closing the scope. `pending` is for tests/diagnostics only. Must be created inside an injection context (class field initializer or constructor). Library controls use it so a deferred focus / panel-open / emit can never run against a torn-down view. |
| `ɵsdCoerceFormGroup()`, `ɵSdFormControlParent`, `ɵSdFormControlConnector*` | connector surface | The connector API described above, plus its supporting types. |
