import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocsVersionService } from '../../core/docs-version.service';
import { buildVersionRoute } from '../../core/docs-version.utils';
import {
  SHOWCASE_CHANGELOG_RELEASES,
  ShowcaseChangelogAngularMajor,
  ShowcaseChangelogRelease,
} from '../../generated/changelog.generated';
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
  const standard = STANDARD_RELEASE_SECTIONS.map((slot) => {
    const section = release.sections.find((candidate) =>
      candidate.key === slot.key || (slot.key === 'migration' && candidate.key.startsWith('migration')),
    );
    if (section) matched.add(section.key);
    return {
      key: slot.key,
      title: slot.title,
      anchor: section?.anchor ?? `${release.anchor}-${slot.key}`,
      markdown: section?.markdown ?? '',
    };
  });
  const custom = release.sections.filter((section) => !matched.has(section.key));
  return { ...release, displaySections: [...standard, ...custom] };
}

@Component({
  selector: 'docs-changelog',
  standalone: true,
  imports: [RouterLink, MarkdownRendererComponent],
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
          <p>Generated from the repository root <code>CHANGELOG.md</code>. Releases before suffix 1.2 are intentionally omitted.</p>
        </div>
        <a href="https://github.com/sdcorejs/sdcorejs-angular/blob/main/CHANGELOG.md" target="_blank" rel="noreferrer">View source</a>
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

      <div class="changelog__timeline">
        @for (release of filteredReleases(); track release.id) {
          <article class="release" [id]="release.anchor">
            <header>
              <div>
                <a [href]="'#' + release.anchor" [attr.aria-label]="'Link to ' + release.title">#</a>
                <h2>{{ release.title }}</h2>
                @if (release.date) { <time [attr.datetime]="release.date">{{ release.date }}</time> }
              </div>
              <div class="release__versions">
                @for (packageVersion of release.packageVersions; track packageVersion.angularMajor) {
                  <span
                    [class.current]="packageVersion.version === versions.selectedVersion()"
                    [attr.aria-current]="packageVersion.version === versions.selectedVersion() ? 'true' : null">
                    Angular {{ packageVersion.angularMajor }} · {{ packageVersion.version }}
                    @if (packageVersion.version === versions.selectedVersion()) {
                      <span class="docs-visually-hidden"> Current documentation version</span>
                    }
                  </span>
                }
              </div>
            </header>

            @if (release.summaryMarkdown) { <docs-markdown-renderer [markdown]="release.summaryMarkdown"></docs-markdown-renderer> }
            @for (section of release.displaySections; track section.anchor) {
              <section class="release__section" [id]="section.anchor">
                <h3>{{ section.title }}</h3>
                @if (section.markdown) {
                  <docs-markdown-renderer [markdown]="section.markdown"></docs-markdown-renderer>
                } @else {
                  <p class="release__empty">No entries in this category for this release.</p>
                }
              </section>
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
    const releases = filter === 'all' ? SHOWCASE_CHANGELOG_RELEASES : SHOWCASE_CHANGELOG_RELEASES.filter(
      (release) => release.unreleased || release.packageVersions.some((version) => version.angularMajor === filter),
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
