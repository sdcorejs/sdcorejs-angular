import { FilterUtilities } from '@sdcorejs/utils/fns';
import type { Filter, Order } from '@sdcorejs/utils/models';
import { readSessionValue, writeSessionValue } from '../session-state';
import {
  PatternMockError,
  type PatternBulkItemResult,
  type PatternMockContext,
  type PatternMockQuery,
  type PatternMockRecord,
  type PatternMockResource,
  type PatternMockResult,
} from './mock-api.model';

const STORAGE_PREFIX = 'sd-pattern.db.';

const notFound = (): PatternMockError => new PatternMockError(404, { message: 'Không tìm thấy bản ghi.' });

const asBody = (body: unknown): Record<string, unknown> =>
  body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new PatternMockError(400, { message: 'Tham số truy vấn không hợp lệ.' });
  }
};

const valueAt = (record: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined), record);

const compare = (left: unknown, right: unknown): number => {
  if (left === right) return 0;
  if (left === null || left === undefined || left === '') return 1;
  if (right === null || right === undefined || right === '') return -1;
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), 'vi', { numeric: true });
};

/**
 * In-memory API behind the pattern screens: one collection per resource, seeded on first use and kept in
 * sessionStorage when `storage` is `'session'`. Answers like the blueprint transport:
 * `GET <name>` (`pageNumber`, `pageSize` and JSON `filters` / `orders`), `GET|PUT|DELETE <name>/:id`, `POST <name>`,
 * `POST <name>/:id/<action>` and `POST <name>/bulk/<action>` with `{ ids }` or `{ items }`.
 */
export class PatternMockBackend {
  readonly #resources = new Map<string, PatternMockResource>();
  readonly #collections = new Map<string, PatternMockRecord[]>();
  readonly #context: PatternMockContext;

  constructor(
    resources: readonly PatternMockResource[],
    private readonly storage: 'session' | 'none'
  ) {
    resources.forEach(resource => this.#resources.set(resource.name, resource as PatternMockResource));
    this.#context = {
      collection: <R extends PatternMockRecord>(name: string) => this.collection(name) as readonly R[],
      save: (name, records) => this.#save(name, [...records]),
      nextId: name => String(this.collection(name).reduce((max, record) => Math.max(max, Number(record.id) || 0), 0) + 1),
      now: () => new Date(),
    };
  }

  /** Records of a resource: stored copy first, then the seed. */
  collection(name: string): readonly PatternMockRecord[] {
    const cached = this.#collections.get(name);
    if (cached) return cached;
    const resource = this.#resources.get(name);
    if (!resource) throw notFound();
    const stored = this.storage === 'session' ? readSessionValue<PatternMockRecord[] | null>(STORAGE_PREFIX + name, null) : null;
    const records = Array.isArray(stored) ? stored : resource.seed();
    this.#collections.set(name, records);
    return records;
  }

  /** Drops every change and goes back to the seeds. */
  reset(): void {
    this.#resources.forEach((_, name) => writeSessionValue(STORAGE_PREFIX + name, undefined));
    this.#collections.clear();
  }

