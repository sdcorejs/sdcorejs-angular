import { signal } from '@angular/core';
import { of } from 'rxjs';
import {
  DEFAULT_LAYOUT_MOBILE_BREAKPOINT,
  ISdLayoutConfiguration,
  ISdSidebarConfiguration,
  SdLayoutContext,
  SdLayoutContextConfiguration,
  SdLayoutUserRole,
  SdLayoutUserInfo,
  SidebarConfigurationV1,
  SidebarConfigurationV2,
  SidebarConfigurationV3,
  SidebarConfigurationV4,
  normalizeLayoutMobileBreakpoint,
  normalizeSidebarConfiguration,
  resolveSidebarV2Interaction,
  resolveSidebarV3Recent,
} from './layout.configuration';

describe('layout configuration', () => {
  it('accepts optional role and account actions without changing the required V1 contract', () => {
    const role: SdLayoutUserRole = { text: 'Administrator', icon: 'badge', color: '#005cbb' };
    const userInfo: SdLayoutUserInfo = {
      fullName: 'Demo User',
      role,
    };
    const base = {
      sidebar: { version: 1 } as const,
      userInfo,
      signout: () => undefined,
      updateProfile: () => undefined,
      setting: () => undefined,
    };
    const configurations: ISdLayoutConfiguration[] = [
      { ...base, notification: { count: 3, action: () => undefined } },
      { ...base, notification: { count: signal(7), action: () => undefined } },
      { ...base, notification: { count: of(11), action: () => undefined } },
    ];

    expect(configurations.map(configuration => configuration.notification?.count)).toEqual([3, jasmine.any(Function), jasmine.any(Object)]);
    expect(userInfo.role).toEqual({ text: 'Administrator', icon: 'badge', color: '#005cbb' });
  });

  it('keeps V1 source-compatible while accepting V2 and V3', () => {
    const v1: SidebarConfigurationV1 = { version: 1, defaultTitle: 'Legacy' };
    const v2: SidebarConfigurationV2 = { version: 2 };
    const v3: SidebarConfigurationV3 = { version: 3 };
    const configurations: ISdSidebarConfiguration[] = [v1, v2, v3];

    expect(configurations.map(configuration => configuration.version)).toEqual([1, 2, 3]);
    expect(normalizeSidebarConfiguration(v1)).toEqual(v1);
  });

  it('defaults invalid mobile breakpoints to 1024', () => {
    expect(normalizeLayoutMobileBreakpoint(undefined)).toBe(DEFAULT_LAYOUT_MOBILE_BREAKPOINT);
    expect(normalizeLayoutMobileBreakpoint(Number.NaN)).toBe(1024);
    expect(normalizeLayoutMobileBreakpoint(0)).toBe(1024);
    expect(normalizeLayoutMobileBreakpoint(900)).toBe(900);
  });

  it('defaults V2 interaction to click', () => {
    expect(resolveSidebarV2Interaction({ version: 2 })).toBe('click');
    expect(resolveSidebarV2Interaction({ version: 2, interaction: 'hover-lock' })).toBe('hover-lock');
  });

  it('normalizes V3 recent defaults and invalid limits', () => {
    expect(resolveSidebarV3Recent({ version: 3 })).toEqual({ enabled: true, maxItems: 5 });
    expect(resolveSidebarV3Recent({ version: 3, recent: { enabled: false, maxItems: 0 } })).toEqual({
      enabled: false,
      maxItems: 5,
    });
    expect(resolveSidebarV3Recent({ version: 3, recent: { maxItems: 3.8 } })).toEqual({ enabled: true, maxItems: 3 });
  });

  describe('sidebar V4 and context', () => {
    const items: SdLayoutContext[] = [
      { id: 'hcm', title: 'Ho Chi Minh', subtitle: 'South', avatar: '/assets/hcm.png' },
      { id: 'hn', title: 'Ha Noi' },
    ];
    const context: SdLayoutContextConfiguration = { label: 'Store', items, searchable: true };

    it('accepts V4 in the sidebar union and context on every version', () => {
      const configurations: ISdSidebarConfiguration[] = [
        { version: 1, context },
        { version: 2, context },
        { version: 3, context },
        { version: 4, context },
      ];

      expect(configurations.map(configuration => configuration.version)).toEqual([1, 2, 3, 4]);
      expect(configurations.map(configuration => configuration.context)).toEqual([context, context, context, context]);
    });

    it('resolves V4 defaults without inventing a mobile bottom bar', () => {
      const normalized = normalizeSidebarConfiguration({ version: 4 });

      expect(normalized).toEqual({
        version: 4,
        defaultCollapsed: false,
        recent: { enabled: true, maxItems: 5 },
        itemShape: 'pill',
        density: 'compact',
        collapsedGroup: 'flyout',
      });
      expect(Object.prototype.hasOwnProperty.call(normalized, 'mobile')).toBeFalse();
      expect(normalizeSidebarConfiguration({ version: 4, mobile: {} }).mobile).toEqual({});
    });

    it('keeps valid V4 options and falls back to defaults for invalid values', () => {
      expect(normalizeSidebarConfiguration({ version: 4, itemShape: 'soft', density: 'comfortable', collapsedGroup: 'expand' })).toEqual(
        jasmine.objectContaining({ itemShape: 'soft', density: 'comfortable', collapsedGroup: 'expand' })
      );

      const invalid = {
        version: 4,
        itemShape: 'round',
        density: 'cozy',
        collapsedGroup: 'popup',
      } as unknown as SidebarConfigurationV4;
      expect(normalizeSidebarConfiguration(invalid)).toEqual(
        jasmine.objectContaining({ itemShape: 'pill', density: 'compact', collapsedGroup: 'flyout' })
      );
    });

    it('normalizes V4 recent and collapsed state exactly like V3', () => {
      expect(normalizeSidebarConfiguration({ version: 4, recent: { enabled: false, maxItems: 0 } })).toEqual(
        jasmine.objectContaining({ defaultCollapsed: false, recent: { enabled: false, maxItems: 5 } })
      );
      expect(normalizeSidebarConfiguration({ version: 4, defaultCollapsed: true, recent: { maxItems: 3.8 } })).toEqual(
        jasmine.objectContaining({ defaultCollapsed: true, recent: { enabled: true, maxItems: 3 } })
      );
    });

    it('sanitizes mobile.bottomBar to at most 4 unique trimmed ids in order', () => {
      const bottomBar = [' orders ', 42, '', '   ', 'orders', null, 'customers', 'reports', 'settings', 'help'];
      const sidebar = { version: 4, mobile: { bottomBar } } as unknown as SidebarConfigurationV4;

      expect(normalizeSidebarConfiguration(sidebar).mobile).toEqual({ bottomBar: ['orders', 'customers', 'reports', 'settings'] });
      expect(bottomBar.length).toBe(10);
      expect(normalizeSidebarConfiguration({ version: 4, mobile: { bottomBar: ['', ' '] } }).mobile).toEqual({ bottomBar: [] });
    });

    it('passes context through unchanged for every version', () => {
      expect(normalizeSidebarConfiguration({ version: 1, context }).context).toBe(context);
      expect(normalizeSidebarConfiguration({ version: 2, context }).context).toBe(context);
      expect(normalizeSidebarConfiguration({ version: 3, context }).context).toBe(context);
      expect(normalizeSidebarConfiguration({ version: 4, context }).context).toBe(context);
      expect(context.items).toBe(items);
    });

    it('keeps V1–V3 normalization unchanged', () => {
      const v1: SidebarConfigurationV1 = { version: 1, defaultTitle: 'Legacy' };

      expect(normalizeSidebarConfiguration(v1)).toBe(v1);
      expect(normalizeSidebarConfiguration({ version: 2, primaryMenuIds: [' a ', '', 'b', ' a ', 'c', 'd'] })).toEqual({
        version: 2,
        interaction: 'click',
        primaryMenuIds: [' a ', 'b', 'c'],
      });
      expect(normalizeSidebarConfiguration({ version: 3 })).toEqual({
        version: 3,
        defaultCollapsed: false,
        recent: { enabled: true, maxItems: 5 },
      });
    });
  });
});
