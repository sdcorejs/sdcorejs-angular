import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdSplitterComponent } from './splitter.component';
import { SdSplitterPanelComponent } from './splitter-panel/splitter-panel.component';
import { SdStorageService } from '../../../services/storage';
import { SplitterStateService } from './splitter-state.service';
import { SplitterLayoutState } from './splitter.models';

@Component({
  standalone: true,
  imports: [SdSplitterComponent, SdSplitterPanelComponent],
  template: `
    <sd-splitter [orientation]="orientation" style="width:400px;height:200px;">
      <sd-splitter-panel size="1">A</sd-splitter-panel>
      <sd-splitter-panel size="2">B</sd-splitter-panel>
      <sd-splitter-panel size="1">C</sd-splitter-panel>
    </sd-splitter>
  `,
})
class Host {
  orientation: 'horizontal' | 'vertical' = 'horizontal';
}

describe('SdSplitterComponent — render', () => {
  let fixture: ComponentFixture<Host>;
  let splitterEl: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    splitterEl = fixture.debugElement.query(By.css('sd-splitter')).nativeElement;
  });

  it('host có class sd-splitter và orientation modifier', () => {
    expect(splitterEl.classList.contains('sd-splitter')).toBe(true);
    expect(splitterEl.classList.contains('sd-splitter--horizontal')).toBe(true);
  });

  it('render 3 panels + 2 handles xen kẽ', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const panels = splitterEl.querySelectorAll('sd-splitter-panel');
    const handles = splitterEl.querySelectorAll('sd-splitter-handle');
    expect(panels.length).toBe(3);
    expect(handles.length).toBe(2);
  });

  it('handle có orientation đồng bộ với splitter (horizontal)', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const handle = splitterEl.querySelector('sd-splitter-handle')!;
    expect(handle.classList.contains('sd-splitter__handle--horizontal')).toBe(true);
  });

  it('vertical orientation đổi class cả splitter và handle', async () => {
    fixture.componentInstance.orientation = 'vertical';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(splitterEl.classList.contains('sd-splitter--vertical')).toBe(true);
    const handle = splitterEl.querySelector('sd-splitter-handle')!;
    expect(handle.classList.contains('sd-splitter__handle--vertical')).toBe(true);
  });
});

describe('SdSplitterComponent — reconcile + flex style', () => {
  let fixture: ComponentFixture<Host>;
  let splitterEl: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    splitterEl = fixture.debugElement.query(By.css('sd-splitter')).nativeElement;
  });

  it('panels áp flex style với grow normalize (sum = 1)', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const panelEls = splitterEl.querySelectorAll<HTMLElement>('sd-splitter-panel');
    // panel sizes 1, 2, 1 (default unit flex). totalWeight = 4 → grow = 0.25, 0.5, 0.25
    const flexGrow = (el: HTMLElement) => parseFloat(el.style.flex.split(/\s+/)[0]);
    expect(flexGrow(panelEls[0])).toBeCloseTo(0.25, 5);
    expect(flexGrow(panelEls[1])).toBeCloseTo(0.5, 5);
    expect(flexGrow(panelEls[2])).toBeCloseTo(0.25, 5);
    // Tổng grow = 1 → CSS phân phối hết free space, không bị gap
    const sumGrow = flexGrow(panelEls[0]) + flexGrow(panelEls[1]) + flexGrow(panelEls[2]);
    expect(sumGrow).toBeCloseTo(1, 5);
  });
});

describe('SdSplitterComponent — storage', () => {
  let storage: SdStorageService;

  @Component({
    standalone: true,
    imports: [SdSplitterComponent, SdSplitterPanelComponent],
    template: `
      <sd-splitter storageKey="test-splitter" style="width:400px;height:200px;">
        <sd-splitter-panel panelId="a" size="1">A</sd-splitter-panel>
        <sd-splitter-panel panelId="b" size="1">B</sd-splitter-panel>
      </sd-splitter>
    `,
  })
  class HostWithStorage {}

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HostWithStorage, Host],
      providers: [SdStorageService],
    });
    storage = TestBed.inject(SdStorageService);
  });

  it('storageKey có → khi commit, layout state lưu vào storage', async () => {
    const fixture = TestBed.createComponent(HostWithStorage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cmpEl = fixture.debugElement.query(By.directive(SdSplitterComponent));
    const stateSvc = cmpEl.injector.get(SplitterStateService);
    stateSvc.setLiveSize('a', 0.7);
    stateSvc.setLiveSize('b', 1.3);
    stateSvc.commit();
    fixture.detectChanges();
    await fixture.whenStable();

    const handle = storage.create<SplitterLayoutState>('test-splitter');
    const stored = handle.get();
    expect(stored?.panels.find(p => p.id === 'a')?.size).toBeCloseTo(0.7, 5);
    expect(stored?.panels.find(p => p.id === 'b')?.size).toBeCloseTo(1.3, 5);
  });

  it('storageKey có và localStorage đã có state → restore khi init', async () => {
    const handle = storage.create<SplitterLayoutState>('test-splitter');
    handle.set({ v: 1, panels: [
      { id: 'a', size: 0.3, unit: 'flex', collapsed: false },
      { id: 'b', size: 1.7, unit: 'flex', collapsed: false },
    ]});

    const fixture = TestBed.createComponent(HostWithStorage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const stateSvc = fixture.debugElement.query(By.directive(SdSplitterComponent)).injector.get(SplitterStateService);
    expect(stateSvc.liveSizes().get('a')).toBeCloseTo(0.3, 5);
    expect(stateSvc.liveSizes().get('b')).toBeCloseTo(1.7, 5);
  });

  it('không có storageKey → không gọi storage.create()', () => {
    const setSpy = spyOn(storage, 'create').and.callThrough();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(setSpy).not.toHaveBeenCalled();
  });
});

