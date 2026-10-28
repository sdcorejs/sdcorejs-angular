import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocsI18nService } from '../../core/docs-i18n.service';
import { DOCS_BASE_URL } from '../../core/docs.tokens';
import { DocsVersionService } from '../../core/docs-version.service';
import { buildVersionRoute } from '../../core/docs-version.utils';
import { DOC_PAGES } from '../../core/documentation.registry';
import { SHOWCASE_CHANGELOG_RELEASES, ShowcaseChangelogRelease } from '../../generated/changelog.generated';
import { MarkdownRendererComponent } from '../../shared/markdown-renderer.component';
import { ChangeType, changelogGroups, compareUrl, releaseRail } from './changelog-view';

const RELEASES: readonly ShowcaseChangelogRelease[] = SHOWCASE_CHANGELOG_RELEASES;
const PAGES_BY_ID = new Map(DOC_PAGES.map(page => [page.id, page]));

/** Changelog: release rail, release card with package chips, sticky type filters and entries with migrations. */
@Component({
  selector: 'docs-changelog',
  standalone: true,
  imports: [RouterLink, MarkdownRendererComponent],
  templateUrl: './changelog.component.html',
  styleUrl: './changelog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangelogComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #docsBase = inject(DOCS_BASE_URL);
  readonly routeParams = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  readonly versions = inject(DocsVersionService);
  readonly i18n = inject(DocsI18nService);

  readonly rail = releaseRail(RELEASES);
  /** The latest published release; the generated notes can lag one release behind it. */
  readonly latestSuffix = computed(() => this.versions.latestRelease());
  /** Release shown on the page; it starts at the selected docs release and does not change the global version. */
  readonly #chosen = signal<string | null>(null);
  readonly selectedSuffix = computed(() => {
    const chosen = this.#chosen();
    if (chosen) return chosen;
    const current = this.versions.selectedRelease();
    return current && RELEASES.some(release => release.suffix === current) ? current : (this.rail[0]?.releases[0]?.suffix ?? null);
  });
  readonly release = computed(() => RELEASES.find(release => release.suffix === this.selectedSuffix()) ?? null);
  readonly typeFilter = signal<ChangeType | 'all'>('all');
  readonly groups = computed(() => {
    const release = this.release();
    return release ? changelogGroups(release, DOC_PAGES) : [];
  });
  readonly filters = computed(() => {
    const groups = this.groups();
    return [
      { type: 'all' as const, count: groups.reduce((total, group) => total + group.entries.length, 0) },
      ...groups.map(group => ({ type: group.type, count: group.entries.length })),
    ];
  });
  readonly visibleGroups = computed(() => {
    const filter = this.typeFilter();
    return this.groups().filter(group => filter === 'all' || group.type === filter);
  });
  readonly compare = computed(() => {
    const release = this.release();
    return release ? compareUrl(release, RELEASES) : null;
  });

  constructor() {
    effect(() => {
      void this.#resolveRouteVersion(this.routeParams().get('version'));
    });
  }

  selectRelease(suffix: string): void {
    this.#chosen.set(suffix);
    this.typeFilter.set('all');
  }

  typeLabel(type: ChangeType | 'all'): string {
    const t = this.i18n.t();
    return type === 'all' ? t.filterAll : t.changeTypes[type];
  }

  pageLink(pageId: string | null): string[] | null {
    const page = pageId ? PAGES_BY_ID.get(pageId) : undefined;
    const version = this.versions.resolvedPackageVersion() || 'latest';
    return page ? ['/v', version, page.category, page.slug, 'overview'] : null;
  }

  notesUrl(packageVersion: string): string {
    return new URL(`${encodeURIComponent(packageVersion)}/CHANGELOG.md`, this.#docsBase).toString();
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
