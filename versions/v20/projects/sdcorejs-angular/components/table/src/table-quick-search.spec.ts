import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdTable } from './table.component';
import { SdTableOption } from './models/table-option.model';
import { SdConvertToPagingReq, SdTableFilterRequest } from './services/table-filter/table-filter.model';
import { filterLocalItems } from './services/table-local/table-local.util';
import { SdTableQuickSearchRightDefDirective } from './directives/sd-table-quick-search-right-def.directive';
import { initialQuickSearchValue } from './services/table-filter/table-quick-search.util';
import { TableExportService } from './services/table-export/table-export.service';

interface Customer {
  id: number;
  name: string;
  email: string;
  tenantId: number;
}

const customers: Customer[] = [
  { id: 1, name: 'Alice', email: 'first@example.com', tenantId: 0 },
  { id: 2, name: 'Bob', email: 'alice@example.com', tenantId: 1 },
  { id: 3, name: 'Carol', email: 'third@example.com', tenantId: 1 },
];
const tenantOptions = [
  { id: 0, name: 'Zero' },
  { id: 1, name: 'One' },
];
const quickOption = () => ({
  containFields: ['name', 'email'],
  placeholder: 'Name or email',
  filters: [
    { field: 'tenantId', title: 'Tenant', type: 'values', option: { valueField: 'id', displayField: 'name', items: tenantOptions } },
  ],
});
const request = (term = '', filters: Record<string, unknown> = {}): SdTableFilterRequest<Customer> =>
  ({
    columnOperator: {} as any,
    rawColumnFilter: {} as any,
    rawExternalFilter: {},
    pageNumber: 0,
    pageSize: 50,
    quickSearch: { term, filters },
  }) as SdTableFilterRequest<Customer>;

describe('Quick search request and local filtering', () => {
  const options = () => ({
    type: 'local' as const,
    columns: [{ field: 'name', title: 'Name', type: 'string' as const }],
    filter: { quickSearch: quickOption() },
  });

  it('combines an OR keyword group with dropdown AND conditions, including zero', () => {
    const result = SdConvertToPagingReq(request(' Alice ', { tenantId: 0 }), { quickSearch: quickOption() } as any);
    expect(result.filters).toEqual([
      { field: 'tenantId', operator: 'EQUAL', data: 0 },
      {
        operator: 'OR',
        data: [
          { field: 'name', operator: 'CONTAIN', data: 'Alice' },
          { field: 'email', operator: 'CONTAIN', data: 'Alice' },
        ],
      },
    ] as any);
  });

  it('maps fields outside columns and converts dropdown arrays to IN', () => {
    const result = SdConvertToPagingReq(request('', { tenantId: [0, 1] }), {
      quickSearch: quickOption(),
      fieldMapping: { tenantId: 'tenant.id' },
    } as any);
    expect(result.filters).toEqual([{ field: 'tenant.id', operator: 'IN', data: [0, 1] }] as any);
  });

  it('supports mixed EQUAL and default CONTAIN fields', () => {
    const quickSearch = { containFields: ['name'], equalFields: ['email'] };
    const result = SdConvertToPagingReq(request('alice'), { quickSearch } as any);
    expect(result.filters).toEqual([
      {
        operator: 'OR',
        data: [
          { field: 'name', operator: 'CONTAIN', data: 'alice' },
          { field: 'email', operator: 'EQUAL', data: 'alice' },
        ],
      },
    ] as any);
    const option = { ...options(), filter: { quickSearch } };
    expect(filterLocalItems(customers, option as any, request('alice')).items.map(row => row.id)).toEqual([1]);
  });

  it('keeps custom-search terms with missing/empty fields and generates no automatic term condition', () => {
    for (const quickSearch of [{}, { containFields: [], equalFields: [] }]) {
      expect(SdConvertToPagingReq(request('custom'), { quickSearch } as any).filters).toEqual([]);
      expect(filterLocalItems(customers, { ...options(), filter: { quickSearch } } as any, request('custom')).total).toBe(3);
    }
  });

  it('finds any configured field before pagination, without requiring a column', () => {
    const result = filterLocalItems(customers, options() as any, { ...request('ALICE'), pageSize: 1, pageNumber: 1 });
    expect(result.total).toBe(2);
    expect(result.items.map(row => row.id)).toEqual([2]);
  });

  it('ANDs the dropdown and keyword with existing column filters', () => {
    const result = filterLocalItems(customers, options() as any, {
      ...request('alice', { tenantId: 1 }),
      rawColumnFilter: { name: 'Bob' } as any,
    });
    expect(result.items.map(row => row.id)).toEqual([2]);
    expect(filterLocalItems(customers, options() as any, request('alice', { tenantId: 0 })).items.map(row => row.id)).toEqual([1]);
  });

  it('supports multiple dropdown values and whitespace-only search', () => {
    expect(filterLocalItems(customers, options() as any, request('  ', { tenantId: [0, 1] })).total).toBe(3);
    expect(filterLocalItems(customers, options() as any, request('', { tenantId: [0] })).items.map(row => row.id)).toEqual([1]);
  });

  it('ignores stale quick-search state when the feature is absent or filters are disabled', () => {
    expect(filterLocalItems(customers, { type: 'local', columns: [] }, request('missing')).total).toBe(3);
    const opt = { ...options(), filter: { ...options().filter, disabled: true } };
    expect(filterLocalItems(customers, opt as any, request('missing')).total).toBe(3);
  });

  it('lets shared signal defaults win cached tenant values, but preserves a cached clear for plain defaults', () => {
    const tenant = signal<number | null>(1);
    const cached = { term: 'Alice', filters: { tenantId: null } };
    const option = { filters: [{ ...quickOption().filters[0], default: tenant }] };
    expect(initialQuickSearchValue(option as any, cached)).toEqual({ term: 'Alice', filters: { tenantId: 1 } });
    tenant.set(null);
    expect(initialQuickSearchValue(option as any, cached).filters['tenantId']).toBeNull();
    expect(
      initialQuickSearchValue({ filters: [{ ...quickOption().filters[0], default: 0 }] } as any, cached).filters['tenantId']
    ).toBeNull();
  });
});

