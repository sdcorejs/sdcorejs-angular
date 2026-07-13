import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DocPageDefinition } from '../core/documentation.models';

@Component({
  selector: 'docs-api-summary',
  standalone: true,
  template: `
    <section class="api-summary" aria-label="API identity">
      @if (page().selector) {
        <div><span>Selector</span><code>{{ page().selector }}</code><button type="button" (click)="copy(page().selector ?? '')">Copy</button></div>
      }
      <div><span>Import path</span><code>{{ page().importPath }}</code><button type="button" (click)="copy(page().importPath)">Copy</button></div>
      @for (entry of displayMetadata(); track entry[0]) { <div><span>{{ entry[0] }}</span><code>{{ entry[1] }}</code></div> }
    </section>
  `,
  styles: [`
    .api-summary { display: grid; gap: 8px; margin-bottom: 20px; }
    .api-summary div { display: grid; grid-template-columns: minmax(100px, 160px) minmax(0, 1fr) auto; gap: 10px; align-items: center; border: 1px solid var(--docs-border-color); border-radius: 8px; padding: 9px 12px; }
    .api-summary span { color: var(--docs-text-muted); font-size: 12px; }
    .api-summary code { overflow-wrap: anywhere; }
    .api-summary button { border: 0; background: transparent; color: var(--sd-primary, #005cbb); cursor: pointer; }
    @media (max-width: 680px) {
      .api-summary div { grid-template-columns: 1fr auto; }
      .api-summary span { grid-column: 1 / -1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsApiSummaryComponent {
  readonly #document = inject(DOCUMENT);
  readonly page = input.required<DocPageDefinition>();
  readonly metadata = input<readonly (readonly [string, string])[]>([]);
  readonly displayMetadata = computed(() => this.metadata()
    .filter(([key]) => !['selector', 'importpath'].includes(key.toLowerCase().replace(/[^a-z]/g, '')))
    .map(([key, value]) => [key, value
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')] as const));

  copy(value: string): void {
    const write = this.#document.defaultView?.navigator.clipboard?.writeText(value);
    if (write) void write.catch(() => undefined);
  }
}
