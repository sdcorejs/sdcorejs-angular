import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink, Scroll } from '@angular/router';
import { filter } from 'rxjs';
import { ApiMethod, ApiRow, apiRowsOfMarkdown, matchesApiQuery, parseApiMethod } from '../../core/api-table.parser';
import { DocsI18nService } from '../../core/docs-i18n.service';
import { DocsReleaseNotesService } from '../../core/docs-release-notes.service';
import { DocsVersionService } from '../../core/docs-version.service';
import { buildVersionRoute } from '../../core/docs-version.utils';
import { DocPageDefinition, DocTabId, isDocCategory } from '../../core/documentation.models';
import { DOC_PAGES, findDocPage } from '../../core/documentation.registry';
import { MarkdownSection, PublishedDocTabsViewModel } from '../../core/published-docs.models';
import { PublishedDocsService } from '../../core/published-docs.service';
import { ExampleViewerComponent } from '../../shared/example-viewer.component';
import { MarkdownRendererComponent } from '../../shared/markdown-renderer.component';
import { DocsClipboardService } from '../../core/docs-clipboard.service';
import { DocsApiMethodsComponent, apiMethodMatchCount } from '../../shared/docs-api-methods.component';
import { metadataCode } from '../../shared/docs-page-header.component';
import { highlightCode } from '../../shared/markdown-renderer.component';
import { DocsNotFoundComponent } from '../not-found/docs-not-found.component';
import { DocsPageHeaderComponent } from '../../shared/docs-page-header.component';
import { DocsPageTabLink, DocsPageTabsComponent } from '../../shared/docs-page-tabs.component';
import { DOCS_TOC_OFFSET_PX, DocsTableOfContentsComponent, DocsTocItem } from '../../shared/docs-table-of-contents.component';
import { resolveDocsPageAvailability } from '../../shared/docs-page-availability';

const LIBRARY_SOURCE_ROOT = 'https://github.com/sdcorejs/sdcorejs-angular/blob/main/versions/v19/projects/sdcorejs-angular/';
const PURPOSE_HEADING = /^one-line purpose$/i;

interface ApiSectionView {
  readonly section: MarkdownSection;
  readonly method: ApiMethod | null;
  readonly rows: readonly ApiRow[];
}

/** API sections with their parsed member rows; method signature sections become method cards. */
export function toApiSections(sections: readonly MarkdownSection[]): ApiSectionView[] {
  return sections.map(section => {
    const method = parseApiMethod(section.heading, section.markdown);
    return { section, method, rows: method ? [] : apiRowsOfMarkdown(section.markdown, section.id) };
  });
}

/** Minimal standalone usage for the Overview "Quick start": a host component for components, inject() for services. */
export function quickStartCode(page: DocPageDefinition, className: string | null): string | null {
  if (!className) return null;
  const imports = [`import { ${className} } from '${page.importPath}';`];
  if (page.selector && /^[a-z][\w-]*$/.test(page.selector)) {
    return [
      "import { Component } from '@angular/core';",
      ...imports,
      '',
      '@Component({',
      "  selector: 'app-example',",
      '  standalone: true,',
      `  imports: [${className}],`,
      `  template: \`<${page.selector}></${page.selector}>\`,`,
      '})',
      'export class ExampleComponent {}',
    ].join('\n');
  }
  if (page.category === 'services') {
    const field = className.replace(/^Sd/, '').replace(/^./, character => character.toLowerCase());
    return [
      "import { Component, inject } from '@angular/core';",
      ...imports,
      '',
      "@Component({ selector: 'app-example', standalone: true, template: '' })",
      'export class ExampleComponent {',
      `  readonly #${field} = inject(${className});`,
      '}',
    ].join('\n');
  }
  return null;
}

/** API members of a document (table rows and method options): the API tab count. */
export function countApiEntries(sections: readonly MarkdownSection[]): number {
  return toApiSections(sections).reduce((total, item) => total + item.rows.length + (item.method?.options.length ?? 0), 0);
}

