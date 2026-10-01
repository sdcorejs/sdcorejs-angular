import type { Filter } from '@sdcorejs/utils/models';
import type { SdFormGenericParam, SdFormGenericRules, SdFormGenericValueRef } from '../models/form-generic-field.model';
import { sdSchemaFields } from '../models/form-generic-schema';
import type { SdFormGenericSchema } from '../models/form-generic-schema.model';

// why: every reference to a field or variable key is structured (Filter.field, field-to-field Filter
// data, value refs, fill targets), so renaming a key can update all of them. Only hyperlink and html
// content keep `${key}` inside free text: those are counted for the confirmation, never rewritten.

export type SdFormGenericReferenceWhere =
  | 'rule'
  | 'group-rule'
  | 'page-rule'
  | 'options-param'
  | 'options-fill'
  | 'upload-param'
  | 'html-query'
  | 'validation'
  | 'hyperlink'
  | 'html-content';

export interface SdFormGenericKeyReference {
  /** Id của phần tử chứa tham chiếu; `null` với validation cấp form. */
  elementId: string | null;
  where: SdFormGenericReferenceWhere;
  kind: 'structured' | 'text';
}

type Json = Record<string, unknown>;

interface ReferenceVisitor {
  filter: (filter: Filter, where: SdFormGenericReferenceWhere, elementId: string | null) => void;
  ref: (ref: SdFormGenericValueRef, where: SdFormGenericReferenceWhere, elementId: string | null) => void;
  fill: (fill: { field: string }, elementId: string) => void;
  text: (text: string, where: SdFormGenericReferenceWhere, elementId: string) => void;
}

const RULE_KEYS: (keyof SdFormGenericRules)[] = ['visible', 'hidden', 'disabled', 'required'];

// why: the walkers accept the same hand-edited JSON the evaluator tolerates (null entries, a string where
// a ref object is expected) — they skip what is not an object instead of throwing in the builder.
const isObject = (value: unknown): value is Json => !!value && typeof value === 'object';

const visitRules = (
  rules: SdFormGenericRules | undefined,
  where: SdFormGenericReferenceWhere,
  elementId: string,
  visitor: ReferenceVisitor
) => {
  for (const name of RULE_KEYS) if (rules?.[name]) visitor.filter(rules[name] as Filter, where, elementId);
};

const visitParams = (params: unknown, where: SdFormGenericReferenceWhere, elementId: string, visitor: ReferenceVisitor) => {
  for (const param of Array.isArray(params) ? (params as SdFormGenericParam[]) : [])
    if (isObject(param?.value)) visitor.ref(param.value, where, elementId);
};

const visitElement = (element: Json, visitor: ReferenceVisitor) => {
  const id = String(element['id'] ?? '');
  visitRules(element['rules'] as SdFormGenericRules | undefined, element['type'] === 'group' ? 'group-rule' : 'rule', id, visitor);
  const options = element['options'] as Json | undefined;
  if (options?.['source'] === 'catalog') {
    visitParams(options['params'], 'options-param', id, visitor);
    for (const fill of Array.isArray(options['fill']) ? (options['fill'] as { field: string }[]) : [])
      if (isObject(fill)) visitor.fill(fill, id);
  }
  if (element['type'] === 'upload') visitParams(element['params'], 'upload-param', id, visitor);
  if (element['type'] === 'html') {
    visitParams(element['query'], 'html-query', id, visitor);
    if (typeof element['content'] === 'string') visitor.text(element['content'], 'html-content', id);
  }
  if (typeof element['hyperlink'] === 'string') visitor.text(element['hyperlink'], 'hyperlink', id);
};

const visitSchema = (schema: SdFormGenericSchema, visitor: ReferenceVisitor) => {
  for (const page of schema.pages ?? []) {
    if (!isObject(page)) continue;
    visitRules(page.rules, 'page-rule', page.id, visitor);
    for (const element of (Array.isArray(page.elements) ? page.elements : []) as unknown[]) {
      if (!isObject(element)) continue;
      visitElement(element, visitor);
      if (element['type'] === 'group' && Array.isArray(element['elements']))
        for (const child of element['elements'] as unknown[]) if (isObject(child)) visitElement(child, visitor);
    }
  }
  for (const validation of schema.validations ?? [])
    if (validation?.type === 'filter' && validation.filter) visitor.filter(validation.filter, 'validation', null);
};

const filterLeaves = (filter: Filter, onLeaf: (leaf: Json) => void) => {
  if (!isObject(filter)) return;
  if (filter.operator === 'AND' || filter.operator === 'OR') {
    for (const child of Array.isArray(filter.data) ? filter.data : []) filterLeaves(child, onLeaf);
    return;
  }
  onLeaf(filter as unknown as Json);
};

const refersTo = (ref: SdFormGenericValueRef, key: string): boolean =>
  ('field' in ref && ref.field === key) || ('variable' in ref && ref.variable === key);

/** Mọi tham chiếu tới `key`: có cấu trúc (sẽ được đổi) và chuỗi tự do `${key}` (chỉ đếm). */
export const sdFindKeyReferences = (schema: SdFormGenericSchema, key: string): SdFormGenericKeyReference[] => {
  const references: SdFormGenericKeyReference[] = [];
  const token = '${' + key + '}';
  visitSchema(schema, {
    filter: (filter, where, elementId) =>
      filterLeaves(filter, leaf => {
        if (leaf['field'] === key) references.push({ elementId, where, kind: 'structured' });
        if (leaf['dataType'] === 'field' && leaf['data'] === key) references.push({ elementId, where, kind: 'structured' });
      }),
    ref: (ref, where, elementId) => {
      if (refersTo(ref, key)) references.push({ elementId, where, kind: 'structured' });
    },
    fill: (fill, elementId) => {
      if (fill.field === key) references.push({ elementId, where: 'options-fill', kind: 'structured' });
    },
    text: (text, where, elementId) => {
      if (text.includes(token)) references.push({ elementId, where, kind: 'text' });
    },
  });
  return references;
};

/**
 * Schema mới đã đổi key `from` thành `to` (field hoặc biến) cùng mọi tham chiếu có cấu trúc.
 * Ném lỗi khi `to` đã là key của field hoặc biến khác. Không mutate input.
 */
export const sdRenameKey = (schema: SdFormGenericSchema, from: string, to: string): SdFormGenericSchema => {
  const taken = new Set([...sdSchemaFields(schema).map(field => field.key), ...(schema.variables ?? []).map(variable => variable?.key)]);
  if (from !== to && taken.has(to)) throw new Error(`Key "${to}" already exists`);
  const next = structuredClone(schema);
  if (from === to) return next;
  visitSchema(next, {
    filter: filter =>
      filterLeaves(filter, leaf => {
        if (leaf['field'] === from) leaf['field'] = to;
        if (leaf['dataType'] === 'field' && leaf['data'] === from) leaf['data'] = to;
      }),
    ref: ref => {
      const record = ref as unknown as Json;
      if (record['field'] === from) record['field'] = to;
      if (record['variable'] === from) record['variable'] = to;
    },
    fill: fill => {
      if (fill.field === from) fill.field = to;
    },
    text: () => undefined,
  });
  for (const field of sdSchemaFields(next)) if (field.key === from) (field as { key?: string }).key = to;
  for (const variable of next.variables ?? []) if (variable?.key === from) variable.key = to;
  return next;
};
