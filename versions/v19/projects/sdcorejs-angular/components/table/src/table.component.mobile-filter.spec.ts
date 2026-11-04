import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableRowMobileDefDirective } from './directives/sd-table-row-mobile-def.directive';
import { SdTableFilterDefDirective } from './directives/sd-table-filter-def.directive';

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
    <div class="flex-parent" style="display: flex; width: 360px; padding-top: 40px">
      <div class="flex-item">
        <sd-table autoId="orders" [option]="option">
          <ng-template [sdTableRowMobileDef]="option" let-row="item"
            ><span>{{ row.code }}</span></ng-template
          >
        </sd-table>
      </div>
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
    // why: real pushState / go would leave entries and late popstate events for the next spec (and can step the Karma
    // frame back); history.go plays its popstate at once instead.
    spyOn(history, 'pushState');
    spyOn(history, 'go').and.callFake(() => window.dispatchEvent(new PopStateEvent('popstate')));
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
    it('scrolls inside the table instead of widening it in a flex parent', fakeAsync(() => {
      create();
      const item = element().querySelector<HTMLElement>('.flex-item')!;
      expect(item.getBoundingClientRect().width).toBeLessThanOrEqual(360);
      const row = chipRow()!;
      expect(row.scrollWidth).toBeGreaterThan(row.clientWidth);
    }));

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
      // why: in the full suite, DOM left by other specs can push the row below the small Karma frame.
      button.scrollIntoView({ block: 'center' });
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

    it('writes the value and operator of its own filter only', fakeAsync(() => {
      create();
      apply({ columnFilter: { status: ['s2'] }, externalFilter: { customer: 'An' } });
      chip('code').click();
      settle();
      overlay().querySelector<HTMLButtonElement>('[data-autoid$="-mobile-filter-code-operator"]')!.click();
      settle();
      overlay().querySelectorAll<HTMLButtonElement>('.sd-table-mobile-operator-menu [mat-menu-item]')[1].click();
      settle();
      const input = overlay().querySelector<HTMLInputElement>('.sd-mobile-sheet-body input')!;
      input.value = 'DH';
      input.dispatchEvent(new Event('input'));
      settle();
      sheetButton('apply').click();
      settle();
      const value = table.filterRegister!.value.get();
      expect(value.columnFilter?.['code']).toBe('DH');
      expect(value.columnOperator?.['code']).toBe('EQUAL');
      expect(value.columnFilter?.['status']).toEqual(['s2']);
      expect(value.externalFilter?.['customer']).toBe('An');
    }));

    it('drops the operator of its filter when Clear took a NULL operator back', fakeAsync(() => {
      create();
      apply({ columnOperator: { code: 'NULL' } });
      chip('code').click();
      settle();
      sheetButton('clear').click();
      settle();
      sheetButton('apply').click();
      settle();
      expect('code' in (table.filterRegister!.value.get().columnOperator ?? {})).toBeFalse();
    }));

    it('drops the edits on the scrim', fakeAsync(() => {
      create();
      openStatus();
      tickOption(0);
      overlay().querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
      settle();
      expect(overlay().querySelector('mat-bottom-sheet-container')).toBeNull();
      expect(table.filterRegister!.value.get().columnFilter?.['status'] ?? []).toEqual([]);
    }));

    it('focuses the title on open, so Bỏ chọn looks like on the filter page', fakeAsync(() => {
      create();
      openStatus();
      expect(document.activeElement?.classList).toContain('sd-mobile-sheet-title');
      expect(document.activeElement?.textContent).toContain('Trạng thái');
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

  describe('full filter sheet', () => {
    const openAll = () => {
      element().querySelector<HTMLButtonElement>('[data-autoid$="-mobile-filter"]')!.click();
      settle();
    };
    const sheet = (): HTMLElement | null => overlay().querySelector('.sd-table-mobile-filter-sheet--full');
    const row = (field: string): HTMLButtonElement =>
      overlay().querySelector<HTMLButtonElement>(`[data-autoid$="-mobile-filter-row-${field}"]`)!;
    const button = (suffix: string): HTMLButtonElement =>
      overlay().querySelector<HTMLButtonElement>(
        `[data-autoid$="-mobile-filter-${suffix}"] button, button[data-autoid$="-mobile-filter-${suffix}"]`
      )!;
    const tickOption = (index: number) => {
      overlay().querySelectorAll<HTMLInputElement>('sd-checkbox input[type=checkbox]')[index].click();
      settle();
    };
    const emissions = () => {
      let count = 0;
      const subscription = table.filterRegister!.value.observer.subscribe(() => count++);
      count = 0;
      return { count: () => count, stop: () => subscription.unsubscribe() };
    };

    it('replaces the side drawer with a bottom sheet listing every filter', fakeAsync(() => {
      create();
      expect(element().querySelector('mobile-filter sd-side-drawer')).toBeNull();
      openAll();
      expect(sheet()).not.toBeNull();
      expect(row('customer')).not.toBeNull();
      expect(row('status').textContent).toContain('Tất cả');
    }));

    it('keeps the page edits in the copy after Done; the applied value does not change yet', fakeAsync(() => {
      create();
      openAll();
      row('status').click();
      settle();
      expect(overlay().querySelector('.sd-mobile-sheet-title')?.textContent).toContain('Trạng thái');
      tickOption(2);
      button('done').click();
      settle();
      expect(row('status').textContent).toContain('Status 2');
      expect(row('status').querySelector('.sd-mobile-filter-row-summary--active')).not.toBeNull();
      expect(table.filterRegister!.value.get().columnFilter?.['status'] ?? []).toEqual([]);
    }));

    it('drops edits of several filters on Cancel', fakeAsync(() => {
      create();
      openAll();
      for (const field of ['status', 'warehouse']) {
        row(field).click();
        settle();
        overlay().querySelector<HTMLInputElement>('sd-checkbox input, sd-radio input')!.click();
        settle();
        button('done').click();
        settle();
      }
      button('cancel').click();
      settle();
      expect(sheet()).toBeNull();
      expect(table.filterRegister!.value.get().columnFilter?.['status'] ?? []).toEqual([]);
      expect(table.filterRegister!.value.get().columnFilter?.['warehouse'] ?? null).toBeNull();
    }));

    it('shows "{n} đang lọc", enables Clear all only with a filter, and Clear all + Apply empties everything in one read', fakeAsync(() => {
      create();
      apply({ columnFilter: { status: ['s1'], warehouse: 'HN' }, externalFilter: { customer: 'An' } });
      openAll();
      expect(overlay().querySelector('.sd-mobile-sheet-subtitle')?.textContent).toContain('3');
      expect(button('clear-all').disabled).toBeFalse();
      button('clear-all').click();
      settle();
      expect(overlay().querySelector('.sd-mobile-sheet-subtitle')).toBeNull();
      expect(button('clear-all').disabled).toBeTrue();
      const emitted = emissions();
      button('apply').click();
      settle();
      emitted.stop();
      expect(emitted.count()).toBe(1);
      const value = table.filterRegister!.value.get();
      expect(value.columnFilter?.['status']).toEqual([]);
      expect(value.columnFilter?.['warehouse']).toBeNull();
      expect(value.externalFilter?.['customer']).toBeNull();
    }));

    it('goes back from a page with Escape and Back, then Back closes the sheet', fakeAsync(() => {
      create();
      openAll();
      row('status').click();
      settle();
      overlay()
        .querySelector('.sd-mobile-filter-body')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
      settle();
      expect(sheet()).not.toBeNull();
      expect(row('status')).not.toBeNull();
      expect(document.activeElement).toBe(row('status'));
      row('status').click();
      settle();
      window.dispatchEvent(new PopStateEvent('popstate'));
      settle();
      expect(row('status')).not.toBeNull();
      window.dispatchEvent(new PopStateEvent('popstate'));
      settle();
      expect(sheet()).toBeNull();
    }));

    it('moves focus to the page title when a page opens', fakeAsync(() => {
      create();
      openAll();
      row('warehouse').click();
      settle();
      expect(document.activeElement?.classList).toContain('sd-mobile-sheet-title');
    }));

    it('clears one filter from its page; ← keeps the others and Apply writes both', fakeAsync(() => {
      create();
      apply({ columnFilter: { status: ['s1'], warehouse: 'HN' } });
      openAll();
      row('status').click();
      settle();
      expect(overlay().querySelectorAll('sd-checkbox input:checked').length).toBe(1);
      button('clear').click();
      settle();
      expect(overlay().querySelectorAll('sd-checkbox input:checked').length).toBe(0);
      overlay().querySelector<HTMLButtonElement>('[data-autoid$="-mobile-filter-back"]')!.click();
      settle();
      expect(row('status').textContent).toContain('Tất cả');
      expect(row('warehouse').textContent).toContain('Hà Nội');
      expect(table.filterRegister!.value.get().columnFilter?.['status']).toEqual(['s1']);
      button('apply').click();
      settle();
      const value = table.filterRegister!.value.get();
      expect(value.columnFilter?.['status']).toEqual([]);
      expect(value.columnFilter?.['warehouse']).toBe('HN');
    }));

    it('goes back to the list on Escape with focus on the page title', fakeAsync(() => {
      create();
      openAll();
      row('status').click();
      settle();
      const title = overlay().querySelector<HTMLElement>('.sd-mobile-sheet-title')!;
      expect(document.activeElement).toBe(title);
      title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
      settle();
      expect(sheet()).not.toBeNull();
      expect(row('status')).not.toBeNull();
    }));

    it('drops the copy on the scrim, also from a page', fakeAsync(() => {
      create();
      openAll();
      row('status').click();
      settle();
      tickOption(0);
      overlay().querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
      settle();
      expect(sheet()).toBeNull();
      expect(history.go).toHaveBeenCalledOnceWith(-2);
      expect(table.filterRegister!.value.get().columnFilter?.['status'] ?? []).toEqual([]);
    }));

    it('adds no history entry while the table sits in a dialog or a sheet', fakeAsync(() => {
      create();
      // why: the owner check walks up from the sheet components; the fixture root stands in for the overlay pane.
      element().classList.add('cdk-overlay-pane');
      openAll();
      row('status').click();
      settle();
      tickOption(1);
      button('done').click();
      settle();
      button('apply').click();
      settle();
      expect(history.pushState).not.toHaveBeenCalled();
      expect(history.go).not.toHaveBeenCalled();
      expect(table.filterRegister!.value.get().columnFilter?.['status']).toEqual(['s1']);
    }));

    it('keeps the filter of a column hidden through the settings while it filters', fakeAsync(() => {
      create();
      apply({ columnFilter: { status: ['s1'] } });
      const config = table.configuration()!;
      table.configuration.set({ ...config, firstColumns: config.firstColumns.filter(column => column.field !== 'status') });
      settle();
      expect(chip('status')?.textContent).toContain('Status 1');
      expect(element().querySelector('.sd-mobile-chip-count')?.textContent?.trim()).toBe('1');
      openAll();
      button('clear-all').click();
      settle();
      button('apply').click();
      settle();
      expect(table.filterRegister!.value.get().columnFilter?.['status']).toEqual([]);
      expect(chip('status')).toBeNull();
    }));

    it('has no ✕ (Hủy closes the list) and focuses the title on open, not Xóa tất cả', fakeAsync(() => {
      create();
      apply({ columnFilter: { status: ['s1'] } });
      openAll();
      expect(overlay().querySelector('[data-autoid$="-mobile-filter-close"]')).toBeNull();
      expect(overlay().querySelector('.sd-table-mobile-filter-sheet--full .sd-modal-close-btn')).toBeNull();
      expect(document.activeElement?.classList).toContain('sd-mobile-sheet-title');
      expect(button('clear-all').disabled).toBeFalse();
    }));

    it('shows Từ ngày / Đến ngày as floating labels inside the boxes', fakeAsync(() => {
      create();
      openAll();
      row('createdAt').click();
      settle();
      const dates = Array.from(overlay().querySelectorAll<HTMLElement>('.sd-mobile-field-pair sd-date'));
      expect(dates.length).toBe(2);
      for (const date of dates) {
        expect(date.classList).not.toContain('sd-label-top');
        expect(date.querySelector('mat-label, .mdc-floating-label')).not.toBeNull();
      }
    }));
  });
});

@Component({
  imports: [SdTable, SdTableRowMobileDefDirective, SdTableFilterDefDirective],
  template: `
    <sd-table autoId="custom" [option]="option">
      <ng-template [sdTableRowMobileDef]="option" let-row="item"
        ><span>{{ row.code }}</span></ng-template
      >
      <ng-template sdTableFilterDef="note" let-externalFilter="externalFilter">
        <input class="note-input" [value]="externalFilter.note ?? ''" (input)="externalFilter.note = $any($event.target).value" />
      </ng-template>
    </sd-table>
  `,
})
class CustomFilterHost {
  option: SdTableOption<{ id: number; code: string; at: string }> = {
    type: 'local',
    rowKey: 'id',
    items: () => [{ id: 1, code: 'DH-1', at: '10:00' }],
    filter: {
      externalFilters: [
        { field: 'note', type: 'custom', title: 'Ghi chú' },
        { field: 'day', type: 'date', title: 'Ngày' },
      ],
    },
    columns: [
      { field: 'code', type: 'string', title: 'Mã' },
      { field: 'at', type: 'time', title: 'Giờ' },
    ],
  };
}

/** Handoff table-mobile 5: filters only their own control can edit (templates, time columns) in the filter sheet. */
describe('SdTable mobile filter sheet with custom filters', () => {
  let fixture: ComponentFixture<CustomFilterHost>;
  let table: SdTable<{ id: number; code: string; at: string }>;
  const settle = () => {
    fixture.detectChanges();
    tick(850);
    flush();
    fixture.detectChanges();
  };
  const overlay = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const row = (field: string): HTMLButtonElement | null =>
    overlay().querySelector<HTMLButtonElement>(`[data-autoid$="-mobile-filter-row-${field}"]`);
  const button = (suffix: string): HTMLButtonElement | null =>
    overlay().querySelector<HTMLButtonElement>(
      `[data-autoid$="-mobile-filter-${suffix}"] button, button[data-autoid$="-mobile-filter-${suffix}"]`
    );
  const create = () => {
    fixture = TestBed.createComponent(CustomFilterHost);
    settle();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  };
  const openAll = () => {
    fixture.nativeElement.querySelector('[data-autoid$="-mobile-filter"]')!.click();
    settle();
  };

  beforeEach(() => {
    // why: real pushState / go would leave entries and late popstate events for the next spec (and can step the Karma
    // frame back); history.go plays its popstate at once instead.
    spyOn(history, 'pushState');
    spyOn(history, 'go').and.callFake(() => window.dispatchEvent(new PopStateEvent('popstate')));
    TestBed.configureTestingModule({
      imports: [CustomFilterHost],
      providers: [provideNoopAnimations(), { provide: SdViewportService, useValue: { isMobile: signal(true) } }],
    });
  });
  afterEach(() =>
    overlay()
      .querySelectorAll('.cdk-overlay-pane')
      .forEach(pane => pane.remove())
  );

  it('lists them in the sheet without a summary, and gives them no chip', fakeAsync(() => {
    create();
    expect(fixture.nativeElement.querySelector('[data-autoid$="-mobile-filter-note"], [data-autoid$="-mobile-filter-at"]')).toBeNull();
    openAll();
    expect(row('note')?.textContent).toContain('Ghi chú');
    expect(row('at')?.textContent).toContain('Giờ');
    expect(row('note')!.querySelector('.sd-mobile-filter-row-summary')).toBeNull();
    expect(row('at')!.querySelector('.sd-mobile-filter-row-summary')).toBeNull();
  }));

  it('edits a filter template on its page without Clear; Apply writes what it set', fakeAsync(() => {
    create();
    openAll();
    row('note')!.click();
    settle();
    expect(button('clear')).toBeNull();
    const input = overlay().querySelector<HTMLInputElement>('.note-input')!;
    input.value = 'urgent';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    settle();
    button('done')!.click();
    settle();
    // why: a template writes keys the table cannot know, so it never counts as an active filter.
    expect(overlay().querySelector('.sd-mobile-sheet-subtitle')).toBeNull();
    button('apply')!.click();
    settle();
    expect(table.filterRegister!.value.get().externalFilter?.['note']).toBe('urgent');
  }));

  it('shows a box for a date external filter off the bar, counts it and clears it from its page', fakeAsync(() => {
    create();
    table.filterRegister!.value.set({ externalFilter: { day: '2026/10/01' } });
    settle();
    openAll();
    expect(overlay().querySelector('.sd-mobile-sheet-subtitle')?.textContent).toContain('1');
    row('day')!.click();
    settle();
    expect(overlay().querySelector('.sd-mobile-sheet-body sd-date')).not.toBeNull();
    button('clear')!.click();
    settle();
    button('done')!.click();
    settle();
    expect(overlay().querySelector('.sd-mobile-sheet-subtitle')).toBeNull();
    button('apply')!.click();
    settle();
    expect(table.filterRegister!.value.get().externalFilter?.['day'] ?? null).toBeNull();
  }));

  it('counts a custom column with a value, shows its column filter and clears it', fakeAsync(() => {
    create();
    table.filterRegister!.value.set({ columnFilter: { at: '10:00' } });
    settle();
    openAll();
    expect(overlay().querySelector('.sd-mobile-sheet-subtitle')?.textContent).toContain('1');
    row('at')!.click();
    settle();
    expect(overlay().querySelector('column-filter')).not.toBeNull();
    button('clear')!.click();
    settle();
    button('done')!.click();
    settle();
    expect(overlay().querySelector('.sd-mobile-sheet-subtitle')).toBeNull();
    button('apply')!.click();
    settle();
    // why: the time column filter fills an empty range back in once it renders again; either way nothing filters.
    expect(table.filterRegister!.value.get().columnFilter?.['at'] ?? { from: null, to: null }).toEqual({ from: null, to: null });
  }));
});
