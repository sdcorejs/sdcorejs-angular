# Production-ready 1.4 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `test-driven-development` for every behavior change and `verification-before-completion` before claiming success. The parent session owns all shared files and cross-version rollout.

**Goal:** Complete the requested form, service, workflow, operations, demo, documentation, and release hardening as one logical suffix `1.4` release for Angular 19/20/21.

**Architecture:** Implement and verify shared behavior only in `versions/v19`, then use the repository sync pipeline to derive v20/v21. New primitives are typed standalone secondary entry points; composite pickers reuse table/tree/query/modal engines; browser-dependent services use injected adapters and deterministic cleanup. Existing APIs remain available through overloads, aliases, or compatibility adapters.

**Tech Stack:** Angular 19 standalone APIs, signals, Angular Forms/Router/HTTP, RxJS 7.8, Angular Material/CDK, PDF.js, Karma/Jasmine, ng-packagr, npm workspace scripts.

---

## Frozen release contract

```ts
export type SdTimeValue = `${number}${number}:${number}${number}` | `${number}${number}:${number}${number}:${number}${number}`;

export interface SdTimeRangeValue {
  from?: SdTimeValue | null;
  to?: SdTimeValue | null;
}

export interface SdViewportBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export type SdTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
```

- Logical `NEXT_VERSION`: `1.4`.
- Full package versions: `19.1.4`, `20.1.4`, `21.1.4`.
- Default API dedupe: GET only. Mutations require `{ dedupe: true }`.
- Default retry: zero. GET may opt into a bounded retry policy; mutations require explicit retry opt-in.
- No runtime dependency additions.
- No direct edits to `published-docs/**` and no push/tag/publish.

## Task 1: Form connector contract and migration

**Files:**
- Create: `versions/v19/projects/sdcorejs-angular/forms/models/src/sd-form-control-connector.ts`
- Create: `versions/v19/projects/sdcorejs-angular/forms/models/src/sd-form-control-connector.spec.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/forms/models/index.ts`
- Modify: all registering controls under `versions/v19/projects/sdcorejs-angular/forms/*/src/*.component.ts`
- Modify where applicable: `versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.ts`, `components/upload-file/src/upload-file.component.ts`

- [x] Write RED contract tests for FormGroup/NgForm coercion, dynamic parent/name/control rebinding, ownership-safe cleanup, model/control loop prevention, validators, disabled state, touched/dirty helpers, and destroy cleanup.
- [x] Implement `ɵsdFormControlConnector<TModel, TControl>` as an effect/onCleanup composable using `AbstractControl`, adapters for model representation, and optional validators/disabled hooks.
- [x] Migrate simple controls first, then dual-control and range controls while preserving their existing special behavior through focused tests.
- [x] Keep `SdInputColor` delegated to its inner `SdInput`; keep `SdInlineText`, `SdLabel`, and CVA-based `SdMiniEditor` outside connector ownership.
- [x] Run focused connector and migrated-control suites until GREEN.

## Task 2: API hardening

**Files:**
- Modify: `versions/v19/projects/sdcorejs-angular/services/api/src/api.model.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/services/api/src/api.service.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/services/api/src/api.service.spec.ts`
- Modify: API interceptor source/spec where handler typing requires correction.

```ts
export interface SdApiRetryOption {
  attempts: number;
  delayMs?: number;
  backoff?: number;
  retryWhen?: (error: unknown, attempt: number) => boolean;
  mutations?: boolean;
}

export interface SdApiOption {
  signal?: AbortSignal;
  dedupe?: boolean;
  dedupeWindowMs?: number;
  retry?: SdApiRetryOption;
}
```

- [x] Write RED tests for concurrent GET, independent identical mutations, opt-in mutation dedupe, PATCH, option-sensitive keys, error eviction, bounded retry/backoff/predicate, abort during request/backoff, and registry cleanup.
- [x] Replace the permanent interval with request finalization and bounded replay-window timers disposed through `DestroyRef`.
- [x] Preserve `autoCache` as a deprecated compatibility alias; map `SD_API_CONFIGURATION` to the canonical token.
- [x] Use `unknown`/generics rather than new `any` escapes and keep existing call sites source-compatible.

## Task 3: Loading reference counting and SSR

**Files:**
- Modify: `versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.ts`
- Modify: `versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.spec.ts`

```ts
export interface SdLoadingRef {
  readonly closed: boolean;
  close(): void;
}
```

- [x] Write RED tests for overlapping/nested/out-of-order starts, idempotent handle completion, rejected task cleanup, multiple hosts, single stylesheet, SSR, and injector destroy.
- [x] Inject `DOCUMENT` and platform state; store `{ overlay, count }` per host; remove only on `1 -> 0`.
- [x] Keep ignored `start()` returns and selector-based `stop()` compatible while adding idempotent handles and `run()`.

