import type { SdTemporalValueTransform } from '@sdcorejs/angular/forms/models';
import {
  sdIsApiContractTemporalDataType,
  type SdApiContractDataType,
  type SdApiContractExpressionRoot,
  type SdApiContractJsonValue,
  type SdApiContractResponse,
} from './api-contract.model';

/**
 * Structural view of a node from any layer (`input.schema`, `req.*`, `res.*`, `output.schema`).
 *
 * The traversal utilities are deliberately layer-agnostic: the four public node unions differ only
 * in which members they *allow*, and every one of them is structurally assignable to this shape.
 * Whether a member is legal where it appears is the validator's job, not the traversal's.
 */
export interface SdApiContractStructuralNode {
  type: SdApiContractDataType;
  required?: boolean;
  label?: string;
  description?: string;
  transform?: SdTemporalValueTransform;
  source?: string;
  value?: SdApiContractJsonValue;
  properties?: Record<string, SdApiContractStructuralNode>;
  items?: SdApiContractStructuralNode;
}

/** A node narrowed to the object shape, so `properties` is safe to read. */
export interface SdApiContractObjectShape extends SdApiContractStructuralNode {
  type: 'object';
  properties: Record<string, SdApiContractStructuralNode>;
}

/**
 * Structural pointer into a node tree: alternating `'properties', <key>` and `'items'` segments.
 * The same shape the diagnostics use, so a diagnostic path can drive navigation in the UI.
 */
export type SdApiContractNodePointer = readonly string[];

/**
 * One addressable field discovered by traversal.
 *
 * **Path convention:** dot-joined property names. Array items are *flattened under the array's own
 * path* (`items.id`, and for a root array simply `id`), which is what a dropdown / table consumer
 * wants. Set `arrays: 'stop'` to instead get exactly the set of paths an `${…}` expression can
 * address — expressions never index into an array.
 */
export interface SdApiContractSchemaField {
  path: string;
  segments: readonly string[];
  type: SdApiContractDataType;
  required?: boolean;
  label?: string;
  description?: string;
  /** `true` when traversal did not descend any further from this field. */
  leaf: boolean;
  /** `true` when the field was reached by descending through an array's `items`. */
  arrayItem: boolean;
}

export interface SdApiContractFieldListOptions {
  /** `'flatten'` (default) descends into array items; `'stop'` treats an array as a leaf. */
  arrays?: 'flatten' | 'stop';
  /** Dotted prefix prepended to every emitted path, e.g. `'body'`. */
  basePath?: string;
}

export interface SdApiContractResolvedReference {
  type: SdApiContractDataType;
  required?: boolean;
  label?: string;
  description?: string;
  /** `null` for synthetic references such as `res.status`, which have no declared node. */
  node: SdApiContractStructuralNode | null;
}

export interface SdApiContractUrlPlaceholders {
  /** Unique placeholder names, in first-appearance order. */
  names: readonly string[];
  duplicates: readonly string[];
  /** Raw fragments that look like a placeholder but are not one, e.g. `{}` or `{first name}`. */
  malformed: readonly string[];
}

// why: `in` và truy cập trực tiếp đều đi qua prototype chain — `properties['constructor']` trả về
// hàm dựng của Object chứ không phải undefined. Mọi lần đọc key động trong file này phải qua đây.
function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

const PLACEHOLDER_NAME = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

// ---------------------------------------------------------------------------
// Traversal
// ---------------------------------------------------------------------------

