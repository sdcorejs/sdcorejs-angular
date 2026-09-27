import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdHighlight } from './highlight.component';

describe('SdHighlight', () => {
  let fixture: ComponentFixture<SdHighlight>;

  const render = (text: string | number | null | undefined, term: string | null | undefined): HTMLElement => {
    fixture.componentRef.setInput('text', text);
    fixture.componentRef.setInput('term', term);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const marks = (host: HTMLElement): string[] => Array.from(host.querySelectorAll('mark')).map(mark => mark.textContent ?? '');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdHighlight] }).compileComponents();
    fixture = TestBed.createComponent(SdHighlight);
  });

  it('wraps diacritic-insensitive matches in <mark> and keeps the full text', () => {
    const host = render('Nguyễn Văn Đức', 'van duc');
    expect(marks(host)).toEqual(['Văn Đức']);
    expect(host.textContent).toBe('Nguyễn Văn Đức');
  });

  it('marks every occurrence, ignoring case', () => {
    const host = render('Hà Nội và HÀ NỘI', 'ha noi');
    expect(marks(host)).toEqual(['Hà Nội', 'HÀ NỘI']);
    expect(host.textContent).toBe('Hà Nội và HÀ NỘI');
  });

  it('shows markup in the data as text and never parses it', () => {
    const text = '<b>Đức</b> & <img src=x onerror="window.__sdHighlightXss = true">';
    const host = render(text, 'duc');

    expect(host.querySelector('b')).toBeNull();
    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent).toBe(text);
    expect(marks(host)).toEqual(['Đức']);
    expect((window as { __sdHighlightXss?: boolean }).__sdHighlightXss).toBeUndefined();
  });

  it('treats regular-expression characters in the term literally', () => {
    const host = render('Giá (VNĐ) *đặc biệt*', '(vnd)');
    expect(marks(host)).toEqual(['(VNĐ)']);
  });

  it('renders the text without marks when the term is empty or does not match', () => {
    let host = render('Đà Nẵng', '');
    expect(host.querySelector('mark')).toBeNull();
    expect(host.textContent).toBe('Đà Nẵng');

    host = render('Đà Nẵng', 'huế');
    expect(host.querySelector('mark')).toBeNull();
    expect(host.textContent).toBe('Đà Nẵng');
  });

  it('renders numbers and nothing for null or undefined text', () => {
    let host = render(20260925, '0925');
    expect(marks(host)).toEqual(['0925']);
    expect(host.textContent).toBe('20260925');

    host = render(null, 'a');
    expect(host.textContent).toBe('');
    host = render(undefined, 'a');
    expect(host.textContent).toBe('');
  });

  it('exposes the segments it renders', () => {
    render('An Bình An', 'an');
    expect(fixture.componentInstance.segments()).toEqual([
      { text: 'An', match: true },
      { text: ' Bình ', match: false },
      { text: 'An', match: true },
    ]);
  });
});
