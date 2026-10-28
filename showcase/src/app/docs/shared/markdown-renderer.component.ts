import { DOCUMENT, Location, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { Params, Router } from '@angular/router';
import Prism from 'prismjs';
import { toMarkdownAnchor, toMarkdownBlocks } from '../core/markdown-parser';
import { DOC_PAGES } from '../core/documentation.registry';
import { MarkdownAlertType, MarkdownBlock } from '../core/published-docs.models';
import { buildDocsFragmentHref } from './docs-fragment-link.directive';

interface MarkdownListItemView {
  readonly html: string;
  readonly blocks: readonly MarkdownBlockView[];
}

interface MarkdownBlockView {
  readonly kind: 'heading' | 'paragraph' | 'quote' | 'alert' | 'list' | 'code' | 'table';
  readonly level?: number;
  readonly id?: string;
  readonly html?: string;
  readonly alertType?: MarkdownAlertType;
  readonly title?: string;
  readonly paragraphs?: readonly string[];
  readonly ordered?: boolean;
  readonly items?: readonly MarkdownListItemView[];
  readonly language?: string;
  readonly code?: string;
  readonly headers?: readonly string[];
  readonly rows?: readonly (readonly string[])[];
}

const ALERT_TITLES: Readonly<Record<MarkdownAlertType, string>> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

interface InternalDocsLink {
  readonly href: string;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function decodeMarkdownLinkTarget(target: string): string {
  return target.replace(/&amp;/g, '&');
}

function decodeUrlComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePublishedDocId(value: string): string {
  return decodeUrlComponent(value)
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '');
}

function publishedDocBasename(value: string): string {
  return normalizePublishedDocId(value).split('/').at(-1)?.toLowerCase() ?? '';
}

function toRouterQueryParams(searchParams: URLSearchParams): Params {
  const queryParams: Params = {};
  searchParams.forEach((_value, key) => {
    if (Object.prototype.hasOwnProperty.call(queryParams, key)) return;
    const values = searchParams.getAll(key);
    queryParams[key] = values.length === 1 ? values[0] : values;
  });
  return queryParams;
}

function renderInlineMarkdown(
  value: string,
  baseUrl: string | null,
  pathname: string,
  search: string,
  resolveInternalLink: (target: string) => InternalDocsLink | null
): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)]\(#([^\s)]+)\)/g, (_match, label: string, fragment: string) => {
      const href = escapeHtml(buildDocsFragmentHref(pathname, search, toMarkdownAnchor(fragment)));
      return `<a href="${href}">${label}</a>`;
    })
    .replace(/\[([^\]]+)]\(((?:\.\.?\/|\/)[^\s)]+)\)/g, (match, label: string, target: string) => {
      const decodedTarget = decodeMarkdownLinkTarget(target);
      const internalLink = resolveInternalLink(decodedTarget);
      if (internalLink) {
        return `<a class="docs-markdown__internal-link" href="${escapeHtml(internalLink.href)}">${label}</a>`;
      }
      if (!baseUrl) return match;
      try {
        const href = escapeHtml(new URL(decodedTarget, baseUrl).toString());
        return `<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`;
      } catch {
        return match;
      }
    })
    .replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function highlightCode(code: string, language: string): string {
  const languageAliases: Readonly<Record<string, string>> = {
    html: 'markup',
    scss: 'css',
    sass: 'css',
    ts: 'javascript',
    typescript: 'javascript',
  };
  const grammarName = languageAliases[language] ?? (language || 'plain');
  const grammar = Prism.languages[grammarName] ?? Prism.languages['plain'];
  return grammar ? Prism.highlight(code, grammar, grammarName) : escapeHtml(code);
}

