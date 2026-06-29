import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { SdTabInfoPipe } from './tab-info.pipe';
import { SdTab, SdTabInfo } from '../models/tab-router.model';
import { SdTabRouterService } from '../services/tab-router.service';

@Component({ standalone: true, template: '' })
class DummyA {}
@Component({ standalone: true, template: '' })
class DummyB {}

const makeTab = (over: Partial<SdTab> = {}): SdTab =>
  ({
    component: DummyA,
    key: 'k',
    isActive: false,
    url: '/u',
    params: { id: 1 },
    queryParams: { q: 'x' },
    data: { extra: true },
    tabInfoChanges: new Subject<SdTabInfo>(),
    ...over,
  }) as SdTab;

describe('SdTabInfoPipe', () => {
  let pipe: SdTabInfoPipe;
  let service: SdTabRouterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SdTabRouterService, SdTabInfoPipe],
    });
    service = TestBed.inject(SdTabRouterService);
    pipe = TestBed.inject(SdTabInfoPipe);
  });

  it('returns the provided tabInfo as-is when truthy', () => {
    const info: SdTabInfo = { name: 'fixed', icon: 'star' };
    const tab = makeTab();
    expect(pipe.transform(info, tab)).toBe(info);
  });

  it('falls back to builder lookup when tabInfo is null', () => {
    service.addBuilder({ component: DummyA, name: 'A', icon: 'a-icon' });
    expect(pipe.transform(null, makeTab({ component: DummyA }))).toEqual({
      name: 'A',
      icon: 'a-icon',
      tooltip: undefined,
      color: undefined,
    });
  });

  it('falls back to builder lookup when tabInfo is undefined', () => {
    service.addBuilder({ component: DummyA, name: 'A' });
    const out = pipe.transform(undefined, makeTab({ component: DummyA }));
    expect(out.name).toBe('A');
  });

  it('invokes function-typed builder fields with {url, params, queryParams, data}', () => {
    const nameFn = jasmine.createSpy('name').and.returnValue('dyn-name');
    const iconFn = jasmine.createSpy('icon').and.returnValue('dyn-icon');
    const tooltipFn = jasmine.createSpy('tooltip').and.returnValue('dyn-tip');
    const colorFn = jasmine.createSpy('color').and.returnValue('primary');

    service.addBuilder({
      component: DummyA,
      name: nameFn,
      icon: iconFn,
      tooltip: tooltipFn,
      color: colorFn,
    });

    const tab = makeTab({ component: DummyA, url: '/x', params: { id: 7 }, queryParams: { z: 9 }, data: { d: 1 } });
    const out = pipe.transform(null, tab);

    expect(nameFn).toHaveBeenCalledWith({ url: '/x', params: { id: 7 }, queryParams: { z: 9 }, data: { d: 1 } });
    expect(iconFn).toHaveBeenCalledWith({ url: '/x', params: { id: 7 }, queryParams: { z: 9 } });
    expect(tooltipFn).toHaveBeenCalledWith({ url: '/x', params: { id: 7 }, queryParams: { z: 9 } });
    expect(colorFn).toHaveBeenCalledWith({ url: '/x', params: { id: 7 }, queryParams: { z: 9 } });
    expect(out).toEqual({ name: 'dyn-name', icon: 'dyn-icon', tooltip: 'dyn-tip', color: 'primary' });
  });

  it('falls back to { name: tab.url, icon: undefined } when no builder matches', () => {
    expect(pipe.transform(null, makeTab({ component: DummyB, url: '/no-builder' }))).toEqual({
      name: '/no-builder',
      icon: undefined,
    });
  });

  it('matches the right builder among many', () => {
    service.addBuilder({ component: DummyA, name: 'A' });
    service.addBuilder({ component: DummyB, name: 'B' });
    expect(pipe.transform(null, makeTab({ component: DummyB })).name).toBe('B');
  });
});
