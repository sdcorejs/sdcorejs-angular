import { LiveAnnouncer } from '@angular/cdk/a11y';
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
import type { SdGenericAdapter, SdGenericSchema } from '../../models';
import { provideSdGeneric } from '../../registry';
import { sdGenericRoutes } from '../../routes';
import { GenericConfigurationList } from '../../components/configuration-list/generic-configuration-list.component';
import { GenericConfigurationPage } from './generic-configuration.page';

const STORAGE_KEY = 'sd-generic:configuration:tms.order';

const schema = (): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'tags', label: 'Tags', dataType: 'string', multiple: true },
    ],
  },
});

describe('GenericConfigurationPage', () => {
  const open = async (adjust: (value: SdGenericSchema) => SdGenericSchema = value => value) => {
    const adapter = jasmine.createSpyObj<SdGenericAdapter>('adapter', ['schema', 'query', 'detail', 'create', 'update', 'delete']);
    (adapter as { module: string }).module = 'tms';
    adapter.schema.and.callFake(async (entity: string) =>
      adjust({ ...schema(), entity, general: { ...schema().general, label: entity === 'trip' ? 'Trip' : 'Order' } })
    );
    adapter.query.and.resolveTo({ items: [], total: 0 });
    TestBed.configureTestingModule({
      providers: [
        provideNoopAnimations(),
        provideLocationMocks(),
        provideRouter([{ path: '', children: sdGenericRoutes() }]),
        provideSdGeneric({ adapters: [adapter], permission: false }),
        { provide: SdPermissionService, useValue: { hasPermission: () => true, loadPermissions: async () => [] } },
        { provide: SdNotifyService, useValue: jasmine.createSpyObj('notify', ['success', 'error', 'info', 'warning']) },
        { provide: SdConfirmService, useValue: { confirm: () => Promise.resolve() } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/generic/tms/order/configuration');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const page = harness.fixture.debugElement.query(By.directive(GenericConfigurationPage)).componentInstance as GenericConfigurationPage;
    return { harness, page, root: harness.fixture.nativeElement as HTMLElement };
  };

  beforeEach(() => localStorage.removeItem(STORAGE_KEY));
  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('saves a valid configuration to localStorage when the adapter has no store, then returns to the list (AC-005, AC-020)', async () => {
    const { page, harness } = await open();
    const draft = page.draft()!;
    page.update({ ...draft, general: { ...draft.general, label: 'Sales order' } });
    await page.save();
    await harness.fixture.whenStable();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).general.label).toBe('Sales order');
    expect(TestBed.inject(Location).path()).toBe('/generic/tms/order');
  });

  it('refuses to save when the upsert key is removed from the import columns, then saves a valid label (AC-020)', async () => {
    const { page, harness, root } = await open();
    page.update({ ...page.draft()!, import: { columns: [{ key: 'tags' }], upsertKey: 'code' } });
    await page.save();
    harness.fixture.detectChanges();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(page.issues().map(issue => issue.code)).toEqual(['upsert-key-not-imported']);
    expect(root.querySelector('[data-autoId="generic-configuration-issues"]')?.textContent).toContain('import.upsertKey');
    expect(TestBed.inject(SdNotifyService).error).toHaveBeenCalled();

    const draft = page.draft()!;
    page.update({
      ...draft,
      general: { ...draft.general, label: 'Sales order' },
      import: { columns: [{ key: 'code' }], upsertKey: 'code' },
    });
    await page.save();
    await harness.fixture.whenStable();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).general.label).toBe('Sales order');
  });

  it('refuses an upsert key that holds several values (AC-020)', async () => {
    const { page } = await open();
    page.update({ ...page.draft()!, import: { upsertKey: 'tags' } });
    await page.save();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(page.issues().map(issue => issue.code)).toEqual(['upsert-key-multiple']);
  });

  it('starts over when the router reuses the page for another entity', async () => {
    const { page, harness } = await open();
    const draft = page.draft()!;
    page.update({ ...draft, general: { ...draft.general, label: 'Unsaved' } });
    await harness.navigateByUrl('/generic/tms/trip/configuration');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(harness.fixture.debugElement.query(By.directive(GenericConfigurationPage)).componentInstance)
      .withContext('the router reused the page')
      .toBe(page);
    expect(page.draft()!.entity).toBe('trip');
    expect(page.draft()!.general.label).withContext('draft of the other entity is dropped').toBe('Trip');
  });

  it('does not let the general tab reopen a property the backend locked', async () => {
    const { root } = await open(value => ({
      ...value,
      general: { ...value.general, properties: value.general.properties.map(p => (p.key === 'code' ? { ...p, insertable: false } : p)) },
    }));
    const boxes = Array.from(root.querySelectorAll('[data-autoId="generic-property-code"] sd-checkbox input')) as HTMLInputElement[];
    // required, insertable, updatable
    expect(boxes.map(box => box.disabled)).toEqual([false, true, false]);
  });

  it('names each property and column row and announces a moved column', async () => {
    const { harness, root } = await open();
    const row = root.querySelector('[data-autoId="generic-property-code"]')!;
    expect([row.getAttribute('role'), row.getAttribute('aria-label')]).toEqual(['group', 'Code']);
    const announce = spyOn(TestBed.inject(LiveAnnouncer), 'announce').and.resolveTo();
    // sd-tab-group renders a tab when it is first opened.
    (root.querySelectorAll('[role="tab"]')[1] as HTMLElement).click();
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const list = harness.fixture.debugElement.query(By.directive(GenericConfigurationList)).componentInstance as GenericConfigurationList;
    expect(root.querySelector('[data-autoId="generic-column-code"]')?.getAttribute('aria-label')).toBe('Code');
    list.move('code', 1);
    expect(announce).toHaveBeenCalledOnceWith(jasmine.stringContaining('Code'));
  });

  it('shows the key and the data-type icon as read-only identity in the general tab (AC-009, AC-020)', async () => {
    const { root } = await open();
    const row = root.querySelector('[data-autoId="generic-property-code"]')!;
    expect(row.querySelector('sd-generic-property-identity')).not.toBeNull();
    expect(row.querySelector('[data-role="key"]')!.textContent?.trim()).toBe('code');
    expect(row.querySelector('[data-role="data-type"] sd-icon')?.getAttribute('aria-label')).toBe(
      TestBed.inject(I18nService).t('core.data-type.string')
    );
    const inputs = Array.from(row.querySelectorAll('input')).map(input => (input as HTMLInputElement).value);
    expect(inputs).not.toContain('code');
  });

  it('styles the stored value of each enum option as a secondary code', async () => {
    const { root } = await open(value => ({
      ...value,
      general: {
        ...value.general,
        properties: [
          ...value.general.properties,
          { key: 'status', label: 'Status', dataType: 'enum', enums: [{ value: 'NEW', label: 'New' }] },
        ],
      },
    }));
    const option = root.querySelector('.cfg-option__value') as HTMLElement;
    expect(option?.textContent?.trim()).toBe('NEW');
    // why: a class without a matching rule renders like body text; the shared stylesheet must style the value.
    expect(getComputedStyle(option).fontSize).toBe('12px');
  });

  it('shows the key and the data-type icon of every import column (AC-009)', async () => {
    const { harness, root } = await open();
    (root.querySelectorAll('[role="tab"]')[3] as HTMLElement).click();
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    const row = root.querySelector('[data-autoId="generic-import-tags"]')!;
    expect(row.querySelector('sd-generic-property-identity')).not.toBeNull();
    expect(row.querySelector('[data-role="key"]')!.textContent?.trim()).toBe('tags');
    expect(row.querySelector('[data-role="data-type"] sd-icon')?.getAttribute('aria-label')).toBe(
      TestBed.inject(I18nService).t('core.data-type.string-multiple')
    );
  });
});
