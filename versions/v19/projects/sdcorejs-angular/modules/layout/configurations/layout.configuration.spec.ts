import {
  DEFAULT_LAYOUT_MOBILE_BREAKPOINT,
  ISdSidebarConfiguration,
  SidebarConfigurationV1,
  SidebarConfigurationV2,
  SidebarConfigurationV3,
  normalizeLayoutMobileBreakpoint,
  normalizeSidebarConfiguration,
  resolveSidebarV2Interaction,
  resolveSidebarV3Recent,
} from './layout.configuration';

describe('layout configuration', () => {
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
});
