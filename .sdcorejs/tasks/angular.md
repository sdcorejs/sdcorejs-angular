# Living TODO - angular - sdcorejs-angular

> Maintained by `sdcorejs-auto-task-tracker`. Edit by hand when needed.
> Format: `[ ]` open / `[x] (YYYY-MM-DD)` completed / `[!]` blocked.

## Now
- [ ] Verify the first real tag workflow, e.g. `v0.5`, creates `published-docs` for `19/20/21` and pushes the docs commit to `main`.

## Next
- [ ] Update v19/v20/v21 published README font setup so it no longer instructs consumers to load Google Fonts when Core local fonts are expected.
- [ ] Decide whether to remove, keep, or regenerate the existing `published-docs/19.0.4` archive that was created after npm publish.
- [ ] After Pages deploy, check `/docs/versions.json` includes all three versions for the new release.

## Later
- [ ] If branch protection blocks the docs commit, update repository rules to allow GitHub Actions bot pushes for `published-docs/**`.

## Blocked

## Done
- [x] (2026-07-13) Refactor the showcase documentation site across v19/v20/v21 with versioned navigation, full catalog/search, responsive examples, accessibility, and regression coverage.
- [x] (2026-07-03) Fix pre-bump review blockers for icon configuration inheritance and v20/v21 `fontSet/defaultFontSet` API drift.
- [x] (2026-07-03) Track the v19 icon-configuration showcase component and remove generated showcase logs before bump.
- [x] (2026-07-03) Fix Excel/CSV formula injection neutralization in v19/v20/v21 export service.
- [x] (2026-06-10) Move `published-docs` generation into the tag publish workflow and add multi-major docs generation for `19/20/21`.

## Stale
