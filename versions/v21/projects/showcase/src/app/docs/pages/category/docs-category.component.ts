import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { findDocNavigationGroup } from '../../core/documentation.registry';
import { PublishedDocsService } from '../../core/published-docs.service';
import { resolveDocsPageAvailability } from '../../shared/docs-page-availability';

@Component({
  selector: 'docs-category',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="category-page">
      @if (group(); as currentGroup) {
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <a [routerLink]="['/v', version()]">Docs</a><span>/</span> <a [routerLink]="['/v', version()]">v{{ version() }}</a
          ><span>/</span>
          <span>{{ currentGroup.title }}</span>
        </nav>

        <header class="category-header">
          <span>Documentation catalog</span>
          <h1>{{ currentGroup.title }}</h1>
          <p>{{ currentGroup.description }}</p>
          <div class="category-header__count">
            <strong>{{ currentGroup.pages.length }}</strong>
            <span>published references</span>
          </div>
        </header>

        <section class="page-grid" [attr.aria-label]="currentGroup.title + ' documentation pages'">
          @for (card of pageCards(); track card.page.id) {
            <a
              class="page-card"
              [class.page-card--unavailable]="card.availability === 'unavailable'"
              [routerLink]="card.availability === 'unavailable' ? null : card.commands"
              [attr.aria-disabled]="card.availability === 'unavailable' ? true : null"
              [attr.tabindex]="card.availability === 'unavailable' ? -1 : null">
              <div class="page-card__heading">
                <h2>{{ card.page.title }}</h2>
                @if (card.availability === 'unavailable') {
                  <span>Not in v{{ version() }}</span>
                } @else if (card.availability === 'live-demo') {
                  <span>Current live demo</span>
                } @else if (card.page.demoSectionCount > 0) {
                  <span>{{ card.page.demoSectionCount }} live {{ card.page.demoSectionCount === 1 ? 'example' : 'examples' }}</span>
                }
              </div>
              <p>{{ card.page.description }}</p>
              <code>{{ card.page.selector || card.page.importPath }}</code>
              <span class="page-card__action">
                {{
                  card.availability === 'unavailable'
                    ? 'Unavailable for this version'
                    : card.availability === 'live-demo'
                      ? 'Open live demo'
                      : 'Read reference'
                }}
                @if (card.availability !== 'unavailable') {
                  <span aria-hidden="true">→</span>
                }
              </span>
            </a>
          }
        </section>
      } @else {
        <section class="category-missing" role="status">
          <span>Unknown category</span>
          <h1>This documentation category does not exist</h1>
          <p>Choose a category from the documentation catalog or use global search to find a reference.</p>
          <a [routerLink]="['/v', version()]">Return to documentation home</a>
        </section>
      }
    </main>
  `,
  styleUrl: './docs-category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsCategoryComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #publishedDocs = inject(PublishedDocsService);
  #loadSequence = 0;
  readonly params = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  readonly version = computed(() => this.params().get('version') || 'latest');
  readonly group = computed(() => findDocNavigationGroup(this.params().get('category')) ?? null);
  readonly publishedDocIds = signal<ReadonlySet<string> | null>(null);
  readonly pageCards = computed(() =>
    (this.group()?.pages ?? []).map(page => {
      const availability = resolveDocsPageAvailability(page, this.publishedDocIds());
      return {
        page,
        availability,
        commands: ['/v', this.version(), page.category, page.slug, availability === 'live-demo' ? 'examples' : 'overview'],
      };
    })
  );

  constructor() {
    effect(() => {
      const version = this.version();
      const sequence = ++this.#loadSequence;
      this.publishedDocIds.set(null);
      void this.#publishedDocs
        .loadIndex(version)
        .then(index => {
          if (sequence === this.#loadSequence) {
            this.publishedDocIds.set(new Set(index.docs.map(document => document.id)));
          }
        })
        .catch(() => undefined);
    });
  }
}
