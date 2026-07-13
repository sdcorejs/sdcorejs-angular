import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocsVersionService } from '../../core/docs-version.service';
import { buildVersionRoute } from '../../core/docs-version.utils';
import { DocCategory, DocPageDefinition, DocTabId } from '../../core/documentation.models';
import { DOC_PAGES, findDocPage } from '../../core/documentation.registry';
import { MarkdownSection, PublishedDocTabsViewModel } from '../../core/published-docs.models';
import { PublishedDocsService } from '../../core/published-docs.service';
import { ExampleViewerComponent } from '../../shared/example-viewer.component';
import { MarkdownRendererComponent } from '../../shared/markdown-renderer.component';
import { DocsApiSummaryComponent } from '../../shared/docs-api-summary.component';
import { DocsPageHeaderComponent } from '../../shared/docs-page-header.component';
import { DocsPageTabLink, DocsPageTabsComponent } from '../../shared/docs-page-tabs.component';
import { DocsTableOfContentsComponent, DocsTocItem } from '../../shared/docs-table-of-contents.component';

const DOC_CATEGORIES: readonly DocCategory[] = ['components', 'forms', 'services'];

@Component({
  selector: 'docs-page',
  standalone: true,
  imports: [
    RouterLink,
    MarkdownRendererComponent,
    ExampleViewerComponent,
    DocsApiSummaryComponent,
    DocsPageHeaderComponent,
    DocsPageTabsComponent,
    DocsTableOfContentsComponent,
  ],
  templateUrl: './docs-page.component.html',
  styleUrl: './docs-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsPageComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #publishedDocs = inject(PublishedDocsService);
  readonly params = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  #loadSequence = 0;

  readonly versions = inject(DocsVersionService);
  readonly page = signal<DocPageDefinition | null>(null);
  readonly tab = signal<DocTabId>('overview');
  readonly version = signal('');
  readonly viewModel = signal<PublishedDocTabsViewModel | null>(null);
  readonly styleGuide = signal<PublishedDocTabsViewModel | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly notAvailable = signal(false);

  readonly tabLinks = computed<readonly DocsPageTabLink[]>(() => {
    const page = this.page();
    if (!page) return [];
    return page.tabs.map((tab) => ({
      ...tab,
      commands: ['/v', this.version(), page.category, page.slug, tab.id],
    }));
  });
  readonly metadata = computed(() => Object.entries(this.viewModel()?.parsed.metadata ?? {}));
  readonly sections = computed<readonly MarkdownSection[]>(() => {
    const view = this.viewModel();
    if (!view) return [];
    switch (this.tab()) {
      case 'overview':
        return view.overview.length ? view.overview : view.parsed.sections.slice(0, 4);
      case 'styling':
        return view.styling;
      case 'api':
        return view.api.length ? view.api : view.parsed.sections;
      case 'examples':
        return view.examples.filter((section) => section.markdown.trim().length > 0);
    }
  });
  readonly styleGuideSections = computed(() => this.styleGuide()?.parsed.sections ?? []);
  readonly documentUrl = computed(() => {
    const document = this.viewModel()?.document;
    return document ? this.#publishedDocs.resolveDocumentUrl(this.version(), document.path) : null;
  });
  readonly styleGuideUrl = computed(() => {
    const document = this.styleGuide()?.document;
    return document ? this.#publishedDocs.resolveDocumentUrl(this.version(), document.path) : null;
  });
  readonly tableOfContents = computed<readonly DocsTocItem[]>(() => {
    if (this.tab() === 'examples') {
      return this.page()?.examples.map((example) => ({ id: example.id, label: example.title })) ?? [];
    }
    return this.sections().map((section) => ({ id: section.id, label: section.heading }));
  });
  readonly pageIndex = computed(() => {
    const page = this.page();
    return page ? DOC_PAGES.findIndex((entry) => entry.id === page.id) : -1;
  });
  readonly previousPage = computed(() => DOC_PAGES[this.pageIndex() - 1] ?? null);
  readonly nextPage = computed(() => DOC_PAGES[this.pageIndex() + 1] ?? null);
  readonly previousLink = computed(() => {
    const page = this.previousPage();
    return page ? ['/v', this.version(), page.category, page.slug, 'overview'] : null;
  });
  readonly nextLink = computed(() => {
    const page = this.nextPage();
    return page ? ['/v', this.version(), page.category, page.slug, 'overview'] : null;
  });
  readonly sourceUrl = computed(() => {
    const path = this.page()?.sourcePath;
    return path ? `https://github.com/sdcorejs/sdcorejs-angular/blob/main/${path}` : null;
  });
  readonly liveExamplesNotice = computed(
    () => `API content is shown for v${this.version()}. Live examples use the current synchronized showcase implementation.`,
  );

  constructor() {
    effect(() => {
      const params = this.params();
      void this.#load(params.get('version'), params.get('category'), params.get('slug'), params.get('tab'));
    });
  }

  retry(): void {
    const params = this.params();
    void this.#load(params.get('version'), params.get('category'), params.get('slug'), params.get('tab'));
  }

  async #load(
    requestedVersion: string | null,
    categoryValue: string | null,
    slug: string | null,
    tabValue: string | null,
  ): Promise<void> {
    const sequence = ++this.#loadSequence;
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.notAvailable.set(false);
    this.viewModel.set(null);
    this.styleGuide.set(null);

    const category = categoryValue as DocCategory | null;
    const page = category && DOC_CATEGORIES.includes(category) && slug ? findDocPage(category, slug) : undefined;
    const tab = page?.tabs.find((candidate) => candidate.id === tabValue)?.id;
    if (!page || !tab) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.page.set(page);
    this.tab.set(tab);
    this.version.set(requestedVersion || this.versions.selectedVersion() || this.versions.latestVersion() || 'latest');
    try {
      const version = await this.versions.resolve(requestedVersion);
      if (sequence !== this.#loadSequence) return;
      this.version.set(version);
      if (requestedVersion !== version) {
        await this.#router.navigateByUrl(buildVersionRoute(this.#router.url, version), { replaceUrl: true });
        return;
      }

      if (!page.publishedDocId) {
        this.notAvailable.set(true);
      } else {
        const view = await this.#publishedDocs.loadDocument(version, page.publishedDocId);
        if (sequence !== this.#loadSequence) return;
        this.viewModel.set(view);
        this.notAvailable.set(!view);
      }

      if (tab === 'styling') {
        const guide = await this.#publishedDocs.loadStyleGuide(version);
        if (sequence !== this.#loadSequence) return;
        this.styleGuide.set(guide);
      }
    } catch (error: unknown) {
      if (sequence !== this.#loadSequence) return;
      this.error.set(error instanceof Error ? error.message : 'Unable to load published documentation.');
    } finally {
      if (sequence === this.#loadSequence) this.loading.set(false);
    }
  }
}
