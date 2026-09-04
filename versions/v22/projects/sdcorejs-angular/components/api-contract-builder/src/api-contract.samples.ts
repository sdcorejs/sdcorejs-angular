import type { SdApiContractConfiguration } from './api-contract.configuration';
import type { SdApiContract } from './api-contract.model';

/**
 * Reference contracts, shared by the docs, the showcase and the test-suite so the canonical example
 * can never drift between them.
 *
 * Each is a **factory**, not a constant: the builder takes a two-way `[(model)]`, and handing two
 * demos the same object would let one seed the other.
 */

/** The env catalog the samples reference. Definitions only — no secret ever has a value here. */
export const SD_API_CONTRACT_SAMPLE_ENVIRONMENT: SdApiContractConfiguration = {
  env: {
    baseUrl: { type: 'string', label: 'Backend base URL' },
    token: { type: 'string', label: 'Access token', sensitive: true },
    userId: { type: 'string', label: 'Current user ID' },
  },
};

/** `GET` list endpoint whose output is a root array — the dropdown / table shape. */
export function sdApiContractSearchSample(): SdApiContract {
  return {
    contractVersion: 1,
    code: 'product.search',
    name: 'Search products',
    description: 'Search active products for dropdown or table',
    input: {
      schema: {
        type: 'object',
        properties: {
          keyword: { type: 'string', required: false },
          page: { type: 'number' },
          createdFrom: { type: 'datetime', transform: 'ISOString' },
        },
      },
    },
    req: {
      method: 'GET',
      url: '${env.baseUrl}/products',
      query: {
        keyword: { type: 'string', source: '${input.keyword}' },
        page: { type: 'number', source: '${input.page}' },
        createdFrom: { type: 'datetime', source: '${input.createdFrom}' },
      },
      headers: {
        Authorization: { type: 'string', source: 'Bearer ${env.token}' },
        'x-user-id': { type: 'string', source: '${env.userId}' },
      },
    },
    res: {
      status: 200,
      headers: { 'x-request-id': { type: 'string', required: false } },
      body: {
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
      },
    },
    output: {
      schema: {
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
      },
    },
  };
}

/**
 * `POST` endpoint showing every mapping flavour at once:
 * `input.a → req.body.x`, `input.b → req.body.y`, `input.c → req.body.z`,
 * `env.userId → req.body.u`, and a static literal in `req.body.v`.
 */
export function sdApiContractCreateSample(): SdApiContract {
  return {
    contractVersion: 1,
    code: 'order.create',
    name: 'Create order',
    description: 'Maps a frontend payload onto the backend order body',
    input: {
      schema: {
        type: 'object',
        properties: {
          a: { type: 'string', required: true, label: 'Order code' },
          b: { type: 'number', label: 'Quantity' },
          c: { type: 'array', items: { type: 'string' }, label: 'Tags' },
        },
      },
    },
    req: {
      method: 'POST',
      url: '${env.baseUrl}/orders',
      headers: { Authorization: { type: 'string', source: 'Bearer ${env.token}' } },
      body: {
        type: 'object',
        properties: {
          x: { type: 'string', required: true, source: '${input.a}' },
          y: { type: 'number', source: '${input.b}' },
          z: { type: 'array', source: '${input.c}', items: { type: 'string' } },
          u: { type: 'string', source: '${env.userId}' },
          v: { type: 'string', value: 'STATIC VALUE' },
        },
      },
    },
    res: {
      status: [200, 201],
      body: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true },
          createdAt: { type: 'datetime' },
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true, source: '${res.body.id}' },
          createdAt: { type: 'datetime', source: '${res.body.createdAt}' },
        },
      },
    },
  };
}

/**
 * Deliberately broken contract used to demonstrate the diagnostics: an undeclared env variable, a
 * `{id}` placeholder with no `req.path` entry, a `${input.page}` that does not exist, and an output
 * source pointing at a scalar while the output declares an array.
 */
export function sdApiContractInvalidSample(): SdApiContract {
  return {
    contractVersion: 1,
    code: 'product.broken',
    name: 'Broken product search',
    description: 'Every diagnostic class in one contract',
    input: {
      schema: {
        type: 'object',
        properties: { keyword: { type: 'string' } },
      },
    },
    req: {
      method: 'GET',
      url: '${env.baseUrl}/products/{id}',
      query: { page: { type: 'number', source: '${input.page}' } },
      headers: { Authorization: { type: 'string', source: 'Bearer ${env.unknown}' } },
    },
    res: {
      status: 200,
      body: {
        type: 'object',
        properties: {
          items: { type: 'array', required: true, items: { type: 'object', properties: { id: { type: 'string' } } } },
          total: { type: 'number' },
        },
      },
    },
    output: {
      schema: {
        type: 'array',
        source: '${res.body.total}',
        items: { type: 'object', properties: { id: { type: 'string' } } },
      },
    },
  };
}
