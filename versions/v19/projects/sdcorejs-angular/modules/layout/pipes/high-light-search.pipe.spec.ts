import { HighlightSearchPipe } from './high-light-search.pipe';

describe('HighlightSearchPipe', () => {
  let pipe: HighlightSearchPipe;

  beforeEach(() => {
    pipe = new HighlightSearchPipe();
  });

  it('returns the original value when the keyword has fewer than 2 characters', () => {
    expect(pipe.transform('Sản phẩm', 's')).toBe('Sản phẩm');
  });

  it('highlights a contiguous, accent-insensitive substring match', () => {
    expect(pipe.transform('Sản phẩm', 'san')).toBe('<mark style="background-color: #ffff00">Sản</mark> phẩm');
  });

  it('highlights each matched initial letter (in order) when there is no contiguous substring match', () => {
    // "sp" không xuất hiện liền nhau trong "san pham" (bản alias của "Sản phẩm")
    // -> pipe phải fallback sang match theo ký tự đầu và highlight riêng "S" và "p"
    expect(pipe.transform('Sản phẩm', 'sp')).toBe(
      '<mark style="background-color: #ffff00">S</mark>ản <mark style="background-color: #ffff00">p</mark>hẩm'
    );
  });

  it('returns the original value when neither a substring nor an ordered-initials match is found', () => {
    expect(pipe.transform('Sản phẩm', 'xyz')).toBe('Sản phẩm');
  });

  it('respects a custom highlight color for both substring and initials matches', () => {
    expect(pipe.transform('Sản phẩm', 'sp', { color: '#00ff00' })).toBe(
      '<mark style="background-color: #00ff00">S</mark>ản <mark style="background-color: #00ff00">p</mark>hẩm'
    );
  });
});
