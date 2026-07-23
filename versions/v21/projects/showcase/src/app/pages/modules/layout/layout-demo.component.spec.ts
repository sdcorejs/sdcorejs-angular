import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LayoutDemoComponent } from './layout-demo.component';

describe('LayoutDemoComponent', () => {
  let fixture: ComponentFixture<LayoutDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutDemoComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutDemoComponent);
    fixture.detectChanges();
  });

  it('switches the live preview between sidebar V1, V2 and V3', () => {
    const element = fixture.nativeElement as HTMLElement;
    for (const version of [1, 2, 3]) {
      const selector = element.querySelector<HTMLButtonElement>(`[data-layout-version="${version}"]`);
      expect(selector).withContext(`version selector ${version}`).not.toBeNull();

      selector?.click();
      fixture.detectChanges();

      expect(element.querySelector(`[data-active-layout-version="${version}"]`)).not.toBeNull();
    }
  });

  it('switches the preview fixture between desktop and mobile widths', () => {
    const element = fixture.nativeElement as HTMLElement;
    const desktopSelector = element.querySelector<HTMLButtonElement>('[data-layout-viewport="desktop"]');
    const mobileSelector = element.querySelector<HTMLButtonElement>('[data-layout-viewport="mobile"]');

    expect(desktopSelector).not.toBeNull();
    expect(mobileSelector).not.toBeNull();

    mobileSelector?.click();
    fixture.detectChanges();
    expect(element.querySelector('[data-active-layout-viewport="mobile"]')).not.toBeNull();

    desktopSelector?.click();
    fixture.detectChanges();
    expect(element.querySelector('[data-active-layout-viewport="desktop"]')).not.toBeNull();
  });

  it('renders all six desktop and mobile sidebar variants without runtime errors', () => {
    const element = fixture.nativeElement as HTMLElement;
    const variants = [
      [1, 'desktop', 'sidebar-v1'],
      [1, 'mobile', 'sidebar-mobile-v1'],
      [2, 'desktop', 'sidebar-v2'],
      [2, 'mobile', 'sidebar-mobile-v2'],
      [3, 'desktop', 'sidebar-v3'],
      [3, 'mobile', 'sidebar-mobile-v3'],
    ] as const;

    for (const [version, viewport, expectedSelector] of variants) {
      expect(() => {
        element.querySelector<HTMLButtonElement>(`[data-layout-version="${version}"]`)?.click();
        element.querySelector<HTMLButtonElement>(`[data-layout-viewport="${viewport}"]`)?.click();
        fixture.detectChanges();
      })
        .withContext(`sidebar V${version} ${viewport}`)
        .not.toThrow();
      expect(element.querySelector(expectedSelector)).withContext(`sidebar V${version} ${viewport}`).not.toBeNull();
    }
  });
});
