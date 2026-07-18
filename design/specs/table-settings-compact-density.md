# Design Spec - Table Settings Compact Density

## Source

- PRD: none.
- User stories: none.
- Acceptance criteria: none before this design session.
- Current UI: user-provided screenshot and `versions/v19/projects/sdcorejs-angular/components/table/src/components/config/config.component.html`.
- Confirmed user decisions:
  - moderate compactness for the dialog;
  - switch visual `32×18px`;
  - switch interaction box `32×40px`;
  - input/button height `32px`;
  - row height `40px`;
  - footer action gap `8px`.

## Requirements Recorded From The Session

| ID   | Requirement                                                                          | Status                    |
| ---- | ------------------------------------------------------------------------------------ | ------------------------- |
| UR-1 | Reduce the excessive spacing between footer buttons.                                 | Confirmed                 |
| UR-2 | Make the table-settings dialog visually cleaner and denser without restructuring it. | Confirmed                 |
| UR-3 | Make the switches visibly smaller.                                                   | Confirmed                 |
| UR-4 | Preserve all current actions, table editing and drag behavior.                       | Confirmed design boundary |

## Screens

| Screen                   | Route / entry                      | Purpose                                                                   | Requirements | Design artifact                                                                       |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| Table settings - desktop | Existing `SdTable` setup action    | Configure column visibility, title, width, fixed and truncation settings. | UR-1..UR-4   | `design/wireframes/table-settings-compact-density/table-settings-dialog-desktop.html` |
| Table settings - mobile  | Same action on a mobile user agent | Configure the same values in the existing bottom-sheet presentation.      | UR-1..UR-4   | `design/wireframes/table-settings-compact-density/table-settings-dialog-mobile.html`  |
| Compact switch states    | Handoff-only state reference       | Specify on/off/hover/pressed/focus/disabled/RTL visuals.                  | UR-3, UR-4   | `design/wireframes/table-settings-compact-density/compact-switch-states.html`         |

### PNG previews

- Desktop: `design/exports/png/table-settings-compact-density/table-settings-dialog-desktop.png`
- Mobile: `design/exports/png/table-settings-compact-density/table-settings-dialog-mobile.png`
- Switch states: `design/exports/png/table-settings-compact-density/compact-switch-states.png`

## Layout

### Desktop dialog

- Preserve the existing `SdModal width="sm"` structure and Vietnamese title “Thiết lập bảng”.
- Preserve the shared modal header geometry: `64px` minimum height and `16px` padding.
- Keep the five-column order: `Hiển thị`, `Tiêu đề cột`, `Rộng`, `Cố định`, `Giới hạn ký tự`.
- Keep the sticky header and the existing horizontal/vertical scroll ownership in `.c-table`.
- Set the visual row rhythm to `40px` minimum height.
- Use `6px` between the `24px` drag handle and compact visibility switch.
- Align boolean columns centrally and text fields to the table grid.
- Retain restrained one-pixel row/header dividers; use shared surface, border and text tokens during implementation rather than new hard-coded production colors.

### Footer

- Preserve `SdModal` footer min-height and padding: `56px` and `16px`.
- Preserve action order: `Bỏ qua` → `Mặc định` → `Áp dụng`.
- Keep only `Áp dụng` as the fill/primary action.
- Use the existing `.sd-modal-footer-right { gap: 8px; }` as the only spacing source.
- Remove the two per-button `mr-8` classes that currently produce an effective `16px` gap.

## Components

| Need                   | Preferred component                       | Handoff notes                                                                                                                          |
| ---------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Modal shell            | `SdModal`                                 | Keep `width="sm"`, title, mobile bottom-sheet behavior and existing footer slots.                                                      |
| Settings grid          | Angular Material table                    | Keep the current columns, sticky header, data source and scroll container.                                                             |
| Reorder                | Angular CDK drag/drop                     | Keep vertical lock and the current drag handle behavior.                                                                               |
| Title and width fields | `SdInput`                                 | Use `size="sm"` and `hideInlineError`; visual height `32px`.                                                                           |
| Boolean controls       | `SdSwitch` plus a table-config-only class | `SdSwitch` does not currently implement functional `size="sm"`; use scoped Material switch overrides only for the three config usages. |
| Footer actions         | `SdButton`                                | Existing default `sm` height is `32px`; no size change is needed.                                                                      |

## Compact Switch Contract

