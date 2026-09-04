import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { SdTabRouterService } from './tab-router.service';
import { SdTabActivated, SdTabBase, SdTabDeactivated } from '../events/tab-router.event';
import { SdTabRouterTab, SdTabInfo } from '../models/tab-router.model';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
class CompA {}
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
class CompB {}

const makeTab = (over: Partial<SdTabRouterTab> = {}): SdTabRouterTab =>
  ({
    component: CompA,
    key: 'k1',
    isActive: false,
    url: '/a',
    params: {},
    queryParams: {},
    data: {},
    tabInfoChanges: new Subject<SdTabInfo>(),
    ...over,
  }) as SdTabRouterTab;

describe('SdTabRouterService', () => {
  let service: SdTabRouterService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SdTabRouterService] });
    service = TestBed.inject(SdTabRouterService);
  });

  describe('initial state', () => {
    it('events stream starts with an SdTabBase wrapping undefined', () => {
      const v = service.events.getValue();
      expect(v).toBeInstanceOf(SdTabBase);
      expect(v.tab).toBeUndefined();
    });

    it('actions / builders / currentTabChanges start empty/undefined', () => {
      expect(service.actions.getValue()).toBeUndefined();
      expect(service.builders.getValue()).toEqual([]);
      expect(service.currentTabChanges.getValue()).toBeUndefined();
    });

    it('currentTab and currentKey are undefined/null initially', () => {
      expect(service.currentTab).toBeUndefined();
      expect(service.currentKey).toBeNull();
    });
  });

  describe('addBuilder', () => {
    it('stores a builder and pushes the new list to the builders stream', () => {
      const emitted: any[] = [];
      service.builders.subscribe(v => emitted.push(v));

      service.addBuilder({ component: CompA, name: 'A' });

      expect(service.builders.getValue().length).toBe(1);
      expect(service.builders.getValue()[0]).toEqual(jasmine.objectContaining({ component: CompA, name: 'A' }));
      // 1 emission for initial [], 1 for the new value
      expect(emitted.length).toBe(2);
    });

    it('ignores duplicate builder for the same component', () => {
      service.addBuilder({ component: CompA, name: 'A' });
      service.addBuilder({ component: CompA, name: 'A-updated' });

      expect(service.builders.getValue().length).toBe(1);
      expect(service.builders.getValue()[0].name).toBe('A');
    });

    it('allows different components to coexist', () => {
      service.addBuilder({ component: CompA, name: 'A' });
      service.addBuilder({ component: CompB, name: 'B' });

      expect(service.builders.getValue().length).toBe(2);
    });
  });

  describe('setCurrentTab', () => {
    it('updates currentTab and emits to currentTabChanges', () => {
      const seen: (SdTabRouterTab | undefined)[] = [];
      service.currentTabChanges.subscribe(t => seen.push(t));

      const tab = makeTab({ key: 'a', url: '/a' });
      service.setCurrentTab(tab);

      expect(service.currentTab).toBe(tab);
      expect(service.currentKey).toBe('a');
      expect(seen[seen.length - 1]).toBe(tab);
    });
  });

  describe('pushEvent', () => {
    it('wraps the tab into the given Event class and emits to events stream', () => {
      const seen: any[] = [];
      service.events.subscribe(e => seen.push(e));

      const tab = makeTab({ key: 'e1' });
      service.pushEvent(tab, SdTabActivated);

      const last = seen[seen.length - 1];
      expect(last).toBeInstanceOf(SdTabActivated);
      expect(last.tab).toBe(tab);
    });

    it('supports both SdTabActivated and SdTabDeactivated', () => {
      const tab = makeTab({ key: 'e2' });
      service.pushEvent(tab, SdTabDeactivated);
      expect(service.events.getValue()).toBeInstanceOf(SdTabDeactivated);
    });
  });

  describe('close', () => {
    it('emits a close action for the given tab', () => {
      const tab = makeTab({ key: 'close-1' });
      service.close(tab);
      expect(service.actions.getValue()).toEqual({ type: 'close', tab });
    });

    it('uses currentTab when no tab argument is supplied', () => {
      const tab = makeTab({ key: 'cur' });
      service.setCurrentTab(tab);

      service.close();
      expect(service.actions.getValue()).toEqual({ type: 'close', tab });
    });

    it('is a no-op when no currentTab and no argument', () => {
      service.close();
      expect(service.actions.getValue()).toBeUndefined();
    });
  });

  it('setOptions and updateTab are callable (currently no-ops)', () => {
    expect(() => service.setOptions()).not.toThrow();
    expect(() => service.updateTab(makeTab())).not.toThrow();
  });
});
