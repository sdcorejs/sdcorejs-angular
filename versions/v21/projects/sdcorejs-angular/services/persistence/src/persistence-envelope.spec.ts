import { SdPersistenceError } from './graph-serializer';
import { SdGraphSerializer } from './graph-serializer';
import {
  SD_PERSISTENCE_ENVELOPE_HARD_LIMITS,
  parseSdPersistenceEnvelope,
  stringifySdPersistenceTombstoneEnvelope,
  stringifySdPersistenceValueEnvelope,
} from './persistence-envelope';

describe('persistence envelope limits', () => {
  function expectLimit(operation: () => unknown): void {
    try {
      operation();
      fail('Expected LIMIT_EXCEEDED');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(SdPersistenceError);
      if (error instanceof SdPersistenceError) expect(error.code).toBe('LIMIT_EXCEEDED');
    }
  }

  it('checks identity, serializer, payload, and total document before unsafe work', () => {
    expectLimit(() => stringifySdPersistenceValueEnvelope('identity', 'serializer', 'payload', { maxIdentityCharacters: 3 }));
    expectLimit(() => stringifySdPersistenceTombstoneEnvelope('identity', 'serializer', { maxSerializerCharacters: 3 }));
    expectLimit(() => stringifySdPersistenceValueEnvelope('identity', 'serializer', 'payload', { maxPayloadCharacters: 3 }));
    expectLimit(() => stringifySdPersistenceValueEnvelope('identity', 'serializer', 'payload', { maxDocumentCharacters: 20 }));

    const serialized = stringifySdPersistenceValueEnvelope('identity', 'serializer', 'payload');
    expectLimit(() => parseSdPersistenceEnvelope(serialized, 'identity', 'serializer', { maxDocumentCharacters: 20 }));
    expectLimit(() => parseSdPersistenceEnvelope(serialized, 'identity', 'serializer', { maxPayloadCharacters: 3 }));
    expectLimit(() => parseSdPersistenceEnvelope(serialized, 'identity', 'serializer', { maxIdentityCharacters: 3 }));
    expectLimit(() => parseSdPersistenceEnvelope(serialized, 'identity', 'serializer', { maxSerializerCharacters: 3 }));
  });

  it('accommodates worst-case JSON escaping for an accepted graph payload', () => {
    const serializer = new SdGraphSerializer();
    const payload = serializer.stringify({ data: Array.from({ length: 4 }, () => '"'.repeat(450_000)), createdOn: new Date(0) });
    expect(payload.length).toBeGreaterThan(3_600_000);
    const document = stringifySdPersistenceValueEnvelope('identity', serializer.format, payload);
    expect(parseSdPersistenceEnvelope(document, 'identity', serializer.format)?.kind).toBe('value');
  });

  it('budgets the outer document for worst-case escaping of every bounded string field', () => {
    const worstCaseCharacters =
      6 *
        (SD_PERSISTENCE_ENVELOPE_HARD_LIMITS.maxPayloadCharacters +
          SD_PERSISTENCE_ENVELOPE_HARD_LIMITS.maxIdentityCharacters +
          SD_PERSISTENCE_ENVELOPE_HARD_LIMITS.maxSerializerCharacters) +
      256;
    expect(SD_PERSISTENCE_ENVELOPE_HARD_LIMITS.maxDocumentCharacters).toBeGreaterThanOrEqual(worstCaseCharacters);
  });
});
