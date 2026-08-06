# @sdcorejs/angular 19.1.4

Release tag `v1.4`, published 2026-07-23.

Release suffix `1.4` publishes `19.1.4`, `20.1.4`, and `21.1.4` as a stable release across the maintained Angular lines.

### Added

- **Time controls and input masks** - added timezone-free `SdTime` / `SdTimeRange`, reusable raw/display input-mask adapters and common business presets, all integrated with the shared form lifecycle contract.
- **Responsive navigation and state UI** - added the signal-based `SdViewportService`, router/manual `SdBreadcrumb`, and accessible loading/empty/error/forbidden/success `SdDataState` presentation.
- **Typed business selection** - added generic server-backed `SdEntityPicker` and static/lazy `SdTreeSelect` controls with stable-key selection, hydration, templates, responsive layout, keyboard behavior and form integration.
- **Safe workflow and operations primitives** - added scoped `SdUnsavedChangesService` guards/adapters, shared poll/SSE `SdTaskService`, `SdJobProgress`, and normalized/redacted `SdAuditDiff`.
- **Graph persistence foundation** - added the public `SdGraphSerializer` plus identity/envelope/storage-adapter entrypoint used by cache and storage to preserve `Date`, `Map`, `Set`, shared references and cycles with bounded validation.
- **Complete PDF workflows** - added continuous scroll, printing adapters, outline navigation, bounded thumbnails/search, browser capability tokens and consumer-facing PDF state/event types.

### Changed (BREAKING for consumers)

- **Angular signal input/output contracts** - migrated compatible component inputs and outputs to `input()` and `output()` across Angular 19/20/21 while preserving template binding names and behavior. Direct class consumers and tests must read migrated inputs as signals (for example `component.value()`), set them through Angular's `ComponentRef.setInput(...)`, and use the output `emit()`/`subscribe()` contract instead of RxJS-only `EventEmitter` APIs.

### Changed

- **Angular dependency injection internals** - migrated compatible constructor-injected dependencies to field-level `inject()` with compatibility constructors where public inheritance may depend on the existing class shape. Runtime constructor arguments and classes instantiated directly outside Angular injection context remain constructor-based.
- **Signal migration safety** - retained setter/aliased inputs and outputs whose listener/type semantics cannot be migrated safely yet, including outputs that rely on `EventEmitter.observed`; these exceptions preserve current runtime behavior.
- **Form lifecycle foundation** - consolidated registration, dynamic parent/name changes, model/control synchronization, validation state and destroy cleanup behind `ɵsdFormControlConnector` while retaining existing template bindings.
- **API request safety** - GET requests deduplicate by default; mutations deduplicate/retry only through explicit opt-in. Added typed PATCH, per-caller `AbortSignal`, bounded backoff and deterministic in-flight cleanup; response generics now default to `unknown`.
- **Loading ownership** - `start()` now returns an idempotent ref, overlapping owners are reference-counted, `run()` scopes async work, and browser DOM/style state is shared and cleaned up safely.
- **Cache and storage persistence** - activated `SD_CACHE_CONFIG`, added namespace/version/custom serializers, exact cached-absence snapshots, load coalescing, typed handle teardown, legacy JSON migration and SSR/quota/corruption containment.
- **Responsive layout behavior** - layout responds live to viewport signals while legacy responsive services/tokens remain supported as adapters.
- **Release documentation rollout** - the multi-version sync now treats the canonical npm README and i18n quality scripts as managed release inputs, while the sync guard fails closed on README, package-version, script or generated-workspace drift.

### Fixed

- **`sd-table` empty-result reload** - kept a configured reload action enabled when the current items or total are zero, allowing users to retry without changing export or paginator behavior.
- **Showcase loading documentation manifest** - aligned the generated loading-service example count with the current showcase source so documentation generation no longer reports a stale manifest expectation. (#15)
- **Published no-op and lifecycle paths** - implemented the previously inert PDF print/outline/continuous APIs and hardened modal/drawer/tab close hooks, task cancellation, picker races and tree cascade/error behavior.
- **Accessibility and resource cleanup** - added semantic breadcrumb/data-state/progress/audit markup, focus/keyboard handling, bounded PDF work, SSR guards and deterministic listeners/timers/subscriptions/EventSource teardown across the new surfaces.
- **Form expression evaluation** - corrected `NextDay` handling so relative expressions remove the `NextDay` token instead of the unrelated `LastDay` token before evaluation.
- **Showcase release and layout demos** - preserved repeated populated changelog groups such as breaking and non-breaking `Changed` sections, and made the Layout Desktop/Mobile controls switch the actual rendered sidebar through the scoped viewport adapter.

### Deprecated

- **API compatibility aliases** - deprecated `SdApiOption.autoCache` in favor of `dedupe` and `SD_API_CONFIGURATION` in favor of `SD_API_CONFIG`.
- **Generic cache callback providers** - deprecated directly typed legacy callbacks; migrate to globally safe `unknown` callbacks or use `adaptLegacySdCacheCallbacks()` temporarily with a runtime guard.

## Compare with the previous release

- Previous documented release: [19.1.3](https://sdcorejs.github.io/sdcorejs-angular/docs/19.1.3/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v1.3...v1.4
