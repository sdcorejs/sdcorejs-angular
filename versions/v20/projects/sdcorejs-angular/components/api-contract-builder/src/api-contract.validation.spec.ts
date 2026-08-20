import type { SdApiContractConfiguration } from './api-contract.configuration';
import type { SdApiContract, SdApiContractDiagnostic } from './api-contract.model';
import {
  sdApiContractCreateSample,
  sdApiContractInvalidSample,
  sdApiContractSearchSample,
  SD_API_CONTRACT_SAMPLE_ENVIRONMENT,
} from './api-contract.samples';
import { validateSdApiContract } from './api-contract.validation';

const CONFIGURATION: SdApiContractConfiguration = {
  env: {
    baseUrl: { type: 'string', label: 'Base URL' },
    token: { type: 'string', sensitive: true },
    userId: { type: 'string' },
    retries: { type: 'number' },
  },
};

function base(): SdApiContract {
  return {
    contractVersion: 1,
    code: 'c',
    name: 'n',
    input: {
      schema: {
        type: 'object',
        properties: {
          a: { type: 'string' },
          n: { type: 'number' },
          arr: { type: 'array', items: { type: 'string' } },
          obj: { type: 'object', properties: { id: { type: 'string' } } },
        },
      },
    },
    req: { method: 'GET', url: '/x' },
    res: {
      status: 200,
      body: {
        type: 'object',
        properties: {
          total: { type: 'number', required: true },
          opt: { type: 'string' },
          items: {
            type: 'array',
            required: true,
            items: { type: 'object', properties: { id: { type: 'string', required: true } } },
          },
        },
      },
    },
    output: { schema: { type: 'number', source: '${res.body.total}' } },
  };
}

function codes(diagnostics: readonly SdApiContractDiagnostic[]): string[] {
  return diagnostics.map(diagnostic => diagnostic.code);
}

function run(
  contract: SdApiContract,
  configuration: SdApiContractConfiguration | undefined = CONFIGURATION
): readonly SdApiContractDiagnostic[] {
  return validateSdApiContract(contract, configuration);
}

