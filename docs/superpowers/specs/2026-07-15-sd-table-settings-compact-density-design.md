# SdTable Settings Compact Density Design

## Context

The “Thiết lập bảng” dialog currently looks loose relative to the surrounding table UI. Two legacy `mr-8` button classes add to the `SdModal` right-footer `gap: 8px`, creating an effective `16px` gap. The title/width inputs use their default `40px` size, and the Material M3 switches use a `52×32px` track.

The user requested a cleaner dialog with tighter footer buttons, chose moderate overall compactness and selected the smallest switch concept after reviewing three visual variants.

## Approved Design

- Keep the existing dialog structure, fields, labels, actions and drag behavior.
- Use `SdInput size="sm"` for the title and width fields.
- Use `40px` rows and a `6px` gap between the drag handle and visibility switch.
- Remove both footer `mr-8` classes and use the shared `8px` modal gap as the only action-spacing source.
- Keep the footer at `56px` minimum height with `16px` padding and preserve the order `Bỏ qua` → `Mặc định` → `Áp dụng`.
- Render the three table-config switches with a `32×18px` visual track, `14px` thumb and `32×40px` interaction box.

## Technical Boundary

The compact switch is contextual. Add a table-config-only class and use Angular Material’s official `mat.slide-toggle-overrides(...)` hook. Do not change global `SdSwitch` geometry, global Material density or public component APIs. Do not use `transform: scale()`.

`SdSwitch size="sm"` is not a valid implementation shortcut: the current component does not expose/wire a functional size input even though its documentation reserves the concept.

## Accessibility And Responsive Behavior

- Preserve Material switch semantics, Space-key activation and disabled behavior.
- Keep a visible focus ring around the `32×40px` interaction box.
- Keep the drag handle independent from the switch target.
- Preserve desktop `SdModal width="sm"` behavior and the existing mobile bottom-sheet presentation.
- Keep all five columns and horizontal table scrolling on narrow viewports; do not invent a stacked mobile form.

## Alternatives Rejected

- Keep the default `52×32px` switch: still visually dominant after the rest of the dialog becomes compact.
- Use the recommended balanced `40×22–24px` switch: lower implementation risk, but not the user-selected visual direction.
- Add a reusable global `SdSwitch size="sm"` API: useful as a separate component feature, broader than this dialog polish.
- Shrink via CSS transform or global density: risks focus/ripple geometry or unrelated consumers.

## Testing And Rollout

- Add focused coverage for `ConfigComponent`, which currently has no component spec.
- Verify footer spacing has one `8px` source and no legacy button margins.
- Verify compact switch styling remains scoped to the three table-config usages.
- Inspect on/off, hover, pressed, focus, disabled and RTL states.
- Implement from v19, then use the repository sync workflow for v20/v21.
- Run focused tests, production builds, `npm run check:sync` and `git diff --check`.

## Scope

This design changes visual density only. It does not change table configuration data, storage, i18n, button semantics, column structure, modal width tokens or global switch behavior.
