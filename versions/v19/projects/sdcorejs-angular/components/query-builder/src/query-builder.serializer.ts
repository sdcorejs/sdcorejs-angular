import { DateRelative, Filter, Operator } from '@sdcorejs/utils/models';
import {
  isQbGroup,
  QB_MULTI_OPERATORS,
  QB_NO_DATA_OPERATORS,
  QB_TODAY,
  qbIsRelativeDate,
  qbIsToday,
  qbSupportsFieldCompareOperator,
  QbGroup,
  QbNode,
  QbRule,
  QbToday,
  QbToken,
  qbNewGroup,
  qbNewRule,
  SdQueryBuilderField,
} from './query-builder.model';

// SQL symbol for each single-value comparison operator.
const SYMBOL: Partial<Record<Operator, string>> = {
  EQUAL: '=',
  NOT_EQUAL: '!=',
  GREATER_THAN: '>',
  LESS_THAN: '<',
  GREATER_OR_EQUAL: '>=',
  LESS_OR_EQUAL: '<=',
};

const LIKE_OPERATORS: Operator[] = ['CONTAIN', 'NOT_CONTAIN', 'START_WITH', 'NOT_START_WITH', 'END_WITH', 'NOT_END_WITH'];

/** A `Filter` is a logical group when its operator is AND / OR and it carries a `data[]`. */
function isAndOr(filter: any): filter is { operator: 'AND' | 'OR'; data: Filter[] } {
  return !!filter && (filter.operator === 'AND' || filter.operator === 'OR') && Array.isArray(filter.data);
}

function isEmptyValue(v: any): boolean {
  return v === null || v === undefined || v === '';
}

// ---------------------------------------------------------------------------
// Internal tree → public Filter
// ---------------------------------------------------------------------------

function ruleToFilter(rule: QbRule): Filter | null {
  if (!rule.field || !rule.operator) return null;
  const operator = rule.operator;

  if (QB_NO_DATA_OPERATORS.includes(operator)) {
    return { field: rule.field as any, operator } as Filter;
  }

  if (rule.valueSource === 'field') {
    if (!qbSupportsFieldCompareOperator(operator) || isEmptyValue(rule.compareField)) return null;
    return { field: rule.field as any, operator, dataType: 'field', data: rule.compareField } as Filter;
  }

  if (operator === 'BETWEEN') {
    const v = rule.value;
    if (!v || typeof v !== 'object') return null;
    if (isEmptyValue(v.from) || isEmptyValue(v.to)) return null;
    return { field: rule.field as any, operator: 'BETWEEN', data: { from: v.from, to: v.to } } as Filter;
  }

  if (QB_MULTI_OPERATORS.includes(operator)) {
    const arr = Array.isArray(rule.value) ? rule.value : isEmptyValue(rule.value) ? [] : [rule.value];
    if (!arr.length) return null;
    return { field: rule.field as any, operator, data: arr } as Filter;
  }

  if (qbIsToday(rule.value)) {
    return { field: rule.field as any, operator, dataType: 'date-today', data: QB_TODAY } as Filter;
  }

  if (qbIsRelativeDate(rule.value)) {
    const v = rule.value;
    // emit only when fully specified, else drop the incomplete rule
    if (v.unit && v.direction && typeof v.amount === 'number' && v.amount >= 1) {
      return {
        field: rule.field as any,
        operator,
        dataType: 'date-relative',
        data: { amount: v.amount, direction: v.direction, unit: v.unit },
      } as Filter;
    }
    return null;
  }

  // A non-relative plain object is an incomplete/stray shape (e.g. a partial offset) — drop it.
  if (rule.value !== null && typeof rule.value === 'object' && !Array.isArray(rule.value)) return null;
  if (isEmptyValue(rule.value)) return null;
  return { field: rule.field as any, operator, data: rule.value } as Filter;
}

function nodeToFilter(node: QbNode): Filter | null {
  if (isQbGroup(node)) {
    const data = node.children.map(nodeToFilter).filter((f): f is Filter => f != null);
    if (!data.length) return null;
    return { operator: node.logic, data } as Filter;
  }
  return ruleToFilter(node);
}

/**
 * Map the internal builder tree to the public `Filter` (the root is always a
 * `FilterAndOr`). Rules missing field / operator / value — and empty nested
 * groups — are dropped so the result is always a valid `Filter`.
 *
 * @param group - the editable tree's root group.
 * @returns the canonical nested `Filter`, or `null` when no complete rule survives.
 */
