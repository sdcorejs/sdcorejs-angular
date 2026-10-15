# Generic Module

- **Type:** Providers + routes + pure validator (standalone pages, no NgModule)
- **Import path:** `@sdcorejs/angular/modules/generic`
- **Runtime exports:** `provideSdGeneric`, `provideSdGenericEntity`, `sdGenericRoutes`, `validateSdGenericSchema`

## One-line purpose

Builds list, detail, create, update, Excel import and configuration screens for any entity of any backend from one schema, `SdGenericSchema`. Each backend plugs in through an adapter.

## When to use

- A portal has many CRUD screens over the same backend and wants them generated rather than hand-written.
- Screens must be adjustable per entity, either in code (`provideSdGenericEntity`) or as a stored configuration that an administrator edits in the browser.
- Backends differ (TMS, WMS…): each one is a `module` with its own adapter, and the screens stay the same.

## When NOT to use

- A screen with a workflow, a dashboard or a layout that is not "table + form". Write it with the components directly.
- A single CRUD screen with a fixed shape. `<sd-table>` plus `<sd-form-render>` (or hand-written forms) is simpler.
- As a security layer. Permission checks hide buttons and block client routes; the backend behind the adapter must enforce permissions again.

## Quick start

```ts
// tms.adapter.ts: transport stays in the consumer; the library never calls HTTP.
@Injectable()
export class TmsAdapter implements SdGenericAdapter {
  readonly module = 'tms';
  readonly #http = inject(HttpClient);

  schema = (entity: string) => firstValueFrom(this.#http.get<SdGenericSchema>(`/tms/schemas/${entity}`));
  query = (entity: string, req: PagingReq) => firstValueFrom(this.#http.post<PagingRes<SdGenericRecord>>(`/tms/${entity}/query`, req));
  detail = (entity: string, id: string) => firstValueFrom(this.#http.get<SdGenericRecord>(`/tms/${entity}/${id}`));
  create = (entity: string, data: SdGenericRecord) => firstValueFrom(this.#http.post<SdGenericRecord>(`/tms/${entity}`, data));
  update = (entity: string, id: string, data: SdGenericRecord) => firstValueFrom(this.#http.put<SdGenericRecord>(`/tms/${entity}/${id}`, data));
  delete = (entity: string, id: string) => firstValueFrom(this.#http.delete<void>(`/tms/${entity}/${id}`));
}

// tms.routes.ts: a lazy route provides the adapter and mounts the generic routes under it.
export const TMS_ROUTES: Routes = [
  { path: '', providers: [provideSdGeneric({ adapters: [TmsAdapter] })], children: sdGenericRoutes() },
];
// URL: /tms/generic/tms/order, /tms/generic/tms/order/create, /tms/generic/tms/order/1/detail …
```

## Exported surface

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `provideSdGeneric(configuration: SdGenericConfiguration)` | `EnvironmentProviders` | Registers adapters (`adapters`: classes created by DI, or instances) and the `permission` switch. |
| `provideSdGenericEntity(configuration: SdGenericEntityConfiguration)` | `EnvironmentProviders` | Code-level customization of one entity. |
| `sdGenericRoutes()` | `Routes` | The routes below. Mount them where the adapters are provided. |
| `validateSdGenericSchema(stored, base)` | function | Validates a configuration against the current schema; returns `SdGenericSchemaIssue[]`. |

Every model is exported as a type only: `SdGenericSchema`, `SdGenericProperty`, `SdGenericAdapter`, `SdGenericEntityConfiguration`, `SdGenericCustomAction`, `SdGenericHooks`, `SdGenericSchemaIssue`, …

### Scoping

`provideSdGeneric` and `provideSdGenericEntity` can be called many times, at the root and in the `providers` of lazy routes. A lookup by `module` (or `module` + `entity`) starts at the nearest injector and walks up to the root, so a lazy route can override a root registration. Registering the same module (or entity) twice **in the same injector** throws while that injector is created. `permission` is taken from the nearest injector that declares it.

Because Angular does not merge multi providers of a child injector into its parent, a route can only see adapters of its own injector and its ancestors: mount `sdGenericRoutes()` under the route that provides the adapter, or provide the adapter at the root.

## Routes

| Path | Screen | Permission action |
| --- | --- | --- |
| `generic/:module/:entity` | List (`sd-table`) | `LIST` |
| `generic/:module/:entity/create` | Create form | `CREATE` |
| `generic/:module/:entity/:id/detail` | Detail (read-only form) | `DETAIL` |
| `generic/:module/:entity/:id/update` | Update form | `UPDATE` |
| `generic/:module/:entity/configuration` | Configuration screen | `CONFIGURATION` |

