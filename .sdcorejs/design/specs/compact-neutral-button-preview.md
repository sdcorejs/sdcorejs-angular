---
status: exploratory-draft
track: design
stack_profile: design
owner_repository_id: sdcorejs-angular
owner_module_id: angular
source_revision: a70e5aca283c49fa59279d87d9ec50240533a758
provenance: generated-mockup
approval: pending-user-feedback
---

# Preview specification

Editable source: .sdcorejs/design/wireframes/compact-neutral-button-preview/comparison.html
SHA-256: e6eb7bd2e5aeffb46bd4e2f2071cd3f6333339967c4316f4c05528a85f18a274

Generated PNGs: .sdcorejs/design/exports/png/compact-neutral-button-preview/comparison.png, .sdcorejs/design/exports/png/compact-neutral-button-preview/contexts.png

Baseline evidence: live computed styles at http://127.0.0.1:4917/components/button on 2026-09-08: sm 32px, font 14px/400, 1.25px spacing, radius4, outline #d3d3d3, primary #2a66f4. Baseline is explicitly labelled a CSS reconstruction.

Confirmed implementation mapping: old projects/sd-angular/components/button/src and modern versions/v19/projects/sdcorejs-angular/components/button/src. Both support outline and sm. Table selector actions and Import Excel already reuse SdButton. Proposed values are candidates for both libraries; source remains in this single owner. Inputs/events/loading semantics remain unchanged.

Interaction: hover changes neutral background and border color, never border width; keyboard focus has a separate primary ring; disabled dims; loading illustration is static. Primary CTA retains SD color.

Requirements inferred — needs confirmation: exact neutral border and 28px optional size. No approved spec/plan parents for this exploratory review artifact.
