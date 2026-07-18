# Living TODO - angular - sdcorejs-angular

> Maintained by `sdcorejs-auto-task-tracker`. Edit by hand when needed.
> Format: `[ ]` open / `[x] (YYYY-MM-DD)` completed / `[!]` blocked.

## Now
- [ ] Verify the first real tag workflow, e.g. `v0.5`, creates `published-docs` for `19/20/21` and pushes the docs commit to `main`.

## Next
- [ ] Merge the Showcase Loading manifest hotfix PR and confirm `deploy-pages.yml` completes without the runtime exception.
- [ ] When commit is authorized, selectively stage the verified removal and lint-cleanup paths while excluding unrelated `.superpowers/**` and status-only generated files.
- [ ] Repair the 18 repo-level baseline test failures shared by v19/v20/v21 in Chip, ChipCalendar, Input, InputNumber, Inform, AnchorNav, and QuerySavedFiltersMenu.
- [ ] Align the existing Angular 20 package minors so deep `npm ls` no longer reports peer-minor mismatches.
- [ ] Update v19/v20/v21 published README font setup so it no longer instructs consumers to load Google Fonts when Core local fonts are expected.
- [ ] Decide whether to remove, keep, or regenerate the existing `published-docs/19.0.4` archive that was created after npm publish.
- [ ] After Pages deploy, check `/docs/versions.json` includes all three versions for the new release.

## Later
- [ ] If branch protection blocks the docs commit, update repository rules to allow GitHub Actions bot pushes for `published-docs/**`.

## Blocked
- [!] Run the deferred not-found UI and console/network smoke for the removed legacy documentation route - waiting for an available browser backend.
- [!] Run visual/click smoke for `/forms/datetime` - waiting for an available browser backend and Playwright runtime.

## Done
- [x] (2026-07-15) Create the evergreen `SdDatetime` user guide and screenshot-capture script after integrating package `1.0.3`.
- [x] (2026-07-13) Refactor the showcase documentation site across v19/v20/v21 with versioned navigation, full catalog/search, responsive examples, accessibility, and regression coverage.

## Stale
