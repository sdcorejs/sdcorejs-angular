import type { SdTableOptionLoading } from '../../models/table-option-loading.model';
import {
  TABLE_GENERIC_SKELETON,
  TableRefreshTimer,
  buildTableSkeleton,
  resolveTableLoading,
  skeletonFillRows,
  tableLoadingView,
} from './table-loading.util';

describe('buildTableSkeleton', () => {
  it('shapes each cell by column type and steps the widths by row and data column', () => {
    const [first, second] = buildTableSkeleton(
      [
        { field: 'sdSelection' },
        { field: 'sdIndex' },
        { field: 'name', type: 'string' },
        { field: 'amount', type: 'number', align: 'right' },
        { field: 'status', type: 'values', badge: true },
        { field: 'createdAt', type: 'datetime' },
        { field: 'day', type: 'date' },
        { field: 'at', type: 'time' },
        { field: 'active', type: 'boolean' },
        { field: 'custom', type: 'number', template: true },
        { field: 'sdCommand' },
        { field: 'sdFiller' },
      ],
      2
    );
    expect(first.map(cell => [cell.field, cell.shape, cell.align, cell.width, cell.maxWidth])).toEqual([
      ['sdSelection', 'box', 'center', undefined, undefined],
      ['sdIndex', 'bar', 'center', '16px', undefined],
      ['name', 'bar', 'start', '72%', '240px'],
      ['amount', 'bar', 'end', '48%', '120px'],
      ['status', 'pill', 'start', '64px', undefined],
      ['createdAt', 'bar', 'start', '116px', '100%'],
      ['day', 'bar', 'start', '76px', '100%'],
      ['at', 'bar', 'start', '44px', '100%'],
      ['active', 'bar', 'start', '40px', '100%'],
      ['custom', 'bar', 'start', '84%', '240px'],
      ['sdCommand', 'none', 'start', undefined, undefined],
      ['sdFiller', 'none', 'start', undefined, undefined],
    ]);
    // Row 1 starts one step further along the same sequence.
    expect(second[2].width).toBe('54%');
    expect(second[3].width).toBe('80%');
  });

  it('hides the cells of children columns and gives the generic skeleton 5 rows × 4 bars', () => {
    expect(buildTableSkeleton([{ field: 'group', type: 'children' }], 1)[0][0]).toEqual({
      field: 'group',
      shape: 'none',
      align: 'start',
      hidden: true,
    });
    expect(TABLE_GENERIC_SKELETON.length).toBe(5);
    expect(TABLE_GENERIC_SKELETON.every(row => row.length === 4 && row.every(cell => cell.shape === 'bar'))).toBeTrue();
  });
});

describe('skeletonFillRows', () => {
  it('fills the body, at most the page size and 20', () => {
    expect(skeletonFillRows(260, 36)).toBe(7);
    expect(skeletonFillRows(260, 36, 4)).toBe(4);
    expect(skeletonFillRows(5000, 36)).toBe(20);
    expect(skeletonFillRows(10, 36)).toBe(1);
    expect(skeletonFillRows(Number.NaN, 36)).toBeUndefined();
    expect(skeletonFillRows(0, 36)).toBeUndefined();
  });
});

describe('resolveTableLoading', () => {
  it('uses the defaults when nothing is set', () => {
    expect(resolveTableLoading()).toEqual({ skeleton: true, skeletonRows: undefined, showDelay: 300, minDuration: 400, dim: true });
  });

  it('merges field by field: option, then configuration, then defaults', () => {
    const settings = resolveTableLoading({ showDelay: 0, dim: false }, { showDelay: 500, minDuration: 100, skeleton: false });
    expect(settings).toEqual({ skeleton: false, skeletonRows: undefined, showDelay: 0, minDuration: 100, dim: false });
  });

  it('treats negative, non-finite and wrongly typed values as not set', () => {
    const invalid = {
      showDelay: -1,
      minDuration: Number.NaN,
      skeletonRows: Infinity,
      skeleton: 'no',
      dim: 1,
    } as unknown as SdTableOptionLoading;
    expect(resolveTableLoading(invalid, { minDuration: 50 })).toEqual({
      skeleton: true,
      skeletonRows: undefined,
      showDelay: 300,
      minDuration: 50,
      dim: true,
    });
  });

  it('rounds skeletonRows down to 1–20', () => {
    expect(resolveTableLoading({ skeletonRows: 7.9 }).skeletonRows).toBe(7);
    expect(resolveTableLoading({ skeletonRows: 0 }).skeletonRows).toBe(1);
    expect(resolveTableLoading({ skeletonRows: 99 }).skeletonRows).toBe(20);
    expect(resolveTableLoading({ skeletonRows: -3 }, { skeletonRows: 3 }).skeletonRows).toBe(3);
  });
});

