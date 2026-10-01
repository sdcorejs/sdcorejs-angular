import { TestBed } from '@angular/core/testing';
import { provideSdFormGeneric } from '../configurations/form-generic.provider';
import type { SdFormGenericConfig, SdFormGenericHtmlDefinition } from '../models/form-generic-config.model';
import { FormGenericService } from './form-generic.service';

describe('FormGenericService', () => {
  const create = (config?: SdFormGenericConfig): FormGenericService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: config ? [provideSdFormGeneric(config)] : [] });
    return TestBed.inject(FormGenericService);
  };

  it('uses safe empty defaults when the portal does not configure form generic', async () => {
    const service = create();
    expect(service.catalogs).toEqual([]);
    expect(service.templates).toEqual([]);
    expect(service.validators).toEqual([]);
    expect(service.catalog('cities')).toBeUndefined();
    expect(await service.htmlDefinitions()).toEqual([]);
    expect(await service.htmlContent('missing')).toBe('');
  });

  it('finds a registered catalog by id', () => {
    const cities = { id: 'cities', label: 'Cities', load: async () => [] };
    const service = create({ catalogs: [cities] });
    expect(service.catalog('cities')).toBe(cities);
    expect(service.catalog(null)).toBeUndefined();
  });

  it('resolves a synchronous or asynchronous html definition factory once', async () => {
    const definitions: SdFormGenericHtmlDefinition[] = [{ type: 'static', id: 'intro', label: 'Intro', content: '<b>Hi</b>' }];
    const syncFactory = jasmine.createSpy('syncFactory').and.returnValue(definitions);
    const syncService = create({ htmlDefinitions: syncFactory });
    expect(await syncService.htmlDefinitions()).toEqual(definitions);
    await syncService.htmlDefinitions();
    expect(syncFactory).toHaveBeenCalledTimes(1);

    const asyncFactory = jasmine.createSpy('asyncFactory').and.resolveTo(definitions);
    const asyncService = create({ htmlDefinitions: asyncFactory });
    expect(await asyncService.htmlDefinition('intro')).toBe(definitions[0]);
    await asyncService.htmlDefinitions();
    expect(asyncFactory).toHaveBeenCalledTimes(1);
  });

  it('retries the html definition factory after it fails', async () => {
    spyOn(console, 'error');
    const factory = jasmine.createSpy('factory').and.returnValues(Promise.reject(new Error('offline')), Promise.resolve([]));
    const service = create({ htmlDefinitions: factory });
    expect(await service.htmlDefinitions()).toEqual([]);
    expect(await service.htmlDefinitions()).toEqual([]);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('renders static content and queried content with params, and swallows a rejected query', async () => {
    spyOn(console, 'error');
    const content = jasmine.createSpy('content').and.callFake(async (params: Record<string, unknown>) => `<p>${params['id']}</p>`);
    const service = create({
      htmlDefinitions: [
        { type: 'static', id: 'static', label: 'Static', content: '<b>x</b>' },
        { type: 'query', id: 'query', label: 'Query', params: [{ name: 'id', label: 'Id' }], content },
        { type: 'query', id: 'broken', label: 'Broken', params: [], content: () => Promise.reject(new Error('boom')) },
      ],
    });
    expect(await service.htmlContent('static')).toBe('<b>x</b>');
    expect(await service.htmlContent('query', { id: 7 })).toBe('<p>7</p>');
    expect(content).toHaveBeenCalledOnceWith({ id: 7 });
    expect(await service.htmlContent('broken')).toBe('');
  });
});
