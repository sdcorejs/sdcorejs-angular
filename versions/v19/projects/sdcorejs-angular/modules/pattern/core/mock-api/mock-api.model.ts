import type { MatchOptions } from '@sdcorejs/utils/models';

/** Error body of the mock API: a message and, for validation errors, one entry per field. */
export interface PatternMockErrorBody {
  readonly message: string;
  readonly errors?: readonly { readonly field: string; readonly message: string }[];
}

/** Thrown by a resource handler; the interceptor turns it into an `HttpErrorResponse`. */
export class PatternMockError extends Error {
  constructor(
    readonly status: number,
    readonly body: PatternMockErrorBody
  ) {
    super(body.message);
  }
}

export interface PatternMockRecord {
  readonly id: string;
}

/** Everything a resource handler can read or change. */
export interface PatternMockContext {
  /** Records of another resource, for relations (an order reads its customer). */
  readonly collection: <R extends PatternMockRecord>(name: string) => readonly R[];
  /** Replaces the records of a resource and persists them. */
  readonly save: <R extends PatternMockRecord>(name: string, records: readonly R[]) => void;
  /** Next free numeric id of a resource. */
  readonly nextId: (name: string) => string;
  readonly now: () => Date;
}

/** Answer of a custom endpoint. */
export interface PatternMockResult {
  readonly status?: number;
  readonly body: unknown;
}

/** One collection of the mock API, served under `<apiBaseUrl>/<name>`. */
export interface PatternMockResource<T extends PatternMockRecord = PatternMockRecord> {
  /** URL segment, plural as in the blueprint: `products`, `orders`. */
  readonly name: string;
  /** Deterministic seed: the same records every time, so e2e can rely on them. */
  readonly seed: () => T[];
  /** Field types for `FilterUtilities.match`, required for dates stored as ISO strings. */
  readonly fieldTypes?: MatchOptions<T>['fieldTypes'];
  /** Builds a new record from a POST body; throws `PatternMockError` on invalid input. */
  readonly create?: (body: Record<string, unknown>, records: readonly T[], context: PatternMockContext) => T;
  /** Builds the updated record from a PUT body. */
  readonly update?: (current: T, body: Record<string, unknown>, records: readonly T[], context: PatternMockContext) => T;
  /** Refuses a delete with `PatternMockError` (409 when other records still use it). */
  readonly beforeDelete?: (current: T, context: PatternMockContext) => void;
  /** `POST <name>/:id/<action>` and `POST <name>/bulk/<action>`: returns the changed record. */
  readonly actions?: Readonly<Record<string, (current: T, body: Record<string, unknown>, context: PatternMockContext) => T>>;
  /** Other endpoints under `<name>/…` (searches, sub-collections); `undefined` falls through to CRUD. */
  readonly route?: (
    method: string,
    segments: readonly string[],
    query: PatternMockQuery,
    body: Record<string, unknown>,
    context: PatternMockContext
  ) => PatternMockResult | undefined;
}

/** Query string of a request, as `HttpParams` reads it. */
export interface PatternMockQuery {
  get(name: string): string | null;
}

/** Response of one bulk item: `POST <name>/bulk/<action>` answers every id, success or not. */
export interface PatternBulkItemResult {
  readonly id: string;
  readonly ok: boolean;
  readonly message?: string;
}
