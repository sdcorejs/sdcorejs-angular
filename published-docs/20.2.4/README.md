# @sdcorejs/angular

Angular Material-based UI building blocks for data-heavy business applications. The package combines standalone components, consistent form controls, workflow primitives, application services, theming, and localization for Angular 19, 20, and 21.

[![npm version](https://img.shields.io/npm/v/@sdcorejs/angular.svg)](https://www.npmjs.com/package/@sdcorejs/angular)
[![monthly npm downloads](https://img.shields.io/npm/dm/@sdcorejs/angular.svg)](https://www.npmjs.com/package/@sdcorejs/angular)
[![Angular 19, 20, and 21](https://img.shields.io/badge/Angular-19%20%7C%2020%20%7C%2021-DD0031?logo=angular&logoColor=white)](#compatibility)
[![MIT license](https://img.shields.io/github/license/sdcorejs/sdcorejs-angular.svg)](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/LICENSE)

[Showcase](https://sdcorejs.github.io/sdcorejs-angular/) · [Quick start](#quick-start) · [API manifest](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json) · [Source](https://github.com/sdcorejs/sdcorejs-angular) · [Changelog](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/CHANGELOG.md) · [Issues](https://github.com/sdcorejs/sdcorejs-angular/issues)

## Compatibility

Install the package major that matches your Angular application.

| Angular | Package                 | Recommended install                                                                              |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| 19.x    | `@sdcorejs/angular@^19` | `npm install @sdcorejs/angular@^19 @angular/material@^19 @angular/material-date-fns-adapter@^19` |
| 20.x    | `@sdcorejs/angular@^20` | `npm install @sdcorejs/angular@^20 @angular/material@^20 @angular/material-date-fns-adapter@^20` |
| 21.x    | `@sdcorejs/angular@^21` | `npm install @sdcorejs/angular@^21 @angular/material@^21 @angular/material-date-fns-adapter@^21` |

The package manifests accept Angular 19–21 peers, while releases provide an Angular-aligned package line for each major. The first version number is reserved for Angular compatibility, so read the [changelog](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/CHANGELOG.md) for explicitly labeled breaking changes before upgrading.

### Peer dependencies

The package declares these peers. A standard Angular CLI application already provides all of them except `@angular/material` and `@angular/material-date-fns-adapter`, which is why only those two appear in the install commands above.

| Peer | Range |
| --- | --- |
| `@angular/animations` · `@angular/cdk` · `@angular/common` · `@angular/core` · `@angular/forms` · `@angular/platform-browser` · `@angular/router` | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `@angular/material` · `@angular/material-date-fns-adapter` | `^19.0.0 \|\| ^20.0.0 \|\| ^21.0.0` |
| `rxjs` | `^7.8.0` |

## Installation and setup

The examples below use Angular 19; replace `19` with your application's Angular major.

```bash
npm install @sdcorejs/angular@^19 @angular/material@^19 @angular/material-date-fns-adapter@^19
```

Load the global stylesheet once:

```scss
/* styles.scss */
@use '@sdcorejs/angular/assets/scss/sd-core';
```

The stylesheet includes the Roboto, Material Icons, and Material Symbols font files used by the library. No Google Fonts link is required. `@sdcorejs/utils`, `date-fns`, and other declared implementation dependencies install transitively.

## Quick start

This standalone component renders a primary action and shows the button's built-in loading state while work is in progress. No SDCoreJS-specific provider is required for this example.

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

Replace the timer with your typed service call and reset `saving` in a `finally` block in production code.

## Main capabilities

| Area              | Representative APIs                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| UI components     | Navigation/data state, PDF preview, job progress, audit diff, modals, drawers, tabs, charts, editors, and document tooling      |
| Data and workflow | Local/server tables, entity/tree pickers, query builders, unsaved-change guards, background tasks, upload, and Excel import     |
| Form controls     | Text/mask, number, time/time range, date/date range, datetime, select, autocomplete, checkbox, radio, switch, chip, and color   |
| Services          | Typed API/retry/cancel, ref-counted loading, graph-safe persistence/cache/storage, viewport signals, notifications, and exports |
| Portal modules    | Auth, Keycloak, permission, layout, and icon modules                                                                            |
| Localization      | Built-in `vi`, `en`, `ja`, `ko`, and `zh` catalogs, plus a synchronous custom-catalog provider                                  |

The [live showcase](https://sdcorejs.github.io/sdcorejs-angular/) demonstrates components, forms, and services. The [latest API manifest](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json) lists every published reference document without duplicating the full API here.

## Standalone and subpath imports

Prefer public leaf entry points so dependencies stay explicit and unused entry points can be removed from the application graph. The package declares `sideEffects: false`.

```ts
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { I18nService } from '@sdcorejs/angular/i18n';
```

Import standalone components in the host component's `imports` array and inject services normally.

Form controls use `[(model)]`. For group validation, pass a `FormGroup` through `[form]` and provide a `name`; SDCoreJS controls do not use `formControlName` or `[(ngModel)]` as their integration contract.

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

## Theming

`sd-core.scss` loads the reset, utilities, bundled fonts, semantic colors, form styles, and Angular Material theme baseline. Override public semantic colors with `sd.theme()`:

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

See the [assets and SCSS reference](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/assets/STYLE-GUIDE.md) for supported `--sd-*` tokens, Material M3 guidance, utilities, fonts, and image assets.

## Internationalization

Set the default Core UI language through `SD_CORE_CONFIGURATION`:

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

`I18nService.setLanguage()` persists a built-in language and reloads by default. A complete custom catalog can be supplied through the synchronous `language: () => catalog` hook. See the [i18n reference](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/i18n/i18n.md) for catalog typing and fallback behavior.

## Documentation and examples

| Resource                                                                                                                                                                             | Purpose                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [Live showcase](https://sdcorejs.github.io/sdcorejs-angular/)                                                                                                                        | Interactive component, form, and service demos                             |
| [Button example source](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/versions/v19/projects/showcase/src/app/pages/components/button/button-demo.component.ts)              | Action variants, icons, disabled state, and loading state                  |
| [Input example source](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/versions/v19/projects/showcase/src/app/pages/forms/input/input-demo.component.ts)                      | Model binding, validation, and viewed states                               |
| [Table example source](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/versions/v19/projects/showcase/src/app/pages/components/table/table-demo.component.ts)                 | Data, selection, filters, grouping, paging, and tree workflows             |
| [Persistence example source](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/versions/v19/projects/showcase/src/app/pages/services/persistence/persistence-demo.component.ts) | Graph round-trip, identity, envelopes, and error containment               |
| [Latest API manifest](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/index.json)                                                                                            | Discover all Markdown docs for the latest release                          |
| [Versions registry](https://sdcorejs.github.io/sdcorejs-angular/docs/versions.json)                                                                                                  | Select docs matching an installed package version                          |
| [Machine-readable catalog](https://sdcorejs.github.io/sdcorejs-angular/docs/catalog.json)                                                                                            | Discover documentation across maintained package lines                     |
| [E2E attributes](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/versions/v19/projects/sdcorejs-angular/docs/E2E-ATTRIBUTES.md)                                               | Stable runtime selectors and state attributes                              |
| [Release notes for this version](https://sdcorejs.github.io/sdcorejs-angular/docs/latest/CHANGELOG.md)                                                                               | What changed in this release and how it differs from the previous one      |

## Versioning

- Use `@sdcorejs/angular@^19`, `@^20`, or `@^21` to match the application's Angular major.
- Maintained package lines are released from the same feature surface with required Angular-major adaptations.
- Consumer-breaking changes and migration notes are recorded in the [changelog](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/CHANGELOG.md).
- Version-pinned reference docs remain available under `https://sdcorejs.github.io/sdcorejs-angular/docs/<package-version>/`.
- Every published version is self-contained: `docs/<package-version>/CHANGELOG.md` carries that release's notes and a source diff link against the previous release.

## Contributing

Contributions are welcome through focused pull requests. See the [repository contribution workflow](https://github.com/sdcorejs/sdcorejs-angular#contributing) for setup, validation, and source-workspace guidance.

## Support

Use [GitHub Issues](https://github.com/sdcorejs/sdcorejs-angular/issues) for reproducible bugs and focused feature proposals. Include the Angular major, package version, a minimal reproduction, and the expected behavior.

## Maintainer

**Trần Thuận Nghĩa** — Full Stack Developer and maintainer of `@sdcorejs/angular`. He builds practical, strongly typed web applications and reusable tools that make complex business workflows easier to deliver and maintain.

[SDCoreJS on GitHub](https://github.com/sdcorejs) · [LinkedIn](https://www.linkedin.com/in/tran-thuan-nghia/) · [Email](mailto:tran.thuan.nghia@gmail.com)

## License

MIT © Trần Thuận Nghĩa. See the [repository license](https://github.com/sdcorejs/sdcorejs-angular/blob/v2.4/LICENSE).
