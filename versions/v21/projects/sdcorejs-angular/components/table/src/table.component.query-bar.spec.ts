import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdQueryBar } from '@sdcorejs/angular/components/query-bar';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { Filter, PagingReq } from '@sdcorejs/utils/models';
import { SD_TABLE_CONFIGURATION } from './configurations';
import { SdTableQuickSearchRightDefDirective } from './directives/sd-table-quick-search-right-def.directive';
import { SdTableOption } from './models/table-option.model';
import { SdConvertToPagingReq, SdTableFilterRequest } from './services/table-filter/table-filter.model';
import { SdTable } from './table.component';

// sd-table `filter.mode: 'query-bar'` (handoff table-query-bar, section 15 · 5–12, 14–17). The bar is a view over
// the same filter state: reads, cache, required and callbacks behave as in the default mode.

interface Order {
  id: number;
  code: string;
  total: number;
  status: string;
}

type ServerOption = Extract<SdTableOption<Order>, { type: 'server' }>;

const STATUSES = [
  { id: 'new', name: 'Mới' },
  { id: 'paid', name: 'Đã trả' },
];
const WAREHOUSES = [
  { id: 'hn', name: 'Hà Nội' },
  { id: 'hcm', name: 'Hồ Chí Minh' },
];

@Component({
  standalone: true,
  imports: [SdTable, SdTableQuickSearchRightDefDirective],
  template: `<sd-table [option]="option" autoId="orders">
    <ng-template sdTableQuickSearchRightDef><button type="button" class="consumer-action">Xuất</button></ng-template>
  </sd-table>`,
})
class QueryBarHost {
  option!: ServerOption;
}

