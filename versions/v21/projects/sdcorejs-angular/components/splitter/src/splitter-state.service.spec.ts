import { TestBed } from '@angular/core/testing';
import { SplitterStateService } from './splitter-state.service';

describe('SplitterStateService — basic mutations', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  it('setLiveSize updates liveSizes signal cho 1 panel', () => {
    service.setLiveSize('p1', 200);
    expect(service.liveSizes().get('p1')).toBe(200);
  });

  it('setLiveSize bảo toàn các panel khác', () => {
    service.setLiveSize('p1', 100);
    service.setLiveSize('p2', 200);
    expect(service.liveSizes().get('p1')).toBe(100);
    expect(service.liveSizes().get('p2')).toBe(200);
  });

  it('setCollapsed updates collapsedMap signal', () => {
    service.setCollapsed('p1', true);
    expect(service.collapsedMap().get('p1')).toBe(true);
  });

  it('commit() snapshot live state vào committedLayout', () => {
    service.setLiveSize('p1', 100);
    service.setLiveSize('p2', 200);
    service.setCollapsed('p2', true);
    service.setPanelMeta([
      {
        id: 'p1',
        index: 0,
        unit: 'flex',
        minSize: 0,
        maxSize: undefined,
        collapsible: false,
        resizable: true,
        declaredSize: 1,
        lastSize: 1,
      },
      {
        id: 'p2',
        index: 1,
        unit: 'flex',
        minSize: 0,
        maxSize: undefined,
        collapsible: true,
        resizable: true,
        declaredSize: 1,
        lastSize: 1,
      },
    ]);

    service.commit();

    expect(service.committedLayout()).toEqual({
      v: 1,
      panels: [
        { id: 'p1', size: 100, unit: 'flex', collapsed: false },
        { id: 'p2', size: 200, unit: 'flex', collapsed: true },
      ],
    });
  });
});

describe('SplitterStateService.reconcile', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  const meta = (id: string | number, unit: 'flex' | 'px' = 'flex', declaredSize = 1): import('./splitter.models').ResolvedPanelMeta => ({
    id,
    index: typeof id === 'number' ? id : 0,
    unit,
    minSize: 0,
    maxSize: undefined,
    collapsible: false,
    resizable: true,
    declaredSize,
    lastSize: declaredSize,
  });

  it('uses declaredSize khi không có stored state', () => {
    service.reconcile([meta('a', 'flex', 2), meta('b', 'flex', 3)], null);
    expect(service.liveSizes().get('a')).toBe(2);
    expect(service.liveSizes().get('b')).toBe(3);
    expect(service.collapsedMap().get('a')).toBe(false);
  });

  it('matches by panelId (string id)', () => {
    const stored = {
      v: 1 as const,
      panels: [
        { id: 'a', size: 100, unit: 'flex' as const, collapsed: false },
        { id: 'b', size: 200, unit: 'flex' as const, collapsed: true },
      ],
    };
    service.reconcile([meta('a'), meta('b')], stored);
    expect(service.liveSizes().get('a')).toBe(100);
    expect(service.liveSizes().get('b')).toBe(200);
    expect(service.collapsedMap().get('b')).toBe(true);
  });

  it('falls back to index khi panel không có panelId', () => {
    // Setup: stored có numeric id 99, 100 — KHÔNG khớp với current meta id 0, 1
    // → byId fail, buộc phải qua nhánh fallback index để match đúng vị trí.
    const stored = {
      v: 1 as const,
      panels: [
        { id: 99, size: 50, unit: 'flex' as const, collapsed: false },
        { id: 100, size: 150, unit: 'flex' as const, collapsed: true },
      ],
    };
    service.reconcile(
      [
        { ...meta(0), id: 0, index: 0 },
        { ...meta(1), id: 1, index: 1 },
      ],
      stored
    );
    // size lấy theo position match
    expect(service.liveSizes().get(0)).toBe(50);
    expect(service.liveSizes().get(1)).toBe(150);
    // collapsed cũng restore qua index fallback
    expect(service.collapsedMap().get(1)).toBe(true);
  });

  it('không fallback index khi panel có panelId string (tránh match nhầm)', () => {
    // String-id panel không khớp id → không được phép lấy stored[index]
    const stored = { v: 1 as const, panels: [{ id: 'other', size: 999, unit: 'flex' as const, collapsed: false }] };
    service.reconcile([meta('a', 'flex', 3)], stored);
    expect(service.liveSizes().get('a')).toBe(3); // declaredSize, không phải 999
  });

  it('skips stale entry trong storage (panel cũ không còn trong template)', () => {
    const stored = {
      v: 1 as const,
      panels: [
        { id: 'gone', size: 999, unit: 'flex' as const, collapsed: false },
        { id: 'a', size: 80, unit: 'flex' as const, collapsed: false },
      ],
    };
    service.reconcile([meta('a', 'flex', 5)], stored);
    expect(service.liveSizes().get('a')).toBe(80);
    expect(service.liveSizes().has('gone')).toBe(false);
  });

  it('uses declaredSize khi panel mới chưa có trong storage', () => {
    const stored = { v: 1 as const, panels: [{ id: 'a', size: 80, unit: 'flex' as const, collapsed: false }] };
    service.reconcile([meta('a'), meta('newPanel', 'flex', 7)], stored);
    expect(service.liveSizes().get('a')).toBe(80);
    expect(service.liveSizes().get('newPanel')).toBe(7);
  });

  it('bỏ qua storage entry khi unit lệch — collapsed cũng phải reset false', () => {
    const stored = { v: 1 as const, panels: [{ id: 'a', size: 250, unit: 'px' as const, collapsed: true }] };
    service.reconcile([meta('a', 'flex', 2)], stored);
    expect(service.liveSizes().get('a')).toBe(2);
    expect(service.collapsedMap().get('a')).toBe(false); // không kế thừa collapsed từ stored
  });

  it('handle stored.panels = [] (empty array, không crash)', () => {
    service.reconcile([meta('a', 'flex', 4)], { v: 1, panels: [] });
    expect(service.liveSizes().get('a')).toBe(4);
  });

  it('handle stored = undefined (giống null)', () => {
    service.reconcile([meta('a', 'flex', 5)], undefined);
    expect(service.liveSizes().get('a')).toBe(5);
  });
});

