import { extractSdApiContractReferences, parseSdApiContractTemplate } from './api-contract.expression';

describe('api-contract.expression', () => {
  describe('exact expressions', () => {
    it('parses ${input.a} as a single exact reference', () => {
      const template = parseSdApiContractTemplate('${input.a}');

      expect(template.kind).toBe('exact');
      expect(template.valid).toBeTrue();
      expect(template.references.length).toBe(1);
      expect(template.references[0].root).toBe('input');
      expect(template.references[0].path).toEqual(['a']);
      expect(template.references[0].raw).toBe('${input.a}');
    });

    it('parses a nested input path', () => {
      const template = parseSdApiContractTemplate('${input.customer.id}');

      expect(template.kind).toBe('exact');
      expect(template.references[0].path).toEqual(['customer', 'id']);
    });

    it('parses ${env.baseUrl}', () => {
      const template = parseSdApiContractTemplate('${env.baseUrl}');

      expect(template.kind).toBe('exact');
      expect(template.references[0].root).toBe('env');
      expect(template.references[0].path).toEqual(['baseUrl']);
    });

    it('parses ${res.body.items}', () => {
      const template = parseSdApiContractTemplate('${res.body.items}');

      expect(template.kind).toBe('exact');
      expect(template.references[0].root).toBe('res');
      expect(template.references[0].path).toEqual(['body', 'items']);
    });
  });

  describe('interpolation', () => {
    it('classifies "Bearer ${env.token}" as interpolated', () => {
      const template = parseSdApiContractTemplate('Bearer ${env.token}');

      expect(template.kind).toBe('interpolated');
      expect(template.valid).toBeTrue();
      expect(template.references.length).toBe(1);
      expect(template.references[0].path).toEqual(['token']);
    });

    it('collects multiple interpolations in document order', () => {
      const template = parseSdApiContractTemplate('${env.baseUrl}/products/${input.id}');

      expect(template.kind).toBe('interpolated');
      expect(template.references.map(reference => reference.raw)).toEqual(['${env.baseUrl}', '${input.id}']);
      expect(template.references.map(reference => reference.root)).toEqual(['env', 'input']);
    });

    it('classifies a string with no expression as a literal', () => {
      const template = parseSdApiContractTemplate('/products');

      expect(template.kind).toBe('literal');
      expect(template.valid).toBeTrue();
      expect(template.references.length).toBe(0);
    });

    it('treats an expression with trailing text as interpolated, not exact', () => {
      expect(parseSdApiContractTemplate('${input.a} ').kind).toBe('interpolated');
    });
  });

  describe('malformed templates', () => {
    it('rejects an empty expression', () => {
      const template = parseSdApiContractTemplate('${}');

      expect(template.valid).toBeFalse();
      expect(template.errors[0].code).toBe('template.empty');
    });

    it('rejects a trailing dot', () => {
      const template = parseSdApiContractTemplate('${input.}');

      expect(template.valid).toBeFalse();
      expect(template.errors[0].code).toBe('template.invalid-path');
    });

    it('rejects a missing closing brace', () => {
      const template = parseSdApiContractTemplate('Bearer ${env.token');

      expect(template.valid).toBeFalse();
      expect(template.errors[0].code).toBe('template.unterminated');
    });

    it('rejects a nested expression', () => {
      const template = parseSdApiContractTemplate('${${input.a}}');

      expect(template.valid).toBeFalse();
      expect(template.errors[0].code).toBe('template.nested');
    });

    it('rejects whitespace inside the path', () => {
      expect(parseSdApiContractTemplate('${ input.a }').errors[0].code).toBe('template.invalid-path');
      expect(parseSdApiContractTemplate('${input. a}').errors[0].code).toBe('template.invalid-path');
    });

    it('rejects a root-only expression', () => {
      expect(parseSdApiContractTemplate('${input}').errors[0].code).toBe('template.invalid-path');
    });

    it('rejects an env reference with more than one segment', () => {
      expect(parseSdApiContractTemplate('${env.a.b}').errors[0].code).toBe('template.invalid-path');
    });

    it('keeps every malformed expression as its own error', () => {
      const template = parseSdApiContractTemplate('${} and ${input.}');

      expect(template.errors.map(error => error.code)).toEqual(['template.empty', 'template.invalid-path']);
    });
  });

  describe('unknown roots', () => {
    it('rejects an unknown root', () => {
      const template = parseSdApiContractTemplate('${unknown.value}');

      expect(template.valid).toBeFalse();
      expect(template.errors[0].code).toBe('template.unknown-root');
    });

    it('rejects ${output.*} — nothing reads from the output', () => {
      expect(parseSdApiContractTemplate('${output.id}').errors[0].code).toBe('template.unknown-root');
    });

    it('rejects a bare global without the env prefix', () => {
      expect(parseSdApiContractTemplate('${baseUrl}').errors[0].code).toBe('template.invalid-path');
    });
  });

  describe('prototype safety', () => {
    for (const segment of ['__proto__', 'prototype', 'constructor']) {
      it(`rejects the forbidden segment ${segment}`, () => {
        const template = parseSdApiContractTemplate(`\${input.${segment}}`);

        expect(template.valid).toBeFalse();
        expect(template.errors[0].code).toBe('template.forbidden-segment');
      });

      it(`rejects ${segment} in a deep position`, () => {
        expect(parseSdApiContractTemplate(`\${res.body.${segment}.x}`).errors[0].code).toBe('template.forbidden-segment');
      });
    }
  });

  describe('no javascript execution', () => {
    for (const source of [
      '${input.a.toUpperCase()}',
      '${1 + 1}',
      '${input.a + input.b}',
      '${input.a ? 1 : 2}',
      '${alert(1)}',
      '${input["a"]}',
      '${input.a[0]}',
      '${this.constructor}',
    ]) {
      it(`refuses to interpret ${source} as code`, () => {
        const template = parseSdApiContractTemplate(source);

        expect(template.valid).toBeFalse();
        expect(template.references.length).toBe(0);
      });
    }
  });

  describe('extractSdApiContractReferences', () => {
    it('returns only well-formed references', () => {
      const references = extractSdApiContractReferences('${env.baseUrl}/x/${bad.} /${input.id}');

      expect(references.map(reference => reference.raw)).toEqual(['${env.baseUrl}', '${input.id}']);
    });

    it('returns an empty list for a non-string input', () => {
      expect(extractSdApiContractReferences(undefined).length).toBe(0);
      expect(extractSdApiContractReferences(null).length).toBe(0);
    });
  });
});
