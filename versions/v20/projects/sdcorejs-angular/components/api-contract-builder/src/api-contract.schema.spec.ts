import type {
  SdApiContractFeSchemaNode,
  SdApiContractMappedFeSchemaNode,
  SdApiContractResponse,
  SdApiContractRestNode,
} from './api-contract.model';
import {
  addSdApiContractProperty,
  changeSdApiContractNodeType,
  cloneSdApiContract,
  cloneSdApiContractNode,
  createSdApiContractNode,
  formatSdApiContractExpression,
  formatSdApiContractPointer,
  getSdApiContractNodeAt,
  listSdApiContractResponseFields,
  listSdApiContractSchemaFields,
  parseSdApiContractUrlPlaceholders,
  removeSdApiContractProperty,
  renameSdApiContractProperty,
  resolveSdApiContractResponsePath,
  resolveSdApiContractSchemaPath,
  type SdApiContractStructuralNode,
  sdApiContractRecordRemove,
  sdApiContractRecordRename,
  sdApiContractRecordSet,
  setSdApiContractNodeAt,
} from './api-contract.schema';

const INPUT_SCHEMA: SdApiContractFeSchemaNode = {
  type: 'object',
  properties: {
    keyword: { type: 'string', required: false },
    page: { type: 'number' },
    customer: {
      type: 'object',
      required: true,
      properties: {
        id: { type: 'string', required: true, label: 'Customer id' },
        createdAt: { type: 'datetime', transform: 'ISOString' },
      },
    },
    tags: { type: 'array', items: { type: 'string' } },
  },
};

const RESPONSE_BODY: SdApiContractRestNode = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          createdAt: { type: 'datetime' },
        },
      },
    },
    total: { type: 'number', required: true },
  },
};

const RESPONSE: SdApiContractResponse = {
  status: 200,
  headers: { 'x-request-id': { type: 'string', required: false } },
  body: RESPONSE_BODY,
};

