# Tree hierarchy presentation

Added showLines with booleanAttribute (default false) and option.showLines precedence. Connectors are computed from visible nodes, stop at final siblings, retain ancestor continuation through deeper branches, and update for filtering, collapse and lazy loading. Decorative DOM is aria-hidden and pointer-events:none; indentation and row layout are unchanged. Default parent labels use weight 600, leaves 400; custom templates retain ownership of typography. Toggle icons remain neutral, item icons use primary only when selected.

Files: canonical tree.component.ts/html/scss, tree.model.ts, new tree-lines.spec.ts, sd-tree.md, Showcase tree-demo.component.ts, generated showcase catalogs, CHANGELOG.md and synced v20/v21/v22 counterparts.

Validation: four focused tests pass; full v19 library suite 5443 SUCCESS; 160 script tests pass; v19 lint/build, check:sync and git diff --check pass. Showcase development compilation passed and is serving port 4200. In-app browser navigation timed out, so manual visual verification is not claimed.

## Shared command popover follow-up

Tree commands now render SdButton/SdButtonItem instead of a private MatMenu. Retains visible commands, disabled state, color/fontSet, item autoIds and callbacks using current node context. Trigger retains 24px width, hides the redundant chevron, and remains visible while focused or expanded. Removed private menu CSS and unused Material button/menu/tooltip imports. Tests verify shared surface, callback, focus restoration, disabled keyboard skipping and destroy cleanup.

Validation: 40 focused tree tests pass; full v19 suite 5444 SUCCESS; v19 lint/build and check:sync pass. Script suites passed.
