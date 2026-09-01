# SdDateRange and SdTable accessibility release 2.4

## Contract

- Contract ID: `sdcorejs-angular-date-range-table-accessibility-v2-4`
- Requirement ID: `REQ-SDANGULAR-A11Y-2-4`
- Track: `angular`
- Stack profile: `core-ui-angular`
- Project role: `library`
- Owner module: `date-range-table-accessibility`
- Repository: `github.com/sdcorejs/sdcorejs-angular`
- Source revision: `08091a93f162afa0768de5e932890e4098c89bc9` (`origin/main`)
- Release target: `v2.4`, including exact package version `@sdcorejs/angular@20.2.4`
- Status: Draft

## Goal

Starting from the latest `main` after the 20.2.3 release, remove two accessibility regressions from the canonical v19 Core UI sources, synchronize the supported Angular variants, verify the generated packages, and publish release 2.4 without changing consumer syntax or public APIs.

The change covers:

1. `SdDateRange`: both date inputs expose valid HTML autocomplete tokens.
2. `SdTable`: sort state is exposed only on a semantic column-header host, and the Material sort header does not exist when sorting is disabled or a column is not sortable.

## Scope

### SdDateRange

- Change the `matEndDate` input from the dynamic component ID autocomplete value to the static valid token `autocomplete="off"`.
- Keep the `matStartDate` input at `autocomplete="off"`.
- Preserve IDs, form bindings, datepicker behavior, labels, validation, and the public component API.

### SdTable

- Keep the Material sort directive on the title-only `.c-header-title` region rather than moving it onto the whole native `<th>`.
- Render the Material sort directive only when table sorting is enabled and the leaf column is sortable.
- Give that title-only sort host `role="columnheader"`, so any generated `aria-sort` belongs to an element with column-header semantics.
- Render a plain title region when sorting is disabled, omitted, or the column is not sortable; that path must not instantiate `MatSortHeader`, generate `aria-sort`, add sort keyboard focus, or show a sort icon.
- Keep inline filters and resize controls outside the interactive sort host so their click and keyboard events do not trigger sorting.
- Preserve existing title rendering, custom title templates, grouped/multi-row headers, `rowspan`/`colspan`, resize behavior, sort direction handling, and the existing custom SdTable sort icon.
- Keep the existing stylesheet rule that hides Angular Material's built-in sort arrow. The custom background icon remains the only visible sort indicator; moving the directive to the full `<th>` is explicitly out of scope because it would wrap filter and resize content in the Material sort button.
- If the no-suppression Axe regression proves the nested semantic host invalid, replace it with an internal semantic bridge that meets the same behavioral constraints. Do not move `MatSortHeader` onto a filter-containing `<th>` and do not suppress Axe.

### Tests and verification

- Add regression tests before the implementation and capture the expected RED failures.
- Add direct DOM/directive tests for sort instantiation, semantic placement, focus exposure, accessible names, custom icon behavior, sorting input methods, filters, grouped headers, and resize.
- Add Axe scans for both sorting-enabled and sorting-disabled table fixtures using the WCAG 2.1 A/AA tag set, with no disabled rules, exclusions, impact filtering, allowlists, or result suppression.
- Add `axe-core` only as a development/test dependency if no existing repository dependency provides the required scan. It must not become a runtime dependency or public package dependency.
- Run repository synchronization and all required tests, lint, typecheck-equivalent compilation, builds, generated-source checks, and package/tarball checks for the supported Angular versions.

## Acceptance criteria

