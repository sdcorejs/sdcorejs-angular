---
artifact_id: sd-table-mobile-cards-plan
artifact_kind: plan
change_ref: sd-table-mobile-cards
source_spec: none
source_plan: .sdcorejs/plans/angular/2026-09-05-sd-table-mobile-cards.md
commit_policy: with-change
owner: sdcorejs-angular
---

# Mobile cards for sd-table

Authority: the user's attached specification approves the UX and explicitly requests a short plan followed by implementation, tests, documentation and browser verification without a separate approval round. The attachment is the acceptance contract. This is library work, not portal scaffolding.

1. Add behavioral tests for renderer switching, first mobile render, selection eligibility and command ownership. Extend the existing selection utilities so metadata is prepared independently of desktop pipes. Preserve page/group/visible-tree scope and the existing identity map.
2. Export `SdTableRowMobileDefDirective<T>` and its named template context. A bare directive works with the existing template convention; optional binding to the typed table option provides compiler inference, verified with positive and negative consumer compilation. Add optional `mobile.rowLabel`.
3. Keep the viewport service, data/filter/selection state, MatSort and paginator in the table. Instantiate only one row renderer. Add a private card renderer and action presenter using SdQuickAction and Material bottom sheet; keep group, tree, expand, reorder, footer and command-header controls reachable.
4. Extend the real table showcase, source component documentation and Unreleased changelog. Verify card interactions, responsive layouts, supported themes and overlay cleanup with screenshots.
5. Sync canonical v19 to v20/v21/v22 with the existing script. Run sync parity, script tests, library tests/coverage, lint, library and showcase builds/tests, and the public consumer compilation checks on Node 22.22.3. Record actual evidence and any limitations.

Reuse: SdViewportService for responsive state; TableFormatService and rowKey for identity; table-selection utilities and sdResolveTableActions for selection; command resolver for all command forms; SdQuickAction, Material controls and bottom sheet for actions; existing mobile filter, paginator and content slots. No new business models, selection outputs, context provider, dependency, release or published archive is required.

Key decisions: sort/paginator lifetime is independent of the row branch; mobile UI state owns only the active command and transient overlay. Async resolution is guarded by row/context identity. Floating actions stay inside the owning table's scrolling area, with safe-area clearance, so modal/drawer and multiple-table layouts remain independent. Consumer callbacks retain responsibility for reloads and business results.

Completed: implementation, source documentation, showcase, canonical-to-derived sync, library/script/showcase tests, four builds and strict consumer checks, real browser scenarios and visual review. See [verification and screenshots](../../memories/table-mobile-evidence/README.md).
