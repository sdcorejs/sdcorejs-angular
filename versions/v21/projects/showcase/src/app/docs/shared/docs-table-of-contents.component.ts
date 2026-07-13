import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { DocsFragmentLinkDirective } from './docs-fragment-link.directive';

export interface DocsTocItem {
  readonly id: string;
  readonly label: string;
  readonly level?: number;
}

interface DocsTocLink extends DocsTocItem {
  readonly depth: number;
}

interface DocsTocNode extends DocsTocLink {
  readonly children: DocsTocNode[];
}

@Component({
  selector: 'docs-table-of-contents',
  standalone: true,
  imports: [DocsFragmentLinkDirective, NgTemplateOutlet],
  host: {
    '[class.docs-toc-host--inline]': 'mode() === "inline"',
    '[class.docs-toc-host--aside]': 'mode() === "aside"',
  },
  template: `
    <ng-template #tocTree let-nodes>
      <ol>
        @for (link of nodes; track link.id) {
          <li>
            <a
              class="toc-link"
              [docsFragmentLink]="link.id"
              [attr.data-depth]="link.depth"
              [attr.aria-current]="activeId() === link.id ? 'location' : null"
              [class.active]="activeId() === link.id"
              (click)="activeId.set(link.id)"
              >{{ link.label }}</a
            >
            @if (link.children.length) {
              <ng-container [ngTemplateOutlet]="tocTree" [ngTemplateOutletContext]="{ $implicit: link.children }"></ng-container>
            }
          </li>
        }
      </ol>
    </ng-template>

    @if (mode() === 'inline') {
      <details class="toc-inline">
        <summary>On this page</summary>
        <nav aria-label="On this page">
          <ng-container [ngTemplateOutlet]="tocTree" [ngTemplateOutletContext]="{ $implicit: tree() }"></ng-container>
        </nav>
      </details>
    } @else {
      <aside class="toc" aria-label="On this page">
        <strong>On this page</strong>
        <ng-container [ngTemplateOutlet]="tocTree" [ngTemplateOutletContext]="{ $implicit: tree() }"></ng-container>
      </aside>
    }
  `,
  styles: [
    `
      :host {
        min-width: 0;
      }
      :host(.docs-toc-host--inline) {
        display: none;
      }
      .toc {
        position: sticky;
        top: calc(var(--docs-header-height) + 24px);
        max-height: calc(100vh - var(--docs-header-height) - 48px);
        overflow-y: auto;
        overscroll-behavior: contain;
        align-self: start;
        border-left: 1px solid var(--docs-border-color);
        padding: 0 6px 4px 18px;
        scrollbar-gutter: stable;
      }
      .toc strong {
        display: block;
        margin-bottom: 8px;
        font-size: 12px;
        text-transform: uppercase;
      }
      ol {
        display: grid;
        gap: 3px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      ol ol {
        margin-inline-start: 12px;
      }
      .toc-link {
        display: flex;
        align-items: center;
        min-height: 44px;
        border-left: 2px solid transparent;
        border-radius: 0 6px 6px 0;
        padding: 5px 6px 5px 8px;
        color: var(--docs-text-muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .toc-link:hover {
        color: var(--docs-text);
        text-decoration: none;
      }
      .toc-link.active {
        border-left-color: var(--sd-primary, #005cbb);
        background: var(--sd-primary-light, #e8f1ff);
        color: var(--sd-primary, #005cbb);
        font-weight: 600;
      }
      .toc-inline {
        margin-top: 16px;
        border: 1px solid var(--docs-border-color);
        border-radius: 9px;
        background: var(--docs-surface-muted);
        padding: 0 12px;
      }
      .toc-inline summary {
        display: flex;
        align-items: center;
        min-height: 44px;
        cursor: pointer;
        font-weight: 600;
      }
      .toc-inline nav {
        max-height: 320px;
        overflow-y: auto;
        padding: 0 0 12px;
        scrollbar-gutter: stable;
      }
      @container docs-page (max-width: 1080px) {
        :host(.docs-toc-host--inline) {
          display: block;
        }
        :host(.docs-toc-host--aside) {
          display: none;
        }
      }
      @media (max-width: 1368px) {
        :host(.docs-toc-host--inline) {
          display: block;
        }
        :host(.docs-toc-host--aside) {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsTableOfContentsComponent {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly items = input.required<readonly DocsTocItem[]>();
  readonly mode = input<'inline' | 'aside'>('aside');
  readonly activeId = signal('');
  readonly links = computed<readonly DocsTocLink[]>(() => {
    const items = this.items();
    const baseLevel = Math.min(...items.map(item => item.level ?? 2));
    return items.map(item => {
      const depth = Math.max(0, (item.level ?? baseLevel) - baseLevel);
      return { ...item, depth };
    });
  });
  readonly tree = computed<readonly DocsTocNode[]>(() => {
    const roots: DocsTocNode[] = [];
    const stack: DocsTocNode[] = [];
    for (const link of this.links()) {
      const node: DocsTocNode = { ...link, children: [] };
      while (stack.length && stack.at(-1)!.depth >= node.depth) stack.pop();
      const parent = stack.at(-1);
      (parent?.children ?? roots).push(node);
      stack.push(node);
    }
    return roots;
  });

  constructor() {
    const updateActiveSection = () => this.#updateActiveSection();
    this.#document.addEventListener('scroll', updateActiveSection, { passive: true });
    this.#document.defaultView?.addEventListener('scroll', updateActiveSection, { passive: true });
    this.#document.defaultView?.addEventListener('resize', updateActiveSection, { passive: true });
    this.#destroyRef.onDestroy(() => {
      this.#document.removeEventListener('scroll', updateActiveSection);
      this.#document.defaultView?.removeEventListener('scroll', updateActiveSection);
      this.#document.defaultView?.removeEventListener('resize', updateActiveSection);
    });

    effect(() => {
      const links = this.links();
      if (!links.some(link => link.id === this.activeId())) this.activeId.set(links[0]?.id ?? '');
      queueMicrotask(updateActiveSection);
    });
  }

  #updateActiveSection(): void {
    const links = this.links();
    if (!links.length) return;

    const threshold = 112;
    let current = links[0].id;
    for (const link of links) {
      const target = this.#document.getElementById(link.id);
      if (target && target.getBoundingClientRect().top <= threshold) current = link.id;
    }
    this.activeId.set(current);
  }
}