describe('api-contract.schema', () => {
  describe('listSdApiContractSchemaFields', () => {
    it('lists nested object paths', () => {
      const fields = listSdApiContractSchemaFields(INPUT_SCHEMA);

      expect(fields.map(field => field.path)).toEqual(['keyword', 'page', 'customer', 'customer.id', 'customer.createdAt', 'tags']);
    });

    it('carries type / required / label metadata', () => {
      const fields = listSdApiContractSchemaFields(INPUT_SCHEMA);
      const customerId = fields.find(field => field.path === 'customer.id');

      expect(customerId?.type).toBe('string');
      expect(customerId?.required).toBeTrue();
      expect(customerId?.label).toBe('Customer id');
      expect(fields.find(field => field.path === 'keyword')?.required).toBeFalse();
      expect(fields.find(field => field.path === 'page')?.required).toBeUndefined();
    });

    it('flattens a root array into its item fields', () => {
      const outputSchema: SdApiContractMappedFeSchemaNode = {
        type: 'array',
        source: '${res.body.items}',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true },
            createdAt: { type: 'datetime' },
          },
        },
      };

      expect(listSdApiContractSchemaFields(outputSchema).map(field => ({ path: field.path, type: field.type }))).toEqual([
        { path: 'id', type: 'string' },
        { path: 'name', type: 'string' },
        { path: 'createdAt', type: 'datetime' },
      ]);
    });

    it('marks fields reached through an array', () => {
      const fields = listSdApiContractSchemaFields(RESPONSE_BODY);

      expect(fields.find(field => field.path === 'items')?.arrayItem).toBeFalse();
      expect(fields.find(field => field.path === 'items.id')?.arrayItem).toBeTrue();
    });

    it('flattens nested arrays under the array path', () => {
      expect(listSdApiContractSchemaFields(RESPONSE_BODY).map(field => field.path)).toEqual([
        'items',
        'items.id',
        'items.name',
        'items.createdAt',
        'total',
      ]);
    });

    it('stops at arrays when asked, so the list matches what ${…} can address', () => {
      expect(listSdApiContractSchemaFields(RESPONSE_BODY, { arrays: 'stop' }).map(field => field.path)).toEqual(['items', 'total']);
      expect(listSdApiContractSchemaFields(RESPONSE_BODY, { arrays: 'stop' }).find(field => field.path === 'items')?.leaf).toBeTrue();
    });

    it('prefixes with basePath', () => {
      expect(listSdApiContractSchemaFields(RESPONSE_BODY, { arrays: 'stop', basePath: 'body' }).map(field => field.path)).toEqual([
        'body.items',
        'body.total',
      ]);
    });

    it('returns an empty list for a scalar root', () => {
      expect(listSdApiContractSchemaFields({ type: 'string' }).length).toBe(0);
    });
  });

  describe('resolveSdApiContractSchemaPath', () => {
    it('resolves a top-level property', () => {
      expect(resolveSdApiContractSchemaPath(INPUT_SCHEMA, ['keyword'])?.type).toBe('string');
    });

    it('resolves a nested property', () => {
      expect(resolveSdApiContractSchemaPath(INPUT_SCHEMA, ['customer', 'id'])?.type).toBe('string');
    });

    it('returns null for a missing property', () => {
      expect(resolveSdApiContractSchemaPath(INPUT_SCHEMA, ['nope'])).toBeNull();
      expect(resolveSdApiContractSchemaPath(INPUT_SCHEMA, ['customer', 'nope'])).toBeNull();
    });

    it('treats an array as terminal — an element is not addressable', () => {
      expect(resolveSdApiContractSchemaPath(RESPONSE_BODY, ['items'])?.type).toBe('array');
      expect(resolveSdApiContractSchemaPath(RESPONSE_BODY, ['items', 'id'])).toBeNull();
    });

    it('never walks into inherited members', () => {
      expect(resolveSdApiContractSchemaPath(INPUT_SCHEMA, ['constructor'])).toBeNull();
      expect(resolveSdApiContractSchemaPath(INPUT_SCHEMA, ['__proto__'])).toBeNull();
      expect(resolveSdApiContractSchemaPath(INPUT_SCHEMA, ['toString'])).toBeNull();
    });

    it('returns the root itself for an empty path', () => {
      expect(resolveSdApiContractSchemaPath(INPUT_SCHEMA, [])).toBe(INPUT_SCHEMA);
    });
  });

  describe('resolveSdApiContractResponsePath', () => {
    it('resolves res.status as a number', () => {
      expect(resolveSdApiContractResponsePath(RESPONSE, ['status'])?.type).toBe('number');
    });

    it('resolves a response header', () => {
      const resolved = resolveSdApiContractResponsePath(RESPONSE, ['headers', 'x-request-id']);

      expect(resolved?.type).toBe('string');
      expect(resolved?.required).toBeFalse();
    });

    it('resolves a body path', () => {
      expect(resolveSdApiContractResponsePath(RESPONSE, ['body', 'items'])?.type).toBe('array');
      expect(resolveSdApiContractResponsePath(RESPONSE, ['body', 'total'])?.required).toBeTrue();
    });

    it('rejects implementation-detail paths', () => {
      expect(resolveSdApiContractResponsePath(RESPONSE, ['body', 'properties', 'items'])).toBeNull();
    });

    it('returns null for unknown sections and missing paths', () => {
      expect(resolveSdApiContractResponsePath(RESPONSE, ['cookies'])).toBeNull();
      expect(resolveSdApiContractResponsePath(RESPONSE, ['headers', 'nope'])).toBeNull();
      expect(resolveSdApiContractResponsePath(RESPONSE, ['body', 'nope'])).toBeNull();
      expect(resolveSdApiContractResponsePath(RESPONSE, [])).toBeNull();
    });
  });

  describe('listSdApiContractResponseFields', () => {
    it('lists status, headers and body paths addressable from the output', () => {
      expect(listSdApiContractResponseFields(RESPONSE).map(field => field.path)).toEqual([
        'status',
        'headers.x-request-id',
        'body',
        'body.items',
        'body.total',
      ]);
    });

    it('survives a response with no headers and no body', () => {
      expect(listSdApiContractResponseFields({ status: 204 }).map(field => field.path)).toEqual(['status']);
    });
  });

  describe('immutable node editing', () => {
    it('reads a node at a structural pointer', () => {
      expect(getSdApiContractNodeAt(INPUT_SCHEMA, ['properties', 'customer', 'properties', 'id'])?.type).toBe('string');
      expect(getSdApiContractNodeAt(RESPONSE_BODY, ['properties', 'items', 'items'])?.type).toBe('object');
      expect(getSdApiContractNodeAt(INPUT_SCHEMA, ['properties', 'nope'])).toBeNull();
    });

    it('replaces a node at a pointer without mutating the source', () => {
      const next = setSdApiContractNodeAt(INPUT_SCHEMA, ['properties', 'page'], { type: 'string' });

      expect(getSdApiContractNodeAt(next, ['properties', 'page'])?.type).toBe('string');
      expect(getSdApiContractNodeAt(INPUT_SCHEMA, ['properties', 'page'])?.type).toBe('number');
      expect(next).not.toBe(INPUT_SCHEMA);
    });

    it('replaces the root for an empty pointer', () => {
      expect(setSdApiContractNodeAt<SdApiContractStructuralNode>(INPUT_SCHEMA, [], { type: 'boolean' })).toEqual({ type: 'boolean' });
    });

    it('adds, renames and removes properties while preserving declaration order', () => {
      const base = createSdApiContractNode('object');
      const withA = addSdApiContractProperty(base, 'a', { type: 'string' });
      const withB = addSdApiContractProperty(withA, 'b', { type: 'number' });
      const withC = addSdApiContractProperty(withB, 'c', { type: 'boolean' });

      expect(Object.keys(renameSdApiContractProperty(withC, 'b', 'bb').properties)).toEqual(['a', 'bb', 'c']);
      expect(Object.keys(removeSdApiContractProperty(withC, 'b').properties)).toEqual(['a', 'c']);
      expect(Object.keys(withC.properties)).toEqual(['a', 'b', 'c']);
    });

    it('refuses to rename onto an existing sibling key', () => {
      const node = addSdApiContractProperty(addSdApiContractProperty(createSdApiContractNode('object'), 'a', { type: 'string' }), 'b', {
        type: 'string',
      });

      expect(renameSdApiContractProperty(node, 'a', 'b')).toBe(node);
    });

    it('creates well-formed default nodes per type', () => {
      expect(createSdApiContractNode('string')).toEqual({ type: 'string' });
      expect(createSdApiContractNode('object')).toEqual({ type: 'object', properties: {} });
      expect(createSdApiContractNode('array')).toEqual({ type: 'array', items: { type: 'string' } });
    });

    it('drops now-invalid members when the node type changes', () => {
      const object = { type: 'object' as const, required: true, label: 'X', properties: { a: { type: 'string' as const } } };

      expect(changeSdApiContractNodeType(object, 'string')).toEqual({ type: 'string', required: true, label: 'X' });
      expect(changeSdApiContractNodeType(object, 'array')).toEqual({
        type: 'array',
        required: true,
        label: 'X',
        items: { type: 'string' },
      });
      expect(changeSdApiContractNodeType({ type: 'datetime', transform: 'ISOString' }, 'string')).toEqual({ type: 'string' });
      expect(changeSdApiContractNodeType({ type: 'object', properties: {} }, 'object')).toEqual({ type: 'object', properties: {} });
    });

    it('keeps the existing subtree when an object stays an object', () => {
      const object = { type: 'object' as const, properties: { a: { type: 'string' as const } } };

      expect(changeSdApiContractNodeType(object, 'object')).toBe(object);
    });

    it('deep-clones a whole contract', () => {
      const contract = { input: { schema: INPUT_SCHEMA }, list: [1, 2] };
      const clone = cloneSdApiContract(contract);

      expect(clone).toEqual(contract);
      expect(clone.input).not.toBe(contract.input);
      expect(clone.list).not.toBe(contract.list);
    });

    it('deep-clones a node so the copy shares no reference with the source', () => {
      const clone = cloneSdApiContractNode(RESPONSE_BODY);

      expect(clone).toEqual(RESPONSE_BODY);
      expect(clone).not.toBe(RESPONSE_BODY);
      expect((clone as { properties: Record<string, unknown> }).properties['items']).not.toBe(
        (RESPONSE_BODY as { properties: Record<string, unknown> }).properties['items']
      );
    });
  });

  describe('record helpers', () => {
    it('sets, removes and renames record entries immutably', () => {
      const base = sdApiContractRecordSet<SdApiContractStructuralNode>(undefined, 'a', { type: 'string' });
      const two = sdApiContractRecordSet<SdApiContractStructuralNode>(base, 'b', { type: 'number' });

      expect(Object.keys(sdApiContractRecordRename(two, 'a', 'z'))).toEqual(['z', 'b']);
      expect(Object.keys(sdApiContractRecordRemove(two, 'a'))).toEqual(['b']);
      expect(Object.keys(two)).toEqual(['a', 'b']);
    });

    it('refuses a rename that would collide with an existing key', () => {
      const one = sdApiContractRecordSet<SdApiContractStructuralNode>(undefined, 'a', { type: 'string' });
      const two = sdApiContractRecordSet<SdApiContractStructuralNode>(one, 'b', { type: 'string' });

      expect(sdApiContractRecordRename(two, 'a', 'b')).toBe(two);
    });
  });

  describe('formatting helpers', () => {
    it('formats an expression', () => {
      expect(formatSdApiContractExpression('input', ['customer', 'id'])).toBe('${input.customer.id}');
      expect(formatSdApiContractExpression('env', ['token'])).toBe('${env.token}');
    });

    it('formats a diagnostic pointer', () => {
      expect(formatSdApiContractPointer('input.schema', ['properties', 'customer', 'properties', 'id'])).toBe(
        'input.schema.properties.customer.properties.id'
      );
      expect(formatSdApiContractPointer('req.body', [])).toBe('req.body');
    });
  });

  describe('parseSdApiContractUrlPlaceholders', () => {
    it('reads REST placeholders', () => {
      expect(parseSdApiContractUrlPlaceholders('/products/{id}/reviews/{reviewId}').names).toEqual(['id', 'reviewId']);
    });

    it('ignores ${env.*} interpolation', () => {
      const parsed = parseSdApiContractUrlPlaceholders('${env.baseUrl}/products/{id}');

      expect(parsed.names).toEqual(['id']);
      expect(parsed.malformed.length).toBe(0);
    });

    it('reports duplicates', () => {
      expect(parseSdApiContractUrlPlaceholders('/a/{id}/b/{id}').duplicates).toEqual(['id']);
      expect(parseSdApiContractUrlPlaceholders('/a/{id}/b/{id}').names).toEqual(['id']);
    });

    it('reports malformed placeholders', () => {
      expect(parseSdApiContractUrlPlaceholders('/a/{}').malformed).toEqual(['{}']);
      expect(parseSdApiContractUrlPlaceholders('/a/{first name}').malformed).toEqual(['{first name}']);
      expect(parseSdApiContractUrlPlaceholders('/a/{id').malformed).toEqual(['{id']);
    });
  });
});
