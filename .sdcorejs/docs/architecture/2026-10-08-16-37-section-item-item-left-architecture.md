---
artifact_id: architecture-draft-section-item-item-left-r1
artifact_kind: execution-doc
change_ref: section-item-item-left
source_spec: .sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md
source_plan: none
commit_policy: with-change
owner: sdcorejs-architecture
---

# Architecture - @sdcorejs/angular sd-section-item [itemLeft] slot and optional label (NSP-5634 port) - 2026-10-08 16:37

Approved spec: `.sdcorejs/specs/angular/2026-10-08-16-37-section-item-item-left.md` (`sha256:v1:43b9950a325feba4e829f61a346e793810367725e1d8278c26713239b704fb38`).
Gate: required, signal `public-api-contract`.

## Shared decisions

- **Public contract PC-001 (api):** `<sd-section-item>` exposes an optional `label` (default `''`), the unchanged `labelWidth`, a content slot `[itemLeft]` and the default value slot.
  - The left column keeps `c-item-label T14R text-secondary` and the `labelWidth` width.
  - `[itemLeft]` content replaces the label text only when an element matches; otherwise `label` renders (Angular `ng-content` default content).
- **Compatibility:** additive. Label-only templates render the same DOM (INV-001). No new dependency, entry point, service or style; v20, v21 and v22 change only through `npm run sync` (INV-002).
- **Migration:** none for existing consumers. Same template API as `@sd-angular/core` `19.0.43`.
- **Release:** `CHANGELOG.md` `[Unreleased]`; the maintainers' next release tag publishes all four lines.

## Validation obligations

- **VAL-001** (INV-001; AC-001..AC-004): section-item unit spec covers label-only, slot, slot-only without label and value slot alongside the slot.
- **VAL-002** (INV-002; AC-005): v19 build, `check:sync`, manifests unchanged, CHANGELOG, docs, showcase and generated sources, mojibake scan.

```yaml
architecture_context:
  schema_version: 1
  source: sdcorejs-architecture
  contract_id: section-item-item-left
  requirement_id: R-001
  approved_spec_reference:
    repository_id: sdcorejs-angular
    artifact_id: spec-section-item-item-left-r1
    artifact_kind: spec
    revision: 59f6c3eba545108744b37c004867b8bfa10ea685
    approval_hash: sha256:v1:43b9950a325feba4e829f61a346e793810367725e1d8278c26713239b704fb38
  approved_architecture_path: <filled after approval>
  approved_architecture_hash: <filled after approval>
  owner_repository_id: sdcorejs-angular
  owner_module_id: null
  execution_host_repository_id: sdcorejs-angular
  integration_owner_repository_id: sdcorejs-angular
  trigger:
    required: true
    signals:
      - public-api-contract
    rationale: Adds a content projection slot and relaxes the required-ness of an input on a published @sdcorejs/angular component on all four Angular lines; both are public API of the library.
  invariants:
    - id: INV-001
      statement: 'Consumers that pass only label render the same left column: c-item-label T14R text-secondary classes, labelWidth width and the label text.'
      scope: sd-section-item template API
      owner: sdcorejs-angular
      rationale: The slot is additive; every existing @sdcorejs/angular consumer on every Angular line must keep its current rendering without code changes.
      verification_method: 'section-item unit spec: label-only case asserts text, classes and width; value-slot case still projects.'
      requirement_refs:
        - R-001
        - R-003
        - R-004
      decision_refs:
        - D-002
        - D-003
    - id: INV-002
      statement: No new dependency, entry point, service or style is added, and v20, v21 and v22 change only through npm run sync.
      scope: '@sdcorejs/angular package surface on all four Angular lines'
      owner: sdcorejs-angular
      rationale: An additive API change must not change the install footprint, and the version lines must stay derived from v19.
      verification_method: npm run check:sync passes; diff review shows no package manifest or entry point change; v19 library build.
      requirement_refs:
        - R-005
      decision_refs:
        - D-004
  boundaries: []
  dependency_directions: []
  data_state_owners: []
  public_contracts:
    - id: PC-001
      kind: api
      statement: 'sd-section-item template API: optional input label (default empty string), input labelWidth (unchanged), content slot [itemLeft] that replaces the label text in the left column when present, default content slot for the value side.'
      owner: sdcorejs-angular
      compatibility: 'Additive and backward compatible: label-only templates render unchanged; making label optional cannot break a valid template.'
      migration: None required. Consumers opt in by projecting an element marked itemLeft; same API as @sd-angular/core 19.0.43.
      invariant_refs:
        - INV-001
  security_trust_boundaries: []
  cross_repository_integration: []
  adopted_decision_refs:
    - D-001
    - D-002
    - D-003
    - D-004
    - D-005
  deferred_decision_refs: []
  assumption_refs:
    - A-001
    - A-002
  validation_obligations:
    - id: VAL-001
      expected_proof: 'section-item spec: label-only renders label with c-item-label T14R text-secondary and width; [itemLeft] renders the projected node and hides the label; slot-only without label creates; value slot still projects alongside [itemLeft].'
      owner: sdcorejs-angular
      invariant_refs:
        - INV-001
      acceptance_criterion_refs:
        - AC-001
        - AC-002
        - AC-003
        - AC-004
    - id: VAL-002
      expected_proof: v19 library build succeeds; npm run check:sync passes; package manifests unchanged; CHANGELOG [Unreleased] bullets; sd-section.md, showcase demo, registry count and generated example sources updated; mojibake scan clean.
      owner: sdcorejs-angular
      invariant_refs:
        - INV-002
      acceptance_criterion_refs:
        - AC-005
  profile_sections:
    frontend_architecture_ref:
      reference: plan_context.frontend_architecture
      conformance_invariant_refs:
        - INV-001
    agent_architecture_ref: null
  change_control:
    revision: 1
    supersedes: null
```
