import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { SdFormGenericConfig } from '../models/form-generic-config.model';
import { FormGenericService } from '../services/form-generic.service';
import { SdFormRenderService } from '../services/form-render.service';
import { SD_FORM_GENERIC_CONFIG, sdResolveFormGenericConfig } from './form-generic-config.token';

export { SD_FORM_GENERIC_CONFIG } from './form-generic-config.token';
export type { SdFormGenericResolvedConfig } from './form-generic-config.token';

/**
 * Cấu hình portal cho form generic: catalog lựa chọn, mẫu field, html definition, validator hàm và
 * ngưỡng breakpoint. Dữ liệu của portal chỉ vào form qua các callback này — component không gọi HTTP.
 *
 * Gọi ở `bootstrapApplication` hoặc ở `providers` của một route: builder, renderer và
 * `SdFormRenderService` bên dưới route đó đều đọc đúng cấu hình của route.
 *
 * @example
 * bootstrapApplication(App, {
 *   providers: [provideSdFormGeneric({ catalogs: [districts], breakpoints: { tablet: 700 } })],
 * });
 */
export function provideSdFormGeneric(config: SdFormGenericConfig = {}): EnvironmentProviders {
  // why: the services are root singletons by default — providing them again here gives a route that
  // calls provideSdFormGeneric its own instances, bound to the route's configuration.
  return makeEnvironmentProviders([
    { provide: SD_FORM_GENERIC_CONFIG, useValue: sdResolveFormGenericConfig(config) },
    FormGenericService,
    SdFormRenderService,
  ]);
}
