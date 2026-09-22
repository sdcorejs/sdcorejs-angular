import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';

describe('sd-table grouped header layout', () => {
  let fixture: ComponentFixture<SdTable>;
  const option = (count = 12): SdTableOption => ({
    type: 'local',
    items: () => Array.from({ length: count }, (_, id) => ({ id, name: `Item ${id}`, amount: id })),
    columns: [
      { field: 'name', title: 'Name', type: 'string', width: '180px' },
      {
        field: 'metrics',
        title: 'Metrics',
        type: 'children',
        children: [{ field: 'amount', title: 'Amount', type: 'number', width: '140px' }],
      },
    ],
  });
  function render(value: SdTableOption): void {
    fixture.componentRef.setInput('option', value);
    fixture.detectChanges();
    tick(1000);
    flush();
    fixture.detectChanges();
  }
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdTable],
      providers: [{ provide: SdViewportService, useValue: { isMobile: signal(false) } }],
    });
    fixture = TestBed.createComponent(SdTable);
    fixture.nativeElement.style.width = '600px';
  });

  it('aligns filters across spanning and child headers', fakeAsync(() => {
    render(option());
    const filters = Array.from(fixture.nativeElement.querySelectorAll('thead column-filter')) as HTMLElement[];
    expect(filters.length).toBe(2);
    expect(Math.abs(filters[0].getBoundingClientRect().bottom - filters[1].getBoundingClientRect().bottom)).toBeLessThan(1);
  }));

  it('centers standalone titles across both title rows, independently from the filters', fakeAsync(() => {
    render(option());
    const cell = fixture.nativeElement.querySelector('th.mat-column-name') as HTMLElement;
    const title = cell.querySelector('.c-header-title') as HTMLElement;
    const cellBox = cell.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    expect(Math.abs((titleBox.top + titleBox.bottom) / 2 - (cellBox.top + cellBox.bottom) / 2)).toBeLessThan(1);
    expect(cell.querySelector('column-filter')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('thead tr').length).toBe(3);
    const group = fixture.nativeElement.querySelector('th.mat-column-metrics') as HTMLElement;
    expect(group.getBoundingClientRect().height).toBeLessThanOrEqual(32);
  }));

  it('keeps centered standalone titles when the filter row is hidden', fakeAsync(() => {
    render({ ...option(), filter: { hideInlineFilter: true } });
    const cell = fixture.nativeElement.querySelector('th.mat-column-name') as HTMLElement;
    const title = cell.querySelector('.c-header-title') as HTMLElement;
    const cellBox = cell.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    expect(Math.abs((titleBox.top + titleBox.bottom) / 2 - (cellBox.top + cellBox.bottom) / 2)).toBeLessThan(1);
    const visibleRows = Array.from(fixture.nativeElement.querySelectorAll('thead tr') as NodeListOf<HTMLElement>).filter(
      row => getComputedStyle(row).display !== 'none'
    );
    expect(visibleRows.length).toBe(2);
  }));

  it('shows auto filters for both standalone and child columns above the threshold', fakeAsync(() => {
    render({ ...option(), filter: { hideInlineFilter: 'auto' } });
    expect(fixture.nativeElement.querySelectorAll('thead column-filter').length).toBe(2);
  }));

  it('hides all inline filters together for small auto tables and explicit hiding', fakeAsync(() => {
    render({ ...option(2), filter: { hideInlineFilter: 'auto' } });
    expect(fixture.nativeElement.querySelectorAll('thead column-filter').length).toBe(0);
    render({ ...option(), filter: { hideInlineFilter: true } });
    expect(fixture.nativeElement.querySelectorAll('thead column-filter').length).toBe(0);
    render(option());
    expect(fixture.nativeElement.querySelectorAll('thead column-filter').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('thead tr').length).toBe(3);
  }));
});
