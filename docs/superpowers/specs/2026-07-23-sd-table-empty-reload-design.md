---
created_at: 2026-07-23T11:25:15+07:00
status: approved_design
track: angular
component: SdTable
---

# Keep `SdTable` Reload Enabled for Empty Results

## Context

`SdTable` renders its desktop reload button when `reload.visible` is enabled, but
the template currently disables that button when `_items.length === 0`. This
prevents a user from asking the table to fetch again after an empty initial
response, an empty filtered result, or any server response with no rows.

## Requirements

- When `reload.visible` is enabled, the desktop reload button remains rendered
  and enabled when `items` is empty or `total` is `0`.
- Clicking the enabled button continues to call the existing `reload()` flow and
  refreshes the configured data source.
- Existing behavior for a non-empty table remains unchanged.
- Reload visibility still depends on `reload.visible`; this change does not make
  the button globally visible.
- Export availability, paginator behavior, empty-state rendering, and layout
  remain unchanged.
- No new public option or API is introduced.

## Design

Remove only `[disabled]="!_items.length"` from the reload button in the
canonical Angular 19 table template. Do not replace it with an `items`, `total`,
or loading-state predicate. The existing `reload()` implementation remains the
single refresh path.

After the canonical change and its tests are complete, synchronize the generated
Angular 20 and Angular 21 trees through the repository sync workflow.

## Test Strategy

Add a regression test with a visible reload action and an empty data response:

1. Render the table with `{ items: [], total: 0 }`.
2. Verify the reload button is present and enabled.
3. Click the reload button.
4. Verify the existing data-source flow is invoked again.

Run the focused table test first, then the relevant repository checks, version
sync validation, and a visual/DOM check of the empty table state. The check must
also confirm that export stays unavailable for empty data and paginator behavior
does not change.

## Documentation and Changelog

- Update the `SdTable` Markdown documentation to state that a visible reload
  action is available even when the current result is empty.
- Add a changelog entry describing the empty-state reload fix.
- Keep generated-version documentation synchronized where the repository
  workflow requires it.

## Risks and Boundaries

- Repeated reload clicks continue to use the component's existing concurrency
  behavior; this change adds no new loading guard.
- The current control is desktop-only, so adding a mobile reload control is out
  of scope.
- Changing export visibility, paginator visibility, or empty-state design is out
  of scope.

## Acceptance Criteria

- [ ] A visible reload button is enabled with `items.length === 0`.
- [ ] A visible reload button is enabled with `total === 0`.
- [ ] Clicking reload for an empty result invokes the existing refresh flow.
- [ ] Reload remains hidden when `reload.visible` is not enabled.
- [ ] Export and paginator behavior are unchanged.
- [ ] Angular 19 is canonical and Angular 20/21 are synchronized.
- [ ] Regression tests, documentation, and changelog are updated.
