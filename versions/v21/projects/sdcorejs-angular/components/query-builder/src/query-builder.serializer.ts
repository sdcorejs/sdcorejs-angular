/* eslint-disable @typescript-eslint/no-explicit-any */
import { Filter, Operator } from '@sdcorejs/utils/models';
import {
  isQbGroup,
  QB_MULTI_OPERATORS,
  QB_NO_DATA_OPERATORS,
  qbIsRelativeDate,
  QbGroup,
  QbNode,
  QbRule,
  QbToken,
  qbNewGroup,
  qbNewRule,
  SdQbRelativeDate,
  SdQbRelativeUnit,
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

  if (qbIsRelativeDate(rule.value)) {
    const v = rule.value;
    if (v.rel === 'now') return { field: rule.field as any, operator, data: { rel: 'now' } } as Filter;
    // offset — only emit when fully specified, else drop the incomplete rule
    if (v.unit && v.direction && typeof v.amount === 'number' && v.amount >= 1) {
      return {
        field: rule.field as any,
        operator,
        data: { rel: 'offset', unit: v.unit, amount: v.amount, direction: v.direction },
      } as Filter;
    }
    return null;
  }

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
  return qbNewRule(filter.field, operator, filter.data);
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

const REL_UNIT_VI: Record<SdQbRelativeUnit, string> = { day: 'ngày', week: 'tuần', month: 'tháng' };

/** Render a relative-date spec as readable Vietnamese for the view string. */
function formatRelative(v: SdQbRelativeDate): string {
  if (v.rel === 'now') return 'hôm nay';
  const unit = REL_UNIT_VI[v.unit ?? 'day'];
  const dir = v.direction === 'next' ? 'tới' : 'trước';
  return `${v.amount ?? 1} ${unit} ${dir}`;
}

/** Format one scalar value for the view string — quoted/labelled per field type. */
function formatScalar(field: SdQueryBuilderField | undefined, raw: any): string {
  if (qbIsRelativeDate(raw)) return formatRelative(raw);
  if (raw === null || raw === undefined) return '';
  if (field?.type === 'boolean') {
    return raw ? field.trueLabel ?? 'Có' : field.falseLabel ?? 'Không';
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

  if (LIKE_OPERATORS.includes(operator)) {
    sp();
    out.push({ kind: 'op', text: operator.startsWith('NOT_') ? 'not like' : 'like' });
    sp();
    out.push({ kind: 'value', text: likePattern(operator, String(filter.data ?? '')) });
    return out;
  }

  sp();
  out.push({ kind: 'op', text: SYMBOL[operator] ?? operator });
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
