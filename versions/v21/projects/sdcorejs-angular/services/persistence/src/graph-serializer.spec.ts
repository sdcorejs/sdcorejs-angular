import { SdGraphSerializer, SdPersistenceError } from './graph-serializer';

describe('SdGraphSerializer', () => {
  const serializer = new SdGraphSerializer();

  it('round-trips cycles, shared references, collections, dates, and null-prototype objects', () => {
    const shared: Record<string, unknown> = { label: 'shared' };
    const nullPrototype = Object.create(null) as Record<string, unknown>;
    nullPrototype['safe'] = shared;
    Object.defineProperty(nullPrototype, '__proto__', {
      configurable: true,
      enumerable: true,
      value: 'data-not-a-prototype',
      writable: true,
    });

    const source: Record<string, unknown> = {
      array: [shared],
      date: new Date('2026-07-21T10:20:30.000Z'),
      map: new Map<unknown, unknown>([[shared, nullPrototype]]),
      set: new Set<unknown>([shared]),
      nullPrototype,
    };
    source['self'] = source;
    shared['owner'] = source;

    const cloned = serializer.clone(source);
    const clonedArray = cloned['array'] as unknown[];
    const clonedShared = clonedArray[0] as Record<string, unknown>;
    const clonedMap = cloned['map'] as Map<unknown, unknown>;
    const clonedSet = cloned['set'] as Set<unknown>;
    const clonedNullPrototype = cloned['nullPrototype'] as Record<string, unknown>;

    expect(cloned).not.toBe(source);
    expect(cloned['self']).toBe(cloned);
    expect(clonedShared['owner']).toBe(cloned);
    expect(Array.from(clonedMap.keys())[0]).toBe(clonedShared);
    expect(Array.from(clonedSet)[0]).toBe(clonedShared);
    expect(clonedMap.get(clonedShared)).toBe(clonedNullPrototype);
    expect(cloned['date']).toEqual(new Date('2026-07-21T10:20:30.000Z'));
    expect(Object.getPrototypeOf(clonedNullPrototype)).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(clonedNullPrototype, '__proto__')).toBeTrue();
    expect(clonedNullPrototype['__proto__']).toBe('data-not-a-prototype');
  });

  it('round-trips special primitives without collapsing their semantics', () => {
    const cloned = serializer.clone({
      bigint: 12345678901234567890n,
      infinity: Number.POSITIVE_INFINITY,
      nan: Number.NaN,
      negativeInfinity: Number.NEGATIVE_INFINITY,
      negativeZero: -0,
      undefined,
    });

    expect(cloned.bigint).toBe(12345678901234567890n);
    expect(cloned.infinity).toBe(Number.POSITIVE_INFINITY);
    expect(Number.isNaN(cloned.nan)).toBeTrue();
    expect(cloned.negativeInfinity).toBe(Number.NEGATIVE_INFINITY);
    expect(Object.is(cloned.negativeZero, -0)).toBeTrue();
    expect(Object.prototype.hasOwnProperty.call(cloned, 'undefined')).toBeTrue();
    expect(cloned.undefined).toBeUndefined();
  });

  it('produces deterministic output for equivalent plain-object graphs', () => {
    expect(serializer.stringify({ b: 2, a: 1 })).toBe(serializer.stringify({ a: 1, b: 2 }));
  });

  it('rejects executable values and unsupported class instances', () => {
    class Unsupported {
      value = 1;
    }

    expect(() => serializer.stringify({ callback: () => undefined })).toThrowError(SdPersistenceError);
    expect(() => serializer.stringify({ symbol: Symbol('unsafe') })).toThrowError(SdPersistenceError);
    expect(() => serializer.stringify(new Unsupported())).toThrowError(SdPersistenceError);
  });

  it('rejects malformed documents, unknown versions, references, and node types deterministically', () => {
    const malformedInputs = [
      'not-json',
      JSON.stringify({ format: 'sdcorejs.graph', version: 99, root: null, nodes: [] }),
      JSON.stringify({ format: 'sdcorejs.graph', version: 1, root: { $ref: 9 }, nodes: [] }),
      JSON.stringify({
        format: 'sdcorejs.graph',
        version: 1,
        root: { $ref: 0 },
        nodes: [{ type: 'constructor', value: 'Date' }],
      }),
    ];

    for (const input of malformedInputs) {
      expect(() => serializer.parse(input)).toThrowError(SdPersistenceError);
    }
  });

  it('exposes a stable format and classifies malformed graph tags and references with deterministic codes', () => {
    expect(serializer.format).toBe('sdcorejs.graph@1');

    const cases: { code: string; input: string; path: string }[] = [
      {
        code: 'UNKNOWN_FORMAT',
        input: JSON.stringify({ format: 'other.graph', version: 1, root: null, nodes: [] }),
        path: 'format',
      },
      {
        code: 'INVALID_DOCUMENT',
        input: JSON.stringify({
          format: 'sdcorejs.graph',
          version: 1,
          root: { $ref: 0, $type: 'undefined' },
          nodes: [{ type: 'array', values: [] }],
        }),
        path: '$.root',
      },
      {
        code: 'INVALID_DOCUMENT',
        input: JSON.stringify({
          format: 'sdcorejs.graph',
          version: 1,
          root: { $type: 'undefined', extra: true },
          nodes: [],
        }),
        path: '$.root',
      },
      {
        code: 'INVALID_REFERENCE',
        input: JSON.stringify({ format: 'sdcorejs.graph', version: 1, root: { $ref: -1 }, nodes: [] }),
        path: '$.root',
      },
      {
        code: 'INVALID_REFERENCE',
        input: JSON.stringify({ format: 'sdcorejs.graph', version: 1, root: { $ref: 0.5 }, nodes: [] }),
        path: '$.root',
      },
      {
        code: 'INVALID_REFERENCE',
        input: JSON.stringify({ format: 'sdcorejs.graph', version: 1, root: { $ref: 1 }, nodes: [] }),
        path: '$.root',
      },
      {
        code: 'INVALID_NODE',
        input: JSON.stringify({
          format: 'sdcorejs.graph',
          version: 1,
          root: { $ref: 0 },
          nodes: [{ type: 'object', prototype: 'object', entries: [['missing-value']] }],
        }),
        path: '0:0',
      },
    ];

    for (const testCase of cases) {
      try {
        serializer.parse(testCase.input);
        fail(`Expected ${testCase.code}`);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(SdPersistenceError);
        if (error instanceof SdPersistenceError) {
          expect(error.code).toBe(testCase.code);
          expect(error.message).toContain(testCase.path);
        }
      }
    }
  });

  it('rejects sparse arrays without invoking accessors and rejects unsupported array shapes', () => {
    const sparse: unknown[] = [];
    sparse.length = 3;
    sparse[2] = 'present';
    expect(() => serializer.clone(sparse)).toThrowError(SdPersistenceError);

    let getterCalls = 0;
    const accessor: unknown[] = [];
    Object.defineProperty(accessor, '0', {
      configurable: true,
      enumerable: true,
      get: () => {
        getterCalls += 1;
        return 'unsafe';
      },
    });
    expect(() => serializer.stringify(accessor)).toThrowError(SdPersistenceError);
    expect(getterCalls).toBe(0);

    const extra: unknown[] = [];
    Object.defineProperty(extra, 'extra', { enumerable: true, value: true });
    expect(() => serializer.stringify(extra)).toThrowError(SdPersistenceError);

    const symbolProperty: unknown[] = [];
    Object.defineProperty(symbolProperty, Symbol('extra'), { value: true });
    expect(() => serializer.stringify(symbolProperty)).toThrowError(SdPersistenceError);

    class ArraySubclass<T> extends Array<T> {}
    expect(() => serializer.stringify(new ArraySubclass('value'))).toThrowError(SdPersistenceError);
  });

  it('uses exact built-in brands and rejects subclasses or overridden built-in operations', () => {
    class DateSubclass extends Date {}
    class MapSubclass<K, V> extends Map<K, V> {}
    class SetSubclass<T> extends Set<T> {}

    expect(() => serializer.stringify(new DateSubclass())).toThrowError(SdPersistenceError);
    expect(() => serializer.stringify(new MapSubclass())).toThrowError(SdPersistenceError);
    expect(() => serializer.stringify(new SetSubclass())).toThrowError(SdPersistenceError);

    let overrideCalls = 0;
    const date = new Date('2026-07-21T00:00:00.000Z');
    Object.defineProperty(date, 'toISOString', {
      value: () => {
        overrideCalls += 1;
        return 'unsafe';
      },
    });
    const map = new Map<unknown, unknown>([['key', 'value']]);
    Object.defineProperty(map, 'entries', {
      value: () => {
        overrideCalls += 1;
        return new Map().entries();
      },
    });
    const set = new Set<unknown>(['value']);
    Object.defineProperty(set, 'values', {
      value: () => {
        overrideCalls += 1;
        return new Set().values();
      },
    });

    expect(() => serializer.stringify(date)).toThrowError(SdPersistenceError);
    expect(() => serializer.stringify(map)).toThrowError(SdPersistenceError);
    expect(() => serializer.stringify(set)).toThrowError(SdPersistenceError);
    expect(overrideCalls).toBe(0);
  });

  it('rejects schema extras, duplicate collection entries, and non-canonical dates', () => {
    const malformed = [
      { format: 'sdcorejs.graph', version: 1, root: null, nodes: [], extra: true },
      {
        format: 'sdcorejs.graph',
        version: 1,
        root: { $ref: 0 },
        nodes: [{ type: 'array', values: [], extra: true }],
      },
      {
        format: 'sdcorejs.graph',
        version: 1,
        root: { $ref: 0 },
        nodes: [
          {
            type: 'object',
            prototype: 'object',
            entries: [
              ['same', 1],
              ['same', 2],
            ],
          },
        ],
      },
      {
        format: 'sdcorejs.graph',
        version: 1,
        root: { $ref: 0 },
        nodes: [{ type: 'set', values: ['same', 'same'] }],
      },
      {
        format: 'sdcorejs.graph',
        version: 1,
        root: { $ref: 0 },
        nodes: [
          {
            type: 'map',
            entries: [
              ['same', 1],
              ['same', 2],
            ],
          },
        ],
      },
      {
        format: 'sdcorejs.graph',
        version: 1,
        root: { $ref: 0 },
        nodes: [{ type: 'date', value: '2026-07-21' }],
      },
    ];

    for (const document of malformed) {
      expect(() => serializer.parse(JSON.stringify(document))).toThrowError(SdPersistenceError);
    }
  });

  it('enforces deterministic configurable limits while stringifying and parsing', () => {
    const cases: { option: ConstructorParameters<typeof SdGraphSerializer>[0]; value: unknown }[] = [
      { option: { maxDepth: 2 }, value: { one: { two: { three: true } } } },
      { option: { maxNodes: 2 }, value: { one: {}, two: {} } },
      { option: { maxEntries: 1 }, value: { one: 1, two: 2 } },
      { option: { maxStringCharacters: 3 }, value: 'four' },
      { option: { maxKeyCharacters: 3 }, value: { four: true } },
      { option: { maxBigIntDigits: 3 }, value: 1234n },
    ];

    for (const testCase of cases) {
      const limited = new SdGraphSerializer(testCase.option);
      const serialized = serializer.stringify(testCase.value);
      for (const operation of [() => limited.stringify(testCase.value), () => limited.parse(serialized)]) {
        try {
          operation();
          fail('Expected the configured limit to be enforced');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(SdPersistenceError);
          if (error instanceof SdPersistenceError) expect(error.code).toBe('LIMIT_EXCEEDED');
        }
      }
    }

    const documentLimited = new SdGraphSerializer({ maxDocumentCharacters: 20 });
    for (const operation of [() => documentLimited.stringify(null), () => documentLimited.parse(serializer.stringify(null))]) {
      try {
        operation();
        fail('Expected document length to be enforced');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(SdPersistenceError);
        if (error instanceof SdPersistenceError) expect(error.code).toBe('LIMIT_EXCEEDED');
      }
    }
  });
});