  /** Handles one request; throws `PatternMockError` for HTTP errors. */
  handle(method: string, segments: readonly string[], query: PatternMockQuery, rawBody: unknown, limit?: number): PatternMockResult {
    const [name, ...rest] = segments;
    const resource = name ? this.#resources.get(name) : undefined;
    if (!resource) throw notFound();
    const body = asBody(rawBody);
    const custom = resource.route?.(method, rest, query, body, this.#context);
    if (custom) return custom;

    if (rest.length === 0 && method === 'GET') return { body: this.#search(resource, query, limit) };
    if (rest.length === 0 && method === 'POST') return this.#create(resource, body);
    if (rest[0] === 'bulk' && rest.length === 2 && method === 'POST') return { body: this.#bulk(resource, rest[1], body) };
    if (rest.length === 1) {
      const id = rest[0];
      if (method === 'GET') return { body: this.#find(resource.name, id) };
      if (method === 'PUT') return { body: this.#update(resource, id, body) };
      if (method === 'DELETE') {
        this.#delete(resource, id);
        return { status: 204, body: null };
      }
    }
    if (rest.length === 2 && method === 'POST') return { body: this.#act(resource, rest[0], rest[1], body) };
    throw new PatternMockError(405, { message: `Không hỗ trợ ${method} /${segments.join('/')}.` });
  }

  #save(name: string, records: PatternMockRecord[]): void {
    this.#collections.set(name, records);
    if (this.storage === 'session') writeSessionValue(STORAGE_PREFIX + name, records);
  }

  #find(name: string, id: string): PatternMockRecord {
    const record = this.collection(name).find(item => item.id === id);
    if (!record) throw notFound();
    return record;
  }

  #search(resource: PatternMockResource, query: PatternMockQuery, limit?: number): { items: PatternMockRecord[]; total: number } {
    const filters = parseJson<Filter[]>(query.get('filters'), []);
    const orders = parseJson<Order[]>(query.get('orders'), []);
    const pageNumber = Math.max(0, Number(query.get('pageNumber') ?? 0) || 0);
    const pageSize = Math.max(1, Number(query.get('pageSize') ?? 20) || 20);
    const source = limit === undefined ? this.collection(resource.name) : this.collection(resource.name).slice(0, limit);
    const matched = source.filter(record => FilterUtilities.match(filters, record, { fieldTypes: resource.fieldTypes }));
    const sorted = orders.length
      ? [...matched].sort((left, right) => {
          for (const order of orders) {
            const result = compare(valueAt(left, String(order.field)), valueAt(right, String(order.field)));
            if (result) return order.direction === 'DESC' ? -result : result;
          }
          return 0;
        })
      : matched;
    return { items: sorted.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize), total: matched.length };
  }

  #create(resource: PatternMockResource, body: Record<string, unknown>): PatternMockResult {
    if (!resource.create) throw new PatternMockError(405, { message: 'Không hỗ trợ tạo mới.' });
    const records = this.collection(resource.name);
    const record = resource.create(body, records, this.#context);
    this.#save(resource.name, [record, ...records]);
    return { status: 201, body: record };
  }

  #update(resource: PatternMockResource, id: string, body: Record<string, unknown>): PatternMockRecord {
    if (!resource.update) throw new PatternMockError(405, { message: 'Không hỗ trợ cập nhật.' });
    const records = this.collection(resource.name);
    const current = this.#find(resource.name, id);
    const updated = resource.update(current, body, records, this.#context);
    this.#save(
      resource.name,
      records.map(record => (record.id === id ? updated : record))
    );
    return updated;
  }

  #delete(resource: PatternMockResource, id: string): void {
    const current = this.#find(resource.name, id);
    resource.beforeDelete?.(current, this.#context);
    this.#save(
      resource.name,
      this.collection(resource.name).filter(record => record.id !== id)
    );
  }

  #act(resource: PatternMockResource, id: string, action: string, body: Record<string, unknown>): PatternMockRecord {
    const handler = resource.actions?.[action];
    if (!handler) throw new PatternMockError(405, { message: `Không hỗ trợ tác vụ ${action}.` });
    const updated = handler(this.#find(resource.name, id), body, this.#context);
    this.#save(
      resource.name,
      this.collection(resource.name).map(record => (record.id === id ? updated : record))
    );
    return updated;
  }

  /**
   * Applies an action to every id and answers each one: a record in the wrong state fails alone, the others
   * still change. Body: `{ ids: string[] }`, or `{ items: { id, ...data }[] }` when each record carries its own data.
   */
  #bulk(resource: PatternMockResource, action: string, body: Record<string, unknown>): { results: PatternBulkItemResult[] } {
    const items: Record<string, unknown>[] = Array.isArray(body['items'])
      ? (body['items'] as Record<string, unknown>[])
      : Array.isArray(body['ids'])
        ? (body['ids'] as unknown[]).map(id => ({ id }))
        : [];
    if (!items.length) throw new PatternMockError(400, { message: 'Chưa chọn bản ghi nào.' });
    const results = items.map(item => {
      const id = String(item['id'] ?? '');
      try {
        if (action === 'delete') this.#delete(resource, id);
        else this.#act(resource, id, action, item);
        return { id, ok: true };
      } catch (error) {
        return { id, ok: false, message: error instanceof PatternMockError ? error.body.message : 'Lỗi không xác định.' };
      }
    });
    return { results };
  }
}
