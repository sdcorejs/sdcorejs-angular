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
- Open row background: `color-mix(in srgb, var(--sd-text) 4%, transparent)` instead of `--sd-surface` (the modal body
  already is `--sd-surface`, so the open row would not stand out). Handle colour: `--sd-disabled-text`
  (`--sd-text-disabled` is not a theme token).
- The search icon is a suffix (sd-input has no prefix slot). "Hiện tất cả" uses `color="primary"` as in the mock.
- The Show checkbox's 40px state layer is pulled to 18px with a negative margin so titles line up with the 62px
  details column; handle and open button sit above the spare touch area.
- The dot hides when `isMobile()`, not only with mobile cards (without `sdRowMobileDef` the desktop footer shows).
- Forced colours: a hidden column's title uses `GrayText`.

## Commits
1. 103c54a9b — columns tab list. 2. 79db5f374 — keyboard reorder. 3. a8402f3f7 — settings button dot.
4. docs, CHANGELOG, showcase demo "Thiết lập cột" (14 columns), forced-colours title.

## API consistency review (for the PR)
- Compared with: sd-button (`indicator`, `indicatorColor`, `indicatorLabel` used as documented), sd-input / sd-checkbox
  (`size="sm"`, `hideInlineError`, `label`), sd-modal (`sdFooterLeft` / `sdFooterRight`), existing table autoIds.
- Public API: unchanged. `ConfiguredColumn`, `ConfiguredTable`, `ConfiguredTableResult`, `ConfigService`, storage key and
  format, `open()` / `close()` / `onSave()` / `onReset()`, footer autoIds kept.
- Additions: `SdTable.hasCustomSetup` (computed) and `onConfigDefaultsRestored`, `ConfigComponent.defaultsRestored`
  (component not exported), autoIds `-config-find` (sd-input → `forms-input-…`) and `-config-show-all` following the
  `-config-*` pattern, `services/config-custom.util.ts` (internal, `sdTable*` prefix like `sdTableQueryFields`).
- Behaviour change: Restore defaults also restores the inline external filters; edits no longer mutate the stored
  objects, so Skip leaves them untouched.
- v19 → v20/v21/v22 by `npm run sync`; `check:sync` green; no hand edits in derived workspaces.
- Independent review: pending.

## Showcase checks done
5 and 14 columns; mouse and keyboard reorder, Escape keeps the modal; open rows, rename + restore, width number /
empty / `20%` / min-max clamp (160 → 320); Apply → dot, resize → dot, Restore defaults → off, reload with `key` → kept;
light, dark, graphite tokens, forced colours (dot and modal), reduced motion; 1280px (modal 512px) and 1920px (768px).
Not checked with a real screen reader (live region content only).
