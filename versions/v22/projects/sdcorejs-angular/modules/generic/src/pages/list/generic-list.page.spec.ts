import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import type { SdGenericAdapter, SdGenericEntityConfiguration, SdGenericSchema } from '../../models';
import { provideSdGeneric, provideSdGenericEntity } from '../../registry';
import { sdGenericRoutes } from '../../routes';
import { GenericListPage } from './generic-list.page';

type Callable = (...args: unknown[]) => unknown;

const schema = (extra: Partial<SdGenericSchema> = {}): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'id', label: 'Id', dataType: 'string', system: true },
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'amount', label: 'Amount', dataType: 'number' },
    ],
  },
  ...extra,
});

const ALL = ['LIST', 'DETAIL', 'CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'CONFIGURATION'].map(action => `TMS_ORDER_C_GENERIC_${action}`);

describe('GenericListPage', () => {
  let adapter: jasmine.SpyObj<Required<SdGenericAdapter>>;
  let confirm: jasmine.Spy;
  let granted: Set<string>;

  const open = async (options: { schema?: SdGenericSchema; stored?: unknown; entity?: Partial<SdGenericEntityConfiguration> } = {}) => {
    adapter = jasmine.createSpyObj<Required<SdGenericAdapter>>('adapter', ['schema', 'query', 'detail', 'create', 'update', 'delete']);
    (adapter as { module: string }).module = 'tms';
    adapter.schema.and.callFake(async () => options.schema ?? schema());
    adapter.query.and.resolveTo({ items: [{ id: '1', code: 'SO1', amount: 5 }], total: 1 });
    (adapter as Partial<SdGenericAdapter>).schemaStore = {
      get: async () => (options.stored ?? null) as never,
      set: async () => undefined,
    };
    confirm = jasmine.createSpy('confirm').and.resolveTo(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideLocationMocks(),
        provideRouter([{ path: '', children: sdGenericRoutes() }]),
        provideSdGeneric({ adapters: [adapter] }),
        ...(options.entity ? [provideSdGenericEntity({ module: 'tms', entity: 'order', ...options.entity })] : []),
        { provide: SdPermissionService, useValue: { hasPermission: (code: string) => granted.has(code), loadPermissions: async () => [] } },
        { provide: SdNotifyService, useValue: jasmine.createSpyObj('notify', ['success', 'error', 'info', 'warning']) },
        { provide: SdConfirmService, useValue: { confirm } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/generic/tms/order');
    await harness.fixture.whenStable();
    const page = harness.fixture.debugElement.query(By.directive(GenericListPage)).componentInstance as GenericListPage;
    return { harness, page, root: harness.fixture.nativeElement as HTMLElement };
  };

  beforeEach(() => (granted = new Set(ALL)));

  it('builds the table from the schema with hidden columns, default orders and external filters (AC-001, AC-013)', async () => {
    const { page } = await open({
      schema: schema({
        list: {
          columns: [{ key: 'code' }, { key: 'amount', visible: false }],
          orders: [{ field: 'code', direction: 'DESC' }],
          externalFilters: [{ key: 'code', default: 'SO' }],
        },
      }),
    });
    const option = page.tableOption()!;
    expect(option.columns.map(column => [column.field, !!column.invisible])).toEqual([
      ['code', false],
      ['amount', true],
    ]);
    expect(option.filter?.externalFilters?.[0]).toEqual(jasmine.objectContaining({ field: 'code', default: 'SO' }));
    adapter.query.calls.reset();
    const result = await (option as { items: Callable }).items(
      {},
      { pageNumber: 2, pageSize: 20, filters: [{ field: 'code', operator: 'CONTAIN', data: 'SO' }] }
    );
    expect(adapter.query).toHaveBeenCalledWith('order', {
      pageNumber: 2,
      pageSize: 20,
      filters: [{ field: 'code', operator: 'CONTAIN', data: 'SO' }],
      orders: [{ field: 'code', direction: 'DESC' }],
    });
    expect(result).toEqual({ items: [{ id: '1', code: 'SO1', amount: 5 }], total: 1 });
  });

  it('shows external filters declared by provideSdGenericEntity, with the filter toolbar hidden (AC-002)', async () => {
    const { page } = await open({
      entity: {
        schema: (base: SdGenericSchema) => ({ ...base, list: { ...base.list, externalFilters: [{ key: 'code', default: 'SO' }] } }),
      },
    });
    const option = page.tableOption()!;
    expect(option.filter?.externalFilters?.map(filter => filter.field)).toEqual(['code']);
    expect(option.filter).toEqual(jasmine.objectContaining({ hideExternalFilterToolbar: true }));
  });

  it('confirms before deleting one row and deletes selected rows one after another (AC-014)', async () => {
    const { page } = await open();
    const reload = spyOn(page, 'reload');
    const option = page.tableOption()!;
    // Deleting goes through the selector only, for one row as for several.
    const bulkDelete = option.selector!.actions!.find(action => (action as { icon?: string }).icon === 'delete') as { click: Callable };
    let running = 0;
    let peak = 0;
    adapter.delete.and.callFake(async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise(resolve => setTimeout(resolve, 2));
      running--;
    });
    bulkDelete.click([{ id: '1' }]);
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(confirm).toHaveBeenCalledOnceWith(TestBed.inject(I18nService).t('core.module.generic.delete.confirm'), jasmine.anything());
    expect(adapter.delete).toHaveBeenCalledOnceWith('order', '1');
    expect(reload).toHaveBeenCalled();

    adapter.delete.calls.reset();
    bulkDelete.click([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(adapter.delete.calls.allArgs()).toEqual([
      ['order', 'a'],
      ['order', 'b'],
      ['order', 'c'],
    ]);
    expect(peak).toBe(1);
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const { page } = await open();
    confirm.and.rejectWith('CANCEL');
    const bulkDelete = page.tableOption()!.selector!.actions!.find(action => (action as { icon?: string }).icon === 'delete') as {
      click: Callable;
    };
    bulkDelete.click([{ id: '1' }]);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(adapter.delete).not.toHaveBeenCalled();
  });

  it('opens a record from its link column instead of repeating detail, edit and delete on every row', async () => {
    const { page } = await open();
    const option = page.tableOption()!;
    expect(option.commands).withContext('no built-in row commands').toEqual([]);
    expect(option.filter).toEqual(jasmine.objectContaining({ hideExternalFilterToolbar: true }));
    const links = option.columns.filter(column => column.click);
    expect(links.map(column => column.field))
      .withContext('first non-system column')
      .toEqual(['code']);
    links[0].click!('SO1', { id: '1', code: 'SO1' });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(TestBed.inject(Location).path()).toBe('/generic/tms/order/1/detail');
  });

  it('links to update when the user may update but not view a record', async () => {
    granted.delete('TMS_ORDER_C_GENERIC_DETAIL');
    const { page } = await open();
    page.tableOption()!.columns.find(column => column.click)!.click!('SO1', { id: '1', code: 'SO1' });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(TestBed.inject(Location).path()).toBe('/generic/tms/order/1/update');
  });

  it('shows the invalid configuration banner only to users who can configure (AC-007)', async () => {
    spyOn(console, 'warn');
    const stored = { ...schema(), version: 2 };
    let view = await open({ stored });
    expect(view.root.querySelector('[data-autoId="generic-invalid-configuration"]')).not.toBeNull();

    TestBed.resetTestingModule();
    granted.delete('TMS_ORDER_C_GENERIC_CONFIGURATION');
    view = await open({ stored });
    expect(view.root.querySelector('[data-autoId="generic-invalid-configuration"]')).toBeNull();
  });

  it('renders the list title as text (AC-009)', async () => {
    const { root } = await open({ schema: schema({ list: { title: 'Orders <b>today</b>' } }) });
    const heading = root.querySelector('h1')!;
    expect(heading.textContent).toContain('Orders <b>today</b>');
    expect(heading.querySelector('b')).toBeNull();
  });

  it('adds custom commands behind their permission and visibility, and hides built-in actions (AC-018)', async () => {
    const run = jasmine.createSpy('run');
    granted.add('CUSTOM_APPROVE');
    const { page } = await open({
      entity: {
        hiddenDefaults: ['delete', 'create'],
        rowCommands: [
          {
            id: 'approve',
            label: 'Approve',
            icon: 'check',
            permission: 'CUSTOM_APPROVE',
            visible: context => context.row?.['code'] === 'SO1',
            run,
          },
          { id: 'reject', label: 'Reject', permission: 'CUSTOM_REJECT', run },
        ],
      },
    });
    const commands = page.tableOption()!.commands!;
    expect(commands.some(command => command.icon === 'delete'))
      .withContext('built-in delete hidden')
      .toBeFalse();
    expect(commands.map(command => command.title)).not.toContain('Reject');
    const approve = commands.find(command => command.title === 'Approve') as { hidden: Callable; click: Callable };
    expect(approve.hidden({ code: 'SO1' })).toBeFalse();
    expect(approve.hidden({ code: 'SO2' })).toBeTrue();
    approve.click({ id: '1', code: 'SO1' });
    await new Promise(resolve => setTimeout(resolve));
    expect(run).toHaveBeenCalledWith(jasmine.objectContaining({ row: { id: '1', code: 'SO1' }, reload: jasmine.any(Function) }));
    expect(page.canCreate()).toBeFalse();
  });
});
