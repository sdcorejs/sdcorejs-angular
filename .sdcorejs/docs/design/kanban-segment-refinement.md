---
schema_version: 1
artifact_id: design-handoff:kanban-segment-refinement
artifact_kind: design-handoff
contract_id: null # transcript approval only; no workflow contract exists
requirement_id: null
change_ref: feat/kanban-segment (uncommitted)
track: design
stack_profile: design
experience_scope: module
owner_repository_id: sdcorejs-angular
owner_repository_role: module
owner_module_id: angular
ownership_scope: module
repository_relative_path: .sdcorejs/design/specs/kanban-segment-refinement.md
source_revision: b016e478a874923ae1a1b536b41020b7c17883ec
parent_references: [] # approval is the 2026-10-04 Claude Code transcript; no spec/plan artifact
supersedes: null
approval_hash: null
artifact_hash: not-computed # executor session had no shell/hash tool
commit_policy: with-change
owner: sdcorejs-design
feature: kanban-segment-refinement
status: approved # by explicit user approval in transcript, bounded library scope
updatedAt: 2026-10-04
editable_source_status: unavailable # ASCII wireframes in the spec; no renderer in executor session
---

# Design Ledger — Kanban / Segmented control refinement

Naming: the choice control is `sd-segmented` / `SdSegmentedComponent` (display name "Segmented control"),
renamed before release with user approval on 2026-10-04. Historical artifact IDs and filenames are unchanged.

## Outputs

- Decisions: .sdcorejs/design/decisions/kanban-segment-refinement.md
- Spec: .sdcorejs/design/specs/kanban-segment-refinement.md
- Wireframes/PNG: none. ASCII wireframes live in the spec. Post-code real-browser captures are owned by the coordinator.

## Traceability

| Requirement (transcript)                         | Design artifact                                               | Status   |
| ------------------------------------------------ | ------------------------------------------------------------- | -------- |
| AC-1 Kanban lanes/cards/showcase metadata        | decisions §Layout/Tokens, spec §Components                    | approved |
| AC-2 Card-anchored pending/error                 | decisions §Kanban states, spec §States                        | approved |
| AC-3 Segmented control `type` light/fill/outline | decisions §Segmented control type                             | approved |
| AC-4 Mobile horizontal lanes, a11y               | decisions §Mobile design plan, spec §Responsive/Accessibility | approved |

## FE Handoff Notes

- No new public Kanban API. No new tokens, i18n keys, assets or dependencies.
- New public segmented-control input `type` (`SdSegmentedType`), additive, default `light`.
- Protected repairs R1–R3 (filtered same-slot drop, segmented-control roving focus, async focus ownership) must stay byte-for-byte in logic.
- Inferred/open: dark-mode elevation of card vs lane needs visual confirmation.

## Open Questions

- None blocking.
