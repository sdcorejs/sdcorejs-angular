# `<sd-api-contract-builder>`

**Type**: Component
**Selector**: `sd-api-contract-builder`
**Import path**: `@sdcorejs/angular/components/api-contract-builder` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdApiContractBuilder`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

Visual builder that creates, edits and validates an **API contract** — a JSON document describing the
data the frontend hands in, the HTTP request that is sent, the HTTP response that comes back, and the
data the frontend finally receives.

## When to use

- Let an integrator declare an endpoint once and reuse it across screens instead of hand-writing
  request/response mapping code.
- Prepare the metadata a low-code `form-builder` / `form-render` needs: which endpoint feeds a
  dropdown, which fields exist in the output, which one is the `valueField`, which is the
  `displayField`, which columns a table can render.
- Give a reviewer a readable, deterministic JSON diff for an endpoint change.

## When NOT to use

- To **call** the API. This component never performs a request — it has no HTTP dependency at all.
  Executing a contract is a separate, future concern.
- To store secrets. The builder receives env **definitions**, never values (see
  [Configuration injection](#configuration-injection)).
- To model GraphQL, SOAP, WebSocket, multipart uploads or file transfer.
- To express computed values. There is no scripting, no arithmetic and no per-element array
  transformation — see [Non-goals](#limitations--non-goals).

## Inputs

| Name       | Type                             | Default     | Notes                                                                                              |
| ---------- | -------------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| `model`    | `SdApiContract \| null` (`model()`) | `null`      | Two-way bound contract. The component deep-copies it and never writes into the object you own.       |
| `mode`     | `'edit' \| 'view'`               | `'edit'`    | `'view'` renders a summary, the diagnostics and the JSON — no editors.                               |
| `disabled` | `boolean`                        | `false`     | `transform: booleanAttribute`. Keeps every step visible and navigable, but nothing can be edited.    |
| `autoId`   | `string \| null \| undefined`    | `undefined` | Emitted as `data-autoId` on the host and derived onto the inner controls for e2e selectors.          |

## Outputs

| Name                | Type                                    | Notes                                                                                     |
| ------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `modelChange`       | (signal model two-way)                  | Standard `[(model)]`. Emits a **new immutable contract** exactly once per user action.       |
| `diagnosticsChange` | `readonly SdApiContractDiagnostic[]`    | Fires whenever the diagnostics change, including once for the initially seeded contract.     |
| `validChange`       | `boolean`                               | Fires **only when validity flips**, so a Save button can bind to it without debouncing.      |

### Model synchronisation guarantees

- **Parent → component**: the contract is deep-cloned on the way in. A structurally invalid contract
  is displayed as-is and reported through diagnostics — it is never silently normalized, and seeding
  never emits back.
- **Component → parent**: every edit builds a new contract object and emits once. Step navigation,
  validation, confirmation prompts and expansion state emit nothing.

## Configuration injection

Global variables a contract may reference are declared per application, not per contract:

```ts
import { provideSdApiContract } from '@sdcorejs/angular/components/api-contract-builder';

bootstrapApplication(AppComponent, {
  providers: [
    provideSdApiContract({
      env: {
        baseUrl: { type: 'string', label: 'Backend base URL' },
        token: { type: 'string', label: 'Access token', sensitive: true },
        userId: { type: 'string', label: 'Current user ID' },
      },
    }),
  ],
});
```

| Symbol                              | Purpose                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `provideSdApiContract(config)`      | Registers the env catalog for every builder in the injector.               |
| `SD_API_CONTRACT_CONFIGURATION`     | The underlying `InjectionToken`. `provideSdApiContract()` returns `EnvironmentProviders` (bootstrap / route level); to scope a catalog to one component — two builders with different catalogs on one page — provide this token in the component's own `providers` instead. |
| `SD_API_CONTRACT_EMPTY_CONFIGURATION` | What the builder falls back to when nothing is provided.                  |
| `SdApiContractEnvironmentVariable`  | `{ type, label?, description?, sensitive? }` — a **declaration**, no value. |

Rules:

- The builder only ever sees definitions. **No env value is stored in the contract**, only the
  reference `${env.token}`.
- Without a configuration the catalog is empty, so every `${env.*}` reports `mapping.env.unknown`.
- `sensitive: true` badges the variable in the reference picker. There is no value to preview, and
  the picker never renders one.
- A global **must** carry the `env.` prefix. `${token}` is rejected by the parser; `${env.token}` is
  the only accepted form.

## Canonical JSON model

The persisted document always has exactly four layers, and the names never change:

```ts
interface SdApiContract {
  contractVersion: 1;
  code: string;
  name: string;
  description?: string;

