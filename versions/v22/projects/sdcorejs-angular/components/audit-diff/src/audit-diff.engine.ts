export type SdAuditDiffKind = 'added' | 'removed' | 'changed' | 'unchanged';
export type SdAuditDiffSide = 'before' | 'after';
export type SdAuditDiffArrayKey = string | ((item: unknown) => unknown);

export interface SdAuditDiffFormatContext {
  readonly path: string;
  readonly configPath: string;
  readonly side: SdAuditDiffSide;
  readonly kind: SdAuditDiffKind;
  readonly before: unknown;
  readonly after: unknown;
}

export interface SdAuditDiffField {
  readonly path: string;
  readonly label?: string;
  readonly order?: number;
  readonly hidden?: boolean;
  readonly redacted?: boolean;
  readonly arrayKey?: SdAuditDiffArrayKey;
  readonly enumMap?: Readonly<Record<string, unknown>>;
  readonly format?: (value: unknown, context: SdAuditDiffFormatContext) => unknown;
}

export interface SdAuditDiffOptions {
  readonly fields?: readonly SdAuditDiffField[];
  readonly includeUnchanged?: boolean;
  readonly redactedValue?: unknown;
  readonly rootLabel?: string;
}

export interface SdAuditDiffRow {
  readonly id: string;
  readonly path: string;
  readonly configPath: string;
  readonly label: string;
  readonly kind: SdAuditDiffKind;
  readonly before: unknown;
  readonly after: unknown;
  readonly beforePresent: boolean;
  readonly afterPresent: boolean;
  readonly redacted: boolean;
}

interface WalkContext {
  readonly options: SdAuditDiffOptions;
  readonly fields: readonly SdAuditDiffField[];
  readonly rows: SdAuditDiffRow[];
  readonly activeBefore: WeakSet<object>;
  readonly activeAfter: WeakSet<object>;
}

interface StableArrayItem {
  readonly key: unknown;
  readonly value: unknown;
}

const DEFAULT_REDACTED_VALUE = '••••••';

export function sdBuildAuditDiff(before: unknown, after: unknown, options: SdAuditDiffOptions = {}): SdAuditDiffRow[] {
  const context: WalkContext = {
    options,
    fields: options.fields ?? [],
    rows: [],
    activeBefore: new WeakSet<object>(),
    activeAfter: new WeakSet<object>(),
  };
  walkValue(context, before, after, true, true, '$', '$');
  return context.rows.sort((left, right) => compareRows(left, right, context.fields));
}

function walkValue(
  context: WalkContext,
  before: unknown,
  after: unknown,
  beforePresent: boolean,
  afterPresent: boolean,
  path: string,
  configPath: string
): void {
  if (isConfigured(context.fields, configPath, 'hidden')) return;
  if (isConfigured(context.fields, configPath, 'redacted')) {
    addAtomicRow(context, before, after, beforePresent, afterPresent, path, configPath, true);
    return;
  }

  const field = findExactField(context.fields, configPath);
  if (field?.format || field?.enumMap) {
    addAtomicRow(context, before, after, beforePresent, afterPresent, path, configPath, false);
    return;
  }

  const beforeArray = Array.isArray(before);
  const afterArray = Array.isArray(after);
  if (beforeArray || afterArray) {
    if ((!beforePresent && afterArray) || (beforeArray && !afterPresent) || (beforeArray && afterArray)) {
      const arrayKey = field?.arrayKey;
      if (arrayKey && walkStableArray(context, beforeArray ? before : [], afterArray ? after : [], path, configPath, arrayKey)) return;
    }
    addAtomicRow(context, before, after, beforePresent, afterPresent, path, configPath, false);
    return;
  }

  const beforeObject = isPlainObject(before);
  const afterObject = isPlainObject(after);
  const canRecurse = (beforeObject && afterObject) || (beforeObject && !afterPresent) || (afterObject && !beforePresent);
  if (canRecurse) {
    if ((beforeObject && context.activeBefore.has(before)) || (afterObject && context.activeAfter.has(after))) return;
    if (beforeObject) context.activeBefore.add(before);
    if (afterObject) context.activeAfter.add(after);
    const beforeRecord = beforeObject ? before : {};
    const afterRecord = afterObject ? after : {};
    const keys = [...new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)])].sort(compareText);
    if (keys.length === 0) {
      addAtomicRow(context, before, after, beforePresent, afterPresent, path, configPath, false);
      if (beforeObject) context.activeBefore.delete(before);
      if (afterObject) context.activeAfter.delete(after);
      return;
    }
    for (const key of keys) {
      const childBeforePresent = beforeObject && hasOwn(beforeRecord, key);
      const childAfterPresent = afterObject && hasOwn(afterRecord, key);
      walkValue(
        context,
        childBeforePresent ? beforeRecord[key] : undefined,
        childAfterPresent ? afterRecord[key] : undefined,
        childBeforePresent,
        childAfterPresent,
        path === '$' ? key : `${path}.${key}`,
        configPath === '$' ? key : `${configPath}.${key}`
      );
    }
    if (beforeObject) context.activeBefore.delete(before);
    if (afterObject) context.activeAfter.delete(after);
    return;
  }

  addAtomicRow(context, before, after, beforePresent, afterPresent, path, configPath, false);
}

