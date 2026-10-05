import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SHOWCASE_DEMO_SECTION_ID } from '../../../shared/demo-page.component';
import { SegmentedDemoComponent } from './segmented-demo.component';

// Available preview width inside 320px and 390px phone viewports (measured body width at 320px: 279px).
const PHONE_WIDTHS = [
  { viewport: 320, available: 279 },
  { viewport: 390, available: 349 },
];

describe('SegmentedDemoComponent', () => {
  async function renderTypes(available: number) {
    await TestBed.configureTestingModule({
      imports: [SegmentedDemoComponent],
      providers: [provideRouter([]), { provide: SHOWCASE_DEMO_SECTION_ID, useValue: 'example-types' }],
    }).compileComponents();
    const fixture = TestBed.createComponent(SegmentedDemoComponent);
    const host = fixture.nativeElement as HTMLElement;
    host.style.display = 'block';
    host.style.width = `${available}px`;
    fixture.detectChanges();
    await fixture.whenStable();
    const section = host.querySelector('#example-types') as HTMLElement;
    return { host, section };
  }

  for (const { viewport, available } of PHONE_WIDTHS) {
    it(`keeps the Types rows and segmented controls inside a ${viewport}px phone preview`, async () => {
      const { host, section } = await renderTypes(available);
      const bounds = host.getBoundingClientRect();
      const rows = Array.from(section.querySelectorAll<HTMLElement>('.choices-row'));
      const controls = Array.from(section.querySelectorAll<HTMLElement>('sd-segmented'));

      expect(rows).toHaveSize(2);
      expect(controls).toHaveSize(7);
      for (const element of [...rows, ...controls]) {
        const rect = element.getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(bounds.left - 0.5);
        expect(rect.right).toBeLessThanOrEqual(bounds.right + 0.5);
      }
    });
  }

  it('lets each Types track own its horizontal overflow at 320px', async () => {
    const { section } = await renderTypes(PHONE_WIDTHS[0].available);
    const tracks = Array.from(section.querySelectorAll<HTMLElement>('.choices-row')[0].querySelectorAll<HTMLElement>('.sd-segmented'));

    // Light, Fill and Outline share the three-choice model and must scroll inside their own track.
    expect(tracks).toHaveSize(3);
    for (const track of tracks) {
      expect(track.scrollWidth).toBeGreaterThan(track.clientWidth);
      track.scrollLeft = track.scrollWidth;
      expect(track.scrollLeft).toBeGreaterThan(0);
    }
  });
});
