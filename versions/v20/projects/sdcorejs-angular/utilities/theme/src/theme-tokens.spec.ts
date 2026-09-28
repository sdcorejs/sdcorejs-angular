import { SD_COLOR_TOKENS, SdColorToken, readSdTokens } from './theme-tokens';

describe('theme tokens', () => {
  describe('SD_COLOR_TOKENS', () => {
    it('lists the 2.15 palette, the 7 x 11 ramps and the semantic roles, without duplicates', () => {
      expect(SD_COLOR_TOKENS).toContain('primary');
      expect(SD_COLOR_TOKENS).toContain('disabled-text');
      expect(SD_COLOR_TOKENS).toContain('neutral-950');
      expect(SD_COLOR_TOKENS).toContain('status-error-fg');
      expect(SD_COLOR_TOKENS).toContain('focus-ring-color');
      expect(SD_COLOR_TOKENS.length as number).toBe(33 + 77 + 15);
      expect(new Set(SD_COLOR_TOKENS).size).toBe(SD_COLOR_TOKENS.length);
    });
  });

  describe('readSdTokens', () => {
    let host: HTMLElement;

    beforeEach(() => {
      host = document.createElement('div');
      host.style.setProperty('--sd-primary', '#123456');
      host.style.setProperty('--sd-link', 'var(--sd-primary)');
      host.style.setProperty('--sd-primary-light', 'color-mix(in srgb, var(--sd-primary) 14%, white)');
      document.body.appendChild(host);
    });

    afterEach(() => host.remove());

    it('returns the computed values with var() references resolved by the browser', () => {
      const tokens = readSdTokens(host);
      expect(tokens.primary).toBe('#123456');
      expect(tokens.link).toBe('#123456');
      expect(tokens['primary-light']).toBe('color-mix(in srgb, #123456 14%, white)');
    });

    it('reads only the requested tokens and skips tokens without a value', () => {
      const requested: SdColorToken[] = ['primary', 'status-error-fg'];
      expect(readSdTokens(host, requested)).toEqual({ primary: '#123456' });
    });

    it('reads <html> when no element is given', () => {
      document.documentElement.style.setProperty('--sd-surface', '#fafafa');
      try {
        expect(readSdTokens(undefined, ['surface']).surface).toBe('#fafafa');
      } finally {
        document.documentElement.style.removeProperty('--sd-surface');
      }
    });

    it('returns {} for an element whose document has no window (as under SSR)', () => {
      const detached = new DOMParser().parseFromString('<p style="--sd-primary: red"></p>', 'text/html').body.firstElementChild;
      expect(readSdTokens(detached)).toEqual({});
    });
  });
});
