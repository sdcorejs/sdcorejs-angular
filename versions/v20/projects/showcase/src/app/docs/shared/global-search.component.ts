import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { DocsSearchResult, foldSearchText, groupSearchResults, searchDocumentation } from '../core/docs-search.utils';
import { DocsVersionService } from '../core/docs-version.service';
import { DOC_PAGES } from '../core/documentation.registry';
import { PublishedDocsService } from '../core/published-docs.service';
import { DocsPageAvailability, resolveDocsPageAvailability } from './docs-page-availability';

interface HighlightPart {
  readonly text: string;
  readonly matched: boolean;
}

interface SearchResultView {
  readonly result: DocsSearchResult;
  readonly index: number;
  readonly titleParts: readonly HighlightPart[];
  readonly metadataLabel: string;
  readonly metadataParts: readonly HighlightPart[];
}

interface SearchGroupView {
  readonly id: string;
  readonly title: string;
  readonly results: readonly SearchResultView[];
}

interface SearchMetadata {
  readonly kind: 'availability' | 'selector' | 'importPath' | 'keyword' | 'example' | 'publishedTitle';
  readonly label: string;
  readonly value: string;
}

function splitHighlight(value: string, query: string): readonly HighlightPart[] {
  const term = foldSearchText(query.trim());
  if (!term) return [{ text: value, matched: false }];
  let folded = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  for (const character of value) {
    const end = offset + character.length;
    const normalizedCharacter = foldSearchText(character);
    folded += normalizedCharacter;
    for (let index = 0; index < normalizedCharacter.length; index += 1) {
      starts.push(offset);
      ends.push(end);
    }
    offset = end;
  }
  const index = folded.indexOf(term);
  if (index < 0) return [{ text: value, matched: false }];
  const originalStart = starts[index] ?? 0;
  const originalEnd = ends[index + term.length - 1] ?? originalStart;
  return [
    { text: value.slice(0, originalStart), matched: false },
    { text: value.slice(originalStart, originalEnd), matched: true },
    { text: value.slice(originalEnd), matched: false },
  ].filter(part => part.text.length > 0);
}

function includesQuery(value: string, query: string): boolean {
  const term = foldSearchText(query.trim());
  return term.length > 0 && foldSearchText(value).includes(term);
}

/** Selects the most useful matched field so search explains why a result was returned. */
function resolveMetadata(
  result: DocsSearchResult,
  query: string,
  publishedTitles: ReadonlyMap<string, string>,
  availability: DocsPageAvailability
): SearchMetadata {
  const { page, matchedFields } = result;

  if (availability === 'live-demo') {
    return { kind: 'availability', label: 'Availability', value: 'Current live demo' };
  }

  if (page.selector && matchedFields.includes('selector') && includesQuery(page.selector, query)) {
    return { kind: 'selector', label: 'Selector', value: page.selector };
  }
  if (matchedFields.includes('importPath') && includesQuery(page.importPath, query)) {
    return { kind: 'importPath', label: 'Import path', value: page.importPath };
  }

  const generatedKeywords = new Set(
    [page.title, page.slug, page.category, page.importPath, ...(page.selector ? [page.selector] : [])].map(foldSearchText)
  );
  const keyword = page.keywords.find(value => !generatedKeywords.has(foldSearchText(value)) && includesQuery(value, query));
  if (matchedFields.includes('keywords') && keyword) {
    return { kind: 'keyword', label: 'Keyword', value: keyword };
  }

  const example = page.examples.find(value => includesQuery(value.title, query));
  if (!matchedFields.includes('title') && matchedFields.includes('examples') && example) {
    return { kind: 'example', label: 'Example', value: example.title };
  }

  const publishedTitle = page.publishedDocId ? publishedTitles.get(page.publishedDocId) : undefined;
  if (matchedFields.includes('publishedTitle') && publishedTitle && includesQuery(publishedTitle, query)) {
    return { kind: 'publishedTitle', label: 'Published title', value: publishedTitle };
  }

  return { kind: 'importPath', label: 'Import path', value: page.importPath };
}

