# @sdcorejs/angular 21.3.0

Release tag `v3.0`, published 2026-10-02.

Release suffix `3.0` targets `19.3.0`, `20.3.0`, `21.3.0`, and `22.3.0`, validated against `*.2.15`.

### Changed (BREAKING for consumers)
- Table: `export.max` is now enforced for Excel and CSV export (it was declared but never read). The table total is checked before any data is fetched, and the `{ items, total }` totals and fetched row count are checked again while exporting; above the limit no file is written and a warning toast shows `core.component.table.export-max-exceeded`. Only a positive finite number is a limit — unset, `0`, negative or `NaN` stays unlimited; `export.type: 'custom'` is unaffected.

```diff
  export: {
-   max: 5000, // ignored before 3.0
+   max: 5000, // now blocks exports above 5,000 rows
  }
```

- Editor and mini-editor: output HTML (`[(model)]`, the form value, `sdChange`, `upload()`) goes through the allowlist filter `sdSanitizeEditorHtml`. CKEditor formatting is kept; `<script>`, `<style>`, `<iframe>`, form controls, every `on*` attribute, links outside http/https/mailto/tel/relative/`#` and image sources outside http/https/`blob:`/relative/`data:image/*` are removed. Loaded content that needs filtering is written back once and the control is marked dirty. The mini-editor link dialog only accepts `https`, `http`, `mailto` and `tel` (`link.allowedProtocols`). Filter stored HTML rendered elsewhere with the same function:

```diff
- <div [innerHTML]="article.body | sdSafeHtml"></div>
+ <div [innerHTML]="sanitize(article.body) | sdSafeHtml"></div>
+ // sanitize = sdSanitizeEditorHtml from '@sdcorejs/angular/utilities/extensions'
```

- Downloads: `SdUtilities.download(url)` with a string that is not an absolute http(s) URL now requires a safe resource URL — relative paths, `blob:`, `data:image/*` and `data:application/pdf`. `javascript:`, `vbscript:` and other `data:` URLs are refused with a dev-mode warning. Preview image/PDF downloads and the upload-file document link apply the same guard.

```diff
- SdUtilities.download('data:text/html,...');
+ SdUtilities.download(URL.createObjectURL(new Blob([html], { type: 'text/html' })), 'report.html');
```

- Tooltip (`sdTooltip`): the bubble has `role="tooltip"` and an id referenced by the trigger's `aria-describedby` while it is shown; it opens on keyboard focus, stays open while the pointer is over the trigger or the bubble, and `Escape` hides it. E2E selectors that assumed the old bubble markup may need updating. `MatTooltip` usages are unchanged.
- Notify: the toast container keeps two visually hidden live regions (`data-autoid="services-notify-live-polite"` and `services-notify-live-assertive`) that announce each toast; toasts no longer carry `aria-live`. The close button is `type="button"` with the i18n label `core.notify.close`, and a toast pauses its timer while hovered or focused. Selectors that count the container's children must skip the two regions.
- Upload file: the document name is a `<button type="button" class="c-file-name">` instead of `<a href="javascript:;">`; the link look is unchanged.
- i18n: new catalog keys `core.notify.close`, `core.form.select.clear`, `core.component.table.export-max-exceeded`, `core.component.preview-video.error`, `.retry`, `.download` and `.unsupported`. A custom typed `I18nCatalog` must add them.

- **Form generic: new schema `SdFormGenericSchema` replaces `SdFormGeneric`.** `<sd-form-builder>` and `<sd-form-render>` read and write the new schema only — this is its first version (no `schemaVersion` field) and there is no automatic conversion, so stored schemas must be migrated once. The tree is fixed: `pages[] → group | field`, groups hold fields and do not nest; this release designs and renders the first page (other pages and `navigation` are kept for the tabs/steps release).

