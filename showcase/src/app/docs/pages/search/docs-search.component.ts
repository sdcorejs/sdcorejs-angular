import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocsI18nService } from '../../core/docs-i18n.service';
import {
  DocsSearchGroupId,
  DocsSearchHit,
  groupSearchHits,
  highlightParts,
  rankSearchEntries,
  snippetAround,
} from '../../core/docs-search-index';
import { DocsSearchIndexService } from '../../core/docs-search-index.service';
import { DocsVersionService } from '../../core/docs-version.service';

interface HitView {
  readonly hit: DocsSearchHit;
  readonly index: number;
  readonly title: ReturnType<typeof highlightParts>;
  readonly snippet: ReturnType<typeof highlightParts> | null;
}

const POPULAR: readonly { readonly label: string; readonly commands: (version: string) => string[] }[] = [
  { label: 'Button', commands: version => ['/v', version, 'components', 'button', 'overview'] },
  { label: 'SdConfirmService', commands: version => ['/v', version, 'services', 'confirm', 'overview'] },
  { label: 'Table', commands: version => ['/v', version, 'components', 'table', 'overview'] },
  { label: 'Changelog', commands: version => ['/v', version, 'changelog'] },
];

/** Search results page: grouped hits with highlights, type chips and ↑/↓/Enter keyboard selection. */
@Component({
  selector: 'docs-search',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './docs-search.component.html',
  styleUrl: './docs-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsSearchComponent {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #index = inject(DocsSearchIndexService);
  readonly i18n = inject(DocsI18nService);
  readonly versions = inject(DocsVersionService);
  readonly params = toSignal(this.#route.paramMap, { initialValue: this.#route.snapshot.paramMap });
  readonly queryParams = toSignal(this.#route.queryParamMap, { initialValue: this.#route.snapshot.queryParamMap });

  readonly query = signal(this.#route.snapshot.queryParamMap.get('q') ?? '');
  readonly type = signal<DocsSearchGroupId | 'all'>('all');
  readonly selected = signal(0);
  readonly indexing = this.#index.indexing;
  readonly version = computed(() => this.params().get('version') ?? this.versions.resolvedPackageVersion());
  readonly hits = computed(() => rankSearchEntries(this.#index.entries(), this.query()));
  readonly allGroups = computed(() => groupSearchHits(this.hits()));
  readonly activeType = computed(() => {
    const type = this.type();
    return type !== 'all' && !this.allGroups().some(group => group.id === type) ? 'all' : type;
  });
  readonly groups = computed(() => {
    const type = this.activeType();
    const query = this.query();
    let index = 0;
    // why: "All" shows the top hits of each group; a type chip lists every hit of that group.
    const source = type === 'all' ? this.allGroups() : groupSearchHits(this.hits(), Number.POSITIVE_INFINITY).filter(group => group.id === type);
    return source
      .map(group => ({
        ...group,
        views: group.hits.map(
          (hit): HitView => ({
            hit,
            index: index++,
            title: highlightParts(hit.title, query),
            snippet: hit.snippet ? highlightParts(snippetAround(hit.snippet, query), query) : null,
          })
        ),
      }));
  });
  readonly flatHits = computed(() => this.groups().flatMap(group => group.views.map(view => view.hit)));
  readonly popular = computed(() => POPULAR.map(item => ({ label: item.label, commands: item.commands(this.version()) })));

  constructor() {
    effect(() => this.#index.ensure(this.version()));
    effect(() => {
      const q = this.queryParams().get('q') ?? '';
      if (q === untracked(this.query)) return;
      this.query.set(q);
      this.selected.set(0);
    });
  }

  groupLabel(id: DocsSearchGroupId): string {
    const t = this.i18n.t();
    return id === 'api' ? t.apiMembers : t.categories[id];
  }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.selected.set(0);
    void this.#router.navigate([], { queryParams: { q: this.query() || null }, replaceUrl: true });
  }

  clear(): void {
    this.query.set('');
    this.selected.set(0);
    void this.#router.navigate([], { queryParams: { q: null }, replaceUrl: true });
  }

  selectType(type: DocsSearchGroupId | 'all'): void {
    this.type.set(type);
    this.selected.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.flatHits().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selected.update(index => Math.min(index + 1, Math.max(count - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selected.update(index => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      const hit = this.flatHits()[this.selected()];
      if (!hit) return;
      event.preventDefault();
      this.open(hit);
    }
  }

  open(hit: DocsSearchHit): void {
    void this.#router.navigate([...hit.commands], { fragment: hit.fragment ?? undefined });
  }
}
