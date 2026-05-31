# Generic Module

- **Type:** Tree-shakable services + standalone components (no `@NgModule`, no `forRoot` — provide the config token via `multi: true`)
- **Import path:** `@sdcorejs/angular/modules/generic`
- **Library version:** `@sdcorejs/angular@19.0.0-beta.86`

## One-line purpose

Schema-driven CRUD/list scaffolding: products register `(module, typeCode) → SdRegister<T>` adapters that expose `schema/paging/all/search/create/detail/update/remove`; the generic services convert that registration into ready-to-use `<sd-generic-list>` and `<sd-generic-select>` UIs, plus filtering / lazy-relation / column-from-schema logic.

## When to use

- Building a multi-product portal (e.g. `pcm`, `oms`, `promotion`) where each product has many similar list/select screens that should be derived from server-defined schemas.
- You want one declarative `option` payload (module + typeCode) instead of writing N table screens by hand.
- Need automatic relation column rendering — given a property whose `type === 'relation'`, the generic table fetches the referenced records and shows their `displayField`.
- Need search-with-filter combobox UIs (`<sd-generic-select>`) that automatically read schema's `valueField` / `displayField`.

## What it provides

| Symbol | Kind | Purpose |
|---|---|---|
| `SdGenericService` | Service (`providedIn: 'root'`) | Registry — looks up the right `register(module, typeCode)` factory and wraps it with default `all` / `search` / `detail` implementations |
| `SdGenericListService` | Service (`providedIn: 'root'`) | Builds an `SdTableOption` from a `GenericListOption` (schema-aware columns, server filters, lazy relations) |
| `GenericListComponent` | Component (`sd-generic-list`) | Wraps `<sd-table>` + `SdGenericListService.loadTableOption(option)` |
| `SelectItemComponent` | Component (`sd-generic-select`) | Wraps `<sd-autocomplete>` / `<sd-select>` for relation-style pickers |
| `SD_GENERIC_CONFIGURATION` | InjectionToken (`multi: true`) | Per-product registration |
| `ISdGenericConfiguration<TData>` | Interface | `{ modules: string[]; register: (module, typeCode, args?) => SdRegister<T> }` |
| `SdRegister<T>`, `SdRegisterArgs<TData>` | Interfaces | CRUD adapter shape |
| `SdSchema<T>`, `SdSchemaProperty<T>`, `SdSchemaExternalFilter` | Interfaces | Schema model — `properties[]` drives column types, filters, and relations |
| `GenericListOption<T>`, `TList<T>` | Interfaces | Input to `<sd-generic-list>` (extends `SdTableOption`-style config) and the row-augmented type with `sdList.lazyValues` |

## Configuration

```ts
interface ISdGenericConfiguration<TData = any> {
  /** Which product modules (e.g. ['pcm', 'oms']) this configuration handles */
  modules: string[];

  /** Factory called per (module, typeCode) — returns the CRUD adapter */
  register: <T = any>(
    module: string,
    typeCode: string,
    args?: SdRegisterArgs<TData>,
  ) => SdRegister<T>;
}

interface SdRegister<T = any> {
  schema: () => Promise<SdSchema>;
  paging: (req?: PagingReq<T>) => Promise<PagingRes<T>>;
  all?: (req?: QueryReq<T>) => Promise<T[]>;       // optional — falls back to paging+Utilities.fetchAllByPaging
  search?: (req: SdSearchReq, filters?: Filter[]) => Promise<T[]>;  // optional — falls back to paging by IN/CONTAIN
  detail?: (id: string | number) => Promise<T>;     // optional — falls back to search({ type:'VALUE', value:id })
  create?: (entity: Partial<T>) => Promise<T>;
  update?: (id: string | number, entity: Partial<T>) => Promise<T>;
  remove?: (id: string | number) => Promise<void>;
}

interface SdSchema<T = any> {
  module: string;
  typeCode: string;
  primaryKey: string;
  valueField?: keyof T & string;
  displayField?: keyof T & string;
  transform?: string;             // e.g. '${code} - ${name}'
  properties: SdSchemaProperty<T>[];
  list?: { externalFilters: SdSchemaExternalFilter[] };
  permission?: { list?, detail?, create?, update?, delete? };
  title?: { list?, create?, update?, detail?, delete? };
}
```

## Setup