Every route declares `data.permission = SD_PERMISSION_PUBLIC`, so a portal `SdPermissionGuard.canActivateChild` lets it through; the generic guards then check the real code of the route.

The guards also refuse, even with `permission: false`:

- a `:module` or `:entity` that is not made of letters, digits, `_` and `-` with single dots between parts (`sales.order` is fine; a decoded `../admin` or `a b` is not), so a URL can never steer a permission code or an adapter call elsewhere;
- `create`, `:id/detail` and `:id/update` when the entity lists that action in `hiddenDefaults`.

The list, the page forms and the configuration screen render inside `<sd-page>` from `@sdcorejs/angular/modules/layout`, with the title on the left and the actions on the right of its header. The module depends on that entry point on purpose: generic routes run inside the portal layout, which has already loaded it, so `<sd-page>` adds no code to a portal. A separate `<sd-page>` entry point would only matter for an app that uses the generic screens without the layout.

On the list:

- The first visible column that is not a `system` property links to the record. The link opens detail, or update when the user may update but not view the record. When the user may do neither, the column shows plain text.
- There are no built-in row commands. Edit sits in the detail screen and shows only with `UPDATE`; delete sits in the table selector, for one row or for several. `rowCommands` of `provideSdGenericEntity` still add row commands.
- The list filters inline, per column. External filters come only from code: `list.externalFilters` of the backend schema or of the `provideSdGenericEntity` schema adjustment. They show by default, and the filter toolbar (clear / pick filters) is hidden. The configuration screen does not edit them.

Detail and update render their form once the record has loaded, so every field starts from its loaded value. When the record fails to load, the screen shows the error instead of an empty form, and save stays disabled. Edit on the detail screen opens update, which loads the record again, so the form starts from the latest saved values.

Forms open as a **page** or a **side drawer**, decided by `provideSdGenericEntity.display`, then `adapter.display`, then `'page'`. A drawer opens over the list, which stays mounted (filters, sort and page are kept); back or closing the drawer returns to the list. A page form takes the place of the list, which stays mounted too, so its filters, sort and page survive; the list reloads after a save and the focus returns to its heading. When the router reuses a form or the configuration screen for another record or entity (same route, other `:id` / `:entity`), the screen reloads for the new one.

## Permissions

Codes are `<MODULE>_<ENTITY>_C_GENERIC_<ACTION>` in upper case, where `ACTION` is `LIST`, `DETAIL`, `CREATE`, `UPDATE`, `DELETE`, `IMPORT` or `CONFIGURATION`. Word separators of camelCase, kebab-case and dotted names become `_` (`purchaseOrder` → `PURCHASE_ORDER`). They are checked with `SdPermissionService.hasPermission(code)` and the default permission key of the portal. `provideSdGeneric({ adapters, permission: false })` turns every check off (development).

## Schema — `SdGenericSchema`

```ts
interface SdGenericSchema {
  version: 1;
  module: string;
  entity: string;
  general: { label: string; primaryKey?: string /* 'id' */; properties: SdGenericProperty[] };
  list?: {
    title?: string; // plain text, no ${…}
    columns?: { key: string; width?: number; visible?: boolean; sortable?: boolean; filterable?: boolean }[];
    externalFilters?: { key: string; operator?: Operator; default?: unknown; required?: boolean }[];
    orders?: Order[];
    pageSize?: number; // 20
    export?: boolean; // client-side Excel export
  };
  detail?: { title?: string; form?: SdFormGenericSchema };
  create?: { title?: string; form?: SdFormGenericSchema }; // form absent: detail layout, then generated
  update?: { title?: string; form?: SdFormGenericSchema };
  import?: { columns?: { key: string; matchField?: string }[]; upsertKey?: string };
}
```

`general.properties` is the only source of field data. `list`, `import` and the form layouts reference properties by `key`. A form layout is a form-generic schema whose fields keep only their layout (`layout`, `rules`, `helperText`, `placeholder`, `hidden`, `disabled`, `viewed`, `hyperlink`, `direction`); type, label, options, validation and default value are always filled from `general` when the form renders.

### Properties

