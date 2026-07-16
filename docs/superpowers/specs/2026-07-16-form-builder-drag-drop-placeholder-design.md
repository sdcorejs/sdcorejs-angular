# Form Builder Drag/Drop Placeholder Stability Design

Date: 2026-07-16
Status: Approved design; implementation not started
Target: `@sdcorejs/angular` form builder in Angular 19, then rollout to Angular 20 and 21

## Context

`SdFormBuilder` currently shows stale or duplicate drop previews while a user drags a component from the palette across multiple rows. Placeholder movement is also unreliable when an existing field moves between rows or a complete row moves vertically.

The accepted scope covers all three flows:

1. palette component into the canvas;
2. existing field between rows;
3. complete row up or down.

## Evidence and Root Cause

Two independent mechanisms currently control visible placeholder position:

- Angular CDK moves its `cdkDragPlaceholder` with inline `translate3d(...)` transforms during sorting.
- The form builder also renders `fb-row-insert-placeholder` from `targetItem`, `rowInsertionEdge`, and `inlineDropTargetRow`.

The component stylesheet applies `transform: none !important` to `.cdk-drag-placeholder.fb-drop-placeholder`. This overrides the transform written by CDK, so the native placeholder can remain at its first insertion position while the drag continues.

Palette drags add a second failure mode. The palette, outer vertical row list, and inner horizontal item lists are connected by one `cdkDropListGroup`. CDK transfers the palette placeholder between those lists while the component independently renders a custom row placeholder. Pointer hit-testing also selects the nearest row without first requiring the pointer to remain inside the canvas, so the first custom target can survive after the pointer has moved away.

The existing unit tests call handlers directly without rendering the template. They validate state predicates and CSS fragments but cannot detect two visible DOM placeholders or a blocked CDK transform.

## Goals

- Show at most one visible drop placeholder at any time.
- Move the placeholder with the current pointer target, without leaving the first preview behind.
- Preserve precise palette placement for empty canvas, inline row insertion, full rows, and before/after row insertion.
- Preserve CDK sorting behavior for existing fields and complete rows.
- Clear all preview state when the pointer leaves the canvas, the drag is cancelled, or the drop ends.
- Keep schema mutation and column-capacity rules unchanged except for using the current, non-stale drop target.

## Non-goals

- Redesigning the form builder layout or placeholder appearance.
- Changing component schema, public package API, group drill-in behavior, resize behavior, or accessibility labels.
- Adding Playwright or Cypress infrastructure.
- Refactoring unrelated form-builder code.

## Considered Approaches

### 1. Minimal CSS and cleanup patch

Remove the blocking transform rule and clear `targetItem` outside the canvas.

This has the smallest diff but leaves native and custom palette placeholders competing for visibility in nested drop lists. It reduces symptoms without establishing one authority.

### 2. Hybrid single-visible-placeholder model — selected

Let Angular CDK own placeholders for existing canvas fields and rows. For palette drags, keep CDK responsible for drag/drop mechanics but hide the transferred native palette placeholder and render one state-driven form-builder preview.

This preserves CDK sorting where it is strongest and retains the form builder's row/column placement rules without duplicate visual authorities.

### 3. CDK-only placeholders

Remove all custom placeholders and rely only on CDK.

This minimizes custom state, but nested vertical and horizontal lists do not express the form builder's full-row and before/after placement rules reliably enough. It also makes empty/full-row preview behavior dependent on CDK container selection.

## Design

### Palette drop target

Replace the three loosely coupled palette-preview values with one atomic target signal. The target is absent when no valid canvas destination exists and otherwise has one of these shapes:

- `empty`: first insertion into an empty canvas;
- `inline`: a row, item index, and available column count;
- `before`: immediately before a row;
- `after`: immediately after a row.

The state carries the row identity and placement data needed by both rendering and drop mutation. Rendering and `drop()` therefore cannot disagree about which location is current.

### Pointer resolution

Palette movement first checks whether the pointer is inside the canvas drop region. A pointer outside that region clears the target immediately.

Inside the canvas:

- an empty canvas resolves to `empty`;
- a row with at least two free columns can resolve to `inline`, using the active CDK enter/sort index;
- a full or inline-locked row resolves to `before` or `after` from the row midpoint;
- moving between rows replaces the previous target atomically.

The resolver does not fall back to an unbounded nearest row when the pointer is outside the canvas.

### Placeholder ownership

- Palette drags: the palette's native CDK placeholder remains available to CDK mechanics but is visually hidden after it leaves the palette. Exactly one custom placeholder renders from the atomic palette target.
- Existing field drags: CDK owns the visible item placeholder.
- Complete row drags: CDK owns the visible row placeholder.

The stylesheet no longer overrides CDK placeholder transforms. Visual styling may set opacity, border, size, and animation, but must not force `transform` while CDK is sorting.

### Template rendering

The custom palette preview renders in flow at only one location:

- one placeholder in the empty outer list;
- one placeholder before or after the targeted row; or
- one placeholder at the targeted index inside the row's horizontal item list.

All custom preview nodes remain `aria-hidden="true"`. Existing drag preview and drop placeholder visual tokens are reused; this is a behavioral correction, not a visual redesign.

### Drop mutation

Palette `drop()` reads the atomic palette target instead of trusting a potentially stale `event.container` and `event.currentIndex` from nested drop lists. It converts the target into a scope index and column count, then calls the existing component creation path.

Existing field and row drops continue to use CDK container/index events and existing capacity checks. Removing the forced transform restores their visual sorting without changing schema rules.

### Cleanup

A shared cleanup path clears the palette target, dragged palette item, pointer cache, inline tracking, and general drag flags after drop, cancel, exit, or drag end. Cleanup remains deferred until CDK finishes its drop callback where required, but the visible target is cleared synchronously when the pointer leaves the canvas.

## Testing

Tests are written RED-first in Angular 19.

### State-level regression tests

- Move a palette pointer from row A to row B and assert row A is no longer targeted.
- Move from a valid row to outside the canvas and assert no custom placeholder is eligible.
- Resolve empty canvas, inline capacity, full row, and both row edges.
- Assert palette drop mutation uses the current atomic target.

### Rendered ChromeHeadless tests

- Drag a palette item through two rows and assert at most one visible placeholder after every move.
- Drop in the second row and assert exactly one component is created at that location.
- Move an existing field between rows and assert the CDK placeholder changes position and schema order follows the drop.
- Move a complete row down and back up before release; assert one row placeholder and the final expected order.
- Assert no drag preview or placeholder remains after drag end.
- Assert compiled component styles do not contain a rule that forces `transform: none !important` on CDK placeholders.

Karma with ChromeHeadless is the repository-native interaction harness. A live Showcase smoke remains desirable, but the current Codex browser backend is unavailable; this limitation must be reported rather than treated as a passing visual check.

## Rollout and Verification

1. Implement and verify the change in `versions/v19`.
2. Run the focused form-builder and layout tests without letting focused coverage thresholds obscure assertion results.
3. Run the standard Core test suite, form-builder lint, and Angular 19 library/Showcase builds.
4. Run root sync, then verify v20/v21 match v19.
5. Run focused tests or builds for v20/v21 as required by the repository sync and release gates.
6. Run `git diff --check` and inspect the exact source/test diff.

## Acceptance Criteria

- AC-001: Palette drag displays no more than one visible placeholder.
- AC-002: Moving a palette item from one row to another removes the previous preview immediately.
- AC-003: Leaving the canvas removes the palette preview before drag end.
- AC-004: Dropping creates one component at the location shown by the latest preview.
- AC-005: Empty canvas and full-row drops show and use the correct insertion location.
- AC-006: Existing fields can move between rows with a placeholder that follows CDK sorting.
- AC-007: Complete rows can move vertically with a placeholder that follows CDK sorting.
- AC-008: No drag placeholder or preview remains after drop, cancel, or drag end.
- AC-009: Row capacity, schema identity, group drill-in, resize, and public API behavior remain unchanged.
- AC-010: The behavior and tests are synchronized across Angular 19, 20, and 21.