/** Flattens a node tree into addressable fields. See `SdApiContractSchemaField` for the convention. */
export function listSdApiContractSchemaFields(
  node: SdApiContractStructuralNode,
  options?: SdApiContractFieldListOptions
): readonly SdApiContractSchemaField[] {
  const flatten = (options?.arrays ?? 'flatten') === 'flatten';
  const base = options?.basePath ? options.basePath.split('.') : [];
  const fields: SdApiContractSchemaField[] = [];

  const descendsInto = (candidate: SdApiContractStructuralNode): boolean => {
    if (candidate.type === 'object') return true;
    if (candidate.type !== 'array' || !flatten) return false;
    const items = candidate.items;
    return !!items && (items.type === 'object' || items.type === 'array');
  };

  const walk = (current: SdApiContractStructuralNode, segments: readonly string[], arrayItem: boolean): void => {
    if (current.type === 'object') {
      const properties = current.properties;
      if (!properties) return;
      for (const key of Object.keys(properties)) {
        const child = properties[key];
        if (!child) continue;
        const childSegments = [...segments, key];
        fields.push({
          path: childSegments.join('.'),
          segments: childSegments,
          type: child.type,
          required: child.required,
          label: child.label,
          description: child.description,
          leaf: !descendsInto(child),
          arrayItem,
        });
        walk(child, childSegments, arrayItem);
      }
      return;
    }
    if (current.type === 'array' && flatten && current.items) {
      walk(current.items, segments, true);
    }
  };

  walk(node, base, false);
  return fields;
}

/** Every `${res.…}` path the output layer may address, in a stable order. */
export function listSdApiContractResponseFields(response: SdApiContractResponse): readonly SdApiContractSchemaField[] {
  const fields: SdApiContractSchemaField[] = [
    { path: 'status', segments: ['status'], type: 'number', required: true, leaf: true, arrayItem: false },
  ];

  const headers = response.headers;
  if (headers) {
    for (const key of Object.keys(headers)) {
      const node = headers[key];
      if (!node) continue;
      fields.push({
        path: `headers.${key}`,
        segments: ['headers', key],
        type: node.type,
        required: node.required,
        label: node.label,
        description: node.description,
        leaf: true,
        arrayItem: false,
      });
    }
  }

  const body = response.body;
  if (body) {
    fields.push({
      path: 'body',
      segments: ['body'],
      type: body.type,
      required: body.required,
      label: body.label,
      description: body.description,
      leaf: body.type !== 'object',
      arrayItem: false,
    });
    fields.push(...listSdApiContractSchemaFields(body, { arrays: 'stop', basePath: 'body' }));
  }

  return fields;
}

/**
 * Resolves a *logical* reference path (`customer.id`) against a schema.
 *
 * Arrays are terminal: `${res.body.items}` addresses the whole array, `${res.body.items.id}` does
 * not exist because there is no element to address. Per-item projection is out of scope.
 */
export function resolveSdApiContractSchemaPath(
  root: SdApiContractStructuralNode,
  path: readonly string[]
): SdApiContractStructuralNode | null {
  let current: SdApiContractStructuralNode | undefined = root;
  for (const segment of path) {
    if (!current || current.type !== 'object') return null;
    const properties: Record<string, SdApiContractStructuralNode> | undefined = current.properties;
    if (!properties || !hasOwn(properties, segment)) return null;
    current = properties[segment];
  }
  return current ?? null;
}

/** Resolves `status` / `headers.<name>` / `body.<path>` against a response declaration. */
export function resolveSdApiContractResponsePath(
  response: SdApiContractResponse,
  path: readonly string[]
): SdApiContractResolvedReference | null {
  if (path.length === 0) return null;
  const [section, ...rest] = path;

  if (section === 'status') {
    return rest.length === 0 ? { type: 'number', required: true, node: null } : null;
  }

  if (section === 'headers') {
    const headers = response.headers;
    if (rest.length !== 1 || !headers || !hasOwn(headers, rest[0])) return null;
    return describe(headers[rest[0]]);
  }

  if (section === 'body') {
    const body = response.body;
    if (!body) return null;
    const node = resolveSdApiContractSchemaPath(body, rest);
    return node ? describe(node) : null;
  }

  return null;
}

function describe(node: SdApiContractStructuralNode): SdApiContractResolvedReference {
  return { type: node.type, required: node.required, label: node.label, description: node.description, node };
}

// ---------------------------------------------------------------------------
// Immutable structural editing
// ---------------------------------------------------------------------------

