import { ColorUtilities, hslToHex, rgbToHex } from './color.extension';

// why: color.extension.ts only re-exports from @sdcorejs/utils/fns; verify
// the re-export surface stays wired (deprecated aliases + namespace) so
// downstream code that still imports from here doesn't silently break.
describe('color.extension re-exports', () => {
  it('exposes ColorUtilities namespace with hslToHex/rgbToHex functions', () => {
    expect(ColorUtilities).toBeDefined();
    expect(typeof ColorUtilities.hslToHex).toBe('function');
    expect(typeof ColorUtilities.rgbToHex).toBe('function');
  });

  it('deprecated `hslToHex` alias is identical to ColorUtilities.hslToHex', () => {
    expect(hslToHex).toBe(ColorUtilities.hslToHex);
  });

  it('deprecated `rgbToHex` alias is identical to ColorUtilities.rgbToHex', () => {
    expect(rgbToHex).toBe(ColorUtilities.rgbToHex);
  });

  it('hslToHex returns a #RRGGBB string for sample inputs', () => {
    const out = hslToHex(0, 0, 0);
    expect(out).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('rgbToHex returns a #RRGGBB string for sample inputs', () => {
    const out = rgbToHex(255, 255, 255);
    expect(out).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(out.toLowerCase()).toBe('#ffffff');
  });
});
