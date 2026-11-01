import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdQueryBar } from '@sdcorejs/angular/components/query-bar';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { PagingReq } from '@sdcorejs/utils/models';
import { ConfigComponent } from './components/config/config.component';
import { SdTableOption } from './models/table-option.model';
import { SdTable } from './table.component';

// The filter mode the user picks (settings › Bộ lọc) and the inline editor of the bar, against the asynchronous parts of
// sd-table: server reads still in flight, the 700 ms read debounce, replaced reads whose answer comes late, changes
// from outside while a chip is built or typed in, the filter cache, a new option object and the viewport.

interface Order {
  id: number;
  code: string;
  total: number;
  status: string;
}

type ServerOption = Extract<SdTableOption<Order>, { type: 'server' }>;
interface Page {
  items: Order[];
  total: number;
}

const STATUSES = [
  { id: 'new', name: 'Mới' },
  { id: 'paid', name: 'Đã trả' },
];

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTable],
  template: `<sd-table [option]="option" autoId="orders" />`,
})
class ModeHost {
  option!: ServerOption;
}

/** The parts of the inline value chip the specs drive (the class is not exported from the query-bar entry). */
interface InlineValueChip {
  draft: WritableSignal<string>;
  onFocus(): void;
  commitSingle(): void;
}

describe('SdTable filter mode with asynchronous reads', () => {
  let fixture: ComponentFixture<ModeHost>;
  let table: SdTable<Order>;
  let loader: jasmine.Spy;
  let reads: ((page: Page) => void)[];
  let key: string;
  const mobile = signal(false);

  const row = (code: string): Order => ({ id: code.length, code, total: 1, status: 'new' });

  const buildOption = (filter: Partial<NonNullable<ServerOption['filter']>> = {}): ServerOption => ({
    type: 'server',
    items: loader,
    config: { visible: true },
    columns: [
      {
        field: 'code',
        title: 'Mã đơn',
        type: 'string',
        filter: { operator: { enable: true, default: 'CONTAIN', list: ['CONTAIN', 'EQUAL'] } },
      },
      { field: 'total', title: 'Tổng tiền', type: 'number' },
      { field: 'status', title: 'Trạng thái', type: 'values', option: { items: STATUSES, valueField: 'id', displayField: 'name' } },
    ],
    filter: {
      externalFilters: [
        {
          field: 'status',
          title: 'Trạng thái',
          type: 'values',
          defaultShowing: true,
          option: { items: STATUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
        },
        { field: 'note', title: 'Ghi chú', type: 'string' },
      ],
      ...filter,
    } as ServerOption['filter'],
  });

  const configure = (isMobile = false) => {
    mobile.set(isMobile);
    TestBed.configureTestingModule({
      imports: [ModeHost, NoopAnimationsModule],
      providers: [
        { provide: SdViewportService, useValue: { isMobile: mobile } },
        { provide: SdConfirmService, useValue: { confirm: () => Promise.resolve() } },
      ],
    });
  };

  const settle = () => {
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
  };

  const mount = (option: ServerOption) => {
    fixture = TestBed.createComponent(ModeHost);
    fixture.componentInstance.option = option;
    settle();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  };

  /** Answers read `index` (0 = the first read of the fixture) and renders it. */
  const answer = (index: number, items: Order[]) => {
    reads[index]({ items, total: items.length });
    flushMicrotasks();
    settle();
  };

  const el = (): HTMLElement => fixture.nativeElement.querySelector('sd-table');
  const mode = () => el().getAttribute('data-filter-mode');
  const codes = () => table.dataItems.map(item => item.code);
  const bar = (): SdQueryBar => fixture.debugElement.query(By.directive(SdQueryBar))?.componentInstance;
  const indexOf = (field: string) =>
    bar()
      .filters()
      .findIndex(filter => (filter as { field?: string }).field === field);
  const chipOf = (field: string) => bar().filters()[indexOf(field)];
  const pagingOf = (call: jasmine.CallInfo<jasmine.Func>): PagingReq => call.args[1];
  const config = (): ConfigComponent => fixture.debugElement.query(By.directive(ConfigComponent)).componentInstance;
  const inlineChip = (field: string): InlineValueChip =>
    fixture.debugElement.queryAll(By.css('sd-query-bar sd-query-inline-value-chip, sd-query-bar sd-query-inline-chip'))[indexOf(field)]
      .componentInstance;
  const pickMode = (next: 'default' | 'query-bar' | undefined) => {
    table.filterRegister!.configuration.set({ mode: next });
    settle();
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('sd-core.language', 'vi');
    key = `filter-mode-async-${Math.random().toString(36).slice(2)}`;
    reads = [];
    // Every read stays in flight until the spec answers it.
    loader = jasmine.createSpy('items').and.callFake(() => new Promise<Page>(resolve => reads.push(resolve)));
  });

  afterEach(() => {
    fixture?.destroy();
    document.body.querySelectorAll('.cdk-overlay-container').forEach(node => (node.innerHTML = ''));
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('switching the mode', () => {
    beforeEach(() => configure());

    it('sends no read, also while a read is in flight, and the read in flight still renders', fakeAsync(() => {
      mount(buildOption());
      expect(reads.length).toBe(1);
      pickMode('query-bar');
      expect(mode()).toBe('query-bar');
      expect(loader).toHaveBeenCalledTimes(1);
      answer(0, [row('DH-1')]);
      expect(codes()).toEqual(['DH-1']);
      pickMode(undefined);
      expect(mode()).toBe('default');
      expect(loader).toHaveBeenCalledTimes(1);
      expect(codes()).toEqual(['DH-1']);
    }));

    it('carries the applied values onto the bar and back, and an edit there sends what the default controls send', fakeAsync(() => {
      loader.and.callFake(() => Promise.resolve({ items: [], total: 0 }));
      mount(buildOption());
      table.setFilter({ columnFilter: { total: 5 }, externalFilter: { status: ['new'] } });
      settle();
      const before = loader.calls.count();
      pickMode('query-bar');
      expect(loader.calls.count()).withContext('switching reads nothing').toBe(before);
      expect(chipOf('column:total')).toEqual(jasmine.objectContaining({ data: 5 }));
      expect(chipOf('external:status')).toEqual(jasmine.objectContaining({ data: ['new'] }));

      bar().onInlineCommit(indexOf('external:status'), ['new', 'paid']);
      settle();
      expect(loader.calls.count()).toBe(before + 1);
      const viaBar = pagingOf(loader.calls.mostRecent()).filters;

      pickMode('default');
      expect(table.getFilterRequest().rawExternalFilter).toEqual(jasmine.objectContaining({ status: ['new', 'paid'] }));
      expect(table.getFilterRequest().rawColumnFilter).toEqual(jasmine.objectContaining({ total: 5 }));
      table.setFilter({ columnFilter: { total: 5 }, externalFilter: { status: ['new'] } });
      settle();
      table.setFilter({ columnFilter: { total: 5 }, externalFilter: { status: ['new', 'paid'] } });
      settle();
      expect(pagingOf(loader.calls.mostRecent()).filters).toEqual(viaBar);
    }));

    it('flips to the default controls on mobile and back to the bar on desktop without a read', fakeAsync(() => {
      mount(buildOption({ mode: 'query-bar' }));
      answer(0, []);
      bar().onInlineCommit(indexOf('external:status'), ['new']);
      settle();
      answer(1, [row('DH-NEW')]);
      const calls = loader.calls.count();
      mobile.set(true);
      settle();
      expect(mode()).toBe('default');
      mobile.set(false);
      settle();
      expect(mode()).toBe('query-bar');
      expect(chipOf('external:status')).toEqual(jasmine.objectContaining({ data: ['new'] }));
      expect(loader.calls.count()).toBe(calls);
      expect(codes()).toEqual(['DH-NEW']);
    }));
  });

  describe('inline editor', () => {
    beforeEach(() => configure());

    it('renders the latest edit when an earlier read answers late', fakeAsync(() => {
      mount(buildOption({ mode: 'query-bar' }));
      answer(0, [row('DH-0')]);
      bar().onInlineCommit(indexOf('external:status'), ['new']);
      settle();
      expect(reads.length).toBe(2);
      bar().onInlineCommit(indexOf('external:status'), ['paid']);
      settle();
      expect(reads.length).toBe(3);
      answer(2, [row('DH-PAID')]);
      answer(1, [row('DH-NEW')]);
      expect(codes()).withContext('the late answer of the replaced read is dropped').toEqual(['DH-PAID']);
      expect(table.getFilterRequest().rawExternalFilter).toEqual(jasmine.objectContaining({ status: ['paid'] }));
    }));

    it('sends one read for edits made inside the debounce', fakeAsync(() => {
      mount(buildOption({ mode: 'query-bar' }));
      answer(0, []);
      loader.calls.reset();
      bar().onInlineCommit(indexOf('external:status'), ['new']);
      fixture.detectChanges();
      tick(300);
      bar().openField('column:total');
      fixture.detectChanges();
      bar().commitBuildValue(5);
      settle();
      expect(loader).toHaveBeenCalledTimes(1);
      const request = table.getFilterRequest();
      expect(request.rawExternalFilter).toEqual(jasmine.objectContaining({ status: ['new'] }));
      expect(request.rawColumnFilter).toEqual(jasmine.objectContaining({ total: 5 }));
    }));

    it('takes a change from outside once the chip being built is done', fakeAsync(() => {
      mount(buildOption({ mode: 'query-bar' }));
      answer(0, []);
      const trigger = el().querySelector('[data-autoid="components-table-orders-filter-trigger-code"]') as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(bar().building()?.field.key).toBe('column:code');

      table.setFilter({ columnFilter: { total: 6 }, externalFilter: { status: ['paid'] } });
      settle();
      expect(indexOf('column:total')).withContext('waits while a chip is built').toBe(-1);
      expect(bar().building()?.field.key).withContext('the chip being built stays').toBe('column:code');

      bar().cancelBuild();
      settle();
      expect(chipOf('column:total')).toEqual(jasmine.objectContaining({ data: 6 }));
      expect(chipOf('external:status')).toEqual(jasmine.objectContaining({ data: ['paid'] }));
    }));

    it('keeps the text typed in a chip when another field changes from outside', fakeAsync(() => {
      mount(buildOption({ mode: 'query-bar' }));
      answer(0, []);
      table.filterRegister!.configuration.set({ inlineExternal: { status: true, note: true } });
      settle();
      expect(indexOf('external:note')).toBeGreaterThan(-1);

      const typing = inlineChip('external:note');
      typing.onFocus();
      typing.draft.set('giao gấp');
      fixture.detectChanges();
      table.setFilter({ columnFilter: {}, externalFilter: { status: ['paid'] } });
      settle();
      answer(reads.length - 1, []);
      expect(chipOf('external:status')).toEqual(jasmine.objectContaining({ data: ['paid'] }));
      expect(inlineChip('external:note').draft()).withContext('the draft survives the outside change').toBe('giao gấp');

      loader.calls.reset();
      inlineChip('external:note').commitSingle();
      settle();
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.getFilterRequest().rawExternalFilter).toEqual(jasmine.objectContaining({ status: ['paid'], note: 'giao gấp' }));
    }));
  });

  describe('settings modal', () => {
    beforeEach(() => configure());

    const restoreDefaults = () => {
      config().open();
      settle();
      config().onReset();
      flushMicrotasks();
      settle();
    };

    // why: Áp dụng / Khôi phục mặc định ghi thiết lập cột, và mỗi lần ghi đó hydrate lại cấu hình rồi đọc lại đúng một
    // lần (có từ trước tab Bộ lọc). Tab Bộ lọc không được thêm lượt đọc của riêng nó.
    it('pins a filter on the bar from the settings with only the one read of Apply', fakeAsync(() => {
      mount(buildOption({ mode: 'query-bar' }));
      answer(0, [row('DH-1')]);
      expect(indexOf('external:note')).toBe(-1);
      config().open();
      settle();
      config().selectTab('filters');
      config().setInline('note', true);
      config().onSave();
      settle();
      expect(indexOf('external:note')).toBeGreaterThan(-1);
      expect(loader).toHaveBeenCalledTimes(2);
      answer(1, [row('DH-2')]);
      expect(codes()).toEqual(['DH-2']);
      expect(mode()).toBe('query-bar');
    }));

    it('switches the mode from the settings with only the one read of Apply', fakeAsync(() => {
      mount(buildOption());
      answer(0, [row('DH-1')]);
      config().open();
      settle();
      config().selectTab('filters');
      config().pickMode('query-bar');
      config().onSave();
      settle();
      expect(mode()).toBe('query-bar');
      expect(loader).toHaveBeenCalledTimes(2);
    }));

    it('restores defaults while a read is in flight: the late answer is dropped and the new read renders', fakeAsync(() => {
      mount(buildOption());
      table.filterRegister!.configuration.set({ mode: 'query-bar', inlineExternal: { status: true, note: true } });
      settle();
      expect(mode()).toBe('query-bar');
      restoreDefaults();
      expect(mode()).toBe('default');
      expect(table.filterRegister!.configuration.get()).toEqual({ inlineExternal: { status: true, note: false } });
      expect(loader).toHaveBeenCalledTimes(2);
      answer(0, [row('DH-OLD')]);
      expect(codes()).withContext('the read from before Restore defaults is dropped').toEqual([]);
      answer(1, [row('DH-NEW')]);
      expect(codes()).toEqual(['DH-NEW']);
    }));
  });

  describe('storage', () => {
    beforeEach(() => configure());

    it('restores the stored mode and the cached values after a reload, with one read', fakeAsync(() => {
      loader.and.callFake(() => Promise.resolve({ items: [], total: 0 }));
      mount(buildOption({ key, cacheable: true }));
      pickMode('query-bar');
      bar().onInlineCommit(indexOf('external:status'), ['paid']);
      settle();
      fixture.destroy();

      loader.calls.reset();
      mount(buildOption({ key, cacheable: true }));
      expect(mode()).toBe('query-bar');
      expect(chipOf('external:status')).toEqual(jasmine.objectContaining({ data: ['paid'] }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.getFilterRequest().rawExternalFilter).toEqual(jasmine.objectContaining({ status: ['paid'] }));
    }));

    it('keeps the stored mode across a new option object with filter.key, and loses it without (documented)', fakeAsync(() => {
      loader.and.callFake(() => Promise.resolve({ items: [], total: 0 }));
      mount(buildOption({ key }));
      pickMode('query-bar');
      fixture.componentInstance.option = buildOption({ key });
      settle();
      expect(mode()).toBe('query-bar');
      fixture.destroy();

      mount(buildOption());
      pickMode('query-bar');
      fixture.componentInstance.option = buildOption();
      settle();
      expect(mode()).withContext('without filter.key the setup lives as long as the option object').toBe('default');
    }));
  });
});
