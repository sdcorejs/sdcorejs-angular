import { DOCUMENT } from '@angular/common';
import { Component, Injector, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdLicenseService } from '@sdcorejs/angular/services/license';

import { SdBaseSecureComponent } from './base-secure.component';

// Concrete subclass dùng để kích hoạt constructor của abstract base.
@Component({
  selector: 'sd-secure-test-host',
  standalone: true,
  template: '',
})
class SecureTestHost extends SdBaseSecureComponent {}

describe('SdBaseSecureComponent', () => {
  it('calls licenseService.enforceLicense() during construction', () => {
    const spy = jasmine.createSpy('enforceLicense');
    TestBed.configureTestingModule({
      imports: [SecureTestHost],
      providers: [{ provide: SdLicenseService, useValue: { enforceLicense: spy } }],
    });

    const fixture = TestBed.createComponent(SecureTestHost);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes the injected licenseService as the same instance from DI', () => {
    const stub = { enforceLicense: jasmine.createSpy('enforceLicense') };
    TestBed.configureTestingModule({
      imports: [SecureTestHost],
      providers: [{ provide: SdLicenseService, useValue: stub }],
    });

    const fixture = TestBed.createComponent(SecureTestHost);
    const inst = fixture.componentInstance as unknown as { licenseService: SdLicenseService };
    expect(inst.licenseService).toBe(stub as unknown as SdLicenseService);
  });

  it('propagates errors thrown by enforceLicense (does not swallow them)', () => {
    const err = new Error('[Security] denied');
    TestBed.configureTestingModule({
      imports: [SecureTestHost],
      providers: [
        {
          provide: SdLicenseService,
          useValue: {
            enforceLicense: () => {
              throw err;
            },
          },
        },
      ],
    });

    expect(() => TestBed.createComponent(SecureTestHost)).toThrowError('[Security] denied');
  });

  // why: class này còn là public entry point của package MIT dù đã dormant (CHANGELOG #21).
  // Trước đây consumer nào extends nó mà không cấu hình `licenseKey` sẽ crash ngay ở production
  // trên mọi host không phải localhost. Nhánh "chưa cấu hình" giờ phải là no-op.
  it('does not throw with the REAL SdLicenseService on a non-localhost host and no licenseKey', () => {
    // why: DOCUMENT chỉ được override trong injector riêng của service — override ở TestBed sẽ làm
    // hỏng DomRenderer khi createComponent.
    const licenseService = Injector.create({
      providers: [
        { provide: SdLicenseService, useClass: SdLicenseService },
        { provide: DOCUMENT, useValue: { defaultView: { location: { hostname: 'app.customer.com' } } } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).get(SdLicenseService);

    TestBed.configureTestingModule({
      imports: [SecureTestHost],
      providers: [{ provide: SdLicenseService, useValue: licenseService }],
    });

    expect(() => TestBed.createComponent(SecureTestHost)).not.toThrow();
  });
});