  input: { schema: SdApiContractFeSchemaNode }; // what the frontend hands in
  req: SdApiContractRequest; // the real HTTP request
  res: SdApiContractResponse; // the real HTTP response
  output: { schema: SdApiContractMappedFeSchemaNode }; // what the frontend receives
}
```

`input` and `output` are **frontend** contracts, so they nest under `.schema`. `req` and `res`
describe **HTTP**, so they expose REST structure directly and have **no** `.schema` wrapper.

## Data-type vocabulary

```ts
type SdApiContractDataType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'object' | 'array';
```

- Lowercase literals only. No UI-control names (`input`, `select`, …) and no `integer` — use `number`.
- `object` carries `properties`; `array` carries `items`.
- `date` / `datetime` are **logical** types. On the wire they are strings; they are never a JavaScript
  `Date` in the persisted JSON.
- Deliberately **not** `SdQueryBuilderFieldType`: that union describes filterable fields in a query UI
  and drifts for different reasons.
- New types can be added later because every node is a discriminated union on `type`.

## Required

`required` sits **next to `type`** on each node — there is no `required: string[]` array on the parent
object the way JSON Schema does it.

**The model is tri-state; the editor is two-state.**

| Value       | Meaning                | In the JSON         | Shown in the editor as |
| ----------- | ---------------------- | ------------------- | ---------------------- |
| `undefined` | not declared           | key omitted         | *Không* (not required)  |
| `true`      | mandatory              | `"required": true`  | *Có*                    |
| `false`     | explicitly optional    | `"required": false` | *Không*                 |

The picker offers only **Có / Không**, defaulting to *Không*: an absent `required` and an explicit
`false` mean the same thing to a consumer, so a third "not declared" option was noise in the UI.
Picking *Có* writes `"required": true`; picking *Không* **removes the key**, which keeps the JSON
small.

The tri-state survives in the model, so nothing is lost: a hand-authored `"required": false` loads,
validates, serializes and round-trips unchanged — the editor simply displays it as *Không* and never
rewrites it on its own. Only an explicit toggle by the author collapses it to an omitted key.

Property names live in a `Record<string, Node>`, never in an array of `{ key, … }`. The editor may use
an internal array to render, but internal ids, expansion, selection and drag state never reach the
JSON — the serializer copies a fixed key whitelist rather than the object it was handed.

## Expression syntax

```text
${input.<path>}      ${env.<key>}      ${res.<path>}
```

**Exact expression** — the whole string is one expression, so the value keeps its own type:

```json
{ "type": "number", "source": "${input.page}" }
```

**String interpolation** — an expression inside a larger string always produces a string, so it is
only valid when the target node is `string` (or inside `req.url`):

```json
{ "type": "string", "source": "Bearer ${env.token}" }
```

**Static literal** — no expression at all:

```json
{ "type": "string", "value": "STATIC VALUE" }
```

### Allowed roots per position

| Position                                        | Allowed         | Rejected        |
| ----------------------------------------------- | --------------- | --------------- |
| `req.url`, `req.path`, `req.query`, `req.headers`, `req.body` | `input`, `env`  | `res`, `output` |
| `output.schema`                                 | `res`, `input`, `env` | `output`  |
| `input.schema`, `res.*`                         | *(declarations — no mapping at all)* | any |

### Security / non-execution guarantees

The parser is a **pure string scanner**. It accepts exactly
`${<root>.<identifier>(.<identifier>)*}` and nothing else:

- No `eval`, no `new Function`, no dynamic code execution anywhere in the package.
- No method calls (`${input.a.toUpperCase()}`), no arithmetic (`${1 + 1}`), no operators, no indexing
  (`${input.a[0]}`), no bracket access (`${input["a"]}`).
- `__proto__`, `prototype` and `constructor` are rejected as path segments, at the **parser** — so
  every consumer of a reference (validator, picker, a future executor) inherits the protection.
- Malformed templates are rejected, not guessed: `${}`, `${input.}`, a missing `}`, a nested
  `${${…}}`, or any whitespace inside the path.
- Every dynamic key read walks `Object.prototype.hasOwnProperty`, so nothing inherited resolves.

## Source versus static value

Each mapped node offers exactly one of two ways to receive a value:

| Member   | Meaning                                            |
| -------- | -------------------------------------------------- |
| `source` | expression / template reading `input`, `env`, `res` |
| `value`  | a static, JSON-serializable literal                 |

They are **mutually exclusive** — a node carrying both reports `mapping.source-and-value`.

There are no `requestMappings: []` / `responseMappings: []` arrays. A request mapping lives directly
in `req.path` / `req.query` / `req.headers` / `req.body`; a response-to-output mapping lives directly
in `output.schema`.

**Composite nodes:**

- An object may map as a whole through `source`, **or** map field by field through `properties` —
  never both (`mapping.object.conflict`).
- An array may map as a whole through `source`; `items` describes the element type. Per-item
  projection is not implemented.
- Inside a subtree covered by a whole-node `source`, the children are plain declarations — they do
  not need their own `source`.

## REST request structure

```ts
type SdApiContractHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

