import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { SdFormGenericField } from '@sdcorejs/angular/components/form-generic';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import type { SdGenericAdapter, SdGenericEntityConfiguration, SdGenericSchema } from '../../models';
import { provideSdGeneric, provideSdGenericEntity } from '../../registry';
import { sdGenericRoutes } from '../../routes';
import { GenericFormHostPage } from './generic-form-host.page';

const schema = (extra: Partial<SdGenericSchema> = {}): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'id', label: 'Id', dataType: 'string', system: true },
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'qty', label: 'Qty', dataType: 'number', updatable: false },
    ],
  },
  ...extra,
});

describe('GenericFormHostPage', () => {
  let adapter: jasmine.SpyObj<Required<SdGenericAdapter>>;

  const open = async (
    url: string,
    options: { schema?: SdGenericSchema; entity?: Partial<SdGenericEntityConfiguration>; failDetail?: boolean } = {}
  ) => {
    adapter = jasmine.createSpyObj<Required<SdGenericAdapter>>('adapter', ['schema', 'query', 'detail', 'create', 'update', 'delete']);
    (adapter as { module: string }).module = 'tms';
    adapter.schema.and.callFake(async () => options.schema ?? schema());
    adapter.query.and.resolveTo({ items: [], total: 0 });
    if (options.failDetail) adapter.detail.and.rejectWith(new Error('not found'));
    else adapter.detail.and.resolveTo({ id: '1', code: 'SO1', qty: 3 });
    adapter.create.and.callFake(async (_entity, data) => ({ id: '9', ...data }));
    adapter.update.and.callFake(async (_entity, id, data) => ({ id, ...data }));
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideLocationMocks(),
        provideRouter([{ path: '', children: sdGenericRoutes() }]),
        provideSdGeneric({ adapters: [adapter], permission: false }),
        ...(options.entity ? [provideSdGenericEntity({ module: 'tms', entity: 'order', ...options.entity })] : []),
        { provide: SdPermissionService, useValue: { hasPermission: () => true, loadPermissions: async () => [] } },
        { provide: SdNotifyService, useValue: jasmine.createSpyObj('notify', ['success', 'error', 'info', 'warning']) },
        { provide: SdConfirmService, useValue: { confirm: () => Promise.resolve() } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    // why: the record loads after navigation; the harness fixture does not auto-detect changes.
    harness.fixture.detectChanges();
    const host = harness.fixture.debugElement.query(By.directive(GenericFormHostPage)).componentInstance as GenericFormHostPage;
    return { harness, host, root: harness.fixture.nativeElement as HTMLElement };
  };

  const keys = (host: GenericFormHostPage) =>
    host
      .formSchema()!
      .pages.flatMap(page => page.elements as SdFormGenericField[])
      .map(field => field.key);

  it('keeps system and non-insertable properties out of create and saves only insertable values (AC-015)', async () => {
    const { host } = await open('/generic/tms/order/create');
    expect(keys(host)).toEqual(['code', 'qty']);
    host.value.set({ code: 'SO9', qty: 2, id: 'x' });
    await host.save();
    expect(adapter.create).toHaveBeenCalledWith('order', { code: 'SO9', qty: 2 });
  });

  it('keeps non-updatable properties out of update and its payload (AC-015)', async () => {
    const { host } = await open('/generic/tms/order/1/update');
    expect(keys(host)).toEqual(['code']);
    expect(host.value()).toEqual({ id: '1', code: 'SO1', qty: 3 });
    await host.save();
    expect(adapter.update).toHaveBeenCalledWith('order', '1', { code: 'SO1' });
  });

  it('does not save an update whose record failed to load', async () => {
    const { host, harness, root } = await open('/generic/tms/order/1/update', { failDetail: true });
    host.value.set({ code: 'X' });
    await host.save();
    harness.fixture.detectChanges();
    expect(adapter.update).not.toHaveBeenCalled();
    expect(host.canSave()).toBeFalse();
    expect(root.querySelector('[data-autoId="generic-save"] button')?.hasAttribute('disabled')).toBeTrue();
  });

  it('shows the load error in place of the form when the record fails to load', async () => {
    const { root } = await open('/generic/tms/order/1/detail', { failDetail: true });
    const form = root.querySelector('sd-generic-form-host')!;
    const inform = form.querySelector('sd-inform[data-autoId="generic-form-error"]');
    expect(inform).withContext('error banner').not.toBeNull();
    expect(inform!.textContent).toContain('not found');
    expect(form.querySelector('sd-form-render')).withContext('no empty form').toBeNull();
  });

  it('shows every property read-only in detail, with the detail title rendered as text (AC-015, AC-009)', async () => {
    const { host, root } = await open('/generic/tms/order/1/detail', { schema: schema({ detail: { title: '<b>${code}</b>' } }) });
    expect(keys(host)).toEqual(['id', 'code', 'qty']);
    expect(host.viewed()).toBeTrue();
    // The list page stays mounted behind a page form; read the form's own heading.
    const heading = root.querySelector('sd-generic-form-host h1')!;
    expect(heading.textContent).toContain('<b>SO1</b>');
    expect(heading.querySelector('b')).toBeNull();
  });

  it('shows custom detail actions and hands them the record (AC-018)', async () => {
    const run = jasmine.createSpy('run');
    const { host } = await open('/generic/tms/order/1/detail', {
      entity: {
        detailActions: [
          { id: 'print', label: 'Print', run },
          { id: 'hidden', label: 'Hidden', visible: () => false, run },
        ],
      },
    });
    expect(host.detailActions().map(action => action.id)).toEqual(['print']);
    await host.runAction(host.detailActions()[0]);
    expect(run).toHaveBeenCalledWith(jasmine.objectContaining({ row: { id: '1', code: 'SO1', qty: 3 } }));
  });

  it('reports a failed save and stays on the form', async () => {
    const { host, harness } = await open('/generic/tms/order/1/update');
    adapter.update.and.rejectWith(new Error('conflict'));
    await host.save();
    await harness.fixture.whenStable();
    expect(TestBed.inject(SdNotifyService).error).toHaveBeenCalledWith('conflict');
    expect(harness.fixture.debugElement.query(By.directive(GenericFormHostPage))).not.toBeNull();
  });
});
