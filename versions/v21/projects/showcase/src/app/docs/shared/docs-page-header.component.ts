import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocPageDefinition } from '../core/documentation.models';

@Component({
  selector: 'docs-page-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    @let currentPage = page();
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a routerLink="/">Docs</a><span>/</span> <a [routerLink]="['/v', version()]">v{{ version() }}</a
      ><span>/</span> <span>{{ currentPage.category }}</span
      ><span>/</span><span>{{ currentPage.title }}</span>
    </nav>

    @if (invalidVersion(); as invalid) {
      <div class="version-notice" role="status">Version “{{ invalid }}” is unavailable. Showing v{{ version() }} instead.</div>
    }

    <header class="page-header">
      <div>
        <div class="page-header__badges">
          <span>{{ currentPage.category }}</span>
          @if (currentPage.status !== 'stable') {
            <span>{{ currentPage.status }}</span>
          }
        </div>
        <h1>{{ currentPage.title }}</h1>
        <p lang="vi">{{ currentPage.description }}</p>
        @if (showIdentity()) {
          <div class="page-header__identity" aria-label="Component identity">
            @if (currentPage.selector) {
              <div>
                <span>Selector</span><code>{{ currentPage.selector }}</code
                ><button
                  type="button"
                  [attr.aria-label]="'Copy selector ' + currentPage.selector"
                  (click)="copy(currentPage.selector, 'Selector')">
                  Copy
                </button>
              </div>
            }
            <div>
              <span>Import</span><code>{{ currentPage.importPath }}</code
              ><button type="button" aria-label="Copy import path" (click)="copy(currentPage.importPath, 'Import path')">Copy</button>
            </div>
          </div>
        }
        <span class="docs-visually-hidden" role="status" aria-live="polite" aria-atomic="true">{{ copyAnnouncement() }}</span>
      </div>
      @if (sourceUrl(); as url) {
        <a [href]="url" target="_blank" rel="noreferrer">View demo source</a>
      }
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .breadcrumbs {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-bottom: 20px;
        color: var(--docs-text-muted);
        font-size: 12px;
        text-transform: capitalize;
      }
      .version-notice {
        margin-bottom: 18px;
        border: 1px solid var(--sd-info, #0288d1);
        border-radius: 9px;
        background: color-mix(in srgb, var(--sd-info, #0288d1) 9%, var(--docs-surface));
        padding: 11px 14px;
        color: var(--docs-text-secondary);
        font-size: 13px;
      }
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
      }
      .page-header h1 {
        margin: 8px 0 9px;
        font-size: clamp(34px, 5vw, 52px);
      }
      .page-header p {
        max-width: 760px;
        margin: 0;
        color: var(--docs-text-secondary);
        font-size: 17px;
        line-height: 1.65;
      }
      .page-header > a {
        display: inline-flex;
        align-items: center;
        min-height: 44px;
        white-space: nowrap;
      }
      .page-header__badges {
        display: flex;
        gap: 6px;
      }
      .page-header__badges span {
        border-radius: 999px;
        background: var(--docs-surface-muted);
        padding: 4px 8px;
        color: var(--docs-text-secondary);
        font-size: 11px;
        text-transform: uppercase;
      }
      .page-header__identity {
        display: grid;
        gap: 6px;
        max-width: 760px;
        margin-top: 18px;
      }
      .page-header__identity > div {
        display: grid;
        grid-template-columns: 70px minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--docs-border-color);
        border-radius: 8px;
        background: var(--docs-surface-muted);
        padding: 5px 7px 5px 10px;
      }
      .page-header__identity span {
        color: var(--docs-text-muted);
        font-size: 11px;
        text-transform: uppercase;
      }
      .page-header__identity code {
        overflow-wrap: anywhere;
        color: var(--docs-text);
        font-size: 12px;
      }
      .page-header__identity button {
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--sd-primary, #005cbb);
        cursor: pointer;
      }
      @media (max-width: 680px) {
        .page-header {
          flex-direction: column;
        }
      }
      @media (max-width: 520px) {
        .page-header__identity > div {
          grid-template-columns: minmax(0, 1fr) auto;
        }
        .page-header__identity span {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsPageHeaderComponent {
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly page = input.required<DocPageDefinition>();
  readonly version = input.required<string>();
  readonly invalidVersion = input<string | null>(null);
  readonly sourceUrl = input<string | null>(null);
  readonly showIdentity = input(false);
  readonly copyAnnouncement = signal('');
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
