import { Injectable } from '@angular/core';
import type {
  SdGenericAdapter,
  SdGenericDisplayArgs,
  SdGenericRecord,
  SdGenericSchema,
  SdGenericSearchReq,
} from '@sdcorejs/angular/modules/generic';
import type { Filter, PagingReq, PagingRes } from '@sdcorejs/utils/models';

/** Module key of the showcase backend. */
export const GENERIC_DEMO_MODULE = 'showcase';

const SCHEMAS: Record<string, SdGenericSchema> = {
  product: {
    version: 1,
    module: GENERIC_DEMO_MODULE,
    entity: 'product',
    general: {
      label: 'Product',
      properties: [
        { key: 'id', label: 'Id', dataType: 'number', system: true },
        { key: 'code', label: 'Code', dataType: 'string', validation: { required: true, maxLength: 20 }, updatable: false },
        { key: 'name', label: 'Name', dataType: 'string', validation: { required: true } },
        {
          key: 'category',
          label: 'Category',
          dataType: 'enum',
          enums: [
            { value: 'COFFEE', label: 'Coffee', color: 'primary', icon: 'coffee' },
            { value: 'TEA', label: 'Tea', color: 'success', icon: 'emoji_food_beverage' },
            { value: 'CAKE', label: 'Cake', color: 'warning', icon: 'cake' },
          ],
        },
        { key: 'price', label: 'Price', dataType: 'number', format: 'currency', validation: { min: 0 } },
        {
          key: 'supplier',
          label: 'Supplier',
          dataType: 'relation',
          relation: { entity: 'supplier', displayField: 'name', display: '${code} - ${name}', searchFields: ['code', 'name'] },
        },
        { key: 'active', label: 'Active', dataType: 'boolean', defaultValue: true },
        { key: 'launchedAt', label: 'Launched', dataType: 'date' },
        { key: 'openAt', label: 'Opens at', dataType: 'time' },
        { key: 'tags', label: 'Tags', dataType: 'string', multiple: true },
        { key: 'specs', label: 'Specs', dataType: 'json' },
      ],
    },
    list: { orders: [{ field: 'code', direction: 'ASC' }], externalFilters: [{ key: 'category' }, { key: 'active' }], export: true },
    detail: { title: 'Product ${code}' },
    import: { upsertKey: 'code' },
  },
  supplier: {
    version: 1,
    module: GENERIC_DEMO_MODULE,
    entity: 'supplier',
    general: {
      label: 'Supplier',
      properties: [
        { key: 'id', label: 'Id', dataType: 'number', system: true },
        { key: 'code', label: 'Code', dataType: 'string', validation: { required: true } },
        { key: 'name', label: 'Name', dataType: 'string', validation: { required: true } },
      ],
    },
  },
};

const seed = (): Record<string, SdGenericRecord[]> => ({
  supplier: [
    { id: 1, code: 'SUP-01', name: 'Highland Farm' },
    { id: 2, code: 'SUP-02', name: 'Lam Dong Tea' },
    { id: 3, code: 'SUP-03', name: 'Saigon Bakery' },
  ],
  product: Array.from({ length: 24 }, (_, index) => ({
    id: index + 1,
    code: `PRD-${String(index + 1).padStart(3, '0')}`,
    name: ['Espresso', 'Cold brew', 'Oolong', 'Green tea', 'Croissant', 'Tiramisu'][index % 6] + ` #${index + 1}`,
    category: ['COFFEE', 'COFFEE', 'TEA', 'TEA', 'CAKE', 'CAKE'][index % 6],
    price: 25000 + (index % 6) * 5000,
    supplier: [1, 1, 2, 2, 3, 3][index % 6],
    active: index % 5 !== 0,
    launchedAt: new Date(2026, index % 12, 1 + (index % 27)).toISOString(),
    openAt: `0${7 + (index % 3)}:30`,
    tags: index % 2 ? ['best-seller'] : [],
    specs: { size: ['S', 'M', 'L'][index % 3] },
  })),
});

