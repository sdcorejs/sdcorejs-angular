import type { SdApiContract } from './api-contract.model';

/**
 * Deterministic JSON for an API contract.
 *
 * Three guarantees the persisted file depends on:
 *
 * 1. **System keys are ordered**, so two authors editing the same contract produce the same bytes
 *    and a `git diff` shows the semantic change instead of a reshuffle.
 * 2. **User-declared keys keep their order** (`properties`, `query`, `headers`, …) — that order is
 *    authored information, and sorting it would churn every diff.
 * 3. **Only contract vocabulary survives.** The builder's transient UI state (expansion, selection,
 *    internal ids) is dropped by construction: the serializer copies a fixed key whitelist rather
 *    than the object it was handed, so a new piece of UI state can never leak into the file.
 *
 * `undefined` members are omitted; declared `false`, `0`, `null` and `""` are kept.
 */
export function serializeSdApiContract(contract: SdApiContract | null | undefined): string {
  return JSON.stringify(normalizeContract(contract), null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function put(target: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) target[key] = value;
}

function normalizeContract(contract: unknown): unknown {
  if (!isRecord(contract)) return null;

  const out: Record<string, unknown> = {};
  put(out, 'contractVersion', contract['contractVersion']);
  put(out, 'code', contract['code']);
  put(out, 'name', contract['name']);
  put(out, 'description', contract['description']);
  put(out, 'input', normalizeSchemaHolder(contract['input']));
  put(out, 'req', normalizeRequest(contract['req']));
  put(out, 'res', normalizeResponse(contract['res']));
  put(out, 'output', normalizeSchemaHolder(contract['output']));
  return out;
}

function normalizeSchemaHolder(holder: unknown): Record<string, unknown> | undefined {
  if (!isRecord(holder)) return undefined;
  const out: Record<string, unknown> = {};
  put(out, 'schema', normalizeNode(holder['schema']));
  return out;
}

function normalizeRequest(request: unknown): Record<string, unknown> | undefined {
  if (!isRecord(request)) return undefined;
  const out: Record<string, unknown> = {};
  put(out, 'method', request['method']);
  put(out, 'url', request['url']);
  put(out, 'path', normalizeNodeRecord(request['path']));
  put(out, 'query', normalizeNodeRecord(request['query']));
  put(out, 'headers', normalizeNodeRecord(request['headers']));
  put(out, 'body', normalizeNode(request['body']));
  return out;
}

function normalizeResponse(response: unknown): Record<string, unknown> | undefined {
  if (!isRecord(response)) return undefined;
  const out: Record<string, unknown> = {};
  put(out, 'status', Array.isArray(response['status']) ? [...(response['status'] as unknown[])] : response['status']);
  put(out, 'headers', normalizeNodeRecord(response['headers']));
  put(out, 'body', normalizeNode(response['body']));
  return out;
}

function normalizeNode(node: unknown): Record<string, unknown> | undefined {
  if (!isRecord(node)) return undefined;

  const out: Record<string, unknown> = {};
  put(out, 'type', node['type']);
  put(out, 'required', node['required']);
  put(out, 'label', node['label']);
  put(out, 'description', node['description']);
  put(out, 'transform', node['transform']);
  put(out, 'source', node['source']);
  put(out, 'value', normalizeJsonValue(node['value']));
  put(out, 'properties', normalizeNodeRecord(node['properties']));
  put(out, 'items', normalizeNode(node['items']));
  return out;
}

function normalizeNodeRecord(record: unknown): Record<string, unknown> | undefined {
  if (!isRecord(record)) return undefined;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(record)) {
    const node = normalizeNode(record[key]);
    if (node !== undefined) out[key] = node;
  }
  return out;
}

// why: static literal là dữ liệu tự do của người dùng — copy nguyên hình dạng (giữ null, 0, '',
// thứ tự key) thay vì lọc theo whitelist như node.
function normalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(item => normalizeJsonValue(item));
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const normalized = normalizeJsonValue(value[key]);
      if (normalized !== undefined) out[key] = normalized;
    }
    return out;
  }
  return value;
}