```diff
- const form: SdFormGeneric = {
-   components: [
-     {
-       id: 'a', key: 'email', type: 'textfield', subtype: 'email', label: 'Email',
-       layout: { columns: '6', mobileColumns: '12' },
-       validate: { required: true, maxlength: 120 },
-       properties: { viewed: false, visibleWhenExpression: { key: 'e', type: 'combinator', combinator: '&&', conditions: [/* … */] } },
-     },
-     { id: 'br', type: 'break' },
-     { id: 'c', key: 'district', type: 'select', label: 'District', valuesKey: 'districts', properties: { query: { provinceId: '${province}' } } },
-   ],
-   variables: [{ id: 'v1', key: 'tenantId', label: 'Tenant' }],
-   validations: [{ type: 'function', code: 'BUDGET', alert: 'error' }],
- };
+ const schema: SdFormGenericSchema = {
+   pages: [{
+     id: 'main',
+     elements: [
+       {
+         id: 'a', key: 'email', type: 'textfield', subtype: 'email', label: 'Email',
+         layout: { span: { desktop: 6 } },                    // tablet follows desktop, mobile is a full row
+         validation: { required: true, maxLength: 120 },
+         rules: { visible: { field: 'agree', operator: 'EQUAL', data: true } },   // Filter from @sdcorejs/utils
+       },
+       {
+         id: 'c', key: 'district', type: 'select', label: 'District',
+         layout: { newRow: true },                            // replaces the break element
+         options: { source: 'catalog', catalog: 'districts', params: [{ name: 'provinceId', value: { field: 'province' } }] },
+       },
+     ],
+   }],
+   variables: [{ key: 'tenantId', label: 'Tenant' }],
+   validations: [{ type: 'function', validator: 'budget', alert: 'error' }],
+ };
```

  Property mapping: `components` → `pages[0].elements` (group `components` → `elements`); `layout.columns` / `layout.mobileColumns` → `layout.span.desktop` / `layout.span.mobile` (numbers, plus the new `tablet` level); a `break` element → `layout.newRow: true` on the next field; `validate.*` → `validation.*` with `minLength`, `maxLength`, `maxItems` (was `maxOfItems`), `pattern: { value, message }` (was `pattern` + `patternErrorMessage`) and `'today'` (was `'TODAY'`); `properties.{hidden, viewed, hyperlink, multiple, direction, precision, currency}` and group `properties.{icon, color, collapsible}` → top-level properties; `properties.{visible,hidden,disabled,required}WhenExpression` (`SdFormGenericExpression`) → `rules.{visible, hidden, disabled, required}` stored as `Filter`; `values` → `options: { source: 'static', items }`; `valuesKey` + `properties.query` / `properties.setVariables` → `options: { source: 'catalog', catalog, params, fill }` with structured value refs (`{ field }`, `{ variable }`, `{ value }`) instead of `${key}` strings; upload `properties.{type, max, maxSize, args}` → `accept`, `maxFiles`, `maxSizeMb`, `params`; html `template` + `properties.{variables, queries, query}` → `definition`, `variables` (a record), `query`; validation `{ type: 'expression', expression, message }` → `{ type: 'filter', filter, message }` and `{ type: 'function', code }` → `{ type: 'function', validator }`; variables drop `id`. The `table` and `checklist` field types and the `break` element are gone (a table field returns in a later release). `hyperlink` now URL-encodes every `${key}` value: keep the scheme, host and `/` separators in the template text — a template such as `${baseUrl}/x` or `/files/${path}` whose value carries them must be rewritten.

- **Form generic: component API.** `<sd-form-builder>` binds `[(schema)]` (a `model()`); `<sd-form-render>` takes `[schema]` and a `[(value)]` model that always emits a new object and never mutates the one you pass.

```diff
- <sd-form-builder [formGeneric]="form()" (sdChange)="form.set($event)"></sd-form-builder>
+ <sd-form-builder [(schema)]="schema"></sd-form-builder>

- <sd-form-render [configuration]="config" [form]="form" [entity]="entity" [properties]="keys"></sd-form-render>
+ <sd-form-render [schema]="schema()" [(value)]="value" [form]="form" [variables]="variables" [keys]="keys"></sd-form-render>
```