/** First paragraph of a Markdown section as plain text with `code` kept. */
export function firstParagraph(markdown: string): string | null {
  const paragraph = markdown
    .split(/\r?\n\s*\r?\n/)
    .map(block => block.trim())
    .find(block => block && !/^(#|[-*] |\||```|>)/.test(block));
  return paragraph ? paragraph.replace(/\s*\r?\n\s*/g, ' ').replace(/\*\*([^*]+)\*\*/g, '$1') : null;
}

@Component({
  selector: 'docs-page',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MarkdownRendererComponent,
    ExampleViewerComponent,
    DocsApiMethodsComponent,
    DocsNotFoundComponent,
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
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);
  readonly #publishedDocs = inject(PublishedDocsService);
  readonly #releaseNotes = inject(DocsReleaseNotesService);
  readonly params = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  readonly tabsAnchor = viewChild<ElementRef<HTMLElement>>('tabsAnchor');
  #loadSequence = 0;
  #loadedKey: string | null = null;
  /** Scroll position to restore after a tab switch, set just before the router navigates. */
  #tabScrollTarget: number | null = null;

  readonly i18n = inject(DocsI18nService);
  readonly clipboard = inject(DocsClipboardService);
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
  readonly publishedDocIds = signal<ReadonlySet<string> | null>(null);

  readonly tabLinks = computed<readonly DocsPageTabLink[]>(() => {
    const page = this.page();
    if (!page) return [];
    const availableTabs = new Set(this.#availableTabs(page, this.viewModel()));
    const view = this.viewModel();
    return page.tabs
      .filter(tab => availableTabs.has(tab.id))
      .map(tab => ({
        ...tab,
        commands: ['/v', this.version(), page.category, page.slug, tab.id],
        count: tab.id === 'api' && view ? countApiEntries(view.api) || null : tab.id === 'examples' ? page.examples.length || null : null,
      }));
  });
  readonly metadataRecord = computed<Readonly<Record<string, string>>>(() => this.viewModel()?.parsed.metadata ?? {});
  readonly purposeSection = computed(() => this.viewModel()?.overview.find(section => PURPOSE_HEADING.test(section.heading.trim())) ?? null);
  readonly lead = computed(() => {
    const section = this.purposeSection();
    return section ? firstParagraph(section.markdown) : null;
  });
  readonly release = computed(() => this.versions.selectedRelease());
  readonly isLatestRelease = computed(() => this.versions.isLatestRelease());
  readonly releaseBadge = computed(() => {
    const page = this.page();
    return page && this.isLatestRelease() ? (this.#releaseNotes.badges().get(page.id) ?? null) : null;
  });
  /** "What changed in <release>": changelog entries of the current release that name this page. */
  readonly changes = computed(() => {
    const page = this.page();
    return page && this.isLatestRelease() ? this.#releaseNotes.entriesFor(page.id) : [];
  });
  readonly changelogLink = computed(() => ['/v', this.version(), 'changelog']);
  readonly installCommand = computed(() => `npm i @sdcorejs/angular@${this.version()}`);
  readonly quickStart = computed(() => {
    const page = this.page();
    if (!page || !this.viewModel()) return null;
    const code = quickStartCode(page, metadataCode(this.metadataRecord()['Class']));
    return code ? { code, html: highlightCode(code, 'typescript'), lines: code.split('\n').map((_, index) => index + 1).join('\n') } : null;
  });
  readonly untranslated = computed(() => this.i18n.language() === 'vi');
  readonly apiQuery = signal('');
  readonly apiSections = computed(() => (this.tab() === 'api' ? toApiSections(this.sections()) : []));
  readonly apiMethods = computed(() => this.apiSections().flatMap(item => (item.method ? [item.method] : [])));
  readonly firstMethodSectionId = computed(() => this.apiSections().find(item => item.method)?.section.id ?? null);
  /** Rows matching the API filter per section id; sections without rows count as 0. */
  readonly apiMatches = computed(() => {
    const query = this.apiQuery();
    return new Map(this.apiSections().map(item => [item.section.id, item.rows.filter(row => matchesApiQuery(row, query)).length]));
  });
  readonly apiMatchCount = computed(() => {
    const rows = [...this.apiMatches().values()].reduce((total, count) => total + count, 0);
    return rows + apiMethodMatchCount(this.apiMethods(), this.apiQuery());
  });
  readonly editUrl = computed(() => {
    const path = this.viewModel()?.document.path;
    return path ? `${LIBRARY_SOURCE_ROOT}${path}` : null;
  });
  readonly sections = computed<readonly MarkdownSection[]>(() => {
    const view = this.viewModel();
    if (!view) return [];
    switch (this.tab()) {
      case 'overview':
        return view.overview.filter(section => section !== this.purposeSection());
      case 'styling':
        return view.styling;
      case 'api':
        return view.api;
      case 'examples':
        return view.examples.filter(section => section.markdown.trim().length > 0);
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
      const liveExamples = this.page()?.examples.map(example => ({ id: example.id, label: example.title, level: 2 })) ?? [];
      const publishedExamples = this.sections();
      return publishedExamples.length
        ? [
            ...liveExamples,
            { id: 'published-examples', label: `Published examples · v${this.version()}`, level: 2 },
            ...publishedExamples.map(section => ({ id: section.id, label: section.heading, level: section.level + 1 })),
          ]
        : liveExamples;
    }
    const methods = new Map(this.apiSections().flatMap(item => (item.method ? [[item.section.id, item.method] as const] : [])));
    const items: DocsTocItem[] = this.sections().map(section => {
      const method = methods.get(section.id);
      return method
        ? { id: method.id, label: `${method.name}()`, level: section.level }
        : { id: section.id, label: section.heading.replace(/`/g, ''), level: section.level };
    });
    if (this.tab() === 'overview' && this.quickStart()) {
      items.unshift({ id: 'quick-start', label: this.i18n.t().quickStart, level: 2 });
    }
    if (this.tab() === 'overview' && this.changes().length) {
      items.unshift({ id: 'changed', label: this.i18n.format('changedIn', { v: this.release() }), level: 2 });
    }
    if (this.tab() === 'styling' && this.styleGuideSections().length) {
      items.push(
        { id: 'shared-style-guide', label: 'Shared style guide', level: 2 },
        ...this.styleGuideSections().map(section => ({ id: `style-guide-${section.id}`, label: section.heading, level: section.level + 1 }))
      );
    }
    return items;
  });
  readonly pageIndex = computed(() => {
    const page = this.page();
    return page ? DOC_PAGES.findIndex(entry => entry.id === page.id) : -1;
  });
  readonly previousPage = computed(() => this.#findAdjacentPage(-1));
  readonly nextPage = computed(() => this.#findAdjacentPage(1));
  readonly previousLink = computed(() => {
    const page = this.previousPage();
    return page ? ['/v', this.version(), page.category, page.slug, this.#defaultTab(page)] : null;
  });
  readonly nextLink = computed(() => {
    const page = this.nextPage();
    return page ? ['/v', this.version(), page.category, page.slug, this.#defaultTab(page)] : null;
  });
  readonly sourceUrl = computed(() => {
    const path = this.page()?.sourcePath;
    return path ? `https://github.com/sdcorejs/sdcorejs-angular/blob/main/${path}` : null;
  });
  // why: every Angular line of the latest release is current; only an older release is archived.
  readonly isHistoricalVersion = computed(() => !!this.version() && !this.versions.isLatestRelease());
  readonly liveExamplesNotice = computed(
    () => `Archived documentation v${this.version()} is shown here. Live examples and demo source use the current showcase.`
  );

  constructor() {
    void this.#releaseNotes.load();
    effect(() => {
      const params = this.params();
      void this.#load(params.get('version'), params.get('category'), params.get('slug'), params.get('tab'));
    });
    // why: the router scrolls to the top after every navigation; a tab switch keeps the reader at the tab bar.
    this.#router.events
      .pipe(
        filter((event): event is Scroll => event instanceof Scroll),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        const target = this.#tabScrollTarget;
        this.#tabScrollTarget = null;
        const view = this.#document.defaultView;
        if (target === null || !view) return;
        view.setTimeout(() => view.requestAnimationFrame(() => view.scrollTo({ top: target })));
      });
  }

  /** Called before a tab link navigates: stay where the reader is, or at the tab bar once it is sticky. */
  onTabSelected(): void {
    const view = this.#document.defaultView;
    const anchor = this.tabsAnchor()?.nativeElement;
    if (!view || !anchor) return;
    const header = parseFloat(view.getComputedStyle(this.#document.documentElement).getPropertyValue('--docs-header-height')) || 60;
    const tabsTop = anchor.getBoundingClientRect().bottom + view.scrollY - header;
    this.#tabScrollTarget = Math.min(view.scrollY, tabsTop);
  }

  onApiQuery(event: Event): void {
    this.apiQuery.set((event.target as HTMLInputElement).value);
  }

  /** While filtering, sections without a matching member are hidden. */
  showApiSection(sectionId: string): boolean {
    return !this.apiQuery().trim() || (this.apiMatches().get(sectionId) ?? 0) > 0;
  }

  retry(): void {
    const params = this.params();
    void this.#load(params.get('version'), params.get('category'), params.get('slug'), params.get('tab'));
  }

  async #load(requestedVersion: string | null, categoryValue: string | null, slug: string | null, tabValue: string | null): Promise<void> {
    const loadedPage = this.page();
    const sameDocument =
      !!loadedPage && !!this.viewModel() && !this.loading() && this.#loadedKey === `${requestedVersion}|${categoryValue}|${slug}`;
    const sameTab = loadedPage?.tabs.find(candidate => candidate.id === tabValue)?.id;
    if (sameDocument && sameTab && sameTab !== 'styling' && this.#availableTabs(loadedPage, this.viewModel()).includes(sameTab)) {
      // why: switching tabs of the loaded document keeps its content instead of collapsing to a loading state.
      ++this.#loadSequence;
      this.tab.set(sameTab);
      return;
    }

    const sequence = ++this.#loadSequence;
    this.#loadedKey = null;
    this.apiQuery.set('');
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.notAvailable.set(false);
    this.publishedDocIds.set(null);
    this.viewModel.set(null);
    this.styleGuide.set(null);

    const page = isDocCategory(categoryValue) && slug ? findDocPage(categoryValue, slug) : undefined;
    const tab = page?.tabs.find(candidate => candidate.id === tabValue)?.id;
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

      try {
        const index = await this.#publishedDocs.loadIndex(version);
        if (sequence !== this.#loadSequence) return;
        this.publishedDocIds.set(new Set(index.docs.map(document => document.id)));
      } catch {
        if (sequence !== this.#loadSequence) return;
        this.publishedDocIds.set(null);
      }

      if (!page.publishedDocId) {
        this.notAvailable.set(true);
      } else {
        const view = await this.#publishedDocs.loadDocument(version, page.publishedDocId);
        if (sequence !== this.#loadSequence) return;
        this.viewModel.set(view);
        this.notAvailable.set(!view);
        if (view) this.#loadedKey = `${version}|${page.category}|${page.slug}`;
      }

      const availableTabs = this.#availableTabs(page, this.viewModel());
      if (!availableTabs.includes(tab)) {
        const fallback = availableTabs[0];
        if (fallback) {
          await this.#router.navigate(['/v', version, page.category, page.slug, fallback], { replaceUrl: true, preserveFragment: true });
        } else {
          this.notAvailable.set(true);
        }
        return;
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
      if (sequence === this.#loadSequence) {
        this.loading.set(false);
        this.#revealFragment();
      }
    }
  }

  /** A cold deep link (#api-…) arrives before the published document; scroll to its target once the content renders. */
  #revealFragment(): void {
    const fragment = this.#router.parseUrl(this.#router.url).fragment;
    if (!fragment || !this.viewModel()) return;
    afterNextRender(
      () => {
        const view = this.#document.defaultView;
        const target = this.#document.getElementById(fragment);
        if (!view || !target) return;
        view.scrollTo({ top: target.getBoundingClientRect().top + view.scrollY - DOCS_TOC_OFFSET_PX });
        if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
        target.focus({ preventScroll: true });
      },
      { injector: this.#injector }
    );
  }

  #availableTabs(page: DocPageDefinition, view: PublishedDocTabsViewModel | null): readonly DocTabId[] {
    if (!view) {
      if (this.notAvailable()) return page.examples.length ? ['examples'] : [];
      if (this.loading() || this.error()) return page.tabs.map(tab => tab.id);
      return page.examples.length ? ['examples'] : [];
    }

    return page.tabs
      .filter(tab => {
        switch (tab.id) {
          case 'overview':
            return view.overview.length > 0;
          case 'styling':
            return view.styling.length > 0;
          case 'api':
            return view.api.length > 0;
          case 'examples':
            return page.examples.length > 0 || view.examples.some(section => section.markdown.trim().length > 0);
        }
      })
      .map(tab => tab.id);
  }

  #defaultTab(page: DocPageDefinition): DocTabId {
    return resolveDocsPageAvailability(page, this.publishedDocIds()) === 'live-demo' ? 'examples' : 'overview';
  }

  #findAdjacentPage(direction: -1 | 1): DocPageDefinition | null {
    for (let index = this.pageIndex() + direction; index >= 0 && index < DOC_PAGES.length; index += direction) {
      const candidate = DOC_PAGES[index];
      if (resolveDocsPageAvailability(candidate, this.publishedDocIds()) !== 'unavailable') return candidate;
    }
    return null;
  }
}