export function treeToFilter(group: QbGroup): Filter | null {
  return nodeToFilter(group);
}

// ---------------------------------------------------------------------------
// Public Filter → internal tree (for seeding [value])
// ---------------------------------------------------------------------------

function ruleFromFilter(filter: any): QbRule {
  const operator = filter.operator as Operator;
  if (QB_NO_DATA_OPERATORS.includes(operator)) {
    return qbNewRule(filter.field, operator);
  }
  if (filter.dataType === 'field') {
    return qbNewRule(filter.field, operator, undefined, 'field', filter.data);
  }
  // Relative dates: read the utils `dataType` discriminator back into the internal value.
  if (filter.dataType === 'date-today') {
    return qbNewRule(filter.field, operator, QB_TODAY);
  }
  if (filter.dataType === 'date-relative') {
    return qbNewRule(filter.field, operator, filter.data);
  }
  // Back-compat: legacy `{ rel: 'now' | 'offset' }` payloads (pre-dataType migration)
  // still seed the editor correctly.
  const legacy = readLegacyRelative(filter.data);
  if (legacy !== undefined) {
    return qbNewRule(filter.field, operator, legacy);
  }
  return qbNewRule(filter.field, operator, filter.data);
}

/** Map a pre-migration `{ rel }` payload to the new internal value, or `undefined` if not legacy. */
function readLegacyRelative(data: any): QbToday | DateRelative | undefined {
  if (!data || typeof data !== 'object') return undefined;
  if (data.rel === 'now') return QB_TODAY;
  if (data.rel === 'offset' && data.unit && data.direction && typeof data.amount === 'number') {
    return { amount: data.amount, direction: data.direction, unit: data.unit };
  }
  return undefined;
}

function nodeFromFilter(filter: Filter): QbNode {
  return isAndOr(filter) ? groupFromFilter(filter) : ruleFromFilter(filter);
}

function groupFromFilter(filter: { operator: 'AND' | 'OR'; data: Filter[] }): QbGroup {
  return qbNewGroup(filter.operator, filter.data.map(nodeFromFilter));
}

/**
 * Inverse of {@link treeToFilter} — rebuild the editable tree from a `Filter` so a
 * consumer can seed `[value]`. A non-group (bare) filter is wrapped in an AND root;
 * `null` yields an empty AND root.
 *
 * @param filter - a `Filter` (group or leaf), or `null` / `undefined` for an empty tree.
 * @returns a fresh root `QbGroup` mirroring the filter's structure.
 */
export function filterToTree(filter: Filter | null | undefined): QbGroup {
  if (!filter) return qbNewGroup('AND', []);
  if (isAndOr(filter)) return groupFromFilter(filter);
  return qbNewGroup('AND', [ruleFromFilter(filter)]);
}

// ---------------------------------------------------------------------------
// Public Filter → SQL-ish highlight tokens (view mode)
// ---------------------------------------------------------------------------

