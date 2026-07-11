# SdTable Filter Commit Test Stability Design

## Context

The focused `SdTable` spec passes on Angular 19 but reports one failure on
Angular 20 and 21:

`onFilterCommit ... notReload:true - no reload`

The test records the `items()` call count immediately after its first
`detectChanges()`/timer flush. On Angular 20 and 21, the component's initial
configuration and reload lifecycle has not finished at that point. The pending
initial reload calls `items()` during the later 600 ms debounce window, so the
test attributes an initialization call to `onFilterCommit()`.

Diagnostics reproduced this behavior three out of three times. During every
failure, the stored filter value retained `notReload: true`. When the initial
table lifecycle was settled before recording the baseline, the call count did
not change after `onFilterCommit()` and its debounce window.

## Design

Keep production behavior unchanged. Stabilize the regression test by settling
the table's asynchronous initial load before capturing the `items()` call-count
baseline. Use the same `detectChanges()` plus 800 ms fake-time pattern already
used by the table layout regression fixture, followed by a flush and final
change detection.

The assertion remains behavioral:

1. Commit `columnFilter` through `onFilterCommit()`.
2. Verify the committed value is stored.
3. Advance beyond the filter observer debounce.
4. Verify no additional `items()` call occurred after the settled baseline.

Apply the test stabilization from v19 and roll it to v20 and v21 through the
repository sync workflow so all versioned specs remain identical.

## Alternatives Rejected

- Change production reload scheduling: unnecessary because diagnostics prove
  `notReload` works and the observed call belongs to initialization.
- Mock or spy on private reload internals: brittle and less representative than
  asserting the public `items()` effect.
- Disable or weaken the assertion: would remove regression coverage for blur
  commits accidentally triggering reloads.

## Verification

- Demonstrate RED on Angular 20 with the original early baseline.
- Demonstrate GREEN for the isolated test on v19, v20, and v21.
- Run the full focused `table.component.spec.ts` suite on all three versions.
- Build the library on v19, v20, and v21.
- Run `npm run check:sync` and `git diff --check`.

## Scope

Only the cross-version test lifecycle setup changes. No production component,
service, API, or runtime behavior is modified.
