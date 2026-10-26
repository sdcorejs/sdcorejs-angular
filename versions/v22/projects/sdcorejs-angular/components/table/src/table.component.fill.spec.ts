import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SD_TABLE_LAYOUT } from './configurations/table-layout';
import { SdTableOption } from './models/table-option.model';
import { SdTable } from './table.component';

interface Row {
  id: number;
  name: string;
}

const rows = (count: number): Row[] => Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `Đơn ${index + 1}` }));

// why: sd-page-list cung cấp layout này; test giả lập bằng một object dùng chung để đổi target và compact.
const layout = {
  fillTarget: signal<Element | null>(null),
  externalFilterCollapsed: signal(false),
};

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdTable],
  template: `
    <div class="frame" [style.height.px]="height()">
      <div style="height: 100px; flex: none">Trên bảng</div>
      <sd-table [option]="option()" autoId="fill"></sd-table>
    </div>
  `,
  styles: `
    .frame {
      display: flex;
      flex-direction: column;
      width: 900px;
    }
  `,
})
class FillHost {
  readonly height = signal(500);
  readonly option = signal<SdTableOption<Row>>({
    type: 'local',
    items: () => rows(3),
    columns: [{ field: 'name', type: 'string', title: 'Tên' }],
    paginate: { pageSize: 20, pages: [10, 20] },
    reload: { visible: true },
  });
}

describe('SdTable fill mode', () => {
  let fixture: ComponentFixture<FillHost>;
  const table = () => fixture.nativeElement.querySelector('sd-table') as HTMLElement;
  const rect = (selector: string) => table().querySelector(selector)!.getBoundingClientRect();

  beforeEach(() => {
    layout.fillTarget.set(null);
    layout.externalFilterCollapsed.set(false);
    TestBed.configureTestingModule({
      imports: [FillHost, NoopAnimationsModule],
      providers: [
        // why: the Karma frame is narrower than the mobile breakpoint; pin desktop.
        { provide: SdViewportService, useValue: { isMobile: signal(false) } },
        { provide: SD_TABLE_LAYOUT, useValue: layout },
      ],
    });
  });

  const render = (patch?: Partial<SdTableOption<Row>>) => {
    fixture = TestBed.createComponent(FillHost);
    if (patch) fixture.componentInstance.option.update(option => ({ ...option, ...patch }) as SdTableOption<Row>);
    fixture.detectChanges();
    settle();
  };

  const settle = () => {
    tick(250);
    flushMicrotasks();
    tick();
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };

  it('renders a one-line row 36px high instead of the 52px Material default', fakeAsync(() => {
    render();
    const row = table().querySelector('tr.c-row') as HTMLElement;
    expect(row.getBoundingClientRect().height).toBe(36);
  }));

  it('keeps its own height without a layout target', fakeAsync(() => {
    render();
    expect(table().classList).not.toContain('sd-table--fill');
  }));

  it('fills the space left in a flex column when the layout targets it', fakeAsync(() => {
    render();
    layout.fillTarget.set(table());
    settle();

    expect(table().classList).toContain('sd-table--fill');
    expect(table().getBoundingClientRect().height).toBe(400);
    expect(rect('.c-paginator').bottom).toBe(table().getBoundingClientRect().bottom);
    expect(rect('.c-paginator').height).toBeGreaterThanOrEqual(48);
  }));

  it('also fills when the target is a wrapper that contains it', fakeAsync(() => {
    render();
    layout.fillTarget.set(fixture.nativeElement.querySelector('.frame'));
    settle();
    expect(table().classList).toContain('sd-table--fill');
  }));

  it('keeps the same height and footer position from 0 to 3 rows', fakeAsync(() => {
    render({ items: () => [] });
    layout.fillTarget.set(table());
    settle();
    const empty = { height: table().getBoundingClientRect().height, footer: rect('.c-paginator').top };

    fixture.componentInstance.option.update(option => ({ ...option, items: () => rows(3) }) as SdTableOption<Row>);
    fixture.detectChanges();
    settle();
    layout.fillTarget.set(table());
    settle();

    expect(table().getBoundingClientRect().height).toBe(empty.height);
    expect(rect('.c-paginator').top).toBe(empty.footer);
  }));

  it('keeps room for the header and five rows when the space is too small', fakeAsync(() => {
    render();
    fixture.componentInstance.height.set(200);
    layout.fillTarget.set(table());
    settle();

    const head = rect('thead').height;
    expect(rect('.c-table').height).toBeGreaterThanOrEqual(head + 5 * 36);
    expect(table().getBoundingClientRect().height).toBeGreaterThan(100);
  }));

  describe('external filter', () => {
    const withFilters = (extra: object = {}) =>
      render({
        filter: { externalFilters: [{ field: 'note', title: 'Ghi chú', type: 'string' }], ...extra },
      } as Partial<SdTableOption<Row>>);
    const body = () => table().querySelector('external-filter .sd-external-filter-body');

    it('starts collapsed when the layout asks for it and the table is the target', fakeAsync(() => {
      layout.externalFilterCollapsed.set(true);
      withFilters();
      expect(body()).not.toBeNull();

      layout.fillTarget.set(table());
      settle();
      expect(body()).toBeNull();
    }));

    it('keeps a filter the user opened until compact changes again', fakeAsync(() => {
      layout.externalFilterCollapsed.set(true);
      withFilters();
      layout.fillTarget.set(table());
      settle();

      (table().querySelector('external-filter .sd-section-collapse-toggle') as HTMLElement).click();
      settle();
      expect(body()).withContext('opened by the user').not.toBeNull();

      layout.externalFilterCollapsed.set(false);
      settle();
      expect(body()).withContext('compact off').not.toBeNull();
      layout.externalFilterCollapsed.set(true);
      settle();
      expect(body()).withContext('compact on again').toBeNull();
    }));

    it('follows filter.externalFilterCollapsed before the layout', fakeAsync(() => {
      layout.externalFilterCollapsed.set(true);
      withFilters({ externalFilterCollapsed: false });
      layout.fillTarget.set(table());
      settle();
      expect(body()).not.toBeNull();
    }));

    it('honours filter.externalFilterCollapsed outside sd-page-list', fakeAsync(() => {
      withFilters({ externalFilterCollapsed: true });
      expect(body()).toBeNull();
    }));

    it('never collapses a filter that cannot be expanded again', fakeAsync(() => {
      withFilters({ externalFilterCollapsed: true, collapsible: false });
      expect(body()).not.toBeNull();
    }));
  });
});
