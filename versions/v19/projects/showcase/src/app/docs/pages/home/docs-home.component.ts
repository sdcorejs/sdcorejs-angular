import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AUTHOR_PROFILE } from '../../core/author-profile.config';
import { DocsVersionService } from '../../core/docs-version.service';
import { buildVersionRoute } from '../../core/docs-version.utils';
import { DOC_NAV_GROUPS, DOC_PAGES } from '../../core/documentation.registry';
import { SHOWCASE_CHANGELOG_RELEASES } from '../../generated/changelog.generated';
import { MarkdownRendererComponent } from '../../shared/markdown-renderer.component';

@Component({
  selector: 'docs-home',
  standalone: true,
  imports: [RouterLink, MarkdownRendererComponent],
  template: `
    <main class="home">
      <section class="hero">
        <div class="hero__content">
          <span class="hero__eyebrow">Angular Core UI library</span>
          <h1>Build consistent Angular portals with <span>&#64;sdcorejs/angular</span></h1>
          <p>Production-oriented components, forms, services, utilities and live integration patterns across maintained Angular 19–21 lines.</p>
          <div class="hero__actions">
            <a class="primary" [routerLink]="firstDocLink()">Get started</a>
            <a [routerLink]="componentsLink()">Browse components</a>
            <a href="https://github.com/sdcorejs/sdcorejs-angular" target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <div class="install">
            <code>npm install &#64;sdcorejs/angular</code>
            <button type="button" aria-label="Copy installation command" (click)="copyInstall()">Copy</button>
          </div>
        </div>
        <aside class="hero__stats" aria-label="Documentation statistics">
          <div><strong>{{ entryCount }}</strong><span>documented APIs</span></div>
          <div><strong>{{ demoCount }}</strong><span>live scenarios preserved</span></div>
          <div><strong>{{ versions.latestVersion() || '…' }}</strong><span>latest published docs</span></div>
        </aside>
      </section>

      @if (versions.error()) {
        <section class="home-notice" role="status">
          Published-version metadata is temporarily unavailable. The local catalog and live examples remain browsable.
          <button type="button" (click)="retryVersions()">Retry</button>
        </section>
      }

      @if (versions.invalidVersion(); as invalid) {
        <section class="home-notice" role="status">
          Version “{{ invalid }}” is unavailable. Showing v{{ currentVersion() }} instead.
        </section>
      }

      <section class="quick-links" aria-labelledby="quick-links-title">
        <header><span>Explore</span><h2 id="quick-links-title">Documentation catalog</h2></header>
        <div class="category-grid">
          @for (group of homeGroups(); track group.category) {
            <article>
              <span class="category-grid__icon" aria-hidden="true">{{ group.icon }}</span>
              <h3>{{ group.title }}</h3>
              <p>{{ group.pages.length }} entries with version-aware API reference and {{ group.pages.length === 1 ? 'a live gallery' : 'live galleries' }}.</p>
              <a [routerLink]="group.commands">Browse {{ group.browseLabel }} →</a>
            </article>
          }
        </div>
      </section>

      <section class="catalog" aria-labelledby="catalog-title">
        <header>
          <div><span>All APIs</span><h2 id="catalog-title">Browse by category</h2></div>
          <p>Use the global search for selectors, import paths, keywords and example titles.</p>
        </header>
        @for (group of homeGroups(); track group.category) {
          <section class="catalog__group">
            <h3>{{ group.title }}</h3>
            <div class="catalog__items">
              @for (page of group.pages; track page.id) {
                <a [routerLink]="page.commands">
                  <strong>{{ page.title }}</strong>
                  <span lang="vi">{{ page.description }}</span>
                  <small>{{ page.demoSectionCount }} live {{ page.demoSectionCount === 1 ? 'scenario' : 'scenarios' }}</small>
                </a>
              }
            </div>
          </section>
        }
      </section>

      <section class="home-footer-grid">
        <article>
          <span>Latest release</span>
          <h2>{{ latestRelease?.title ?? 'Unreleased' }}</h2>
          <p>{{ latestRelease?.date ?? 'Release notes are generated from CHANGELOG.md.' }}</p>
          @if (latestRelease?.summaryMarkdown; as summary) {
            <docs-markdown-renderer [markdown]="summary"></docs-markdown-renderer>
          }
          <a [routerLink]="changelogLink()">Read changelog →</a>
        </article>
        <article>
          <span>Project author</span>
          <h2>&#64;{{ author.authorHandle }}</h2>
          <p>Author details live in one typed configuration and optional fields stay hidden until verified.</p>
          <a routerLink="/about">About the author →</a>
        </article>
        <article>
          <span>Package</span>
          <h2>Angular {{ angularCompatibility() }}</h2>
          <p>Version options are loaded from the deployed published-doc registry rather than hard-coded in the application.</p>
          <a href="https://www.npmjs.com/package/@sdcorejs/angular" target="_blank" rel="noreferrer">View on npm →</a>
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
  readonly routeParams = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  readonly versions = inject(DocsVersionService);
  readonly author = AUTHOR_PROFILE;
  readonly entryCount = DOC_PAGES.length;
  readonly demoCount = DOC_PAGES.reduce((total, page) => total + page.demoSectionCount, 0);
  readonly latestRelease = SHOWCASE_CHANGELOG_RELEASES.find((release) => !release.unreleased);
  readonly currentVersion = computed(() => (this.versions.selectedVersion() ?? this.versions.latestVersion()) || 'latest');
  readonly firstDocLink = computed(() => ['/v', this.currentVersion(), 'components', 'button', 'overview']);
  readonly componentsLink = computed(() => ['/v', this.currentVersion(), 'components', 'anchor', 'overview']);
  readonly changelogLink = computed(() => ['/v', this.currentVersion(), 'changelog']);
  readonly homeGroups = computed(() =>
    DOC_NAV_GROUPS.map((group) => ({
      ...group,
      browseLabel: group.title.toLocaleLowerCase(),
      commands: ['/v', this.currentVersion(), group.pages[0]?.category ?? group.category, group.pages[0]?.slug ?? '', 'overview'],
      pages: group.pages.map((page) => ({
        ...page,
        commands: ['/v', this.currentVersion(), page.category, page.slug, 'overview'],
      })),
    })),
  );
  readonly angularCompatibility = computed(() => this.versions.versionGroups().map((group) => group.major).join('–') || '19–21');

  constructor() {
    effect(() => {
      const requested = this.routeParams().get('version');
      void this.#initializeVersion(requested).catch(() => undefined);
    });
  }

  copyInstall(): void {
    const write = this.#document.defaultView?.navigator.clipboard?.writeText('npm install @sdcorejs/angular');
    if (write) void write.catch(() => undefined);
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
}
