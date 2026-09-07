import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ENTER, SPACE } from '@angular/cdk/keycodes';
import axe, { AxeResults, RunOptions } from 'axe-core';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdTableColumn } from './models/table-column.model';
import { SdTableTitleDefDirective } from './directives/sd-table-title-def.directive';
import { SdColumnResizeDirective } from './directives/sd-column-resize.directive';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';

interface EmployeeRow {
  id: number;
  name: string;
  age: number;
}

type LocalTableOption = Extract<SdTableOption<EmployeeRow>, { type: 'local' }>;
type ServerTableOption = Extract<SdTableOption<EmployeeRow>, { type: 'server' }>;

const ROWS: EmployeeRow[] = [
  { id: 1, name: 'Alice', age: 31 },
  { id: 2, name: 'Bob', age: 28 },
];

const WCAG_21_AA_OPTIONS: RunOptions = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
};

function leafColumns(): SdTableColumn<EmployeeRow>[] {
  return [
    {
      field: 'id',
      type: 'number',
      title: 'ID',
      sortable: true,
      width: '140px',
      minWidth: '100px',
      maxWidth: '200px',
    },
    { field: 'name', type: 'string', title: 'Name', sortable: true },
    { field: 'age', type: 'number', title: 'Age', sortable: false, align: 'right' },
  ];
}

function localOption(
  sortState: 'enabled' | 'disabled' | 'omitted',
  overrides: Partial<Omit<LocalTableOption, 'type' | 'items'>> = {}
): SdTableOption<EmployeeRow> {
  const option: LocalTableOption = {
    type: 'local',
    items: () => ROWS,
    columns: leafColumns(),
    filter: { disabled: true },
    ...overrides,
  };
  if (sortState !== 'omitted') option.sort = { enable: sortState === 'enabled' };
  return option;
}

function serverOption(items: ServerTableOption['items']): SdTableOption<EmployeeRow> {
  return {
    type: 'server',
    items,
    columns: leafColumns(),
    filter: { disabled: true },
    sort: { enable: true },
  };
}

@Component({
  standalone: true,
  imports: [SdTable, SdTableTitleDefDirective],
  template: `
    <sd-table autoId="employee-a11y" [option]="option()">
      <ng-template sdTableTitleDef="name">
        <span data-custom-name-title>Employee name</span>
      </ng-template>
    </sd-table>
  `,
})
class TableA11yHost {
  option = signal<SdTableOption<EmployeeRow>>(localOption('omitted'));
}

