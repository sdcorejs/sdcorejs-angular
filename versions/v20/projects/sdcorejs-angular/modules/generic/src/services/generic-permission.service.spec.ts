import { TestBed } from '@angular/core/testing';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { provideSdGeneric, provideSdGenericEntity } from '../registry/provide-sd-generic';
import { SdGenericPermissionService } from './generic-permission.service';

describe('SdGenericPermissionService', () => {
  const granted = new Set(['TMS_ORDER_C_GENERIC_LIST', 'CUSTOM_APPROVE']);
  let permission: { hasPermission: jasmine.Spy; loadPermissions: jasmine.Spy };

  const setup = (enabled?: boolean) => {
    permission = {
      hasPermission: jasmine.createSpy('hasPermission').and.callFake((code: string) => granted.has(code)),
      loadPermissions: jasmine.createSpy('loadPermissions').and.resolveTo([]),
    };
    TestBed.configureTestingModule({
      providers: [
        provideSdGeneric({ adapters: [], ...(enabled === undefined ? {} : { permission: enabled }) }),
        { provide: SdPermissionService, useValue: permission },
        SdGenericPermissionService,
      ],
    });
    return TestBed.inject(SdGenericPermissionService);
  };

  it('checks the generated permission code of each action (AC-010)', () => {
    const service = setup();
    expect(service.can('tms', 'order', 'list')).toBeTrue();
    expect(service.can('tms', 'order', 'create')).toBeFalse();
    expect(permission.hasPermission).toHaveBeenCalledWith('TMS_ORDER_C_GENERIC_CREATE');
  });

  it('allows a default action only when the entity does not hide it and the code is granted', () => {
    const codes = new Set(['TMS_ORDER_C_GENERIC_LIST', 'TMS_ORDER_C_GENERIC_UPDATE', 'TMS_ORDER_C_GENERIC_DELETE']);
    TestBed.configureTestingModule({
      providers: [
        provideSdGeneric({ adapters: [] }),
        provideSdGenericEntity({ module: 'tms', entity: 'order', hiddenDefaults: ['delete', 'export'] }),
        { provide: SdPermissionService, useValue: { hasPermission: (code: string) => codes.has(code) } },
        SdGenericPermissionService,
      ],
    });
    const service = TestBed.inject(SdGenericPermissionService);
    expect(service.allows('tms', 'order', 'update'))
      .withContext('granted, not hidden')
      .toBeTrue();
    expect(service.allows('tms', 'order', 'delete'))
      .withContext('granted but hidden')
      .toBeFalse();
    expect(service.allows('tms', 'order', 'create'))
      .withContext('not granted')
      .toBeFalse();
    expect(service.allows('tms', 'order', 'list'))
      .withContext('list cannot be hidden')
      .toBeTrue();
    expect(service.hides('tms', 'order', 'export')).toBeTrue();
    expect(service.hides('tms', 'trip', 'delete'))
      .withContext('another entity')
      .toBeFalse();
  });

  it('checks custom action codes and treats an absent code as allowed (AC-018)', () => {
    const service = setup();
    expect(service.canCode('CUSTOM_APPROVE')).toBeTrue();
    expect(service.canCode('CUSTOM_REJECT')).toBeFalse();
    expect(service.canCode(undefined)).toBeTrue();
  });

  it('allows everything when provideSdGeneric({ permission: false }) (AC-010)', () => {
    const service = setup(false);
    expect(service.can('tms', 'order', 'create')).toBeTrue();
    expect(service.canCode('CUSTOM_REJECT')).toBeTrue();
    expect(permission.hasPermission).not.toHaveBeenCalled();
  });

  it('does not need a permission configuration when checks are off', async () => {
    TestBed.configureTestingModule({ providers: [provideSdGeneric({ adapters: [], permission: false }), SdGenericPermissionService] });
    const service = TestBed.inject(SdGenericPermissionService);
    expect(service.can('tms', 'order', 'delete')).toBeTrue();
    await expectAsync(service.ensureLoaded()).toBeResolved();
  });

  it('shares a load in flight and asks SdPermissionService again on the next check', async () => {
    const service = setup();
    await Promise.all([service.ensureLoaded(), service.ensureLoaded()]);
    expect(permission.loadPermissions).withContext('concurrent route checks').toHaveBeenCalledTimes(1);
    // SdPermissionService skips loaded keys itself, and reset() on sign-out must make the next check reload.
    await service.ensureLoaded();
    expect(permission.loadPermissions).toHaveBeenCalledTimes(2);
  });
});
