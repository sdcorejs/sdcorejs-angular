import { TestBed } from '@angular/core/testing';
import { PatternMockApiState } from '../../mock-api/mock-api.state';
import { PATTERN_ORDER_SETTINGS_DEFAULTS, PatternSettingsStore } from './pattern-settings.store';

const KEY = 'sd-pattern.order.settings';

describe('PatternSettingsStore', () => {
  let setReadOverride: jasmine.Spy;

  const create = (): PatternSettingsStore => {
    setReadOverride = jasmine.createSpy('setReadOverride');
    TestBed.configureTestingModule({
      providers: [PatternSettingsStore, { provide: PatternMockApiState, useValue: { setReadOverride } }],
    });
    return TestBed.inject(PatternSettingsStore);
  };

  afterEach(() => sessionStorage.removeItem(KEY));

  it('starts from the defaults and leaves the list request of the mock API alone', () => {
    const store = create();
    expect(store.settings()).toEqual(PATTERN_ORDER_SETTINGS_DEFAULTS);
    expect(store.e6()).toBeFalse();
    expect(setReadOverride).toHaveBeenCalledOnceWith('orders', undefined);
  });

  it('reads the settings the tab kept, over the defaults', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ tabs: true, records: 3 }));
    const store = create();
    expect(store.settings()).toEqual({ ...PATTERN_ORDER_SETTINGS_DEFAULTS, tabs: true, records: 3 });
    expect(setReadOverride).toHaveBeenCalledOnceWith('orders', { limit: 3, mode: 'normal' });
  });

  it('keeps a change for the tab, forces the read state on the mock API and goes back to the defaults', () => {
    const store = create();
    store.set('read', 'error');
    store.set('externalFilter', true);
    expect(store.e6()).toBeTrue();
    expect(setReadOverride).toHaveBeenCalledWith('orders', { limit: 128, mode: 'error' });
    expect(JSON.parse(sessionStorage.getItem(KEY)!)).toEqual(jasmine.objectContaining({ read: 'error', externalFilter: true }));

    store.reset();
    expect(store.settings()).toEqual(PATTERN_ORDER_SETTINGS_DEFAULTS);
    expect(sessionStorage.getItem(KEY)).toBeNull();
    expect(setReadOverride).toHaveBeenCalledWith('orders', undefined);
  });
});
