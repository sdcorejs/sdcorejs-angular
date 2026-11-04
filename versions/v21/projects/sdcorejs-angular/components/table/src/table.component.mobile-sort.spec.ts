import { Component, signal, type WritableSignal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableRowMobileDefDirective } from './directives/sd-table-row-mobile-def.directive';
import { SdTablePullRefreshComponent } from './components/mobile-toolbar/pull-refresh.component';
import { SdTableMobileSortSheetComponent } from './components/mobile-sort/mobile-sort-sheet.component';

interface Row {
  id: number;
  name: string;
  total: number;
  hiddenNote: string;
}

@Component({
  imports: [SdTable, SdTableRowMobileDefDirective],
  template: `
    <div style="width: 360px">
      <sd-table autoId="sorted" [option]="option">
        <ng-template [sdTableRowMobileDef]="option" let-row="item"
          ><span class="row-name">{{ row.name }}</span></ng-template
        >
      </sd-table>
    </div>
  `,
})
class SortHost {
  rows: Row[] = [
    { id: 1, name: 'B', total: 2, hiddenNote: 'y' },
    { id: 2, name: 'A', total: 3, hiddenNote: 'x' },
  ];
  fetch = jasmine.createSpy('items').and.callFake(() => this.rows);
  option: SdTableOption<Row> = {
    type: 'local',
    rowKey: 'id',
    items: this.fetch,
    columns: [
      { field: 'name', type: 'string', title: 'Tên', sortable: true },
      { field: 'total', type: 'number', title: 'Tổng', sortable: true },
      { field: 'hiddenNote', type: 'string', title: 'Ghi chú', sortable: true, invisible: true },
    ],
    sort: { enable: true },
    filter: { disabled: true },
    reload: { visible: true },
    export: { type: 'default', visible: 'ALL' },
  };
}

