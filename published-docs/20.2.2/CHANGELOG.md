# @sdcorejs/angular 20.2.2

Release tag `v2.2`, published 2026-08-30.

Release suffix `2.2` publishes `19.2.2`, `20.2.2`, and `21.2.2`.

### Fixed

- **The sidebar highlighted an ancestor menu together with the child the route actually belongs to.** A menu counted as active whenever the current route matched the front of its `path`, so declaring both `/appointment` and `/appointment/cs` lit up both rows while standing on `/appointment/cs`. When several menus match, only the longest — most exact — path is active now; the ancestor goes dark and `aria-current="page"` lands on a single row. The new `resolveActiveMenuPath(menus, routePath)` in the layout `utils` is the single decision point, used by V1 for node focus, menu-group binding and branch expansion, and by the shared `sd-layout-menu-tree` behind V2/V3 and their mobile variants. Matching stays segment-based (`/appointment` still never matches `/appointments`), and a route with no menu of its own (`/appointment/cs/123`) still activates its closest declared ancestor. `MenuFocusPipe` accepts the resolved path as an optional third argument and keeps its previous prefix matching when called with two.

## Compare with the previous release

- Previous documented release: [20.2.1](https://sdcorejs.github.io/sdcorejs-angular/docs/20.2.1/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.1...v2.2
