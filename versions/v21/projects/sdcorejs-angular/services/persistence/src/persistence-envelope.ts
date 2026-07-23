import { SdPersistenceError } from './graph-serializer';

export const SD_PERSISTENCE_ENVELOPE_FORMAT = 'sdcorejs.persistence-envelope';
export const SD_PERSISTENCE_ENVELOPE_VERSION = 1;

export interface SdPersistenceEnvelopeLimits {
  maxDocumentCharacters: number;
  maxPayloadCharacters: number;
  maxSerializerCharacters: number;
  maxIdentityCharacters: number;
}

export const SD_PERSISTENCE_ENVELOPE_HARD_LIMITS: Readonly<SdPersistenceEnvelopeLimits> = Object.freeze({
  maxDocumentCharacters: 24_020_000,
  maxPayloadCharacters: 4_000_000,
  maxSerializerCharacters: 1_024,
  maxIdentityCharacters: 1_024,
});

export interface SdPersistenceValueEnvelope {
  format: typeof SD_PERSISTENCE_ENVELOPE_FORMAT;
  version: typeof SD_PERSISTENCE_ENVELOPE_VERSION;
  kind: 'value';
  identity: string;
  serializer: string;
  payload: string;
}

export interface SdPersistenceTombstoneEnvelope {
  format: typeof SD_PERSISTENCE_ENVELOPE_FORMAT;
  version: typeof SD_PERSISTENCE_ENVELOPE_VERSION;
  kind: 'tombstone';
  identity: string;
  serializer: string;
}

export type SdPersistenceEnvelope = SdPersistenceValueEnvelope | SdPersistenceTombstoneEnvelope;

export function stringifySdPersistenceValueEnvelope(
  identity: string,
  serializer: string,
  payload: string,
  limits?: Partial<SdPersistenceEnvelopeLimits>
): string {
  const resolved = resolveLimits(limits);
  ensureFieldLimits(identity, serializer, payload, resolved);
  const envelope: SdPersistenceValueEnvelope = {
    format: SD_PERSISTENCE_ENVELOPE_FORMAT,
    version: SD_PERSISTENCE_ENVELOPE_VERSION,
    kind: 'value',
    identity,
    serializer,
    payload,
  };
  const serialized = JSON.stringify(envelope);
  ensureDocumentLimit(serialized, resolved);
  return serialized;
}

export function stringifySdPersistenceTombstoneEnvelope(
  identity: string,
  serializer: string,
  limits?: Partial<SdPersistenceEnvelopeLimits>
): string {
  const resolved = resolveLimits(limits);
  ensureFieldLimits(identity, serializer, undefined, resolved);
  const envelope: SdPersistenceTombstoneEnvelope = {
    format: SD_PERSISTENCE_ENVELOPE_FORMAT,
    version: SD_PERSISTENCE_ENVELOPE_VERSION,
    kind: 'tombstone',
    identity,
    serializer,
  };
  const serialized = JSON.stringify(envelope);
  ensureDocumentLimit(serialized, resolved);
  return serialized;
}

export function parseSdPersistenceEnvelope(
  serialized: string,
  expectedIdentity: string,
  expectedSerializer: string,
  limits?: Partial<SdPersistenceEnvelopeLimits>
): SdPersistenceEnvelope | undefined {
  const resolved = resolveLimits(limits);
  ensureFieldLimits(expectedIdentity, expectedSerializer, undefined, resolved);
  ensureDocumentLimit(serialized, resolved);
  let value: unknown;
  try {
    value = JSON.parse(serialized) as unknown;
  } catch {
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  if (typeof value['identity'] === 'string' && value['identity'].length > resolved.maxIdentityCharacters) {
    throw new SdPersistenceError('LIMIT_EXCEEDED', 'Persistence envelope identity character limit exceeded');
  }
  if (typeof value['serializer'] === 'string' && value['serializer'].length > resolved.maxSerializerCharacters) {
    throw new SdPersistenceError('LIMIT_EXCEEDED', 'Persistence envelope serializer character limit exceeded');
  }
  if (typeof value['payload'] === 'string' && value['payload'].length > resolved.maxPayloadCharacters) {
    throw new SdPersistenceError('LIMIT_EXCEEDED', 'Persistence envelope payload character limit exceeded');
  }
  if (
    value['format'] !== SD_PERSISTENCE_ENVELOPE_FORMAT ||
    value['version'] !== SD_PERSISTENCE_ENVELOPE_VERSION ||
    value['identity'] !== expectedIdentity ||
    value['serializer'] !== expectedSerializer
  ) {
    return undefined;
  }
  if (value['kind'] === 'tombstone' && hasExactKeys(value, ['format', 'version', 'kind', 'identity', 'serializer'])) {
    return {
      format: SD_PERSISTENCE_ENVELOPE_FORMAT,
      version: SD_PERSISTENCE_ENVELOPE_VERSION,
      kind: 'tombstone',
      identity: expectedIdentity,
      serializer: expectedSerializer,
    };
  }
  if (
    value['kind'] === 'value' &&
    typeof value['payload'] === 'string' &&
    hasExactKeys(value, ['format', 'version', 'kind', 'identity', 'serializer', 'payload'])
  ) {
    return {
      format: SD_PERSISTENCE_ENVELOPE_FORMAT,
      version: SD_PERSISTENCE_ENVELOPE_VERSION,
      kind: 'value',
      identity: expectedIdentity,
      serializer: expectedSerializer,
      payload: value['payload'],
    };
  }
  return undefined;
}

function resolveLimits(limits: Partial<SdPersistenceEnvelopeLimits> | undefined): Readonly<SdPersistenceEnvelopeLimits> {
  const resolved = { ...SD_PERSISTENCE_ENVELOPE_HARD_LIMITS, ...limits };
  for (const key of Object.keys(SD_PERSISTENCE_ENVELOPE_HARD_LIMITS) as (keyof SdPersistenceEnvelopeLimits)[]) {
    const value = resolved[key];
    if (!Number.isSafeInteger(value) || value < 1 || value > SD_PERSISTENCE_ENVELOPE_HARD_LIMITS[key]) {
      throw new SdPersistenceError('LIMIT_EXCEEDED', `Invalid persistence envelope ${key} limit`);
    }
  }
  return resolved;
}

function ensureFieldLimits(
  identity: string,
  serializer: string,
  payload: string | undefined,
  limits: Readonly<SdPersistenceEnvelopeLimits>
): void {
  if (identity.length > limits.maxIdentityCharacters) {
    throw new SdPersistenceError('LIMIT_EXCEEDED', 'Persistence envelope identity character limit exceeded');
  }
  if (serializer.length > limits.maxSerializerCharacters) {
    throw new SdPersistenceError('LIMIT_EXCEEDED', 'Persistence envelope serializer character limit exceeded');
  }
  if (payload !== undefined && payload.length > limits.maxPayloadCharacters) {
    throw new SdPersistenceError('LIMIT_EXCEEDED', 'Persistence envelope payload character limit exceeded');
  }
}

function ensureDocumentLimit(serialized: string, limits: Readonly<SdPersistenceEnvelopeLimits>): void {
  if (serialized.length > limits.maxDocumentCharacters) {
    throw new SdPersistenceError('LIMIT_EXCEEDED', 'Persistence envelope document character limit exceeded');
  }
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every(key => Object.prototype.hasOwnProperty.call(value, key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