/** Handoff table-mobile 2, 3.2, 6, 7 and 13.4–13.5: sort, Tools, footer and pull to refresh. */
describe('SdTable mobile sort and tools', () => {
  let fixture: ComponentFixture<SortHost>;
  let host: SortHost;
  let table: SdTable<Row>;
  const settle = () => {
    fixture.detectChanges();
    tick(850);
    flush();
    fixture.detectChanges();
  };
  const element = (): HTMLElement => fixture.nativeElement;
  const overlay = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const byAutoId = (suffix: string): HTMLElement | null => element().querySelector(`[data-autoid$="${suffix}"]`);
  const names = () => Array.from(element().querySelectorAll('.row-name')).map(node => node.textContent);
  const create = (configure?: (host: SortHost) => void) => {
    fixture = TestBed.createComponent(SortHost);
    host = fixture.componentInstance;
    configure?.(host);
    settle();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  };
  const openSort = () => {
    byAutoId('-mobile-sort')!.click();
    settle();
  };
  const radios = (): HTMLInputElement[] =>
    Array.from(overlay().querySelectorAll<HTMLInputElement>('.sd-mobile-sort-columns input[type=radio]'));
  const direction = (index: number) => {
    overlay().querySelectorAll<HTMLButtonElement>('.sd-mobile-sort-direction button')[index].click();
    settle();
  };

  beforeEach(() => {
    // why: real pushState / go would leave entries and late popstate events for the next spec (and can step the Karma
    // frame back); history.go plays its popstate at once instead.
    spyOn(history, 'pushState');
    spyOn(history, 'go').and.callFake(() => window.dispatchEvent(new PopStateEvent('popstate')));
    TestBed.configureTestingModule({
      imports: [SortHost],
      providers: [provideNoopAnimations(), { provide: SdViewportService, useValue: { isMobile: signal(true) } }],
    });
  });
  afterEach(() =>
    overlay()
      .querySelectorAll('.cdk-overlay-pane')
      .forEach(pane => pane.remove())
  );

  describe('sort', () => {
    it('puts a swap_vert button in the top row when the table has no chip row', fakeAsync(() => {
      create();
      expect(element().querySelector('.sd-mobile-chips')).toBeNull();
      const button = byAutoId('-mobile-sort')!;
      expect(button.closest('.sd-mobile-top')).not.toBeNull();
      expect(button.textContent).toContain('swap_vert');
    }));

    it('lists sortable columns, hidden ones included, and sorts at once on a pick, then closes', fakeAsync(() => {
      create();
      openSort();
      expect(radios().length).toBe(3);
      radios()[0].click();
      settle();
      expect(table.sortState()).toEqual({ active: 'name', direction: 'asc' });
      expect(names()).toEqual(['A', 'B']);
      expect(overlay().querySelector('.sd-table-mobile-sort-sheet')).toBeNull();
    }));

    it('re-sorts on a direction change while a column is picked and keeps the sheet open', fakeAsync(() => {
      create();
      openSort();
      radios()[0].click();
      settle();
      openSort();
      direction(1);
      expect(table.sortState()).toEqual({ active: 'name', direction: 'desc' });
      expect(names()).toEqual(['B', 'A']);
      expect(overlay().querySelector('.sd-table-mobile-sort-sheet')).not.toBeNull();
    }));

    it('keeps a direction picked before any column for the next pick', fakeAsync(() => {
      create();
      openSort();
      direction(1);
      expect(table.sortState().active).toBe('');
      radios()[1].click();
      settle();
      expect(table.sortState()).toEqual({ active: 'total', direction: 'desc' });
    }));

    it('clears the sort, and disables Clear sort without one', fakeAsync(() => {
      create();
      openSort();
      const clear = () =>
        overlay().querySelector<HTMLButtonElement>(
          '[data-autoid$="-mobile-sort-clear"] button, button[data-autoid$="-mobile-sort-clear"]'
        )!;
      expect(clear().disabled).toBeTrue();
      radios()[1].click();
      settle();
      openSort();
      clear().click();
      settle();
      expect(table.sortState().direction).toBe('');
    }));

    it('focuses the title on open, so Bỏ sắp xếp looks like Bỏ chọn', fakeAsync(() => {
      create();
      openSort();
      radios()[0].click();
      settle();
      openSort();
      expect(document.activeElement?.classList).toContain('sd-mobile-sheet-title');
      const clear = overlay().querySelector<HTMLElement>('[data-autoid$="-mobile-sort-clear"]')!;
      expect(clear.contains(document.activeElement)).toBeFalse();
    }));

    it('names the top-row button after the active sort', fakeAsync(() => {
      create();
      const plain = byAutoId('-mobile-sort')!.getAttribute('aria-label');
      openSort();
      radios()[1].click();
      settle();
      const label = byAutoId('-mobile-sort')!.getAttribute('aria-label')!;
      expect(label).not.toBe(plain ?? '');
      expect(label).toContain('Tổng');
    }));

    it('leaves hidden: true columns out and shows the settings title', fakeAsync(() => {
      create(h => h.option.columns.push({ field: 'secret' as 'name', type: 'string', title: 'Bí mật', sortable: true, hidden: true }));
      const config = table.configuration()!;
      table.configuration.set({
        ...config,
        firstColumns: config.firstColumns.map(column => (column.field === 'name' ? { ...column, title: 'Họ tên' } : column)),
      });
      settle();
      expect(table.mobileSortColumns().map(column => [column.field, column.title])).toEqual([
        ['name', 'Họ tên'],
        ['total', 'Tổng'],
        ['hiddenNote', 'Ghi chú'],
      ]);
    }));

    it('follows a sort set on the desktop table', fakeAsync(() => {
      create();
      const isMobile = TestBed.inject(SdViewportService).isMobile as WritableSignal<boolean>;
      isMobile.set(false);
      settle();
      table.sort()!.sort({ id: 'total', start: 'desc', disableClear: false });
      settle();
      isMobile.set(true);
      settle();
      expect(byAutoId('-mobile-sort')!.getAttribute('aria-label')).toContain('Tổng');
      openSort();
      expect(radios()[1].checked).toBeTrue();
      expect(fixture.debugElement.query(By.directive(SdTableMobileSortSheetComponent)).componentInstance.direction()).toBe('desc');
    }));

    it('closes on Back and takes its history entry back when closed from the UI', fakeAsync(() => {
      create();
      openSort();
      expect(history.pushState).toHaveBeenCalledTimes(1);
      window.dispatchEvent(new PopStateEvent('popstate'));
      settle();
      expect(overlay().querySelector('.sd-table-mobile-sort-sheet')).toBeNull();
      expect(history.go).not.toHaveBeenCalled();

      openSort();
      radios()[0].click();
      settle();
      expect(overlay().querySelector('.sd-table-mobile-sort-sheet')).toBeNull();
      expect(history.go).toHaveBeenCalledOnceWith(-1);
    }));
  });

  describe('tools', () => {
    it('moves ⋮ to the top row with the old autoId and name, and leaves only the paginator in the footer', fakeAsync(() => {
      create();
      const tools = byAutoId('-mobile-tools')!;
      expect(tools.closest('.sd-mobile-top')).not.toBeNull();
      expect(tools.getAttribute('aria-label')).toBeTruthy();
      expect(element().querySelector('.c-paginator [data-autoid$="-mobile-tools"]')).toBeNull();
      expect(element().querySelector('.sd-mobile-tools-trigger')).toBeNull();
    }));

    it('drops filter, sort and reload from the Tools sheet and lays out two exports flat', fakeAsync(() => {
      create();
      expect(table.mobileToolsActions().map(action => action.key)).toEqual(['tool-export-excel', 'tool-export-csv']);
      byAutoId('-mobile-tools')!.click();
      settle();
      expect(overlay().querySelector('[data-autoid$="-mobile-tool-reload"]')).toBeNull();
      expect(overlay().querySelector('[data-autoid$="-mobile-tool-export-excel"]')).not.toBeNull();
    }));

    it('hides ⋮ when no tool is left', fakeAsync(() => {
      create(h => {
        h.option.export = undefined;
      });
      expect(byAutoId('-mobile-tools')).toBeNull();
    }));

    it('offers one entry for a custom export, and disables the exports while one runs', fakeAsync(() => {
      const onExport = jasmine.createSpy('onExport').and.resolveTo();
      create(h => (h.option.export = { type: 'custom', onExport }));
      expect(table.mobileToolsActions().map(action => action.key)).toEqual(['tool-export']);

      create();
      table.exporting.set(true);
      expect(table.mobileToolsActions().every(action => action.disabled)).toBeTrue();
      table.exporting.set(false);
    }));

    it('leaves no empty band above the cards when the top row has nothing to show', fakeAsync(() => {
      create(h => {
        h.option.export = undefined;
        h.option.sort = { enable: false };
      });
      const top = element().querySelector<HTMLElement>('.sd-mobile-top')!;
      expect(top.classList).toContain('sd-mobile-top--empty');
      expect(top.getBoundingClientRect().height).toBe(0);
      // The keyboard Reload is still there.
      expect(byAutoId('-mobile-reload')).not.toBeNull();
    }));
  });

  describe('pull to refresh', () => {
    const pull = (from: number, to: number) => {
      // why: other specs scroll the page (scrollIntoView); a pull only counts with the list at the top.
      window.scrollTo(0, 0);
      const list = element().querySelector<HTMLElement>('.c-table')!;
      const touch = (type: string, y: number) =>
        list.dispatchEvent(
          new TouchEvent(type, {
            touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: list, clientY: y })],
            bubbles: true,
          })
        );
      touch('touchstart', from);
      touch('touchmove', to);
      fixture.detectChanges();
      touch('touchend', to);
      settle();
    };

    it('reloads once past 64px, not below', fakeAsync(() => {
      create();
      host.fetch.calls.reset();
      pull(100, 150);
      expect(host.fetch).not.toHaveBeenCalled();
      pull(100, 180);
      expect(host.fetch).toHaveBeenCalledTimes(1);
    }));

    it('listens only with reload.visible', fakeAsync(() => {
      create(h => (h.option.reload = { visible: false }));
      expect(fixture.debugElement.query(By.directive(SdTablePullRefreshComponent))?.componentInstance.enabled() ?? false).toBeFalse();
      expect(byAutoId('-mobile-reload')).toBeNull();
    }));

    it('offers a keyboard reload button that only shows with focus', fakeAsync(() => {
      create();
      const button = byAutoId('-mobile-reload') as HTMLButtonElement;
      expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(1);
      host.fetch.calls.reset();
      button.click();
      settle();
      expect(host.fetch).toHaveBeenCalledTimes(1);
    }));
  });
});
