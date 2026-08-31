# @sdcorejs/angular 19.2.3

Release tag `v2.3`, published 2026-08-31.

Release suffix `2.3` publishes `19.2.3`, `20.2.3`, and `21.2.3`.

### Fixed

- **Projected `<sd-tree>` item templates compile again with `strictTemplates` and the documented syntax.** Angular cannot infer the generic parameter of `SdTreeItemDefDirective` from `SdTreeComponentOption<T>` on the parent component because the projected directive has no generic input of its own. Its narrowly scoped compatibility default is restored from `unknown` to `any`, so `<ng-template sdTreeItemDef let-item>{{ item.name }}</ng-template>` no longer requires `$any()`, a cast pipe, or a consumer-local context guard. Every Tree model and option keeps its existing `unknown` default; this does not roll back the broader type-safety improvements.

## Compare with the previous release

- Previous documented release: [19.2.2](https://sdcorejs.github.io/sdcorejs-angular/docs/19.2.2/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.2...v2.3