interface SdApiContractRequest {
  method: SdApiContractHttpMethod;
  url: string;
  path?: Record<string, SdApiContractMappedRestNode>;
  query?: Record<string, SdApiContractMappedRestNode>;
  headers?: Record<string, SdApiContractMappedRestNode>;
  body?: SdApiContractMappedRestNode;
}
```

`${env.baseUrl}` is env interpolation; `{id}` is a REST path placeholder. They never collide — the
validator masks `${…}` before it scans for `{…}`.

```json
{
  "method": "GET",
  "url": "${env.baseUrl}/products/{id}",
  "path": { "id": { "type": "string", "required": true, "source": "${input.id}" } }
}
```

| Rule                                                                  | Diagnostic                        |
| --------------------------------------------------------------------- | --------------------------------- |
| Every `{name}` in the url has an entry in `req.path`                   | `req.path.missing`                |
| Every `req.path` entry appears in the url                              | `req.path.unused`                 |
| A path parameter is `"required": true`                                 | `req.path.required`               |
| Placeholders are well-formed and unique                                | `req.url.placeholder.malformed` / `…duplicate` |
| `path` and `headers` are scalar; `query` is scalar or array; `body` is anything | `req.path.type.invalid` / `req.header.type.invalid` / `req.query.type.invalid` |
| Header names are non-empty and do not collide case-insensitively       | `req.header.name.empty` / `schema.property.key.duplicate` |
| `GET` / `HEAD` with a body                                             | `req.body.unexpected` *(warning)*  |

A static url with no `${…}` is accepted. The url is never prepended to or normalized — that would
change the contract.

## REST response structure

```ts
interface SdApiContractResponse {
  status: number | number[];
  headers?: Record<string, SdApiContractRestNode>;
  body?: SdApiContractRestNode;
}
```

- `status` accepts one or several success codes; each must be an integer in `100..599`, and duplicates
  are reported.
- `res` is a **declaration**. `source` / `value` are rejected there (`schema.mapping.forbidden`).
- A body declared alongside `204` produces `res.body.unexpected` *(warning)*.
- Output expressions address the response by **logical** path — `${res.status}`, `${res.body.items}`,
  `${res.headers.requestId}` — never by implementation detail such as `${res.body.properties.items}`.

## Output mapping

`output.schema` is the shape the frontend finally sees. It can be a scalar, an object, an array, or a
small slice of the response.

The builder ships a **"use a response field as the output"** action. Picking `res.body.items`:

1. sets `source` to `${res.body.items}`,
2. **deep-copies** the response subtree into the output schema,
3. shares no reference with the response declaration, so editing the output afterwards cannot reach
   back into `res`.

For an object target the action maps each branch individually instead of the object as a whole, since
an object cannot carry both a whole-node source and child mappings.

### Path convention for field listing

`listSdApiContractSchemaFields()` returns dot-joined property names and **flattens arrays under the
array's own path** — a root array yields its item fields directly (`id`, `name`, `createdAt`), and a
nested `items` array yields `items.id`. Fields reached through an array carry `arrayItem: true`.

Pass `{ arrays: 'stop' }` to get exactly the set of paths an `${…}` expression can address —
expressions never index into an array, so `${res.body.items}` exists but `${res.body.items.id}` does
not.

### Dropdown / table use case (future integration)

Once the output is a root array of objects, a consumer can read the leaf fields and offer:

- `valueField="id"`, `displayField="name"` for a dropdown,
- one column per leaf field for a table,

without anyone hand-writing mapping code. The builder already renders that leaf list in the Output
step, so the authoring feedback loop is closed today even though the integration is not built yet.

## Temporal transform

A `date` / `datetime` node inside `input.schema` or `output.schema` accepts:

```ts
transform?: SdTemporalValueTransform; // 'ISOString' | 'UTCString'
```

This is the **same public type** the temporal form controls use (`@sdcorejs/angular/forms/models`), so
`form-render` can pass it straight into `<sd-date>` / `<sd-datetime>`. It is rejected on any other
type (`schema.transform.invalid`) and on the REST layers, which have no rendering concern.

## Validation diagnostics

```ts
validateSdApiContract(contract: unknown, configuration?: SdApiContractConfiguration): SdApiContractDiagnostic[];

