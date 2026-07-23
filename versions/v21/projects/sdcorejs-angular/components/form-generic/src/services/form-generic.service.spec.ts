import { TestBed } from '@angular/core/testing';

import { SD_FORM_GENERIC_CONFIGURATION } from '../configurations';
import { SdFormGenericArgs, SdFormGenericSelectionItem } from '../models';
import { FormGenericService } from './form-generic.service';

describe('FormGenericService', () => {
  const args = { entity: { id: 1 } } as SdFormGenericArgs;
  const item = (value: string): SdFormGenericSelectionItem => ({ value, display: value.toUpperCase() });

  function createService(configuration?: Record<string, unknown>): FormGenericService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: configuration ? [{ provide: SD_FORM_GENERIC_CONFIGURATION, useValue: configuration }] : [],
    });
    return TestBed.inject(FormGenericService);
  }

  it('uses safe empty defaults when no configuration is provided', async () => {
    const service = createService();

    expect(service.selections).toEqual([]);
    expect(service.tables).toEqual([]);
    expect(await service.getSelection(null)).toBeUndefined();
    expect(await service.selection.definitions()).toEqual([]);
    expect(await service.selection.getDefinition(undefined)).toBeUndefined();
    expect(await service.selection.items(null, args)).toEqual([]);
    expect(await service.selection.variables.detail('missing', '1', args)).toBeUndefined();
    expect(await service.html.definitions()).toEqual([]);
    expect(await service.html.getContent('missing')).toBe('');
  });

  it('returns and caches array selection definitions', async () => {
    const selections = [{ value: 'cities', display: 'Cities', values: async () => [item('hanoi')] }];
    const tables = [{ value: 'orders', display: 'Orders', columns: [] }];
    const service = createService({ form: { templates: [], selections, tables, htmls: [] } });

    expect(service.selections).toBe(selections);
    expect(service.tables).toBe(tables);
    expect(await service.selection.definitions()).toBe(selections);
    expect(await service.selection.definitions()).toBe(selections);
    expect(await service.getSelection('cities')).toBe(selections[0]);
    expect(await service.selection.getDefinition('cities')).toBe(selections[0]);
    expect(await service.selection.getDefinition('unknown')).toBeUndefined();
  });

  it('resolves synchronous and asynchronous definition factories once', async () => {
    const syncFactory = jasmine
      .createSpy('syncFactory')
      .and.returnValue([{ value: 'sync', display: 'Sync', values: async () => [item('sync')] }]);
    const syncService = createService({
      form: { templates: [], selections: syncFactory, tables: [], htmls: [] },
    });

    expect((await syncService.selection.definitions())[0].value).toBe('sync');
    await syncService.selection.definitions();
    expect(syncFactory).toHaveBeenCalledTimes(1);

    const asyncFactory = jasmine
      .createSpy('asyncFactory')
      .and.resolveTo([{ value: 'async', display: 'Async', values: async () => [item('async')] }]);
    const asyncService = createService({
      form: { templates: [], selections: asyncFactory, tables: [], htmls: [] },
    });

    expect((await asyncService.selection.definitions())[0].value).toBe('async');
    await asyncService.selection.definitions();
    expect(asyncFactory).toHaveBeenCalledTimes(1);
  });

  it('maps static component and table-column values before consulting definitions', async () => {
    const service = createService({ form: { templates: [], selections: [], tables: [], htmls: [] } });

    expect(
      await service.selection.items('ignored', {
        entity: {},
        component: { type: 'select', values: [{ value: 'a', label: 'Alpha' }] },
      } as SdFormGenericArgs)
    ).toEqual([{ value: 'a', display: 'Alpha', data: { value: 'a', label: 'Alpha' } }]);

    expect(
      await service.selection.items('ignored', {
        entity: {},
        component: { type: 'table' },
        column: { values: [{ value: 'b', label: 'Beta' }] },
      } as SdFormGenericArgs)
    ).toEqual([{ value: 'b', display: 'Beta', data: { value: 'b', label: 'Beta' } }]);
  });

  it('loads eager values directly or through the configured values key', async () => {
    const directValues = jasmine.createSpy('directValues').and.resolveTo([item('direct')]);
    const getValues = jasmine.createSpy('getValues').and.resolveTo([item('configured')]);
    const service = createService({
      form: {
        templates: [],
        tables: [],
        htmls: [],
        getValues,
        selections: [
          { value: 'direct', display: 'Direct', values: directValues },
          { value: 'configured', display: 'Configured', valuesKey: 'countries', args: { active: true } },
        ],
      },
    });

    expect(await service.selection.items('direct', args)).toEqual([item('direct')]);
    expect(directValues).toHaveBeenCalledWith(args);
    expect(await service.selection.items('configured', args)).toEqual([item('configured')]);
    expect(getValues).toHaveBeenCalledWith('countries', { active: true });
    expect(await service.selection.items('missing', args)).toEqual([]);
  });

  it('returns executable lazy searches for local and configured definitions', async () => {
    const lazyValues = jasmine.createSpy('lazyValues').and.resolveTo([item('local')]);
    const configuredSearch = jasmine.createSpy('configuredSearch').and.resolveTo([item('remote')]);
    const getLazyValues = jasmine.createSpy('getLazyValues').and.returnValue(configuredSearch);
    const service = createService({
      form: {
        templates: [],
        tables: [],
        htmls: [],
        getLazyValues,
        selections: [
          { value: 'local', display: 'Local', lazyValues },
          { value: 'remote', display: 'Remote', lazyValuesKey: 'users', args: { role: 'admin' } },
        ],
      },
    });
    const searchArgs = { search: 'an', page: 1 } as never;

    const localSearch = await service.selection.items('local', args);
    expect(typeof localSearch).toBe('function');
    expect(await (localSearch as (value: never) => Promise<SdFormGenericSelectionItem[]>)(searchArgs)).toEqual([item('local')]);
    expect(lazyValues).toHaveBeenCalledWith(searchArgs, args);

    const remoteSearch = await service.selection.items('remote', args);
    expect(getLazyValues).toHaveBeenCalledWith('users', { role: 'admin' });
    expect(await (remoteSearch as (value: never) => Promise<SdFormGenericSelectionItem[]>)(searchArgs)).toEqual([item('remote')]);
    expect(configuredSearch).toHaveBeenCalledWith(searchArgs, args);
  });

  it('returns empty values and logs when a selection loader fails', async () => {
    const error = new Error('selection failed');
    const consoleError = spyOn(console, 'error');
    const service = createService({
      form: {
        templates: [],
        tables: [],
        htmls: [],
        selections: [{ value: 'broken', display: 'Broken', values: async () => Promise.reject(error) }],
      },
    });

    expect(await service.selection.items('broken', args)).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(error);
  });

  it('delegates selection detail lookup when the definition provides it', async () => {
    const detail = jasmine.createSpy('detail').and.resolveTo({ id: 7, name: 'Seven' });
    const service = createService({
      form: {
        templates: [],
        tables: [],
        htmls: [],
        selections: [{ value: 'users', display: 'Users', values: async () => [], variables: { detail } }],
      },
    });

    expect(await service.selection.variables.detail('users', 7, args)).toEqual({ id: 7, name: 'Seven' });
    expect(detail).toHaveBeenCalledWith(7, args);
  });

  it('resolves and caches synchronous and asynchronous HTML factories', async () => {
    const syncFactory = jasmine
      .createSpy('syncHtml')
      .and.returnValue([{ type: 'static', value: 'sync', display: 'Sync', content: '<b>Sync</b>' }]);
    const syncService = createService({
      form: { templates: [], selections: [], tables: [], htmls: syncFactory },
    });
    expect(await syncService.html.getContent('sync')).toBe('<b>Sync</b>');
    await syncService.html.definitions();
    expect(syncFactory).toHaveBeenCalledTimes(1);

    const asyncFactory = jasmine
      .createSpy('asyncHtml')
      .and.resolveTo([{ type: 'static', value: 'async', display: 'Async', content: '<b>Async</b>' }]);
    const asyncService = createService({
      form: { templates: [], selections: [], tables: [], htmls: asyncFactory },
    });
    expect(await asyncService.html.getContent('async')).toBe('<b>Async</b>');
    await asyncService.html.definitions();
    expect(asyncFactory).toHaveBeenCalledTimes(1);
  });

  it('renders static and queried HTML and handles unsupported or rejected content', async () => {
    const queryContent = jasmine.createSpy('queryContent').and.resolveTo('<p>Result</p>');
    const error = new Error('html failed');
    const consoleError = spyOn(console, 'error');
    const service = createService({
      form: {
        templates: [],
        selections: [],
        tables: [],
        htmls: [
          { type: 'static', value: 'static', display: 'Static', content: '<p>Static</p>' },
          { type: 'query', value: 'query', display: 'Query', queries: [], content: queryContent },
          { type: 'query', value: 'broken', display: 'Broken', queries: [], content: async () => Promise.reject(error) },
          { type: 'static', value: 'unsupported', display: 'Unsupported', content: 123 },
        ],
      },
    });

    expect(await service.html.getContent('static')).toBe('<p>Static</p>');
    expect(await service.html.getContent('query', { id: 1 })).toBe('<p>Result</p>');
    expect(queryContent).toHaveBeenCalledWith({ id: 1 });
    expect(await service.html.getContent('broken')).toBe('');
    expect(consoleError).toHaveBeenCalledWith(error);
    expect(await service.html.getContent('unsupported')).toBe('');
    expect(await service.html.getContent('missing')).toBe('');
  });
});