```diff
- const errors = await render.getValidationMessages('error');
- if (errors === undefined || errors.length) return;
+ const { valid, messages } = await render.validate();   // { valid, messages: { error: [], warning: [] } }, never undefined
+ if (!valid) return;
```

  Removed from the builder: `[formGeneric]`, `(sdChange)`, `getForm()`, `getComponents()`, `getVariables()` and the `components` / `variables` / `validations` accessors — use `[(schema)]` and `getSchema()`. Removed from the renderer: `configuration`, `entity`, `defaultEntity`, `properties`, `getValidationMessages()`, `entity` / `formValue` / `loadCompleted` fields, the `setVariables` subject, and the `onLoaded`, `beforeSubmit` and `onChange.setValues` hooks — use `[schema]`, `[(value)]`, field `defaultValue`, `[keys]`, `[variables]` and `validate()`. Labels sit above the controls by default (`labelPlacement="top"`); `labelPlacement="float"` restores the Material floating label.

- **Form generic: configuration.** `SD_FORM_GENERIC_CONFIGURATION` is replaced by `provideSdFormGeneric()`. Catalogs replace selection definitions and `getValues`; the components never call HTTP. A `function` validation whose validator is not registered now **fails closed** (an error message, `valid: false`) instead of passing.

```diff
- { provide: SD_FORM_GENERIC_CONFIGURATION, useValue: { form: { selections, getValues, htmls, validation: { functions } } } }
+ provideSdFormGeneric({
+   catalogs: [{ id: 'districts', label: 'Districts', params: [{ name: 'provinceId', label: 'Province' }], load: params => api.districts(params) }],
+   htmlDefinitions,
+   validators: [{ id: 'budget', label: 'Budget', validate: value => (value['amount'] > value['budget'] ? 'Over budget' : null) }],
+   breakpoints: { tablet: 700 },   // optional, partial override of SD_FORM_GENERIC_BREAKPOINTS
+ })
```

- **Form generic: removed exports.** Runtime: `SdFeelExpression` (`<sd-feel-expression>`), `sdEvaluateExpression`, `sdExpressionToJavascriptExpression`, `sdTemplateToCondition`, `sdGetAttributes`, `sdGetComponentAttributes`, `sdGetVariableAttributes`, `sdGetDatetimeValue`, `sdGenerateId`, `sdGenerateKey`, `sdFormatComponent`, `SD_FORM_BUILDER_COMPONENTS`, `SD_COMPONENT_ICONS`, `SD_TABLE_COLUMN_TYPES`, `SD_ATTRIBUTE_OPERATORS`, `SD_DAY_INFO_TYPES`, `SD_DAY_INFO_PREVIOUSES`, `SdFormGenericOperators`, `ValidationAlerts` and `SD_FORM_GENERIC_CONFIGURATION`. Types: `ISdFormGenericConfiguration`, `IWorkflowConfigurationForm`, `SdFormGeneric`, `SdFormRenderConfiguration`, `SdFormRenderEntity`, `SdFormGenericArgs`, `SdFormGenericComponent`, `SdFormGenericComponentBase`, `SdFormGenericValues`, `SdFormGenericChecklist`, `SdFormGenericTable`, `SdFormGenericTableColumn`, `FormRenderComponentTableColumnValues`, `SdFormGenericBreak`, `FormBuilderComponent`, `FormBuilderComponentGroup`, `SdFormGenericExpression`, `SdFormGenericExpressionCondition`, `SdFormGenericOperator`, `Attribute`, `DayInfo`, `SdFormGenericSelectionItem`, `SdFormGenericSelectionStaticItem`, `SdFormGenericDefinitionSelection`, `SdFormGenericDefinitionTable`, `SdFormGenericDefinitionHtml`, `SdFormGenericValidationFunction` and `SdFormGenericValidationConfiguration`. These names are kept with a **new shape** (see the property mapping above): `SdFormGenericLayout`, `SdFormGenericVariable`, `SdFormGenericGroup`, `SdFormGenericTemplate`, `SdFormGenericValidation` and the field interfaces `SdFormGenericTextfield`, `SdFormGenericTextarea`, `SdFormGenericNumber`, `SdFormGenericSelect`, `SdFormGenericRadio`, `SdFormGenericCheckbox`, `SdFormGenericDatetime`, `SdFormGenericChipString`, `SdFormGenericChipCalendar`, `SdFormGenericUpload` and `SdFormGenericHtml`. The entry point now exports five runtime symbols — `SdFormBuilder`, `SdFormRender`, `SdFormRenderService`, `provideSdFormGeneric`, `SD_FORM_GENERIC_BREAKPOINTS` — plus the schema, field and configuration types.
- **Form generic: layout follows the form width at three levels.** The renderer picks desktop (≥ 1024 px), tablet (600–1023 px) or mobile (< 600 px) from its **own** width, not the viewport, where 2.15 had a single 768 px switch. `[breakpoint]` forces a level. Tablet inherits the desktop span and mobile defaults to a full row, so a schema that only sets `span.desktop` keeps its desktop rows on tablet-width forms.
- i18n: 217 new catalog keys — `core.component.form-builder.*` (210), `core.component.form-generic.validator.{integer,precision,number}`, `core.component.form-generic.validation.{unregistered,failed}`, `core.form.input.minlength` and `core.form.textarea.minlength` — and 54 `core.component.form-builder.*` keys of the previous builder removed. A custom typed `I18nCatalog` must add and drop them.

