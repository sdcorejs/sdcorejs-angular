import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter, type Route } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SD_PERMISSION_PUBLIC, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import type { SdGenericAdapter, SdGenericDefaultAction, SdGenericDisplay, SdGenericSchema } from '../models';
import { GenericFormHostPage } from '../pages/form/generic-form-host.page';
import { GenericListPage } from '../pages/list/generic-list.page';
import { provideSdGeneric, provideSdGenericEntity } from '../registry';
import { sdGenericRoutes } from './sd-generic.routes';

const schema = (): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'id', label: 'Id', dataType: 'string', system: true },
      { key: 'code', label: 'Code', dataType: 'string' },
    ],
  },
});

describe('sdGenericRoutes', () => {
  let adapter: jasmine.SpyObj<Required<SdGenericAdapter>>;
  let granted: Set<string>;
  let display: SdGenericDisplay | undefined;

  const setup = async (options: { permission?: boolean; hidden?: SdGenericDefaultAction[] } = {}) => {
    adapter = jasmine.createSpyObj<Required<SdGenericAdapter>>('adapter', [
      'schema',
      'query',
      'detail',
      'create',
      'update',
      'delete',
      'display',
    ]);
    (adapter as { module: string }).module = 'tms';
    adapter.schema.and.callFake(async () => schema());
    adapter.query.and.resolveTo({ items: [{ id: '1', code: 'SO1' }], total: 1 });
    adapter.detail.and.resolveTo({ id: '1', code: 'SO1' });
    adapter.update.and.callFake(async (_entity, id, data) => ({ id, ...data }));
    adapter.display.and.callFake(() => display ?? 'page');
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideLocationMocks(),
        provideRouter([{ path: '', children: sdGenericRoutes() }]),
        provideSdGeneric({ adapters: [adapter], ...(options.permission === undefined ? {} : { permission: options.permission }) }),
        ...(options.hidden ? [provideSdGenericEntity({ module: 'tms', entity: 'order', hiddenDefaults: options.hidden })] : []),
        { provide: SdPermissionService, useValue: { hasPermission: (code: string) => granted.has(code), loadPermissions: async () => [] } },
        { provide: SdNotifyService, useValue: jasmine.createSpyObj('notify', ['success', 'error', 'info', 'warning']) },
        { provide: SdConfirmService, useValue: { confirm: () => Promise.resolve() } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    // why: the harness navigates directly; initialNavigation() also installs the popstate listener used by back().
    TestBed.inject(Router).initialNavigation();
    return harness;
  };

  beforeEach(() => {
    granted = new Set(['TMS_ORDER_C_GENERIC_LIST', 'TMS_ORDER_C_GENERIC_DETAIL', 'TMS_ORDER_C_GENERIC_UPDATE']);
    display = undefined;
  });

  it('declares SD_PERMISSION_PUBLIC on every route so a portal SdPermissionGuard lets them through (D-024)', () => {
    const walk = (routes: Route[]): Route[] => routes.flatMap(route => [route, ...walk(route.children ?? [])]);
    const routes = walk(sdGenericRoutes());
    expect(routes.map(route => route.path)).toEqual(
      jasmine.arrayContaining(['generic/:module/:entity', 'configuration', '', 'create', ':id/detail', ':id/update'])
    );
    for (const route of routes) expect(route.data?.['permission']).withContext(String(route.path)).toBe(SD_PERMISSION_PUBLIC);
  });

  it('opens the list of an entity (AC-001)', async () => {
    const harness = await setup();
    await harness.navigateByUrl('/generic/tms/order');
    await harness.fixture.whenStable();
    expect(harness.fixture.debugElement.query(By.directive(GenericListPage)))
      .withContext('list page')
      .not.toBeNull();
    expect(adapter.query).toHaveBeenCalled();
  });

  it('blocks a route and hides its button without the permission (AC-010)', async () => {
    const harness = await setup();
    await harness.navigateByUrl('/generic/tms/order');
    await harness.fixture.whenStable();
    expect(harness.fixture.nativeElement.querySelector('[data-autoId="generic-create"]')).toBeNull();
    const allowed = await TestBed.inject(Router).navigateByUrl('/generic/tms/order/create');
    expect(allowed).toBeFalse();
    expect(TestBed.inject(Location).path()).toBe('/generic/tms/order');
  });

  it('lets everything through with provideSdGeneric({ permission: false }) (AC-010)', async () => {
    granted = new Set();
    const harness = await setup({ permission: false });
    await harness.navigateByUrl('/generic/tms/order');
    await harness.fixture.whenStable();
    expect(harness.fixture.nativeElement.querySelector('[data-autoId="generic-create"]')).not.toBeNull();
    expect(await TestBed.inject(Router).navigateByUrl('/generic/tms/order/create')).toBeTrue();
  });

  it('blocks module or entity names that could reach another backend path, even with checks off', async () => {
    await setup({ permission: false });
    const router = TestBed.inject(Router);
    expect(await router.navigateByUrl('/generic/tms/..%2Fadmin')).toBeFalse();
    expect(await router.navigateByUrl('/generic/tms/a%20b')).toBeFalse();
    expect(adapter.schema).not.toHaveBeenCalled();
    expect(await router.navigateByUrl('/generic/tms/sales.order')).toBeTrue();
  });

  it('closes the routes of default actions hidden by hiddenDefaults', async () => {
    granted = new Set(['TMS_ORDER_C_GENERIC_LIST', 'TMS_ORDER_C_GENERIC_CREATE', 'TMS_ORDER_C_GENERIC_UPDATE']);
    await setup({ hidden: ['create'] });
    const router = TestBed.inject(Router);
    expect(await router.navigateByUrl('/generic/tms/order/create')).toBeFalse();
    expect(await router.navigateByUrl('/generic/tms/order/1/update')).toBeTrue();
  });

  it('opens a side drawer over the kept list and closes it with back (AC-011)', async () => {
    display = 'side-drawer';
    const harness = await setup();
    await harness.navigateByUrl('/generic/tms/order');
    await harness.fixture.whenStable();
    const list = harness.fixture.debugElement.query(By.directive(GenericListPage)).componentInstance as GenericListPage;

    await harness.navigateByUrl('/generic/tms/order/1/detail');
    await harness.fixture.whenStable();
    const host = harness.fixture.debugElement.query(By.directive(GenericFormHostPage))?.componentInstance as GenericFormHostPage;
    expect(host.display()).toBe('side-drawer');
    expect(harness.fixture.debugElement.query(By.directive(GenericListPage)).componentInstance)
      .withContext('list not recreated')
      .toBe(list);
    expect(harness.fixture.nativeElement.querySelector('sd-table')).withContext('list stays visible').not.toBeNull();

    TestBed.inject(Location).back();
    // why: the router handles popstate in a later task; wait for that navigation before reading the view.
    await new Promise(resolve => setTimeout(resolve));
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Location).path()).toBe('/generic/tms/order');
    expect(harness.fixture.debugElement.query(By.directive(GenericFormHostPage))).toBeNull();
    expect(harness.fixture.debugElement.query(By.directive(GenericListPage)).componentInstance).toBe(list);
  });

  it('shows a form as a full page by default and returns to the reloaded list after saving (AC-012)', async () => {
    const harness = await setup();
    await harness.navigateByUrl('/generic/tms/order/1/update');
    await harness.fixture.whenStable();
    const host = harness.fixture.debugElement.query(By.directive(GenericFormHostPage)).componentInstance as GenericFormHostPage;
    expect(host.display()).toBe('page');
    const list = harness.fixture.nativeElement.querySelector('.sd-generic-list') as HTMLElement;
    expect(list.style.display).withContext('list content hidden behind the page form').toBe('none');
    expect(list.querySelector('sd-table')).withContext('sd-table stays mounted, keeping filters, sort and page').not.toBeNull();

    adapter.query.calls.reset();
    await host.save();
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
    expect(adapter.update).toHaveBeenCalledWith('order', '1', jasmine.objectContaining({ code: 'SO1' }));
    expect(TestBed.inject(Location).path()).toBe('/generic/tms/order');
    expect(adapter.query).withContext('list reloaded').toHaveBeenCalled();
    expect(list.style.display).withContext('list shown again').toBe('');
    expect(document.activeElement?.tagName).withContext('focus handed to the list heading').toBe('H1');
  });

  it('starts over when the router reuses the form for another record', async () => {
    const harness = await setup();
    adapter.detail.and.callFake(async (_entity, id) => ({ id, code: `SO${id}` }));
    await harness.navigateByUrl('/generic/tms/order/1/update');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const host = harness.fixture.debugElement.query(By.directive(GenericFormHostPage)).componentInstance as GenericFormHostPage;
    expect(host.value()).toEqual(jasmine.objectContaining({ code: 'SO1' }));

    await harness.navigateByUrl('/generic/tms/order/2/update');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(harness.fixture.debugElement.query(By.directive(GenericFormHostPage)).componentInstance)
      .withContext('the router reused the page')
      .toBe(host);
    expect(host.value()).toEqual(jasmine.objectContaining({ id: '2', code: 'SO2' }));
    await host.save();
    expect(adapter.update).toHaveBeenCalledOnceWith('order', '2', jasmine.objectContaining({ code: 'SO2' }));
  });
});