describe('SdTable filter.mode query-bar', () => {
  let fixture: ComponentFixture<QueryBarHost>;
  let table: SdTable<Order>;
  let loader: jasmine.Spy;
  let reads: ((page: { items: Order[]; total: number }) => void)[];
  const mobile = signal(false);
  const spies = {
    column: jasmine.createSpy('column onChange'),
    external: jasmine.createSpy('external onChange'),
    quick: jasmine.createSpy('quick onChange'),
    operator: jasmine.createSpy('operatorChange'),
    clear: jasmine.createSpy('onClearFilter'),
    onFilter: jasmine.createSpy('onFilter'),
  };

  const buildOption = (filter: Partial<NonNullable<ServerOption['filter']>> = {}): ServerOption => ({
    type: 'server',
    items: loader,
    onFilter: spies.onFilter,
    columns: [
      {
        field: 'code',
        title: 'Mã đơn',
        type: 'string',
        filter: { onChange: spies.column, operator: { enable: true, default: 'CONTAIN', list: ['CONTAIN', 'EQUAL'] } },
      },
      { field: 'total', title: 'Tổng tiền', type: 'number', align: 'right' },
      { field: 'status', title: 'Trạng thái', type: 'values', option: { items: STATUSES, valueField: 'id', displayField: 'name' } },
    ],
    filter: {
      mode: 'query-bar',
      quickSearch: {
        containFields: ['code'],
        placeholder: 'Mã đơn…',
        filters: [
          {
            field: 'warehouseId',
            title: 'Kho xuất',
            type: 'values',
            option: { items: WAREHOUSES, valueField: 'id', displayField: 'name' },
            onChange: spies.quick,
          },
        ],
      },
      externalFilters: [
        {
          field: 'status',
          title: 'Trạng thái',
          type: 'values',
          defaultShowing: true,
          option: { items: STATUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
          onChange: spies.external,
        },
        { field: 'note', title: 'Ghi chú', type: 'string' },
      ],
      operatorChange: spies.operator,
      onClearFilter: spies.clear,
      ...filter,
      // why: `commit` và các spec chip bên dưới đi qua popover của chip; spec của editor mặc định (inline) nằm trong
      // describe 'chip editor' và bỏ ghim này.
      queryBar: { editor: 'popover', ...filter.queryBar },
    } as ServerOption['filter'],
  });

  const configure = (isMobile = false) => {
    mobile.set(isMobile);
    TestBed.configureTestingModule({
      imports: [QueryBarHost, NoopAnimationsModule],
      providers: [{ provide: SdViewportService, useValue: { isMobile: mobile } }],
    });
  };

  const settle = () => {
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
  };

  const mount = (option: ServerOption) => {
    fixture = TestBed.createComponent(QueryBarHost);
    fixture.componentInstance.option = option;
    settle();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  };

  const bar = (): SdQueryBar => fixture.debugElement.query(By.directive(SdQueryBar))?.componentInstance;
  const el = (): HTMLElement => fixture.nativeElement.querySelector('sd-table');
  const indexOf = (key: string) =>
    bar()
      .filters()
      .findIndex(filter => (filter as { field?: string }).field === key);
  const chipOf = (key: string) => bar().filters()[indexOf(key)];

  /** Commits a popover edit of `key` the way the chip popover does when it closes. */
  const commit = (key: string, next: Partial<Filter>) => {
    let index = indexOf(key);
    if (index < 0) {
      bar().openField(key);
      fixture.detectChanges();
      index = indexOf(key);
    }
    bar().openChipPopover(index);
    bar().onChipPopoverCommit({ ...bar().filters()[index], ...next } as Filter);
    settle();
  };

  const pagingOf = (call: jasmine.CallInfo<jasmine.Func>): PagingReq => call.args[1];

  beforeEach(() => {
    reads = [];
    loader = jasmine.createSpy('items').and.callFake(() => Promise.resolve({ items: [], total: 0 }));
    Object.values(spies).forEach(spy => spy.calls.reset());
  });

  afterEach(() => fixture?.destroy());

  describe('rendering', () => {
    beforeEach(() => configure());

    it('keeps the default mode when filter.mode is not set', fakeAsync(() => {
      mount(buildOption({ mode: undefined }));
      expect(el().getAttribute('data-filter-mode')).toBe('default');
      expect(el().querySelector('sd-query-bar')).toBeNull();
      expect(el().querySelector('sd-table-quick-search')).not.toBeNull();
      expect(el().querySelector('external-filter')).not.toBeNull();
      expect(el().querySelector('thead column-filter')).not.toBeNull();
    }));

    it('replaces quick search, external and column filters with one query bar', fakeAsync(() => {
      mount(buildOption());
      expect(el().getAttribute('data-filter-mode')).toBe('query-bar');
      expect(el().querySelector('sd-table-quick-search')).toBeNull();
      expect(el().querySelector('external-filter')).toBeNull();
      expect(el().querySelector('thead column-filter')).toBeNull();
      expect(el().querySelector('.c-filter-header')).toBeNull();
      const queryBar = el().querySelector('.sd-table-surface > sd-query-bar') as HTMLElement;
      expect(queryBar).not.toBeNull();
      expect(queryBar.getAttribute('role')).toBe('search');
      expect(queryBar.getAttribute('aria-label')).toBe(TestBed.inject(I18nService).t('core.component.table.filter'));
      expect(queryBar.getAttribute('data-autoid')).toBe('components-table-orders-query-bar');
      expect(queryBar.querySelector('.c-query-bar.c-appearance-flush')).not.toBeNull();
      expect(queryBar.querySelector('.consumer-action')).not.toBeNull();
      expect((queryBar.querySelector('.c-search-input') as HTMLInputElement).placeholder).toBe('Mã đơn…');
    }));

    it('pins quick filters and inline external filters, and offers the rest through "+"', fakeAsync(() => {
      mount(buildOption());
      expect(
        bar()
          .filters()
          .map(filter => (filter as { field: string }).field)
      ).toEqual(['quick:warehouseId', 'external:status']);
      const keys = bar()
        .pickerFields()
        .map(field => field.key);
      // why: cột "Trạng thái" trùng field với external nên không vào thanh.
      expect(keys).toEqual(['external:note', 'column:code', 'column:total']);
    }));

    it('sends the same request as the default mode for the same edits', fakeAsync(() => {
      mount(buildOption());
      commit('quick:warehouseId', { data: 'hn' });
      commit('external:status', { data: ['new', 'paid'] });
      commit('column:code', { operator: 'EQUAL', data: 'DH-1' });
      const expected = SdConvertToPagingReq(
        {
          quickSearch: { term: '', filters: { warehouseId: 'hn' } },
          columnOperator: { code: 'EQUAL' },
          rawColumnFilter: { code: 'DH-1' },
          rawExternalFilter: { status: ['new', 'paid'] },
          pageNumber: 0,
          pageSize: 20,
        } as SdTableFilterRequest,
        {
          columns: table.tableOption()!.columns,
          externalFilters: table.tableOption()!.filter!.externalFilters,
          quickSearch: table.quickSearchOption(),
        }
      );
      expect(pagingOf(loader.calls.mostRecent()).filters).toEqual(expected.filters);
    }));

    it('keeps the default mode on mobile', fakeAsync(() => {
      mobile.set(true);
      mount(buildOption());
      expect(el().getAttribute('data-filter-mode')).toBe('default');
      expect(el().querySelector('sd-query-bar')).toBeNull();
      expect(el().querySelector('sd-table-quick-search')).not.toBeNull();
    }));

    it('switches with the viewport and keeps the applied values', fakeAsync(() => {
      mount(buildOption());
      commit('column:total', { data: 5 });
      mobile.set(true);
      settle();
      expect(el().querySelector('sd-query-bar')).toBeNull();
      expect(table.getFilterRequest().rawColumnFilter).toEqual(jasmine.objectContaining({ total: 5 }));
      mobile.set(false);
      settle();
      expect(chipOf('column:total')).toEqual(jasmine.objectContaining({ data: 5 }));
    }));

    it('takes filter.mode and filter.queryBar from SD_TABLE_CONFIGURATION', fakeAsync(() => {
      TestBed.resetTestingModule();
      mobile.set(false);
      TestBed.configureTestingModule({
        imports: [QueryBarHost, NoopAnimationsModule],
        providers: [
          { provide: SdViewportService, useValue: { isMobile: mobile } },
          { provide: SD_TABLE_CONFIGURATION, useValue: { filter: { mode: 'query-bar', queryBar: { pinned: ['note'] } } } },
        ],
      });
      mount(buildOption({ mode: undefined }));
      expect(el().getAttribute('data-filter-mode')).toBe('query-bar');
      expect(
        bar()
          .filters()
          .map(filter => (filter as { field: string }).field)
      ).toEqual(['external:note']);
    }));
  });

  // The bar of sd-table edits chips on the bar by default; `queryBar.editor: 'popover'` keeps the popover chips.
  describe('chip editor', () => {
    const inlineChips = () => el().querySelectorAll('sd-query-bar sd-query-inline-value-chip, sd-query-bar sd-query-inline-chip');
    /** `buildOption` without the popover pin: the editor comes from the table default or SD_TABLE_CONFIGURATION. */
    const defaultEditor = (option = buildOption()) => {
      delete option.filter!.queryBar!.editor;
      return option;
    };

    it('edits chips on the bar by default', fakeAsync(() => {
      configure();
      mount(defaultEditor());
      expect(table.queryBarOption()!.mode).toBe('inline');
      expect(bar().resolvedMode()).toBe('inline');
      expect(inlineChips().length).toBe(bar().filters().length);
      expect(bar().popoverChips().length).toBe(0);
    }));

    it('keeps the popover chips with queryBar.editor popover', fakeAsync(() => {
      configure();
      mount(buildOption({ queryBar: { editor: 'popover' } }));
      expect(bar().resolvedMode()).toBe('popover');
      expect(inlineChips().length).toBe(0);
      expect(bar().popoverChips().length).toBe(bar().filters().length);
    }));

    it('takes queryBar.editor from SD_TABLE_CONFIGURATION, and the option wins', fakeAsync(() => {
      mobile.set(false);
      TestBed.configureTestingModule({
        imports: [QueryBarHost, NoopAnimationsModule],
        providers: [
          { provide: SdViewportService, useValue: { isMobile: mobile } },
          { provide: SD_TABLE_CONFIGURATION, useValue: { filter: { queryBar: { editor: 'popover' } } } },
        ],
      });
      mount(defaultEditor());
      expect(bar().resolvedMode()).toBe('popover');
      fixture.destroy();
      mount(buildOption({ queryBar: { editor: 'inline' } }));
      expect(bar().resolvedMode()).toBe('inline');
    }));

    it('marks an empty required chip invalid and points it at the hint', fakeAsync(() => {
      configure();
      const option = defaultEditor();
      option.filter!.quickSearch!.filters![0].required = true;
      mount(option);
      const control = inlineChips()[indexOf('quick:warehouseId')].querySelector('[aria-invalid="true"]') as HTMLElement;
      const hint = el().querySelector('.sd-table-query-bar-hint') as HTMLElement;
      expect(control).not.toBeNull();
      expect(control.getAttribute('aria-describedby')!.split(' ')).toContain(hint.id);
    }));

    it('reads once when an inline chip commits a change, and not when nothing changed', fakeAsync(() => {
      configure();
      mount(defaultEditor());
      loader.calls.reset();
      bar().onInlineCommit(indexOf('external:status'), ['new']);
      settle();
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.getFilterRequest().rawExternalFilter).toEqual(jasmine.objectContaining({ status: ['new'] }));
      bar().onInlineCommit(indexOf('external:status'), ['new']);
      settle();
      expect(loader).toHaveBeenCalledTimes(1);
    }));

    it('focuses the chip of a column from its header filter icon, which opens no popup', fakeAsync(() => {
      configure();
      mount(defaultEditor());
      const trigger = el().querySelector('[data-autoid="components-table-orders-filter-trigger-status"]') as HTMLButtonElement;
      expect(trigger.hasAttribute('aria-haspopup')).toBeFalse();
      trigger.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(inlineChips()[indexOf('external:status')].contains(document.activeElement)).toBeTrue();
    }));
  });

  describe('applying', () => {
    beforeEach(() => configure());

    it('reads once when a popover closes with a change, and not when nothing changed', fakeAsync(() => {
      mount(buildOption());
      loader.calls.reset();
      commit('column:total', { data: 5 });
      expect(loader).toHaveBeenCalledTimes(1);
      commit('column:total', { data: 5 });
      expect(loader).toHaveBeenCalledTimes(1);
    }));

    it('reads once when a chip with a value is removed', fakeAsync(() => {
      mount(buildOption());
      commit('column:total', { data: 5 });
      loader.calls.reset();
      bar().removeFilter(indexOf('column:total'));
      settle();
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.getFilterRequest().rawColumnFilter['total' as never]).toBeNull();
    }));

    it('does not send the text still being typed when a chip applies', fakeAsync(() => {
      mount(buildOption());
      const input = el().querySelector('.c-search-input') as HTMLInputElement;
      input.value = 'DH';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      loader.calls.reset();
      commit('column:total', { data: 5 });
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.getFilterRequest().quickSearch?.term).toBe('');
      expect(JSON.stringify(pagingOf(loader.calls.mostRecent()).filters)).not.toContain('DH');
      expect(input.value).withContext('the typed text stays in the box').toBe('DH');
    }));

    it('reads once on Enter in the search box', fakeAsync(() => {
      mount(buildOption());
      loader.calls.reset();
      const input = el().querySelector('.c-search-input') as HTMLInputElement;
      input.value = '  DH-9 ';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      settle();
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.getFilterRequest().quickSearch?.term).toBe('DH-9');
      expect(input.value).toBe('DH-9');
    }));

    it('stores an operator change on an empty column without reading', fakeAsync(() => {
      mount(buildOption({ queryBar: { pinned: ['code'] } }));
      loader.calls.reset();
      commit('column:code', { operator: 'EQUAL' });
      expect(loader).not.toHaveBeenCalled();
      expect(table.getFilterRequest().columnOperator['code' as never]).toBe('EQUAL');
    }));

    it('waits for the Search button with manualFilter', fakeAsync(() => {
      mount(buildOption({ manualFilter: true }));
      loader.calls.reset();
      commit('column:total', { data: 5 });
      commit('external:status', { data: ['new'] });
      expect(loader).not.toHaveBeenCalled();
      (el().querySelector('.c-search-trigger') as HTMLButtonElement).click();
      settle();
      expect(loader).toHaveBeenCalledTimes(1);
      expect(pagingOf(loader.calls.mostRecent()).filters).toEqual([
        { field: 'status', operator: 'IN', data: ['new'] },
        { field: 'total', operator: 'EQUAL', data: 5 },
      ] as Filter[]);
    }));

    it('runs the filter callbacks like the default controls, and never on init', fakeAsync(() => {
      mount(buildOption());
      expect(spies.column).not.toHaveBeenCalled();
      expect(spies.quick).not.toHaveBeenCalled();
      expect(spies.external).not.toHaveBeenCalled();
      expect(spies.operator).not.toHaveBeenCalled();

      commit('quick:warehouseId', { data: 'hcm' });
      expect(spies.quick).toHaveBeenCalledOnceWith('hcm');

      commit('external:status', { data: ['paid'] });
      expect(spies.external).toHaveBeenCalledOnceWith(['paid']);

      commit('column:code', { operator: 'EQUAL', data: 'DH' });
      const column = table.configuration()!.firstColumns.find(item => item.field === 'code');
      expect(spies.column).toHaveBeenCalledOnceWith('DH', column, table.columnFilter);
      expect(spies.operator).toHaveBeenCalledOnceWith(column, 'EQUAL');
      expect(table.columnFilter!['code']).toBe('DH');

      commit('column:code', { operator: 'EQUAL', data: 'DH' });
      expect(spies.column).toHaveBeenCalledTimes(1);
    }));

    it('defers outside changes while a chip popover is open', fakeAsync(() => {
      mount(buildOption());
      bar().openChipPopover(indexOf('external:status'));
      const before = bar().filters();
      table.setFilter({ columnFilter: { total: 9 } });
      fixture.detectChanges();
      expect(bar().filters()).toBe(before);
      bar().onChipPopoverCommit(chipOf('external:status'));
      settle();
      expect(chipOf('column:total')).toEqual(jasmine.objectContaining({ data: 9 }));
    }));

    it('keeps unapplied edits of other chips when the filter changes from outside (manualFilter)', fakeAsync(() => {
      mount(buildOption({ manualFilter: true }));
      commit('column:total', { data: 5 });
      table.setFilter({ externalFilter: { status: ['paid'] } });
      settle();
      expect(chipOf('external:status')).toEqual(jasmine.objectContaining({ data: ['paid'] }));
      expect(chipOf('column:total')).toEqual(jasmine.objectContaining({ data: 5 }));
    }));

    it('keeps the chip of a hidden column that filters with NOT_NULL, and the clear button', fakeAsync(() => {
      const option = buildOption();
      option.columns[0] = {
        ...option.columns[0],
        invisible: true,
        filter: { operator: { enable: true, default: 'CONTAIN', list: ['CONTAIN', 'EQUAL', 'NOT_NULL'] } },
      } as (typeof option.columns)[number];
      mount(option);
      expect(indexOf('column:code')).toBe(-1);
      table.filterRegister!.value.set({ columnOperator: { code: 'NOT_NULL' }, columnFilter: { code: null } });
      settle();
      expect(indexOf('column:code')).toBeGreaterThanOrEqual(0);
      expect(chipOf('column:code').operator).toBe('NOT_NULL');
      expect(table.queryBarOption()!.clearDisabled).toBe(false);
    }));

    it('keeps the identity of unchanged chips across reads', fakeAsync(() => {
      mount(buildOption());
      const pinned = chipOf('quick:warehouseId');
      commit('column:total', { data: 5 });
      expect(chipOf('quick:warehouseId')).toBe(pinned);
    }));
  });

  describe('required filters', () => {
    beforeEach(() => configure());

    it('blocks the read while a required quick filter is empty and explains why', fakeAsync(() => {
      const option = buildOption();
      option.filter!.quickSearch!.filters![0].required = true;
      mount(option);
      expect(loader).not.toHaveBeenCalled();
      expect(table.requireFiltered()).toBeTrue();
      const chip = el().querySelector('sd-query-bar .c-chip[data-field="quick:warehouseId"]') as HTMLElement;
      const hint = el().querySelector('.sd-table-query-bar-hint') as HTMLElement;
      expect(chip.getAttribute('aria-invalid')).toBe('true');
      // why: matTooltip của chip nối thêm id mô tả của nó vào cùng thuộc tính.
      expect(chip.getAttribute('aria-describedby')!.split(' ')).toContain(hint.id);
      expect(hint.querySelector('span')!.textContent!.trim()).toBe(
        TestBed.inject(I18nService).t('core.component.query-bar.required', { label: 'Kho xuất' })
      );

      commit('quick:warehouseId', { data: 'hn' });
      expect(loader).toHaveBeenCalledTimes(1);
      expect(el().querySelector('.sd-table-query-bar-hint')).toBeNull();
    }));

    it('names an empty required external filter the bar cannot show in the hint', fakeAsync(() => {
      const option = buildOption({ queryBar: { exclude: ['note'] } });
      option.filter!.externalFilters![1] = { ...option.filter!.externalFilters![1], required: true };
      mount(option);
      expect(loader).not.toHaveBeenCalled();
      expect(indexOf('external:note')).toBe(-1);
      const hint = el().querySelector('.sd-table-query-bar-hint') as HTMLElement;
      expect(hint).not.toBeNull();
      expect(hint.querySelector('span')!.textContent!.trim()).toBe(
        TestBed.inject(I18nService).t('core.component.query-bar.required', { label: 'Ghi chú' })
      );
    }));

    it('reports an empty required external filter to onFilter and does not read', fakeAsync(() => {
      const option = buildOption();
      option.filter!.externalFilters![1] = { ...option.filter!.externalFilters![1], required: true };
      mount(option);
      expect(spies.onFilter).toHaveBeenCalled();
      expect(spies.onFilter.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ externalFilterValid: false }));
      expect(loader).not.toHaveBeenCalled();
      expect(table.requireFiltered()).toBeTrue();

      commit('external:note', { data: 'gấp' });
      expect(spies.onFilter.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ externalFilterValid: true }));
      expect(loader).toHaveBeenCalledTimes(1);
    }));
  });

  describe('clearing', () => {
    beforeEach(() => configure());

    it('resets to the defaults, calls onClearFilter and reads once', fakeAsync(() => {
      mount(buildOption());
      const clearButton = () => el().querySelector('sd-query-bar .c-clear-all') as HTMLButtonElement;
      expect(clearButton().disabled).toBeTrue();
      commit('column:total', { data: 5 });
      commit('quick:warehouseId', { data: 'hn' });
      expect(clearButton().disabled).toBeFalse();
      loader.calls.reset();

      clearButton().click();
      settle();
      expect(spies.clear).toHaveBeenCalledTimes(1);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.getFilterRequest().rawColumnFilter['total' as never]).toBeUndefined();
      expect(
        bar()
          .filters()
          .map(filter => (filter as { field: string }).field)
      ).toEqual(['quick:warehouseId', 'external:status']);
      expect(clearButton().disabled).toBeTrue();
    }));
  });

  describe('cache', () => {
    const key = `query-bar-spec-${Date.now()}`;
    beforeEach(() => configure());
    afterEach(() => {
      for (const storage of [localStorage, sessionStorage]) {
        for (const name of Object.keys(storage)) if (name.includes(key)) storage.removeItem(name);
      }
    });

    it('restores chips from the cache, also after switching modes', fakeAsync(() => {
      mount(buildOption({ key, cacheable: true }));
      commit('column:total', { data: 5 });
      fixture.destroy();

      mount(buildOption({ key, cacheable: true, mode: 'default' }));
      expect(table.getFilterRequest().rawColumnFilter).toEqual(jasmine.objectContaining({ total: 5 }));
      fixture.destroy();

      mount(buildOption({ key, cacheable: true }));
      expect(chipOf('column:total')).toEqual(jasmine.objectContaining({ data: 5 }));
      expect(pagingOf(loader.calls.mostRecent()).filters).toContain({ field: 'total', operator: 'EQUAL', data: 5 } as Filter);
    }));
  });

  describe('loading, labels and warnings', () => {
    beforeEach(() => configure());

    it('keeps the bar usable during a refresh', fakeAsync(() => {
      loader.and.callFake(() => new Promise(resolve => reads.push(resolve)));
      mount(buildOption());
      reads.shift()!({ items: [{ id: 1, code: 'DH-1', total: 1, status: 'new' }], total: 1 });
      flushMicrotasks();
      settle();
      void table.reload();
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      expect(el().getAttribute('data-loading-view')).toBe('refresh');
      // why: trong full suite, DOM / overlay sót lại của spec khác đẩy fixture ra ngoài viewport hoặc phủ lên nó, và
      // elementFromPoint chỉ thấy phần đang trong khung nhìn — ghim fixture lên trên cùng.
      Object.assign((fixture.nativeElement as HTMLElement).style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '960px',
        zIndex: '10000',
      });
      fixture.detectChanges();
      const chip = el().querySelector('sd-query-bar .c-chip') as HTMLElement;
      const box = chip.getBoundingClientRect();
      expect(chip.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2))).toBeTrue();
      reads.shift()?.({ items: [], total: 0 });
      flush();
    }));

    it('shows the label of a lazy value restored from the filter state', fakeAsync(() => {
      const search = jasmine.createSpy('search').and.returnValue(Promise.resolve([{ id: 7, name: 'Shopee' }]));
      const option = buildOption();
      option.filter!.externalFilters!.push({
        field: 'channel',
        title: 'Kênh bán',
        type: 'lazy-values',
        option: { items: search, valueField: 'id', displayField: 'name' },
      });
      mount(option);
      table.setFilter({ externalFilter: { channel: 7 } });
      settle();
      const chip = el().querySelector('sd-query-bar .c-chip[data-field="external:channel"] .c-chip-value') as HTMLElement;
      expect(chip.textContent!.trim()).toBe('Shopee');
      expect(search).toHaveBeenCalledWith({ type: 'VALUE', value: 7 });
    }));

    it('warns once per table about filters the bar cannot show', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      const option = buildOption();
      option.filter!.externalFilters!.push({ field: 'custom', title: 'Custom', type: 'custom' });
      mount(option);
      commit('column:total', { data: 5 });
      table.setFilter({ columnFilter: { total: 6 } });
      settle();
      const calls = warn.calls.all().filter(call => String(call.args[0]).includes('query-bar'));
      expect(calls.length).toBe(1);
      expect(JSON.stringify(calls[0].args)).toContain('external:custom');
    }));
  });

  // Handoff section 8 · spec 15 · 13: the filter icon in a column header opens that field on the bar.
  describe('header filter triggers', () => {
    const t = (key: string, params?: Record<string, string>) => TestBed.inject(I18nService).t(key, params);
    const trigger = (field: string) =>
      el().querySelector(`[data-autoid="components-table-orders-filter-trigger-${field}"]`) as HTMLButtonElement | null;
    const hiddenOpacity = () => (matchMedia('(pointer: coarse)').matches ? '1' : '0');

    beforeEach(() => configure());

    it('adds a trigger to every column on the bar, and to a column covered by an external filter', fakeAsync(() => {
      mount(buildOption());
      expect(el().querySelectorAll('thead .sd-table-filter-trigger').length).toBe(3);
      const code = trigger('code')!;
      expect(code.getAttribute('aria-label')).toBe(t('core.component.table.filter-by', { title: 'Mã đơn' }));
      expect(code.getAttribute('aria-haspopup')).toBe('menu');
      expect(code.classList).not.toContain('sd-table-filter-trigger--active');
      expect(getComputedStyle(code).opacity).toBe(hiddenOpacity());
      expect(trigger('status')).not.toBeNull();
    }));

    it('has no trigger in the default mode', fakeAsync(() => {
      mount(buildOption({ mode: undefined }));
      expect(el().querySelector('.sd-table-filter-trigger')).toBeNull();
    }));

    it('stays visible and says so while the column filters by an applied value', fakeAsync(() => {
      mount(buildOption({ manualFilter: true }));
      commit('column:total', { data: 5 });
      // why: chỉ giá trị đã áp dụng mới bật icon; nháp chưa bấm Tìm kiếm thì chưa.
      expect(trigger('total')!.classList).not.toContain('sd-table-filter-trigger--active');
      (el().querySelector('.c-search-trigger') as HTMLButtonElement).click();
      settle();
      const total = trigger('total')!;
      expect(total.classList).toContain('sd-table-filter-trigger--active');
      // why: opacity có transition 120ms; fakeAsync không chạy thời gian CSS nên đọc giữa chừng ra 0.
      total.style.transition = 'none';
      expect(getComputedStyle(total).opacity).toBe('1');
      expect(total.getAttribute('aria-label')).toBe(t('core.component.table.filtering-by', { title: 'Tổng tiền' }));
      commit('external:status', { data: ['new'] });
      settle();
      expect(trigger('status')!.classList).not.toContain('sd-table-filter-trigger--active');
    }));

    it('opens the chip of its field without sorting, adding the chip when needed', fakeAsync(() => {
      const option = buildOption();
      option.sort = { enable: true };
      (option.columns[0] as { sortable?: boolean }).sortable = true;
      mount(option);
      loader.calls.reset();
      trigger('code')!.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(table.sortState().active).toBe('');
      expect(bar().editingIndex()).toBe(indexOf('column:code'));
      expect(indexOf('column:code')).toBeGreaterThan(-1);
      bar().popoverChips()[indexOf('column:code')].closeMenu();
      settle();
      expect(loader).not.toHaveBeenCalled();
    }));

    it('opens the external chip that covers its column', fakeAsync(() => {
      mount(buildOption());
      trigger('status')!.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(bar().editingIndex()).toBe(indexOf('external:status'));
      bar().popoverChips()[indexOf('external:status')].closeMenu();
      settle();
    }));

    it('gives focus back to the trigger when the popover closes', fakeAsync(() => {
      mount(buildOption());
      const total = trigger('total')!;
      total.focus();
      total.click();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      bar().popoverChips()[indexOf('column:total')].closeMenu();
      settle();
      expect(document.activeElement).toBe(total);
    }));

    it('puts the trigger before the title of a right-aligned column', fakeAsync(() => {
      mount(buildOption());
      const total = trigger('total')!;
      expect(getComputedStyle(total.parentElement!).flexDirection).toBe('row-reverse');
      expect(getComputedStyle(trigger('code')!.parentElement!).flexDirection).toBe('row');
      expect(total.parentElement!.querySelector('.c-header-title')).not.toBeNull();
    }));

    it('places the trigger in the leaf cell of a grouped header', fakeAsync(() => {
      const option = buildOption();
      option.columns = [
        option.columns[0],
        { field: 'money', title: 'Tiền', type: 'children', children: [option.columns[1] as never] },
      ] as ServerOption['columns'];
      mount(option);
      expect(el().querySelector('tr.c-second-header [data-autoid="components-table-orders-filter-trigger-total"]')).not.toBeNull();
      expect(el().querySelector('tr.c-first-header [data-autoid="components-table-orders-filter-trigger-money"]')).toBeNull();
    }));
  });
});
