# @sdcorejs/angular

<p align="center">
  <strong>Reusable Angular UI for data-heavy business applications.</strong>
</p>

<p align="center">
  Built on Angular Material, with standalone controls, consistent form patterns, workflow components, application services, theming, and localization for Angular 19, 20, 21, and 22.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@sdcorejs/angular"><img src="https://img.shields.io/npm/v/@sdcorejs/angular.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@sdcorejs/angular"><img src="https://img.shields.io/npm/dm/@sdcorejs/angular.svg" alt="monthly npm downloads" /></a>
  <a href="#compatibility"><img src="https://img.shields.io/badge/Angular-19%20%7C%2020%20%7C%2021%20%7C%2022-DD0031?logo=angular&logoColor=white" alt="Angular 19, 20, 21, and 22" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/sdcorejs/sdcorejs-angular.svg" alt="MIT license" /></a>
</p>

<p align="center">
  <a href="https://sdcorejs.github.io/sdcorejs-angular/">Showcase</a>
  · <a href="#quick-start">Quick start</a>
  · <a href="#examples-and-documentation">Examples and docs</a>
  · <a href="https://www.npmjs.com/package/@sdcorejs/angular">npm</a>
  · <a href="CHANGELOG.md">Changelog</a>
  · <a href="https://github.com/sdcorejs/sdcorejs-angular/issues">Issues</a>
</p>

## Why SDCoreJS

- **Business UI above the Material primitives.** Use tables, query builders, import/export flows, drawers, modals, and application layout modules without rebuilding those patterns for every portal.
- **One form contract.** Controls share `[(model)]`, validation, disabled, read-only, and viewed-state conventions, with optional `FormGroup` registration for larger forms.
- **Focused application bundles.** Components, forms, services, and modules are published as secondary entry points, and the package declares `sideEffects: false`; import the leaf entry points your application uses.
- **Angular-aligned releases.** The repository maintains matching package lines for Angular 19, 20, 21, and 22 from the same canonical v19 source workspace; Angular 22 begins with `22.2.5`.
- **Documentation for people and tools.** The live showcase is paired with version-pinned Markdown and JSON manifests that can be consumed by developers, automation, and AI coding agents.

## Highlights

| Area                 | What the library provides                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| UI components        | Navigation/data state, PDF preview, job progress, audit diff, modals, drawers, tabs, charts, and editors                                   |
| Data and workflow    | Local/server tables, query builders, entity/tree pickers, unsaved-change guards, background tasks, file upload, and Excel import           |
| Form controls        | Text/mask, number, time/time range, date/date range, datetime, select, autocomplete, checkbox, radio, switch, chip, color, and inline text |
| Application services | Typed API/retry/cancel, ref-counted loading, graph-safe storage/cache/persistence, viewport signals, notifications, and Excel               |
| Portal modules       | Auth, Keycloak, permission, layout, and icon modules                                                                                       |
| Developer experience | Standalone imports, typed APIs, signal-oriented state, `OnPush` components, shared SCSS utilities, and E2E-friendly `data-*` attributes    |
| Localization         | Built-in Vietnamese, English, Japanese, Korean, and Chinese catalogs, plus a synchronous custom-catalog hook                               |

## Compatibility

Use the package major that matches the Angular major in your application.

| Angular | `@sdcorejs/angular` | Recommended install                                                                              |
| ------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| 19.x    | `^19`               | `npm install @sdcorejs/angular@^19 @angular/material@^19 @angular/material-date-fns-adapter@^19` |
| 20.x    | `^20`               | `npm install @sdcorejs/angular@^20 @angular/material@^20 @angular/material-date-fns-adapter@^20` |
| 21.x    | `^21`               | `npm install @sdcorejs/angular@^21 @angular/material@^21 @angular/material-date-fns-adapter@^21` |
| 22.x    | `^22`               | `npm install @sdcorejs/angular@^22 @angular/material@^22 @angular/material-date-fns-adapter@^22` |

The Angular 19–21 package lines keep the shared `^19.0.0 || ^20.0.0 || ^21.0.0` peer contract; the Angular 22 line advertises Angular 22 peers only (`^22.0.0`). The first version number is reserved for Angular compatibility. Read the [changelog](CHANGELOG.md) before upgrading because consumer-breaking changes are called out there explicitly rather than relying on a conventional semver-major bump.

## Installation

Start with an existing Angular 19, 20, 21, or 22 application. This repository and its CI use npm.

```bash
# Example for an Angular 19 application
npm install @sdcorejs/angular@^19 @angular/material@^19 @angular/material-date-fns-adapter@^19
```