@Component({
  standalone: true,
  imports: [SdTable, SdTableQuickSearchRightDefDirective],
  template:
    '<sd-table [option]="option" autoId="quick-search-test"><ng-template sdTableQuickSearchRightDef><button class="consumer-action">Consumer action</button></ng-template></sd-table>',
})
class QuickSearchHost {
  tenant = signal<number | null>(0);
  hidden = signal(false);
  changed = jasmine.createSpy('tenant changed').and.callFake((value: number | null) => this.tenant.set(value));
  loader = jasmine.createSpy('items').and.callFake(() => ({ items: customers, total: customers.length }));
  option: SdTableOption<Customer> = {
    type: 'server',
    items: this.loader,
    columns: [{ field: 'name', title: 'Name', type: 'string' }],
    filter: {
      quickSearch: {
        ...quickOption(),
        filters: [{ ...quickOption().filters[0], required: true, default: this.tenant, hidden: this.hidden, onChange: this.changed }],
      },
    } as any,
  };
}

describe('SdTable quick search integration', () => {
  let fixture: ComponentFixture<QuickSearchHost>;
  let host: QuickSearchHost;
  let table: SdTable<Customer>;
  function mount(setup?: (host: QuickSearchHost) => void) {
    fixture = TestBed.createComponent(QuickSearchHost);
    host = fixture.componentInstance;
    setup?.(host);
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    table = fixture.debugElement.query(By.directive(SdTable)).componentInstance;
  }
  beforeEach(() => TestBed.configureTestingModule({ imports: [QuickSearchHost] }));

  it('keeps quick search, the table and its footer on one padded surface', fakeAsync(() => {
    mount();
    const element: HTMLElement = fixture.nativeElement.querySelector('sd-table');
    element.style.setProperty('--sd-surface', 'rgb(255, 255, 255)');
    const search: HTMLElement = element.querySelector('sd-table-quick-search')!;
    const surface = search.parentElement!;
    const container: HTMLElement = element.querySelector('.c-container')!;
    expect(surface.classList.contains('sd-table-surface')).toBeTrue();
    expect(container.parentElement).toBe(surface);
    expect(surface.contains(element.querySelector('.c-paginator'))).toBeTrue();
    expect(getComputedStyle(surface).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(search).padding).toBe('8px');
    expect(getComputedStyle(surface).overflow).toBe('visible');
    expect(getComputedStyle(container.querySelector('.c-table')!).borderTopLeftRadius).toBe('0px');
    fixture.destroy();
  }));

  it('keeps the plain table on its own surface without an empty quick-search gap', fakeAsync(() => {
    mount(host => {
      host.option.filter = {};
    });
    const element: HTMLElement = fixture.nativeElement.querySelector('sd-table');
    const container = element.querySelector('.c-container')!;
    const surface = container.parentElement!;
    expect(surface.classList.contains('sd-table-surface')).toBeTrue();
    expect(element.querySelector('sd-table-quick-search')).toBeNull();
    expect(surface.firstElementChild).toBe(container);
    expect(getComputedStyle(surface).padding).toBe('0px');
    expect(getComputedStyle(container.querySelector('.c-table')!).borderTopLeftRadius).toBe('6px');
    fixture.destroy();
  }));

  it('resolves a signal default before the first table request without emitting onChange', fakeAsync(() => {
    mount();
    expect(host.loader).toHaveBeenCalled();
    expect(table.getFilterRequest().quickSearch?.filters).toEqual({ tenantId: 0 });
    expect(host.changed).not.toHaveBeenCalled();
    fixture.destroy();
  }));

  it('reacts to shared tenant updates and keeps hidden tenant values active', fakeAsync(() => {
    mount();
    host.tenant.set(1);
    host.hidden.set(true);
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    expect(table.getFilterRequest().quickSearch?.filters).toEqual({ tenantId: 1 });
    expect(host.loader.calls.mostRecent().args[1].filters).toContain({ field: 'tenantId', operator: 'EQUAL', data: 1 });
    expect(fixture.nativeElement.querySelector('sd-table-quick-search sd-select')).toBeNull();
    expect(host.changed).not.toHaveBeenCalled();
    fixture.destroy();
  }));

  it('blocks a missing required tenant even if its control is hidden', fakeAsync(() => {
    mount();
    host.loader.calls.reset();
    host.tenant.set(null);
    host.hidden.set(true);
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    expect(host.loader).not.toHaveBeenCalled();
    expect(table.dataItems).toEqual([]);
    fixture.destroy();
  }));

  it('does not query per keystroke, then applies Enter and clears only the keyword', fakeAsync(() => {
    mount();
    host.loader.calls.reset();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('sd-table-quick-search input');
    expect(input).withContext('quick search input').not.toBeNull();
    if (!input) {
      fixture.destroy();
      return;
    }
    input.value = 'alice';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    tick(900);
    expect(host.loader).not.toHaveBeenCalled();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    expect(table.getFilterRequest().quickSearch).toEqual({ term: 'alice', filters: { tenantId: 0 } });
    const clear: HTMLButtonElement = fixture.nativeElement.querySelector('.sd-quick-search-clear');
    expect(clear).not.toBeNull();
    clear?.click();
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    expect(table.getFilterRequest().quickSearch).toEqual({ term: '', filters: { tenantId: 0 } });
    fixture.destroy();
  }));

  it('applies dropdown immediately with the committed term, preserves draft and emits onChange once', fakeAsync(() => {
    mount();
    table.setFilter({ quickSearch: { term: 'Alice', filters: { tenantId: 0 } } });
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    host.loader.calls.reset();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('sd-table-quick-search input');
    input.value = 'Carol';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.debugElement.query(By.css('sd-table-quick-search sd-select')).triggerEventHandler('sdChange', 1);
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    expect(host.loader).toHaveBeenCalledTimes(1);
    expect(table.getFilterRequest().quickSearch).toEqual({ term: 'Alice', filters: { tenantId: 1 } });
    expect(input.value).toBe('Carol');
    expect(host.changed).toHaveBeenCalledOnceWith(1);
    expect(host.tenant()).toBe(1);
    fixture.destroy();
  }));

  it('does not submit an IME composition Enter and renders the consumer right template', fakeAsync(() => {
    mount();
    host.loader.calls.reset();
    expect(fixture.nativeElement.querySelector('.sd-quick-search-right .consumer-action')?.textContent).toBe('Consumer action');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('sd-table-quick-search input');
    input.value = 'Alice';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }));
    fixture.detectChanges();
    tick(900);
    flush();
    expect(host.loader).not.toHaveBeenCalled();
    expect(table.getFilterRequest().quickSearch?.term).toBe('');
    fixture.destroy();
  }));

  it('starts a local loader after an initially missing required tenant becomes available', fakeAsync(() => {
    const loader = jasmine.createSpy('local items').and.returnValue(customers);
    mount(host => {
      host.tenant.set(null);
      host.option = { ...host.option, type: 'local', items: loader };
    });
    expect(loader).not.toHaveBeenCalled();
    host.tenant.set(1);
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(table.dataItems.map(row => row.id)).toEqual([2, 3]);
    fixture.destroy();
  }));

  it('clears an unsubmitted draft on full reset and reads the latest shared default', fakeAsync(() => {
    mount();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('sd-table-quick-search input');
    input.value = 'unsubmitted';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    host.tenant.set(1);
    fixture.detectChanges();
    tick(900);
    flush();
    table.clearFilter();
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(table.getFilterRequest().quickSearch).toEqual({ term: '', filters: { tenantId: 1 } });
    expect(host.changed).not.toHaveBeenCalled();
    fixture.destroy();
  }));

  it('resolves lazy dropdown defaults without emitting a user change', fakeAsync(() => {
    const lookup = jasmine.createSpy('tenant lookup').and.callFake(async () => tenantOptions);
    mount(host => {
      host.option.filter!.quickSearch!.filters = [
        {
          field: 'tenantId',
          title: 'Tenant',
          type: 'lazy-values',
          default: host.tenant,
          option: { valueField: 'id', displayField: 'name', items: lookup },
          onChange: host.changed,
        },
      ];
    });
    expect(lookup).toHaveBeenCalled();
    expect(table.getFilterRequest().quickSearch?.filters).toEqual({ tenantId: 0 });
    expect(host.changed).not.toHaveBeenCalled();
    fixture.destroy();
  }));

  it('exposes custom terms to the server without automatically generating field conditions', fakeAsync(() => {
    mount(host => {
      host.option.filter!.quickSearch = { placeholder: 'Custom search' };
    });
    table.setFilter({ quickSearch: { term: 'custom syntax', filters: {} } });
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    expect(host.loader.calls.mostRecent().args[0].quickSearch).toEqual({ term: 'custom syntax', filters: {} });
    expect(host.loader.calls.mostRecent().args[1].filters).toEqual([]);
    fixture.destroy();
  }));

  it('exports with the applied quick-search request and ignores a pending draft', fakeAsync(() => {
    mount();
    table.setFilter({ quickSearch: { term: 'Alice', filters: { tenantId: 0 } } });
    fixture.detectChanges();
    tick(900);
    flush();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('sd-table-quick-search input');
    input.value = 'pending';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const service = fixture.debugElement.query(By.directive(SdTable)).injector.get(TableExportService);
    spyOn(service, 'exportCSV').and.callFake(async context => {
      await context.fetchChunk(0, 100);
    });
    void table.exportCSV();
    tick();
    flush();
    const req = host.loader.calls.mostRecent().args[0];
    expect(req.isExported).toBeTrue();
    expect(req.quickSearch).toEqual({ term: 'Alice', filters: { tenantId: 0 } });
    fixture.destroy();
  }));
});