### Added
- API handlers work from lazy routes, with no library change (`@sdcorejs/angular/services/api`). `SdHttpInterceptor` is registered at the root injector and read `SD_API_CONFIG` once at construction, so a library that provided `{ provide: SD_API_CONFIG, multi: true }` in an NgModule loaded with `loadChildren` lost every handler without any error: no headers, no `beforeRemote` / `afterRemote`, no error toast. Now the root `SdApiHandlerRegistry` reads the `SD_API_CONFIG` entries of each injector that the Router creates for a route (`Route.providers`, or the NgModule of `loadChildren`). It registers them in the same navigation, before guards, resolvers and components run, and removes them when that injector is destroyed. Libraries keep their existing provider. A lazy handler exists only after its route has been navigated to, so a shell that calls a library's host itself before that, for example in a guard on a parent route, must keep a root handler for that host.
- `provideSdApiConfiguration(Configuration | value)` registers a configuration for any scope, including one that the Router does not create. `provideSdApiConfiguration` registers the configuration in a root registry when its scope's injector is created and removes it when that injector is destroyed. The same declaration therefore works in root providers, an eager NgModule, a lazy `Route.providers` and a `loadChildren` module. The interceptor and `SdApiService` now resolve handlers per request from the root list plus the registry, and root `SD_API_CONFIG` providers keep working unchanged. `SdApiModule` still does not call `provideHttpClient`.
- Image editor: add `SdImageEditor` (`@sdcorejs/angular/components/image-editor`), an inline editor for one still JPEG, PNG or WebP passed as a `File`/`Blob`. It only edits — there is no Apply/Cancel footer: the consumer places its own buttons and calls `getResult()` (`SdImageEditorResult`: `blob`, `file`, `fileName` with the real extension, `mimeType`, `width`, `height`, `size`, `quality`, `edits`, `sizeLimited`), `getFile(fileName?)` or `getBlob()`; `reset()`, `undo()`, `redo()`, `rotate()`, `flip()` and `fitToView()` are public, and `status()`, `dirty()`, `edits()`, `sourceInfo()`, `error()`, `canUndo()`, `canRedo()` are read-only signals. Tools: crop with handles, keyboard and X/Y/width/height fields (`sd-input-number`, committed on blur/Enter); ratio chips (Free, 1:1, 4:3, 16:9, 3:4) and a "Keep ratio" row that locks or frees the crop shape (shown locked and disabled with `lockAspectRatio`, the reason in an info-icon `sdTooltip`); crop, output-size and format fields keep the Core floating label; 90° rotation; horizontal/vertical flip; output size that always follows the crop ratio (never stretched, no accidental upscaling); zoom/pan and fit that never affect the export; bounded undo/redo of small edit objects and reset in the toolbar; output format in an `sd-select` (JPEG/PNG/WebP, probed per browser and verified from the encoded bytes), quality and JPEG background; the real encoded size measured after each change. `(failed)` reports source errors; `getResult()` rejects with `SdImageEditorError` codes (`not-ready`, `format-unsupported`, `render-failed`, `encode-failed`; source codes `unsupported-format`, `animated`, `source-too-large`, `source-too-many-pixels`, `decode-failed`). EXIF orientation is applied once by the decoder; exports are drawn from the full-resolution source with the same matrices as the preview. Configurable `limits` are checked on the header before decoding. The editor never fetches, uploads, downloads or overwrites; `sd-upload-file` and `sd-file-explorer` do not import it. Ships JSDoc, API documentation, 56 i18n keys in the five catalogs, two theme tokens (`--sd-image-editor-checker-light/dark`) and a showcase with avatar, banner, modal (consumer footer), error, `sd-upload-file` (edit an uploaded evidence photo, keep the original) and `sd-file-explorer` (save an edited copy, `reload()`) demos.
- Icon: add default Lucide aliases for `broken_image`, `crop`, `flip`, `lock_open`, `photo_size_select_large`, `redo`, `rotate_left`, `tune`, `undo` and `zoom_out` (and the matching Material aliases).
- Theme tokens: `sd.theme()` also emits colour ramps `--sd-{primary,secondary,info,success,warning,error,neutral}-{50…950}`, semantic roles (`--sd-status-*-bg/fg`, `--sd-link`, `--sd-surface-inverse`, `--sd-text-on-solid`, `--sd-border-focus`, `--sd-border-danger`, `--sd-overlay-backdrop`, `--sd-focus-ring-color`), non-colour scales (`--sd-space-*`, `--sd-radius-*`, `--sd-shadow-*`, `--sd-z-*`, `--sd-duration-*`, `--sd-ease-standard`, `--sd-font-size-*`, `--sd-font-weight-*`, `--sd-line-height-*`, `--sd-focus-ring-width/offset`) and per-component tokens (`--sd-{component}-{part}`). The light output keeps every 2.15 declaration and value.
- Theme modes: `sd.theme($mode: 'light' | 'dark' | 'auto')` for the default palette, with Material's dark colour tokens and `color-scheme`; `sd-core.scss` switches with `data-sd-theme="dark"` / `"light"` on `<html>`. Named presets stay light — combining them with dark or auto stops the Sass build. New guide `assets/THEME.md` and a showcase *Theme & tokens* page (swatches, ramps, scales, measured contrast table, dark toggle).
- `@sdcorejs/angular/utilities/theme`: `readSdTokens()`, `SdColorToken`, `SD_COLOR_TOKENS` for reading resolved colours from TypeScript.
- `sd-highlight` (`@sdcorejs/angular/components/highlight`): highlights a term in text without diacritics or case (including đ/Đ), rendering only text and `<mark>`; `sdNormalizeSearchText()` and `sdFindHighlightRanges()` in `@sdcorejs/angular/utilities/extensions`.
- `sd-preview-video` in `@sdcorejs/angular/components/preview`: native video preview from a URL or `Blob`, with poster, error/unsupported states, retry and a guarded download.
- Select and autocomplete: opt-in `virtualScroll` and `itemSize`. Only the rows in view are rendered, the list is not cut at `limit`, and the keyboard reaches every row (select: arrows, PageUp/PageDown, Home/End, typeahead; autocomplete: arrows with wrap). In virtual mode `sd-select` owns its value, so selected rows scrolled out of view are kept. Default off: the non-virtual panels are unchanged.
- `I18nService.locale()`: BCP 47 locale of the current language (`vi-VN`, `en-US`, `ja-JP`, `ko-KR`, `zh-CN`).
- `sdIsSafeResourceUrl()` and `sdSanitizeEditorHtml()` exported from `@sdcorejs/angular/utilities/extensions`.
- Tooling: `npm run check:scss-hex` (raw hex and focus-outline check for library SCSS/TS, `--report --literals` for scale literals), an ESLint rule for hex colours in library TS and templates, `test:theme` now includes the contrast matrix, `test:theme-token-list`, and a CI scripts job on Node 22.22.3. Release tooling accepts an `x.0` suffix with an explicit lower-minor baseline (`--baseline-suffix`, `deploy.ps1 -BaselineSuffix`, `baselineSuffix` in the release snapshot).

