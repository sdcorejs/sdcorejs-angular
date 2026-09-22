import { MapToSdTableItem } from '../models/table-item.model';
import { SdTableOption } from '../models/table-option.model';
import { buildAggregateSnapshot } from '../services/table-aggregate.util';
import { AggregateRenderHost, SdAggregateRowsPipe } from './sd-aggregate-rows.pipe';

interface Row {
  value: number;
  children?: Row[];
}

describe('aggregate render projection', () => {
  it('puts nested branch summaries after their children, never into business items', () => {
    const leaf = { value: 40 };
    const child = { value: 60, children: [leaf] };
    const root = { value: 100, children: [child] };
    const option: SdTableOption<Row> = {
      type: 'local',
      items: () => [root],
      columns: [{ field: 'value', title: 'Value', type: 'number', aggregate: 'SUM' }],
      tree: { loadType: 'static' },
      aggregate: { tree: { subtotal: true } },
    };
    const snapshot = buildAggregateSnapshot<Row>({
      roots: [root],
      columns: [{ field: 'value', title: 'Value', type: 'number', aggregate: 'SUM' }],
      option,
      complete: true,
      loadedChildren: new Set(),
      format: String,
      diagnose: fail,
    });
    const rows = [root, child, leaf].map((row, level) => {
      const item = MapToSdTableItem<Row>(row);
      item.meta.tree = { level, isExpanded: true, hasChildren: level < 2 };
      return item;
    });
    const host: AggregateRenderHost<Row> = { rows: new WeakMap(), indices: new WeakMap() };
    const pipe = new SdAggregateRowsPipe();
    const result = pipe.transform(rows, snapshot, option, host);
    expect(result.length).toBe(5);
    expect(result.slice(0, 3)).toEqual(rows);
    expect(host.rows.get(result[3])).toBe(snapshot.branches.get(child));
    expect(host.rows.get(result[4])).toBe(snapshot.branches.get(root));
    expect(host.indices.get(rows[2])).toBe(2);
    expect(rows.length).toBe(3);
    rows[0].meta.tree!.isExpanded = false;
    expect(pipe.transform([rows[0]], snapshot, option, host)).toEqual([rows[0]]);
  });
});
