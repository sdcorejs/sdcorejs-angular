import { countTextLength, imageClassesToInlineStyles, imageInlineStylesToClasses } from './style.utils';

describe('editor image style utilities', () => {
  it('counts visible text while excluding image and figure content', () => {
    expect(countTextLength('')).toBe(0);
    expect(countTextLength('<p>Hello <strong>world</strong></p><img alt="ignored"><figure>caption</figure>')).toBe(11);
  });

  it('converts float alignment to classes and preserves unrelated styles', () => {
    const html = imageInlineStylesToClasses(
      '<figure class="image old" style="float:left;width:240px;max-width:100%;color:red"><img style="width:100%;height:auto;border:0"></figure>'
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const figure = doc.querySelector('figure')!;
    const image = doc.querySelector('img')!;

    expect(figure.classList).toContain('image-style-align-left');
    expect(figure.getAttribute('style')).toContain('width:240px');
    expect(figure.getAttribute('style')).toContain('color:red');
    expect(figure.getAttribute('style')).not.toContain('float');
    expect(image.getAttribute('style')).toBe('border:0');
  });

  it('maps right and block margins to the matching alignment classes', () => {
    const html = imageInlineStylesToClasses(`
      <figure class="image image-style-align-left" style="float:right"></figure>
      <figure class="image" style="margin:0 auto 0 0;width:50%"></figure>
      <figure class="image" style="margin:0 auto 0 0;width:fit-content"></figure>
      <figure class="image" style="margin:0 0 0 auto;width:40%"></figure>
      <figure class="image" style="margin:0 0 0 auto;width:fit-content"></figure>
    `);
    const figures = new DOMParser().parseFromString(html, 'text/html').querySelectorAll('figure');

    expect(figures[0].classList).toContain('image-style-align-right');
    expect(figures[1].classList).toContain('image-style-align-left');
    expect(figures[2].classList).toContain('image-style-block-align-left');
    expect(figures[3].classList).toContain('image-style-align-right');
    expect(figures[4].classList).toContain('image-style-block-align-right');
  });

  it('leaves empty input and non-image markup unchanged', () => {
    expect(imageInlineStylesToClasses('')).toBe('');
    expect(imageClassesToInlineStyles('')).toBe('');
    expect(imageInlineStylesToClasses('<p>Text</p>')).toBe('<p>Text</p>');
  });

  it('converts inline alignment classes to float styles', () => {
    const html = imageClassesToInlineStyles(`
      <figure class="image image-style-align-left"><img></figure>
      <figure class="image image-style-align-right"><img></figure>
      <figure class="image image-style-block-align-left"><img></figure>
      <figure class="image image-style-block-align-right"><img></figure>
      <figure class="image"><img></figure>
    `);
    const figures = new DOMParser().parseFromString(html, 'text/html').querySelectorAll('figure');

    expect(figures[0].getAttribute('style')).toContain('float:left');
    expect(figures[1].getAttribute('style')).toContain('float:right');
    expect(figures[2].getAttribute('style')).toContain('margin:0 auto 0 0');
    expect(figures[3].getAttribute('style')).toContain('margin:0 0 0 auto');
    expect(figures[4].getAttribute('style')).toContain('margin:0 auto');
    figures.forEach(figure => {
      expect(figure.getAttribute('style')).toContain('display:block');
      expect(figure.getAttribute('style')).toContain('width:fit-content');
    });
  });

  it('keeps resized images fluid inside left and right aligned figures', () => {
    const html = imageClassesToInlineStyles(`
      <figure class="image image-style-align-left" style="width:100%;float:left"><img style="border:0"></figure>
      <figure class="image image-style-align-right" style="width:100%;float:right"><img></figure>
    `);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const figures = doc.querySelectorAll('figure');
    const images = doc.querySelectorAll('img');

    expect(figures[0].getAttribute('style')).toContain('margin:0 auto 0 0');
    expect(figures[0].getAttribute('style')).not.toContain('float');
    expect(figures[1].getAttribute('style')).toContain('margin:0 0 0 auto');
    expect(images[0].getAttribute('style')).toContain('width:100%');
    expect(images[0].getAttribute('style')).toContain('height:auto');
    expect(images[1].getAttribute('style')).toContain('width:100%');
  });
});