describe('SplitterStateService.applyDelta', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  function setup(metas: { id: string; unit: 'flex' | 'px'; size: number; min?: number; max?: number }[]): SplitterStateService {
    const resolved = metas.map((m, i) => ({
      id: m.id,
      index: i,
      unit: m.unit,
      minSize: m.min ?? 0,
      maxSize: m.max,
      collapsible: false,
      resizable: true,
      declaredSize: m.size,
      lastSize: m.size,
    }));
    service.reconcile(resolved, null);
    return service;
  }

  it('flex-flex: delta dương dịch chuyển weight giữa 2 panel', () => {
    setup([
      { id: 'a', unit: 'flex', size: 1 },
      { id: 'b', unit: 'flex', size: 1 },
    ]);
    // container 200px, mỗi panel 100px, delta +20px → a: 120, b: 80 → weight 1.2, 0.8
    service.applyDelta(0, 20, 200);
    expect(service.liveSizes().get('a')).toBeCloseTo(1.2, 5);
    expect(service.liveSizes().get('b')).toBeCloseTo(0.8, 5);
  });

  it('px-px: delta cộng/trừ trực tiếp', () => {
    setup([
      { id: 'a', unit: 'px', size: 100 },
      { id: 'b', unit: 'px', size: 100 },
    ]);
    service.applyDelta(0, 30, 200);
    expect(service.liveSizes().get('a')).toBe(130);
    expect(service.liveSizes().get('b')).toBe(70);
  });

  it('mix: prev=px tăng theo delta dương, next=flex hấp thụ phần còn lại qua weight', () => {
    setup([
      { id: 'fixed', unit: 'px', size: 100 },
      { id: 'fluid', unit: 'flex', size: 1 },
    ]);
    // container 200, fixed=100px, fluid=100px (1 weight). Delta +20:
    // - prev (px) lên 120px (giá trị raw signal = 120)
    // - next (flex) co còn 80px vì flex budget mới còn 80px. Chỉ có 1 flex panel
    //   nên giữ weight = 1 để tránh mất mốc phục hồi khi flex budget về 0.
    service.applyDelta(0, 20, 200);
    expect(service.liveSizes().get('fixed')).toBe(120);
    expect(service.liveSizes().get('fluid')).toBeCloseTo(1, 5);
  });

  it('mix px/flex/px: flex panel giữ weight dương khi bị ép về 0px ở sát biên', () => {
    setup([
      { id: 'top', unit: 'px', size: 64 },
      { id: 'content', unit: 'flex', size: 1 },
      { id: 'footer', unit: 'px', size: 100 },
    ]);

    // container=320, content ban đầu 156px. Kéo handle top/content xuống hết mức:
    // top chỉ tăng được 156px, content còn 0px, footer vẫn 100px.
    const applied = service.applyDelta(0, 1000, 320);

    expect(applied).toBe(156);
    expect(service.liveSizes().get('top')).toBe(220);
    expect(service.liveSizes().get('content')).toBeGreaterThan(0);
  });

  it('mix px/flex/px: sau khi sát biên, kéo ngược phục hồi flex ngay lập tức', () => {
    setup([
      { id: 'top', unit: 'px', size: 64 },
      { id: 'content', unit: 'flex', size: 1 },
      { id: 'footer', unit: 'px', size: 100 },
    ]);

    service.applyDelta(0, 1000, 320);
    const applied = service.applyDelta(0, -40, 320);

    expect(applied).toBe(-40);
    expect(service.liveSizes().get('top')).toBe(180);
    expect(service.liveSizes().get('content')).toBeGreaterThan(0);
  });

  it('mix px/flex/px: footer handle cũng phục hồi flex sau khi kéo sát lên trên', () => {
    setup([
      { id: 'top', unit: 'px', size: 64 },
      { id: 'content', unit: 'flex', size: 1 },
      { id: 'footer', unit: 'px', size: 100 },
    ]);

    // Kéo handle content/footer lên hết mức: content còn 0px, footer tăng lên 256px.
    const appliedToTop = service.applyDelta(1, -1000, 320);
    const appliedBack = service.applyDelta(1, 40, 320);

    expect(appliedToTop).toBe(-156);
    expect(appliedBack).toBe(40);
    expect(service.liveSizes().get('footer')).toBe(216);
    expect(service.liveSizes().get('content')).toBeGreaterThan(0);
  });

  it('clamp tại minSize của panel prev (flex)', () => {
    setup([
      { id: 'a', unit: 'flex', size: 1, min: 0.4 },
      { id: 'b', unit: 'flex', size: 1 },
    ]);
    // container 200, mỗi panel 100. Delta -80 → a sẽ về 20, nhưng min 0.4 weight = 40px → clamp
    service.applyDelta(0, -80, 200);
    expect(service.liveSizes().get('a')).toBeCloseTo(0.4, 5);
    // delta thực sự áp dụng = -60px, b: 1 + 0.6 = 1.6
    expect(service.liveSizes().get('b')).toBeCloseTo(1.6, 5);
  });

  it('clamp tại minSize của panel next (px)', () => {
    setup([
      { id: 'a', unit: 'px', size: 100 },
      { id: 'b', unit: 'px', size: 100, min: 50 },
    ]);
    // Delta +80 → b muốn 20, nhưng min 50 → clamp, a chỉ +50
    service.applyDelta(0, 80, 200);
    expect(service.liveSizes().get('a')).toBe(150);
    expect(service.liveSizes().get('b')).toBe(50);
  });

  it('clamp tại maxSize', () => {
    setup([
      { id: 'a', unit: 'px', size: 100, max: 120 },
      { id: 'b', unit: 'px', size: 100 },
    ]);
    service.applyDelta(0, 50, 200);
    expect(service.liveSizes().get('a')).toBe(120);
    expect(service.liveSizes().get('b')).toBe(80);
  });

  it('delta=0 → no-op, không mutate signal', () => {
    setup([
      { id: 'a', unit: 'px', size: 100 },
      { id: 'b', unit: 'px', size: 100 },
    ]);
    const beforeRef = service.liveSizes();
    service.applyDelta(0, 0, 200);
    // Signal reference không đổi (chứng minh set() không gọi)
    expect(service.liveSizes()).toBe(beforeRef);
  });

  it('handleIndex out of bounds → return 0, no-op', () => {
    setup([{ id: 'a', unit: 'px', size: 100 }]); // 1 panel, không có handle nào hợp lệ
    const beforeRef = service.liveSizes();
    const result = service.applyDelta(99, 10, 200);
    expect(result).toBe(0);
    expect(service.liveSizes()).toBe(beforeRef);
  });

  it('1 trong 2 panel đang collapsed → return 0, no-op (delegate sang Task 5/6)', () => {
    setup([
      { id: 'a', unit: 'px', size: 100 },
      { id: 'b', unit: 'px', size: 100 },
    ]);
    service.setCollapsed('a', true);
    const beforeSize = service.liveSizes().get('a');
    service.applyDelta(0, 30, 200);
    expect(service.liveSizes().get('a')).toBe(beforeSize); // unchanged
  });
});

