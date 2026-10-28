import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTable } from './table.component';
import { ISdTableConfiguration, SD_TABLE_CONFIGURATION } from './configurations';
import { SdTableOption } from './models/table-option.model';
import { SdTableOptionLoading } from './models/table-option-loading.model';

interface Row {
  id: number;
  name: string;
}
type ServerOption = Extract<SdTableOption<Row>, { type: 'server' }>;
interface Page {
  items: Row[];
  total: number;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const rows = (count: number): Row[] => Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `Row ${index + 1}` }));
const page = (count: number, total = 20): Page => ({ items: rows(count), total });

describe('SdTable loading view', () => {
  let f: ComponentFixture<SdTable<Row>>;
  let table: SdTable<Row>;
  let reads: ReturnType<typeof deferred<Page>>[];

  // why: the Karma frame counts as mobile; unless a test says so, these are desktop tables (inline filter, header rows).
  const configure = (configuration?: ISdTableConfiguration, mobile = false) =>
    TestBed.configureTestingModule({
      imports: [SdTable, NoopAnimationsModule],
      providers: [
        { provide: SdViewportService, useValue: { isMobile: signal(mobile) } },
        ...(configuration ? [{ provide: SD_TABLE_CONFIGURATION, useValue: configuration }] : []),
      ],
    });

  /** Creates a server table; its first read is started (loading) but not answered. */
  function create(extra: Partial<ServerOption> = {}): void {
    reads = [];
    f = TestBed.createComponent(SdTable<Row>);
    table = f.componentInstance;
    const option: ServerOption = {
      type: 'server',
      items: () => {
        const read = deferred<Page>();
        reads.push(read);
        return read.promise;
      },
      columns: [{ field: 'name', type: 'string', title: 'Name' }],
      paginate: { pageSize: 10 },
      ...extra,
    };
    f.componentRef.setInput('option', option);
    f.detectChanges();
    tick(250);
    f.detectChanges();
  }

  /** Answers the latest read and renders it. */
  function answer(result: Page): void {
    reads[reads.length - 1].resolve(result);
    flushMicrotasks();
    f.detectChanges();
  }

  /** A table whose first read rendered `count` rows. */
  function createWithRows(count = 5, extra: Partial<ServerOption> = {}): void {
    create(extra);
    answer(page(count));
    tick();
    f.detectChanges();
  }

  const view = () => {
    f.detectChanges();
    return f.nativeElement.getAttribute('data-loading-view');
  };
  const live = () => {
    f.detectChanges();
    return (f.nativeElement.querySelector('.sd-table-live') as HTMLElement).textContent?.trim() ?? '';
  };
  const t = (key: string, params?: Record<string, number>) => TestBed.inject(I18nService).t(key, params);

  /** Starts a reload; `loading()` is set synchronously. */
  function reload(): void {
    void table.reload();
    f.detectChanges();
  }

  afterEach(() => f?.destroy());

  describe('with the defaults', () => {
    beforeEach(() => configure());

    it('waits showDelay before showing the progress bar over existing rows', fakeAsync(() => {
      createWithRows();
      reload();
      expect(view()).toBe('none');
      tick(299);
      expect(view()).toBe('none');
      tick(1);
      expect(view()).toBe('refresh');
      answer(page(5));
      flush();
    }));

    it('shows nothing for a read faster than showDelay', fakeAsync(() => {
      createWithRows();
      reload();
      const seen = new Set<string>();
      for (let elapsed = 0; elapsed < 150; elapsed += 25) {
        tick(25);
        seen.add(view());
      }
      answer(page(5));
      for (let elapsed = 0; elapsed < 600; elapsed += 50) {
        tick(50);
        seen.add(view());
      }
      expect([...seen]).toEqual(['none']);
    }));

    it('keeps the progress bar for minDuration after a read that ends shortly after it showed', fakeAsync(() => {
      createWithRows();
      reload();
      tick(300);
      expect(view()).toBe('refresh');
      tick(150);
      answer(page(3));
      // New rows render at once; only the bar and the dimming are held.
      expect(table.items().length).toBe(3);
      expect(view()).toBe('refresh');
      tick(249);
      expect(view()).toBe('refresh');
      tick(1);
      expect(view()).toBe('none');
      flush();
    }));

    it('hides at once when the read ends after minDuration', fakeAsync(() => {
      createWithRows();
      reload();
      tick(1000);
      expect(view()).toBe('refresh');
      answer(page(5));
      expect(view()).toBe('none');
      flush();
    }));

    it('does not hold the bar over an empty result or an error', fakeAsync(() => {
      createWithRows();
      reload();
      tick(450);
      expect(view()).toBe('refresh');
      answer(page(0, 0));
      expect(view()).toBe('none');

      reload();
      answer(page(5));
      reload();
      tick(450);
      expect(view()).toBe('refresh');
      reads[reads.length - 1].reject(new Error('offline'));
      flushMicrotasks();
      expect(table.readState().status).toBe('error');
      expect(view()).toBe('none');
      flush();
    }));

    it('keeps the bar when a new read starts while it is held', fakeAsync(() => {
      createWithRows();
      reload();
      tick(450);
      answer(page(5));
      tick(150);
      expect(view()).toBe('refresh');
      reload();
      for (let elapsed = 600; elapsed < 1100; elapsed += 50) {
        tick(50);
        expect(view()).toBe('refresh');
      }
      answer(page(5));
      expect(view()).toBe('none');
      flush();
    }));

    it('keeps the bar through the debounce of a read that replaces the current one', fakeAsync(() => {
      createWithRows(5);
      reload();
      tick(500);
      expect(view()).toBe('refresh');
      table.paginator()!.nextPage();
      expect(table.loading()).toBeFalse();
      for (let elapsed = 500; elapsed < 1100; elapsed += 50) {
        tick(50);
        expect(view()).toBe('refresh');
      }
      expect(table.loading()).toBeTrue();
      answer(page(5));
      expect(view()).toBe('none');
      flush();
    }));

    it('shows skeleton rows at once for a table without rows and removes them with the result', fakeAsync(() => {
      create();
      expect(table.loading()).toBeTrue();
      expect(view()).toBe('skeleton');
      answer(page(5));
      expect(view()).toBe('none');
      flush();
    }));

    it('shows skeleton rows before the configuration and the first read are ready', fakeAsync(() => {
      reads = [];
      f = TestBed.createComponent(SdTable<Row>);
      table = f.componentInstance;
      f.componentRef.setInput('option', {
        type: 'server',
        items: () => {
          const read = deferred<Page>();
          reads.push(read);
          return read.promise;
        },
        columns: [{ field: 'name', type: 'string', title: 'Name' }],
      } as SdTableOption<Row>);
      f.detectChanges();
      expect(table.configuration()).toBeUndefined();
      expect(view()).toBe('skeleton');
      flushMicrotasks();
      expect(table.configuration()).toBeDefined();
      expect(table.loading()).toBeFalse();
      expect(view()).toBe('skeleton');
      tick(250);
      expect(table.loading()).toBeTrue();
      expect(view()).toBe('skeleton');
      answer(page(2));
      expect(view()).toBe('none');
      flush();
    }));

    it('keeps data-loading and aria-busy on loading() without delay', fakeAsync(() => {
      createWithRows();
      reload();
      expect(f.nativeElement.getAttribute('data-loading')).toBe('true');
      expect(f.nativeElement.querySelector('.c-table').getAttribute('aria-busy')).toBe('true');
      expect(view()).toBe('none');
      answer(page(5));
      expect(f.nativeElement.getAttribute('data-loading')).toBe('false');
      expect(f.nativeElement.querySelector('.c-table').getAttribute('aria-busy')).toBeNull();
      flush();
    }));

    it('announces loading and the loaded row count through a status region that is always present', fakeAsync(() => {
      reads = [];
      f = TestBed.createComponent(SdTable<Row>);
      table = f.componentInstance;
      f.componentRef.setInput('option', {
        type: 'server',
        items: () => {
          const read = deferred<Page>();
          reads.push(read);
          return read.promise;
        },
        columns: [{ field: 'name', type: 'string', title: 'Name' }],
        paginate: { pageSize: 10 },
      } as SdTableOption<Row>);
      f.detectChanges();
      const region = f.nativeElement.querySelector('.sd-table-live') as HTMLElement;
      expect(table.configuration()).toBeUndefined();
      expect(region.getAttribute('role')).toBe('status');
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(region.getAttribute('aria-atomic')).toBe('true');
      expect(live()).toBe(t('core.component.table.loading'));
      tick(250);
      answer(page(5));
      expect(live()).toBe(t('core.component.table.loaded', { count: 5 }));
      expect(f.nativeElement.querySelector('.sd-table-live')).toBe(region);

      // Faster than showDelay: nothing changes.
      reload();
      tick(100);
      answer(page(4));
      tick(500);
      f.detectChanges();
      expect(live()).toBe(t('core.component.table.loaded', { count: 5 }));

      reload();
      tick(300);
      f.detectChanges();
      expect(live()).toBe(t('core.component.table.loading'));
      tick(700);
      answer(page(3));
      expect(live()).toBe(t('core.component.table.loaded', { count: 3 }));

      // The empty block announces itself; the region is cleared instead of repeating it.
      reload();
      tick(300);
      f.detectChanges();
      answer(page(0, 0));
      expect(live()).toBe('');
      flush();
    }));

    it('stops its timers on destroy', fakeAsync(() => {
      createWithRows();
      reload();
      tick(100);
      f.destroy();
      expect(() => {
        tick(1000);
        flush();
      }).not.toThrow();
      expect(table.loadingView()).toBe('none');
    }));
  });

  describe('options', () => {
    it('takes the first read through the delayed progress bar when skeleton is off', fakeAsync(() => {
      configure();
      create({ loading: { skeleton: false } });
      expect(table.loading()).toBeTrue();
      expect(view()).toBe('none');
      expect(f.nativeElement.querySelector('tr.sd-table-skeleton-row')).toBeNull();
      tick(299);
      expect(view()).toBe('none');
      tick(1);
      expect(view()).toBe('refresh');
      expect(f.nativeElement.querySelector('.sd-table-progress')).not.toBeNull();
      expect(f.nativeElement.querySelector('tr.sd-table-skeleton-row')).toBeNull();
      answer(page(5));
      flush();
    }));

    it('merges option.loading over SD_TABLE_CONFIGURATION.loading field by field', fakeAsync(() => {
      configure({ loading: { showDelay: 100, minDuration: 0, dim: false } });
      createWithRows(5, { loading: { showDelay: 50, minDuration: -1 } as SdTableOptionLoading });
      expect(table.loadingSettings()).toEqual({ skeleton: true, skeletonRows: undefined, showDelay: 50, minDuration: 0, dim: false });
      reload();
      tick(49);
      expect(view()).toBe('none');
      tick(1);
      expect(view()).toBe('refresh');
      answer(page(5));
      expect(view()).toBe('none');
      flush();
    }));
  });

  describe('desktop layer', () => {
    beforeEach(() => configure());

    const el = (selector: string) => f.nativeElement.querySelector(selector) as HTMLElement | null;
    const all = (selector: string) => Array.from(f.nativeElement.querySelectorAll(selector)) as HTMLElement[];
    /** The element under the centre of `target`, as a pointer would hit it. */
    const hit = (target: Element) => {
      const box = target.getBoundingClientRect();
      return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    };

    it('replaces the loading overlay: no .c-loading or Material spinner at any time', fakeAsync(() => {
      create();
      expect(el('.c-loading')).toBeNull();
      expect(el('mat-spinner')).toBeNull();
      answer(page(5));
      reload();
      tick(500);
      f.detectChanges();
      expect(el('.c-loading')).toBeNull();
      expect(el('mat-spinner')).toBeNull();
      answer(page(5));
      flush();
    }));

    it('draws 5 hidden skeleton rows aligned with the displayed columns, then the real rows', fakeAsync(() => {
      create({
        columns: [
          { field: 'name', type: 'string', title: 'Name' },
          { field: 'id', type: 'number', title: 'Id', align: 'right' },
        ],
      });
      const skeleton = all('tbody tr.sd-table-skeleton-row');
      expect(skeleton.length).toBe(5);
      expect(skeleton.every(row => row.getAttribute('aria-hidden') === 'true')).toBeTrue();
      expect(skeleton[0].querySelectorAll('td').length).toBe(table.configuration()!.displayedColumns.length);
      expect(skeleton[0].querySelector('[data-align="end"]')).not.toBeNull();
      // The header stays the real header.
      expect(all('thead th').length).toBeGreaterThan(0);
      expect(el('.c-no-data-row')).toBeNull();
      expect(el('sd-data-state')).toBeNull();
      answer(page(3));
      expect(all('tr.sd-table-skeleton-row').length).toBe(0);
      expect(all('tr.c-row').length).toBe(3);
      flush();
    }));

    it('honours skeletonRows', fakeAsync(() => {
      create({ loading: { skeletonRows: 3 } });
      expect(all('tr.sd-table-skeleton-row').length).toBe(3);
      answer(page(1));
      flush();
    }));

    it('fills a table with a fixed height, up to the page size', fakeAsync(() => {
      create({ style: { maxHeight: '300px' }, paginate: { pageSize: 50 } });
      const head = el('.c-table thead')!.offsetHeight;
      expect(all('tr.sd-table-skeleton-row').length).toBe(Math.floor((300 - head) / 36));
      answer(page(1));
      f.destroy();

      create({ style: { maxHeight: '2000px' }, paginate: { pageSize: 4 } });
      expect(all('tr.sd-table-skeleton-row').length).toBe(4);
      answer(page(1));
      flush();
    }));

    it('shows a generic skeleton before the configuration and skeleton rows (not the empty block) before the first read', fakeAsync(() => {
      reads = [];
      f = TestBed.createComponent(SdTable<Row>);
      table = f.componentInstance;
      f.componentRef.setInput('option', {
        type: 'server',
        items: () => {
          const read = deferred<Page>();
          reads.push(read);
          return read.promise;
        },
        columns: [{ field: 'name', type: 'string', title: 'Name' }],
      } as ServerOption);
      f.detectChanges();
      const block = el('.sd-table-skeleton-block');
      expect(block?.getAttribute('aria-hidden')).toBe('true');
      expect(block?.querySelectorAll('.sd-table-skeleton-block-row').length).toBe(5);
      expect(block?.querySelectorAll('.sd-table-skeleton-bar').length).toBe(20);

      flushMicrotasks();
      f.detectChanges();
      expect(table.loading()).toBeFalse();
      expect(el('.sd-table-skeleton-block')).toBeNull();
      expect(all('tr.sd-table-skeleton-row').length).toBe(5);
      expect(el('.c-no-data-row')).toBeNull();
      tick(250);
      answer(page(2));
      expect(all('tr.c-row').length).toBe(2);
      flush();
    }));

    it('dims the rows and shows the progress bar while refreshing, never the footer', fakeAsync(() => {
      createWithRows();
      reload();
      tick(300);
      f.detectChanges();
      const data = el('.c-table')!;
      const bar = el('.sd-table-progress')!;
      expect(data.classList).toContain('sd-table-dim');
      expect(bar.getAttribute('aria-hidden')).toBe('true');
      expect(bar.parentElement?.classList).toContain('c-container');
      const row = el('tr.c-row')!;
      expect(getComputedStyle(row).pointerEvents).toBe('none');
      expect(getComputedStyle(el('.c-container')!).isolation).toBe('isolate');
      answer(page(5));
      tick(400);
      f.detectChanges();
      expect(el('.sd-table-progress')).toBeNull();
      expect(el('.c-table')!.classList).not.toContain('sd-table-dim');
      expect(getComputedStyle(el('tr.c-row')!).pointerEvents).toBe('auto');
      flush();
    }));

    it('with dim: false shows only the progress bar and the rows stay clickable', fakeAsync(() => {
      createWithRows(5, { loading: { dim: false } });
      reload();
      tick(300);
      f.detectChanges();
      expect(el('.sd-table-progress')).not.toBeNull();
      expect(el('.c-table')!.classList).not.toContain('sd-table-dim');
      expect(getComputedStyle(el('tr.c-row')!).pointerEvents).toBe('auto');
      answer(page(5));
      flush();
    }));

    it('leaves the header and its inline filter on top in skeleton and refresh', fakeAsync(() => {
      create();
      // why: in the full suite DOM left by other specs pushes the fixture below the Karma viewport, where
      // elementFromPoint finds nothing; pin the table to the top so the hit test sees what a pointer would.
      Object.assign(f.nativeElement.style, { position: 'fixed', top: '0', left: '0', width: '800px', zIndex: '10000' });
      const check = () => {
        const title = el('thead .c-header-title')!;
        const filter = el('thead column-filter')!;
        expect(title.closest('th')?.contains(hit(title)))
          .withContext('title')
          .toBeTrue();
        expect(filter.closest('th')?.contains(hit(filter)))
          .withContext('inline filter')
          .toBeTrue();
      };
      expect(view()).toBe('skeleton');
      check();
      answer(page(5));
      reload();
      tick(300);
      expect(view()).toBe('refresh');
      check();
      answer(page(5));
      flush();
    }));

    it('puts the progress bar right under the last header row of a grouped header with a filter row', fakeAsync(() => {
      createWithRows(5, {
        columns: [
          {
            field: 'group',
            type: 'children',
            title: 'Group',
            children: [
              { field: 'name', type: 'string', title: 'Name' },
              { field: 'id', type: 'number', title: 'Id' },
            ],
          },
        ],
      } as Partial<ServerOption>);
      reload();
      tick(300);
      f.detectChanges();
      const last = el('thead tr.c-filter-header')!;
      expect(getComputedStyle(last).display).not.toBe('none');
      const bar = el('.sd-table-progress')!;
      expect(Math.abs(bar.getBoundingClientRect().top - last.getBoundingClientRect().bottom)).toBeLessThan(1);
      answer(page(5));
      flush();
    }));
  });
});
