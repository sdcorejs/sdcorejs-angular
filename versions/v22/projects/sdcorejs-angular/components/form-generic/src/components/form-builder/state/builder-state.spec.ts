import type { SdFormGenericField, SdFormGenericLayout } from '../../../models/form-generic-field.model';
import { sdValidateSchema } from '../../../models/form-generic-schema';
import type { SdFormGenericGroup, SdFormGenericSchema } from '../../../models/form-generic-schema.model';
import {
  applyVariables,
  duplicateItem,
  insertionIntentFor,
  moveBy,
  moveToContainer,
  removeItem,
  rowAfter,
  setNewRow,
  setSpan,
  ungroup,
} from './builder-commands';
import {
  BuilderDocument,
  BuilderItem,
  childrenOf,
  collectKeys,
  documentFromSchema,
  documentToSchema,
  EMPTY_BUILDER_DOCUMENT,
  randomKey,
  sameDocumentContent,
  SD_FORM_BUILDER_KEY_PATTERN,
  uniqueKey,
} from './builder-document';
import { BuilderHistory } from './builder-history';
import { buildRows, planDrop } from './builder-layout';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(child => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
};
const field = (id: string, span = 12, extra: Record<string, unknown> = {}): SdFormGenericField =>
  ({ id, key: id, type: 'textfield', label: id, layout: { span: { desktop: span } }, ...extra }) as SdFormGenericField;
const group = (id: string, children: SdFormGenericField[] = []): SdFormGenericGroup => ({
  id,
  type: 'group',
  label: id,
  elements: children,
});
const doc = (elements: BuilderItem[], extra: Partial<BuilderDocument> = {}): BuilderDocument => ({
  ...EMPTY_BUILDER_DOCUMENT,
  elements,
  ...extra,
});
const ids = (items: readonly BuilderItem[]) =>
  items.map(item => `${item.id}${(item as { layout?: SdFormGenericLayout }).layout?.newRow ? '^' : ''}`);
const valid = (d: BuilderDocument) =>
  expect(sdValidateSchema(documentToSchema(d)))
    .withContext('emitted schema grammar')
    .toEqual([]);

describe('builder-document', () => {
  it('loads a frozen schema without mutating it and emits unknown properties and elements unchanged', () => {
    const schema = deepFreeze({
      pages: [
        {
          id: 'p1',
          label: 'Main',
          elements: [
            { id: 'a', key: 'a', type: 'textfield', label: 'A', futureOption: { deep: [1, 2] } },
            { id: 's-1', type: 'heading', content: 'Title', level: 2 },
            { type: 'group', label: 'G', elements: [] },
          ],
        },
        { id: 'p2', elements: [] },
      ],
      navigation: { type: 'tabs' },
      variables: [{ key: 'v', label: 'V', note: 'kept' }],
      vendor: { flag: true },
    } as unknown as SdFormGenericSchema);
    const loaded = documentFromSchema(schema);
    const snapshot = documentToSchema(loaded) as unknown as Record<string, any>;
    expect(snapshot['pages'][0].elements[0].futureOption).toEqual({ deep: [1, 2] });
    expect(snapshot['pages'][0].elements[1]).toEqual({ id: 's-1', type: 'heading', content: 'Title', level: 2 });
    expect(snapshot['pages'][0].elements[2].id).toEqual(jasmine.any(String));
    expect(snapshot['pages'][0].label).toBe('Main');
    expect(snapshot['pages'][1]).toEqual({ id: 'p2', elements: [] });
    expect(snapshot['navigation']).toEqual({ type: 'tabs' });
    expect(snapshot['vendor']).toEqual({ flag: true });
    expect(snapshot['variables'][0].note).toBe('kept');
    expect('validations' in snapshot).toBeFalse();
    expect(sdValidateSchema(snapshot)).toEqual([]);
  });

  it('always starts from a page, even for an empty schema', () => {
    const snapshot = documentToSchema(documentFromSchema(undefined));
    expect(snapshot.pages.length).toBe(1);
    expect(snapshot.pages[0].elements).toEqual([]);
  });

  it('compares documents by content regardless of key order', () => {
    const left = doc([field('a')]);
    const reordered = doc([{ layout: { span: { desktop: 12 } }, label: 'a', type: 'textfield', key: 'a', id: 'a' } as SdFormGenericField]);
    expect(sameDocumentContent(left, JSON.parse(JSON.stringify(left)))).toBeTrue();
    expect(sameDocumentContent(left, reordered)).toBeTrue();
    expect(sameDocumentContent(left, doc([field('a', 6)]))).toBeFalse();
  });

  it('collects the keys of the other pages too — a key is unique in the whole schema', () => {
    const loaded = documentFromSchema({
      pages: [
        { id: 'p1', elements: [{ id: 'a', key: 'a', type: 'textfield', label: 'A' }] },
        { id: 'p2', elements: [{ id: 'b', key: 'onPage2', type: 'textfield', label: 'B' }] },
      ],
    } as unknown as SdFormGenericSchema);
    expect([...collectKeys(loaded)].sort()).toEqual(['a', 'onPage2']);
  });

  it('collects keys of fields in groups and variables, and picks unique keys', () => {
    const d = doc([field('a'), group('g', [field('b')])], { variables: [{ key: 'userId', label: 'U' }] });
    expect([...collectKeys(d)].sort()).toEqual(['a', 'b', 'userId']);
    expect(uniqueKey('email', new Set(['email', 'email_2']))).toBe('email_3');
    expect(uniqueKey('2fa code', new Set())).toBe('_2fa_code');
  });

  it('names new fields <type>_<hash>: valid, readable and never a key that is already taken', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      const key = randomKey('email', keys);
      expect(key).toMatch(/^email_[a-z0-9]{6}$/);
      expect(SD_FORM_BUILDER_KEY_PATTERN.test(key)).toBeTrue();
      expect(keys.has(key)).toBeFalse();
      keys.add(key);
    }
    expect(randomKey('chip-string', new Set())).toMatch(/^chip_string_[a-z0-9]{6}$/);
    const values = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
    spyOn(globalThis.crypto, 'getRandomValues').and.callFake(<T extends ArrayBufferView | null>(array: T): T => {
      const bytes = array as unknown as Uint8Array;
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = values.shift() ?? 2;
      return array;
    });
    expect(randomKey('text', new Set(['text_aaaaaa']))).toBe('text_bbbbbb');
  });
});

