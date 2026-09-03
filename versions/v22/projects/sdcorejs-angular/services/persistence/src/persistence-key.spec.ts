import { buildSdPersistenceKey, digestSdPersistenceKey } from './persistence-key';

describe('persistence keys', () => {
  it('computes SHA-256 using published known vectors', () => {
    expect(digestSdPersistenceKey('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(digestSdPersistenceKey('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(digestSdPersistenceKey('The quick brown fox jumps over the lazy dog')).toBe(
      'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'
    );
  });

  it('keeps distinct unpaired UTF-16 surrogates injective', () => {
    expect(digestSdPersistenceKey('\ud800a')).not.toBe(digestSdPersistenceKey('\udc00a'));
    expect(digestSdPersistenceKey('\ud800a')).not.toBe(digestSdPersistenceKey('\ufffda'));
    expect(digestSdPersistenceKey('\udc00a')).not.toBe(digestSdPersistenceKey('\ufffda'));
  });

  it('keeps the canonical identity lossless before producing a fixed-length digest', () => {
    const first = buildSdPersistenceKey('a:b', [
      { tag: 'c', value: 'd' },
      { tag: 'secret', value: 'do-not-leak' },
    ]);
    const second = buildSdPersistenceKey('a', [
      { tag: 'b:c', value: 'd' },
      { tag: 'secret', value: 'do-not-leak' },
    ]);

    expect(first).not.toBe(second);
    expect(digestSdPersistenceKey(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(digestSdPersistenceKey(first)).not.toContain('do-not-leak');
  });
});