interface SdApiContractDiagnostic {
  code: string; // stable, machine-readable — safe to switch on
  severity: 'error' | 'warning';
  path: string; // structural, e.g. "req.body.properties.x"
  message: string; // human readable, English
}
```

Diagnostics come back in a fixed traversal order — metadata → `input` → `req` → `res` → `output`,
declaration order within each — so the same contract always yields the same list. The validator is
pure: it **never repairs** an invalid contract.

`path` is structural and includes `properties` / `items` segments (`res.body.properties.items.items`),
which is what makes it usable for navigation; the *expression* paths are logical and never contain
those segments.

| Group    | Codes                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| Contract | `contract.invalid`, `contract.version.invalid`, `contract.code.empty`, `contract.name.empty`, `schema.missing`               |
| Schema   | `schema.type.invalid`, `schema.object.properties.missing`, `schema.array.items.missing`, `schema.scalar.properties.forbidden`, `schema.scalar.items.forbidden`, `schema.property.key.empty`, `schema.property.key.duplicate`, `schema.required.invalid`, `schema.transform.invalid`, `schema.transform.unknown`, `schema.mapping.forbidden` |
| Mapping  | `mapping.source-and-value`, `mapping.template.invalid`, `mapping.root.forbidden`, `mapping.reference.missing`, `mapping.env.unknown`, `mapping.type.mismatch`, `mapping.interpolation.forbidden`, `mapping.value.type-mismatch`, `mapping.object.conflict`, `mapping.node.unmapped` *(warning)*, `mapping.required.optional-source` *(warning)* |
| Request  | `req.method.invalid`, `req.url.empty`, `req.url.template.invalid`, `req.url.placeholder.malformed`, `req.url.placeholder.duplicate`, `req.path.missing`, `req.path.unused`, `req.path.required`, `req.path.type.invalid`, `req.query.type.invalid`, `req.header.type.invalid`, `req.header.name.empty`, `req.body.unexpected` *(warning)* |
| Response | `res.status.invalid`, `res.status.duplicate`, `res.status.empty`, `res.body.unexpected` *(warning)*                          |

### Type compatibility for an exact expression

Same type always fits. `string` ↔ `date` ↔ `datetime` are interchangeable because a temporal value
travels as a string. Every other pair must match exactly, because an exact expression keeps the type
of its source.

## Public pure utilities

Every one is UI-free and independently tested.

| Function                                  | Purpose                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `parseSdApiContractTemplate(source)`       | `{ kind: 'literal' \| 'exact' \| 'interpolated', valid, references, errors }` |
| `extractSdApiContractReferences(source)`   | the well-formed references only                                              |
| `validateSdApiContract(contract, config?)` | the diagnostics                                                              |
| `serializeSdApiContract(contract)`         | deterministic JSON (see below)                                               |
| `listSdApiContractSchemaFields(node, opts?)` | flattened field list with type / required / label metadata                  |
| `listSdApiContractResponseFields(res)`     | every `${res.…}` path, in a stable order                                     |
| `resolveSdApiContractSchemaPath(root, path)` | resolve a logical path; arrays are terminal                                |
| `resolveSdApiContractResponsePath(res, path)` | resolve `status` / `headers.<n>` / `body.<path>`                          |
| `parseSdApiContractUrlPlaceholders(url)`   | `{ names, duplicates, malformed }`, ignoring `${…}`                          |
| `formatSdApiContractExpression(root, path)` | build `${input.a.b}` — inverse of the parser                                |
| `cloneSdApiContract` / `cloneSdApiContractNode` | deep copies                                                             |
| `createSdApiContractNode` / `changeSdApiContractNodeType` | make and retype a node                                     |
| `getSdApiContractNodeAt` / `setSdApiContractNodeAt`       | read / immutably replace at a structural pointer            |
| `addSdApiContractProperty` / `renameSdApiContractProperty` / `removeSdApiContractProperty` | immutable object edits, key order preserved |
| `sdApiContractRecordSet` / `…Remove` / `…Rename`          | the same for `req.query`-style records                      |

### Deterministic serialization

`serializeSdApiContract()`:

- produces valid JSON, indented with 2 spaces;
- orders the system keys (`contractVersion, code, name, description, input, req, res, output`;
  `method, url, path, query, headers, body`; `status, headers, body`;
  `type, required, label, description, transform, source, value, properties, items`);
- **preserves the order the author declared** inside `properties` / `query` / `headers`, because that
  order is authored information;
- omits `undefined`, keeps declared `false`, `0`, `null` and `""`;
- drops anything outside the contract vocabulary, so UI state can never leak in;
- never mutates its input, and round-trips byte-identically.

### Reference samples

`sdApiContractSearchSample()`, `sdApiContractCreateSample()` and `sdApiContractInvalidSample()` return
a **fresh** contract each call (never a shared object), and `SD_API_CONTRACT_SAMPLE_ENVIRONMENT` is the
env catalog they reference. The docs, the showcase and the test-suite all use these, so the canonical
example cannot drift between them.

## Complete GET example

```json
{
  "contractVersion": 1,
  "code": "product.search",
  "name": "Search products",
  "description": "Search active products for dropdown or table",
  "input": {
    "schema": {
      "type": "object",
      "properties": {
        "keyword": { "type": "string", "required": false },
        "page": { "type": "number" },
        "createdFrom": { "type": "datetime", "transform": "ISOString" }
      }
    }
  },
  "req": {
    "method": "GET",
    "url": "${env.baseUrl}/products",
    "query": {
      "keyword": { "type": "string", "source": "${input.keyword}" },
      "page": { "type": "number", "source": "${input.page}" },
      "createdFrom": { "type": "datetime", "source": "${input.createdFrom}" }
    },
    "headers": {
      "Authorization": { "type": "string", "source": "Bearer ${env.token}" },
      "x-user-id": { "type": "string", "source": "${env.userId}" }
    }
  },
  "res": {
    "status": 200,
    "headers": { "x-request-id": { "type": "string", "required": false } },
    "body": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "required": true,
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "required": true },
              "name": { "type": "string", "required": true },
              "createdAt": { "type": "datetime" }
            }
          }
        },
        "total": { "type": "number", "required": true }
      }
    }
  },
  "output": {
    "schema": {
      "type": "array",
      "source": "${res.body.items}",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "required": true },
          "name": { "type": "string", "required": true },
          "createdAt": { "type": "datetime" }
        }
      }
    }
  }
}
```

## Complete POST example

Mapping `input.a → req.body.x`, `input.b → req.body.y`, `input.c → req.body.z`,
`env.userId → req.body.u`, and a static literal in `req.body.v`.

```json
{
  "contractVersion": 1,
  "code": "order.create",
  "name": "Create order",
  "input": {
    "schema": {
      "type": "object",
      "properties": {
        "a": { "type": "string", "required": true, "label": "Order code" },
        "b": { "type": "number", "label": "Quantity" },
        "c": { "type": "array", "label": "Tags", "items": { "type": "string" } }
      }
    }
  },
  "req": {
    "method": "POST",
    "url": "${env.baseUrl}/orders",
    "headers": { "Authorization": { "type": "string", "source": "Bearer ${env.token}" } },
    "body": {
      "type": "object",
      "properties": {
        "x": { "type": "string", "required": true, "source": "${input.a}" },
        "y": { "type": "number", "source": "${input.b}" },
        "z": { "type": "array", "source": "${input.c}", "items": { "type": "string" } },
        "u": { "type": "string", "source": "${env.userId}" },
        "v": { "type": "string", "value": "STATIC VALUE" }
      }
    }
  },
  "res": {
    "status": [200, 201],
    "body": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "required": true },
        "createdAt": { "type": "datetime" }
      }
    }
  },
  "output": {
    "schema": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "required": true, "source": "${res.body.id}" },
        "createdAt": { "type": "datetime", "source": "${res.body.createdAt}" }
      }
    }
  }
}
```

## Usage

```html
<sd-api-contract-builder
  [(model)]="contract"
  autoId="product-search"
  (validChange)="canSave.set($event)"></sd-api-contract-builder>
