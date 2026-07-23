import {
  SD_GRAPH_FORMAT,
  SD_GRAPH_VERSION,
  SdGraphEnvelope,
  SdGraphNode,
  SdGraphSerializerLimits,
  SdGraphSpecialNumber,
  SdGraphValue,
  SdPersistenceErrorCode,
  SdPersistenceSerializer,
} from './persistence.model';

const DATE_GET_TIME = Date.prototype.getTime;
const DATE_TO_ISO_STRING = Date.prototype.toISOString;
const MAP_ENTRIES = Map.prototype.entries;
const MAP_SET = Map.prototype.set;
const SET_VALUES = Set.prototype.values;
const SET_ADD = Set.prototype.add;

export const SD_GRAPH_HARD_LIMITS: Readonly<SdGraphSerializerLimits> = Object.freeze({
  maxDocumentCharacters: 4_000_000,
  maxDepth: 128,
  maxNodes: 50_000,
  maxEntries: 200_000,
  maxStringCharacters: 1_000_000,
  maxKeyCharacters: 16_384,
  maxBigIntDigits: 100_000,
});

interface SdGraphTraversalBudget {
  entries: number;
}

export class SdPersistenceError extends Error {
  override readonly name = 'SdPersistenceError';

  constructor(
    readonly code: SdPersistenceErrorCode,
    message: string
  ) {
    super(`${code}: ${message}`);
  }
}

export class SdGraphSerializer implements SdPersistenceSerializer {
  readonly format = `${SD_GRAPH_FORMAT}@${SD_GRAPH_VERSION}`;
  readonly limits: Readonly<SdGraphSerializerLimits>;

  constructor(limits: Partial<SdGraphSerializerLimits> = {}) {
    const configured = { ...SD_GRAPH_HARD_LIMITS, ...limits };
    for (const key of Object.keys(SD_GRAPH_HARD_LIMITS) as (keyof SdGraphSerializerLimits)[]) {
      const value = configured[key];
      if (!Number.isSafeInteger(value) || value < 1 || value > SD_GRAPH_HARD_LIMITS[key]) {
        throw new SdPersistenceError('LIMIT_EXCEEDED', `Invalid ${key} limit`);
      }
    }
    this.limits = Object.freeze(configured);
  }

  stringify<T>(value: T): string {
    const nodes: SdGraphNode[] = [];
    const references = new Map<object, number>();
    const budget: SdGraphTraversalBudget = { entries: 0 };
    const root = this.#encode(value, nodes, references, '$', 0, budget);
    const envelope: SdGraphEnvelope = {
      format: SD_GRAPH_FORMAT,
      version: SD_GRAPH_VERSION,
      root,
      nodes,
    };
    const serialized = JSON.stringify(envelope);
    this.#ensureDocumentLength(serialized.length);
    return serialized;
  }

  parse<T = unknown>(serialized: string): T {
    this.#ensureDocumentLength(serialized.length);
    let document: unknown;
    try {
      document = JSON.parse(serialized) as unknown;
    } catch {
      throw new SdPersistenceError('INVALID_DOCUMENT', 'Serialized value is not valid JSON');
    }

    const envelope = this.#validateEnvelope(document);
    this.#validateDepth(envelope);
    const values: unknown[] = envelope.nodes.map((node, index) => this.#createNode(node, index));
    envelope.nodes.forEach((node, index) => this.#populateNode(node, values[index], values));
    return this.#decode(envelope.root, values, '$.root') as T;
  }

  clone<T>(value: T): T {
    return this.parse<T>(this.stringify(value));
  }

  #encode(
    value: unknown,
    nodes: SdGraphNode[],
    references: Map<object, number>,
    path: string,
    depth: number,
    budget: SdGraphTraversalBudget
  ): SdGraphValue {
    this.#ensureDepth(depth, path);
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      this.#ensureStringLength(value, path);
      return value;
    }
    if (value === undefined) return { $type: 'undefined' };
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return { $type: 'number', value: 'NaN' };
      if (value === Number.POSITIVE_INFINITY) return { $type: 'number', value: 'Infinity' };
      if (value === Number.NEGATIVE_INFINITY) return { $type: 'number', value: '-Infinity' };
      if (Object.is(value, -0)) return { $type: 'number', value: '-0' };
      return value;
    }
    if (typeof value === 'bigint') {
      const bigint = value.toString();
      this.#ensureBigIntLength(bigint, path);
      return { $type: 'bigint', value: bigint };
    }
    if (typeof value === 'function' || typeof value === 'symbol') {
      throw new SdPersistenceError('UNSUPPORTED_VALUE', `Unsupported ${typeof value} at ${path}`);
    }

