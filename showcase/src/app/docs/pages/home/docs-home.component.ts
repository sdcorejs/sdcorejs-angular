import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocsClipboardService } from '../../core/docs-clipboard.service';
import { DocsI18nService } from '../../core/docs-i18n.service';
import { changelogEntriesForPage } from '../../core/docs-release-badges';
import { DocsReleaseNotesService } from '../../core/docs-release-notes.service';
import { packageVersionFor } from '../../core/docs-release.utils';
import { DocsVersionService } from '../../core/docs-version.service';
import { buildVersionRoute } from '../../core/docs-version.utils';
import { DOC_NAV_GROUPS, DOC_PAGES } from '../../core/documentation.registry';
import { DOCS_ANGULAR_MAJORS } from '../../shared/docs-version-control.component';

/** How many New/Updated pages the home page lists. */
const HOME_NEW_LIMIT = 6;

/** Plain first sentence of a changelog entry, capitalised, for the short "New & updated" list. */
export function firstSentence(markdown: string): string {
  const text = markdown.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\s+/g, ' ').trim();
  const sentence = /^(.+?[.;])(\s|$)/.exec(text)?.[1]?.replace(/;$/, '.') ?? text;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

export function installCommandFor(angularMajor: number): string {
  return `npm install @sdcorejs/angular@^${angularMajor} @angular/material@^${angularMajor} @angular/material-date-fns-adapter@^${angularMajor}`;
}

/** Docs home: release pill, hero, install box per Angular major, categories, what is new and compatibility. */
@Component({
  selector: 'docs-home',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './docs-home.component.html',
  styleUrl: './docs-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsHomeComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #releaseNotes = inject(DocsReleaseNotesService);
  readonly versions = inject(DocsVersionService);
  readonly i18n = inject(DocsI18nService);
  readonly clipboard = inject(DocsClipboardService);
  readonly params = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });

  readonly version = computed(() => this.versions.resolvedPackageVersion() || this.params().get('version') || 'latest');
  readonly angularMajor = computed(() => this.versions.selectedAngularMajor() ?? DOCS_ANGULAR_MAJORS[0]);
  readonly installCommand = computed(() => installCommandFor(this.angularMajor()));
  readonly latestRelease = computed(() => this.versions.releaseCatalog().find(release => release.latest) ?? null);
  readonly majors = computed(() => {
    const release = this.versions.currentRelease();
    return DOCS_ANGULAR_MAJORS.map(major => ({ major, published: !release || release.majors.includes(major) }));
  });
  readonly categories = computed(() => {
    const t = this.i18n.t();
    return DOC_NAV_GROUPS.map(group => ({
      category: group.category,
      icon: group.icon,
      title: t.categories[group.category],
      description: t.categoryDescriptions[group.category],
      count: group.pages.length,
      commands: ['/v', this.version(), group.category],
    }));
  });
  readonly whatsNew = computed(() => {
    const badges = this.#releaseNotes.badges();
    const release = this.#releaseNotes.currentRelease();
    return DOC_PAGES.filter(page => badges.has(page.id))
      .sort((left, right) => (badges.get(left.id) === badges.get(right.id) ? 0 : badges.get(left.id) === 'new' ? -1 : 1))
      .slice(0, HOME_NEW_LIMIT)
      .map(page => ({
        id: page.id,
        title: page.title,
        badge: badges.get(page.id)!,
        text: firstSentence(changelogEntriesForPage(release, page, DOC_PAGES)[0] ?? page.description),
        commands: ['/v', this.version(), page.category, page.slug, 'overview'],
      }));
  });
  readonly compatibility = computed(() => {
    const latest = this.latestRelease();
    return DOCS_ANGULAR_MAJORS.map(major => ({
      major,
      line: `@sdcorejs/angular@^${major}`,
      latest: latest && latest.majors.includes(major) ? packageVersionFor(major, latest.id) : '—',
    }));
  });

  constructor() {
    void this.#releaseNotes.load();
    effect(() => {
      void this.#resolveRouteVersion(this.params().get('version'));
    });
  }

  selectMajor(major: number): void {
    void this.versions.selectAngularMajor(major).catch(() => undefined);
  }

  copyInstall(): void {
    void this.clipboard.copy(this.installCommand(), 'home-install');
  }

  async #resolveRouteVersion(requested: string | null): Promise<void> {
    if (!requested) return;
    try {
      const resolved = await this.versions.resolve(requested);
      if (requested !== resolved) {
        await this.#router.navigateByUrl(buildVersionRoute(this.#router.url, resolved), { replaceUrl: true });
      }
    } catch {
      // The home page stays useful while the version selector exposes its retry state.
    }
  }
}