/** Reads the node a structural pointer addresses, or `null` when the pointer does not resolve. */
export function getSdApiContractNodeAt(
  root: SdApiContractStructuralNode,
  pointer: SdApiContractNodePointer
): SdApiContractStructuralNode | null {
  let current: SdApiContractStructuralNode | undefined = root;
  for (let index = 0; index < pointer.length; index += 1) {
    if (!current) return null;
    const segment = pointer[index];
    if (segment === 'properties') {
      const key = pointer[index + 1];
      const properties: Record<string, SdApiContractStructuralNode> | undefined = current.properties;
      if (key === undefined || !properties || !hasOwn(properties, key)) return null;
      current = properties[key];
      index += 1;
    } else if (segment === 'items') {
      current = current.items;
    } else {
      return null;
    }
  }
  return current ?? null;
}

/** Replaces the node a pointer addresses, rebuilding only the spine. Never mutates `root`. */
export function setSdApiContractNodeAt<T extends SdApiContractStructuralNode>(
  root: T,
  pointer: SdApiContractNodePointer,
  node: SdApiContractStructuralNode
): T {
  return replaceAt(root, pointer, 0, node) as T;
}

function replaceAt(
  current: SdApiContractStructuralNode,
  pointer: SdApiContractNodePointer,
  index: number,
  next: SdApiContractStructuralNode
): SdApiContractStructuralNode {
  if (index >= pointer.length) return next;

  const segment = pointer[index];
  if (segment === 'properties') {
    const key = pointer[index + 1];
    const properties = current.properties;
    // why: pointer trỏ vào chỗ không tồn tại thì trả nguyên object cũ — im lặng bỏ qua an toàn hơn
    // là dựng ra nhánh rỗng mà người dùng không hề khai báo.
    if (key === undefined || !properties || !hasOwn(properties, key)) return current;
    return { ...current, properties: { ...properties, [key]: replaceAt(properties[key], pointer, index + 2, next) } };
  }

  if (segment === 'items') {
    if (!current.items) return current;
    return { ...current, items: replaceAt(current.items, pointer, index + 1, next) };
  }

  return current;
}

/** Appends a property. A key that already exists is left untouched — the caller must dedupe first. */
export function addSdApiContractProperty(
  node: SdApiContractStructuralNode,
  key: string,
  child: SdApiContractStructuralNode
): SdApiContractObjectShape {
  const properties = node.properties ?? {};
  if (!key || hasOwn(properties, key)) return asObjectShape(node, properties);
  return { ...node, type: 'object', properties: { ...properties, [key]: child } };
}

/** Renames a property **in place in the key order**, so the JSON diff stays readable. */
export function renameSdApiContractProperty(node: SdApiContractStructuralNode, from: string, to: string): SdApiContractObjectShape {
  const properties = node.properties;
  if (!properties || !hasOwn(properties, from) || !to || from === to || hasOwn(properties, to)) {
    return node as SdApiContractObjectShape;
  }
  const next: Record<string, SdApiContractStructuralNode> = {};
  for (const key of Object.keys(properties)) next[key === from ? to : key] = properties[key];
  return { ...node, type: 'object', properties: next };
}

export function removeSdApiContractProperty(node: SdApiContractStructuralNode, key: string): SdApiContractObjectShape {
  const properties = node.properties;
  if (!properties || !hasOwn(properties, key)) return node as SdApiContractObjectShape;
  const next: Record<string, SdApiContractStructuralNode> = {};
  for (const existing of Object.keys(properties)) {
    if (existing !== key) next[existing] = properties[existing];
  }
  return { ...node, type: 'object', properties: next };
}

function asObjectShape(
  node: SdApiContractStructuralNode,
  properties: Record<string, SdApiContractStructuralNode>
): SdApiContractObjectShape {
  return node.type === 'object' && node.properties ? (node as SdApiContractObjectShape) : { ...node, type: 'object', properties };
}

/** A minimal well-formed node of the given type. */
export function createSdApiContractNode(type: SdApiContractDataType): SdApiContractStructuralNode {
  if (type === 'object') return { type: 'object', properties: {} };
  if (type === 'array') return { type: 'array', items: { type: 'string' } };
  return { type };
}

/**
 * Retypes a node, dropping the members the new type cannot carry.
 *
 * Returns the same reference when the type is unchanged, so an idempotent UI write never produces a
 * spurious `modelChange`.
 */
