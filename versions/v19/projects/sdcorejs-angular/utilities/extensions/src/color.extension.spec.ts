import { ColorUtilities } from './color.extension';

// why: color.extension.ts only re-exports from @sdcorejs/utils/fns; verify the
// re-export surface stays wired so downstream code importing from here doesn't
// silently break. Hai alias module-level `hslToHex` / `rgbToHex` đã bị xoá trong
// đợt breaking rename — gọi qua namespace `ColorUtilities` thay thế.
describe('color.extension re-exports', () => {
  it('exposes ColorUtilities namespace with hslToHex/rgbToHex functions', () => {
    expect(ColorUtilities).toBeDefined();
    expect(typeof ColorUtilities.hslToHex).toBe('function');
    expect(typeof ColorUtilities.rgbToHex).toBe('function');
  });

  it('ColorUtilities.hslToHex returns a #RRGGBB string for sample inputs', () => {
    const out = ColorUtilities.hslToHex(0, 0, 0);
    expect(out).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('ColorUtilities.rgbToHex returns a #RRGGBB string for sample inputs', () => {
    const out = ColorUtilities.rgbToHex(255, 255, 255);
    expect(out).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(out.toLowerCase()).toBe('#ffffff');
  });
});
