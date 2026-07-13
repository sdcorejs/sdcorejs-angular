import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { DocPageDefinition } from '../core/documentation.models';

@Component({
  selector: 'docs-api-summary',
  standalone: true,
  template: `
    <section class="api-summary" aria-label="API identity">
      @if (page().selector) {
        <div>
          <span>Selector</span><code>{{ page().selector }}</code
          ><button type="button" [attr.aria-label]="'Copy selector ' + page().selector" (click)="copy(page().selector ?? '', 'Selector')">
            Copy
          </button>
        </div>
      }
      <div>
        <span>Import path</span><code>{{ page().importPath }}</code
        ><button type="button" aria-label="Copy import path" (click)="copy(page().importPath, 'Import path')">Copy</button>
      </div>
      @for (entry of displayMetadata(); track entry[0]) {
        <div>
          <span>{{ entry[0] }}</span
          ><code>{{ entry[1] }}</code>
        </div>
      }
    </section>
    <span class="docs-visually-hidden" role="status" aria-live="polite" aria-atomic="true">{{ copyAnnouncement() }}</span>
  `,
  styles: [
    `
      .api-summary {
        display: grid;
        gap: 8px;
        margin-bottom: 20px;
      }
      .api-summary div {
        display: grid;
        grid-template-columns: minmax(100px, 160px) minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        border: 1px solid var(--docs-border-color);
        border-radius: 8px;
        padding: 9px 12px;
      }
      .api-summary span {
        color: var(--docs-text-muted);
        font-size: 12px;
      }
      .api-summary code {
        overflow-wrap: anywhere;
      }
      .api-summary button {
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--sd-primary, #005cbb);
        cursor: pointer;
      }
      @media (max-width: 680px) {
        .api-summary div {
          grid-template-columns: 1fr auto;
        }
        .api-summary span {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsApiSummaryComponent {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly page = input.required<DocPageDefinition>();
  readonly metadata = input<readonly (readonly [string, string])[]>([]);
  readonly copyAnnouncement = signal('');
  readonly displayMetadata = computed(() =>
    this.metadata()
      .filter(([key]) => !['selector', 'importpath'].includes(key.toLowerCase().replace(/[^a-z]/g, '')))
      .map(
        ([key, value]) =>
          [
            key,
            value
              .replace(/`([^`]+)`/g, '$1')
              .replace(/\*\*([^*]+)\*\*/g, '$1')
              .replace(/\*([^*]+)\*/g, '$1')
              .replace(/\[([^\]]+)]\([^)]+\)/g, '$1'),
          ] as const
      )
  );
  #copyRequestId = 0;
  #copyResetTimeout: number | undefined;

  constructor() {
    this.#destroyRef.onDestroy(() => {
      this.#copyRequestId += 1;
      this.#clearCopyAnnouncement();
    });
  }

  async copy(value: string, label: 'Selector' | 'Import path'): Promise<void> {
    const requestId = ++this.#copyRequestId;
    this.#clearCopyAnnouncement();
    const clipboard = this.#document.defaultView?.navigator.clipboard;
    if (!clipboard) {
      this.#showCopyAnnouncement(`Clipboard is unavailable. Copy the ${label.toLocaleLowerCase()} manually.`, requestId);
      return;
    }

    try {
      await clipboard.writeText(value);
      this.#showCopyAnnouncement(`${label} copied to clipboard.`, requestId);
    } catch {
      this.#showCopyAnnouncement(`${label} could not be copied.`, requestId);
    }
  }

  #showCopyAnnouncement(message: string, requestId: number): void {
    if (requestId !== this.#copyRequestId) return;
    this.copyAnnouncement.set(message);
    this.#copyResetTimeout = this.#document.defaultView?.setTimeout(() => {
      if (requestId === this.#copyRequestId) this.copyAnnouncement.set('');
      this.#copyResetTimeout = undefined;
    }, 1600);
  }

  #clearCopyAnnouncement(): void {
    if (this.#copyResetTimeout !== undefined) {
      this.#document.defaultView?.clearTimeout(this.#copyResetTimeout);
      this.#copyResetTimeout = undefined;
    }
    this.copyAnnouncement.set('');
  }
}