    const prototype = Object.getPrototypeOf(value) as object | null;
    if (Array.isArray(value) && prototype !== Array.prototype) {
      throw new SdPersistenceError('UNSUPPORTED_VALUE', `Unsupported array prototype at ${path}`);
    }

    const existingReference = references.get(value);
    if (existingReference !== undefined) return { $ref: existingReference };

    const reference = nodes.length;
    references.set(value, reference);

    if (Array.isArray(value)) {
      this.#addNode(nodes, { type: 'array', values: [] }, path);
      this.#consumeEntries(value.length, path, budget);
      const node = nodes[reference];
      if (node.type !== 'array') throw new SdPersistenceError('INVALID_NODE', `Invalid array node at ${path}`);
      if (Object.getOwnPropertySymbols(value).length > 0) {
        throw new SdPersistenceError('UNSUPPORTED_VALUE', `Symbol properties are unsupported at ${path}`);
      }
      const descriptors = Object.getOwnPropertyDescriptors(value);
      for (const key of Object.keys(descriptors)) {
        if (key === 'length') continue;
        if (!this.#isArrayIndex(key, value.length)) {
          throw new SdPersistenceError('UNSUPPORTED_VALUE', `Extra array property is unsupported at ${path}.${key}`);
        }
      }
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = descriptors[String(index)];
        if (!descriptor) {
          throw new SdPersistenceError('UNSUPPORTED_VALUE', `Sparse array entry is unsupported at ${path}[${index}]`);
        }
        if (!('value' in descriptor)) {
          throw new SdPersistenceError('UNSUPPORTED_VALUE', `Accessor property is unsupported at ${path}[${index}]`);
        }
        node.values.push(this.#encode(descriptor.value, nodes, references, `${path}[${index}]`, depth + 1, budget));
      }
      return { $ref: reference };
    }

    if (prototype === Date.prototype) {
      this.#ensureNoOwnProperties(value, path, 'Date');
      let time: number;
      let iso: string;
      try {
        time = DATE_GET_TIME.call(value);
        iso = DATE_TO_ISO_STRING.call(value);
      } catch {
        throw new SdPersistenceError('UNSUPPORTED_VALUE', `Invalid Date at ${path}`);
      }
      if (!Number.isFinite(time)) throw new SdPersistenceError('UNSUPPORTED_VALUE', `Invalid Date at ${path}`);
      this.#addNode(nodes, { type: 'date', value: iso }, path);
      return { $ref: reference };
    }

    if (prototype === Map.prototype) {
      this.#ensureNoOwnProperties(value, path, 'Map');
      let iterator: IterableIterator<[unknown, unknown]>;
      try {
        iterator = MAP_ENTRIES.call(value);
      } catch {
        throw new SdPersistenceError('UNSUPPORTED_VALUE', `Invalid Map at ${path}`);
      }
      const node: SdGraphNode = { type: 'map', entries: [] };
      this.#addNode(nodes, node, path);
      let index = 0;
      for (const [key, item] of iterator) {
        this.#consumeEntries(1, path, budget);
        node.entries.push([
          this.#encode(key, nodes, references, `${path}.mapKey[${index}]`, depth + 1, budget),
          this.#encode(item, nodes, references, `${path}.mapValue[${index}]`, depth + 1, budget),
        ]);
        index += 1;
      }
      return { $ref: reference };
    }