describe('SplitterStateService.collapse/expand', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  function setup(): SplitterStateService {
    service.reconcile(
      [
        {
          id: 'a',
          index: 0,
          unit: 'flex',
          minSize: 0,
          maxSize: undefined,
          collapsible: true,
          resizable: true,
          declaredSize: 2,
          lastSize: 2,
        },
        {
          id: 'b',
          index: 1,
          unit: 'flex',
          minSize: 0,
          maxSize: undefined,
          collapsible: true,
          resizable: true,
          declaredSize: 1,
          lastSize: 1,
        },
      ],
      null
    );
    return service;
  }

  it('collapsePanel set collapsed=true', () => {
    setup().collapsePanel('a');
    expect(service.collapsedMap().get('a')).toBe(true);
  });

  it('collapsePanel lưu currentSize vào lastSize trên meta', () => {
    setup();
    service.setLiveSize('a', 5);
    service.collapsePanel('a');
    expect(service.getPanelMetas().find(m => m.id === 'a')!.lastSize).toBe(5);
  });

  it('expandPanel restore size từ lastSize', () => {
    setup();
    service.setLiveSize('a', 7);
    service.collapsePanel('a');
    service.expandPanel('a');
    expect(service.collapsedMap().get('a')).toBe(false);
    expect(service.liveSizes().get('a')).toBe(7);
  });

  it('expandPanel khi không có lastSize hợp lệ → fallback minSize', () => {
    service.reconcile(
      [
        {
          id: 'a',
          index: 0,
          unit: 'flex',
          minSize: 0.5,
          maxSize: undefined,
          collapsible: true,
          resizable: true,
          declaredSize: 1,
          lastSize: 0,
        },
      ],
      null
    );
    service.setCollapsed('a', true);
    service.expandPanel('a');
    expect(service.liveSizes().get('a')).toBe(0.5);
  });

  it('togglePanel flip collapsed state', () => {
    setup();
    service.togglePanel('a');
    expect(service.collapsedMap().get('a')).toBe(true);
    service.togglePanel('a');
    expect(service.collapsedMap().get('a')).toBe(false);
  });

  it('collapsePanel no-op nếu panel không collapsible', () => {
    service.reconcile(
      [
        {
          id: 'a',
          index: 0,
          unit: 'flex',
          minSize: 0,
          maxSize: undefined,
          collapsible: false,
          resizable: true,
          declaredSize: 1,
          lastSize: 1,
        },
      ],
      null
    );
    service.collapsePanel('a');
    expect(service.collapsedMap().get('a')).toBeFalsy();
  });
});