function walkStableArray(
  context: WalkContext,
  before: readonly unknown[],
  after: readonly unknown[],
  path: string,
  configPath: string,
  keySelector: SdAuditDiffArrayKey
): boolean {
  const beforeItems = indexStableArray(before, keySelector);
  const afterItems = indexStableArray(after, keySelector);
  if (!beforeItems || !afterItems) return false;

  const keys = [...new Set([...beforeItems.keys(), ...afterItems.keys()])].sort(compareText);
  const keyName = typeof keySelector === 'string' ? keySelector : 'key';
  for (const key of keys) {
    const beforeItem = beforeItems.get(key);
    const afterItem = afterItems.get(key);
    const itemPath = `${path}[${keyName}=${encodeURIComponent(key)}]`;
    const itemConfigPath = `${configPath}[]`;
    if (!beforeItem || !afterItem) {
      walkValue(context, beforeItem?.value, afterItem?.value, Boolean(beforeItem), Boolean(afterItem), itemPath, itemConfigPath);
      continue;
    }
    walkValue(context, beforeItem.value, afterItem.value, true, true, itemPath, itemConfigPath);
  }
  return true;
}

function indexStableArray(items: readonly unknown[], keySelector: SdAuditDiffArrayKey): Map<string, StableArrayItem> | null {
  const result = new Map<string, StableArrayItem>();
  for (const item of items) {
    let key: unknown;
    try {
      key = typeof keySelector === 'function' ? keySelector(item) : isObject(item) ? item[keySelector] : undefined;
    } catch {
      return null;
    }
    const serialized = serializeStableKey(key);
    if (serialized === null || result.has(serialized)) return null;
    result.set(serialized, { key, value: item });
  }
  return result;
}

function serializeStableKey(key: unknown): string | null {
  if (key === null) return 'null:null';
  switch (typeof key) {
    case 'string':
    case 'number':
    case 'bigint':
    case 'boolean':
      return `${typeof key}:${String(key)}`;
    default:
      return null;
  }
}

function addAtomicRow(
  context: WalkContext,
  before: unknown,
  after: unknown,
  beforePresent: boolean,
  afterPresent: boolean,
  path: string,
  configPath: string,
  redacted: boolean
): void {
  const kind = classifyChange(before, after, beforePresent, afterPresent);
  if (kind === 'unchanged' && !context.options.includeUnchanged) return;

  const field = findExactField(context.fields, configPath);
  const redactedValue = context.options.redactedValue ?? DEFAULT_REDACTED_VALUE;
  const normalizedBefore = redacted
    ? beforePresent
      ? redactedValue
      : undefined
    : normalizeValue(before, beforePresent, 'before', kind, path, configPath, field, after);
  const normalizedAfter = redacted
    ? afterPresent
      ? redactedValue
      : undefined
    : normalizeValue(after, afterPresent, 'after', kind, path, configPath, field, before);

  context.rows.push({
    id: path,
    path,
    configPath,
    label: field?.label ?? (path === '$' ? (context.options.rootLabel ?? 'Value') : path),
    kind,
    before: normalizedBefore,
    after: normalizedAfter,
    beforePresent,
    afterPresent,
    redacted,
  });
}

function normalizeValue(
  value: unknown,
  present: boolean,
  side: SdAuditDiffSide,
  kind: SdAuditDiffKind,
  path: string,
  configPath: string,
  field: SdAuditDiffField | undefined,
  otherValue: unknown
): unknown {
  if (!present) return undefined;
  const mapped = field?.enumMap && hasOwn(field.enumMap, String(value)) ? field.enumMap[String(value)] : value;
  if (!field?.format) return mapped;
  try {
    return field.format(mapped, {
      path,
      configPath,
      side,
      kind,
      before: side === 'before' ? value : otherValue,
      after: side === 'after' ? value : otherValue,
    });
  } catch {
    return mapped;
  }
}

function classifyChange(before: unknown, after: unknown, beforePresent: boolean, afterPresent: boolean): SdAuditDiffKind {
  if (!beforePresent && afterPresent) return 'added';
  if (beforePresent && !afterPresent) return 'removed';
  return deepEqual(before, after) ? 'unchanged' : 'changed';
}

function deepEqual(left: unknown, right: unknown, seen = new WeakMap<object, WeakSet<object>>()): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (!isObject(left) || !isObject(right)) return false;
  let rightSet = seen.get(left);
  if (rightSet?.has(right)) return true;
  if (!rightSet) {
    rightSet = new WeakSet<object>();
    seen.set(left, rightSet);
  }
  rightSet.add(right);
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    return left.every((value, index) => deepEqual(value, right[index], seen));
  }
  if (!isPlainObject(left) || !isPlainObject(right)) return false;
  const leftKeys = Object.keys(left).sort(compareText);
  const rightKeys = Object.keys(right).sort(compareText);
  if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) return false;
  return leftKeys.every(key => deepEqual(left[key], right[key], seen));
}

function compareRows(left: SdAuditDiffRow, right: SdAuditDiffRow, fields: readonly SdAuditDiffField[]): number {
  const leftOrder = explicitOrder(left.configPath, fields);
  const rightOrder = explicitOrder(right.configPath, fields);
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return compareText(left.path, right.path);
}

function explicitOrder(path: string, fields: readonly SdAuditDiffField[]): number {
  const field = fields
    .filter(candidate => Number.isFinite(candidate.order) && isPathOrDescendant(path, candidate.path))
    .sort((left, right) => right.path.length - left.path.length)[0];
  return field?.order ?? Number.POSITIVE_INFINITY;
}

function findExactField(fields: readonly SdAuditDiffField[], path: string): SdAuditDiffField | undefined {
  return fields.find(field => field.path === path);
}

function isConfigured(fields: readonly SdAuditDiffField[], path: string, property: 'hidden' | 'redacted'): boolean {
  return fields.some(field => Boolean(field[property]) && isPathOrDescendant(path, field.path));
}

function isPathOrDescendant(path: string, ancestor: string): boolean {
  return path === ancestor || path.startsWith(`${ancestor}.`) || path.startsWith(`${ancestor}[]`);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(object: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
