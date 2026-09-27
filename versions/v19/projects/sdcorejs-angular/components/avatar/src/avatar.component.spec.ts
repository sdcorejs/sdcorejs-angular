import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdAvatar } from './avatar.component';
import { queryByCss, setInput } from '../../../testing/test-utils';

/** WCAG relative luminance of any CSS colour the canvas understands (computed styles included). */
function luminance(color: string): number {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const rgb = Array.from(context.getImageData(0, 0, 1, 1).data)
    .slice(0, 3)
    .map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

// 2.15 name palette in hash order: each colour is now the fallback of `--sd-avatar-color-{n}`.
const PALETTE_215 = [
  '#1abc9c',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#34495e',
  '#16a085',
  '#27ae60',
  '#2980b9',
  '#8e44ad',
  '#2c3e50',
  '#f1c40f',
  '#e67e22',
  '#e74c3c',
  '#95a5a6',
  '#f39c12',
  '#d35400',
  '#c0392b',
  '#bdc3c7',
  '#7f8c8d',
];
const NAMES = ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Minh Hoàng', 'Phạm Quỳnh Anh', ...Array.from({ length: 40 }, (_, i) => 'Person ' + i)];

function paletteIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % PALETTE_215.length;
}

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

    it('returns a neutral light background for empty src', () => {
      setInput(fixture, 'src', '');
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(fixture.componentInstance.baseColor()).toBe('var(--sd-avatar-neutral, #bdc3c7)');
      expect(wrapper.style.backgroundColor).toContain('color-mix');
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

  it('renders readable dark initials on light backgrounds for the existing name palette', () => {
    for (const name of [...NAMES, '']) {
      setInput(fixture, 'src', name);
      const style = getComputedStyle(queryByCss(fixture, '.sd-avatar'));
      const background = luminance(style.backgroundColor);
      const foreground = luminance(style.color);
      expect(background).withContext(name).toBeGreaterThan(0.7);
      expect((background + 0.05) / (foreground + 0.05))
        .withContext(name)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  describe('theme tokens', () => {
    it('maps each name to its 2.15 palette slot as var(--sd-avatar-color-{n}, <2.15 hex>)', () => {
      for (const name of NAMES) {
        setInput(fixture, 'src', name);
        const index = paletteIndex(name);
        expect(fixture.componentInstance.baseColor())
          .withContext(name)
          .toBe(`var(--sd-avatar-color-${index + 1}, ${PALETTE_215[index]})`);
      }
    });

    it('mixes the palette colour with the avatar tint and ink tokens', () => {
      setInput(fixture, 'src', 'Nguyễn Văn An');
      const base = fixture.componentInstance.baseColor();
      expect(fixture.componentInstance.bgColor()).toBe(`color-mix(in srgb, ${base} 14%, var(--sd-avatar-tint, #ffffff))`);
      expect(fixture.componentInstance.textColor()).toBe(`color-mix(in srgb, ${base} 45%, var(--sd-avatar-ink, #000000))`);
    });

    it('renders exactly the 2.15 colours when no theme defines the avatar tokens', () => {
      const probe = document.createElement('div');
      document.body.appendChild(probe);
      try {
        for (const name of [...NAMES, '']) {
          setInput(fixture, 'src', name);
          const hex = name ? PALETTE_215[paletteIndex(name)] : '#bdc3c7';
          probe.style.backgroundColor = `color-mix(in srgb, ${hex} 14%, white)`;
          probe.style.color = `color-mix(in srgb, ${hex} 45%, black)`;
          const actual = getComputedStyle(queryByCss(fixture, '.sd-avatar'));
          const expected = getComputedStyle(probe);
          expect(actual.backgroundColor).withContext(name).toBe(expected.backgroundColor);
          expect(actual.color).withContext(name).toBe(expected.color);
        }
      } finally {
        probe.remove();
      }
    });

    it('keeps the initials readable with the dark tint and ink of the default theme', () => {
      const host = fixture.nativeElement as HTMLElement;
      host.style.setProperty('--sd-avatar-tint', '#2b2d33');
      host.style.setProperty('--sd-avatar-ink', '#ffffff');
      for (const name of [...NAMES, '']) {
        setInput(fixture, 'src', name);
        const style = getComputedStyle(queryByCss(fixture, '.sd-avatar'));
        const background = luminance(style.backgroundColor);
        const foreground = luminance(style.color);
        expect(background).withContext(name).toBeLessThan(0.1);
        expect((foreground + 0.05) / (background + 0.05))
          .withContext(name)
          .toBeGreaterThanOrEqual(4.5);
      }
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

    it('uses neutral light background for undefined src', () => {
      setInput(fixture, 'src', undefined);
      const wrapper = queryByCss<HTMLDivElement>(fixture, '.sd-avatar');
      expect(fixture.componentInstance.baseColor()).toBe('var(--sd-avatar-neutral, #bdc3c7)');
      expect(wrapper.style.backgroundColor).toContain('color-mix');
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