## Task 4: Persistence foundation, cache, and storage

**Files:**
- Create: `versions/v19/projects/sdcorejs-angular/services/persistence/{index.ts,ng-package.json}`
- Create: `versions/v19/projects/sdcorejs-angular/services/persistence/src/{persistence.model.ts,graph-serializer.ts,graph-serializer.spec.ts,storage-adapter.ts}`
- Modify: cache/storage models, services, specs, indexes, and services barrel.

- [x] Write RED graph round-trip tests for `Date`, `Map`, `Set`, cycles, shared references, `undefined`, special numbers, corruption, legacy envelopes, custom serializer, storage absence/quota, and SSR.
- [x] Implement a versioned graph-table envelope with safe built-in tags and no executable prototype revival.
- [x] Consume `SD_CACHE_CONFIG`, normalize key/namespace/version/TTL/serializer, dual-read the legacy `{ data, createdOn }` JSON format, and lazily rewrite after successful decode.
- [x] Add `destroy()` to the storage contract, remove the existing `@ts-expect-error`, isolate subjects by tier/options, and coalesce concurrent cache `load()` calls.

## Task 5: PDF preview completion

**Files:**
- Modify: `versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/*`
- Modify: `versions/v19/projects/sdcorejs-angular/components/preview/sd-preview.md`
- Modify: Preview Showcase demo and registry metadata.

- [x] Replace tests that assert deferred/no-op behavior with RED tests for continuous rendered windows, recursive outline navigation, print lifecycle, loading/error ARIA, SSR construction, source replacement, destroy-before-resolution, object URL revocation, and active loading-task cancellation.
- [x] Retain and destroy the active PDF.js loading task, guard async continuations after destroy, and inject browser/document adapters.
- [x] Implement continuous mode without eagerly rendering every page, real outline destination resolution, and managed hidden-iframe printing with deterministic cleanup.

## Task 6: Time controls and input masks

**Files:**
- Create: `forms/time/**`, `forms/time-range/**`, `forms/input/src/input-mask.ts`, corresponding specs/docs.
- Modify: `forms/input/src/input.component.{ts,html}` and specs/docs.
- Modify: forms barrels/module and Showcase form demos/registry.

- [ ] Write RED parser/range/mask tests covering valid boundaries, invalid input preservation, min/max/step, required/open ranges, raw/display separation, caret edits, paste, selection, IME composition, mobile input, incomplete/invalid states, custom adapters, and no-mask regressions.
- [ ] Implement canonical time strings without `Date` model leakage; use a fixed anchor only inside the picker adapter.
- [ ] Implement `SdInputMaskAdapter` and `sdCreateInputMask()` with raw model compatibility and a separate display control only when masking is enabled.

## Task 7: Viewport foundation and layout integration

**Files:**
- Create: `services/viewport/**` with model/token/service/spec/doc.
- Modify: `modules/layout/services/responsive/**`, `layout-main/**`, specs/docs.

- [ ] Write RED transition/config/cleanup/SSR tests.
- [ ] Implement width/height/current breakpoint and mobile/tablet/desktop signals through one injected viewport listener.
- [ ] Keep `SdLayoutResponsiveService` and `SD_LAYOUT_VIEWPORT` as compatibility adapters over `SdViewportService`; verify V1/V2/V3 resize behavior.

## Task 8: Breadcrumb and data-state components

**Files:**
- Create: `components/breadcrumb/**`, `components/data-state/**`, specs/docs/demos.

- [ ] Write RED tests for static/router/async labels, navigation leak cleanup, icon/disabled/template/overflow, nav semantics, keyboard activation, all data states, retry/action, custom templates, compact/full-page, and transparent success content.
- [ ] Implement standalone OnPush components with signals and semantic ARIA; keep the UI data-state entrypoint separate from `utilities/data-state`.

## Task 9: Entity picker and tree select

**Files:**
- Create: `forms/entity-picker/**`, `forms/tree-select/**`, specs/docs/demos.
- Modify: `components/tree/src/tree.component.{ts,html}` and specs for keyboard/error behavior needed by composition.

- [ ] Write RED tests for single/multiple keys, paging/search race cancellation, initial hydration, stale selection, disabled/viewed, errors/retry, focus restore, lazy tree races, parent/child/indeterminate rules, hidden selections, and unloaded initial keys.
- [ ] Compose `SdTable`, `SdQueryBar`, `SdModal`, and `SdTree`; never duplicate table/tree engines.
- [ ] Integrate parent FormGroup through the shared connector and use stable generic key selectors.

## Task 10: Unsaved changes service and adapters

