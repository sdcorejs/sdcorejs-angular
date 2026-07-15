---
feature: table-settings-compact-density
status: reviewed
sourceUserStories: none
sourceAcceptanceCriteria: none
updatedAt: 2026-07-15T21:17:13+07:00
---

# Design Ledger - Table Settings Compact Density

## Outputs

- Spec: `design/specs/table-settings-compact-density.md`
- Flow: `design/flows/table-settings-compact-density.md`
- Decision: `design/decisions/table-settings-compact-density.md`
- Desktop wireframe: `design/wireframes/table-settings-compact-density/table-settings-dialog-desktop.html`
- Mobile wireframe: `design/wireframes/table-settings-compact-density/table-settings-dialog-mobile.html`
- Switch-state wireframe: `design/wireframes/table-settings-compact-density/compact-switch-states.html`
- Desktop PNG: `design/exports/png/table-settings-compact-density/table-settings-dialog-desktop.png`
- Mobile PNG: `design/exports/png/table-settings-compact-density/table-settings-dialog-mobile.png`
- Switch-state PNG: `design/exports/png/table-settings-compact-density/compact-switch-states.png`
- Validated design record: `docs/superpowers/specs/2026-07-15-sd-table-settings-compact-density-design.md`

## Traceability

| User requirement              | Design acceptance   | Design artifact                                   | Status                                                                              |
| ----------------------------- | ------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| UR-1 - reduce button spacing  | AC-D1               | Spec, desktop/mobile wireframes                   | Reviewed in visual session                                                          |
| UR-2 - cleaner compact dialog | AC-D2, AC-D6        | Spec, flow, both wireframes                       | Reviewed in visual session                                                          |
| UR-3 - smaller switches       | AC-D3, AC-D4, AC-D5 | Decision, spec, dialog wireframes and state strip | Concept reviewed; AC-D4 interaction/RTL verification remains pending implementation |
| UR-4 - preserve behavior      | AC-D6, AC-D7        | Flow, spec                                        | Reviewed in technical session                                                       |

## FE Handoff Notes

- Production source remains unchanged in the design track.
- Implement in the v19 table config first, then run the repository sync workflow.
- Prefer scoped `mat.slide-toggle-overrides(...)`; `SdSwitch size="sm"` is currently a no-op concept.
- The written handoff still requires the user’s file review before implementation planning begins.

## Open Questions

- None in the approved concept.
- Pending gate: user review of the written spec and exported artifacts.
