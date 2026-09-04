import type { SdTemporalValueTransform } from '@sdcorejs/angular/forms/models';

/**
 * Data-type vocabulary of an API contract.
 *
 * Deliberately NOT reusing `SdQueryBuilderFieldType`: that union describes *filterable* fields in a
 * query UI, this one describes the *shape of transported data*. They drift for different reasons.
 *
 * `date` / `datetime` are **logical** types — in the persisted JSON they are transported as strings,
 * never as a JavaScript `Date`.
 */
export type SdApiContractDataType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'object' | 'array';

/** Every type that carries a single value (no `properties`, no `items`). */
export type SdApiContractScalarDataType = Exclude<SdApiContractDataType, 'object' | 'array'>;

/** Types that may appear as a temporal node and therefore accept `transform`. */
export type SdApiContractTemporalDataType = Extract<SdApiContractDataType, 'date' | 'datetime'>;

export const SD_API_CONTRACT_DATA_TYPES: readonly SdApiContractDataType[] = [
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'object',
  'array',
];

export const SD_API_CONTRACT_SCALAR_DATA_TYPES: readonly SdApiContractScalarDataType[] = [
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
];

export function sdIsApiContractDataType(value: unknown): value is SdApiContractDataType {
  return typeof value === 'string' && (SD_API_CONTRACT_DATA_TYPES as readonly string[]).includes(value);
}

export function sdIsApiContractScalarDataType(value: unknown): value is SdApiContractScalarDataType {
  return typeof value === 'string' && (SD_API_CONTRACT_SCALAR_DATA_TYPES as readonly string[]).includes(value);
}

export function sdIsApiContractTemporalDataType(value: unknown): value is SdApiContractTemporalDataType {
  return value === 'date' || value === 'datetime';
}

/**
 * Anything a static literal may be. Mirrors what `JSON.parse` can produce, so a contract always
 * round-trips through `JSON.stringify` without losing information.
 */
export type SdApiContractJsonValue =
  | string
  | number
  | boolean
  | null
  | SdApiContractJsonValue[]
  | { [key: string]: SdApiContractJsonValue };

/**
 * Shared by every node in every layer.
 *
 * `required` is a **tri-state** and lives next to `type` (never a `required: string[]` array on the
 * parent object, the way JSON Schema does it): `undefined` = not declared, `true` = mandatory,
 * `false` = explicitly optional. The serializer omits `undefined` and keeps `false`.
 */
export interface SdApiContractNodeBase {
  required?: boolean;
  label?: string;
  description?: string;
}

/**
 * The two mutually exclusive ways a mapped node receives a value.
 *
 * - `source` — a template referencing `${input.*}` / `${env.*}` / `${res.*}`.
 * - `value` — a static JSON literal.
 *
 * A node carrying both is invalid (`mapping.source-and-value`).
 */
export interface SdApiContractMapping {
  source?: string;
  value?: SdApiContractJsonValue;
}

// ---------------------------------------------------------------------------
// Frontend schema nodes — `input.schema`
// ---------------------------------------------------------------------------

export interface SdApiContractFeScalarNode extends SdApiContractNodeBase {
  type: SdApiContractScalarDataType;
  /** Only meaningful on `date` / `datetime`; reused verbatim from the temporal form controls. */
  transform?: SdTemporalValueTransform;
}

export interface SdApiContractFeObjectNode extends SdApiContractNodeBase {
  type: 'object';
  properties: Record<string, SdApiContractFeSchemaNode>;
}

export interface SdApiContractFeArrayNode extends SdApiContractNodeBase {
  type: 'array';
  items: SdApiContractFeSchemaNode;
}

/** A pure declaration — no `source` / `value`, because `input` is what the caller hands in. */
export type SdApiContractFeSchemaNode = SdApiContractFeScalarNode | SdApiContractFeObjectNode | SdApiContractFeArrayNode;

// ---------------------------------------------------------------------------
// REST declaration nodes — `res.headers`, `res.body`
// ---------------------------------------------------------------------------

export interface SdApiContractRestScalarNode extends SdApiContractNodeBase {
  type: SdApiContractScalarDataType;
}

export interface SdApiContractRestObjectNode extends SdApiContractNodeBase {
  type: 'object';
  properties: Record<string, SdApiContractRestNode>;
}

export interface SdApiContractRestArrayNode extends SdApiContractNodeBase {
  type: 'array';
  items: SdApiContractRestNode;
}

/** Describes what the backend returns. Never carries a mapping — nothing maps *into* a response. */
export type SdApiContractRestNode = SdApiContractRestScalarNode | SdApiContractRestObjectNode | SdApiContractRestArrayNode;

// ---------------------------------------------------------------------------
// Mapped REST nodes — `req.path`, `req.query`, `req.headers`, `req.body`
// ---------------------------------------------------------------------------

export interface SdApiContractMappedRestScalarNode extends SdApiContractNodeBase, SdApiContractMapping {
  type: SdApiContractScalarDataType;
}

