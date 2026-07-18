# Screen Flow - Table Settings Compact Density

## Source

- Direct user input: screenshot of the Vietnamese “Thiết lập bảng” dialog.
- Direct user requirement `UR-1`: reduce spacing between footer buttons.
- Direct user requirement `UR-2`: make the settings dialog visually denser and cleaner.
- Direct user requirement `UR-3`: make the switches smaller.
- Visual density approved by the user: input/button height `32px`, row height `40px`, footer gap `8px`.
- Switch contract approved by the user: visual track `32×18px`, interaction box `32×40px`.
- Product PRD, user stories, acceptance criteria and UAT checklist: not available.

## Entry And Exit Flow

1. The user opens an existing `SdTable` and activates its “Thiết lập” action.
2. `ConfigComponent` opens the existing `SdModal` with the current table-column configuration.
3. The user may:
   - drag rows to change column order;
   - toggle visibility;
   - edit the column title;
   - edit the width;
   - toggle fixed-column behavior;
   - toggle character truncation.
4. The user exits through one of the existing actions:
   - `Bỏ qua`: close without applying the draft;
   - `Mặc định`: restore default configuration;
   - `Áp dụng`: save/apply the draft configuration.

No data flow, persistence or action semantics change in this design.

## Screen And State Map

| Requirement | Screen         | State           | Primary action   | Design treatment                                                                                    |
| ----------- | -------------- | --------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| UR-1        | Table settings | Footer actions  | Áp dụng          | Use the shared `SdModal` right-footer gap of `8px`; remove child margins that currently double it.  |
| UR-2        | Table settings | Data            | Edit settings    | Use `32px` inputs/buttons, `40px` rows, restrained dividers and aligned controls.                   |
| UR-3        | Table settings | Switch on/off   | Toggle setting   | Use a local compact switch visual `32×18px` inside a `32×40px` interaction box.                     |
| UR-2, UR-3  | Table settings | Keyboard focus  | Continue editing | Preserve Material keyboard behavior and show an explicit focus ring around the interaction box.     |
| UR-2        | Table settings | Dragging        | Reorder column   | Keep the existing `24px` drag affordance and vertical-only drag behavior.                           |
| UR-2        | Table settings | Narrow viewport | Scroll/edit      | Keep the existing mobile bottom-sheet flow and horizontal table scrolling; do not collapse columns. |

## State Applicability

- `loading`: not applicable; the existing dialog opens from an in-memory configuration.
- `error`: not applicable to this visual-only change; existing validation/persistence behavior is unchanged.
- `permission denied`: not applicable inside `ConfigComponent`; visibility of the parent table action remains the caller’s responsibility.
- `empty`: existing behavior is unchanged. This design does not invent empty-state copy or actions.

## Responsive Flow

### Desktop

- Keep `width="sm"`; `SdModal` resolves it to `40vw` on desktop.
- Preserve the internal table’s horizontal overflow when localized labels or column content exceed the modal width.
- Keep the sticky table header and right-aligned footer actions.

### Mobile

- Preserve `SdModal` mobile behavior: open as a bottom sheet.
- Keep the five-column table as one horizontally scrollable surface; do not stack individual column settings.
- Keep the footer visible as the action boundary and retain the same `8px` action gap.
- Use the same `40px` row and switch interaction height as desktop.

## Out Of Scope

- Changing table configuration logic, storage, events or translations.
- Adding a working global `size` API to `SdSwitch`.
- Changing global `SdModal`, Angular Material density or switch geometry.
- Changing column widths, table layout structure or modal width tokens.
