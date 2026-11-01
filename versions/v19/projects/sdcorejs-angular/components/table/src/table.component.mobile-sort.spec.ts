import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableRowMobileDefDirective } from './directives/sd-table-row-mobile-def.directive';
import { SdTablePullRefreshComponent } from './components/mobile-toolbar/pull-refresh.component';

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
