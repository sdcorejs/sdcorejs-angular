import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DocsI18nService } from '../core/docs-i18n.service';
import { DocsFragmentLinkDirective } from './docs-fragment-link.directive';

export interface DocsTocItem {
  readonly id: string;
  readonly label: string;
  readonly level?: number;
}

interface DocsTocLink extends DocsTocItem {
  readonly depth: number;
}

/** Distance from the viewport top at which a section counts as current, and the offset used when jumping to it. */
export const DOCS_TOC_OFFSET_PX = 124;

/** Smooth scrolling, except for readers who asked the system for reduced motion. */
export function docsScrollBehavior(view: Window): ScrollBehavior {
  return view.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

const ISSUES_URL = 'https://github.com/sdcorejs/sdcorejs-angular/issues';

/** Sticky "On this page" column: scroll-spy over the page sections plus Edit / Report / Back to top. */
@Component({
  selector: 'docs-table-of-contents',
  standalone: true,
  imports: [DocsFragmentLinkDirective, MatIconModule],
  template: `
    @let t = i18n.t();
    <aside class="toc" [attr.aria-label]="t.onThisPage">
      <p class="toc__title" aria-hidden="true">{{ t.onThisPage }}</p>
      <nav class="toc__nav" [attr.aria-label]="t.onThisPage">
        @for (link of links(); track link.id) {
          <a
            class="toc-link"
            [docsFragmentLink]="link.id"
            [attr.data-depth]="link.depth"
            [style.padding-left.px]="14 + link.depth * 12"
            [attr.aria-current]="activeId() === link.id ? 'location' : null"
            [class.active]="activeId() === link.id"
            (click)="jump($event, link.id)"
            >{{ link.label }}</a
          >
        }
      </nav>
      <div class="toc__links">
        @if (editUrl(); as url) {
          <a [href]="url" target="_blank" rel="noopener noreferrer"><mat-icon aria-hidden="true">edit</mat-icon>{{ t.editPage }}</a>
        }
        @if (sourceUrl(); as url) {
          <a [href]="url" target="_blank" rel="noopener noreferrer"><mat-icon aria-hidden="true">code</mat-icon>{{ t.viewDemoSource }}</a>
        }
        <a [href]="issuesUrl" target="_blank" rel="noopener noreferrer"><mat-icon aria-hidden="true">bug_report</mat-icon>{{ t.reportIssue }}</a>
        <a [docsFragmentLink]="'docs-content'" (click)="backToTop($event)"><mat-icon aria-hidden="true">arrow_upward</mat-icon>{{ t.backToTop }}</a>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: none;
        min-width: 0;
      }
      .toc {
        position: sticky;
        top: 132px;
        max-height: calc(100vh - 150px);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-top: 4px;
      }
      .toc__title {
        margin: 0 0 10px;
        color: var(--docs-fg-3);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .toc__nav {
        display: grid;
        border-left: 1px solid var(--docs-line);
      }
      .toc-link {
        display: block;
        margin-left: -1px;
        border-left: 1px solid transparent;
        padding: 5px 0 5px 14px;
        color: var(--docs-fg-3);
        font-size: 13.5px;
        line-height: 1.4;
      }
      .toc-link:hover {
        color: var(--docs-fg);
        text-decoration: none;
      }
      .toc-link.active {
        border-left-color: var(--docs-acc);
        color: var(--docs-acc);
      }
      .toc__links {
        display: grid;
        gap: 10px;
        margin-top: 24px;
        border-top: 1px solid var(--docs-line);
        padding-top: 16px;
        font-size: 13px;
      }
      .toc__links a {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--docs-fg-3);
        cursor: pointer;
      }
      .toc__links a:hover {
        color: var(--docs-fg);
      }
      .toc__links mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
      @media (min-width: 1260px) {
        :host {
          display: block;
        }
      }
      @media (pointer: coarse) {
        .toc-link,
        .toc__links a {
          min-height: 44px;
          align-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsTableOfContentsComponent {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly i18n = inject(DocsI18nService);
  readonly issuesUrl = ISSUES_URL;
  readonly items = input.required<readonly DocsTocItem[]>();
  readonly editUrl = input<string | null>(null);
  readonly sourceUrl = input<string | null>(null);
  readonly activeId = signal('');
  readonly links = computed<readonly DocsTocLink[]>(() => {
    const items = this.items();
    const baseLevel = Math.min(...items.map(item => item.level ?? 2));
    return items.map(item => ({ ...item, depth: Math.max(0, (item.level ?? baseLevel) - baseLevel) }));
  });

  constructor() {
    const view = this.#document.defaultView;
    let frame = 0;
    const scheduleUpdate = () => {
      if (frame || !view) return;
      frame = view.requestAnimationFrame(() => {
        frame = 0;
        this.updateActiveSection();
      });
    };
    view?.addEventListener('scroll', scheduleUpdate, { passive: true });
    view?.addEventListener('resize', scheduleUpdate, { passive: true });
    this.#destroyRef.onDestroy(() => {
      view?.removeEventListener('scroll', scheduleUpdate);
      view?.removeEventListener('resize', scheduleUpdate);
      if (frame) view?.cancelAnimationFrame(frame);
    });

    effect(() => {
      const links = this.links();
      if (!links.some(link => link.id === untracked(this.activeId))) this.activeId.set(links[0]?.id ?? '');
      queueMicrotask(() => this.updateActiveSection());
    });
  }

  /** Smooth jump that leaves the section heading clear of the sticky header and tab bar. */
  jump(event: MouseEvent, id: string): void {
    const view = this.#document.defaultView;
    const target = this.#document.getElementById(id);
    this.activeId.set(id);
    if (!view || !target || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const top = target.getBoundingClientRect().top + view.scrollY - DOCS_TOC_OFFSET_PX;
    view.scrollTo({ top, behavior: docsScrollBehavior(view) });
    view.history.replaceState(view.history.state, '', (event.currentTarget as HTMLAnchorElement).getAttribute('href') ?? '');
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }

  backToTop(event: MouseEvent): void {
    event.preventDefault();
    const view = this.#document.defaultView;
    if (!view) return;
    view.scrollTo({ top: 0, behavior: docsScrollBehavior(view) });
    // why: focus follows the reader back to the top instead of staying in the table of contents.
    this.#document.getElementById('docs-content')?.focus({ preventScroll: true });
  }

  updateActiveSection(): void {
    const links = this.links();
    if (!links.length) return;
    let current = links[0].id;
    for (const link of links) {
      const target = this.#document.getElementById(link.id);
      if (target && target.getBoundingClientRect().top <= DOCS_TOC_OFFSET_PX + 1) current = link.id;
    }
    this.activeId.set(current);
  }
}
