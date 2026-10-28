import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { DocsVersionService } from '../../core/docs-version.service';
import { SHOWCASE_CHANGELOG_RELEASES, ShowcaseChangelogRelease } from '../../generated/changelog.generated';
import { ChangelogComponent } from './changelog.component';

describe('ChangelogComponent', () => {
  let fixture: ComponentFixture<ChangelogComponent>;
  let versions: {
    selectedVersion: ReturnType<typeof signal<string | null>>;
    invalidVersion: ReturnType<typeof signal<string | null>>;
    selectedRelease: ReturnType<typeof signal<string>>;
    latestRelease: ReturnType<typeof signal<string>>;
    resolvedPackageVersion: ReturnType<typeof signal<string>>;
    resolve: jasmine.Spy;
  };
  let router: Router;
  const releases: readonly ShowcaseChangelogRelease[] = SHOWCASE_CHANGELOG_RELEASES;
  const released = releases.filter(release => !release.unreleased && release.suffix);

  beforeEach(async () => {
    const paramMap = convertToParamMap({ version: '99.0.0' });
    versions = {
      selectedVersion: signal<string | null>(null),
      invalidVersion: signal<string | null>('99.0.0'),
      selectedRelease: signal('2.5'),
      latestRelease: signal('2.5'),
      resolvedPackageVersion: signal('22.2.5'),
      resolve: jasmine.createSpy().and.resolveTo('22.2.5'),
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
    spyOnProperty(router, 'url', 'get').and.returnValue('/v/99.0.0/changelog?major=22#release');
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(ChangelogComponent);
    fixture.detectChanges();
  });

  it('resolves and canonicalizes the version from a direct changelog route', async () => {
    await fixture.whenStable();

    expect(versions.resolve).toHaveBeenCalledWith('99.0.0');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/v/22.2.5/changelog?major=22#release', { replaceUrl: true });
  });

  it('lists every released version on the rail and opens the selected docs release', () => {
    const rail = [...fixture.nativeElement.querySelectorAll('.release-rail button')] as HTMLButtonElement[];

    expect(rail.length).toBe(released.length);
    expect(fixture.nativeElement.querySelector('.release-card h2')?.textContent?.trim()).toBe('2.5');
    expect(rail.find(button => button.classList.contains('active'))?.textContent).toContain('2.5');
  });

  it('shows the package versions of a release and only the Angular majors it published', () => {
    const packages = [...fixture.nativeElement.querySelectorAll('.release-card__packages a')].map((link: HTMLAnchorElement) =>
      link.textContent?.trim()
    );
    const inception = releases.find(release => release.suffix === '2.5');

    expect(packages).toEqual(inception!.packageVersions.map(version => `Angular ${version.angularMajor} · ${version.version}`));
    expect((fixture.nativeElement.querySelector('.release-card__packages a') as HTMLAnchorElement).href).toContain('/CHANGELOG.md');
  });

  it('switches release locally and filters entries by change type', () => {
    const rail = [...fixture.nativeElement.querySelectorAll('.release-rail button')] as HTMLButtonElement[];
    rail[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.release-card h2')?.textContent?.trim()).toBe(released.map(release => release.suffix)[0]);

    const filters = [...fixture.nativeElement.querySelectorAll('.change-filters button')] as HTMLButtonElement[];
    expect(filters[0].textContent).toContain('All');
    const second = filters[1];
    const type = second.getAttribute('data-type');
    second.click();
    fixture.detectChanges();

    const groups = [...fixture.nativeElement.querySelectorAll('.change-group')] as HTMLElement[];
    expect(groups.length).toBe(1);
    expect(groups[0].getAttribute('data-type')).toBe(type);
  });
});
