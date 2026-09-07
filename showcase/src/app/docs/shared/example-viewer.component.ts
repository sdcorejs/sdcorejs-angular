import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  InjectionToken,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { DocExample } from '../core/documentation.models';
import type { ShowcaseExampleSource } from '../generated/example-sources.generated';
import { DocsFragmentLinkDirective } from './docs-fragment-link.directive';
import { ExamplePreviewComponent } from './example-preview.component';

type SourceTab = 'html' | 'typescript' | 'scss';
interface SourceTabOption {
  readonly id: SourceTab;
  readonly label: string;
}

const TABBABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');

type ExampleSourcesModule = typeof import('../generated/example-sources.generated');
export const SHOWCASE_EXAMPLE_SOURCE_LOADER = new InjectionToken<() => Promise<ExampleSourcesModule>>('SHOWCASE_EXAMPLE_SOURCE_LOADER', {
  providedIn: 'root',
  factory: () => () => import('../generated/example-sources.generated'),
});

@Component({
  selector: 'docs-example-viewer',
  standalone: true,
  imports: [DocsFragmentLinkDirective, ExamplePreviewComponent],
  template: `
    @let current = example();
    @if (previewExpanded()) {
      <div class="example-backdrop" aria-hidden="true" (click)="togglePreviewSize()"></div>
    }
    <article
      #dialogRoot
      class="example"
      [class.example--expanded]="previewExpanded()"
      [id]="current.id"
      [attr.role]="previewExpanded() ? 'dialog' : null"
      [attr.aria-modal]="previewExpanded() ? true : null"
      [attr.aria-labelledby]="current.id + '-title'">
      <header class="example__header">
        <div>
          <a class="example__anchor" [docsFragmentLink]="current.id" [attr.aria-label]="'Link to ' + current.title">#</a>
          <h2 [id]="current.id + '-title'" lang="vi">{{ current.title }}</h2>
          @if (displayDescription(); as description) {
            <p class="example__description" lang="vi">{{ description }}</p>
          }
        </div>
        <div class="example__actions">
          @if (interacted()) {
            <button type="button" aria-label="Reset live example" (click)="reset()">Reset</button>
          }
          <button
            #expandButton
            type="button"
            [attr.aria-controls]="current.id + '-preview'"
            [attr.aria-expanded]="previewExpanded()"
            [attr.aria-label]="previewExpanded() ? 'Collapse live example' : 'Expand live example'"
            (click)="togglePreviewSize()">
            {{ previewExpanded() ? 'Exit full width' : 'Full width' }}
          </button>
          <button
            type="button"
            [attr.aria-controls]="current.id + '-source'"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="expanded() ? 'Collapse source' : 'Expand source'"
            (click)="toggleSource()">
            {{ expanded() ? 'Hide source' : 'View source' }}
          </button>
        </div>
      </header>

      <div class="example__preview-shell" [class.example__preview-shell--scrollable]="hasHorizontalOverflow()">
        <div
          #preview
          class="example__preview"
          [id]="current.id + '-preview'"
          tabindex="0"
          aria-label="Live example preview"
          lang="vi"
          (click)="markInteracted()"
          (input)="markInteracted()"
          (change)="markInteracted()"
          (scroll)="updateScrollAffordance()">
          @if (current.activation === 'interaction') {
            @defer (on interaction) {
              <docs-example-preview [example]="current"></docs-example-preview>
            } @placeholder {
              <button class="example__load" type="button">Load live preview</button>
            }
          } @else {
            @defer (on viewport) {
              <docs-example-preview [example]="current"></docs-example-preview>
            } @placeholder {
              <p class="example__state">Loading preview...</p>
            }
          }
        </div>
        @if (showScrollHint()) {
          <span class="example__scroll-hint">Scroll horizontally to view the full demo</span>
        }
      </div>

      <section class="example__source" [id]="current.id + '-source'" aria-label="Example source code" [hidden]="!expanded()">
        @if (expanded()) {
          @let sourceErrorMessage = sourceError();
          @if (sourceLoading()) {
            <p class="example__state" role="status">Loading source…</p>
          } @else if (sourceErrorMessage) {
            <div class="example__source-error" role="alert">
              <p>{{ sourceErrorMessage }}</p>
              <button type="button" (click)="retrySource()">Retry source</button>
            </div>
          } @else {
            @if (source()) {
              <div class="example__source-toolbar">
                <div role="group" aria-label="Source language">
                  @for (tab of sourceTabs(); track tab.id) {
                    <button
                      type="button"
                      [attr.aria-pressed]="selectedTab() === tab.id"
                      [class.active]="selectedTab() === tab.id"
                      (click)="selectedTab.set(tab.id)">
                      {{ tab.label }}
                    </button>
                  }
                </div>
                <button type="button" aria-label="Copy source code" (click)="copySource()">{{ copyButtonLabel() }}</button>
                <span class="visually-hidden" role="status" aria-live="polite">{{ copyAnnouncement() }}</span>
              </div>
              <pre tabindex="0" aria-label="Scrollable example source"><code>{{ currentSource() }}</code></pre>
            } @else {
              <p class="example__state example__state--error">Source is not available for this example.</p>
            }
          }
        }
      </section>
    </article>
  `,
  styleUrl: './example-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleViewerComponent implements OnDestroy {
  readonly #document = inject(DOCUMENT);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #sourceLoader = inject(SHOWCASE_EXAMPLE_SOURCE_LOADER);
  readonly example = input.required<DocExample>();
  readonly livePreview = viewChild(ExamplePreviewComponent);
  readonly previewElement = viewChild<ElementRef<HTMLElement>>('preview');
  readonly dialogElement = viewChild<ElementRef<HTMLElement>>('dialogRoot');
  readonly expandButton = viewChild<ElementRef<HTMLButtonElement>>('expandButton');
  readonly expanded = signal(false);
  readonly previewExpanded = signal(false);
  readonly interacted = signal(false);
  readonly hasHorizontalOverflow = signal(false);
  readonly scrolledToEnd = signal(false);
  readonly sourceLoading = signal(false);
  readonly sourceError = signal<string | null>(null);
  readonly source = signal<ShowcaseExampleSource | null>(null);
  readonly selectedTab = signal<SourceTab>('html');
  readonly copyStatus = signal<'idle' | 'success' | 'error'>('idle');
  readonly copyButtonLabel = computed(() => {
    if (this.copyStatus() === 'success') return 'Copied';
    if (this.copyStatus() === 'error') return 'Copy failed';
    return 'Copy';
  });
  readonly copyAnnouncement = computed(() => {
    if (this.copyStatus() === 'success') return 'Source code copied to clipboard.';
    if (this.copyStatus() === 'error') return 'Source code could not be copied.';
    return '';
  });
  readonly sourceTabs = computed<readonly SourceTabOption[]>(() => {
    const source = this.source();
    if (!source) return [];
    const tabs: SourceTabOption[] = [
      { id: 'html', label: 'HTML' },
      { id: 'typescript', label: 'TypeScript' },
    ];
    if (source.scss) tabs.push({ id: 'scss', label: 'SCSS' });
    return tabs;
  });
  readonly currentSource = computed(() => this.source()?.[this.selectedTab()] ?? '');
  readonly displayDescription = computed(() => {
    const description = this.example().description.trim();
    if (!description || /preserved from the showcase/i.test(description) || description === this.example().title) return null;
    return description;
  });
  readonly showScrollHint = computed(() => this.hasHorizontalOverflow() && !this.scrolledToEnd());
  #previousBodyOverflow: string | null = null;
  #copyRequestId = 0;
  #copyResetTimeout: number | undefined;
  readonly #backgroundElementsMadeInert: HTMLElement[] = [];

  constructor() {
    effect(onCleanup => {
      this.livePreview();
      this.previewElement();
      this.previewExpanded();
      const view = this.#document.defaultView;
      const timeout = view?.setTimeout(() => this.updateScrollAffordance());
      if (timeout !== undefined) onCleanup(() => view?.clearTimeout(timeout));
    });
  }

  ngOnDestroy(): void {
    this.#copyRequestId += 1;
    this.#clearCopyFeedback();
    this.#restoreBackgroundInteraction();
    this.#restoreDocumentScroll();
  }

  async toggleSource(): Promise<void> {
    const next = !this.expanded();
    this.expanded.set(next);
    if (next && !this.source()) await this.#loadSource();
  }

  reset(): void {
    this.livePreview()?.reset();
    this.interacted.set(false);
    this.updateScrollAffordance();
  }

  markInteracted(): void {
    this.interacted.set(true);
  }

  togglePreviewSize(): void {
    const expanded = !this.previewExpanded();
    this.previewExpanded.set(expanded);
    if (expanded) {
      this.#lockDocumentScroll();
      this.#makeBackgroundInert();
      this.#document.defaultView?.setTimeout(() => {
        this.previewElement()?.nativeElement.focus();
        this.updateScrollAffordance();
      });
    } else {
      this.#closeExpandedPreview(true);
    }
  }

  updateScrollAffordance(): void {
    const preview = this.previewElement()?.nativeElement;
    if (!preview) return;
    const hasOverflow = preview.scrollWidth > preview.clientWidth + 1;
    this.hasHorizontalOverflow.set(hasOverflow);
    this.scrolledToEnd.set(!hasOverflow || preview.scrollLeft + preview.clientWidth >= preview.scrollWidth - 1);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.previewExpanded()) return;
    const target = event.target instanceof Element ? event.target : this.#document.activeElement;
    // why: overlay con sở hữu Escape/Tab; preview không được đóng hoặc giành focus của nó.
    if (event.defaultPrevented || target?.closest('.cdk-overlay-container, .sd-side-drawer')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.#closeExpandedPreview(true);
      return;
    }
    if (event.key !== 'Tab') return;

    const root = this.dialogElement()?.nativeElement;
    const focusable = root ? this.#getTabbableElements(root) : [];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (!root?.contains(this.#document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && this.#document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.#document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  @HostListener('window:resize')
  onViewportResize(): void {
    this.updateScrollAffordance();
  }

  #getTabbableElements(root: HTMLElement): HTMLElement[] {
    const view = this.#document.defaultView;
    return [...root.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)]
      .filter(element => {
        if (element.tabIndex < 0 || element.matches(':disabled, input[type="hidden"]')) return false;
        if (element.getAttribute('aria-disabled') === 'true') return false;
        if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
        const style = view?.getComputedStyle(element);
        if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') return false;
        return element.getClientRects().length > 0;
      })
      .sort((first, second) => {
        if (first.tabIndex === second.tabIndex) return 0;
        if (first.tabIndex === 0) return 1;
        if (second.tabIndex === 0) return -1;
        return first.tabIndex - second.tabIndex;
      });
  }

  async copySource(): Promise<void> {
    const requestId = ++this.#copyRequestId;
    this.#clearCopyFeedback();
    try {
      const clipboard = this.#document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard unavailable');
      await clipboard.writeText(this.currentSource());
      if (requestId !== this.#copyRequestId) return;
      this.copyStatus.set('success');
    } catch {
      if (requestId !== this.#copyRequestId) return;
      this.copyStatus.set('error');
    }
    this.#copyResetTimeout = this.#document.defaultView?.setTimeout(() => {
      if (requestId === this.#copyRequestId) this.copyStatus.set('idle');
      this.#copyResetTimeout = undefined;
    }, 1600);
  }

  retrySource(): void {
    void this.#loadSource();
  }

  async #loadSource(): Promise<void> {
    this.sourceLoading.set(true);
    this.sourceError.set(null);
    try {
      const module = await this.#sourceLoader();
      const key = this.example().sourceKey;
      this.source.set(module.SHOWCASE_EXAMPLE_SOURCES[key] ?? null);
      if (!this.source()) this.sourceError.set('Source is not registered for this example.');
      const tabs = this.sourceTabs();
      if (!tabs.some(tab => tab.id === this.selectedTab())) this.selectedTab.set(tabs[0]?.id ?? 'typescript');
    } catch {
      this.source.set(null);
      this.sourceError.set('The example source could not be loaded.');
    } finally {
      this.sourceLoading.set(false);
    }
  }

  #lockDocumentScroll(): void {
    if (this.#previousBodyOverflow !== null) return;
    this.#previousBodyOverflow = this.#document.body.style.overflow;
    this.#document.body.style.overflow = 'hidden';
  }

  #restoreDocumentScroll(): void {
    if (this.#previousBodyOverflow === null) return;
    this.#document.body.style.overflow = this.#previousBodyOverflow;
    this.#previousBodyOverflow = null;
  }

  #closeExpandedPreview(restoreFocus: boolean): void {
    this.previewExpanded.set(false);
    this.#restoreBackgroundInteraction();
    this.#restoreDocumentScroll();
    if (restoreFocus) this.expandButton()?.nativeElement.focus();
    this.updateScrollAffordance();
  }

  #clearCopyFeedback(): void {
    if (this.#copyResetTimeout !== undefined) {
      this.#document.defaultView?.clearTimeout(this.#copyResetTimeout);
      this.#copyResetTimeout = undefined;
    }
    this.copyStatus.set('idle');
  }

  #makeBackgroundInert(): void {
    if (this.#backgroundElementsMadeInert.length) return;
    let branch = this.#host.nativeElement;
    while (branch !== this.#document.body && branch.parentElement) {
      const parent = branch.parentElement;
      for (const sibling of parent.children) {
        if (sibling === branch || !(sibling instanceof HTMLElement) || sibling.hasAttribute('inert')) continue;
        // why: Core drawer tạo portal ở body trước khi mở; inert làm filter nhìn thấy nhưng không bấm được.
        if (sibling.matches('.cdk-overlay-container, .sd-side-drawer, .sd-side-drawer-backdrop')) continue;
        sibling.setAttribute('inert', '');
        this.#backgroundElementsMadeInert.push(sibling);
      }
      branch = parent;
    }
  }

  #restoreBackgroundInteraction(): void {
    for (const element of this.#backgroundElementsMadeInert.splice(0)) element.removeAttribute('inert');
  }
}