**Files:**
- Create: `services/unsaved-changes/**` with functional guard, registry, adapters, specs/docs/demo.
- Modify: tab/modal/drawer close integrations only through additive hooks.

- [ ] Write RED tests for multiple watchers, route guard, async confirmation/error, coalesced prompts, save/reset/discard, modal/drawer/tab hooks, beforeunload registration only while dirty, SSR, and destroy cleanup.
- [ ] Implement idempotent registration refs and a configurable confirmation adapter token; fail closed on async confirmation errors.

## Task 11: Task service and job progress

**Files:**
- Create: `services/task/**`, `components/job-progress/**`, specs/docs/demos.

- [ ] Write RED tests for all state transitions, non-overlapping polling, bounded backoff/jitter, duplicate subscribers, SSE reconnect, parser errors, cancellation, retry, terminal teardown, SSR, and component actions/ARIA/modes.
- [ ] Implement a stable-ID registry with shared poll/SSE connections, injected EventSource factory, bounded retry, and deterministic teardown.
- [ ] Let `SdJobProgress` consume either task ID/service state or direct state without backend-specific wording.

## Task 12: Audit diff

**Files:**
- Create: `components/audit-diff/**`, specs/docs/demos.

- [ ] Write RED pure diff-engine tests for nested objects, added/removed/changed/unchanged, stable-key arrays, formatting, enum mapping, ordering, hidden/redacted values, nullish values, and empty state.
- [ ] Implement normalized typed change rows outside the template; render table/detail-list modes with semantic before/after labels and projected custom values.

## Task 13: Public API, Showcase, docs, and migration notes

**Files:**
- Modify category/root barrels and `src/public-api.spec.ts`.
- Create/update source Markdown beside every new entrypoint.
- Create/update Showcase pages and `documentation.registry.ts`.
- Modify `README.md`, `docs/npm-README.md`, `CHANGELOG.md`, and migration docs.

- [ ] Add compile-time named-export smoke tests for every new component/service/type/token/guard.
- [ ] Add basic and advanced/server-style demos where applicable; run the example generators.
- [ ] Document accessibility, SSR, cleanup/error behavior, request dedupe, loading ref counts, persistence serialization, connector migration, and responsive behavior.
- [ ] Remove all touched-module signature-only/no-op behavior identified by discovery.

## Task 14: Single version bump and multi-version rollout

**Files:**
- Modify the three library manifests only after Tasks 1-13 pass in v19.
- Generate v20/v21 with root sync; review all derived changes.

- [ ] Set v19/v20/v21 package versions to `19.1.4`, `20.1.4`, `21.1.4` in one final release step.
- [ ] Convert `[Unreleased]` into the single `1.4` release unit while preserving one empty Unreleased section.
- [ ] Run `npm run sync`, review generated mirrors, then `npm run check:sync`.

## Task 15: Quality gate

- [ ] Run formatting check on touched files and `git diff --check`.
- [ ] Run `npm run lint:release`.
- [ ] Run focused and full v19 library tests; compare broad failures to the recorded 14-21 flaky baseline and require zero remaining release-owned failures.
- [ ] Run Showcase tests/generator tests and production Showcase build.
- [ ] Run production library builds for v19/v20/v21 and package/entrypoint smoke tests.
- [ ] Scan diff for debug logs, unsafe `any` added in touched code, TODO/stubs/no-ops, focused/skipped tests, missing exports, generated drift, and unrelated edits.
- [ ] Perform browser/preview smoke for responsive, keyboard/ARIA, PDF, time/mask, picker, data-state, job progress, and audit diff when the local Showcase is runnable.

## Baseline evidence before implementation

- PASS: root sync guard and 27/27 Showcase generator tests.
- PASS: 3/3 Showcase branding tests.
- PASS: release lint for v19/v20/v21.
- PASS: production library builds for v19/v20/v21.
- PASS: v19 production Showcase build; known CommonJS optimization warnings remain.
- FAIL baseline: v19 full Karma varies by order between 14 and 21 failures with 9 skipped.
- FAIL baseline coverage: statements 66.08%, lines 66.45%, functions 64.96%.

## Exact command set

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/forms/models/src/sd-form-control-connector.spec.ts
npm --prefix versions/v19 run test:showcase -- --include=projects/showcase/src/app/docs/core/documentation.registry.spec.ts
npm run generate:showcase
npm run test:showcase-generators
npm run sync
npm run check:sync
npm run lint:release
npm --prefix versions/v19 run test:ci
npm --prefix versions/v19 run build
npm --prefix versions/v20 run build
npm --prefix versions/v21 run build
npm --prefix versions/v19 run build:showcase -- --configuration production
git diff --check
```
