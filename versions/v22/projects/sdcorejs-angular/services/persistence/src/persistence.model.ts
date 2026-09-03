export const SD_GRAPH_FORMAT = 'sdcorejs.graph';
export const SD_GRAPH_VERSION = 1;

export type SdPersistenceErrorCode =
  | 'INVALID_DOCUMENT'
  | 'UNKNOWN_FORMAT'
  | 'UNKNOWN_VERSION'
  | 'INVALID_NODE'
  | 'INVALID_REFERENCE'
  | 'UNSUPPORTED_VALUE'
  | 'LIMIT_EXCEEDED';

export interface SdGraphSerializerLimits {
  maxDocumentCharacters: number;
  maxDepth: number;
  maxNodes: number;
  maxEntries: number;
  maxStringCharacters: number;
  maxKeyCharacters: number;
  maxBigIntDigits: number;
}

export interface SdPersistenceSerializer {
  readonly format: string;
  stringify<T>(value: T): string;
  parse<T = unknown>(serialized: string): T;
  clone<T>(value: T): T;
}

/** Deterministic, versioned canonicalization used only for persistence identity. */
export interface SdPersistenceIdentityCanonicalizer {
  readonly format: string;
  canonicalize(value: unknown): string;
}

export type SdGraphSpecialNumber = 'NaN' | 'Infinity' | '-Infinity' | '-0';

export type SdGraphValue =
  | null
  | boolean
  | string
  | number
  | { $ref: number }
  | { $type: 'undefined' }
  | { $type: 'number'; value: SdGraphSpecialNumber }
  | { $type: 'bigint'; value: string };

export interface SdGraphArrayNode {
  type: 'array';
  values: SdGraphValue[];
}

export interface SdGraphObjectNode {
  type: 'object';
  prototype: 'object' | 'null';
  entries: [string, SdGraphValue][];
}

export interface SdGraphDateNode {
  type: 'date';
  value: string;
}

export interface SdGraphMapNode {
  type: 'map';
  entries: [SdGraphValue, SdGraphValue][];
}

export interface SdGraphSetNode {
  type: 'set';
  values: SdGraphValue[];
}

export type SdGraphNode = SdGraphArrayNode | SdGraphObjectNode | SdGraphDateNode | SdGraphMapNode | SdGraphSetNode;

export interface SdGraphEnvelope {
  format: typeof SD_GRAPH_FORMAT;
  version: typeof SD_GRAPH_VERSION;
  root: SdGraphValue;
  nodes: SdGraphNode[];
}
