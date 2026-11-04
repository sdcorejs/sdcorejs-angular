import { Component, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import type { SdTableMobileCardData, SdTableMobileDataContext } from './models/table-mobile.model';
import { SdTableRowMobileDefDirective, type SdTableRowMobileDefContext } from './directives/sd-table-row-mobile-def.directive';
import { ISdTableConfiguration, SD_TABLE_CONFIGURATION } from './configurations';

interface Order {
  id: number;
  code: string;
  customer: string;
  status: string;
  total: number;
  warehouse: string;
  createdBy: string;
  note: string;
}

const ORDERS: Order[] = [
  { id: 1, code: 'DH-1', customer: 'An', status: 'new', total: 1200, warehouse: 'HN', createdBy: 'Lan', note: 'Gấp' },
  { id: 2, code: 'DH-2', customer: 'Bình', status: 'done', total: 900, warehouse: 'HCM', createdBy: 'Minh', note: '' },
];

@Component({
  imports: [SdTable, SdTableRowMobileDefDirective],
  template: `
    <div style="width: 360px">
      <sd-table autoId="orders" [option]="option">
        @if (directive()) {
          <ng-template [sdTableRowMobileDef]="option" let-row="item"
            ><span class="from-directive">{{ row.code }}</span></ng-template
          >
        }
      </sd-table>
    </div>
    <ng-template #card let-row="item"
      ><span class="from-template-ref">{{ row.code }}</span></ng-template
    >
  `,
})
class TemplateHost implements OnInit {
  @ViewChild('card', { static: true }) card!: TemplateRef<SdTableRowMobileDefContext<Order>>;
  readonly directive = signal(false);
  useTemplateRef = false;
  rows: Order[] = ORDERS.map(order => ({ ...order }));
  data = jasmine.createSpy('data').and.callFake(
    (row: Order, context: SdTableMobileDataContext): SdTableMobileCardData<Order> => ({
      title: 'code',
      subtitle: 'customer',
      badge: 'status',
      highlight: 'total',
      fields: ['warehouse', 'createdBy', 'note'],
      maxFields: context.selected ? 4 : 2,
    })
  );
  option: SdTableOption<Order> = {
    type: 'local',
    rowKey: 'id',
    items: () => this.rows,
    columns: [
      { field: 'code', type: 'string', title: 'Mã' },
      { field: 'customer', type: 'string', title: 'Khách hàng' },
      {
        field: 'status',
        type: 'string',
        title: 'Trạng thái',
        useBadge: value => ({ title: value, color: value === 'done' ? 'success' : 'info' }),
      },
      { field: 'total', type: 'number', title: 'Tổng tiền' },
      { field: 'warehouse', type: 'string', title: 'Kho' },
      { field: 'createdBy', type: 'string', title: 'Người tạo', invisible: true },
      { field: 'note', type: 'string', title: 'Ghi chú', hidden: true },
    ],
    selector: { visible: true },
    mobile: { template: { data: this.data } },
  };

  ngOnInit(): void {
    if (this.useTemplateRef) this.option.mobile = { template: this.card };
  }
}

/** Handoff table-mobile 9–10 and 13.6: `mobile.template`, the card built from data and `autoTemplate`. */
describe('SdTable mobile.template', () => {
  let fixture: ComponentFixture<TemplateHost>;
  let host: TemplateHost;
  let table: SdTable<Order>;
  const settle = () => {
    fixture.detectChanges();
    tick(850);
    flush();
    fixture.detectChanges();
  };
  const element = (): HTMLElement => fixture.nativeElement;
  const cards = (): HTMLElement[] => Array.from(element().querySelectorAll('.sd-mobile-card'));
  const text = (card: HTMLElement, selector: string): string => card.querySelector(selector)?.textContent?.trim() ?? '';
  const labels = (card: HTMLElement): string[] =>
    Array.from(card.querySelectorAll('.sd-mobile-data-cell dt')).map(dt => dt.textContent!.trim());
  const create = (configure?: (host: TemplateHost) => void, configuration?: ISdTableConfiguration) => {
    if (configuration) TestBed.overrideProvider(SD_TABLE_CONFIGURATION, { useValue: configuration });
    fixture = TestBed.createComponent(TemplateHost);
    host = fixture.componentInstance;
    configure?.(host);
    settle();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TemplateHost],
      providers: [
        provideNoopAnimations(),
        { provide: SdViewportService, useValue: { isMobile: signal(true) } },
        { provide: SD_TABLE_CONFIGURATION, useValue: {} },
      ],
    });
  });

  describe('which body a phone card gets', () => {
    it('builds the card from data', fakeAsync(() => {
      create();
      expect(cards().length).toBe(2);
      expect(text(cards()[0], '.sd-mobile-data-title')).toBe('DH-1');
      expect(table.table()).toBeUndefined();
    }));

    it('renders a TemplateRef inside the card frame', fakeAsync(() => {
      create(h => (h.useTemplateRef = true));
      expect(text(cards()[1], '.sd-mobile-card-body .from-template-ref')).toBe('DH-2');
    }));

    it('prefers sdTableRowMobileDef over template and warns once', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      create(h => h.directive.set(true));
      expect(cards()[0].querySelector('.from-directive')).not.toBeNull();
      expect(cards()[0].querySelector('sd-table-mobile-card-data')).toBeNull();
      expect(host.data).not.toHaveBeenCalled();
      table.detectChanges();
      settle();
      expect(warn.calls.allArgs().filter(args => String(args[0]).includes('both set')).length).toBe(1);
    }));

    it('keeps the desktop table with template: false, even with autoTemplate', fakeAsync(() => {
      create(h => (h.option.mobile = { template: false }), { mobile: { autoTemplate: true } });
      expect(cards().length).toBe(0);
      expect(table.table()).toBeDefined();
    }));

    it('keeps the desktop table without a template when autoTemplate is off', fakeAsync(() => {
      create(h => (h.option.mobile = undefined));
      expect(cards().length).toBe(0);
      expect(table.table()).toBeDefined();
    }));

    it('adds a column the settings turned on to the derived card', fakeAsync(() => {
      create(h => (h.option.mobile = undefined), { mobile: { autoTemplate: true } });
      const config = table.configuration()!;
      const createdBy = host.option.columns.find(column => column.field === 'createdBy') as (typeof config.firstColumns)[number];
      table.configuration.set({ ...config, firstColumns: [...config.firstColumns, createdBy] });
      settle();
      expect(labels(cards()[0])).toEqual(['Tổng tiền', 'Kho', 'Người tạo']);
    }));

    it('keeps the desktop table for a template of another shape and warns once', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      create(h => (h.option.mobile = { template: { layout: 'card' } as never }), { mobile: { autoTemplate: true } });
      expect(cards().length).toBe(0);
      expect(table.table()).toBeDefined();
      table.detectChanges();
      settle();
      expect(warn.calls.allArgs().filter(args => String(args[0]).includes('must be a TemplateRef')).length).toBe(1);
    }));

    it('draws a card for an unsupported layout and warns once', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      create(h => (h.option.mobile = { template: { layout: 'list' as 'card', data: h.data } }));
      expect(cards().length).toBe(2);
      expect(warn.calls.allArgs().filter(args => args.includes('list')).length).toBe(1);
    }));

    it('derives the card from the visible columns with autoTemplate', fakeAsync(() => {
      create(h => (h.option.mobile = undefined), { mobile: { autoTemplate: true } });
      const card = cards()[0];
      expect(text(card, '.sd-mobile-data-title')).toBe('DH-1');
      expect(text(card, '.sd-mobile-data-subtitle')).toBe('An');
      expect(card.querySelector('.sd-mobile-data-badge')?.textContent).toContain('new');
      // hidden and invisible columns are left out of a derived card
      expect(labels(card)).toEqual(['Tổng tiền', 'Kho']);
    }));
  });

  describe('card built from data', () => {
    it('draws title, badge, subtitle and the highlight first', fakeAsync(() => {
      create();
      const card = cards()[0];
      expect(text(card, '.sd-mobile-data-subtitle')).toBe('An');
      expect(card.querySelector('sd-badge')?.textContent).toContain('new');
      const first = card.querySelector<HTMLElement>('.sd-mobile-data-cell')!;
      expect(first.classList).toContain('sd-mobile-data-cell--highlight');
      expect(text(first, 'dt')).toBe('Tổng tiền');
      expect(text(first, 'dd')).toContain('1,200');
    }));

    it('shows maxFields cells, then More and Show less', fakeAsync(() => {
      create();
      const card = cards()[0];
      expect(labels(card)).toEqual(['Tổng tiền', 'Kho']);
      const more = card.querySelector<HTMLButtonElement>('.sd-mobile-data-more')!;
      expect(more.textContent).toContain('2');
      expect(more.getAttribute('aria-expanded')).toBe('false');
      expect(more.getAttribute('data-autoid')).toMatch(/-mobile-row-1-more$/);
      more.click();
      settle();
      expect(labels(card)).toEqual(['Tổng tiền', 'Kho', 'Người tạo', 'Ghi chú']);
      expect(more.getAttribute('aria-expanded')).toBe('true');
      expect(table.selectedItems).toEqual([]);
      more.click();
      settle();
      expect(labels(card)).toEqual(['Tổng tiền', 'Kho']);
    }));

    it('shows hidden and invisible fields the data names, with their raw value when the table did not format them', fakeAsync(() => {
      create();
      cards()[0].querySelector<HTMLButtonElement>('.sd-mobile-data-more')!.click();
      settle();
      const cells = Array.from(cards()[0].querySelectorAll('.sd-mobile-data-cell'));
      expect(cells[2].textContent).toContain('Lan');
      expect(cells[3].textContent).toContain('Gấp');
    }));

    it('shows a badge field without useBadge as text and warns once', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      create(h => h.data.and.returnValue({ title: 'code', badge: 'customer' }));
      const card = cards()[0];
      expect(card.querySelector('sd-badge')).toBeNull();
      expect(text(card, '.sd-mobile-data-badge-text')).toBe('An');
      table.detectChanges();
      settle();
      expect(warn.calls.allArgs().filter(args => String(args[0]).includes('useBadge')).length).toBe(1);
    }));

    it('draws no badge for an empty value, as the desktop cell', fakeAsync(() => {
      create(h => {
        h.rows[1].status = '';
        h.data.and.returnValue({ title: 'code', badge: 'status' });
      });
      expect(cards()[0].querySelector('sd-badge')).not.toBeNull();
      expect(cards()[1].querySelector('sd-badge, .sd-mobile-data-badge-text')).toBeNull();
    }));

    it('formats the raw date of a hidden column', fakeAsync(() => {
      create(h => {
        h.option.columns.push({ field: 'paidAt' as 'note', type: 'date', title: 'Ngày trả', hidden: true });
        (h.rows[0] as Order & { paidAt?: Date }).paidAt = new Date(2026, 9, 5);
        h.data.and.returnValue({ title: 'code', fields: ['paidAt' as 'note'] });
      });
      expect(text(cards()[0], '.sd-mobile-data-cell dd')).toMatch(/05\/10\/2026/);
    }));

    it('draws a fixed badge as given', fakeAsync(() => {
      create(h =>
        h.data.and.callFake((row: Order) => ({ title: 'code', badge: row.id === 1 ? { title: 'Đã khóa', color: 'error' } : 'status' }))
      );
      expect(cards()[0].querySelector('sd-badge')?.textContent).toContain('Đã khóa');
      expect(cards()[1].querySelector('sd-badge')?.textContent).toContain('done');
    }));

    it('shows the text of an htmlTemplate column without its tags', fakeAsync(() => {
      create(h => {
        h.option.columns[1] = {
          ...h.option.columns[1],
          htmlTemplate: (value: string) => `<b class="name">${value}</b> <i>VIP</i>`,
        } as never;
        h.data.and.returnValue({ title: 'code', subtitle: 'customer' });
      });
      expect(text(cards()[0], '.sd-mobile-data-subtitle')).toBe('An VIP');
      expect(cards()[0].querySelector('.sd-mobile-data-subtitle b')).toBeNull();
    }));

    it('falls back to the row label when the title field is unknown, and warns once per field', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      create(h => h.data.and.returnValue({ title: 'cod' as 'code' }));
      expect(text(cards()[0], '.sd-mobile-data-title')).toBe('1');
      table.detectChanges();
      settle();
      expect(warn.calls.allArgs().filter(args => args.includes('cod')).length).toBe(1);
    }));

    it('uses the derived card for a row whose data returns no object', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      create(h => h.data.and.returnValue(null as never));
      expect(text(cards()[0], '.sd-mobile-data-title')).toBe('DH-1');
      expect(text(cards()[0], '.sd-mobile-data-subtitle')).toBe('An');
      expect(warn.calls.allArgs().filter(args => String(args[0]).includes('threw')).length).toBe(1);
    }));

    it('follows a new option that switches the card body', fakeAsync(() => {
      create();
      host.option = { ...host.option, mobile: { template: false } };
      settle();
      expect(cards().length).toBe(0);
      expect(table.table()).toBeDefined();
      host.option = { ...host.option, mobile: { template: { data: host.data } } };
      settle();
      expect(text(cards()[0], '.sd-mobile-data-title')).toBe('DH-1');
    }));

    it('uses the derived card for a row whose data throws', fakeAsync(() => {
      const warn = spyOn(console, 'warn');
      create(h =>
        h.data.and.callFake((row: Order) => {
          if (row.id === 2) throw new Error('boom');
          return { title: 'customer' };
        })
      );
      expect(text(cards()[0], '.sd-mobile-data-title')).toBe('An');
      expect(text(cards()[1], '.sd-mobile-data-title')).toBe('DH-2');
      expect(warn.calls.allArgs().filter(args => String(args[0]).includes('threw')).length).toBe(1);
    }));
  });

  describe('when data runs', () => {
    it('does not call data again on change detection alone', fakeAsync(() => {
      create();
      const calls = host.data.calls.count();
      expect(calls).toBe(2);
      for (let i = 0; i < 3; i++) settle();
      expect(host.data.calls.count()).toBe(calls);
    }));

    it('calls data again for every row after table.detectChanges()', fakeAsync(() => {
      create(h => h.data.and.callFake((row: Order) => ({ title: { text: row.customer } })));
      host.rows[0].customer = 'Anh';
      table.detectChanges();
      settle();
      expect(host.data.calls.count()).toBe(4);
      expect(text(cards()[0], '.sd-mobile-data-title')).toBe('Anh');
    }));

    it('calls data again after a reload that returns the same row objects', fakeAsync(() => {
      create(h => h.data.and.callFake((row: Order) => ({ title: { text: row.customer } })));
      host.rows[0].customer = 'Anh';
      void table.reload();
      settle();
      expect(text(cards()[0], '.sd-mobile-data-title')).toBe('Anh');
    }));

    it('calls data again with the new index when the rows move', fakeAsync(() => {
      create(h => {
        h.option.sort = { enable: true };
        h.option.columns[0] = { ...h.option.columns[0], sortable: true };
      });
      host.data.calls.reset();
      table.sort()!.sort({ id: 'code', start: 'desc', disableClear: false });
      settle();
      expect(host.data.calls.allArgs().map(([row, context]) => [row.id, context.index])).toEqual(
        jasmine.arrayWithExactContents([
          [2, 0],
          [1, 1],
        ])
      );
    }));

    it('calls data again only for the row whose selection changed', fakeAsync(() => {
      create();
      host.data.calls.reset();
      cards()[1].querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
      settle();
      expect(host.data.calls.allArgs().map(([row, context]) => [row.id, context.selected])).toEqual([[2, true]]);
      expect(labels(cards()[1]).length).toBe(4);
    }));

    it('re-checks the slots without calling data when the settings change the columns', fakeAsync(() => {
      create();
      host.data.calls.reset();
      const config = table.configuration()!;
      table.configuration.set({
        ...config,
        firstColumns: config.firstColumns.map(column => (column.field === 'warehouse' ? { ...column, title: 'Kho hàng' } : column)),
      });
      settle();
      expect(host.data).not.toHaveBeenCalled();
      expect(labels(cards()[0])).toEqual(['Tổng tiền', 'Kho hàng']);
    }));
  });
});
