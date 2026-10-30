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
1. Column details as switch rows (`config.component`), new i18n key `config.fixed-hint`.
2. `filter.queryBar.editor` default `'inline'` in sd-table; CHANGELOG Changed + Before upgrading.
3. `TableFilterConfiguration.mode?` stored with `inlineExternal`; effective mode = user choice → option → configuration;
   Restore defaults clears it; the settings dot counts it; `filter.modeSelectable`.
4. Settings modal tabs Cột | Bộ lọc; filter tab UI; shared footer (Apply saves both, Skip drops both, Restore resets both).
5. Docs, CHANGELOG, showcase, screenshots.
