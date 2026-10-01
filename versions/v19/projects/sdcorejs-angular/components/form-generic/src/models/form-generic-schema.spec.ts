import { sdNormalizeSchema, sdSameSchema, sdSchemaFields, sdValidateSchema } from './form-generic-schema';
import type { SdFormGenericSchema } from './form-generic-schema.model';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(child => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
};

const text = (id: string, key = id) => ({ id, key, type: 'textfield', label: key }) as const;

const schema = (): SdFormGenericSchema =>
  ({
    pages: [
      {
        id: 'page-1',
        elements: [
          text('f-name', 'name'),
          { id: 'g-contact', type: 'group', label: 'Contact', elements: [text('f-email', 'email'), text('f-phone', 'phone')] },
          text('f-note', 'note'),
        ],
      },
    ],
    variables: [{ key: 'tenant', label: 'Tenant' }],
  }) as SdFormGenericSchema;

const codes = (value: unknown) => sdValidateSchema(value).map(issue => issue.code);

describe('form generic schema grammar', () => {
  describe('sdValidateSchema', () => {
    it('accepts a single-page schema with fields and a flat group', () => {
      expect(sdValidateSchema(schema())).toEqual([]);
    });

    it('requires a non-empty pages array', () => {
      expect(codes({})).toContain('pages-missing');
      expect(codes({ pages: [] })).toContain('pages-missing');
    });

    it('rejects a schemaVersion field because v1 is the first version', () => {
      expect(codes({ ...schema(), schemaVersion: 2 })).toContain('schema-version');
    });

    it('rejects a group nested inside a group', () => {
      const value = schema();
      const group = value.pages[0].elements[1] as { elements: unknown[] };
      group.elements.push({ id: 'g-inner', type: 'group', label: 'Inner', elements: [] });
      expect(codes(value)).toContain('group-nested');
    });

    it('rejects the removed break element', () => {
      const value = schema();
      (value.pages[0].elements as unknown[]).push({ id: 'b-1', type: 'break' });
      expect(codes(value)).toContain('break-element');
    });

    it('reports elements, groups and pages without an id, and duplicated ids', () => {
      const value = schema();
      (value.pages[0].elements as unknown[]).push({ key: 'city', type: 'textfield', label: 'City' });
      (value.pages[0].elements as unknown[]).push(text('f-name', 'other'));
      expect(codes(value)).toContain('id-missing');
      expect(codes(value)).toContain('id-duplicate');
    });

    it('reports duplicated field keys, including keys inside groups', () => {
      const value = schema();
      (value.pages[0].elements as unknown[]).push(text('f-email-2', 'email'));
      const issues = sdValidateSchema(value).filter(issue => issue.code === 'key-duplicate');
      expect(issues.length).toBe(1);
      expect(issues[0].key).toBe('email');
    });

    it('reports a field key that is also a variable key', () => {
      const value = schema();
      (value.pages[0].elements as unknown[]).push(text('f-tenant', 'tenant'));
      expect(codes(value)).toContain('key-variable-conflict');
    });

    it('does not reject element types it does not know (later phases extend the union)', () => {
      const value = schema();
      (value.pages[0].elements as unknown[]).push({ id: 's-1', type: 'heading', content: 'Title' });
      expect(sdValidateSchema(value)).toEqual([]);
    });
  });

  it('refuses a reserved JavaScript key and a field that stores a value without a key', () => {
    const issues = sdValidateSchema({
      pages: [
        {
          id: 'p',
          elements: [
            text('a', '__proto__'),
            text('b', 'constructor'),
            { id: 'c', type: 'textfield', label: 'C' },
            { id: 'h', type: 'html', content: '' },
          ],
        },
      ],
      variables: [{ key: 'toString', label: 'T' }],
    });
    expect(issues.map(issue => issue.code).sort()).toEqual(['key-missing', 'key-reserved', 'key-reserved', 'key-reserved']);
  });

  describe('sdNormalizeSchema', () => {
    it('returns a new object and never mutates a frozen input', () => {
      const input = deepFreeze(schema());
      const output = sdNormalizeSchema(input);
      expect(output).not.toBe(input);
      expect(output.pages[0]).not.toBe(input.pages[0]);
      expect(output).toEqual(input);
    });

    it('fills missing ids on pages, groups and elements', () => {
      const input = deepFreeze({
        pages: [{ elements: [{ type: 'group', label: 'G', elements: [{ key: 'a', type: 'textfield', label: 'A' }] }] }],
      } as unknown as SdFormGenericSchema);
      const output = sdNormalizeSchema(input);
      const group = output.pages[0].elements[0] as { id: string; elements: { id: string }[] };
      expect(output.pages[0].id).toEqual(jasmine.any(String));
      expect(group.id).toEqual(jasmine.any(String));
      expect(group.elements[0].id).toEqual(jasmine.any(String));
      expect(new Set([output.pages[0].id, group.id, group.elements[0].id]).size).toBe(3);
      expect(sdValidateSchema(output)).toEqual([]);
    });

    it('keeps an element of an unknown type exactly as it was', () => {
      const unknownElement = { id: 's-1', type: 'heading', content: 'Title', extra: { level: 2 } };
      const output = sdNormalizeSchema(deepFreeze({ pages: [{ id: 'p', elements: [unknownElement] }] } as unknown as SdFormGenericSchema));
      expect(output.pages[0].elements[0]).toEqual(unknownElement as never);
    });

    it('gives a new id to an element whose id repeats an earlier one, and keeps the first', () => {
      const input = deepFreeze({
        pages: [{ id: 'p', elements: [text('a', 'x'), { type: 'group', id: 'a', label: 'G', elements: [text('a', 'y')] }] }],
      } as unknown as SdFormGenericSchema);
      let count = 0;
      const output = sdNormalizeSchema(input, () => `new-${++count}`);
      const group = output.pages[0].elements[1] as { id: string; elements: { id: string }[] };
      expect([output.pages[0].elements[0].id, group.id, group.elements[0].id]).toEqual(['a', 'new-1', 'new-2']);
      expect(sdValidateSchema(output)).toEqual([]);
    });

    it('creates one empty page when pages are missing', () => {
      const output = sdNormalizeSchema({} as SdFormGenericSchema);
      expect(output.pages.length).toBe(1);
      expect(output.pages[0].elements).toEqual([]);
    });
  });

  describe('sdSchemaFields', () => {
    it('lists fields in document order, including fields inside groups, and skips unknown types', () => {
      const value = schema();
      (value.pages[0].elements as unknown[]).push({ id: 's-1', type: 'heading', content: 'Title' });
      expect(sdSchemaFields(value).map(field => field.key)).toEqual(['name', 'email', 'phone', 'note']);
    });
  });

  describe('sdSameSchema', () => {
    it('compares content regardless of property order', () => {
      const left = schema();
      const right = JSON.parse(JSON.stringify(schema())) as SdFormGenericSchema;
      right.pages[0].elements[0] = { label: 'name', type: 'textfield', key: 'name', id: 'f-name' } as never;
      expect(sdSameSchema(left, right)).toBeTrue();
    });

    it('detects a content change', () => {
      const right = schema();
      (right.pages[0].elements[0] as { label: string }).label = 'Full name';
      expect(sdSameSchema(schema(), right)).toBeFalse();
    });
  });
});
