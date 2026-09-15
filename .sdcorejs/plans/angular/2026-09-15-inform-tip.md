---
artifact_id: 2026-09-15-inform-tip
artifact_kind: plan
change_ref: inform-2.13
source_spec: none
source_plan: .sdcorejs/plans/angular/2026-09-15-inform-tip.md
commit_policy: with-change
owner: angular-integration
---

# SdInform tip implementation plan

Scope: user-requested compact guidance variant and five showcase groups, preserving the existing default inform behavior and this task's earlier fixes. Existing dirty files are owned by the same ongoing task.

## Design

- Add one optional `type: 'default' | 'tip'` input, defaulting/coercing nullish values to `default`; export its union from the current inform entry point.
- Reuse colors, boolean color shortcuts, contextual outline icons, fontSet/provider overrides, hideIcon, title, description, actions, clamp, close and projection precedence.
- Tip role is `note` with no implicit live region, regardless of severity color. Default keeps alert/status semantics.
- Tip has token-based tinted surface and 3px inline-start border, 4px radius, 8px/12px padding, 13px/20px text and 16px icon aligned to the first line. Content uses normal inline flow for projected rich text and bindings; no innerHTML.
- All new presentation selectors are scoped to `.c-inform-tip`. Maintain focus rings, touch targets and long-text wrapping. Existing default rules remain intact.
- Keep existing projection priority: projected default content replaces title/description/action. A projected title can be supplied with strong markup. Inputs provide the no-projection fallback.

## Execution

1. Add regression tests in `inform/src/inform-tip.spec.ts`; run RED against existing implementation.
2. Add type input, role branch and scoped styles/template sizing; run inform tests including legacy cases.
3. Add five showcase sections: one-line; multiline/title; rich text/binding/link; six Core colors; real input form and table. Update registry count and generated example source.
4. Update `components/inform/sd-inform.md` API and code samples, sync from v19 to v20/v21/v22.
5. Run focused/full unit tests, script tests, sync guard, scoped lint, library/showcase builds, text hygiene and browser desktop/mobile/theme checks. Refresh the running local showcase against the rebuilt library.

Alternatives considered: a separate tip component duplicates API; a CSS-only consumer class cannot provide note semantics or stable public API. A type variant within SdInform meets the requested API with the smallest shared change.