describe('tableLoadingView', () => {
  const state = { skeleton: true, loading: false, pending: false, rows: false, refresh: false };

  it('draws skeleton rows while a table without rows loads or waits for its first read', () => {
    expect(tableLoadingView({ ...state, loading: true })).toBe('skeleton');
    expect(tableLoadingView({ ...state, pending: true })).toBe('skeleton');
    expect(tableLoadingView({ ...state, loading: true, skeleton: false })).toBe('none');
    expect(tableLoadingView({ ...state, loading: true, rows: true })).toBe('none');
  });

  it('keeps the progress bar only while something is under it', () => {
    expect(tableLoadingView({ ...state, refresh: true, loading: true, rows: true })).toBe('refresh');
    expect(tableLoadingView({ ...state, refresh: true, rows: true })).toBe('refresh');
    expect(tableLoadingView({ ...state, refresh: true, loading: true, skeleton: false })).toBe('refresh');
    // An empty or failed result removed the rows: the empty/error region takes over at once.
    expect(tableLoadingView({ ...state, refresh: true })).toBe('none');
  });
});

describe('TableRefreshTimer', () => {
  let time: number;
  let timers: { at: number; callback: () => void; cancelled: boolean }[];
  let timer: TableRefreshTimer;
  const settings = { showDelay: 300, minDuration: 400 };
  const idle = { loading: false, scheduled: false, skeleton: false, rows: true };

  const advanceTo = (target: number) => {
    for (;;) {
      const next = timers.filter(entry => !entry.cancelled && entry.at <= target).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      time = next.at;
      next.cancelled = true;
      next.callback();
    }
    time = target;
  };

  beforeEach(() => {
    time = 0;
    timers = [];
    timer = new TableRefreshTimer(
      (callback, ms) => {
        const entry = { at: time + ms, callback, cancelled: false };
        timers.push(entry);
        return () => (entry.cancelled = true);
      },
      () => time
    );
  });

  it('shows nothing for a read faster than showDelay', () => {
    timer.update({ ...idle, loading: true }, settings);
    advanceTo(150);
    timer.update(idle, settings);
    advanceTo(1000);
    expect(timer.shown()).toBeFalse();
  });

  it('shows at showDelay and keeps the bar until minDuration has passed', () => {
    timer.update({ ...idle, loading: true }, settings);
    advanceTo(299);
    expect(timer.shown()).toBeFalse();
    advanceTo(300);
    expect(timer.shown()).toBeTrue();
    advanceTo(450);
    timer.update(idle, settings);
    advanceTo(699);
    expect(timer.shown()).toBeTrue();
    advanceTo(700);
    expect(timer.shown()).toBeFalse();
  });

  it('hides at once when the read ends after minDuration', () => {
    timer.update({ ...idle, loading: true }, settings);
    advanceTo(1000);
    timer.update(idle, settings);
    expect(timer.shown()).toBeFalse();
  });

  it('does not hold the bar over a result without rows', () => {
    timer.update({ ...idle, loading: true }, settings);
    advanceTo(450);
    timer.update({ ...idle, rows: false }, settings);
    expect(timer.shown()).toBeFalse();
  });

  it('keeps the bar through the debounce of a read that replaces the current one', () => {
    timer.update({ ...idle, loading: true }, settings);
    advanceTo(500);
    // #requestReload drops loading() and schedules the next read.
    timer.update({ ...idle, scheduled: true }, settings);
    advanceTo(1000);
    expect(timer.shown()).toBeTrue();
    timer.update({ ...idle, loading: true }, settings);
    advanceTo(1100);
    timer.update(idle, settings);
    expect(timer.shown()).toBeFalse();
  });

  it('keeps the bar when a new read starts while it is held', () => {
    timer.update({ ...idle, loading: true }, settings);
    advanceTo(450);
    timer.update(idle, settings);
    advanceTo(600);
    timer.update({ ...idle, loading: true }, settings);
    advanceTo(1000);
    expect(timer.shown()).toBeTrue();
    timer.update(idle, settings);
    expect(timer.shown()).toBeFalse();
  });

  it('never switches the bar on for a scheduled read alone', () => {
    timer.update({ ...idle, scheduled: true }, settings);
    advanceTo(1000);
    expect(timer.shown()).toBeFalse();
  });

  it('schedules no bar while skeleton rows show', () => {
    timer.update({ ...idle, loading: true, skeleton: true, rows: false }, settings);
    advanceTo(1000);
    expect(timer.shown()).toBeFalse();
  });

  it('shows and hides at once with showDelay 0 and minDuration 0', () => {
    const instant = { showDelay: 0, minDuration: 0 };
    timer.update({ ...idle, loading: true }, instant);
    expect(timer.shown()).toBeTrue();
    advanceTo(50);
    timer.update(idle, instant);
    expect(timer.shown()).toBeFalse();
  });

  it('runs no callback after destroy', () => {
    timer.update({ ...idle, loading: true }, settings);
    timer.destroy();
    expect(timers.every(entry => entry.cancelled)).toBeTrue();
    timer.update(idle, settings);
    advanceTo(1000);
    expect(timer.shown()).toBeFalse();
  });
});
