import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import Prism from 'prismjs';
import { toMarkdownAnchor, toMarkdownBlocks } from '../core/markdown-parser';

interface MarkdownBlockView {
  readonly kind: 'heading' | 'paragraph' | 'quote' | 'list' | 'code' | 'table';
  readonly level?: number;
  readonly id?: string;
  readonly html?: string;
  readonly ordered?: boolean;
  readonly items?: readonly string[];
  readonly language?: string;
  readonly code?: string;
  readonly headers?: readonly string[];
  readonly rows?: readonly (readonly string[])[];
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderInlineMarkdown(value: string, baseUrl: string | null): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)]\(#([^\s)]+)\)/g, (_match, label: string, fragment: string) =>
      `<a href="#${toMarkdownAnchor(fragment)}">${label}</a>`)
    .replace(/\[([^\]]+)]\(((?:\.\.?\/|\/)[^\s)]+)\)/g, (match, label: string, target: string) => {
      if (!baseUrl) return match;
      const href = escapeHtml(new URL(target, baseUrl).toString());
      return `<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`;
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
  template: `
    <div class="docs-markdown" lang="vi">
      @for (block of blocks(); track $index) {
        @switch (block.kind) {
          @case ('heading') {
            @if ((block.level ?? 3) <= 3) {
              <h3 [id]="block.id" [innerHTML]="block.html"></h3>
            } @else {
              <h4 [id]="block.id" [innerHTML]="block.html"></h4>
            }
          }
          @case ('paragraph') { <p [innerHTML]="block.html"></p> }
          @case ('quote') { <blockquote [innerHTML]="block.html"></blockquote> }
          @case ('list') {
            @if (block.ordered) {
              <ol>@for (item of block.items; track $index) { <li [innerHTML]="item"></li> }</ol>
            } @else {
              <ul>@for (item of block.items; track $index) { <li [innerHTML]="item"></li> }</ul>
            }
          }
          @case ('code') {
            <div class="docs-code">
              <div class="docs-code__toolbar">
                <span>{{ block.language || 'text' }}</span>
                <button type="button" aria-label="Copy code block" (click)="copy(block.code ?? '')">Copy</button>
              </div>
              <pre tabindex="0" aria-label="Scrollable code block"><code [class]="'language-' + (block.language || 'text')" [innerHTML]="block.html"></code></pre>
            </div>
          }
          @case ('table') {
            <div class="docs-table-wrap" tabindex="0" aria-label="Scrollable API table">
              <table>
                <thead><tr>@for (header of block.headers; track $index) { <th scope="col" [innerHTML]="header"></th> }</tr></thead>
                <tbody>
                  @for (row of block.rows; track $index) {
                    <tr>@for (cell of row; track $index) { <td [innerHTML]="cell"></td> }</tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    </div>
  `,
  styleUrl: './markdown-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownRendererComponent {
  readonly #document = inject(DOCUMENT);
  readonly markdown = input('');
  readonly linkBaseUrl = input<string | null>(null);
  readonly blocks = computed<readonly MarkdownBlockView[]>(() =>
    toMarkdownBlocks(this.markdown()).map((block): MarkdownBlockView => {
      const renderInline = (value: string): string => renderInlineMarkdown(value, this.linkBaseUrl());
      switch (block.kind) {
        case 'heading':
          return { kind: block.kind, level: block.level, id: block.id, html: renderInline(block.text) };
        case 'paragraph':
        case 'quote':
          return { kind: block.kind, html: renderInline(block.text) };
        case 'list':
          return { kind: block.kind, ordered: block.ordered, items: block.items.map(renderInline) };
        case 'code':
          return { ...block, html: highlightCode(block.code, block.language) };
        case 'table':
          return {
            kind: block.kind,
            headers: block.headers.map(renderInline),
            rows: block.rows.map((row) => row.map(renderInline)),
          };
      }
    }),
  );

  copy(code: string): void {
    const write = this.#document.defaultView?.navigator.clipboard?.writeText(code);
    if (write) void write.catch(() => undefined);
  }
}
