import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { DocsVersionService } from '../../core/docs-version.service';
import { ChangelogComponent } from './changelog.component';

describe('ChangelogComponent', () => {
  let fixture: ComponentFixture<ChangelogComponent>;
  let versions: {
    selectedVersion: ReturnType<typeof signal<string | null>>;
    invalidVersion: ReturnType<typeof signal<string | null>>;
    resolve: jasmine.Spy;
  };
  let router: Router;

  beforeEach(async () => {
    const paramMap = convertToParamMap({ version: '99.0.0' });
    versions = {
      selectedVersion: signal<string | null>(null),
      invalidVersion: signal<string | null>('99.0.0'),
      resolve: jasmine.createSpy().and.resolveTo('21.1.2'),
    };
    await TestBed.configureTestingModule({
      imports: [ChangelogComponent],
      providers: [
        provideRouter([]),
        { provide: DocsVersionService, useValue: versions },
        { provide: ActivatedRoute, useValue: { paramMap: of(paramMap), snapshot: { paramMap } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/v/99.0.0/changelog?major=21#release');
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(ChangelogComponent);
    fixture.detectChanges();
  });

  it('resolves and canonicalizes the version from a direct changelog route', async () => {
    await fixture.whenStable();

    expect(versions.resolve).toHaveBeenCalledWith('99.0.0');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/v/21.1.2/changelog?major=21#release', { replaceUrl: true });
  });

  it('renders every standard changelog category with explicit empty states', () => {
    const headings = [...fixture.nativeElement.querySelectorAll('.release__section h3')]
      .map((heading: HTMLElement) => heading.textContent?.trim());

    for (const expected of ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security', 'Migration notes']) {
      expect(headings).toContain(expected);
    }
    expect(fixture.nativeElement.querySelectorAll('.release__empty').length).toBeGreaterThan(0);
  });
});