1. Both rendered `SdDateRange` inputs have exactly `autocomplete="off"`; neither input derives autocomplete from its generated ID.
2. The date-range regression independently identifies the start and end inputs and rejects missing, empty, ID-derived, or otherwise invalid autocomplete values.
3. With `option.sort.enable === false`, `SdTable` instantiates no `MatSortHeader`, emits no `aria-sort`, exposes no sort-specific focus target, and displays no sort indicator.
4. With `option.sort` omitted, `SdTable` has the same non-sortable DOM behavior as explicitly disabled sorting.
5. With sorting enabled, `MatSortHeader` is instantiated only for leaf columns whose `sortable` value is true; non-sortable and grouped parent headers remain plain.
6. Every generated `aria-sort` is located on either a native `<th>` or an element whose computed role is `columnheader`; no other element carries `aria-sort`.
7. Each sortable column has exactly one custom visible sort indicator and no visible Angular Material arrow in unsorted, ascending, and descending states.
8. Mouse activation cycles the supported sort states and produces the existing request order/direction values without duplicate sort events.
9. Enter and Space activate sorting from the title host, Space prevents page scrolling, and the host retains an accessible name derived from the visible/custom title.
10. Click and keyboard interaction inside inline header filters does not activate or change sorting.
11. Existing plain titles and consumer-provided custom title templates render unchanged in both sortable and non-sortable paths.
12. Multi-header tables preserve header-row count and existing `rowspan`/`colspan`; only eligible leaf title hosts gain sort semantics.
13. Column resize directives, handles, widths, and min/max width behavior remain present and functional when sorting is enabled and disabled.
14. Axe reports zero violations for sorting-enabled and sorting-disabled representative fixtures under the unmodified WCAG 2.1 A/AA rule/tag set.
15. Regression tests are RED against the starting revision for the intended date autocomplete and table semantic/instantiation defects, then GREEN after the source fix.
16. No Axe rule is suppressed or allowlisted, no severity is lowered, no `node_modules` file is patched, and no Enterprise Portal source is changed.
17. Existing public exports, selectors, inputs, outputs, types, CSS hooks, and documented consumer template syntax remain compatible.
18. Canonical v19 changes synchronize cleanly to v20 and v21; the repository's required test, lint, generated-source check, and build commands pass.
19. The release artifacts contain the intended templates/styles/tests, `npm pack` succeeds, and npm confirms exact published version `@sdcorejs/angular@20.2.4` before the work is reported complete.
20. The release commit is pushed using the repository workflow and tag `v2.4` points at the verified release state; no unrelated open pull request is merged as part of this contract.

## Compatibility constraints

- No consumer markup changes.
- No public API or export changes.
- No Portal changes.
- No dependency upgrade outside the minimum development-only Axe test dependency, if required.
- No global rollback of typing or unrelated accessibility work.
- No change to the custom SdTable sort icon contract or sort request shape.

## Source and generated files

- Canonical implementation and tests are edited under `projects/sdcorejs-angular` (Angular 19 source).
- Angular 20 and 21 variants are generated with the repository `sync` workflow rather than edited by hand.
- Changelog and generated `published-pages/2.4` release documentation are updated according to repository release policy.

## Verification evidence required

- RED command output showing the new regressions fail on the starting implementation.
- GREEN focused test output after the implementation.
- Full test/lint/build/sync output required by the repository.
- Tarball inspection showing the corrected generated package content and no unintended runtime dependency.
- `npm view @sdcorejs/angular@20.2.4 version` and post-publish `npm pack`/declaration-content verification.
- Final commit SHA and exact package version.

## Non-goals

- Editing or upgrading Enterprise Portal or Knowledge modules.
- Refactoring unrelated table/date-range behavior.
- Moving the Material sort directive onto the full filter-containing `<th>`.
- Replacing the existing custom sort icon design.
- Publishing an already-used version or overwriting an npm release.
- Merging unrelated or unfinished pull requests.

## Risks and controls

- **Nested header semantics:** the title-only `role="columnheader"` host is guarded by Axe and direct semantic assertions; a failing no-suppression scan requires an internal semantic bridge before release.
- **Double icon:** tests inspect the sortable host across all sort states and verify the built-in Material arrow remains hidden while exactly one custom indicator is visible.
- **Accidental sort from filter controls:** event-isolation tests cover pointer and keyboard interaction inside inline filters.
- **Generated-version drift:** v19 remains canonical and repository synchronization checks must be clean before commit/tag.
- **Release collision:** npm and remote tags are rechecked immediately before publishing/tagging.
