import { Component } from '@angular/core';
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
});