| `dataType` | List column | Form field | Notes |
| --- | --- | --- | --- |
| `string` | `string` | `textfield` (`format` → subtype); `multiple` → `chip-string` | `format`: `email` / `phone` / `url` / `password` |
| `text` | `string` | `textarea` | |
| `number` | `number` | `number` | `format`: `integer` / `decimal` / `currency` / `percent` |
| `boolean` | `boolean` | `checkbox` | |
| `date` / `datetime` | `date` / `datetime` | `datetime` | |
| `time` | `time` | `time` (`HH:mm`) | |
| `enum` | `values` (badge from `color` / `icon`) | `select` (a stored layout may use `radio`) | `enums: { value, label, color?, icon? }[]` |
| `relation` | `lazy-values` | `select` over the relation catalog | `relation: { module?, entity, valueField?, displayField?, display?, searchFields? }`; `multiple` selects several |
| `json` | none by default (compact JSON when configured) | `json` | |
| `file` | none by default (file names when configured) | `upload` | |

`insertable` / `updatable` default to `true`. `system` properties (`id`, `createdAt`…) are listed and shown in detail but never in create or update. A create form contains only insertable properties and an update form only updatable ones; the payload sent to the adapter is filtered the same way.

### Titles

`list.title` and `create.title` are plain text. `detail.title` and `update.title` may contain `${key}` placeholders of existing properties, filled from the record. Titles are always rendered as text, never as HTML. Without a title the screens use the translated defaults built from `general.label`.

## Adapter — `SdGenericAdapter`

| Member | Notes |
| --- | --- |
| `module` | Key of the backend. |
| `schema(entity)` | Schema of the entity as the backend describes it (`general` is required; other sections are optional defaults). |
| `query(entity, req: PagingReq)` | List page; `req` is the `PagingReq` built by `sd-table` (filters, orders, page). Returns `PagingRes`. |
| `detail(entity, id)` / `create(entity, data)` / `update(entity, id, data)` / `delete(entity, id)` | CRUD. Bulk delete calls `delete` once per row, one after another. |
| `search?(entity, req)` | Dedicated search for relation selects; `req` carries `term` or `values`, `fields`, `valueField`, `filters?`, `limit?`. |
| `schemaStore?: SdGenericSchemaStore` | `{ get(entity), set(entity, schema) }`: where the customized schemas edited on the configuration screen are stored (server-wide or per user — the adapter decides). Absent: `localStorage` under `sd-generic:configuration:<module>.<entity>`, which only lives in that browser. |
| `display?({ schema, action })` | `'page'` or `'side-drawer'` per form. |

`entity` and `id` arrive as plain strings: encode them (`encodeURIComponent`) when they become part of a URL. Error messages thrown by the adapter are shown to the user in toasts and banners, so throw messages that are safe and meaningful for end users.

Relation searches use the entity `search` (from `provideSdGenericEntity`), then the adapter `search`, then `query` with an `OR` of `CONTAIN` filters on the search fields (term) or an `IN` filter on the value field (labels of selected values). Relation values keep their original type when saved, even though select options are strings.

## Entity customization — `provideSdGenericEntity`

```ts
provideSdGenericEntity({
  module: 'tms',
  entity: 'order',
  schema: base => ({ ...base, list: { ...base.list, pageSize: 50 } }), // adjusts the backend schema
  search: req => api.searchOrders(req),                                 // dedicated search API
  display: ({ schema }) => (schema.general.properties.length < 10 ? 'side-drawer' : 'page'),
  hooks: {
    beforeSave: ({ data }) => ({ ...data, channel: 'portal' }), // payload sent to the adapter
    afterSave: ({ result }) => audit.log(result),               // once, after a successful save
  },
  rowCommands: [{ id: 'approve', label: 'Approve', icon: 'check', permission: 'TMS_ORDER_APPROVE', visible: ({ row }) => row?.['status'] === 'NEW', run: ctx => approve(ctx.row!).then(ctx.reload) }],
  listActions: [], bulkActions: [], detailActions: [],
  hiddenDefaults: ['import'], // hides built-in actions: create, import, export, detail, update, delete (and closes the create / detail / update routes)
});
```

Actions receive `{ schema, row?, rows?, reload() }`. JSON configuration cannot hold functions, so actions and hooks are declared only in code.

## Configuration and validation

The effective schema of an entity is built in three layers: `adapter.schema(entity)` → `provideSdGenericEntity.schema(base)` (the **default configuration**) → `schemaStore.get(entity)`. A stored configuration is validated with `validateSdGenericSchema`, then merged:

- `key`, `dataType`, `multiple`, `system`, `enums[].value` and `relation.entity` always come from the backend; labels, enum labels and colors, relation display, validation and default values come from the stored configuration. `insertable` / `updatable` can only be narrowed: a stored `false` applies, but a stored `true` never reopens a property the backend marked `false`.
- Properties removed by the backend are dropped from `general`, the list, the layouts and the import section. New properties join `general` and the configured columns (hidden), but never a stored layout.
- Issues that a backend change can cause are tolerated on load: dangling references are dropped, a title placeholder of a removed property renders empty, and a layout field whose type or create / update flag no longer fits is rebuilt or left out of the form. Any other issue (wrong shape or member type, unsupported `version`, module / entity mismatch, layout grammar, upsert key) makes the screens use the default configuration, logs `console.warn`, and shows a banner with a link to the configuration screen to users who hold `CONFIGURATION`.
- Save is stricter: it refuses every issue, tolerated ones included.

`validateSdGenericSchema(stored: unknown, base)` returns `{ code, severity, path, message }[]` with codes `shape`, `version`, `module-mismatch`, `entity-mismatch`, `property-key-duplicate`, `property-type`, `reference-dangling`, `layout-grammar`, `layout-type-mismatch`, `upsert-key-multiple`, `upsert-key-not-imported`, `create-not-insertable`, `update-not-updatable`, `title-placeholder-forbidden`, `title-placeholder-unknown`. It never throws: a member of the wrong type is a `shape` issue.

The configuration screen has four tabs:

- General: labels; enum labels and colors; relation display and search fields, where an empty value means the default; required; default value; insertable/updatable, which cannot reopen a property the backend locks.
- List: columns, page size and export.
  - The checkbox next to a column name puts the column in the table.
  - "Show by default" decides whether it is visible at first; the end user can still show a hidden column from the column settings of the table.
  - Each column also has sort, filter and width.
  - Columns are reordered by dragging their handle or with the move buttons (keyboard).
- Form: `sd-form-builder` for detail, create and update, with a panel that adds the properties not placed yet. Adding one reloads the builder, which clears its undo history and selection.
- Import: columns, relation match fields, upsert key.

Every property row in General, List and Import shows the data-type icon (from `SD_DATA_TYPE_ICON` of `@sdcorejs/angular/modules/icon`, with the type name as tooltip and accessible name) and the property `key` under its label; `key` and `dataType` are read-only. Save validates first and refuses to store a configuration with issues.

A stored configuration never carries `list.externalFilters`: save drops it, and on load a stored value is ignored without an issue, so the backend schema and `provideSdGenericEntity` stay the only source. `validateSdGenericSchema` itself still checks `list.externalFilters` references when called directly.

## Import

The Excel template has the import columns: configured ones, or every insertable property except `system`, `json` and `file`. Enum cells accept the value or the label; relation cells are matched on `matchField` (default: the relation `displayField`). With `upsertKey` (which must be one of the import columns), existing records are looked up and updated; the others are created.

Lookups run in batches of 100 values, at most five at a time, and an existing-record lookup keeps reading pages until it reaches the `total` the adapter reports, so a backend that caps the page size does not turn existing records into duplicates. A cell or an upsert key that matches several records is reported as ambiguous instead of picking one. Saves go through the same path as the forms (hooks apply), at most five at a time. Every failed row shows its reason in `sd-import-excel`; the messages are escaped, because that component renders them as HTML. Only `IMPORT` is required.

## Anti-patterns

- Relying on the client checks for security. They hide buttons and close routes; the backend behind the adapter must enforce every permission again, including `IMPORT` upserts and searches of related entities.
- Building adapter URLs by concatenating `entity` or `id` without encoding them.
- Throwing raw backend errors (stack traces, SQL, internal ids) from the adapter: the message reaches the user.
- Putting functions or class instances in a stored configuration. It is plain JSON; hooks, actions, `display` and `search` belong to `provideSdGenericEntity`.
- Keeping configurations in the default `localStorage` store in production: they stay in one browser. Give the adapter a `schemaStore` backed by the server.
- Providing the adapter below the route that mounts `sdGenericRoutes()`: the routes cannot see it.

## Limitations

- No change history / audit tab: add it with `detailActions` or a custom screen.
- OneToMany relations are edited as a multi-select only (no child table).
- One configuration per entity; no menu builder.
- Forms of the module use their own `provideSdFormGeneric` (relation catalog); a portal-level form-generic configuration (validators, HTML definitions, breakpoints) does not apply inside them.

## Related

- `<sd-table>` — the list.
- `<sd-form-render>` / `<sd-form-builder>` (`@sdcorejs/angular/components/form-generic`) — forms and the layout designer.
- `<sd-import-excel>` — the import dialog.
- `<sd-side-drawer>` — drawer forms.
- `SdPermissionService` (`@sdcorejs/angular/modules/permission`) — permission checks.