@Component({
  selector: 'docs-global-search',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <button
      class="search-trigger"
      type="button"
      aria-label="Search documentation"
      [attr.inert]="opened() ? '' : null"
      (click)="openSearch()">
      <mat-icon aria-hidden="true">search</mat-icon>
      <span class="search-trigger__label">Search docs</span>
      <kbd>Ctrl K</kbd>
    </button>

    @if (opened()) {
      <div class="search-backdrop" aria-hidden="true" (click)="closeSearch()"></div>
      <section #searchDialog class="search-dialog" role="dialog" aria-modal="true" aria-label="Search documentation">
        <div class="search-dialog__field">
          <mat-icon aria-hidden="true">search</mat-icon>
          <input
            #searchInput
            type="search"
            role="combobox"
            aria-label="Search documentation"
            aria-autocomplete="list"
            aria-controls="docs-search-results"
            [attr.aria-expanded]="opened()"
            [attr.aria-activedescendant]="activeOptionId()"
            autocomplete="off"
            placeholder="Search components, forms, services…"
            [value]="query()"
            (input)="onInput($event)"
            (keydown.arrowDown)="moveActive(1, $event)"
            (keydown.arrowUp)="moveActive(-1, $event)"
            (keydown.enter)="openActive($event)" />
          <button type="button" aria-label="Close search" (click)="closeSearch()">Esc</button>
        </div>

        <p class="search-status" role="status" aria-live="polite" aria-atomic="true">{{ resultStatus() }}</p>
        <div id="docs-search-results" class="search-dialog__results" role="listbox" aria-label="Documentation results">
          @if (query().trim() && !flatResults().length) {
            <p class="search-empty">No documentation matched “{{ query() }}”.</p>
          }
          @for (group of groupedResults(); track group.title) {
            <section class="search-group" role="group" [attr.aria-labelledby]="group.id">
              <h2 [id]="group.id">{{ group.title }}</h2>
              @for (item of group.results; track item.result.page.id) {
                <button
                  type="button"
                  role="option"
                  tabindex="-1"
                  [id]="'docs-search-option-' + item.index"
                  [attr.aria-selected]="activeIndex() === item.index"
                  [class.active]="activeIndex() === item.index"
                  (mouseenter)="activeIndex.set(item.index)"
                  (click)="navigate(item.result)">
                  <span class="search-result__title">
                    @for (part of item.titleParts; track $index) {
                      @if (part.matched) {
                        <mark>{{ part.text }}</mark>
                      } @else {
                        {{ part.text }}
                      }
                    }
                  </span>
                  <span class="search-result__meta">
                    <span class="search-result__meta-label">{{ item.metadataLabel }}:</span>
                    @for (part of item.metadataParts; track $index) {
                      @if (part.matched) {
                        <mark>{{ part.text }}</mark>
                      } @else {
                        {{ part.text }}
                      }
                    }
                  </span>
                </button>
              }
            </section>
          }
        </div>
        <footer><span>↑↓ Navigate</span><span>Enter Open</span><span>Esc Close</span></footer>
      </section>
    }
  `,
  styleUrl: './global-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent {
  readonly #router = inject(Router);
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);
  readonly #versions = inject(DocsVersionService);
  readonly #publishedDocs = inject(PublishedDocsService);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly searchDialog = viewChild<ElementRef<HTMLElement>>('searchDialog');
  #focusBeforeOpen: HTMLElement | null = null;
  #focusRestore: ReturnType<typeof afterNextRender> | null = null;
  #indexLoadSequence = 0;

  readonly opened = signal(false);
  readonly openedChange = output<boolean>();
  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly publishedTitles = signal<ReadonlyMap<string, string>>(new Map());
  readonly publishedDocIds = signal<ReadonlySet<string> | null>(null);
  readonly searchablePages = computed(() =>
    DOC_PAGES.filter(page => resolveDocsPageAvailability(page, this.publishedDocIds()) !== 'unavailable')
  );
  readonly flatResults = computed(() => searchDocumentation(this.query(), this.searchablePages(), this.publishedTitles()).slice(0, 24));
  readonly resultStatus = computed(() => {
    if (!this.query().trim()) return '';
    const count = this.flatResults().length;
    if (!count) return 'No documentation results.';
    return `${count} documentation ${count === 1 ? 'result' : 'results'}.`;
  });
  readonly groupedResults = computed<readonly SearchGroupView[]>(() => {
    let index = 0;
    const query = this.query();
    const publishedTitles = this.publishedTitles();
    return groupSearchResults(this.flatResults()).map(group => ({
      id: `docs-search-group-${group.category}`,
      title: group.title,
      results: group.results.map(result => {
        const availability = resolveDocsPageAvailability(result.page, this.publishedDocIds());
        const metadata = resolveMetadata(result, query, publishedTitles, availability);
        return {
          result,
          index: index++,
          titleParts: splitHighlight(result.page.title, query),
          metadataLabel: metadata.label,
          metadataParts: splitHighlight(metadata.value, query),
        };
      }),
    }));
  });
  readonly displayedResults = computed(() => this.groupedResults().flatMap(group => group.results.map(item => item.result)));
  readonly activeOptionId = computed(() => (this.displayedResults().length ? `docs-search-option-${this.activeIndex()}` : null));

  constructor() {
    effect(() => {
      const version = this.#versions.selectedVersion();
      if (!version) return;
      const sequence = ++this.#indexLoadSequence;
      this.publishedTitles.set(new Map());
      this.publishedDocIds.set(null);
      void this.#publishedDocs
        .loadIndex(version)
        .then(index => {
          if (sequence !== this.#indexLoadSequence || this.#versions.selectedVersion() !== version) return;
          this.publishedTitles.set(new Map(index.docs.map(document => [document.id, document.title])));
          this.publishedDocIds.set(new Set(index.docs.map(document => document.id)));
        })
        .catch(() => {
          if (sequence === this.#indexLoadSequence && this.#versions.selectedVersion() === version) {
            this.publishedTitles.set(new Map());
            this.publishedDocIds.set(null);
          }
        });
    });
    effect(() => {
      if (!this.opened()) return;
      this.searchInput()?.nativeElement.focus();
    });
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if (this.opened() && event.key === 'Tab') {
      this.#trapFocus(event);
      return;
    }
    const target = event.target;
    const typing = target instanceof HTMLElement && target.matches('input, textarea, select, [contenteditable="true"]');
    if ((event.key === '/' && !typing) || (event.key.toLocaleLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      this.openSearch();
    } else if (event.key === 'Escape' && this.opened()) {
      event.preventDefault();
      this.closeSearch();
    }
  }

  openSearch(): void {
    if (this.opened()) {
      this.searchInput()?.nativeElement.focus();
      return;
    }
    this.#focusRestore?.destroy();
    this.#focusRestore = null;
    this.#focusBeforeOpen = this.#document.activeElement as HTMLElement | null;
    this.opened.set(true);
    this.openedChange.emit(true);
    this.activeIndex.set(0);
  }

  closeSearch(restoreFocus = true): void {
    if (!this.opened()) return;
    this.opened.set(false);
    this.openedChange.emit(false);
    const previousFocus = this.#focusBeforeOpen;
    this.#focusBeforeOpen = null;
    if (restoreFocus && previousFocus) {
      this.#focusRestore?.destroy();
      // Wait for the component and its shell consumer to remove inert before returning focus.
      this.#focusRestore = afterNextRender(
        () => {
          this.#focusRestore = null;
          if (!this.opened() && previousFocus.isConnected && !previousFocus.closest('[inert]')) {
            previousFocus.focus();
          }
        },
        { injector: this.#injector }
      );
    }
  }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  moveActive(delta: number, event: Event): void {
    event.preventDefault();
    const count = this.displayedResults().length;
    if (!count) return;
    this.activeIndex.update(current => (current + delta + count) % count);
    queueMicrotask(() => this.#document.getElementById(this.activeOptionId() ?? '')?.scrollIntoView({ block: 'nearest' }));
  }

  openActive(event: Event): void {
    event.preventDefault();
    const result = this.displayedResults()[this.activeIndex()];
    if (result) this.navigate(result);
  }

  navigate(result: DocsSearchResult): void {
    const version = this.#versions.selectedVersion() ?? 'latest';
    const availability = resolveDocsPageAvailability(result.page, this.publishedDocIds());
    const metadata = resolveMetadata(result, this.query(), this.publishedTitles(), availability);
    const exampleIsDestination = availability === 'live-demo' || metadata.kind === 'example';
    const tab = exampleIsDestination ? 'examples' : 'overview';
    const matchedExample =
      metadata.kind === 'example' ? result.page.examples.find(example => includesQuery(example.title, this.query())) : undefined;
    const fragment = metadata.kind === 'example' ? matchedExample?.id : undefined;
    this.closeSearch(false);
    void this.#router.navigate(['/v', version, result.page.category, result.page.slug, tab], { fragment });
  }

  #trapFocus(event: KeyboardEvent): void {
    const dialog = this.searchDialog()?.nativeElement;
    const focusable = [
      ...(dialog?.querySelectorAll<HTMLElement>('input, button:not([disabled]):not([tabindex="-1"]), a[href]:not([tabindex="-1"])') ?? []),
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!dialog?.contains(this.#document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    } else if (event.shiftKey && this.#document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && this.#document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}
