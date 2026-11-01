import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { ConfigComponent } from './components/config/config.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableFilterRequest } from './services/table-filter/table-filter.model';
import { SdTable } from './table.component';

// Apply and Restore defaults of the settings modal against reads that are still in flight. Only a changed column setup
// reaches the table again: it hydrates the configuration and reads once, because the shown columns are part of the
// request and newly shown `values` columns need their labels. Apply with the same setup leaves the read alone.

interface Order {
  id: number;
  code: string;
  total: number;
  status: string;
}

type ServerOption = Extract<SdTableOption<Order>, { type: 'server' }>;
type LocalOption = Extract<SdTableOption<Order>, { type: 'local' }>;
type Option = ServerOption | LocalOption;
interface Page {
  items: Order[];
  total: number;
}

const STATUSES = [
  { id: 'new', name: 'Mới' },
  { id: 'paid', name: 'Đã trả' },
];

@Component({
  standalone: true,
  imports: [SdTable],
  template: `<sd-table [option]="option" autoId="orders" />`,
})
class ApplyHost {
  option!: Option;
}

describe('SdTable settings Apply with asynchronous reads', () => {
  let fixture: ComponentFixture<ApplyHost>;
  let table: SdTable<Order>;
  let loader: jasmine.Spy;
  let reads: ((page: Page) => void)[];
  let key: string;
  const mobile = signal(false);

  const row = (code: string): Order => ({ id: code.length, code, total: 1, status: 'new' });

  const columns = (statusShown = true): ServerOption['columns'] => [
    { field: 'code', title: 'Mã đơn', type: 'string' },
    { field: 'total', title: 'Tổng tiền', type: 'number' },
    {
      field: 'status',
      title: 'Trạng thái',
      type: 'values',
      invisible: !statusShown,
      option: { items: STATUSES, valueField: 'id', displayField: 'name' },
    },
  ];

  const buildOption = (statusShown = true): ServerOption => ({
    type: 'server',
    key,
    items: loader,
    config: { visible: true },
    columns: columns(statusShown),
    filter: {
      externalFilters: [
        { field: 'code', title: 'Mã đơn', type: 'string', defaultShowing: true },
        { field: 'note', title: 'Ghi chú', type: 'string' },
      ],
    },
  });

  const settle = () => {
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
  };

  const mount = (option: Option) => {
    fixture = TestBed.createComponent(ApplyHost);
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

  const codes = () => table.dataItems.map(item => item.code);
  const config = (): ConfigComponent => fixture.debugElement.query(By.directive(ConfigComponent)).componentInstance;
  const requestOf = (index: number): SdTableFilterRequest => loader.calls.argsFor(index)[0];
  const shownFields = (index: number) => requestOf(index).visibledColumns?.map(column => column.field);

  /** Opens the settings modal, applies `edit` to it and presses Apply. */
  const apply = (edit: (component: ConfigComponent) => void = () => undefined) => {
    config().open();
    settle();
    edit(config());
    config().onSave();
    settle();
  };

  const restoreDefaults = () => {
    config().open();
    settle();
    config().onReset();
    flushMicrotasks();
    settle();
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('sd-core.language', 'vi');
    key = `config-apply-async-${Math.random().toString(36).slice(2)}`;
    reads = [];
    // Every read stays in flight until the spec answers it.
    loader = jasmine.createSpy('items').and.callFake(() => new Promise<Page>(resolve => reads.push(resolve)));
    TestBed.configureTestingModule({
      imports: [ApplyHost, NoopAnimationsModule],
      providers: [
        { provide: SdViewportService, useValue: { isMobile: mobile } },
        { provide: SdConfirmService, useValue: { confirm: () => Promise.resolve() } },
      ],
    });
  });

  afterEach(() => {
    fixture?.destroy();
    document.body.querySelectorAll('.cdk-overlay-container').forEach(node => (node.innerHTML = ''));
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('server table', () => {
    it('sends no read when Apply changes nothing, and the read in flight still renders', fakeAsync(() => {
      mount(buildOption());
      expect(reads.length).toBe(1);
      apply();
      expect(loader).toHaveBeenCalledTimes(1);
      answer(0, [row('DH-1')]);
      expect(codes()).toEqual(['DH-1']);
      expect(table.hasCustomSetup()).toBe(false);
    }));

    it('sends no read when only the Bộ lọc tab changed, and the read in flight still renders', fakeAsync(() => {
      mount(buildOption());
      apply(component => {
        component.selectTab('filters');
        component.setInline('note', true);
      });
      expect(table.filterRegister!.configuration.get().inlineExternal).toEqual(jasmine.objectContaining({ note: true }));
      expect(loader).toHaveBeenCalledTimes(1);
      answer(0, [row('DH-1')]);
      expect(codes()).toEqual(['DH-1']);
    }));

    it('sends no read when a column is hidden and shown again before Apply', fakeAsync(() => {
      mount(buildOption());
      answer(0, [row('DH-1')]);
      apply(component => {
        component.setShown('total', false);
        component.setShown('total', true);
        component.setFixed('code', true);
        component.setFixed('code', false);
      });
      expect(loader).toHaveBeenCalledTimes(1);
      expect(codes()).toEqual(['DH-1']);
      expect(table.hasCustomSetup()).toBe(false);
    }));

    it('reads once when Apply hides a column: the read in flight is dropped and the new one asks without it', fakeAsync(() => {
      mount(buildOption());
      expect(shownFields(0)).toEqual(['code', 'total', 'status']);
      apply(component => component.setShown('total', false));
      expect(loader).toHaveBeenCalledTimes(2);
      expect(shownFields(1)).toEqual(['code', 'status']);
      answer(0, [row('DH-OLD')]);
      expect(codes()).withContext('the read from before Apply is dropped').toEqual([]);
      answer(1, [row('DH-NEW')]);
      expect(codes()).toEqual(['DH-NEW']);
    }));

    it('reads once when Apply shows a values column, with its labels loaded first', fakeAsync(() => {
      mount(buildOption(false));
      answer(0, [row('DH-1')]);
      expect(table.cacheValues['status']).withContext('a hidden values column loads no labels').toBeUndefined();
      apply(component => component.setShown('status', true));
      expect(loader).toHaveBeenCalledTimes(2);
      expect(table.cacheValues['status']).toEqual(jasmine.arrayContaining([jasmine.objectContaining({ id: 'new' })]));
      expect(shownFields(1)).toEqual(['code', 'total', 'status']);
      answer(1, [row('DH-1')]);
      expect(codes()).toEqual(['DH-1']);
    }));

    it('reads once when Apply renames a column', fakeAsync(() => {
      mount(buildOption());
      answer(0, [row('DH-1')]);
      apply(component => component.setTitle('code', 'Số đơn'));
      expect(loader).toHaveBeenCalledTimes(2);
      answer(1, [row('DH-1')]);
      expect(table.hasCustomSetup()).toBe(true);
      apply();
      expect(loader).withContext('Apply again with the stored rename reads nothing').toHaveBeenCalledTimes(2);
    }));

    it('still drops the read in flight and reads once on Restore defaults', fakeAsync(() => {
      mount(buildOption());
      answer(0, [row('DH-1')]);
      apply(component => component.setShown('total', false));
      expect(loader).toHaveBeenCalledTimes(2);
      restoreDefaults();
      expect(loader).toHaveBeenCalledTimes(3);
      expect(shownFields(2)).toEqual(['code', 'total', 'status']);
      answer(1, [row('DH-OLD')]);
      expect(codes()).withContext('the read from before Restore defaults is dropped').toEqual(['DH-1']);
      answer(2, [row('DH-NEW')]);
      expect(codes()).toEqual(['DH-NEW']);
      expect(table.hasCustomSetup()).toBe(false);
    }));

    it('still reads once on Restore defaults with nothing stored', fakeAsync(() => {
      mount(buildOption());
      restoreDefaults();
      expect(loader).toHaveBeenCalledTimes(2);
      answer(0, [row('DH-OLD')]);
      expect(codes()).toEqual([]);
      answer(1, [row('DH-NEW')]);
      expect(codes()).toEqual(['DH-NEW']);
    }));
  });

  describe('local table', () => {
    const buildLocal = (): LocalOption => ({
      type: 'local',
      key,
      items: loader,
      config: { visible: true },
      columns: columns(),
    });

    const answerLocal = (index: number, items: Order[]) => {
      (reads[index] as unknown as (rows: Order[]) => void)(items);
      flushMicrotasks();
      settle();
    };

    it('does not load the rows again when Apply changes nothing', fakeAsync(() => {
      mount(buildLocal());
      expect(loader).toHaveBeenCalledTimes(1);
      apply();
      expect(loader).toHaveBeenCalledTimes(1);
      answerLocal(0, [row('DH-1')]);
      expect(codes()).toEqual(['DH-1']);
    }));

    it('loads the rows once when Apply hides a column', fakeAsync(() => {
      mount(buildLocal());
      answerLocal(0, [row('DH-1')]);
      apply(component => component.setShown('total', false));
      expect(loader).toHaveBeenCalledTimes(2);
      answerLocal(1, [row('DH-2')]);
      expect(codes()).toEqual(['DH-2']);
    }));
  });
});
