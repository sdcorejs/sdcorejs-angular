import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { SdFormGenericStatic } from '../../models/form-generic-element.model';
import { LibStaticElementComponent } from './static-element.component';

describe('LibStaticElementComponent', () => {
  let fixture: ComponentFixture<LibStaticElementComponent>;
  const root = () => fixture.nativeElement as HTMLElement;

  const render = (element: Record<string, unknown>) => {
    localStorage.setItem('sd-core.language', 'vi');
    TestBed.configureTestingModule({ imports: [LibStaticElementComponent, NoopAnimationsModule] });
    fixture = TestBed.createComponent(LibStaticElementComponent);
    fixture.componentRef.setInput('element', element as unknown as SdFormGenericStatic);
    fixture.detectChanges();
    return root();
  };

  it('renders a heading as h2, h3 or h4 by level, with level 3 by default and for an invalid level', () => {
    expect(render({ id: 'h', type: 'heading', text: 'Personal data', level: 2 }).querySelector('h2')?.textContent?.trim()).toBe(
      'Personal data'
    );
    TestBed.resetTestingModule();
    expect(render({ id: 'h', type: 'heading', text: 'Default' }).querySelector('h3')?.textContent?.trim()).toBe('Default');
    TestBed.resetTestingModule();
    expect(render({ id: 'h', type: 'heading', text: 'Small', level: 4 }).querySelector('h4')).not.toBeNull();
    TestBed.resetTestingModule();
    expect(render({ id: 'h', type: 'heading', text: 'Wrong', level: 7 }).querySelector('h3')).not.toBeNull();
  });

  it('shows text as text: HTML stays literal and line breaks are kept', () => {
    const host = render({ id: 'p', type: 'paragraph', text: '<b>bold</b> <img src=x onerror=alert(1)>\nsecond line' });
    const paragraph = host.querySelector('p')!;
    expect(paragraph.textContent).toBe('<b>bold</b> <img src=x onerror=alert(1)>\nsecond line');
    expect(paragraph.querySelector('b, img')).toBeNull();
    expect(getComputedStyle(paragraph).whiteSpace).toBe('pre-line');
  });

  it('renders a quote with its cite', () => {
    const host = render({ id: 'q', type: 'quote', text: 'Measure twice', cite: 'Proverb' });
    expect(host.querySelector('blockquote p')?.textContent?.trim()).toBe('Measure twice');
    expect(host.querySelector('blockquote cite')?.textContent?.trim()).toBe('Proverb');
    TestBed.resetTestingModule();
    expect(render({ id: 'q', type: 'quote', text: 'No cite' }).querySelector('cite')).toBeNull();
  });

  it('renders an image with alt, width and caption, and nothing for a refused or empty src', () => {
    const host = render({ id: 'i', type: 'image', src: 'https://cdn.example.com/logo.png', alt: 'Logo', width: 120, caption: 'Our logo' });
    const image = host.querySelector('img')!;
    expect(image.getAttribute('src')).toBe('https://cdn.example.com/logo.png');
    expect(image.getAttribute('alt')).toBe('Logo');
    expect(image.style.width).toBe('120px');
    expect(host.querySelector('figcaption')?.textContent?.trim()).toBe('Our logo');
    for (const src of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'https://u:p@cdn.example.com/a.png', '']) {
      TestBed.resetTestingModule();
      expect(render({ id: 'i', type: 'image', src, alt: 'X' }).querySelector('img'))
        .withContext(src)
        .toBeNull();
    }
  });

  it('keeps an empty alt for a decorative image', () => {
    const image = render({ id: 'i', type: 'image', src: '/assets/line.png', alt: '' }).querySelector('img')!;
    expect(image.hasAttribute('alt')).toBeTrue();
    expect(image.getAttribute('alt')).toBe('');
  });

  it('renders a safe link, opens a new tab with noopener noreferrer, and shows only the text for a refused URL', () => {
    let link = render({ id: 'l', type: 'link', text: 'Policy', href: 'https://example.com/policy' }).querySelector('a')!;
    expect(link.getAttribute('href')).toBe('https://example.com/policy');
    expect(link.hasAttribute('target')).toBeFalse();
    TestBed.resetTestingModule();
    link = render({ id: 'l', type: 'link', text: 'Policy', href: '/policy', newTab: true }).querySelector('a')!;
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    for (const href of ['javascript:alert(1)', '//evil.tld/x', 'data:text/html,x', '']) {
      TestBed.resetTestingModule();
      const host = render({ id: 'l', type: 'link', text: 'Policy', href, newTab: true });
      expect(host.querySelector('a')).withContext(href).toBeNull();
      expect(host.textContent?.trim()).withContext(href).toBe('Policy');
    }
  });

  it('renders a divider', () => {
    expect(render({ id: 'd', type: 'divider' }).querySelector('hr')).not.toBeNull();
  });

  it('renders a notice through sd-inform with an explicit color (info by default), title and text', () => {
    let host = render({ id: 'n', type: 'notice', text: 'Check\nyour data', title: 'Note', color: 'warning' });
    const inform = host.querySelector('sd-inform')!;
    expect(inform.textContent).toContain('Note');
    expect(inform.textContent).toContain('Check');
    expect(host.querySelector('.c-inform.c-warning')).not.toBeNull();
    expect(getComputedStyle(host.querySelector('.sd-fg-notice')!).whiteSpace).toBe('pre-line');
    TestBed.resetTestingModule();
    // why: sd-inform defaults to primary; a notice without a color must still be info.
    host = render({ id: 'n', type: 'notice', text: 'Plain' });
    expect(host.querySelector('.c-inform.c-info')).not.toBeNull();
    expect(host.querySelector('.c-inform.c-primary')).toBeNull();
    TestBed.resetTestingModule();
    host = render({ id: 'n', type: 'notice', text: 'Odd', color: 'black' });
    expect(host.querySelector('.c-inform.c-info')).not.toBeNull();
  });
});