describe('SdSplitterComponent — imperative API', () => {
  let fixture: ComponentFixture<HostWithCollapsible>;
  let cmp: SdSplitterComponent;
  let stateSvc: SplitterStateService;

  @Component({
    standalone: true,
    imports: [SdSplitterComponent, SdSplitterPanelComponent],
    template: `
      <sd-splitter style="width:400px;height:200px;">
        <sd-splitter-panel panelId="a" size="1" minSize="0.2" collapsible>A</sd-splitter-panel>
        <sd-splitter-panel panelId="b" size="2" maxSize="5">B</sd-splitter-panel>
        <sd-splitter-panel panelId="c" size="1">C</sd-splitter-panel>
      </sd-splitter>
    `,
  })
  class HostWithCollapsible {}

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HostWithCollapsible],
      providers: [SdStorageService],
    });
    fixture = TestBed.createComponent(HostWithCollapsible);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const debug = fixture.debugElement.query(By.directive(SdSplitterComponent));
    cmp = debug.componentInstance;
    stateSvc = debug.injector.get(SplitterStateService);
  });

  it('getLayout trả về state hiện tại', () => {
    const layout = cmp.getLayout();
    expect(layout.v).toBe(1);
    expect(layout.panels.length).toBe(3);
    expect(layout.panels[0].id).toBe('a');
  });

  it('setLayout apply state mới', () => {
    cmp.setLayout({
      v: 1,
      panels: [
        { id: 'a', size: 5, unit: 'flex', collapsed: false },
        { id: 'b', size: 1, unit: 'flex', collapsed: false },
        { id: 'c', size: 1, unit: 'flex', collapsed: false },
      ],
    });
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.size).toBe(5);
  });

  it('resetLayout về declaredSize ban đầu', () => {
    cmp.resizePanel('a', 99);
    cmp.resetLayout();
    const layout = cmp.getLayout();
    expect(layout.panels.find(p => p.id === 'a')!.size).toBe(1);   // declared
    expect(layout.panels.find(p => p.id === 'b')!.size).toBe(2);
    expect(layout.panels.find(p => p.id === 'c')!.size).toBe(1);
  });

  it('collapse(string id) match qua panelId', () => {
    cmp.collapse('a');
    expect(stateSvc.collapsedMap().get('a')).toBe(true);
  });

  it('collapse(number index) match qua index', () => {
    cmp.collapse(0);
    expect(stateSvc.collapsedMap().get('a')).toBe(true);
  });

  it('expand/toggle work với panel collapsible', () => {
    cmp.collapse('a');
    cmp.expand('a');
    expect(stateSvc.collapsedMap().get('a')).toBe(false);
    cmp.toggle('a');
    expect(stateSvc.collapsedMap().get('a')).toBe(true);
  });

  it('resizePanel clamp theo min/max', () => {
    cmp.resizePanel('b', 999);   // max 5
    expect(cmp.getLayout().panels.find(p => p.id === 'b')!.size).toBe(5);
    cmp.resizePanel('a', 0);    // min 0.2
    expect(cmp.getLayout().panels.find(p => p.id === 'a')!.size).toBe(0.2);
  });

  it('resolveTarget id không tồn tại → throw', () => {
    expect(() => cmp.collapse('nonexistent')).toThrowError(/no panel.*nonexistent/i);
  });
});

describe('SdSplitterComponent — outputs', () => {
  @Component({
    standalone: true,
    imports: [SdSplitterComponent, SdSplitterPanelComponent],
    template: `
      <sd-splitter style="width:400px;height:200px;"
        (resizeEnd)="captured.resizeEnd.push($event)"
        (collapsedChange)="captured.collapsedChange.push($event)"
        (layoutChange)="captured.layoutChange.push($event)">
        <sd-splitter-panel panelId="a" size="1" collapsible>A</sd-splitter-panel>
        <sd-splitter-panel panelId="b" size="1">B</sd-splitter-panel>
      </sd-splitter>
    `,
  })
  class HostWithEvents {
    captured: { resizeEnd: any[]; collapsedChange: any[]; layoutChange: any[] } = {
      resizeEnd: [], collapsedChange: [], layoutChange: []
    };
  }

  let fixture: ComponentFixture<HostWithEvents>;
  let captured: { resizeEnd: any[]; collapsedChange: any[]; layoutChange: any[] };

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [HostWithEvents], providers: [SdStorageService] });
    fixture = TestBed.createComponent(HostWithEvents);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    captured = fixture.componentInstance.captured;
    // Reset captures sau init effects (committedLayout signal mặc định = empty layout, không emit)
    captured.resizeEnd.length = 0;
    captured.collapsedChange.length = 0;
    captured.layoutChange.length = 0;
  });

  it('imperative collapse → emit collapsedChange + layoutChange', async () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    cmp.collapse('a');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(captured.collapsedChange).toEqual([{ panelId: 'a', collapsed: true }]);
    expect(captured.layoutChange.length).toBe(1);
  });

  it('imperative resizePanel → emit layoutChange', async () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterComponent)).componentInstance as SdSplitterComponent;
    cmp.resizePanel('a', 3);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(captured.layoutChange.length).toBe(1);
    expect(captured.layoutChange[0].panels.find((p: any) => p.id === 'a').size).toBe(3);
  });
});
