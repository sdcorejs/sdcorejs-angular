import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTablePaginatorIntl } from '../../table.component';
import {
  SdTableUnknownTotalPageEvent,
  SdTableUnknownTotalPagerState,
  SdTableUnknownTotalPaginator,
} from './unknown-total-paginator.component';

describe('SdTableUnknownTotalPaginator', () => {
  let fixture: ComponentFixture<SdTableUnknownTotalPaginator>;
  let events: SdTableUnknownTotalPageEvent[];
  const base: SdTableUnknownTotalPagerState = {
    pageIndex: 1,
    pageSize: 25,
    range: { from: 26, to: 32 },
    hasPrevious: true,
    hasNext: false,
    busy: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdTableUnknownTotalPaginator, NoopAnimationsModule],
      providers: [{ provide: MatPaginatorIntl, useClass: SdTablePaginatorIntl }],
    });
    fixture = TestBed.createComponent(SdTableUnknownTotalPaginator);
    events = [];
    fixture.componentInstance.page.subscribe(event => events.push(event));
  });

  function render(state: Partial<SdTableUnknownTotalPagerState> = {}, inputs: Record<string, unknown> = {}) {
    fixture.componentRef.setInput('state', { ...base, ...state });
    fixture.componentRef.setInput('pageSizeOptions', [10, 25, 50]);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    return {
      host,
      range: host.querySelector('.mat-mdc-paginator-range-label') as HTMLElement,
      first: host.querySelector('.mat-mdc-paginator-navigation-first') as HTMLButtonElement | null,
      previous: host.querySelector('.mat-mdc-paginator-navigation-previous') as HTMLButtonElement,
      next: host.querySelector('.mat-mdc-paginator-navigation-next') as HTMLButtonElement,
      select: host.querySelector('mat-select') as HTMLElement | null,
    };
  }

  it('shows only the rows on screen, never a total or a last-page button', () => {
    const { host, range } = render();
    expect(range.textContent?.trim()).toBe('26-32');
    expect(range.getAttribute('aria-live')).toBe('polite');
    expect(host.querySelector('.mat-mdc-paginator-navigation-last')).toBeNull();
    expect(host.textContent).not.toContain('/');
  });

  it('formats offsets like the known-total range label, without the total', () => {
    const { range } = render({ range: { from: 10001, to: 10025 } });
    expect(range.textContent?.trim()).toBe('10001-10025');
    expect(TestBed.inject(MatPaginatorIntl).getRangeLabel(400, 25, 20000).startsWith('10001-10025/')).toBeTrue();
  });

  it('renders no range when no row of the shown page is on screen', () => {
    const { range } = render({ range: undefined });
    expect(range.textContent?.trim()).toBe('');
  });

  it('uses the table paginator labels for buttons and page size', () => {
    const intl = TestBed.inject(MatPaginatorIntl);
    const { host, previous, next, select } = render({}, { showFirstButton: true });
    expect(host.getAttribute('role')).toBe('group');
    expect(previous.getAttribute('aria-label')).toBe(intl.previousPageLabel);
    expect(next.getAttribute('aria-label')).toBe(intl.nextPageLabel);
    expect(host.querySelector('.mat-mdc-paginator-navigation-first')?.getAttribute('aria-label')).toBe(intl.firstPageLabel);
    const label = host.querySelector('.mat-mdc-paginator-page-size-label') as HTMLElement;
    expect(label.textContent?.trim()).toBe(intl.itemsPerPageLabel);
    expect(select?.getAttribute('aria-labelledby')).toContain(label.id);
  });

  it('emits Previous and Next from the current page with the same page size', () => {
    const { previous, next } = render({ hasNext: true });
    next.click();
    previous.click();
    expect(events).toEqual([
      { pageIndex: 2, pageSize: 25 },
      { pageIndex: 0, pageSize: 25 },
    ]);
  });

  it('keeps disabled buttons focusable in place but out of the tab order, and inert', () => {
    const { previous, next } = render({ hasPrevious: false, hasNext: false });
    for (const button of [previous, next]) {
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('tabindex')).toBe('-1');
      expect(button.disabled).withContext('disabledInteractive keeps focus on the button').toBeFalse();
      button.click();
    }
    expect(events).toEqual([]);
  });

  it('keeps focus on Next while the requested page loads', () => {
    const view = render({ hasNext: true });
    view.next.focus();
    view.next.click();
    const busy = render({ busy: true, hasNext: false, hasPrevious: false });
    expect(document.activeElement).toBe(busy.next);
    expect(busy.host.getAttribute('aria-busy')).toBe('true');
    expect(busy.next.getAttribute('aria-disabled')).toBe('true');
  });

  it('restarts at the first page when the page size changes and ignores the current size', () => {
    render();
    fixture.componentInstance.changePageSize(50);
    fixture.componentInstance.changePageSize(25);
    expect(events).toEqual([{ pageIndex: 0, pageSize: 50 }]);
  });

  it('disables page size and ignores changes while busy', () => {
    const { select } = render({ busy: true });
    expect(select?.getAttribute('aria-disabled')).toBe('true');
    fixture.componentInstance.changePageSize(50);
    expect(events).toEqual([]);
  });

  it('includes the current page size in the sorted options', () => {
    render({ pageSize: 30 });
    expect(fixture.componentInstance.displayedPageSizeOptions()).toEqual([10, 25, 30, 50]);
  });

  it('First returns to page 0 and follows the Previous state', () => {
    const enabled = render({}, { showFirstButton: true });
    enabled.first!.click();
    expect(events).toEqual([{ pageIndex: 0, pageSize: 25 }]);
    const disabled = render({ pageIndex: 0, hasPrevious: false }, { showFirstButton: true });
    expect(disabled.first!.getAttribute('aria-disabled')).toBe('true');
  });

  it('hides page size and First when the table asks for the compact mobile layout', () => {
    const { host, first } = render({}, { hidePageSize: true, showFirstButton: false });
    expect(host.querySelector('.mat-mdc-paginator-page-size')).toBeNull();
    expect(first).toBeNull();
  });

  it('adds stable automation ids from the table autoId', () => {
    const { host, next, previous, select } = render({}, { autoId: 'components-table-events' });
    expect(host.getAttribute('data-autoid')).toBe('components-table-events-paginator');
    expect(next.getAttribute('data-autoid')).toBe('components-table-events-paginator-next');
    expect(previous.getAttribute('data-autoid')).toBe('components-table-events-paginator-previous');
    expect(select?.getAttribute('data-autoid')).toBe('components-table-events-paginator-page-size');
  });
});
