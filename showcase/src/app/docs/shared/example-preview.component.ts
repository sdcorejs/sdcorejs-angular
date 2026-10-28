import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  signal,
  Type,
  untracked,
} from '@angular/core';
import { SHOWCASE_DEMO_SECTION_ID } from '../../shared/demo-page.component';
import { DocsI18nService } from '../core/docs-i18n.service';
import { DocExample } from '../core/documentation.models';

@Component({
  selector: 'docs-example-preview',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (loading()) { <p class="example-preview__state" role="status">{{ i18n.t().loadingExample }}</p> }
    @if (error(); as detail) {
      <p class="example-preview__state example-preview__state--error" role="alert">{{ i18n.format('exampleLoadFailed', { detail }) }}</p>
    }
    @if (componentType(); as previewType) {
      <ng-container *ngComponentOutlet="previewType; injector: previewInjector()"></ng-container>
    }
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .example-preview__state { margin: 0; color: var(--docs-text-muted); }
    .example-preview__state--error { color: var(--docs-danger, #b3261e); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamplePreviewComponent {
  readonly #injector = inject(Injector);
  readonly #changeDetector = inject(ChangeDetectorRef);
  readonly i18n = inject(DocsI18nService);
  readonly example = input.required<DocExample>();
  readonly componentType = signal<Type<unknown> | null>(null);
  readonly loading = signal(true);
  /** Error detail of a failed load; the sentence around it follows the current language. */
  readonly error = signal<string | null>(null);
  // why: a language switch hands in a new example object with the same demo; only a new section or loader may rebuild it.
  readonly #sectionId = computed(() => this.example().sectionId);
  readonly #loader = computed(() => this.example().loadComponent);
  readonly previewInjector = computed(() => Injector.create({
    parent: this.#injector,
    providers: [{ provide: SHOWCASE_DEMO_SECTION_ID, useValue: this.#sectionId() }],
  }));

  constructor() {
    effect(() => {
      const loader = this.#loader();
      void this.#loadPreview(loader, untracked(() => this.#sectionId()));
    });
  }

  reset(): void {
    const type = this.componentType();
    this.componentType.set(null);
    this.#changeDetector.detectChanges();
    this.componentType.set(type);
    this.#changeDetector.detectChanges();
  }

  async #loadPreview(loadComponent: DocExample['loadComponent'], sectionId: string | null): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.componentType.set(await loadComponent());
    } catch (cause) {
      // why: swallowing the cause left "could not be loaded" as the only clue, which says nothing
      // about a failed chunk, a missing provider, or a broken import. Surface it in both places —
      // console for the stack, the alert itself for whoever is looking at the page.
      // eslint-disable-next-line no-console
      console.error('[example-preview] failed to load', sectionId, cause);
      this.error.set(cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause));
    } finally {
      this.loading.set(false);
    }
  }
}
