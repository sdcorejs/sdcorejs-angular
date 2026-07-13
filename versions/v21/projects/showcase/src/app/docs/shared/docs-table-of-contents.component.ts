import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface DocsTocItem {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'docs-table-of-contents',
  standalone: true,
  host: {
    '[class.docs-toc-host--inline]': 'mode() === "inline"',
    '[class.docs-toc-host--aside]': 'mode() === "aside"',
  },
  template: `
    @if (mode() === 'inline') {
      <details class="toc-inline">
        <summary>On this page</summary>
        <nav aria-label="On this page">
          @for (item of items(); track item.id) { <a [href]="'#' + item.id">{{ item.label }}</a> }
        </nav>
      </details>
    } @else {
      <aside class="toc" aria-label="On this page">
        <strong>On this page</strong>
        @for (item of items(); track item.id) { <a [href]="'#' + item.id">{{ item.label }}</a> }
      </aside>
    }
  `,
  styles: [`
    :host { min-width: 0; }
    :host(.docs-toc-host--inline) { display: none; }
    .toc { position: sticky; top: calc(var(--docs-header-height) + 24px); display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - var(--docs-header-height) - 48px); overflow-y: auto; align-self: start; border-left: 1px solid var(--docs-border-color); padding-left: 18px; }
    .toc strong { margin-bottom: 4px; font-size: 12px; text-transform: uppercase; }
    .toc a { color: var(--docs-text-muted); font-size: 12px; line-height: 1.4; }
    .toc-inline { margin-top: 16px; border: 1px solid var(--docs-border-color); border-radius: 9px; background: var(--docs-surface-muted); padding: 10px 12px; }
    .toc-inline summary { cursor: pointer; font-weight: 600; }
    .toc-inline nav { display: grid; gap: 7px; padding-top: 10px; }
    @media (max-width: 1180px) {
      :host(.docs-toc-host--inline) { display: block; }
      :host(.docs-toc-host--aside) { display: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsTableOfContentsComponent {
  readonly items = input.required<readonly DocsTocItem[]>();
  readonly mode = input<'inline' | 'aside'>('aside');
}