`@sdcorejs/utils`, `date-fns`, and the other implementation dependencies declared by the package install transitively.

Load the library stylesheet once, before application-owned overrides:

```scss
/* styles.scss */
@use '@sdcorejs/angular/assets/scss/sd-core';
```

The stylesheet ships the Roboto, Material Icons, and Material Symbols font files used by the library. No Google Fonts link is required. The basic component quick start below also needs no SDCoreJS-specific application provider.

## Quick start

This standalone component renders a primary action, displays a spinner while work is in progress, suppresses repeated clicks through the button's `loading` state, and announces the final status.

```bash
# Match the major to your Angular application
npm install @sdcorejs/angular@^19 @angular/material@^19 @angular/material-date-fns-adapter@^19
```

```scss
/* styles.scss */
@use '@sdcorejs/angular/assets/scss/sd-core';
```

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SdButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-button type="fill" color="primary" title="Save changes" [loading]="saving()" (click)="save()" />

    <p aria-live="polite">{{ status() }}</p>
  `,
})
export class AppComponent {
  readonly saving = signal(false);
  readonly status = signal('Ready');

  async save(): Promise<void> {
    this.saving.set(true);
    this.status.set('Saving…');

    await new Promise<void>(resolve => setTimeout(resolve, 700));

    this.status.set('Saved');
    this.saving.set(false);
  }
}
```

For production work, replace the timer with your typed service call and reset `saving` in a `finally` block.

## Explore the library

The published documentation manifest is the canonical catalog. These groups summarize the main surfaces without duplicating their complete APIs.