Register one factory per product module group, using `multi: true`:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: SD_GENERIC_CONFIGURATION,
      multi: true,
      useFactory: () => {
        const api = inject(SdApiService);
        return {
          modules: ['pcm'],
          register: (module, typeCode, args) => ({
            schema: () => api.get(`/api/${module}/${typeCode}/schema`),
            paging: (req) => api.post(`/api/${module}/${typeCode}/paging`, req),
            create: (entity) => api.post(`/api/${module}/${typeCode}`, entity),
            update: (id, entity) => api.put(`/api/${module}/${typeCode}/${id}`, entity),
            remove: (id) => api.delete(`/api/${module}/${typeCode}/${id}`),
          }),
        } satisfies ISdGenericConfiguration;
      },
    },
    {
      provide: SD_GENERIC_CONFIGURATION,
      multi: true,
      useFactory: () => ({
        modules: ['oms'],
        register: (module, typeCode) => ({ /* ... oms-specific endpoints ... */ }),
      } satisfies ISdGenericConfiguration),
    },
  ],
};
```

`SdGenericService` flattens all configurations: each module string in `modules[]` becomes a key into the internal registry.

## Public API

- **`<sd-generic-list [option]>`** — input is `GenericListOption<T>`; the component asks `SdGenericListService.loadTableOption(option)` and renders an `<sd-table>`. Exposes `reload()` to refresh.
- **`<sd-generic-select>`** — relation/multi-select widget with inputs: `module`, `typeCode`, `valueField`, `displayField`, `query`, `multiple`, `addable`, `editable`, `viewable`, `relationMappedTo`, `relationType`, etc. Outputs `modelChange`, `sdChange`, `sdSelection`. (Note: this component still references some legacy types like `PopupDetailComponent`, `BaseEntity`, `PropertyRelationType` that are not exported here — verify before using the popup-detail integration.)
- **`SdGenericService`**:
  - `getRegister<T>(module, typeCode, args?): Required<SdRegister<T>>` — returns the wrapped adapter; throws if module unknown.
  - `dataChanges: Subject<{ module, typeCode }>` — emits after `create` / `update` / `remove`.
- **`SdGenericListService.loadTableOption(option)`** — returns an `SdTableOption<TList<T>>` you can pass to `<sd-table>` directly if you don't want the wrapper component.

## Behavior notes

- **Property → column mapping** (in `#loadColumn`): `number → 'number'`, `date / datetime → 'date'/'datetime'`, `boolean → 'boolean'`, `enum → 'values'` (uses `property.options`), `relation → 'lazy-values'` (uses the related schema's `valueField` / `displayField`), default `'string'`.
- **Lazy relation values** (`#loadLazyValues`): for each `lazy-values` column, the service collects all identity values across the page, calls `register.all({ filters: [{ field: valueField, data: ids, operator: 'IN' }] })` once, and attaches resolved records to `row.sdList.lazyValues[field]`. The column `transform` defaults to `displayField.join(', ')`.
- **Filter coercion** (`#loadFilter`) — handles `number`, `boolean`, `date / datetime / daterange`, `values / lazy-values`, `string`. Operators `NULL` / `NOT_NULL` short-circuit. String default operator is `CONTAIN`.
- **Permission codes** in schema (`schema.permission.list/detail/create/update/delete`) are descriptive — they're not auto-applied; integrate with the `permission` module if you want enforcement.
- **`create` / `update` strip non-insertable / non-updatable fields** before calling the underlying `register.create` / `register.update` — the adapter implementations don't have to filter.
- **`detail` fallback** uses `search({ type: 'VALUE', value: id })[0]` when the adapter doesn't expose `detail` directly.
- **Cache key** is a hash of `{ generic, module, typeCode, args }` — reused as the `<sd-table>` key for column-state persistence.

## Examples

**Render a server-driven list:**
```ts
@Component({
  selector: 'app-product-list',
  template: `<sd-generic-list [option]="option"/>`,
  imports: [GenericListComponent],
})
export class ProductList {
  protected readonly option: GenericListOption<Product> = {
    module: 'pcm',
    typeCode: 'PRODUCT',
    columns: ['code', 'name', 'category', 'createdAt'], // codes from schema
    filter: { externalFilters: [{ field: 'status', type: 'values', /* ... */ }] },
    paginate: { pageSize: 50 },
  };
}
```

**Programmatic CRUD via the registry:**
```ts
@Injectable({ providedIn: 'root' })
export class ProductFacade {
  private readonly generic = inject(SdGenericService);

  async list(filters: Filter[]) {
    const reg = this.generic.getRegister<Product>('pcm', 'PRODUCT');
    return reg.all({ filters });
  }

  async save(p: Product) {
    const reg = this.generic.getRegister<Product>('pcm', 'PRODUCT');
    return p.id ? reg.update(p.id, p) : reg.create(p);
  }
}
```

**React to data changes (e.g. close drawer + reload list):**
```ts
constructor(generic: SdGenericService) {
  generic.dataChanges
    .pipe(filter(e => e.module === 'pcm' && e.typeCode === 'PRODUCT'))
    .subscribe(() => this.list.reload());
}
```

## Anti-patterns

- Do NOT register two `ISdGenericConfiguration`s that both claim the same `modules[]` entry — the second overwrites the first silently in `SdGenericService`.
- Do NOT call `register.create` / `register.update` directly from app code if you want `dataChanges` notifications — go through `SdGenericService.getRegister(...).create(...)` so the wrapper fires the subject.
- Do NOT mutate `SdSchema.properties` returned by `register.schema()` — the service caches none of it explicitly, but downstream components share the array.
- Do NOT rely on `<sd-generic-select>`'s popup-detail integration without auditing — its template references types not exported by this module (likely an internal app dependency).

## Related

- [sd-table](../components/sd-table.md) — backing table component used by `<sd-generic-list>`.
- [sd-autocomplete / sd-select](../forms/) — backing form components used by `<sd-generic-select>`.
- [sd-api](../services/sd-api.md) — typical HTTP client used by `register.*` factories.
- [permission module](./sd-permission.md) — pair with `SdSchema.permission` codes for end-to-end RBAC.
- [layout module](./sd-layout.md) — generic-list pages typically sit inside `<sd-page>`.
