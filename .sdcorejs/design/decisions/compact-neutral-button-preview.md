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

# Compact neutral button — visual direction

Subject: SdButton for administrators using table and Excel import. Job: evaluate a compact white secondary button inspired by Cloudflare Dashboard.

Keep SD primary #2a66f4, white surface #ffffff, neutral text #27292e, candidate border #737780, hover #f3f4f6, muted text #707783. Existing Roboto/Arial sans-serif stack. A: 32px high, 14px/500, 0 letter-spacing, 6px radius, 1px border, 16px icon and 6px gap. B: 28px high, 13px/500, 14px icon and 5px gap.

Critique: a fully black border on every control would add too much weight. Use a medium dark neutral border and reserve fill-primary for main actions. Comparison baseline recreates observed old-library CSS, not a product screenshot; typography falls back to Arial if Roboto is unavailable.

Desktop: compact toolbar controls. Tablet: wrap toolbar groups. Mobile: candidate touch hit-area enlargement without shrinking text; no mobile validation claimed. Respect reduced motion. Vietnamese action labels.

No production changes and no new visual dependency. User asked for review images; this is exploratory, not an approved implementation handoff.
