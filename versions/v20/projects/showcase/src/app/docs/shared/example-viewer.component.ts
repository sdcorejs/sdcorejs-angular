import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, InjectionToken, input, signal, viewChild } from '@angular/core';
import { DocExample } from '../core/documentation.models';
import type { ShowcaseExampleSource } from '../generated/example-sources.generated';
import { ExamplePreviewComponent } from './example-preview.component';

type SourceTab = 'html' | 'typescript' | 'scss';
interface SourceTabOption { readonly id: SourceTab; readonly label: string; }

type ExampleSourcesModule = typeof import('../generated/example-sources.generated');
export const SHOWCASE_EXAMPLE_SOURCE_LOADER = new InjectionToken<() => Promise<ExampleSourcesModule>>(
  'SHOWCASE_EXAMPLE_SOURCE_LOADER',
  { providedIn: 'root', factory: () => () => import('../generated/example-sources.generated') },
);

@Component({
  selector: 'docs-example-viewer',
  standalone: true,
  imports: [ExamplePreviewComponent],
  template: `
    @let current = example();
    <article class="example" [id]="current.id">
      <header class="example__header">
        <div>
          <a class="example__anchor" [href]="'#' + current.id" [attr.aria-label]="'Link to ' + current.title">#</a>
          <h2 lang="vi">{{ current.title }}</h2>
          <p lang="vi">{{ current.description }}</p>
        </div>
        <div class="example__actions">
          <button type="button" aria-label="Reset live example" (click)="reset()">Reset</button>
          <button type="button" [attr.aria-label]="expanded() ? 'Collapse source' : 'Expand source'" (click)="toggleSource()">
            {{ expanded() ? 'Hide source' : 'View source' }}
          </button>
        </div>
      </header>

      <div class="example__preview" tabindex="0" aria-label="Live example preview" lang="vi">
        @if (current.activation === 'interaction') {
          @defer (on interaction) {
            <docs-example-preview [example]="current"></docs-example-preview>
          } @placeholder {
            <button class="example__load" type="button">Load resource-intensive live preview</button>
          }
        } @else {
          @defer (on viewport) {
            <docs-example-preview [example]="current"></docs-example-preview>
          } @placeholder {
            <p class="example__state">Live preview loads when this card enters the viewport.</p>
          }
        }
      </div>

      @if (expanded()) {
        <section class="example__source" aria-label="Example source code">
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
                <button type="button" aria-label="Copy source code" (click)="copySource()">{{ copied() ? 'Copied' : 'Copy' }}</button>
              </div>
              <pre tabindex="0" aria-label="Scrollable example source"><code>{{ currentSource() }}</code></pre>
            } @else {
              <p class="example__state example__state--error">Source is not available for this example.</p>
            }
          }
        </section>
      }
    </article>
  `,
  styleUrl: './example-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleViewerComponent {
  readonly #document = inject(DOCUMENT);
  readonly #sourceLoader = inject(SHOWCASE_EXAMPLE_SOURCE_LOADER);
  readonly example = input.required<DocExample>();
  readonly livePreview = viewChild(ExamplePreviewComponent);
  readonly expanded = signal(false);
  readonly sourceLoading = signal(false);
  readonly sourceError = signal<string | null>(null);
  readonly source = signal<ShowcaseExampleSource | null>(null);
  readonly selectedTab = signal<SourceTab>('html');
  readonly copied = signal(false);
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

  async toggleSource(): Promise<void> {
    const next = !this.expanded();
    this.expanded.set(next);
    if (next && !this.source()) await this.#loadSource();
  }

  reset(): void {
    this.livePreview()?.reset();
  }

  copySource(): void {
    const write = this.#document.defaultView?.navigator.clipboard?.writeText(this.currentSource());
    if (write) void write.catch(() => undefined);
    this.copied.set(true);
    this.#document.defaultView?.setTimeout(() => this.copied.set(false), 1600);
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
      if (!tabs.some((tab) => tab.id === this.selectedTab())) this.selectedTab.set(tabs[0]?.id ?? 'typescript');
    } catch {
      this.source.set(null);
      this.sourceError.set('The example source could not be loaded.');
    } finally {
      this.sourceLoading.set(false);
    }
  }
}
