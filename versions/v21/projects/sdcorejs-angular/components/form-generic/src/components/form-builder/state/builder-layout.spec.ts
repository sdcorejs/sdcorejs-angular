import { sdPackRows } from '../../../layout/form-generic-layout';
import type { SdFormGenericField, SdFormGenericLayout } from '../../../models/form-generic-field.model';
import type { SdFormGenericGroup } from '../../../models/form-generic-schema.model';
import { BuilderDocument, BuilderItem, childrenOf, EMPTY_BUILDER_DOCUMENT } from './builder-document';
import { buildRows, CanvasGeometry, DropIntent, hitTest, itemSpan, LayoutRow, planDrop } from './builder-layout';

const field = (id: string, span = 12, extra: Record<string, unknown> = {}): SdFormGenericField =>
  ({ id, key: id, type: 'textfield', label: id, layout: { span: { desktop: span } }, ...extra }) as SdFormGenericField;
const withLayout = (item: SdFormGenericField, layout: SdFormGenericLayout) => ({ ...item, layout }) as SdFormGenericField;
const group = (id: string, children: SdFormGenericField[] = []): SdFormGenericGroup => ({
  id,
  type: 'group',
  label: id,
  elements: children,
});
const doc = (elements: BuilderItem[]): BuilderDocument => ({ ...EMPTY_BUILDER_DOCUMENT, elements });

const shape = (rows: readonly LayoutRow[]) => rows.map(row => row.items.map(item => item.id));
/** id, với `^` khi phần tử bật `newRow`. */
const ids = (items: readonly BuilderItem[]) =>
  items.map(item => `${item.id}${(item as { layout?: SdFormGenericLayout }).layout?.newRow ? '^' : ''}`);

describe('builder-layout · buildRows', () => {
  it('packs fields greedily into 12-column rows exactly like the renderer', () => {
    const rows = buildRows([field('a', 6), field('b', 6), field('c', 4), field('d', 12), field('e', 7), field('f', 6)]);
    expect(shape(rows)).toEqual([['a', 'b'], ['c'], ['d'], ['e'], ['f']]);
    expect(rows.map(row => row.used)).toEqual([12, 4, 12, 7, 6]);
  });

  it('starts a new row at newRow and gives a group its own full-width row', () => {
    const rows = buildRows([field('a', 4), withLayout(field('b', 4), { span: { desktop: 4 }, newRow: true }), group('g'), field('c', 6)]);
    expect(shape(rows)).toEqual([['a'], ['b'], ['g'], ['c']]);
    expect(rows[2].kind).toBe('group');
    expect(itemSpan(group('g'))).toBe(12);
  });

  it('inherits tablet from desktop and defaults mobile to 12', () => {
    const items = [
      field('a', 6),
      field('b', 6),
      withLayout(field('c', 6), { span: { desktop: 6, mobile: 6 } }),
      withLayout(field('d', 6), { span: { desktop: 6, mobile: 6 } }),
    ];
    expect(shape(buildRows(items, 'tablet'))).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(shape(buildRows(items, 'mobile'))).toEqual([['a'], ['b'], ['c', 'd']]);
  });

  it('gives the canvas exactly the rows of the renderer layout function at every level', () => {
    const items = [
      field('a', 6),
      withLayout(field('b', 4), { span: { desktop: 4, tablet: 6 } }),
      withLayout(field('c', 3), { span: { desktop: 3 }, newRow: true }),
      group('g'),
      field('d', 8),
    ];
    for (const level of ['desktop', 'tablet', 'mobile'] as const) {
      expect(shape(buildRows(items, level)))
        .withContext(level)
        .toEqual(sdPackRows(items, level).map(row => row.map(cell => cell.element.id)));
    }
  });

  it('applies a transient resize override only in its own level', () => {
    const items = [field('a', 6), field('b', 6)];
    expect(shape(buildRows(items, 'desktop', { id: 'a', span: 8, mode: 'desktop' }))).toEqual([['a'], ['b']]);
    expect(shape(buildRows(items, 'tablet', { id: 'a', span: 8, mode: 'desktop' }))).toEqual([['a', 'b']]);
    expect(buildRows(items, 'desktop', { id: 'a', span: 8, mode: 'desktop' })[0].items[0]).toBe(items[0]);
  });
});