@Component({
  selector: 'docs-markdown-renderer',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="docs-markdown" [attr.lang]="language()" (click)="onMarkdownClick($event)">
      <span class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{{ copyAnnouncement() }}</span>
      <ng-container *ngTemplateOutlet="blockList; context: { $implicit: blocks() }"></ng-container>
    </div>

    <!-- why: list items hold nested lists, code and paragraphs, so the blocks render recursively. -->
    <ng-template #blockList let-blocks>
      @for (block of blocks; track $index) {
        @switch (block.kind) {
          @case ('heading') {
            @if ((block.level ?? 3) <= 3) {
              <h3 [id]="block.id" [innerHTML]="block.html"></h3>
            } @else {
              <h4 [id]="block.id" [innerHTML]="block.html"></h4>
            }
          }
          @case ('paragraph') {
            <p [innerHTML]="block.html"></p>
          }
          @case ('quote') {
            <blockquote [innerHTML]="block.html"></blockquote>
          }
          @case ('alert') {
            <div class="docs-alert" [attr.data-alert]="block.alertType" role="note" [attr.aria-label]="block.title">
              <p class="docs-alert__title" aria-hidden="true">{{ block.title }}</p>
              @for (paragraph of block.paragraphs; track $index) {
                <p [innerHTML]="paragraph"></p>
              }
            </div>
          }
          @case ('list') {
            @if (block.ordered) {
              <ol>
                @for (item of block.items; track $index) {
                  <li>
                    <span [innerHTML]="item.html"></span>
                    @if (item.blocks.length) {
                      <ng-container *ngTemplateOutlet="blockList; context: { $implicit: item.blocks }"></ng-container>
                    }
                  </li>
                }
              </ol>
            } @else {
              <ul>
                @for (item of block.items; track $index) {
                  <li>
                    <span [innerHTML]="item.html"></span>
                    @if (item.blocks.length) {
                      <ng-container *ngTemplateOutlet="blockList; context: { $implicit: item.blocks }"></ng-container>
                    }
                  </li>
                }
              </ul>
            }
          }
          @case ('code') {
            <div class="docs-code">
              <div class="docs-code__toolbar">
                <span>{{ block.language || 'text' }}</span>
                <button type="button" aria-label="Copy code block" (click)="copy(block.code ?? '')">
                  {{ copyLabel(block.code ?? '') }}
                </button>
              </div>
              <pre
                tabindex="0"
                aria-label="Scrollable code block"><code [class]="'language-' + (block.language || 'text')" [innerHTML]="block.html"></code></pre>
            </div>
          }
          @case ('table') {
            <div class="docs-table-wrap" tabindex="0" aria-label="Scrollable API table">
              <table>
                <thead>
                  <tr>
                    @for (header of block.headers; track $index) {
                      <th scope="col" [innerHTML]="header"></th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of block.rows; track $index) {
                    <tr>
                      @for (cell of row; track $index) {
                        <td [innerHTML]="cell"></td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    </ng-template>
  `,
  styleUrl: './markdown-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownRendererComponent {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #location = inject(Location);
  readonly #router = inject(Router);
  readonly markdown = input('');
  readonly linkBaseUrl = input<string | null>(null);
  readonly version = input<string | null>(null);
  readonly sourcePublishedDocId = input<string | null>(null);
  readonly language = input<string | null>(null);
  /** Prepended to heading ids, so a page that renders several documents keeps them unique. */
  readonly headingIdPrefix = input('');
  readonly copyResult = signal<{ readonly code: string; readonly status: 'success' | 'error' } | null>(null);
  readonly copyAnnouncement = computed(() => {
    const result = this.copyResult();
    if (result?.status === 'success') return 'Code block copied to clipboard.';
    if (result?.status === 'error') return 'Code block could not be copied.';
    return '';
  });
  readonly blocks = computed<readonly MarkdownBlockView[]>(() => {
    const renderInline = (value: string): string =>
      renderInlineMarkdown(value, this.linkBaseUrl(), this.#document.location.pathname, this.#document.location.search, target =>
        this.#resolveInternalDocsLink(target)
      );
    const idPrefix = this.headingIdPrefix();
    const toView = (block: MarkdownBlock): MarkdownBlockView => {
      switch (block.kind) {
        case 'heading':
          return { kind: block.kind, level: block.level, id: `${idPrefix}${block.id}`, html: renderInline(block.text) };
        case 'paragraph':
        case 'quote':
          return { kind: block.kind, html: renderInline(block.text) };
        case 'alert':
          return {
            kind: block.kind,
            alertType: block.alertType,
            title: ALERT_TITLES[block.alertType],
            paragraphs: block.paragraphs.map(renderInline),
          };
        case 'list':
          return {
            kind: block.kind,
            ordered: block.ordered,
            items: block.items.map(item => ({ html: renderInline(item.text), blocks: item.blocks.map(toView) })),
          };
        case 'code':
          return { ...block, html: highlightCode(block.code, block.language) };
        case 'table':
          return {
            kind: block.kind,
            headers: block.headers.map(renderInline),
            rows: block.rows.map(row => row.map(renderInline)),
          };
      }
    };
    return toMarkdownBlocks(this.markdown()).map(toView);
  });
  #copyRequestId = 0;
  #copyResetTimeout: number | undefined;

  constructor() {
    this.#destroyRef.onDestroy(() => {
      this.#copyRequestId += 1;
      this.#clearCopyResult();
    });
  }

  #resolveInternalDocsLink(target: string): InternalDocsLink | null {
    const version = this.version()?.trim();
    const sourcePublishedDocId = this.sourcePublishedDocId()?.trim();
    if (!version || !sourcePublishedDocId) return null;

    let resolvedTarget: URL;
    try {
      const sourceId = normalizePublishedDocId(sourcePublishedDocId);
      resolvedTarget = new URL(target, `https://published-doc.invalid/${sourceId}.md`);
    } catch {
      return null;
    }

    const normalizedTargetId = normalizePublishedDocId(resolvedTarget.pathname);
    const exactPage = DOC_PAGES.find(
      page => page.publishedDocId !== null && normalizePublishedDocId(page.publishedDocId) === normalizedTargetId
    );

    let routeCommands: string[] | null = exactPage ? ['/v', version, exactPage.category, exactPage.slug, 'overview'] : null;

    if (!routeCommands && resolvedTarget.pathname.endsWith('/') && publishedDocBasename(normalizedTargetId) === 'forms') {
      routeCommands = ['/v', version, 'forms'];
    }

    if (!routeCommands) {
      const targetBasename = publishedDocBasename(normalizedTargetId);
      const basenameMatches = DOC_PAGES.filter(
        page => page.publishedDocId !== null && publishedDocBasename(page.publishedDocId) === targetBasename
      );
      if (basenameMatches.length === 1) {
        const [page] = basenameMatches;
        routeCommands = ['/v', version, page.category, page.slug, 'overview'];
      }
    }

    if (!routeCommands) return null;

    const fragment = resolvedTarget.hash ? decodeUrlComponent(resolvedTarget.hash.slice(1)) : undefined;
    const tree = this.#router.createUrlTree(routeCommands, {
      queryParams: toRouterQueryParams(resolvedTarget.searchParams),
      fragment,
    });
    const routerUrl = this.#router.serializeUrl(tree);
    return {
      href: this.#location.prepareExternalUrl(routerUrl),
    };
  }

  onMarkdownClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a.docs-markdown__internal-link');
    const href = link?.getAttribute('href');
    if (!href) return;
    event.preventDefault();
    void this.#router.navigateByUrl(this.#location.normalize(href));
  }

  copyLabel(code: string): string {
    const result = this.copyResult();
    if (result?.code !== code) return 'Copy';
    return result.status === 'success' ? 'Copied' : 'Copy failed';
  }

  async copy(code: string): Promise<void> {
    const requestId = ++this.#copyRequestId;
    this.#clearCopyResult();
    try {
      const clipboard = this.#document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard unavailable');
      await clipboard.writeText(code);
      if (requestId !== this.#copyRequestId) return;
      this.copyResult.set({ code, status: 'success' });
    } catch {
      if (requestId !== this.#copyRequestId) return;
      this.copyResult.set({ code, status: 'error' });
    }
    this.#copyResetTimeout = this.#document.defaultView?.setTimeout(() => {
      if (requestId === this.#copyRequestId) this.copyResult.set(null);
      this.#copyResetTimeout = undefined;
    }, 1600);
  }

  #clearCopyResult(): void {
    if (this.#copyResetTimeout !== undefined) {
      this.#document.defaultView?.clearTimeout(this.#copyResetTimeout);
      this.#copyResetTimeout = undefined;
    }
    this.copyResult.set(null);
  }
}