- Visual track: `32×18px`.
- Selected/unselected thumb: `14px` normal visual target.
- Icon: approximately `8–10px`, preserving the current on/off cue.
- Pressed thumb: `16px` maximum so it remains inside the compact track.
- State/focus layer: `28px`, centered within the interaction box.
- Interaction box: `32×40px`; vertically center the visual track.
- Focus: visible `2px` focus ring with separation from the track.
- Scope: only the three `SdSwitch` instances in table config.
- Preferred implementation mechanism: a contextual host class plus Angular Material’s official `mat.slide-toggle-overrides(...)` mixin.
- Do not use:
  - `size="sm"` alone, because it is documented as reserved and is not wired in `SdSwitch`;
  - `transform: scale()`, because it distorts focus/ripple geometry and can shrink the effective target;
  - global Material density or global `SdSwitch` overrides.

## States

| Screen                | State               | Behavior                                                                                     |
| --------------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| Desktop/mobile        | Switch on           | Primary-color track, light thumb and check cue; model behavior unchanged.                    |
| Desktop/mobile        | Switch off          | Muted track, dark thumb and minus cue; model behavior unchanged.                             |
| Desktop/mobile        | Keyboard focus      | Focus ring surrounds the `32×40px` interaction box; Space toggles through Material behavior. |
| Desktop/mobile        | Hover               | Row may use a subtle shared-surface hover cue; the switch retains Material hover feedback.   |
| Desktop/mobile        | Drag                | Keep the row and handle behavior unchanged; do not make the switch the drag target.          |
| Mobile/narrow desktop | Horizontal overflow | Scroll the table surface; keep the footer outside the horizontal scroller.                   |
| State reference       | Disabled / RTL      | Document the visual contract; behavior remains an implementation verification gate.          |

## Copy

- Title: `Thiết lập bảng`.
- Columns: `Hiển thị`, `Tiêu đề cột`, `Rộng`, `Cố định`, `Giới hạn ký tự`.
- Actions: `Bỏ qua`, `Mặc định`, `Áp dụng`.
- Keep existing i18n keys and translations. No new user-facing copy is required.

## Responsive Rules

- Desktop continues to resolve `SdModal width="sm"` as `40vw`.
- Mobile continues to use the existing automatic bottom-sheet mode.
- Preserve the shared bottom-sheet maximum height: `min(80vh, calc(100vh - 16px))`.
- Do not hide, stack or reorder configuration columns at narrow widths.
- Allow horizontal scrolling inside `.c-table` while keeping the modal header/footer stable.
- Use the same compact control dimensions across breakpoints to avoid a layout jump.

## Accessibility

- Preserve native Material switch semantics, keyboard activation and disabled state behavior.
- Maintain a minimum target of `32×40px`, above the `24×24px` WCAG 2.2 minimum target size, while acknowledging this is a dense desktop-oriented control.
- Keep a visible focus indicator and sufficient contrast for track, thumb and icon states.
- Do not attach drag behavior to the switch; the separate drag handle remains the reorder affordance.
- Preserve DOM order as visual/tab order: row controls left-to-right, then footer actions `Bỏ qua`, `Mặc định`, `Áp dụng`.

## Acceptance Criteria For Implementation

| ID    | Criterion                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------- |
| AC-D1 | Effective spacing between adjacent footer buttons is exactly the shared `8px` gap; no child margin adds to it.   |
| AC-D2 | Both editable inputs render with the existing `sm` size (`32px` high) and rows maintain a `40px` compact rhythm. |
| AC-D3 | Only table-config switches render a `32×18px` visual track inside a `32×40px` interaction box.                   |
| AC-D4 | Switch on/off, hover, pressed, focus, disabled and RTL states remain legible and operable.                       |
| AC-D5 | No global `SdSwitch`, `SdModal` or Material density behavior changes.                                            |
| AC-D6 | Button order, labels, action semantics, drag/drop and table configuration persistence remain unchanged.          |
| AC-D7 | The v19 source change is synced to v20/v21 and the multi-version sync guard passes.                              |

## Verification Handoff

- Add focused `ConfigComponent` coverage because no component spec currently exists.
- Assert/remove the legacy `mr-8` footer classes and verify the shared gap is the spacing source.
- Verify the compact class exists only on the three table-config switches.
- Render or inspect switch on/off/focus/pressed states on v19, v20 and v21.
- Run the focused table/config tests, library builds and `npm run check:sync` during implementation.

## Open Questions

None for the concept approved in chat. Review of this written handoff is still pending. A reusable global `SdSwitch size="sm"` API is intentionally deferred to a separate feature.