describe('builder-layout · planDrop', () => {
  const plan = (
    d: BuilderDocument,
    intent: DropIntent,
    subject: Parameters<typeof planDrop>[2],
    mode: Parameters<typeof planDrop>[3] = 'desktop'
  ) => {
    const result = planDrop(d, intent, subject, mode);
    if (!result.ok) throw new Error(`rejected: ${result.reason}`);
    return result.plan;
  };

  it('inserts a new row between rows without merging into neighbours, adding the fewest newRow flags', () => {
    const start = doc([field('a', 6), field('b', 6), field('c', 6)]);
    const result = plan(start, { kind: 'row', parentId: null, beforeRowKey: 'c' }, { kind: 'new', item: field('x', 6) });
    expect(ids(result.doc.elements)).toEqual(['a', 'b', 'x', 'c^']);
    expect(result.insertedRowStarts).toBe(1);
    expect(shape(buildRows(result.doc.elements))).toEqual([['a', 'b'], ['x'], ['c']]);
  });

  it('starts the new row itself when the previous row still has room', () => {
    const start = doc([field('a', 6), field('c', 12)]);
    const result = plan(start, { kind: 'row', parentId: null, beforeRowKey: 'c' }, { kind: 'new', item: field('x', 6) });
    expect(ids(result.doc.elements)).toEqual(['a', 'x^', 'c']);
    expect(shape(buildRows(result.doc.elements))).toEqual([['a'], ['x'], ['c']]);
  });

  it('needs no flag when widths already force the new row', () => {
    const start = doc([field('a', 12), field('c', 12)]);
    const result = plan(start, { kind: 'row', parentId: null, beforeRowKey: 'c' }, { kind: 'new', item: field('x', 12) });
    expect(ids(result.doc.elements)).toEqual(['a', 'x', 'c']);
    expect(result.insertedRowStarts).toBe(0);
  });

  it('gives a NEW field dropped inline the remaining width of the level being edited, never shrinking others', () => {
    const start = doc([field('a', 4), field('b', 4)]);
    const result = plan(start, { kind: 'inline', parentId: null, rowKey: 'a', beforeItemId: 'b' }, { kind: 'new', item: field('x', 12) });
    expect(ids(result.doc.elements)).toEqual(['a', 'x', 'b']);
    expect((result.doc.elements[1] as SdFormGenericField).layout).toEqual({ span: { desktop: 4 } });
    const onTablet = plan(
      start,
      { kind: 'inline', parentId: null, rowKey: 'a', beforeItemId: null },
      { kind: 'new', item: field('y', 12) },
      'tablet'
    );
    expect((onTablet.doc.elements[2] as SdFormGenericField).layout).toEqual({ span: { desktop: 12, tablet: 4 } });
  });

  it('rejects an inline drop of an existing field that does not fit (row-full)', () => {
    const start = doc([field('a', 6), field('b', 6), field('c', 8)]);
    expect(planDrop(start, { kind: 'inline', parentId: null, rowKey: 'a', beforeItemId: null }, { kind: 'move', id: 'c' })).toEqual({
      ok: false,
      reason: 'row-full',
    });
  });

  it('keeps an inline item at the start of a row from being pulled into the previous row', () => {
    const moved = plan(
      doc([field('p', 6), field('a', 8), field('x', 4)]),
      { kind: 'inline', parentId: null, rowKey: 'a', beforeItemId: 'a' },
      { kind: 'move', id: 'x' }
    );
    expect(ids(moved.doc.elements)).toEqual(['p', 'x^', 'a']);
    expect(shape(buildRows(moved.doc.elements))).toEqual([['p'], ['x', 'a']]);
    const refused = planDrop(
      doc([field('p', 6), field('a', 8)]),
      { kind: 'inline', parentId: null, rowKey: 'a', beforeItemId: 'a' },
      { kind: 'move', id: 'p' }
    );
    expect(refused).toEqual({ ok: false, reason: 'row-full' });
  });

  it('keeps the row after the dragged field intact when the field leaves its row', () => {
    const start = doc([field('A', 6), field('S', 6), field('C', 6)]);
    const inline = plan(start, { kind: 'inline', parentId: null, rowKey: 'C', beforeItemId: null }, { kind: 'move', id: 'S' });
    expect(shape(buildRows(inline.doc.elements))).toEqual([['A'], ['C', 'S']]);
    const beforeC = plan(start, { kind: 'inline', parentId: null, rowKey: 'C', beforeItemId: 'C' }, { kind: 'move', id: 'S' });
    expect(shape(buildRows(beforeC.doc.elements))).toEqual([['A'], ['S', 'C']]);
    const lastRow = plan(start, { kind: 'row', parentId: null, beforeRowKey: null }, { kind: 'move', id: 'S' });
    expect(shape(buildRows(lastRow.doc.elements))).toEqual([['A'], ['C'], ['S']]);
    const reorder = plan(start, { kind: 'inline', parentId: null, rowKey: 'A', beforeItemId: 'A' }, { kind: 'move', id: 'S' });
    expect(ids(reorder.doc.elements)).toEqual(['S', 'A', 'C']);
    const grouped = doc([group('g', [field('A', 6), field('S', 6), field('C', 6)]), field('R', 12)]);
    const out = plan(grouped, { kind: 'row', parentId: null, beforeRowKey: 'R' }, { kind: 'move', id: 'S' });
    expect(shape(buildRows(childrenOf(out.doc, 'g')))).toEqual([['A'], ['C']]);
    expect(ids(out.doc.elements)).toEqual(['g', 'S', 'R']);
  });

  it('keeps the next field of a row head in its row when the head leaves, and lets the head move to the end of its own row', () => {
    const start = doc([field('X', 6), field('S', 6, { layout: { span: { desktop: 6 }, newRow: true } }), field('B', 6)]);
    const toEnd = plan(start, { kind: 'inline', parentId: null, rowKey: 'S', beforeItemId: null }, { kind: 'move', id: 'S' });
    expect(shape(buildRows(toEnd.doc.elements))).toEqual([['X'], ['B', 'S']]);
    const away = plan(start, { kind: 'row', parentId: null, beforeRowKey: null }, { kind: 'move', id: 'S' });
    expect(shape(buildRows(away.doc.elements))).toEqual([['X'], ['B'], ['S']]);
    const backToHead = plan(start, { kind: 'inline', parentId: null, rowKey: 'S', beforeItemId: 'B' }, { kind: 'move', id: 'S' });
    expect(backToHead.changed).toBeFalse();
  });

  it('reports no change when a field is dropped back where it was', () => {
    const start = doc([field('a', 6), field('b', 6), field('c', 12)]);
    const result = plan(start, { kind: 'inline', parentId: null, rowKey: 'a', beforeItemId: 'b' }, { kind: 'move', id: 'a' });
    expect(result.changed).toBeFalse();
    expect(result.doc).toBe(start);
  });

  it('treats `layout: {}` like no layout when a field is dropped back where it was', () => {
    const start = doc([field('a', 12, { layout: {} }), field('b', 12)]);
    const result = plan(start, { kind: 'inline', parentId: null, rowKey: 'a', beforeItemId: null }, { kind: 'move', id: 'a' });
    expect(result.changed).toBeFalse();
  });

  it('moves a field page → group and group → group, keeping id/key/config', () => {
    const email = field('email', 6, { subtype: 'email', validation: { required: true } });
    const start = doc([email, group('g1', [field('a', 6)]), group('g2', [])]);
    const intoG1 = plan(start, { kind: 'inline', parentId: 'g1', rowKey: 'a', beforeItemId: null }, { kind: 'move', id: 'email' });
    expect(ids(intoG1.doc.elements)).toEqual(['g1', 'g2']);
    expect(ids(childrenOf(intoG1.doc, 'g1'))).toEqual(['a', 'email']);
    expect(childrenOf(intoG1.doc, 'g1')[1]).toEqual(email);
    const intoEmptyG2 = plan(intoG1.doc, { kind: 'row', parentId: 'g2', beforeRowKey: null }, { kind: 'move', id: 'email' });
    expect(ids(childrenOf(intoEmptyG2.doc, 'g1'))).toEqual(['a']);
    expect(ids(childrenOf(intoEmptyG2.doc, 'g2'))).toEqual(['email']);
    const backToPage = plan(intoEmptyG2.doc, { kind: 'row', parentId: null, beforeRowKey: 'g1' }, { kind: 'move', id: 'email' });
    expect(ids(backToPage.doc.elements)).toEqual(['email', 'g1', 'g2']);
  });

  it('never nests a group inside a group', () => {
    const start = doc([group('g1'), group('g2')]);
    const result = planDrop(start, { kind: 'row', parentId: 'g1', beforeRowKey: null }, { kind: 'move', id: 'g2' });
    expect(result.ok ? '' : result.reason).toBe('nested-group');
    const newGroup = planDrop(start, { kind: 'row', parentId: 'g1', beforeRowKey: null }, { kind: 'new', item: group('g3') });
    expect(newGroup.ok ? '' : newGroup.reason).toBe('nested-group');
  });

  it('moves a whole group as one block between page rows', () => {
    const start = doc([field('a'), group('g', [field('c1')]), field('b')]);
    const result = plan(start, { kind: 'row', parentId: null, beforeRowKey: 'a' }, { kind: 'move', id: 'g' });
    expect(ids(result.doc.elements)).toEqual(['g', 'a', 'b']);
    expect(ids(childrenOf(result.doc, 'g'))).toEqual(['c1']);
  });

  it('never mutates the input document', () => {
    const start = doc([field('a', 6), field('b', 6)]);
    const snapshot = JSON.stringify(start);
    plan(start, { kind: 'row', parentId: null, beforeRowKey: null }, { kind: 'new', item: field('x', 6) });
    plan(start, { kind: 'inline', parentId: null, rowKey: 'a', beforeItemId: 'a' }, { kind: 'move', id: 'b' });
    expect(JSON.stringify(start)).toBe(snapshot);
  });
});

