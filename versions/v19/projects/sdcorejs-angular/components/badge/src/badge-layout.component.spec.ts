import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdBadge } from './badge.component';

describe('Icon badge sizing and alignment', () => {
  for (const [size, pixels] of [
    ['sm', 16],
    ['md', 18],
    ['lg', 24],
  ] as const) {
    for (const description of ['', 'Additional detail']) {
      it('keeps ' + size + ' icon centered and uncompressed in narrow multiline content ' + description, () => {
        TestBed.configureTestingModule({ imports: [SdBadge, NoopAnimationsModule] });
        const fixture = TestBed.createComponent(SdBadge);
        fixture.componentRef.setInput('type', 'icon');
        fixture.componentRef.setInput('size', size);
        fixture.componentRef.setInput('icon', 'check_circle');
        fixture.componentRef.setInput('title', 'A long status that must wrap');
        fixture.componentRef.setInput('description', description);
        fixture.nativeElement.style.cssText = 'display:block;width:120px';
        fixture.detectChanges();
        const icon = fixture.nativeElement.querySelector('.c-material-icon') as HTMLElement;
        const copy = fixture.nativeElement.querySelector('.c-badge-title').parentElement as HTMLElement;
        const row = fixture.nativeElement.querySelector('.c-badge-icon') as HTMLElement;
        const i = icon.getBoundingClientRect();
        const t = copy.getBoundingClientRect();
        expect(i.width).toBe(pixels);
        expect(i.height).toBe(pixels);
        expect(Math.abs(i.top + i.height / 2 - t.top - t.height / 2)).toBeLessThanOrEqual(1);
        expect(row.scrollWidth).toBeLessThanOrEqual(120);
        fixture.destroy();
      });
    }
  }
});
