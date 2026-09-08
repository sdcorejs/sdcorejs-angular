---
artifact_id: execution-doc:sdcorejs-angular:button-theme-polish
artifact_kind: execution-doc
change_ref: button-theme-polish-20260908
source_spec: none
source_plan: .sdcorejs/plans/angular/2026-09-08-button-theme-polish.md
commit_policy: with-change
owner: sdcorejs-angular
track: angular
status: verified
---

# SdButton implementation and verification

## Delivered

M3 pill (computed 9999px), 14px/500 label and 0.096px tracking retained. Existing sizes remain 32/40/48px and public API/defaults are unchanged. Outline/disabled colors now use theme tokens; disabled semantic color rules no longer override the disabled palette or fade the entire button twice. Native Material hover state layers remain; keyboard focus uses a visible primary ring. Icon/text spacing is local (sm6px, md/lg8px); suffix-only renders once. Spinner respects reduced motion. Examples and component documentation reflect the implementation.

## Evidence

- Regression baseline: two failing tests reproduced duplicate suffix rendering and ignored outline/disabled theme variables before implementation.
- Focused Karma suite: 72 passing tests for Button, Data State, Excel import UI and Table selector actions. Both repositories total 129 passing tests.
- Real Angular package build: passed, Node22.22.3.
- v19 generated to v20/v21/v22 through normal sync; check:sync passed. Root script suite: all149 tests passed after regenerating example sources.
- Playwright/Chromium: desktop1440px, mobile375/320px; native corner shape, small32px size, icon gap, no new-toolbar button overflow, unchanged geometry on hover, visible keyboard focus, single suffix icon. Theme override on the demo host verified outline and disabled colors on a dark surface. Both reduced-motion and normal spinner behavior passed.
- Real Table selector Quick Action buttons verified on both live showcases (32px and6px gap). Import Excel integration covered by the focused Karma suite.
- Scoped UTF-8 scan and git diff --check passed. Hash audit preserved unrelated prior edits and protected Modal/Drawer/Table files, except expected generated artifacts. No release or commit performed.

## Evidence boundaries

Screenshots and browser logs are temporary local diagnostics under the Codex button-polish-20260908 task directory. Dark-surface verification uses host theme overrides; this does not claim a full application dark-mode implementation. The modern showcase already reports missing local published-docs metadata and a duplicate SdIcon component-ID warning; live examples render and were verified. No changes were made to that documentation loading or module wiring.