- Form builder: `<sd-form-builder>` is an embedded designer — toolbar Design / Preview / Schema, **Desktop / Tablet / Mobile** and undo / redo; presets palette (Text, Email, Phone, URL, Password, Integer, Decimal, Currency, Percent are `subtype` on `textfield` / `number`); canvas with in-place groups; inspector. Resize and the *Layout* tab write the span of the level in view and show the inherited value (*Same as Desktop* / *Default*); *Start a new row* sets `layout.newRow`. Drag and drop (Pointer Events, one planner for the indicator and the commit), 100-step undo, key rename that updates every structured reference (rules, catalog params/fill, upload params, html query, form validations), Undo toast after a delete, and keyboard paths for every drag. Preview is the real renderer forced to the level in view (tablet 768 px, mobile 390 px frames). Elements of an unknown `type` are kept unchanged and shown as unsupported.
- Form render: `[(value)]` model, `[variables]`, `[breakpoint]`, `[keys]`, `labelPlacement` (`'top'` default, `'float'`), `validate()` and `upload()`; rules and form validations evaluate `Filter` against `{ ...value, ...variables }`; select / radio options from a static list or a portal catalog (`load`, optional `search` and `labels`) with `params` and `fill`. `SdFormRenderService.viewEntities(schema, entities)` formats values for lists.
- Forms: `labelPlacement: 'float' | 'top'` (type `SdLabelPlacement` in `@sdcorejs/angular/forms/models`) on `sd-input`, `sd-input-number`, `sd-textarea`, `sd-select`, `sd-date`, `sd-datetime`, `sd-chip` and `sd-chip-calendar` — default `'float'`, so existing screens are unchanged. `sd-label` gains `for` and `labelId`. `sd-input` accepts `type="tel" | "url"`, `inputmode` and `autocomplete`; `sd-input-number` accepts `inputmode`; `sd-textarea` accepts `minlength`.
- Icon tile shape (`@sdcorejs/angular/modules/icon`): new type `SdIconShape = 'square' | 'circle' | 'none'` for the decorative icon tile of `<sd-section>` (header), `<sd-inform>`, `<sd-data-state>`, `SdNotifyService` toasts and `SdConfirmService` dialogs. Set it per instance with the `iconShape` input (`sd-section`, `sd-inform`, `sd-data-state`) or the `iconShape` option (`success`/`info`/`warning`/`error`, and all six confirm methods), or app-wide with `provideSdIcon({ defaultShape })`; the instance value wins. `none` drops the background but keeps the tile size. Each tile carries `data-icon-shape`, and the CSS custom property `--sd-icon-shape-radius` (default `var(--sd-radius-8, 8px)`) sets the square radius.

