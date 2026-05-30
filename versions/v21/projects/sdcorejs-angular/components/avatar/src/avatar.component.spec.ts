import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdAvatar } from './avatar.component';
import { queryByCss, setInput } from '../../../testing/test-utils';

describe('SdAvatar', () => {
  let fixture: ComponentFixture<SdAvatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdAvatar],
    }).compileComponents();

    fixture = TestBed.createComponent(SdAvatar);
  });

  describe('URL detection (isUrl)', () => {
    it('detects http URL → renders <img>', () => {
      setInput(fixture, 'src', 'http://example.com/a.png');
      const img = queryByCss<HTMLImageElement>(fixture, 'img');
      expect(img.getAttribute('src')).toBe('http://example.com/a.png');
    });

    it('detects https URL → renders <img>', () => {
      setInput(fixture, 'src', 'https://cdn.com/avatar.jpg');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });

    it('detects data:image/ URL → renders <img>', () => {
      setInput(fixture, 'src', 'data:image/png;base64,AAA');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });

    it('detects absolute path "/" → renders <img>', () => {
      setInput(fixture, 'src', '/assets/avatar.png');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });

    it('treats free text as name → renders initials span (no img)', () => {
      setInput(fixture, 'src', 'Nguyễn Văn An');
      expect(fixture.nativeElement.querySelector('img')).toBeNull();
      const span = queryByCss(fixture, 'span.sd-avatar-text');
      expect(span.textContent?.trim()).toBe('NA');
    });
  });

  describe('initials computation', () => {
    it('returns 2-letter initials from 2+ words', () => {
      setInput(fixture, 'src', 'Tran Trung Nghia');
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('TN');
    });

    it('returns single letter for 1-word name', () => {
      setInput(fixture, 'src', 'An');
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('A');
    });

    it('uppercases the initials', () => {
      setInput(fixture, 'src', 'an binh');
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('AB');
    });

    it('returns "?" for empty string', () => {
      setInput(fixture, 'src', '');
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('?');
    });

    it('returns "?" for null', () => {
      setInput(fixture, 'src', null);
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('?');
    });
  });

  describe('background color', () => {
    it('returns transparent for image URL', () => {
      setInput(fixture, 'src', 'https://x.com/a.png');
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(wrapper.style.backgroundColor).toBe('transparent');
    });

    it('returns neutral #bdc3c7 for empty src', () => {
      setInput(fixture, 'src', '');
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(wrapper.style.backgroundColor).toBe('rgb(189, 195, 199)');
    });

    it('returns deterministic color from name (same name → same color)', () => {
      setInput(fixture, 'src', 'Nguyễn Văn A');
      const colorA = queryByCss<HTMLDivElement>(fixture, '.sd-avatar').style.backgroundColor;

      const fixture2 = TestBed.createComponent(SdAvatar);
      fixture2.componentRef.setInput('src', 'Nguyễn Văn A');
      fixture2.detectChanges();
      const colorB = (fixture2.nativeElement.querySelector('.sd-avatar') as HTMLDivElement).style.backgroundColor;

      expect(colorA).toBe(colorB);
    });

    it('different names produce different color (statistically — sample one differing pair)', () => {
      setInput(fixture, 'src', 'Nguyễn Văn A');
      const colorA = queryByCss<HTMLDivElement>(fixture, '.sd-avatar').style.backgroundColor;

      setInput(fixture, 'src', 'Tran Thi Z');
      const colorZ = queryByCss<HTMLDivElement>(fixture, '.sd-avatar').style.backgroundColor;

      expect(colorA).not.toBe(colorZ);
    });
  });

  describe('size', () => {
    it('defaults to 32px width/height', () => {
      setInput(fixture, 'src', 'X');
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(wrapper.style.width).toBe('32px');
      expect(wrapper.style.height).toBe('32px');
    });

    it('uses custom size', () => {
      setInput(fixture, 'src', 'X');
      setInput(fixture, 'size', 64);
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(wrapper.style.width).toBe('64px');
    });

    it('sets initials font-size = size / 2.5', () => {
      setInput(fixture, 'src', 'AB');
      setInput(fixture, 'size', 50);
      const span = queryByCss<HTMLSpanElement>(fixture, 'span.sd-avatar-text');
      expect(span.style.fontSize).toBe('20px'); // 50 / 2.5
    });
  });

  describe('error handling', () => {
    it('handleError() switches isUrl to false and renders literal-text initials', () => {
      setInput(fixture, 'src', 'https://broken.example.com/a.png');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();

      const img = queryByCss<HTMLImageElement>(fixture, 'img');
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('img')).toBeNull();
      const span = queryByCss(fixture, 'span.sd-avatar-text');
      // "https://broken.example.com/a.png" no spaces → 1 word → 1 char initial "H"
      expect(span.textContent?.trim()).toBe('H');
    });

    it('resets error state when src changes (effect)', () => {
      setInput(fixture, 'src', 'https://broken.example.com/a.png');
      queryByCss<HTMLImageElement>(fixture, 'img').dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img')).toBeNull();

      setInput(fixture, 'src', 'https://newurl.com/b.png');
      expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    });
  });

  // ===========================================================================
  // Branch-coverage extensions (batch 4)
  // ===========================================================================
  describe('undefined src branch', () => {
    it('renders "?" initials for undefined src', () => {
      setInput(fixture, 'src', undefined);
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('?');
    });

    it('uses neutral #bdc3c7 background for undefined src', () => {
      setInput(fixture, 'src', undefined);
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(wrapper.style.backgroundColor).toBe('rgb(189, 195, 199)');
    });
  });

  describe('initials edge cases', () => {
    it('whitespace-only string → empty initials', () => {
      setInput(fixture, 'src', '   ');
      // why: words.length === 0 returns '' before fallback "?", so span shows empty.
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('');
    });

    it('trims surrounding spaces and uses first+last word initial', () => {
      setInput(fixture, 'src', '  Le  Van  Cuong  ');
      expect(queryByCss(fixture, 'span.sd-avatar-text').textContent?.trim()).toBe('LC');
    });
  });

  describe('handleError direct call', () => {
    it('calling handleError() manually sets isUrl to false even without DOM event', () => {
      setInput(fixture, 'src', 'https://x.com/a.png');
      expect(fixture.componentInstance.isUrl()).toBe(true);

      fixture.componentInstance.handleError();
      fixture.detectChanges();
      expect(fixture.componentInstance.isUrl()).toBe(false);
    });
  });
});
