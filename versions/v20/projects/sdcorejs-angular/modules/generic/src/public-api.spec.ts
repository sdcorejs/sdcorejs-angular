import * as api from '../index';
import type { SdGenericAdapter, SdGenericEntityConfiguration, SdGenericProperty, SdGenericSchema, SdGenericSchemaIssue } from '../index';

describe('generic module public API', () => {
  it('exports exactly the four runtime symbols of the contract (AC-024)', () => {
    expect(Object.keys(api).sort()).toEqual(['provideSdGeneric', 'provideSdGenericEntity', 'sdGenericRoutes', 'validateSdGenericSchema']);
  });

  it('keeps the models as types consumers can implement', () => {
    const property: SdGenericProperty = { key: 'code', label: 'Code', dataType: 'string' };
    const schema: SdGenericSchema = { version: 1, module: 'tms', entity: 'order', general: { label: 'Order', properties: [property] } };
    const adapter: SdGenericAdapter = {
      module: 'tms',
      schema: async () => schema,
      query: async () => ({ items: [], total: 0 }),
      detail: async () => ({}),
      create: async data => data as never,
      update: async () => ({}),
      delete: async () => undefined,
    };
    const entity: SdGenericEntityConfiguration = { module: 'tms', entity: 'order', hiddenDefaults: ['delete'] };
    const issues: SdGenericSchemaIssue[] = api.validateSdGenericSchema(schema, schema);
    expect(issues).toEqual([]);
    expect(adapter.module).toBe(entity.module);
  });
});
