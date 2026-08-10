// base.component.ts
import { Directive, inject } from '@angular/core';
import { SdLicenseService } from '@sdcorejs/angular/services/license';

/**
 * @deprecated Dormant since release `1.6` — no component in the package extends this class any more
 * (see CHANGELOG entry #21) and it will be **removed in release `1.8`**.
 *
 * why: đây vẫn là public entry point của một package MIT, nên bất kỳ consumer nào extends nó đều
 * chạy `enforceLicense()` trong constructor. Trước đây nhánh "chưa cấu hình `licenseKey`" ném lỗi
 * => crash production. `SdLicenseService` giờ no-op ở nhánh đó (chỉ warn ở dev build), nên kế thừa
 * class này không còn làm sập app; dù vậy đừng dùng cho code mới.
 */
@Directive() // Dùng Directive cho abstract class trong Angular
export abstract class SdBaseSecureComponent {
  protected licenseService = inject(SdLicenseService);
  constructor() {
    this.licenseService.enforceLicense();
  }
}