export function changeSdApiContractNodeType(node: SdApiContractStructuralNode, type: SdApiContractDataType): SdApiContractStructuralNode {
  if (node.type === type) return node;

  const next: SdApiContractStructuralNode = { type };
  if (node.required !== undefined) next.required = node.required;
  if (node.label !== undefined) next.label = node.label;
  if (node.description !== undefined) next.description = node.description;
  if (node.source !== undefined) next.source = node.source;
  if (node.value !== undefined) next.value = node.value;
  if (node.transform !== undefined && sdIsApiContractTemporalDataType(type)) next.transform = node.transform;
  if (type === 'object') next.properties = {};
  if (type === 'array') next.items = { type: 'string' };
  return next;
}

/** Deep copy of a node subtree. Used when a response subtree is adopted as the output schema. */
export function cloneSdApiContractNode<T extends SdApiContractStructuralNode>(node: T): T {
  return deepClone(node);
}

/**
 * Deep copy of a whole contract.
 *
 * The builder clones on the way in so the object a parent owns is never reachable from an edit, and
 * a consumer can do the same before handing a contract to anything that might mutate it.
 */
export function cloneSdApiContract<T>(contract: T): T {
  return deepClone(contract);
}

/** Deep copy of any JSON-shaped value. Own enumerable keys only, so nothing inherited leaks in. */
function deepClone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => deepClone(item)) as unknown as T;
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source)) out[key] = deepClone(source[key]);
    return out as T;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Record helpers (`req.path` / `req.query` / `req.headers` / `res.headers`)
// ---------------------------------------------------------------------------

export function sdApiContractRecordSet<T>(record: Record<string, T> | undefined, key: string, value: T): Record<string, T> {
  return { ...(record ?? {}), [key]: value };
}

export function sdApiContractRecordRemove<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!hasOwn(record, key)) return record;
  const next: Record<string, T> = {};
  for (const existing of Object.keys(record)) {
    if (existing !== key) next[existing] = record[existing];
  }
  return next;
}

/** Renames a key in place. A collision or an empty target is a no-op — the caller reports it. */
export function sdApiContractRecordRename<T>(record: Record<string, T>, from: string, to: string): Record<string, T> {
  if (!hasOwn(record, from) || !to || from === to || hasOwn(record, to)) return record;
  const next: Record<string, T> = {};
  for (const key of Object.keys(record)) next[key === from ? to : key] = record[key];
  return next;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Builds the canonical expression text — the inverse of `parseSdApiContractTemplate`. */
export function formatSdApiContractExpression(root: SdApiContractExpressionRoot, path: readonly string[]): string {
  return `\${${[root, ...path].join('.')}}`;
}

/** Joins a diagnostic base path with a structural pointer, e.g. `req.body` + `properties.x`. */
export function formatSdApiContractPointer(base: string, pointer: SdApiContractNodePointer): string {
  return pointer.length === 0 ? base : `${base}.${pointer.join('.')}`;
}

/**
 * Reads REST placeholders out of a URL template.
 *
 * `${…}` interpolation is masked out first, so `${env.baseUrl}` is never mistaken for a `{…}`
 * path placeholder.
 */
export function parseSdApiContractUrlPlaceholders(url: string): SdApiContractUrlPlaceholders {
  if (typeof url !== 'string') return { names: [], duplicates: [], malformed: [] };

  const masked = url.replace(/\$\{[^}]*\}/g, match => ' '.repeat(match.length));
  const names: string[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const malformed: string[] = [];
  let cursor = 0;

  while (cursor < masked.length) {
    const open = masked.indexOf('{', cursor);
    if (open < 0) break;
    const close = masked.indexOf('}', open + 1);
    if (close < 0) {
      malformed.push(url.slice(open));
      break;
    }
    const inner = masked.slice(open + 1, close);
    if (!PLACEHOLDER_NAME.test(inner)) {
      malformed.push(url.slice(open, close + 1));
    } else if (seen.has(inner)) {
      if (!duplicates.includes(inner)) duplicates.push(inner);
    } else {
      seen.add(inner);
      names.push(inner);
    }
    cursor = close + 1;
  }

  return { names, duplicates, malformed };
}
