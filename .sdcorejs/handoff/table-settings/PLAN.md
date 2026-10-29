# Table settings — approved plan

Approved 2026-10-29. Branch `claude/sd-table-query-bar-0720e1` (on top of the query-bar work). One commit per step, specs
first, commit only when the user says so.

## Steps
1. `feat(table): rebuild the settings columns tab as an expandable list` — config.component.{ts,html,scss,spec.ts},
   `components/config/config-width.util.ts` (+ spec), i18n keys used by the tab.
2. `feat(table): reorder settings columns from the keyboard` — handle keydown, live region, `reorder-*` keys.
3. `feat(table): mark the settings button when the table uses custom settings` — `services/config-custom.util.ts`
   (`defaultConfiguredTable()` extracted from `ConfigService.#default`, `sdTableHasCustomSetup()`), table
   component + `table.component.config-indicator.spec.ts`, `config.customized` key.
4. `docs(table): ...` — sd-table.md, CHANGELOG, showcase demo with 14 columns, screenshots.

## Decisions
1. **Keyboard reorder**: the handle `<button>` owns keydown. Space/Enter picks up and drops, ↑/↓ move with
   `moveItemInArray`, Esc restores the order captured at pick-up. Keydown stops propagation while a row is held so Esc
   does not close the modal. Focus returns to the moved handle in `afterNextRender`. Blur while held drops. The live
   region sits inside the modal (`aria-live="assertive"`), not `LiveAnnouncer`, so `aria-modal` cannot hide it.
2. **`hasCustomSetup`**: computed from the column storage the table already subscribes to, `widthChange$`
   (`persistColumnWidth` writes silently) and `filterRegister.configuration` (`inlineExternal`). Columns present on
   both sides only; order compared with the option, `title`/`width`/`invisible`/`fixed`/`truncate` with the stored
   `origin`. Restore defaults also resets `inlineExternal` (internal `reset` output on `ConfigComponent`; the confirm
   text already says "all settings"). `TableFilterConfiguration.mode` / `modeSelectable` do not exist — skipped.
3. **No mat-table**: `div.c-list[cdkDropList]` scrolls itself (CDK auto-scroll), each `div.c-item[cdkDrag]` holds the
   summary row and the details. Selectors use the item's own classes so the body-level preview keeps its style.
   Pressing the handle closes the open row before CDK measures.
4. **Width**: `/^\s*(\d+(\.\d+)?)\s*(px)?\s*$/i` is px (a bare number too); anything else is shown verbatim as text.
   Clamped and rounded on blur and on Apply, never while typing; `minWidth`/`maxWidth` come from the option, a non-px
   bound is ignored.
5. **Search hides the open row**: the row closes; focus stays in the search box.

## Deviations
- i18n keys land with the step that uses them, not all in step 4.
- Width placeholder: the origin width when there is one, `config.width-auto` otherwise (empty falls back to it).
- The Show checkbox gets its accessible name from a visually hidden `label` (sd-checkbox has no `aria-label` input).
- The truncate hint is visible text under the checkbox (readable by touch and screen readers), not a tooltip.
- Restore defaults resets `inlineExternal` too.