export interface SdApiContractMappedRestObjectNode extends SdApiContractNodeBase, SdApiContractMapping {
  type: 'object';
  /** Omitted when the whole object is mapped through `source` / `value`. */
  properties?: Record<string, SdApiContractMappedRestNode>;
}

export interface SdApiContractMappedRestArrayNode extends SdApiContractNodeBase, SdApiContractMapping {
  type: 'array';
  /** Describes the element type. Per-item projection is intentionally out of scope. */
  items: SdApiContractMappedRestNode;
}

export type SdApiContractMappedRestNode =
  | SdApiContractMappedRestScalarNode
  | SdApiContractMappedRestObjectNode
  | SdApiContractMappedRestArrayNode;

// ---------------------------------------------------------------------------
// Mapped frontend nodes — `output.schema`
// ---------------------------------------------------------------------------

export interface SdApiContractMappedFeScalarNode extends SdApiContractNodeBase, SdApiContractMapping {
  type: SdApiContractScalarDataType;
  transform?: SdTemporalValueTransform;
}

export interface SdApiContractMappedFeObjectNode extends SdApiContractNodeBase, SdApiContractMapping {
  type: 'object';
  properties?: Record<string, SdApiContractMappedFeSchemaNode>;
}

export interface SdApiContractMappedFeArrayNode extends SdApiContractNodeBase, SdApiContractMapping {
  type: 'array';
  items: SdApiContractMappedFeSchemaNode;
}

export type SdApiContractMappedFeSchemaNode =
  | SdApiContractMappedFeScalarNode
  | SdApiContractMappedFeObjectNode
  | SdApiContractMappedFeArrayNode;

/** Structural union of every node shape, for utilities that traverse any layer. */
export type SdApiContractAnyNode =
  | SdApiContractFeSchemaNode
  | SdApiContractRestNode
  | SdApiContractMappedRestNode
  | SdApiContractMappedFeSchemaNode;

// ---------------------------------------------------------------------------
// Request / response
// ---------------------------------------------------------------------------

export type SdApiContractHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export const SD_API_CONTRACT_HTTP_METHODS: readonly SdApiContractHttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

export function sdIsApiContractHttpMethod(value: unknown): value is SdApiContractHttpMethod {
  return typeof value === 'string' && (SD_API_CONTRACT_HTTP_METHODS as readonly string[]).includes(value);
}

/**
 * The real HTTP request. No `.schema` wrapper on purpose — `req` *is* REST, so it exposes REST
 * structure directly, while `input` / `output` are frontend contracts and keep their `.schema`.
 */
export interface SdApiContractRequest {
  method: SdApiContractHttpMethod;
  /** May interpolate `${env.*}` and carry REST placeholders such as `{id}`. */
  url: string;
  path?: Record<string, SdApiContractMappedRestNode>;
  query?: Record<string, SdApiContractMappedRestNode>;
  headers?: Record<string, SdApiContractMappedRestNode>;
  body?: SdApiContractMappedRestNode;
}

export interface SdApiContractResponse {
  /** One success status, or several. Each must be an integer in `100..599`. */
  status: number | number[];
  headers?: Record<string, SdApiContractRestNode>;
  body?: SdApiContractRestNode;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

/** The only `contractVersion` this release understands. */
export const SD_API_CONTRACT_VERSION = 1;

export interface SdApiContract {
  contractVersion: 1;
  code: string;
  name: string;
  description?: string;
  input: { schema: SdApiContractFeSchemaNode };
  req: SdApiContractRequest;
  res: SdApiContractResponse;
  output: { schema: SdApiContractMappedFeSchemaNode };
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export type SdApiContractDiagnosticSeverity = 'error' | 'warning';

export interface SdApiContractDiagnostic {
  /** Stable machine-readable identifier, e.g. `mapping.env.unknown`. Safe to switch on. */
  code: string;
  severity: SdApiContractDiagnosticSeverity;
  /** Structural path into the contract, e.g. `req.body.properties.x`. Never localized. */
  path: string;
  /** Human-readable, English. The UI localizes by `code` when it wants a translated string. */
  message: string;
}

// ---------------------------------------------------------------------------
// Expression contexts
// ---------------------------------------------------------------------------

/** Roots an expression may address. `output` is never a root — nothing reads from the output. */
export type SdApiContractExpressionRoot = 'input' | 'env' | 'res';

export const SD_API_CONTRACT_EXPRESSION_ROOTS: readonly SdApiContractExpressionRoot[] = ['input', 'env', 'res'];

/**
 * Where a mapping lives, which decides the roots it may read.
 *
 * - `request` (`req.url` / `path` / `query` / `headers` / `body`) → `input`, `env`.
 * - `output` (`output.schema`) → `res`, `input`, `env`.
 */
export type SdApiContractMappingContext = 'request' | 'output';

export const SD_API_CONTRACT_ALLOWED_ROOTS: Readonly<Record<SdApiContractMappingContext, readonly SdApiContractExpressionRoot[]>> = {
  request: ['input', 'env'],
  output: ['res', 'input', 'env'],
};