describe('builder-history', () => {
  const d1 = doc([field('a')]);
  const d2 = doc([field('b')]);
  const d3 = doc([field('c')]);

  it('undoes and redoes whole steps and clears redo after a new change', () => {
    const history = new BuilderHistory();
    history.record(d1);
    history.record(d2);
    expect(history.undo(d3)).toBe(d2);
    expect(history.undo(d2)).toBe(d1);
    expect(history.canUndo).toBeFalse();
    expect(history.redo(d1)).toBe(d2);
    history.record(d2);
    expect(history.canRedo).toBeFalse();
  });

  it('coalesces a typing session under one key within the time window only', () => {
    const history = new BuilderHistory(100, 1000);
    expect(history.record(d1, { coalesceKey: 'label', now: 0 })).toBeTrue();
    expect(history.record(d2, { coalesceKey: 'label', now: 500 })).toBeFalse();
    expect(history.record(d2, { coalesceKey: 'label', now: 2000 })).toBeTrue();
    history.seal();
    expect(history.record(d3, { coalesceKey: 'label', now: 2100 })).toBeTrue();
    expect(history.size.past).toBe(3);
  });
});

describe('builder-commands', () => {
  it('duplicates a group with new ids/keys and remaps ONLY its internal references', () => {
    const dependent = field('district', 6, {
      rules: {
        visible: { field: 'city', operator: 'NOT_NULL' },
        hidden: { field: 'outside', operator: 'NULL' },
      },
    });
    const start = deepFreeze(doc([field('outside'), group('g', [field('city', 6), dependent])]));
    const result = duplicateItem(start, 'g', 'desktop');
    if (!result.ok) throw new Error(result.reason);
    const copy = result.plan.doc.elements.filter(item => item.type === 'group')[1] as SdFormGenericGroup;
    expect(copy.id).not.toBe('g');
    const [copyCity, copyDistrict] = copy.elements as SdFormGenericField[];
    expect(copyCity.key).toBe('city_2');
    expect(copyDistrict.key).toBe('district_2');
    expect(copyCity.id).not.toBe('city');
    expect(copyDistrict.rules?.visible).toEqual({ field: 'city_2', operator: 'NOT_NULL' });
    expect(copyDistrict.rules?.hidden).toEqual({ field: 'outside', operator: 'NULL' });
    valid(result.plan.doc);
  });

  it('moves the row start of a removed field to the field after it', () => {
    const start = doc([field('a', 6), field('x', 6, { layout: { span: { desktop: 6 }, newRow: true } }), field('c', 6)]);
    const next = removeItem(start, 'x');
    expect(ids(next.elements)).toEqual(['a', 'c^']);
    expect(buildRows(next.elements).map(row => row.items.map(item => item.id))).toEqual([['a'], ['c']]);
    valid(next);
  });

  it('removes a field without pulling the following rows up', () => {
    const nextRowUp = removeItem(doc([field('a', 6), field('s', 6), field('c', 6)]), 's');
    expect(buildRows(nextRowUp.elements).map(row => row.items.map(item => item.id))).toEqual([['a'], ['c']]);
    // s heads its row (x + s does not fit); b would fit after x once s is gone.
    const headRemoved = removeItem(doc([field('x', 8), field('s', 6), field('b', 4)]), 's');
    expect(buildRows(headRemoved.elements).map(row => row.items.map(item => item.id))).toEqual([['x'], ['b']]);
    valid(headRemoved);
  });

  it('saves the variables dialog: a renamed variable carries its references, swapped keys do not collide', () => {
    const rules = { visible: { field: 'tenant', operator: 'EQUAL', data: 't1' } };
    const start = doc([field('a', 12, { rules }), field('b', 12, { rules: { visible: { field: 'role', operator: 'NULL' } } })], {
      variables: [
        { key: 'tenant', label: 'Tenant' },
        { key: 'role', label: 'Role' },
      ],
    });
    const [tenant, role] = start.variables;
    const renamed = applyVariables(start, [
      { source: tenant, key: 'role', label: 'Tenant' },
      { source: role, key: 'tenant', label: 'Role' },
    ]);
    expect(renamed.variables.map(variable => variable.key)).toEqual(['role', 'tenant']);
    expect((renamed.elements[0] as SdFormGenericField).rules!.visible).toEqual({ field: 'role', operator: 'EQUAL', data: 't1' });
    expect((renamed.elements[1] as SdFormGenericField).rules!.visible).toEqual({ field: 'tenant', operator: 'NULL' });
    valid(renamed);
  });

  it('ungroups in place without letting children flow into neighbouring rows', () => {
    const start = doc([field('a', 6), group('g', [field('c1', 6), field('c2', 6)]), field('b', 6)]);
    const result = ungroup(start, 'g');
    expect(buildRows(result.elements).map(row => row.items.map(item => item.id))).toEqual([['a'], ['c1', 'c2'], ['b']]);
    valid(result);
  });

  it('ungroups without merging rows at ANY level, not only the one being viewed', () => {
    // a and c1 are full width on desktop but half width on tablet: only a newRow keeps c1 off a's row there.
    const half = { layout: { span: { desktop: 12, tablet: 6 } } };
    const start = doc([field('a', 12, half), group('g', [field('c1', 12, half)])]);
    const result = ungroup(start, 'g');
    expect(ids(result.elements)).toEqual(['a', 'c1^']);
    expect(buildRows(result.elements, 'tablet').map(row => row.items.map(item => item.id))).toEqual([['a'], ['c1']]);
  });

  it('gives a duplicated group unique keys, also for a child of a type this version does not know', () => {
    const unknownChild = { id: 'h', key: 'rating', type: 'rating', label: 'Rating' } as unknown as SdFormGenericField;
    const start = doc([group('g', [field('name'), unknownChild])]);
    const result = duplicateItem(start, 'g', 'desktop');
    if (!result.ok) throw new Error(result.reason);
    valid(result.plan.doc);
    const copy = result.plan.doc.elements[1] as SdFormGenericGroup;
    expect((copy.elements[1] as { key?: string }).key).not.toBe('rating');
  });

  it('never edits the layout of an element of an unknown type', () => {
    const start = doc([field('a', 6), { id: 'h', type: 'heading', layout: { span: { desktop: 6 } } } as unknown as BuilderItem]);
    expect(setNewRow(start, 'h', true)).toBe(start);
    expect(setSpan(start, 'h', 4, 'desktop')).toBe(start);
  });

  it('drops an empty layout instead of emitting `layout: {}`', () => {
    const start = doc([field('a', 6), field('b', 6, { layout: { newRow: true } })]);
    expect('layout' in setSpan(start, 'a', null, 'desktop').elements[0]).toBeFalse();
    expect('layout' in setNewRow(start, 'b', false).elements[1]).toBeFalse();
  });

  it('moves up/down by swapping siblings', () => {
    const start = doc([field('a'), field('b'), field('c')]);
    expect(ids(moveBy(start, 'b', -1).elements)).toEqual(['b', 'a', 'c']);
    expect(moveBy(start, 'a', -1)).toBe(start);
  });

  it('changes only the span of the level being edited and clears it back to inheritance', () => {
    const start = deepFreeze(doc([field('a', 6, { layout: { span: { desktop: 6, mobile: 12 } } })]));
    const tablet = setSpan(start, 'a', 4, 'tablet');
    expect((tablet.elements[0] as SdFormGenericField).layout).toEqual({ span: { desktop: 6, tablet: 4, mobile: 12 } });
    const cleared = setSpan(tablet, 'a', null, 'tablet');
    expect((cleared.elements[0] as SdFormGenericField).layout).toEqual({ span: { desktop: 6, mobile: 12 } });
    expect((start.elements[0] as SdFormGenericField).layout).toEqual({ span: { desktop: 6, mobile: 12 } });
  });

  it('toggles "start a new row" instead of inserting a break element', () => {
    const start = doc([field('a', 4), field('b', 4)]);
    const on = setNewRow(start, 'b', true);
    expect(ids(on.elements)).toEqual(['a', 'b^']);
    expect(buildRows(on.elements).map(row => row.items.map(item => item.id))).toEqual([['a'], ['b']]);
    expect(setNewRow(on, 'b', true)).toBe(on);
    expect(ids(setNewRow(on, 'b', false).elements)).toEqual(['a', 'b']);
    valid(on);
  });

  it('adds after the selected field, into a selected group, or at the end — same intent as drag', () => {
    const start = doc([field('a', 6), field('b', 6), group('g', [field('c')])]);
    expect(insertionIntentFor(start, null, field('x'), 'desktop')).toEqual({ kind: 'row', parentId: null, beforeRowKey: null });
    expect(insertionIntentFor(start, 'a', field('x'), 'desktop')).toEqual(rowAfter(start, 'a', 'desktop')!);
    expect(insertionIntentFor(start, 'g', field('x'), 'desktop')).toEqual({ kind: 'row', parentId: 'g', beforeRowKey: null });
    expect(insertionIntentFor(start, 'c', group('g2'), 'desktop')).toEqual({ kind: 'row', parentId: null, beforeRowKey: null });
    const added = planDrop(start, insertionIntentFor(start, 'a', field('x'), 'desktop'), { kind: 'new', item: field('x') });
    expect(added.ok && ids(added.plan.doc.elements)).toEqual(['a', 'b', 'x', 'g']);
  });

  it('moves a field out of its group to the page exactly once (drag and menu)', () => {
    const start = doc([group('g', [field('c1', 6), field('c2', 6)]), field('b', 12)]);
    const dragged = planDrop(start, { kind: 'row', parentId: null, beforeRowKey: 'b' }, { kind: 'move', id: 'c2' });
    if (!dragged.ok) throw new Error(dragged.reason);
    expect(ids(dragged.plan.doc.elements)).toEqual(['g', 'c2', 'b']);
    expect(ids(childrenOf(dragged.plan.doc, 'g'))).toEqual(['c1']);
    const viaMenu = moveToContainer(start, 'c1', null, 'desktop');
    if (!viaMenu.ok) throw new Error(viaMenu.reason);
    expect(ids(viaMenu.plan.doc.elements)).toEqual(['g', 'b', 'c1']);
    expect(ids(childrenOf(viaMenu.plan.doc, 'g'))).toEqual(['c2']);
    expect(JSON.stringify(viaMenu.plan.doc).split('"id":"c1"').length - 1).toBe(1);
    valid(viaMenu.plan.doc);
  });

  it('moves a field between groups and from the page into a group as a new row', () => {
    const start = doc([group('g1', [field('a', 6)]), group('g2', [field('b', 6)]), field('r', 6)]);
    const across = moveToContainer(start, 'a', 'g2', 'desktop');
    if (!across.ok) throw new Error(across.reason);
    expect(ids(childrenOf(across.plan.doc, 'g1'))).toEqual([]);
    expect(ids(childrenOf(across.plan.doc, 'g2'))).toEqual(['b', 'a^']);
    const intoGroup = moveToContainer(start, 'r', 'g1', 'desktop');
    if (!intoGroup.ok) throw new Error(intoGroup.reason);
    expect(ids(intoGroup.plan.doc.elements)).toEqual(['g1', 'g2']);
    expect(ids(childrenOf(intoGroup.plan.doc, 'g1'))).toEqual(['a', 'r^']);
    valid(intoGroup.plan.doc);
  });
});
