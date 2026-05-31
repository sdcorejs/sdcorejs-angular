import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { SdSafeHtmlPipe } from './safe-html.pipe';

describe('SdSafeHtmlPipe', () => {
  let pipe: SdSafeHtmlPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule],
      providers: [SdSafeHtmlPipe],
    });
    pipe = TestBed.inject(SdSafeHtmlPipe);
  });

  it('returns undefined for null', () => {
    expect(pipe.transform(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(pipe.transform('')).toBeUndefined();
  });

  it('returns a number value as-is', () => {
    expect(pipe.transform(42)).toBe(42);
    expect(pipe.transform(0)).toBe(0);
    expect(pipe.transform(-5)).toBe(-5);
  });

  it('returns a SafeValue (not a plain string) for valid HTML', () => {
    const result = pipe.transform('<b>Hello</b>');
    expect(result).toBeTruthy();
    // DomSanitizer.bypassSecurityTrustHtml returns a SafeValue object, not a string
    expect(typeof result).not.toBe('string');
  });

  it('returns a SafeValue for plain text strings', () => {
    const result = pipe.transform('Hello World');
    expect(result).toBeTruthy();
    expect(typeof result).not.toBe('string');
  });

  it('returns a SafeValue for multi-tag HTML', () => {
    const result = pipe.transform('<div><p>Test</p></div>');
    expect(result).toBeTruthy();
    expect(typeof result).not.toBe('string');
  });
});
