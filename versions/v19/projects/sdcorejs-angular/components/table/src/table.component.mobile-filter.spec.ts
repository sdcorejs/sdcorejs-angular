import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableRowMobileDefDirective } from './directives/sd-table-row-mobile-def.directive';

interface Order {
  id: number;
  code: string;
  customer: string;
  status: string;
  warehouse: string;
  total: number;
  createdAt: string;
}

const STATUSES = Array.from({ length: 10 }, (_, index) => ({ id: `s${index}`, name: `Status ${index}` }));

@Component({
  imports: [SdTable, SdTableRowMobileDefDirective],
  template: `
    <div style="width: 360px; padding-top: 40px">
      <sd-table autoId="orders" [option]="option">
        <ng-template [sdTableRowMobileDef]="option" let-row="item"
          ><span>{{ row.code }}</span></ng-template
        >
      </sd-table>
    </div>
  `,
})
class FilterHost {
  rows: Order[] = [{ id: 1, code: 'DH-1', customer: 'An', status: 's1', warehouse: 'HN', total: 10, createdAt: '2026/10/05' }];
  fetch = jasmine.createSpy('items').and.callFake(() => this.rows);
  option: SdTableOption<Order> = {
    type: 'local',
    rowKey: 'id',
    items: this.fetch,
    filter: {
      externalFilters: [{ field: 'customer', type: 'string', title: 'Khách hàng' }],
    },
    columns: [
      { field: 'code', type: 'string', title: 'Mã', filter: { operator: { enable: true, list: ['CONTAIN', 'EQUAL'] } } },
      {
        field: 'status',
        type: 'values',
        title: 'Trạng thái',
        option: { items: STATUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
      },
      {
        field: 'warehouse',
        type: 'values',
        title: 'Kho',
        option: {
          items: [
            { id: 'HN', name: 'Hà Nội' },
            { id: 'HCM', name: 'Hồ Chí Minh' },
          ],
          valueField: 'id',
          displayField: 'name',
        },
      },
      { field: 'total', type: 'number', title: 'Tổng tiền', filter: { type: 'split-number' } },
      { field: 'createdAt', type: 'date', title: 'Ngày tạo' },
    ],
  };
}

/** Handoff table-mobile 3–4 and 13.1–13.2: the filter chips and the sheet of one filter. */
describe('SdTable mobile filter chips', () => {
  let fixture: ComponentFixture<FilterHost>;
  let host: FilterHost;
  let table: SdTable<Order>;
  const settle = () => {
    fixture.detectChanges();
    tick(850);
    flush();
    fixture.detectChanges();
  };
  const element = (): HTMLElement => fixture.nativeElement;
  const overlay = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const chipRow = (): HTMLElement | null => element().querySelector('.sd-mobile-chips');
  const chips = (): HTMLButtonElement[] => Array.from(element().querySelectorAll<HTMLButtonElement>('.sd-mobile-chip'));
  const chip = (field: string): HTMLButtonElement =>
    element().querySelector<HTMLButtonElement>(`[data-autoid$="-mobile-filter-${field}"]`)!;
  const sheetButton = (suffix: string): HTMLButtonElement =>
    overlay().querySelector<HTMLButtonElement>(`[data-autoid$="-${suffix}"] button, button[data-autoid$="-${suffix}"]`)!;
  const apply = (value: Parameters<NonNullable<SdTable<Order>['filterRegister']>['value']['set']>[0]) => {
    table.filterRegister!.value.set(value);
    settle();
  };
  const create = (configure?: (host: FilterHost) => void) => {
    fixture = TestBed.createComponent(FilterHost);
    host = fixture.componentInstance;
    configure?.(host);
    settle();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FilterHost],
      providers: [provideNoopAnimations(), { provide: SdViewportService, useValue: { isMobile: signal(true) } }],
    });
  });
  afterEach(() =>
    overlay()
      .querySelectorAll('.cdk-overlay-pane')
      .forEach(pane => pane.remove())
  );

  describe('chip row', () => {
    it('has no chip row when the table has no filter', fakeAsync(() => {
      create(h => {
        h.option.filter = { disabled: true };
      });
      expect(chipRow()).toBeNull();
    }));

    it('keeps the order Filters → divider → external filters → columns, filtering or not', fakeAsync(() => {
      create();
      const order = () => chips().map(button => button.getAttribute('data-autoid')!.replace(/^.*-mobile-filter-?/, '') || 'filters');
      expect(order()).toEqual(['filters', 'customer', 'code', 'status', 'warehouse', 'total', 'createdAt']);
      expect(chipRow()!.querySelector('.sd-mobile-chip-divider')).not.toBeNull();
      apply({ columnFilter: { status: ['s2'], warehouse: 'HN' } });
      expect(order()).toEqual(['filters', 'customer', 'code', 'status', 'warehouse', 'total', 'createdAt']);
    }));

    it('counts the active filters and hides the count at zero', fakeAsync(() => {
      create();
      const filters = chip('');
      expect(element().querySelector('.sd-mobile-chip-count')).toBeNull();
      expect(element().querySelector('[data-autoid$="-mobile-filter"]')!.getAttribute('aria-label')).toContain('0');
      apply({ columnFilter: { status: ['s2'], total: { from: 5, to: null } }, externalFilter: { customer: 'An' } });
      expect(element().querySelector('.sd-mobile-chip-count')?.textContent?.trim()).toBe('3');
      expect(filters).toBeDefined();
    }));

    it('summarises values like the query bar: one label, several as first +n, ranges, string with its operator', fakeAsync(() => {
      create();
      apply({
        columnFilter: {
          status: ['s2', 's3'],
          warehouse: 'HN',
          total: { from: 5, to: 9 },
          code: 'DH',
          createdAt: { from: '2026/10/01', to: '2026/10/31' },
        },
        columnOperator: { code: 'EQUAL' },
      });
      expect(chip('status').textContent).toContain('Trạng thái: Status 2 +1');
      expect(chip('warehouse').textContent).toContain('Kho: Hà Nội');
      expect(chip('total').textContent).toContain('Tổng tiền: 5 – 9');
      expect(chip('createdAt').textContent).toContain('Ngày tạo: 01/10 – 31/10/2026');
      expect(chip('code').textContent).toMatch(/Mã: .+ DH/);
      expect(chip('status').classList).toContain('sd-mobile-chip--active');
      expect(chip('customer').classList).not.toContain('sd-mobile-chip--active');
    }));

    it('cuts a chip wider than 240px with an ellipsis', fakeAsync(() => {
      create();
      apply({ externalFilter: { customer: 'A very long customer name that does not fit on one chip at all' } });
      const button = chip('customer');
      expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(240);
      expect(getComputedStyle(button.querySelector('.sd-mobile-chip-text')!).textOverflow).toBe('ellipsis');
    }));

    it('gives 32px chips a 44px touch area without a taller row', fakeAsync(() => {
      create();
      const button = chip('customer');
      const box = button.getBoundingClientRect();
      expect(box.height).toBe(32);
      expect(button.contains(document.elementFromPoint(box.left + 10, box.top - 5))).toBeTrue();
      expect(button.contains(document.elementFromPoint(box.left + 10, box.bottom + 5))).toBeTrue();
    }));
  });

  describe('sheet of one filter', () => {
    const openStatus = () => {
      chip('status').click();
      settle();
    };
    const tickOption = (index: number) => {
      overlay().querySelectorAll<HTMLInputElement>('sd-checkbox input[type=checkbox]')[index].click();
      settle();
    };

    const closeWays: [string, () => void][] = [
      ['Cancel', () => sheetButton('cancel').click()],
      [
        'Escape',
        () =>
          overlay()
            .querySelector('.sd-mobile-sheet-head')!
            .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true })),
      ],
      ['Back', () => window.dispatchEvent(new PopStateEvent('popstate'))],
    ];
    for (const [name, close] of closeWays) {
      it(
        'drops the edits on ' + name,
        fakeAsync(() => {
          create();
          openStatus();
          tickOption(0);
          close();
          settle();
          expect(overlay().querySelector('mat-bottom-sheet-container')).toBeNull();
          expect(table.filterRegister!.value.get().columnFilter?.['status'] ?? []).toEqual([]);
        })
      );
    }

    it('applies the filter and reads once', fakeAsync(() => {
      create();
      openStatus();
      tickOption(1);
      let emitted = 0;
      const subscription = table.filterRegister!.value.observer.subscribe(() => emitted++);
      emitted = 0;
      sheetButton('apply').click();
      settle();
      subscription.unsubscribe();
      expect(table.filterRegister!.value.get().columnFilter?.['status']).toEqual(['s1']);
      expect(emitted).toBe(1);
      expect(element().querySelectorAll('.sd-mobile-card').length).toBe(1);
      expect(chip('status').textContent).toContain('Status 1');
    }));

    it('clears the copy only; Apply writes the cleared value', fakeAsync(() => {
      create();
      apply({ columnFilter: { status: ['s2'] } });
      openStatus();
      sheetButton('clear').click();
      settle();
      expect(overlay().querySelectorAll('sd-checkbox input:checked').length).toBe(0);
      expect(table.filterRegister!.value.get().columnFilter?.['status']).toEqual(['s2']);
      sheetButton('apply').click();
      settle();
      expect(table.filterRegister!.value.get().columnFilter?.['status']).toEqual([]);
    }));

    it('adds a search box only above 8 options', fakeAsync(() => {
      create();
      openStatus();
      expect(overlay().querySelector('[data-autoid*="-mobile-filter-status-search"]')).not.toBeNull();
      sheetButton('cancel').click();
      settle();
      chip('warehouse').click();
      settle();
      expect(overlay().querySelector('[data-autoid*="-mobile-filter-warehouse-search"]')).toBeNull();
    }));
  });
});