describe('builder-layout · hitTest', () => {
  // Hình học tổng hợp: 2 hàng trang, hàng 1 có a(6)+b(4) — còn 2 cột; hàng 2 là group g.
  const geometry: CanvasGeometry = {
    root: {
      parentId: null,
      left: 0,
      right: 1200,
      top: 0,
      bottom: 1000,
      rows: [
        {
          key: 'a',
          left: 0,
          right: 1200,
          top: 0,
          bottom: 100,
          items: [
            { id: 'a', left: 0, right: 600, top: 0, bottom: 100 },
            { id: 'b', left: 600, right: 1000, top: 0, bottom: 100 },
          ],
        },
        { key: 'g', left: 0, right: 1200, top: 120, bottom: 400, items: [{ id: 'g', left: 0, right: 1200, top: 120, bottom: 400 }] },
      ],
    },
    groups: [{ parentId: 'g', left: 10, right: 1190, top: 170, bottom: 390, rows: [] }],
  };
  const d = doc([field('a', 6), field('b', 4), group('g')]);
  const rowsOf = (parentId: string | null) => buildRows(childrenOf(d, parentId));

  it('maps the top and bottom bands of a row to "new row before/after"', () => {
    expect(hitTest(geometry, rowsOf, 300, 10, { isGroup: false, span: 12 }).intent).toEqual({
      kind: 'row',
      parentId: null,
      beforeRowKey: 'a',
    });
    expect(hitTest(geometry, rowsOf, 300, 95, { isGroup: false, span: 12 }).intent).toEqual({
      kind: 'row',
      parentId: null,
      beforeRowKey: 'g',
    });
  });

  it('offers an inline slot only when the row has room, and explains when it does not', () => {
    expect(hitTest(geometry, rowsOf, 1100, 50, { isGroup: false, span: 2 }).intent).toEqual({
      kind: 'inline',
      parentId: null,
      rowKey: 'a',
      beforeItemId: null,
    });
    const full = hitTest(geometry, rowsOf, 1100, 40, { isGroup: false, span: 6 });
    expect(full.intent?.kind).toBe('row');
    expect(full.hint).toBe('row-full');
    expect(hitTest(geometry, rowsOf, 300, 50, { isGroup: false, span: 12, adaptive: true }).hint).toBe('row-full');
  });

  it('targets the group body for fields and refuses it for groups', () => {
    expect(hitTest(geometry, rowsOf, 500, 250, { isGroup: false, span: 12 }).intent).toEqual({
      kind: 'row',
      parentId: 'g',
      beforeRowKey: null,
    });
    const nested = hitTest(geometry, rowsOf, 500, 250, { id: 'x', isGroup: true, span: 12 });
    expect(nested.hint).toBe('nested-group');
    expect(nested.intent?.parentId).toBeNull();
  });

  it('returns no intent outside the canvas (drop = cancel)', () => {
    expect(hitTest(geometry, rowsOf, 1500, 50, { isGroup: false, span: 12 }).intent).toBeNull();
  });
});
