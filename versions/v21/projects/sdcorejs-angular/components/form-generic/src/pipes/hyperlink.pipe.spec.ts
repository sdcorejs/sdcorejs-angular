import { HyperlinkPipe } from './hyperlink.pipe';

describe('HyperlinkPipe', () => {
  const pipe = new HyperlinkPipe();

  it('fills ${key} and ${a.b} with URL-encoded values, keeping the template around them', () => {
    expect(pipe.transform('/users/${id}?q=${q}&c=${org.code}', { id: 'a/b', q: 'x&y', org: { code: 'A 1' } })).toBe(
      '/users/a%2Fb?q=x%26y&c=A%201'
    );
  });

  it('never expands replacement patterns found in a value and leaves a missing value empty', () => {
    expect(pipe.transform('/p/${v}/${missing}', { v: "$&$'" })).toBe("/p/%24%26%24'/");
  });

  it('cannot turn a template that starts with a value into an external link', () => {
    expect(pipe.transform('${url}', { url: 'https://evil.example/x' })).toBe('https%3A%2F%2Fevil.example%2Fx');
  });

  it('does not throw on a lone UTF-16 surrogate (truncated data) — it becomes U+FFFD', () => {
    expect(pipe.transform('/p/${v}', { v: 'a\uD800' })).toBe('/p/a%EF%BF%BD');
  });

  it('returns an empty string without a template', () => {
    expect(pipe.transform(undefined, {})).toBe('');
  });
});
