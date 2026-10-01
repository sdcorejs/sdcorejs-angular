import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SdFormGenericCatalog, SdFormGenericValidator } from '../models/form-generic-config.model';
import { FormGenericService } from '../services/form-generic.service';
import { SdFormRenderService } from '../services/form-render.service';
import { SD_FORM_GENERIC_CONFIG, provideSdFormGeneric } from './form-generic.provider';

describe('provideSdFormGeneric', () => {
  it('falls back to defaults when the portal does not provide a configuration', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(SD_FORM_GENERIC_CONFIG)).toEqual({
      catalogs: [],
      templates: [],
      htmlDefinitions: [],
      validators: [],
      breakpoints: { tablet: 600, desktop: 1024 },
    });
  });

  it('merges a partial breakpoint override with SD_FORM_GENERIC_BREAKPOINTS', () => {
    TestBed.configureTestingModule({ providers: [provideSdFormGeneric({ breakpoints: { tablet: 700 } })] });
    expect(TestBed.inject(SD_FORM_GENERIC_CONFIG).breakpoints).toEqual({ tablet: 700, desktop: 1024 });
  });

  it('passes catalogs, templates, html definitions and validators through unchanged', () => {
    const catalog: SdFormGenericCatalog = { id: 'cities', label: 'Cities', load: async () => [] };
    const validator: SdFormGenericValidator = { id: 'v', label: 'V', validate: () => null };
    const htmlDefinitions = async () => [{ type: 'static' as const, id: 'h', label: 'H', content: '<b>x</b>' }];
    TestBed.configureTestingModule({
      providers: [provideSdFormGeneric({ catalogs: [catalog], validators: [validator], htmlDefinitions, templates: [] })],
    });
    const config = TestBed.inject(SD_FORM_GENERIC_CONFIG);
    expect(config.catalogs).toEqual([catalog]);
    expect(config.catalogs[0]).toBe(catalog);
    expect(config.validators[0]).toBe(validator);
    expect(config.htmlDefinitions).toBe(htmlDefinitions);
  });

  it('gives a route that calls it its own services, bound to the route configuration', () => {
    const rootCatalog: SdFormGenericCatalog = { id: 'root', label: 'Root', load: async () => [] };
    const routeCatalog: SdFormGenericCatalog = { id: 'route', label: 'Route', load: async () => [] };
    TestBed.configureTestingModule({ providers: [provideSdFormGeneric({ catalogs: [rootCatalog] })] });
    const route = createEnvironmentInjector([provideSdFormGeneric({ catalogs: [routeCatalog] })], TestBed.inject(EnvironmentInjector));
    expect(TestBed.inject(FormGenericService).catalog('route')).toBeUndefined();
    expect(route.get(FormGenericService).catalog('route')).toBe(routeCatalog);
    expect(route.get(FormGenericService).catalog('root')).toBeUndefined();
    expect(route.get(SdFormRenderService)).not.toBe(TestBed.inject(SdFormRenderService));
    route.destroy();
  });
});
