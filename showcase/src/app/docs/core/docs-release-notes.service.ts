import { Injectable, computed, inject, signal } from '@angular/core';
import type { ShowcaseChangelogRelease } from '../generated/changelog.generated';
import { changelogEntriesForPage, deriveReleaseBadges } from './docs-release-badges';
import { DocsVersionService } from './docs-version.service';
import { DOC_PAGES } from './documentation.registry';

/**
 * Release notes of the selected release, parsed from CHANGELOG.md at build time. The generated module is large, so it
 * is imported lazily the first time a view asks for it.
 */
@Injectable({ providedIn: 'root' })
export class DocsReleaseNotesService {
  readonly #versions = inject(DocsVersionService);
  readonly #releases = signal<readonly ShowcaseChangelogRelease[]>([]);
  #loading: Promise<void> | null = null;

  readonly releases = this.#releases.asReadonly();
  readonly currentRelease = computed(
    () => this.#releases().find(release => release.suffix === this.#versions.selectedRelease()) ?? null
  );
  readonly badges = computed(() => deriveReleaseBadges(this.currentRelease(), DOC_PAGES));

  load(): Promise<void> {
    this.#loading ??= import('../generated/changelog.generated')
      .then(module => this.#releases.set(module.SHOWCASE_CHANGELOG_RELEASES))
      .catch(() => {
        this.#loading = null;
      });
    return this.#loading;
  }

  entriesFor(pageId: string): readonly string[] {
    const page = DOC_PAGES.find(candidate => candidate.id === pageId);
    return page ? changelogEntriesForPage(this.currentRelease(), page, DOC_PAGES) : [];
  }
}
