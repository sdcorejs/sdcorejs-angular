import type { SdApiContract } from './api-contract.model';
import { serializeSdApiContract } from './api-contract.serializer';

function minimalContract(): SdApiContract {
  return {
    contractVersion: 1,
    code: 'product.search',
    name: 'Search products',
    input: { schema: { type: 'object', properties: {} } },
    req: { method: 'GET', url: '/products' },
    res: { status: 200 },
    output: { schema: { type: 'object', properties: {} } },
  };
}

describe('api-contract.serializer', () => {
  it('emits JSON indented with two spaces', () => {
    const json = serializeSdApiContract(minimalContract());

    expect(json.split('\n')[1]).toBe('  "contractVersion": 1,');
    expect(() => JSON.parse(json) as unknown).not.toThrow();
  });

  it('orders the top-level keys deterministically regardless of declaration order', () => {
    const scrambled = {
      output: { schema: { type: 'string' } },
      res: { status: 200 },
      name: 'Search products',
      req: { url: '/products', method: 'GET' },
      code: 'product.search',
      input: { schema: { type: 'string' } },
      contractVersion: 1,
      description: 'desc',
    } as unknown as SdApiContract;

    expect(Object.keys(JSON.parse(serializeSdApiContract(scrambled)) as object)).toEqual([
      'contractVersion',
      'code',
      'name',
      'description',
      'input',
      'req',
      'res',
      'output',
    ]);
  });

  it('orders request, response and node keys deterministically', () => {
    const contract = minimalContract();
    contract.req = {
      body: { source: '${input.a}', type: 'string', required: true, label: 'A' },
      url: '/products',
      headers: { 'x-a': { type: 'string', value: 'v' } },
      method: 'POST',
      query: { q: { type: 'string' } },
      path: {},
    } as SdApiContract['req'];
    contract.res = { body: { type: 'string' }, headers: {}, status: [200, 201] } as SdApiContract['res'];

    const parsed = JSON.parse(serializeSdApiContract(contract)) as Record<string, Record<string, unknown>>;

    expect(Object.keys(parsed['req'])).toEqual(['method', 'url', 'path', 'query', 'headers', 'body']);
    expect(Object.keys(parsed['res'])).toEqual(['status', 'headers', 'body']);
    expect(Object.keys(parsed['req']['body'] as object)).toEqual(['type', 'required', 'label', 'source']);
  });

  it('omits undefined members', () => {
    const contract = minimalContract();
    contract.description = undefined;
    contract.input.schema = { type: 'string', required: undefined, label: undefined };

    const parsed = JSON.parse(serializeSdApiContract(contract)) as Record<string, unknown>;

    expect('description' in parsed).toBeFalse();
    expect(Object.keys((parsed['input'] as Record<string, object>)['schema'])).toEqual(['type']);
  });

  it('preserves declared false, zero, null and empty string', () => {
    const contract = minimalContract();
    contract.description = '';
    contract.input.schema = {
      type: 'object',
      properties: {
        flag: { type: 'boolean', required: false },
      },
    };
    contract.req.body = {
      type: 'object',
      properties: {
        zero: { type: 'number', value: 0 },
        nothing: { type: 'string', value: null },
        blank: { type: 'string', value: '' },
        no: { type: 'boolean', value: false },
      },
    };

    const json = serializeSdApiContract(contract);

    expect(json).toContain('"required": false');
    expect(json).toContain('"value": 0');
    expect(json).toContain('"value": null');
    expect(json).toContain('"value": ""');
    expect(json).toContain('"value": false');
    expect(json).toContain('"description": ""');
  });

  it('drops members that are not part of the contract vocabulary', () => {
    const contract = minimalContract();
    contract.input.schema = {
      type: 'object',
      properties: {
        a: { type: 'string', expanded: true, __uiId: 'node-3', selected: false } as never,
      },
      __draft: true,
    } as never;

    const json = serializeSdApiContract(contract);

    expect(json).not.toContain('expanded');
    expect(json).not.toContain('__uiId');
    expect(json).not.toContain('selected');
    expect(json).not.toContain('__draft');
    expect(json).toContain('"a"');
  });

  it('preserves the declared property order inside records', () => {
    const contract = minimalContract();
    contract.input.schema = {
      type: 'object',
      properties: {
        zebra: { type: 'string' },
        alpha: { type: 'string' },
        mid: { type: 'string' },
      },
    };
    contract.req.query = { z: { type: 'string' }, a: { type: 'string' } };

    const parsed = JSON.parse(serializeSdApiContract(contract)) as Record<string, Record<string, Record<string, object>>>;

    expect(Object.keys(parsed['input']['schema']['properties'])).toEqual(['zebra', 'alpha', 'mid']);
    expect(Object.keys(parsed['req']['query'])).toEqual(['z', 'a']);
  });

  it('keeps a single status a number and a multi status an array', () => {
    const single = minimalContract();
    const multi = minimalContract();
    multi.res = { status: [200, 204] };

    expect(JSON.parse(serializeSdApiContract(single))).toEqual(jasmine.objectContaining({ res: { status: 200 } }));
    expect(JSON.parse(serializeSdApiContract(multi))).toEqual(jasmine.objectContaining({ res: { status: [200, 204] } }));
  });

  it('never mutates the contract it is given', () => {
    const contract = minimalContract();
    contract.input.schema = { type: 'object', properties: { b: { type: 'string' }, a: { type: 'string' } } };
    const before = JSON.stringify(contract);

    serializeSdApiContract(contract);

    expect(JSON.stringify(contract)).toBe(before);
  });

  it('round-trips: re-serializing the parsed output is byte-identical', () => {
    const contract = minimalContract();
    contract.description = 'Search active products';
    contract.req = {
      method: 'GET',
      url: '${env.baseUrl}/products/{id}',
      path: { id: { type: 'string', required: true, source: '${input.id}' } },
      query: { page: { type: 'number', source: '${input.page}' } },
      headers: { Authorization: { type: 'string', source: 'Bearer ${env.token}' } },
    };
    contract.res = {
      status: 200,
      body: { type: 'object', properties: { items: { type: 'array', required: true, items: { type: 'string' } } } },
    };
    contract.output = { schema: { type: 'array', source: '${res.body.items}', items: { type: 'string' } } };

    const first = serializeSdApiContract(contract);
    const second = serializeSdApiContract(JSON.parse(first) as SdApiContract);

    expect(second).toBe(first);
  });

  it('serializes a nullish contract as null', () => {
    expect(serializeSdApiContract(null)).toBe('null');
    expect(serializeSdApiContract(undefined)).toBe('null');
  });

  it('emits nested arrays of objects with the item schema last', () => {
    const contract = minimalContract();
    contract.output = {
      schema: {
        type: 'array',
        source: '${res.body.items}',
        items: { type: 'object', properties: { id: { type: 'string', required: true } } },
      },
    };

    const parsed = JSON.parse(serializeSdApiContract(contract)) as Record<string, Record<string, object>>;

    expect(Object.keys(parsed['output']['schema'])).toEqual(['type', 'source', 'items']);
  });
});
