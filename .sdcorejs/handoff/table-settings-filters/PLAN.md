# Table settings: filter tab, inline query bar, switch rows — approved plan

Approved 2026-10-30 (follow-up to 3.4). Branch `claude/sd-table-settings-filters` from main. One commit per step,
specs first, commit only when the user says so. No design handoff: the decisions below come from the user's answers.

## Decisions (user)
- Tab "Bộ lọc" in the settings modal is always shown (not opt-in). Hidden when `filter.disabled`, when the table has no
  filter, and on mobile (mobile always renders the default controls). `filter.modeSelectable: false` (default true)
  lets a developer hide it — proposed, not objected to.
- The tab holds the filter kind (Khung bộ lọc / Thanh bộ lọc) and a list of filters with a switch (shown in the frame /
  pinned on the bar), reusing `inlineExternal`.
- sd-table's query bar defaults to `editor: 'inline'` (sd-query-bar on its own keeps `'popover'`).
- Column details: the fixed / truncate options become rows with the label and a description on the left and an
  `sd-switch` on the right (the truncate hint no longer pushes the checkboxes out of line).

## Steps
1. Column details as switch rows (`config.component`), new i18n key `config.fixed-hint`. Done: ddd7c075f.
2. `filter.queryBar.editor` default `'inline'` in sd-table; CHANGELOG Changed + Before upgrading. Done: d568a8ded.
3. `TableFilterConfiguration.mode?` stored with `inlineExternal`; effective mode = user choice → option → configuration;
   Restore defaults clears it; the settings dot counts it; `filter.modeSelectable`. Done: 3c87e5396.
4. Settings modal tabs Cột | Bộ lọc; filter tab UI; shared footer (Apply saves both, Skip drops both, Restore resets both).
   Done: 53c6ed54d.
5. Docs, CHANGELOG, showcase, screenshots.

## Deviations and notes
- Step 2: the header filter icon declares `aria-haspopup="menu"` only with the popover editor (the inline editor focuses
  the chip). The existing query-bar specs pin `editor: 'popover'` in their option builder; the default has its own specs.
- Step 3: `configuration.set()` now merges, which also fixes a set without `inlineExternal` dropping it. The stored
  mode survives a reload only with `filter.key`, like `inlineExternal`.
- Step 4: the filter list holds the external filters only (what `inlineExternal` controls); quick filters are always
  shown in both kinds, so they are not listed. A kind equal to `filter.mode` is not stored. The tab bar follows the
  tablist of the form-builder inspector (APG pattern); the kind cards are native radios. The modal height changes
  with the tab.
- Step 5: the showcase query-bar demo drops its Mode buttons (a stored choice wins over `filter.mode`, so they would
  stop working after a pick in the settings) for Editor inline / popover buttons, and shows the settings button.

## Screenshots (`.sdcorejs/handoff/screenshots/`)
17–18 switch rows (light, dark) · 19–20 inline query bar (light, dark) · 21–23 filter tab (panel, bar, dark) ·
24 showcase query-bar demo after step 5.
