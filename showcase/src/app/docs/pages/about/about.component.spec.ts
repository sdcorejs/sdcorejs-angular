import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let fixture: ComponentFixture<AboutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
  });

  it('presents the library and compatibility instead of an unconfigured author profile', () => {
    const text = fixture.nativeElement.textContent;

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('@sdcorejs/angular');
    const logo = fixture.nativeElement.querySelector('.about__mark') as HTMLImageElement | null;
    expect(logo?.getAttribute('src')).toBe('assets/brand/sdcorejs-logo.png');
    expect(text).toContain('Angular 19, 20, 21, and 22');
    expect(text).not.toContain('has not been configured');
    expect(text).not.toContain('source-of-truth');
    expect(text).not.toContain('sync workflow');
  });

  it('links users to contribution, package, license, and support destinations', () => {
    const hrefs = [...fixture.nativeElement.querySelectorAll('a')].map((link: HTMLAnchorElement) => link.href);

    expect(hrefs.some(href => href.endsWith('/issues'))).toBeTrue();
    expect(hrefs.some(href => href.endsWith('/pulls'))).toBeTrue();
    expect(hrefs.some(href => href.includes('npmjs.com/package/@sdcorejs/angular'))).toBeTrue();
    expect(hrefs.some(href => href.endsWith('/blob/main/LICENSE'))).toBeTrue();
    expect(hrefs.some(href => href.endsWith('/v/latest/changelog'))).toBeTrue();
  });
});
