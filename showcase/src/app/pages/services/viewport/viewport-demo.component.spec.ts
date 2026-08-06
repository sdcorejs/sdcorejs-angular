import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { ViewportDemoComponent } from './viewport-demo.component';

describe('ViewportDemoComponent', () => {
  let fixture: ComponentFixture<ViewportDemoComponent>;
  const width = signal(900);
  const height = signal(700);
  const currentBreakpoint = signal<'mobile' | 'tablet' | 'desktop'>('tablet');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewportDemoComponent],
      providers: [
        {
          provide: SdViewportService,
          useValue: {
            width,
            height,
            currentBreakpoint,
            isMobile: signal(false),
            isTablet: signal(true),
            isDesktop: signal(false),
            breakpoints: { mobile: 0, tablet: 768, desktop: 1024 },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewportDemoComponent);
    fixture.detectChanges();
  });

  it('renders the live dimensions, current breakpoint and default configuration', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-viewport-size]')?.textContent).toContain('900 × 700');
    expect(element.querySelector('[data-current-breakpoint]')?.textContent).toContain('tablet');
    expect(element.textContent).toContain('mobile: 0');
    expect(element.textContent).toContain('tablet: 768');
    expect(element.textContent).toContain('desktop: 1024');
  });
});
