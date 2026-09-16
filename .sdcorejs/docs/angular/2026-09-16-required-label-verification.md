---
artifact_id: required-label-verification-2026-09-16
artifact_kind: execution-doc
change_ref: small-required-label
source_spec: none
source_plan: none
commit_policy: with-change
owner: angular-integration
---

# Small required-label layout fix

Base: `5b6cef4bcb4b76851cc08bedd861a00bb3ecce38`; initially clean main. Local development only; no release or dependency changes.

## Root cause and fix

The small-field override made `mat-label.sd-form-field-label` a flex block. Angular Material renders its required marker as a sibling, so the marker moved below that block. Reproduced in the browser and in four failing sm combinations (outline/fill, with/without helper text); md cases remained green.

The shared sm floating label now uses inline-flex with centered items and top vertical alignment. This keeps Material's marker next to the label without introducing a baseline gap. The marker does not shrink; long text truncates while retaining the helper icon. Existing Material float transforms and md rules remain unchanged.

The first patch passed required-marker cases but failed the existing resting-label center test by 5px. Top vertical alignment fixed that regression. All probes were removed by reloading against the rebuilt library.

## Evidence

- Shipped-theme layout suite v19: initial 4 failures / 6 passes; final 11 passes.
- Matrix covers 14 fields: input, input-number, input-color, select single/multiple, autocomplete, date, datetime, date-range, time, textarea, chip, chip-calendar, tree-select; sm/md, outline/fill, optional helper text, narrow long labels, focus and selected value.
- Full v19 Forms suite: 1,505 passes.
- Synced v22 layout suite: 11 passes.
- v19 library build and Showcase build: passed.
- Scoped ESLint, generated-example tests, sync guard and diff/text hygiene: passed.
- The full SCSS Prettier check reports existing baseline formatting differences; no unrelated formatting rewrite was made.
- Desktop and 390px browser checks: required marker center equals label center (0px delta); fields fit the viewport; helper icon, floating label and inline error remain visible.
- API doc, shared style guide and Input sizing showcase updated. Canonical v19 synchronized to v20/v21/v22 using the repository sync script.

Local showcase: http://127.0.0.1:4200/v/latest/forms/input/examples#forms-input-example-kich-thuoc
Raw logs and screenshots are diagnostic-only in the local Temp directory. Existing local published-archive loading errors are unrelated to the live controls.
