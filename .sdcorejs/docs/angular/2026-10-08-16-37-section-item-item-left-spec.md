---
artifact_id: spec-draft-section-item-item-left-r1
artifact_kind: execution-doc
change_ref: section-item-item-left
source_spec: none
source_plan: none
commit_policy: with-change
owner: sdcorejs-spec
---

# Spec - @sdcorejs/angular sd-section-item [itemLeft] slot and optional label (NSP-5634 port) - 2026-10-08 16:37

```yaml
spec_context:
  source: sdcorejs-spec
  decision_coverage:
    {"schema_version": 1, "revision": 1, "records": [
      {"id":"R-001","type":"requirement","statement":"sd-section-item renders projected [itemLeft] content inside the left column (.c-item-label), which keeps the labelWidth width; [itemLeft] replaces the label text when present and the label renders as before when absent.","source":"authoritative-contract","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":null},
      {"id":"R-002","type":"requirement","statement":"label becomes an optional input defaulting to an empty string so slot-only usage no longer throws NG0950; existing label usages are unchanged.","source":"authoritative-contract","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":null},
      {"id":"R-003","type":"requirement","statement":"The left column keeps its default c-item-label T14R text-secondary classes; projected [itemLeft] content controls its own typography and colour with its own classes.","source":"authoritative-contract","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":null},
      {"id":"R-004","type":"requirement","statement":"The default value slot in .c-item-content keeps working unchanged, including when [itemLeft] is used in the same item.","source":"authoritative-contract","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":null},
      {"id":"R-005","type":"requirement","statement":"The same change updates sd-section.md, adds an itemLeft showcase demo block with the registry count and regenerated example sources, adds CHANGELOG [Unreleased] Added and Changed bullets, and rolls the change out to v20, v21 and v22 only through npm run sync with check:sync passing.","source":"authoritative-contract","status":"active","owner_repository_id":"sdcorejs-angular","owner_module_id":null},
      {"id":"AC-001","type":"acceptance-criterion","statement":"Label without slot.","behavior":"Render sd-section-item with only label and labelWidth.","expected_result":"The left column shows label with c-item-label T14R text-secondary and the labelWidth width.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001","R-003"]},
      {"id":"AC-002","type":"acceptance-criterion","statement":"Slot replaces label.","behavior":"Render sd-section-item with label and a projected span[itemLeft].T14M.","expected_result":"The span renders inside the left column, the label text does not render, and labelWidth still applies.","verification_kind":"automated","blocking":true,"requirement_refs":["R-001","R-003"]},
      {"id":"AC-003","type":"acceptance-criterion","statement":"Optional label.","behavior":"Render sd-section-item without label but with [itemLeft] content.","expected_result":"The component creates without error and label() is an empty string.","verification_kind":"automated","blocking":true,"requirement_refs":["R-002"]},
      {"id":"AC-004","type":"acceptance-criterion","statement":"Value slot with itemLeft.","behavior":"Render sd-section-item with [itemLeft] and default value content.","expected_result":"Both the left slot and the value content render in their columns.","verification_kind":"automated","blocking":true,"requirement_refs":["R-004"]},
      {"id":"AC-005","type":"acceptance-criterion","statement":"Docs, showcase, changelog and rollout.","behavior":"Inspect docs, showcase, registry, generated sources, CHANGELOG and v20-v22; run v19 section specs, the v19 library build, check:sync, the showcase example test, lint on changed files and the mojibake scan.","expected_result":"Docs describe the slot, optional label, behaviour and an example; showcase has the demo block with demoSectionCount 9 and matching generated sources; CHANGELOG [Unreleased] has the bullets; specs, build, check:sync and the example test pass; lint adds no new errors; mojibake scan is clean.","verification_kind":"automated","blocking":true,"requirement_refs":["R-005"]},
      {"id":"A-001","type":"assumption","statement":"Angular 19 to 22 render ng-content default content only when no node matches the selector.","source":"explicit","confidence":"high","status":"confirmed","blocking":false,"evidence_refs":["Angular 18+ ng-content default content feature","verified in @sd-angular/core 19.0.43"],"consequence_if_wrong":"The label would disappear for every consumer.","validation_method":"A unit test without the slot asserts the label text.","owner":"nghiatt15_onemount","rationale":"Documented framework behaviour since Angular 18.","impacted_refs":["R-001"]},
      {"id":"A-002","type":"assumption","statement":"No consumer relies on the NG0950 error for a missing label.","source":"explicit","confidence":"high","status":"confirmed","blocking":false,"evidence_refs":["every library and showcase usage passes label"],"consequence_if_wrong":"A missing label renders an empty column instead of throwing.","validation_method":"Document the new behaviour in sd-section.md.","owner":"nghiatt15_onemount","rationale":"Relaxing required-ness is additive for valid templates.","impacted_refs":["R-002"]},
      {"id":"D-001","type":"decision","statement":"The slot selector is the attribute itemLeft, identical to @sd-angular/core 19.0.43.","question":"Which selector does the slot use?","selected_value":"[itemLeft]","source":"explicit-user","status":"approved","blocking":true,"scope":"module","owner_repository_id":"sdcorejs-angular","rationale":"Same public API as @sd-angular/core; user asked for the same itemLeft on 2026-10-08.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","AC-002"]},
      {"id":"D-002","type":"decision","statement":"label becomes input<string>('') and the column falls back to label through ng-content default content, without a new contentChild or directive.","question":"How does the fallback work?","selected_value":"ng-content default content","source":"explicit-user","status":"approved","blocking":true,"scope":"module","owner_repository_id":"sdcorejs-angular","rationale":"Smallest change that keeps existing DOM for label-only consumers; mirrors @sd-angular/core 19.0.43.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-001","R-002","AC-001","AC-003"]},
      {"id":"D-003","type":"decision","statement":"The .c-item-label div keeps c-item-label T14R text-secondary and the width; projected content overrides typography only on its own elements.","question":"What styling does the slot get?","selected_value":"keep wrapper defaults","source":"approved-spec","status":"approved","blocking":true,"scope":"module","owner_repository_id":"sdcorejs-angular","rationale":"Backward compatible and lets consumers choose classes such as T14M.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-003","AC-001","AC-002"]},
      {"id":"D-004","type":"decision","statement":"No version bump; the entry goes under CHANGELOG [Unreleased] and ships with the next maintainers release tag on all four lines.","question":"How is it released?","selected_value":"Unreleased changelog entry","source":"explicit-user","status":"approved","blocking":true,"scope":"module","owner_repository_id":"sdcorejs-angular","rationale":"Release suffixes are cut by the maintainers release ritual, not by feature PRs.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-005","AC-005"]},
      {"id":"D-005","type":"decision","statement":"Branch feat/section-item-item-left from origin/main 59f6c3eb, pull request into main, requirement reference NSP-5634.","question":"Which branch and delivery path?","selected_value":"feat/section-item-item-left","source":"explicit-user","status":"approved","blocking":true,"scope":"module","owner_repository_id":"sdcorejs-angular","rationale":"User asked for a branch from main and a PR into main on 2026-10-08.","supersedes":null,"revisit_condition":null,"convention_impact":{"candidate":false,"category":null},"downstream_refs":["R-005","AC-005"]},
      {"id":"INV-001","type":"invariant","statement":"Consumers that pass only label render the same left column: c-item-label T14R text-secondary classes, labelWidth width and the label text.","protected_refs":["R-001","R-003","AC-001"]},
      {"id":"INV-002","type":"invariant","statement":"No new dependency, entry point, service or style is added, and v20, v21 and v22 change only through npm run sync.","protected_refs":["R-005","AC-005"]}
    ], "history": [{"revision":1,"active":[{"id":"R-001","type":"requirement"},{"id":"R-002","type":"requirement"},{"id":"R-003","type":"requirement"},{"id":"R-004","type":"requirement"},{"id":"R-005","type":"requirement"},{"id":"AC-001","type":"acceptance-criterion"},{"id":"AC-002","type":"acceptance-criterion"},{"id":"AC-003","type":"acceptance-criterion"},{"id":"AC-004","type":"acceptance-criterion"},{"id":"AC-005","type":"acceptance-criterion"},{"id":"A-001","type":"assumption"},{"id":"A-002","type":"assumption"},{"id":"D-001","type":"decision"},{"id":"D-002","type":"decision"},{"id":"D-003","type":"decision"},{"id":"D-004","type":"decision"},{"id":"D-005","type":"decision"},{"id":"INV-001","type":"invariant"},{"id":"INV-002","type":"invariant"}],"tombstones":[]}]}
  goal_backward_review:
    schema_version: 1
    mode: "sdcorejs-plan:goal-backward"
    stage: spec
    future_gaps: [AC-001..AC-005 task_refs, R-001..R-005 task_refs, INV-001..INV-002 task_refs + evidence_refs]
  architecture_gate:
    valid: true
    required: true
    status: required
    signals: [public-api-contract]
    bypass: null
    rationale: "Adds a content projection slot and relaxes the required-ness of an input on a published @sdcorejs/angular component on all four Angular lines; both are public API of the library."
  contract_id: section-item-item-left
  requirement_id: NSP-5634
  approved_spec_path: ""
  approved_spec_hash: ""
  supersedes: null
  target_root: C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: null
  execution_host_repository_id: sdcorejs-angular
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: "User request 2026-10-08: implement the same itemLeft slot as @sd-angular/core 19.0.43 (NSP-5634, lib-core-angular MR !211) in the new Core UI on a branch from main and open a PR into main."
  acceptance_criteria_count: 5
  manual_criteria_count: 0
  non_goals:
    - Changing default label typography or colour; labelClass or other new inputs.
    - Refactors of SdSectionItem beyond the slot and optional label.
    - Release tag, npm publish, published-docs and published-pages.
  risks:
    - npm run sync rewrites unrelated v22 files with CRLF on this Windows checkout.
    - Consumers may expect the label text to remain beside projected itemLeft content.
  assumptions:
    - A-001 Angular 19 to 22 ng-content default content renders only when nothing matches (confirmed, high, non-blocking).
    - A-002 No consumer relies on NG0950 for a missing label (confirmed, high, non-blocking).
  redaction_applied: true
  approval:
    approved: false
    approved_at: null
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

`<sd-section-item>` in `@sdcorejs/angular` hard-codes the left column as `c-item-label T14R text-secondary` with the `label` text and offers no way to change it. `@sd-angular/core` `19.0.43` (NSP-5634) added a content slot `[itemLeft]` for this, and portals already use it for group titles in `T14M`. The new Core UI must expose the same public API so consumers can move between the two packages without template changes.

Goal: port the `[itemLeft]` slot and the optional `label` to `versions/v19`, roll it out to v20/v21/v22 with the repository sync, and document it.

Sources:
- User request 2026-10-08: implement the same `itemLeft` in the new Core UI on a branch from `main` and open a PR into `main`.
- Reference implementation: `@sd-angular/core` `19.0.43`, lib-core-angular MR !211 (approved spec, architecture and plan r2 for NSP-5634).
- Current source: `versions/v19/projects/sdcorejs-angular/components/section/src/section-item/*`, `sd-section.md`, `showcase/src/app/pages/components/section/section-demo.component.ts`.

## Requirements

- **R-001:** `<sd-section-item>` accepts projected content marked `itemLeft` and renders it inside the left column (`.c-item-label`), which keeps the `labelWidth` width.
  - When `[itemLeft]` content is present it replaces the `label` text.
  - When it is absent the left column renders `label` exactly as before.
- **R-002:** `label` becomes an optional input with default `''`. Using only `[itemLeft]` no longer throws `NG0950`. Existing usages with `label` are unchanged.
- **R-003:** The left column keeps its default `c-item-label T14R text-secondary` classes. Projected `[itemLeft]` content controls its own typography and colour through its own classes (for example `T14M`).
- **R-004:** The value slot (default `ng-content` in `.c-item-content`) keeps working unchanged, including when `[itemLeft]` is used in the same item.
- **R-005:** Deliverables in the same change:
  - `sd-section.md` documents the new slot, the optional `label`, the fallback behaviour and an example;
  - the showcase section demo gains a demo block for `itemLeft`, the registry count and the generated example sources are updated;
  - root `CHANGELOG.md` `[Unreleased]` gains an Added and a Changed bullet;
  - v20, v21 and v22 receive the change only through `npm run sync`, and `npm run check:sync` passes.

## Decisions

- **D-001:** The slot selector is the attribute `itemLeft` (`<ng-content select="[itemLeft]">`), identical to `@sd-angular/core` `19.0.43`.
- **D-002:** `label` becomes `input<string>('')`; the column falls back to `label` through Angular's `ng-content` default content, so no extra `contentChild` or directive is added.
- **D-003:** The `.c-item-label` `div` keeps `c-item-label T14R text-secondary` and `[style.width]`; projected content may override typography only on its own elements.
- **D-004:** No version bump in this change. The entry goes under `CHANGELOG.md` `[Unreleased]`; the maintainers' release tag publishes it on all four lines.
- **D-005:** Branch `feat/section-item-item-left` from `origin/main` `59f6c3eb`; pull request into `main`; requirement reference NSP-5634.

## Assumptions

- **A-001:** Angular 19 to 22 render `ng-content` default content only when no node matches the selector, so a missing `[itemLeft]` shows `label`.
  - Confidence: high (Angular 18+ feature, verified in `@sd-angular/core` 19.0.43).
  - If wrong: the label disappears for every consumer. Validation: unit test without the slot asserts the label text.
- **A-002:** No consumer relies on the `NG0950` error for a missing `label`.
  - Confidence: high. Every library and showcase usage passes `label`. Validation: documented in `sd-section.md`.

## Architecture gate classification

- **Status:** required.
- **Signals:** `public-api-contract`.
- **Rationale:** the change adds a content projection slot and relaxes the required-ness of an input on a published `@sdcorejs/angular` component, on all four Angular lines.

## Non-goals

- Changing the default label typography or colour.
- Adding inputs such as `labelClass` or a value template directive.
- Refactoring `SdSectionItem` beyond the slot and the optional `label`.
- Release tagging, npm publish, published-docs or published-pages updates.

## Architecture

- `section-item.component.html`: the `.c-item-label` `div` (classes and width unchanged) wraps `<ng-content select="[itemLeft]">{{ label() }}</ng-content>`; `.c-item-content` keeps the default `<ng-content>`.
- `section-item.component.ts`: `label = input<string>('')`.
- No new entry point, dependency, service or style.

## Stack profile and technology assumptions

- **Track:** angular. **Stack profile:** core-ui-angular (the library that publishes `@sdcorejs/angular`).
- **Evidence:** multi-version workspace, v19 canonical, Karma/Jasmine, ng-packagr build, showcase consumes the built v19 library.
- **Technology assumptions:** no new dependency; Node `22.22.3` for workspace installs and builds.

## File structure

- `versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.{ts,html,spec.ts}`: edit.
- `versions/v19/projects/sdcorejs-angular/components/section/sd-section.md`: edit.
- `showcase/src/app/pages/components/section/section-demo.component.ts`: edit.
- `showcase/src/app/docs/core/documentation.registry.ts`: section `demoSectionCount` 8 to 9.
- `showcase/src/app/docs/generated/example-sources.generated.ts`, `example-manifest.generated.ts`: regenerated.
- `CHANGELOG.md`: edit `[Unreleased]`.
- `versions/v20/**`, `versions/v21/**`, `versions/v22/**`, `versions/v19/SYNC-STATUS.md`: written by `npm run sync` only.

## Acceptance criteria

- **AC-001:** Without `[itemLeft]` the left column shows `label`, keeps `c-item-label T14R text-secondary` and the `labelWidth` width (existing behaviour).
- **AC-002:** With `<span itemLeft class="T14M">…</span>` the span renders inside the left column, the `label` text does not render, and `labelWidth` still applies.
- **AC-003:** Omitting `label` while using `[itemLeft]` creates the component without error; `label` defaults to `''`.
- **AC-004:** The default value slot still projects content when `[itemLeft]` is also used.
- **AC-005:** Docs, showcase, changelog and rollout:
  - `sd-section.md` describes the slot, optional `label`, behaviour and an example;
  - showcase has the demo block, `demoSectionCount` is 9 and the generated example sources match;
  - `CHANGELOG.md` `[Unreleased]` has the Added and Changed bullets;
  - v19 section specs pass, the v19 library builds, `npm run check:sync` passes, lint on changed files adds no new errors, mojibake scan is clean.

## Risks & mitigations

- **Risk:** sync rewrites unrelated v22 files with CRLF line endings on this Windows checkout. **Mitigation:** compare blobs and restore EOL-only paths before review (known repository quirk).
- **Risk:** a consumer passes `[itemLeft]` content but still expects the label text. **Mitigation:** document that the slot replaces the label.

## Out of scope (deferred)

- Release tag, npm publish and the published docs/pages: maintainers' release ritual.
