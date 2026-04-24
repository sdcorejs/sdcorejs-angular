// base.component.ts
import { Directive, inject } from '@angular/core';
import { SdLicenseService } from '@sdcorejs/angular/services/license';

@Directive() // DÃ¹ng Directive cho abstract class trong Angular
export abstract class SdBaseSecureComponent {
  protected licenseService = inject(SdLicenseService);
  constructor() {
    this.licenseService.enforceLicense();
  }
}

