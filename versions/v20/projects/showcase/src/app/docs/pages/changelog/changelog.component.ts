import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocsVersionService } from '../../core/docs-version.service';
import { buildVersionRoute } from '../../core/docs-version.utils';
import { SHOWCASE_CHANGELOG_RELEASES, ShowcaseChangelogAngularMajor, ShowcaseChangelogRelease } from '../../generated/changelog.generated';
import { DocsFragmentLinkDirective } from '../../shared/docs-fragment-link.directive';
import { MarkdownRendererComponent } from '../../shared/markdown-renderer.component';

type MajorFilter = 'all' | ShowcaseChangelogAngularMajor;

const STANDARD_RELEASE_SECTIONS = [
  { key: 'added', title: 'Added' },
  { key: 'changed', title: 'Changed' },
  { key: 'deprecated', title: 'Deprecated' },
  { key: 'removed', title: 'Removed' },
  { key: 'fixed', title: 'Fixed' },
  { key: 'security', title: 'Security' },
  { key: 'migration', title: 'Migration notes' },
] as const;

function addDisplaySections(release: ShowcaseChangelogRelease) {
  const matched = new Set<string>();
  const standard = STANDARD_RELEASE_SECTIONS.flatMap(slot => {
    const section = release.sections.find(
      candidate => candidate.key === slot.key || (slot.key === 'migration' && candidate.key.startsWith('migration'))
    );
    if (!section || !section.markdown.trim()) return [];
    matched.add(section.key);
    return [
      {
        key: slot.key,
        title: slot.title,
        anchor: section.anchor,
        markdown: section.markdown,
      },
    ];
  });
  const custom = release.sections.filter(section => !matched.has(section.key) && section.markdown.trim());
  const displaySections = [...standard, ...custom];
  return { ...release, displaySections, hasContent: !!release.summaryMarkdown.trim() || displaySections.length > 0 };
}

@Component({
  selector: 'docs-changelog',
  standalone: true,
  imports: [RouterLink, DocsFragmentLinkDirective, MarkdownRendererComponent],
  template: `
    <main class="changelog">
      <nav class="changelog__breadcrumb" aria-label="Breadcrumb"><a routerLink="/">Docs</a><span>/</span><span>Changelog</span></nav>
      @if (versions.invalidVersion(); as invalid) {
        <div class="changelog__notice" role="status">
          Version “{{ invalid }}” is unavailable. Showing v{{ versions.selectedVersion() }} instead.
        </div>
      }
      <header class="changelog__header">
        <div>
          <span>Release history</span>
          <h1>Changelog</h1>
          <p>Track fixes, improvements, and migration notes across the maintained Angular release lines.</p>
        </div>
        <a href="https://github.com/sdcorejs/sdcorejs-angular/blob/main/CHANGELOG.md" target="_blank" rel="noreferrer"
          >View full changelog</a
        >
      </header>

      <div class="changelog__filters" role="group" aria-label="Filter releases by Angular major">
        @for (filter of filters; track filter.value) {
          <button
            type="button"
            [class.active]="majorFilter() === filter.value"
            [attr.aria-pressed]="majorFilter() === filter.value"
            (click)="majorFilter.set(filter.value)">
            {{ filter.label }}
          </button>
        }
      </div>

      <nav class="changelog__release-nav" aria-label="Jump to a release">
        <strong>Jump to</strong>
        <div>
          @for (release of filteredReleases(); track release.id) {
            <a [docsFragmentLink]="release.anchor">{{ release.title }}</a>
          }
        </div>
      </nav>

      <div class="changelog__timeline">
        @for (release of filteredReleases(); track release.id) {
          <article class="release" [class.release--unreleased]="release.unreleased" [id]="release.anchor">
            <header>
              <div>
                <a [docsFragmentLink]="release.anchor" [attr.aria-label]="'Link to ' + release.title">#</a>
                <h2>{{ release.title }}</h2>
                @if (release.date) {
                  <time [attr.datetime]="release.date">{{ release.date }}</time>
                }
              </div>
              <div class="release__versions">
                @for (packageVersion of release.packageVersions; track packageVersion.angularMajor) {
                  <a
                    [routerLink]="['/v', packageVersion.version]"
                    [class.current]="packageVersion.version === versions.selectedVersion()"
                    [attr.aria-current]="packageVersion.version === versions.selectedVersion() ? 'page' : null">
                    Angular {{ packageVersion.angularMajor }} · {{ packageVersion.version }}
                    @if (packageVersion.version === versions.selectedVersion()) {
                      <span class="docs-visually-hidden"> Current documentation version</span>
                    }
                  </a>
                }
              </div>
            </header>

            @if (release.summaryMarkdown) {
              <docs-markdown-renderer [markdown]="release.summaryMarkdown" language="en"></docs-markdown-renderer>
            }
            @if (release.hasContent) {
              @for (section of release.displaySections; track section.anchor) {
                <section class="release__section" [id]="section.anchor">
                  <h3>{{ section.title }}</h3>
                  <docs-markdown-renderer [markdown]="section.markdown" language="en"></docs-markdown-renderer>
                </section>
              }
            } @else if (release.unreleased) {
              <p class="release__empty">No unreleased changes have been recorded.</p>
            }
          </article>
        }
      </div>
    </main>
  `,
  styleUrl: './changelog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangelogComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly routeParams = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  readonly versions = inject(DocsVersionService);
  readonly majorFilter = signal<MajorFilter>('all');
  readonly filters: readonly { value: MajorFilter; label: string }[] = [
    { value: 'all', label: 'All maintained lines' },
    { value: 21, label: 'Angular 21' },
    { value: 20, label: 'Angular 20' },
    { value: 19, label: 'Angular 19' },
  ];
  readonly filteredReleases = computed(() => {
    const filter = this.majorFilter();
    const releases =
      filter === 'all'
        ? SHOWCASE_CHANGELOG_RELEASES
        : SHOWCASE_CHANGELOG_RELEASES.filter(
            release => release.unreleased || release.packageVersions.some(version => version.angularMajor === filter)
          );
    return releases.map(addDisplaySections);
  });

  constructor() {
    effect(() => {
      void this.#resolveRouteVersion(this.routeParams().get('version'));
    });
  }

  async #resolveRouteVersion(requested: string | null): Promise<void> {
    if (!requested) return;
    try {
      const resolved = await this.versions.resolve(requested);
      if (requested !== resolved) {
        await this.#router.navigateByUrl(buildVersionRoute(this.#router.url, resolved), { replaceUrl: true });
      }
    } catch {
      // The generated changelog remains useful while the shared version selector exposes retry state.
    }
  }
}