    if (prototype === Set.prototype) {
      this.#ensureNoOwnProperties(value, path, 'Set');
      let iterator: IterableIterator<unknown>;
      try {
        iterator = SET_VALUES.call(value);
      } catch {
        throw new SdPersistenceError('UNSUPPORTED_VALUE', `Invalid Set at ${path}`);
      }
      const node: SdGraphNode = { type: 'set', values: [] };
      this.#addNode(nodes, node, path);
      let index = 0;
      for (const item of iterator) {
        this.#consumeEntries(1, path, budget);
        node.values.push(this.#encode(item, nodes, references, `${path}.set[${index}]`, depth + 1, budget));
        index += 1;
      }
      return { $ref: reference };
    }

    if (prototype !== Object.prototype && prototype !== null) {
      throw new SdPersistenceError('UNSUPPORTED_VALUE', `Unsupported object prototype at ${path}`);
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new SdPersistenceError('UNSUPPORTED_VALUE', `Symbol properties are unsupported at ${path}`);
    }

    const node: SdGraphNode = {
      type: 'object',
      prototype: prototype === null ? 'null' : 'object',
      entries: [],
    };
    this.#addNode(nodes, node, path);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).sort();
    this.#consumeEntries(keys.length, path, budget);
    for (const key of keys) {
      this.#ensureKeyLength(key, `${path}.${key}`);
      const descriptor = descriptors[key];
      if (!descriptor || !('value' in descriptor)) {
        throw new SdPersistenceError('UNSUPPORTED_VALUE', `Accessor property is unsupported at ${path}.${key}`);
      }
      if (!descriptor.enumerable) {
        throw new SdPersistenceError('UNSUPPORTED_VALUE', `Non-enumerable property is unsupported at ${path}.${key}`);
      }
      node.entries.push([key, this.#encode(descriptor.value, nodes, references, `${path}.${key}`, depth + 1, budget)]);
    }
    return { $ref: reference };
  }

  #validateEnvelope(value: unknown): SdGraphEnvelope {
    if (!this.#isRecord(value) || !this.#hasExactKeys(value, ['format', 'version', 'root', 'nodes'])) {
      throw new SdPersistenceError('INVALID_DOCUMENT', 'Graph envelope must have the exact schema');
    }
    if (value['format'] !== SD_GRAPH_FORMAT) throw new SdPersistenceError('UNKNOWN_FORMAT', 'Unknown persistence format');
    if (value['version'] !== SD_GRAPH_VERSION) throw new SdPersistenceError('UNKNOWN_VERSION', 'Unsupported persistence version');
    if (!Array.isArray(value['nodes'])) throw new SdPersistenceError('INVALID_DOCUMENT', 'Graph nodes must be an array');
    if (value['nodes'].length > this.limits.maxNodes) {
      throw new SdPersistenceError('LIMIT_EXCEEDED', 'Graph node limit exceeded at $.nodes');
    }

    const budget: SdGraphTraversalBudget = { entries: 0 };
    const nodes = value['nodes'].map((node, index) => this.#validateNode(node, index, budget));
    const root = this.#validateGraphValue(value['root'], '$.root');
    return { format: SD_GRAPH_FORMAT, version: SD_GRAPH_VERSION, root, nodes };
  }

  #validateNode(value: unknown, index: number, budget: SdGraphTraversalBudget): SdGraphNode {
    if (!this.#isRecord(value) || typeof value['type'] !== 'string') {
      throw new SdPersistenceError('INVALID_NODE', `Invalid node at index ${index}`);
    }
    switch (value['type']) {
      case 'array':
      case 'set': {
        if (!this.#hasExactKeys(value, ['type', 'values']) || !Array.isArray(value['values'])) {
          throw new SdPersistenceError('INVALID_NODE', `Invalid ${value['type']} node at index ${index}`);
        }
        this.#consumeEntries(value['values'].length, `$.nodes[${index}]`, budget);
        const values = value['values'].map((item, itemIndex) => this.#validateGraphValue(item, `$.nodes[${index}].values[${itemIndex}]`));
        if (value['type'] === 'set') this.#rejectDuplicateValues(values, `set node at index ${index}`);
        return { type: value['type'], values };
      }
      case 'object': {
        if (
          !this.#hasExactKeys(value, ['type', 'prototype', 'entries']) ||
          (value['prototype'] !== 'object' && value['prototype'] !== 'null') ||
          !Array.isArray(value['entries'])
        ) {
          throw new SdPersistenceError('INVALID_NODE', `Invalid object node at index ${index}`);
        }
        this.#consumeEntries(value['entries'].length, `$.nodes[${index}]`, budget);
        const keys = new Set<string>();
        const entries = value['entries'].map((entry, entryIndex): [string, SdGraphValue] => {
          if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string') {
            throw new SdPersistenceError('INVALID_NODE', `Invalid object entry at index ${index}:${entryIndex}`);
          }
          this.#ensureKeyLength(entry[0], `$.nodes[${index}].entries[${entryIndex}]`);
          if (keys.has(entry[0])) throw new SdPersistenceError('INVALID_NODE', `Duplicate object key at index ${index}:${entryIndex}`);
          keys.add(entry[0]);
          return [entry[0], this.#validateGraphValue(entry[1], `$.nodes[${index}].entries[${entryIndex}]`)];
        });
        return { type: 'object', prototype: value['prototype'], entries };
      }
      case 'date': {
        if (!this.#hasExactKeys(value, ['type', 'value']) || typeof value['value'] !== 'string') {
          throw new SdPersistenceError('INVALID_NODE', `Invalid date node at index ${index}`);
        }
        this.#ensureStringLength(value['value'], `$.nodes[${index}].value`);
        let canonical = false;
        try {
          const date = new Date(value['value']);
          canonical = Number.isFinite(DATE_GET_TIME.call(date)) && DATE_TO_ISO_STRING.call(date) === value['value'];
        } catch {
          canonical = false;
        }
        if (!canonical) throw new SdPersistenceError('INVALID_NODE', `Invalid date node at index ${index}`);
        return { type: 'date', value: value['value'] };
      }
      case 'map': {
        if (!this.#hasExactKeys(value, ['type', 'entries']) || !Array.isArray(value['entries'])) {
          throw new SdPersistenceError('INVALID_NODE', `Invalid map node at index ${index}`);
        }
        this.#consumeEntries(value['entries'].length, `$.nodes[${index}]`, budget);
        const seen = new Set<string>();
        const entries = value['entries'].map((entry, entryIndex): [SdGraphValue, SdGraphValue] => {
          if (!Array.isArray(entry) || entry.length !== 2) {
            throw new SdPersistenceError('INVALID_NODE', `Invalid map entry at index ${index}:${entryIndex}`);
          }
          const key = this.#validateGraphValue(entry[0], `$.nodes[${index}].entries[${entryIndex}].key`);
          const signature = this.#graphValueSignature(key);
          if (seen.has(signature)) throw new SdPersistenceError('INVALID_NODE', `Duplicate map key at index ${index}:${entryIndex}`);
          seen.add(signature);
          return [key, this.#validateGraphValue(entry[1], `$.nodes[${index}].entries[${entryIndex}].value`)];
        });
        return { type: 'map', entries };
      }
      default:
        throw new SdPersistenceError('INVALID_NODE', `Unknown node type at index ${index}`);
    }
  }

  #validateGraphValue(value: unknown, path: string): SdGraphValue {
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      this.#ensureStringLength(value, path);
      return value;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new SdPersistenceError('INVALID_DOCUMENT', `Non-finite number at ${path}`);
      return value;
    }
    if (!this.#isRecord(value)) throw new SdPersistenceError('INVALID_DOCUMENT', `Invalid graph value at ${path}`);
    const hasReference = '$ref' in value;
    const hasType = '$type' in value;
    if (hasReference === hasType) throw new SdPersistenceError('INVALID_DOCUMENT', `Ambiguous graph value tag at ${path}`);
    if (hasReference) {
      if (!this.#hasExactKeys(value, ['$ref'])) throw new SdPersistenceError('INVALID_DOCUMENT', `Malformed reference tag at ${path}`);
      if (!Number.isInteger(value['$ref']) || (value['$ref'] as number) < 0) {
        throw new SdPersistenceError('INVALID_REFERENCE', `Invalid reference at ${path}`);
      }
      return { $ref: value['$ref'] as number };
    }
    if (value['$type'] === 'undefined' && this.#hasExactKeys(value, ['$type'])) return { $type: 'undefined' };
    if (value['$type'] === 'number' && this.#hasExactKeys(value, ['$type', 'value']) && this.#isSpecialNumber(value['value'])) {
      return { $type: 'number', value: value['value'] };
    }
    if (
      value['$type'] === 'bigint' &&
      this.#hasExactKeys(value, ['$type', 'value']) &&
      typeof value['value'] === 'string' &&
      /^-?\d+$/.test(value['value'])
    ) {
      this.#ensureBigIntLength(value['value'], path);
      return { $type: 'bigint', value: value['value'] };
    }
    throw new SdPersistenceError('INVALID_DOCUMENT', `Unknown graph value tag at ${path}`);
  }

  #validateDepth(envelope: SdGraphEnvelope): void {
    const highestDepth = new Map<number, number>();
    const visit = (value: SdGraphValue, depth: number, path: string, active: Set<number>): void => {
      this.#ensureDepth(depth, path);
      if (typeof value !== 'object' || value === null || !('$ref' in value)) return;
      if (value.$ref >= envelope.nodes.length) {
        throw new SdPersistenceError('INVALID_REFERENCE', `Reference out of bounds at ${path}`);
      }
      if (active.has(value.$ref)) return;
      const previous = highestDepth.get(value.$ref);
      if (previous !== undefined && previous >= depth) return;
      highestDepth.set(value.$ref, depth);
      active.add(value.$ref);
      const node = envelope.nodes[value.$ref];
      switch (node.type) {
        case 'array':
        case 'set':
          node.values.forEach((item, index) => visit(item, depth + 1, `${path}[${index}]`, active));
          break;
        case 'object':
          node.entries.forEach(([key, item]) => visit(item, depth + 1, `${path}.${key}`, active));
          break;
        case 'map':
          node.entries.forEach(([key, item], index) => {
            visit(key, depth + 1, `${path}.mapKey[${index}]`, active);
            visit(item, depth + 1, `${path}.mapValue[${index}]`, active);
          });
          break;
        case 'date':
          break;
      }
      active.delete(value.$ref);
    };
    visit(envelope.root, 0, '$.root', new Set<number>());
    envelope.nodes.forEach((_node, index) => visit({ $ref: index }, 0, `$.nodes[${index}]`, new Set<number>()));
  }

  #createNode(node: SdGraphNode, index: number): unknown {
    switch (node.type) {
      case 'array':
        return [];
      case 'object':
        return node.prototype === 'null' ? Object.create(null) : {};
      case 'date':
        return new Date(node.value);
      case 'map':
        return new Map<unknown, unknown>();
      case 'set':
        return new Set<unknown>();
      default:
        throw new SdPersistenceError('INVALID_NODE', `Unknown node type at index ${index}`);
    }
  }

  #populateNode(node: SdGraphNode, target: unknown, values: unknown[]): void {
    switch (node.type) {
      case 'array': {
        const array = target as unknown[];
        array.length = node.values.length;
        node.values.forEach((value, index) => {
          array[index] = this.#decode(value, values, `array[${index}]`);
        });
        break;
      }
      case 'object': {
        const object = target as Record<string, unknown>;
        for (const [key, value] of node.entries) {
          Object.defineProperty(object, key, {
            configurable: true,
            enumerable: true,
            value: this.#decode(value, values, `object.${key}`),
            writable: true,
          });
        }
        break;
      }
      case 'map': {
        const map = target as Map<unknown, unknown>;
        for (const [key, value] of node.entries) {
          MAP_SET.call(map, this.#decode(key, values, 'map.key'), this.#decode(value, values, 'map.value'));
        }
        break;
      }
      case 'set': {
        const set = target as Set<unknown>;
        for (const value of node.values) SET_ADD.call(set, this.#decode(value, values, 'set.value'));
        break;
      }
      case 'date':
        break;
    }
  }

  #decode(value: SdGraphValue, values: unknown[], path: string): unknown {
    if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return value;
    if ('$ref' in value) {
      if (value.$ref >= values.length) throw new SdPersistenceError('INVALID_REFERENCE', `Reference out of bounds at ${path}`);
      return values[value.$ref];
    }
    if (value.$type === 'undefined') return undefined;
    if (value.$type === 'bigint') return BigInt(value.value);
    switch (value.value) {
      case 'NaN':
        return Number.NaN;
      case 'Infinity':
        return Number.POSITIVE_INFINITY;
      case '-Infinity':
        return Number.NEGATIVE_INFINITY;
      case '-0':
        return -0;
    }
  }

  #addNode(nodes: SdGraphNode[], node: SdGraphNode, path: string): void {
    if (nodes.length >= this.limits.maxNodes) throw new SdPersistenceError('LIMIT_EXCEEDED', `Graph node limit exceeded at ${path}`);
    nodes.push(node);
  }

  #consumeEntries(count: number, path: string, budget: SdGraphTraversalBudget): void {
    if (count > this.limits.maxEntries - budget.entries) {
      throw new SdPersistenceError('LIMIT_EXCEEDED', `Graph entry limit exceeded at ${path}`);
    }
    budget.entries += count;
  }