describe('SplitterStateService — snap-to-collapse', () => {
  let service: SplitterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SplitterStateService] });
    service = TestBed.inject(SplitterStateService);
  });

  it('kéo collapsible panel xuống dưới minSize × snapThreshold → snap collapse', () => {
    service.reconcile(
      [
        {
          id: 'a',
          index: 0,
          unit: 'px',
          minSize: 80,
          maxSize: undefined,
          collapsible: true,
          resizable: true,
          declaredSize: 100,
          lastSize: 100,
        },
        {
          id: 'b',
          index: 1,
          unit: 'px',
          minSize: 0,
          maxSize: undefined,
          collapsible: false,
          resizable: true,
          declaredSize: 100,
          lastSize: 100,
        },
      ],
      null
    );
    // Kéo a từ 100 xuống ≤ 40 (= 80 * 0.5) → snap
    service.applyDelta(0, -70, 200, 0.5);
    expect(service.collapsedMap().get('a')).toBe(true);
  });

  it('không snap nếu panel không collapsible — clamp tại minSize', () => {
    service.reconcile(
      [
        {
          id: 'a',
          index: 0,
          unit: 'px',
          minSize: 80,
          maxSize: undefined,
          collapsible: false,
          resizable: true,
          declaredSize: 100,
          lastSize: 100,
        },
        {
          id: 'b',
          index: 1,
          unit: 'px',
          minSize: 0,
          maxSize: undefined,
          collapsible: false,
          resizable: true,
          declaredSize: 100,
          lastSize: 100,
        },
      ],
      null
    );
    service.applyDelta(0, -50, 200, 0.5);
    expect(service.collapsedMap().get('a')).toBeFalsy();
    expect(service.liveSizes().get('a')).toBe(80); // clamp tại min
  });

  it('kéo ngược lại (delta dương vượt minSize) → expand từ collapsed', () => {
    service.reconcile(
      [
        {
          id: 'a',
          index: 0,
          unit: 'px',
          minSize: 80,
          maxSize: undefined,
          collapsible: true,
          resizable: true,
          declaredSize: 100,
          lastSize: 120,
        },
        {
          id: 'b',
          index: 1,
          unit: 'px',
          minSize: 0,
          maxSize: undefined,
          collapsible: false,
          resizable: true,
          declaredSize: 100,
          lastSize: 100,
        },
      ],
      null
    );
    service.setCollapsed('a', true);
    service.setLiveSize('a', 0);
    service.applyDelta(0, 90, 200, 0.5);
    expect(service.collapsedMap().get('a')).toBe(false);
    expect(service.liveSizes().get('a')).toBe(120); // restore lastSize
  });
});