### Changed
- Icon tiles of `<sd-section>`, `<sd-inform>`, `<sd-data-state>`, notify toasts and confirm dialogs are square with an 8px radius instead of round. Keep the round tiles app-wide with `provideSdIcon({ defaultShape: 'circle' })`, or per instance with `iconShape="circle"`. The inform tip variant stays flat and transparent. `ISdIconResolvedConfiguration` now includes `defaultShape`: build hand-made `SD_ICON_CONFIGURATION` values with `resolveSdIconConfig(...)`, which fills it.
- API handler selection: when several handlers match a URL, the one with the **longest** matching host prefix (origin plus path) wins. It used to be the first match in registration order, so when libraries share a gateway and differ by context path, provider order decided which handler received a request. Now `https://gw.example/bpm` wins over `https://gw.example` in either order; equally long prefixes keep registration order, with root providers first. If a broad host listed first was shadowing a more specific one on purpose, remove the broad host from that handler. Host matching itself (origin plus segment-aware path, blank hosts match nothing) is unchanged. `@sd-angular/core` 19.0.41 ships the same registry API and the same longest-prefix rule, but it keeps a raw `url.startsWith(host)` match.
- `@sdcorejs/utils` is upgraded from `1.1.4` to `1.2.5` on every line (a runtime dependency of the package, pinned exactly). Consumers that import `@sdcorejs/utils` directly get the 1.2 contract: see its `MIGRATION-1.2.md`. The notable changes are that `getNestedValue` returns `T | undefined` and rejects property paths with whitespace, `normalizeAsync` returns a structural subscribable rather than an RxJS `Observable`, `BrowserUtilities.upload` rejects with `FilePickerCancelledError` when the picker is cancelled or times out instead of resolving empty, the date and number helpers are stricter, and a class that extends a `@sdcorejs/utils` error must declare its own `static override readonly errorName: string` (1.2.5). Behaviour of `@sdcorejs/angular` itself is kept:
  - Cancelling the file picker still produces no error: `sd-upload-file` shows no toast, `SdApiService.upload()` resolves `undefined` without a request, and `SdExcelService.upload()` resolves `{ items: [], file: null }`. 1.2.5 is needed for this in a bundled application: with 1.2.4 the cancel error thrown by one utils entry point was not `instanceof` the class the library imports from another, so the cancel surfaced as an error.
  - Table columns and row groups whose `field` is a backend key with spaces or `*` (for example `'Số phòng ngủ'`, `'Loại sản phẩm*'`) work as with 1.1.x. Cells, `lazy-values`, aggregates, quick search, local filter and sort, and export read such a key literally, or split it on dots, through own properties only; `__proto__`, `prototype` and `constructor` read as empty. Without this, the strict 1.2 path parser fails the whole read with "Không thể tải dữ liệu". Fields that are valid paths are read exactly as before.
  - Public async configuration slots keep accepting RxJS Observables of the same or a narrower type, as with 1.1.x. `MaybeAsync` from 1.2.0-1.2.3 rejects, for example, `Observable<string>` for `string | null | undefined` or an Observable of a subtype. The affected slots are the `sd-breadcrumb` `label`, the auth `signout` / `changePassword` / `authInfo`, the layout `sidebar` / `userInfo` factories, and the permission `loadPermissions` / `getToken`; each is typed `MaybeAsync<T> | Observable<T>`. 1.2.4 fixes the root cause in `@sdcorejs/utils` itself: `SubscribableLike.subscribe` no longer accepts `null` as its first argument, so narrower Observables fit `MaybeAsync<T>` in application code too. Only a literal `null` passed as the first `subscribe` argument on a `SubscribableLike` value is now rejected; pass `undefined` or omit it.
  - Table cells with backend timestamps carrying microsecond fractions or a colon-less offset are formatted as before; 1.2.3 is the first 1.2 release that restores them (1.2.0-1.2.2 rendered them as `--`).