describe('api-contract.validation', () => {
  it('reports nothing for the baseline contract', () => {
    expect(run(base())).toEqual([]);
  });

  describe('contract metadata', () => {
    it('rejects a non-object contract', () => {
      expect(codes(validateSdApiContract(null))).toEqual(['contract.invalid']);
      expect(codes(validateSdApiContract('nope'))).toEqual(['contract.invalid']);
    });

    it('rejects a contractVersion other than 1', () => {
      const contract = { ...base(), contractVersion: 2 } as unknown as SdApiContract;

      expect(codes(run(contract))).toContain('contract.version.invalid');
    });

    it('rejects an empty code and an empty name', () => {
      const contract = { ...base(), code: '   ', name: '' };

      expect(codes(run(contract))).toContain('contract.code.empty');
      expect(codes(run(contract))).toContain('contract.name.empty');
    });
  });

  describe('schema structure', () => {
    it('rejects an unknown type', () => {
      const contract = base();
      contract.input.schema = { type: 'integer' } as never;

      expect(codes(run(contract))).toContain('schema.type.invalid');
    });

    it('requires properties on an object and items on an array', () => {
      const missingProperties = base();
      missingProperties.input.schema = { type: 'object' } as never;
      const missingItems = base();
      missingItems.input.schema = { type: 'array' } as never;

      expect(codes(run(missingProperties))).toContain('schema.object.properties.missing');
      expect(codes(run(missingItems))).toContain('schema.array.items.missing');
    });

    it('rejects properties or items on a scalar', () => {
      const withProperties = base();
      withProperties.input.schema = { type: 'string', properties: {} } as never;
      const withItems = base();
      withItems.input.schema = { type: 'number', items: { type: 'string' } } as never;

      expect(codes(run(withProperties))).toContain('schema.scalar.properties.forbidden');
      expect(codes(run(withItems))).toContain('schema.scalar.items.forbidden');
    });

    it('rejects an empty property key', () => {
      const contract = base();
      contract.input.schema = { type: 'object', properties: { '': { type: 'string' } } };

      expect(codes(run(contract))).toContain('schema.property.key.empty');
    });

    it('rejects a non-boolean required', () => {
      const contract = base();
      contract.input.schema = { type: 'object', properties: { a: { type: 'string', required: 'yes' as never } } };

      expect(codes(run(contract))).toContain('schema.required.invalid');
    });

    it('accepts the three required states', () => {
      const contract = base();
      contract.input.schema = {
        type: 'object',
        properties: {
          undeclared: { type: 'string' },
          optional: { type: 'string', required: false },
          mandatory: { type: 'string', required: true },
        },
      };

      expect(run(contract)).toEqual([]);
    });

    it('allows a temporal transform only on date and datetime', () => {
      const good = base();
      good.input.schema = { type: 'object', properties: { d: { type: 'date', transform: 'ISOString' } } };
      const bad = base();
      bad.input.schema = { type: 'object', properties: { s: { type: 'string', transform: 'ISOString' } as never } };
      const unknown = base();
      unknown.input.schema = { type: 'object', properties: { d: { type: 'datetime', transform: 'Epoch' as never } } };

      expect(run(good)).toEqual([]);
      expect(codes(run(bad))).toContain('schema.transform.invalid');
      expect(codes(run(unknown))).toContain('schema.transform.unknown');
    });

    it('rejects a mapping inside a declaration layer', () => {
      const inInput = base();
      inInput.input.schema = { type: 'object', properties: { a: { type: 'string', source: '${env.token}' } as never } };
      const inResponse = base();
      inResponse.res.body = { type: 'object', properties: { total: { type: 'number', value: 1 } as never } };

      expect(codes(run(inInput))).toContain('schema.mapping.forbidden');
      expect(codes(run(inResponse))).toContain('schema.mapping.forbidden');
    });
  });

  describe('mapping', () => {
    it('rejects source and value at the same time', () => {
      const contract = base();
      contract.req.query = { q: { type: 'string', source: '${input.a}', value: 'x' } };

      expect(codes(run(contract))).toContain('mapping.source-and-value');
    });

    it('reports a malformed template once', () => {
      const contract = base();
      contract.req.query = { q: { type: 'string', source: '${input.}' } };

      expect(codes(run(contract))).toEqual(['mapping.template.invalid']);
    });

    it('rejects a root that is not allowed in this context', () => {
      const contract = base();
      contract.req.query = { q: { type: 'string', source: '${res.body.opt}' } };

      expect(codes(run(contract))).toContain('mapping.root.forbidden');
    });

    it('allows res, input and env in the output layer', () => {
      const contract = base();
      contract.output.schema = {
        type: 'object',
        properties: {
          fromRes: { type: 'number', source: '${res.body.total}' },
          fromInput: { type: 'string', source: '${input.a}' },
          fromEnv: { type: 'string', source: '${env.userId}' },
        },
      };

      expect(run(contract)).toEqual([]);
    });

    it('rejects a reference to a path that does not exist', () => {
      const missingInput = base();
      missingInput.req.query = { q: { type: 'string', source: '${input.nope}' } };
      const missingResponse = base();
      missingResponse.output.schema = { type: 'string', source: '${res.body.nope}' };

      expect(codes(run(missingInput))).toContain('mapping.reference.missing');
      expect(codes(run(missingResponse))).toContain('mapping.reference.missing');
    });

    it('accepts an existing nested input path and an existing response path', () => {
      const contract = base();
      contract.req.query = { q: { type: 'string', source: '${input.obj.id}' } };
      contract.output.schema = { type: 'number', source: '${res.status}' };

      expect(run(contract)).toEqual([]);
    });

    it('rejects an unknown env variable and accepts a declared one', () => {
      const unknown = base();
      unknown.req.query = { q: { type: 'string', source: '${env.tokn}' } };
      const known = base();
      known.req.query = { q: { type: 'string', source: '${env.token}' } };

      expect(codes(run(unknown))).toContain('mapping.env.unknown');
      expect(run(known)).toEqual([]);
    });

    it('treats every env reference as unknown when no configuration is provided', () => {
      const contract = base();
      contract.req.query = { q: { type: 'string', source: '${env.token}' } };

      expect(codes(validateSdApiContract(contract))).toContain('mapping.env.unknown');
    });

    it('keeps the source type on an exact expression', () => {
      const numberToNumber = base();
      numberToNumber.req.query = { q: { type: 'number', source: '${input.n}' } };
      const arrayToArray = base();
      arrayToArray.req.body = { type: 'array', source: '${input.arr}', items: { type: 'string' } };
      arrayToArray.req.method = 'POST';

      expect(run(numberToNumber)).toEqual([]);
      expect(run(arrayToArray)).toEqual([]);
    });

    it('rejects an exact expression whose type does not fit the target', () => {
      const stringToNumber = base();
      stringToNumber.req.query = { q: { type: 'number', source: '${input.a}' } };
      const arrayToScalar = base();
      arrayToScalar.req.query = { q: { type: 'string', source: '${input.arr}' } };

      expect(codes(run(stringToNumber))).toContain('mapping.type.mismatch');
      expect(codes(run(arrayToScalar))).toContain('mapping.type.mismatch');
    });

    it('lets a temporal source feed a string target', () => {
      const contract = base();
      contract.input.schema = { type: 'object', properties: { when: { type: 'datetime' } } };
      contract.req.query = { q: { type: 'string', source: '${input.when}' } };

      expect(run(contract)).toEqual([]);
    });

    it('allows an interpolated expression only for a string target', () => {
      const intoString = base();
      intoString.req.headers = { Authorization: { type: 'string', source: 'Bearer ${env.token}' } };
      const intoNumber = base();
      intoNumber.req.query = { q: { type: 'number', source: 'page-${input.n}' } };

      expect(run(intoString)).toEqual([]);
      expect(codes(run(intoNumber))).toContain('mapping.interpolation.forbidden');
    });

    it('checks a static literal against the declared type', () => {
      const good = base();
      good.req.query = { a: { type: 'string', value: 'x' }, b: { type: 'number', value: 0 }, c: { type: 'boolean', value: false } };
      const bad = base();
      bad.req.query = { a: { type: 'number', value: 'x' } };

      expect(run(good)).toEqual([]);
      expect(codes(run(bad))).toContain('mapping.value.type-mismatch');
    });

    it('rejects a whole-object mapping that also declares child mappings', () => {
      const contract = base();
      contract.req.method = 'POST';
      contract.req.body = { type: 'object', source: '${input.obj}', properties: { id: { type: 'string', source: '${input.a}' } } };

      expect(codes(run(contract))).toContain('mapping.object.conflict');
    });

    it('accepts a whole-array mapping and treats its item schema as a declaration', () => {
      const contract = base();
      contract.output.schema = {
        type: 'array',
        source: '${res.body.items}',
        items: { type: 'object', properties: { id: { type: 'string', required: true } } },
      };

      expect(run(contract)).toEqual([]);
    });

    it('warns about a mapped leaf that receives no value', () => {
      const contract = base();
      contract.req.query = { q: { type: 'string' } };

      const diagnostics = run(contract);
      expect(codes(diagnostics)).toEqual(['mapping.node.unmapped']);
      expect(diagnostics[0].severity).toBe('warning');
    });

    it('warns when a required output field is fed by an optional response field', () => {
      const contract = base();
      contract.output.schema = { type: 'object', properties: { o: { type: 'string', required: true, source: '${res.body.opt}' } } };

      const diagnostics = run(contract);
      expect(codes(diagnostics)).toEqual(['mapping.required.optional-source']);
      expect(diagnostics[0].severity).toBe('warning');
    });
  });

  describe('REST request', () => {
    it('rejects an invalid method and accepts every declared one', () => {
      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const) {
        const contract = base();
        contract.req.method = method;
        expect(codes(run(contract))).not.toContain('req.method.invalid');
      }

      const invalid = base();
      invalid.req.method = 'FETCH' as never;
      expect(codes(run(invalid))).toContain('req.method.invalid');
    });

    it('rejects an empty url', () => {
      const contract = base();
      contract.req.url = '  ';

      expect(codes(run(contract))).toContain('req.url.empty');
    });

    it('accepts ${env.baseUrl} in the url and rejects an unknown env variable there', () => {
      const good = base();
      good.req.url = '${env.baseUrl}/products';
      const bad = base();
      bad.req.url = '${env.nope}/products';

      expect(run(good)).toEqual([]);
      expect(codes(run(bad))).toContain('mapping.env.unknown');
    });

    it('accepts a static url', () => {
      const contract = base();
      contract.req.url = 'https://api.example.com/products';

      expect(run(contract)).toEqual([]);
    });

    it('matches {id} against req.path', () => {
      const contract = base();
      contract.req.url = '${env.baseUrl}/products/{id}';
      contract.req.path = { id: { type: 'string', required: true, source: '${input.a}' } };

      expect(run(contract)).toEqual([]);
    });

    it('reports a placeholder with no declaration and a declaration with no placeholder', () => {
      const missing = base();
      missing.req.url = '/products/{id}';
      const unused = base();
      unused.req.path = { id: { type: 'string', required: true, source: '${input.a}' } };

      expect(codes(run(missing))).toContain('req.path.missing');
      expect(codes(run(unused))).toContain('req.path.unused');
    });

    it('requires a path parameter to be required', () => {
      const contract = base();
      contract.req.url = '/products/{id}';
      contract.req.path = { id: { type: 'string', source: '${input.a}' } };

      expect(codes(run(contract))).toContain('req.path.required');
    });

    it('reports malformed and duplicated placeholders', () => {
      const malformed = base();
      malformed.req.url = '/products/{}';
      const duplicated = base();
      duplicated.req.url = '/products/{id}/x/{id}';
      duplicated.req.path = { id: { type: 'string', required: true, source: '${input.a}' } };

      expect(codes(run(malformed))).toContain('req.url.placeholder.malformed');
      expect(codes(run(duplicated))).toContain('req.url.placeholder.duplicate');
    });

    it('constrains the type per REST location', () => {
      const objectInPath = base();
      objectInPath.req.url = '/products/{id}';
      objectInPath.req.path = { id: { type: 'object', required: true, properties: {} } as never };
      const objectInHeader = base();
      objectInHeader.req.headers = { h: { type: 'object', properties: {} } as never };
      const objectInQuery = base();
      objectInQuery.req.query = { q: { type: 'object', properties: {} } as never };
      const arrayInQuery = base();
      arrayInQuery.req.query = { q: { type: 'array', source: '${input.arr}', items: { type: 'string' } } };

      expect(codes(run(objectInPath))).toContain('req.path.type.invalid');
      expect(codes(run(objectInHeader))).toContain('req.header.type.invalid');
      expect(codes(run(objectInQuery))).toContain('req.query.type.invalid');
      expect(codes(run(arrayInQuery))).not.toContain('req.query.type.invalid');
    });

    it('rejects an empty header name and reports case-insensitive duplicates', () => {
      const empty = base();
      empty.req.headers = { '  ': { type: 'string', value: 'x' } };
      const duplicated = base();
      duplicated.req.headers = { Authorization: { type: 'string', value: 'a' }, authorization: { type: 'string', value: 'b' } };

      expect(codes(run(empty))).toContain('req.header.name.empty');
      expect(codes(run(duplicated))).toContain('schema.property.key.duplicate');
    });

    it('warns about a body on GET and HEAD', () => {
      for (const method of ['GET', 'HEAD'] as const) {
        const contract = base();
        contract.req.method = method;
        contract.req.body = { type: 'string', value: 'x' };

        const warning = run(contract).find(diagnostic => diagnostic.code === 'req.body.unexpected');
        expect(warning?.severity).toBe('warning');
      }
    });

    it('accepts a body on DELETE', () => {
      const contract = base();
      contract.req.method = 'DELETE';
      contract.req.body = { type: 'string', value: 'x' };

      expect(codes(run(contract))).not.toContain('req.body.unexpected');
    });
  });

  describe('REST response', () => {
    it('accepts a single status and a list of statuses', () => {
      const single = base();
      const many = base();
      many.res.status = [200, 201];

      expect(run(single)).toEqual([]);
      expect(run(many)).toEqual([]);
    });

    it('rejects a status outside 100..599 and a non-integer status', () => {
      const low = base();
      low.res.status = 99;
      const high = base();
      high.res.status = 600;
      const fractional = base();
      fractional.res.status = 200.5;

      expect(codes(run(low))).toContain('res.status.invalid');
      expect(codes(run(high))).toContain('res.status.invalid');
      expect(codes(run(fractional))).toContain('res.status.invalid');
    });

    it('rejects an empty status list and duplicated statuses', () => {
      const empty = base();
      empty.res.status = [];
      const duplicated = base();
      duplicated.res.status = [200, 200];

      expect(codes(run(empty))).toContain('res.status.empty');
      expect(codes(run(duplicated))).toContain('res.status.duplicate');
    });

    it('warns about a body declared for 204', () => {
      const contract = base();
      contract.res.status = 204;
      contract.output.schema = { type: 'number', source: '${res.status}' };

      const warning = run(contract).find(diagnostic => diagnostic.code === 'res.body.unexpected');
      expect(warning?.severity).toBe('warning');
    });
  });

  describe('output', () => {
    it('rejects an output array whose source is not an array', () => {
      const contract = base();
      contract.output.schema = { type: 'array', source: '${res.body.total}', items: { type: 'string' } };

      expect(codes(run(contract))).toContain('mapping.type.mismatch');
    });

    it('rejects an output object whose source is not an object', () => {
      const contract = base();
      contract.output.schema = { type: 'object', source: '${res.body.total}' };

      expect(codes(run(contract))).toContain('mapping.type.mismatch');
    });
  });

  describe('diagnostics contract', () => {
    it('emits machine-readable structural paths', () => {
      const contract = base();
      contract.req.method = 'POST';
      contract.req.body = { type: 'object', properties: { x: { type: 'number', source: '${input.a}' } } };

      expect(run(contract)[0].path).toBe('req.body.properties.x');
    });

    it('orders diagnostics by contract section, deterministically', () => {
      const contract = base();
      contract.code = '';
      contract.input.schema = { type: 'object', properties: { a: { type: 'string', source: '${env.token}' } as never } };
      contract.req.url = '';
      contract.res.status = 99;
      contract.output.schema = { type: 'string', source: '${res.body.nope}' };

      expect(codes(run(contract))).toEqual([
        'contract.code.empty',
        'schema.mapping.forbidden',
        'req.url.empty',
        'res.status.invalid',
        'mapping.reference.missing',
      ]);
    });

    it('returns the same result for the same input', () => {
      expect(run(sdApiContractInvalidSample())).toEqual(run(sdApiContractInvalidSample()));
    });

    it('never mutates the contract it validates', () => {
      const contract = sdApiContractSearchSample();
      const before = JSON.stringify(contract);

      run(contract, SD_API_CONTRACT_SAMPLE_ENVIRONMENT);

      expect(JSON.stringify(contract)).toBe(before);
    });
  });

  describe('samples', () => {
    it('accepts the GET search sample', () => {
      expect(validateSdApiContract(sdApiContractSearchSample(), SD_API_CONTRACT_SAMPLE_ENVIRONMENT)).toEqual([]);
    });

    it('accepts the POST create sample', () => {
      expect(validateSdApiContract(sdApiContractCreateSample(), SD_API_CONTRACT_SAMPLE_ENVIRONMENT)).toEqual([]);
    });

    it('reports the planted problems in the invalid sample', () => {
      const reported = codes(validateSdApiContract(sdApiContractInvalidSample(), SD_API_CONTRACT_SAMPLE_ENVIRONMENT));

      expect(reported).toContain('req.path.missing');
      expect(reported).toContain('mapping.reference.missing');
      expect(reported).toContain('mapping.env.unknown');
      expect(reported).toContain('mapping.type.mismatch');
    });
  });
});
