import { showcaseTimeZone } from './showcase-time-zone';

// The Showcase picks ISdCoreConfiguration.timeZone from ?timeZone= once, before bootstrap.
describe('showcaseTimeZone', () => {
  let warn: jasmine.Spy;

  beforeEach(() => (warn = jasmine.createSpy('warn')));

  it('reads a valid IANA id', () => {
    expect(showcaseTimeZone('?timeZone=Asia/Ho_Chi_Minh', warn)).toBe('Asia/Ho_Chi_Minh');
    expect(showcaseTimeZone('?section=a&timeZone=UTC', warn)).toBe('UTC');
    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps 'local' without the parameter or with 'local'", () => {
    for (const search of ['', '?', '?section=a', '?timeZone=', '?timeZone=local']) {
      expect(showcaseTimeZone(search, warn)).withContext(search).toBe('local');
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back to 'local' and warns for an invalid value", () => {
    for (const [search, value] of [
      ['?timeZone=%2B07%3A00', '+07:00'],
      ['?timeZone=GMT%2B7', 'GMT+7'],
      ['?timeZone=Mars/Base', 'Mars/Base'],
    ]) {
      warn.calls.reset();
      expect(showcaseTimeZone(search, warn)).withContext(search).toBe('local');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.calls.mostRecent().args[0]).toContain(value);
    }
  });
});