- Table: a failed server read or configuration clears the rows, total, aggregate totals and non-preserved selection of the previous read before the error panel is shown, so rows and a load error are never displayed together and stale rows never look like the result of a new filter. `retryRead()` still replays the exact failed snapshot. This replaces keeping the old rows beside the error.
- Table: a `values` column whose `option.items` lookup rejects or throws no longer fails the table. The lookup is logged and left uncached, so its cells show raw codes, the rows still load, and the next configuration retries the lookup.
- Components read colours, radii, font sizes/weights, line heights, motion and z-index layers from the new tokens, each with its 2.15 value as fallback; light rendering is unchanged.
- Focus rings use `--sd-focus-ring-color` (a component's own colour hook keeps priority). The breadcrumb focus ring now uses the primary colour instead of the info colour; controls whose hook was unset now show the primary ring.
- Dates and numbers formatted by the library (date/datetime min/max messages, query-bar values, home page, 403/404 pages) follow `I18nService.locale()` instead of always `vi-VN`.
- File explorer: video files (`mp4`, `mov`, `webm`, …) play in `sd-preview-video` in the file detail, so `option.preview` is now also called for them. For large videos return a URL (signed or streamed) rather than a `Blob`.

- Form render: `defaultValue` fills a key only while it is `undefined` (a value the user cleared is not refilled), never in viewed mode and never for the password preset; `validation.minLength` applies to `textarea` and `validation.maxItems` to chip fields, and chip fields show their values in viewed mode.
- Form render: a viewed field is not validated (its `required` and constraints never fail `validate()`); on a multiple value `EQUAL` / `NOT_EQUAL` mean "one selected item equals" / "none equals"; an untouched checkbox counts as `false`; a `number` without `subtype` shows 3 decimals in viewed mode, like its input; an invalid `validation.pattern` is ignored instead of breaking the field; an `AND` / `OR` group without conditions is no condition (a rule that is only an empty group does not apply); values inserted into a `hyperlink` are URL-encoded; a key that is an `Object.prototype` name (`__proto__`, `constructor`…) is refused by the builder and its field is skipped by the renderer. `provideSdFormGeneric()` in a route's `providers` applies to the builder, the renderer and `SdFormRenderService` under that route.

### Fixed
- Table: a display callback that throws or rejects (`transform`, `htmlTemplate`, `tooltip`, `useBadge`, `lazy-values` `views`) no longer turns a successful server read into the "Không thể tải dữ liệu" error. Only that cell falls back to its raw value (arrays joined with `, `, empty values `--`); the error is logged once per column for each format pass and the read stays `ready`/`empty`. Only a failing loader is a read error.
- Table: a successful empty server read shows the three illustrated empty states again, as local tables do: filter returned nothing, required external filter not chosen, or no data yet, with `SD_TABLE_CONFIGURATION.images` (`filterEmpty`, `filterRequired`, `dataEmpty`). It had shown a single generic "Chưa có dữ liệu" panel. A projected `sdDataStateTemplate` still renders the empty state, and the empty region only appears when the table has no rows.
- Form render: a group's `color` now colours its icon (`sd-section [iconColor]`); it used to be saved by the builder but ignored at render time. Unset still means `primary`.
- Side drawer: locking page scroll adds the scrollbar width as right padding, so the page no longer shifts when a drawer opens.
- Tooltip: meets WCAG 1.4.13 (hoverable, dismissible with Escape, persistent while hovered or focused).
- Notify: toast announcements are reliable (persistent live regions) and the close button has an accessible name.
- File explorer: let the detail preview shrink (down to 140 px for images and 240 px for PDFs) so the name, type, size and date stay visible without scrolling on short explorers.
- Button: a keyed `@for` of `sd-button-item` / `sd-button-item-divider` (for example `track group.id`) no longer throws `NotFoundError` from `insertBefore` when the list is reordered or an entry is inserted before the last one. The button no longer moves entry hosts into a hidden container after rendering; they stay where Angular projects them, in the trigger's label slot, hidden and without text, so the label and the icon-only footprint are unchanged. `track $index` workarounds can go.
- Showcase: the "View demo source" link on each documentation page points at the root `showcase/` workspace (`showcase/src/app/pages/…`) instead of the removed `versions/v19/projects/showcase` path, which returned 404 on GitHub. `npm run test:scripts` now checks that every registry entry links to the demo file its page loads.
- Docs: the "Related" links at the end of the auth, keycloak and permission module docs point at the sibling module folders (for example `../keycloak/sd-keycloak.md`) and at `services/cache/sd-cache.md`. The old `./sd-*.md` targets returned 404 on GitHub and in the raw published docs.

## Compare with the previous release

- Previous documented release: [21.2.15](https://sdcorejs.github.io/sdcorejs-angular/docs/21.2.15/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v2.15...v3.0
