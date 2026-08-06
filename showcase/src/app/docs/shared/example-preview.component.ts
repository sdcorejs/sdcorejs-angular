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
} from '@angular/core';
import { SHOWCASE_DEMO_SECTION_ID } from '../../shared/demo-page.component';
import { DocExample } from '../core/documentation.models';

@Component({
  selector: 'docs-example-preview',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (loading()) { <p class="example-preview__state" role="status">Loading live example…</p> }
    @if (error(); as message) { <p class="example-preview__state example-preview__state--error" role="alert">{{ message }}</p> }
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
  readonly example = input.required<DocExample>();
  readonly componentType = signal<Type<unknown> | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly previewInjector = computed(() => Injector.create({
    parent: this.#injector,
    providers: [{ provide: SHOWCASE_DEMO_SECTION_ID, useValue: this.example().sectionId }],
  }));

  constructor() {
    effect(() => {
      void this.#loadPreview(this.example());
    });
  }

  reset(): void {
    const type = this.componentType();
    this.componentType.set(null);
    this.#changeDetector.detectChanges();
    this.componentType.set(type);
    this.#changeDetector.detectChanges();
  }

  async #loadPreview(example: DocExample): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.componentType.set(await example.loadComponent());
    } catch {
      this.error.set('The live example could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }
}
