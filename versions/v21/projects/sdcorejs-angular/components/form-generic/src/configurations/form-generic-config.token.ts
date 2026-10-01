import { InjectionToken } from '@angular/core';
import { sdResolveBreakpoints } from '../layout/form-generic-layout';
import type {
  SdFormGenericCatalog,
  SdFormGenericConfig,
  SdFormGenericHtmlDefinition,
  SdFormGenericTemplate,
  SdFormGenericValidator,
} from '../models/form-generic-config.model';
import type { SdFormGenericBreakpoints } from './form-generic-breakpoints';

// why: the token lives apart from provideSdFormGeneric — the services read it, and the provider also
// provides the services, so keeping both in one file would make an import cycle.

/** Cấu hình đã chuẩn hoá mà renderer/builder đọc. */
export interface SdFormGenericResolvedConfig {
  catalogs: SdFormGenericCatalog[];
  templates: SdFormGenericTemplate[];
  htmlDefinitions: NonNullable<SdFormGenericConfig['htmlDefinitions']>;
  validators: SdFormGenericValidator[];
  breakpoints: SdFormGenericBreakpoints;
}

export const sdResolveFormGenericConfig = (config: SdFormGenericConfig): SdFormGenericResolvedConfig => ({
  catalogs: config.catalogs ?? [],
  templates: config.templates ?? [],
  htmlDefinitions: config.htmlDefinitions ?? ([] as SdFormGenericHtmlDefinition[]),
  validators: config.validators ?? [],
  breakpoints: sdResolveBreakpoints(config.breakpoints),
});

/**
 * Token nội bộ; có factory mặc định để renderer/builder vẫn chạy khi portal chưa gọi
 * `provideSdFormGeneric` (breakpoints mặc định, không catalog).
 */
export const SD_FORM_GENERIC_CONFIG = new InjectionToken<SdFormGenericResolvedConfig>('SD_FORM_GENERIC_CONFIG', {
  providedIn: 'root',
  factory: () => sdResolveFormGenericConfig({}),
});
