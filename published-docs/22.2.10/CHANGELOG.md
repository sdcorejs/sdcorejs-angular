# @sdcorejs/angular 22.2.10

Release tag `v2.10`, published 2026-09-12.

Release suffix `2.10` targets `19.2.10`, `20.2.10`, `21.2.10`, and `22.2.10`.

### Fixed

- `sd-table` renders its first successful response when `onFilter` restores URL/saved filters, including the `setFilter()` followed by `notReload` sequence used by Enterprise Console's tenant list. Synchronous hook updates now hydrate the current request and controls before validation instead of cancelling their own read/render subscription. Recheck required tenant validity after hydration; preserve later filter/scope cancellation and explicit refresh/retry. Real-table HTTP regressions verify row DOM and totals as well as loader/request counts with POST dedupe disabled.

- Stabilize the existing Query Builder overlay test fixture's viewport position while retaining clipping, clickability and flip-above assertions. Query Builder runtime behavior is unchanged.

### Consumer upgrade

- Enterprise Console: upgrade Core to `20.2.10` to fix the tenant list staying empty after a successful initial paging response. No table or POST-dedupe workaround is required. Keep the independent layout/configuration and tab-router patch hunks, rebasing only their package version/guard as part of the dependency upgrade; the initial-read duplication patch removed for `20.2.9` stays removed.

## Compare with the previous release

- Previous documented release: [22.2.9](https://sdcorejs.github.io/sdcorejs-angular/docs/22.2.9/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.9...v2.10