```

```ts
import { SdApiContractBuilder, type SdApiContract } from '@sdcorejs/angular/components/api-contract-builder';

readonly contract = signal<SdApiContract | null>(null);
readonly canSave = signal(false);
```

## UI structure

| Step | Contents                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------- |
| 1 General  | code, name, description, read-only contract version                                        |
| 2 Input schema | nested editor — add / rename / remove, type, required, label, description, temporal transform |
| 3 Request  | method + url, then path / query / headers / body sections with per-field value mode and inline diagnostics |
| 4 Response | success status codes, headers, nested body declaration — no mapping                          |
| 5 Output   | "use a response field as the output" action, output schema editor, leaf-field list          |
| 6 Review   | validation summary (click a row to jump to the offending step) and the JSON preview          |

UX notes:

- **Every node is one row on a fixed grid** — name, type, required, temporal transform, remove —
  with empty placeholder cells where a column does not apply, so rows stay in line whether or not a
  node is temporal or removable. A `req.query` / `req.headers` / `req.path` key is edited **in that
  same row**, not on a separate row above the node, and the top-level node draws no frame of its own
  because the section already provides one.
- Removing a node that has children, and retyping a node that would discard nested fields, both ask
  for inline confirmation first.
- A rename that collides with a sibling is refused and reported inline; references are revalidated on
  every edit, so a rename that orphans an expression surfaces immediately.
- Severity is never signalled by colour alone — every diagnostic carries an icon, the severity, the
  stable `code` and the structural `path`, and the active step also carries `aria-current="step"`.
- The JSON preview is read-only (`<sd-code-editor language="json" [viewed]="true">`) with its built-in
  copy button. Raw JSON editing is deliberately absent so two editors never write one model.
- The layout is responsive at desktop and tablet widths, and every control is a real focusable element.

## Common mistakes

| Mistake                                                | What happens                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| `${token}` instead of `${env.token}`                    | `template.invalid-path` — a global always needs the `env.` prefix.     |
| `${res.body.properties.items}`                          | `mapping.reference.missing` — use the logical path `${res.body.items}`. |
| `${res.body.items.id}` to reach one element             | `mapping.reference.missing` — arrays are terminal; map the array, then declare its `items` schema. |
| `{ "source": "…", "value": "…" }` on one node           | `mapping.source-and-value`.                                            |
| Object with `source` **and** `properties`               | `mapping.object.conflict` — pick whole-object or field-by-field.        |
| `"source": "page-${input.page}"` into a `number` node   | `mapping.interpolation.forbidden` — interpolation always yields a string. |
| `{id}` in the url with no `req.path` entry              | `req.path.missing`.                                                    |
| A `req.path` entry without `"required": true`           | `req.path.required`.                                                   |
| `required: ["a", "b"]` on the parent object             | Not the model here — `required` is per-node and boolean.               |

## Limitations / non-goals

Out of scope for this first version, on purpose:

- Executing the HTTP request; handling real tokens or secret values; persisting a contract to a
  backend, a database or `localStorage`.
- OpenAPI import/export; GraphQL, SOAP, WebSocket; `multipart/form-data` and file upload.
- Script / JavaScript expressions, `eval`, `new Function`, any dynamic code execution.
- `map` / `filter` / `reduce` transformation of individual array elements, and per-item projection.
- Direct `form-builder` / `form-render` integration.
- Error-response schemas per status code; user-defined data types.
- Editing a **composite** static literal (an object or array `value`) in the visual editor — a literal
  authored elsewhere still validates, serializes and round-trips; only the inline editor is limited to
  scalars, because a JSON sub-editor writing the same model as the tree editor is the exact conflict
  the read-only review step avoids.