| Area                 | Representative APIs                                                                                            | Starting point                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Components           | `SdTable`, `SdTree`, `SdModal`, `SdPreviewPdf`, `SdBreadcrumb`, `SdDataState`, `SdJobProgress`, `SdAuditDiff`  | [Live showcase](https://sdcorejs.github.io/sdcorejs-angular/) and [component catalog](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json)                                                                 |
| Form controls        | `SdInput`, `SdTime`, `SdTimeRange`, `SdEntityPicker`, `SdTreeSelect`, `SdSelect`, `SdDate`, `SdInlineText`     | [Input example source](versions/v19/projects/showcase/src/app/pages/forms/input/input-demo.component.ts) and [forms manifest](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json)                         |
| Services             | `SdApiService`, `SdLoadingService`, `SdCacheService`, `SdStorageService`, `SdViewportService`, `SdTaskService` | [Persistence example source](versions/v19/projects/showcase/src/app/pages/services/persistence/persistence-demo.component.ts) and [services manifest](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json) |
| Modules              | Auth, Keycloak, permission, layout, and icon modules                                                           | [Versioned API manifest](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json)                                                                                                                              |
| Directives and pipes | Responsive, tooltip, href, scroll, copy, date, datetime, number, safe-HTML, and view helpers                   | [Versioned API manifest](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json)                                                                                                                              |

### Representative workflows

- `SdTable` covers local and server data, paging, sorting, filters, selection, grouping, tree rows, custom cell templates, and export-oriented workflows.
- `SdQueryBuilder` and `SdQueryBar` build typed filtering experiences without coupling the UI to a specific backend.
- `SdDocumentBuilder`, the editor components, Excel import, and upload controls support document-heavy application flows.
- `SdEntityPicker` and `SdTreeSelect` compose existing table/tree primitives for typed server and lazy-data selection.
- `SdTaskService` + `SdJobProgress`, `SdUnsavedChangesService`, and `SdAuditDiff` cover long-running work, safe exits, and audit presentation.
- `SdGraphSerializer` is shared by cache/storage so `Date`, `Map`, `Set`, shared references, and cycles survive a versioned persistence round-trip.
- Auth, Keycloak, permission, and layout modules provide optional portal-level building blocks; adopt only the modules your application needs.

## Core concepts

### Standalone and subpath imports

Prefer leaf entry points. They are public secondary entry points and keep feature dependencies explicit.

```ts
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { I18nService } from '@sdcorejs/angular/i18n';
```

Import standalone components in the host component's `imports` array. Services use Angular dependency injection. Avoid importing a broad barrel when a supported leaf entry point is available.

### Forms and validation

Form controls use SDCoreJS's `[(model)]` binding. For group validation, pass a `FormGroup` through `[form]` and provide a stable `name`; the control registers and removes its internal control automatically.

```ts
import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdInput } from '@sdcorejs/angular/forms/input';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [SdInput],
  template: `
    <sd-input [form]="customerForm" name="customerName" label="Customer name" required maxlength="100" [(model)]="customer.name" />
  `,
})
export class CustomerFormComponent {
  readonly customerForm = new FormGroup({});
  readonly customer = { name: '' };
}
```

Controls support combinations of required, length, range, pattern, and custom async validation where applicable. They also distinguish editable, disabled, read-only, and viewed states, and expose projected templates on controls that support custom labels, suffixes, or viewed values. `formControlName` and `[(ngModel)]` are not the SDCoreJS form-control contract.

### Signals and change detection

The component source favors signal inputs, models, computed state, signal outputs, field-level `inject()`, and `ChangeDetectionStrategy.OnPush`. Template binding names remain stable, so normal `[input]` and `(output)` usage does not change when an implementation moves to the signal APIs.

Direct class consumers and tests must use the Angular signal contract after a public member is migrated:

```ts
fixture.componentRef.setInput('value', nextValue);
const currentValue = fixture.componentInstance.value();

const observed: unknown[] = [];
const subscription = fixture.componentInstance.sdChange.subscribe(value => observed.push(value));
subscription.unsubscribe();
```

Signal outputs support `emit()` and Angular-managed subscriptions; do not assume RxJS-only `EventEmitter` methods such as `pipe()`, `complete()`, or `error()`. A small number of outputs intentionally remain `EventEmitter` instances where listener presence through `.observed` is part of the component behavior.

### Theming

`sd-core.scss` loads the reset, utilities, bundled fonts, semantic colors, form styling, and Angular Material theme baseline. Override the public semantic tokens through the `sd.theme()` mixin:

```scss
@use '@sdcorejs/angular/assets/scss/sd-core';
@use '@sdcorejs/angular/assets/scss/themes/default' as sd;

html {
  @include sd.theme(
    (
      primary: #2563eb,
      primary-light: #dbeafe,
      primary-dark: #1d4ed8,
    )
  );
}
```

The public token surface includes semantic values such as `--sd-primary`, `--sd-success`, `--sd-error`, `--sd-surface`, `--sd-text`, and `--sd-border`. Applications that own their Angular Material theme can also configure Material M3 with `mat.theme()` in the global stylesheet. See the [assets and SCSS reference](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/assets/STYLE-GUIDE.md) for the complete supported token and utility list.

### Internationalization

Core UI messages include `vi`, `en`, `ja`, `ko`, and `zh` catalogs. Configure a default language at bootstrap:

```ts
import { ApplicationConfig } from '@angular/core';
import { type ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';

const sdCoreConfig = {
  language: 'en',
} satisfies ISdCoreConfiguration;

export const appConfig: ApplicationConfig = {
  providers: [{ provide: SD_CORE_CONFIGURATION, useValue: sdCoreConfig }],
};
```

`I18nService.setLanguage()` persists a built-in language and reloads by default so the pure `SdTranslatePipe` sees the new catalog. Applications can provide a complete custom catalog through the synchronous `language: () => catalog` configuration hook. See the [i18n reference](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/i18n/i18n.md) for catalog typing, interpolation, fallbacks, and custom-language constraints.

## Examples and documentation

| Resource                                                                                                                      | Use it for                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Live showcase](https://sdcorejs.github.io/sdcorejs-angular/)                                                                 | Browse interactive component, form, and service demos                       |
| [Button example source](versions/v19/projects/showcase/src/app/pages/components/button/button-demo.component.ts)              | Basic actions, variants, icons, disabled state, and loading state           |
| [Input example source](versions/v19/projects/showcase/src/app/pages/forms/input/input-demo.component.ts)                      | Model binding, validation, viewed states, and input variants                |
| [Table example source](versions/v19/projects/showcase/src/app/pages/components/table/table-demo.component.ts)                 | Data, filters, selection, grouping, paging, and tree workflows              |
| [Modal example source](versions/v19/projects/showcase/src/app/pages/components/modal/modal-demo.component.ts)                 | Dialog structure, projected content, and open/close flows                   |
| [Notify example source](versions/v19/projects/showcase/src/app/pages/services/notify/notify-demo.component.ts)                | Notification service usage and message variants                             |
| [Persistence example source](versions/v19/projects/showcase/src/app/pages/services/persistence/persistence-demo.component.ts) | Graph round-trip, stable identity, envelopes, and corrupt-input containment |
| [Latest API manifest](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json)                                     | Discover every published Markdown document for the newest package line      |
| [Styling reference](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/assets/STYLE-GUIDE.md)                            | Supported SCSS entry points, tokens, fonts, images, and utility classes     |
| [E2E attributes](versions/v19/projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md)                                               | Stable runtime selectors and state attributes for automated tests           |
| [Changelog](CHANGELOG.md)                                                                                                     | Consumer-visible changes, breaking notes, and migration guidance            |

The showcase is the visual entry point. Use the version registry and manifest when you need a package-matched API reference; each manifest links to raw Markdown for the selected release.

## AI-readable documentation

The documentation site exposes a small, stable discovery flow:

```text
https://sdcorejs.github.io/sdcorejs-angular/docs/versions.json
https://sdcorejs.github.io/sdcorejs-angular/docs/catalog.json
https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json
https://sdcorejs.github.io/sdcorejs-angular/docs/<version>/index.json
```

Read `versions.json` to select a release that matches the installed package, then follow the document URLs in that release's `index.json`. `catalog.json` provides a cross-version inventory when a tool needs to discover all maintained lines.

## Versioning and releases

- Package major `19`, `20`, `21`, or `22` identifies the matching Angular line. The Angular 22 line starts at `22.2.5`; there are no earlier Angular 22 releases.
- A release suffix is published across the maintained lines from the same v19 source surface, with only required Angular-major adaptations.
- Pin the package major in applications, for example `@sdcorejs/angular@^20` for Angular 20.
- Review [CHANGELOG.md](CHANGELOG.md) before every upgrade. Because the package major is reserved for Angular compatibility, breaking changes are labeled explicitly in the changelog.
- Version-pinned API docs remain available under `/docs/<package-version>/` after release. Each published version ships its own `CHANGELOG.md` plus a diff link against the previous release, so a version can be reviewed without reading any other one.

## Development

The repository uses `versions/v19` as the canonical source workspace. Work on shared library code, tests, and package documentation there; the root sync process derives the v20, v21, and v22 workspaces. The standalone `showcase/` consumes the built v19 library rather than being mirrored into version workspaces.

Prerequisites: exact Node.js `22.22.3`, npm, and a Chromium installation for the headless Karma suite.

```bash
git clone https://github.com/sdcorejs/sdcorejs-angular.git
cd sdcorejs-angular

# Historical package lines retain their reviewed peer-resolution route.
npm --prefix versions/v19 ci --legacy-peer-deps
npm --prefix versions/v20 ci --legacy-peer-deps
npm --prefix versions/v21 ci --legacy-peer-deps

# Angular 22 must resolve normally, without a peer bypass.
npm --prefix versions/v22 ci

# Build the library
npm --prefix versions/v19 run build

# Run the showcase at http://localhost:4200
npm --prefix showcase ci --legacy-peer-deps
npm --prefix showcase run start

# Test and lint the v19 library
npm --prefix versions/v19 run test:ci
npm --prefix versions/v19 run lint
```

After a shared v19 change, return to the repository root:

```bash
npm run sync
npm run check:sync
```

`npm run sync` updates the derived Angular 20, 21, and 22 workspaces. Always review that generated diff before committing it.

## Contributing

1. Create a focused branch from `main`.
2. Make shared changes in `versions/v19`; update tests, showcase examples, and documentation together when the public contract changes.
3. Run the relevant v19 build, tests, and lint commands.
4. Run `npm run sync` and `npm run check:sync` from the repository root.
5. Open a pull request that explains the consumer impact and any migration steps.

Keep public imports backward compatible where possible. Record consumer-breaking behavior under `Changed (BREAKING for consumers)` in the changelog.

Release-preparation branches keep package versions unchanged while review is in progress. Apply the shared release suffix only after the reviewed changes are merged into `main`. The release workflow builds and verifies all four immutable tarballs before one sequential publisher releases Angular 19/20/21 under `angular19`/`angular20`/`angular21`, then Angular 22 under `latest`. Trusted publishing is OIDC-only on exact Node `22.22.3` and npm `11.5.1`; it does not use `NODE_AUTH_TOKEN` or a separate `npm dist-tag` mutation.

## Support and issue reporting

Use [GitHub Issues](https://github.com/sdcorejs/sdcorejs-angular/issues) for reproducible bugs and focused feature proposals. Include the Angular major, `@sdcorejs/angular` version, a minimal reproduction, and the observed and expected behavior.

## Maintainer

### Trần Thuận Nghĩa

**Full Stack Developer** and maintainer of `@sdcorejs/angular`. He builds practical, strongly typed web applications and reusable tools that make complex business workflows easier to deliver and maintain.

[SDCoreJS on GitHub](https://github.com/sdcorejs) · [LinkedIn](https://www.linkedin.com/in/tran-thuan-nghia/) · [Email](mailto:tran.thuan.nghia@gmail.com)

## License

`@sdcorejs/angular` is released under the [MIT License](LICENSE).