  #ensureDocumentLength(length: number): void {
    if (length > this.limits.maxDocumentCharacters) {
      throw new SdPersistenceError('LIMIT_EXCEEDED', 'Serialized document character limit exceeded');
    }
  }

  #ensureDepth(depth: number, path: string): void {
    if (depth > this.limits.maxDepth) throw new SdPersistenceError('LIMIT_EXCEEDED', `Graph depth limit exceeded at ${path}`);
  }

  #ensureStringLength(value: string, path: string): void {
    if (value.length > this.limits.maxStringCharacters) {
      throw new SdPersistenceError('LIMIT_EXCEEDED', `String character limit exceeded at ${path}`);
    }
  }

  #ensureKeyLength(value: string, path: string): void {
    if (value.length > this.limits.maxKeyCharacters) {
      throw new SdPersistenceError('LIMIT_EXCEEDED', `Object key character limit exceeded at ${path}`);
    }
  }

  #ensureBigIntLength(value: string, path: string): void {
    const digits = value.startsWith('-') ? value.length - 1 : value.length;
    if (digits > this.limits.maxBigIntDigits) {
      throw new SdPersistenceError('LIMIT_EXCEEDED', `BigInt digit limit exceeded at ${path}`);
    }
  }

  #ensureNoOwnProperties(value: object, path: string, type: string): void {
    if (Reflect.ownKeys(value).length > 0) {
      throw new SdPersistenceError('UNSUPPORTED_VALUE', `Own properties on ${type} are unsupported at ${path}`);
    }
  }

  #rejectDuplicateValues(values: SdGraphValue[], description: string): void {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      const signature = this.#graphValueSignature(value);
      if (seen.has(signature)) throw new SdPersistenceError('INVALID_NODE', `Duplicate value in ${description}:${index}`);
      seen.add(signature);
    });
  }

  #graphValueSignature(value: SdGraphValue): string {
    if (value === null) return 'null';
    if (typeof value === 'string') return `string:${value}`;
    if (typeof value === 'boolean') return `boolean:${value}`;
    if (typeof value === 'number') return `number:${Object.is(value, -0) ? 0 : value}`;
    if ('$ref' in value) return `ref:${value.$ref}`;
    if (value.$type === 'number') return value.value === '-0' ? 'number:0' : `number:${value.value}`;
    if (value.$type === 'bigint') return `bigint:${BigInt(value.value).toString()}`;
    return `type:${value.$type}`;
  }

  #isArrayIndex(key: string, length: number): boolean {
    const index = Number(key);
    return Number.isInteger(index) && index >= 0 && index < length && index <= 4_294_967_294 && String(index) === key;
  }

  #isSpecialNumber(value: unknown): value is SdGraphSpecialNumber {
    return value === 'NaN' || value === 'Infinity' || value === '-Infinity' || value === '-0';
  }

  #hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
    const keys = Object.keys(value);
    return keys.length === expected.length && expected.every(key => Object.prototype.hasOwnProperty.call(value, key));
  }

  #isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