describe('SdTable sort accessibility', () => {
  let fixture: ComponentFixture<TableA11yHost>;
  let host: TableA11yHost;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableA11yHost, NoopAnimationsModule],
      providers: [{ provide: SdViewportService, useValue: { isMobile: signal(false) } }],
    });
    fixture = TestBed.createComponent(TableA11yHost);
    host = fixture.componentInstance;
  });

  function settleWith(option: SdTableOption<EmployeeRow>): void {
    host.option.set(option);
    fixture.detectChanges();
    tick(800);
    flushMicrotasks();
    fixture.detectChanges();
  }

  function settleForAxe(option: SdTableOption<EmployeeRow>): void {
    fakeAsync(() => {
      settleWith(option);
      flush();
    })();
  }

  function tableDebugElement() {
    const result = fixture.debugElement.query(By.directive(SdTable));
    expect(result).withContext('SdTable host').not.toBeNull();
    return result;
  }

  function tableComponent(): SdTable<EmployeeRow> {
    return tableDebugElement().componentInstance as SdTable<EmployeeRow>;
  }

  function tableRoot(): HTMLElement {
    return tableDebugElement().nativeElement as HTMLElement;
  }

  function sortControls(): HTMLElement[] {
    return Array.from(tableRoot().querySelectorAll<HTMLElement>('.sd-table-sort-header'));
  }

  function sortHost(field: keyof EmployeeRow): HTMLElement {
    const result = tableRoot().querySelector<HTMLElement>(`th.mat-column-${field} .sd-table-sort-header`);
    expect(result).withContext(`sort header host for ${field}`).not.toBeNull();
    return result!;
  }

  function titleHost(field: keyof EmployeeRow): HTMLElement {
    const result = tableRoot().querySelector<HTMLElement>(`th.mat-column-${field} .c-header-title`);
    expect(result).withContext(`title host for ${field}`).not.toBeNull();
    return result!;
  }

  function sortHeaderIds(): string[] {
    return sortControls()
      .map(control => control.dataset['sortId']!)
      .sort();
  }

  function dispatchSortKey(target: HTMLElement, key: 'Enter' | ' ', keyCode: number): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      code: key === 'Enter' ? 'Enter' : 'Space',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'keyCode', { get: () => keyCode });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  function expectNoSortExposure(): void {
    const root = tableRoot();
    expect(sortControls()).withContext('title sort controls').toEqual([]);
    expect(root.querySelectorAll('.mat-sort-header').length).withContext('Material sort header hosts').toBe(0);
    expect(root.querySelectorAll('[aria-sort]').length).withContext('aria-sort attributes').toBe(0);
    expect(root.querySelectorAll('.mat-sort-header-arrow').length).withContext('Material arrow elements').toBe(0);

    for (const title of Array.from(root.querySelectorAll<HTMLElement>('.c-header-title'))) {
      expect(title.getAttribute('role')).not.toBe('button');
      expect(title.tabIndex).withContext(`plain title tabindex for ${title.textContent?.trim()}`).toBe(-1);
      expect(getComputedStyle(title).backgroundImage).withContext(`plain title icon for ${title.textContent?.trim()}`).toBe('none');
    }
  }

  function expectExactlyOneVisibleCustomIcon(header: HTMLElement, state: 'none' | 'ascending' | 'descending'): void {
    const headerCell = header.closest('th');
    expect(headerCell).not.toBeNull();
    expect(headerCell!.getAttribute('aria-sort')).toBe(state);
    const backgroundImage = getComputedStyle(header).backgroundImage;
    expect(backgroundImage).withContext(`custom ${state} icon`).not.toBe('none');
    expect(backgroundImage.match(/url\(/g)?.length ?? 0)
      .withContext(`custom ${state} icon count`)
      .toBe(1);

    expect(headerCell!.querySelectorAll('.mat-sort-header-arrow').length)
      .withContext('no Material arrow node may coexist with the custom icon')
      .toBe(0);
  }

  function axeFailureSummary(violations: AxeResults['violations']): string {
    return violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`).join('\n');
  }

  it('does not instantiate or expose sort headers when option.sort.enable is false', fakeAsync(() => {
    settleWith(localOption('disabled'));

    expectNoSortExposure();
    flush();
  }));

  it('treats an omitted sort option exactly like disabled sorting', fakeAsync(() => {
    settleWith(localOption('omitted'));

    expectNoSortExposure();
    flush();
  }));

  it('instantiates title sort controls only for sortable leaf columns when sorting is enabled', fakeAsync(() => {
    settleWith(localOption('enabled'));

    expect(sortHeaderIds()).toEqual(['id', 'name']);
    const ageTitle = titleHost('age');
    expect(ageTitle.classList.contains('mat-sort-header')).toBeFalse();
    expect(ageTitle.hasAttribute('aria-sort')).toBeFalse();
    expect(ageTitle.tabIndex).toBe(-1);
    expect(getComputedStyle(ageTitle).backgroundImage).toBe('none');
    flush();
  }));

  it('places every aria-sort on a semantic columnheader while preserving the custom title accessible name', fakeAsync(() => {
    settleWith(localOption('enabled'));

    const ariaSortElements = Array.from(tableRoot().querySelectorAll<HTMLElement>('[aria-sort]'));
    expect(ariaSortElements.length).toBe(2);
    ariaSortElements.forEach(element => {
      expect(element.matches('th')).withContext(`aria-sort host ${element.outerHTML}`).toBeTrue();
      expect(element.getAttribute('role')).not.toBe('button');
      const sortButton = element.querySelector<HTMLElement>('[role="button"]');
      expect(sortButton).not.toBeNull();
      if (sortButton) expect(sortButton.tabIndex).toBe(0);
    });

    const nameHeader = sortHost('name');
    expect(nameHeader.textContent).toContain('Employee name');
    expect(nameHeader.querySelector('[data-custom-name-title]')).not.toBeNull();
    flush();
  }));

  it('shows exactly one custom sort icon and keeps the Material icon hidden for every sort state', fakeAsync(() => {
    settleWith(localOption('enabled'));
    const header = sortHost('id');

    expectExactlyOneVisibleCustomIcon(header, 'none');
    header.click();
    fixture.detectChanges();
    expectExactlyOneVisibleCustomIcon(header, 'ascending');
    header.click();
    fixture.detectChanges();
    expectExactlyOneVisibleCustomIcon(header, 'descending');
    flush();
  }));

  it('cycles mouse sorting and sends one request with the existing order mapping per activation', fakeAsync(() => {
    const items = jasmine.createSpy('items').and.resolveTo({ items: ROWS, total: ROWS.length });
    settleWith(serverOption(items));
    items.calls.reset();
    const header = sortHost('id');

    const expected = [
      { ariaSort: 'ascending', direction: 'ASC' },
      { ariaSort: 'descending', direction: 'DESC' },
      { ariaSort: 'none', direction: undefined },
    ] as const;

    expected.forEach((state, index) => {
      header.click();
      fixture.detectChanges();
      tick(250);
      flushMicrotasks();
      fixture.detectChanges();

      expect(items.calls.count())
        .withContext(`request count after activation ${index + 1}`)
        .toBe(index + 1);
      const [filterRequest, pagingRequest] = items.calls.mostRecent().args;
      expect(header.closest('th')!.getAttribute('aria-sort')).toBe(state.ariaSort);
      expect(filterRequest.orderBy).toBe('id');
      expect(filterRequest.orderDirection).toBe(state.direction);
      expect(pagingRequest.orders).toEqual(state.direction ? [{ field: 'id', direction: state.direction }] : []);
    });
    flush();
  }));

  it('supports Enter and Space without duplicate events, and Space prevents page scrolling', fakeAsync(() => {
    settleWith(localOption('enabled'));
    const header = sortHost('name');
    const sort = tableComponent().sort()!;
    const sortChanges = jasmine.createSpy('sortChanges');
    const subscription = sort.sortChange.subscribe(sortChanges);

    const enter = dispatchSortKey(header, 'Enter', ENTER);
    expect(enter.defaultPrevented).toBeTrue();
    expect(sort.active).toBe('name');
    expect(sort.direction).toBe('asc');
    expect(tableComponent().getFilterRequest()).toEqual(jasmine.objectContaining({ orderBy: 'name', orderDirection: 'ASC' }));
    expect(sortChanges).toHaveBeenCalledTimes(1);

    const space = dispatchSortKey(header, ' ', SPACE);
    expect(space.defaultPrevented).toBeTrue();
    expect(sort.active).toBe('name');
    expect(sort.direction).toBe('desc');
    expect(tableComponent().getFilterRequest()).toEqual(jasmine.objectContaining({ orderBy: 'name', orderDirection: 'DESC' }));
    expect(sortChanges).toHaveBeenCalledTimes(2);

    subscription.unsubscribe();
    flush();
  }));

  it('keeps pointer and keyboard activity in the inline filter isolated from sorting', fakeAsync(() => {
    settleWith(
      localOption('enabled', {
        filter: { disabled: false, hideInlineFilter: false },
      })
    );
    const sort = tableComponent().sort()!;
    const sortChanges = jasmine.createSpy('sortChanges');
    const subscription = sort.sortChange.subscribe(sortChanges);
    const filterInput = tableRoot().querySelector<HTMLInputElement>('.mat-column-name column-filter input');
    expect(filterInput).withContext('name inline filter input').not.toBeNull();
    expect(filterInput!.closest('[role="button"]')).withContext('filter must remain outside the sort control').toBeNull();

    filterInput!.click();
    filterInput!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    filterInput!.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
    filterInput!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    fixture.detectChanges();

    expect(sort.active || '').toBe('');
    expect(sort.direction).toBe('');
    expect(sortChanges).not.toHaveBeenCalled();
    subscription.unsubscribe();
    flush();
  }));

  it('preserves multi-header spans and sorts only eligible leaf title hosts', fakeAsync(() => {
    const groupedColumns: SdTableColumn<EmployeeRow>[] = [
      {
        field: 'identity',
        type: 'children',
        title: 'Identity',
        children: [
          { field: 'id', type: 'number', title: 'ID', sortable: true },
          { field: 'name', type: 'string', title: 'Name', sortable: true },
        ],
      },
      { field: 'age', type: 'number', title: 'Age', sortable: false },
    ];
    settleWith(localOption('enabled', { columns: groupedColumns }));

    expect(tableRoot().querySelectorAll('tr.c-first-header').length).toBe(1);
    expect(tableRoot().querySelectorAll('tr.c-second-header').length).toBe(1);
    const groupHeader = tableRoot().querySelector<HTMLElement>('th.mat-column-identity');
    const ageHeader = tableRoot().querySelector<HTMLElement>('th.mat-column-age');
    expect(groupHeader).not.toBeNull();
    expect(groupHeader!.getAttribute('colspan')).toBe('2');
    expect(groupHeader!.querySelector('.c-header-title')?.classList.contains('mat-sort-header')).toBeFalse();
    expect(ageHeader!.getAttribute('rowspan')).toBe('2');
    expect(sortHeaderIds()).toEqual(['id', 'name']);
    Array.from(tableRoot().querySelectorAll<HTMLElement>('[aria-sort]')).forEach(element => {
      expect(element.matches('th')).toBeTrue();
    });
    expect(sortHost('name').textContent).toContain('Employee name');
    flush();
  }));

  it('keeps resize handles, width constraints and resize interaction outside sorting', fakeAsync(() => {
    const onResize = jasmine.createSpy('onResize');
    settleWith(
      localOption('enabled', {
        config: { resizable: true, onResize },
      })
    );
    const idHeader = tableRoot().querySelector<HTMLElement>('th.mat-column-id')!;
    const resizeDebug = fixture.debugElement
      .queryAll(By.directive(SdColumnResizeDirective))
      .find(debug => (debug.nativeElement as HTMLElement).classList.contains('mat-column-id'));
    expect(resizeDebug).withContext('SdColumnResizeDirective on ID header').toBeDefined();
    expect(idHeader.style.width).toBe('140px');
    expect(idHeader.style.minWidth).toBe('100px');
    expect(idHeader.style.maxWidth).toBe('200px');
    const handle = idHeader.querySelector<HTMLElement>('.sd-col-resize-handle');
    expect(handle).not.toBeNull();
    spyOn(idHeader, 'getBoundingClientRect').and.returnValue({
      x: 0,
      y: 0,
      width: 140,
      height: 40,
      top: 0,
      right: 140,
      bottom: 40,
      left: 0,
      toJSON: () => ({}),
    });

    handle!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 250 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    tick();
    fixture.detectChanges();

    expect(idHeader.style.width).toBe('200px');
    expect(onResize).toHaveBeenCalledOnceWith('id', '200px', jasmine.objectContaining({ id: '200px' }));
    expect(tableComponent().sort()?.active || '').toBe('');
    expect(tableComponent().sort()?.direction).toBe('');
    flush();
  }));

  for (const sortState of ['disabled', 'omitted'] as const) {
    it(`preserves custom titles and resize behavior when sorting is ${sortState}`, fakeAsync(() => {
      const onResize = jasmine.createSpy('onResize');
      settleWith(
        localOption(sortState, {
          config: { resizable: true, onResize },
        })
      );

      const nameTitle = titleHost('name');
      expect(nameTitle.textContent).toContain('Employee name');
      expect(nameTitle.querySelector('[data-custom-name-title]')).not.toBeNull();

      const idHeader = tableRoot().querySelector<HTMLElement>('th.mat-column-id')!;
      const resizeDebug = fixture.debugElement
        .queryAll(By.directive(SdColumnResizeDirective))
        .find(debug => (debug.nativeElement as HTMLElement).classList.contains('mat-column-id'));
      expect(resizeDebug).withContext(`SdColumnResizeDirective while sorting is ${sortState}`).toBeDefined();
      const handle = idHeader.querySelector<HTMLElement>('.sd-col-resize-handle');
      expect(handle).not.toBeNull();
      spyOn(idHeader, 'getBoundingClientRect').and.returnValue({
        x: 0,
        y: 0,
        width: 140,
        height: 40,
        top: 0,
        right: 140,
        bottom: 40,
        left: 0,
        toJSON: () => ({}),
      });

      handle!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 250 }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      tick();
      fixture.detectChanges();

      expect(idHeader.style.width).toBe('200px');
      expect(onResize).toHaveBeenCalledOnceWith('id', '200px', jasmine.objectContaining({ id: '200px' }));
      expectNoSortExposure();
      flush();
    }));
  }

  it('destroys existing sort headers and their focus/aria/icon exposure when sorting is disabled at runtime', fakeAsync(() => {
    settleWith(localOption('enabled'));
    sortHost('id').click();
    fixture.detectChanges();
    expect(sortControls().length).toBe(2);

    settleWith(localOption('disabled'));

    expectNoSortExposure();
    flush();
  }));

  it('has no WCAG 2.1 A/AA Axe violations when sorting is disabled', async () => {
    settleForAxe(localOption('disabled'));

    const results = await axe.run(tableRoot(), WCAG_21_AA_OPTIONS);
    expect(results.violations).withContext(axeFailureSummary(results.violations)).toEqual([]);
  });

  it('has no WCAG 2.1 A/AA Axe violations when sorting is enabled', async () => {
    settleForAxe(localOption('enabled'));

    const results = await axe.run(tableRoot(), WCAG_21_AA_OPTIONS);
    expect(results.violations).withContext(axeFailureSummary(results.violations)).toEqual([]);
  });
});