function escapeStr(s: string): string {
  return s.replace(/'/g, "''");
}

const REL_UNIT_VI: Record<DateRelative['unit'], string> = { hour: 'giờ', day: 'ngày', week: 'tuần', month: 'tháng' };

/** Render a relative-date offset as readable Vietnamese for the view string. */
function formatRelative(v: DateRelative): string {
  const unit = REL_UNIT_VI[v.unit] ?? REL_UNIT_VI.day;
  const dir = v.direction === 'next' ? 'tới' : 'trước';
  return `${v.amount} ${unit} ${dir}`;
}

/** Format one scalar value for the view string — quoted/labelled per field type. */
function formatScalar(field: SdQueryBuilderField | undefined, raw: any): string {
  if (qbIsToday(raw)) return 'hôm nay';
  if (qbIsRelativeDate(raw)) return formatRelative(raw);
  if (raw === null || raw === undefined) return '';
  if (field?.type === 'boolean') {
    return raw ? (field.trueLabel ?? 'Có') : (field.falseLabel ?? 'Không');
  }
  if (field?.type === 'values') {
    const opt = field.values?.find(o => o.value === raw);
    return `'${escapeStr(opt ? opt.display : String(raw))}'`;
  }
  if (field?.type === 'number' || typeof raw === 'number' || typeof raw === 'boolean') {
    return String(raw);
  }
  // string / date / datetime / unknown → quoted
  return `'${escapeStr(String(raw))}'`;
}

function likePattern(operator: Operator, raw: string): string {
  const esc = escapeStr(raw);
  if (operator === 'CONTAIN' || operator === 'NOT_CONTAIN') return `'%${esc}%'`;
  if (operator === 'START_WITH' || operator === 'NOT_START_WITH') return `'${esc}%'`;
  return `'%${esc}'`; // END_WITH / NOT_END_WITH
}

function operatorToken(operator: Operator): string {
  if (LIKE_OPERATORS.includes(operator)) return operator.startsWith('NOT_') ? 'not like' : 'like';
  return SYMBOL[operator] ?? operator;
}

function ruleTokens(filter: any, fields: SdQueryBuilderField[]): QbToken[] {
  const field = fields.find(f => f.key === filter.field);
  const out: QbToken[] = [{ kind: 'field', text: field?.label ?? String(filter.field) }];
  const sp = () => out.push({ kind: 'plain', text: ' ' });
  const operator = filter.operator as Operator;

  if (QB_NO_DATA_OPERATORS.includes(operator)) {
    sp();
    out.push({ kind: 'op', text: operator === 'NULL' ? 'is null' : 'is not null' });
    return out;
  }

  if (operator === 'BETWEEN') {
    sp();
    out.push({ kind: 'op', text: 'between' });
    sp();
    out.push({ kind: 'value', text: formatScalar(field, filter.data?.from) });
    out.push({ kind: 'plain', text: ' and ' });
    out.push({ kind: 'value', text: formatScalar(field, filter.data?.to) });
    return out;
  }

  if (QB_MULTI_OPERATORS.includes(operator)) {
    sp();
    out.push({ kind: 'op', text: operator === 'IN' ? 'in' : 'not in' });
    sp();
    const arr: any[] = Array.isArray(filter.data) ? filter.data : [];
    out.push({ kind: 'value', text: `(${arr.map((v: any) => formatScalar(field, v)).join(', ')})` });
    return out;
  }

  if (filter.dataType === 'field') {
    const compareField = fields.find(f => f.key === filter.data);
    sp();
    out.push({ kind: 'op', text: operatorToken(operator) });
    sp();
    out.push({ kind: 'field', text: compareField?.label ?? String(filter.data) });
    return out;
  }

  if (LIKE_OPERATORS.includes(operator)) {
    sp();
    out.push({ kind: 'op', text: operatorToken(operator) });
    sp();
    out.push({ kind: 'value', text: likePattern(operator, String(filter.data ?? '')) });
    return out;
  }

  sp();
  out.push({ kind: 'op', text: operatorToken(operator) });
  sp();
  out.push({ kind: 'value', text: formatScalar(field, filter.data) });
  return out;
}

function tokensFor(filter: Filter, fields: SdQueryBuilderField[]): QbToken[] {
  if (isAndOr(filter)) {
    const out: QbToken[] = [];
    filter.data.forEach((child, i) => {
      if (i > 0) out.push({ kind: 'logic', text: ` ${filter.operator.toLowerCase()} ` });
      const childTokens = tokensFor(child, fields);
      // Wrap a nested multi-child group in parentheses; a single-child group needs none.
      if (isAndOr(child) && child.data.length > 1) {
        out.push({ kind: 'paren', text: '(' }, ...childTokens, { kind: 'paren', text: ')' });
      } else {
        out.push(...childTokens);
      }
    });
    return out;
  }
  return ruleTokens(filter, fields);
}

/**
 * Render a `Filter` to a SQL-ish token stream for view mode. Field tokens use the
 * matching field's `label`; operators map to SQL syntax (`= != like between is null …`);
 * `and` / `or` are lowercase; nested multi-child groups are wrapped in parentheses.
 * Returns a token stream (not a string) so the template can wrap each piece in a
 * highlight `<span>` keyed by `QbToken.kind`.
 *
 * @param filter - the `Filter` to render, or `null` / `undefined`.
 * @param fields - field metadata, used to resolve each field key to its display label + value formatting.
 * @returns the ordered tokens, or `[]` when `filter` is empty.
 */
export function filterToTokens(filter: Filter | null | undefined, fields: SdQueryBuilderField[]): QbToken[] {
  if (!filter) return [];
  return tokensFor(filter, fields);
}
