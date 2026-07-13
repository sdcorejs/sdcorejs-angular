import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { AUTHOR_PROFILE } from '../../core/author-profile.config';
import { DocsVersionService } from '../../core/docs-version.service';
import { buildVersionRoute } from '../../core/docs-version.utils';
import { buildCoreUiInstallCommand } from '../../core/docs-installation.utils';
import { DOC_NAV_GROUPS, DOC_PAGES } from '../../core/documentation.registry';
import { SHOWCASE_CHANGELOG_RELEASES } from '../../generated/changelog.generated';
import { MarkdownRendererComponent } from '../../shared/markdown-renderer.component';

@Component({
  selector: 'docs-home',
  standalone: true,
  imports: [RouterLink, SdIcon, MarkdownRendererComponent],
  template: `
    <main class="home">
      <section class="hero" aria-labelledby="home-title">
        <div class="hero__content">
          <span class="hero__eyebrow">Angular Core UI library</span>
          <h1 id="home-title">Build consistent Angular portals with <span>&#64;sdcorejs/angular</span></h1>
          <p>Production-ready components, forms and utilities with versioned API references and runnable examples for Angular 19–21.</p>
          <div class="hero__actions">
            <a class="primary" [routerLink]="gettingStartedLink()">Get started</a>
            <a [routerLink]="componentsLink()">Browse components</a>
            <a href="https://github.com/sdcorejs/sdcorejs-angular" target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <div class="install" aria-label="Installation command">
            <code>{{ installCommand() }}</code>
            <button type="button" aria-label="Copy installation command" (click)="copyInstall()">Copy</button>
          </div>
          <span class="docs-visually-hidden" role="status" aria-live="polite" aria-atomic="true">{{ copyAnnouncement() }}</span>
        </div>
        <aside class="hero__stats" aria-label="Documentation statistics">
          <div>
            <strong>{{ entryCount }}</strong
            ><span>API references</span>
          </div>
          <div>
            <strong>{{ demoCount }}</strong
            ><span>interactive examples</span>
          </div>
          <div>
            <strong>{{ versions.latestVersion() || '…' }}</strong
            ><span>latest documentation</span>
          </div>
        </aside>
      </section>

      @if (versions.error()) {
        <section class="home-notice" role="status">
          Published-version metadata is temporarily unavailable. The local catalog and live examples remain available.
          <button type="button" (click)="retryVersions()">Retry</button>
        </section>
      }

      @if (versions.invalidVersion(); as invalid) {
        <section class="home-notice" role="status">
          Version “{{ invalid }}” is unavailable. Showing v{{ currentVersion() }} instead.
        </section>
      }

      <section class="maintainer-card" aria-labelledby="maintainer-name">
        <div class="maintainer-card__mark" aria-hidden="true">TN</div>
        <div>
          <span class="maintainer-card__eyebrow">Maintained by</span>
          <h2 id="maintainer-name">{{ author.authorName }}</h2>
          <p class="maintainer-card__title">{{ author.authorTitle }}</p>
          <p class="maintainer-card__bio">{{ author.authorBio }}</p>
          <nav class="maintainer-card__links" aria-label="Maintainer contact links">
            <a [href]="author.linkedinUrl" target="_blank" rel="noreferrer">LinkedIn</a>
            <a [href]="'mailto:' + author.email">{{ author.email }}</a>
          </nav>
        </div>
      </section>

      <section class="quick-links" aria-labelledby="quick-links-title">
        <header>
          <span>Explore</span>
          <h2 id="quick-links-title">Find the right building block</h2>
          <p>Choose a category or use global search to find selectors, import paths and API details.</p>
        </header>
        <div class="category-grid">
          @for (group of homeGroups(); track group.category) {
            <article>
              <span class="category-grid__icon" aria-hidden="true">
                <sd-icon [name]="group.icon" set="material-icons-outlined" size="lg"></sd-icon>
              </span>
              <div>
                <h3>{{ group.title }}</h3>
                <p>
                  {{ group.pages.length }} references<span class="category-grid__demo-count"> · {{ group.demoCount }} examples</span>
                </p>
              </div>
              <a [routerLink]="group.commands">Browse {{ group.browseLabel }} <span aria-hidden="true">→</span></a>
            </article>
          }
        </div>
      </section>

      <section class="home-footer-grid" aria-label="Project information">
        <article>
          <span>Latest release</span>
          <h2>{{ latestRelease?.title ?? 'Unreleased' }}</h2>
          <p>{{ latestRelease?.date ?? 'See the changelog for upcoming changes.' }}</p>
          @if (latestRelease?.summaryMarkdown; as summary) {
            <docs-markdown-renderer [markdown]="summary" language="en"></docs-markdown-renderer>
          }
          <a [routerLink]="changelogLink()">Read changelog <span aria-hidden="true">→</span></a>
        </article>
        <article>
          <span>Open source</span>
          <h2>Use, learn and contribute</h2>
          <p>Explore project goals, contribution links and support resources.</p>
          <a routerLink="/about">About this project <span aria-hidden="true">→</span></a>
        </article>
        <article>
          <span>Compatibility</span>
          <h2>Angular {{ angularCompatibility() }}</h2>
          <p>Select a published version in the header to read the matching API reference.</p>
          <a href="https://www.npmjs.com/package/@sdcorejs/angular" target="_blank" rel="noreferrer"
            >View on npm <span aria-hidden="true">→</span></a
          >
        </article>
      </section>
    </main>
  `,
  styleUrl: './docs-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsHomeComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly routeParams = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  readonly versions = inject(DocsVersionService);
  readonly author = AUTHOR_PROFILE;
  readonly entryCount = DOC_PAGES.length;
  readonly demoCount = DOC_PAGES.reduce((total, page) => total + page.demoSectionCount, 0);
  readonly latestRelease = SHOWCASE_CHANGELOG_RELEASES.find(release => !release.unreleased);
  readonly currentVersion = computed(() => (this.versions.selectedVersion() ?? this.versions.latestVersion()) || 'latest');
  readonly gettingStartedLink = computed(() => ['/v', this.currentVersion(), 'getting-started']);
  readonly componentsLink = computed(() => ['/v', this.currentVersion(), 'components']);
  readonly changelogLink = computed(() => ['/v', this.currentVersion(), 'changelog']);
  readonly installCommand = computed(() => buildCoreUiInstallCommand(this.currentVersion()));
  readonly copyAnnouncement = signal('');
  readonly homeGroups = computed(() =>
    DOC_NAV_GROUPS.map(group => ({
      ...group,
      browseLabel: group.title.toLocaleLowerCase(),
      commands: ['/v', this.currentVersion(), group.category],
      demoCount: group.pages.reduce((total, page) => total + page.demoSectionCount, 0),
    }))
  );
  readonly angularCompatibility = computed(
    () =>
      this.versions
        .versionGroups()
        .map(group => group.major)
        .join('–') || '19–21'
  );

  #copyRequestId = 0;
  #copyResetTimeout: number | undefined;

  constructor() {
    this.#destroyRef.onDestroy(() => {
      this.#copyRequestId += 1;
      this.#clearCopyAnnouncement();
    });
    effect(() => {
      const requested = this.routeParams().get('version');
      void this.#initializeVersion(requested).catch(() => undefined);
    });
  }

  async copyInstall(): Promise<void> {
    const requestId = ++this.#copyRequestId;
    this.#clearCopyAnnouncement();
    const clipboard = this.#document.defaultView?.navigator.clipboard;
    if (!clipboard) {
      this.#showCopyAnnouncement('Clipboard is unavailable. Copy the installation command manually.', requestId);
      return;
    }

    try {
      await clipboard.writeText(this.installCommand());
      this.#showCopyAnnouncement('Installation command copied to clipboard.', requestId);
    } catch {
      this.#showCopyAnnouncement('Installation command could not be copied.', requestId);
    }
  }

  retryVersions(): void {
    void this.versions.load(true).catch(() => undefined);
  }

  async #initializeVersion(requested: string | null): Promise<void> {
    if (!requested) {
      await this.versions.load();
      return;
    }
    const resolved = await this.versions.resolve(requested);
    if (requested !== resolved) await this.#router.navigateByUrl(buildVersionRoute(this.#router.url, resolved), { replaceUrl: true });
  }

  #showCopyAnnouncement(message: string, requestId: number): void {
    if (requestId !== this.#copyRequestId) return;
    this.copyAnnouncement.set(message);
    this.#copyResetTimeout = this.#document.defaultView?.setTimeout(() => {
      if (requestId === this.#copyRequestId) this.copyAnnouncement.set('');
      this.#copyResetTimeout = undefined;
    }, 1600);
  }

  #clearCopyAnnouncement(): void {
    if (this.#copyResetTimeout !== undefined) {
      this.#document.defaultView?.clearTimeout(this.#copyResetTimeout);
      this.#copyResetTimeout = undefined;
    }
    this.copyAnnouncement.set('');
  }
}
