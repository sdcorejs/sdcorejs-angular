import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GettingStartedComponent } from './getting-started.component';

describe('GettingStartedComponent', () => {
  let fixture: ComponentFixture<GettingStartedComponent>;
  beforeEach(async () => {
    const paramMap = convertToParamMap({ version: '21.1.2' });
    await TestBed.configureTestingModule({
      imports: [GettingStartedComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap }, paramMap: of(paramMap) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(GettingStartedComponent);
    fixture.detectChanges();
  });

  it('provides a concise four-step setup path for the resolved Angular major', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Get started');
    expect(element.querySelectorAll('.setup-step')).toHaveSize(4);
    expect(element.textContent).toContain('npm install @sdcorejs/angular@^21 @angular/material@^21 @angular/material-date-fns-adapter@^21');
    expect(element.textContent).toContain("@use '@sdcorejs/angular/assets/scss/sd-core.scss'");
    expect(element.textContent).toContain('Material+Symbols+Outlined');
    expect(element.textContent).toContain("import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'");
  });

  it('links all seven catalog categories within the selected version', () => {
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.category-link')];

    expect(links).toHaveSize(7);
    expect(links.every(link => link.getAttribute('href')?.startsWith('/v/21.1.2/'))).toBeTrue();
  });
});