const text = (value: unknown) => (value === undefined || value === null ? '' : String(value)).toLowerCase();

/** Evaluates the filters the showcase needs: EQUAL/IN/CONTAIN and OR groups. */
const matches = (record: SdGenericRecord, filter: Filter): boolean => {
  if (filter.operator === 'AND') return filter.data.every(item => matches(record, item));
  if (filter.operator === 'OR') return filter.data.some(item => matches(record, item));
  const value = record[(filter as { field: string }).field];
  const data = (filter as { data?: unknown }).data;
  switch (filter.operator) {
    case 'IN':
      return (data as unknown[]).some(item => text(item) === text(value));
    case 'CONTAIN':
      return text(value).includes(text(data));
    case 'EQUAL':
      return text(value) === text(data);
    default:
      return true;
  }
};

/**
 * In-memory backend of the showcase. A real adapter calls the backend with HttpClient; this one keeps two
 * entities in memory so every generic screen can be tried without a server.
 */
@Injectable()
export class GenericDemoMockAdapter implements SdGenericAdapter {
  readonly module = GENERIC_DEMO_MODULE;
  readonly #tables = seed();

  async schema(entity: string): Promise<SdGenericSchema> {
    const schema = SCHEMAS[entity];
    if (!schema) throw new Error(`Unknown entity "${entity}"`);
    return structuredClone(schema);
  }

  async query(entity: string, req: PagingReq): Promise<PagingRes<SdGenericRecord>> {
    let rows = this.#rows(entity).filter(row => (req.filters ?? []).every(filter => matches(row, filter)));
    for (const order of [...(req.orders ?? [])].reverse()) {
      const field = order.field as string;
      rows = [...rows].sort(
        (a, b) => text(a[field]).localeCompare(text(b[field]), undefined, { numeric: true }) * (order.direction === 'DESC' ? -1 : 1)
      );
    }
    const pageSize = req.pageSize ?? 20;
    const start = (req.pageNumber ?? 0) * pageSize;
    return { items: rows.slice(start, start + pageSize), total: rows.length };
  }

  async detail(entity: string, id: string): Promise<SdGenericRecord> {
    const row = this.#rows(entity).find(item => String(item['id']) === id);
    if (!row) throw new Error(`Record ${id} not found`);
    return { ...row };
  }

  async create(entity: string, data: SdGenericRecord): Promise<SdGenericRecord> {
    const rows = this.#rows(entity);
    const row = { ...data, id: Math.max(0, ...rows.map(item => Number(item['id']))) + 1 };
    rows.push(row);
    return row;
  }

  async update(entity: string, id: string, data: SdGenericRecord): Promise<SdGenericRecord> {
    const rows = this.#rows(entity);
    const index = rows.findIndex(item => String(item['id']) === id);
    if (index < 0) throw new Error(`Record ${id} not found`);
    rows[index] = { ...rows[index], ...data };
    return rows[index];
  }

  async delete(entity: string, id: string): Promise<void> {
    const rows = this.#rows(entity);
    rows.splice(
      rows.findIndex(item => String(item['id']) === id),
      1
    );
  }

  async search(entity: string, req: SdGenericSearchReq): Promise<SdGenericRecord[]> {
    const rows = this.#rows(entity);
    if (req.values?.length) return rows.filter(row => req.values!.some(value => text(value) === text(row[req.valueField])));
    const term = text(req.term);
    return rows.filter(row => !term || req.fields.some(field => text(row[field]).includes(term))).slice(0, req.limit ?? 20);
  }

  display({ schema }: SdGenericDisplayArgs): 'page' | 'side-drawer' {
    // why: small entities read better in a drawer over the list, big ones as a page.
    return schema.general.properties.length < 6 ? 'side-drawer' : 'page';
  }

  #rows(entity: string): SdGenericRecord[] {
    const rows = this.#tables[entity];
    if (!rows) throw new Error(`Unknown entity "${entity}"`);
    return rows;
  }
}
